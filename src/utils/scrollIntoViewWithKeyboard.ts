import { useEffect } from 'react'

/**
 * 레이아웃에서 한 번 호출하면 모든 input/textarea에 자동 적용.
 * - visualViewport resize: 키보드가 처음 올라올 때 포커스된 요소를 중앙으로 스크롤
 * - focusin: 키보드가 이미 올라온 상태에서 다른 인풋으로 전환할 때 스크롤
 */
export function useGlobalScrollIntoViewOnFocus() {
    useEffect(() => {
        const vv = window.visualViewport

        const scroll = (el: Element) => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }

        const onViewportResize = () => {
            const el = document.activeElement
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                scroll(el)
            }
        }

        const onFocusIn = (e: FocusEvent) => {
            const el = e.target
            if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) return
            const keyboardIsUp = vv ? vv.height < window.innerHeight - 150 : false
            if (keyboardIsUp) scroll(el)
        }

        vv?.addEventListener('resize', onViewportResize)
        document.addEventListener('focusin', onFocusIn) //포커스가능 요소에 이벤트추가

        return () => {
            vv?.removeEventListener('resize', onViewportResize)
            document.removeEventListener('focusin', onFocusIn)
        }
    }, [])
}
