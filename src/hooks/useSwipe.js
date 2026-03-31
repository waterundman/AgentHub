import { useRef, useCallback } from "react";

export default function useSwipe(onSwipeLeft, onSwipeRight, threshold = 50) {
  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  const onTouchStart = useCallback((e) => {
    touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);

  const onTouchEnd = useCallback(() => {
    const dx = touchStart.current.x - touchEnd.current.x;
    const dy = Math.abs(touchStart.current.y - touchEnd.current.y);

    if (Math.abs(dx) > threshold && dy < threshold * 2) {
      if (dx > 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
