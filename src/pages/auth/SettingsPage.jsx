import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Alert } from '../../components/ui';
import { User, Bell, Shield, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, refreshUser } = useAuthStore();
  const [whatsappNotif, setWhatsappNotif] = useState(user?.whatsappNotifications ?? true);

  const updatePrefMutation = useMutation({
    mutationFn: () => authApi.updateNotificationPrefs({ whatsappNotifications: whatsappNotif }),
    onSuccess: () => {
      toast.success('Preferences saved.');
      refreshUser();
    },
    onError: () => toast.error('Failed to update preferences'),
  });

  const roleDescriptions = {
    employee: 'You can report incidents and track their progress.',
    hod: 'You review incidents targeted at your department and provide feedback.',
    imc: 'You review all incidents and manage the knowledge base.',
    head_management: 'You make final decisions on incidents and generate official reports.',
    system_admin: 'You have full access to all system settings, users, and analytics.',
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account preferences and information</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-xl">{user?.fullName?.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">{user?.fullName}</h2>
            <p className="text-sm text-slate-500">{user?.designation} · {user?.department}</p>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{user?.employeeId}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-800 font-medium">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Department</span>
            <span className="text-slate-800 font-medium">{user?.department || '—'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Role</span>
            <span className="badge-blue">{user?.role?.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* Role info */}
      <div className="card p-5 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Shield size={17} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Your Role: {user?.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
            <p className="text-sm text-slate-600">{roleDescriptions[user?.role] || ''}</p>
          </div>
        </div>
      </div>

      {/* Notification prefs */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={17} className="text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-800">Notification Preferences</h2>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800">WhatsApp Notifications</p>
            <p className="text-xs text-slate-500 mt-0.5">Receive incident updates via WhatsApp</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappNotif}
              onChange={e => setWhatsappNotif(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => updatePrefMutation.mutate()}
            disabled={updatePrefMutation.isPending}
            className="btn-primary btn-sm"
          >
            Save Preferences
          </button>
        </div>
      </div>


    </div>
  );
}
