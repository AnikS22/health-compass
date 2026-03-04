import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen, ChevronRight, Plus, Trash2, Save, X, Play,
  Layers, FileText, Video, HelpCircle, MessageSquare,
  ChevronDown, ChevronUp, Edit2, Eye, GripVertical, Loader2, AlertTriangle
} from "lucide-react";

type Pkg = { id: string; package_key: string; title: string };
type Course = { id: string; title: string; grade_band: string; curriculum_package_id: string | null };
type Unit = { id: string; title: string; course_id: string; sequence_no: number };
type Lesson = {
  id: string; title: string; grade_band: string | null; difficulty: string | null;
  estimated_minutes: number | null; unit_id: string | null;
  versions: { id: string; version_label: string; publish_status: string }[];
};
type Block = {
  id: string; title: string | null; block_type: string; sequence_no: number;
  body: string | null; config: any; lesson_version_id: string;
  hints: any; is_gate: boolean; mastery_rules: any;
};

const BLOCK_TYPES = [
  "video", "poll", "mcq", "multi_select", "short_answer", "scenario",
  "dilemma_tree", "drag_drop", "matching", "debate", "group_board",
  "collaborative_board", "drawing", "red_team", "exit_ticket",
  "concept_reveal", "micro_challenge", "reasoning_response", "peer_compare",
  "peer_review", "group_challenge"
] as const;

const GRADE_BANDS = ["K-2", "3-5", "6-8", "9-10", "11-12"];

