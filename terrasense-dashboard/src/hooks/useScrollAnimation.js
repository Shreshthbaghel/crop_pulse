import { useEffect, useState } from 'react';

/**
 * useScrollAnimation Hook
 * Triggers an 'animate-in' class when an element enters the viewport.
 * @param {React.RefObject} ref - The element to animate
 * @param {number} delay - Delay in ms before starting animation
 */
export default function useScrollAnimation(ref, delay = 0) {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!ref.current || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            if (ref.current) {
              ref.current.classList.add('animate-in');
              setHasAnimated(true);
            }
          }, delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, delay, hasAnimated]);

  return hasAnimated;
}
