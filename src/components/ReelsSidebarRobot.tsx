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
  const robotRef = useRef<HTMLDivElement>(null);

  // ── Motion values for head/body tracking ─────────────────────────────────
  // Initialized with fixed values to prevent hydration mismatch
  const mouseX = useMotionValue(720);
  const mouseY = useMotionValue(400);

  // Smooth springs for tracking
  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 100, damping: 20 });

  // Store window dimensions statefully after mount
  const [windowSize, setWindowSize] = useState({ w: 1440, h: 800 });
  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  // ── Tracking logic: look at mouse, or active reel if nearby ─────────────
  useEffect(() => {
    let cachedReelX = windowSize.w / 2;
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
      let targetX = e.clientX;
      let targetY = e.clientY;

      if (hasReel) {
        targetX = cachedReelX * 0.8 + e.clientX * 0.2;
        targetY = cachedReelY * 0.8 + e.clientY * 0.2;
      }

      mouseX.set(targetX);
      mouseY.set(targetY);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    updateCachedReel();
    const interval = setInterval(updateCachedReel, 1000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, [mouseX, mouseY, windowSize]);

  // Map position to rotation limits
  const rotateX = useTransform(smoothY, [0, windowSize.h], [25, -25]);
  const rotateY = useTransform(smoothX, [0, windowSize.w], [-30, 30]);
  
  // Head slightly exaggerated rotation
  const headRotateX = useTransform(smoothY, [0, windowSize.h], [35, -35]);
  const headRotateY = useTransform(smoothX, [0, windowSize.w], [-45, 45]);

  // ── Spring config: snappy vs fatigued ───────────────────────────────────
  const springConfig = useMemo(
    () =>
      isFatigued
        ? { stiffness: 30, damping: 45 }   // sluggish, heavy, 0.3x standard velocity
        : { stiffness: 250, damping: 20 }, // snappy, robotic
    [isFatigued]
  );

  const springConfigRef = useRef(springConfig);
  useEffect(() => { springConfigRef.current = springConfig; }, [springConfig]);
  const isFatiguedRef = useRef(isFatigued);
  useEffect(() => { isFatiguedRef.current = isFatigued; }, [isFatigued]);

  // ── Animation states ────────────────────────────────────────────────────
  const isAnimatingRef = useRef(false);

  // ── Scroll / key press push mechanics ───────────────────────────────────
  useEffect(() => {
    const triggerPush = async (dir: "up" | "down") => {
      if (isAnimatingRef.current || !scope.current) return;
      isAnimatingRef.current = true;
      
      const cfg = springConfigRef.current;
      const fatigued = isFatiguedRef.current;

      try {
        // Multi-phase keyframe sequence for the arms!
        // We use motion.div absolute arms below, so we animate them using standard selectors
        const leftArm = scope.current.querySelector('.robot-left-arm');
        const rightArm = scope.current.querySelector('.robot-right-arm');
        const body = scope.current.querySelector('.robot-body-wrapper');

        if (!leftArm || !rightArm || !body) return;

        if (fatigued) {
          // Fatigued: Struggle sequence
          // 1. Extend arms slowly with jitter
          await animate([
            [leftArm, { x: [-10, -50, -40, -60], y: dir === "down" ? 40 : -40, scaleX: 3, rotate: dir === "down" ? 20 : -20 }, { duration: 0.6 }],
            [rightArm, { x: [-10, -50, -40, -60], y: dir === "down" ? 40 : -40, scaleX: 3, rotate: dir === "down" ? 20 : -20 }, { duration: 0.6, at: "<" }],
            [body, { x: [-1, 2, -2, 1, 0, -2, 2, 0], y: dir === "down" ? 10 : -10, rotateZ: [-2, 2, -1, 1, 0] }, { duration: 0.8, at: "<" }]
          ]);
          
          // 2. Weak push back
          await animate([
            [leftArm, { x: 0, y: 0, scaleX: 1, rotate: 0 }, { type: "spring", ...cfg }],
            [rightArm, { x: 0, y: 0, scaleX: 1, rotate: 0 }, { type: "spring", ...cfg }],
            [body, { x: 0, y: 0, rotateZ: fatigued ? 10 : 0 }, { type: "spring", ...cfg }]
          ]);
        } else {
          // Active: Snappy powerful push
          // 1. Anchor hands beneath bottom boundary (extend left and down/up)
          await animate([
            [leftArm, { x: -80, y: dir === "down" ? 60 : -60, scaleX: 4, rotate: dir === "down" ? 15 : -15 }, { type: "spring", stiffness: 400, damping: 25 }],
            [rightArm, { x: -60, y: dir === "down" ? 50 : -50, scaleX: 3, rotate: dir === "down" ? 10 : -10 }, { type: "spring", stiffness: 400, damping: 25, at: "<" }],
          ]);

          // 2. Upward/Downward mechanical lifting motion
          await animate([
            [leftArm, { y: dir === "down" ? -60 : 60 }, { type: "spring", stiffness: 500, damping: 30 }],
            [rightArm, { y: dir === "down" ? -50 : 50 }, { type: "spring", stiffness: 500, damping: 30, at: "<" }],
            [body, { y: dir === "down" ? -15 : 15 }, { type: "spring", stiffness: 400, damping: 20, at: "<" }]
          ]);

          // 3. Snap back to origin
          await animate([
            [leftArm, { x: 0, y: 0, scaleX: 1, rotate: 0 }, { type: "spring", ...cfg }],
            [rightArm, { x: 0, y: 0, scaleX: 1, rotate: 0 }, { type: "spring", ...cfg }],
            [body, { y: 0 }, { type: "spring", ...cfg }]
          ]);
        }
      } finally {
        isAnimatingRef.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Small debounce to prevent firing constantly
      if (Math.abs(e.deltaY) < 30) return;
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
  }, [animate]);

  // ── Active Jump Behavior (Hover) ────────────────────────────────────────
  const triggerJump = async () => {
    if (isFatiguedRef.current || isAnimatingRef.current || !scope.current) return;
    isAnimatingRef.current = true;
    try {
      const body = scope.current.querySelector('.robot-body-wrapper');
      if (body) {
        // Vertical jumping animation with squash-and-stretch
        await animate(body, { y: [0, -25, 0], scaleY: [1, 0.7, 1.2, 1], scaleX: [1, 1.2, 0.8, 1] }, { duration: 0.5, ease: "easeInOut" });
      }
    } finally {
      isAnimatingRef.current = false;
    }
  };

  // ── Colors & Styles ──────────────────────────────────────────────────────
  const primaryColor = isFatigued ? "rgba(255, 69, 0, 1)" : "rgba(0, 243, 255, 1)";
  const secondaryColor = isFatigued ? "rgba(255, 165, 0, 0.5)" : "rgba(0, 243, 255, 0.2)";
  const glowShadow = isFatigued
    ? "drop-shadow(0 0 15px rgba(255, 69, 0, 0.6)) drop-shadow(0 0 5px rgba(255, 165, 0, 0.8))"
    : "drop-shadow(0 0 15px rgba(0, 243, 255, 0.6)) drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))";

  // Slumped orientation angle when fatigued
  const bodySlump = isFatigued ? 10 : 0;

  return (
    <div 
      ref={scope} 
      className="flex flex-col items-center justify-center gap-6 select-none relative w-full h-full"
      onMouseEnter={triggerJump}
    >
      <motion.div 
        ref={robotRef}
        className="robot-body-wrapper relative w-32 h-48 flex flex-col items-center justify-center z-10"
        style={{ perspective: 1000 }}
        animate={{ rotateZ: bodySlump }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      >
        {/* Robot Main SVG with 3D Torso/Head Tilt */}
        <motion.div
          className="relative w-full h-full flex flex-col items-center justify-center"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d", filter: glowShadow }}
        >
          {/* Antenna */}
          <motion.div 
            className="w-1.5 h-6 rounded-t-full absolute -top-4"
            style={{ backgroundColor: primaryColor, boxShadow: `0 0 10px ${primaryColor}` }}
          />
          <motion.div 
            className="w-3 h-3 rounded-full absolute -top-5"
            style={{ backgroundColor: primaryColor, boxShadow: `0 0 15px ${primaryColor}` }}
            animate={{ scale: isFatigued ? 1 : [1, 1.5, 1], opacity: isFatigued ? 0.5 : [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />

          {/* Head */}
          <motion.div 
            className="w-20 h-16 rounded-[1rem] flex items-center justify-center relative border-[3px] bg-black/80 backdrop-blur-md z-20 overflow-hidden"
            style={{ borderColor: primaryColor, rotateX: headRotateX, rotateY: headRotateY, transformStyle: "preserve-3d" }}
          >
            {/* Visor glass effect */}
            <div className="absolute inset-x-2 inset-y-3 bg-gradient-to-b from-white/10 to-transparent rounded-lg pointer-events-none" />
            
            {/* Eyes */}
            <div className="flex gap-4 z-10 relative" style={{ transform: "translateZ(15px)" }}>
              <motion.div 
                className="w-3.5 h-5 rounded-full"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 10px ${primaryColor}` }}
                animate={{ 
                  scaleY: isFatigued ? 0.3 : 1, 
                  opacity: isFatigued ? [0.4, 0.7, 0.4] : 1 
                }}
                transition={{ duration: isFatigued ? 2 : 0.3, repeat: isFatigued ? Infinity : 0 }}
              />
              <motion.div 
                className="w-3.5 h-5 rounded-full"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 10px ${primaryColor}` }}
                animate={{ 
                  scaleY: isFatigued ? 0.3 : 1, 
                  opacity: isFatigued ? [0.4, 0.7, 0.4] : 1 
                }}
                transition={{ duration: isFatigued ? 2 : 0.3, repeat: isFatigued ? Infinity : 0, delay: 0.1 }}
              />
            </div>
          </motion.div>

          {/* Neck */}
          <div className="w-4 h-3 bg-black border-x-[2px] z-10" style={{ borderColor: primaryColor }} />

          {/* Torso */}
          <motion.div 
            className="w-24 h-20 rounded-[1.2rem] border-[3px] bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center overflow-hidden relative"
            style={{ borderColor: primaryColor }}
          >
            {/* Glass core */}
            <div className="w-16 h-12 rounded-lg border border-white/10 flex items-center justify-center relative bg-white/[0.02]">
              <motion.div 
                className="w-8 h-8 rounded-full"
                style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }}
                animate={{ opacity: isFatigued ? [0.2, 0.4, 0.2] : [0.5, 1, 0.5], scale: isFatigued ? 0.8 : [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: isFatigued ? 3 : 2 }}
              />
            </div>
          </motion.div>

          {/* Motorized Treads / Legs */}
          <div className="flex gap-6 mt-1 z-10">
            <motion.div 
              className="w-6 h-6 rounded-md border-[2px] bg-black/90 flex items-center justify-center overflow-hidden"
              style={{ borderColor: primaryColor }}
            >
              <div className="w-full h-1 bg-white/20" />
            </motion.div>
            <motion.div 
              className="w-6 h-6 rounded-md border-[2px] bg-black/90 flex items-center justify-center overflow-hidden"
              style={{ borderColor: primaryColor }}
            >
              <div className="w-full h-1 bg-white/20" />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Jointed SVG Arms (Absolute positioned to shoot outwards) ── */}
        <motion.div 
          className="robot-left-arm absolute top-24 -left-4 w-12 h-4 rounded-full border-[2px] bg-black/80 origin-right z-30"
          style={{ borderColor: primaryColor, boxShadow: `0 0 8px ${primaryColor}` }}
        />
        <motion.div 
          className="robot-right-arm absolute top-24 -right-4 w-12 h-4 rounded-full border-[2px] bg-black/80 origin-left z-0"
          style={{ borderColor: primaryColor, boxShadow: `0 0 8px ${primaryColor}` }}
        />
      </motion.div>

      {/* ── Status HUD ─────────────────────────────────────────────────── */}
      <div className="text-center mt-4">
        <motion.div
          className="text-[11px] font-black tracking-[0.25em] uppercase"
          animate={{ color: primaryColor }}
          transition={{ duration: 1.5 }}
          style={{ textShadow: `0 0 10px ${primaryColor}` }}
        >
          {isFatigued ? "EXHAUSTED" : viewedCount >= 15 ? "TIRED" : viewedCount >= 8 ? "ACTIVE" : "READY"}
        </motion.div>
        <p className="text-white/30 text-[10px] mt-1 font-mono">{viewedCount} VIEWED</p>
        
        {/* Fatigue Progress */}
        <div className="w-20 h-1.5 bg-white/[0.05] rounded-full overflow-hidden mt-3 border border-white/5">
          <motion.div
            className="h-full rounded-full"
            animate={{
              width: `${Math.min(100, (viewedCount / 25) * 100)}%`,
              backgroundColor: primaryColor,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
