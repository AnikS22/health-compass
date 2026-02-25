import { useEffect, useState } from "react";
import { Users, Plus, Search, Copy, Check, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ClassRow = {
  id: string;
  name: string;
  grade_band: string;
  teacher_id: string;
  organization_id: string;
  created_at: string;
};

type JoinCodeRow = {
  id: string;
  class_id: string;
  join_code: string;
  is_active: boolean;
  expires_at: string | null;
};

export default function Classes() {
  const { appUserId, role } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [joinCodes, setJoinCodes] = useState<Record<string, JoinCodeRow | null>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("6-8");
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);

  // Student join state
  const [joinInput, setJoinInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState("");

  useEffect(() => { loadClasses(); }, []);

  async function loadClasses() {
    const { data } = await supabase.from("classes").select("id, name, grade_band, teacher_id, organization_id, created_at").order("created_at", { ascending: false });
    const cls = (data ?? []) as ClassRow[];
    setClasses(cls);

    if (cls.length > 0) {
      const [enrollRes, codesRes] = await Promise.all([
        supabase.from("class_enrollments").select("class_id").in("class_id", cls.map((c) => c.id)),
        supabase.from("class_join_codes").select("id, class_id, join_code, is_active, expires_at").in("class_id", cls.map((c) => c.id)).eq("is_active", true),
      ]);
      const counts: Record<string, number> = {};
      (enrollRes.data ?? []).forEach((e: { class_id: string }) => { counts[e.class_id] = (counts[e.class_id] ?? 0) + 1; });
      setEnrollCounts(counts);

      const codeMap: Record<string, JoinCodeRow | null> = {};
      (codesRes.data ?? [] as JoinCodeRow[]).forEach((c: JoinCodeRow) => { codeMap[c.class_id] = c; });
      setJoinCodes(codeMap);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!appUserId || !newName.trim()) return;
    setCreating(true);
    const { data: userData } = await supabase.from("users").select("organization_id").eq("id", appUserId).single();
    const orgId = userData?.organization_id;
    if (!orgId) { setCreating(false); return; }
    await supabase.from("classes").insert({ name: newName.trim(), grade_band: newGrade, teacher_id: appUserId, organization_id: orgId });
    setNewName(""); setShowCreate(false); setCreating(false);
    loadClasses();
  }

  function generateCodeString() {
    return "CLS-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  async function generateJoinCode(classId: string) {
    setGeneratingCode(classId);
    // Deactivate existing codes
    const existing = joinCodes[classId];
    if (existing) {
      await supabase.from("class_join_codes").update({ is_active: false }).eq("id", existing.id);
    }
    const code = generateCodeString();
    await supabase.from("class_join_codes").insert({ class_id: classId, join_code: code, is_active: true });
    setGeneratingCode(null);
    loadClasses();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  async function handleJoinClass(e: React.FormEvent) {
    e.preventDefault();
    if (!appUserId || !joinInput.trim()) return;
    setJoining(true); setJoinStatus("");

    const { data, error } = await supabase.rpc("join_class_by_code", {
      p_code: joinInput.trim().toUpperCase(),
    });

    if (error) {
      setJoinStatus("Failed to join: " + error.message);
      setJoining(false);
      return;
    }

    const result = data as unknown as { ok: boolean; error?: string; class_id?: string };

    if (!result.ok) {
      setJoinStatus(result.error || "Invalid code."); setJoining(false); return;
    }

    setJoinStatus("Successfully joined the class!");
    setJoinInput("");
    loadClasses();
    setJoining(false);
  }

  const filtered = classes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading classes…</div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Classes</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage classrooms and enrollments.</p>
        </div>
        {role === "teacher" && (
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
            <Plus className="w-4 h-4" /> New Class
          </button>
        )}
      </div>

      {/* Student join code entry */}
      {role === "student" && (
        <div className="bg-card rounded-2xl border border-primary/30 p-6 shadow-lg">
          <h2 className="text-lg font-bold text-foreground mb-1">Join a Class</h2>
          <p className="text-sm text-muted-foreground mb-4">Enter the code your teacher gave you.</p>
          <form onSubmit={handleJoinClass} className="flex items-center gap-3">
            <input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              placeholder="e.g. CLS-AB12"
              required
              className="flex-1 max-w-xs px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary font-mono font-bold tracking-widest text-center"
            />
            <button type="submit" disabled={joining} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {joining ? "Joining…" : "Join"}
            </button>
          </form>
          {joinStatus && <p className={`mt-3 text-sm font-medium ${joinStatus.includes("Successfully") ? "text-success" : "text-destructive"}`}>{joinStatus}</p>}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-card rounded-2xl border border-primary/30 p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-foreground">Create a New Class</h2>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Class name" required className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary" />
          <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)} className="w-full px-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary">
            <option value="K-2">K-2</option><option value="3-5">3-5</option><option value="6-8">6-8</option><option value="9-10">9-10</option><option value="11-12">11-12</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">{creating ? "Creating…" : "Create"}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search classes..." className="w-full pl-9 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-foreground font-semibold">No classes found</p>
          <p className="text-sm text-muted-foreground mt-1">{role === "teacher" ? "Create your first class to get started." : "Join a class using a code from your teacher."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const code = joinCodes[c.id];
            const isOwner = c.teacher_id === appUserId;
            return (
              <div key={c.id} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Grade {c.grade_band}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{enrollCounts[c.id] ?? 0} students</span>
                  <span className="bg-secondary px-2.5 py-0.5 rounded-lg text-xs font-medium">Grade {c.grade_band}</span>
                </div>

                {/* Join Code section for teachers */}
                {isOwner && role === "teacher" && (
                  <div className="mt-4 pt-4 border-t border-border">
                    {code ? (
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">Join Code:</span>
                        <span className="font-mono font-bold text-sm text-foreground bg-secondary px-2.5 py-1 rounded-lg">{code.join_code}</span>
                        <button onClick={() => copyCode(code.join_code)} className="p-1 rounded hover:bg-secondary transition-colors">
                          {copiedCode === code.join_code ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                        <button onClick={() => generateJoinCode(c.id)} disabled={generatingCode === c.id} className="text-xs text-primary hover:underline ml-auto">
                          Regenerate
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateJoinCode(c.id)}
                        disabled={generatingCode === c.id}
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline disabled:opacity-50"
                      >
                        <Key className="w-3.5 h-3.5" />
                        {generatingCode === c.id ? "Generating…" : "Generate Join Code"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
