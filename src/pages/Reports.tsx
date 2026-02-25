import { BarChart3, Download, Filter } from "lucide-react";
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
  "hsl(43 96% 56%)",
  "hsl(43 96% 70%)",
  "hsl(40 30% 75%)",
  "hsl(220 10% 60%)",
  "hsl(40 15% 88%)",
];

export default function Reports() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Analytics and performance insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Rate Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Completion Rate by Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40 15% 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 10% 45%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 45%)" unit="%" />
              <Tooltip />
              <Bar dataKey="rate" fill="hsl(43 96% 56%)" radius={[4, 4, 0, 0]} name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Block Usage Pie */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Block Type Usage</h3>
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
              <span key={b.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">Avg Confidence Score</p>
          <p className="text-3xl font-bold text-foreground mt-1">78%</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">Active Teachers</p>
          <p className="text-3xl font-bold text-foreground mt-1">42</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-sm text-muted-foreground">D7 Retention</p>
          <p className="text-3xl font-bold text-foreground mt-1">86%</p>
        </div>
      </div>
    </div>
  );
}
