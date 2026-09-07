"use client";

import { useEffect, useRef, useState } from "react";
import { buildMask, applyMaskedTint, type RegionMask } from "@/lib/color/recolour";

/**
 * Renders a local image with one colour region recoloured.
 *
 * The original pixels are held once and never mutated; every render writes a
 * fresh copy into the canvas. That's what keeps the transform reversible —
 * recolouring in place would stack each slider move on the last and drift.
 *
 * The mask is computed once when the image loads, not per frame: it depends on
 * the image and the target colour, neither of which changes while dragging.
 */
interface ImageTintProps {
  src: string;
  /** The colour treated as correct — the region to isolate. */
  targetHex: string;
  tolerance: number;
  hueShift: number;
  satScale: number;
  lightShift: number;
  /** Rendered width in CSS pixels. Height follows the image's aspect ratio. */
  width: number;
  className?: string;
  alt?: string;
  onReady?: (ok: boolean, maskedPixels: number) => void;
}

export default function ImageTint({
  src, targetHex, tolerance, hueShift, satScale, lightShift,
  width, className = "", alt, onReady,
}: ImageTintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<Uint8ClampedArray | null>(null);
  const destRef = useRef<Uint8ClampedArray | null>(null);
  const maskRef = useRef<RegionMask | null>(null);
  const dimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Load the image and compute the mask once.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setFailed(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      // Cap the working resolution. A 3000px source would make every slider
      // move rewrite 9 million pixels for no visible benefit.
      const MAX = 700;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      const off = document.createElement("canvas");
      off.width = w; off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) { setFailed(true); onReady?.(false, 0); return; }
      octx.drawImage(img, 0, 0, w, h);

      let pixels: Uint8ClampedArray;
      try {
        pixels = octx.getImageData(0, 0, w, h).data;
      } catch {
        // Tainted canvas — only possible with a cross-origin source.
        setFailed(true); onReady?.(false, 0); return;
      }

      sourceRef.current = new Uint8ClampedArray(pixels);
      destRef.current = new Uint8ClampedArray(pixels.length);
      maskRef.current = buildMask(sourceRef.current, targetHex, tolerance);
      dimsRef.current = { w, h };
      setReady(true);
      onReady?.(true, maskRef.current.count);
    };
    img.onerror = () => {
      if (cancelled) return;
      setFailed(true);
      onReady?.(false, 0);
    };
    img.src = src;

    return () => { cancelled = true; };
    // onReady is intentionally excluded — callers pass an inline function and
    // including it would reload the image on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, targetHex, tolerance]);

  // Repaint whenever the sliders move.
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const source = sourceRef.current;
    const dest = destRef.current;
    const mask = maskRef.current;
    if (!canvas || !source || !dest || !mask) return;

    const { w, h } = dimsRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    applyMaskedTint(source, dest, mask, hueShift, satScale, lightShift);
    // Go through createImageData rather than `new ImageData(dest, …)`: the
    // constructor requires a buffer typed as a plain ArrayBuffer, and copying
    // into a canvas-owned buffer sidesteps that without a cast.
    const frame = ctx.createImageData(w, h);
    frame.data.set(dest);
    ctx.putImageData(frame, 0, 0);
  }, [ready, hueShift, satScale, lightShift]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-white/15 text-center text-xs text-white/50 ${className}`}
        style={{ width, height: width * 0.75 }}
      >
        Couldn&apos;t load {src.split("/").pop()}
      </div>
    );
  }

  const { w, h } = dimsRef.current;
  const displayHeight = w > 0 ? (width * h) / w : width * 0.75;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height: displayHeight, imageRendering: "auto" }}
      role={alt ? "img" : "presentation"}
      aria-label={alt}
    />
  );
}
