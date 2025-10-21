"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeartsScene from "./HeartsScene";
import LoveBursts from "./LoveBursts";

type Book = {
  id: number;
  color: string;
  height: number; // percentage height of shelf slot
  label?: string;
  tilt: number; // small rotateZ variation
  dropRot: number; // rotation used when dropping
};

export default function Bookshelf({ onPickCorrect }: { onPickCorrect: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [cloudPhase, setCloudPhase] = useState<'none' | 'filling' | 'traveling' | 'newWorld'>('none');
  const [audio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScrollMessage, setShowScrollMessage] = useState(false);
  const [, setScrollProgress] = useState(0);
  const [revealedCards, setRevealedCards] = useState<boolean[]>(new Array(7).fill(false));
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Seeded RNG for SSR/CSR consistency
  function createRng(seed: number) {
    let s = seed >>> 0;
    return () => {
      // xorshift32
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 100000) / 100000; // 0..1
    };
  }

  // Generate a collection of books; one special target (stable across SSR/CSR)
  const { books, targetId } = useMemo(() => {
    // Realistic book cover colors: deep reds, greens, blues, browns, burgundy
    const palette = [
      "#8B4513", "#2F4F4F", "#8B0000", "#2E5C3F", "#4A3728",
      "#6B4423", "#1C3D5A", "#704214", "#4B3621", "#5C4033",
      "#556B2F", "#8B4726", "#3B3C36", "#654321", "#4A235A",
      "#7B3F00", "#483C32", "#1F4788"
    ];
    const rng = createRng(12345);
    const arr: Book[] = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      color: palette[i % palette.length],
      height: 70 + Math.round(rng() * 25),
      tilt: (rng() - 0.5) * 1.2,
      dropRot: (rng() - 0.5) * 12,
    }));
    const target = Math.floor(rng() * arr.length);
    arr[target].label = "Pick me";
    return { books: arr, targetId: target };
  }, []);

  const onBookClick = (b: Book) => {
    if (opened) return;
    if (b.id === targetId) {
      setSelectedId(b.id);
      setOpened(true);
      onPickCorrect();
      
      // Start cloud journey sequence - slower, dreamier pacing
      setTimeout(() => setCloudPhase('filling'), 1000);
      setTimeout(() => setCloudPhase('traveling'), 4000);
      setTimeout(() => setCloudPhase('newWorld'), 9000);
    } else {
      setMessage("Not this one ✋");
      setTimeout(() => setMessage(null), 1200);
    }
  };

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width; // 0..1
    const y = (e.clientY - rect.top) / rect.height; // 0..1
    const ry = (x - 0.5) * 8; // left/right
    const rx = (0.5 - y) * 6; // up/down
    setTilt({ rx, ry });
  };
  const onMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  // Function to play The Police song via YouTube embed
  const playBackToTheOldHouse = () => {
    try {
      // Remove any existing YouTube player
      const existingPlayer = document.getElementById('youtube-music-player');
      if (existingPlayer) {
        existingPlayer.remove();
      }

      // Create hidden YouTube iframe for audio only
      const iframe = document.createElement('iframe');
      iframe.id = 'youtube-music-player';
      iframe.src = 'https://www.youtube.com/embed/iOT_zuDHvVk?autoplay=1&loop=1&playlist=iOT_zuDHvVk&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=' + window.location.origin;
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.allow = 'autoplay; encrypted-media';
      iframe.setAttribute('allowfullscreen', '');
      
      // Add to document
      document.body.appendChild(iframe);
      
      // Update playing state for CD player UI
      setIsPlaying(true);
      
      // Show scroll message and hide dream content
      setShowScrollMessage(true);
      
      // Show success message
      setMessage("🎵 Playing The Police - Every Breath You Take");
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.log('YouTube music player failed:', error);
      setMessage("🎵 Music player unavailable - try clicking play on the video");
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Scroll handler for love letter
  useEffect(() => {
    const handleScroll = () => {
      if (showScrollMessage) {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const progress = Math.min(scrollY / (documentHeight - windowHeight), 1);
        setScrollProgress(progress);
        
        // Track if user has started scrolling
        if (scrollY > 50) {
          setHasScrolled(true);
        }

        // Update revealed cards - once revealed, they stay revealed
        // Use much lower thresholds so cards appear immediately when scrolling
        const thresholds = [0.01, 0.05, 0.1, 0.15, 0.2, 0.28, 0.38];
        setRevealedCards(prev => 
          prev.map((revealed, index) => 
            revealed || progress > thresholds[index]
          )
        );
        
        console.log('Scroll progress:', progress, 'ScrollY:', scrollY); // Debug log
      }
    };

    if (showScrollMessage) {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Call once to set initial state
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showScrollMessage]);

  // Set mounted state for client-only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cleanup audio and YouTube player on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      // Remove YouTube player
      const existingPlayer = document.getElementById('youtube-music-player');
      if (existingPlayer) {
        existingPlayer.remove();
      }
    };
  }, [audio]);

  // Removed anime.js runtime to avoid environment issues; using Framer Motion per-slot animations instead

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex items-center justify-center overflow-hidden touch-manipulation">
      {/* CD Player UI - appears when music is playing */}
      {isPlaying && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 rounded-3xl p-1 shadow-2xl"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-5 py-3 shadow-inner">
            <div className="flex items-center gap-4">
              {/* Cute heart decorations */}
              <div className="absolute -top-2 -left-2 text-2xl animate-bounce">💖</div>
              <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>💕</div>
              
              {/* CD Disc - prettier with rainbow gradient */}
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-full shadow-lg animate-spin" style={{ animationDuration: '3s' }}>
                  <div className="absolute inset-2 bg-gradient-to-br from-white to-pink-100 rounded-full">
                    <div className="absolute inset-3 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full shadow-inner"></div>
                    </div>
                  </div>
                  {/* Rainbow shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </div>
              </div>
              
              {/* Track Info - cuter fonts and colors */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 truncate">
                  The Police
                </div>
                <div className="text-xs font-medium text-gray-600 truncate">
                  Every Breath You Take
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="text-xs text-pink-500">♪</div>
                  <div className="flex-1 h-1 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Cute stop button */}
              <button 
                onClick={() => {
                  const player = document.getElementById('youtube-music-player');
                  if (player) {
                    player.remove();
                    setIsPlaying(false);
                  }
                }}
                className="w-9 h-9 bg-gradient-to-br from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-lg"
                title="Stop music"
              >
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {/* Room background with posters - only visible when not in cloud journey */}
      {(cloudPhase === 'none' || cloudPhase === 'filling') && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Realistic wall background with texture */}
          <div className="absolute inset-0" style={{
            background: `
              linear-gradient(180deg, 
                rgba(245,235,220,1) 0%,
                rgba(240,230,215,1) 30%,
                rgba(235,225,210,1) 60%,
                rgba(230,220,205,1) 100%
              )
            `
          }}>
            {/* Wall texture overlay - plaster/paint effect */}
            <div className="absolute inset-0 opacity-60" style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent 0px, rgba(0,0,0,0.01) 1px, transparent 2px),
                repeating-linear-gradient(90deg, transparent 0px, rgba(0,0,0,0.01) 1px, transparent 2px),
                repeating-linear-gradient(45deg, transparent 0px, rgba(0,0,0,0.008) 1px, transparent 3px)
              `,
              filter: "blur(0.3px)"
            }} />
            
            {/* Subtle imperfections and variations */}
            <div className="absolute inset-0 opacity-20" style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(210,195,180,0.3), transparent 40%),
                radial-gradient(circle at 80% 60%, rgba(220,205,190,0.25), transparent 35%),
                radial-gradient(circle at 50% 80%, rgba(215,200,185,0.3), transparent 45%)
              `,
              filter: "blur(60px)"
            }} />
          </div>

          {/* Ambient ceiling light effect */}
          <div className="absolute top-0 left-0 right-0 h-1/3" style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,250,240,0.6), transparent 60%)
            `,
            filter: "blur(40px)"
          }} />

          {/* Floor with realistic gradient and shadow */}
          <div className="absolute bottom-0 left-0 right-0 h-1/4" style={{
            background: `
              linear-gradient(180deg,
                transparent 0%,
                rgba(139,115,85,0.08) 40%,
                rgba(101,84,63,0.15) 70%,
                rgba(80,65,50,0.25) 100%
              )
            `
          }} />

          {/* Floor texture */}
          <div className="absolute bottom-0 left-0 right-0 h-1/5 opacity-40" style={{
            background: `
              repeating-linear-gradient(90deg,
                rgba(101,84,63,0.1) 0px,
                rgba(101,84,63,0.05) 2px,
                transparent 3px,
                transparent 80px
              )
            `
          }} />

          {/* Baseboard */}
          <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-12" style={{
            background: `
              linear-gradient(180deg,
                rgba(180,160,140,0.4) 0%,
                rgba(160,140,120,0.6) 40%,
                rgba(140,120,100,0.8) 100%
              )
            `,
            boxShadow: "0 -2px 8px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.2)"
          }} />

          {/* Corner shadows for depth */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `
              radial-gradient(ellipse 100% 100% at 0% 0%, rgba(0,0,0,0.15), transparent 30%),
              radial-gradient(ellipse 100% 100% at 100% 0%, rgba(0,0,0,0.15), transparent 30%),
              radial-gradient(ellipse 100% 80% at 0% 100%, rgba(0,0,0,0.2), transparent 25%),
              radial-gradient(ellipse 100% 80% at 100% 100%, rgba(0,0,0,0.2), transparent 25%)
            `
          }} />

          {/* Soft vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.12) 100%)`
          }} />

          {/* Window light from left side - subtle natural light */}
          <div className="absolute left-0 top-0 bottom-0 w-1/3 pointer-events-none" style={{
            background: `
              radial-gradient(ellipse 60% 80% at 0% 30%, 
                rgba(255,250,235,0.15), 
                rgba(255,248,230,0.08) 40%, 
                transparent 70%
              )
            `,
            filter: "blur(50px)"
          }} />

          {/* Soft warm lamp glow from top right */}
          <div className="absolute right-0 top-0 w-1/4 h-1/3 pointer-events-none" style={{
            background: `
              radial-gradient(ellipse 80% 70% at 100% 0%, 
                rgba(255,240,200,0.2), 
                rgba(255,235,190,0.1) 50%, 
                transparent 80%
              )
            `,
            filter: "blur(60px)"
          }} />

          {/* Ambient dust particles floating in light - client-only to avoid hydration errors */}
          {isMounted && [...Array(8)].map((_, i) => {
            const startX = Math.random() * window.innerWidth;
            const startY = Math.random() * window.innerHeight;
            const endY = startY - 100;
            const endX = startX + (Math.random() - 0.5) * 50;
            const width = 2 + Math.random() * 3;
            const height = 2 + Math.random() * 3;
            const duration = 15 + Math.random() * 10;
            
            return (
              <motion.div
                key={`dust-${i}`}
                className="absolute rounded-full pointer-events-none"
                initial={{
                  x: startX,
                  y: startY,
                  opacity: 0
                }}
                animate={{
                  y: [startY, endY],
                  x: [startX, endX],
                  opacity: [0, 0.15, 0.25, 0.15, 0]
                }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  delay: i * 2,
                  ease: "linear"
                }}
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  background: "rgba(255,255,255,0.6)",
                  boxShadow: "0 0 4px rgba(255,255,255,0.4)",
                  filter: "blur(1px)"
                }}
              />
            );
          })}

          {/* Subtle light rays through window */}
          <div className="absolute left-0 top-1/4 w-1/2 h-1/2 pointer-events-none opacity-30" style={{
            background: `
              linear-gradient(105deg, 
                rgba(255,250,235,0.15) 0%, 
                transparent 30%
              )
            `,
            filter: "blur(30px)",
            transform: "skewY(-10deg)"
          }} />
          
          {/* Album Poster 1 - Top Left */}
          <div className="absolute left-4 sm:left-8 top-20 sm:top-20 w-14 sm:w-24 h-14 sm:h-24 transform -rotate-2">
            {/* Poster shadow on wall */}
            <div className="absolute inset-0 bg-black/20 rounded-sm transform translate-x-1 translate-y-1 blur-sm"></div>
            {/* Poster frame */}
            <div className="relative bg-white p-1 sm:p-2 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-gray-200">
              <img 
                src="https://cdn-images.dzcdn.net/images/cover/967ac8605268db88a1e597394115365d/0x1900-000000-80-0-0.jpg"
                alt="Album Cover"
                className="w-full h-full object-cover rounded-sm"
              />
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-sm"></div>
              {/* Poster pin/tack */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full shadow-sm border border-red-600"></div>
            </div>
          </div>
          
          {/* Album Poster 2 - Top Right */}
          <div className="absolute right-4 sm:right-8 top-32 sm:top-24 w-12 sm:w-20 h-12 sm:h-20 transform rotate-3">
            {/* Poster shadow on wall */}
            <div className="absolute inset-0 bg-black/20 rounded-sm transform translate-x-1 translate-y-1 blur-sm"></div>
            {/* Poster frame */}
            <div className="relative bg-white p-1 sm:p-2 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-gray-200">
              <img 
                src="https://cdn-images.dzcdn.net/images/cover/a9d9bda18a953e9ae74e2af5d3d45610/0x1900-000000-80-0-0.jpg"
                alt="Album Cover"
                className="w-full h-full object-cover rounded-sm"
              />
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-sm"></div>
              {/* Poster pin/tack */}
              <div className="absolute -top-1 right-1/4 w-2 h-2 bg-blue-500 rounded-full shadow-sm border border-blue-600"></div>
            </div>
          </div>
          
          {/* Album Poster 3 - Bottom Left */}
          <div className="absolute left-2 sm:left-6 bottom-16 sm:bottom-20 w-18 sm:w-28 h-18 sm:h-28 transform rotate-2">
            {/* Poster shadow on wall */}
            <div className="absolute inset-0 bg-black/20 rounded-sm transform translate-x-1 translate-y-1 blur-sm"></div>
            {/* Poster frame */}
            <div className="relative bg-white p-1 sm:p-2 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-gray-200">
              <img 
                src="https://i.scdn.co/image/ab67616d0000b2739293c743fa542094336c5e12"
                alt="Album Cover"
                className="w-full h-full object-cover rounded-sm"
              />
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-sm"></div>
              {/* Poster pins/tacks - two for larger poster */}
              <div className="absolute -top-1 left-1/4 w-2 h-2 bg-green-500 rounded-full shadow-sm border border-green-600"></div>
              <div className="absolute -top-1 right-1/4 w-2 h-2 bg-yellow-500 rounded-full shadow-sm border border-yellow-600"></div>
            </div>
          </div>
          
          {/* Album Poster 4 - Bottom Right */}
          <div className="absolute right-2 sm:right-6 bottom-20 sm:bottom-24 w-16 sm:w-24 h-16 sm:h-24 transform -rotate-1">
            {/* Poster shadow on wall */}
            <div className="absolute inset-0 bg-black/20 rounded-sm transform translate-x-1 translate-y-1 blur-sm"></div>
            {/* Poster frame */}
            <div className="relative bg-white p-1 sm:p-2 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-gray-200">
              <img 
                src="https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png"
                alt="Radiohead OK Computer"
                className="w-full h-full object-cover rounded-sm"
              />
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-sm"></div>
              {/* Poster pin/tack */}
              <div className="absolute -top-1 left-1/3 w-2 h-2 bg-purple-500 rounded-full shadow-sm border border-purple-600"></div>
            </div>
          </div>
        </div>
      )}
      {/* Cloud Journey Experience */}
      <AnimatePresence>
        {cloudPhase !== 'none' && (
          <>
            {/* Phase 1: Screen fills with clouds - Enhanced dreamy version */}
            {cloudPhase === 'filling' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
                style={{
                  background: `
                    radial-gradient(ellipse 1400px 1000px at 50% 50%, rgba(240,248,255,0.95), rgba(230,240,255,0.85) 40%, rgba(220,235,255,0.7) 70%, rgba(200,220,240,0.4)),
                    radial-gradient(ellipse 1000px 700px at 20% 30%, rgba(255,250,250,0.9), rgba(245,245,255,0.6) 60%, transparent),
                    radial-gradient(ellipse 1100px 800px at 80% 70%, rgba(250,250,255,0.85), rgba(240,245,255,0.5) 60%, transparent),
                    linear-gradient(135deg, rgba(173,216,230,0.4) 0%, rgba(176,224,230,0.5) 30%, rgba(240,248,255,0.7) 70%, rgba(255,255,255,0.8) 100%)
                  `,
                  backdropFilter: "blur(0px)"
                }}
              >
                {/* Atmospheric glow effects */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0.4] }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                  className="absolute inset-0"
                  style={{
                    background: `
                      radial-gradient(circle at 50% 40%, rgba(255,255,255,0.8), transparent 50%),
                      radial-gradient(circle at 30% 60%, rgba(173,216,230,0.3), transparent 40%),
                      radial-gradient(circle at 70% 50%, rgba(176,224,230,0.3), transparent 40%)
                    `,
                    filter: "blur(60px)"
                  }}
                />

                {/* Large billowing clouds - background layer */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 6)].map((_, i) => (
                  <motion.div
                    key={`bg-cloud-${i}`}
                    initial={{ 
                      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      scale: [0, 2 + Math.random() * 2, 2.2 + Math.random() * 1.5],
                      opacity: [0, 0.4, 0.5, 0.45],
                      y: [
                        Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                        Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800) - 30
                      ]
                    }}
                    transition={{ 
                      delay: i * 0.08,
                      duration: 2.5 + Math.random() * 1.5,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="absolute"
                    style={{
                      width: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 120 + Math.random() * 100 : 180 + Math.random() * 150}px`,
                      height: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 60 + Math.random() * 50 : 90 + Math.random() * 80}px`,
                      borderRadius: "50%",
                      background: `
                        radial-gradient(ellipse 100% 60% at 40% 40%, rgba(255,255,255,0.95), rgba(255,255,255,0.7) 50%, rgba(245,250,255,0.3) 75%, transparent),
                        radial-gradient(ellipse 80% 50% at 60% 50%, rgba(250,252,255,0.8), transparent 70%)
                      `,
                      filter: "blur(4px)",
                      boxShadow: "0 10px 40px rgba(173,216,230,0.3)"
                    }}
                  />
                ))}

                {/* Medium clouds - middle layer with more detail */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 3 : 10)].map((_, i) => (
                  <motion.div
                    key={`mid-cloud-${i}`}
                    initial={{ 
                      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      scale: [0, 1.5 + Math.random() * 1.5, 1.8 + Math.random()],
                      opacity: [0, 0.6, 0.7, 0.65],
                      rotate: [0, (Math.random() - 0.5) * 10]
                    }}
                    transition={{ 
                      delay: i * 0.06,
                      duration: 2 + Math.random() * 1.5,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="absolute"
                    style={{
                      width: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 80 + Math.random() * 70 : 100 + Math.random() * 100}px`,
                      height: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 40 + Math.random() * 35 : 50 + Math.random() * 50}px`,
                      borderRadius: "50%",
                      background: `
                        radial-gradient(ellipse 100% 60% at 35% 35%, rgba(255,255,255,1), rgba(255,255,255,0.85) 45%, rgba(240,248,255,0.5) 70%, transparent),
                        radial-gradient(ellipse 70% 50% at 65% 45%, rgba(250,252,255,0.9), rgba(245,250,255,0.4) 60%, transparent)
                      `,
                      filter: "blur(4px)",
                      boxShadow: "0 8px 25px rgba(173,216,230,0.25), inset -5px -5px 15px rgba(173,216,230,0.15)"
                    }}
                  />
                ))}

                {/* Foreground wispy clouds */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 8)].map((_, i) => (
                  <motion.div
                    key={`fg-cloud-${i}`}
                    initial={{ 
                      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      scale: [0, 1 + Math.random(), 1.2 + Math.random() * 0.8],
                      opacity: [0, 0.7, 0.8, 0.75],
                      x: [
                        Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                        Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200) + (Math.random() - 0.5) * 50
                      ]
                    }}
                    transition={{ 
                      delay: i * 0.04,
                      duration: 1.8 + Math.random(),
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="absolute"
                    style={{
                      width: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 50 + Math.random() * 50 : 70 + Math.random() * 70}px`,
                      height: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 25 + Math.random() * 25 : 35 + Math.random() * 35}px`,
                      borderRadius: "50%",
                      background: `
                        radial-gradient(ellipse 100% 60% at 50% 50%, rgba(255,255,255,0.98), rgba(255,255,255,0.75) 50%, rgba(250,252,255,0.4) 75%, transparent)
                      `,
                      filter: "blur(2px)",
                      boxShadow: "0 5px 20px rgba(255,255,255,0.5)"
                    }}
                  />
                ))}

                {/* Dreamy bokeh light particles */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 6)].map((_, i) => (
                  <motion.div
                    key={`bokeh-${i}`}
                    initial={{ 
                      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      scale: [0, 0.5 + Math.random() * 0.5],
                      opacity: [0, 0.3, 0.5, 0.3, 0.4],
                      y: [
                        Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                        Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800) - 20
                      ]
                    }}
                    transition={{ 
                      delay: i * 0.1,
                      duration: 3 + Math.random() * 2,
                      ease: "easeInOut"
                    }}
                    className="absolute rounded-full"
                    style={{
                      width: `${20 + Math.random() * 30}px`,
                      height: `${20 + Math.random() * 30}px`,
                      background: `radial-gradient(circle, rgba(255,255,255,0.8), rgba(240,248,255,0.4) 50%, transparent)`,
                      filter: "blur(8px)"
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Phase 2: Traveling through clouds - Enhanced dreamy tunnel */}
            {cloudPhase === 'traveling' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
                style={{
                  background: `
                    radial-gradient(ellipse 120% 100% at 50% 50%, rgba(248,252,255,0.98), rgba(240,248,255,0.95) 40%, rgba(230,242,255,0.92) 70%, rgba(220,235,250,0.9)),
                    linear-gradient(180deg, rgba(173,216,230,0.15) 0%, rgba(176,224,230,0.1) 50%, rgba(173,216,230,0.15) 100%)
                  `
                }}
              >
                {/* Central bright glow - dream portal effect */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 0.8, 0.6],
                    scale: [0, 1.5, 1.2]
                  }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(240,248,255,0.6) 30%, rgba(173,216,230,0.3) 50%, transparent 70%)',
                    filter: 'blur(80px)'
                  }}
                />

                {/* Sweeping cloud waves - horizontal layers */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 3 : 10)].map((_, i) => {
                  const layer = Math.floor(i / 8);
                  const speed = 3 + layer * 0.8;
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                  const baseSize = isMobile ? 80 : 120;
                  const size = baseSize + layer * 30 + Math.random() * 40;
                  const yPos = Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800);
                  
                  return (
                    <motion.div
                      key={`horizontal-${i}`}
                      initial={{ 
                        x: -300,
                        y: yPos,
                        scale: 0.3,
                        opacity: 0
                      }}
                      animate={{ 
                        x: (typeof window !== 'undefined' ? window.innerWidth : 1200) + 300,
                        scale: [0.3, 2.5, 1.8, 0.3],
                        opacity: [0, 0.5, 0.7, 0.5, 0]
                      }}
                      transition={{ 
                        duration: speed,
                        delay: (i % 8) * 0.15,
                        repeat: Infinity,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      className="absolute"
                      style={{
                        width: `${size}px`,
                        height: `${size * 0.5}px`,
                        borderRadius: '50%',
                        background: `
                          radial-gradient(ellipse 100% 60% at 45% 45%, rgba(255,255,255,0.95), rgba(255,255,255,0.75) 40%, rgba(240,248,255,0.4) 65%, transparent),
                          radial-gradient(ellipse 80% 50% at 55% 50%, rgba(250,252,255,0.85), transparent 70%)
                        `,
                        filter: `blur(${3 + layer * 1.5}px)`,
                        boxShadow: '0 10px 40px rgba(173,216,230,0.3)'
                      }}
                    />
                  );
                })}

                {/* Diagonal flowing clouds */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 8)].map((_, i) => {
                  const speed = 4 + Math.random() * 2;
                  const startX = Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200);
                  const startY = -150;
                  const endX = startX + (Math.random() - 0.5) * 300;
                  const endY = (typeof window !== 'undefined' ? window.innerHeight : 800) + 150;
                  
                  return (
                    <motion.div
                      key={`diagonal-${i}`}
                      initial={{ 
                        x: startX,
                        y: startY,
                        scale: 0.5,
                        opacity: 0
                      }}
                      animate={{ 
                        x: endX,
                        y: endY,
                        scale: [0.5, 2, 1.5, 0.5],
                        opacity: [0, 0.6, 0.7, 0]
                      }}
                      transition={{ 
                        duration: speed,
                        delay: i * 0.12,
                        repeat: Infinity,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      className="absolute"
                      style={{
                        width: `${60 + Math.random() * 80}px`,
                        height: `${30 + Math.random() * 40}px`,
                        borderRadius: '50%',
                        background: `
                          radial-gradient(ellipse 100% 60% at 50% 50%, rgba(255,255,255,0.9), rgba(255,255,255,0.6) 50%, rgba(245,250,255,0.3) 70%, transparent)
                        `,
                        filter: 'blur(5px)',
                        boxShadow: '0 8px 30px rgba(255,255,255,0.4)'
                      }}
                    />
                  );
                })}

                {/* Radial expanding clouds - depth effect */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 6)].map((_, i) => (
                  <motion.div
                    key={`radial-${i}`}
                    initial={{ 
                      x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2,
                      y: (typeof window !== 'undefined' ? window.innerHeight : 800) / 2,
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 + (Math.random() - 0.5) * 800,
                      y: (typeof window !== 'undefined' ? window.innerHeight : 800) / 2 + (Math.random() - 0.5) * 600,
                      scale: [0, 4, 3],
                      opacity: [0, 0.4, 0.5, 0]
                    }}
                    transition={{ 
                      duration: 3 + Math.random() * 2,
                      delay: i * 0.2,
                      repeat: Infinity,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="absolute"
                    style={{
                      width: `${100 + Math.random() * 100}px`,
                      height: `${50 + Math.random() * 50}px`,
                      borderRadius: '50%',
                      background: `radial-gradient(ellipse 100% 60% at 50% 50%, rgba(255,255,255,0.85), rgba(245,250,255,0.5) 50%, transparent 75%)`,
                      filter: 'blur(10px)'
                    }}
                  />
                ))}

                {/* Light ray streaks */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 5)].map((_, i) => (
                  <motion.div
                    key={`ray-${i}`}
                    initial={{ 
                      opacity: 0,
                      scaleX: 0
                    }}
                    animate={{ 
                      opacity: [0, 0.15, 0.25, 0.15, 0],
                      scaleX: [0, 1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2.5 + Math.random(),
                      delay: i * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute left-1/2 top-1/2 origin-left"
                    style={{
                      width: '800px',
                      height: '3px',
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(240,248,255,0.4) 50%, transparent)',
                      transform: `translateY(-50%) rotate(${(i * 360) / 10}deg)`,
                      filter: 'blur(2px)'
                    }}
                  />
                ))}

                {/* Dreamy particles */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 25)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ 
                      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      scale: [0, 0.6 + Math.random() * 0.4],
                      opacity: [0, 0.4, 0.6, 0.4, 0.5],
                      x: [
                        Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                        Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)
                      ],
                      y: [
                        Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                        Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)
                      ]
                    }}
                    transition={{ 
                      duration: 4 + Math.random() * 2,
                      delay: i * 0.08,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute rounded-full"
                    style={{
                      width: `${15 + Math.random() * 25}px`,
                      height: `${15 + Math.random() * 25}px`,
                      background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(240,248,255,0.5) 50%, transparent)',
                      filter: 'blur(6px)'
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Phase 3: New world emerges - Gentle cloud dispersal */}
            {cloudPhase === 'newWorld' && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-40 pointer-events-none overflow-hidden"
                style={{
                  background: `
                    radial-gradient(ellipse 1400px 1000px at 50% 50%, rgba(250,252,255,0.95), rgba(240,248,255,0.75) 40%, rgba(230,242,255,0.5) 65%, rgba(220,235,250,0.2) 85%, transparent)
                  `
                }}
              >
                {/* Soft glowing backdrop fade */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute inset-0"
                  style={{
                    background: `
                      radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7), rgba(240,248,255,0.4) 40%, transparent 70%),
                      radial-gradient(circle at 30% 40%, rgba(173,216,230,0.2), transparent 50%),
                      radial-gradient(circle at 70% 60%, rgba(176,224,230,0.2), transparent 50%)
                    `,
                    filter: 'blur(100px)'
                  }}
                />

                {/* Large billowing dispersing clouds */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 10 : 18)].map((_, i) => {
                  const angle = (i * 360) / 18;
                  const distance = 600 + Math.random() * 400;
                  const endX = (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 + Math.cos(angle * Math.PI / 180) * distance;
                  const endY = (typeof window !== 'undefined' ? window.innerHeight : 800) / 2 + Math.sin(angle * Math.PI / 180) * distance;
                  
                  return (
                    <motion.div
                      key={`disperse-${i}`}
                      initial={{ 
                        x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2,
                        y: (typeof window !== 'undefined' ? window.innerHeight : 800) / 2,
                        scale: 1.5,
                        opacity: 0.8
                      }}
                      animate={{ 
                        x: endX,
                        y: endY,
                        scale: [1.5, 2.5, 3, 0],
                        opacity: [0.8, 0.6, 0.3, 0]
                      }}
                      transition={{ 
                        duration: 3.5 + Math.random() * 1.5,
                        delay: i * 0.08,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      className="absolute"
                      style={{
                        width: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 100 + Math.random() * 80 : 150 + Math.random() * 120}px`,
                        height: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 50 + Math.random() * 40 : 75 + Math.random() * 60}px`,
                        borderRadius: '50%',
                        background: `
                          radial-gradient(ellipse 100% 60% at 40% 40%, rgba(255,255,255,0.95), rgba(255,255,255,0.7) 45%, rgba(240,248,255,0.4) 70%, transparent),
                          radial-gradient(ellipse 80% 50% at 60% 50%, rgba(250,252,255,0.85), transparent 70%)
                        `,
                        filter: 'blur(8px)',
                        boxShadow: '0 10px 50px rgba(173,216,230,0.25)'
                      }}
                    />
                  );
                })}

                {/* Medium swirling clouds */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 25)].map((_, i) => {
                  const spiralAngle = i * 45;
                  const spiralRadius = 200 + i * 30;
                  const endX = (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 + Math.cos(spiralAngle * Math.PI / 180) * spiralRadius;
                  const endY = (typeof window !== 'undefined' ? window.innerHeight : 800) / 2 + Math.sin(spiralAngle * Math.PI / 180) * spiralRadius;
                  
                  return (
                    <motion.div
                      key={`swirl-${i}`}
                      initial={{ 
                        x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2,
                        y: (typeof window !== 'undefined' ? window.innerHeight : 800) / 2,
                        scale: 1,
                        opacity: 0.7,
                        rotate: 0
                      }}
                      animate={{ 
                        x: endX,
                        y: endY,
                        scale: [1, 2, 2.5, 0],
                        opacity: [0.7, 0.5, 0.3, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 3 + Math.random(),
                        delay: i * 0.06,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      className="absolute"
                      style={{
                        width: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 60 + Math.random() * 50 : 80 + Math.random() * 70}px`,
                        height: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 30 + Math.random() * 25 : 40 + Math.random() * 35}px`,
                        borderRadius: '50%',
                        background: `
                          radial-gradient(ellipse 100% 60% at 50% 50%, rgba(255,255,255,0.9), rgba(255,255,255,0.65) 50%, rgba(245,250,255,0.3) 75%, transparent)
                        `,
                        filter: 'blur(5px)',
                        boxShadow: '0 8px 30px rgba(255,255,255,0.3)'
                      }}
                    />
                  );
                })}

                {/* Wispy trailing clouds */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 15 : 30)].map((_, i) => (
                  <motion.div
                    key={`wispy-${i}`}
                    initial={{ 
                      x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 + (Math.random() - 0.5) * 200,
                      y: (typeof window !== 'undefined' ? window.innerHeight : 800) / 2 + (Math.random() - 0.5) * 200,
                      scale: 0.8,
                      opacity: 0.6
                    }}
                    animate={{ 
                      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                      scale: [0.8, 1.5, 2, 0],
                      opacity: [0.6, 0.4, 0.2, 0]
                    }}
                    transition={{ 
                      duration: 2.5 + Math.random() * 1.5,
                      delay: i * 0.05,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="absolute"
                    style={{
                      width: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 40 + Math.random() * 40 : 60 + Math.random() * 60}px`,
                      height: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 20 + Math.random() * 20 : 30 + Math.random() * 30}px`,
                      borderRadius: '50%',
                      background: `radial-gradient(ellipse 100% 60% at 50% 50%, rgba(255,255,255,0.85), rgba(250,252,255,0.5) 50%, transparent 75%)`,
                      filter: 'blur(4px)'
                    }}
                  />
                ))}

                {/* Floating light particles fading away */}
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 15 : 30)].map((_, i) => (
                  <motion.div
                    key={`light-${i}`}
                    initial={{ 
                      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                      scale: 0.5,
                      opacity: 0.5
                    }}
                    animate={{ 
                      y: [
                        Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                        -100
                      ],
                      scale: [0.5, 0.8, 0],
                      opacity: [0.5, 0.3, 0]
                    }}
                    transition={{ 
                      duration: 3 + Math.random() * 1.5,
                      delay: i * 0.04,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="absolute rounded-full"
                    style={{
                      width: `${10 + Math.random() * 20}px`,
                      height: `${10 + Math.random() * 20}px`,
                      background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(240,248,255,0.4) 50%, transparent)',
                      filter: 'blur(6px)'
                    }}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* New World Scene - appears after cloud journey */}
      <AnimatePresence>
        {cloudPhase === 'newWorld' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ delay: 1.5, duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-30 flex items-center justify-center overflow-hidden"
          >
            {/* Realistic room environment background */}
            <div className="absolute inset-0">
              {/* Wall with warm cream texture */}
              <div className="absolute inset-0" style={{
                background: `
                  linear-gradient(180deg, 
                    rgba(250,245,235,1) 0%,
                    rgba(245,238,225,1) 30%,
                    rgba(240,232,218,1) 60%,
                    rgba(235,228,215,1) 100%
                  )
                `
              }}>
                {/* Wall texture - subtle plaster effect */}
                <div className="absolute inset-0 opacity-50" style={{
                  backgroundImage: `
                    repeating-linear-gradient(0deg, transparent 0px, rgba(0,0,0,0.008) 1px, transparent 2px),
                    repeating-linear-gradient(90deg, transparent 0px, rgba(0,0,0,0.008) 1px, transparent 2px),
                    repeating-linear-gradient(45deg, transparent 0px, rgba(0,0,0,0.005) 1px, transparent 3px)
                  `,
                  filter: "blur(0.3px)"
                }} />
                
                {/* Wall color variations and aging */}
                <div className="absolute inset-0 opacity-15" style={{
                  background: `
                    radial-gradient(circle at 25% 35%, rgba(220,200,170,0.4), transparent 45%),
                    radial-gradient(circle at 75% 55%, rgba(230,210,185,0.3), transparent 40%),
                    radial-gradient(circle at 50% 75%, rgba(225,205,180,0.35), transparent 50%)
                  `,
                  filter: "blur(70px)"
                }} />
              </div>

              {/* Warm overhead lighting effect */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.5] }}
                transition={{ delay: 2, duration: 3, ease: "easeInOut" }}
                className="absolute top-0 left-0 right-0 h-2/5" 
                style={{
                  background: `
                    radial-gradient(ellipse 85% 60% at 50% 0%, 
                      rgba(255,248,230,0.8), 
                      rgba(255,245,220,0.5) 40%, 
                      transparent 70%
                    )
                  `,
                  filter: "blur(50px)"
                }} 
              />

              {/* Side window light from left */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0.3] }}
                transition={{ delay: 2.5, duration: 3, ease: "easeInOut" }}
                className="absolute left-0 top-0 bottom-0 w-2/5" 
                style={{
                  background: `
                    radial-gradient(ellipse 70% 85% at 0% 35%, 
                      rgba(255,252,240,0.6), 
                      rgba(255,250,235,0.35) 45%, 
                      transparent 75%
                    )
                  `,
                  filter: "blur(60px)"
                }} 
              />

              {/* Wooden floor with perspective */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{
                background: `
                  linear-gradient(180deg,
                    transparent 0%,
                    rgba(101,67,33,0.08) 30%,
                    rgba(85,56,28,0.15) 60%,
                    rgba(70,46,23,0.25) 100%
                  )
                `
              }}>
                {/* Wood planks texture */}
                <div className="absolute inset-0 opacity-40" style={{
                  background: `
                    repeating-linear-gradient(90deg,
                      rgba(101,67,33,0.12) 0px,
                      rgba(101,67,33,0.08) 2px,
                      transparent 3px,
                      transparent 100px,
                      rgba(85,56,28,0.1) 100px,
                      transparent 102px,
                      transparent 200px
                    )
                  `
                }} />

                {/* Floor highlight in center */}
                <div className="absolute inset-x-0 top-0 h-1/3" style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)"
                }} />
              </div>

              {/* Baseboard molding */}
              <div className="absolute bottom-0 left-0 right-0 h-10 sm:h-14" style={{
                background: `
                  linear-gradient(180deg,
                    rgba(190,170,145,0.5) 0%,
                    rgba(170,150,130,0.65) 40%,
                    rgba(150,130,110,0.8) 100%
                  )
                `,
                boxShadow: "0 -3px 10px rgba(0,0,0,0.15), inset 0 2px 3px rgba(255,255,255,0.2)"
              }} />

              {/* Corner shadows for depth */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `
                  radial-gradient(ellipse 100% 100% at 0% 0%, rgba(0,0,0,0.18), transparent 35%),
                  radial-gradient(ellipse 100% 100% at 100% 0%, rgba(0,0,0,0.18), transparent 35%),
                  radial-gradient(ellipse 100% 85% at 0% 100%, rgba(0,0,0,0.22), transparent 28%),
                  radial-gradient(ellipse 100% 85% at 100% 100%, rgba(0,0,0,0.22), transparent 28%)
                `
              }} />

              {/* Soft vignette */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(ellipse 65% 55% at 50% 45%, transparent 35%, rgba(0,0,0,0.15) 100%)`
              }} />

              {/* Ambient particles of light/dust */}
              {isMounted && [...Array(12)].map((_, i) => {
                const startX = Math.random() * window.innerWidth;
                const startY = Math.random() * window.innerHeight * 0.6;
                const endY = startY - 80;
                const size = 2 + Math.random() * 3;
                
                return (
                  <motion.div
                    key={`ambient-dust-${i}`}
                    initial={{ x: startX, y: startY, opacity: 0 }}
                    animate={{
                      y: [startY, endY, startY],
                      opacity: [0, 0.2, 0.35, 0.2, 0]
                    }}
                    transition={{
                      duration: 20 + Math.random() * 15,
                      repeat: Infinity,
                      delay: i * 1.5 + 2,
                      ease: "linear"
                    }}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      background: "rgba(255,250,235,0.8)",
                      boxShadow: "0 0 6px rgba(255,245,220,0.5)",
                      filter: "blur(1px)"
                    }}
                  />
                );
              })}
            </div>

            {/* Window light rays */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.25, 0.15] }}
              transition={{ delay: 2.8, duration: 3, ease: "easeInOut" }}
              className="absolute left-0 top-1/4 w-1/2 h-1/2 pointer-events-none" 
              style={{
                background: `
                  linear-gradient(105deg, 
                    rgba(255,252,240,0.25) 0%, 
                    rgba(255,250,235,0.12) 20%,
                    transparent 40%
                  )
                `,
                filter: "blur(40px)",
                transform: "skewY(-8deg)"
              }}
            />

            {/* Framed picture/poster on left wall */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-8 sm:left-16 top-20 sm:top-24 w-20 sm:w-32 h-24 sm:h-40 transform -rotate-2"
              style={{ zIndex: 10 }}
            >
              {/* Frame shadow on wall */}
              <div className="absolute inset-0 bg-black/20 rounded-sm transform translate-x-1 translate-y-2 blur-md" />
              {/* Frame */}
              <div className="relative bg-gradient-to-br from-amber-900 to-amber-950 p-1 sm:p-2 rounded-sm shadow-[0_6px_20px_rgba(0,0,0,0.35)] border border-amber-950">
                {/* Picture content - abstract art */}
                <div className="w-full h-full rounded-sm overflow-hidden" style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(210,180,140,1) 0%,
                      rgba(188,143,143,1) 30%,
                      rgba(205,133,63,1) 60%,
                      rgba(184,134,11,1) 100%
                    )
                  `
                }}>
                  {/* Abstract shapes */}
                  <div className="absolute inset-0 opacity-60" style={{
                    background: `
                      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 40%),
                      radial-gradient(circle at 70% 70%, rgba(139,69,19,0.4), transparent 50%)
                    `
                  }} />
                </div>
                {/* Glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent rounded-sm" />
              </div>
            </motion.div>

            {/* Framed picture on right wall */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.2, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-8 sm:right-16 top-32 sm:top-28 w-16 sm:w-28 h-20 sm:h-36 transform rotate-1"
              style={{ zIndex: 10 }}
            >
              {/* Frame shadow */}
              <div className="absolute inset-0 bg-black/20 rounded-sm transform translate-x-1 translate-y-2 blur-md" />
              {/* Frame */}
              <div className="relative bg-gradient-to-br from-amber-800 to-amber-950 p-1 sm:p-2 rounded-sm shadow-[0_6px_20px_rgba(0,0,0,0.35)] border border-amber-900">
                {/* Picture content */}
                <div className="w-full h-full rounded-sm" style={{
                  background: `
                    linear-gradient(45deg, 
                      rgba(245,222,179,1) 0%,
                      rgba(222,184,135,1) 50%,
                      rgba(210,180,140,1) 100%
                    )
                  `
                }}>
                  <div className="absolute inset-0 opacity-50" style={{
                    background: `
                      radial-gradient(circle at 40% 40%, rgba(255,255,255,0.4), transparent 35%),
                      radial-gradient(circle at 60% 60%, rgba(139,69,19,0.3), transparent 45%)
                    `
                  }} />
                </div>
                {/* Glass reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent rounded-sm" />
              </div>
            </motion.div>

            {/* Plant silhouette in corner */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.5, duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-10 sm:bottom-14 left-4 sm:left-8 w-16 sm:w-24 h-32 sm:h-48"
              style={{ zIndex: 5 }}
            >
              {/* Pot */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-16 h-12 sm:h-16 rounded-b-lg" style={{
                background: "linear-gradient(180deg, rgba(139,90,43,0.7) 0%, rgba(101,67,33,0.8) 100%)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)"
              }}>
                {/* Pot rim */}
                <div className="absolute -top-1 left-0 right-0 h-2 rounded-t-lg" style={{
                  background: "linear-gradient(180deg, rgba(160,110,70,0.8) 0%, rgba(139,90,43,0.8) 100%)"
                }} />
              </div>
              {/* Plant leaves - simple shapes */}
              <div className="absolute bottom-10 sm:bottom-14 left-1/2 -translate-x-1/2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${12 + i * 3}px`,
                      height: `${20 + i * 5}px`,
                      background: `rgba(${85 - i * 5},${107 + i * 8},${47 + i * 3},${0.6 - i * 0.05})`,
                      transform: `rotate(${-30 + i * 15}deg) translateY(${-i * 8}px)`,
                      left: `${-10 + i * 5}px`,
                      filter: "blur(1px)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Furniture shadow suggestion bottom right */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ delay: 3.3, duration: 2, ease: "easeInOut" }}
              className="absolute bottom-0 right-0 w-1/4 h-1/5 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 100% 80% at 80% 100%, rgba(0,0,0,0.3), transparent 60%)",
                filter: "blur(20px)"
              }}
            />

            {/* Wooden shelf 1 - top right */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-12 sm:right-0 bottom-130 sm:bottom-30 w-32 sm:w-48 h-3 sm:h-4 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(139,111,71,1), rgba(107,87,57,1) 50%, rgba(74,55,40,1))',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.1)',
                borderRadius: '4px',
                zIndex: 15
              }}
            />

            {/* Orange Tabby Cat on top shelf */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 4.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-16 sm:right-28 top-42 sm:top-32 pointer-events-none"
              style={{ zIndex: 16 }}
            >
              <div className="relative" style={{ width: '56px', height: '50px' }}>
                {/* Cat shadow */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30 rounded-full blur-md" />
                
                {/* Cat body */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-13 h-8 rounded-full" style={{
                  background: 'linear-gradient(135deg, rgba(212,145,80,1) 0%, rgba(190,120,60,1) 50%, rgba(170,100,50,1) 100%)',
                  boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.2)'
                }}>
                  {/* Fur stripes */}
                  <div className="absolute top-1 left-2 w-1.5 h-4 bg-black/25 rounded-full blur-[0.5px]" />
                  <div className="absolute top-1 right-2 w-1.5 h-4 bg-black/25 rounded-full blur-[0.5px]" />
                  <div className="absolute top-2 left-5 w-1 h-3 bg-black/20 rounded-full blur-[0.5px]" />
                </div>
                
                {/* Cat head */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-9 rounded-full" style={{
                  background: 'radial-gradient(circle at 40% 40%, rgba(220,155,90,1), rgba(200,135,70,1) 60%, rgba(180,115,55,1))',
                  boxShadow: 'inset 0 -1px 3px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.2)'
                }}>
                  {/* Left ear */}
                  <div className="absolute -top-2 left-1.5 w-4 h-4 rounded-full" style={{
                    background: 'linear-gradient(135deg, rgba(210,145,75,1), rgba(190,125,60,1))',
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    transform: 'rotate(-10deg)',
                    boxShadow: 'inset -1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pink-200/60" />
                  </div>
                  
                  {/* Right ear */}
                  <div className="absolute -top-2 right-1.5 w-4 h-4 rounded-full" style={{
                    background: 'linear-gradient(-135deg, rgba(210,145,75,1), rgba(190,125,60,1))',
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    transform: 'rotate(10deg)',
                    boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pink-200/60" />
                  </div>
                  
                  {/* Left eye */}
                  <div className="absolute top-2.5 left-2 w-2.5 h-3 rounded-full bg-amber-200" style={{
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                  }}>
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-2.5 rounded-full bg-black" />
                    <div className="absolute top-1 left-1.5 w-0.5 h-0.5 rounded-full bg-white/90" />
                  </div>
                  
                  {/* Right eye */}
                  <div className="absolute top-2.5 right-2 w-2.5 h-3 rounded-full bg-amber-200" style={{
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                  }}>
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-2.5 rounded-full bg-black" />
                    <div className="absolute top-1 left-0.5 w-0.5 h-0.5 rounded-full bg-white/90" />
                  </div>
                  
                  {/* Nose */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-2 h-1.5 rounded-full bg-pink-400" style={{
                    boxShadow: 'inset 0 0.5px 1px rgba(0,0,0,0.3)'
                  }} />
                  
                  {/* Mouth */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2.5 h-0.5 rounded-full" style={{
                    borderBottom: '1px solid rgba(0,0,0,0.3)',
                    borderRadius: '0 0 50% 50%'
                  }} />
                  
                  {/* Whiskers */}
                  <div className="absolute top-4 -left-1.5 w-5 h-px bg-gray-800/50" style={{ transform: 'rotate(-5deg)' }} />
                  <div className="absolute top-5 -left-1.5 w-5 h-px bg-gray-800/50" style={{ transform: 'rotate(5deg)' }} />
                  <div className="absolute top-4 -right-1.5 w-5 h-px bg-gray-800/50" style={{ transform: 'rotate(5deg)' }} />
                  <div className="absolute top-5 -right-1.5 w-5 h-px bg-gray-800/50" style={{ transform: 'rotate(-5deg)' }} />
                </div>
                
                {/* Tail */}
                <div className="absolute bottom-2 right-0 w-7 h-2.5 rounded-full" style={{
                  background: 'linear-gradient(90deg, rgba(200,135,70,1), rgba(212,145,80,1))',
                  transform: 'rotate(-20deg) translateX(10px)',
                  boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </motion.div>

            {/* Wooden shelf 2 - bottom left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 4.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-12 sm:left-20 bottom-40 sm:bottom-48 w-32 sm:w-48 h-3 sm:h-4 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(139,111,71,1), rgba(107,87,57,1) 50%, rgba(74,55,40,1))',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.1)',
                borderRadius: '4px',
                zIndex: 15
              }}
            />

            {/* Gray Cat on bottom shelf */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 4.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-16 sm:left-28 bottom-40 sm:bottom-40 pointer-events-none"
              style={{ zIndex: 16 }}
            >
              <div className="relative" style={{ width: '60px', height: '52px' }}>
                {/* Cat shadow */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30 rounded-full blur-md" />
                
                {/* Cat body */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-9 rounded-full" style={{
                  background: 'linear-gradient(135deg, rgba(140,140,140,1) 0%, rgba(120,120,120,1) 50%, rgba(100,100,100,1) 100%)',
                  boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 3px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.2)'
                }}>
                  {/* Fur texture */}
                  <div className="absolute inset-0 rounded-full opacity-30" style={{
                    background: 'repeating-linear-gradient(45deg, transparent 0px, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)'
                  }} />
                </div>
                
                {/* Cat head */}
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-11 h-10 rounded-full" style={{
                  background: 'radial-gradient(circle at 45% 35%, rgba(155,155,155,1), rgba(130,130,130,1) 60%, rgba(110,110,110,1))',
                  boxShadow: 'inset 0 -1px 3px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3), 0 3px 6px rgba(0,0,0,0.2)'
                }}>
                  {/* White chest/chin */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-4 rounded-full bg-gray-100/80" style={{
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                  }} />
                  
                  {/* Left ear */}
                  <div className="absolute -top-2 left-1.5 w-4 h-4 rounded-full" style={{
                    background: 'linear-gradient(135deg, rgba(145,145,145,1), rgba(125,125,125,1))',
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    transform: 'rotate(-15deg)',
                    boxShadow: 'inset -1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pink-100/50" />
                  </div>
                  
                  {/* Right ear */}
                  <div className="absolute -top-2 right-1.5 w-4 h-4 rounded-full" style={{
                    background: 'linear-gradient(-135deg, rgba(145,145,145,1), rgba(125,125,125,1))',
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    transform: 'rotate(15deg)',
                    boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pink-100/50" />
                  </div>
                  
                  {/* Left eye */}
                  <div className="absolute top-3 left-2 w-2.5 h-3 rounded-full bg-emerald-300" style={{
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                  }}>
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-0.5 h-2.5 rounded-full bg-black" />
                    <div className="absolute top-1 left-1.5 w-0.5 h-0.5 rounded-full bg-white/90" />
                  </div>
                  
                  {/* Right eye */}
                  <div className="absolute top-3 right-2 w-2.5 h-3 rounded-full bg-emerald-300" style={{
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                  }}>
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-0.5 h-2.5 rounded-full bg-black" />
                    <div className="absolute top-1 left-0.5 w-0.5 h-0.5 rounded-full bg-white/90" />
                  </div>
                  
                  {/* Nose */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-2 h-1.5 rounded-full bg-pink-300" style={{
                    boxShadow: 'inset 0 0.5px 1px rgba(0,0,0,0.3)'
                  }} />
                  
                  {/* Mouth */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2.5 h-0.5" style={{
                    borderBottom: '1px solid rgba(0,0,0,0.4)',
                    borderRadius: '0 0 50% 50%'
                  }} />
                  
                  {/* Whiskers */}
                  <div className="absolute top-4.5 -left-2 w-6 h-px bg-gray-200/70" style={{ transform: 'rotate(-8deg)' }} />
                  <div className="absolute top-5.5 -left-2 w-6 h-px bg-gray-200/70" style={{ transform: 'rotate(8deg)' }} />
                  <div className="absolute top-4.5 -right-2 w-6 h-px bg-gray-200/70" style={{ transform: 'rotate(8deg)' }} />
                  <div className="absolute top-5.5 -right-2 w-6 h-px bg-gray-200/70" style={{ transform: 'rotate(-8deg)' }} />
                </div>
                
                {/* Tail curled */}
                <div className="absolute bottom-3 left-0 w-8 h-2.5 rounded-full" style={{
                  background: 'linear-gradient(90deg, rgba(110,110,110,1), rgba(130,130,130,1))',
                  transform: 'rotate(25deg) translateX(-12px)',
                  boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </motion.div>

            {/* Dreamy magical atmosphere overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.25, 0.35] }}
              transition={{ delay: 2.5, duration: 3, ease: "easeInOut" }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse 75% 55% at 50% 50%, rgba(245,222,179,0.2), transparent 65%),
                  radial-gradient(ellipse 55% 35% at 30% 60%, rgba(222,184,135,0.15), transparent 60%),
                  radial-gradient(ellipse 55% 35% at 70% 40%, rgba(205,133,63,0.15), transparent 60%)
                `,
                filter: "blur(80px)"
              }}
            />
            {/* Magical floating elements - mobile optimized */}
            {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 3 : 8)].map((_, i) => {
              const shapes = ['✨', '🍂', '🦋', '💫', '🌙', '⭐', '🌰', '🕊️'];
              const shape = shapes[i % shapes.length];
              
              return (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                    scale: 0,
                    rotate: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    y: [
                      Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                      Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                      Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)
                    ],
                    x: [
                      Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                      Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)
                    ],
                    scale: [0, 1, 0.8],
                    rotate: [0, 360, 720],
                    opacity: [0, 0.8, 0.6]
                  }}
                  transition={{ 
                    delay: 3 + i * 0.12,
                    duration: 20 + Math.random() * 10,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="absolute text-xl sm:text-2xl pointer-events-none"
                  style={{
                    filter: "drop-shadow(0 0 10px rgba(245,222,179,0.8))"
                  }}
                >
                  {shape}
                </motion.div>
              );
            })}

            {/* Central content area */}
            <motion.div
              initial={{ y: 50, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: 3.5, duration: 2, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-center max-w-2xl mx-auto px-4 sm:px-6 flex flex-col justify-center min-h-screen py-8 sm:py-16"
              style={{ zIndex: 50 }}
            >
              <AnimatePresence mode="wait">
                {!showScrollMessage ? (
                  <motion.div
                    key="dream-content"
                    initial={{ scale: 0.85, opacity: 0, y: 30, filter: "blur(8px)" }}
                    animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ scale: 0.95, opacity: 0, y: -20, filter: "blur(5px)" }}
                    transition={{ 
                      duration: 1.8, 
                      ease: [0.16, 1, 0.3, 1],
                      opacity: { duration: 1.2 }
                    }}
                    className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(255,255,255,0.15) 0%, 
                          rgba(255,255,255,0.05) 50%, 
                          rgba(255,255,255,0.1) 100%
                        )
                      `
                    }}
                  >
                  <motion.h1
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 4.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 bg-clip-text text-transparent mb-4 sm:mb-6"
                    style={{
                      textShadow: "0 0 20px rgba(245,222,179,0.6)"
                    }}
                  >
                    Welcome to Your Dream
                  </motion.h1>
                  
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 5.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-base sm:text-lg md:text-xl text-amber-900 mb-6 sm:mb-8 leading-relaxed font-medium"
                  >
                    You&apos;ve journeyed through the clouds and arrived in a magical realm where dreams come alive. 
                    This is your sanctuary of imagination and wonder.
                  </motion.p>

                  <motion.div
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ delay: 6.5, duration: 1.2, type: "spring", stiffness: 80, damping: 15 }}
                    className="inline-block"
                  >
                    <button 
                      onClick={playBackToTheOldHouse}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-600 to-orange-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 text-sm sm:text-base touch-manipulation min-h-[44px]"
                    >
                      Explore This World ✨
                    </button>
                  </motion.div>
                </motion.div>
                ) : (
                  !hasScrolled && (
                    <motion.div
                      key="scroll-message"
                      initial={{ scale: 0.8, opacity: 0, y: 30 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: -20 }}
                      transition={{ 
                        duration: 1, 
                        ease: [0.25, 0.46, 0.45, 0.94],
                        delay: 0.2
                      }}
                      className="text-center"
                    >
                      <div className="inline-block bg-white/80 backdrop-blur-md px-8 py-6 rounded-3xl shadow-2xl border-4 border-amber-400">
                        <h1 
                          className="text-4xl sm:text-6xl md:text-8xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 bg-clip-text text-transparent animate-pulse"
                          style={{ 
                            textShadow: "0 4px 20px rgba(251, 191, 36, 0.5)",
                            filter: "drop-shadow(0 2px 10px rgba(251, 191, 36, 0.3))"
                          }}
                        >
                          SCROLL DOWN BABY
                        </h1>
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </motion.div>

            {/* Ambient light effects */}
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse 600px 400px at 30% 70%, rgba(222,184,135,0.2), transparent 70%),
                  radial-gradient(ellipse 500px 300px at 70% 30%, rgba(245,222,179,0.2), transparent 70%)
                `
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Original bookshelf - hidden during new world */}
      {cloudPhase === 'none' && (
        <div className="absolute top-4 sm:top-10 left-0 right-0 text-center text-xs sm:text-sm font-medium text-amber-900/70 px-4">Tap the right book to begin</div>
      )}

      {/* Bookshelf - only visible when not in cloud journey */}
      {(cloudPhase === 'none' || cloudPhase === 'filling') && (
        <div className="w-full max-w-5xl px-3 sm:px-6 relative" style={{ perspective: "1400px" }}>
          {/* Bookshelf shadow cast on wall */}
          <div className="absolute inset-0 -z-10 pointer-events-none" style={{
            transform: "translateY(20px) scale(1.05)",
            filter: "blur(25px)",
            background: "radial-gradient(ellipse 80% 90% at 50% 50%, rgba(0,0,0,0.35), rgba(0,0,0,0.15) 60%, transparent 80%)",
            opacity: 0.6
          }} />
          
          {/* Shelf frame - realistic dark wood bookcase */}
          <div
            ref={frameRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="relative rounded-xl sm:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4),0_10px_30px_rgba(0,0,0,0.3)] sm:shadow-[0_40px_120px_rgba(0,0,0,0.5),0_20px_60px_rgba(0,0,0,0.4)] p-3 sm:p-6"
            style={{ 
              transformStyle: "preserve-3d", 
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              background: `
                linear-gradient(135deg, 
                  rgba(74,55,40,1) 0%, 
                  rgba(61,40,23,1) 30%,
                  rgba(45,31,18,1) 70%,
                  rgba(35,24,14,1) 100%
                )
              `,
              border: "2px solid rgba(30,20,12,0.8)",
              boxShadow: `
                inset 0 2px 4px rgba(255,255,255,0.1),
                inset 0 -2px 8px rgba(0,0,0,0.4),
                0 0 0 1px rgba(80,60,40,0.3)
              `
            }}
        >
          {/* Wood grain texture overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl opacity-40" style={{
            backgroundImage: `
              repeating-linear-gradient(90deg,
                rgba(0,0,0,0.1) 0px,
                transparent 1px,
                transparent 2px,
                rgba(0,0,0,0.05) 3px,
                transparent 4px,
                transparent 40px
              ),
              repeating-linear-gradient(0deg,
                rgba(255,255,255,0.02) 0px,
                transparent 1px,
                transparent 3px
              )
            `,
            mixBlendMode: "multiply"
          }} />

          {/* Wood knots and imperfections */}
          <div className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl opacity-25" style={{
            background: `
              radial-gradient(ellipse 8% 12% at 15% 25%, rgba(0,0,0,0.3), transparent 50%),
              radial-gradient(ellipse 6% 10% at 85% 40%, rgba(0,0,0,0.25), transparent 50%),
              radial-gradient(ellipse 7% 11% at 25% 70%, rgba(0,0,0,0.28), transparent 50%),
              radial-gradient(ellipse 5% 8% at 90% 80%, rgba(0,0,0,0.22), transparent 50%)
            `
          }} />

          {/* Highlight from top light */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-1/3 rounded-t-xl sm:rounded-t-2xl" style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)"
          }} />

          {/* Frame inner side panels for depth - enhanced wood grain */}
          <div className="pointer-events-none absolute inset-y-6 left-2 w-6 rounded" style={{ 
            transform: "translateZ(30px)",
            background: `
              linear-gradient(90deg, 
                rgba(25,17,10,0.9) 0%,
                rgba(35,24,14,0.7) 30%,
                rgba(45,31,18,0.4) 70%,
                transparent 100%
              )
            `,
            boxShadow: "inset -2px 0 4px rgba(0,0,0,0.5)"
          }} />
          <div className="pointer-events-none absolute inset-y-6 right-2 w-6 rounded" style={{ 
            transform: "translateZ(30px)",
            background: `
              linear-gradient(-90deg, 
                rgba(25,17,10,0.9) 0%,
                rgba(35,24,14,0.7) 30%,
                rgba(45,31,18,0.4) 70%,
                transparent 100%
              )
            `,
            boxShadow: "inset 2px 0 4px rgba(0,0,0,0.5)"
          }} />
          {/* Shelves */}
          <div className="space-y-4 sm:space-y-8">
            {[0, 1, 2].map((row) => (
              <div key={row} className="relative h-32 sm:h-40 rounded-lg sm:rounded-xl shadow-[inset_0_-8px_16px_rgba(0,0,0,0.35),inset_0_2px_4px_rgba(0,0,0,0.2)] sm:shadow-[inset_0_-12px_24px_rgba(0,0,0,0.4),inset_0_2px_6px_rgba(0,0,0,0.25)]" style={{
                background: `
                  linear-gradient(to bottom, 
                    rgba(107,68,35,1) 0%, 
                    rgba(92,58,31,1) 30%,
                    rgba(74,48,24,1) 70%, 
                    rgba(60,38,19,1) 100%
                  )
                `
              }}>
                {/* Wood grain texture on shelf */}
                <div className="absolute inset-0 rounded-lg sm:rounded-xl opacity-50 pointer-events-none" style={{
                  backgroundImage: `
                    repeating-linear-gradient(90deg,
                      rgba(0,0,0,0.08) 0px,
                      transparent 1px,
                      transparent 2px,
                      rgba(0,0,0,0.04) 3px,
                      transparent 5px,
                      transparent 35px
                    ),
                    repeating-linear-gradient(0deg,
                      rgba(255,255,255,0.015) 0px,
                      transparent 1px,
                      transparent 2px
                    )
                  `,
                  mixBlendMode: "multiply"
                }} />

                {/* Wood variations and knots on shelf */}
                <div className="absolute inset-0 rounded-lg sm:rounded-xl opacity-30 pointer-events-none" style={{
                  background: `
                    radial-gradient(ellipse 10% 15% at ${20 + row * 15}% 40%, rgba(0,0,0,0.25), transparent 50%),
                    radial-gradient(ellipse 8% 12% at ${70 + row * 10}% 60%, rgba(0,0,0,0.2), transparent 50%),
                    linear-gradient(90deg, rgba(255,255,255,0.03) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.05) 100%)
                  `
                }} />

                {/* Top highlight on shelf */}
                <div className="absolute inset-x-0 top-0 h-1/4 rounded-t-lg sm:rounded-t-xl pointer-events-none" style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)"
                }} />

                {/* Shelf board front lip for depth - realistic wood edge */}
                <div className="absolute inset-x-2 bottom-1 h-3 sm:h-4 rounded" style={{
                  background: `
                    linear-gradient(to bottom, 
                      rgba(139,111,71,1) 0%, 
                      rgba(107,87,57,1) 40%,
                      rgba(74,55,40,1) 80%, 
                      rgba(60,45,32,1) 100%
                    )
                  `,
                  boxShadow: `
                    inset 0 1px 3px rgba(255,255,255,0.15),
                    inset 0 -1px 2px rgba(0,0,0,0.3),
                    0 3px 6px rgba(0,0,0,0.4),
                    0 1px 2px rgba(0,0,0,0.3)
                  `,
                  border: "1px solid rgba(50,35,20,0.5)"
                }} />

                {/* Wood grain on front lip */}
                <div className="absolute inset-x-2 bottom-1 h-3 sm:h-4 rounded opacity-40 pointer-events-none" style={{
                  backgroundImage: `
                    repeating-linear-gradient(90deg,
                      rgba(0,0,0,0.1) 0px,
                      transparent 1px,
                      transparent 25px
                    )
                  `
                }} />

                {/* Shadow under front lip */}
                <div className="absolute inset-x-2 bottom-2 h-1 bg-[#1a1108]/70 rounded blur-sm" />

                <div className="relative h-full flex items-end gap-2 sm:gap-4 px-3 sm:px-5">
                  {books.slice(row * 6, row * 6 + 6).map((b, idx) => {
                    const centerIndex = 2.5; // between 2 and 3 for 6 items
                    const distance = Math.abs(idx - centerIndex);
                    const dropDelay = 0.05 * distance; // center-out
                    const isSelected = opened && b.id === selectedId;
                    const isOther = opened && selectedId != null && b.id !== selectedId;
                    return (
                    <motion.button
                      type="button"
                      key={b.id}
                      onClick={() => onBookClick(b)}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.95 }}
                      className={`book-slot relative flex-1 h-full flex items-end justify-center touch-manipulation min-h-[44px] ${opened && b.id !== selectedId ? "pointer-events-none" : ""}`}
                      data-id={b.id}
                      aria-label={b.label ?? "Book"}
                      initial={false}
                      animate={
                        isOther
                          ? { y: 600, rotateZ: b.dropRot * 2, rotateX: -15, scale: 0.95, transition: { delay: dropDelay, duration: 0.8, ease: [0.6, 0.01, 0.9, 0.9] } }
                          : isSelected
                          ? { scale: 1.03, transition: { duration: 0.3 } }
                          : { y: 0, rotateZ: 0, rotateX: 0, scale: 1 }
                      }
                    >
                      <motion.div
                        data-id={b.id}
                        className="book-item relative w-[44px] sm:w-[54px] md:w-[62px]"
                        initial={{ rotateY: -2, z: 0, rotateZ: b.tilt }}
                        animate={
                          opened && b.id === selectedId
                            ? { 
                                x: 0,
                                y: typeof window !== 'undefined' && window.innerWidth < 768 ? -120 : -200,
                                z: 200,
                                scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 3.5 : 4.5,
                                rotateY: -15,
                                rotateX: 5,
                                rotateZ: 0,
                                transition: typeof window !== 'undefined' && window.innerWidth < 768 
                                  ? { duration: 0.4, ease: "easeOut" }
                                  : { type: "spring", stiffness: 100, damping: 18, delay: 0.1 }
                              }
                            : { rotateY: -2, z: 0, x: 0, y: 0, scale: 1, rotateX: 0, rotateZ: b.tilt }
                        }
                        whileHover={opened ? undefined : { rotateY: -14, z: 8 }}
                        transition={typeof window !== 'undefined' && window.innerWidth < 768 
                          ? { duration: 0.2, ease: "easeOut" }
                          : { type: "spring", stiffness: 220, damping: 20 }}
                        style={{ 
                          transformStyle: "preserve-3d" as React.CSSProperties["transformStyle"], 
                          height: `${b.height}%`,
                          ...(opened && b.id === selectedId ? { 
                            position: "fixed" as const,
                            left: "50%",
                            top: "50%",
                            marginLeft: "-27px",
                            marginTop: "-50px",
                            zIndex: 9999
                          } : {})
                        }}
                      >
                        {/* Front cover (hinged) */}
                        <motion.div
                          initial={false}
                          animate={opened && b.id === selectedId ? { rotateY: -150 } : { rotateY: 0 }}
                          transition={typeof window !== 'undefined' && window.innerWidth < 768
                            ? { duration: 0.4, ease: "easeOut", delay: opened && b.id === selectedId ? 0.2 : 0 }
                            : { type: "spring", stiffness: 180, damping: 18, delay: opened && b.id === selectedId ? 0.4 : 0 }}
                          style={{
                            transformOrigin: "left",
                            transformStyle: "preserve-3d",
                            position: "absolute",
                            inset: 0,
                          }}
                        >
                          <div
                            className="absolute inset-0 rounded-t-md shadow-md"
                            style={{
                              // Realistic book cover: leather/cloth texture + wear + lighting
                              background: `
                                radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15), transparent 40%),
                                linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.15) 100%),
                                radial-gradient(ellipse at 80% 90%, rgba(0,0,0,0.2), transparent 60%),
                                ${b.color}
                              `,
                              transform: "translateZ(10px)",
                              boxShadow: "0 20px 35px rgba(0,0,0,0.25), inset 0 1px 3px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)",
                              backfaceVisibility: "hidden",
                              border: "1px solid rgba(0,0,0,0.3)",
                            }}
                          />
                          {/* Leather/cloth texture overlay */}
                          <div
                            className="absolute inset-0 rounded-t-md opacity-30 mix-blend-overlay"
                            style={{
                              backgroundImage: `
                                repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px),
                                repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px)
                              `,
                              transform: "translateZ(11px)",
                            }}
                          />
                          {/* Worn corners */}
                          <div
                            className="absolute top-0 right-0 w-3 h-3 rounded-tl-md opacity-40"
                            style={{
                              background: "radial-gradient(circle at top right, rgba(0,0,0,0.3), transparent 70%)",
                              transform: "translateZ(11px)",
                            }}
                          />
                          <div
                            className="absolute bottom-0 right-0 w-3 h-3 opacity-40"
                            style={{
                              background: "radial-gradient(circle at bottom right, rgba(0,0,0,0.3), transparent 70%)",
                              transform: "translateZ(11px)",
                            }}
                          />
                          {/* Title bar hint (embossed rectangle) */}
                          <div
                            className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-14 rounded-sm opacity-20"
                            style={{
                              background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(0,0,0,0.2))",
                              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)",
                              transform: "translateZ(11px)",
                            }}
                          />
                          {/* Inner cover back when opened */}
                          <div
                            className="absolute inset-0 rounded-t-md border border-black/10"
                            style={{
                              background: "linear-gradient(to bottom, #f9f7f4, #ede8e0)",
                              transform: "rotateY(180deg) translateZ(10px)",
                              backfaceVisibility: "hidden",
                            }}
                          />
                        </motion.div>
                        {/* Spine - realistic with ridges and wear */}
                        <div
                          className="absolute top-0 left-0 h-full w-[12px] rounded-l-md"
                          style={{
                            background: `
                              linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 25%, rgba(255,255,255,0.2) 50%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0.4) 100%),
                              ${b.color}
                            `,
                            transform: "rotateY(90deg) translateZ(6px)",
                            transformOrigin: "left",
                            boxShadow: "inset 0 0 3px rgba(0,0,0,0.5)",
                          }}
                        >
                          {/* Spine ridge lines */}
                          <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-[1px] h-[calc(100%-16px)] bg-white/10" />
                          <div className="absolute top-3 left-0 right-0 h-[1px] bg-black/20" />
                          <div className="absolute bottom-3 left-0 right-0 h-[1px] bg-black/20" />
                        </div>
                        {/* Page edges (right) - realistic paper stack with improved visibility - hidden when opened */}
                        {!(opened && b.id === selectedId) && (
                          <div
                            className="absolute top-0 right-0 h-full w-[12px] rounded-r-[3px]"
                            style={{
                              background: `
                                repeating-linear-gradient(180deg, 
                                  #fdfcfa 0px, #fdfcfa 2px, 
                                  #f5f3f0 2px, #f5f3f0 3px,
                                  #ebe8e3 3px, #ebe8e3 4px,
                                  #e8e5e0 4px, #e8e5e0 5px
                                )
                              `,
                              boxShadow: "inset -3px 0 6px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1), 2px 0 4px rgba(0,0,0,0.1)",
                              transform: "translateZ(5px)",
                              borderRight: "1px solid rgba(0,0,0,0.15)",
                              zIndex: 10,
                            }}
                          >
                          {/* Page texture variation */}
                          <div 
                            className="absolute inset-0 opacity-40"
                            style={{
                              background: "repeating-linear-gradient(180deg, transparent 0px, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 5px)"
                            }}
                          />
                          </div>
                        )}
                        {/* Top page edge (visible when pitched) */}
                        <div
                          className="absolute left-0 right-0 top-0 h-[8px]"
                          style={{
                            background: "linear-gradient(180deg,#ffffff,#eaeaea)",
                            transform: "rotateX(90deg) translateZ(6px)",
                            transformOrigin: "top",
                            boxShadow: "0 2px 3px rgba(0,0,0,0.08)",
                          }}
                        />
                        {/* Right-side page stack when book is opened - ENHANCED */}
                        {opened && b.id === selectedId && (
                          <motion.div
                            initial={{ opacity: 0, width: "12px", x: 0 }}
                            animate={{ opacity: 1, width: "60px", x: 18 }}
                            transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute top-0 right-0 h-full rounded-r-[4px]"
                            style={{
                              background: `
                                repeating-linear-gradient(180deg, 
                                  rgba(253,252,250,1) 0px, rgba(253,252,250,1) 2px, 
                                  rgba(245,243,240,1) 2px, rgba(245,243,240,1) 4px,
                                  rgba(235,232,227,1) 4px, rgba(235,232,227,1) 6px,
                                  rgba(232,229,224,1) 6px, rgba(232,229,224,1) 8px
                                )
                              `,
                              boxShadow: `
                                inset -8px 0 16px rgba(0,0,0,0.35),
                                inset 0 4px 8px rgba(0,0,0,0.15),
                                inset 0 -4px 8px rgba(0,0,0,0.15),
                                6px 0 12px rgba(0,0,0,0.25),
                                0 8px 16px rgba(0,0,0,0.2)
                              `,
                              transform: "translateZ(18px)",
                              borderRight: "2px solid rgba(0,0,0,0.3)",
                              borderTop: "1px solid rgba(0,0,0,0.2)",
                              borderBottom: "1px solid rgba(0,0,0,0.2)",
                              zIndex: 30,
                            }}
                          >
                            {/* Enhanced page texture variations */}
                            <div 
                              className="absolute inset-0 opacity-50"
                              style={{
                                background: `
                                  repeating-linear-gradient(180deg, 
                                    transparent 0px, 
                                    transparent 4px, 
                                    rgba(0,0,0,0.06) 4px, 
                                    rgba(0,0,0,0.06) 5px
                                  )
                                `
                              }}
                            />

                            {/* Page binding with stitching details */}
                            <div className="absolute left-3 top-4 bottom-4 w-[2px] bg-gradient-to-b from-black/15 via-black/10 to-black/15 rounded-full" />
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute left-2 w-3 h-[2px] bg-black/08 rounded-full"
                                style={{
                                  top: `${15 + i * 15}%`
                                }}
                              />
                            ))}

                            {/* Light catch on page edges */}
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-white/30 to-transparent" />

                            {/* Depth shadow gradient */}
                            <div className="absolute left-0 top-0 bottom-0 w-1/2" style={{
                              background: "linear-gradient(90deg, rgba(0,0,0,0.15) 0%, transparent 100%)"
                            }} />
                          </motion.div>
                        )}

                        {/* Magical glow around opened book */}
                        {opened && b.id === selectedId && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="absolute inset-0"
                            style={{
                              transform: "translateZ(-10px) scale(1.4)",
                              background: "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(255,248,220,0.8), rgba(255,240,200,0.4) 40%, transparent 70%)",
                              filter: "blur(30px)",
                              zIndex: -1
                            }}
                          />
                        )}

                        {/* Page flip layers when opened - ENHANCED realistic paper */}
                        {opened && b.id === selectedId && (
                          <>
                            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                              <motion.div
                                key={i}
                                initial={{ rotateY: 0 }}
                                animate={{ rotateY: -125 - i * 10 }}
                                transition={{ delay: 0.6 + 0.08 * (i + 1), duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  transformOrigin: "left",
                                  transformStyle: "preserve-3d",
                                  zIndex: 20 + i,
                                }}
                              >
                                {/* Front of page - enhanced with visible text lines */}
                                <div
                                  className="absolute inset-0 rounded-t-md"
                                  style={{
                                    background: `
                                      linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%),
                                      linear-gradient(90deg, rgba(255,248,235,1) 0%, rgba(255,252,245,1) 50%, rgba(252,248,240,1) 100%)
                                    `,
                                    border: "1px solid rgba(0,0,0,0.12)",
                                    transform: `translateZ(${14 - i}px)`,
                                    backfaceVisibility: "hidden",
                                    boxShadow: `
                                      0 ${4 + i}px ${8 + i * 2}px rgba(0,0,0,${0.15 + i * 0.02}),
                                      inset 0 1px 3px rgba(255,255,255,0.4),
                                      inset -2px 0 4px rgba(0,0,0,0.08)
                                    `,
                                  }}
                                >
                                  {/* Realistic text lines on page */}
                                  <div className="absolute inset-0 p-3 sm:p-4 opacity-50" style={{
                                    transform: "translateZ(1px)"
                                  }}>
                                    {[...Array(8)].map((_, lineIdx) => (
                                      <div
                                        key={lineIdx}
                                        className="h-[1px] mb-2 sm:mb-3"
                                        style={{
                                          background: "rgba(0,0,0,0.25)",
                                          width: lineIdx % 3 === 0 ? '85%' : '95%'
                                        }}
                                      />
                                    ))}
                                  </div>

                                  {/* Page number */}
                                  <div className="absolute bottom-2 right-3 text-[6px] sm:text-[8px] opacity-40" style={{
                                    fontFamily: 'serif',
                                    color: '#3d2817',
                                    transform: "translateZ(1px)"
                                  }}>
                                    {i * 2 + 1}
                                  </div>

                                  {/* Paper fiber texture */}
                                  <div 
                                    className="absolute inset-0 opacity-20 rounded-t-md"
                                    style={{
                                      backgroundImage: `
                                        repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.01) 1px, rgba(0,0,0,0.01) 2px),
                                        repeating-linear-gradient(90deg, transparent 0px, transparent 1px, rgba(0,0,0,0.008) 1px, rgba(0,0,0,0.008) 2px)
                                      `,
                                      filter: "blur(0.3px)"
                                    }}
                                  />

                                  {/* Page curl shadow on right edge */}
                                  <div className="absolute top-0 right-0 bottom-0 w-8 rounded-tr-md" style={{
                                    background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 100%)",
                                    transform: "translateZ(1px)"
                                  }} />

                                  {/* Top edge highlight */}
                                  <div className="absolute top-0 left-0 right-0 h-1/4 rounded-t-md" style={{
                                    background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)"
                                  }} />
                                </div>

                                {/* Back of page - also enhanced */}
                                <div
                                  className="absolute inset-0 rounded-t-md"
                                  style={{
                                    background: "linear-gradient(180deg, rgba(245,243,239,1) 0%, rgba(235,232,225,1) 100%)",
                                    border: "1px solid rgba(0,0,0,0.12)",
                                    transform: `rotateY(180deg) translateZ(${14 - i}px)`,
                                    backfaceVisibility: "hidden",
                                    boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
                                  }}
                                >
                                  {/* Text lines on back */}
                                  <div className="absolute inset-0 p-3 sm:p-4 opacity-40" style={{
                                    transform: "scaleX(-1) translateZ(1px)"
                                  }}>
                                    {[...Array(8)].map((_, lineIdx) => (
                                      <div
                                        key={lineIdx}
                                        className="h-[1px] mb-2 sm:mb-3"
                                        style={{
                                          background: "rgba(0,0,0,0.2)",
                                          width: lineIdx % 3 === 0 ? '90%' : '95%'
                                        }}
                                      />
                                    ))}
                                  </div>

                                  {/* Page number on back */}
                                  <div className="absolute bottom-2 left-3 text-[6px] sm:text-[8px] opacity-35" style={{
                                    fontFamily: 'serif',
                                    color: '#3d2817',
                                    transform: "scaleX(-1) translateZ(1px)"
                                  }}>
                                    {i * 2 + 2}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </>
                        )}
                        {/* Animated specular shine on hover */}
                        <motion.div
                          initial={false}
                          animate={opened ? { opacity: 0 } : { opacity: 0.0 }}
                          whileHover={{ opacity: 0.45, x: ["-120%", "120%"] }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                          className="absolute inset-y-0 -left-full w-2/3"
                          style={{
                            background: "linear-gradient(75deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.0) 80%)",
                            filter: "blur(2px)",
                            transform: "translateZ(12px)",
                          }}
                        />
                        {/* Contact shadow under book - realistic soft shadow */}
                        <div
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-20 rounded-full opacity-50"
                          style={{
                            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0.4), rgba(0,0,0,0.15) 50%, transparent 80%)",
                            transform: "translateZ(-1px)",
                            filter: "blur(2px)",
                          }}
                        />
                        {/* Dust/aging on top edge */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1 opacity-20"
                          style={{
                            background: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.1) 80%, transparent 100%)",
                            transform: "translateZ(12px)",
                          }}
                        />

                        {/* Pick me pointer - completely removed when any book is opened */}
                        {b.label && !opened && selectedId === null && (
                          <div className="absolute -top-7 sm:-top-9 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ transform: "translateZ(12px)" }}>
                            <div className="animate-bounce text-xs font-semibold text-amber-900 bg-amber-100/95 px-2 py-1 rounded-full shadow-lg border border-amber-200 whitespace-nowrap">{b.label}</div>
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 sm:border-l-6 sm:border-r-6 sm:border-t-8 border-l-transparent border-r-transparent border-t-amber-100/95" />
                          </div>
                        )}
                      </motion.div>
                    </motion.button>
                  );
                })}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* Love Letter Section - appears when scrolling */}
      {showScrollMessage && (
        <div className="relative" style={{ height: '400vh' }}>
          {/* 3D Hearts and Flowers Background */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-100 to-red-50"></div>
          </div>
          
          {/* 3D Hearts Scene - separate fixed layer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none" 
            style={{ zIndex: 40 }}
          >
            <HeartsScene />
            {/* Debug: Add emoji hearts as fallback to ensure something shows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl opacity-10 animate-pulse pointer-events-none">
              💕
            </div>
          </motion.div>
          
          <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 20 }}>
            
            {/* Optimized fallback emoji hearts */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`fallback-heart-${i}`}
                className="absolute text-3xl opacity-40 will-change-transform"
                style={{ zIndex: 20 }}
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                }}
                animate={{
                  y: [null, -80, 40, -20],
                  x: [null, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 60],
                  rotate: [0, 180, 360],
                  scale: [0.9, 1.1, 0.95],
                }}
                transition={{
                  duration: 20 + Math.random() * 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              >
                💖
              </motion.div>
            ))}
            
            
            {/* Love Bursts for interaction */}
            <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 30 }}>
              <LoveBursts />
            </div>

            {/* Optimized floating flowers */}
            {[...Array(4)].map((_, i) => {
              const flowers = ['🌸', '🌺', '🌻', '🌷', '🌹', '💐'];
              const randomX = Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200);
              const randomY = Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800);
              
              return (
                <motion.div
                  key={`flower-${i}`}
                  className="absolute text-4xl will-change-transform"
                  initial={{
                    x: randomX,
                    y: randomY,
                    rotate: Math.random() * 360,
                    scale: 0.8 + Math.random() * 0.4,
                  }}
                  animate={{
                    y: [randomY, randomY - 60, randomY + 80, randomY - 40, randomY],
                    x: [randomX, randomX + (Math.random() - 0.5) * 120, randomX + (Math.random() - 0.5) * 80, randomX],
                    rotate: [null, 180, 360, 540],
                    scale: [null, 1.2, 0.9, 1.1],
                  }}
                  transition={{
                    duration: 25 + Math.random() * 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                  style={{
                    zIndex: 20,
                    filter: "drop-shadow(0 0 10px rgba(255,192,203,0.6))",
                  }}
                >
                  {flowers[i % flowers.length]}
                </motion.div>
              );
            })}
          </div>

          {/* Love Letter Text */}
          <div className="relative z-50 min-h-screen flex items-start justify-center px-4 pt-32 sm:pt-40 md:pt-48">
            <div className="relative max-w-4xl mx-auto text-center">
              {/* Letter segments that appear based on scroll progress */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: revealedCards[0] ? 1 : 0,
                  y: revealedCards[0] ? 0 : 50 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="mb-16 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-pink-200/50 shadow-2xl"
              >
                <p className="text-lg sm:text-xl md:text-2xl text-rose-800 leading-relaxed font-medium">
                  I&apos;M WRITING THIS MYSELF SO THERE&apos;S NO CHATGPT😩
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: revealedCards[1] ? 1 : 0,
                  y: revealedCards[1] ? 0 : 50 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="mb-16 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-pink-200/50 shadow-2xl"
              >
                <p className="text-lg sm:text-xl md:text-2xl text-rose-800 leading-relaxed font-medium">
                  THIS FEELS LIKE I&apos;M WRITING A LETTER TO BE HONEST BUT ANYWAYS.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: revealedCards[2] ? 1 : 0,
                  y: revealedCards[2] ? 0 : 50 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="mb-16 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-pink-200/50 shadow-2xl"
              >
                <p className="text-lg sm:text-xl md:text-2xl text-rose-800 leading-relaxed font-medium">
                  JUST WANTED TO SAY THAT I&apos;M SO HAPPY THAT YOU TEXTED ME THE FIRST DAY AND I&apos;M HAPPY THAT WE ARE TOGETHER NOW.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: revealedCards[3] ? 1 : 0,
                  y: revealedCards[3] ? 0 : 50 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="mb-16 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-pink-200/50 shadow-2xl"
              >
                <p className="text-lg sm:text-xl md:text-2xl text-rose-800 leading-relaxed font-medium">
                  WE HAVE DONE A LOT OF STUFF TOGETHER, LITERALLY LIKE WE ARE MARRIED, WE TRAVELED TOGETHER AND ALL OF THESE STUFF WERE NEW FOR ME.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: revealedCards[4] ? 1 : 0,
                  y: revealedCards[4] ? 0 : 50 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="mb-16 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-pink-200/50 shadow-2xl"
              >
                <p className="text-lg sm:text-xl md:text-2xl text-rose-800 leading-relaxed font-medium">
                  I&apos;M HAPPY THAT I EXPERIENCED ALL OF THESE GOOD THINGS WITH SUCH A BEAUTIFUL, KIND AND SUPPORTIVE GIRL.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: revealedCards[5] ? 1 : 0,
                  y: revealedCards[5] ? 0 : 50 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="mb-16 p-6 bg-white/40 backdrop-blur-lg rounded-2xl border border-pink-200/50 shadow-2xl"
              >
                <p className="text-lg sm:text-xl md:text-2xl text-rose-800 leading-relaxed font-medium">
                  LITERALLY ONE OF THE BEST GIRLS I HAVE EVER MET AND I WON&apos;T FORGET ABOUT YOU EVER.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ 
                  opacity: revealedCards[6] ? 1 : 0,
                  y: revealedCards[6] ? 0 : 50,
                  scale: revealedCards[6] ? 1 : 0.8
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="p-8 bg-gradient-to-br from-pink-100/40 to-rose-100/40 backdrop-blur-lg rounded-3xl border-2 border-pink-300/50 shadow-2xl"
              >
                <p className="text-xl sm:text-2xl md:text-3xl text-rose-900 leading-relaxed font-bold mb-4">
                  I WISH FOR MORE GOOD TIMES TO EXPERIENCE WITH YOU MY BABY.
                </p>
                <p className="text-2xl sm:text-3xl md:text-4xl text-red-600 font-bold animate-pulse">
                  LOVE YOU ELENISKI 💕
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Message notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 bg-amber-50/95 backdrop-blur border border-amber-300/70 text-amber-900 px-3 sm:px-4 py-2 rounded-full shadow-lg font-medium text-sm sm:text-base max-w-[90vw] text-center"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  }
