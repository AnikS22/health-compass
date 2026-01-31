import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BaselineProgress } from "@/components/health/BaselineProgress";
import { CameraViewport } from "@/components/overlays/CameraViewport";
import { FaceScanOverlay } from "@/components/overlays/FaceScanOverlay";
import { VoiceScanOverlay } from "@/components/overlays/VoiceScanOverlay";
import { BreathingScanOverlay } from "@/components/overlays/BreathingScanOverlay";
import { ArrowLeft, CheckCircle } from "lucide-react";

type ScanStep = "face" | "voice" | "breathing" | "complete";

const steps = [
  { id: "face", label: "Face Scan", status: "pending" as const },
  { id: "voice", label: "Voice Capture", status: "pending" as const },
  { id: "breathing", label: "Breathing", status: "pending" as const },
];

export function ScanFlow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<ScanStep>("face");
  const [stepIndex, setStepIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Face scan state
  const [isAligned, setIsAligned] = useState(false);
  const [pupilTracking, setPupilTracking] = useState({ x: 0, y: 0 });

  // Voice scan state
  const [voiceStability, setVoiceStability] = useState(0);

  // Breathing state
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("rest");
  const [breathingCycle, setBreathingCycle] = useState(0);

  // Simulate face alignment after delay
  useEffect(() => {
    if (currentStep === "face" && isScanning) {
      const timer = setTimeout(() => setIsAligned(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isScanning]);

  // Simulate pupil tracking
  useEffect(() => {
    if (currentStep === "face" && isScanning) {
      const interval = setInterval(() => {
        setPupilTracking({
          x: Math.sin(Date.now() / 1000) * 0.5,
          y: Math.cos(Date.now() / 1000) * 0.3,
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentStep, isScanning]);

  // Simulate voice stability
  useEffect(() => {
    if (currentStep === "voice" && isScanning) {
      const interval = setInterval(() => {
        setVoiceStability((prev) => Math.min(prev + Math.random() * 5, 100));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [currentStep, isScanning]);

  // Breathing cycle
  useEffect(() => {
    if (currentStep === "breathing" && isScanning) {
      const phases: ("inhale" | "hold" | "exhale" | "rest")[] = ["inhale", "hold", "exhale", "rest"];
      let phaseIndex = 0;
      let cycle = 0;

      const interval = setInterval(() => {
        phaseIndex = (phaseIndex + 1) % 4;
        setBreathingPhase(phases[phaseIndex]);

        if (phaseIndex === 0) {
          cycle++;
          setBreathingCycle(cycle);
          if (cycle >= 3) {
            clearInterval(interval);
            completeStep();
          }
        }
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [currentStep, isScanning]);

  // Progress simulation
  useEffect(() => {
    if (isScanning && currentStep !== "complete") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isScanning, currentStep]);

  const startScan = () => {
    setIsScanning(true);
    setProgress(0);
    setVoiceStability(0);
    setBreathingCycle(0);
    setBreathingPhase("inhale");
  };

  const completeStep = () => {
    setIsScanning(false);
    setProgress(0);

    if (currentStep === "face") {
      setCurrentStep("voice");
      setStepIndex(1);
    } else if (currentStep === "voice") {
      setCurrentStep("breathing");
      setStepIndex(2);
    } else if (currentStep === "breathing") {
      setCurrentStep("complete");
      setStepIndex(3);
    }
  };

  const getUpdatedSteps = () => {
    return steps.map((step, index) => ({
      ...step,
      status:
        index < stepIndex
          ? ("complete" as const)
          : index === stepIndex
          ? ("active" as const)
          : ("pending" as const),
    }));
  };

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-health-stable/20 flex items-center justify-center glow-success">
            <CheckCircle className="w-12 h-12 text-health-stable" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Baseline Established
          </h1>
          <p className="text-muted-foreground mb-6">
            Your health baseline has been recorded. The AI will analyze your patterns 
            and notify you when a follow-up is recommended.
          </p>
          <div className="glass p-4 rounded-lg mb-6">
            <p className="text-sm text-muted-foreground italic">
              "I'll notify you when a follow-up is recommended."
            </p>
          </div>
          <Button onClick={() => navigate("/")} size="lg" className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Baseline Scan</h1>
          <p className="text-sm text-muted-foreground">
            {currentStep === "face" && "Position your face in the frame"}
            {currentStep === "voice" && "Speak in your natural tone"}
            {currentStep === "breathing" && "Follow the breathing guide"}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <BaselineProgress steps={getUpdatedSteps()} currentStep={stepIndex} />
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 flex items-center justify-center mb-6">
        <CameraViewport mode={currentStep} isActive={isScanning}>
          {currentStep === "face" && (
            <FaceScanOverlay
              isAligned={isAligned}
              isLightingGood={true}
              breathingRate={isScanning ? 16 : undefined}
              pupilTracking={isScanning ? pupilTracking : undefined}
              message={isAligned ? "Hold steady..." : "Center your face"}
            />
          )}
          {currentStep === "voice" && (
            <VoiceScanOverlay
              isRecording={isScanning}
              stability={voiceStability}
              message="Speak in your natural tone"
            />
          )}
          {currentStep === "breathing" && (
            <BreathingScanOverlay
              phase={breathingPhase}
              cycleCount={breathingCycle}
              totalCycles={3}
            />
          )}
        </CameraViewport>
      </div>

      {/* Progress bar */}
      {isScanning && (
        <div className="mb-4">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {progress}% complete
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        {!isScanning ? (
          <Button onClick={startScan} size="lg" className="w-full">
            Start {currentStep === "face" ? "Face Scan" : currentStep === "voice" ? "Voice Capture" : "Breathing Exercise"}
          </Button>
        ) : (
          <>
            {progress >= 100 && (
              <Button onClick={completeStep} size="lg" className="w-full">
                Continue
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsScanning(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}