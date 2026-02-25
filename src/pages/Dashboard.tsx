import { useEffect, useState } from "react";
import { Users, Radio, Award, School, Sparkles } from "lucide-react";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";

type RecentSession = {
  id: string;
  session_code: string;
  started_at: string;
  ended_at: string | null;
  host_teacher_id: string;
};

export default function Dashboard() {
  const [orgCount, setOrgCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [certCount, setCertCount] = useState(0);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [orgRes, studentRes, sessRes, certRes, recentRes] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("live_sessions").select("id", { count: "exact", head: true }),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
        supabase.from("live_sessions").select("id, session_code, started_at, ended_at, host_teacher_id").order("started_at", { ascending: false }).limit(5),
      ]);
      setOrgCount(orgRes.count ?? 0);
      setStudentCount(studentRes.count ?? 0);
      setSessionCount(sessRes.count ?? 0);
      setCertCount(certRes.count ?? 0);
      setRecentSessions((recentRes.data as RecentSession[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome back to The Ethics Lab</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">Where GenZ shapes the future of ethical AI.</p>
        </div>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Organizations" value={loading ? "—" : orgCount} subtitle="Total registered" icon={School} />
        <StatCard title="Users" value={loading ? "—" : studentCount} subtitle="All roles" icon={Users} />
        <StatCard title="Live Sessions" value={loading ? "—" : sessionCount} subtitle="All time" icon={Radio} />
        <StatCard title="Certificates" value={loading ? "—" : certCount} subtitle="Issued" icon={Award} />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Recent Live Sessions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest activity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Code</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Started</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Loading…</td></tr>
              ) : recentSessions.length === 0 ? (
                <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No sessions yet</td></tr>
              ) : recentSessions.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">{s.session_code}</td>
                  <td className="p-4 text-muted-foreground">{new Date(s.started_at).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${s.ended_at ? "bg-secondary text-muted-foreground" : "bg-success/10 text-success"}`}>
                      {s.ended_at ? "ended" : "active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
