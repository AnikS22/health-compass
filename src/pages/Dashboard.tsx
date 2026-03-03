import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Radio, Award, School, Sparkles, BookOpen, ClipboardList, Podcast } from "lucide-react";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "./admin/AdminDashboard";
import SchoolAdminDashboard from "./school-admin/SchoolAdminDashboard";

type RecentSession = {
  id: string;
  session_code: string;
  started_at: string;
  ended_at: string | null;
};

type EnrolledClass = {
  class_id: string;
  class_name: string;
  grade_band: string;
};

export default function Dashboard() {
  const { role, appUserId } = useAuth();
  const navigate = useNavigate();

  if (role === "student") return <StudentDashboard appUserId={appUserId} navigate={navigate} />;
  if (role === "ethics_admin") return <AdminDashboard />;
  if (role === "school_admin") return <SchoolAdminDashboard />;
  return <TeacherDashboard />;
}

function TeacherDashboard() {
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
        supabase.from("live_sessions").select("id, session_code, started_at, ended_at").order("started_at", { ascending: false }).limit(5),
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
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Teacher Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome back to The Ethics Lab</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">Manage your classes, curriculum, and live sessions.</p>
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

function StudentDashboard({ appUserId, navigate }: { appUserId: string | null; navigate: ReturnType<typeof useNavigate> }) {
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUserId) return;
    async function load() {
      // Get enrolled classes
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("user_id", appUserId!)
        .eq("status", "active");

      const classIds = (enrollments ?? []).map((e) => e.class_id);

      if (classIds.length > 0) {
        const { data: classes } = await supabase
          .from("classes")
          .select("id, name, grade_band")
          .in("id", classIds);

        setEnrolledClasses(
          (classes ?? []).map((c) => ({ class_id: c.id, class_name: c.name, grade_band: c.grade_band }))
        );

        // Count assignments for enrolled classes
        const { count } = await supabase
          .from("assignments")
          .select("id", { count: "exact", head: true })
          .in("class_id", classIds);
        setAssignmentCount(count ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [appUserId]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Student Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome to The Ethics Lab</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">Your classes, assignments, and self-paced lessons — all in one place.</p>
        </div>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Classes" value={loading ? "—" : enrolledClasses.length} subtitle="Enrolled" icon={BookOpen} />
        <StatCard title="Assignments" value={loading ? "—" : assignmentCount} subtitle="Pending" icon={ClipboardList} />
        <div
          onClick={() => navigate("/join")}
          className="cursor-pointer bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Podcast className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Join Live Session</p>
            <p className="text-xs text-muted-foreground">Enter a session code</p>
          </div>
        </div>
        <div
          onClick={() => navigate("/explore")}
          className="cursor-pointer bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Explore Curriculum</p>
            <p className="text-xs text-muted-foreground">Self-paced learning</p>
          </div>
        </div>
      </div>

      {/* Enrolled Classes */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">My Classes</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
        ) : enrolledClasses.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <Users className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-foreground font-semibold">No classes yet</p>
            <p className="text-sm text-muted-foreground">Join a class with a code, or explore self-paced lessons.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => navigate("/classes")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">
                Join a Class
              </button>
              <button onClick={() => navigate("/explore")} className="px-4 py-2 bg-secondary text-foreground rounded-xl text-sm font-bold hover:bg-secondary/80">
                Explore Curriculum
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {enrolledClasses.map((c) => (
              <div key={c.class_id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="font-semibold text-foreground">{c.class_name}</p>
                  <p className="text-xs text-muted-foreground">Grade {c.grade_band}</p>
                </div>
                <span className="text-xs bg-success/10 text-success px-3 py-1 rounded-full font-bold">Enrolled</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
