import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const schema = z.object({
  opportunity_name: z.string().trim().min(1, 'Required').max(300),
  account_name: z.string().trim().min(1, 'Required').max(300),
  opportunity_owner: z.string().trim().min(1, 'Required').max(200),
  stage: z.string().min(1, 'Required'),
  sales_stage: z.string().max(200).optional(),
  win_probability: z.coerce.number().min(0).max(100).optional(),
  overall_tcv: z.coerce.number().min(0).optional(),
  overall_booking_value_tcv: z.coerce.number().min(0).optional(),
  expected_close_date: z.string().optional(),
  primary_industry: z.string().max(200).optional(),
  secondary_industry: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  account_sbu: z.string().max(100).optional(),
  account_ibg: z.string().max(100).optional(),
  bid_manager: z.string().max(200).optional(),
  opportunity_category: z.string().max(200).optional(),
  pricing_model: z.string().max(200).optional(),
  competitor_name: z.string().max(300).optional(),
  currency: z.string().max(10).optional(),
  contract_tenure_months: z.coerce.number().min(0).optional(),
  total_resources: z.coerce.number().min(0).optional(),
  ebitda_percent: z.coerce.number().optional(),
  account_owner: z.string().max(200).optional(),
  account_category: z.string().max(200).optional(),
  sales_specialist_name: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateOpportunityDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      opportunity_name: '',
      account_name: '',
      opportunity_owner: '',
      stage: 'P1',
      win_probability: 0,
      overall_tcv: 0,
      currency: 'USD',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          opportunity_name: values.opportunity_name,
          account_name: values.account_name,
          opportunity_owner: values.opportunity_owner,
          stage: values.stage,
          sales_stage: values.sales_stage || null,
          win_probability: values.win_probability ?? 0,
          overall_tcv: values.overall_tcv ?? 0,
          overall_booking_value_tcv: values.overall_booking_value_tcv ?? null,
          expected_close_date: values.expected_close_date || null,
          primary_industry: values.primary_industry || null,
          secondary_industry: values.secondary_industry || null,
          country: values.country || null,
          city: values.city || null,
          account_sbu: values.account_sbu || null,
          account_ibg: values.account_ibg || null,
          bid_manager: values.bid_manager || null,
          opportunity_category: values.opportunity_category || null,
          pricing_model: values.pricing_model || null,
          competitor_name: values.competitor_name || null,
          currency: values.currency || 'USD',
          contract_tenure_months: values.contract_tenure_months ?? null,
          total_resources: values.total_resources ?? null,
          ebitda_percent: values.ebitda_percent ?? null,
          account_owner: values.account_owner || null,
          account_category: values.account_category || null,
          sales_specialist_name: values.sales_specialist_name || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Opportunity created successfully');
      form.reset();
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error('Failed to create opportunity: ' + err.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Opportunity</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Opportunity</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
              {/* Required fields */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required Information</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="opportunity_name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Opportunity Name *</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Acme Corp - Digital Transformation" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="account_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Acme Corp" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="opportunity_owner" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opportunity Owner *</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. John Smith" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="P1">P1 - Opportunity Defined</SelectItem>
                        <SelectItem value="P2">P2 - Solution Proposed</SelectItem>
                        <SelectItem value="P3">P3 - Technically Shortlisted</SelectItem>
                        <SelectItem value="P4">P4 - Commit/Verbal</SelectItem>
                        <SelectItem value="P5">P5 - Closed/Won</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="win_probability" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Win Probability (%)</FormLabel>
                    <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Financial */}
              <div className="space-y-1 pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Details</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="overall_tcv" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall TCV (M)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="overall_booking_value_tcv" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Value TCV (M)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ebitda_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>EBITDA %</FormLabel>
                    <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl><Input {...field} placeholder="USD" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pricing_model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing Model</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. T&M, Fixed Price" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contract_tenure_months" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Tenure (months)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Account & Industry */}
              <div className="space-y-1 pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account & Industry</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="primary_industry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Industry</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Banking" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="secondary_industry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Industry</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="account_sbu" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account SBU</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="account_ibg" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account IBG</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="account_owner" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Owner</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="account_category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Category</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Deal Details */}
              <div className="space-y-1 pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deal Details</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="expected_close_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="opportunity_category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opportunity Category</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. New, Renewal" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bid_manager" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bid Manager</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sales_specialist_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Specialist</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="competitor_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competitor</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="total_resources" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Resources</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sales_stage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Stage</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Qualified" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-2 pt-4 pb-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Creating...' : 'Create Opportunity'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
