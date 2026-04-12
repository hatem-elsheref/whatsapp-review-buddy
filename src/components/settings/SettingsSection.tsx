import { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const configFields = [
  { label: 'Phone Number ID', value: '123456789012345', masked: false },
  { label: 'WABA ID', value: '987654321098765', masked: false },
  { label: 'App ID', value: '1234567890', masked: false },
  { label: 'Webhook URL', value: 'https://api.example.com/webhook/whatsapp', masked: false },
  { label: 'Verify Token', value: 'wa_verify_tk_abc123xyz', masked: true },
  { label: 'Access Token', value: 'EAABsbCS1Zxyz...LONG_TOKEN_VALUE', masked: true },
];

const healthChecks = [
  'Webhook URL reachable',
  'Verify token valid',
  'messages field subscribed',
  'WABA subscribed to app',
];

const SettingsSection = () => {
  const [showMasked, setShowMasked] = useState<Record<string, boolean>>({});
  const [healthChecked, setHealthChecked] = useState(false);
  const [checking, setChecking] = useState(false);

  const toggleMask = (label: string) => setShowMasked(prev => ({ ...prev, [label]: !prev[label] }));

  const runHealthCheck = () => {
    setChecking(true);
    setHealthChecked(false);
    setTimeout(() => {
      setChecking(false);
      setHealthChecked(true);
      toast.success('Webhook health check passed');
    }, 1500);
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="font-semibold mb-6">Settings</h2>

      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-medium text-sm mb-4">API Configuration</h3>
          <div className="space-y-3">
            {configFields.map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground w-40">{f.label}</label>
                <div className="flex items-center gap-2 flex-1">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm flex-1 font-mono">
                    {f.masked && !showMasked[f.label] ? '••••••••••••••••' : f.value}
                  </div>
                  {f.masked && (
                    <button onClick={() => toggleMask(f.label)} className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground">
                      {showMasked[f.label] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-medium text-sm mb-4">Webhook Health Check</h3>
          <button onClick={runHealthCheck} disabled={checking} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {checking ? 'Checking...' : 'Run Health Check'}
          </button>
          {healthChecked && (
            <div className="mt-4 space-y-2">
              {healthChecks.map(check => (
                <div key={check} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-badge-green" />
                  <span>{check}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
