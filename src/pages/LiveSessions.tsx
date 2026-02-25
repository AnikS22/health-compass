import { Radio, Play, Square, Users, Clock } from "lucide-react";

const sessions = [
  {
    id: 1,
    code: "ETH-4829",
    lesson: "AI Bias in Hiring",
    teacher: "Ms. Rivera",
    participants: 28,
    status: "active",
    startedAt: "10:30 AM",
  },
  {
    id: 2,
    code: "ETH-7712",
    lesson: "Deepfakes & Misinformation",
    teacher: "Mr. Chen",
    participants: 0,
    status: "scheduled",
    startedAt: "1:00 PM",
  },
  {
    id: 3,
    code: "ETH-3105",
    lesson: "Autonomous Vehicles Dilemma",
    teacher: "Dr. Okafor",
    participants: 24,
    status: "ended",
    startedAt: "8:00 AM",
  },
];

export default function LiveSessions() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Sessions</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage real-time classroom sessions.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Play className="w-4 h-4" />
          Start Session
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    s.status === "active"
                      ? "bg-success/10"
                      : s.status === "scheduled"
                      ? "bg-primary/10"
                      : "bg-muted"
                  }`}
                >
                  {s.status === "active" ? (
                    <Radio className="w-5 h-5 text-success animate-pulse" />
                  ) : s.status === "ended" ? (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Clock className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{s.lesson}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {s.teacher} · Code: <span className="font-mono font-medium text-foreground">{s.code}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {s.participants}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {s.startedAt}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    s.status === "active"
                      ? "bg-success/10 text-success"
                      : s.status === "scheduled"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
