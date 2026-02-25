import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type RollupRow = {
  metric_date: string;
  completion_rate: number;
  avg_confidence: number;
  active_students: number;
  active_teachers: number;
};

export default function Reports() {
  const [rollups, setRollups] = useState<RollupRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("analytics_daily_rollups")
        .select("metric_date, completion_rate, avg_confidence, active_students, active_teachers")
        .order("metric_date", { ascending: true })
        .limit(30);
      setRollups((data ?? []) as RollupRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const latestRollup = rollups.length > 0 ? rollups[rollups.length - 1] : null;

  const chartData = rollups.map((r) => ({
    date: new Date(r.metric_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    rate: Number(r.completion_rate),
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">Analytics and performance insights.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading reports…</div></div>
      ) : rollups.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-foreground font-semibold">No analytics data yet</p>
          <p className="text-sm text-muted-foreground mt-1">Data will appear here as students complete lessons.</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-bold text-foreground mb-1">Completion Rate Over Time</h3>
            <p className="text-xs text-muted-foreground mb-4">Percentage of students completing assigned lessons</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Avg Confidence</p>
              <p className="text-4xl font-extrabold text-foreground mt-2 tracking-tight">{latestRollup ? `${Number(latestRollup.avg_confidence).toFixed(0)}%` : "—"}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Teachers</p>
              <p className="text-4xl font-extrabold text-foreground mt-2 tracking-tight">{latestRollup?.active_teachers ?? "—"}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Students</p>
              <p className="text-4xl font-extrabold text-foreground mt-2 tracking-tight">{latestRollup?.active_students ?? "—"}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
