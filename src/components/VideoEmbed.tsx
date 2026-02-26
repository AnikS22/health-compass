/**
 * VideoEmbed — renders either a YouTube iframe or an HTML5 <video> tag
 * depending on the URL format.
 */

function extractYouTubeId(url: string): string | null {
  // youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

interface Props {
  url: string;
  className?: string;
}

export default function VideoEmbed({ url, className = "" }: Props) {
  const ytId = extractYouTubeId(url);

  if (ytId) {
    return (
      <iframe
        className={`w-full aspect-video rounded-2xl ${className}`}
        src={`https://www.youtube.com/embed/${ytId}?rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    );
  }

  return (
    <video
      src={url}
      controls
      className={`w-full aspect-video rounded-2xl ${className}`}
    />
  );
}
