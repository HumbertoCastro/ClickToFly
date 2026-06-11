import { useEffect } from "react";

export function ScrollRevealController() {
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

    const revealAll = () => {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });
    };

    if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
      revealAll();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -6% 0px",
        threshold: 0.2,
      },
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      if (event.matches) {
        revealAll();
        observer.disconnect();
      }
    };

    reducedMotionQuery.addEventListener("change", handleMotionPreference);

    return () => {
      observer.disconnect();
      reducedMotionQuery.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return null;
}
