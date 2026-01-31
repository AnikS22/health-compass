import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  status?: "stable" | "caution" | "alert" | "info";
  icon?: ReactNode;
  confidence?: number;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  status = "stable",
  icon,
  confidence,
  onClick,
}: MetricCardProps) {
  const statusColors = {
    stable: "border-health-stable/30 bg-health-stable/5",
    caution: "border-health-caution/30 bg-health-caution/5",
    alert: "border-health-alert/30 bg-health-alert/5",
    info: "border-primary/30 bg-primary/5",
  };

  const trendIcons = {
    up: <ArrowUpRight className="w-4 h-4" />,
    down: <ArrowDownRight className="w-4 h-4" />,
    stable: <Minus className="w-4 h-4" />,
  };

  const trendColors = {
    up: "text-health-stable",
    down: "text-health-alert",
    stable: "text-muted-foreground",
  };

  return (
    <Card
      className={cn(
        "glass border transition-all duration-300 hover:scale-[1.02] cursor-pointer",
        statusColors[status]
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-sm", trendColors[trend])}>
              {trendIcons[trend]}
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>

        {confidence !== undefined && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Signal Confidence</span>
              <span className="font-medium text-primary">{confidence}%</span>
            </div>
            <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}