import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Loader2, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';
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

const departments = ['Pre-Sales', 'Sales', 'Delivery', 'Practice Lead', 'Alliances', 'Administrator'];

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reset password dialog state
  const [resetTarget, setResetTarget] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isAdmin = user?.email === 'vijaypralhad.purbhe@techmahindra.com';

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    (async () => {
      const { data, error: err } = await supabase.rpc('get_all_users_admin');
      if (err) { setError(err.message); }
      else { setUsers((data as UserRecord[]) || []); }
      setLoading(false);
    })();
  }, [isAdmin]);

  const openResetDialog = (u: UserRecord) => {
    setResetTarget(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (newPassword.length < 6) {
      toast({ title: 'Too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setResetting(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: resetTarget.user_id, new_password: newPassword },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Password updated', description: `Password for ${resetTarget.email} has been changed.` });
      setResetTarget(null);
    } catch (err: any) {
      toast({ title: 'Reset failed', description: err.message || 'Failed to reset password.', variant: 'destructive' });
    } finally {
      setResetting(false);
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
    <>
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
                      <Select
                        value={u.department || ''}
                        onValueChange={(val) => handleRoleChange(u, val)}
                      >
                        <SelectTrigger className="h-7 w-[140px] text-xs">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept} className="text-xs">
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openResetDialog(u)}
                        className="h-7 text-xs"
                      >
                        <KeyRound className="h-3 w-3 mr-1" />Reset Password
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

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) setResetTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetTarget?.full_name || resetTarget?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetting || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
