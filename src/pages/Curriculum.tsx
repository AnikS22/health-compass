import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, Eye, EyeOff, ChevronDown, Video, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type CourseRow = {
  id: string;
  title: string;
  grade_band: string;
  curriculum_package_id: string | null;
};

type UnitRow = { id: string; course_id: string; title: string; sequence_no: number };

type LessonRow = {
  id: string;
  unit_id: string | null;
  title: string;
  estimated_minutes: number | null;
  grade_band: string | null;
};

type LessonVersionRow = {
  id: string;
  lesson_id: string;
  version_label: string;
  publish_status: string;
};

export default function Curriculum() {
  const { role } = useAuth();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [versions, setVersions] = useState<LessonVersionRow[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [courseRes, unitRes, lessonRes, versionRes] = await Promise.all([
        supabase.from("courses").select("id, title, grade_band, curriculum_package_id").order("created_at", { ascending: false }),
        supabase.from("units").select("id, course_id, title, sequence_no").order("sequence_no"),
        supabase.from("lessons").select("id, unit_id, title, estimated_minutes, grade_band"),
        supabase.from("lesson_versions").select("id, lesson_id, version_label, publish_status").order("created_at", { ascending: false }),
      ]);
      setCourses((courseRes.data ?? []) as CourseRow[]);
      setUnits((unitRes.data ?? []) as UnitRow[]);
      setLessons((lessonRes.data ?? []) as LessonRow[]);
      setVersions((versionRes.data ?? []) as LessonVersionRow[]);
      setLoading(false);
    }
    load();
  }, []);

  async function togglePublish(versionId: string, currentStatus: string) {
    setToggling(versionId);
    const newStatus = currentStatus === "published" ? "draft" : "published";
    await supabase.from("lesson_versions").update({
      publish_status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
    }).eq("id", versionId);
    setVersions((prev) => prev.map((v) => v.id === versionId ? { ...v, publish_status: newStatus } : v));
    setToggling(null);
  }

  const unitsForCourse = (courseId: string) => units.filter((u) => u.course_id === courseId);
  const lessonsForUnit = (unitId: string) => lessons.filter((l) => l.unit_id === unitId);
  const versionsForLesson = (lessonId: string) => versions.filter((v) => v.lesson_id === lessonId);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading curriculum…</div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Curriculum</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse and manage which modules are published to students.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-foreground font-semibold">No courses found</p>
          <p className="text-sm text-muted-foreground mt-1">Courses will appear here once they are created by an admin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const courseUnits = unitsForCourse(course.id);
            const isExpanded = expandedCourse === course.id;
            return (
              <div key={course.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-foreground">{course.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span className="bg-secondary px-2.5 py-0.5 rounded-lg text-xs font-medium">Grade {course.grade_band}</span>
                        <span>{courseUnits.length} units</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {courseUnits.length === 0 ? (
                      <p className="p-6 text-sm text-muted-foreground">No units in this course.</p>
                    ) : (
                      courseUnits.map((unit) => {
                        const unitLessons = lessonsForUnit(unit.id);
                        const unitExpanded = expandedUnit === unit.id;
                        return (
                          <div key={unit.id} className="border-b border-border last:border-b-0">
                            <button
                              onClick={() => setExpandedUnit(unitExpanded ? null : unit.id)}
                              className="w-full px-8 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-primary bg-primary/10 w-7 h-7 rounded-lg flex items-center justify-center">{unit.sequence_no}</span>
                                <span className="font-semibold text-foreground text-sm">{unit.title}</span>
                                <span className="text-xs text-muted-foreground">{unitLessons.length} lessons</span>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${unitExpanded ? "rotate-90" : ""}`} />
                            </button>

                            {unitExpanded && (
                              <div className="bg-secondary/20 px-8 py-2">
                                {unitLessons.length === 0 ? (
                                  <p className="py-3 text-sm text-muted-foreground">No lessons in this unit.</p>
                                ) : (
                                  unitLessons.map((lesson) => {
                                    const lvs = versionsForLesson(lesson.id);
                                    return (
                                      <div key={lesson.id} className="py-3 border-b border-border/50 last:border-b-0">
                                        <div className="flex items-center gap-3 mb-2">
                                          <FileText className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium text-foreground text-sm">{lesson.title}</span>
                                          {lesson.estimated_minutes && (
                                            <span className="text-xs text-muted-foreground">{lesson.estimated_minutes} min</span>
                                          )}
                                        </div>
                                        {lvs.length > 0 && (
                                          <div className="ml-7 space-y-1.5">
                                            {lvs.map((v) => (
                                              <div key={v.id} className="flex items-center justify-between bg-card rounded-xl px-4 py-2.5 border border-border">
                                                <div className="flex items-center gap-2">
                                                  <Video className="w-3.5 h-3.5 text-muted-foreground" />
                                                  <span className="text-sm text-foreground">{v.version_label}</span>
                                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${v.publish_status === "published" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                                                    {v.publish_status}
                                                  </span>
                                                </div>
                                                {role === "teacher" && (
                                                  <button
                                                    onClick={() => togglePublish(v.id, v.publish_status)}
                                                    disabled={toggling === v.id}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                                                      v.publish_status === "published"
                                                        ? "bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive"
                                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                                    }`}
                                                  >
                                                    {v.publish_status === "published" ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
