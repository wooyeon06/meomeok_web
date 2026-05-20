# Category.tsx 설명

## 역할 한 줄 요약

카테고리 필터 바 전체를 담당하는 컴포넌트.  
필터 선택, 추가, 롱프레스 드래그 삭제까지 모두 여기서 처리한다.

---

## 데이터 흐름 (어디서 값을 가져오고 어디로 보내는가)

```
CategoryContext (전역 저장소)
    │
    ├── categories      → 렌더링할 카테고리 목록을 읽음
    ├── setCategories   → 카테고리 추가/삭제 후 목록을 업데이트
    ├── activeFilter    → 현재 선택된 필터를 읽어 버튼 강조
    └── setActiveFilter → 버튼 클릭 시 필터 변경
```

`props`는 없다. 모든 외부 데이터는 Context에서 온다.

---

## 상태(State) 목록

| 이름 | 종류 | 설명 |
|------|------|------|
| `showCatInput` | `useState` | 카테고리 추가 입력창 표시 여부 |
| `newCatName` | `useState` | 추가 입력창에 입력 중인 텍스트 |
| `draggingCat` | `useState` | 현재 드래그 중인 카테고리 이름 (없으면 null) |
| `ghostPos` | `useState` | 드래그 고스트 태그의 화면 좌표 `{x, y}` |
| `overDeleteZone` | `useState` | 고스트가 × 삭제 존 위에 있는지 여부 |

---

## Ref 목록

> `useState`와 달리 ref는 값이 바뀌어도 리렌더링을 일으키지 않는다.  
> 이벤트 핸들러 클로저 안에서 항상 **최신 값**을 읽어야 할 때 사용.

| 이름 | 설명 |
|------|------|
| `draggingCatRef` | 드래그 중인 카테고리 이름 (클로저 stale 방지용) |
| `deleteZoneRef` | × 삭제 존 DOM 엘리먼트 (위치 계산용) |
| `longPressTimer` | 롱프레스 900ms 타이머 ID |
| `pressStartPos` | 손가락/마우스를 처음 누른 좌표 (이동 거리 계산용) |
| `cleanupRef` | 현재 등록된 document 이벤트 리스너 제거 함수 |
| `sliderRef` | 카테고리 바 DOM 엘리먼트 (마우스 드래그 스크롤용) |
| `isSliderDragging` | 마우스로 바를 드래그 중인지 여부 |
| `sliderStartX` | 드래그 시작 X 위치 |
| `sliderScrollStart` | 드래그 시작 시점의 scrollLeft 값 |

---

## 함수 설명

### `startLongPress(cat, clientX, clientY)`

카테고리 버튼을 누르는 순간 호출된다.  
**핵심 설계 이유**: document 이벤트 리스너를 *누르는 즉시* 등록한다.  
(나중에 등록하면 손을 떼는 이벤트를 놓칠 수 있기 때문)

```
버튼 누름
  │
  ├─ 기존 타이머·리스너 정리
  ├─ 시작 좌표 저장
  ├─ document에 mousemove / mouseup / touchmove / touchend 등록
  │
  └─ 900ms 타이머 시작
        │
        └─ 900ms 경과 → draggingCatRef.current = cat
                         setDraggingCat(cat) → 고스트 + × 존 화면에 표시
```

타이머가 시작된 후 document 리스너가 받는 이벤트의 역할:

- **`onMove`** (mousemove / touchmove)
  - 드래그 전: 8px 이상 이동하면 `removeAndReset()` 호출 → 롱프레스 취소 (스크롤로 인식)
  - 드래그 중: 고스트 위치 갱신, × 존 위에 있는지 확인
- **`onEnd`** (mouseup / touchend)
  - `draggingCatRef.current`가 있고 × 존 위에서 손을 뗐다면 → **카테고리 삭제**
  - 그 외 → 그냥 취소

### `removeAndReset()`

`startLongPress` 내부에 정의된 클린업 함수.  
`cleanupRef.current`에 저장되어 외부에서도 호출 가능.

```
document 이벤트 리스너 제거
타이머 제거
draggingCatRef.current = null
setDraggingCat(null)  → 고스트 + × 존 화면에서 제거
setOverDeleteZone(false)
```

### `cancelIfNotDragging()`

버튼의 `onMouseUp` / `onMouseLeave` / `onTouchEnd`에 연결.  
이미 드래그 중(`draggingCatRef.current`가 있음)이면 **아무것도 안 한다**.  
드래그 전(타이머만 돌고 있는 상태)이라면 `removeAndReset()`으로 취소.

> **왜 이 구분이 필요한가?**  
> 드래그 중에 손가락이 버튼 영역을 벗어나면 `onMouseLeave`가 발생한다.  
> 이때 무조건 취소하면 드래그가 끊기기 때문에, 드래그 중에는 무시해야 한다.

### `handleAddCategory()`

\+ 버튼 → 입력창 → 이름 입력 → Enter 또는 ✓ 버튼 클릭 시 호출.

```
이름이 비어있거나 중복이면 아무것도 안 함
아니면 → localStorage에 저장 → context categories 갱신
→ 입력창 닫기
```

### 슬라이더 (`onSliderMouseDown` / `onSliderMouseMove`)

PC에서 마우스로 카테고리 바를 좌우 드래그 스크롤할 수 있게 해주는 핸들러.  
버튼 위에서 누른 경우(`closest('button')`)는 무시하여 롱프레스와 충돌하지 않는다.  
모바일에서는 CSS `overflow-x: auto`의 네이티브 터치 스크롤이 대신 동작한다.

---

## 렌더링 구조

```
<>
  ┌─ category-filter-wrapper ─────────────────────────────────────┐
  │  ┌─ category-filter (슬라이더) ──────────────────────────────┐ │
  │  │  [🍴 즐겨찾기]  [전체]  [카테고리A]  [카테고리B]  ...     │ │
  │  └───────────────────────────────────────────────────────────┘ │
  │  [+]                                                           │
  └───────────────────────────────────────────────────────────────┘

  (showCatInput일 때만)
  ┌─ category-add-row ──────────────────────────────────────────┐
  │  [___새 카테고리 이름..._________________]  [✓]  [×]        │
  └─────────────────────────────────────────────────────────────┘

  (draggingCat이 있을 때만)
  고스트 태그 (position: fixed, 손가락을 따라다님)
  × 삭제 존  (position: fixed, 화면 하단 중앙 고정)
</>
```

---

## 롱프레스 전체 흐름 다이어그램

```
[버튼 누름]
    │
    ▼
startLongPress 호출
    │
    ├─ document 리스너 즉시 등록
    └─ 900ms 타이머 시작
           │
     손을 떼거나         900ms 경과
     8px 이상 이동?          │
           │                 ▼
           ▼         draggingCatRef = cat
     removeAndReset   setDraggingCat(cat)
     (취소)           → 고스트 + × 존 등장
                             │
                      손가락 이동
                             │
                    onMove: 고스트 위치 갱신
                    isOverZone 계산
                             │
                      손을 뗌 (onEnd)
                             │
                    × 존 위?
                    ├─ Yes → deleteCategory 호출
                    └─ No  → 그냥 취소
                             │
                             ▼
                       removeAndReset
                       (고스트 + × 존 제거)
```