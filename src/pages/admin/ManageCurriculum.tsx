import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen, ChevronRight, Plus, Trash2, Edit2, Save, X, Play,
  Layers, FileText, Video, HelpCircle, MessageSquare, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, GripVertical
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
};

const BLOCK_TYPES = [
  "video", "poll", "mcq", "multi_select", "short_answer", "scenario",
  "dilemma_tree", "drag_drop", "matching", "debate", "group_board",
  "collaborative_board", "drawing", "red_team", "exit_ticket",
  "concept_reveal", "micro_challenge", "reasoning_response", "peer_compare"
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

export default function ManageCurriculum() {
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

  // Create dialogs
  const [showCreatePkg, setShowCreatePkg] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showCreateBlock, setShowCreateBlock] = useState(false);

  // Form state
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
    const { data } = await supabase
      .from("lesson_blocks").select("id, title, block_type, sequence_no, body, config, lesson_version_id")
      .eq("lesson_version_id", versionId).order("sequence_no");
    setBlocks(data ?? []);
  }

  // CRUD helpers
  async function createPackage() {
    if (!form.title?.trim() || !form.package_key?.trim()) return;
    await supabase.from("curriculum_packages").insert({ title: form.title.trim(), package_key: form.package_key.trim() });
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
    const config: any = {};
    if (form.block_type === "video" && form.youtube_url) {
      config.youtube_url = form.youtube_url;
    }
    if (form.block_type === "mcq" || form.block_type === "multi_select") {
      config.options = form.options ? form.options.split("\n").filter((o: string) => o.trim()) : [];
      config.correct_answer = form.correct_answer || "";
    }
    await supabase.from("lesson_blocks").insert({
      lesson_version_id: selectedVersion, block_type: form.block_type,
      title: form.title?.trim() || null, body: form.body?.trim() || null,
      config, sequence_no: maxSeq + 1
    });
    setShowCreateBlock(false); setForm({}); loadBlocks(selectedVersion);
  }

  async function deleteBlock(blockId: string) {
    if (!selectedVersion) return;
    await supabase.from("lesson_blocks").delete().eq("id", blockId);
    loadBlocks(selectedVersion);
  }

  async function deleteLesson(lessonId: string) {
    // Delete versions and blocks first
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
                  <button onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors">
                    <span className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <Layers className="w-4 h-4 text-primary" />
                      {unit.title}
                    </span>
                    {expandedUnit === unit.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedUnit === unit.id && (
                    <div className="border-t border-border">
                      {lessons.filter(l => l.unit_id === unit.id).map(l => (
                        <button key={l.id} onClick={() => { setSelectedLesson(l); if (l.versions.length > 0) loadBlocks(l.versions[0].id); }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between border-b border-border last:border-b-0 transition-colors ${selectedLesson?.id === l.id ? "bg-primary/5" : "hover:bg-secondary/30"}`}>
                          <div>
                            <span className="text-sm font-medium text-foreground">{l.title}</span>
                            <div className="flex gap-2 mt-0.5">
                              {l.versions.map(v => (
                                <span key={v.id} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${v.publish_status === "published" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}`}>
                                  {v.version_label} · {v.publish_status}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
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
                    {selectedLesson.versions.map(v => (
                      <button key={v.id} onClick={() => togglePublish(v.id, v.publish_status)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${v.publish_status === "published" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"}`}>
                        {v.publish_status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    ))}
                    <button onClick={() => deleteLesson(selectedLesson.id)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm">Activity Blocks ({blocks.length})</h3>
                <button onClick={() => { setShowCreateBlock(true); setForm({}); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90">
                  <Plus className="w-3 h-3" /> Add Block
                </button>
              </div>

              {showCreateBlock && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-foreground text-sm">New Activity Block</h4>
                  <select value={form.block_type || ""} onChange={e => setForm({ ...form, block_type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground">
                    <option value="">Select type…</option>
                    {BLOCK_TYPES.map(bt => (
                      <option key={bt} value={bt}>{bt.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <input placeholder="Block title (optional)" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                  <textarea placeholder="Body / instructions" value={form.body || ""} onChange={e => setForm({ ...form, body: e.target.value })} rows={3}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none" />

                  {form.block_type === "video" && (
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">YouTube URL</label>
                      <input placeholder="https://youtube.com/watch?v=..." value={form.youtube_url || ""} onChange={e => setForm({ ...form, youtube_url: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                      {form.youtube_url && <YouTubeEmbed url={form.youtube_url} />}
                    </div>
                  )}

                  {(form.block_type === "mcq" || form.block_type === "multi_select") && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground block">Options (one per line)</label>
                      <textarea placeholder={"Option A\nOption B\nOption C\nOption D"} value={form.options || ""} onChange={e => setForm({ ...form, options: e.target.value })} rows={4}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none font-mono" />
                      <input placeholder="Correct answer" value={form.correct_answer || ""} onChange={e => setForm({ ...form, correct_answer: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={createBlock} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold">Add Block</button>
                    <button onClick={() => setShowCreateBlock(false)} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-bold">Cancel</button>
                  </div>
                </div>
              )}

              {blocks.map(block => (
                <div key={block.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
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
                    <button onClick={() => deleteBlock(block.id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {block.body && <p className="mt-2 text-xs text-muted-foreground">{block.body}</p>}
                  {block.block_type === "video" && (block.config as any)?.youtube_url && (
                    <YouTubeEmbed url={(block.config as any).youtube_url} />
                  )}
                  {(block.block_type === "mcq" || block.block_type === "multi_select") && (block.config as any)?.options && (
                    <div className="mt-2 space-y-1">
                      {((block.config as any).options as string[]).map((opt, i) => (
                        <div key={i} className={`px-3 py-1.5 rounded-lg text-xs ${opt === (block.config as any).correct_answer ? "bg-green-500/10 text-green-600 font-bold" : "bg-secondary text-muted-foreground"}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
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
    </div>
  );
}
