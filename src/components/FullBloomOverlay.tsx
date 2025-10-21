"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";

const SYMBOLS = ["💖", "🌸", "🌷", "💞", "🌼", "🌺", "💗", "🌻", "🌹", "💘"]; 

export default function FullBloomOverlay({ onDone }: { onDone?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  const items = Array.from({ length: 160 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 3 + Math.random() * 3,
    size: 16 + Math.random() * 22,
    symbol: SYMBOLS[i % SYMBOLS.length],
    drift: (Math.random() - 0.5) * 60,
  }));

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-50/90 via-rose-50/80 to-white/60" />
      {items.map((it) => (
        <motion.span
          key={it.id}
          initial={{ y: -80, x: `${it.x}%`, opacity: 0 }}
          animate={{ y: "110vh", x: `calc(${it.x}% + ${it.drift}px)`, opacity: [0, 1, 1, 0] }}
          transition={{ delay: it.delay, duration: it.duration, ease: "easeInOut" }}
          style={{ fontSize: it.size, position: "absolute" }}
        >
          {it.symbol}
        </motion.span>
      ))}
    </div>
  );
}
