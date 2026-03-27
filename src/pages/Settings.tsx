import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your CRM configuration</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <SettingsIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Settings</p>
          <p className="text-sm mt-1">User management, role assignments, and notification preferences coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
