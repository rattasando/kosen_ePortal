"use client";

import { useState, useRef, useCallback } from "react";

export default function HeroSection({ className = "", children }) {
  const [pos, setPos]       = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const [shining, setShining] = useState(false);
  const ref   = useRef(null);
  const timer = useRef(null);

  const onMove = useCallback((e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({
      x: ((e.clientX - r.left) / r.width)  * 100,
      y: ((e.clientY - r.top)  / r.height) * 100,
    });
  }, []);

  const onEnter = useCallback(() => {
    setHovered(true);
    setShining(false);
    clearTimeout(timer.current);
    // ให้ DOM reset ก่อน 1 frame แล้วค่อย trigger animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShining(true));
    });
    timer.current = setTimeout(() => setShining(false), 850);
  }, []);

  const onLeave = useCallback(() => {
    setHovered(false);
    setPos({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden ${className}`}
    >
      {children}

      {/* cursor-follow radial light */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: hovered ? 1 : 0,
          transition: "opacity 300ms",
          background: `radial-gradient(circle 420px at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.12), transparent 70%)`,
        }}
      />

      {/* shine sweep — fires once on every mouse enter */}
      {shining && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)",
            animation: "shineSweep 0.75s ease-out forwards",
          }}
        />
      )}
    </div>
  );
}
