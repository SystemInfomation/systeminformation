"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";

export function ConfettiCelebration({ fire }: { fire: boolean }) {
  useEffect(() => {
    if (!fire || typeof window === "undefined") return;
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;
    const colors = ["#C9A227", "#f5e6c8", "#0d3b2c", "#ffffff"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [fire]);

  return null;
}
