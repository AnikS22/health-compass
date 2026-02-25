import {
  Users,
  BookOpen,
  Radio,
  ClipboardList,
  Award,
  TrendingUp,
  GraduationCap,
  School,
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here's your platform overview.
        </p>
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
          value={1248}
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
          title="Certificates Issued"
          value={342}
          subtitle="All time"
          icon={Award}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40 15% 88%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220 10% 45%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 45%)" />
              <Tooltip />
              <Bar dataKey="sessions" fill="hsl(43 96% 56%)" radius={[4, 4, 0, 0]} name="Sessions" />
              <Bar dataKey="completions" fill="hsl(43 96% 76%)" radius={[4, 4, 0, 0]} name="Completions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40 15% 88%)" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(220 10% 45%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 45%)" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="hsl(43 96% 56%)"
                strokeWidth={2.5}
                dot={{ fill: "hsl(43 96% 56%)", r: 4 }}
                name="Engagement %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Live Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-muted-foreground font-medium">Lesson</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Teacher</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Students</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium text-foreground">{s.lesson}</td>
                  <td className="p-4 text-muted-foreground">{s.teacher}</td>
                  <td className="p-4 text-muted-foreground">{s.students}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.status === "completed"
                          ? "bg-success/10 text-success"
                          : s.status === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
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
