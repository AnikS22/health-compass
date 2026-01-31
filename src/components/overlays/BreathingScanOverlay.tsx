import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface BreathingScanOverlayProps {
  phase: "inhale" | "hold" | "exhale" | "rest";
  cycleCount: number;
  totalCycles: number;
}

export function BreathingScanOverlay({
  phase,
  cycleCount,
  totalCycles,
}: BreathingScanOverlayProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const scales = {
      inhale: 1.4,
      hold: 1.4,
      exhale: 1,
      rest: 1,
    };
    setScale(scales[phase]);
  }, [phase]);

  const phaseLabels = {
    inhale: "Inhale...",
    hold: "Hold...",
    exhale: "Exhale...",
    rest: "Rest...",
  };

  const phaseColors = {
    inhale: "from-primary to-secondary",
    hold: "from-secondary to-health-stable",
    exhale: "from-health-stable to-primary",
    rest: "from-muted to-muted",
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      {/* Breathing circle */}
      <div className="relative w-64 h-64">
        {/* Outer glow ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-[4000ms] ease-in-out",
            "bg-gradient-to-br opacity-20 blur-xl",
            phaseColors[phase]
          )}
          style={{ transform: `scale(${scale * 1.2})` }}
        />

        {/* Main circle */}
        <div
          className={cn(
            "absolute inset-4 rounded-full transition-all duration-[4000ms] ease-in-out",
            "bg-gradient-to-br border-2 border-primary/30",
            phaseColors[phase]
          )}
          style={{ transform: `scale(${scale})` }}
        />

        {/* Inner ring */}
        <div
          className={cn(
            "absolute inset-8 rounded-full transition-all duration-[4000ms] ease-in-out",
            "border border-foreground/10"
          )}
          style={{ transform: `scale(${scale})` }}
        />

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-light text-foreground tracking-wide">
            {phaseLabels[phase]}
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-12 flex items-center gap-2">
        {[...Array(totalCycles)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              i < cycleCount
                ? "bg-health-stable"
                : i === cycleCount
                ? "bg-primary animate-pulse"
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Cycle count */}
      <p className="mt-4 text-sm text-muted-foreground">
        Cycle {cycleCount + 1} of {totalCycles}
      </p>

      {/* Bottom instruction */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full glass">
        <p className="text-sm text-foreground font-medium">
          Follow the circle rhythm for accurate measurement
        </p>
      </div>
    </div>
  );
}