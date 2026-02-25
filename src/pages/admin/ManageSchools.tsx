import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Plus, Users, BookOpen } from "lucide-react";

interface Org {
  id: string;
  name: string;
  tenant_slug: string;
  created_at: string;
  _teacherCount?: number;
  _studentCount?: number;
}

export default function ManageSchools() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [orgUsers, setOrgUsers] = useState<{ id: string; display_name: string; email: string; is_active: boolean; roles: string[] }[]>([]);

  async function loadOrgs() {
    setLoading(true);
    const { data } = await supabase.from("organizations").select("*").order("name");
    if (data) {
      // Load user counts per org
      const enriched = await Promise.all(
        data.map(async (org) => {
          const { count: tc } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id);
          return { ...org, _teacherCount: tc ?? 0 } as Org;
        })
      );
      setOrgs(enriched);
    }
    setLoading(false);
  }

  useEffect(() => { loadOrgs(); }, []);

  async function createOrg() {
    if (!newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("organizations").insert({
      name: newName.trim(),
      tenant_slug: newSlug.trim().toLowerCase().replace(/\s+/g, "-"),
    });
    if (!error) {
      setNewName("");
      setNewSlug("");
      setShowCreate(false);
      loadOrgs();
    }
    setCreating(false);
  }

  async function selectOrg(org: Org) {
    setSelectedOrg(org);
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, email, is_active")
      .eq("organization_id", org.id)
      .order("display_name");
    if (users) {
      const withRoles = await Promise.all(
        users.map(async (u) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role_key")
            .eq("user_id", u.id);
          return { ...u, roles: roles?.map((r) => r.role_key) ?? [] };
        })
      );
      setOrgUsers(withRoles);
    }
  }

  async function toggleUserActive(userId: string, currentActive: boolean) {
    await supabase.from("users").update({ is_active: !currentActive }).eq("id", userId);
    if (selectedOrg) selectOrg(selectedOrg);
  }

  if (selectedOrg) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOrg(null)} className="text-sm text-primary hover:underline">
            ← All Schools
          </button>
          <h1 className="text-2xl font-extrabold text-foreground">{selectedOrg.name}</h1>
        </div>
        <p className="text-sm text-muted-foreground">Slug: {selectedOrg.tenant_slug}</p>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Members ({orgUsers.length})</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Roles</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgUsers.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{u.display_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((r) => (
                          <span key={r} className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserActive(u.id, u.is_active)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {orgUsers.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No members yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Manage Schools</h1>
          <p className="text-sm text-muted-foreground">Create and manage school organizations</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New School
        </button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-foreground">Create School</h3>
          <input
            placeholder="School name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <input
            placeholder="Slug (e.g. lincoln-high)"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <button
            onClick={createOrg}
            disabled={creating}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading schools…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => selectOrg(org)}
              className="text-left bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{org.name}</h3>
                  <p className="text-xs text-muted-foreground">{org.tenant_slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {org._teacherCount ?? 0} members</span>
              </div>
            </button>
          ))}
          {orgs.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-full">No schools created yet</p>
          )}
        </div>
      )}
    </div>
  );
}
