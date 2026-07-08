import type { NativeResult } from './shareLink';

// ─── 네이티브(Android) 결과 콜백 브리지 ─────────────────────────────────────────
// 네이티브(Kotlin)가 오디오 전사 결과를 콜백 id로 돌려줄 때 사용한다.

const nativeCallbacks = new Map<string, (result: NativeResult) => void>();

// 네이티브가 결과를 돌려줄 때 호출하는 전역 콜백 (한 번만 등록)
if (typeof window !== 'undefined' && !window.__nativeResult) {
  window.__nativeResult = (id, result) => {
    const cb = nativeCallbacks.get(id);
    if (cb) {
      nativeCallbacks.delete(id);
      cb(result);
    }
  };
}

// ─── 재료 분석: 영상 설명란 ─────────────────────────────────────────────────────
// 설명이 있으면 그대로 반환, 없으면 음성 분석(transcribeViaAudio)으로 유도한다.

export async function analyzeIngredients(videoId: string): Promise<string> {
  const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined;
  if (!workerUrl) {
    throw new Error('VITE_WORKER_URL이 설정되지 않았습니다.');
  }

  // 영상 설명란 (YouTube Data API — Cloudflare에서도 IP 차단 안 됨)
  try {
    const res = await fetch(`${workerUrl}/video-info?videoId=${encodeURIComponent(videoId)}`);
    const data = (await res.json()) as { description?: string; error?: string };
    if (res.ok) {
      const desc = (data.description ?? '').trim();
      if (desc) return desc;
    }
  } catch {
    // 네트워크 오류 등은 아래 공통 메시지로 처리
  }

  throw new Error('영상 설명을 가져오지 못했습니다. 음성 분석을 시도해보세요.');
}

// ─── 음성 분석: 재생 오디오 캡처 → Whisper 전사 ─────────────────────────────────
// 영상 설명이 없는 영상용. 네이티브가 녹음을 시작하면 startPlayback()으로
// 영상을 재생하고, 캡처가 끝나면 Worker Whisper 전사 텍스트를 돌려준다.

export function audioTranscribeAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.Android?.transcribeAudio === 'function';
}

export function transcribeViaAudio(
  durationMs: number,
  startPlayback: () => void,
  signal?: AbortSignal,
): Promise<string> {
  const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined;
  if (!audioTranscribeAvailable()) {
    return Promise.reject(new Error('이 기기에서는 음성 분석을 지원하지 않습니다. (Android 10+ 앱 필요)'));
  }
  if (!workerUrl) {
    return Promise.reject(new Error('VITE_WORKER_URL이 설정되지 않았습니다.'));
  }
  if (signal?.aborted) {
    return Promise.reject(abortError(signal));
  }

  return new Promise((resolve, reject) => {
    const id = `tr_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // 녹음시간 + 업로드/전사 여유
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('전사 시간 초과'));
    }, durationMs + 90000);

    const cleanup = () => {
      clearTimeout(timer);
      nativeCallbacks.delete(id);
      signal?.removeEventListener('abort', onAbort);
      if (window.__startCapturePlayback && (window.__startCapturePlayback as unknown as { __id?: string }).__id === id) {
        window.__startCapturePlayback = undefined;
      }
    };

    // 외부에서 중단 요청(예: 통화로 재생 실패) → 네이티브 녹음도 취소하고 즉시 reject
    const onAbort = () => {
      cleanup();
      try { window.Android?.cancelTranscribe?.(id); } catch { /* noop */ }
      reject(abortError(signal));
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    // 네이티브가 녹음을 시작하면 재생 시작
    const playbackFn = (cbId: string) => {
      if (cbId === id) startPlayback();
    };
    (playbackFn as unknown as { __id: string }).__id = id;
    window.__startCapturePlayback = playbackFn;

    nativeCallbacks.set(id, (result) => {
      cleanup();
      if (result.ok && result.text?.trim()) resolve(result.text.trim());
      else reject(new Error(result.error ?? '전사 결과가 비었습니다.'));
    });

    window.Android!.transcribeAudio!(workerUrl, durationMs, id);
  });
}

function abortError(signal?: AbortSignal): Error {
  const reason = signal?.reason;
  if (reason instanceof Error) return reason;
  if (typeof reason === 'string' && reason) return new Error(reason);
  return new Error('음성 분석이 중단되었습니다.');
}
