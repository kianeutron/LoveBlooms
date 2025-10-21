"use client";

import { motion, useScroll } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-transparent">
      <motion.div
        className="h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600"
        style={{ scaleX: scrollYProgress, transformOrigin: "0% 50%" }}
      />
    </div>
  );
}
