import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const COUNCILLOR_PREFIX = "msc";

const COUNCILLORS = [
  { student_id: "2024001", full_name: "Mr. Kabuye Robert", role: "patron", class: "Staff" },
  { student_id: "2024002", full_name: "Ssekandi Brian", role: "chairperson", class: "S.6 Arts" },
  { student_id: "2024003", full_name: "Nalubega Grace", role: "vice_chairperson", class: "S.6 Science" },
  { student_id: "2024004", full_name: "Mugisha David", role: "speaker", class: "S.5 Arts" },
  { student_id: "2024005", full_name: "Namutebi Sharon", role: "deputy_speaker", class: "S.5 Science" },
  { student_id: "2024006", full_name: "Okello James", role: "general_secretary", class: "S.5 Arts" },
  { student_id: "2024007", full_name: "Atim Patricia", role: "assistant_general_secretary", class: "S.4 Blue" },
  { student_id: "2024008", full_name: "Tumusiime Allan", role: "secretary_finance", class: "S.5 Science" },
  { student_id: "2024009", full_name: "Namukasa Esther", role: "secretary_welfare", class: "S.4 Red" },
  { student_id: "2024010", full_name: "Ouma Peter", role: "secretary_health", class: "S.4 Green" },
  { student_id: "2024011", full_name: "Nakamya Faith", role: "secretary_women_affairs", class: "S.5 Arts" },
  { student_id: "2024012", full_name: "Lubega Isaac", role: "secretary_publicity", class: "S.4 Blue" },
  { student_id: "2024013", full_name: "Kigozi Emmanuel", role: "secretary_pwd", class: "S.5 Science" },
  { student_id: "2024014", full_name: "Nantongo Juliet", role: "electoral_commission", class: "S.6 Arts" },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: any[] = [];
  const password = "Mengo2026!";

  for (const c of COUNCILLORS) {
    const email = `${COUNCILLOR_PREFIX}.${c.student_id}@mengo.council`;

    // Create auth user
    const { data: userData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: c.full_name, student_id: c.student_id },
    });

    if (authError) {
      results.push({ role: c.role, error: authError.message });
      continue;
    }

    const userId = userData.user.id;

    // Update profile
    await admin.from("profiles").update({
      full_name: c.full_name,
      student_id: c.student_id,
      class: c.class,
    }).eq("user_id", userId);

    // Assign role
    await admin.from("user_roles").insert({
      user_id: userId,
      role: c.role,
    });

    results.push({ role: c.role, student_id: c.student_id, email, status: "created" });
  }

  return new Response(JSON.stringify({ password, results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
