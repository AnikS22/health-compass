import { cn } from "@/lib/utils";
import { Check, Circle, Loader2 } from "lucide-react";

interface Step {
  id: string;
  label: string;
  status: "pending" | "active" | "complete";
}

interface BaselineProgressProps {
  steps: Step[];
  currentStep: number;
}

export function BaselineProgress({ steps, currentStep }: BaselineProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  step.status === "complete" && "bg-health-stable text-background",
                  step.status === "active" && "bg-primary text-primary-foreground glow-primary",
                  step.status === "pending" && "bg-muted text-muted-foreground"
                )}
              >
                {step.status === "complete" ? (
                  <Check className="w-5 h-5" />
                ) : step.status === "active" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[80px]",
                  step.status === "active" ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mt-[-24px]">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    index < currentStep
                      ? "bg-gradient-to-r from-health-stable to-primary"
                      : "bg-muted"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}