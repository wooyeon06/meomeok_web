import { useState, useEffect, useRef } from "react";

export default function useScrollHide(threshold = 10) {
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            if (ticking.current) return;
            ticking.current = true;
            requestAnimationFrame(() => {
                const currentY = window.scrollY;
                const diff = currentY - lastScrollY.current;
                if (Math.abs(diff) >= threshold) {
                    setIsVisible(diff < 0 || currentY < threshold); // 위로 스크롤 시 보이고, 아래로 스크롤 시 숨김
                    lastScrollY.current = currentY;
                }
                ticking.current = false;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [threshold]);

    return isVisible;
}
