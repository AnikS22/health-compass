import { Users, Plus, Search } from "lucide-react";

const classes = [
  { id: 1, name: "Ethics in AI – Period 3", teacher: "Ms. Rivera", grade: "9-10", students: 28, status: "active" },
  { id: 2, name: "Digital Citizenship", teacher: "Mr. Chen", grade: "7-8", students: 32, status: "active" },
  { id: 3, name: "Tech & Society Honors", teacher: "Dr. Okafor", grade: "11-12", students: 24, status: "active" },
  { id: 4, name: "Intro to Data Ethics", teacher: "Ms. Park", grade: "6-7", students: 30, status: "inactive" },
];

export default function Classes() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
          <p className="text-muted-foreground mt-1">Manage classrooms and enrollments.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          New Class
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search classes..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map((c) => (
          <div
            key={c.id}
            className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{c.teacher}</p>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  c.status === "active"
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {c.students} students
              </span>
              <span>Grade {c.grade}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
