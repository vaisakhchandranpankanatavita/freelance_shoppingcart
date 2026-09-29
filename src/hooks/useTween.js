import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

const lerp = (a, b, k) =>
  Array.isArray(b) ? b.map((v, i) => a[i] + (v - a[i]) * k) : a + (b - a) * k;

// Eases a number (or an equal-length number array) toward `target` on the JS
// thread and re-renders each frame. For values that must be rendered as text or
// SVG geometry (count-ups, chart path morphs), where UI-thread styles can't reach.
export default function useTween(target, { duration = 700, from, delay = 0 } = {}) {
  const [value, setValue] = useState(from ?? target);
  const current = useRef(from ?? target);

  useEffect(() => {
    const start = current.current;
    let raf;
    let t0;
    const tick = (now) => {
      if (t0 === undefined) t0 = now + delay;
      const k = Math.min(1, Math.max(0, (now - t0) / duration));
      const next = lerp(start, target, easeOutCubic(k));
      current.current = next;
      setValue(next);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [JSON.stringify(target), duration, delay]);

  return value;
}
