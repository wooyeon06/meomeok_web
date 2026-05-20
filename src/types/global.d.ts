export interface Window {
    Android?: {
        goBack(): void;
        share(path: string, title: string): void;
        shareData(jsonData: string, title: string): void;
        notifyReady(): void;
    };
    __androidDeepLink?: DeepLinkPayload;
}

export interface AndroidBridge {
  goBack(): void;
  share(path: string, title: string): void;
  shareData(jsonData: string, title: string): void;
  notifyReady(): void;
}

export interface DeepLinkPayload<T = unknown> {
  path: string | null;
  data: T | null;
  shareText: string | null;
}