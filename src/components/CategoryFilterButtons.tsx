import type { RefObject } from 'react';

interface CategoryFilterButtonsProps {
    activeFilter: string;
    categories: string[];
    draggingCat: string | null;
    onFilterChange: (filter: string) => void;
    onCategoryMouseDown: (cat: string, clientX: number, clientY: number) => void;
    onCategoryMouseUp: () => void;
    onCategoryMouseLeave: () => void;
    onCategoryTouchStart: (cat: string, clientX: number, clientY: number) => void;
    onCategoryTouchEnd: () => void;
    sliderRef: RefObject<HTMLDivElement | null>;
    onSliderMouseDown: (e: React.MouseEvent) => void;
    onSliderMouseMove: (e: React.MouseEvent) => void;
    onSliderMouseUp: () => void;
    onSliderMouseLeave: () => void;
}

export function CategoryFilterButtons({
    activeFilter,
    categories,
    draggingCat,
    onFilterChange,
    onCategoryMouseDown,
    onCategoryMouseUp,
    onCategoryMouseLeave,
    onCategoryTouchStart,
    onCategoryTouchEnd,
    sliderRef,
    onSliderMouseDown,
    onSliderMouseMove,
    onSliderMouseUp,
    onSliderMouseLeave,
}: CategoryFilterButtonsProps) {
    return (
        <div
            className="category-filter"
            ref={sliderRef}
            onMouseDown={onSliderMouseDown}
            onMouseMove={onSliderMouseMove}
            onMouseUp={onSliderMouseUp}
            onMouseLeave={onSliderMouseLeave}
        >
            <button
                className={`category-filter-btn favorites-pill${activeFilter === 'favorites' ? ' active' : ''}`}
                onClick={() => onFilterChange('favorites')}
            >
                🍴 즐겨찾기
            </button>
            <button
                className={`category-filter-btn${activeFilter === 'all' ? ' active' : ''}`}
                onClick={() => onFilterChange('all')}
            >
                전체
            </button>
            {categories.map(cat => (
                <button
                    key={cat}
                    className={`category-filter-btn${activeFilter === cat ? ' active' : ''}${draggingCat === cat ? ' dragging' : ''}`}
                    onClick={() => onFilterChange(cat)}
                    onContextMenu={(e) => e.preventDefault()}
                    onMouseDown={(e) => { e.stopPropagation(); onCategoryMouseDown(cat, e.clientX, e.clientY); }}
                    onMouseUp={onCategoryMouseUp}
                    onMouseLeave={onCategoryMouseLeave}
                    onTouchStart={(e) => onCategoryTouchStart(cat, e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={onCategoryTouchEnd}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}