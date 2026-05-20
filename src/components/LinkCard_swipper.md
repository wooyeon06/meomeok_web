# LinkCard 스와이프 투 리빌 구현

## 레이아웃 구조

```
.link-item (position: relative, overflow: hidden)
├── .link-item-inner  ← 슬라이드되는 흰 레이어 (z-index: 1)
│   ├── 썸네일
│   └── 제목/URL
└── .link-actions     ← 절대 위치로 right: 0에 고정
    ├── 즐겨찾기 버튼
    ├── 공유 버튼
    └── 삭제 버튼
```

`.link-actions`는 카드 오른쪽에 항상 존재하지만, `.link-item-inner`가 `z-index: 1`로 그 위를 덮고 있다.  
`overflow: hidden`이 카드 박스를 기준으로 자식 요소를 잘라내기 때문에, `.link-item-inner`가 왼쪽으로 이동해서 카드 경계를 벗어난 부분은 렌더링에서 제외된다.

---

## 스와이프 감지 — 수평/수직 분리

```tsx
const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  const dx = e.clientX - startX.current;
  const dy = e.clientY - startY.current;

  if (!swipeLocked.current) {
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;   // 아직 방향 불명
    if (Math.abs(dy) >= Math.abs(dx)) return;            // 수직이면 무시 (스크롤)
    swipeLocked.current = true;                          // 수평 확정 → 스와이프 시작
    setIsSwiping(true);
  }
  ...
};
```

첫 5px 이내는 방향을 판단하지 않는다. 이후 세로 이동이 더 크면 무시(스크롤에 양보), 가로 이동이 더 크면 `swipeLocked`를 `true`로 고정해서 그 제스처 전체를 스와이프로 처리한다.

---

## 오프셋 계산

```tsx
const base = isRevealed ? REVEAL_WIDTH : 0;  // 현재 상태의 기준점
setLiveOffset(Math.max(0, Math.min(REVEAL_WIDTH, base - dx)));
```

| 상태 | base | dx | offset |
|------|------|----|--------|
| 닫힘 + 왼쪽 60px 스와이프 | 0 | -60 | 60 |
| 열림 + 오른쪽 60px 스와이프 | 120 | +60 | 60 |

`Math.max/min`으로 0~120px 범위를 벗어나지 않게 클램핑한다.

---

## 슬라이드 애니메이션

```tsx
// 내부 wrapper에 인라인 스타일
style={{ transform: `translateX(-${offset}px)` }}
```

`offset`이 `0`이면 제자리, `120`이면 왼쪽으로 120px 이동 → 뒤에 있던 버튼들이 노출된다.

드래그 중에는 트랜지션을 끄고, 손을 뗄 때 다시 켜서 스냅 애니메이션이 작동한다.

```css
.link-item-inner         { transition: transform 0.28s cubic-bezier(...); }
.link-item-inner.swiping { transition: none; }  /* 드래그 중 즉각 반응 */
```

---

## 썸네일 너비 연동

```tsx
const revealProgress = offset / REVEAL_WIDTH;            // 0.0 ~ 1.0
const thumbWidth = Math.round(120 - 35 * revealProgress); // 120px ~ 85px

// 드래그 중에는 인라인 스타일로 실시간 반영
style={liveOffset !== null ? { width: thumbWidth } : undefined}
```

드래그 중(`liveOffset !== null`)엔 인라인 스타일로 연속 변화, 스냅 후엔 CSS 클래스로 전환된다.

```css
.link-item.revealed .link-thumbnail-wrap { width: 85px; }
```

---

## 포인터업 — 스냅 결정

```tsx
const handlePointerUp = () => {
  const currentOffset = liveOffset ?? (isRevealed ? REVEAL_WIDTH : 0);
  setLiveOffset(null);  // 인라인 스타일 제거 → CSS 트랜지션으로 스냅

  if (currentOffset >= SWIPE_THRESHOLD) onReveal?.();  // 38% 이상 → 열기
  else onHide?.();                                      // 미만 → 닫기
};
```

`setLiveOffset(null)`을 하는 순간 인라인 스타일이 사라지고, CSS 클래스(`revealed`)에 의한 값으로 전환되면서 `transition`이 스냅 애니메이션을 만든다.

---

## 다른 카드 선택 시 자동 닫힘 — HomePage

```tsx
useEffect(() => {
  const handler = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('.link-actions')) return; // 버튼 클릭은 제외
    setRevealedId(null);  // 어디든 터치하면 닫힘
  };
  document.addEventListener('pointerdown', handler);
  return () => document.removeEventListener('pointerdown', handler);
}, []);
```

`revealedId`가 하나의 ID만 보관하기 때문에, 새 카드를 `onReveal`로 열면 이전 카드는 `isRevealed=false`가 되어 자동으로 닫힌다.

---

## overflow: hidden이 핵심인 이유

```css
.link-item {
  position: relative;
  overflow: hidden;  /* 카드 경계 밖은 렌더링하지 않음 */
}
```

- `.link-item-inner`가 왼쪽으로 빠져나가는 부분 → `overflow: hidden`이 잘라냄
- `.link-actions` 버튼들은 `right: 0`에 고정되어 항상 카드 안에 있음
- `.link-item-inner`의 흰 배경(`z-index: 1`)이 버튼을 덮다가, 슬라이드되면서 버튼이 드러남
