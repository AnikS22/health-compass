import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user: caller } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller is ethics_admin
    const { data: callerApp } = await supabase.from("users").select("id").eq("auth_user_id", caller.id).single();
    if (!callerApp) {
      return new Response(JSON.stringify({ error: "User not found" }), {
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

    const assignRole = role && VALID_ROLES.includes(role) ? role : "student";

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: assignRole },
      app_metadata: { organization_id: organization_id || undefined },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (authData.user) {
      // Wait for trigger to fire
      await new Promise(r => setTimeout(r, 500));

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
