import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { incidentsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { StatCard, Spinner, EmptyState, Modal, Tabs } from '../../components/ui';
import {
  FileText, AlertTriangle, CheckCircle, Clock, TrendingUp,
  FilePlus, ClipboardList, BarChart3, Eye, Inbox, UserCheck, Timer, XOctagon, LayoutDashboard,
  Activity, Paperclip, Flame, ShieldAlert, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getStatusLabel, getSeverityClass, getStatusClass, formatDate } from '../../utils/helpers';

const COLORS_SEVERITY = { Minor: '#22c55e', Major: '#f59e0b', Grave: '#d946ef' };
const COLORS_PIE = ['#0e95ea', '#22c55e', '#f59e0b', '#d946ef', '#ef4444', '#6366f1', '#14b8a6', '#f97316'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedInc, setSelectedInc] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Always call hooks before any conditional rendering
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => incidentsApi.getStats().then(r => r.data),
  });

  const { data: recentData } = useQuery({
    queryKey: ['incidents', { page: 1, limit: 5 }],
    queryFn: () => incidentsApi.list({ page: 1, limit: 5 }).then(r => r.data?.incidents || []),
  });

  const { data: allReceived = [] } = useQuery({
    queryKey: ['incidents', 'received-all'],
    queryFn: () => incidentsApi.list({ limit: 1000 }).then(r => r.data?.incidents || []),
    enabled: user?.role === 'hod'
  });

  const hodQueue = allReceived.filter(i => i.status === 'with_hod' || i.status === 'with_hod_and_imc');
  const overdueCount = hodQueue.filter(i => ((new Date() - new Date(i.created_at)) / 3600000 > 48)).length;
  const escalatedCount = hodQueue.filter(i => !!i.priority_escalated_by).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} />
      </div>
    );
  }

  const totals = stats?.totals || {};
  const monthly = stats?.monthly || [];
  const bySeverity = stats?.bySeverity || [];
  const byType = stats?.byType || [];


  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.role === 'imc' ? 'Incident Management Committee' : `${user?.fullName?.split(' ')[0]} · ${user?.department || 'JPHRC'}`}
          </p>
        </div>
        {(user?.role === 'employee' || user?.role === 'hod') && (
          <button onClick={() => navigate('/incidents/new')} className="btn-primary">
            <FilePlus size={16} />
            Report Incident
          </button>
        )}
      </div>

      {user?.role === 'hod' && (
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'reports', label: 'Reports', icon: BarChart3 }
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Warnings Panel */}
          {user?.role === 'hod' && (overdueCount > 0 || escalatedCount > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-800">Escalation & SLA Warnings</h3>
                <ul className="mt-1 space-y-1 text-sm text-red-700">
                  {escalatedCount > 0 && (
                    <li className="flex items-center gap-1.5 font-bold animate-pulse">
                      <Flame size={14} className="text-red-600" />
                      {escalatedCount} incident(s) in your queue have been ESCALATED for priority action!
                    </li>
                  )}
                  {overdueCount > 0 && (
                    <li className="flex items-center gap-1.5">
                      <Clock size={14} className="text-red-600" />
                      {overdueCount} incident(s) have breached the 48-hour SLA.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Stat cards — hidden for HOD (they use the sections below) */}
          {user?.role !== 'hod' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={FileText}
                label="Total Incidents"
                value={totals.total || 0}
                color="bg-blue-50"
                iconColor="text-blue-600"
                onClick={() => navigate('/incidents')}
              />
              <StatCard
                icon={Clock}
                label="Active"
                value={totals.active || 0}
                color="bg-amber-50"
                iconColor="text-amber-700"
                onClick={() => navigate('/incidents', { state: { status: 'active' } })}
              />
              <StatCard
                icon={CheckCircle}
                label="Resolved"
                value={totals.resolved || 0}
                color="bg-green-50"
                iconColor="text-green-700"
                onClick={() => navigate('/incidents', { state: { status: 'resolved' } })}
              />
              <StatCard
                icon={TrendingUp}
                label="This Month"
                value={totals.this_month || 0}
                color="bg-indigo-50"
                iconColor="text-indigo-600"
              />
            </div>
          )}

          {/* HOD extra stats */}
          {user?.role === 'hod' && (
            <div className="space-y-4">
              {/* Department metrics */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  icon={Inbox}
                  label="Received Incidents"
                  value={stats?.hodReport?.received || 0}
                  color="bg-blue-50"
                  iconColor="text-blue-600"
                  onClick={() => navigate('/incidents')}
                />
                <StatCard
                  icon={UserCheck}
                  label="Feedback Given"
                  value={stats?.hodReport?.feedbackGiven || 0}
                  color="bg-green-50"
                  iconColor="text-green-700"
                />
                <StatCard
                  icon={Timer}
                  label="Avg Feedback Time"
                  value={stats?.hodReport?.avgFeedbackTime || 'N/A'}
                  color="bg-amber-50"
                  iconColor="text-amber-700"
                />
              </div>

              {/* My Incidents */}
              <div className="flex items-center gap-2 mb-1 mt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Incidents</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Activity}
                  label="My Incidents"
                  value={stats?.hodReport?.myIncidents?.total || 0}
                  color="bg-indigo-50"
                  iconColor="text-indigo-600"
                  onClick={() => navigate('/incidents', { state: { viewMode: 'my_incidents' } })}
                />
                <StatCard
                  icon={Clock}
                  label="Active"
                  value={stats?.hodReport?.myIncidents?.active || 0}
                  color="bg-amber-50"
                  iconColor="text-amber-700"
                  onClick={() => navigate('/incidents', { state: { viewMode: 'my_incidents', status: 'active' } })}
                />
                <StatCard
                  icon={CheckCircle}
                  label="Resolved"
                  value={stats?.hodReport?.myIncidents?.resolved || 0}
                  color="bg-green-50"
                  iconColor="text-green-700"
                  onClick={() => navigate('/incidents', { state: { viewMode: 'my_incidents', status: 'resolved' } })}
                />
                <StatCard
                  icon={TrendingUp}
                  label="This Month"
                  value={stats?.hodReport?.myIncidents?.thisMonth || 0}
                  color="bg-purple-50"
                  iconColor="text-purple-600"
                />
              </div>
            </div>
          )}

          {/* Action Required Queue (HOD Only) */}
          {user?.role === 'hod' && (
            <div className="card p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList size={16} className="text-indigo-500" />
                  <span>Action Required Queue ({hodQueue.length})</span>
                </h2>
              </div>
              {hodQueue.length === 0 ? (
                <EmptyState icon={CheckCircle} title="All Caught Up" message="You have no incidents pending your feedback." />
              ) : (
                <div className="space-y-3">
                  {hodQueue.map(inc => {
                    const isOverdue = ((new Date() - new Date(inc.created_at)) / 3600000 > 48);
                    return (
                      <div key={inc.id} onClick={() => navigate(`/incidents/${encodeURIComponent(inc.id)}`)} className={`card p-4 cursor-pointer hover:shadow-card-hover border transition-all group relative overflow-hidden ${
                          inc.priority_escalated_by ? 'border-red-300 bg-red-50/20 shadow-sm' :
                          isOverdue ? 'border-red-100 bg-gradient-to-r from-red-50/10 to-transparent' : 'border-slate-150 hover:border-indigo-100'
                        }`}>
                        {inc.priority_escalated_by && (
                          <div className="absolute top-0 right-0 px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-bl-lg border-b border-l border-red-200 animate-pulse">
                            <Flame size={10} className="inline mr-1" />
                            ESCALATED PRIORITY
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${
                            inc.severity === 'Grave' ? 'bg-purple-400' :
                            inc.severity === 'Major' ? 'bg-amber-400' : 'bg-green-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono text-xs font-bold text-green-700">{inc.reference_id}</span>
                              <span className={`badge ${getSeverityClass(inc.severity)}`}>{inc.severity}</span>
                              {isOverdue && (
                                <span className="badge bg-red-100 text-red-700 font-bold border border-red-200">
                                  <Clock size={10} className="inline mr-1" /> 48h+ SLA BREACH
                                </span>
                              )}
                              {inc.priority_escalated_by && (
                                <span className="badge bg-red-100 text-red-700 font-bold border border-red-200">
                                  <Flame size={10} className="inline mr-1" /> ESCALATED BY {inc.priority_escalated_by.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-800 mb-1">{inc.incident_type}</p>
                            <p className="text-xs text-slate-500">
                              Reporter: {inc.reporter_name} ({inc.reporter_department}) · Location: {inc.main_location_name} · Date: {formatDate(inc.incident_date)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/incidents/${encodeURIComponent(inc.id)}`); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors border border-indigo-200 mt-4"
                            >
                              <Eye size={13} /> Provide Feedback
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

      {/* Charts row */}
      {user?.role !== 'employee' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly trend */}
            <div className="card p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Trend</h3>
              {monthly.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e8edf4', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="#0e95ea" radius={[4, 4, 0, 0]} name="Incidents" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Severity breakdown */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">By Severity</h3>
              {bySeverity.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={bySeverity}
                      cx="50%" cy="45%"
                      innerRadius={50} outerRadius={75}
                      dataKey="count"
                      nameKey="severity"
                      paddingAngle={3}
                    >
                      {bySeverity.map((entry, i) => (
                        <Cell key={i} fill={COLORS_SEVERITY[entry.severity] || COLORS_PIE[i]} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(val) => <span style={{ fontSize: 11, color: '#64748b' }}>{val}</span>}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e8edf4', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Incident type breakdown */}
          {byType.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Incidents by Type</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={byType}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 100, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="incident_type"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    width={95}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e8edf4', fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Count">
                    {byType.map((_, i) => (
                      <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
      </div>
      )}

      {/* REPORTS TAB (HOD ONLY) */}
      {activeTab === 'reports' && user?.role === 'hod' && (
        <div className="space-y-6">
          {/* Department responsiveness */}
          <div>
            <div className="card p-4 border-l-4 border-l-blue-500 bg-blue-50/50 mb-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-0.5">Department Incident Reports</h3>
              <p className="text-xs text-slate-500">Track your department's responsiveness and feedback metrics.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={Inbox}
                label="Received Incidents"
                value={stats?.hodReport?.received || 0}
                color="bg-blue-50"
                iconColor="text-blue-600"
                onClick={() => navigate('/incidents')}
              />
              <StatCard
                icon={UserCheck}
                label="Feedback Given"
                value={stats?.hodReport?.feedbackGiven || 0}
                color="bg-green-50"
                iconColor="text-green-700"
              />
              <StatCard
                icon={Timer}
                label="Avg Feedback Time"
                value={stats?.hodReport?.avgFeedbackTime || 'N/A'}
                color="bg-amber-50"
                iconColor="text-amber-700"
              />
            </div>
          </div>

          {/* My Incidents breakdown */}
          <div>
            <div className="card p-4 border-l-4 border-l-indigo-500 bg-indigo-50/50 mb-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-0.5">My Incidents</h3>
              <p className="text-xs text-slate-500">Incidents reported by you across all statuses.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Activity}
                label="My Incidents"
                value={stats?.hodReport?.myIncidents?.total || 0}
                color="bg-indigo-50"
                iconColor="text-indigo-600"
                onClick={() => navigate('/incidents', { state: { viewMode: 'my_incidents' } })}
              />
              <StatCard
                icon={Clock}
                label="Active"
                value={stats?.hodReport?.myIncidents?.active || 0}
                color="bg-amber-50"
                iconColor="text-amber-700"
                onClick={() => navigate('/incidents', { state: { viewMode: 'my_incidents', status: 'active' } })}
              />
              <StatCard
                icon={CheckCircle}
                label="Resolved"
                value={stats?.hodReport?.myIncidents?.resolved || 0}
                color="bg-green-50"
                iconColor="text-green-700"
                onClick={() => navigate('/incidents', { state: { viewMode: 'my_incidents', status: 'resolved' } })}
              />
              <StatCard
                icon={TrendingUp}
                label="This Month"
                value={stats?.hodReport?.myIncidents?.thisMonth || 0}
                color="bg-purple-50"
                iconColor="text-purple-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Recent incidents */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">Recent Incidents</h3>
          <button onClick={() => navigate('/incidents')} className="text-xs text-blue-600 hover:underline">
            View all →
          </button>
        </div>
        <div className="table-wrapper rounded-none border-0">
          <table className="table">
            <thead>
              {user?.role === 'hod' ? (
                <tr>
                  <th>Reference ID</th>
                  <th>Reporter</th>
                  <th>Reporter Dept</th>
                  <th>Emp ID</th>
                  <th>Apply Date</th>
                  <th>Incident Date</th>
                  <th>Location</th>
                  <th>Target Depts</th>
                  <th>Action</th>
                </tr>
              ) : (
                <tr>
                  <th>Reference ID</th>
                  <th>Target Depts</th>
                  <th>Apply Date</th>
                  <th>Incident Date & Time</th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              )}
            </thead>
            <tbody>
              {!recentData?.length ? (
                <tr>
                  <td colSpan={user?.role === 'hod' ? 9 : 6} className="text-center py-8 text-slate-400">
                    No incidents yet
                  </td>
                </tr>
              ) : recentData.slice(0,5).map(inc => (
                <tr key={inc.id}>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-medium text-green-700">{inc.reference_id}</span>
                      {inc.attachments && inc.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded px-1 py-0.5" title={`${inc.attachments.length} attachment(s)`}>
                          <Paperclip size={10} />
                          <span>{inc.attachments.length}</span>
                        </span>
                      )}
                      {inc.priority_escalated_by && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 rounded px-1 py-0.5 animate-pulse" title={`Escalated by ${inc.priority_escalated_by}`}>
                          <Flame size={10} />
                          <span>ESCALATED</span>
                        </span>
                      )}
                    </div>
                  </td>
                  {user?.role === 'hod' ? (
                    <>
                      <td className="text-slate-700 text-xs font-medium">{inc.reporter_name || 'N/A'}</td>
                      <td className="text-slate-600 text-xs">{inc.reporter_department || 'N/A'}</td>
                      <td className="text-slate-600 text-xs font-mono">{inc.reporter_employee_id || 'N/A'}</td>
                      <td className="text-slate-500 text-xs">{formatDate(inc.created_at)}</td>
                      <td className="text-slate-500 text-xs">{formatDate(inc.incident_date)} {inc.incident_time?.slice(0,5)}</td>
                      <td className="text-slate-600 text-xs font-mono truncate max-w-[120px]">
                        {inc.main_location_name || 'N/A'}
                        {inc.sub_location_name ? ` - ${inc.sub_location_name}` : ''}
                      </td>
                      <td className="text-slate-600 text-xs font-medium">{(inc.departments || []).join(', ') || 'N/A'}</td>
                    </>
                  ) : (
                    <>
                      <td className="text-slate-600 text-xs">{(inc.departments || []).join(', ') || 'N/A'}</td>
                      <td className="text-slate-500 text-xs">{formatDate(inc.created_at)}</td>
                      <td className="text-slate-500 text-xs">{formatDate(inc.incident_date)} {inc.incident_time?.slice(0,5)}</td>
                      <td className="text-slate-600 text-xs">
                        {inc.main_location_name || 'N/A'}
                        {inc.sub_location_name ? ` - ${inc.sub_location_name}` : ''}
                      </td>
                    </>
                  )}
                  <td>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedInc(inc); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => navigate('/incidents')}
          className="card p-4 text-left hover:shadow-card-hover transition-shadow group"
        >
          <FileText size={20} className="text-blue-600 mb-2" />
          <p className="text-sm font-semibold text-slate-800">All Incidents</p>
          <p className="text-xs text-slate-500 mt-0.5">Browse and filter all reported incidents</p>
        </button>

        {/* {(user?.role === 'imc' || user?.role === 'system_admin') && (
          <button
            onClick={() => navigate('/imc/queue')}
            className="card p-4 text-left hover:shadow-card-hover transition-shadow"
          >
            <ClipboardList size={20} className="text-indigo-600 mb-2" />
            <p className="text-sm font-semibold text-slate-800">IMC Queue</p>
            <p className="text-xs text-slate-500 mt-0.5">Review and claim pending incidents</p>
          </button>
        )} */}

        {(user?.role === 'system_admin' || user?.role === 'head_management') && (
          <button
            onClick={() => navigate('/admin/analytics')}
            className="card p-4 text-left hover:shadow-card-hover transition-shadow"
          >
            <BarChart3 size={20} className="text-green-700 mb-2" />
            <p className="text-sm font-semibold text-slate-800">Analytics</p>
            <p className="text-xs text-slate-500 mt-0.5">System-wide reports and SLA tracking</p>
          </button>
        )}
      </div>

      <Modal
        open={!!selectedInc}
        onClose={() => setSelectedInc(null)}
        title={`Incident Details - ${selectedInc?.reference_id}`}
        size="lg"
        footer={
          <>
            <button onClick={() => setSelectedInc(null)} className="btn-secondary">Close</button>
            <button onClick={() => navigate(`/incidents/${encodeURIComponent(selectedInc?.id)}`)} className="btn-primary">
              View or Feedback
            </button>
          </>
        }
      >
        {selectedInc && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><span className="text-slate-500 block text-xs">Reference ID</span><span className="font-medium text-green-700">{selectedInc.reference_id}</span></div>
              <div><span className="text-slate-500 block text-xs">Target Depts</span><span className="font-medium">{(selectedInc.departments || []).join(', ') || 'N/A'}</span></div>
              <div><span className="text-slate-500 block text-xs">Apply Date</span><span className="font-medium">{formatDate(selectedInc.created_at)}</span></div>
              <div><span className="text-slate-500 block text-xs">Incident Date & Time</span><span className="font-medium">{formatDate(selectedInc.incident_date)} {selectedInc.incident_time?.slice(0,5)}</span></div>
              <div className="col-span-2"><span className="text-slate-500 block text-xs">Location</span><span className="font-medium">{selectedInc.main_location_name || 'N/A'}{selectedInc.sub_location_name ? ` - ${selectedInc.sub_location_name}` : ''}</span></div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-600 font-medium">IMC Status</span>
                <span className={getStatusClass(selectedInc.status)}>{getStatusLabel(selectedInc.status)}</span>
              </div>
              {selectedInc.priority_escalated_by && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl animate-pulse">
                  <span className="text-red-700 font-bold flex items-center gap-1.5"><Flame size={16} /> PRIORITY ESCALATION</span>
                  <span className="text-red-700 text-xs font-bold bg-red-100 px-2 py-1 rounded border border-red-200">BY {selectedInc.priority_escalated_by.toUpperCase()}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500 block text-xs font-semibold uppercase tracking-wider mb-1 px-1">Feedback by HOD</span>
                <p className="text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-100 text-sm">{selectedInc.hod_feedback || 'No feedback yet'}</p>
              </div>
              <div>
                <span className="text-slate-500 block text-xs font-semibold uppercase tracking-wider mb-1 px-1">Feedback by IMC</span>
                <p className="text-slate-700 bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-sm">{selectedInc.imc_feedback || 'No feedback yet'}</p>
              </div>
              <div>
                <span className="text-slate-500 block text-xs font-semibold uppercase tracking-wider mb-1 px-1">Feedback by Management</span>
                <p className="text-slate-700 bg-purple-50 p-3 rounded-xl border border-purple-100 text-sm">{selectedInc.management_feedback || 'No feedback yet'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
