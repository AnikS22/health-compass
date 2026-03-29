import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Shield, Link2, Unlink } from "lucide-react";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AccountSettings() {
  const { user, role, roles, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [googleLinked, setGoogleLinked] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.user_metadata?.full_name || user.user_metadata?.name || "");
    
    // Check linked identities
    supabase.auth.getUserIdentities().then(({ data }) => {
      const ids = data?.identities ?? [];
      setIdentities(ids);
      setGoogleLinked(ids.some((i) => i.provider === "google"));
    });
  }, [user]);

  const handleSaveName = async () => {
    setSaving(true);
    setStatus("");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName },
    });
    if (error) {
      setStatus(error.message);
    } else {
      // Also update the app users table
      const { data: appUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      if (appUser) {
        await supabase.from("users").update({ display_name: displayName }).eq("id", appUser.id);
      }
      setStatus("Saved!");
    }
    setSaving(false);
  };

  const handleLinkGoogle = async () => {
    setStatus("");
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: window.location.origin + "/account" },
    });
    if (error) setStatus(error.message);
  };

  const handleUnlinkGoogle = async () => {
    setStatus("");
    const googleIdentity = identities.find((i) => i.provider === "google");
    if (!googleIdentity) return;
    
    // Must have at least one other identity (email/password)
    if (identities.length <= 1) {
      setStatus("You need at least one sign-in method. Set a password first before unlinking Google.");
      return;
    }
    
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
    if (error) {
      setStatus(error.message);
    } else {
      setGoogleLinked(false);
      setIdentities((prev) => prev.filter((i) => i.provider !== "google"));
      setStatus("Google account unlinked.");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and connected accounts</p>
      </div>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border border-input rounded-xl">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{user.email}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Role</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border border-input rounded-xl">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground capitalize">{roles.join(", ") || role || "—"}</span>
            </div>
          </div>
          <button
            onClick={handleSaveName}
            disabled={saving}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Connected Accounts</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-background border border-input rounded-xl">
          <div className="flex items-center gap-3">
            <GoogleIcon />
            <div>
              <p className="text-sm font-bold text-foreground">Google</p>
              <p className="text-xs text-muted-foreground">
                {googleLinked
                  ? `Connected as ${identities.find((i) => i.provider === "google")?.identity_data?.email || "linked"}`
                  : "Not connected"}
              </p>
            </div>
          </div>
          {googleLinked ? (
            <button
              onClick={handleUnlinkGoogle}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-destructive border border-destructive/30 rounded-xl hover:bg-destructive/10 transition-colors"
            >
              <Unlink className="w-3.5 h-3.5" />
              Unlink
            </button>
          ) : (
            <button
              onClick={handleLinkGoogle}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/10 transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              Link Google
            </button>
          )}
        </div>
      </div>

      {status && (
        <p className={`text-sm font-medium ${status === "Saved!" || status.includes("unlinked") ? "text-green-600" : "text-destructive"}`}>
          {status}
        </p>
      )}

      <button
        onClick={signOut}
        className="w-full py-3 bg-destructive/10 text-destructive rounded-xl text-sm font-bold hover:bg-destructive/20 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
