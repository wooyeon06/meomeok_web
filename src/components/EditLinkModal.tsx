import { useState } from "react";
import { useCategoryContext } from "../contexts/CategoryContext";
import type { YouTubeLink } from "../types";
import { CategorySelect } from "./CategorySelect";
import { getVideoId } from "../utils/utils";
import { analyzeIngredients } from "../utils/ingredientAnalyzer";
import "./AddLinkModal.css";
import { useAppStore } from "../stores/appStore";

interface EditLinkModalProps {
    link: YouTubeLink | null;
    onClose: () => void;
    onSave: (
        title: string,
        url: string,
        category: string,
        memo?: string,
    ) => void;
}

export function EditLinkModal({ link, onClose, onSave }: EditLinkModalProps) {
    const { categories } = useCategoryContext();
    const [title, setTitle] = useState(link?.title ?? "");
    const [url, setUrl] = useState(link?.url ?? "");
    const [category, setCategory] = useState(link?.category ?? "");
    const [ingredients, setIngredients] = useState(link?.memo ?? "");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState("");
    const { incrementRefreshKey } = useAppStore();

    if (!link) return null;

    const videoId = getVideoId(url);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleAnalyze = async () => {
        if (!videoId) return;
        setIsAnalyzing(true);
        setAnalysisError("");
        try {
            const result = await analyzeIngredients(videoId);
            setIngredients(result);
        } catch (e) {
            setAnalysisError(
                e instanceof Error ? e.message : "분석에 실패했습니다.",
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <h2>링크 수정</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (title.trim() && url.trim()) {
                            incrementRefreshKey();
                            onSave(
                                title.trim(),
                                url.trim(),
                                category.trim(),
                                ingredients || undefined,
                            );
                        }
                    }}
                >
                    <div className="form-group">
                        <label>제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="링크 제목을 입력하세요"
                            autoFocus
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>유튜브 URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            required
                        />
                    </div>

                    <button
                        type="button"
                        className="analyze-btn"
                        onClick={handleAnalyze}
                        disabled={!videoId || isAnalyzing}
                    >
                        {isAnalyzing ? "자막 분석 중..." : "재료 자동 분석"}
                    </button>

                    {analysisError && (
                        <p className="analysis-error">{analysisError}</p>
                    )}

                    <div className="form-group ingredients-group">
                        <label>
                            재료 메모
                            <span className="label-hint"> (수정 가능)</span>
                        </label>
                        <textarea
                            className="ingredients-textarea"
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                            placeholder="재료를 직접 입력하거나 자동 분석을 사용하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label>카테고리</label>
                        <CategorySelect
                            value={category}
                            categories={categories}
                            onChange={setCategory}
                        />
                    </div>
                    <div className="modal-buttons">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                        >
                            취소
                        </button>
                        <button type="submit" className="submit-btn">
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
