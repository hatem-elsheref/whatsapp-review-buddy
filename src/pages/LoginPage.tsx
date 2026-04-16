import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '';

interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    role?: string;
    status?: string;
  };
  token: string;
  expires_at?: string | null;
}

type LoginErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/register' : '/login';
      const body = isRegister 
        ? { name, email, password }
        : { email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as LoginResponse | LoginErrorResponse;

      if (!response.ok) {
        const message = ('message' in data && data.message) || ('errors' in data && data.errors?.email?.[0]) || 'Authentication failed';
        setErrorMessage(message);
        setLoading(false);
        return;
      }

      setErrorMessage('');
      
      if (isRegister) {
        toast.success('Account created! Your account is pending approval.');
        navigate('/pending-verification', { state: { email, name } });
      } else {
        const okData = data as LoginResponse;
        localStorage.setItem('auth_token', okData.token);
        localStorage.setItem('user', JSON.stringify(okData.user));
        if (okData.expires_at) localStorage.setItem('auth_expires_at', okData.expires_at);
        toast.success('Logged in!');
        navigate('/');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const appName = import.meta.env.VITE_APP_NAME || 'App Review';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{appName}</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                placeholder="••••••••"
                required
                minLength={isRegister ? 8 : undefined}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setErrorMessage(''); }}
              className="text-sm text-primary hover:underline"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;