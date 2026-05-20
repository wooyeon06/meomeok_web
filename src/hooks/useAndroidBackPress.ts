import { useEffect, useRef } from 'react'

export function useAndroidBackPress(_handler: () => boolean) {
  const handlerRef = useRef<() => boolean>(_handler)
  const isRegisterEventListener = useRef(false);

  // handler만 업데이트 (리스너 재등록 없음)
  useEffect(() => {
    handlerRef.current = _handler
  }, [_handler])

  // 리스너는 딱 1번만 등록
  useEffect(() => {
    const listener = () => {
      const handled = handlerRef.current?.()

      if (!handled) {
        window.Android?.goBack()
      }
    }
    if(isRegisterEventListener.current) return;
    isRegisterEventListener.current = true;
    window.addEventListener('androidBackPress', listener)

    return () => {
      window.removeEventListener('androidBackPress', listener)
    }
  }, [])

  return {handlerRef}
}