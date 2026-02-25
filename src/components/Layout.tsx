import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Radio,
  ClipboardList,
  BarChart3,
  LogOut,
  Scale,
  Podcast,
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
  { to: "/classes", icon: Users, label: "My Classes" },
  { to: "/join", icon: Podcast, label: "Join Session" },
  { to: "/assignments", icon: ClipboardList, label: "Assignments" },
];

const adminNav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/classes", icon: Users, label: "Classes" },
  { to: "/curriculum", icon: BookOpen, label: "Curriculum" },
  { to: "/live", icon: Radio, label: "Live Sessions" },
  { to: "/assignments", icon: ClipboardList, label: "Assignments" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

export default function Layout() {
  const { user, role, signOut } = useAuth();

  const navItems = role === "student" ? studentNav : role === "teacher" ? teacherNav : adminNav;

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Scale className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-foreground tracking-tight leading-tight">
                The Ethics Lab
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium">
                {role === "student" ? "Student" : role === "teacher" ? "Teacher" : "Admin"} Portal
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
        <div className="p-3 border-t border-border">
          {user && (
            <p className="px-3 mb-2 text-xs text-muted-foreground truncate">{user.email}</p>
          )}
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
