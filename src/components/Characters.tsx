"use client";

import { motion } from "framer-motion";

export function BlondGirl({ className = "w-40 h-40" }: { className?: string }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 200 200"
      initial={{ y: 10 }}
      animate={{ y: [10, -4, 10] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="hair" x1="0" x2="1">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor="#ffd166" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="#ffe8ef" />
      <circle cx="100" cy="95" r="40" fill="#ffd7e0" />
      <path d="M50,95 C60,50 140,50 150,95 C140,140 60,140 50,95 Z" fill="url(#hair)" />
      <circle cx="85" cy="95" r="4" fill="#444" />
      <circle cx="115" cy="95" r="4" fill="#444" />
      <path d="M85,115 Q100,125 115,115" stroke="#e2557c" strokeWidth="5" fill="none" strokeLinecap="round" />
      <motion.g whileHover={{ rotate: 12 }}>
        <path d="M140,120 q15,-10 20,5 q-13,10 -20,-5 Z" fill="#ff88aa" />
      </motion.g>
    </motion.svg>
  );
}

export function DarkHairBoy({ className = "w-40 h-40" }: { className?: string }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 200 200"
      initial={{ y: -6 }}
      animate={{ y: [-6, 6, -6] }}
      transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
    >
      <circle cx="100" cy="100" r="80" fill="#e7f0ff" />
      <circle cx="100" cy="95" r="40" fill="#cfe3ff" />
      <path d="M55,85 C80,55 120,55 145,85 C130,75 70,75 55,85 Z" fill="#1e2a44" />
      <circle cx="85" cy="95" r="4" fill="#222" />
      <circle cx="115" cy="95" r="4" fill="#222" />
      <path d="M85,115 Q100,110 115,115" stroke="#2b4c7e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <motion.g whileHover={{ y: -4 }}>
        <path d="M65,130 q-12,-8 -16,6 q10,9 16,-6 Z" fill="#2b4c7e" />
      </motion.g>
    </motion.svg>
  );
}

export default function CharactersRow() {
  return (
    <div className="flex items-center justify-center gap-6">
      <BlondGirl />
      <DarkHairBoy />
    </div>
  );
}
