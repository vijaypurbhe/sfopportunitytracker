import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "vijaypralhad.purbhe@techmahindra.com";
const ADMIN_DEPARTMENT = "Administrator";
const allowedDepartments = new Set([
  "Pre-Sales",
  "Sales",
  "Delivery",
  "Practice Lead",
  "Alliances",
  ADMIN_DEPARTMENT,
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await adminClient.auth.getUser(token);

    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (caller.email !== ADMIN_EMAIL && !adminRole) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { target_user_id, new_department } = await req.json();

    if (!target_user_id || !new_department) {
      return new Response(JSON.stringify({ error: "target_user_id and new_department are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!allowedDepartments.has(new_department)) {
      return new Response(JSON.stringify({ error: "Invalid department" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from("profiles")
      .select("user_id, department, full_name, email")
      .eq("user_id", target_user_id)
      .maybeSingle();

    if (existingProfileError) {
      return new Response(JSON.stringify({ error: existingProfileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!existingProfile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previousDepartment = existingProfile.department;

    const { data: updatedProfile, error: profileError } = await adminClient
      .from("profiles")
      .update({ department: new_department })
      .eq("user_id", target_user_id)
      .select("user_id, department, full_name, email")
      .maybeSingle();

    if (profileError || !updatedProfile) {
      return new Response(JSON.stringify({ error: profileError?.message || "Failed to update user profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let roleError: string | null = null;

    if (new_department === ADMIN_DEPARTMENT) {
      const { error } = await adminClient
        .from("user_roles")
        .upsert([{ user_id: target_user_id, role: "admin" }], { onConflict: "user_id,role" });

      if (error) roleError = error.message;
    } else {
      const { error } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", target_user_id)
        .eq("role", "admin");

      if (error) roleError = error.message;
    }

    if (roleError) {
      await adminClient
        .from("profiles")
        .update({ department: previousDepartment })
        .eq("user_id", target_user_id);

      return new Response(JSON.stringify({ error: roleError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, profile: updatedProfile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
