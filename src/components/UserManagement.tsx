import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

interface UserRecord {
  user_id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  created_at: string;
}

const ADMIN_EMAIL = 'vijaypralhad.purbhe@techmahindra.com';

const deptColors: Record<string, string> = {
  'Pre-Sales': 'bg-blue-100 text-blue-800',
  'Sales': 'bg-green-100 text-green-800',
  'Delivery': 'bg-purple-100 text-purple-800',
  'Practice Lead': 'bg-orange-100 text-orange-800',
  'Alliances': 'bg-pink-100 text-pink-800',
};

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.email === ADMIN_EMAIL;

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
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
