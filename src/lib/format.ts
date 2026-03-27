export function formatCurrency(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return '$0.00';
  if (Math.abs(value) >= 1) return `$${value.toFixed(decimals)}M`;
  if (Math.abs(value) >= 0.001) return `$${(value * 1000).toFixed(0)}K`;
  return `$${value.toFixed(decimals)}M`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '0';
  return new Intl.NumberFormat().format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '0%';
  return `${value}%`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// All known stages in order of pipeline progression
export const ALL_STAGES = ['P-1', 'P-2', 'P-3', 'P0', 'P1', 'P2', 'P3', 'P3.1', 'P4', 'P5'] as const;
export const ACTIVE_STAGES = ['P-1', 'P-2', 'P-3', 'P0', 'P1', 'P2', 'P3', 'P3.1', 'P4'] as const;

export function isActiveStage(stage: string | null | undefined, salesStage?: string | null): boolean {
  if (stage == null) return false;
  const lowerStage = stage.toLowerCase();
  const lowerSales = (salesStage || '').toLowerCase();
  // Exclude P5 (won), and any deal marked as won, lost, or aborted
  if (stage === 'P5' || lowerStage === 'lost' || lowerStage === 'aborted' || lowerStage === 'hibernate') return false;
  if (lowerSales.includes('won') || lowerSales.includes('lost') || lowerSales.includes('abort') || lowerSales.includes('hibernate')) return false;
  return true;
}

export function getStageColor(stage: string | null | undefined): string {
  switch (stage) {
    case 'P-1': return 'bg-slate-100 text-slate-800';
    case 'P-2': return 'bg-gray-100 text-gray-800';
    case 'P-3': return 'bg-zinc-100 text-zinc-800';
    case 'P0': return 'bg-sky-100 text-sky-800';
    case 'P1': return 'bg-blue-100 text-blue-800';
    case 'P2': return 'bg-amber-100 text-amber-800';
    case 'P3': return 'bg-purple-100 text-purple-800';
    case 'P3.1': return 'bg-violet-100 text-violet-800';
    case 'P4': return 'bg-emerald-100 text-emerald-800';
    case 'P5': return 'bg-green-100 text-green-800';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function getStageName(stage: string | null | undefined): string {
  switch (stage) {
    case 'P-1': return 'Lead Identified';
    case 'P-2': return 'Prospect Qualified';
    case 'P-3': return 'Initial Engagement';
    case 'P0': return 'Opportunity Created';
    case 'P1': return 'Opportunity Defined';
    case 'P2': return 'Solution Proposed';
    case 'P3': return 'Technically Shortlisted';
    case 'P3.1': return 'Commercial Review';
    case 'P4': return 'Commit/Verbal';
    case 'P5': return 'Closed/Won';
    default: return stage || 'Unknown';
  }
}
