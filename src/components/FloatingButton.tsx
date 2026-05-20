import { useState, useRef } from 'react';
import './FloatingButton.css';

const BUTTON_SIZE = 60;
const DRAG_THRESHOLD = 5;

function getInitialPos() {
  const saved = localStorage.getItem('fab-pos');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {
      console.error(e);
    }
  }
  return {
    x: window.innerWidth - BUTTON_SIZE - 32,
    y: window.innerHeight - BUTTON_SIZE - 32,
  };
}

interface FloatingButtonProps {
  onClick: () => void;
}

export function FloatingButton({ onClick }: FloatingButtonProps) {
  const [pos, setPos] = useState<{ x: number; y: number }>(getInitialPos);
  const posRef = useRef(pos);
  const dragging = useRef(false);
  const moved = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    moved.current = false;
    startPointer.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...posRef.current };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPointer.current.x;
    const dy = e.clientY - startPointer.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      moved.current = true;
    }
    const newX = Math.max(0, Math.min(window.innerWidth - BUTTON_SIZE, startPos.current.x + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - BUTTON_SIZE, startPos.current.y + dy));
    const newPos = { x: newX, y: newY };
    posRef.current = newPos;
    setPos(newPos);
  };

  const onPointerUp = () => {
    dragging.current = false;
    if (moved.current) {
      localStorage.setItem('fab-pos', JSON.stringify(posRef.current));
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!moved.current) {
      onClick();
    }
  };

  return (
    <button
      className="floating-button"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleClick}
    >
      +
    </button>
  );
}
