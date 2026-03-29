"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  url: string;
  size?: number;
}

export default function QRCode({ url, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: { dark: "#e8590c", light: "#ffffff" },
    });
  }, [url, size]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl"
      style={{ width: size, height: size }}
    />
  );
}
