import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const ROLE_PRIORITY: Record<string, number> = {
  ethics_admin: 0,
  curriculum_admin: 1,
  school_admin: 2,
  teacher: 3,
  student: 4,
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  roles: string[];
  appUserId: string | null;
  waitlistStatus: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  roles: [],
  appUserId: null,
  waitlistStatus: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);

  async function loadProfile(authUser: User) {
    const { data: userData } = await supabase
      .from("users")
      .select("id, waitlist_status")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (userData) {
      setAppUserId(userData.id);
      setWaitlistStatus((userData as any).waitlist_status ?? null);
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role_key")
        .eq("user_id", userData.id);
      const allRoles = (roleData ?? []).map((r) => r.role_key);
      setRoles(allRoles);
      // Pick highest-priority role
      const sorted = [...allRoles].sort((a, b) => (ROLE_PRIORITY[a] ?? 99) - (ROLE_PRIORITY[b] ?? 99));
      setRole(sorted[0] ?? null);
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => loadProfile(session.user), 0);
        } else {
          setRole(null);
          setRoles([]);
          setAppUserId(null);
          setWaitlistStatus(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, roles, appUserId, waitlistStatus, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
