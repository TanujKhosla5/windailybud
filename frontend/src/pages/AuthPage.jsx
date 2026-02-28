import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Activity, CheckSquare, Zap } from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.email || !registerData.password || !registerData.name) {
      toast.error('Please fill in all fields');
      return;
    }
    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(registerData.email, registerData.password, registerData.name);
      toast.success('Account created! Welcome to WindailyBud');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1649182784901-48f5f2d40ecc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZGFyayUyMGFic3RyYWN0JTIwYXJjaGl0ZWN0dXJlJTIwZ2VvbWV0cmljfGVufDB8fHx8MTc3MjI5Nzg0N3ww&ixlib=rb-4.1.0&q=85')` 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/90 via-zinc-950/70 to-zinc-950/90" />
        <div className="relative z-10 flex flex-col justify-center p-12">
          <h1 className="text-5xl font-bold text-zinc-100 mb-4 tracking-tight">WindailyBud</h1>
          <p className="text-xl text-zinc-400 mb-12 max-w-md leading-relaxed">
            Your personal productivity and wellness companion. Master your tasks, build lasting habits.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">Eisenhower Matrix</h3>
                <p className="text-sm text-zinc-500">Prioritize tasks by urgency and importance</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">Daily Habits</h3>
                <p className="text-sm text-zinc-500">Track 7 wellness categories with analytics</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">Quick Tasks</h3>
                <p className="text-sm text-zinc-500">Capture and complete 1-minute tasks fast</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">WindailyBud</h1>
            <p className="text-zinc-500">Productivity meets wellness</p>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <Tabs defaultValue="login" className="w-full">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-zinc-700" data-testid="login-tab">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-zinc-700" data-testid="register-tab">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent>
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-zinc-300">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-600"
                        data-testid="login-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-zinc-300">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-600"
                        data-testid="login-password-input"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                      disabled={loading}
                      data-testid="login-submit-btn"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="mt-0">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-zinc-300">Name</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-600"
                        data-testid="register-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-zinc-300">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-600"
                        data-testid="register-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-zinc-300">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-600"
                        data-testid="register-password-input"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                      disabled={loading}
                      data-testid="register-submit-btn"
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
          
          <p className="text-center text-xs text-zinc-600 mt-6">
            By continuing, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
