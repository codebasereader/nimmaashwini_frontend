import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 80;
const SCROLL_DELTA_MIN = 10;
const BOTTOM_THRESHOLD = 64;

export function useScrollDirection() {
  const [menuVisible, setMenuVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const update = () => {
      const currentScrollY = window.scrollY;
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const atTop = currentScrollY < SCROLL_THRESHOLD;
      const atBottom = currentScrollY >= maxScrollY - BOTTOM_THRESHOLD;
      const delta = currentScrollY - lastScrollY;

      setIsAtTop(atTop);

      if (atTop || atBottom) {
        setMenuVisible(true);
      } else if (Math.abs(delta) >= SCROLL_DELTA_MIN) {
        setMenuVisible(delta < 0);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { menuVisible, isAtTop };
}
