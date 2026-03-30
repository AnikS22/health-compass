import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, waitlistStatus } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (waitlistStatus === "pending") {
    return <Navigate to="/waitlist" replace />;
  }

  return <>{children}</>;
}
