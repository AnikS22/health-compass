"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { teacherSupabase } from "../../lib/supabase";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teacherSupabase) {
      setStatus("Supabase environment is missing.");
      return;
    }
    if (mode === "signin") {
      setStatus("Signing in...");
      const { error } = await teacherSupabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(`Sign in failed: ${error.message}`);
        return;
      }
      setStatus("Signed in.");
      router.push("/");
      return;
    }

    setStatus("Creating teacher account...");
    const { data, error } = await teacherSupabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || "Teacher",
          role: "teacher"
        },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined
      }
    });
    if (error) {
      setStatus(`Sign up failed: ${error.message}`);
      return;
    }
    setStatus(data.session ? "Teacher account created and signed in." : "Teacher account created. Confirm email then sign in.");
    if (data.session) router.push("/");
  }

  return (
    <main>
      <section className="hero">
        <h1 className="title">{mode === "signin" ? "Teacher Login" : "Create Teacher Account"}</h1>
        <p className="subtitle">
          {mode === "signin" ? "Access your classroom controls and reports." : "Set up a teacher account for your school."}
        </p>
      </section>

      <section className="formCard" style={{ maxWidth: 480 }}>
        <div className="buttonRow" style={{ marginBottom: 12 }}>
          <button
            className={`button ${mode === "signin" ? "active" : ""}`}
            onClick={() => {
              setMode("signin");
              setStatus("");
            }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`button ${mode === "signup" ? "active" : ""}`}
            onClick={() => {
              setMode("signup");
              setStatus("");
            }}
            type="button"
          >
            Create Teacher User
          </button>
        </div>
        <form onSubmit={onSubmit}>
          {mode === "signup" ? (
            <>
              <label className="fieldLabel" htmlFor="name">
                Name
              </label>
              <input id="name" className="input" value={name} onChange={(event) => setName(event.target.value)} />
            </>
          ) : null}
          <label className="fieldLabel" htmlFor="email">
            Email
          </label>
          <input id="email" className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
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
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </section>
      {status ? <p className="status info">{status}</p> : null}
    </main>
  );
}
