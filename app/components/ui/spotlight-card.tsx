"use client";

import React, { useEffect, useRef, ReactNode } from "react";

// Single global listener shared across all GlowCard instances
let globalListenerCount = 0;
let globalRaf: number;
function startGlobalListener() {
  if (globalListenerCount++ > 0) return;
  const handler = (e: PointerEvent) => {
    cancelAnimationFrame(globalRaf);
    globalRaf = requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--gx", e.clientX.toFixed(2));
      document.documentElement.style.setProperty("--gxp", (e.clientX / window.innerWidth).toFixed(2));
      document.documentElement.style.setProperty("--gy", e.clientY.toFixed(2));
      document.documentElement.style.setProperty("--gyp", (e.clientY / window.innerHeight).toFixed(2));
    });
  };
  document.addEventListener("pointermove", handler, { passive: true });
  (startGlobalListener as any)._handler = handler;
}
function stopGlobalListener() {
  if (--globalListenerCount > 0) return;
  document.removeEventListener("pointermove", (startGlobalListener as any)._handler);
}

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "blue" | "purple" | "green" | "red" | "orange";
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

const beforeAfterStyles = `
  [data-glow]::before,
  [data-glow]::after {
    pointer-events: none;
    content: "";
    position: absolute;
    inset: calc(var(--border-size) * -1);
    border: var(--border-size) solid transparent;
    border-radius: calc(var(--radius) * 1px);
    background-attachment: fixed;
    background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
    background-repeat: no-repeat;
    background-position: 50% 50%;
    mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
    mask-clip: padding-box, border-box;
    mask-composite: intersect;
  }
  [data-glow]::before {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
      calc(var(--gx, 0) * 1px) calc(var(--gy, 0) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
    );
    filter: brightness(2);
  }
  [data-glow]::after {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
      calc(var(--gx, 0) * 1px) calc(var(--gy, 0) * 1px),
      hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
    );
  }
  [data-glow] [data-glow] {
    position: absolute;
    inset: 0;
    will-change: filter;
    opacity: var(--outer, 1);
    border-radius: calc(var(--radius) * 1px);
    border-width: calc(var(--border-size) * 20);
    filter: blur(calc(var(--border-size) * 10));
    background: none;
    pointer-events: none;
    border: none;
  }
  [data-glow] > [data-glow]::before {
    inset: -10px;
    border-width: 10px;
  }
`;

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  glowColor = "blue",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startGlobalListener();
    return () => stopGlobalListener();
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={{
          "--base": base,
          "--spread": spread,
          "--radius": "16",
          "--border": "1.5",
          "--backdrop": "transparent",
          "--backup-border": "rgba(255,255,255,0.06)",
          "--size": "250",
          "--outer": "1",
          "--border-size": "calc(var(--border, 2) * 1px)",
          "--spotlight-size": "calc(var(--size, 150) * 1px)",
          "--hue": "220",
          backgroundImage: `radial-gradient(
            var(--spotlight-size) var(--spotlight-size) at
            calc(var(--gx, 0) * 1px) calc(var(--gy, 0) * 1px),
            hsl(var(--hue, 210) 100% 70% / 0.05), transparent
          )`,
          backgroundAttachment: "fixed",
          border: "var(--border-size) solid var(--backup-border)",
          position: "relative",
          touchAction: "none",
        } as React.CSSProperties}
        className={`rounded-2xl relative ${className}`}
      >
        <div ref={innerRef} data-glow />
        {children}
      </div>
    </>
  );
};

export { GlowCard };
