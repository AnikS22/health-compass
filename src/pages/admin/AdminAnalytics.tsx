import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp } from "lucide-react";

interface GlobalRow {
  metric_date: string;
  total_joins: number;
  total_starts: number;
  total_finishes: number;
  retention_d7: number;
}

export default function AdminAnalytics() {
  const [global, setGlobal] = useState<GlobalRow[]>([]);
  const [orgRollups, setOrgRollups] = useState<{
    organization_id: string;
    org_name: string;
    active_students: number;
    active_teachers: number;
    completion_rate: number;
    avg_confidence: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [globalRes, rollupRes, orgsRes] = await Promise.all([
        supabase.from("global_analytics_daily").select("*").order("metric_date", { ascending: false }).limit(30),
        supabase.from("analytics_daily_rollups").select("*").order("metric_date", { ascending: false }).limit(100),
        supabase.from("organizations").select("id, name"),
      ]);

      setGlobal(globalRes.data ?? []);

      const orgMap = new Map((orgsRes.data ?? []).map((o) => [o.id, o.name]));
      // Aggregate rollups per org (latest available)
      const orgAgg = new Map<string, { active_students: number; active_teachers: number; completion_rate: number; avg_confidence: number }>();
      (rollupRes.data ?? []).forEach((r) => {
        if (!orgAgg.has(r.organization_id)) {
          orgAgg.set(r.organization_id, {
            active_students: r.active_students,
            active_teachers: r.active_teachers,
            completion_rate: Number(r.completion_rate),
            avg_confidence: Number(r.avg_confidence),
          });
        }
      });

      setOrgRollups(
        Array.from(orgAgg.entries()).map(([orgId, data]) => ({
          organization_id: orgId,
          org_name: orgMap.get(orgId) ?? "Unknown",
          ...data,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground text-sm">Loading analytics…</div>;

  const latestGlobal = global[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground">Global usage metrics and school-level insights</p>
      </div>

      {latestGlobal ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Joins</p>
            <p className="text-2xl font-extrabold text-foreground">{latestGlobal.total_joins}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Starts</p>
            <p className="text-2xl font-extrabold text-foreground">{latestGlobal.total_starts}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Finishes</p>
            <p className="text-2xl font-extrabold text-foreground">{latestGlobal.total_finishes}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">D7 Retention</p>
            <p className="text-2xl font-extrabold text-foreground">{Number(latestGlobal.retention_d7).toFixed(1)}%</p>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No global analytics data yet. Data is populated as users interact with the platform.</p>
      )}

      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          School Performance
        </h2>
        {orgRollups.length > 0 ? (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">School</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Active Students</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Active Teachers</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Completion Rate</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Avg Confidence</th>
                </tr>
              </thead>
              <tbody>
                {orgRollups.map((r) => (
                  <tr key={r.organization_id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground font-medium">{r.org_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.active_students}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.active_teachers}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.completion_rate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.avg_confidence.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No school analytics data yet</p>
        )}
      </div>
    </div>
  );
}
