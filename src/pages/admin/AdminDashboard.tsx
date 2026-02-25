import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { Building2, Users, GraduationCap, BookOpen, Radio, ShieldAlert } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    orgs: 0,
    teachers: 0,
    students: 0,
    lessons: 0,
    activeSessions: 0,
    openFlags: 0,
  });

  useEffect(() => {
    async function load() {
      const [orgs, teachers, students, lessons, sessions, flags] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role_key", "teacher"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role_key", "student"),
        supabase.from("lessons").select("id", { count: "exact", head: true }),
        supabase.from("live_sessions").select("id", { count: "exact", head: true }).is("ended_at", null),
        supabase.from("moderation_flags").select("id", { count: "exact", head: true }).eq("resolution_status", "open"),
      ]);
      setStats({
        orgs: orgs.count ?? 0,
        teachers: teachers.count ?? 0,
        students: students.count ?? 0,
        lessons: lessons.count ?? 0,
        activeSessions: sessions.count ?? 0,
        openFlags: flags.count ?? 0,
      });
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform-wide overview</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Schools" value={stats.orgs} icon={Building2} />
        <StatCard title="Teachers" value={stats.teachers} icon={GraduationCap} />
        <StatCard title="Students" value={stats.students} icon={Users} />
        <StatCard title="Lessons" value={stats.lessons} icon={BookOpen} />
        <StatCard title="Active Sessions" value={stats.activeSessions} icon={Radio} />
        <StatCard title="Open Flags" value={stats.openFlags} icon={ShieldAlert} />
      </div>
    </div>
  );
}
