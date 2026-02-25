import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ROLES = ["student", "teacher", "school_admin", "ethics_admin", "curriculum_admin"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an ethics_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller is ethics_admin
    const { data: callerApp } = await supabase.from("users").select("id").eq("auth_user_id", caller.id).single();
    if (!callerApp) {
      return new Response(JSON.stringify({ error: "User not found in app" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleCheck } = await supabase.from("user_roles").select("role_key").eq("user_id", callerApp.id).eq("role_key", "ethics_admin");
    if (!roleCheck || roleCheck.length === 0) {
      return new Response(JSON.stringify({ error: "Only ethics admins can create users" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, full_name, organization_id, role } = await req.json();
    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, full_name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assignRole = role && VALID_ROLES.includes(role) ? role : "student";

    // Create the auth user
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim(), role: assignRole },
      app_metadata: { organization_id: organization_id || undefined },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (authData.user) {
      // Wait for trigger to fire
      await new Promise(r => setTimeout(r, 800));

      // Ensure organization is set if provided
      if (organization_id) {
        await supabase.from("users")
          .update({ organization_id })
          .eq("auth_user_id", authData.user.id);
      }

      // Ensure role is set (trigger should handle this, but just in case)
      const { data: appUser } = await supabase.from("users").select("id").eq("auth_user_id", authData.user.id).single();
      if (appUser) {
        await supabase.from("user_roles")
          .upsert({ user_id: appUser.id, role_key: assignRole }, { onConflict: "user_id,role_key" });
      }
    }

    return new Response(JSON.stringify({ ok: true, user_id: authData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
