import {
  Users,
  BookOpen,
  Radio,
  Award,
  School,
  Sparkles,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const weeklyData = [
  { day: "Mon", sessions: 12, completions: 8 },
  { day: "Tue", sessions: 19, completions: 14 },
  { day: "Wed", sessions: 15, completions: 11 },
  { day: "Thu", sessions: 22, completions: 18 },
  { day: "Fri", sessions: 28, completions: 24 },
];

const trendData = [
  { week: "W1", engagement: 65 },
  { week: "W2", engagement: 72 },
  { week: "W3", engagement: 68 },
  { week: "W4", engagement: 81 },
  { week: "W5", engagement: 88 },
  { week: "W6", engagement: 92 },
];

const recentSessions = [
  { id: 1, lesson: "AI Bias in Hiring", teacher: "Ms. Rivera", students: 28, status: "completed" },
  { id: 2, lesson: "Data Privacy Scenarios", teacher: "Mr. Chen", students: 32, status: "active" },
  { id: 3, lesson: "Autonomous Vehicles Ethics", teacher: "Dr. Okafor", students: 24, status: "scheduled" },
];

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Welcome back to The Ethics Lab
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Where GenZ shapes the future of ethical AI. Monitor your platform, track engagement, and empower students.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 rounded-full bg-accent/10 blur-xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Organizations"
          value={12}
          subtitle="3 new this month"
          icon={School}
          trend={{ value: "+25%", positive: true }}
        />
        <StatCard
          title="Active Students"
          value="1,248"
          subtitle="Across all schools"
          icon={Users}
          trend={{ value: "+8%", positive: true }}
        />
        <StatCard
          title="Live Sessions"
          value={86}
          subtitle="This week"
          icon={Radio}
          trend={{ value: "+12%", positive: true }}
        />
        <StatCard
          title="Certificates"
          value={342}
          subtitle="All time"
          icon={Award}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Weekly Activity</h3>
          <p className="text-xs text-muted-foreground mb-4">Sessions started vs completed</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Sessions" />
              <Bar dataKey="completions" fill="hsl(var(--primary) / 0.4)" radius={[6, 6, 0, 0]} name="Completions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Engagement Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">6-week engagement score</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                name="Engagement %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Recent Live Sessions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Latest activity across all classrooms</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Lesson</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Teacher</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Students</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-semibold text-foreground">{s.lesson}</td>
                  <td className="p-4 text-muted-foreground">{s.teacher}</td>
                  <td className="p-4 text-muted-foreground">{s.students}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        s.status === "completed"
                          ? "bg-success/10 text-success"
                          : s.status === "active"
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {s.status}
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
