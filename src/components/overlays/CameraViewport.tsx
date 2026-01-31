import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CameraViewportProps {
  children?: ReactNode;
  mode: "face" | "voice" | "breathing";
  isActive?: boolean;
}

export function CameraViewport({
  children,
  mode,
  isActive = true,
}: CameraViewportProps) {
  return (
    <div className="relative w-full aspect-[3/4] max-w-md mx-auto overflow-hidden rounded-2xl bg-background/80">
      {/* Simulated camera background */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-500",
          isActive
            ? "bg-gradient-to-br from-muted/50 to-background"
            : "bg-muted/30"
        )}
      />

      {/* Scan line effect for face mode */}
      {mode === "face" && isActive && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-vertical" />
        </div>
      )}

      {/* Mode-specific overlay */}
      {children}

      {/* Mode indicator */}
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full glass">
        <p className="text-xs font-medium text-primary capitalize">{mode} Mode</p>
      </div>

      {/* Recording indicator */}
      {isActive && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs text-muted-foreground">Recording</span>
        </div>
      )}
    </div>
  );
}