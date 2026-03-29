import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Users, Clock, Download, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type LiveResponse = {
  id: string;
  user_id: string;
  lesson_block_id: string;
  response_payload: Record<string, unknown>;
  submitted_at: string;
};

type Block = {
  id: string;
  sequence_no: number;
  block_type: string;
  title: string | null;
  body: string | null;
  config: Record<string, unknown>;
};

type Participant = {
  id: string;
  display_name: string;
  user_id: string | null;
  joined_at: string;
};

export default function PastSessionReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { appUserId } = useAuth();

  const [lessonTitle, setLessonTitle] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [responses, setResponses] = useState<LiveResponse[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    loadSessionData();
  }, [sessionId]);

  async function loadSessionData() {
    if (!sessionId) return;

    const [sessRes, respRes, partRes] = await Promise.all([
      supabase.from("live_sessions").select("id, session_code, started_at, ended_at, lesson_version_id").eq("id", sessionId).single(),
      supabase.from("live_responses").select("id, user_id, lesson_block_id, response_payload, submitted_at").eq("live_session_id", sessionId).order("submitted_at").limit(1000),
      supabase.from("live_session_participants").select("id, display_name, user_id, joined_at").eq("live_session_id", sessionId),
    ]);

    if (!sessRes.data) { setLoading(false); return; }
    setSessionCode(sessRes.data.session_code);
    setStartedAt(sessRes.data.started_at);
    setResponses((respRes.data ?? []) as unknown as LiveResponse[]);
    setParticipants((partRes.data ?? []) as Participant[]);

    const { data: blockData } = await supabase
      .from("lesson_blocks")
      .select("id, sequence_no, block_type, title, body, config")
      .eq("lesson_version_id", sessRes.data.lesson_version_id)
      .order("sequence_no");
    setBlocks((blockData ?? []).map(b => ({ ...b, config: (b.config ?? {}) as Record<string, unknown> })) as Block[]);

    const { data: lv } = await supabase.from("lesson_versions").select("lesson_id").eq("id", sessRes.data.lesson_version_id).single();
    if (lv) {
      const { data: lesson } = await supabase.from("lessons").select("title").eq("id", lv.lesson_id).single();
      if (lesson) setLessonTitle(lesson.title);
    }
    setLoading(false);
  }

  function getStudentName(userId: string): string {
    const p = participants.find(x => x.user_id === userId);
    return p?.display_name ?? "Student";
  }

  function getBlockResponses(blockId: string) {
    return responses.filter(r => r.lesson_block_id === blockId);
  }

  function exportSessionCSV() {
    const rows: string[] = ["Block,Block Type,Student,Response,Submitted At"];
    for (const block of blocks) {
      const blockResps = getBlockResponses(block.id);
      for (const r of blockResps) {
        const p = r.response_payload;
        const text = String(p.selected_option ?? p.text ?? p.answer ?? p.argument ?? p.selected_choice_id ?? JSON.stringify(p)).replace(/"/g, '""');
        rows.push(`"${block.title ?? `Step ${block.sequence_no}`}","${block.block_type}","${getStudentName(r.user_id)}","${text}","${r.submitted_at}"`);
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${sessionCode}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderResponsePreview(r: LiveResponse, blockType: string) {
    const p = r.response_payload;
    switch (blockType) {
      case "poll":
      case "multi_select":
        return String(p.selected_option ?? (Array.isArray(p.selected_options) ? (p.selected_options as string[]).join(", ") : "") ?? "");
      case "mcq":
      case "micro_challenge":
        return String(p.selected_option_id ?? p.selected_option ?? p.answer ?? "");
      case "scenario":
        return String(p.selected_choice_id ?? "");
      case "drag_drop": {
        const placements = (p.placements ?? {}) as Record<string, string>;
        return Object.entries(placements).map(([k, v]) => `${k}→${v}`).join(", ");
      }
      case "matching":
        return String(p.correct_count ?? "") + "/" + String(p.total_count ?? "") + " correct";
      case "dilemma_tree":
        return Array.isArray(p.path) ? (p.path as string[]).join(" → ") : "";
      default:
        return String(p.text ?? p.argument ?? p.counter_argument ?? p.feedback ?? p.post ?? JSON.stringify(p)).slice(0, 120);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading session data…</div></div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/live")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-foreground">{lessonTitle || "Past Session"}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="font-mono font-bold bg-secondary px-2 py-0.5 rounded text-foreground">{sessionCode}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(startedAt).toLocaleString()}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {participants.length} students</span>
          </div>
        </div>
        <button
          onClick={exportSessionCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Participants ({participants.length})</p>
        <div className="flex flex-wrap gap-2">
          {participants.map(p => (
            <span key={p.id} className="px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-medium">{p.display_name}</span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Responses by Block ({responses.length} total)</p>
        {blocks.map(block => {
          const blockResps = getBlockResponses(block.id);
          const isExpanded = expandedBlock === block.id;
          return (
            <div key={block.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-6">{block.sequence_no}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{block.title ?? `Step ${block.sequence_no}`}</p>
                    <p className="text-xs text-muted-foreground capitalize">{block.block_type.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{blockResps.length} responses</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-border px-4 py-3 space-y-2 max-h-96 overflow-y-auto">
                  {blockResps.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No responses for this block.</p>
                  ) : (
                    blockResps.map(r => (
                      <div key={r.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                        <span className="text-xs font-bold text-primary min-w-[80px] truncate">{getStudentName(r.user_id)}</span>
                        <p className="text-sm text-foreground flex-1">{renderResponsePreview(r, block.block_type)}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(r.submitted_at).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
