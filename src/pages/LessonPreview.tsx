import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import StepRunner from "../components/steps/StepRunner";
import { sampleSteps, sampleLessonTitle } from "../data/sampleLesson";
import type { StepResponse } from "../components/steps/types";

// Mock peer distribution for the peer compare step
const mockDistributions: Record<string, Array<{ option_id: string; count: number; percentage: number }>> = {
  "step-6": [
    { option_id: "a", count: 4, percentage: 15 },
    { option_id: "b", count: 7, percentage: 26 },
    { option_id: "c", count: 10, percentage: 37 },
    { option_id: "d", count: 6, percentage: 22 },
  ],
};

export default function LessonPreview() {
  const navigate = useNavigate();

  const handleStepComplete = useCallback((stepId: string, response: StepResponse) => {
    console.log("Step completed:", stepId, response);
  }, []);

  const handleLessonComplete = useCallback(() => {
    console.log("Lesson complete!");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Lesson Preview</span>
        </div>
      </div>
      <div className="py-8">
        <StepRunner
          steps={sampleSteps}
          lessonTitle={sampleLessonTitle}
          onStepComplete={handleStepComplete}
          onLessonComplete={handleLessonComplete}
          peerDistributions={mockDistributions}
        />
      </div>
    </div>
  );
}
