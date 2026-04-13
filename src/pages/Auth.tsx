import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (error: any) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, fullName, department);
      toast({ title: 'Account created', description: 'Check your email to verify your account.' });
    } catch (error: any) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      toast({ title: 'Reset email sent', description: 'Check your email for a password reset link.' });
      setShowForgot(false);
    } catch (error: any) {
      toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,25%,8%)] via-[hsl(217,40%,14%)] to-[hsl(220,30%,6%)]" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(217,91%,60%,0.15)] rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[hsl(280,65%,60%,0.12)] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[hsl(199,89%,48%,0.08)] rounded-full blur-[140px]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(0,0%,100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0,0%,100%) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Floating glass card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo area */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[hsl(217,91%,60%,0.4)] rounded-2xl blur-xl" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(217,91%,50%)] shadow-lg shadow-[hsl(217,91%,60%,0.3)]">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/1280px-Salesforce.com_logo.svg.png" alt="Salesforce" className="h-10 w-10 object-contain" />
            </div>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">Salesforce Pipeline Tracker</h1>
          <p className="mt-2 text-sm text-[hsl(215,20%,60%)]">AI-powered sales pipeline management</p>
        </div>

        {/* Glass card */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/20">
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

          <div className="relative p-8">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-white/[0.06] p-1 mb-7">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  !isSignUp
                    ? 'bg-[hsl(217,91%,60%)] text-white shadow-lg shadow-[hsl(217,91%,60%,0.3)]'
                    : 'text-[hsl(215,20%,55%)] hover:text-white/80'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isSignUp
                    ? 'bg-[hsl(217,91%,60%)] text-white shadow-lg shadow-[hsl(217,91%,60%,0.3)]'
                    : 'text-[hsl(215,20%,55%)] hover:text-white/80'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
              {isSignUp && (
                <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-medium text-[hsl(215,20%,55%)] uppercase tracking-wider">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-[hsl(215,20%,35%)] focus:border-[hsl(217,91%,60%,0.5)] focus:ring-1 focus:ring-[hsl(217,91%,60%,0.3)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-xs font-medium text-[hsl(215,20%,55%)] uppercase tracking-wider">Role</Label>
                  <Select value={department} onValueChange={setDepartment} required>
                    <SelectTrigger className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-white focus:border-[hsl(217,91%,60%,0.5)] focus:ring-1 focus:ring-[hsl(217,91%,60%,0.3)]">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pre-Sales">Pre-Sales</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Practice Lead">Practice Lead</SelectItem>
                      <SelectItem value="Alliances">Alliances</SelectItem>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-[hsl(215,20%,55%)] uppercase tracking-wider">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-[hsl(215,20%,35%)] focus:border-[hsl(217,91%,60%,0.5)] focus:ring-1 focus:ring-[hsl(217,91%,60%,0.3)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-[hsl(215,20%,55%)] uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isSignUp ? 'Min 6 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isSignUp ? 6 : undefined}
                    className="h-12 rounded-xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-[hsl(215,20%,35%)] focus:border-[hsl(217,91%,60%,0.5)] focus:ring-1 focus:ring-[hsl(217,91%,60%,0.3)] pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,20%,45%)] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[hsl(217,91%,55%)] to-[hsl(217,91%,65%)] hover:from-[hsl(217,91%,50%)] hover:to-[hsl(217,91%,60%)] text-white font-semibold shadow-lg shadow-[hsl(217,91%,60%,0.25)] transition-all duration-300 hover:shadow-xl hover:shadow-[hsl(217,91%,60%,0.35)] hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom text */}
        <p className="mt-6 text-center text-xs text-[hsl(215,20%,40%)]">
          Enterprise-grade security • SSO ready • SOC 2 compliant
        </p>
      </div>
    </div>
  );
}
