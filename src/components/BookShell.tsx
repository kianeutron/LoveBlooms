"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import React from "react";

export default function BookShell({ children }: { children: React.ReactNode }) {
  const { scrollYProgress } = useScroll();
  const tilt = useTransform(scrollYProgress, [0, 1], [0, 4]);
  const shadow = useTransform(scrollYProgress, [0, 1], [0.15, 0.35]);

  return (
    <div className="relative px-4 sm:px-6">
      <motion.div
        style={{ rotateX: tilt }}
        className="mx-auto max-w-5xl">
        <div className="relative rounded-[24px] border border-black/5 dark:border-white/10 bg-white/75 dark:bg-white/5 backdrop-blur shadow-[0_40px_80px_rgba(0,0,0,0.08)] overflow-hidden">
          <motion.div
            aria-hidden
            style={{ opacity: shadow }}
            className="pointer-events-none absolute -inset-6 rounded-[40px] shadow-[inset_0_0_80px_rgba(0,0,0,0.15)]"/>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
