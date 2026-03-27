import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context, pipelineData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Query actual data from the database for grounding
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Get summary stats from the database
    const { data: opps, error: dbErr } = await sb
      .from("opportunities")
      .select("opportunity_name, stage, sales_stage, overall_tcv, win_probability, account_name, primary_industry, country, expected_close_date, acv_fy_23_24, acv_fy_24_25, acv_fy_25_26, acv_fy_26_27, acv_fy_27_28, type_of_business, competitor_name, pricing_model, total_resources, ebitda_percent, contract_tenure_months, account_ibg, account_ibu, account_sbu, bid_manager, opportunity_owner")
      .order("overall_tcv", { ascending: false, nullsFirst: false })
      .limit(1000);

    if (dbErr) console.error("DB query error:", dbErr);

    const allOpps = opps || [];

    // Compute grounded stats
    const excludedStages = ['P5', 'Lost', 'Aborted', 'Hibernate'];
    const activeOpps = allOpps.filter(o => {
      const stage = o.stage || '';
      const salesStage = (o.sales_stage || '').toLowerCase();
      if (excludedStages.includes(stage)) return false;
      if (salesStage.includes('won') || salesStage.includes('lost') || salesStage.includes('abort') || salesStage.includes('hibernate')) return false;
      return true;
    });
    const totalTCV = activeOpps.reduce((s, o) => s + (Number(o.overall_tcv) || 0), 0);
    const wonDeals = allOpps.filter(o => o.stage === 'P5' || (o.sales_stage && o.sales_stage.includes('Won')));
    const lostDeals = allOpps.filter(o => o.sales_stage?.includes('Lost') || o.stage === 'Lost');
    const winRate = allOpps.length > 0 ? (wonDeals.length / allOpps.length * 100).toFixed(1) : '0';
    const avgWinProb = activeOpps.length
      ? (activeOpps.reduce((s, o) => s + (o.win_probability || 0), 0) / activeOpps.length).toFixed(1)
      : '0';

    // Stage distribution
    const stageCounts: Record<string, { count: number; tcv: number }> = {};
    allOpps.forEach(o => {
      const st = o.stage || 'Unknown';
      if (!stageCounts[st]) stageCounts[st] = { count: 0, tcv: 0 };
      stageCounts[st].count++;
      stageCounts[st].tcv += Number(o.overall_tcv) || 0;
    });

    // Industry distribution
    const industryCounts: Record<string, number> = {};
    allOpps.forEach(o => {
      const ind = o.primary_industry || 'Unknown';
      industryCounts[ind] = (industryCounts[ind] || 0) + 1;
    });

    // Top deals
    const topDeals = allOpps.slice(0, 15).map(o => ({
      name: o.opportunity_name,
      account: o.account_name,
      stage: o.stage,
      tcv: o.overall_tcv,
      winProb: o.win_probability,
      industry: o.primary_industry,
      country: o.country,
      closeDate: o.expected_close_date,
    }));

    // ACV by FY
    const acvFY = {
      'FY23-24': allOpps.reduce((s, o) => s + (o.acv_fy_23_24 || 0), 0),
      'FY24-25': allOpps.reduce((s, o) => s + (o.acv_fy_24_25 || 0), 0),
      'FY25-26': allOpps.reduce((s, o) => s + (o.acv_fy_25_26 || 0), 0),
      'FY26-27': allOpps.reduce((s, o) => s + (o.acv_fy_26_27 || 0), 0),
      'FY27-28': allOpps.reduce((s, o) => s + (o.acv_fy_27_28 || 0), 0),
    };

    const dataContext = `
## ACTUAL PIPELINE DATA (Use ONLY these numbers — never make up data)
NOTE: All TCV and ACV values are already in millions (M). Do NOT divide again.
- Total opportunities: ${allOpps.length}
- Active deals (excluding Won/Lost/Aborted/Hibernate): ${activeOpps.length}
- Active pipeline TCV: $${totalTCV.toFixed(2)}M
- Won deals: ${wonDeals.length}
- Lost deals: ${lostDeals.length}
- Win rate: ${winRate}%
- Avg win probability (active): ${avgWinProb}%

### Stage Distribution
${Object.entries(stageCounts).sort((a, b) => b[1].count - a[1].count).map(([st, d]) => `- ${st}: ${d.count} deals, TCV $${d.tcv.toFixed(2)}M`).join('\n')}

### Industry Distribution (top 10)
${Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([ind, c]) => `- ${ind}: ${c} deals`).join('\n')}

### ACV by Fiscal Year
${Object.entries(acvFY).map(([fy, v]) => `- ${fy}: $${v.toFixed(2)}M`).join('\n')}

### Top 15 Deals by TCV
${topDeals.map(d => `- ${d.name} | ${d.account} | Stage: ${d.stage} | TCV: $${(d.tcv || 0).toFixed(2)}M | Win%: ${d.winProb || 0} | ${d.industry} | ${d.country} | Close: ${d.closeDate || 'N/A'}`).join('\n')}
`;

    // If extra data was passed from the frontend (e.g. tile-specific data), include it
    const extraContext = pipelineData ? `\n### Additional Context from Dashboard\n${pipelineData}\n` : '';

    const systemPrompt = `You are an AI sales assistant for Pipeline CRM. You have access to REAL pipeline data below. 

CRITICAL RULES:
1. ONLY use the numbers and data provided below. NEVER invent, estimate, or hallucinate any numbers.
2. If asked about something not in the data, say "I don't have that specific data available."
3. Always cite actual numbers from the data when answering.
4. Be concise and actionable (use bullet points, tables when helpful).
5. Reference specific deal names, stages, and metrics from the actual data.

Current page context: ${context || 'General CRM usage'}

${dataContext}${extraContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "No response generated.";

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
