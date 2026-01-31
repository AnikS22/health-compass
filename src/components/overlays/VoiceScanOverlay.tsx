import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";

interface VoiceScanOverlayProps {
  isRecording: boolean;
  stability: number;
  tremorDetected?: boolean;
  message?: string;
}

export function VoiceScanOverlay({
  isRecording,
  stability,
  tremorDetected = false,
  message = "Speak in your natural tone",
}: VoiceScanOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      {/* Central microphone with ripple effect */}
      <div className="relative">
        {/* Ripple rings */}
        {isRecording && (
          <>
            <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-primary/30 animate-ripple" />
            <div
              className="absolute inset-0 w-32 h-32 rounded-full border-2 border-primary/20 animate-ripple"
              style={{ animationDelay: "0.5s" }}
            />
            <div
              className="absolute inset-0 w-32 h-32 rounded-full border-2 border-primary/10 animate-ripple"
              style={{ animationDelay: "1s" }}
            />
          </>
        )}

        {/* Microphone icon */}
        <div
          className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
            isRecording ? "bg-primary/20 glow-primary" : "bg-muted/50"
          )}
        >
          <Mic
            className={cn(
              "w-12 h-12 transition-colors duration-300",
              isRecording ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
      </div>

      {/* Waveform visualization */}
      <div className="flex items-center gap-1 h-16 mt-8">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-150",
              isRecording
                ? "bg-gradient-to-t from-primary to-secondary"
                : "bg-muted"
            )}
            style={{
              height: isRecording
                ? `${Math.random() * 100}%`
                : "20%",
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>

      {/* Stability meter */}
      <div className="w-64 mt-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Stability</span>
          <span>{stability}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              stability >= 80
                ? "bg-health-stable"
                : stability >= 50
                ? "bg-gradient-to-r from-primary to-secondary"
                : "bg-health-caution"
            )}
            style={{ width: `${stability}%` }}
          />
        </div>
      </div>

      {/* Tremor warning */}
      {tremorDetected && (
        <div className="mt-4 px-4 py-2 rounded-full glass border border-health-caution/30">
          <p className="text-sm text-health-caution font-medium">
            Tremor detected. Please speak more slowly.
          </p>
        </div>
      )}

      {/* Message */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full glass">
        <p className="text-sm text-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}