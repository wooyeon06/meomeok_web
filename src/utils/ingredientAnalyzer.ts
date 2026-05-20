export async function analyzeIngredients(videoId: string): Promise<string> {
  const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined;
  const claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY as string | undefined;

  if (!workerUrl) throw new Error('VITE_WORKER_URL이 설정되지 않았습니다.');
  if (!claudeApiKey) throw new Error('VITE_CLAUDE_API_KEY가 설정되지 않았습니다.');

  // 1단계: Cloudflare Worker에서 YouTube 영상 설명 가져오기
  const infoRes = await fetch(`${workerUrl}/video-info?videoId=${encodeURIComponent(videoId)}`);
  const infoData = await infoRes.json() as { title?: string; description?: string; error?: string };

  if (!infoRes.ok) {
    throw new Error(infoData.error ?? `영상 정보 가져오기 실패 (${infoRes.status})`);
  }

  const { title, description } = infoData;

  // 2단계: Claude API로 재료 추출 (클라이언트에서 직접 호출)
  // 로컬 개발: Vite 프록시(/anthropic) 사용, 빌드 후 Android WebView: 직접 호출
  const claudeBaseUrl = import.meta.env.DEV ? '/anthropic' : 'https://api.anthropic.com';
  const claudeRes = await fetch(`${claudeBaseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `다음은 요리 유튜브 영상의 제목과 설명입니다.
설명에서 재료와 분량을 추출해 목록으로 정리해주세요.

규칙:
- 설명에 명시된 재료만 포함 (추측 금지)
- 분량이 있으면 함께 표기 (예: 닭고기 300g)
- 형식: "- 재료명: 분량" 또는 분량 없으면 "- 재료명"
- 재료 목록만 출력, 설명·조리법 제외
- 재료 정보가 없으면 "설명란에 재료 정보가 없습니다." 라고만 출력

제목: ${title}

설명:
${(description ?? '').slice(0, 4000)}`,
        },
      ],
    }),
  });

  const claudeData = await claudeRes.json() as {
    content?: { text: string }[];
    error?: { message: string };
  };

  if (!claudeRes.ok) {
    throw new Error(claudeData.error?.message ?? `Claude API 오류 (${claudeRes.status})`);
  }

  return claudeData.content?.[0]?.text ?? '';
}
