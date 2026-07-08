const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // ── 오디오 전사 (네이티브가 캡처한 WAV → Workers AI Whisper) ──────────────
    if (url.pathname === '/transcribe') {
      return handleTranscribe(request, env);
    }

    if (url.pathname !== '/video-info') {
      return json({ error: 'Not Found' }, 404);
    }

    const videoId = url.searchParams.get('videoId');
    if (!videoId) {
      return json({ error: 'videoId 파라미터가 없습니다.' }, 400);
    }

    console.info(`[req] videoId=${videoId}`);

    try {
      const { title, description } = await fetchVideoInfo(videoId, env.YOUTUBE_API_KEY);

      console.info(`[req] description length=${description.length}`);

      // 설명이 충분하면 반환, 없으면 음성 분석을 사용하도록 안내
      if (description.length >= 10) {
        return json({ title, description, source: 'description' });
      }

      return json({ error: '이 영상에는 설명이 없습니다. 음성 분석을 사용해주세요.' }, 404);
    } catch (err) {
      return json({ error: err.message ?? '알 수 없는 오류' }, 500);
    }
  },
};

// ─── 오디오 전사 (Workers AI Whisper) ─────────────────────────────────────────

async function handleTranscribe(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'POST만 허용됩니다.' }, 405);
  }
  if (!env.AI) {
    return json({ error: 'Workers AI(AI 바인딩)가 설정되지 않았습니다.' }, 500);
  }

  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length === 0) {
      return json({ error: '오디오 데이터가 비어 있습니다.' }, 400);
    }

    // whisper-large-v3-turbo: 한국어 정확도 최상. base64 오디오 입력.
    const resp = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: toBase64(bytes),
      language: 'ko',
      task: 'transcribe',
    });
    const rawText = (resp?.text ?? '').trim();
    console.info(`[transcribe] bytes=${bytes.length} rawLen=${rawText.length}`);

    if (!rawText) {
      return json({ error: '전사 결과가 비어 있습니다.' }, 422);
    }

    // Whisper 대본 → Llama로 재료만 정리
    const ingredients = await extractIngredients(rawText, env);
    console.info(`[transcribe] ingredientsLen=${ingredients.length}`);

    // 정리 실패 시 원본 대본이라도 돌려준다
    return json({ text: ingredients || rawText });
  } catch (err) {
    console.info(`[transcribe] error=${err.message}`);
    return json({ error: err.message ?? '전사 오류' }, 500);
  }
}

// ─── 대본에서 재료만 추출 (Workers AI Llama) ────────────────────────────────────

async function extractIngredients(transcript, env) {
  const SYSTEM_PROMPT =
    '너는 요리 영상 대본에서 재료만 뽑아 정리하는 도우미야. ' +
    '대본에 나온 음식 재료와 분량만 추려서 한국어 목록으로 정리해. ' +
    '규칙: (1) 인사·잡담·조리 과정·설명은 모두 빼고 재료만 남긴다. ' +
    '(2) 분량이 언급되면 재료 뒤에 함께 적는다 (예: "- 대파 1대"). ' +
    '(3) 각 재료를 한 줄씩 "- 재료명 분량" 형식으로만 출력한다. ' +
    '(4) 목록 외의 다른 문장·머리말·설명은 절대 쓰지 않는다. ' +
    '(5) 재료를 하나도 찾지 못하면 빈 문자열만 출력한다.';

  try {
    const resp = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `다음은 요리 영상 대본이야. 재료만 정리해줘:\n\n${transcript}` },
      ],
      max_tokens: 512,
      temperature: 0.2,
    });
    return (resp?.response ?? '').trim();
  } catch (e) {
    console.info(`[ingredients] error=${e.message}`);
    return '';
  }
}

// Uint8Array → base64 (큰 배열도 안전하게 청크 단위로)
function toBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

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

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}
