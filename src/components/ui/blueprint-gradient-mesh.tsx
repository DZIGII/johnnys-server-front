"use client";

import React, { useEffect, useRef } from "react";

/* =========================
   Utils
   ========================= */
type Offset = { x: number; y: number };

const setHiDPICanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const parent = canvas.parentElement;
  const cw = (parent?.clientWidth ?? window.innerWidth) | 0;
  const ch = (parent?.clientHeight ?? window.innerHeight) | 0;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  canvas.width = Math.floor(cw * dpr);
  canvas.height = Math.floor(ch * dpr);
  canvas.style.width = cw + "px";
  canvas.style.height = ch + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

const originFromOffset = (offset: Offset, cell: number) => ({
  x: -((offset.x % cell) + cell) % cell,
  y: -((offset.y % cell) + cell) % cell,
});

/* =========================
   Film grain
   ========================= */
const Noise: React.FC<{ refresh?: number; alpha?: number }> = ({ refresh = 2, alpha = 10 }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d", { alpha: true });
    if (!ctx) return;

    let f = 0;
    let id = 0;
    const S = 1024;

    const resize = () => {
      c.width = S;
      c.height = S;
      c.style.width = "100vw";
      c.style.height = "100vh";
    };

    const draw = () => {
      const img = ctx.createImageData(S, S);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = alpha;
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = () => {
      if (f % refresh === 0) draw();
      f++;
      id = requestAnimationFrame(loop);
    };

    addEventListener("resize", resize);
    resize();
    loop();
    return () => {
      removeEventListener("resize", resize);
      cancelAnimationFrame(id);
    };
  }, [refresh, alpha]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0"
      style={{ imageRendering: "pixelated" }}
    />
  );
};

/* =========================
   Moving grid
   ========================= */
interface GridProps {
  squareSize: number;
  borderColor: string;
  vignette?: boolean;
  gridOffsetRef: React.MutableRefObject<Offset>;
  className?: string;
}

const MovingGrid: React.FC<GridProps> = ({
  squareSize,
  borderColor,
  vignette = true,
  gridOffsetRef,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      ctx.clearRect(0, 0, cw, ch);

      const origin = originFromOffset(gridOffsetRef.current, squareSize);

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;

      for (let x = origin.x; x < cw + squareSize; x += squareSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, ch);
        ctx.stroke();
      }
      for (let y = origin.y; y < ch + squareSize; y += squareSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(cw, y + 0.5);
        ctx.stroke();
      }

      if (vignette) {
        const grad = ctx.createRadialGradient(
          cw / 2, ch / 2, 0,
          cw / 2, ch / 2, Math.sqrt(cw * cw + ch * ch) / 2
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.50)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      }

      raf.current = requestAnimationFrame(draw);
    };

    const resize = () => setHiDPICanvas(canvas, ctx);
    resize();
    raf.current = requestAnimationFrame(draw);
    addEventListener("resize", resize);
    return () => {
      removeEventListener("resize", resize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [squareSize, borderColor, vignette, gridOffsetRef]);

  return <canvas ref={canvasRef} className={`block h-full w-full border-none ${className}`} />;
};

/* =========================
   Interactive hover cell
   ========================= */
interface HoverProps {
  squareSize: number;
  hoverFillColor: string | CanvasGradient | CanvasPattern;
  hoverStrokeColor: string | CanvasGradient | CanvasPattern;
  hoverGlowColor: string | CanvasGradient | CanvasPattern;
  gridOffsetRef: React.MutableRefObject<Offset>;
  className?: string;
}

