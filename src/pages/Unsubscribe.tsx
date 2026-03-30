import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === true) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setState("success");
    } catch {
      setState("error");
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {state === "loading" && <p className="text-muted-foreground">Loading…</p>}
        {state === "valid" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Unsubscribe</h1>
            <p className="text-sm text-muted-foreground">Are you sure you want to unsubscribe from emails?</p>
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="w-full py-3 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {processing ? "Processing…" : "Confirm Unsubscribe"}
            </button>
          </>
        )}
        {state === "already" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Already Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">This email address has already been unsubscribed.</p>
          </>
        )}
        {state === "success" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
            <p className="text-sm text-muted-foreground">You've been successfully unsubscribed. You won't receive any more emails from us.</p>
          </>
        )}
        {state === "invalid" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
            <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or expired.</p>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </>
        )}
      </div>
    </div>
  );
}
