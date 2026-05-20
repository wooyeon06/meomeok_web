import { useState, useRef, useCallback } from 'react';
import { ensureCategory, getCategories } from '../utils/storage';
import { useCategoryContext } from '../contexts/CategoryContext';
import { useCategoryDrag } from '../hooks/useCategoryDrag';
import { CategoryFilterButtons } from './CategoryFilterButtons';
import './Category.css';

export default function Category() {
    const { categories, setCategories, activeFilter, setActiveFilter } = useCategoryContext();

    const [showCatInput, setShowCatInput] = useState(false);
    const [newCatName, setNewCatName] = useState('');

    const sliderRef = useRef<HTMLDivElement>(null);
    const isSliderDragging = useRef(false);
    const sliderStartX = useRef(0);
    const sliderScrollStart = useRef(0);

    const handleDeleteCategory = useCallback((cat: string) => {
        setCategories(categories.filter(c => c !== cat));
    }, [categories, setCategories]);

    const { 
        draggingCat, 
        ghostPos, 
        overDeleteZone, 
        deleteZoneRef, 
        startLongPress, 
        cancelIfNotDragging 
    } = useCategoryDrag({
        onDelete: handleDeleteCategory,
        onFilterChange: setActiveFilter,
    });

    const handleAddCategory = () => {
        const name = newCatName.trim();
        if (name && !categories.includes(name)) {
            ensureCategory(name);
            setCategories(getCategories());
        }
        setNewCatName('');
        setShowCatInput(false);
    };

    const onSliderMouseDown = (e: React.MouseEvent) => {
        debugger;
        if ((e.target as HTMLElement).closest('button')) return;
        isSliderDragging.current = true;
        sliderStartX.current = e.pageX - (sliderRef.current?.offsetLeft ?? 0);
        sliderScrollStart.current = sliderRef.current?.scrollLeft ?? 0;
    };

    const onSliderMouseMove = (e: React.MouseEvent) => {
        if (!isSliderDragging.current) return;
        e.preventDefault();
        const x = e.pageX - (sliderRef.current?.offsetLeft ?? 0);
        if (sliderRef.current) {
            sliderRef.current.scrollLeft = sliderScrollStart.current - (x - sliderStartX.current);
        }
    };

    return (
        <>
            <div className="category-filter-wrapper">
                <CategoryFilterButtons
                    activeFilter={activeFilter}
                    categories={categories}
                    draggingCat={draggingCat}
                    onFilterChange={setActiveFilter}
                    onCategoryMouseDown={startLongPress}
                    onCategoryMouseUp={cancelIfNotDragging}
                    onCategoryMouseLeave={cancelIfNotDragging}
                    onCategoryTouchStart={startLongPress}
                    onCategoryTouchEnd={cancelIfNotDragging}
                    sliderRef={sliderRef}
                    onSliderMouseDown={onSliderMouseDown}
                    onSliderMouseMove={onSliderMouseMove}
                    onSliderMouseUp={() => { isSliderDragging.current = false; }}
                    onSliderMouseLeave={() => { isSliderDragging.current = false; }}
                />
                <button
                    className={`category-add-btn${showCatInput ? ' open' : ''}`}
                    onClick={() => { setShowCatInput(v => !v); setNewCatName(''); }}
                    title="카테고리 추가"
                >
                    +
                </button>
            </div>

            {showCatInput && (
                <div className="category-add-row">
                    <input
                        autoFocus
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCategory();
                            if (e.key === 'Escape') { setShowCatInput(false); setNewCatName(''); }
                        }}
                        placeholder="새 카테고리 이름..."
                        list="new-cat-datalist"
                    />
                    <datalist id="new-cat-datalist">
                        {categories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                    <button className="cat-confirm-btn" onClick={handleAddCategory}>✓</button>
                    <button className="cat-cancel-btn" onClick={() => { setShowCatInput(false); setNewCatName(''); }}>×</button>
                </div>
            )}

            {draggingCat && (
                <>
                    <div className="cat-drag-ghost" style={{ left: ghostPos.x, top: ghostPos.y }}>
                        {draggingCat}
                    </div>
                    <div ref={deleteZoneRef} className={`cat-delete-zone${overDeleteZone ? ' over' : ''}`}>
                        ×
                    </div>
                </>
            )}
        </>
    );
}