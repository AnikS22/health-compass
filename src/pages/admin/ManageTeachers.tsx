import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Search, UserX, UserCheck } from "lucide-react";

interface TeacherRow {
  id: string;
  display_name: string;
  email: string;
  is_active: boolean;
  organization_id: string | null;
  org_name?: string;
}

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);

  async function loadTeachers() {
    setLoading(true);
    // Get all teacher role user_ids
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role_key", "teacher");
    if (!roleData || roleData.length === 0) { setTeachers([]); setLoading(false); return; }

    const teacherIds = roleData.map((r) => r.user_id);
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, email, is_active, organization_id")
      .in("id", teacherIds)
      .order("display_name");

    // Load orgs
    const { data: orgData } = await supabase.from("organizations").select("id, name");
    const orgMap = new Map((orgData ?? []).map((o) => [o.id, o.name]));
    setOrgs(orgData ?? []);

    setTeachers(
      (users ?? []).map((u) => ({
        ...u,
        org_name: u.organization_id ? orgMap.get(u.organization_id) ?? "—" : "Unassigned",
      }))
    );
    setLoading(false);
  }

  useEffect(() => { loadTeachers(); }, []);

  async function toggleActive(t: TeacherRow) {
    await supabase.from("users").update({ is_active: !t.is_active }).eq("id", t.id);
    loadTeachers();
  }

  async function assignOrg(teacherId: string, orgId: string) {
    await supabase.from("users").update({ organization_id: orgId || null }).eq("id", teacherId);
    loadTeachers();
  }

  const filtered = teachers.filter(
    (t) =>
      t.display_name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Manage Teachers</h1>
        <p className="text-sm text-muted-foreground">View, activate/deactivate, and assign teachers to schools</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search teachers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Teacher</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">School</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    {t.display_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={t.organization_id ?? ""}
                      onChange={(e) => assignOrg(t.id, e.target.value)}
                      className="bg-background border border-input rounded-lg px-2 py-1 text-xs text-foreground"
                    >
                      <option value="">Unassigned</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(t)}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {t.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      {t.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No teachers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
