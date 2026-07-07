"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, useAnimate, useSpring } from "framer-motion";

interface ReelsSidebarRobotProps {
  viewedCount: number;
  disableAnimations?: boolean;
}

export function ReelsSidebarRobot({ viewedCount, disableAnimations = false }: ReelsSidebarRobotProps) {
  if (disableAnimations) return null;
  return <RobotInner viewedCount={viewedCount} />;
}

function RobotInner({ viewedCount }: { viewedCount: number }) {
  const isFatigued = viewedCount >= 25;
  const [scope, animate] = useAnimate();
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Window Bounds ────────────────────────────────────────────────────────
  const [windowSize, setWindowSize] = useState({ w: 1440, h: 800 });
  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Motion & Tracking ───────────────────────────────────────────────────
  const targetX = useMotionValue(720);
  const targetY = useMotionValue(400);

  const smoothX = useSpring(targetX, { stiffness: 150, damping: 25 });
  const smoothY = useSpring(targetY, { stiffness: 150, damping: 25 });

  const isForcedFocusRef = useRef(false);

  useEffect(() => {
    let cachedReelX = windowSize.w / 2 - 300; // rough left offset for Reels container
    let cachedReelY = windowSize.h / 2;
    let hasReel = false;

    const updateCachedReel = () => {
      const activeReel = document.querySelector('[data-active="true"]');
      if (activeReel) {
        const rect = activeReel.getBoundingClientRect();
        cachedReelX = rect.left + rect.width / 2;
        cachedReelY = rect.top + rect.height / 2;
        hasReel = true;
      } else {
        hasReel = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isForcedFocusRef.current) return;
      let tx = e.clientX;
      let ty = e.clientY;

      if (hasReel) {
        // Blend 70% mouse, 30% reel center for playful ambient look
        tx = cachedReelX * 0.3 + e.clientX * 0.7;
        ty = cachedReelY * 0.3 + e.clientY * 0.7;
      }
      targetX.set(tx);
      targetY.set(ty);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    updateCachedReel();
    const interval = setInterval(updateCachedReel, 1000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, [targetX, targetY, windowSize]);

  // Base rotation mappings (-25deg to 25deg)
  const baseRotateY = useTransform(smoothX, [0, windowSize.w], [-25, 25]);
  const baseRotateX = useTransform(smoothY, [0, windowSize.h], [25, -25]);

  // Parallax Flex Multipliers
  // Layer 1 (Z-10): Chassis (slowest, background)
  const l1_rotateX = useTransform(baseRotateX, v => v * 0.4);
  const l1_rotateY = useTransform(baseRotateY, v => v * 0.4);
  
  // Layer 2 (Z-20): Torso Core
  const l2_rotateX = useTransform(baseRotateX, v => v * 0.7);
  const l2_rotateY = useTransform(baseRotateY, v => v * 0.7);

  // Layer 3 (Z-30): Head Capsule
  const l3_rotateX = useTransform(baseRotateX, v => v * 1.1);
  const l3_rotateY = useTransform(baseRotateY, v => v * 1.1);

  // Layer 4 (Z-40): Arms
  const l4_rotateX = useTransform(baseRotateX, v => v * 1.4);
  const l4_rotateY = useTransform(baseRotateY, v => v * 1.4);

  // ── Physics States ──────────────────────────────────────────────────────
  const isAnimatingRef = useRef(false);
  const isFatiguedRef = useRef(isFatigued);
  useEffect(() => { isFatiguedRef.current = isFatigued; }, [isFatigued]);

  // ── Jump Interaction ────────────────────────────────────────────────────
  const triggerJump = async () => {
    if (isFatiguedRef.current || isAnimatingRef.current || !scope.current) return;
    isAnimatingRef.current = true;
    try {
      const container = scope.current.querySelector('.robot-master-container');
      if (container) {
        // The Playful Jump Loop: bouncy vertical jump paired with explicit body squash-and-stretch
        await animate(container, { 
          y: [0, -40, 5, -10, 0],
          scaleY: [1, 0.7, 1.3, 0.9, 1],
          scaleX: [1, 1.25, 0.8, 1.05, 1]
        }, { duration: 0.7, ease: "easeInOut" });
      }
    } finally {
      isAnimatingRef.current = false;
    }
  };

  // ── Push / Navigation Interaction ───────────────────────────────────────
  useEffect(() => {
    const triggerPush = async (dir: "up" | "down") => {
      if (isAnimatingRef.current || !scope.current) return;
      isAnimatingRef.current = true;
      isForcedFocusRef.current = true;

      try {
        const leftArmPath = scope.current.querySelector('.arm-path-left');
        const rightArmPath = scope.current.querySelector('.arm-path-right');
        
        // 1. The Turn & Face Phase
        // Transition rotateY towards the Reels container frame (left side, so X = 0) before moving an inch
        const activeReel = document.querySelector('[data-active="true"]');
        let reelCenterX = 0;
        let reelCenterY = windowSize.h / 2;
        
        if (activeReel) {
          const rect = activeReel.getBoundingClientRect();
          reelCenterX = rect.left + rect.width / 2;
          // Aim at the top or bottom boundary depending on direction
          reelCenterY = dir === "down" ? rect.bottom : rect.top;
        }

        // Force look
        targetX.set(reelCenterX);
        targetY.set(reelCenterY);
        
        // Wait a tiny bit for the spring to physically turn its body
        await new Promise(r => setTimeout(r, 150));

        // 2. The Arm Extension Mechanical Push
        // Dynamically morph the <motion.path> to stretch out, grab, and sweep
        if (leftArmPath && rightArmPath) {
          // Base path (idle): M 20 20 Q 30 50 20 80
          // Stretch path (grabbing left boundary): M 20 20 Q -100 40 -150 (bottom)
          
          const grabY = dir === "down" ? 180 : -50;
          const sweepY = dir === "down" ? -80 : 180;

          // Stretch outwards and grab
          await Promise.all([
            animate(leftArmPath, { d: `M 30 30 Q -80 50 -140 ${grabY}` }, { duration: 0.2, type: "spring", stiffness: 300 }),
            animate(rightArmPath, { d: `M 70 30 Q -40 50 -120 ${grabY}` }, { duration: 0.2, type: "spring", stiffness: 300 }),
          ]);

          // High-acceleration keyframe sweep upwards/downwards
          await Promise.all([
            animate(leftArmPath, { d: `M 30 30 Q -100 50 -140 ${sweepY}` }, { duration: 0.3, ease: "easeIn" }),
            animate(rightArmPath, { d: `M 70 30 Q -60 50 -120 ${sweepY}` }, { duration: 0.3, ease: "easeIn" }),
          ]);

          // Snap back to idle
          await Promise.all([
            animate(leftArmPath, { d: `M 30 30 Q 35 55 30 80` }, { type: "spring", stiffness: 200, damping: 20 }),
            animate(rightArmPath, { d: `M 70 30 Q 65 55 70 80` }, { type: "spring", stiffness: 200, damping: 20 }),
          ]);
        }

      } finally {
        isForcedFocusRef.current = false;
        // Reset tracking to mouse
        const e = window.event as MouseEvent;
        if (e && e.clientX) {
          targetX.set(e.clientX);
          targetY.set(e.clientY);
        }
        isAnimatingRef.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 40) return;
      triggerPush(e.deltaY > 0 ? "down" : "up");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") triggerPush("down");
      else if (e.key === "ArrowUp") triggerPush("up");
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [animate, targetX, targetY, windowSize]);

  // ── Colors ──────────────────────────────────────────────────────────────
  const pColor = isFatigued ? "rgba(255, 69, 0, 1)" : "rgba(0, 243, 255, 1)";
  const glow = isFatigued 
    ? "drop-shadow(0 0 20px rgba(255, 69, 0, 0.8))" 
    : "drop-shadow(0 0 20px rgba(0, 243, 255, 0.8))";

  return (
    <div 
      ref={scope} 
      className="flex flex-col items-center justify-center relative w-full h-full select-none"
      style={{ perspective: "1200px" }}
      onMouseEnter={triggerJump}
    >
      <motion.div 
        className="robot-master-container relative w-40 h-64 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ==========================================
            LAYER 1 (Z-10): Back Mechanical Chassis
        ========================================== */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ rotateX: l1_rotateX, rotateY: l1_rotateY, transformStyle: "preserve-3d" }}
        >
          <div className="w-28 h-40 bg-black/60 rounded-3xl border border-white/5 backdrop-blur-sm relative shadow-2xl flex flex-col items-center justify-end pb-4">
            {/* Subtle engine exhaust radial neon glow maps */}
            <div 
              className="absolute bottom-[-10px] w-16 h-16 rounded-full blur-2xl" 
              style={{ background: `radial-gradient(circle, ${pColor} 0%, transparent 70%)`, opacity: isFatigued ? 0.8 : 0.4 }} 
            />
            {/* Exhaust vents */}
            <div className="flex gap-2 z-10">
              <div className="w-6 h-3 bg-black/90 border border-white/10 rounded-sm" />
              <div className="w-6 h-3 bg-black/90 border border-white/10 rounded-sm" />
            </div>
          </div>
        </motion.div>

        {/* ==========================================
            LAYER 2 (Z-20): Torso Core Panel
        ========================================== */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{ rotateX: l2_rotateX, rotateY: l2_rotateY, transformStyle: "preserve-3d" }}
        >
          <div className="w-24 h-32 rounded-[2rem] p-[2px] bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <div className="w-full h-full bg-[#0a0a16]/90 backdrop-blur-xl rounded-[1.9rem] flex items-center justify-center overflow-hidden relative">
              {/* Internal neon tracks */}
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
              <div className="w-12 h-12 rounded-full border-[2px] border-white/10 flex items-center justify-center">
                <motion.div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: pColor, boxShadow: `0 0 15px ${pColor}` }}
                  animate={{ scale: isFatigued ? [1, 1.1, 1] : [1, 1.3, 1], opacity: isFatigued ? 0.5 : [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: isFatigued ? 2 : 1.5 }}
                />
              </div>
              {/* Glass sheen */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[1.9rem] pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* ==========================================
            LAYER 3 (Z-30): Head Capsule
        ========================================== */}
        <motion.div 
          className="absolute inset-x-0 top-4 flex items-center justify-center z-30"
          style={{ rotateX: l3_rotateX, rotateY: l3_rotateY, transformStyle: "preserve-3d" }}
        >
          <div className="w-20 h-16 rounded-[1.5rem] bg-[#0a0a16]/80 backdrop-blur-2xl border border-white/20 shadow-xl relative overflow-hidden flex items-center justify-center gap-3">
            {/* Visor depth highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
            
            {/* Glowing multi-tonal custom pupils */}
            <motion.div 
              className="w-4 h-5 rounded-full relative"
              style={{ background: pColor, boxShadow: `0 0 12px ${pColor}, inset 0 0 4px white` }}
              animate={{ scaleY: isFatigued ? [1, 0.2, 1] : 1, opacity: isFatigued ? 0.6 : 1 }}
              transition={{ repeat: Infinity, duration: isFatigued ? 2.5 : 0 }}
            />
            <motion.div 
              className="w-4 h-5 rounded-full relative"
              style={{ background: pColor, boxShadow: `0 0 12px ${pColor}, inset 0 0 4px white` }}
              animate={{ scaleY: isFatigued ? [1, 0.2, 1] : 1, opacity: isFatigued ? 0.6 : 1 }}
              transition={{ repeat: Infinity, duration: isFatigued ? 2.5 : 0, delay: 0.1 }}
            />
            
            {/* Sensory array dots */}
            <div className="absolute top-2 right-3 flex gap-1">
              <div className="w-1 h-1 rounded-full bg-red-400" />
              <div className="w-1 h-1 rounded-full bg-green-400" />
            </div>
          </div>
        </motion.div>

        {/* ==========================================
            LAYER 4 (Z-40): Articulated Arms
        ========================================== */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-40 overflow-visible"
          style={{ rotateX: l4_rotateX, rotateY: l4_rotateY, transformStyle: "preserve-3d" }}
        >
          {/* We use a large SVG viewBox that overflows bounds so the arms can reach out to the reels card */}
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] overflow-visible" viewBox="0 0 100 100">
            <defs>
              <filter id="armGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Left Arm */}
            <motion.path
              className="arm-path-left"
              d="M 30 30 Q 35 55 30 80"
              fill="none"
              stroke={pColor}
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#armGlow)"
            />
            {/* Right Arm */}
            <motion.path
              className="arm-path-right"
              d="M 70 30 Q 65 55 70 80"
              fill="none"
              stroke={pColor}
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#armGlow)"
            />
            {/* Claws/Hands appended dynamically or kept simple as rounded caps */}
          </svg>
        </motion.div>
      </motion.div>

      {/* ── Status HUD ─────────────────────────────────────────────────── */}
      <div className="absolute -bottom-10 text-center w-full z-50">
        <motion.div
          className="text-[10px] font-black tracking-[0.3em] uppercase"
          animate={{ color: pColor }}
          style={{ textShadow: `0 0 8px ${pColor}` }}
        >
          {isFatigued ? "EXHAUSTED" : viewedCount >= 15 ? "TIRED" : "ACTIVE"}
        </motion.div>
      </div>
    </div>
  );
}
