"use client";

import { motion, useInView } from "framer-motion";
import React, { useRef } from "react";

export default function StorySection({
  id,
  title,
  children,
  align = "center",
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px -20% 0px", once: false });

  const alignCls =
    align === "left"
      ? "items-start text-left"
      : align === "right"
      ? "items-end text-right"
      : "items-center text-center";

  return (
    <section id={id} className="py-24 px-6">
      <div
        className="max-w-4xl mx-auto"
      >
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0.5, y: 24 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`rounded-3xl border border-white/40 dark:border-white/15 bg-white/70 dark:bg-white/5 backdrop-blur p-8 shadow-xl ${alignCls}`}
        >
          <motion.h2
            className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-rose-500 to-fuchsia-600"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.05, duration: 0.5 }}
          >
            {title}
          </motion.h2>
          <motion.div
            className="mt-4 text-foreground/85"
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ delay: 0.12, duration: 0.5 }}
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
