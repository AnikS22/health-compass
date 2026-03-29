import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Radio,
  ClipboardList,
  BarChart3,
  LogOut,
  Podcast,
  Building2,
  GraduationCap,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const teacherNav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/classes", icon: Users, label: "Classes" },
  { to: "/curriculum", icon: BookOpen, label: "Curriculum" },
  { to: "/live", icon: Radio, label: "Live Sessions" },
  { to: "/assignments", icon: ClipboardList, label: "Assignments" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

const studentNav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/explore", icon: BookOpen, label: "Explore Curriculum" },
  { to: "/classes", icon: Users, label: "My Classes" },
  { to: "/join", icon: Podcast, label: "Join Session" },
  { to: "/assignments", icon: ClipboardList, label: "Assignments" },
];

const adminNav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/schools", icon: Building2, label: "Schools" },
  { to: "/admin/teachers", icon: GraduationCap, label: "Teachers" },
  { to: "/admin/curriculum", icon: BookOpen, label: "Curriculum" },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/classes", icon: Users, label: "Classes" },
  { to: "/live", icon: Radio, label: "Live Sessions" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

const schoolAdminNav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/school/teachers", icon: GraduationCap, label: "Teachers" },
  { to: "/school/students", icon: Users, label: "Students" },
  { to: "/school/classes", icon: BookOpen, label: "Classes" },
  { to: "/curriculum", icon: BookOpen, label: "Curriculum" },
  { to: "/school/profile", icon: Building2, label: "School Profile" },
];

const curriculumAdminNav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/curriculum", icon: BookOpen, label: "Curriculum" },
];

export default function Layout() {
  const { user, role, signOut } = useAuth();

  const navItems = role === "student" ? studentNav : role === "ethics_admin" ? adminNav : role === "school_admin" ? schoolAdminNav : role === "curriculum_admin" ? curriculumAdminNav : role === "teacher" ? teacherNav : teacherNav;

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 p-1 flex items-center justify-center shadow-sm">
              <img src="/ethicslabs-logo.png" alt="EthicsLabs logo" className="w-full h-full rounded-lg object-cover" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-foreground tracking-tight leading-tight">
                The Ethics Lab
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium">
                {role === "student" ? "Student" : role === "teacher" ? "Teacher" : role === "ethics_admin" ? "Admin" : role === "school_admin" ? "School Admin" : role === "curriculum_admin" ? "Curriculum" : "Portal"} Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-foreground font-semibold border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-border space-y-0.5">
          {user && (
            <p className="px-3 mb-2 text-xs text-muted-foreground truncate">{user.email}</p>
          )}
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full ${
                isActive ? "bg-primary/10 text-foreground font-semibold border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`
            }
          >
            <Settings className="w-[18px] h-[18px]" />
            Account Settings
          </NavLink>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
