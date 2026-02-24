"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }
    if (mode === "signin") {
      setStatus("Signing in...");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(`Login failed: ${error.message}`);
        return;
      }
      setStatus("Signed in.");
      router.push("/dashboard");
      return;
    }

    setStatus("Creating account...");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName || "Student"
        },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined
      }
    });

    if (error) {
      setStatus(`Signup failed: ${error.message}`);
      return;
    }

    const authUser = data.user;
    if (authUser) {
      const { error: profileError } = await supabase.from("users").upsert(
        {
          auth_user_id: authUser.id,
          email: (authUser.email ?? email).toLowerCase(),
          display_name: displayName || "Student"
        },
        { onConflict: "email" }
      );

      if (profileError) {
        setStatus("Account created. Sign in now; profile will be linked on first API request.");
        return;
      }
    }

    if (data.session) {
      setStatus("Account created and signed in.");
      router.push("/dashboard");
      return;
    }

    setStatus("Account created. Check your email to confirm, then sign in.");
  }

  return (
    <main>
      <section className="hero">
        <h1 className="title">{mode === "signin" ? "Student Login" : "Create Student Account"}</h1>
        <p className="subtitle">
          {mode === "signin" ? "Use your school-provided credentials." : "Set up your account to start lessons."}
        </p>
      </section>

      <section className="formCard">
        <div className="buttonRow" style={{ marginBottom: 12 }}>
          <button className={`button ${mode === "signin" ? "active" : ""}`} type="button" onClick={() => setMode("signin")}>
            Sign In
          </button>
          <button className={`button ${mode === "signup" ? "active" : ""}`} type="button" onClick={() => setMode("signup")}>
            Create User
          </button>
        </div>
        <form onSubmit={onSubmit}>
          {mode === "signup" ? (
            <>
              <label className="fieldLabel" htmlFor="display-name">
                Name
              </label>
              <input
                id="display-name"
                className="input"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </>
          ) : null}
          <label className="fieldLabel" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label className="fieldLabel" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="primaryButton" type="submit">
            {mode === "signin" ? "Sign In" : "Create User"}
          </button>
        </form>
      </section>
      {status ? <p className="status info">{status}</p> : null}
    </main>
  );
}
