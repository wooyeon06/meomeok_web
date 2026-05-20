import { useState, useRef, useCallback } from 'react';

interface UseCategoryDragOptions {
    onDelete: (category: string) => void;
    onFilterChange: (filter: string) => void;
}

export function useCategoryDrag({ onDelete, onFilterChange }: UseCategoryDragOptions) {
    const [draggingCat, setDraggingCat] = useState<string | null>(null);
    const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
    const [overDeleteZone, setOverDeleteZone] = useState(false);

    const draggingCatRef = useRef<string | null>(null);
    const deleteZoneRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pressStartPos = useRef({ x: 0, y: 0 });
    const cleanupRef = useRef<(() => void) | null>(null);

    const isOverZone = useCallback((cx: number, cy: number): boolean => {
        if (!deleteZoneRef.current) return false;
        const r = deleteZoneRef.current.getBoundingClientRect();
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    }, []);

    const startLongPress = useCallback((cat: string, clientX: number, clientY: number) => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        if (cleanupRef.current) cleanupRef.current();

        pressStartPos.current = { x: clientX, y: clientY };

        const onMove = (e: MouseEvent | TouchEvent) => {
            const p = e instanceof TouchEvent ? e.touches[0] : (e as MouseEvent);
            /**
             * 구체적 의미
                draggingCatRef.current가 null이면
                아직 900ms 길게 누른 후에 드래그가 활성화되지 않은 상태
                이때 이동 거리가 8px 이상이면

                removeAndReset()를 호출해서 긴 누르기 타이머를 취소
                드래그 진입을 포기
                
                왜 필요한가?
                사용자가 길게 누르려다가 손이 조금 움직였을 때
                또는 스크롤/슬라이드 의도일 때
                그 동작을 “드래그 시작”으로 잘못 인식하지 않게 하기 위함
             */
            if (!draggingCatRef.current) {
                const dx = p.clientX - pressStartPos.current.x;
                const dy = p.clientY - pressStartPos.current.y;
                if (Math.sqrt(dx * dx + dy * dy) > 8) removeAndReset();
                return;
            }
            if (e instanceof TouchEvent && e.cancelable) e.preventDefault();
            setGhostPos({ x: p.clientX, y: p.clientY });
            setOverDeleteZone(isOverZone(p.clientX, p.clientY));
        };

        const onEnd = (e: MouseEvent | TouchEvent) => {
            const p = e instanceof TouchEvent
                ? (e as TouchEvent).changedTouches[0]
                : (e as MouseEvent);
            if (draggingCatRef.current && isOverZone(p.clientX, p.clientY)) {
                const catToDelete = draggingCatRef.current;
                onDelete(catToDelete);
                onFilterChange('all');
            }
            removeAndReset();
        };

        const removeAndReset = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            cleanupRef.current = null;
            draggingCatRef.current = null;
            setDraggingCat(null);
            setOverDeleteZone(false);
        };

        cleanupRef.current = removeAndReset;
        //900ms 동안 그대로 있으면 draggingCat를 설정해 실제 드래그 모드에 진입
        longPressTimer.current = setTimeout(() => {
            draggingCatRef.current = cat;
            setDraggingCat(cat);
            setGhostPos({ x: clientX, y: clientY });
        }, 900);

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onEnd);
    }, [onDelete, onFilterChange, isOverZone]);

    const cancelIfNotDragging = useCallback(() => {
        if (draggingCatRef.current) return;
        if (cleanupRef.current) cleanupRef.current();
    }, []);

    return {
        draggingCat,
        ghostPos,
        overDeleteZone,
        deleteZoneRef,
        startLongPress,
        cancelIfNotDragging,
    };
}