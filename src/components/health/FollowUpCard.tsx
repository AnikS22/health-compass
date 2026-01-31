import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Brain, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpCardProps {
  nextCheckDays: number;
  confidenceLevel: "high" | "medium" | "low";
  reason?: string;
  onStartScan?: () => void;
}

export function FollowUpCard({
  nextCheckDays,
  confidenceLevel,
  reason,
  onStartScan,
}: FollowUpCardProps) {
  const confidenceColors = {
    high: "text-health-stable",
    medium: "text-health-caution",
    low: "text-health-alert",
  };

  const urgencyMessage = () => {
    if (nextCheckDays <= 1) return "We'd like to see you soon.";
    if (nextCheckDays <= 3) return "Re-check recommended to confirm trends.";
    if (nextCheckDays <= 7) return "A follow-up scan will help maintain accuracy.";
    return "Your readings are stable. Routine check-in suggested.";
  };

  return (
    <Card className="glass border-primary/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">AI Follow-Up Plan</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Next scan recommended in</p>
              <p className="text-2xl font-bold text-foreground">
                {nextCheckDays === 1 ? "1 day" : `${nextCheckDays} days`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Confidence level</p>
              <p className={cn("text-lg font-semibold capitalize", confidenceColors[confidenceLevel])}>
                {confidenceLevel}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic">
          "{urgencyMessage()}"
        </p>

        {reason && (
          <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3">
            {reason}
          </p>
        )}

        <Button onClick={onStartScan} className="w-full group" size="lg">
          Start Scan Now
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}