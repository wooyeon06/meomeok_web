# meomeok-worker (Cloudflare Worker)

YouTube 영상의 **설명(description)** 을 가져오고, 설명이 없는 영상은 앱에서 **오디오를 캡처해 Whisper로 전사한 뒤 Llama로 재료만 정리**해 반환하는 Worker입니다.

- 설명 조회: `GET /video-info?videoId=<영상ID>` → `{ title, description, source: "description" }`
- 음성 전사: `POST /transcribe` (WAV 바이트 업로드) → `{ text }` (Whisper 전사 → Llama 재료 정리)

---

## 사전 준비

- [Node.js](https://nodejs.org/) 설치 (npx 사용)
- Cloudflare 계정
- YouTube Data API v3 키 ([Google Cloud Console](https://console.cloud.google.com/)에서 발급)

> Wrangler는 별도 설치 없이 `npx wrangler ...` 로 실행합니다.

---

## 배포 방법

아래 명령은 모두 `cloudflare-worker` 폴더 안에서 실행합니다.

### 1. 로그인

```bash
npx wrangler login
```

브라우저가 열리면 Cloudflare 계정으로 인증합니다.

### 2. 비밀값(Secret) 등록

Worker는 `YOUTUBE_API_KEY` 하나만 필요합니다.

```bash
npx wrangler secret put YOUTUBE_API_KEY
```

프롬프트가 뜨면 발급받은 YouTube Data API 키를 붙여넣습니다.

> ⚠️ 예전에 쓰던 `CLAUDE_API_KEY` 는 더 이상 필요 없습니다. 이미 등록했다면 삭제해도 됩니다:
> ```bash
> npx wrangler secret delete CLAUDE_API_KEY
> ```

### 3. 배포

```bash
npx wrangler deploy
```

배포가 끝나면 출력되는 URL(예: `https://meomeok-worker.<계정>.workers.dev`)이 Worker 주소입니다.
이 URL을 클라이언트 `.env` 의 `VITE_WORKER_URL` 에 설정합니다.

---

## 로컬 테스트

```bash
npx wrangler dev
```

로컬 서버가 뜨면 다음처럼 확인합니다.

```bash
curl "http://localhost:8787/video-info?videoId=<영상ID>"
```

배포된 Worker 확인:

```bash
curl "https://meomeok-worker.<계정>.workers.dev/video-info?videoId=<영상ID>"
```

---

## 로그 확인

`wrangler.toml` 에서 observability 로그가 켜져 있습니다. 실시간 로그:

```bash
npx wrangler tail
```

---

## 참고 / 주의사항

- 설명이 10자 이상이면 설명을 그대로 반환합니다.
- 설명이 없거나 너무 짧으면 `404` 를 반환하며, 앱은 음성 분석(`/transcribe`)으로 유도합니다.
- `/transcribe` 는 Workers AI(`env.AI`) 바인딩이 필요합니다. Whisper(`@cf/openai/whisper-large-v3-turbo`)로 전사한 뒤 Llama(`@cf/meta/llama-3.1-8b-instruct-fast`)로 재료만 정리합니다.
- YouTube 자막 스크래핑은 데이터센터 IP 차단 때문에 사용하지 않습니다.
