"use client";

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  url: string;
  size?: number;
}

export default function QRCode({ url, size = 200 }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    QRCodeLib.toDataURL(url, {
      width: size * 2,
      margin: 2,
      color: { dark: "#e8590c", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-white/5"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR code"
      className="rounded-xl"
      width={size}
      height={size}
    />
  );
}
