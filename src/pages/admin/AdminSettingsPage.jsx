import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { Alert, Spinner } from '../../components/ui';
import { Settings, Save, RefreshCw, KeyRound, Lock, Send, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const CONFIG_FIELDS = [
  {
    key: 'sla_days',
    label: 'SLA Resolution Days',
    description: 'Number of days before an incident is flagged as overdue.',
    type: 'number',
    min: 1, max: 30,
  },
  {
    key: 'max_dispute_count',
    label: 'Maximum Disputes per Incident',
    description: 'How many times an employee can raise a dispute on the same incident.',
    type: 'number',
    min: 1, max: 5,
  },
  {
    key: 'parallel_grave_review',
    label: 'Parallel HOD+IMC Review for Grave Incidents',
    description: 'When enabled, Grave severity incidents skip straight to simultaneous HOD and IMC review.',
    type: 'boolean',
  },
  {
    key: 'data_retention_years',
    label: 'Data Retention (years)',
    description: 'How long resolved incident data is kept before archiving.',
    type: 'number',
    min: 1, max: 10,
  },
  {
    key: 'withdrawn_retention_years',
    label: 'Withdrawn Incident Retention (years)',
    description: 'How long withdrawn incidents are kept before purging.',
    type: 'number',
    min: 1, max: 5,
  },
];

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const [localConfig, setLocalConfig] = useState({});
  const [dirty, setDirty] = useState(false);
  
  // Password Change State
  const [pwdForm, setPwdForm] = useState({ targetRole: 'imc', newPassword: '', otp: '' });
  const [pwdMode, setPwdMode] = useState('request'); // 'request' | 'verify'
  const [isRequesting, setIsRequesting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['admin-config'],
    queryFn: () => adminApi.getConfig().then(r => r.data),
  });

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setDirty(false);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data) => adminApi.updateConfig(data),
    onSuccess: () => {
      toast.success('System configuration saved successfully.');
      qc.invalidateQueries({ queryKey: ['admin-config'] });
      setDirty(false);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to save configuration'),
  });

  const handleChange = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleReset = () => {
    setLocalConfig(config);
    setDirty(false);
  };

  const handleRequestOtp = async () => {
    if (!pwdForm.newPassword) return toast.error('Please enter a new password first.');
    setIsRequesting(true);
    try {
      await adminApi.requestRolePasswordOtp();
      toast.success('OTP sent to your email.');
      setPwdMode('verify');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to request OTP');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!pwdForm.otp || pwdForm.otp.length !== 6) return toast.error('Enter a valid 6-digit OTP.');
    setIsRequesting(true);
    try {
      await adminApi.updateRoleCredentials(pwdForm);
      toast.success('Role password updated successfully!');
      setPwdMode('request');
      setPwdForm({ targetRole: 'imc', newPassword: '', otp: '' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update password');
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure IMS operational parameters</p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <button onClick={handleReset} className="btn-secondary">
              <RefreshCw size={15} />
              Reset
            </button>
          )}
          <button
            onClick={() => saveMutation.mutate(localConfig)}
            disabled={!dirty || saveMutation.isPending}
            className="btn-primary"
          >
            {saveMutation.isPending ? <Spinner size={15} className="text-white" /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </div>

      {dirty && (
        <Alert type="warning" title="Unsaved Changes" message="You have unsaved configuration changes. Click Save to apply." />
      )}

      <div className="card divide-y divide-slate-200">
        {CONFIG_FIELDS.map(field => (
          <div key={field.key} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-slate-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-slate-800">{field.label}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-5">{field.description}</p>
            </div>
            <div className="flex-shrink-0 sm:w-36">
              {field.type === 'boolean' ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localConfig[field.key] === 'true'}
                    onChange={e => handleChange(field.key, e.target.checked ? 'true' : 'false')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-sm text-slate-600">
                    {localConfig[field.key] === 'true' ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              ) : (
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={localConfig[field.key] || ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  className="input text-center font-mono"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-slate-600" />
            <h2 className="text-sm font-bold text-slate-800">Role Passwords</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Update the shared login passwords for committee roles. An OTP will be sent to your registered email to verify this action.
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="field-label">Target Role</label>
              <select
                value={pwdForm.targetRole}
                onChange={e => setPwdForm({ ...pwdForm, targetRole: e.target.value })}
                className="input"
                disabled={pwdMode === 'verify'}
              >
                <option value="imc">IMC Dashboard</option>
                <option value="head_management">Management Dashboard</option>
                <option value="system_admin">System Admin Office</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">New Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwdForm.newPassword}
                  onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  placeholder="Enter secure password"
                  className="input pr-10"
                  disabled={pwdMode === 'verify'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          
          {pwdMode === 'request' ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isRequesting || !pwdForm.newPassword}
                className="btn-secondary"
              >
                {isRequesting ? <Spinner size={14} className="mr-2" /> : <Send size={14} className="mr-2" />}
                Request OTP to Continue
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <label className="field-label text-blue-800">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  value={pwdForm.otp}
                  onChange={e => setPwdForm({ ...pwdForm, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="000000"
                  className="input text-center tracking-[0.2em] font-mono"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPwdMode('request')}
                  className="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={isRequesting || pwdForm.otp.length !== 6}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  {isRequesting ? <Spinner size={14} className="text-white mr-2" /> : <Lock size={14} className="text-white mr-2" />}
                  Confirm Update
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Configuration Notes</h3>
        <ul className="space-y-1.5 text-xs text-slate-500 list-disc list-inside">
          <li>All configuration changes are logged in the audit trail with the administrator's name.</li>
          <li>SLA settings take effect immediately for existing active incidents.</li>
          <li>Data retention settings apply to the nightly archival job.</li>
          <li>Contact your system administrator before changing critical settings.</li>
        </ul>
      </div>
    </div>
  );
}
