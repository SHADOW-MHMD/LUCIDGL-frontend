"use client";

import { motion } from "framer-motion";

export type UploadStatus = "idle" | "dragging" | "success" | "error";

interface UploadRobotHelperProps {
  status: UploadStatus;
  className?: string;
}

/**
 * Native SVG robot with Framer Motion attribute animations.
 * All SVG elements are written inline — no external file imports —
 * so we can animate their paths, colors, and geometry directly.
 */
export function UploadRobotHelper({ status, className = "" }: UploadRobotHelperProps) {
  const isDragging = status === "dragging";
  const isSuccess = status === "success";
  const isError = status === "error";

  const strokeColor =
    isSuccess ? "#00ff88"
    : isError ? "#ff4444"
    : isDragging ? "#a78bfa"
    : "#00f3ff";

  const glowFilter =
    isSuccess ? "drop-shadow(0 0 12px #00ff8880)"
    : isError ? "drop-shadow(0 0 12px #ff444480)"
    : isDragging ? "drop-shadow(0 0 12px #a78bfa60)"
    : "drop-shadow(0 0 8px #00f3ff40)";

  // Eye props change per status
  const eyeOpenY = isDragging ? 37 : 40;
  const eyeOpenR = isDragging ? 7 : 5;

  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      // Error shake
      animate={
        isError
          ? { x: [-5, 5, -5, 5, -3, 3, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.svg
        viewBox="0 0 100 140"
        width="120"
        height="168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: glowFilter }}
        // Body float on dragging
        animate={{ y: isDragging ? -8 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        {/* ── Antenna ─────────────────────────────────────────────────── */}
        <motion.line
          x1="50" y1="12" x2="50" y2="24"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 0.5 }}
        />
        <motion.circle
          cx="50" cy="9" r="4"
          fill={strokeColor}
          animate={{ fill: strokeColor, r: isDragging ? 6 : 4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />

        {/* ── Head ─────────────────────────────────────────────────────── */}
        <motion.rect
          x="22" y="24" width="56" height="44" rx="12"
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="rgba(0,0,0,0.7)"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 0.5 }}
        />

        {/* ── Eyes ─────────────────────────────────────────────────────── */}
        {isError ? (
          // X eyes for error
          <>
            <motion.path
              d="M28 36 L38 46"
              stroke="#ff4444" strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.path
              d="M38 36 L28 46"
              stroke="#ff4444" strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
            <motion.path
              d="M62 36 L72 46"
              stroke="#ff4444" strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.path
              d="M72 36 L62 46"
              stroke="#ff4444" strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          </>
        ) : (
          // Normal / wide eyes
          <>
            {/* Left eye */}
            <motion.circle
              cx="33" cy={eyeOpenY} r={eyeOpenR}
              fill={strokeColor}
              animate={{
                cy: eyeOpenY,
                r: eyeOpenR,
                fill: strokeColor,
                // Idle blink: opacity pulse
                opacity: status === "idle" ? [0.6, 1, 0.6] : 1,
              }}
              transition={
                status === "idle"
                  ? { opacity: { repeat: Infinity, duration: 3, ease: "easeInOut" }, cy: { type: "spring", stiffness: 200 } }
                  : { type: "spring", stiffness: 200, damping: 18 }
              }
            />
            {/* Right eye */}
            <motion.circle
              cx="67" cy={eyeOpenY} r={eyeOpenR}
              fill={strokeColor}
              animate={{
                cy: eyeOpenY,
                r: eyeOpenR,
                fill: strokeColor,
                opacity: status === "idle" ? [0.6, 1, 0.6] : 1,
              }}
              transition={
                status === "idle"
                  ? { opacity: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.15 }, cy: { type: "spring", stiffness: 200 } }
                  : { type: "spring", stiffness: 200, damping: 18 }
              }
            />
          </>
        )}

        {/* ── Mouth ────────────────────────────────────────────────────── */}
        <motion.path
          // Neutral: straight. Success: smile. Error/dragging: slight open.
          animate={{
            d: isSuccess
              ? "M 30 58 Q 50 72 70 58"   // big smile
              : isError
              ? "M 33 60 Q 50 56 67 60"   // slight frown
              : isDragging
              ? "M 33 60 Q 50 68 67 60"   // open mouth
              : "M 33 60 Q 50 62 67 60",  // neutral
            stroke: strokeColor,
          }}
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
        />

        {/* ── Neck ─────────────────────────────────────────────────────── */}
        <motion.rect
          x="44" y="68" width="12" height="8" rx="2"
          fill={strokeColor}
          animate={{ fill: strokeColor }}
          transition={{ duration: 0.5 }}
        />

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <motion.rect
          x="16" y="76" width="68" height="50" rx="14"
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="rgba(0,0,0,0.65)"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 0.5 }}
        />

        {/* Upload icon on body — an upward arrow */}
        <motion.g
          animate={{ opacity: isSuccess ? 0 : 1, y: isSuccess ? -4 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <line x1="50" y1="96" x2="50" y2="116" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
          <polyline points="42,104 50,96 58,104" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </motion.g>
        {/* Checkmark on success */}
        {isSuccess && (
          <motion.path
            d="M 36 101 L 47 112 L 64 93"
            stroke="#00ff88"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}

        {/* ── Left Arm ─────────────────────────────────────────────────── */}
        <motion.rect
          x="2" y="82" width="12" height="28" rx="6"
          stroke={strokeColor}
          strokeWidth="2"
          fill="rgba(0,0,0,0.5)"
          animate={{
            stroke: strokeColor,
            rotate: isDragging ? -20 : 0,
          }}
          style={{ originX: "14px", originY: "82px" }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        />
        {/* ── Right Arm ────────────────────────────────────────────────── */}
        <motion.rect
          x="86" y="82" width="12" height="28" rx="6"
          stroke={strokeColor}
          strokeWidth="2"
          fill="rgba(0,0,0,0.5)"
          animate={{
            stroke: strokeColor,
            rotate: isDragging ? 20 : 0,
          }}
          style={{ originX: "86px", originY: "82px" }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        />

        {/* ── Legs ─────────────────────────────────────────────────────── */}
        <motion.rect
          x="28" y="126" width="16" height="12" rx="6"
          stroke={strokeColor}
          strokeWidth="2"
          fill="rgba(0,0,0,0.5)"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 0.5 }}
        />
        <motion.rect
          x="56" y="126" width="16" height="12" rx="6"
          stroke={strokeColor}
          strokeWidth="2"
          fill="rgba(0,0,0,0.5)"
          animate={{ stroke: strokeColor }}
          transition={{ duration: 0.5 }}
        />
      </motion.svg>
    </motion.div>
  );
}
