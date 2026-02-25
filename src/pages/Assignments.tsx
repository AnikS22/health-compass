import { ClipboardList, Calendar, Users, ChevronRight } from "lucide-react";

const assignments = [
  { id: 1, lesson: "AI Bias in Hiring – v1.2", className: "Ethics in AI – Period 3", assignedBy: "Ms. Rivera", dueAt: "Feb 28, 2026", targetCount: 28, completionRate: 72 },
  { id: 2, lesson: "Data Privacy Scenarios – v2.0", className: "Digital Citizenship", assignedBy: "Mr. Chen", dueAt: "Mar 5, 2026", targetCount: 32, completionRate: 45 },
  { id: 3, lesson: "Autonomous Vehicles Ethics – v1.0", className: "Tech & Society Honors", assignedBy: "Dr. Okafor", dueAt: null, targetCount: 24, completionRate: 88 },
];

export default function Assignments() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1 text-sm">Track lesson assignments and student progress.</p>
      </div>

      <div className="space-y-3">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{a.lesson}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {a.className} · by {a.assignedBy}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 bg-secondary px-2.5 py-0.5 rounded-lg font-medium">
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
              <div className="flex items-center gap-5">
                <div className="w-32">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">Progress</span>
                    <span className="font-bold text-foreground">{a.completionRate}%</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${a.completionRate}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
