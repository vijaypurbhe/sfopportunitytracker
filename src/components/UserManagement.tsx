import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Loader2, ShieldAlert, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UserRecord {
  user_id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  created_at: string;
}

const deptColors: Record<string, string> = {
  'Pre-Sales': 'bg-blue-100 text-blue-800',
  'Sales': 'bg-green-100 text-green-800',
  'Delivery': 'bg-purple-100 text-purple-800',
  'Practice Lead': 'bg-orange-100 text-orange-800',
  'Alliances': 'bg-pink-100 text-pink-800',
  'Administrator': 'bg-red-100 text-red-800',
};

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);

  const isAdmin = user?.email === 'vijaypralhad.purbhe@techmahindra.com';

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }

    (async () => {
      const { data, error: err } = await supabase.rpc('get_all_users_admin');
      if (err) {
        setError(err.message);
      } else {
        setUsers((data as UserRecord[]) || []);
      }
      setLoading(false);
    })();
  }, [isAdmin]);

  const handleResetPassword = async (targetUserId: string, email: string) => {
    setResettingId(targetUserId);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: targetUserId },
      });

      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Password reset sent',
        description: `A reset link has been sent to ${email}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Reset failed',
        description: err.message || 'Failed to send password reset.',
        variant: 'destructive',
      });
    } finally {
      setResettingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Access Restricted</p>
          <p className="text-sm mt-1">User management is only available to administrators.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          <p className="font-medium">Failed to load users</p>
          <p className="text-sm mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-primary" />
          User Management
          <Badge variant="secondary" className="ml-auto">{users.length} users</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email || '—'}</TableCell>
                  <TableCell>
                    {u.department ? (
                      <Badge className={deptColors[u.department] || 'bg-muted text-muted-foreground'} variant="secondary">
                        {u.department}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(u.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resettingId === u.user_id}
                      onClick={() => handleResetPassword(u.user_id, u.email || '')}
                      className="h-7 text-xs"
                    >
                      {resettingId === u.user_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <><KeyRound className="h-3 w-3 mr-1" />Reset Password</>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No users registered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
