"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSignedInAppUser, supabase } from "../../lib/supabase";

export default function StudentLiveJoinPage() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setStatus("Add Supabase public env vars to enable join.");
      return;
    }
    setStatus("Joining...");

    const { data: session, error: sessionError } = await supabase
      .from("live_sessions")
      .select("id, organization_id")
      .eq("session_code", sessionCode.trim().toUpperCase())
      .is("ended_at", null)
      .maybeSingle();

    if (sessionError || !session) {
      setStatus("Session code not found.");
      return;
    }

    const { appUser } = await getSignedInAppUser();
    const { error: insertError } = await supabase.from("live_session_participants").insert({
      live_session_id: session.id,
      organization_id: session.organization_id,
      user_id: appUser?.id ?? null,
      display_name: displayName.trim() || "Guest Student",
      join_kind: appUser ? "account" : "guest"
    });

    if (insertError) {
      setStatus(`Join failed: ${insertError.message}`);
      return;
    }

    setStatus("Joined successfully. Opening live lesson...");
    router.push(`/live/${session.id}`);
  }

  return (
    <main>
      <section className="hero">
        <h1 className="title">Join Live Session</h1>
        <p className="subtitle">Enter your class code to sync with the teacher in real time.</p>
      </section>

      <section className="formCard">
        <form onSubmit={handleJoin}>
          <label className="fieldLabel" htmlFor="session-code">
            Session Code
          </label>
          <input
            id="session-code"
            className="input"
            placeholder="e.g. DEMO42"
            value={sessionCode}
            onChange={(event) => setSessionCode(event.target.value)}
            required
          />

          <label className="fieldLabel" htmlFor="display-name">
            Display Name
          </label>
          <input
            id="display-name"
            className="input"
            placeholder="Your name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />

          <button className="primaryButton" type="submit">
            Join Session
          </button>
        </form>
      </section>

      {status ? <p className="status info">{status}</p> : null}
    </main>
  );
}
