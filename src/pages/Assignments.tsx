import { ClipboardList, Calendar, Users, ChevronRight } from "lucide-react";

const assignments = [
  {
    id: 1,
    lesson: "AI Bias in Hiring – v1.2",
    className: "Ethics in AI – Period 3",
    assignedBy: "Ms. Rivera",
    dueAt: "Feb 28, 2026",
    targetCount: 28,
    completionRate: 72,
  },
  {
    id: 2,
    lesson: "Data Privacy Scenarios – v2.0",
    className: "Digital Citizenship",
    assignedBy: "Mr. Chen",
    dueAt: "Mar 5, 2026",
    targetCount: 32,
    completionRate: 45,
  },
  {
    id: 3,
    lesson: "Autonomous Vehicles Ethics – v1.0",
    className: "Tech & Society Honors",
    assignedBy: "Dr. Okafor",
    dueAt: null,
    targetCount: 24,
    completionRate: 88,
  },
];

export default function Assignments() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
        <p className="text-muted-foreground mt-1">Track lesson assignments and student progress.</p>
      </div>

      <div className="space-y-3">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{a.lesson}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {a.className} · by {a.assignedBy}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {a.dueAt ?? "No due date"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {a.targetCount} students
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Progress bar */}
                <div className="w-28">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{a.completionRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${a.completionRate}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
