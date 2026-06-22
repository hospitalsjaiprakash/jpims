import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { incidentsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { StatCard, Spinner } from '../../components/ui';
import {
  FileText, CheckCircle, Clock, TrendingUp, Users,
  Shield, BarChart3, Settings, ArrowRightCircle,
  AlertTriangle, RefreshCw, AlertOctagon, Eye, ChevronRight, Paperclip
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getStatusClass, getStatusLabel, getSeverityClass, formatDate } from '../../utils/helpers';

const COLORS_SEVERITY = { Minor: '#22c55e', Major: '#f59e0b', Grave: '#d946ef' };

export default function SystemAdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => incidentsApi.getStats().then(r => r.data),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;
  }

  const r = stats?.adminReport || {};
  const recent = r.recentIncidents || [];
  const bySeverity = r.bySeverity || [];
  const monthly = r.monthly || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">System Administration</h1>
          <p className="page-subtitle">Welcome back, {user?.fullName?.split(' ')[0]} · {user?.department || 'IT'}</p>
        </div>
      </div>

      {/* Primary KPIs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Overview</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={r.totalUsers || 0} color="bg-blue-50" iconColor="text-blue-600" />
          <StatCard icon={FileText} label="Total Incidents" value={r.totalIncidents || 0} color="bg-slate-50" iconColor="text-slate-600" />
          <StatCard icon={Clock} label="Active" value={r.activeIncidents || 0} color="bg-amber-50" iconColor="text-amber-700" />
          <StatCard icon={CheckCircle} label="Resolved" value={r.resolved || 0} color="bg-green-50" iconColor="text-green-700" />
        </div>
      </div>

      {/* Secondary KPIs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue Status</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="This Month" value={r.thisMonth || 0} color="bg-indigo-50" iconColor="text-indigo-600" />
          <StatCard icon={Shield} label="IMC Queue" value={r.imcQueue || 0} color="bg-violet-50" iconColor="text-violet-600" />
          <StatCard icon={RefreshCw} label="Redirect Requests" value={r.pendingRedirects || 0} color="bg-orange-50" iconColor="text-orange-600" />
          <StatCard icon={AlertOctagon} label="Disputes" value={r.disputes || 0} color="bg-red-50" iconColor="text-red-600" />
        </div>
      </div>

      {/* Quick Access tiles */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Access</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => navigate('/admin/users')} className="card p-4 text-left hover:shadow-card-hover transition-all group border-l-4 border-l-blue-500">
            <Users size={20} className="text-blue-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800">Users & Roles</p>
            <p className="text-xs text-slate-500 mt-0.5">Manage employees and IMC assignments</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Open <ChevronRight size={12} />
            </div>
          </button>
          <button onClick={() => navigate('/admin/analytics')} className="card p-4 text-left hover:shadow-card-hover transition-all group border-l-4 border-l-green-500">
            <BarChart3 size={20} className="text-green-700 mb-2" />
            <p className="text-sm font-semibold text-slate-800">Analytics</p>
            <p className="text-xs text-slate-500 mt-0.5">SLA tracking and department reports</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Open <ChevronRight size={12} />
            </div>
          </button>
          <button onClick={() => navigate('/admin/audit')} className="card p-4 text-left hover:shadow-card-hover transition-all group border-l-4 border-l-violet-500">
            <Shield size={20} className="text-violet-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800">Audit Logs</p>
            <p className="text-xs text-slate-500 mt-0.5">Complete history of all system actions</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Open <ChevronRight size={12} />
            </div>
          </button>
          <button onClick={() => navigate('/admin/settings')} className="card p-4 text-left hover:shadow-card-hover transition-all group border-l-4 border-l-slate-400">
            <Settings size={20} className="text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800">System Settings</p>
            <p className="text-xs text-slate-500 mt-0.5">Configuration and role credentials</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Open <ChevronRight size={12} />
            </div>
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Incident Trend</h3>
          {monthly.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e8edf4', fontSize: 12 }} />
                <Bar dataKey="count" fill="#0e95ea" radius={[4, 4, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">By Severity</h3>
          {bySeverity.filter(s => s.count > 0).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={bySeverity} cx="50%" cy="45%" innerRadius={50} outerRadius={75} dataKey="count" nameKey="severity" paddingAngle={3}>
                  {bySeverity.map((entry, i) => (
                    <Cell key={i} fill={COLORS_SEVERITY[entry.severity] || '#94a3b8'} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={val => <span style={{ fontSize: 11, color: '#64748b' }}>{val}</span>} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e8edf4', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent incidents across all statuses */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">Recent Incidents (All)</h3>
          <button onClick={() => navigate('/incidents')} className="text-xs text-blue-600 hover:underline">View all →</button>
        </div>
        <div className="divide-y divide-slate-100">
          {recent.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No incidents yet</div>
          ) : recent.map(inc => (
            <div
              key={inc.id}
              onClick={() => navigate(`/incidents/${encodeURIComponent(inc.id)}`)}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
                inc.severity === 'Grave' ? 'bg-purple-400' :
                inc.severity === 'Major' ? 'bg-amber-400' : 'bg-green-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-green-700">{inc.reference_id}</span>
                  <span className={`badge ${getSeverityClass(inc.severity)}`}>{inc.severity}</span>
                  <span className={getStatusClass(inc.status)}>{getStatusLabel(inc.status)}</span>
                  {inc.attachments && inc.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5" title={`${inc.attachments.length} attachment(s)`}>
                      <Paperclip size={10} />
                      <span>{inc.attachments.length}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 truncate">{inc.incident_type} · {inc.reporter_name} · {formatDate(inc.incident_date)}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); navigate(`/incidents/${encodeURIComponent(inc.id)}`); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
              >
                <Eye size={13} /> View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
