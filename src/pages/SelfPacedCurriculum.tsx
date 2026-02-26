import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, ChevronRight, ChevronDown, Play, Clock, Award,
  Sparkles, ArrowRight, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type CourseRow = { id: string; title: string; grade_band: string };
type UnitRow = { id: string; course_id: string; title: string; sequence_no: number };
type LessonRow = { id: string; unit_id: string | null; title: string; estimated_minutes: number | null };
type LessonVersionRow = { id: string; lesson_id: string; version_label: string; publish_status: string };

export default function SelfPacedCurriculum() {
  const { appUserId } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [versions, setVersions] = useState<LessonVersionRow[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome tour if first visit
    const seen = localStorage.getItem("ethicslab_selfpaced_welcome");
    if (!seen) setShowWelcome(true);
    loadData();
  }, []);

  async function loadData() {
    const [courseRes, unitRes, lessonRes, versionRes] = await Promise.all([
      supabase.from("courses").select("id, title, grade_band").order("created_at"),
      supabase.from("units").select("id, course_id, title, sequence_no").order("sequence_no"),
      supabase.from("lessons").select("id, unit_id, title, estimated_minutes"),
      supabase.from("lesson_versions").select("id, lesson_id, version_label, publish_status").eq("publish_status", "published"),
    ]);
    setCourses((courseRes.data ?? []) as CourseRow[]);
    setUnits((unitRes.data ?? []) as UnitRow[]);
    setLessons((lessonRes.data ?? []) as LessonRow[]);
    setVersions((versionRes.data ?? []) as LessonVersionRow[]);

    // Load completed attempts
    if (appUserId) {
      const { data: attempts } = await supabase
        .from("independent_attempts")
        .select("assignment_id")
        .eq("user_id", appUserId)
        .not("completed_at", "is", null);
      if (attempts) {
        // Check assignment-based completions
        const assignmentIds = attempts.map((a) => a.assignment_id).filter((id): id is string => id !== null);
        let completedVersionIds = new Set<string>();
        if (assignmentIds.length > 0) {
          const { data: assignments } = await supabase
            .from("assignments")
            .select("id, lesson_version_id")
            .in("id", assignmentIds);
          completedVersionIds = new Set((assignments ?? []).map((a) => a.lesson_version_id));
        }
        // Also check direct self-paced completions
        const { data: selfPacedAttempts } = await supabase
          .from("independent_attempts")
          .select("lesson_version_id")
          .eq("user_id", appUserId)
          .not("completed_at", "is", null)
          .not("lesson_version_id", "is", null);
        (selfPacedAttempts ?? []).forEach((a) => { if (a.lesson_version_id) completedVersionIds.add(a.lesson_version_id); });
        setCompletedLessons(completedVersionIds);
      }
    }
    setLoading(false);
  }

  function dismissWelcome() {
    localStorage.setItem("ethicslab_selfpaced_welcome", "true");
    setShowWelcome(false);
  }

  function startLesson(versionId: string) {
    navigate(`/lesson/preview?versionId=${versionId}&selfpaced=true`);
  }

  const unitsFor = (cid: string) => units.filter((u) => u.course_id === cid);
  const lessonsFor = (uid: string) => lessons.filter((l) => l.unit_id === uid);
  const versionsFor = (lid: string) => versions.filter((v) => v.lesson_id === lid);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground text-sm">Loading curriculum…</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Welcome Tour Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground">Welcome to The Ethics Lab! 🎉</h2>
              <p className="text-muted-foreground mt-2">Your self-paced learning journey starts here.</p>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Browse Courses</p>
                  <p className="text-xs text-muted-foreground">Explore ethics courses organized by grade level and topic. Each course contains units with interactive lessons.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Interactive Lessons</p>
                  <p className="text-xs text-muted-foreground">Engage with videos, challenges, debates, and thought experiments. Work at your own pace — no deadlines!</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Track Progress</p>
                  <p className="text-xs text-muted-foreground">Complete lessons to earn badges and certificates. Your progress is saved automatically.</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border">
              <button
                onClick={dismissWelcome}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Self-Paced Learning</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Curriculum Explorer</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">Browse all published courses and start any lesson at your own pace.</p>
        </div>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {/* Course listing */}
      {courses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold">No courses available yet</p>
          <p className="text-sm text-muted-foreground mt-1">Check back soon — new content is being added.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const courseUnits = unitsFor(course.id);
            const isExpanded = expandedCourse === course.id;
            // Count total published lessons
            let totalLessons = 0;
            let completedCount = 0;
            courseUnits.forEach((u) => {
              lessonsFor(u.id).forEach((l) => {
                const lvs = versionsFor(l.id);
                totalLessons += lvs.length;
                lvs.forEach((v) => { if (completedLessons.has(v.id)) completedCount++; });
              });
            });

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
                        {totalLessons > 0 && (
                          <span className="text-xs text-primary font-medium">{completedCount}/{totalLessons} completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {courseUnits.length === 0 ? (
                      <p className="p-6 text-sm text-muted-foreground">No units in this course yet.</p>
                    ) : (
                      courseUnits.map((unit) => {
                        const unitLessons = lessonsFor(unit.id);
                        const isUnitExpanded = expandedUnit === unit.id;
                        return (
                          <div key={unit.id} className="border-b border-border last:border-b-0">
                            <button
                              onClick={() => setExpandedUnit(isUnitExpanded ? null : unit.id)}
                              className="w-full px-8 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-primary bg-primary/10 w-7 h-7 rounded-lg flex items-center justify-center">{unit.sequence_no}</span>
                                <span className="font-semibold text-foreground text-sm">{unit.title}</span>
                                <span className="text-xs text-muted-foreground">{unitLessons.length} lessons</span>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isUnitExpanded ? "rotate-90" : ""}`} />
                            </button>

                            {isUnitExpanded && (
                              <div className="bg-secondary/20 px-8 py-2">
                                {unitLessons.length === 0 ? (
                                  <p className="py-3 text-sm text-muted-foreground">No lessons in this unit yet.</p>
                                ) : (
                                  unitLessons.map((lesson) => {
                                    const lvs = versionsFor(lesson.id);
                                    return (
                                      <div key={lesson.id} className="py-3 border-b border-border/50 last:border-b-0">
                                        {lvs.length === 0 ? (
                                          <div className="flex items-center gap-3 text-muted-foreground">
                                            <BookOpen className="w-4 h-4" />
                                            <span className="text-sm">{lesson.title}</span>
                                            <span className="text-xs bg-secondary px-2 py-0.5 rounded">Coming soon</span>
                                          </div>
                                        ) : (
                                          lvs.map((v) => {
                                            const done = completedLessons.has(v.id);
                                            return (
                                              <div key={v.id} className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border mb-1.5 last:mb-0">
                                                <div className="flex items-center gap-3">
                                                  {done ? (
                                                    <CheckCircle2 className="w-5 h-5 text-success" />
                                                  ) : (
                                                    <BookOpen className="w-5 h-5 text-primary" />
                                                  )}
                                                  <div>
                                                    <p className="font-medium text-foreground text-sm">{lesson.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                      {lesson.estimated_minutes && (
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.estimated_minutes} min</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={() => startLesson(v.id)}
                                                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                                                    done
                                                      ? "bg-secondary text-foreground hover:bg-secondary/80"
                                                      : "bg-primary text-primary-foreground hover:opacity-90"
                                                  }`}
                                                >
                                                  <Play className="w-3.5 h-3.5" />
                                                  {done ? "Review" : "Start"}
                                                </button>
                                              </div>
                                            );
                                          })
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
