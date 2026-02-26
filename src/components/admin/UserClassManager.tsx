import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Plus, X } from "lucide-react";

interface Props {
  userId: string;
  userOrgId: string | null;
}

type ClassRow = { id: string; name: string; grade_band: string };

export default function UserClassManager({ userId, userOrgId }: Props) {
  const [allClasses, setAllClasses] = useState<ClassRow[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, userOrgId]);

  async function loadData() {
    setLoading(true);

    // Load all classes (optionally filter by org)
    const q = supabase.from("classes").select("id, name, grade_band").order("name");
    const { data: classes } = await q;
    setAllClasses((classes ?? []) as ClassRow[]);

    // Load current enrollments for this user
    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("class_id")
      .eq("user_id", userId)
      .eq("status", "active");

    setEnrolledIds(new Set((enrollments ?? []).map((e) => e.class_id)));
    setLoading(false);
  }

  async function enroll(classId: string) {
    await supabase.from("class_enrollments").insert({
      class_id: classId,
      user_id: userId,
      status: "active",
    });
    setEnrolledIds((prev) => new Set([...prev, classId]));
  }

  async function unenroll(classId: string) {
    await supabase
      .from("class_enrollments")
      .delete()
      .eq("class_id", classId)
      .eq("user_id", userId);
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      next.delete(classId);
      return next;
    });
  }

  if (loading) return <p className="text-xs text-muted-foreground">Loading classes…</p>;

  if (allClasses.length === 0) return <p className="text-xs text-muted-foreground">No classes exist yet</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">Classes</p>
      <div className="flex flex-wrap gap-1.5">
        {allClasses.map((c) => {
          const enrolled = enrolledIds.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => (enrolled ? unenroll(c.id) : enroll(c.id))}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                enrolled
                  ? "bg-primary/10 text-primary border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  : "bg-secondary text-muted-foreground border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              }`}
              title={enrolled ? `Remove from ${c.name}` : `Enroll in ${c.name}`}
            >
              <BookOpen className="w-3 h-3" />
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
