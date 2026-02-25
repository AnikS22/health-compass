import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "");
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
      return new Response(JSON.stringify({ error: "Only ethics admins can create teachers" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, full_name, organization_id } = await req.json();
    if (!email || !password || !full_name || !organization_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: "teacher" },
      app_metadata: { organization_id },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The handle_new_user trigger should create the user + role,
    // but ensure organization_id is set
    if (authData.user) {
      // Wait a moment for the trigger to fire
      await new Promise(r => setTimeout(r, 500));
      
      // Update the user's organization
      await supabase.from("users")
        .update({ organization_id })
        .eq("auth_user_id", authData.user.id);
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
