"use client";

interface VideoPlayerProps {
  src: string;
}

function isYouTube(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
  const youtubeId = isYouTube(src);

  if (youtubeId) {
    return (
      <div className="aspect-video w-full max-w-lg overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          className="h-full w-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-xl">
      <video
        src={src}
        autoPlay
        controls
        className="h-auto w-full"
        style={{ maxHeight: "300px" }}
      />
    </div>
  );
}
