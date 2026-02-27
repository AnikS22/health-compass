import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, BookOpen, Play, Award, LayoutDashboard, Podcast,
  ClipboardList, Users, ArrowRight, ArrowLeft, CheckCircle2,
  Clock, MessageSquare, Brain, Target, X,
} from "lucide-react";

const TOUR_STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to The Ethics Lab! 🎉",
    subtitle: "Let's take a quick tour of everything you can do here.",
    bullets: [
      "Explore interactive ethics courses at your own pace",
      "No deadlines — learn whenever you're ready",
      "Your progress is saved automatically",
    ],
    illustration: "welcome",
  },
  {
    icon: LayoutDashboard,
    title: "Your Dashboard",
    subtitle: "Your home base — everything at a glance.",
    bullets: [
      "See your enrolled classes and pending assignments",
      "Quick-access cards to jump into lessons or join live sessions",
      "Track your overall progress across all courses",
    ],
    illustration: "dashboard",
  },
  {
    icon: BookOpen,
    title: "Explore Curriculum",
    subtitle: "Browse all available courses organized by grade and topic.",
    bullets: [
      "Courses are organized into Units, each containing multiple Lessons",
      "Click any course to expand its units, then pick a lesson to start",
      "Completed lessons show a green checkmark ✅",
      "Lessons marked 'Coming soon' are still being prepared",
    ],
    illustration: "curriculum",
  },
  {
    icon: Play,
    title: "Inside a Lesson",
    subtitle: "Lessons are interactive — not just reading!",
    bullets: [
      "Watch videos with embedded discussion prompts",
      "Answer multiple-choice, short-answer, and scenario questions",
      "Engage with debates, dilemma trees, and thought experiments",
      "Each step must be completed before moving to the next",
    ],
    illustration: "lesson",
  },
  {
    icon: Brain,
    title: "Interactive Activities",
    subtitle: "Lessons feature many different activity types.",
    bullets: [
      "🎬 Video — Watch and reflect on ethical scenarios",
      "🧩 Micro-Challenges — Solve problems with a hint ladder",
      "💬 Reasoning Responses — Write reflections with word-count goals",
      "⚖️ Debates — Argue both sides of ethical dilemmas",
      "🎯 Peer Compare — See how your answers compare to classmates",
      "🏆 Group Challenges — Collaborate on team projects",
    ],
    illustration: "activities",
  },
  {
    icon: Target,
    title: "Progress & Mastery",
    subtitle: "Your work is tracked and saved automatically.",
    bullets: [
      "Each completed step is saved to your profile",
      "Return to any lesson to review or redo your work",
      "Mastery checkpoints ensure you understand key concepts",
      "If you struggle, repair paths offer additional support",
    ],
    illustration: "progress",
  },
  {
    icon: Podcast,
    title: "Join Live Sessions",
    subtitle: "Your teacher may invite you to participate in a live class.",
    bullets: [
      "Use the 'Join Session' page and enter the session code",
      "Participate in real-time with your classmates",
      "Answer polls, collaborate on boards, and discuss together",
      "Live session responses are also saved to your profile",
    ],
    illustration: "live",
  },
  {
    icon: ClipboardList,
    title: "Assignments",
    subtitle: "Teachers can assign specific lessons for you to complete.",
    bullets: [
      "Check the Assignments page for any assigned work",
      "Each assignment links to a specific lesson version",
      "Due dates (if any) are shown on the assignment card",
      "Completed assignments contribute to your overall progress",
    ],
    illustration: "assignments",
  },
  {
    icon: Users,
    title: "My Classes",
    subtitle: "Join a class to connect with a teacher and classmates.",
    bullets: [
      "Use a class join code from your teacher to enroll",
      "Once enrolled, you'll see assignments and live sessions for that class",
      "As a self-paced learner, classes are optional — but recommended!",
    ],
    illustration: "classes",
  },
  {
    icon: Award,
    title: "You're All Set! 🚀",
    subtitle: "Start your ethics learning journey today.",
    bullets: [
      "Head to Explore Curriculum to browse available courses",
      "Pick any lesson and start learning at your own pace",
      "Remember: there are no wrong answers in ethics — only thoughtful ones",
    ],
    illustration: "ready",
  },
];

const ILLUSTRATION_COLORS: Record<string, string> = {
  welcome: "from-primary/20 to-primary/5",
  dashboard: "from-blue-500/15 to-blue-500/5",
  curriculum: "from-emerald-500/15 to-emerald-500/5",
  lesson: "from-violet-500/15 to-violet-500/5",
  activities: "from-amber-500/15 to-amber-500/5",
  progress: "from-rose-500/15 to-rose-500/5",
  live: "from-cyan-500/15 to-cyan-500/5",
  assignments: "from-orange-500/15 to-orange-500/5",
  classes: "from-teal-500/15 to-teal-500/5",
  ready: "from-primary/20 to-primary/5",
};

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;
  const Icon = current.icon;

  function handleFinish() {
    localStorage.setItem("ethicslab_selfpaced_welcome", "true");
    onComplete();
  }

  function handleSkip() {
    localStorage.setItem("ethicslab_selfpaced_welcome", "true");
    onComplete();
  }

  function handleGetStarted() {
    handleFinish();
    navigate("/explore");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with illustration */}
        <div className={`bg-gradient-to-br ${ILLUSTRATION_COLORS[current.illustration] ?? "from-primary/10 to-background"} p-8 text-center relative`}>
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="Skip tour"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">{current.title}</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">{current.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          <ul className="space-y-3">
            {current.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer with nav */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === step
                    ? "w-6 bg-primary"
                    : i < step
                    ? "bg-primary/40"
                    : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* Step counter */}
          <span className="text-xs text-muted-foreground font-medium">
            {step + 1} / {TOUR_STEPS.length}
          </span>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 bg-secondary text-foreground rounded-xl text-xs font-bold hover:bg-secondary/80 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={handleGetStarted}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                Start Exploring <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
