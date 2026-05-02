"use client";

import { ThemeProvider } from "next-themes";
import { type ReactNode, createContext, useCallback, useContext, useState } from "react";

type SoundCtx = { muted: boolean; toggleMuted: () => void; playChime: () => void };

const SoundContext = createContext<SoundCtx | null>(null);

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      muted: true,
      toggleMuted: () => {},
      playChime: () => {},
    };
  }
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(true);

  const playChime = useCallback(() => {
    if (muted || typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.start();
      o.stop(ctx.currentTime + 0.08);
    } catch {
      /* ignore */
    }
  }, [muted]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SoundContext.Provider
        value={{
          muted,
          toggleMuted: () => setMuted((m) => !m),
          playChime,
        }}
      >
        {children}
      </SoundContext.Provider>
    </ThemeProvider>
  );
}
