import { useEffect, useState } from "react";
import { BookOpen, Plus, ArrowLeft, Users, Key, Copy, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ClassRow {
  id: string;
  name: string;
  grade_band: string;
  teacher_id: string;
  teacher_name?: string;
  student_count: number;
  join_code?: string;
}

export default function SchoolClasses() {
  const { appUserId } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create class form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newTeacherId, setNewTeacherId] = useState("");
  const [teachers, setTeachers] = useState<{ id: string; display_name: string }[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (appUserId) loadAll(); }, [appUserId]);

  async function loadAll() {
    setLoading(true);
    const { data: org } = await supabase.from("organizations").select("id").limit(1).maybeSingle();
    if (!org) { setLoading(false); return; }
    setOrgId(org.id);

    // Load classes
    const { data: clsData } = await supabase
      .from("classes")
      .select("id, name, grade_band, teacher_id")
      .eq("organization_id", org.id)
      .order("name");

    const allClasses = (clsData ?? []) as { id: string; name: string; grade_band: string; teacher_id: string }[];

    // Load teachers for this org
    const { data: orgUsers } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("organization_id", org.id);

    const userIds = (orgUsers ?? []).map(u => u.id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role_key")
      .in("user_id", userIds)
      .eq("role_key", "teacher");

    const teacherIds = new Set((roles ?? []).map(r => r.user_id));
    const teacherList = (orgUsers ?? []).filter(u => teacherIds.has(u.id));
    setTeachers(teacherList);
    if (teacherList.length > 0 && !newTeacherId) setNewTeacherId(teacherList[0].id);

    const teacherMap: Record<string, string> = {};
    (orgUsers ?? []).forEach(u => { teacherMap[u.id] = u.display_name; });

    // Load enrollment counts
    const classIds = allClasses.map(c => c.id);
    let enrollCounts: Record<string, number> = {};
    let codeMap: Record<string, string> = {};

    if (classIds.length > 0) {
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .in("class_id", classIds)
        .eq("status", "active");
      (enrollments ?? []).forEach(e => { enrollCounts[e.class_id] = (enrollCounts[e.class_id] ?? 0) + 1; });

      const { data: codes } = await supabase
        .from("class_join_codes")
        .select("class_id, join_code")
        .in("class_id", classIds)
        .eq("is_active", true);
      (codes ?? []).forEach(c => { codeMap[c.class_id] = c.join_code; });
    }

    setClasses(allClasses.map(c => ({
      ...c,
      teacher_name: teacherMap[c.teacher_id] ?? "Unknown",
      student_count: enrollCounts[c.id] ?? 0,
      join_code: codeMap[c.id],
    })));
    setLoading(false);
  }

  async function createClass() {
    if (!newName.trim() || !newGrade.trim() || !newTeacherId || !orgId) return;
    setCreating(true);
    await supabase.from("classes").insert({
      name: newName.trim(),
      grade_band: newGrade.trim(),
      teacher_id: newTeacherId,
      organization_id: orgId,
    });
    setNewName(""); setNewGrade("");
    setShowCreate(false);
    setCreating(false);
    loadAll();
  }

  async function deleteClass(classId: string) {
    if (!confirm("Delete this class? Enrollments will also be removed.")) return;
    await supabase.from("class_enrollments").delete().eq("class_id", classId);
    await supabase.from("class_join_codes").delete().eq("class_id", classId);
    await supabase.from("classes").delete().eq("id", classId);
    loadAll();
  }

  async function generateCode(classId: string) {
    // Deactivate existing
    await supabase.from("class_join_codes").update({ is_active: false }).eq("class_id", classId);
    const code = "CLS-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    await supabase.from("class_join_codes").insert({ class_id: classId, join_code: code, is_active: true });
    loadAll();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground">All classes at your school</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">
          <Plus className="w-4 h-4" /> New Class
        </button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-foreground">Create Class</h3>
          <input placeholder="Class name" value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <input placeholder="Grade band (e.g. 6-8)" value={newGrade} onChange={e => setNewGrade(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Assign Teacher</label>
            <select value={newTeacherId} onChange={e => setNewTeacherId(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.display_name}</option>
              ))}
              {teachers.length === 0 && <option value="">No teachers available</option>}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={createClass} disabled={creating || !newTeacherId}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {creating ? "Creating…" : "Create"}
            </button>
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-bold">Cancel</button>
          </div>
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Class</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Grade</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Teacher</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Students</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Join Code</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No classes yet.</td></tr>
            ) : classes.map(c => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/30 cursor-pointer" onClick={() => navigate(`/classes/${c.id}`)}>
                <td className="px-4 py-3 text-foreground font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.grade_band}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.teacher_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.student_count}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {c.join_code ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs font-bold bg-secondary px-2 py-0.5 rounded text-foreground">{c.join_code}</span>
                      <button onClick={() => copyCode(c.join_code!)} className="p-0.5">
                        {copiedCode === c.join_code ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => generateCode(c.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Key className="w-3 h-3" /> Generate
                    </button>
                  )}
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <button onClick={() => deleteClass(c.id)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
