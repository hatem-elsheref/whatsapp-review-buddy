import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '';

const PendingVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, name } = (location.state as { email?: string; name?: string }) || {};

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }

    const checkApproval = async () => {
      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ email, password: 'dummy-password-to-check' }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          toast.success('Your account has been approved! Welcome back!');
          navigate('/');
        }
      } catch {
        // Still pending - do nothing
      }
    };

    const interval = setInterval(checkApproval, 10000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold">Pending Verification</h1>
          <p className="text-muted-foreground mt-2">Your account is under review</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Thank you for registering, <span className="font-medium text-foreground">{name || email}</span>!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your account is currently pending approval by an administrator.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              You will be able to sign in once your account has been approved.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Waiting for approval...</span>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingVerificationPage;