import { useEffect, useState } from "react";
import { GraduationCap, UserPlus, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface TeacherRow {
  id: string;
  display_name: string;
  email: string;
  is_active: boolean;
}

export default function SchoolTeachers() {
  const { appUserId } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Add teacher form
  const [showAdd, setShowAdd] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [addStatus, setAddStatus] = useState("");

  useEffect(() => {
    if (!appUserId) return;
    loadTeachers();
  }, [appUserId]);

  async function loadTeachers() {
    setLoading(true);
    // Get org
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!org) { setLoading(false); return; }
    setOrgId(org.id);

    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, email, is_active")
      .eq("organization_id", org.id)
      .order("display_name");

    if (users) {
      const userIds = users.map(u => u.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role_key")
        .in("user_id", userIds)
        .eq("role_key", "teacher");

      const teacherUserIds = new Set((roles ?? []).map(r => r.user_id));
      setTeachers(users.filter(u => teacherUserIds.has(u.id)));
    }
    setLoading(false);
  }

  async function toggleActive(userId: string, current: boolean) {
    await supabase.from("users").update({ is_active: !current }).eq("id", userId);
    loadTeachers();
  }

  async function addTeacher() {
    if (!teacherEmail.trim() || !teacherName.trim() || !teacherPassword.trim() || !orgId) return;
    setAdding(true);
    setAddStatus("");

    const { data, error } = await supabase.functions.invoke("create-teacher", {
      body: {
        email: teacherEmail.trim(),
        password: teacherPassword.trim(),
        full_name: teacherName.trim(),
        organization_id: orgId,
      },
    });

    if (error) {
      setAddStatus(`Error: ${error.message}`);
    } else if (data?.error) {
      setAddStatus(`Error: ${data.error}`);
    } else {
      setAddStatus("Teacher added successfully!");
      setTeacherEmail(""); setTeacherName(""); setTeacherPassword("");
      setShowAdd(false);
      loadTeachers();
    }
    setAdding(false);
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
          <h1 className="text-2xl font-extrabold text-foreground">Teachers</h1>
          <p className="text-sm text-muted-foreground">Manage teacher accounts at your school</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">
          <UserPlus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {showAdd && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-foreground">Add Teacher Account</h3>
          <p className="text-xs text-muted-foreground">Creates a Supabase Auth account and assigns the teacher role.</p>
          <input placeholder="Full name" value={teacherName} onChange={e => setTeacherName(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <input placeholder="Email" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} type="email"
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <input placeholder="Temporary password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} type="text"
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          {addStatus && (
            <p className={`text-sm font-medium ${addStatus.startsWith("Error") ? "text-destructive" : "text-green-600"}`}>{addStatus}</p>
          )}
          <div className="flex gap-2">
            <button onClick={addTeacher} disabled={adding}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {adding ? "Creating…" : "Create Teacher"}
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-bold">Cancel</button>
          </div>
        </div>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : teachers.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No teachers yet. Add one above.</td></tr>
            ) : teachers.map(t => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground font-medium">{t.display_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(t.id, t.is_active)}
                    className="text-xs font-medium text-primary hover:underline">
                    {t.is_active ? "Deactivate" : "Activate"}
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
