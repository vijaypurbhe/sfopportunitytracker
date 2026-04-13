import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
      navigate('/');
    } catch (error: any) {
      toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(217,40%,14%)] to-[hsl(220,30%,6%)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(217,91%,60%,0.15)] rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[hsl(280,65%,60%,0.12)] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[hsl(217,91%,60%,0.4)] rounded-2xl blur-xl" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(217,91%,50%)] shadow-lg shadow-[hsl(217,91%,60%,0.3)]">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">Set New Password</h1>
          <p className="mt-2 text-sm text-[hsl(215,20%,60%)]">Enter your new password below</p>
        </div>

        <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/20">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
          <div className="relative p-8">
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-xs font-medium text-[hsl(215,20%,55%)] uppercase tracking-wider">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-[hsl(215,20%,35%)] focus:border-[hsl(217,91%,60%,0.5)] focus:ring-1 focus:ring-[hsl(217,91%,60%,0.3)] pr-11"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,20%,45%)] hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs font-medium text-[hsl(215,20%,55%)] uppercase tracking-wider">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-[hsl(215,20%,35%)] focus:border-[hsl(217,91%,60%,0.5)] focus:ring-1 focus:ring-[hsl(217,91%,60%,0.3)]"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[hsl(217,91%,55%)] to-[hsl(217,91%,65%)] hover:from-[hsl(217,91%,50%)] hover:to-[hsl(217,91%,60%)] text-white font-semibold shadow-lg shadow-[hsl(217,91%,60%,0.25)] transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Update Password
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
