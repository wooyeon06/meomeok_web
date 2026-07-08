// ─── 카카오 SDK 타입 ──────────────────────────────────────────────────────────
// index.html에 아래 스크립트 추가 필요:
// <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"></script>

declare const Kakao: {
  isInitialized(): boolean;
  init(appKey: string): void;
  Share: {
    sendDefault(params: KakaoShareParams): void;
  };
};

interface KakaoShareParams {
  objectType: 'feed';
  content: {
    title: string;
    description?: string;
    imageUrl?: string;
    link: KakaoLink;
  };
  buttons?: Array<{ title: string; link: KakaoLink }>;
}

interface KakaoLink {
  mobileWebUrl: string;
  androidExecutionParams?: string;
}

// ─── Android 브릿지 타입 ──────────────────────────────────────────────────────

interface AndroidBridge {
  goBack(): void;
  share(path: string, title: string): void;
  shareData(jsonData: string, title: string): void;
  notifyReady(): void;
  // 재생 오디오 캡처 → Worker Whisper 전사 (영상 설명이 없는 영상용)
  transcribeAudio?(workerUrl: string, durationMs: number, callbackId: string): void;
  // 진행 중인 오디오 캡처 중단 (통화 등으로 재생 실패 시)
  cancelTranscribe?(callbackId: string): void;
}

export interface DeepLinkPayload<T = unknown> {
  path: string | null;
  data: T | null;
  shareText: string | null;
}

export interface NativeResult {
  ok: boolean;
  text?: string;
  error?: string;
}

// YouTube IFrame Player API (음성 분석 시 재생 제어용, 최소 타입)
export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getDuration(): number;
  // -1 시작안됨, 0 종료, 1 재생중, 2 일시정지, 3 버퍼링, 5 대기
  getPlayerState(): number;
  unMute(): void;
  setVolume(volume: number): void;
  destroy(): void;
}

declare global {
  interface Window {
    Android?: AndroidBridge;
    __androidDeepLink?: DeepLinkPayload;
    // 네이티브 transcribeAudio 결과를 되돌려받는 콜백
    __nativeResult?: (id: string, result: NativeResult) => void;
    // 네이티브가 녹음을 시작하면 호출 → 해당 영상 재생 시작 (ingredientAnalyzer가 등록)
    __startCapturePlayback?: (id: string) => void;
    // YouTube IFrame API
    YT?: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// ─── 상수 (카카오 개발자 콘솔에서 발급받은 키로 교체) ──────────────────────────
// https://developers.kakao.com → 내 애플리케이션 → 앱 키

const SCHEME = 'meomeok';
const PACKAGE = 'com.meomeok';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PACKAGE}`;

export const KAKAO_JS_APP_KEY = '0eb624cf5797c0ba64e333a7914544b3';   // JavaScript 키
// AndroidManifest.xml scheme → kakao741cbcb2073a8305b0cf2513ea4da524 (네이티브 앱 키)

// ─── 카카오 SDK 초기화 ────────────────────────────────────────────────────────

export function initKakao(jsAppKey: string = KAKAO_JS_APP_KEY): void {
  if (typeof Kakao === 'undefined') {
    console.error('[shareLink] Kakao SDK 미로드. index.html에 SDK 스크립트를 추가하세요.');
    return;
  }
  if (!Kakao.isInitialized()) {
    Kakao.init(jsAppKey);
  }
}

// ─── 카카오 링크로 공유 (권장) ────────────────────────────────────────────────

export interface KakaoShareOptions {
  title: string;
  description?: string;
  imageUrl?: string;
  buttonTitle?: string;
  /** 앱 미설치 시 이동할 URL. 미입력 시 플레이스토어 */
  fallbackUrl?: string;
}

/**
 * 카카오 링크 메시지로 데이터 공유
 * 수신자가 "머먹앱에서 보기" 버튼 탭 → 앱 직접 실행 + 데이터 전달
 *
 * 사전 준비:
 * 1. https://developers.kakao.com 에서 앱 등록
 * 2. 플랫폼 → Android → 패키지명 com.meomeok, 키 해시 등록
 * 3. KAKAO_JS_APP_KEY, AndroidManifest.xml scheme 값 교체
 *
 * @example
 * shareViaKakao({ id: 123, name: '김치찌개 맛집' }, { title: '맛집 공유' })
 */
export function shareViaKakao<T extends object>(
  data: T,
  options: KakaoShareOptions,
): void {
  console.log('[shareLink] Kakao 정의됨:', typeof Kakao !== 'undefined');
  console.log('[shareLink] Kakao 초기화됨:', typeof Kakao !== 'undefined' && Kakao.isInitialized());

  if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
    console.warn('[shareLink] Kakao SDK 미초기화 → Android 브릿지로 대체');
    shareData(data, options.title);
    return;
  }

  const encoded = encodeBase64UrlSafe(JSON.stringify(data));
  const androidExecutionParams = `data=${encodeURIComponent(encoded)}`;
  const fallbackUrl = options.fallbackUrl ?? PLAY_STORE_URL;

  const shareParams = {
    objectType: 'feed' as const,
    content: {
      title: options.title,
      description: options.description,
      imageUrl: options.imageUrl,
      link: { mobileWebUrl: fallbackUrl, androidExecutionParams },
    },
    buttons: [
      {
        title: options.buttonTitle ?? '머먹앱에서 보기',
        link: { mobileWebUrl: fallbackUrl, androidExecutionParams },
      },
    ],
  };

  console.log('[shareLink] Kakao.Share.sendDefault 파라미터:', JSON.stringify(shareParams, null, 2));

  Kakao.Share.sendDefault(shareParams);
}

// ─── 링크 생성 유틸 ───────────────────────────────────────────────────────────

export function buildDeepLink(query: string): string {
  return `intent://open?${query}#Intent;scheme=${SCHEME};package=${PACKAGE};end;`;
}

