import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Plus, Users, Mail, ArrowLeft, UserPlus, Globe, Pencil, Trash2, X, Check } from "lucide-react";

interface Org {
  id: string;
  name: string;
  tenant_slug: string;
  email_domain?: string | null;
  created_at: string;
  _memberCount?: number;
}

interface OrgUser {
  id: string;
  display_name: string;
  email: string;
  is_active: boolean;
  roles: string[];
}

export default function ManageSchools() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);

  // Edit org
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirm
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add teacher form
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [addStatus, setAddStatus] = useState("");

  // Detail view editing
  const [editingDetail, setEditingDetail] = useState(false);
  const [detailName, setDetailName] = useState("");
  const [detailSlug, setDetailSlug] = useState("");
  const [detailDomain, setDetailDomain] = useState("");
  const [savingDetail, setSavingDetail] = useState(false);

  async function loadOrgs() {
    setLoading(true);
    const { data } = await supabase.from("organizations").select("*").order("name");
    if (data) {
      const enriched = await Promise.all(
        data.map(async (org) => {
          const { count } = await supabase
            .from("users").select("id", { count: "exact", head: true })
            .eq("organization_id", org.id);
          return { ...org, email_domain: (org as any).email_domain ?? null, _memberCount: count ?? 0 } as Org;
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
      email_domain: newDomain.trim().toLowerCase() || null,
    });
    if (!error) {
      setNewName(""); setNewSlug(""); setNewDomain("");
      setShowCreate(false);
      loadOrgs();
    }
    setCreating(false);
  }

  async function saveEditInline(orgId: string) {
    if (!editName.trim() || !editSlug.trim()) return;
    setSavingEdit(true);
    await supabase.from("organizations").update({
      name: editName.trim(),
      tenant_slug: editSlug.trim().toLowerCase().replace(/\s+/g, "-"),
      email_domain: editDomain.trim().toLowerCase() || null,
    }).eq("id", orgId);
    setEditingOrg(null);
    setSavingEdit(false);
    loadOrgs();
  }

  async function deleteOrg(orgId: string) {
    setDeleting(true);
    // Unassign all users from this org first
    await supabase.from("users").update({ organization_id: null }).eq("organization_id", orgId);
    await supabase.from("organizations").delete().eq("id", orgId);
    setDeletingOrgId(null);
    setDeleting(false);
    loadOrgs();
  }

  async function selectOrg(org: Org) {
    setSelectedOrg(org);
    setShowAddTeacher(false);
    setAddStatus("");
    setEditingDetail(false);
    setDetailName(org.name);
    setDetailSlug(org.tenant_slug);
    setDetailDomain(org.email_domain ?? "");
    const { data: users } = await supabase
      .from("users").select("id, display_name, email, is_active")
      .eq("organization_id", org.id).order("display_name");
    if (users) {
      const withRoles = await Promise.all(
        users.map(async (u) => {
          const { data: roles } = await supabase.from("user_roles").select("role_key").eq("user_id", u.id);
          return { ...u, roles: roles?.map(r => r.role_key) ?? [] };
        })
      );
      setOrgUsers(withRoles);
    }
  }

  async function toggleUserActive(userId: string, currentActive: boolean) {
    await supabase.from("users").update({ is_active: !currentActive }).eq("id", userId);
    if (selectedOrg) selectOrg(selectedOrg);
  }

  async function saveDetailEdit() {
    if (!selectedOrg || !detailName.trim() || !detailSlug.trim()) return;
    setSavingDetail(true);
    await supabase.from("organizations").update({
      name: detailName.trim(),
      tenant_slug: detailSlug.trim().toLowerCase().replace(/\s+/g, "-"),
      email_domain: detailDomain.trim().toLowerCase() || null,
    }).eq("id", selectedOrg.id);
    const updated = { ...selectedOrg, name: detailName.trim(), tenant_slug: detailSlug.trim(), email_domain: detailDomain.trim() || null };
    setSelectedOrg(updated);
    setEditingDetail(false);
    setSavingDetail(false);
    loadOrgs();
  }

  async function deleteSelectedOrg() {
    if (!selectedOrg) return;
    setDeleting(true);
    await supabase.from("users").update({ organization_id: null }).eq("organization_id", selectedOrg.id);
    await supabase.from("organizations").delete().eq("id", selectedOrg.id);
    setDeleting(false);
    setSelectedOrg(null);
    loadOrgs();
  }

  async function addTeacherToSchool() {
    if (!teacherEmail.trim() || !teacherName.trim() || !teacherPassword.trim() || !selectedOrg) return;
    setAddingTeacher(true);
    setAddStatus("");

    const { data, error } = await supabase.functions.invoke("create-teacher", {
      body: {
        email: teacherEmail.trim(),
        password: teacherPassword.trim(),
        full_name: teacherName.trim(),
        organization_id: selectedOrg.id,
      },
    });

    if (error) {
      setAddStatus(`Error: ${error.message}`);
    } else if (data?.error) {
      setAddStatus(`Error: ${data.error}`);
    } else {
      setAddStatus("Teacher added successfully!");
      setTeacherEmail(""); setTeacherName(""); setTeacherPassword("");
      setShowAddTeacher(false);
      selectOrg(selectedOrg);
    }
    setAddingTeacher(false);
  }

  // ── Detail view ──
  if (selectedOrg) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOrg(null)} className="flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> All Schools
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          {editingDetail ? (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground">Edit School Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <input value={detailName} onChange={e => setDetailName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Slug</label>
                  <input value={detailSlug} onChange={e => setDetailSlug(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email Domain</label>
                  <input value={detailDomain} onChange={e => setDetailDomain(e.target.value)} placeholder="e.g. school.edu"
                    className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveDetailEdit} disabled={savingDetail}
                  className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50">
                  <Check className="w-3.5 h-3.5" /> {savingDetail ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditingDetail(false)}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-foreground">{selectedOrg.name}</h1>
                <div className="flex gap-3 text-sm text-muted-foreground mt-0.5">
                  <span>Slug: {selectedOrg.tenant_slug}</span>
                  {selectedOrg.email_domain && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> @{selectedOrg.email_domain}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingDetail(true)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={deleteSelectedOrg} disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 border border-destructive/30 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Members ({orgUsers.length})</h2>
          <button onClick={() => setShowAddTeacher(!showAddTeacher)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            <UserPlus className="w-4 h-4" /> Add Teacher
          </button>
        </div>

        {showAddTeacher && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-foreground">Add Teacher Account</h3>
            <p className="text-xs text-muted-foreground">This creates a Supabase Auth account and assigns them to this school with the teacher role.</p>
            <input placeholder="Full name" value={teacherName} onChange={e => setTeacherName(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            <input placeholder={`Email${selectedOrg.email_domain ? ` (e.g. teacher@${selectedOrg.email_domain})` : ""}`}
              value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} type="email"
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            <input placeholder="Temporary password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} type="text"
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
            {addStatus && (
              <p className={`text-sm font-medium ${addStatus.startsWith("Error") ? "text-destructive" : "text-green-600"}`}>{addStatus}</p>
            )}
            <div className="flex gap-2">
              <button onClick={addTeacherToSchool} disabled={addingTeacher}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
                {addingTeacher ? "Creating…" : "Create Teacher Account"}
              </button>
              <button onClick={() => setShowAddTeacher(false)}
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
                <th className="text-left px-4 py-3 font-semibold text-foreground">Roles</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgUsers.map(u => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{u.display_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.map(r => (
                        <span key={r} className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleUserActive(u.id, u.is_active)}
                      className="text-xs font-medium text-primary hover:underline">
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {orgUsers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No members yet. Add a teacher above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Manage Schools</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and delete schools</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New School
        </button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-foreground">Create School</h3>
          <input placeholder="School name (e.g. Florida Atlantic University)" value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <input placeholder="Slug (e.g. fau)" value={newSlug} onChange={e => setNewSlug(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <input placeholder="Email domain for auto-sorting (optional, e.g. fau.edu)" value={newDomain} onChange={e => setNewDomain(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <p className="text-xs text-muted-foreground">Optional — Users with matching .edu email domains will be auto-sorted to this school.</p>
          <button onClick={createOrg} disabled={creating}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading schools…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map(org => (
            <div key={org.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors relative group">
              {/* Delete confirmation overlay */}
              {deletingOrgId === org.id && (
                <div className="absolute inset-0 bg-card/95 rounded-xl flex flex-col items-center justify-center z-10 p-4 space-y-3">
                  <p className="text-sm font-bold text-destructive text-center">Delete "{org.name}"?</p>
                  <p className="text-xs text-muted-foreground text-center">All members will be unassigned. This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => deleteOrg(org.id)} disabled={deleting}
                      className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50">
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                    <button onClick={() => setDeletingOrgId(null)}
                      className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Inline edit mode */}
              {editingOrg === org.id ? (
                <div className="space-y-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name"
                    className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground" />
                  <input value={editSlug} onChange={e => setEditSlug(e.target.value)} placeholder="Slug"
                    className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground" />
                  <input value={editDomain} onChange={e => setEditDomain(e.target.value)} placeholder="Email domain (optional)"
                    className="w-full px-3 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEditInline(org.id)} disabled={savingEdit}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50">
                      <Check className="w-3 h-3" /> {savingEdit ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingOrg(null)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => selectOrg(org)} className="text-left w-full">
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
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {org._memberCount ?? 0} members</span>
                      {org.email_domain && (
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> @{org.email_domain}</span>
                      )}
                    </div>
                  </button>
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingOrg(org.id); setEditName(org.name); setEditSlug(org.tenant_slug); setEditDomain(org.email_domain ?? ""); }}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingOrgId(org.id); }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {orgs.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-full">No schools created yet</p>
          )}
        </div>
      )}
    </div>
  );
}