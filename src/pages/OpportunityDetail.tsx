import { useParams, Link } from 'react-router-dom';
import { useOpportunity, useUpdateOpportunity } from '@/hooks/useOpportunities';
import { useGateApprovals } from '@/hooks/useGates';
import { formatCurrency, formatDate, getStageColor, formatPercent, getStageName } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, DollarSign, Globe, Calendar, FileText, ShieldCheck, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RequestGateDialog from '@/components/RequestGateDialog';
import GateApprovalCard from '@/components/GateApprovalCard';

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: opp, isLoading } = useOpportunity(id!);
  const { data: gates } = useGateApprovals(id);
  const _updateOpp = useUpdateOpportunity();

  if (isLoading || !opp) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/opportunities" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Opportunities
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{opp.opportunity_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={getStageColor(opp.stage)}>{opp.stage} - {getStageName(opp.stage)}</Badge>
            <span className="text-sm text-muted-foreground">ID: {opp.opportunity_id}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <RequestGateDialog opportunityId={opp.id} opportunityName={opp.opportunity_name} currentStage={opp.stage} />
          <Button variant="outline" size="sm">Edit</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">TCV</p>
          <p className="text-xl font-bold">{formatCurrency(opp.overall_tcv)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Win Probability</p>
          <p className="text-xl font-bold">{formatPercent(opp.win_probability)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">EBITDA%</p>
          <p className="text-xl font-bold">{formatPercent(opp.ebitda_percent)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Resources</p>
          <p className="text-xl font-bold">{opp.total_resources || 0}</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="account">Account Info</TabsTrigger>
          <TabsTrigger value="gates">
            Gates
            {gates?.filter(g => g.status === 'pending').length ? (
              <Badge variant="destructive" className="ml-1.5 h-5 min-w-[20px] text-xs">
                {gates.filter(g => g.status === 'pending').length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Deal Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Opportunity Owner', opp.opportunity_owner],
                  ['Bid Manager', opp.bid_manager],
                  ['Sales Specialist', opp.sales_specialist_name],
                  ['Type of Business', opp.metadata?.type_of_business],
                  ['Category', opp.opportunity_category],
                  ['Pricing Model', opp.pricing_model],
                  ['Sales Channel', opp.metadata?.sales_channel],
                  ['Competitor', opp.competitor_name],
                  ['Currency', opp.currency],
                  ['Quarter', opp.quarter],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{(val as string) || '-'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Key Dates</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Created', opp.opportunity_created_date],
                  ['Expected Close', opp.expected_close_date],
                  ['Bid Submission', opp.metadata?.bid_submission_date],
                  ['Billing Start', opp.billing_start_date],
                  ['Billing End', opp.billing_end_date],
                  ['Last Modified', opp.updated_at],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{formatDate(val as string)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> Value Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Overall TCV', formatCurrency(opp.overall_tcv)],
                  ['Booking Value TCV', formatCurrency(opp.overall_booking_value_tcv)],
                  ['Contract Tenure', `${opp.contract_tenure_months || 0} months`],
                  ['EBITDA%', formatPercent(opp.ebitda_percent)],
                  ['Total Resources', String(opp.total_resources || 0)],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-bold">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Annual Contract Values</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['FY 23-24', opp.acv_fy_23_24],
                  ['FY 24-25', opp.acv_fy_24_25],
                  ['FY 25-26', opp.acv_fy_25_26],
                  ['FY 26-27', opp.acv_fy_26_27],
                  ['FY 27-28', opp.acv_fy_27_28],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-bold">{formatCurrency(val as number)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Account Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Account Name', opp.account_name],
                  ['Account Owner', opp.account_owner],
                  ['Account Category', opp.account_category],
                  ['Account SBU', opp.account_sbu],
                  ['Account IBG', opp.account_ibg],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{(val as string) || '-'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Location & Industry</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['City', opp.city],
                  ['Country', opp.country],
                  ['Primary Industry', opp.primary_industry],
                  ['Secondary Industry', opp.secondary_industry],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{(val as string) || '-'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gates" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{gates?.length || 0} gate requests</p>
            <RequestGateDialog opportunityId={opp.id} opportunityName={opp.opportunity_name} currentStage={opp.stage} />
          </div>
          {!gates?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No gate approvals requested yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {gates.map(gate => <GateApprovalCard key={gate.id} gate={gate} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Activity timeline coming soon — comments, stage changes, and gate approvals will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
