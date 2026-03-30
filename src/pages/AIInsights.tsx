import { useState, useMemo } from 'react';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useRegionFilter } from '@/hooks/useRegionFilter';
import { filterByRegion } from '@/lib/regions';
import { isActiveStage } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, RefreshCw, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RegionFilter from '@/components/RegionFilter';

interface PipelineInsights {
  summary: string;
  risk_alerts: Array<{ title: string; description: string; severity: string; opportunity_names?: string[] }>;
  win_predictions: Array<{ opportunity_name: string; predicted_win_rate: number; reasoning: string }>;
  recommendations: Array<{ title: string; description: string; priority: string }>;
  stage_analysis?: Record<string, string>;
}

export default function AIInsights() {
  const { data: opportunities, isLoading: oppsLoading } = useOpportunities();
  const { regionFilter, setRegionFilter } = useRegionFilter();
  const [insights, setInsights] = useState<PipelineInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOpps = useMemo(() => {
    if (!opportunities) return [];
    return filterByRegion(opportunities, regionFilter).filter(o => isActiveStage(o.stage, o.sales_stage));
  }, [opportunities, regionFilter]);

  const analyzeHandler = async () => {
    if (!activeOpps.length) {
      toast.error('No active opportunities to analyze');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const trimmedOpps = opportunities.map(o => ({
        name: o.opportunity_name,
        account: o.account_name,
        stage: o.stage,
        tcv: o.overall_tcv,
        win_prob: o.win_probability,
        ebitda: o.ebitda_percent,
        industry: o.primary_industry,
        owner: o.opportunity_owner,
        close_date: o.expected_close_date,
        country: o.country,
        resources: o.total_resources,
        competitor: o.competitor_name,
        category: o.opportunity_category,
      }));

      const { data, error: fnError } = await supabase.functions.invoke('ai-insights', {
        body: { opportunities: trimmedOpps, type: 'pipeline_summary' },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setInsights(data);
    } catch (e: any) {
      const msg = e?.message || 'Failed to get AI insights';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (s: string) => {
    if (s === 'high') return 'bg-red-100 text-red-800';
    if (s === 'medium') return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  };

  const priorityColor = (p: string) => {
    if (p === 'high') return 'border-l-red-500';
    if (p === 'medium') return 'border-l-amber-500';
    return 'border-l-blue-500';
  };

  if (oppsLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">AI Insights</h1>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
          <p className="text-sm text-muted-foreground">AI-powered analysis of your pipeline ({opportunities?.length || 0} opportunities)</p>
        </div>
        <Button onClick={analyzeHandler} disabled={loading || !opportunities?.length}>
          {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {loading ? 'Analyzing...' : insights ? 'Refresh Analysis' : 'Analyze Pipeline'}
        </Button>
      </div>

      {!insights && !loading && !error && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">Ready to Analyze Your Pipeline</p>
            <p className="text-sm mt-2 max-w-md mx-auto">Click "Analyze Pipeline" to get AI-powered insights including risk alerts, win predictions, and strategic recommendations.</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {insights && (
        <>
          {/* Executive Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Executive Summary</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed">{insights.summary}</p></CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Alerts */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Risk Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {insights.risk_alerts?.length ? insights.risk_alerts.map((alert, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={severityColor(alert.severity)}>{alert.severity}</Badge>
                      <span className="font-medium text-sm">{alert.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                    {alert.opportunity_names?.length ? (
                      <p className="text-xs text-muted-foreground mt-1">Affected: {alert.opportunity_names.join(', ')}</p>
                    ) : null}
                  </div>
                )) : <p className="text-sm text-muted-foreground">No risk alerts identified</p>}
              </CardContent>
            </Card>

            {/* Win Predictions */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /> Win Predictions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {insights.win_predictions?.length ? insights.win_predictions.map((pred, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">{pred.opportunity_name}</span>
                      <Badge variant={pred.predicted_win_rate >= 60 ? 'default' : 'secondary'}>
                        {pred.predicted_win_rate}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{pred.reasoning}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No predictions available</p>}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {insights.recommendations?.length ? insights.recommendations.map((rec, i) => (
                <div key={i} className={`border-l-4 ${priorityColor(rec.priority)} pl-3 py-2`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{rec.title}</span>
                    <Badge variant="outline" className="text-xs">{rec.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No recommendations available</p>}
            </CardContent>
          </Card>

          {/* Stage Analysis */}
          {insights.stage_analysis && (
            <Card>
              <CardHeader><CardTitle className="text-base">Stage Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(insights.stage_analysis).map(([stage, analysis]) => (
                  <div key={stage} className="border rounded p-3">
                    <Badge variant="outline" className="mb-1">{stage}</Badge>
                    <p className="text-xs text-muted-foreground">{analysis}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
