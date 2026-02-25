import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, Copy, Check, Key, ChevronRight, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CreateClassDialog from "@/components/CreateClassDialog";
import ClassSettingsDialog from "@/components/ClassSettingsDialog";

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
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [joinCodes, setJoinCodes] = useState<Record<string, JoinCodeRow | null>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);
  const [settingsClass, setSettingsClass] = useState<ClassRow | null>(null);

  // Student join state
  const [joinInput, setJoinInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState("");

  useEffect(() => { loadClasses(); }, [appUserId, role]);

  async function loadClasses() {
    if (!appUserId) return;

    let cls: ClassRow[] = [];

    if (role === "student") {
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("user_id", appUserId)
        .eq("status", "active");

      const classIds = (enrollments ?? []).map((e) => e.class_id);
      if (classIds.length > 0) {
        const { data } = await supabase
          .from("classes")
          .select("id, name, grade_band, teacher_id, organization_id, created_at")
          .in("id", classIds)
          .order("created_at", { ascending: false });
        cls = (data ?? []) as ClassRow[];
      }
    } else {
      const { data } = await supabase
        .from("classes")
        .select("id, name, grade_band, teacher_id, organization_id, created_at")
        .eq("teacher_id", appUserId)
        .order("created_at", { ascending: false });
      cls = (data ?? []) as ClassRow[];
    }

    setClasses(cls);

    if (cls.length > 0) {
      const ids = cls.map((c) => c.id);
      const [enrollRes, codesRes] = await Promise.all([
        supabase.from("class_enrollments").select("class_id").in("class_id", ids),
        supabase.from("class_join_codes").select("id, class_id, join_code, is_active, expires_at").in("class_id", ids).eq("is_active", true),
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

  async function generateJoinCode(classId: string) {
    setGeneratingCode(classId);
    const existing = joinCodes[classId];
    if (existing) {
      await supabase.from("class_join_codes").update({ is_active: false }).eq("id", existing.id);
    }
    const code = "CLS-" + Math.random().toString(36).slice(2, 6).toUpperCase();
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
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {role === "student" ? "My Classes" : "Classes"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {role === "student" ? "Classes you're enrolled in." : "Manage your classrooms. Click a class to manage it."}
          </p>
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
              <div
                key={c.id}
                className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/classes/${c.id}`)}>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Grade {c.grade_band}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOwner && role === "teacher" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSettingsClass(c); }}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        title="Class Settings"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                    <button onClick={() => navigate(`/classes/${c.id}`)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{enrollCounts[c.id] ?? 0} students</span>
                  <span className="bg-secondary px-2.5 py-0.5 rounded-lg text-xs font-medium">Grade {c.grade_band}</span>
                </div>

                {/* Join Code section for teachers */}
                {isOwner && role === "teacher" && (
                  <div className="mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
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

      {/* Create Class Dialog */}
      {appUserId && (
        <CreateClassDialog
          appUserId={appUserId}
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={loadClasses}
        />
      )}

      {/* Settings Dialog */}
      {settingsClass && (
        <ClassSettingsDialog
          classInfo={settingsClass}
          open={!!settingsClass}
          onClose={() => setSettingsClass(null)}
          onUpdated={() => { setSettingsClass(null); loadClasses(); }}
          onDeleted={() => { setSettingsClass(null); loadClasses(); }}
        />
      )}
    </div>
  );
}
