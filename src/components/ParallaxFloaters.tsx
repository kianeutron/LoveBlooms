"use client";

import { motion, useScroll, useTransform } from "framer-motion";

const floaters = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  symbol: ["💖", "🌸", "🌷", "💞", "🌼", "🌺"][i % 6],
  x: Math.random() * 100,
  y: Math.random() * 100,
  speed: 10 + Math.random() * 40,
  size: 16 + Math.random() * 16,
}));

function FloaterItem({ f }: { f: typeof floaters[0] }) {
  const { scrollYProgress } = useScroll();
  const ty = useTransform(scrollYProgress, [0, 1], [0, f.speed]);
  const r = useTransform(scrollYProgress, [0, 1], [0, f.speed * 2]);
  
  return (
    <motion.span
      style={{
        y: ty,
        rotate: r,
        left: `${f.x}%`,
        top: `${f.y}%`,
        fontSize: f.size,
      }}
      className="absolute"
    >
      {f.symbol}
    </motion.span>
  );
}

export default function ParallaxFloaters() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {floaters.map((f) => (
        <FloaterItem key={f.id} f={f} />
      ))}
    </div>
  );
}
