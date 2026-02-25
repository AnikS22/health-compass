import { useEffect, useState } from "react";
import { ClipboardList, Calendar, ChevronRight } from "lucide-react";
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

export default function Assignments() {
  const { role, appUserId } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [classNames, setClassNames] = useState<Record<string, string>>({});
  const [versionLabels, setVersionLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUserId) return;
    async function load() {
      let classIds: string[] = [];

      // Students only see assignments for their enrolled classes
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

      const { data: aData } = await query;
      const items = (aData ?? []) as AssignmentRow[];
      setAssignments(items);

      if (items.length > 0) {
        const cIds = [...new Set(items.map((a) => a.class_id))];
        const lvIds = [...new Set(items.map((a) => a.lesson_version_id))];

        const [classRes, lvRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", cIds),
          supabase.from("lesson_versions").select("id, version_label").in("id", lvIds),
        ]);

        const cn: Record<string, string> = {};
        (classRes.data ?? []).forEach((c: { id: string; name: string }) => { cn[c.id] = c.name; });
        setClassNames(cn);

        const vl: Record<string, string> = {};
        (lvRes.data ?? []).forEach((v: { id: string; version_label: string }) => { vl[v.id] = v.version_label; });
        setVersionLabels(vl);
      }
      setLoading(false);
    }
    load();
  }, [appUserId, role]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading assignments…</div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {role === "student" ? "Your lesson assignments from enrolled classes." : "Track lesson assignments and student progress."}
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold">No assignments yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "student" ? "Assignments from your teacher will appear here." : "Assignments will appear here once created."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ClipboardList className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {versionLabels[a.lesson_version_id] ?? "Lesson"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {classNames[a.class_id] ?? "Class"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 bg-secondary px-2.5 py-0.5 rounded-lg font-medium">
                        <Calendar className="w-3 h-3" />
                        {a.due_at ? new Date(a.due_at).toLocaleDateString() : "No due date"}
                      </span>
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
