import { useEffect, useState } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CourseRow = {
  id: string;
  title: string;
  grade_band: string;
  curriculum_package_id: string | null;
};

type UnitRow = { id: string; course_id: string };
type LessonRow = { id: string; unit_id: string | null };

export default function Curriculum() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [unitCounts, setUnitCounts] = useState<Record<string, number>>({});
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [courseRes, unitRes, lessonRes] = await Promise.all([
        supabase.from("courses").select("id, title, grade_band, curriculum_package_id").order("created_at", { ascending: false }),
        supabase.from("units").select("id, course_id"),
        supabase.from("lessons").select("id, unit_id"),
      ]);

      const cs = (courseRes.data ?? []) as CourseRow[];
      setCourses(cs);

      const uc: Record<string, number> = {};
      (unitRes.data ?? [] as UnitRow[]).forEach((u: UnitRow) => { uc[u.course_id] = (uc[u.course_id] ?? 0) + 1; });
      setUnitCounts(uc);

      // Count lessons per course via units
      const unitToCourse: Record<string, string> = {};
      (unitRes.data ?? [] as UnitRow[]).forEach((u: UnitRow) => { unitToCourse[u.id] = u.course_id; });
      const lc: Record<string, number> = {};
      (lessonRes.data ?? [] as LessonRow[]).forEach((l: LessonRow) => {
        if (l.unit_id && unitToCourse[l.unit_id]) {
          const cid = unitToCourse[l.unit_id];
          lc[cid] = (lc[cid] ?? 0) + 1;
        }
      });
      setLessonCounts(lc);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading curriculum…</div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Curriculum</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse courses, units, and lessons.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-foreground font-semibold">No courses found</p>
          <p className="text-sm text-muted-foreground mt-1">Courses will appear here once they are created.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{course.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                      <span className="bg-secondary px-2.5 py-0.5 rounded-lg text-xs font-medium">Grade {course.grade_band}</span>
                      <span>{unitCounts[course.id] ?? 0} units</span>
                      <span>{lessonCounts[course.id] ?? 0} lessons</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
