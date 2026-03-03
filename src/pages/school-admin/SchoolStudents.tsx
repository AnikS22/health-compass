import { useEffect, useState } from "react";
import { Users, ArrowLeft, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface StudentRow {
  id: string;
  display_name: string;
  email: string;
  is_active: boolean;
  class_names: string[];
}

export default function SchoolStudents() {
  const { appUserId } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!appUserId) return;
    loadStudents();
  }, [appUserId]);

  async function loadStudents() {
    setLoading(true);
    const { data: org } = await supabase.from("organizations").select("id").limit(1).maybeSingle();
    if (!org) { setLoading(false); return; }

    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, email, is_active")
      .eq("organization_id", org.id)
      .order("display_name");

    if (!users || users.length === 0) { setStudents([]); setLoading(false); return; }

    const userIds = users.map(u => u.id);

    // Get student role users
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role_key")
      .in("user_id", userIds)
      .eq("role_key", "student");

    const studentUserIds = new Set((roles ?? []).map(r => r.user_id));
    const studentUsers = users.filter(u => studentUserIds.has(u.id));

    // Get enrollments for class names
    const sIds = studentUsers.map(s => s.id);
    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("user_id, class_id")
      .in("user_id", sIds)
      .eq("status", "active");

    const classIds = [...new Set((enrollments ?? []).map(e => e.class_id))];
    let classMap: Record<string, string> = {};
    if (classIds.length > 0) {
      const { data: classes } = await supabase.from("classes").select("id, name").in("id", classIds);
      (classes ?? []).forEach(c => { classMap[c.id] = c.name; });
    }

    const enriched: StudentRow[] = studentUsers.map(u => {
      const userEnrollments = (enrollments ?? []).filter(e => e.user_id === u.id);
      return {
        ...u,
        class_names: userEnrollments.map(e => classMap[e.class_id] ?? "Unknown"),
      };
    });

    setStudents(enriched);
    setLoading(false);
  }

  async function toggleActive(userId: string, current: boolean) {
    await supabase.from("users").update({ is_active: !current }).eq("id", userId);
    loadStudents();
  }

  const filtered = students.filter(s =>
    s.display_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Students</h1>
        <p className="text-sm text-muted-foreground">All students enrolled at your school</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Classes</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No students found.</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground font-medium">{s.display_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {s.class_names.length > 0 ? s.class_names.map((cn, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{cn}</span>
                    )) : <span className="text-xs text-muted-foreground">No classes</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_active ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(s.id, s.is_active)}
                    className="text-xs font-medium text-primary hover:underline">
                    {s.is_active ? "Deactivate" : "Activate"}
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
