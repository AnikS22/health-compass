import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Plus, UserCheck, UserX, Shield } from "lucide-react";

interface UserRow {
  id: string;
  display_name: string;
  email: string;
  is_active: boolean;
  organization_id: string | null;
  roles: string[];
  org_name?: string;
}

const ALL_ROLES = [
  { key: "student", label: "Student" },
  { key: "teacher", label: "Teacher" },
  { key: "curriculum_admin", label: "Curriculum Admin" },
  { key: "school_admin", label: "School Admin" },
  { key: "ethics_admin", label: "Ethics Admin" },
];

export default function ManageUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", organization_id: "", role: "student" });

  async function loadUsers() {
    setLoading(true);

    const { data: allRoles } = await supabase.from("user_roles").select("user_id, role_key");
    const roleMap = new Map<string, string[]>();
    (allRoles ?? []).forEach((r) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role_key);
      roleMap.set(r.user_id, existing);
    });

    const { data: orgData } = await supabase.from("organizations").select("id, name");
    const orgMap = new Map((orgData ?? []).map((o) => [o.id, o.name]));
    setOrgs(orgData ?? []);

    const { data: usersData } = await supabase
      .from("users")
      .select("id, display_name, email, is_active, organization_id")
      .order("display_name");

    setUsers(
      (usersData ?? []).map((u) => ({
        ...u,
        roles: roleMap.get(u.id) || [],
        org_name: u.organization_id ? orgMap.get(u.organization_id) ?? "—" : "Unassigned",
      }))
    );
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function toggleActive(u: UserRow) {
    await supabase.from("users").update({ is_active: !u.is_active }).eq("id", u.id);
    loadUsers();
  }

  async function toggleRole(userId: string, roleKey: string, hasRole: boolean) {
    if (hasRole) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role_key", roleKey as any);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role_key: roleKey as any });
    }
    loadUsers();
  }

  async function handleCreate() {
    setCreating(true);
    setCreateError("");
    try {
      const res = await supabase.functions.invoke("create-teacher", {
        body: {
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          organization_id: form.organization_id || null,
          role: form.role,
        },
      });
      if (res.error) {
        // Try to parse the error body for a meaningful message
        let msg = "Failed to create user";
        try {
          const body = typeof res.error === "object" && "context" in res.error
            ? await (res.error as any).context?.json?.()
            : null;
          if (body?.error) msg = body.error;
          else if (res.error.message) msg = res.error.message;
        } catch {
          if (res.error.message) msg = res.error.message;
        }
        setCreateError(msg);
      } else if (res.data?.error) {
        setCreateError(res.data.error);
      } else {
        setForm({ email: "", password: "", full_name: "", organization_id: "", role: "student" });
        setShowCreate(false);
        loadUsers();
      }
    } catch (e: any) {
      setCreateError(e.message ?? "Unknown error");
    }
    setCreating(false);
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.roles.includes(roleFilter);
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Manage Users</h1>
          <p className="text-sm text-muted-foreground">Create accounts, assign roles and organizations</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-base font-bold text-foreground">Create New User</h2>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground"
                placeholder="jane@school.edu"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Organization (optional)</label>
              <select
                value={form.organization_id}
                onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground"
              >
                <option value="">None</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={creating || !form.email || !form.password || !form.full_name}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Create User"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-card border border-input rounded-xl px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">All Roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-foreground">User</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Roles</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Organization</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    {u.display_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ALL_ROLES.map((r) => {
                        const has = u.roles.includes(r.key);
                        return (
                          <button
                            key={r.key}
                            onClick={() => toggleRole(u.id, r.key, has)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                              has
                                ? "bg-primary/10 text-primary border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                : "bg-secondary text-muted-foreground border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                            }`}
                            title={has ? `Remove ${r.label} role` : `Add ${r.label} role`}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.org_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
