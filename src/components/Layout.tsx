import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Radio,
  ClipboardList,
  BarChart3,
  LogOut,
  GraduationCap,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/classes", icon: Users, label: "Classes" },
  { to: "/curriculum", icon: BookOpen, label: "Curriculum" },
  { to: "/live", icon: Radio, label: "Live Sessions" },
  { to: "/assignments", icon: ClipboardList, label: "Assignments" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

export default function Layout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">EthicsLabs</h1>
            <p className="text-xs text-muted-foreground">Education Platform</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-active text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <NavLink
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign In / Out
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
