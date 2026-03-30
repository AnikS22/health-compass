import { Clock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Waitlist() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center shadow-lg">
          <Clock className="w-10 h-10 text-primary" />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            You're on the Waitlist!
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-sm mx-auto">
            Thanks for signing up for The Ethics Lab. Your account is being reviewed by our team. 
            We'll notify you once you've been approved.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📧</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Check your inbox</p>
              <p className="text-xs text-muted-foreground">
                We'll email <span className="font-medium text-foreground">{user?.email}</span> when your account is approved.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⏱️</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Review in progress</p>
              <p className="text-xs text-muted-foreground">
                Our team typically reviews applications within 24-48 hours.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>

        <p className="text-xs text-muted-foreground">
          Where GenZ shapes the future of ethical AI
        </p>
      </div>
    </div>
  );
}
