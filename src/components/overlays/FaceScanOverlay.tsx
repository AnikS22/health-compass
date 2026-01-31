import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface FaceScanOverlayProps {
  isAligned: boolean;
  isLightingGood: boolean;
  breathingRate?: number;
  pupilTracking?: { x: number; y: number };
  message?: string;
}

export function FaceScanOverlay({
  isAligned,
  isLightingGood,
  breathingRate,
  pupilTracking,
  message,
}: FaceScanOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Face alignment oval */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "w-64 h-80 rounded-[50%] border-2 transition-all duration-300",
            isAligned
              ? "border-health-stable glow-success"
              : "border-primary animate-pulse-glow"
          )}
        />
      </div>

      {/* Eye alignment markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-80">
          {/* Left eye marker */}
          <div className="absolute top-[35%] left-[25%] w-6 h-6">
            <div className="w-full h-full rounded-full border border-primary/50" />
            <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse" />
          </div>
          {/* Right eye marker */}
          <div className="absolute top-[35%] right-[25%] w-6 h-6">
            <div className="w-full h-full rounded-full border border-primary/50" />
            <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse" />
          </div>

          {/* Pupil tracking dots */}
          {pupilTracking && (
            <>
              <div
                className="absolute w-2 h-2 rounded-full bg-secondary transition-all duration-100"
                style={{
                  top: `calc(35% + ${pupilTracking.y * 10}px)`,
                  left: `calc(25% + 8px + ${pupilTracking.x * 5}px)`,
                }}
              />
              <div
                className="absolute w-2 h-2 rounded-full bg-secondary transition-all duration-100"
                style={{
                  top: `calc(35% + ${pupilTracking.y * 10}px)`,
                  right: `calc(25% + 8px - ${pupilTracking.x * 5}px)`,
                }}
              />
            </>
          )}

          {/* Lip outline */}
          <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-16 h-4">
            <div className="w-full h-full rounded-full border border-primary/30 bg-primary/5" />
          </div>
        </div>
      </div>

      {/* Corner scan markers */}
      <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-primary/50" />
      <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-primary/50" />
      <div className="absolute bottom-24 left-8 w-12 h-12 border-l-2 border-b-2 border-primary/50" />
      <div className="absolute bottom-24 right-8 w-12 h-12 border-r-2 border-b-2 border-primary/50" />

      {/* Breathing waveform */}
      {breathingRate !== undefined && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-secondary to-primary rounded-full animate-waveform"
              style={{
                animationDelay: `${i * 0.1}s`,
                height: `${20 + Math.sin(i * 0.5) * 15}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Status indicators */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium",
            isAligned ? "text-health-stable" : "text-health-caution"
          )}
        >
          {isAligned ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          {isAligned ? "Aligned" : "Align face"}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium",
            isLightingGood ? "text-health-stable" : "text-health-caution"
          )}
        >
          {isLightingGood ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          {isLightingGood ? "Good lighting" : "More light needed"}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full glass">
          <p className="text-sm text-foreground font-medium">{message}</p>
        </div>
      )}
    </div>
  );
}