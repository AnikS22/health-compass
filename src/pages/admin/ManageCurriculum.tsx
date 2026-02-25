import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ChevronRight, Eye } from "lucide-react";

interface LessonRow {
  id: string;
  title: string;
  grade_band: string | null;
  difficulty: string | null;
  estimated_minutes: number | null;
  versions: { id: string; version_label: string; publish_status: string }[];
}

export default function ManageCurriculum() {
  const [packages, setPackages] = useState<{ id: string; package_key: string; title: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string; grade_band: string; curriculum_package_id: string | null }[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [pkgRes, courseRes] = await Promise.all([
        supabase.from("curriculum_packages").select("*").order("title"),
        supabase.from("courses").select("*").order("title"),
      ]);
      setPackages(pkgRes.data ?? []);
      setCourses(courseRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function loadCourseLessons(courseId: string) {
    setSelectedCourse(courseId);
    // Get units for this course, then lessons
    const { data: units } = await supabase.from("units").select("id").eq("course_id", courseId);
    if (!units || units.length === 0) { setLessons([]); return; }

    const unitIds = units.map((u) => u.id);
    const { data: lessonData } = await supabase
      .from("lessons")
      .select("id, title, grade_band, difficulty, estimated_minutes, unit_id")
      .in("unit_id", unitIds)
      .order("title");

    if (!lessonData) { setLessons([]); return; }

    const lessonIds = lessonData.map((l) => l.id);
    const { data: versions } = await supabase
      .from("lesson_versions")
      .select("id, version_label, publish_status, lesson_id")
      .in("lesson_id", lessonIds);

    const versionMap = new Map<string, { id: string; version_label: string; publish_status: string }[]>();
    (versions ?? []).forEach((v) => {
      if (!versionMap.has(v.lesson_id)) versionMap.set(v.lesson_id, []);
      versionMap.get(v.lesson_id)!.push(v);
    });

    setLessons(
      lessonData.map((l) => ({
        ...l,
        versions: versionMap.get(l.id) ?? [],
      }))
    );
  }

  if (loading) return <div className="p-6 text-muted-foreground text-sm">Loading curriculum…</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Manage Curriculum</h1>
        <p className="text-sm text-muted-foreground">View curriculum packages, courses, and lesson content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: packages & courses */}
        <div className="space-y-4">
          <h2 className="font-bold text-foreground">Packages & Courses</h2>
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground text-sm mb-2">{pkg.title}</h3>
              <div className="space-y-1">
                {courses
                  .filter((c) => c.curriculum_package_id === pkg.id)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => loadCourseLessons(c.id)}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCourse === c.id
                          ? "bg-primary/10 text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        {c.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
              </div>
            </div>
          ))}
          {/* Courses without package */}
          {courses.filter((c) => !c.curriculum_package_id).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground text-sm mb-2">Unpackaged Courses</h3>
              <div className="space-y-1">
                {courses
                  .filter((c) => !c.curriculum_package_id)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => loadCourseLessons(c.id)}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCourse === c.id
                          ? "bg-primary/10 text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        {c.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
              </div>
            </div>
          )}
          {packages.length === 0 && courses.length === 0 && (
            <p className="text-muted-foreground text-sm">No curriculum content yet</p>
          )}
        </div>

        {/* Main: lessons */}
        <div className="lg:col-span-2">
          {selectedCourse ? (
            <div className="space-y-3">
              <h2 className="font-bold text-foreground">
                Lessons ({lessons.length})
              </h2>
              {lessons.map((l) => (
                <div key={l.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">{l.title}</h3>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        {l.grade_band && <span>Grade: {l.grade_band}</span>}
                        {l.difficulty && <span>Difficulty: {l.difficulty}</span>}
                        {l.estimated_minutes && <span>{l.estimated_minutes} min</span>}
                      </div>
                    </div>
                  </div>
                  {l.versions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {l.versions.map((v) => (
                        <span
                          key={v.id}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.publish_status === "published"
                              ? "bg-green-500/10 text-green-600"
                              : v.publish_status === "archived"
                              ? "bg-muted text-muted-foreground"
                              : "bg-yellow-500/10 text-yellow-600"
                          }`}
                        >
                          {v.version_label} — {v.publish_status}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {lessons.length === 0 && (
                <p className="text-muted-foreground text-sm">No lessons in this course yet</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Select a course to view its lessons
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
