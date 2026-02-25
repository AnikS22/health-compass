import { useState } from "react";
import { X, Plus, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const GRADE_OPTIONS = ["K-2", "3-5", "6-8", "9-10", "11-12"];

interface Props {
  appUserId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateClassDialog({ appUserId, open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [gradeBand, setGradeBand] = useState("6-8");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", appUserId)
      .single();

    if (!userData?.organization_id) {
      setError("You must be assigned to a school before creating classes.");
      setCreating(false);
      return;
    }

    const { error: insertErr } = await supabase.from("classes").insert({
      name: name.trim(),
      grade_band: gradeBand,
      teacher_id: appUserId,
      organization_id: userData.organization_id,
    });

    if (insertErr) {
      setError(insertErr.message);
      setCreating(false);
      return;
    }

    setName("");
    setGradeBand("6-8");
    setCreating(false);
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Create New Class</h2>
              <p className="text-xs text-muted-foreground">Set up a classroom for your students</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Class Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ethics Period 3"
              required
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Grade Band</label>
            <div className="grid grid-cols-5 gap-2">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGradeBand(g)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    gradeBand === g
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-background border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              {creating ? "Creating…" : "Create Class"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
