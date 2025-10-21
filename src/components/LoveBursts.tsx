"use client";

import React, { useCallback, useEffect, useRef } from "react";

export default function LoveBursts() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animeRef = useRef<any>(null);

  const spawnBurst = useCallback((x: number, y: number) => {
    const container = containerRef.current;
    if (!container) return;
    const anime = animeRef.current;
    if (!anime) return;

    const symbols = ["💖", "🌸", "💞", "🌷", "💕", "🌼", "💗", "🌺"];
    const group: HTMLSpanElement[] = [];

    for (let i = 0; i < 14; i++) {
      const el = document.createElement("span");
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.position = "absolute";
      el.style.left = `${x - container.getBoundingClientRect().left}px`;
      el.style.top = `${y - container.getBoundingClientRect().top}px`;
      el.style.pointerEvents = "none";
      el.style.fontSize = `${18 + Math.random() * 16}px`;
      el.style.willChange = "transform, opacity";
      container.appendChild(el);
      group.push(el);
    }

    group.forEach((el, i) => {
      const angle = (Math.PI * 2 * i) / group.length + Math.random() * 0.6;
      const distance = 40 + Math.random() * 90;
      anime({
        targets: el,
        translateX: Math.cos(angle) * distance,
        translateY: Math.sin(angle) * distance,
        opacity: [{ value: 1, duration: 80 }, { value: 0, duration: 700, delay: 150 }],
        scale: [{ value: 1.1, duration: 120 }, { value: 0.8, duration: 600 }],
        rotate: (Math.random() - 0.5) * 60,
        easing: "easeOutQuart",
        duration: 900 + Math.random() * 400,
        complete: () => el.remove(),
      });
    });
  }, []);

  useEffect(() => {
    // Dynamically import animejs only on the client and support both default and namespace exports
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("animejs").then((mod: any) => {
      animeRef.current = mod.default ?? mod;
    }).catch(() => {
      animeRef.current = null;
    });

    const container = containerRef.current;
    if (!container) return;

    const onClick = (e: MouseEvent) => spawnBurst(e.clientX, e.clientY);
    container.addEventListener("click", onClick);
    // Also listen on window so programmatic clicks work
    window.addEventListener("click", onClick);
    return () => {
      container.removeEventListener("click", onClick);
      window.removeEventListener("click", onClick);
    };
  }, [spawnBurst]);

  return <div ref={containerRef} className="pointer-events-auto absolute inset-0 select-none" />;
}