function blockIcon(type: string) {
  if (type === "video") return <Video className="w-3.5 h-3.5" />;
  if (type === "mcq" || type === "multi_select" || type === "poll") return <HelpCircle className="w-3.5 h-3.5" />;
  if (type === "short_answer" || type === "reasoning_response") return <MessageSquare className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function YouTubeEmbed({ url }: { url: string }) {
  const videoId = url.match(/(?:youtu\.be\/|v=|\/embed\/)([^&?\s]+)/)?.[1];
  if (!videoId) return <p className="text-xs text-muted-foreground">Invalid YouTube URL</p>;
  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-secondary mt-2">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
}

/* ── Block Config Editor: renders type-specific fields ── */
function BlockConfigEditor({ blockType, config, onChange }: { blockType: string; config: any; onChange: (c: any) => void }) {
  if (blockType === "video") {
    const checkpoints = Array.isArray(config.checkpoints) ? config.checkpoints : [];
    const CHECKPOINT_BLOCK_TYPES = BLOCK_TYPES.filter(t => t !== "video");
    return (
      <div className="space-y-3">
        <label className="text-xs font-semibold text-foreground">Video URL</label>
        <input value={config.video_url || config.youtube_url || ""} onChange={e => {
          const url = e.target.value;
          // Detect YouTube vs direct
          const isYT = /youtu\.?be/.test(url);
          if (isYT) {
            onChange({ ...config, youtube_url: url, video_url: undefined });
          } else {
            onChange({ ...config, video_url: url, youtube_url: undefined });
          }
        }}
          placeholder="YouTube or direct video URL (mp4/webm)"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        {config.youtube_url && <YouTubeEmbed url={config.youtube_url} />}

        {/* Checkpoints section */}
        <div className="border-t border-border pt-3 mt-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">📍 Interactive Checkpoints ({checkpoints.length})</label>
            <button type="button" onClick={() => {
              const newCp = {
                id: `cp-${Date.now()}`,
                timestamp_seconds: 0,
                block_type: "mcq",
                title: "",
                body: "",
                config: { options: ["Option A", "Option B"], correct_answer: "Option A" },
              };
              onChange({ ...config, checkpoints: [...checkpoints, newCp] });
            }} className="text-xs text-primary hover:underline font-medium">+ Add Checkpoint</button>
          </div>
          {checkpoints.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1 italic">No checkpoints — video will play without interruptions. Add checkpoints to insert interactive activities at specific timestamps.</p>
          )}

          {checkpoints.map((cp: any, cpIdx: number) => {
            const updateCp = (patch: any) => {
              const updated = [...checkpoints];
              updated[cpIdx] = { ...cp, ...patch };
              onChange({ ...config, checkpoints: updated });
            };
            const handleCpDragStart = (e: React.DragEvent) => {
              e.stopPropagation();
              e.dataTransfer.setData("checkpoint-idx", String(cpIdx));
            };
            const handleCpDragOver = (e: React.DragEvent) => {
              e.preventDefault();
              e.stopPropagation();
            };
            const handleCpDrop = (e: React.DragEvent) => {
              e.preventDefault();
              e.stopPropagation();
              const fromIdx = parseInt(e.dataTransfer.getData("checkpoint-idx"));
              if (isNaN(fromIdx) || fromIdx === cpIdx) return;
              const reordered = [...checkpoints];
              const [moved] = reordered.splice(fromIdx, 1);
              reordered.splice(cpIdx, 0, moved);
              onChange({ ...config, checkpoints: reordered });
            };
            return (
              <div key={cp.id || cpIdx}
                draggable
                onDragStart={handleCpDragStart}
                onDragOver={handleCpDragOver}
                onDrop={handleCpDrop}
                className="border-2 border-primary/20 rounded-xl p-4 space-y-3 bg-card mt-2 cursor-grab active:cursor-grabbing">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{cpIdx + 1}</span>
                    <span className="text-sm font-bold text-foreground">Checkpoint</span>
                  </div>
                  <button type="button" onClick={() => {
                    const updated = checkpoints.filter((_: any, i: number) => i !== cpIdx);
                    onChange({ ...config, checkpoints: updated });
                  }} className="text-xs text-destructive hover:underline">Remove</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Timestamp (seconds)</label>
                    <input type="number" value={cp.timestamp_seconds || 0} onChange={e => updateCp({ timestamp_seconds: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      = {String(Math.floor((cp.timestamp_seconds || 0) / 60)).padStart(2, "0")}:{String(Math.floor((cp.timestamp_seconds || 0) % 60)).padStart(2, "0")}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Block Type</label>
                    <select value={cp.block_type || "mcq"} onChange={e => updateCp({ block_type: e.target.value, config: {} })}
                      className="w-full px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground">
                      {CHECKPOINT_BLOCK_TYPES.map(t => (
                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-medium">Checkpoint Title (optional)</label>
                  <input value={cp.title || ""} onChange={e => updateCp({ title: e.target.value })}
                    placeholder="e.g. Quick Check"
                    className="w-full px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Body Text (optional)</label>
                  <textarea value={cp.body || ""} rows={2} onChange={e => updateCp({ body: e.target.value })}
                    placeholder="Instructions or context for this checkpoint..."
                    className="w-full px-2 py-1.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
                </div>

                <div className="border border-border rounded-lg p-3 bg-background/50">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    {(cp.block_type || "mcq").replace(/_/g, " ")} configuration
                  </p>
                  <BlockConfigEditor
                    blockType={cp.block_type || "mcq"}
                    config={cp.config || {}}
                    onChange={(newConfig: any) => updateCp({ config: newConfig })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  if (blockType === "mcq" || blockType === "multi_select") {
    const options = Array.isArray(config.options) ? config.options : [];
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Options (one per line)</label>
        <textarea value={options.join("\n")} rows={4}
          onChange={e => onChange({ ...config, options: e.target.value.split("\n").filter((o: string) => o.trim()) })}
          placeholder={"Option A\nOption B\nOption C"}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none font-mono" />
        <input value={config.correct_answer || ""} onChange={e => onChange({ ...config, correct_answer: e.target.value })}
          placeholder="Correct answer (must match an option exactly)"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>
    );
  }
  if (blockType === "concept_reveal") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Key Idea</label>
        <input value={config.key_idea || ""} onChange={e => onChange({ ...config, key_idea: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Detail (optional)</label>
        <textarea value={config.detail || ""} onChange={e => onChange({ ...config, detail: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Visual URL (optional)</label>
        <input value={config.visual_url || ""} onChange={e => onChange({ ...config, visual_url: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>
    );
  }
  if (blockType === "micro_challenge") {
    const options = Array.isArray(config.options) ? config.options : [];
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Question</label>
        <input value={config.question || ""} onChange={e => onChange({ ...config, question: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Options (JSON array of {`{id, text}`})</label>
        <textarea value={JSON.stringify(options, null, 2)} rows={4}
          onChange={e => { try { onChange({ ...config, options: JSON.parse(e.target.value) }); } catch {} }}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <input value={config.correct_option_id || ""} onChange={e => onChange({ ...config, correct_option_id: e.target.value })}
          placeholder="Correct option ID"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Explanation</label>
        <textarea value={config.explanation || ""} onChange={e => onChange({ ...config, explanation: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
      </div>
    );
  }
  if (blockType === "reasoning_response") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Prompt</label>
        <textarea value={config.prompt || ""} onChange={e => onChange({ ...config, prompt: e.target.value })} rows={3}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <input type="number" value={config.min_words || ""} onChange={e => onChange({ ...config, min_words: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="Min words (optional)"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Exemplar Answer (optional)</label>
        <textarea value={config.exemplar || ""} onChange={e => onChange({ ...config, exemplar: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
      </div>
    );
  }
  if (blockType === "peer_compare") {
    const options = Array.isArray(config.options) ? config.options : [];
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Prompt</label>
        <textarea value={config.prompt || ""} onChange={e => onChange({ ...config, prompt: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Options (JSON, optional)</label>
        <textarea value={JSON.stringify(options, null, 2)} rows={3}
          onChange={e => { try { onChange({ ...config, options: JSON.parse(e.target.value) }); } catch {} }}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={!!config.show_distribution} onChange={e => onChange({ ...config, show_distribution: e.target.checked })} />
          Show distribution to students
        </label>
      </div>
    );
  }
  if (blockType === "poll") {
    const options = Array.isArray(config.options) ? config.options : [];
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Poll Question (use Body field above)</label>
        <label className="text-xs font-semibold text-foreground">Options (one per line)</label>
        <textarea value={options.join("\n")} rows={4}
          onChange={e => onChange({ ...config, options: e.target.value.split("\n").filter((o: string) => o.trim()) })}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none font-mono" />
      </div>
    );
  }
  if (blockType === "short_answer") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Prompt</label>
        <textarea value={config.prompt || ""} onChange={e => onChange({ ...config, prompt: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <input type="number" value={config.min_words || ""} onChange={e => onChange({ ...config, min_words: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="Min words (optional)"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>
    );
  }
  if (blockType === "scenario") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Scenario Description</label>
        <textarea value={config.description || ""} onChange={e => onChange({ ...config, description: e.target.value })} rows={3}
          placeholder="Describe the ethical scenario..."
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Choices (JSON array of {`{id, text, outcome}`})</label>
        <textarea value={JSON.stringify(config.choices || [], null, 2)} rows={5}
          onChange={e => { try { onChange({ ...config, choices: JSON.parse(e.target.value) }); } catch {} }}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Debrief / Reflection Prompt (optional)</label>
        <textarea value={config.debrief || ""} onChange={e => onChange({ ...config, debrief: e.target.value })} rows={2}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
      </div>
    );
  }
  if (blockType === "dilemma_tree") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Root Dilemma Question</label>
        <textarea value={config.root_question || ""} onChange={e => onChange({ ...config, root_question: e.target.value })} rows={2}
          placeholder="Present the ethical dilemma..."
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Decision Tree (JSON)</label>
        <textarea value={JSON.stringify(config.tree || [], null, 2)} rows={6}
          onChange={e => { try { onChange({ ...config, tree: JSON.parse(e.target.value) }); } catch {} }}
          placeholder={'[\n  {"id":"a","text":"Choice A","next":"b"},\n  {"id":"b","text":"Follow-up","next":null}\n]'}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>
    );
  }
  if (blockType === "drag_drop") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Instructions</label>
        <textarea value={config.instructions || ""} onChange={e => onChange({ ...config, instructions: e.target.value })} rows={2}
          placeholder="Drag items to the correct category..."
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Categories (comma-separated)</label>
        <input value={(config.categories || []).join(", ")} onChange={e => onChange({ ...config, categories: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
          placeholder="Category A, Category B"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Items (JSON array of {`{id, text, correct_category}`})</label>
        <textarea value={JSON.stringify(config.items || [], null, 2)} rows={5}
          onChange={e => { try { onChange({ ...config, items: JSON.parse(e.target.value) }); } catch {} }}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>
    );
  }
  if (blockType === "matching") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Instructions</label>
        <input value={config.instructions || ""} onChange={e => onChange({ ...config, instructions: e.target.value })}
          placeholder="Match each item on the left with the correct item on the right"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Pairs (JSON array of {`{left, right}`})</label>
        <textarea value={JSON.stringify(config.pairs || [], null, 2)} rows={5}
          onChange={e => { try { onChange({ ...config, pairs: JSON.parse(e.target.value) }); } catch {} }}
          placeholder={'[\n  {"left": "Term 1", "right": "Definition 1"},\n  {"left": "Term 2", "right": "Definition 2"}\n]'}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>
    );
  }
  if (blockType === "debate") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Debate Topic / Motion</label>
        <textarea value={config.topic || ""} onChange={e => onChange({ ...config, topic: e.target.value })} rows={2}
          placeholder="e.g. 'AI should be regulated by governments'"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Sides (comma-separated)</label>
        <input value={(config.sides || []).join(", ")} onChange={e => onChange({ ...config, sides: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
          placeholder="For, Against"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Time Limit (seconds, optional)</label>
        <input type="number" value={config.time_limit_seconds || ""} onChange={e => onChange({ ...config, time_limit_seconds: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="120"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>
    );
  }
  if (blockType === "group_board" || blockType === "collaborative_board") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Board Prompt</label>
        <textarea value={config.prompt || ""} onChange={e => onChange({ ...config, prompt: e.target.value })} rows={2}
          placeholder="What should students collaborate on?"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Max Posts per Student (optional)</label>
        <input type="number" value={config.max_posts || ""} onChange={e => onChange({ ...config, max_posts: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="5"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={!!config.allow_reactions} onChange={e => onChange({ ...config, allow_reactions: e.target.checked })} />
          Allow reactions / voting
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={!!config.anonymous} onChange={e => onChange({ ...config, anonymous: e.target.checked })} />
          Anonymous posts
        </label>
      </div>
    );
  }
  if (blockType === "drawing") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Drawing Prompt</label>
        <textarea value={config.prompt || ""} onChange={e => onChange({ ...config, prompt: e.target.value })} rows={2}
          placeholder="Draw or illustrate your response..."
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Background Image URL (optional)</label>
        <input value={config.background_url || ""} onChange={e => onChange({ ...config, background_url: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={!!config.allow_text} onChange={e => onChange({ ...config, allow_text: e.target.checked })} />
          Allow text annotations
        </label>
      </div>
    );
  }
  if (blockType === "red_team") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">AI System / Prompt to Red-Team</label>
        <textarea value={config.system_prompt || ""} onChange={e => onChange({ ...config, system_prompt: e.target.value })} rows={3}
          placeholder="Describe the AI system students will try to find flaws in..."
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Success Criteria</label>
        <textarea value={config.success_criteria || ""} onChange={e => onChange({ ...config, success_criteria: e.target.value })} rows={2}
          placeholder="What counts as a successful red-team attempt?"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Max Attempts (optional)</label>
        <input type="number" value={config.max_attempts || ""} onChange={e => onChange({ ...config, max_attempts: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="5"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>
    );
  }
  if (blockType === "exit_ticket") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Exit Ticket Question</label>
        <textarea value={config.question || ""} onChange={e => onChange({ ...config, question: e.target.value })} rows={2}
          placeholder="What is the most important thing you learned today?"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Response Type</label>
        <select value={config.response_type || "text"} onChange={e => onChange({ ...config, response_type: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground">
          <option value="text">Free text</option>
          <option value="rating">Rating (1-5)</option>
          <option value="emoji">Emoji reaction</option>
        </select>
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={!!config.include_confidence} onChange={e => onChange({ ...config, include_confidence: e.target.checked })} />
          Ask for confidence level
        </label>
      </div>
    );
  }
  if (blockType === "peer_review") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Review Prompt</label>
        <textarea value={config.prompt || ""} onChange={e => onChange({ ...config, prompt: e.target.value })} rows={2}
          placeholder="What should students write about and then review?"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Review Criteria (one per line)</label>
        <textarea value={(config.review_criteria || []).join("\n")} rows={3}
          onChange={e => onChange({ ...config, review_criteria: e.target.value.split("\n").filter((s: string) => s.trim()) })}
          placeholder={"Clarity of argument\nUse of evidence\nRespectful tone"}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none font-mono" />
        <label className="text-xs font-semibold text-foreground">Max Rating (default: 5)</label>
        <input type="number" value={config.max_rating || ""} onChange={e => onChange({ ...config, max_rating: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="5"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={!!config.anonymous} onChange={e => onChange({ ...config, anonymous: e.target.checked })} />
          Anonymous reviews
        </label>
      </div>
    );
  }
  if (blockType === "group_challenge") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Challenge Prompt</label>
        <textarea value={config.prompt || ""} onChange={e => onChange({ ...config, prompt: e.target.value })} rows={3}
          placeholder="Describe the group challenge..."
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
        <label className="text-xs font-semibold text-foreground">Group Size (optional)</label>
        <input type="number" value={config.group_size || ""} onChange={e => onChange({ ...config, group_size: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="4"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Time Limit (seconds, optional)</label>
        <input type="number" value={config.time_limit_seconds || ""} onChange={e => onChange({ ...config, time_limit_seconds: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="300"
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <label className="text-xs font-semibold text-foreground">Submission Type</label>
        <select value={config.submission_type || "text"} onChange={e => onChange({ ...config, submission_type: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground">
          <option value="text">Free text</option>
          <option value="choice">Multiple choice</option>
        </select>
        {config.submission_type === "choice" && (
          <>
            <label className="text-xs font-semibold text-foreground">Choices (JSON array of {`{id, text}`})</label>
            <textarea value={JSON.stringify(config.choices || [], null, 2)} rows={4}
              onChange={e => { try { onChange({ ...config, choices: JSON.parse(e.target.value) }); } catch {} }}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </>
        )}
        <label className="text-xs font-semibold text-foreground">Success Criteria (one per line, optional)</label>
        <textarea value={(config.rubric_criteria || []).join("\n")} rows={3}
          onChange={e => onChange({ ...config, rubric_criteria: e.target.value.split("\n").filter((s: string) => s.trim()) })}
          placeholder={"Uses evidence\nConsiders multiple perspectives"}
          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none font-mono" />
      </div>
    );
  }
  // video_checkpoint is now handled by "video" block type above
  // Fallback: raw JSON editor for unknown types
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-foreground">Config (JSON)</label>
      <textarea value={JSON.stringify(config, null, 2)} rows={5}
        onChange={e => { try { onChange(JSON.parse(e.target.value)); } catch {} }}
        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/50" />
    </div>
  );
}

/* ── Block Preview (read-only view) ── */
function BlockPreview({ block }: { block: Block }) {
  const cfg = block.config as any;
  if (block.block_type === "video" && cfg?.youtube_url && !Array.isArray(cfg?.checkpoints)) return <YouTubeEmbed url={cfg.youtube_url} />;
  if (block.block_type === "video") {
    const url = cfg?.video_url || cfg?.youtube_url || "";
    const cps = Array.isArray(cfg?.checkpoints) ? cfg.checkpoints : [];
    const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    if (url) {
      return (
        <div className="mt-2 space-y-1">
          {cfg?.youtube_url && <YouTubeEmbed url={cfg.youtube_url} />}
          {!cfg?.youtube_url && <p className="text-xs text-muted-foreground truncate">🎬 {url}</p>}
          {cps.length > 0 && cps.map((cp: any, i: number) => (
            <div key={cp.id || i} className="px-3 py-1.5 rounded-lg text-xs bg-secondary text-muted-foreground flex items-center gap-2">
              <span className="font-mono font-bold text-foreground">{fmtTime(cp.timestamp_seconds)}</span>
              <span className="uppercase text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{(cp.block_type || "?").replace(/_/g, " ")}</span>
              <span className="truncate">{cp.title || cp.body || ""}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  }
  if ((block.block_type === "mcq" || block.block_type === "multi_select") && Array.isArray(cfg?.options)) {
    return (
      <div className="mt-2 space-y-1">
        {(cfg.options as string[]).map((opt, i) => (
          <div key={i} className={`px-3 py-1.5 rounded-lg text-xs ${opt === cfg.correct_answer ? "bg-green-500/10 text-green-600 font-bold" : "bg-secondary text-muted-foreground"}`}>
            {opt}
          </div>
        ))}
      </div>
    );
  }
  if (block.block_type === "concept_reveal" && cfg?.key_idea) {
    return <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm"><strong>Key Idea:</strong> {cfg.key_idea}</div>;
  }
  if (block.block_type === "micro_challenge" && cfg?.question) {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-sm font-medium text-foreground">{cfg.question}</p>
        {Array.isArray(cfg.options) && cfg.options.map((o: any) => (
          <div key={o.id} className={`px-3 py-1.5 rounded-lg text-xs ${o.id === cfg.correct_option_id ? "bg-green-500/10 text-green-600 font-bold" : "bg-secondary text-muted-foreground"}`}>
            {o.text}
          </div>
        ))}
      </div>
    );
  }
  if ((block.block_type === "reasoning_response" || block.block_type === "short_answer") && cfg?.prompt) {
    return <div className="mt-2 p-3 rounded-lg bg-secondary text-sm text-muted-foreground italic">"{cfg.prompt}"</div>;
  }
  if (block.block_type === "peer_compare" && cfg?.prompt) {
    return <div className="mt-2 p-3 rounded-lg bg-secondary text-sm text-muted-foreground italic">"{cfg.prompt}"</div>;
  }
  if (block.block_type === "debate" && cfg?.topic) {
    return <div className="mt-2 p-3 rounded-lg bg-secondary text-sm text-muted-foreground">🗣️ Debate: "{cfg.topic}" — Sides: {(cfg.sides || ["For", "Against"]).join(", ")}</div>;
  }
  if (block.block_type === "peer_review" && cfg?.prompt) {
    return <div className="mt-2 p-3 rounded-lg bg-secondary text-sm text-muted-foreground">👥 Peer Review: "{cfg.prompt}"</div>;
  }
  if (block.block_type === "group_challenge" && cfg?.prompt) {
    return <div className="mt-2 p-3 rounded-lg bg-secondary text-sm text-muted-foreground">🏆 Group Challenge: "{cfg.prompt}"{cfg.group_size ? ` (groups of ${cfg.group_size})` : ""}</div>;
  }
  if (block.block_type === "poll" && Array.isArray(cfg?.options)) {
    return (
      <div className="mt-2 space-y-1">
        {(cfg.options as string[]).map((opt, i) => (
          <div key={i} className="px-3 py-1.5 rounded-lg text-xs bg-secondary text-muted-foreground">{opt}</div>
        ))}
      </div>
    );
  }
  // video_checkpoint preview handled by "video" block above
  return null;
}

export default function ManageCurriculum() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Editing
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; body: string; config: any }>({ title: "", body: "", config: {} });
  const [saving, setSaving] = useState(false);
  const [pendingSaves, setPendingSaves] = useState(0);
  const hasUnsavedWork = editingBlockId !== null || pendingSaves > 0 || saving;

  // Warn before leaving with unsaved work
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedWork) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedWork]);

  // Rename unit
  const [renamingUnitId, setRenamingUnitId] = useState<string | null>(null);
  const [renameUnitTitle, setRenameUnitTitle] = useState("");

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  // Create dialogs
  const [showCreatePkg, setShowCreatePkg] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  const [form, setForm] = useState<any>({});

  const loadAll = useCallback(async () => {
    const [pkgRes, courseRes, unitRes] = await Promise.all([
      supabase.from("curriculum_packages").select("*").order("title"),
      supabase.from("courses").select("*").order("title"),
      supabase.from("units").select("*").order("sequence_no"),
    ]);
    setPackages(pkgRes.data ?? []);
    setCourses(courseRes.data ?? []);
    setUnits(unitRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function loadCourseLessons(courseId: string) {
    setSelectedCourse(courseId);
    setSelectedLesson(null);
    setSelectedVersion(null);
    setBlocks([]);
    setEditingBlockId(null);
    const courseUnits = units.filter(u => u.course_id === courseId);
    if (courseUnits.length === 0) { setLessons([]); return; }
    const unitIds = courseUnits.map(u => u.id);
    const { data: lessonData } = await supabase
      .from("lessons").select("id, title, grade_band, difficulty, estimated_minutes, unit_id")
      .in("unit_id", unitIds).order("title");
    if (!lessonData) { setLessons([]); return; }
    const lessonIds = lessonData.map(l => l.id);
    const { data: versions } = await supabase
      .from("lesson_versions").select("id, version_label, publish_status, lesson_id")
      .in("lesson_id", lessonIds);
    const versionMap = new Map<string, any[]>();
    (versions ?? []).forEach(v => {
      if (!versionMap.has(v.lesson_id)) versionMap.set(v.lesson_id, []);
      versionMap.get(v.lesson_id)!.push(v);
    });
    setLessons(lessonData.map(l => ({ ...l, versions: versionMap.get(l.id) ?? [] })));
  }

  async function loadBlocks(versionId: string) {
    setSelectedVersion(versionId);
    setEditingBlockId(null);
    const { data } = await supabase
      .from("lesson_blocks").select("id, title, block_type, sequence_no, body, config, lesson_version_id, hints, is_gate, mastery_rules")
      .eq("lesson_version_id", versionId).order("sequence_no");
    setBlocks(data ?? []);
  }

  // ── CRUD ──
  async function createPackage() {
    if (!form.title?.trim() || !form.package_key?.trim()) return;
    const { error } = await supabase.from("curriculum_packages").insert({ title: form.title.trim(), package_key: form.package_key.trim() });
    if (error) { console.error("Create package error:", error); alert(`Failed to create package: ${error.message}`); return; }
    setShowCreatePkg(false); setForm({}); loadAll();
  }

  async function createCourse() {
    if (!form.title?.trim() || !form.grade_band) return;
    await supabase.from("courses").insert({
      title: form.title.trim(), grade_band: form.grade_band,
      curriculum_package_id: form.curriculum_package_id || null
    });
    setShowCreateCourse(false); setForm({}); loadAll();
  }

  async function createUnit() {
    if (!form.title?.trim() || !selectedCourse) return;
    const maxSeq = Math.max(0, ...units.filter(u => u.course_id === selectedCourse).map(u => u.sequence_no));
    await supabase.from("units").insert({
      title: form.title.trim(), course_id: selectedCourse, sequence_no: maxSeq + 1
    });
    setShowCreateUnit(false); setForm({}); loadAll();
    loadCourseLessons(selectedCourse);
  }

  async function createLesson() {
    if (!form.title?.trim() || !form.unit_id) return;
    const { data: lesson } = await supabase.from("lessons").insert({
      title: form.title.trim(), unit_id: form.unit_id,
      grade_band: form.grade_band || null, difficulty: form.difficulty || null,
      estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes) : null
    }).select("id").single();
    if (lesson) {
      await supabase.from("lesson_versions").insert({
        lesson_id: lesson.id, version_label: "v1", publish_status: "draft"
      });
    }
    setShowCreateLesson(false); setForm({});
    if (selectedCourse) loadCourseLessons(selectedCourse);
  }

  async function createBlock() {
    if (!form.block_type || !selectedVersion) return;
    const maxSeq = Math.max(0, ...blocks.map(b => b.sequence_no));
    await supabase.from("lesson_blocks").insert({
      lesson_version_id: selectedVersion, block_type: form.block_type,
      title: form.title?.trim() || null, body: form.body?.trim() || null,
      config: form.config || {}, sequence_no: maxSeq + 1
    });
    setShowCreateBlock(false); setForm({}); loadBlocks(selectedVersion);
  }

  async function deleteBlock(blockId: string) {
    if (!selectedVersion) return;
    await supabase.from("lesson_blocks").delete().eq("id", blockId);
    loadBlocks(selectedVersion);
  }

  async function deleteUnit(unitId: string) {
    // Delete all lessons in this unit first
    const unitLessons = lessons.filter(l => l.unit_id === unitId);
    for (const l of unitLessons) {
      const { data: versions } = await supabase.from("lesson_versions").select("id").eq("lesson_id", l.id);
      if (versions) {
        for (const v of versions) {
          await supabase.from("lesson_blocks").delete().eq("lesson_version_id", v.id);
        }
        await supabase.from("lesson_versions").delete().eq("lesson_id", l.id);
      }
      await supabase.from("lessons").delete().eq("id", l.id);
    }
    await supabase.from("units").delete().eq("id", unitId);
    setSelectedLesson(null); setSelectedVersion(null); setBlocks([]);
    setExpandedUnit(null);
    await loadAll();
    if (selectedCourse) loadCourseLessons(selectedCourse);
  }

  async function renameUnit(unitId: string) {
    if (!renameUnitTitle.trim()) return;
    await supabase.from("units").update({ title: renameUnitTitle.trim() }).eq("id", unitId);
    setRenamingUnitId(null);
    setRenameUnitTitle("");
    await loadAll();
    if (selectedCourse) loadCourseLessons(selectedCourse);
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === "block") await deleteBlock(confirmDelete.id);
    else if (confirmDelete.type === "lesson") await deleteLesson(confirmDelete.id);
    else if (confirmDelete.type === "unit") await deleteUnit(confirmDelete.id);
    setConfirmDelete(null);
  }

  async function deleteLesson(lessonId: string) {
    const { data: versions } = await supabase.from("lesson_versions").select("id").eq("lesson_id", lessonId);
    if (versions) {
      for (const v of versions) {
        await supabase.from("lesson_blocks").delete().eq("lesson_version_id", v.id);
      }
      await supabase.from("lesson_versions").delete().eq("lesson_id", lessonId);
    }
    await supabase.from("lessons").delete().eq("id", lessonId);
    setSelectedLesson(null); setSelectedVersion(null); setBlocks([]);
    if (selectedCourse) loadCourseLessons(selectedCourse);
  }

  async function togglePublish(versionId: string, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    await supabase.from("lesson_versions").update({
      publish_status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null
    }).eq("id", versionId);
    if (selectedCourse) loadCourseLessons(selectedCourse);
  }

  // ── Edit block ──
  function startEditBlock(block: Block) {
    setEditingBlockId(block.id);
    setEditForm({ title: block.title || "", body: block.body || "", config: { ...block.config } });
  }

  async function saveBlock(blockId: string) {
    setSaving(true);
    await supabase.from("lesson_blocks").update({
      title: editForm.title.trim() || null,
      body: editForm.body.trim() || null,
      config: editForm.config,
    }).eq("id", blockId);
    setSaving(false);
    setEditingBlockId(null);
    if (selectedVersion) loadBlocks(selectedVersion);
  }

  // ── Move block up/down ──
  async function moveBlock(blockId: string, direction: "up" | "down") {
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= blocks.length) return;
    // Swap locally first
    const reordered = [...blocks];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const withNewSeq = reordered.map((b, i) => ({ ...b, sequence_no: i + 1 }));
    setBlocks(withNewSeq);
    // Persist: two-phase to avoid unique constraint on (lesson_version_id, sequence_no)
    setPendingSaves(p => p + 1);
    try {
      await Promise.all(
        withNewSeq.map((b, i) => supabase.from("lesson_blocks").update({ sequence_no: -(i + 1) }).eq("id", b.id))
      );
      await Promise.all(
        withNewSeq.map(b => supabase.from("lesson_blocks").update({ sequence_no: b.sequence_no }).eq("id", b.id))
      );
    } finally {
      setPendingSaves(p => p - 1);
    }
  }

  // ── Drag & Drop reorder (robust) ──
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragCounters = useRef<Map<number, number>>(new Map());

  function handleBlockDragStart(e: React.DragEvent, idx: number) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("block-drag", String(idx));
    dragIdxRef.current = idx;
    setDragIdx(idx);
  }

  function handleBlockDragEnter(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const count = (dragCounters.current.get(idx) || 0) + 1;
    dragCounters.current.set(idx, count);
    const src = dragIdxRef.current;
    if (src !== null && idx !== src) {
      setDragOverIdx(idx);
    }
  }

  function handleBlockDragLeave(e: React.DragEvent, idx: number) {
    const count = (dragCounters.current.get(idx) || 1) - 1;
    dragCounters.current.set(idx, count);
    if (count <= 0) {
      dragCounters.current.set(idx, 0);
      if (dragOverIdx === idx) setDragOverIdx(null);
    }
  }

  function handleBlockDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    e.stopPropagation();
    dragCounters.current.clear();
    // Read source index from dataTransfer (always correct) with ref fallback
    const dtData = e.dataTransfer.getData("block-drag");
    const fromIdx = dtData !== "" ? parseInt(dtData, 10) : dragIdxRef.current;
    dragIdxRef.current = null;
    setDragIdx(null);
    setDragOverIdx(null);
    if (fromIdx === null || isNaN(fromIdx) || fromIdx === targetIdx) return;

    const reordered = [...blocks];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    // Update sequence_no locally so UI reflects correct order immediately
    const withNewSeq = reordered.map((b, i) => ({ ...b, sequence_no: i + 1 }));
    setBlocks(withNewSeq);

    // Persist to DB: two-phase to avoid unique constraint on (lesson_version_id, sequence_no)
    setPendingSaves(p => p + 1);
    try {
      await Promise.all(
        withNewSeq.map((b, i) => supabase.from("lesson_blocks").update({ sequence_no: -(i + 1) }).eq("id", b.id))
      );
      const results = await Promise.all(
        withNewSeq.map((b) =>
          supabase.from("lesson_blocks").update({ sequence_no: b.sequence_no }).eq("id", b.id)
        )
      );
      const hasError = results.some(r => r.error);
      if (hasError) {
        console.error("Failed to persist block order", results.filter(r => r.error).map(r => r.error));
        if (selectedVersion) loadBlocks(selectedVersion);
      }
    } catch (err) {
      console.error("Block reorder failed", err);
      if (selectedVersion) loadBlocks(selectedVersion);
    } finally {
      setPendingSaves(p => p - 1);
    }
  }

  function handleBlockDragEnd() {
    dragCounters.current.clear();
    dragIdxRef.current = null;
    setDragIdx(null);
    setDragOverIdx(null);
  }

  // ── Preview lesson in StepRunner ──
  function previewLesson() {
    if (!selectedVersion) return;
    // Open in a new tab pointing to the lesson preview with version param
    window.open(`/lesson/preview?versionId=${selectedVersion}`, "_blank");
  }

  if (loading) return <div className="p-6 text-muted-foreground text-sm">Loading curriculum…</div>;

  const courseUnits = selectedCourse ? units.filter(u => u.course_id === selectedCourse) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Manage Curriculum</h1>
          <p className="text-sm text-muted-foreground">Create and manage courses, lessons, and activities</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreatePkg(true); setForm({}); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground rounded-xl text-xs font-bold hover:bg-secondary/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Package
          </button>
          <button onClick={() => { setShowCreateCourse(true); setForm({}); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" /> Course
          </button>
        </div>
      </div>

      {/* Create Package Dialog */}
      {showCreatePkg && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">New Curriculum Package</h3>
            <button onClick={() => setShowCreatePkg(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <input placeholder="Package title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <input placeholder="Package key (e.g. ethics-k12)" value={form.package_key || ""} onChange={e => setForm({ ...form, package_key: e.target.value })}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <button onClick={createPackage} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">Create</button>
        </div>
      )}

      {/* Create Course Dialog */}
      {showCreateCourse && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">New Course</h3>
            <button onClick={() => setShowCreateCourse(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <input placeholder="Course title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
          <div className="flex gap-2 flex-wrap">
            {GRADE_BANDS.map(gb => (
              <button key={gb} type="button" onClick={() => setForm({ ...form, grade_band: gb })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${form.grade_band === gb ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {gb}
              </button>
            ))}
          </div>
          <select value={form.curriculum_package_id || ""} onChange={e => setForm({ ...form, curriculum_package_id: e.target.value })}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground">
            <option value="">No package (standalone)</option>
            {packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <button onClick={createCourse} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90">Create</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: packages & courses */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="font-bold text-foreground text-sm">Packages & Courses</h2>
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground text-sm mb-2">{pkg.title}</h3>
              <div className="space-y-1">
                {courses.filter(c => c.curriculum_package_id === pkg.id).map(c => (
                  <button key={c.id} onClick={() => loadCourseLessons(c.id)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedCourse === c.id ? "bg-primary/10 text-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                    <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" />{c.title}</span>
                    <span className="text-xs text-muted-foreground">{c.grade_band}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {courses.filter(c => !c.curriculum_package_id).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground text-sm mb-2">Standalone Courses</h3>
              <div className="space-y-1">
                {courses.filter(c => !c.curriculum_package_id).map(c => (
                  <button key={c.id} onClick={() => loadCourseLessons(c.id)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedCourse === c.id ? "bg-primary/10 text-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                    <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" />{c.title}</span>
                    <span className="text-xs text-muted-foreground">{c.grade_band}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {packages.length === 0 && courses.length === 0 && (
            <p className="text-muted-foreground text-sm">No curriculum yet. Create a package or course above.</p>
          )}
        </div>

        {/* Middle: Units & Lessons */}
        <div className="lg:col-span-4">
          {selectedCourse ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground text-sm">Units & Lessons</h2>
                <div className="flex gap-1.5">
                  <button onClick={() => { setShowCreateUnit(true); setForm({}); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-bold hover:bg-secondary/80">
                    <Plus className="w-3 h-3" /> Unit
                  </button>
                  <button onClick={() => { setShowCreateLesson(true); setForm({}); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90">
                    <Plus className="w-3 h-3" /> Lesson
                  </button>
                </div>
              </div>

              {showCreateUnit && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <input placeholder="Unit title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                  <div className="flex gap-2">
                    <button onClick={createUnit} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold">Create</button>
                    <button onClick={() => setShowCreateUnit(false)} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-bold">Cancel</button>
                  </div>
                </div>
              )}

              {showCreateLesson && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <input placeholder="Lesson title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                  <select value={form.unit_id || ""} onChange={e => setForm({ ...form, unit_id: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground">
                    <option value="">Select unit…</option>
                    {courseUnits.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}
                  </select>
                  <div className="flex gap-2 flex-wrap">
                    {GRADE_BANDS.map(gb => (
                      <button key={gb} type="button" onClick={() => setForm({ ...form, grade_band: gb })}
                        className={`px-2 py-1 rounded text-xs font-bold ${form.grade_band === gb ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                        {gb}
                      </button>
                    ))}
                  </div>
                  <input placeholder="Estimated minutes" type="number" value={form.estimated_minutes || ""} onChange={e => setForm({ ...form, estimated_minutes: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                  <div className="flex gap-2">
                    <button onClick={createLesson} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold">Create</button>
                    <button onClick={() => setShowCreateLesson(false)} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-bold">Cancel</button>
                  </div>
                </div>
              )}

              {courseUnits.map(unit => (
                <div key={unit.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors">
                    {renamingUnitId === unit.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input value={renameUnitTitle} onChange={e => setRenameUnitTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") renameUnit(unit.id); if (e.key === "Escape") setRenamingUnitId(null); }}
                          autoFocus
                          className="flex-1 px-2 py-1 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                        <button onClick={() => renameUnit(unit.id)} className="px-2 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold">Save</button>
                        <button onClick={() => setRenamingUnitId(null)} className="px-2 py-1 bg-secondary text-foreground rounded-lg text-xs font-bold">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)} className="flex items-center gap-2 flex-1 text-left">
                        <span className="flex items-center gap-2 font-bold text-sm text-foreground">
                          <Layers className="w-4 h-4 text-primary" />
                          {unit.title}
                        </span>
                      </button>
                    )}
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setRenamingUnitId(unit.id); setRenameUnitTitle(unit.title); }}
                        className="p-1 rounded text-muted-foreground hover:text-primary transition-colors" title="Rename unit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete({ type: "unit", id: unit.id, name: unit.title })}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors" title="Delete unit">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}>
                        {expandedUnit === unit.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                  {expandedUnit === unit.id && (
                    <div className="border-t border-border">
                      {lessons.filter(l => l.unit_id === unit.id).map(l => (
                        <div key={l.id}
                          className={`flex items-center justify-between px-4 py-2.5 border-b border-border last:border-b-0 transition-colors ${selectedLesson?.id === l.id ? "bg-primary/5" : "hover:bg-secondary/30"}`}>
                          <button onClick={() => { setSelectedLesson(l); if (l.versions.length > 0) loadBlocks(l.versions[0].id); }}
                            className="flex-1 text-left">
                            <span className="text-sm font-medium text-foreground">{l.title}</span>
                            <div className="flex gap-2 mt-0.5">
                              {l.versions.map(v => (
                                <span key={v.id} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${v.publish_status === "published" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}`}>
                                  {v.version_label} · {v.publish_status}
                                </span>
                              ))}
                            </div>
                          </button>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setConfirmDelete({ type: "lesson", id: l.id, name: l.title })}
                              className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors" title="Delete lesson">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                      {lessons.filter(l => l.unit_id === unit.id).length === 0 && (
                        <p className="px-4 py-3 text-xs text-muted-foreground">No lessons yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {courseUnits.length === 0 && (
                <p className="text-muted-foreground text-sm">No units yet. Create one to start adding lessons.</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Select a course to manage
            </div>
          )}
        </div>

        {/* Right: Lesson detail & blocks */}
        <div className="lg:col-span-5">
          {selectedLesson ? (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-foreground">{selectedLesson.title}</h2>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {selectedLesson.grade_band && <span>Grade: {selectedLesson.grade_band}</span>}
                      {selectedLesson.difficulty && <span>{selectedLesson.difficulty}</span>}
                      {selectedLesson.estimated_minutes && <span>{selectedLesson.estimated_minutes} min</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={previewLesson}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    {selectedLesson.versions.map(v => (
                      <button key={v.id} onClick={() => togglePublish(v.id, v.publish_status)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${v.publish_status === "published" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"}`}>
                        {v.publish_status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    ))}
                    <button onClick={() => setConfirmDelete({ type: "lesson", id: selectedLesson.id, name: selectedLesson.title })}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm">Activity Blocks ({blocks.length})</h3>
                <div className="flex items-center gap-2">
                  {hasUnsavedWork && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      {pendingSaves > 0 || saving ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                      ) : (
                        <><AlertTriangle className="w-3 h-3" /> Unsaved edits</>
                      )}
                    </span>
                  )}
                  <button onClick={() => { setShowCreateBlock(true); setForm({}); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90">
                    <Plus className="w-3 h-3" /> Add Block
                  </button>
                </div>
              </div>

              {showCreateBlock && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-foreground text-sm">New Activity Block</h4>
                  <select value={form.block_type || ""} onChange={e => setForm({ ...form, block_type: e.target.value, config: {} })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground">
                    <option value="">Select type…</option>
                    {BLOCK_TYPES.map(bt => <option key={bt} value={bt}>{bt.replace(/_/g, " ")}</option>)}
                  </select>
                  <input placeholder="Block title (optional)" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                  <textarea placeholder="Body / instructions" value={form.body || ""} onChange={e => setForm({ ...form, body: e.target.value })} rows={3}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
                  {form.block_type && (
                    <BlockConfigEditor blockType={form.block_type} config={form.config || {}} onChange={c => setForm({ ...form, config: c })} />
                  )}
                  <div className="flex gap-2">
                    <button onClick={createBlock} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold">Add Block</button>
                    <button onClick={() => setShowCreateBlock(false)} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-bold">Cancel</button>
                  </div>
                </div>
              )}

              {blocks.map((block, idx) => (
                <div key={block.id}
                   onDragEnter={(e) => handleBlockDragEnter(e, idx)}
                   onDragLeave={(e) => handleBlockDragLeave(e, idx)}
                   onDragOver={handleBlockDragOver}
                   onDrop={(e) => handleDrop(e, idx)}
                   onDragEnd={handleBlockDragEnd}
                  className={`bg-card border rounded-xl p-4 transition-all ${dragOverIdx === idx && dragIdx !== idx ? "border-primary border-2 shadow-lg" : "border-border"} ${dragIdx === idx ? "opacity-50" : ""}`}>
                  {editingBlockId === block.id ? (
                    /* ── Edit Mode ── */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary uppercase">{block.block_type.replace(/_/g, " ")} — Editing</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => saveBlock(block.id)} disabled={saving}
                            className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50">
                            <Save className="w-3 h-3" /> {saving ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditingBlockId(null)}
                            className="px-2.5 py-1 bg-secondary text-foreground rounded-lg text-xs font-bold">Cancel</button>
                        </div>
                      </div>
                      <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Block title"
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                      <textarea value={editForm.body} onChange={e => setEditForm({ ...editForm, body: e.target.value })}
                        placeholder="Body / instructions" rows={3}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />
                      <BlockConfigEditor blockType={block.block_type} config={editForm.config} onChange={c => setEditForm({ ...editForm, config: c })} />
                    </div>
                  ) : (
                    /* ── View Mode ── */
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            draggable
                            onDragStart={(e) => handleBlockDragStart(e, idx)}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors" title="Drag to reorder">
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                            {blockIcon(block.block_type)}
                          </span>
                          <div>
                            <span className="font-medium text-sm text-foreground">
                              {block.title || block.block_type.replace(/_/g, " ")}
                            </span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                              {block.block_type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveBlock(block.id, "up")} disabled={idx === 0}
                            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors" title="Move up">
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1}
                            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors" title="Move down">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => startEditBlock(block)}
                            className="p-1 rounded text-muted-foreground hover:text-primary transition-colors" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete({ type: "block", id: block.id, name: block.title || block.block_type.replace(/_/g, " ") })}
                            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {block.body && <p className="mt-2 text-xs text-muted-foreground">{block.body}</p>}
                      <BlockPreview block={block} />
                    </>
                  )}
                </div>
              ))}
              {blocks.length === 0 && !showCreateBlock && (
                <p className="text-muted-foreground text-sm text-center py-8">No activity blocks yet. Add one above.</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Select a lesson to manage its content
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Confirm Delete</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{confirmDelete.name}</span>?
              {confirmDelete.type === "unit" && " This will also delete all lessons and blocks in this unit."}
              {confirmDelete.type === "lesson" && " This will also delete all versions and blocks."}
              {" "}This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-secondary text-foreground rounded-xl text-sm font-bold hover:bg-secondary/80 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
