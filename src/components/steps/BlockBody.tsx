/**
 * BlockBody — renders optional body text and optional images from block config.
 *
 * Any block can include these optional config fields:
 *   image_url:  string   — single image URL
 *   images:     string[] — array of image URLs
 *
 * Body text supports basic markdown-style images: ![alt](url)
 */

interface Props {
  body: string | null;
  config?: Record<string, unknown>;
  className?: string;
}

function parseBodyWithImages(body: string) {
  // Split on markdown image pattern ![alt](url)
  const parts = body.split(/(!\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (match) {
      return (
        <img
          key={i}
          src={match[2]}
          alt={match[1] || "Block image"}
          className="rounded-xl max-h-80 w-full object-contain my-3 border border-border"
        />
      );
    }
    if (!part.trim()) return null;
    return (
      <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, "<br/>") }} />
    );
  });
}

export default function BlockBody({ body, config, className = "" }: Props) {
  const imageUrl = config?.image_url as string | undefined;
  const images = config?.images as string[] | undefined;

  const hasContent = body || imageUrl || (images && images.length > 0);
  if (!hasContent) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {body && (
        <p className="text-foreground text-base leading-relaxed">
          {parseBodyWithImages(body)}
        </p>
      )}

      {imageUrl && (
        <div className="rounded-xl overflow-hidden border border-border">
          <img
            src={imageUrl}
            alt="Block illustration"
            className="w-full max-h-80 object-contain"
          />
        </div>
      )}

      {images && images.length > 0 && (
        <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {images.map((url, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="w-full max-h-64 object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
