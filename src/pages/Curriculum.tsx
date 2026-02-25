import { BookOpen, ChevronRight, Clock, BarChart2 } from "lucide-react";

const courses = [
  {
    id: 1,
    title: "AI Ethics Foundations",
    gradeBand: "9-12",
    units: 6,
    lessons: 24,
    status: "published",
  },
  {
    id: 2,
    title: "Digital Citizenship",
    gradeBand: "6-8",
    units: 4,
    lessons: 16,
    status: "published",
  },
  {
    id: 3,
    title: "Data Privacy & Security",
    gradeBand: "9-12",
    units: 5,
    lessons: 20,
    status: "draft",
  },
];

const blockTypes = [
  "Video", "Poll", "MCQ", "Multi Select", "Short Answer", "Scenario",
  "Dilemma Tree", "Drag & Drop", "Matching", "Debate", "Group Board",
  "Collaborative Board", "Drawing", "Red Team", "Exit Ticket",
];

export default function Curriculum() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Curriculum</h1>
        <p className="text-muted-foreground mt-1">Browse courses, units, and lesson blocks.</p>
      </div>

      {/* Block Types Reference */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Available Block Types</h3>
        <div className="flex flex-wrap gap-2">
          {blockTypes.map((bt) => (
            <span
              key={bt}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
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
            className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{course.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>Grade {course.gradeBand}</span>
                    <span>{course.units} units</span>
                    <span>{course.lessons} lessons</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    course.status === "published"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {course.status}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
