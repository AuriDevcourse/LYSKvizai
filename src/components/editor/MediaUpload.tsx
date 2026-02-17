"use client";

import { useState, useRef } from "react";
import { Upload, X, Link as LinkIcon, Loader2, Music, Video } from "lucide-react";

interface MediaUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  type: "audio" | "video";
}

const ACCEPT_MAP = {
  audio: "audio/mpeg,audio/wav,audio/ogg,audio/webm",
  video: "video/mp4,video/webm,video/ogg",
};

const LABEL_MAP = {
  audio: { icon: Music, label: "Audio", hint: "MP3, WAV, OGG, max 10MB" },
  video: { icon: Video, label: "Video", hint: "MP4, WebM, max 20MB" },
};

export default function MediaUpload({ value, onChange, type }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const info = LABEL_MAP[type];
  const Icon = info.icon;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Klaida įkeliant");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
    }
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3">
        <Icon className="h-5 w-5 shrink-0 text-amber-400" />
        <span className="flex-1 truncate text-sm text-amber-200/70">{value}</span>
        <button
          onClick={() => onChange(undefined)}
          className="rounded-lg p-1.5 text-red-400/60 hover:bg-red-400/10 hover:text-red-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "file"
              ? "bg-amber-400/20 text-amber-200"
              : "bg-white/5 text-amber-200/50 hover:bg-white/10"
          }`}
        >
          <Upload className="mr-1 inline h-3 w-3" />
          Failas
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "url"
              ? "bg-amber-400/20 text-amber-200"
              : "bg-white/5 text-amber-200/50 hover:bg-white/10"
          }`}
        >
          <LinkIcon className="mr-1 inline h-3 w-3" />
          URL
        </button>
      </div>

      {mode === "file" ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] px-4 py-6 transition-colors hover:border-amber-400/30 hover:bg-amber-400/5"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          ) : (
            <>
              <Icon className="h-6 w-6 text-amber-200/40" />
              <p className="text-xs text-amber-200/40">
                Vilk failą arba paspausk ({info.hint})
              </p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_MAP[type]}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            placeholder={type === "video" ? "https://youtube.com/watch?v=..." : "https://example.com/audio.mp3"}
            className="flex-1 rounded-lg border-2 border-white/10 bg-white/5 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/30 focus:border-amber-400/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-400"
          >
            Pridėti
          </button>
        </div>
      )}
    </div>
  );
}
