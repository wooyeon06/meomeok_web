import { useState, useRef, useCallback } from 'react';
import type { YouTubeLink } from '../types';
import { saveLinks } from '../utils/storage';

interface UseLinkReorderOptions {
    onLinksChange: (links: YouTubeLink[] | ((prev: YouTubeLink[]) => YouTubeLink[])) => void;
}

export function useLinkReorder({ onLinksChange }: UseLinkReorderOptions) {
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);
    const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
    const [draggingLink, setDraggingLink] = useState<YouTubeLink | null>(null);

    const dragIdxRef = useRef<number | null>(null);
    const overIdxRef = useRef<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const startReorder = useCallback((e: React.PointerEvent, index: number, link: YouTubeLink) => {
        dragIdxRef.current = index;
        overIdxRef.current = index;
        setDragIdx(index);
        setOverIdx(index);
        setDraggingLink(link);
        setGhostPos({ x: e.clientX, y: e.clientY });

        let lastY = e.clientY;
        let rafId = 0;

        const updateOverIdx = (clientY: number) => {
            if (!listRef.current) return;
            const cards = Array.from(listRef.current.children) as HTMLElement[];
            let newOver = cards.length - 1;
            for (let i = 0; i < cards.length; i++) {
                const rect = cards[i].getBoundingClientRect();
                if (clientY < rect.top + rect.height / 2) {
                    newOver = i;
                    break;
                }
            }
            overIdxRef.current = newOver;
            setOverIdx(newOver);
        };

        const EDGE = 80;
        const MAX_SPEED = 18;

        const tick = () => {
            const vh = window.innerHeight;
            let dy = 0;
            // 포인터가 화면 위쪽 EDGE(80px) 영역 안 → 위로 스크롤(dy 음수).
            // (1 - lastY / EDGE): 경계(lastY=EDGE)에서 0, 꼭대기(lastY=0)에서 1.
            // 즉, 가장자리에 가까울수록 |dy|가 커져 MAX_SPEED에 근접.
            if (lastY < EDGE) {
                dy = -1 * (MAX_SPEED * (1 - lastY / EDGE));
            }
            // 포인터가 화면 아래쪽 EDGE 영역 안 → 아래로 스크롤(dy 양수).
            // (vh - lastY): 바닥까지 남은 거리. 바닥(lastY=vh)에서 0, 경계에서 EDGE.
            // 동일하게 가장자리에 가까울수록 dy가 커짐.
            else if (lastY > vh - EDGE) {
                dy = MAX_SPEED * (1 - (vh - lastY) / EDGE);
            }
            // 가장자리 영역 밖이면 dy=0 → 스크롤 없음. 스크롤이 일어났을 때만
            // 카드 위치(getBoundingClientRect)가 바뀌므로 hover 인덱스를 재계산.
            if (dy !== 0) {
                window.scrollBy(0, dy);
                updateOverIdx(lastY);
            }
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        const onMove = (ev: PointerEvent) => {
            lastY = ev.clientY;
            setGhostPos({ x: ev.clientX, y: ev.clientY });
            updateOverIdx(ev.clientY);
        };

        const onUp = () => {
            cancelAnimationFrame(rafId);
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);

            const from = dragIdxRef.current;
            const to = overIdxRef.current;

            if (from !== null && to !== null && from !== to) {
                onLinksChange((prev) => {
                    const arr = [...prev];
                    const [moved] = arr.splice(from, 1);
                    arr.splice(to, 0, moved);
                    const ordered = arr.map((l, i) => ({ ...l, order: i }));
                    saveLinks(ordered);
                    return ordered;
                });
            }

            dragIdxRef.current = null;
            overIdxRef.current = null;
            setDragIdx(null);
            setOverIdx(null);
            setDraggingLink(null);
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }, [onLinksChange]);

    return {
        dragIdx,
        overIdx,
        ghostPos,
        draggingLink,
        listRef,
        startReorder,
    };
}