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
      return json({ title, description });
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
  if (description.length < 10) {
    throw new Error('이 영상에는 설명이 없습니다. 직접 재료를 입력해주세요.');
  }

  return { title: item.snippet.title, description };
}

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}
