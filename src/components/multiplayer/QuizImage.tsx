"use client";

import Image from "next/image";

/**
 * A picture attached to a question, served through Next's image optimizer.
 *
 * Every one of these used to be a plain `<img>` pointing at the original file,
 * so a 294 KB JPEG was downloaded at full resolution to fill a slot a few
 * hundred pixels tall — on every phone in the room simultaneously. The
 * optimizer resizes to the device and re-encodes to webp.
 *
 * ## Why not `fill`
 *
 * The first version used `fill`, which absolutely positions the image. Every
 * caller wraps these in a shrink-to-fit box (`max-w-md` inside a centred flex
 * column), and with the image out of flow those boxes had nothing to size
 * against and collapsed to **zero width** — the picture vanished entirely,
 * leaving a gap on the reveal screen.
 *
 * So the dimensions are explicit instead. They only establish an aspect ratio
 * to reserve layout space with; the real display size comes from the caller's
 * height class plus `object-cover`, exactly as it did with the original
 * `<img>`. That keeps the image in normal flow, so the wrappers size the way
 * they always did.
 */
interface QuizImageProps {
  src: string;
  /** Height utilities for the image, e.g. "h-32" or "h-40 sm:h-52". */
  heightClass: string;
  /**
   * `sizes` for the srcset. The default assumes a phone-width slot; the host
   * screen passes its own fixed width.
   */
  sizes?: string;
  /** Extra classes on the image — a transition, a corner radius. */
  className?: string;
  /** Applied to the image, for the zoom-out scale. */
  style?: React.CSSProperties;
  /** The question's picture is what the player is waiting on, so don't lazy-load it. */
  priority?: boolean;
  /**
   * Text alternative.
   *
   * These were all `alt=""`, which tells a screen reader the image is
   * decorative — but on a picture round the image *is* the question, so a
   * blind player was told nothing was there rather than that they were missing
   * the whole thing.
   *
   * The default deliberately describes the image's *role* and not its
   * contents. Describing the contents would answer the question ("a photo of
   * the Eiffel Tower" for "which landmark is this?"), which is the same
   * problem WCAG 1.1.1 carves out for tests: the alternative must not defeat
   * the purpose. Naming it as an essential picture at least lets the player
   * know to ask, instead of silently losing the round.
   */
  alt?: string;
}

export default function QuizImage({
  src,
  heightClass,
  sizes = "(max-width: 640px) 100vw, 448px",
  className,
  style,
  priority = false,
  alt = "Picture that this question is about",
}: QuizImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      // Nominal only — an aspect ratio to reserve space with. The height class
      // and `object-cover` decide what is actually drawn.
      width={1200}
      height={800}
      sizes={sizes}
      priority={priority}
      // These sit in short, heavily cropped slots where 65 is indistinguishable.
      quality={65}
      style={style}
      className={`w-full object-cover ${heightClass} ${className ?? ""}`}
    />
  );
}
