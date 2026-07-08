import { useState, useEffect, useRef } from "react";
import type { YTPlayer } from "../utils/shareLink";
import {
    analyzeIngredients,
    transcribeViaAudio,
    audioTranscribeAvailable,
} from "../utils/ingredientAnalyzer";

// YouTube IFrame API 로드 (한 번만)
function ensureYouTubeApi(): Promise<void> {
    return new Promise((resolve) => {
        if (window.YT?.Player) return resolve();
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prev?.();
            resolve();
        };
        if (!document.getElementById("yt-iframe-api")) {
            const s = document.createElement("script");
            s.id = "yt-iframe-api";
            s.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(s);
        }
    });
}

/**
 * 영상 설명 불러오기 + 음성(오디오) 분석 로직을 캡슐화한 훅.
 * AddLinkModal / EditLinkModal이 공유한다.
 *
 * @param videoId  현재 URL에서 추출한 영상 ID (없으면 "")
 * @param initialIngredients  재료 textarea 초기값 (수정 화면의 기존 메모)
 * @param enabled  모달이 열려 있을 때만 플레이어를 준비 (기본 true)
 */
export function useIngredientAnalysis(
    videoId: string,
    initialIngredients = "",
    enabled = true,
) {
    const [ingredients, setIngredients] = useState(initialIngredients);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [analysisError, setAnalysisError] = useState("");
    const [showAudioOption, setShowAudioOption] = useState(false);

    const canAudioTranscribe = audioTranscribeAvailable();
    const playerHostRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YTPlayer | null>(null);

    // 음성 분석용 YouTube 플레이어 준비 (안드로이드 앱 + 음성 분석 옵션 노출 시)
    useEffect(() => {
        if (!enabled || !videoId || !canAudioTranscribe || !showAudioOption) return;
        let cancelled = false;
        ensureYouTubeApi().then(() => {
            if (cancelled || !playerHostRef.current || !window.YT) return;
            try { playerRef.current?.destroy(); } catch { /* noop */ }
            playerRef.current = new window.YT.Player(playerHostRef.current, {
                videoId,
                playerVars: { playsinline: 1, controls: 1, rel: 0 },
            });
        });
        return () => {
            cancelled = true;
            try { playerRef.current?.destroy(); } catch { /* noop */ }
            playerRef.current = null;
        };
    }, [enabled, videoId, canAudioTranscribe, showAudioOption]);

    // 영상 설명 불러오기 → 없으면 음성 분석 옵션 노출
    const handleAnalyze = async () => {
        if (!videoId) return;
        setIsAnalyzing(true);
        setAnalysisError("");
        try {
            const result = await analyzeIngredients(videoId);
            if (result.trim()) {
                setIngredients(result);
            } else {
                setShowAudioOption(true);
            }
        } catch (e) {
            setAnalysisError(e instanceof Error ? e.message : "분석에 실패했습니다.");
            setShowAudioOption(true);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 재생 오디오 캡처 → Whisper 전사 → 재료 정리
    const handleTranscribe = async () => {
        if (!videoId) return;
        setIsTranscribing(true);
        setAnalysisError("");
        const controller = new AbortController();
        try {
            const player = playerRef.current;
            const dur = player?.getDuration ? player.getDuration() : 0;
            // 길이를 모르면 60초, 알면 그 길이 + 여유(최대 3분)
            const durationMs = Math.min(dur > 0 ? Math.ceil(dur) : 60, 180) * 1000 + 1500;
            const text = await transcribeViaAudio(durationMs, () => {
                try {
                    player?.seekTo(0, true);
                    player?.unMute();
                    player?.setVolume(100);
                    player?.playVideo();
                } catch { /* noop */ }
                // 통화 중 등으로 재생이 시작되지 않으면 중단하고 에러 표시
                window.setTimeout(() => {
                    const state = player?.getPlayerState?.();
                    // 1 재생중, 3 버퍼링 이외면 재생 실패로 간주
                    if (state !== 1 && state !== 3) {
                        controller.abort(
                            new Error("영상이 재생되지 않았습니다. 통화 중이거나 다른 앱이 소리를 사용 중일 수 있어요. 통화 종료 후 다시 시도해주세요."),
                        );
                    }
                }, 3500);
            }, controller.signal);
            setIngredients(text);
        } catch (e) {
            setAnalysisError(e instanceof Error ? e.message : "음성 분석에 실패했습니다.");
        } finally {
            setIsTranscribing(false);
        }
    };

    const resetAnalysis = () => {
        setIngredients("");
        setAnalysisError("");
        setIsAnalyzing(false);
        setShowAudioOption(false);
    };

    return {
        ingredients,
        setIngredients,
        isAnalyzing,
        isTranscribing,
        analysisError,
        showAudioOption,
        canAudioTranscribe,
        playerHostRef,
        handleAnalyze,
        handleTranscribe,
        resetAnalysis,
    };
}
