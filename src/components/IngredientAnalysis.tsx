import type { RefObject } from "react";

// 음성 분석 진행 중 전체 화면 로딩 오버레이
export function AnalysisLoadingOverlay() {
    return (
        <div className="analysis-loading-overlay">
            <div className="analysis-loading-spinner" />
            <div className="analysis-loading-title">영상 분석 중…</div>
            <div className="analysis-loading-desc">
                영상이 끝까지 재생된 뒤 음성을 정리합니다.<br />
                창을 닫지 말고 잠시만 기다려주세요.
            </div>
        </div>
    );
}

interface IngredientAnalysisControlsProps {
    videoId: string;
    isAnalyzing: boolean;
    isTranscribing: boolean;
    analysisError: string;
    showAudioOption: boolean;
    canAudioTranscribe: boolean;
    playerHostRef: RefObject<HTMLDivElement | null>;
    onAnalyze: () => void;
    onTranscribe: () => void;
}

// "영상 설명 불러오기" 버튼 + (설명 없을 때) 음성 분석 옵션 + 에러 메시지
export function IngredientAnalysisControls({
    videoId,
    isAnalyzing,
    isTranscribing,
    analysisError,
    showAudioOption,
    canAudioTranscribe,
    playerHostRef,
    onAnalyze,
    onTranscribe,
}: IngredientAnalysisControlsProps) {
    return (
        <>
            <button
                type="button"
                className="analyze-btn"
                onClick={onAnalyze}
                disabled={!videoId || isAnalyzing || isTranscribing}
            >
                {isAnalyzing ? "영상 설명 불러오는 중..." : "영상 설명 불러오기"}
            </button>

            {canAudioTranscribe && videoId && showAudioOption && (
                <>
                    <p className="audio-option-hint">
                        영상 설명이 없어요. 음성으로 분석해보세요.
                    </p>
                    <div className="transcribe-player" ref={playerHostRef} />
                    <button
                        type="button"
                        className="analyze-btn transcribe-btn"
                        onClick={onTranscribe}
                        disabled={isAnalyzing || isTranscribing}
                    >
                        {isTranscribing
                            ? "🎙️ 음성 분석 중… (영상이 끝까지 재생됩니다)"
                            : "🎙️ 음성으로 분석하기"}
                    </button>
                </>
            )}

            {analysisError && <p className="analysis-error">{analysisError}</p>}
        </>
    );
}
