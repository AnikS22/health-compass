import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, ArrowRight, Podcast } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function JoinSession() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setStatus("");

    const displayName = user?.user_metadata?.full_name || user?.email || "Student";

    const { data, error } = await supabase.rpc("join_live_session_by_code", {
      p_code: code.trim().toUpperCase(),
      p_display_name: displayName,
    });

    if (error) {
      setStatus("Failed to join: " + error.message);
      setLoading(false);
      return;
    }

    const result = data as unknown as { ok: boolean; error?: string; session_id?: string };

    if (!result.ok) {
      setStatus(result.error || "Session not found.");
      setLoading(false);
      return;
    }

    navigate(`/live/student?session=${result.session_id}`);
    setLoading(false);
  }

  return (
    <div className="p-8 max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Join Live Session</h1>
        <p className="text-muted-foreground mt-1 text-sm">Enter the session code your teacher shared to join the live lesson.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Podcast className="w-8 h-8 text-primary" />
          </div>
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
          <p className={`text-sm font-medium text-center ${status.includes("not found") || status.includes("Failed") || status.includes("error") ? "text-destructive" : "text-success"}`}>
            {status}
          </p>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Ask your teacher for the session code
        </p>
      </div>
    </div>
  );
}
