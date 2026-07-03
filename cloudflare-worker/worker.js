const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname !== '/video-info') {
      return json({ error: 'Not Found' }, 404);
    }

    const videoId = url.searchParams.get('videoId');
    if (!videoId) {
      return json({ error: 'videoId 파라미터가 없습니다.' }, 400);
    }

    try {
      const { title, description } = await fetchVideoInfo(videoId, env.YOUTUBE_API_KEY);

      // 설명이 충분하면 그대로 사용, 없으면 자막으로 대체
      if (description.length >= 10) {
        return json({ title, description, source: 'description' });
      }

      const transcript = await fetchCaptions(videoId);
      if (transcript) {
        return json({ title, description: transcript, source: 'caption' });
      }

      return json({ error: '이 영상에는 설명과 자막이 모두 없습니다. 직접 입력해주세요.' }, 404);
    } catch (err) {
      return json({ error: err.message ?? '알 수 없는 오류' }, 500);
    }
  },
};

// ─── YouTube 영상 정보(설명란) 가져오기 ─────────────────────────────────────────

async function fetchVideoInfo(videoId, apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`;

  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error(`네트워크 오류: ${e.message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = JSON.parse(body || '{}');
    throw new Error(err.error?.message ?? `YouTube API 오류 (${res.status})`);
  }

  const data = await res.json();
  const item = data.items?.[0];

  if (!item) throw new Error('영상을 찾을 수 없습니다. (비공개 또는 삭제된 영상)');

  const description = item.snippet.description?.trim() ?? '';
  return { title: item.snippet.title, description };
}

// ─── 자막(자동 생성 포함) 가져오기 ──────────────────────────────────────────────

async function fetchCaptions(videoId) {
  let html;
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=ko`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) return '';
    html = await res.text();
  } catch {
    return '';
  }

  const arrStr = extractJsonArray(html, 'captionTracks');
  if (!arrStr) return '';

  let tracks;
  try {
    tracks = JSON.parse(arrStr);
  } catch {
    return '';
  }
  if (!Array.isArray(tracks) || tracks.length === 0) return '';

  // 한국어 → 영어 → 첫 번째 트랙 순으로 선택
  const track =
    tracks.find((t) => t.languageCode === 'ko') ??
    tracks.find((t) => t.languageCode?.startsWith('en')) ??
    tracks[0];

  if (!track?.baseUrl) return '';

  try {
    const capRes = await fetch(`${track.baseUrl}&fmt=json3`);
    if (!capRes.ok) return '';
    const capData = await capRes.json();
    return (capData.events ?? [])
      .flatMap((e) => e.segs ?? [])
      .map((s) => s.utf8 ?? '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

// watch 페이지 HTML에서 "key":[...] 형태의 JSON 배열을 괄호 균형을 맞춰 추출
function extractJsonArray(html, key) {
  const keyIdx = html.indexOf(`"${key}":`);
  if (keyIdx === -1) return null;
  const start = html.indexOf('[', keyIdx);
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  return null;
}

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}
