"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function RoomBackground() {
  const { scrollYProgress } = useScroll();
  const lightMove = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const vignette = useTransform(scrollYProgress, [0, 1], [0.2, 0.35]);

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      {/* Back wall - realistic cream/beige */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_140%_100%_at_50%_-10%,#f5f0e8_0%,#ebe4d8_40%,#ddd5c7_100%)]" />
      
      {/* Wall texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.3'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Natural window light beam - softer, more realistic */}
      <motion.div
        style={{ y: lightMove }}
        className="absolute -top-10 left-[10%] w-[35%] h-[55%] rotate-3 bg-gradient-to-b from-amber-50/50 via-yellow-50/25 to-transparent blur-2xl"
      />
      
      {/* Window frame shadow hints */}
      <motion.div
        style={{ y: lightMove }}
        className="absolute top-8 left-[11%] w-[1.5px] h-[160px] bg-black/08"
      />
      <motion.div
        style={{ y: lightMove }}
        className="absolute top-8 left-[19%] w-[1.5px] h-[160px] bg-black/08"
      />
      <motion.div
        style={{ y: lightMove }}
        className="absolute top-[90px] left-[11%] w-[60px] h-[1.5px] bg-black/08"
      />

      {/* Warm ceiling light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl" />

      {/* Floor - realistic hardwood */}
      <div className="absolute bottom-0 left-0 right-0 h-[38%]">
        {/* Base wood color */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#8b6f47] via-[#7d6343] to-[#6e5536]" />
        {/* Wood grain texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 6px, transparent 6px, transparent 120px)",
          }}
        />
        {/* Plank separation lines */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 95px)",
          }}
        />
        {/* Wood shine/polish */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20" />
        {/* Ambient occlusion at edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_60%,rgba(0,0,0,0.15)_100%)]" />
      </div>

      {/* Skirting board - realistic white trim */}
      <div className="absolute bottom-[38%] left-0 right-0 h-4 bg-gradient-to-b from-[#f8f6f3] to-[#ebe9e6] shadow-[0_-3px_8px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.5)]" />

      {/* Soft vignette */}
      <motion.div
        style={{ opacity: vignette }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_50%_50%,transparent_55%,rgba(0,0,0,0.25)_100%)]"
      />

      {/* Wall posters - realistic framed artwork */}
      <div className="absolute top-[12%] right-[8%] w-[180px] h-[180px]" style={{ transform: "perspective(1000px) rotateY(-2deg)" }}>
        {/* Frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d2420] to-[#1a1612] rounded-sm shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-[6px] bg-white/95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
            <img 
              src="https://i1.sndcdn.com/artworks-Zeuk9t3DmqI1-0-t500x500.png" 
              alt="Poster 1"
              className="w-full h-full object-cover"
              style={{ imageRendering: "crisp-edges" }}
            />
          </div>
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="absolute top-[15%] left-[12%] w-[160px] h-[160px]" style={{ transform: "perspective(1000px) rotateY(3deg)" }}>
        {/* Frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d2420] to-[#1a1612] rounded-sm shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-[6px] bg-white/95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
            <img 
              src="https://m.media-amazon.com/images/I/715LZJ5qX0L._UF1000,1000_QL80_.jpg" 
              alt="Poster 2"
              className="w-full h-full object-cover"
              style={{ imageRendering: "crisp-edges" }}
            />
          </div>
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="absolute top-[48%] right-[6%] w-[140px] h-[140px]" style={{ transform: "perspective(1000px) rotateY(-1deg)" }}>
        {/* Frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d2420] to-[#1a1612] rounded-sm shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-[6px] bg-white/95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
            <img 
              src="https://cdn-images.dzcdn.net/images/cover/967ac8605268db88a1e597394115365d/0x1900-000000-80-0-0.jpg" 
              alt="Poster 3"
              className="w-full h-full object-cover"
              style={{ imageRendering: "crisp-edges" }}
            />
          </div>
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="absolute top-[52%] left-[10%] w-[150px] h-[150px]" style={{ transform: "perspective(1000px) rotateY(2deg)" }}>
        {/* Frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d2420] to-[#1a1612] rounded-sm shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-[6px] bg-white/95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
            <img 
              src="https://cdn-images.dzcdn.net/images/cover/a9d9bda18a953e9ae74e2af5d3d45610/0x1900-000000-80-0-0.jpg" 
              alt="Poster 4"
              className="w-full h-full object-cover"
              style={{ imageRendering: "crisp-edges" }}
            />
          </div>
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Corner shadows for depth */}
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-black/08 to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black/08 to-transparent" />
      
      {/* Potted plant silhouette - more realistic */}
      <div className="absolute bottom-[38%] left-8 h-32 w-24 opacity-40">
        {/* Pot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-10 bg-gradient-to-b from-[#a67c52] to-[#8b6644] rounded-b-lg" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-14 h-4 bg-[#5a4632] rounded-full" />
        {/* Leaves */}
        <div className="absolute bottom-12 left-7 h-18 w-5 bg-gradient-to-t from-[#2d5016] to-[#4a7c2c] rounded-full rotate-12" />
        <div className="absolute bottom-16 left-4 h-16 w-4 bg-gradient-to-t from-[#2d5016] to-[#4a7c2c] rounded-full -rotate-6" />
        <div className="absolute bottom-14 left-11 h-14 w-4 bg-gradient-to-t from-[#2d5016] to-[#4a7c2c] rounded-full rotate-6" />
      </div>
    </div>
  );
}
