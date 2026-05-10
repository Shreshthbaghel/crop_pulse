import { useEffect } from 'react';

/**
 * useParallax Hook
 * Applies a translateY transform based on scroll position and speed.
 * @param {React.RefObject} ref - The element to animate
 * @param {number} speed - The multiplier for scroll offset (e.g., 0.3)
 */
export default function useParallax(ref, speed = 0.3) {
  useEffect(() => {
    if (!ref.current || window.innerWidth < 768) return;

    let ticking = false;

    const updateParallax = () => {
      if (!ref.current) return;
      const offset = window.scrollY * speed;
      ref.current.style.transform = `translateY(${offset}px)`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref, speed]);
}
