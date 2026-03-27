import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { opportunities, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "pipeline_summary") {
      systemPrompt = `You are a senior sales analytics advisor for an enterprise IT services company. Analyze pipeline data and provide actionable insights. Be specific with numbers and percentages. Format your response as JSON with this structure:
{
  "summary": "2-3 sentence executive summary",
  "risk_alerts": [{"title": "...", "description": "...", "severity": "high|medium|low", "opportunity_names": ["..."]}],
  "win_predictions": [{"opportunity_name": "...", "predicted_win_rate": number, "reasoning": "..."}],
  "recommendations": [{"title": "...", "description": "...", "priority": "high|medium|low"}],
  "stage_analysis": {"stage": "insights about stage distribution"}
}`;
      userPrompt = `Analyze this pipeline data (${opportunities.length} opportunities) and provide insights:\n\n${JSON.stringify(opportunities.slice(0, 50), null, 1)}`;
    } else if (type === "opportunity_analysis") {
      systemPrompt = `You are a deal strategy advisor. Analyze this specific opportunity and provide a detailed assessment. Format as JSON:
{
  "win_likelihood": number,
  "risk_factors": [{"factor": "...", "impact": "high|medium|low", "mitigation": "..."}],
  "strengths": ["..."],
  "next_actions": [{"action": "...", "priority": "high|medium|low", "timeline": "..."}],
  "competitive_position": "...",
  "deal_summary": "..."
}`;
      userPrompt = `Analyze this opportunity:\n\n${JSON.stringify(opportunities, null, 2)}`;
    } else {
      throw new Error("Invalid type. Use 'pipeline_summary' or 'opportunity_analysis'");
    }

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
          { role: "user", content: userPrompt },
        ],
        stream: false,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
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
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
