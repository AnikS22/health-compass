import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BookOpen, Radio, Building2, Sparkles, GraduationCap, UserCheck } from "lucide-react";
import StatCard from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function SchoolAdminDashboard() {
  const { appUserId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [teacherCount, setTeacherCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (!appUserId) return;
    async function load() {
      // Get org info
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name")
        .limit(1)
        .maybeSingle();

      if (orgData) {
        setOrgName(orgData.name);

        // Get users in this org
        const { data: users } = await supabase
          .from("users")
          .select("id")
          .eq("organization_id", orgData.id);

        const userIds = (users ?? []).map(u => u.id);

        if (userIds.length > 0) {
          // Get roles for these users
          const { data: roles } = await supabase
            .from("user_roles")
            .select("user_id, role_key")
            .in("user_id", userIds);

          const teacherIds = new Set((roles ?? []).filter(r => r.role_key === "teacher").map(r => r.user_id));
          const studentIds = new Set((roles ?? []).filter(r => r.role_key === "student").map(r => r.user_id));
          setTeacherCount(teacherIds.size);
          setStudentCount(studentIds.size);
        }

        // Count classes
        const { count: clsCount } = await supabase
          .from("classes")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgData.id);
        setClassCount(clsCount ?? 0);

        // Count sessions
        const { count: sessCount } = await supabase
          .from("live_sessions")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgData.id);
        setSessionCount(sessCount ?? 0);
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
            <span className="text-xs font-bold uppercase tracking-widest text-primary">School Admin</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {orgName || "School Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Manage teachers, students, classes, and school settings.
          </p>
        </div>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => navigate("/school/teachers")}>
          <StatCard title="Teachers" value={loading ? "—" : teacherCount} subtitle="In your school" icon={GraduationCap} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/school/students")}>
          <StatCard title="Students" value={loading ? "—" : studentCount} subtitle="Enrolled" icon={Users} />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/school/classes")}>
          <StatCard title="Classes" value={loading ? "—" : classCount} subtitle="Active" icon={BookOpen} />
        </div>
        <StatCard title="Live Sessions" value={loading ? "—" : sessionCount} subtitle="All time" icon={Radio} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => navigate("/school/teachers")}
          className="cursor-pointer bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Manage Teachers</p>
            <p className="text-xs text-muted-foreground">Add, view, and manage teacher accounts</p>
          </div>
        </div>
        <div
          onClick={() => navigate("/school/students")}
          className="cursor-pointer bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">View Students</p>
            <p className="text-xs text-muted-foreground">See all students in your school</p>
          </div>
        </div>
        <div
          onClick={() => navigate("/school/classes")}
          className="cursor-pointer bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Manage Classes</p>
            <p className="text-xs text-muted-foreground">Create and oversee all classes</p>
          </div>
        </div>
        <div
          onClick={() => navigate("/school/profile")}
          className="cursor-pointer bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">School Profile</p>
            <p className="text-xs text-muted-foreground">Edit school name, domain, and settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
