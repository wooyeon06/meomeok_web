export async function analyzeIngredients(videoId: string): Promise<string> {
  const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined;

  if (!workerUrl) throw new Error('VITE_WORKER_URL이 설정되지 않았습니다.');

  // Cloudflare Worker에서 YouTube 영상 설명(없으면 자막) 가져오기
  const infoRes = await fetch(`${workerUrl}/video-info?videoId=${encodeURIComponent(videoId)}`);
  const infoData = await infoRes.json() as {
    title?: string;
    description?: string;
    source?: 'description' | 'caption';
    error?: string;
  };

  if (!infoRes.ok) {
    throw new Error(infoData.error ?? `영상 정보 가져오기 실패 (${infoRes.status})`);
  }

  return (infoData.description ?? '').trim() || '설명란에 정보가 없습니다.';
}
