import { useEffect, useState } from "react";
import { Building2, ArrowLeft, Check, Globe, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SchoolProfile() {
  const { appUserId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [orgId, setOrgId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");

  // Policy settings
  const [allowGuest, setAllowGuest] = useState(true);
  const [retentionDays, setRetentionDays] = useState(365);
  const [piiLevel, setPiiLevel] = useState("standard");
  const [hasPolicyRow, setHasPolicyRow] = useState(false);

  useEffect(() => {
    if (!appUserId) return;
    loadProfile();
  }, [appUserId]);

  async function loadProfile() {
    setLoading(true);
    const { data: org } = await supabase.from("organizations").select("*").limit(1).maybeSingle();
    if (org) {
      setOrgId(org.id);
      setName(org.name);
      setSlug(org.tenant_slug);
      setDomain((org as any).email_domain ?? "");

      const { data: policy } = await supabase
        .from("organization_policy_settings")
        .select("*")
        .eq("organization_id", org.id)
        .maybeSingle();

      if (policy) {
        setHasPolicyRow(true);
        setAllowGuest(policy.allow_guest_live_join);
        setRetentionDays(policy.data_retention_days);
        setPiiLevel(policy.pii_filter_level);
      }
    }
    setLoading(false);
  }

  async function saveProfile() {
    if (!orgId) return;
    setSaving(true);
    setSaved(false);

    await supabase.from("organizations").update({
      name: name.trim(),
      tenant_slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      email_domain: domain.trim().toLowerCase() || null,
    }).eq("id", orgId);

    // Upsert policy settings
    if (hasPolicyRow) {
      await supabase.from("organization_policy_settings").update({
        allow_guest_live_join: allowGuest,
        data_retention_days: retentionDays,
        pii_filter_level: piiLevel,
      }).eq("organization_id", orgId);
    } else {
      await supabase.from("organization_policy_settings").insert({
        organization_id: orgId,
        allow_guest_live_join: allowGuest,
        data_retention_days: retentionDays,
        pii_filter_level: piiLevel,
      });
      setHasPolicyRow(true);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground text-sm">Loading…</div></div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-foreground">School Profile</h1>
        <p className="text-sm text-muted-foreground">Edit your school's information and settings</p>
      </div>

      {/* School Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">School Information</h2>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">School Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full mt-1 px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)}
            className="w-full mt-1 px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Email Domain
          </label>
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. school.edu"
            className="w-full mt-1 px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        </div>
      </div>

      {/* Policy Settings */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Policy & Privacy</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Allow Guest Live Join</p>
            <p className="text-xs text-muted-foreground">Let unauthenticated users join live sessions</p>
          </div>
          <button onClick={() => setAllowGuest(!allowGuest)}
            className={`w-12 h-6 rounded-full transition-colors ${allowGuest ? "bg-primary" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${allowGuest ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Data Retention (days)</label>
          <input type="number" value={retentionDays} onChange={e => setRetentionDays(parseInt(e.target.value) || 365)}
            className="w-full mt-1 px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">PII Filter Level</label>
          <select value={piiLevel} onChange={e => setPiiLevel(e.target.value)}
            className="w-full mt-1 px-4 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
            <option value="standard">Standard</option>
            <option value="strict">Strict</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      <button onClick={saveProfile} disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
        {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
