import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  BarChart3,
  Users,
  Eye,
  Timer,
  Radio,
} from "lucide-react";
import StepRunner from "../components/steps/StepRunner";
import { sampleSteps, sampleLessonTitle } from "../data/sampleLesson";

const mockParticipants = [
  { id: "1", name: "Alex M.", status: "responded" },
  { id: "2", name: "Jordan K.", status: "responded" },
  { id: "3", name: "Sam W.", status: "waiting" },
  { id: "4", name: "Casey P.", status: "responded" },
  { id: "5", name: "Morgan T.", status: "waiting" },
  { id: "6", name: "Riley J.", status: "responded" },
];

export default function TeacherLiveSession() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  const respondedCount = mockParticipants.filter((p) => p.status === "responded").length;

  const goNext = useCallback(() => {
    setCurrentStep((i) => Math.min(i + 1, sampleSteps.length - 1));
    setShowDistribution(false);
    setLocked(false);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStep((i) => Math.max(i - 1, 0));
    setShowDistribution(false);
    setLocked(false);
  }, []);

  const startTimer = useCallback((seconds: number) => {
    setTimerSeconds(seconds);
    setTimerRunning(true);
    const interval = setInterval(() => {
      setTimerSeconds((s) => {
        if (s === null || s <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const step = sampleSteps[currentStep];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main lesson view (projector view) */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/live")}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-success animate-pulse" />
              <span className="text-sm font-semibold text-foreground">Live Session</span>
            </div>
            <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md font-mono">
              ETH-4829
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {mockParticipants.length} joined
            </span>
          </div>
        </div>

        <div className="flex-1 py-8 overflow-y-auto">
          <StepRunner
            steps={sampleSteps}
            lessonTitle={sampleLessonTitle}
            controlledIndex={currentStep}
            isLive
          />
        </div>

        {/* Timer overlay */}
        {timerRunning && timerSeconds !== null && (
          <div className="fixed top-20 right-[340px] bg-card border border-border rounded-xl shadow-lg p-4 text-center">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Time remaining</p>
            <p className="text-4xl font-bold text-foreground tabular-nums mt-1">
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
            </p>
          </div>
        )}
      </div>

      {/* Teacher control panel */}
      <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-foreground text-sm">Teacher Controls</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step {currentStep + 1} of {sampleSteps.length}: {step?.title ?? "—"}
          </p>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex gap-2">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="flex-1 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={goNext}
              disabled={currentStep === sampleSteps.length - 1}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-border space-y-2">
          <button
            onClick={() => setLocked(!locked)}
            className={`w-full py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              locked
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {locked ? "Responses Locked" : "Lock Responses"}
          </button>

          <button
            onClick={() => setShowDistribution(!showDistribution)}
            className="w-full py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {showDistribution ? "Hide Distribution" : "Reveal Distribution"}
          </button>

          <button
            onClick={() => startTimer(60)}
            disabled={timerRunning}
            className="w-full py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Timer className="w-4 h-4" />
            Start 60s Timer
          </button>
        </div>

        {/* Participants */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Responses
            </h4>
            <span className="text-xs text-muted-foreground">
              {respondedCount}/{mockParticipants.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {mockParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50"
              >
                <span className="text-sm text-foreground">{p.name}</span>
                <span
                  className={`text-xs font-medium ${
                    p.status === "responded" ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {p.status === "responded" ? "✓" : "..."}
                </span>
              </div>
            ))}
          </div>

          {/* Spotlight button */}
          <button className="w-full py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors mt-3">
            <Eye className="w-4 h-4" />
            Spotlight a Response
          </button>
        </div>
      </aside>
    </div>
  );
}
