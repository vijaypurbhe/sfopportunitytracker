import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AIInsights() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
        <p className="text-sm text-muted-foreground">AI-powered analysis of your pipeline</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">AI Insights Coming Soon</p>
          <p className="text-sm mt-1">Import your pipeline data first, then AI will analyze win probabilities, risk alerts, and next best actions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
