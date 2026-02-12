import { useRef, useCallback } from 'react';

/**
 * Hook para scroll horizontal arrastrando con el dedo o raton.
 * Permite hacer scroll tocando/clickando encima de los botones.
 */
export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    state.current.isDown = true;
    state.current.moved = false;
    state.current.startX = e.pageX - ref.current.offsetLeft;
    state.current.scrollLeft = ref.current.scrollLeft;
    ref.current.style.cursor = 'grabbing';
  }, []);

  const onMouseLeave = useCallback(() => {
    state.current.isDown = false;
    if (ref.current) ref.current.style.cursor = '';
  }, []);

  const onMouseUp = useCallback(() => {
    state.current.isDown = false;
    if (ref.current) ref.current.style.cursor = '';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!state.current.isDown || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - state.current.startX) * 1.5;
    if (Math.abs(walk) > 3) state.current.moved = true;
    ref.current.scrollLeft = state.current.scrollLeft - walk;
  }, []);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!ref.current || e.touches.length !== 1) return;
    state.current.isDown = true;
    state.current.moved = false;
    state.current.startX = e.touches[0].pageX - ref.current.offsetLeft;
    state.current.scrollLeft = ref.current.scrollLeft;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.current.isDown || !ref.current || e.touches.length !== 1) return;
    const x = e.touches[0].pageX - ref.current.offsetLeft;
    const walk = (x - state.current.startX) * 1.5;
    if (Math.abs(walk) > 3) state.current.moved = true;
    ref.current.scrollLeft = state.current.scrollLeft - walk;
  }, []);

  const onTouchEnd = useCallback(() => {
    state.current.isDown = false;
  }, []);

  // Prevenir click si se arrastro
  const preventClickIfDragged = useCallback((e: React.MouseEvent) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    ref,
    handlers: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onClickCapture: preventClickIfDragged,
    },
  };
}
