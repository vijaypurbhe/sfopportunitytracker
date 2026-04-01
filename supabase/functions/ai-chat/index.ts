import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context, pipelineData, entityType, entityId, regionFilter } = await req.json();
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

    // Region mapping (mirrors frontend src/lib/regions.ts)
    const REGION_MAP: Record<string, string> = {
      'United States': 'AMER', 'USA': 'AMER', 'US': 'AMER', 'Canada': 'AMER', 'Mexico': 'AMER',
      'Brazil': 'AMER', 'Argentina': 'AMER', 'Chile': 'AMER', 'Colombia': 'AMER', 'Peru': 'AMER',
      'Costa Rica': 'AMER', 'Panama': 'AMER', 'Puerto Rico': 'AMER', 'Ecuador': 'AMER',
      'United Kingdom': 'EMEA', 'UK': 'EMEA', 'Germany': 'EMEA', 'France': 'EMEA', 'Italy': 'EMEA',
      'Spain': 'EMEA', 'Netherlands': 'EMEA', 'Switzerland': 'EMEA', 'Sweden': 'EMEA',
      'Norway': 'EMEA', 'Denmark': 'EMEA', 'Finland': 'EMEA', 'Belgium': 'EMEA', 'Austria': 'EMEA',
      'Ireland': 'EMEA', 'Poland': 'EMEA', 'Portugal': 'EMEA', 'Czech Republic': 'EMEA',
      'South Africa': 'EMEA', 'Nigeria': 'EMEA', 'Kenya': 'EMEA', 'Egypt': 'EMEA',
      'Israel': 'EMEA', 'UAE': 'EMEA', 'United Arab Emirates': 'EMEA', 'Saudi Arabia': 'EMEA',
      'Qatar': 'EMEA', 'Kuwait': 'EMEA', 'Bahrain': 'EMEA', 'Turkey': 'EMEA',
      'Russia': 'EMEA', 'Ukraine': 'EMEA',
      'India': 'APAC', 'China': 'APAC', 'Japan': 'APAC', 'Australia': 'APAC',
      'South Korea': 'APAC', 'Singapore': 'APAC', 'Hong Kong': 'APAC', 'Taiwan': 'APAC',
      'Malaysia': 'APAC', 'Indonesia': 'APAC', 'Thailand': 'APAC', 'Vietnam': 'APAC',
      'Philippines': 'APAC', 'New Zealand': 'APAC', 'Bangladesh': 'APAC', 'Pakistan': 'APAC',
      'Sri Lanka': 'APAC',
    };
    const getRegion = (country: string | null) => {
      if (!country) return 'Unknown';
      if (REGION_MAP[country]) return REGION_MAP[country];
      const lower = country.toLowerCase();
      for (const [key, region] of Object.entries(REGION_MAP)) {
        if (key.toLowerCase() === lower) return region;
      }
      return 'Other';
    };

    // Apply region filter if provided
    let allOpps = opps || [];
    const activeRegion = regionFilter && regionFilter !== 'all' ? regionFilter : null;
    if (activeRegion) {
      allOpps = allOpps.filter(o => getRegion(o.country) === activeRegion);
    }

    // Compute grounded stats
    // Only these stages are truly active pipeline deals
    const ACTIVE_STAGES = ['P0', 'P1', 'P2', 'P3', 'P3.1', 'P4'];
    const activeOpps = allOpps.filter(o => ACTIVE_STAGES.includes(o.stage || ''));
    const totalTCV = activeOpps.reduce((s, o) => s + (Number(o.overall_tcv) || 0), 0);
    const wonDeals = allOpps.filter(o => o.stage === 'P5' || (o.sales_stage && o.sales_stage.includes('Won')));
    const lostDeals = allOpps.filter(o => o.sales_stage?.includes('Lost') || o.stage === 'Lost');
    const closedDeals = wonDeals.length + lostDeals.length;
    const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals * 100).toFixed(1) : '0';
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

    const regionNote = activeRegion ? `\n**IMPORTANT: Data is FILTERED to ${activeRegion} region only. All numbers below reflect ONLY ${activeRegion} deals.**\n` : '';

    const dataContext = `
## ACTUAL PIPELINE DATA (Use ONLY these numbers — never make up data)
NOTE: All TCV and ACV values are already in millions (M). Do NOT divide again.${regionNote}

### Stage-to-Status Mapping (CRITICAL — use this to classify deals):
- P-1 = Closed/Lost (INACTIVE — do NOT count as active pipeline)
- P-2 = Aborted-Opportunity (INACTIVE — do NOT count as active pipeline)
- P-3 = Hibernate/On Hold (INACTIVE — do NOT count as active pipeline)
- P0 = Opportunity Identified (ACTIVE)
- P1 = Opportunity Defined & Qualified (ACTIVE)
- P2 = RFP Responded / Proposal Submitted (ACTIVE)
- P3 = Technically Shortlisted (ACTIVE)
- P3.1 = Technically Shortlisted & Strong Upside (ACTIVE)
- P4 = Commit / Verbal Confirmation (ACTIVE)
- P5 = Closed/Won (INACTIVE — already won)

- Total opportunities: ${allOpps.length}
- Active deals (P0-P4 only): ${activeOpps.length}
- Active pipeline TCV: $${totalTCV.toFixed(2)}M
- Won deals (P5): ${wonDeals.length}
- Lost deals (P-1): ${lostDeals.length}
- Aborted deals (P-2): ${allOpps.filter(o => o.stage === 'P-2').length}
- Hibernated deals (P-3): ${allOpps.filter(o => o.stage === 'P-3').length}
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

    // Fetch entity-specific data when viewing a detail page
    let entityContext = '';
    if (entityType === 'opportunity' && entityId) {
      const { data: opp } = await sb
        .from("opportunities")
        .select("*")
        .eq("id", entityId)
        .single();
      if (opp) {
        entityContext = `\n### CURRENT OPPORTUNITY (The user is viewing this specific deal — answer about THIS deal)\n` +
          `- Name: ${opp.opportunity_name}\n` +
          `- Account: ${opp.account_name || 'N/A'}\n` +
          `- Stage: ${opp.stage} (Sales Stage: ${opp.sales_stage || 'N/A'})\n` +
          `- TCV: $${(opp.overall_tcv || 0).toFixed(2)}M\n` +
          `- Booking Value TCV: $${(opp.overall_booking_value_tcv || 0).toFixed(2)}M\n` +
          `- Win Probability: ${opp.win_probability || 0}%\n` +
          `- Expected Close: ${opp.expected_close_date || 'N/A'}\n` +
          `- Owner: ${opp.opportunity_owner || 'N/A'}\n` +
          `- Bid Manager: ${opp.bid_manager || 'N/A'}\n` +
          `- Industry: ${opp.primary_industry || 'N/A'} / ${opp.secondary_industry || 'N/A'}\n` +
          `- Country: ${opp.country || 'N/A'}, City: ${opp.city || 'N/A'}\n` +
          `- SBU: ${opp.account_sbu || 'N/A'}, IBG: ${opp.account_ibg || 'N/A'}, IBU: ${opp.account_ibu || 'N/A'}\n` +
          `- Category: ${opp.opportunity_category || 'N/A'}\n` +
          `- Type of Business: ${opp.type_of_business || 'N/A'}\n` +
          `- Competitor: ${opp.competitor_name || 'N/A'}\n` +
          `- Pricing Model: ${opp.pricing_model || 'N/A'}\n` +
          `- EBITDA%: ${opp.ebitda_percent || 'N/A'}\n` +
          `- Contract Tenure: ${opp.contract_tenure_months || 'N/A'} months\n` +
          `- Total Resources: ${opp.total_resources || 'N/A'}\n` +
          `- ACV FY23-24: $${opp.acv_fy_23_24 || 0}M, FY24-25: $${opp.acv_fy_24_25 || 0}M, FY25-26: $${opp.acv_fy_25_26 || 0}M, FY26-27: $${opp.acv_fy_26_27 || 0}M, FY27-28: $${opp.acv_fy_27_28 || 0}M\n` +
          `- Created: ${opp.opportunity_created_date || 'N/A'}\n` +
          `- Reason for Win: ${opp.reason_for_win || 'N/A'}\n` +
          `- Reason for Loss: ${opp.reason_for_loss || 'N/A'}\n` +
          `- Abort Reason: ${opp.abort_reason || 'N/A'}\n`;
      }
    } else if (entityType === 'account' && entityId) {
      // entityId here is the account_name (URL-encoded)
      const accountName = decodeURIComponent(entityId);
      const { data: accOpps } = await sb
        .from("opportunities")
        .select("opportunity_name, stage, sales_stage, overall_tcv, win_probability, expected_close_date, primary_industry, bid_manager, opportunity_owner")
        .eq("account_name", accountName)
        .order("overall_tcv", { ascending: false, nullsFirst: false })
        .limit(50);
      if (accOpps && accOpps.length > 0) {
        const accActive = accOpps.filter(o => ['P0','P1','P2','P3','P3.1','P4'].includes(o.stage || ''));
        const accTCV = accActive.reduce((s, o) => s + (Number(o.overall_tcv) || 0), 0);
        entityContext = `\n### CURRENT ACCOUNT: ${accountName}\n` +
          `- Total opportunities: ${accOpps.length}\n` +
          `- Active deals: ${accActive.length}, Active TCV: $${accTCV.toFixed(2)}M\n` +
          `- Deals:\n${accOpps.map(o => `  - ${o.opportunity_name} | Stage: ${o.stage} | TCV: $${(o.overall_tcv || 0).toFixed(2)}M | Win%: ${o.win_probability || 0} | Close: ${o.expected_close_date || 'N/A'}`).join('\n')}\n`;
      }
    }

    const systemPrompt = `You are an AI sales assistant for Pipeline CRM. You have access to REAL pipeline data below. 

CRITICAL RULES:
1. ONLY use the numbers and data provided below. NEVER invent, estimate, or hallucinate any numbers.
2. If asked about something not in the data, say "I don't have that specific data available."
3. Always cite actual numbers from the data when answering.
4. Be concise and actionable (use bullet points, tables when helpful).
5. Reference specific deal names, stages, and metrics from the actual data.

Current page context: ${context || 'General CRM usage'}

${dataContext}${entityContext}${extraContext}`;

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
