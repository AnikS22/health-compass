import { useState } from "react";
import { HealthStabilityIndex } from "@/components/health/HealthStabilityIndex";
import { MetricCard } from "@/components/health/MetricCard";
import { FollowUpCard } from "@/components/health/FollowUpCard";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Wind, 
  Hand, 
  Eye, 
  Droplets, 
  Shield, 
  Settings,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();
  const [hasBaseline] = useState(true);

  const metrics = [
    {
      title: "Heart Rate",
      value: 72,
      unit: "bpm",
      trend: "stable" as const,
      trendValue: "±2",
      status: "stable" as const,
      icon: <Heart className="w-4 h-4" />,
      confidence: 94,
    },
    {
      title: "Respiratory Rate",
      value: 16,
      unit: "br/min",
      trend: "stable" as const,
      trendValue: "±1",
      status: "stable" as const,
      icon: <Wind className="w-4 h-4" />,
      confidence: 91,
    },
    {
      title: "Tremor Index",
      value: 0.8,
      unit: "ms",
      trend: "up" as const,
      trendValue: "+0.1",
      status: "info" as const,
      icon: <Hand className="w-4 h-4" />,
      confidence: 88,
    },
    {
      title: "Facial Symmetry",
      value: 96,
      unit: "%",
      trend: "stable" as const,
      status: "stable" as const,
      icon: <Eye className="w-4 h-4" />,
      confidence: 92,
    },
    {
      title: "Perfusion Index",
      value: 2.4,
      unit: "%",
      trend: "stable" as const,
      status: "stable" as const,
      icon: <Droplets className="w-4 h-4" />,
      confidence: 86,
    },
  ];

  if (!hasBaseline) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Welcome to Adaptive Health AI
          </h1>
          <p className="text-muted-foreground mb-6">
            Let's establish your health baseline. This helps the AI understand your 
            normal patterns and notify you only when follow-up is needed.
          </p>
          <Button onClick={() => navigate("/scan")} size="lg" className="w-full">
            Begin Baseline Scan
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Health Dashboard</h1>
          <p className="text-sm text-muted-foreground">Last scan: 2 days ago</p>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Health Stability Index */}
      <div className="mb-8 animate-fade-in">
        <HealthStabilityIndex value={87} />
      </div>

      {/* AI Follow-Up Card */}
      <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <FollowUpCard
          nextCheckDays={4}
          confidenceLevel="high"
          reason="Based on stable readings and low signal variability over the past week."
          onStartScan={() => navigate("/scan")}
        />
      </div>

      {/* Metrics Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Baseline Metrics</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            Compare to baseline
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => (
            <div
              key={metric.title}
              className="animate-fade-in"
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
            >
              <MetricCard {...metric} />
            </div>
          ))}
        </div>
      </div>

      {/* Privacy notice */}
      <div className="mt-8 p-4 rounded-lg glass border border-border/50">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Privacy Protected</p>
            <p className="text-xs text-muted-foreground">
              Video is analyzed on-device and encrypted. Your data never leaves without consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}