const SquaresInteractive: React.FC<HoverProps> = ({
  squareSize,
  hoverFillColor,
  hoverStrokeColor,
  hoverGlowColor,
  gridOffsetRef,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredRef = useRef<{ x: number; y: number } | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.pointerEvents = "auto";
    canvas.style.cursor = "crosshair";
    canvas.style.background = "transparent";

    const draw = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      ctx.clearRect(0, 0, cw, ch);

      if (hoveredRef.current) {
        const { x: gx, y: gy } = hoveredRef.current;
        const origin = originFromOffset(gridOffsetRef.current, squareSize);
        const cellX = origin.x + gx * squareSize;
        const cellY = origin.y + gy * squareSize;

        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = hoverGlowColor as string;
        ctx.fillStyle = hoverFillColor as string;
        ctx.fillRect(cellX, cellY, squareSize, squareSize);
        ctx.restore();

        ctx.lineWidth = 1;
        ctx.strokeStyle = hoverStrokeColor as string;
        ctx.strokeRect(cellX + 0.5, cellY + 0.5, squareSize - 1, squareSize - 1);

        const grad = ctx.createLinearGradient(cellX, cellY, cellX, cellY + squareSize);
        grad.addColorStop(0, "rgba(255,255,255,0.10)");
        grad.addColorStop(1, "rgba(255,255,255,0.02)");
        ctx.fillStyle = grad;
        ctx.fillRect(cellX, cellY, squareSize, squareSize);
      }

      raf.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const origin = originFromOffset(gridOffsetRef.current, squareSize);
      const gx = Math.floor((mouseX - origin.x) / squareSize);
      const gy = Math.floor((mouseY - origin.y) / squareSize);
      hoveredRef.current = { x: gx, y: gy };
    };

    const onMouseLeave = () => { hoveredRef.current = null; };
    const resize = () => setHiDPICanvas(canvas, ctx);

    resize();
    raf.current = requestAnimationFrame(draw);
    addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [squareSize, hoverFillColor, hoverStrokeColor, hoverGlowColor, gridOffsetRef]);

  return <canvas ref={canvasRef} className={`block h-full w-full border-none ${className}`} />;
};

/* =========================
   Combined component — Orange-Black theme
   ========================= */
type Direction = "right" | "left" | "up" | "down" | "diagonal";

interface CombinedProps {
  showGrid?: boolean;
  direction?: Direction;
  speed?: number;
  squareSize?: number;
  borderColor?: string;
  vignette?: boolean;
  hoverFillColor?: string;
  hoverStrokeColor?: string;
  hoverGlowColor?: string;
  className?: string;
  /** If true, renders as absolute fill instead of fixed */
  contained?: boolean;
}

export default function BlueprintGradientMesh({
  showGrid = true,
  direction = "diagonal",
  speed = 0.25,
  squareSize = 44,
  // 🎨 Orange-black palette
  borderColor = "rgba(255, 122, 26, 0.18)",
  vignette = true,
  hoverFillColor = "rgba(255, 122, 26, 0.14)",
  hoverStrokeColor = "rgba(255, 160, 80, 0.75)",
  hoverGlowColor = "rgba(255, 122, 26, 0.35)",
  className = "",
  contained = false,
}: CombinedProps) {
  const gridOffsetRef = useRef<Offset>({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      const v = Math.max(speed, 0.1);
      const s = squareSize;
      switch (direction) {
        case "right":    gridOffsetRef.current.x = (gridOffsetRef.current.x - v + s) % s; break;
        case "left":     gridOffsetRef.current.x = (gridOffsetRef.current.x + v + s) % s; break;
        case "up":       gridOffsetRef.current.y = (gridOffsetRef.current.y + v + s) % s; break;
        case "down":     gridOffsetRef.current.y = (gridOffsetRef.current.y - v + s) % s; break;
        case "diagonal":
        default:
          gridOffsetRef.current.x = (gridOffsetRef.current.x - v + s) % s;
          gridOffsetRef.current.y = (gridOffsetRef.current.y - v + s) % s;
          break;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [direction, speed, squareSize]);

  const posClass = contained ? "absolute inset-0" : "fixed inset-0 z-0";

  return (
    <div
      className={`${posClass} ${className}`}
      style={{ background: "#0d0c0b" }}
    >
      {/* Orange spotlight */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_700px_at_50%_200px,rgba(255,122,26,0.13),transparent_70%)]" />

      {/* Grid */}
      {showGrid && (
        <div className="absolute inset-0 z-10">
          <MovingGrid
            squareSize={squareSize}
            borderColor={borderColor}
            vignette={vignette}
            gridOffsetRef={gridOffsetRef}
          />
        </div>
      )}

      {/* Interactive hover */}
      <div className="absolute inset-0 z-20">
        <SquaresInteractive
          squareSize={squareSize}
          hoverFillColor={hoverFillColor}
          hoverStrokeColor={hoverStrokeColor}
          hoverGlowColor={hoverGlowColor}
          gridOffsetRef={gridOffsetRef}
        />
      </div>

      {/* Film grain */}
      <div className="pointer-events-none absolute inset-0 z-30">
        <Noise refresh={2} alpha={10} />
      </div>

      {/* Bottom fade to background color */}
      <div className="pointer-events-none absolute inset-0 z-40 bg-gradient-to-b from-transparent via-transparent to-[#0d0c0b]/95" />
    </div>
  );
}
