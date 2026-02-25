import { BookOpen, ChevronRight } from "lucide-react";

const courses = [
  { id: 1, title: "AI Ethics Foundations", gradeBand: "9-12", units: 6, lessons: 24, status: "published" },
  { id: 2, title: "Digital Citizenship", gradeBand: "6-8", units: 4, lessons: 16, status: "published" },
  { id: 3, title: "Data Privacy & Security", gradeBand: "9-12", units: 5, lessons: 20, status: "draft" },
];

const blockTypes = [
  "Video", "Poll", "MCQ", "Multi Select", "Short Answer", "Scenario",
  "Dilemma Tree", "Drag & Drop", "Matching", "Debate", "Group Board",
  "Collaborative Board", "Drawing", "Red Team", "Exit Ticket",
  "Concept Reveal", "Micro Challenge", "Reasoning Response", "Peer Compare",
];

export default function Curriculum() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Curriculum</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse courses, units, and lesson blocks.</p>
      </div>

      {/* Block Types Reference */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Available Block Types</h3>
        <div className="flex flex-wrap gap-2">
          {blockTypes.map((bt) => (
            <span
              key={bt}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              {bt}
            </span>
          ))}
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{course.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                    <span className="bg-secondary px-2.5 py-0.5 rounded-lg text-xs font-medium">Grade {course.gradeBand}</span>
                    <span>{course.units} units</span>
                    <span>{course.lessons} lessons</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    course.status === "published"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {course.status}
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
