"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring, useVelocity, animate } from "framer-motion";

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
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Window Bounds & Reel Tracking ────────────────────────────────────────
  const [windowSize, setWindowSize] = useState({ w: 1440, h: 800 });
  const [reelBounds, setReelBounds] = useState({ x: 720, y: 400, w: 400, h: 700 });
  const [hasReel, setHasReel] = useState(false);

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const updateCachedReel = () => {
      const activeReel = document.querySelector('[data-active="true"]');
      if (activeReel) {
        const rect = activeReel.getBoundingClientRect();
        setReelBounds({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          w: rect.width,
          h: rect.height
        });
        setHasReel(true);
      } else {
        setHasReel(false);
      }
    };
    updateCachedReel();
    const interval = setInterval(updateCachedReel, 1000);
    return () => clearInterval(interval);
  }, [windowSize]);

  // ── Colors & Glows ──────────────────────────────────────────────────────
  const pColor = isFatigued ? "#ff4500" : "#00f3ff";
  const pGlow = isFatigued 
    ? "drop-shadow(0 0 15px rgba(255, 69, 0, 0.8))" 
    : "drop-shadow(0 0 15px rgba(0, 243, 255, 0.8))";

  // ── Drag & Physics ──────────────────────────────────────────────────────
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const velocityX = useVelocity(dragX);
  
  // Dynamic tilt based on drag velocity
  const rotateZ = useTransform(velocityX, [-1000, 1000], [-35, 35]);
  const [isDragging, setIsDragging] = useState(false);

  // Field Stretch link properties
  const fieldOpacity = useTransform(dragX, [-200, 0, 200], [0.8, 0, 0.8]);
  const fieldScaleY = useTransform(dragY, [-200, 0, 200], [2, 1, 2]);
  const beamRotate = useTransform(dragX, [-200, 200], [-45, 45]);

  const onDragStart = () => setIsDragging(true);
  const onDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    const v = info.velocity.x;
    
    // Twist wildly based on flick velocity
    animate(".robot-orb-body", { 
      rotateZ: [0, v * 0.05, -v * 0.02, 0] 
    }, { duration: 0.8, ease: "easeInOut" });

    // Both hands mirror the shake
    animate(".wireless-hand", {
      x: [0, v * 0.01, -v * 0.005, 0],
      rotateZ: [0, v * 0.02, -v * 0.01, 0]
    }, { duration: 0.8, ease: "easeInOut" });
  };

  // ── Navigation Thrust (Scroll/Keys) ─────────────────────────────────────
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const triggerPush = async (dir: "up" | "down") => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      try {
        // 1. The Kinetic Impact Sync (Force Phase)
        const thrustY = dir === "down" ? -80 : 80;
        
        // Emitter Ports flash
        animate(".emitter-port", 
          { 
            scale: [1, 1.8, 1], 
            backgroundColor: ["rgba(255,255,255,0.1)", pColor, "rgba(255,255,255,0.1)"], 
            boxShadow: [`inset 0 0 5px rgba(0,0,0,0.5)`, `0 0 30px ${pColor}, inset 0 0 5px white`, `inset 0 0 5px rgba(0,0,0,0.5)`] 
          },
          { duration: 0.5 }
        );

        // Hands strike
        await animate(".wireless-hand", 
          { y: thrustY, scale: 1.15, filter: pGlow }, 
          { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
        );

        // 2. The Drift and Elastic Recovery Phase
        // Follow scrolling card for fraction, then decay
        await animate(".wireless-hand",
          { y: [thrustY, thrustY * 0.4, 0], scale: 1, filter: "drop-shadow(0 0 0px rgba(0,0,0,0))" },
          { duration: 0.4, times: [0, 0.3, 1], type: "spring", stiffness: 180, damping: 25 }
        );

      } finally {
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
  }, [pColor, pGlow]);

  return (
    <>
      {/* ── GLOBAL LAYER: Wireless Detached Hands ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-visible" style={{ display: hasReel ? "block" : "none" }}>
        {/* Left Hand */}
        <motion.div 
          className="wireless-hand absolute top-1/2 -translate-y-1/2"
          style={{ left: reelBounds.x - reelBounds.w / 2 - 50, width: 40, height: 160 }}
        >
          <svg viewBox="0 0 40 160" className="w-full h-full overflow-visible">
            {/* Crescent Ring ( ) */}
            <path d="M 35 10 Q -5 80 35 150" fill="none" stroke="url(#handGradient)" strokeWidth="10" strokeLinecap="round" className="drop-shadow-[0_0_10px_#6366f1]" />
            {/* High-frequency electrical wave gap */}
            <motion.path 
              d="M 40 20 Q 15 80 40 140" 
              fill="none" stroke={pColor} strokeWidth="3" strokeLinecap="round"
              animate={{ pathLength: [0.1, 1, 0.1], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="drop-shadow-[0_0_12px_rgba(0,243,255,0.8)]"
            />
          </svg>
        </motion.div>

        {/* Right Hand */}
        <motion.div 
          className="wireless-hand absolute top-1/2 -translate-y-1/2"
          style={{ left: reelBounds.x + reelBounds.w / 2 + 10, width: 40, height: 160 }}
        >
          <svg viewBox="0 0 40 160" className="w-full h-full overflow-visible">
            {/* Crescent Ring ( ) */}
            <path d="M 5 10 Q 45 80 5 150" fill="none" stroke="url(#handGradient)" strokeWidth="10" strokeLinecap="round" className="drop-shadow-[0_0_10px_#6366f1]" />
            {/* High-frequency electrical wave gap */}
            <motion.path 
              d="M 0 20 Q 25 80 0 140" 
              fill="none" stroke={pColor} strokeWidth="3" strokeLinecap="round"
              animate={{ pathLength: [0.1, 1, 0.1], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.3 }}
              className="drop-shadow-[0_0_12px_rgba(0,243,255,0.8)]"
            />
          </svg>
        </motion.div>
      </div>

      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="handGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── SIDEBAR LAYER: Main Drone Pod ─────────────────────────────── */}
      <div className="flex flex-col items-center justify-center relative w-full h-full select-none" ref={containerRef}>
        
        {/* Magnetic Ripple Cushion (Anchored to base) */}
        <div className="absolute top-[60%] w-36 h-12 flex items-center justify-center pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-full h-full rounded-[100%] border-[2px] border-cyan-400 blur-[3px]"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.1, 0.6, 0.1] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.8, ease: "easeInOut" }}
            />
          ))}
          {/* Intense center engine glow */}
          <div className="absolute w-16 h-6 rounded-[100%] bg-cyan-400 blur-xl opacity-50" />
        </div>

        {/* Dynamic Glowing Beam Link (Stretches on drag) */}
        <motion.div 
          className="absolute top-[50%] w-2 rounded-full bg-gradient-to-t from-cyan-400 to-transparent blur-[4px] origin-bottom pointer-events-none z-10"
          style={{ height: 100, scaleY: fieldScaleY, opacity: fieldOpacity, rotateZ: beamRotate }}
        />

        {/* The Draggable Orb Core */}
        <motion.div 
          className="robot-orb-body relative w-32 h-32 cursor-grab active:cursor-grabbing z-20"
          drag
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          dragElastic={0.3}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          style={{ x: dragX, y: dragY, rotateZ: rotateZ }}
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          {/* Orb Shell Canvas */}
          <div className="absolute inset-0 rounded-full backdrop-blur-xl bg-white/[0.03] border border-white/20 shadow-[inset_0_0_30px_rgba(255,255,255,0.1),_0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden flex items-center justify-center">
            
            {/* The Central Illuminated Core */}
            <motion.div 
              className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_40px_rgba(99,102,241,0.6)]"
              animate={{ scale: isDragging ? 1.2 : [1, 1.15, 1], opacity: isDragging ? 1 : [0.8, 1, 0.8] }}
              transition={{ repeat: isDragging ? 0 : Infinity, duration: 2, ease: "easeInOut" }}
            />
            
            {/* Frosted Inner Reflection */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />
            
            {/* Left Magnetic Shoulder Port */}
            <div className="emitter-port absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 border border-white/30 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
            </div>
            
            {/* Right Magnetic Shoulder Port */}
            <div className="emitter-port absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 border border-white/30 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-black/50" />
            </div>
          </div>
        </motion.div>

        {/* ── Status HUD ─────────────────────────────────────────────────── */}
        <div className="absolute bottom-6 text-center w-full z-10 pointer-events-none">
          <motion.div
            className="text-[10px] font-black tracking-[0.3em] uppercase"
            animate={{ color: pColor }}
            style={{ textShadow: `0 0 8px ${pColor}` }}
          >
            {isFatigued ? "EXHAUSTED" : viewedCount >= 15 ? "TIRED" : "ACTIVE"}
          </motion.div>
        </div>

      </div>
    </>
  );
}
