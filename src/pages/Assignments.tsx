import { useEffect, useState } from "react";
import { ClipboardList, Calendar, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AssignmentRow = {
  id: string;
  due_at: string | null;
  created_at: string;
  class_id: string;
  lesson_version_id: string;
  assigned_by_user_id: string;
};

type ClassOption = { id: string; name: string };
type LessonVersionOption = { id: string; version_label: string; lesson_title: string };

export default function Assignments() {
  const { role, appUserId } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [classNames, setClassNames] = useState<Record<string, string>>({});
  const [versionLabels, setVersionLabels] = useState<Record<string, { label: string; lessonTitle: string }>>({});
  const [loading, setLoading] = useState(true);

  // Create assignment state
  const [showCreate, setShowCreate] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [lessonVersions, setLessonVersions] = useState<LessonVersionOption[]>([]);
  const [newClassId, setNewClassId] = useState("");
  const [newLvId, setNewLvId] = useState("");
  const [newDue, setNewDue] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!appUserId) return;
    load();
  }, [appUserId, role]);

  async function load() {
    let classIds: string[] = [];

    if (role === "student") {
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("user_id", appUserId!)
        .eq("status", "active");
      classIds = (enrollments ?? []).map((e) => e.class_id);
      if (classIds.length === 0) { setLoading(false); return; }
    }

    let query = supabase
      .from("assignments")
      .select("id, due_at, created_at, class_id, lesson_version_id, assigned_by_user_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (role === "student" && classIds.length > 0) {
      query = query.in("class_id", classIds);
    }

    if (role === "teacher") {
      query = query.eq("assigned_by_user_id", appUserId!);
    }

    const { data: aData } = await query;
    const items = (aData ?? []) as AssignmentRow[];
    setAssignments(items);

    if (items.length > 0) {
      const cIds = [...new Set(items.map((a) => a.class_id))];
      const lvIds = [...new Set(items.map((a) => a.lesson_version_id))];

      const [classRes, lvRes] = await Promise.all([
        supabase.from("classes").select("id, name").in("id", cIds),
        supabase.from("lesson_versions").select("id, version_label, lesson_id").in("id", lvIds),
      ]);

      const cn: Record<string, string> = {};
      (classRes.data ?? []).forEach((c: any) => { cn[c.id] = c.name; });
      setClassNames(cn);

      // Get lesson titles for the versions
      const lessonIds = [...new Set((lvRes.data ?? []).map((v: any) => v.lesson_id))];
      const { data: lessonData } = await supabase.from("lessons").select("id, title").in("id", lessonIds);
      const lessonMap: Record<string, string> = {};
      (lessonData ?? []).forEach((l: any) => { lessonMap[l.id] = l.title; });

      const vl: Record<string, { label: string; lessonTitle: string }> = {};
      (lvRes.data ?? []).forEach((v: any) => {
        vl[v.id] = { label: v.version_label, lessonTitle: lessonMap[v.lesson_id] || "Lesson" };
      });
      setVersionLabels(vl);
    }
    setLoading(false);
  }

  async function openCreateForm() {
    setShowCreate(true);
    const [classRes, lvRes] = await Promise.all([
      supabase.from("classes").select("id, name").eq("teacher_id", appUserId!).order("name"),
      supabase.from("lesson_versions").select("id, version_label, lesson_id").eq("publish_status", "published"),
    ]);
    setClasses((classRes.data ?? []) as ClassOption[]);

    // Get lesson titles
    const lessonIds = [...new Set((lvRes.data ?? []).map((v: any) => v.lesson_id))];
    const { data: lessonData } = await supabase.from("lessons").select("id, title").in("id", lessonIds.length > 0 ? lessonIds : ["00000000-0000-0000-0000-000000000000"]);
    const lessonMap: Record<string, string> = {};
    (lessonData ?? []).forEach((l: any) => { lessonMap[l.id] = l.title; });

    setLessonVersions((lvRes.data ?? []).map((v: any) => ({
      id: v.id, version_label: v.version_label,
      lesson_title: lessonMap[v.lesson_id] || "Unknown Lesson"
    })));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!appUserId || !newClassId || !newLvId) return;
    setCreating(true);

    const { data: userData } = await supabase.from("users").select("organization_id").eq("id", appUserId).single();

    await supabase.from("assignments").insert({
      class_id: newClassId,
      lesson_version_id: newLvId,
      assigned_by_user_id: appUserId,
      organization_id: userData?.organization_id ?? "",
      due_at: newDue || null,
    });

    setShowCreate(false);
    setNewClassId("");
    setNewLvId("");
    setNewDue("");
    setCreating(false);
    load();
  }

  async function deleteAssignment(id: string) {
    await supabase.from("assignment_targets").delete().eq("assignment_id", id);
    await supabase.from("assignments").delete().eq("id", id);
    load();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading assignments…</div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Assignments</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {role === "student" ? "Your lesson assignments from enrolled classes." : "Manage lesson assignments across your classes."}
          </p>
        </div>
        {role === "teacher" && (
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Assignment
          </button>
        )}
      </div>

      {/* Create Assignment Dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Create Assignment</h2>
                  <p className="text-xs text-muted-foreground">Assign a lesson to a class</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Class</label>
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary"
                >
                  <option value="">Select a class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Lesson</label>
                <select
                  value={newLvId}
                  onChange={(e) => setNewLvId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary"
                >
                  <option value="">Select a lesson</option>
                  {lessonVersions.map((lv) => <option key={lv.id} value={lv.id}>{lv.lesson_title} ({lv.version_label})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Due Date (optional)</label>
                <input
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating || !newClassId || !newLvId} className="flex-1 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
                  {creating ? "Creating…" : "Create Assignment"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-3 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold">No assignments yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "student" ? "Assignments from your teacher will appear here." : "Create an assignment to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const info = versionLabels[a.lesson_version_id];
            return (
              <div key={a.id} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <ClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {info?.lessonTitle ?? "Lesson"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {classNames[a.class_id] ?? "Class"} · {info?.label ?? ""}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 bg-secondary px-2.5 py-0.5 rounded-lg font-medium">
                          <Calendar className="w-3 h-3" />
                          {a.due_at ? new Date(a.due_at).toLocaleDateString() : "No due date"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {role === "teacher" && (
                      <button
                        onClick={() => deleteAssignment(a.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                        title="Delete assignment"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
