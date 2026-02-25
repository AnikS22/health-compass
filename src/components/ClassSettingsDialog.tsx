import { useState } from "react";
import { X, Settings, Trash2, Save, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const GRADE_OPTIONS = ["K-2", "3-5", "6-8", "9-10", "11-12"];

interface ClassInfo {
  id: string;
  name: string;
  grade_band: string;
}

interface Props {
  classInfo: ClassInfo;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export default function ClassSettingsDialog({ classInfo, open, onClose, onUpdated, onDeleted }: Props) {
  const [name, setName] = useState(classInfo.name);
  const [gradeBand, setGradeBand] = useState(classInfo.grade_band);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!open) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from("classes").update({ name: name.trim(), grade_band: gradeBand }).eq("id", classInfo.id);
    setSaving(false);
    onUpdated();
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    // Delete related data first
    await Promise.all([
      supabase.from("class_join_codes").delete().eq("class_id", classInfo.id),
      supabase.from("class_enrollments").delete().eq("class_id", classInfo.id),
    ]);
    // Delete assignments for this class
    await supabase.from("assignments").delete().eq("class_id", classInfo.id);
    // Delete the class itself
    await supabase.from("classes").delete().eq("id", classInfo.id);
    setDeleting(false);
    onDeleted();
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Settings className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Class Settings</h2>
              <p className="text-xs text-muted-foreground">Edit or delete this class</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Class Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>

        {/* Danger zone */}
        <div className="p-6 border-t border-border space-y-3">
          <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 border border-destructive/30 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Class
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                This will permanently delete the class, all enrollments, join codes, and assignments. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