export function buildPathLink(path: string): string {
  return buildDeepLink(`path=${encodeURIComponent(path)}`);
}

export function buildDataLink<T extends object>(data: T): string {
  return buildDeepLink(`data=${encodeURIComponent(encodeBase64UrlSafe(JSON.stringify(data)))}`);
}

// ─── Android 브릿지 공유 (카카오 SDK 없을 때 폴백) ────────────────────────────

export function sharePath(path: string, title: string): void {
  window.Android?.share(path, title);
}

export function shareData<T extends object>(data: T, title: string): void {
  window.Android?.shareData(JSON.stringify(data), title);
}

// ─── 딥링크 수신 ─────────────────────────────────────────────────────────────

export type DeepLinkHandler<T = unknown> = (payload: DeepLinkPayload<T>) => void;

/**
 * warm start: 앱 실행 중 딥링크 수신
 * @returns cleanup 함수 (useEffect return에 사용)
 *
 * 사용 패턴:
 *   useEffect(() => {
 *     const cleanup = onDeepLink((payload) => { ... });
 *     notifyReady(); // 반드시 리스너 등록 직후 호출
 *     return cleanup;
 *   }, []);
 */
export function onDeepLink<T = unknown>(handler: DeepLinkHandler<T>): () => void {
  const listener = (e: Event) => {
    // 처리 후 __androidDeepLink 초기화 → notifyReady 중복 dispatch 방지
    window.__androidDeepLink = undefined;
    handler((e as CustomEvent<DeepLinkPayload<T>>).detail);
  };
  window.addEventListener('androidDeepLink', listener);
  return () => window.removeEventListener('androidDeepLink', listener);
}

/**
 * 리스너 등록 직후 호출 — cold start에서 onPageFinished가 useEffect보다 먼저
 * 실행되어 이벤트를 놓친 경우 Android에게 재dispatch 요청
 */
export function notifyReady(): void {
  window.Android?.notifyReady();
}

/**
 * cold start: 앱이 새로 열릴 때 이미 도착한 딥링크 확인
 * 한 번 읽은 후 자동 초기화 (중복 처리 방지)
 */
export function getInitialDeepLink<T = unknown>(): DeepLinkPayload<T> | null {
  const payload = window.__androidDeepLink as DeepLinkPayload<T> | undefined;
  if (!payload) return null;
  window.__androidDeepLink = undefined;
  return payload;
}

// ─── 내부 유틸 ────────────────────────────────────────────────────────────────

function encodeBase64UrlSafe(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
