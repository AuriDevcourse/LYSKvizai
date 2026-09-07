"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Crosshair, Trash2, X } from "lucide-react";
import { buildMask } from "@/lib/color/recolour";
import { rgbToHex } from "@/lib/color/convert";
import {
  fileToDownscaledImage, saveMyReference, loadMyReferences, deleteMyReference,
  type MyReference,
} from "@/lib/games/my-references";
import Modal from "@/components/ui/Modal";

/**
 * Add your own reference: drop an image, click the colour, name it, done.
 *
 * The colour is sampled from the image itself rather than typed, which is what
 * makes a user-added round factual in the only sense that matters here — the
 * "correct" answer is a measurement of the source art, not somebody's guess at
 * it. Clicking also removes the need for an external colour picker and a
 * hand-edited JSON file, which is what the first version required.
 *
 * The mask preview matters as much as the sample: tolerance is the difference
 * between selecting a character's body and selecting half the picture, and it's
 * impossible to judge without seeing it.
 */
interface ReferenceImporterProps {
  open: boolean;
  onClose: () => void;
  /** Called after any change. Receives the new reference on a save, nothing on a delete. */
  onSaved: (saved?: MyReference) => void;
}

export default function ReferenceImporter({ open, onClose, onSaved }: ReferenceImporterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<{ dataUrl: string; width: number; height: number; pixels: Uint8ClampedArray } | null>(null);
  const [hex, setHex] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState(22);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Read once at mount and after any change we make. Reading inside an effect
  // keyed on `open` meant a setState during render-commit for no benefit — the
  // store only changes when this component changes it.
  const [existing, setExisting] = useState<MyReference[]>(() => loadMyReferences());

  const reset = useCallback(() => {
    setImg(null); setHex(null); setTolerance(22);
    setName(""); setLabel(""); setError(null);
  }, []);

  const pickFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const loaded = await fileToDownscaledImage(file);
      setImg(loaded);
      setHex(null);
      setName(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 40));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  }, []);

  /** Derived, not stored — the selection is a pure function of image + colour + tolerance. */
  const mask = useMemo(
    () => (img && hex ? buildMask(img.pixels, hex, tolerance) : null),
    [img, hex, tolerance]
  );
  const maskCount = mask?.count ?? 0;

  // Paint the image, washing out everything outside the selection so the region
  // being captured is unmistakable.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frame = ctx.createImageData(img.width, img.height);
    frame.data.set(img.pixels);

    if (mask) {
      const inMask = new Uint8Array(img.width * img.height);
      for (let k = 0; k < mask.count; k++) inMask[mask.indices[k]] = 1;
      for (let p = 0, i = 0; p < inMask.length; p++, i += 4) {
        if (inMask[p]) continue;
        const grey = (frame.data[i] * 0.299 + frame.data[i + 1] * 0.587 + frame.data[i + 2] * 0.114) * 0.45;
        frame.data[i] = frame.data[i + 1] = frame.data[i + 2] = grey;
      }
    }
    ctx.putImageData(frame, 0, 0);
  }, [img, mask]);

  const sampleAt = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!img) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    // Map the click from CSS pixels to image pixels.
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.height);
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
    const i = (y * img.width + x) * 4;
    setHex(rgbToHex({ r: img.pixels[i], g: img.pixels[i + 1], b: img.pixels[i + 2] }));
  }, [img]);

  const save = useCallback(() => {
    if (!img || !hex) return;
    if (!name.trim() || !label.trim()) { setError("Both names are needed."); return; }
    const ref: MyReference = {
      id: `my-${Date.now()}`,
      name: name.trim().slice(0, 40),
      label: label.trim().slice(0, 40),
      hex,
      tolerance,
      dataUrl: img.dataUrl,
      addedAt: Date.now(),
    };
    const result = saveMyReference(ref);
    if (!result.ok) { setError(result.error); return; }
    setExisting(loadMyReferences());
    reset();
    // Hand the reference back so the game can play it right away rather than
    // waiting for the next round to come around.
    onSaved(ref);
  }, [img, hex, name, label, tolerance, reset, onSaved]);

  const remove = useCallback((id: string) => {
    deleteMyReference(id);
    setExisting(loadMyReferences());
    onSaved();
  }, [onSaved]);

  const coverage = img ? (maskCount / (img.width * img.height)) * 100 : 0;

  return (
    <Modal open={open} onClose={onClose} title="Add your own reference">
      {!img ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-white/55">
            Any picture works — a cartoon character, a logo, a photo. Pick the
            colour by clicking it, so the answer is measured from the image
            rather than typed.
          </p>
          <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-white/15 bg-white/[0.03] transition-colors hover:border-primary/50 hover:bg-white/[0.06]">
            <Upload className="h-6 w-6 text-white/50" />
            <span className="text-sm font-bold text-white/70">Choose an image</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
            />
          </label>
          <p className="text-xs leading-relaxed text-white/35">
            Stays in this browser. Never uploaded, never written to the project,
            never deployed — so you can use anything you like here without it
            ending up on the public site.
          </p>

          {existing.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
                Yours ({existing.length})
              </p>
              {existing.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2">
                  <span className="h-6 w-6 shrink-0 rounded-lg" style={{ backgroundColor: r.hex }} />
                  <span className="min-w-0 flex-1 truncate text-sm text-white/75">
                    {r.name} — {r.label}
                  </span>
                  <button
                    onClick={() => remove(r.id)}
                    aria-label={`Delete ${r.name}`}
                    className="tap-target -mr-2 shrink-0 rounded-lg text-white/35 hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="relative overflow-hidden rounded-2xl bg-black/40">
            <canvas
              ref={canvasRef}
              onClick={sampleAt}
              className="block w-full cursor-crosshair"
              style={{ imageRendering: "auto" }}
            />
            {!hex && (
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3">
                <span className="flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                  <Crosshair className="h-3.5 w-3.5" /> Click the colour to restore
                </span>
              </div>
            )}
          </div>

          {hex && (
            <>
              <div className="flex items-center gap-3">
                <span className="h-9 w-12 shrink-0 rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]" style={{ backgroundColor: hex }} />
                <div className="min-w-0">
                  <p className="font-mono text-xs text-white/70">{hex}</p>
                  <p className="text-[11px] text-white/50">
                    {coverage.toFixed(0)}% of the image selected
                  </p>
                </div>
                <button
                  onClick={() => setHex(null)}
                  className="tap-target ml-auto shrink-0 rounded-lg text-white/50 hover:text-white"
                  aria-label="Pick a different colour"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <div className="mb-1 flex items-baseline justify-between">
                  <label htmlFor="tol" className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
                    Selection
                  </label>
                  <span className="font-mono text-xs text-white/60">{tolerance}</span>
                </div>
                <input
                  id="tol"
                  type="range" min={6} max={60} step={1} value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                  className="year-slider w-full"
                />
                <p className="mt-1 text-[11px] text-white/35">
                  Widen until the whole region is in colour, then stop — too far
                  and it bleeds into everything else.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Subject" aria-label="Subject name" maxLength={40}
                  className="min-h-[44px] rounded-xl border-[1.5px] border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/45 focus:border-primary/50 focus:outline-none"
                />
                <input
                  value={label} onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. the yellow body" aria-label="What to restore" maxLength={40}
                  className="min-h-[44px] rounded-xl border-[1.5px] border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/45 focus:border-primary/50 focus:outline-none"
                />
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="rounded-xl border-[1.5px] border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
              {error}
            </p>
          )}

          <div className="flex gap-2.5">
            <button onClick={reset} className="btn-secondary min-h-[44px] !px-4 !py-0 !text-sm">
              Back
            </button>
            <button
              onClick={save}
              disabled={!hex || !name.trim() || !label.trim()}
              className="btn-primary min-h-[44px] flex-1 !px-4 !py-0 !text-sm"
            >
              Add to the game
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
