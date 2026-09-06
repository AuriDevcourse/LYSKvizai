"use client";

import { useState, useRef } from "react";
import { Upload, X, Link as LinkIcon, Loader2, Music, Video } from "lucide-react";
import { editorFetch, EditorAuthError } from "@/lib/editor-auth";

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const info = LABEL_MAP[type];
  const Icon = info.icon;

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await editorFetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
    } catch (e) {
      console.error("Upload failed", e);
      setUploadError(
        e instanceof EditorAuthError
          ? "Editor password required — save the quiz to unlock, then retry."
          : e instanceof Error ? e.message : "Upload failed"
      );
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
      <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-white/8 bg-white/5 px-4 py-3">
        <Icon className="h-5 w-5 shrink-0 text-white" />
        <span className="flex-1 truncate text-sm text-white/70">{value}</span>
        <button
          onClick={() => onChange(undefined)}
          className="rounded-lg p-1.5 text-red-400/60 hover:bg-[#ff716c]/20 hover:text-red-400"
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
              ? "bg-white/5 text-white/80"
              : "bg-white/5 text-white/50 hover:bg-white/5"
          }`}
        >
          <Upload className="mr-1 inline h-3 w-3" />
          File
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "url"
              ? "bg-white/5 text-white/80"
              : "bg-white/5 text-white/50 hover:bg-white/5"
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
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/8 bg-white/[0.02] px-4 py-6 transition-colors hover:border-white/10 hover:bg-white/5"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <>
              <Icon className="h-6 w-6 text-white/40" />
              <p className="text-xs text-white/40">
                Drop a file or click ({info.hint})
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
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            placeholder={type === "video" ? "https://youtube.com/watch?v=..." : "https://example.com/audio.mp3"}
            className="flex-1 rounded-lg border-[1.5px] border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="min-h-[44px] rounded-lg bg-[#ff9062] px-4 text-sm font-bold text-black transition-colors hover:bg-[#ff793e]"
          >
            Add
          </button>
        </div>
      )}
      {uploadError && (
        <p role="alert" className="mt-2 rounded-lg border-[1.5px] border-[#ff716c]/30 bg-[#ff716c]/10 px-3 py-2 text-xs text-[#ff716c]">
          {uploadError}
        </p>
      )}
    </div>
  );
}
