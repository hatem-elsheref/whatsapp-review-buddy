import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, MetaSettings } from '@/lib/api';

interface SettingsData {
  phone_number_id: string;
  waba_id: string;
  app_id: string;
  app_secret: string;
  access_token: string;
  webhook_url: string;
  verify_token: string;
}

const SettingsSection = () => {
  const [settings, setSettings] = useState<SettingsData>({
    phone_number_id: '',
    waba_id: '',
    app_id: '',
    app_secret: '',
    access_token: '',
    webhook_url: '',
    verify_token: '',
  });
  const [showMasked, setShowMasked] = useState<Record<string, boolean>>({
    app_secret: false,
    access_token: false,
  });
  const [healthChecks, setHealthChecks] = useState<Record<string, any>>({});
  const [connectionInfo, setConnectionInfo] = useState<{ waba: any; phone: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get<{ data: MetaSettings | null }>('/settings');
      if (response.data) {
        setSettings({
          phone_number_id: response.data.phone_number_id || '',
          waba_id: response.data.waba_id || '',
          app_id: response.data.app_id || '',
          app_secret: response.data.app_secret || '',
          access_token: response.data.access_token || '',
          webhook_url: response.data.webhook_url || '',
          verify_token: response.data.verify_token || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        phone_number_id: settings.phone_number_id,
        waba_id: settings.waba_id,
        app_id: settings.app_id,
        app_secret: settings.app_secret || null,
        access_token: settings.access_token || null,
        webhook_url: settings.webhook_url,
        verify_token: settings.verify_token,
      };
      await api.post('/settings', dataToSave);
      toast.success('Settings saved successfully');
      await runHealthCheck();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const runHealthCheck = async () => {
    setChecking(true);
    setConnectionInfo(null);
    try {
      const response = await api.get<{ data: any }>('/settings/verify');
      setHealthChecks(response.data);
      if (response.data.ok) {
        setConnectionInfo({
          waba: response.data.waba,
          phone: response.data.phone,
        });
        toast.success('Connection test passed!');
      } else {
        toast.warning('Connection test failed - check your credentials');
      }
    } catch (error) {
      toast.error('Health check failed');
    } finally {
      setChecking(false);
    }
  };

  const toggleMask = (field: string) => setShowMasked(prev => ({ ...prev, [field]: !prev[field] }));

  const updateField = (field: keyof SettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const getWebhookUrl = async () => {
    try {
      const response = await api.get<{ webhook_url: string }>('/settings/webhook-url');
      return response.webhook_url;
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fields: { label: string; key: string; masked: boolean; placeholder?: string; description?: string }[] = [
    { label: 'Phone Number ID', key: 'phone_number_id', masked: false },
    { label: 'WABA ID', key: 'waba_id', masked: false },
    { label: 'App ID', key: 'app_id', masked: false, description: 'Meta App ID from developer portal' },
    { label: 'App Secret', key: 'app_secret', masked: true, placeholder: 'Enter app secret' },
    { label: 'Access Token', key: 'access_token', masked: true, placeholder: 'Enter access token' },
    { label: 'Webhook URL', key: 'webhook_url', masked: false, placeholder: 'https://yourdomain.com/api/webhook/whatsapp' },
    { label: 'Verify Token', key: 'verify_token', masked: false, placeholder: 'Enter verify token' },
  ];

  const checkItems = [
    { key: 'ok', label: 'API Connection' },
    { key: 'webhook_url_reachable', label: 'Webhook URL configured' },
    { key: 'verify_token_valid', label: 'Verify token configured' },
    { key: 'waba_subscribed', label: 'Webhooks verified with Meta' },
  ];

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-lg">Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-medium text-sm mb-4">Meta API Configuration</h3>
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-muted-foreground w-40">{f.label}</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type={f.masked && !showMasked[f.key] ? 'password' : 'text'}
                      value={settings[f.key as keyof SettingsData]}
                      onChange={(e) => updateField(f.key as keyof SettingsData, e.target.value)}
                      placeholder={f.placeholder}
                      className="bg-muted rounded-lg px-3 py-2 text-sm flex-1 font-mono border-0 focus:ring-2 focus:ring-primary"
                    />
                    {f.masked && settings[f.key as keyof SettingsData] && (
                      <button
                        type="button"
                        onClick={() => toggleMask(f.key)}
                        className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground"
                      >
                        {showMasked[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                {f.description && (
                  <p className="text-xs text-muted-foreground ml-40 mb-2">{f.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm">Webhook Configuration</h3>
            <div className="text-sm text-muted-foreground">
              Use this URL in Meta Developer Dashboard:
            </div>
          </div>
          <div className="bg-muted rounded-lg px-3 py-2 text-sm font-mono break-all mb-4">
            {settings.webhook_url || 'Set a Webhook URL above to see your webhook endpoint'}
          </div>
          {settings.webhook_url && (
            <div className="text-sm text-muted-foreground">
              Full webhook URL: <span className="font-mono">{settings.webhook_url}</span>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-medium text-sm mb-4">Connection Health Check</h3>
          <button
            onClick={runHealthCheck}
            disabled={checking}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {checking ? 'Testing Connection...' : 'Test Connection'}
          </button>
          {Object.keys(healthChecks).length > 0 && (
            <div className="mt-4 space-y-2">
              {checkItems.map(check => (
                <div key={check.key} className="flex items-center gap-2 text-sm">
                  {healthChecks[check.key] ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={healthChecks[check.key] ? 'text-foreground' : 'text-muted-foreground'}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          )}
          {connectionInfo && (
            <div className="mt-6 border-t border-border pt-4">
              <h4 className="font-medium text-sm mb-3">Phone Number Details</h4>
              {connectionInfo.phone?.ok && (
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone Number:</span>
                    <span className="font-medium">{connectionInfo.phone.data?.display_phone_number || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified Name:</span>
                    <span className="font-medium">{connectionInfo.phone.data?.verified_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quality Rating:</span>
                    <span className={`font-medium ${connectionInfo.phone.data?.quality_rating === 'GREEN' ? 'text-green-500' : connectionInfo.phone.data?.quality_rating === 'YELLOW' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {connectionInfo.phone.data?.quality_rating || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code Verification:</span>
                    <span className="font-medium">{connectionInfo.phone.data?.code_verification_status || '-'}</span>
                  </div>
                </div>
              )}

              <h4 className="font-medium text-sm mb-3 mt-4">WhatsApp Business Account</h4>
              {connectionInfo.waba?.ok && (
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WABA ID:</span>
                    <span className="font-medium font-mono text-xs">{connectionInfo.waba.data?.id || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Name:</span>
                    <span className="font-medium">{connectionInfo.waba.data?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messaging Limit:</span>
                    <span className="font-medium">{connectionInfo.waba.data?.whatsapp_business_manager_messaging_limit || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Status:</span>
                    <span className="font-medium">{connectionInfo.waba.data?.account_review_status || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Business Verification:</span>
                    <span className={`font-medium ${connectionInfo.waba.data?.business_verification_status === 'approved' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {connectionInfo.waba.data?.business_verification_status || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ownership:</span>
                    <span className="font-medium">{connectionInfo.waba.data?.ownership_type || '-'}</span>
                  </div>
                </div>
              )}

              {connectionInfo.phone?.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  Phone Error: {connectionInfo.phone.error}
                </div>
              )}
              {connectionInfo.waba?.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  WABA Error: {connectionInfo.waba.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;