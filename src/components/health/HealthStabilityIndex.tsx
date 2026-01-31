import { cn } from "@/lib/utils";

interface HealthStabilityIndexProps {
  value: number;
  maxValue?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function HealthStabilityIndex({
  value,
  maxValue = 100,
  size = "lg",
  showLabel = true,
}: HealthStabilityIndexProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getHealthStatus = () => {
    if (percentage >= 80) return { label: "Excellent", color: "text-health-stable" };
    if (percentage >= 60) return { label: "Good", color: "text-primary" };
    if (percentage >= 40) return { label: "Moderate", color: "text-health-caution" };
    return { label: "Needs Attention", color: "text-health-alert" };
  };

  const status = getHealthStatus();

  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={cn("relative", sizeClasses[size])}>
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full glow-primary opacity-50 animate-pulse-glow" />
        
        {/* Background ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            className="opacity-30"
          />
          {/* Progress ring */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="url(#healthGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out drop-shadow-lg"
            style={{
              filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))",
            }}
          />
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold gradient-text">{value}</span>
          <span className="text-sm text-muted-foreground mt-1">/ {maxValue}</span>
        </div>
      </div>

      {showLabel && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Health Stability Index</h3>
          <p className={cn("text-sm font-medium", status.color)}>{status.label}</p>
        </div>
      )}
    </div>
  );
}