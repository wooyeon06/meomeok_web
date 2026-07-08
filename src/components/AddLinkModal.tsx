import { useState, useEffect } from "react";
import { CategorySelect } from "./CategorySelect";
import "./AddLinkModal.css";
import { useForm } from "react-hook-form";
import type { YouTubeLink } from "../types";
import { generateId, getVideoId } from "../utils/utils";
import { addLink } from "../utils/storage";
import { useAppStore } from "../stores/appStore";
import { useIngredientAnalysis } from "../hooks/useIngredientAnalysis";
import {
    AnalysisLoadingOverlay,
    IngredientAnalysisControls,
} from "./IngredientAnalysis";

interface AddLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
}

export function AddLinkModal({
    isOpen,
    onClose,
    categories,
}: AddLinkModalProps) {
    const { setShowModal, incrementRefreshKey } = useAppStore();
    const [selectedCategory, setSelectedCategory] = useState("");
    const [urlValue, setUrlValue] = useState("");
    const { register, handleSubmit, reset, setValue } = useForm<YouTubeLink>();

    const videoId = getVideoId(urlValue) ?? "";
    const {
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
    } = useIngredientAnalysis(videoId, "", isOpen);

    useEffect(() => {
        if (!isOpen) return;
        navigator.clipboard.readText()
            .then(text => {
                const trimmed = text.trim();
                if (getVideoId(trimmed)) {
                    setValue('url', trimmed);
                    setUrlValue(trimmed);
                }
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        resetAnalysis();
        setUrlValue("");
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const urlRegister = register("url", { required: true });

    const onSubmit = (data: YouTubeLink) => {
        if (data.title.trim() && data.url.trim()) {
            const vid = getVideoId(data.url);
            const thumbnail = vid
                ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg`
                : "";

            const newLink: YouTubeLink = {
                id: generateId(),
                title: data.title,
                url: data.url,
                thumbnail,
                createdAt: new Date().toISOString(),
                /*
                ISO 8601 형식의 문자열
                2026-05-07 T 10:23:45.123 Z
                ────────── ─ ──────────── ─
                년-월-일   │ 시:분:초.밀리초 │
                          │               └─ UTC (Zulu time)
                          └─ 날짜/시간 구분자
                */
                category: selectedCategory,
                memo: ingredients.trim() || undefined,
            };

            addLink(newLink);
            setShowModal(false);
            incrementRefreshKey();
            reset();
            resetAnalysis();
            setUrlValue("");
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            {isTranscribing && <AnalysisLoadingOverlay />}
            <div className="modal-content">
                <h2>유튜브 링크 추가</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label>제목</label>
                        <input
                            type="text"
                            {...register("title", { required: true })}
                            placeholder="링크 제목을 입력하세요"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>유튜브 URL</label>
                        <input
                            type="url"
                            {...urlRegister}
                            onChange={(e) => {
                                urlRegister.onChange(e);
                                setUrlValue(e.target.value);
                            }}
                            placeholder="https://www.youtube.com/watch?v=..."
                            required
                        />
                    </div>

                    <IngredientAnalysisControls
                        videoId={videoId}
                        isAnalyzing={isAnalyzing}
                        isTranscribing={isTranscribing}
                        analysisError={analysisError}
                        showAudioOption={showAudioOption}
                        canAudioTranscribe={canAudioTranscribe}
                        playerHostRef={playerHostRef}
                        onAnalyze={handleAnalyze}
                        onTranscribe={handleTranscribe}
                    />

                    {ingredients && (
                        <div className="form-group ingredients-group">
                            <label>
                                분석된 재료
                                <span className="label-hint"> (수정 가능, 메모로 저장됩니다)</span>
                            </label>
                            <textarea
                                className="ingredients-textarea"
                                value={ingredients}
                                onChange={(e) => setIngredients(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>카테고리</label>
                        <CategorySelect
                            value={selectedCategory}
                            categories={categories}
                            onChange={setSelectedCategory}
                        />
                    </div>
                    <div className="modal-buttons">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={handleClose}
                        >
                            취소
                        </button>
                        <button type="submit" className="submit-btn">
                            추가
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
