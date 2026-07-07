"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, useAnimate } from "framer-motion";

interface ReelsSidebarRobotProps {
  viewedCount: number;
  disableAnimations?: boolean;
}

/**
 * Reels PC Sidebar Robot with:
 * - Mouse-tracking 3D tilt (useTransform on mouseX/mouseY → rotateX/Y)
 * - Scroll push/pull arm mechanics (useAnimate imperative)
 * - Fatigue Engine: color + spring physics degrade after 25 reels
 * - Low-end kill switch via `disableAnimations` prop
 */
export function ReelsSidebarRobot({ viewedCount, disableAnimations = false }: ReelsSidebarRobotProps) {
  if (disableAnimations) return null;
  return <RobotInner viewedCount={viewedCount} />;
}

function RobotInner({ viewedCount }: { viewedCount: number }) {
  const isFatigued = viewedCount >= 25;
  const [scope, animate] = useAnimate();
  const armRef = useRef<SVGRectElement>(null);
  const [lastScrollDir, setLastScrollDir] = useState<"up" | "down" | null>(null);
  // Track in-flight animation to avoid stacking concurrent pushes
  const isAnimatingRef = useRef(false);

  // ── Motion values for mouse tracking ────────────────────────────────────
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Window dimensions captured once per mount; safe in "use client"
  const windowW = useRef(typeof window !== "undefined" ? window.innerWidth : 1440);
  const windowH = useRef(typeof window !== "undefined" ? window.innerHeight : 800);

  const rotateX = useTransform(mouseY, [0, windowH.current], [15, -15]);
  const rotateY = useTransform(mouseX, [0, windowW.current], [-15, 15]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // ── Spring config: memoised so scroll useEffect dep array is stable ─────
  // FIX: useMemo prevents a new object reference on every render,
  // which would cause the scroll useEffect to re-subscribe unnecessarily.
  const springConfig = useMemo(
    () =>
      isFatigued
        ? { stiffness: 40, damping: 30 }   // sluggish, heavy
        : { stiffness: 250, damping: 20 }, // snappy, robotic
    [isFatigued]
  );

  // Keep a ref so the scroll handler always reads the latest config
  // without needing to be in the dep array.
  const springConfigRef = useRef(springConfig);
  useEffect(() => { springConfigRef.current = springConfig; }, [springConfig]);
  const isFatiguedRef = useRef(isFatigued);
  useEffect(() => { isFatiguedRef.current = isFatigued; }, [isFatigued]);

  // ── Scroll / key press mechanics ────────────────────────────────────────
  useEffect(() => {
    const triggerPush = async (dir: "up" | "down") => {
      if (!armRef.current || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      setLastScrollDir(dir);
      const yOffset = dir === "down" ? 18 : -18;
      const cfg = springConfigRef.current;
      const fatigued = isFatiguedRef.current;

      try {
        if (fatigued) {
          await animate(
            armRef.current,
            { y: yOffset, scaleY: 1.4, x: [-3, 3, -2, 2, 0] },
            { type: "spring", ...cfg }
          );
        } else {
          await animate(
            armRef.current,
            { y: yOffset, scaleY: 1.4 },
            { type: "spring", ...cfg }
          );
        }
        await animate(
          armRef.current,
          { y: 0, scaleY: 1, x: 0 },
          { type: "spring", stiffness: 300, damping: 25 }
        );
      } finally {
        isAnimatingRef.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 20) return;
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
    // Stable dep array: no springConfig object, no isFatigued — both read via refs
  }, [animate]);

  // ── Colors ───────────────────────────────────────────────────────────────
  const strokeColor = isFatigued ? "#ff4500" : "#00f3ff";
  const glowFilter = isFatigued
    ? "drop-shadow(0 0 10px #ff450060)"
    : "drop-shadow(0 0 12px #00f3ff50)";

  // ── Fatigue indicator label ──────────────────────────────────────────────
  const fatigueLabel =
    viewedCount >= 25 ? "EXHAUSTED" :
    viewedCount >= 15 ? "TIRED" :
    viewedCount >= 8  ? "ACTIVE" : "READY";

  return (
    <div ref={scope} className="flex flex-col items-center gap-3 select-none">
      {/* Robot SVG with 3D tilt */}
      <motion.svg
        viewBox="0 0 100 140"
        width="100"
        height="140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: glowFilter,
          rotateX,
          rotateY,
          perspective: 600,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Antenna */}
        <motion.line
          x1="50" y1="12" x2="50" y2="24"
          stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 1.5 }}
        />
        <motion.circle
          cx="50" cy="9" r="4"
          fill={strokeColor}
          animate={{
            fill: strokeColor,
            r: [4, 5.5, 4],
          }}
          transition={{ r: { repeat: Infinity, duration: isFatigued ? 3 : 1.2, ease: "easeInOut" } }}
        />

        {/* Head */}
        <motion.rect
          x="22" y="24" width="56" height="44" rx="12"
          stroke={strokeColor} strokeWidth="2.5" fill="rgba(0,0,0,0.75)"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 1.5 }}
        />

        {/* Eyes — half-closed when fatigued */}
        <motion.circle
          cx="33" cy="44" r="5"
          fill={strokeColor}
          animate={{
            fill: strokeColor,
            scaleY: isFatigued ? 0.4 : 1,
            opacity: isFatigued ? [0.5, 0.8, 0.5] : [0.7, 1, 0.7],
          }}
          transition={{
            scaleY: { type: "spring", ...springConfig },
            opacity: { repeat: Infinity, duration: isFatigued ? 4 : 2.5, ease: "easeInOut" },
            fill: { duration: 1.5 },
          }}
        />
        <motion.circle
          cx="67" cy="44" r="5"
          fill={strokeColor}
          animate={{
            fill: strokeColor,
            scaleY: isFatigued ? 0.4 : 1,
            opacity: isFatigued ? [0.5, 0.8, 0.5] : [0.7, 1, 0.7],
          }}
          transition={{
            scaleY: { type: "spring", ...springConfig },
            opacity: { repeat: Infinity, duration: isFatigued ? 4 : 2.5, ease: "easeInOut", delay: 0.2 },
            fill: { duration: 1.5 },
          }}
        />

        {/* Mouth — droop when fatigued */}
        <motion.path
          animate={{
            d: isFatigued
              ? "M 33 62 Q 50 57 67 62"  // slight frown
              : "M 33 61 Q 50 65 67 61", // gentle smile
            stroke: strokeColor,
          }}
          stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" fill="none"
          transition={{ type: "spring", stiffness: 100, damping: 20, stroke: { duration: 1.5 } }}
        />

        {/* Neck */}
        <rect x="44" y="68" width="12" height="8" rx="2" fill={strokeColor} />

        {/* Body */}
        <motion.rect
          x="16" y="76" width="68" height="50" rx="14"
          stroke={strokeColor} strokeWidth="2.5" fill="rgba(0,0,0,0.65)"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 1.5 }}
        />

        {/* Scroll icon on body */}
        <motion.g
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: isFatigued ? 3.5 : 1.8 }}
        >
          <circle cx="50" cy="101" r="10" stroke={strokeColor} strokeWidth="1.5" fill="none" />
          <line x1="50" y1="95" x2="50" y2="107" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
          <polyline
            points={lastScrollDir === "up" ? "46,99 50,95 54,99" : "46,103 50,107 54,103"}
            stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
        </motion.g>

        {/* Left arm — ref for imperative animate */}
        <motion.rect
          ref={armRef as any}
          x="2" y="82" width="12" height="28" rx="6"
          stroke={strokeColor} strokeWidth="2" fill="rgba(0,0,0,0.5)"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 1.5 }}
          style={{ originX: "14px", originY: "96px" }}
        />
        {/* Right arm */}
        <motion.rect
          x="86" y="82" width="12" height="28" rx="6"
          stroke={strokeColor} strokeWidth="2" fill="rgba(0,0,0,0.5)"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 1.5 }}
        />

        {/* Legs */}
        <rect x="28" y="126" width="16" height="12" rx="6" stroke={strokeColor} strokeWidth="2" fill="rgba(0,0,0,0.5)" />
        <rect x="56" y="126" width="16" height="12" rx="6" stroke={strokeColor} strokeWidth="2" fill="rgba(0,0,0,0.5)" />
      </motion.svg>

      {/* Status readout */}
      <div className="text-center">
        <motion.p
          className="text-[10px] font-bold tracking-[0.2em] uppercase"
          animate={{ color: strokeColor }}
          transition={{ duration: 1.5 }}
        >
          {fatigueLabel}
        </motion.p>
        <p className="text-white/20 text-[9px] mt-0.5">{viewedCount} viewed</p>
      </div>

      {/* Fatigue progress bar */}
      <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          animate={{
            width: `${Math.min(100, (viewedCount / 25) * 100)}%`,
            backgroundColor: strokeColor,
          }}
          transition={{ duration: 0.6, ease: "easeOut", backgroundColor: { duration: 1.5 } }}
        />
      </div>
    </div>
  );
}
