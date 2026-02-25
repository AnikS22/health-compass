import { Download, Filter } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const completionData = [
  { month: "Sep", rate: 62 },
  { month: "Oct", rate: 71 },
  { month: "Nov", rate: 68 },
  { month: "Dec", rate: 75 },
  { month: "Jan", rate: 82 },
  { month: "Feb", rate: 89 },
];

const blockUsage = [
  { name: "MCQ", value: 35 },
  { name: "Scenario", value: 25 },
  { name: "Poll", value: 20 },
  { name: "Debate", value: 12 },
  { name: "Other", value: 8 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.7)",
  "hsl(var(--primary) / 0.45)",
  "hsl(var(--muted-foreground))",
  "hsl(var(--border))",
];

export default function Reports() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">Analytics and performance insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Completion Rate by Month</h3>
          <p className="text-xs text-muted-foreground mb-4">Percentage of students completing assigned lessons</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Block Type Usage</h3>
          <p className="text-xs text-muted-foreground mb-4">Most used interaction types</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={blockUsage}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {blockUsage.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {blockUsage.map((b, i) => (
              <span key={b.name} className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Avg Confidence</p>
          <p className="text-4xl font-extrabold text-foreground mt-2 tracking-tight">78%</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Teachers</p>
          <p className="text-4xl font-extrabold text-foreground mt-2 tracking-tight">42</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">D7 Retention</p>
          <p className="text-4xl font-extrabold text-foreground mt-2 tracking-tight">86%</p>
        </div>
      </div>
    </div>
  );
}
