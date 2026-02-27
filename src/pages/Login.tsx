import { Scale, Mail, Lock, User, GraduationCap, BookOpen, School, Play } from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [studentType, setStudentType] = useState<"school" | "independent" | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(error.message);
        setLoading(false);
        return;
      }
      navigate("/");
    } else {
      // For students choosing independent, pass is_independent metadata
      const isIndependent = role === "student" && studentType === "independent";

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || "User",
            role,
            is_independent: isIndependent,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        setStatus(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        // If independent, update the flag after trigger fires
        if (isIndependent && data.user) {
          setTimeout(async () => {
            const { data: appUser } = await supabase
              .from("users").select("id").eq("auth_user_id", data.user!.id).single();
            if (appUser) {
              await supabase.from("users").update({ is_independent: true } as any).eq("id", appUser.id);
            }
          }, 1000);
        }
        navigate("/");
      } else {
        setStatus("Check your email to confirm your account.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary mx-auto flex items-center justify-center mb-5 shadow-lg">
            <Scale className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            The Ethics Lab
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className="flex rounded-2xl border border-border overflow-hidden bg-card p-1 gap-1">
          <button type="button" onClick={() => { setMode("signin"); setStatus(""); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === "signin" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            Sign In
          </button>
          <button type="button" onClick={() => { setMode("signup"); setStatus(""); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === "signup" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                    className="w-full pl-10 pr-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">I am a…</label>
                <div className="flex rounded-xl border border-border overflow-hidden bg-card p-1 gap-1">
                  <button type="button" onClick={() => { setRole("teacher"); setStudentType(null); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === "teacher" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <GraduationCap className="w-4 h-4" /> Teacher
                  </button>
                  <button type="button" onClick={() => setRole("student")}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === "student" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <User className="w-4 h-4" /> Student
                  </button>
                </div>
              </div>

              {/* Student type selection */}
              {role === "student" && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">How are you learning?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setStudentType("school")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${studentType === "school" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}>
                      <School className={`w-6 h-6 ${studentType === "school" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-bold ${studentType === "school" ? "text-foreground" : "text-muted-foreground"}`}>With a School</span>
                      <span className="text-[10px] text-muted-foreground text-center">Your teacher will give you a class code</span>
                    </button>
                    <button type="button" onClick={() => setStudentType("independent")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${studentType === "independent" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}>
                      <BookOpen className={`w-6 h-6 ${studentType === "independent" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-bold ${studentType === "independent" ? "text-foreground" : "text-muted-foreground"}`}>Independent</span>
                      <span className="text-[10px] text-muted-foreground text-center">Learn at your own pace</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@school.edu" required
                className="w-full pl-10 pr-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all" />
            </div>
          </div>
          <button type="submit" disabled={loading || (mode === "signup" && role === "student" && !studentType)}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("ethicslab_selfpaced_welcome");
            navigate("/explore");
          }}
          className="w-full py-3 bg-secondary text-foreground rounded-xl text-sm font-bold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 border border-border"
        >
          <Play className="w-4 h-4" />
          Try Demo — Explore as Guest
        </button>

        {status && (
          <p className={`text-center text-sm font-medium ${status.includes("Check your email") ? "text-green-600" : "text-destructive"}`}>
            {status}
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Where GenZ shapes the future of ethical AI
        </p>
      </div>
    </div>
  );
}
