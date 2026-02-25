import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Radio, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function JoinSession() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, appUserId } = useAuth();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setStatus("");

    // Find session by code
    const { data: session, error } = await supabase
      .from("live_sessions")
      .select("id, organization_id")
      .eq("session_code", code.trim().toUpperCase())
      .is("ended_at", null)
      .maybeSingle();

    if (error || !session) {
      setStatus("Session not found. Check the code and try again.");
      setLoading(false);
      return;
    }

    // Register as participant
    if (appUserId) {
      const displayName = user?.user_metadata?.full_name || user?.email || "Student";
      await supabase.from("live_session_participants").insert({
        live_session_id: session.id,
        user_id: appUserId,
        organization_id: session.organization_id,
        display_name: displayName,
        join_kind: "account",
      });
    }

    navigate(`/live/student?session=${session.id}`);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-8 text-center">
        <div>
          <div className="w-16 h-16 rounded-3xl bg-primary mx-auto flex items-center justify-center mb-5 shadow-lg">
            <Scale className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Join a Session</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Enter the session code your teacher shared.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="relative">
            <Radio className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ETH-XXXX"
              maxLength={10}
              className="w-full pl-12 pr-4 py-4 bg-card border border-input rounded-2xl text-lg text-center font-mono font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? "Joining…" : "Join Session"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {status && (
          <p className="text-sm font-medium text-destructive">{status}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Ask your teacher for the session code
        </p>
      </div>
    </div>
  );
}
