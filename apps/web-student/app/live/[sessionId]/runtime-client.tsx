"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiPost } from "../../../lib/api";

type LiveEvent = {
  id: string;
  event_type: string;
  event_payload: Record<string, unknown>;
  created_at: string;
};

type LiveStatePayload = {
  session: {
    id: string;
    session_code: string;
    ended_at: string | null;
  };
  activeBlock: { id: string; sequence_no: number; title: string | null } | null;
  recentEvents: LiveEvent[];
};

export default function LiveSessionClient({ initialSessionId }: { initialSessionId: string }) {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [responseText, setResponseText] = useState("");
  const [status, setStatus] = useState("Loading live session...");
  const effectiveSessionId = useMemo(() => searchParams.get("sessionId") ?? initialSessionId, [searchParams, initialSessionId]);

  useEffect(() => {
    let mounted = true;
    async function loadState() {
      const state = await apiGet<LiveStatePayload>(`/api/live/sessions/${effectiveSessionId}/state`);
      if (!mounted) return;
      if (!state.ok) {
        setStatus(state.error);
        return;
      }
      setEvents(state.data.recentEvents ?? []);
      setStatus(
        state.data.session.ended_at
          ? "This live session has ended."
          : `Connected to code ${state.data.session.session_code}. Active block: ${state.data.activeBlock?.sequence_no ?? "-"}`
      );
    }

    void loadState();
    const timer = setInterval(() => void loadState(), 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [effectiveSessionId]);

  async function submitLiveResponse() {
    const state = await apiGet<LiveStatePayload>(`/api/live/sessions/${effectiveSessionId}/state`);
    if (!state.ok) {
      setStatus(`Unable to load session state: ${state.error}`);
      return;
    }
    if (!state.data.activeBlock?.id) {
      setStatus("No active lesson block found.");
      return;
    }
    const result = await apiPost("/api/live/responses", {
      liveSessionId: effectiveSessionId,
      lessonBlockId: state.data.activeBlock.id,
      responsePayload: { text: responseText },
      confidence: 4
    });
    if (!result.ok) {
      setStatus(`Failed to submit response: ${result.error}`);
      return;
    }
    setResponseText("");
    setStatus("Response submitted.");
  }

  return (
    <main>
      <section className="hero">
        <h1 className="title">Live Lesson</h1>
        <p className="subtitle">Session ID: {effectiveSessionId}</p>
      </section>
      {status ? <p className="status info">{status}</p> : null}

      <section className="formCard">
        <label className="fieldLabel" htmlFor="live-response">
          Your response
        </label>
        <textarea
          id="live-response"
          className="input"
          placeholder="Write your live answer..."
          value={responseText}
          onChange={(event) => setResponseText(event.target.value)}
        />
        <button className="primaryButton" onClick={submitLiveResponse}>
          Submit Response
        </button>
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Recent Teacher Events</h3>
        <ul className="list">
          {events.map((event) => (
            <li key={event.id}>
              {event.event_type} at {new Date(event.created_at).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
