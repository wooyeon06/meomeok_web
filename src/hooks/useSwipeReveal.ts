import { useState, useRef, useCallback } from 'react';

const REVEAL_WIDTH = 120;
const SWIPE_THRESHOLD = REVEAL_WIDTH * 0.35;

interface UseSwipeRevealOptions {
    initialRevealed?: boolean;
    onReveal?: () => void;
    onHide?: () => void;
}

export function useSwipeReveal({ onReveal, onHide }: UseSwipeRevealOptions = {}) {
    const [liveOffset, setLiveOffset] = useState<number | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    const startX = useRef(0);
    const startY = useRef(0);
    const swipeLocked = useRef(false);
    const swipeMoved = useRef(false);

    const offset = liveOffset !== null ? liveOffset : (isRevealed ? REVEAL_WIDTH : 0);
    const revealProgress = offset / REVEAL_WIDTH;
    const thumbWidth = Math.round(120 - 35 * revealProgress);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) return;
        if ((e.target as HTMLElement).closest('.link-actions')) return;
        startX.current = e.clientX;
        startY.current = e.clientY;
        swipeLocked.current = false;
        swipeMoved.current = false;
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const dx = e.clientX - startX.current;
        const dy = e.clientY - startY.current;

        if (!swipeLocked.current) {
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
            if (Math.abs(dy) >= Math.abs(dx)) return;
            swipeLocked.current = true;
            setIsSwiping(true);
        }

        swipeMoved.current = true;
        const base = isRevealed ? REVEAL_WIDTH : 0;
        setLiveOffset(Math.max(0, Math.min(REVEAL_WIDTH, base - dx)));
    }, [isRevealed]);

    const handlePointerUp = useCallback(() => {
        setIsSwiping(false);
        if (!swipeLocked.current) {
            setLiveOffset(null);
            if (isRevealed) {
                setIsRevealed(false);
                onHide?.();
            }
            return;
        }
        const currentOffset = liveOffset ?? (isRevealed ? REVEAL_WIDTH : 0);
        setLiveOffset(null);
        if (currentOffset >= SWIPE_THRESHOLD) {
            setIsRevealed(true);
            onReveal?.();
        } else {
            setIsRevealed(false);
            onHide?.();
        }
    }, [isRevealed, liveOffset, onReveal, onHide]);

    const handlePointerCancel = useCallback(() => {
        setIsSwiping(false);
        setLiveOffset(null);
    }, []);

    const handleReveal = useCallback(() => {
        setIsRevealed(true);
    }, []);

    const handleHide = useCallback(() => {
        setIsRevealed(false);
    }, []);

    return {
        isRevealed,
        isSwiping,
        offset,
        thumbWidth,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        handleReveal,
        handleHide,
    };
}