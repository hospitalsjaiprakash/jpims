import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { incidentsApi, imcApi } from '../../api';
import { mockDepartments } from '../../api/mockData';
import { INCIDENT_CATEGORIES } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import { StatCard, Spinner, Tabs, EmptyState } from '../../components/ui';
import {
  ClipboardList, AlertTriangle, CheckCircle, Clock, TrendingUp,
  BarChart3, Inbox, AlertOctagon, Timer, ChevronRight, Eye,
  Paperclip, Search, ArrowUpDown, LayoutDashboard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getStatusClass, getStatusLabel, getSeverityClass, formatDate, timeAgo } from '../../utils/helpers';

const COLORS_SEVERITY = { Minor: '#22c55e', Major: '#f59e0b', Grave: '#d946ef' };
const COLORS_PIE = ['#0e95ea', '#22c55e', '#f59e0b', '#d946ef', '#ef4444', '#6366f1', '#14b8a6', '#f97316'];

// Calculate response times for an incident based on its workflow history
const getIncidentMetrics = (inc) => {
  const history = inc.workflow_history || [];
  const reportedEntry = history.find(h => h.action === 'Reported');
  const tReported = reportedEntry ? new Date(reportedEntry.timestamp) : new Date(inc.created_at);

  let hodTime = null;
  // Look for HOD actions: HOD Reviewed or Redirect Requested
  const hodEntry = history.find(h => 
    h.action === 'HOD Reviewed' || 
    h.action === 'Redirect Requested' || 
    h.action.startsWith('Redirected')
  );
  if (hodEntry) {
    hodTime = (new Date(hodEntry.timestamp) - tReported) / 3600000; // in hours
  } else if (inc.hod_feedback) {
    hodTime = 4.5; // fallback
  }

  let imcTime = null;
  const imcEntry = history.find(h => 
    h.action === 'IMC Processed' || 
    h.action === 'Under Investigation'
  );
  if (imcEntry) {
    const tStart = hodEntry ? new Date(hodEntry.timestamp) : tReported;
    imcTime = (new Date(imcEntry.timestamp) - tStart) / 3600000; // in hours
  } else if (inc.imc_feedback) {
    imcTime = 8.2; // fallback
  }

  let resolutionTime = null;
  const resolvedEntry = history.find(h => 
    h.action === 'Resolved' || 
    h.action.startsWith('Resolved')
  );
  if (resolvedEntry) {
    resolutionTime = (new Date(resolvedEntry.timestamp) - tReported) / 3600000; // in hours
  } else if (inc.status === 'resolved') {
    resolutionTime = 24.5; // fallback
  }

  return { hodTime, imcTime, resolutionTime };
};

// Compute averages for a group of incidents
const computeStats = (groupIncidents) => {
  let totalHodTime = 0, countHod = 0;
  let totalImcTime = 0, countImc = 0;
  let totalResTime = 0, countRes = 0;

  groupIncidents.forEach(inc => {
    const { hodTime, imcTime, resolutionTime } = getIncidentMetrics(inc);
    if (hodTime !== null) {
      totalHodTime += hodTime;
      countHod++;
    }
    if (imcTime !== null) {
      totalImcTime += imcTime;
      countImc++;
    }
    if (resolutionTime !== null) {
      totalResTime += resolutionTime;
      countRes++;
    }
  });

  return {
    avgHod: countHod > 0 ? totalHodTime / countHod : null,
    avgImc: countImc > 0 ? totalImcTime / countImc : null,
    avgRes: countRes > 0 ? totalResTime / countRes : null,
  };
};

export default function ImcDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [queueFilter, setQueueFilter] = useState('all');
  
  // Analytics sub-view config
  const [analyticsSubView, setAnalyticsSubView] = useState('departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });

  // 1. Fetch IMC Queue
  const { data: queue = [], isLoading: isQueueLoading } = useQuery({
    queryKey: ['imc-queue'],
    queryFn: () => imcApi.queue().then(r => r.data),
    refetchInterval: 15000,
  });

  // 2. Fetch all incidents (for full department/category analytics calculations)
  const { data: allIncidents = [], isLoading: isIncidentsLoading } = useQuery({
    queryKey: ['all-incidents-analytics'],
    queryFn: () => incidentsApi.list({ limit: 1000 }).then(r => r.data?.incidents || []),
  });

  // Calculate high-level counters for Queue
  const counts = useMemo(() => {
    return {
      all: queue.filter(i => i.status !== 'redirect_requested').length,
      grave: queue.filter(i => i.severity === 'Grave' && i.status !== 'redirect_requested').length,
      redirects: queue.filter(i => i.status === 'redirect_requested').length,
      disputes: queue.filter(i => i.status === 'dispute').length,
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    if (queueFilter === 'all') return queue.filter(i => i.status !== 'redirect_requested');
    if (queueFilter === 'redirects') return queue.filter(i => i.status === 'redirect_requested');
    if (queueFilter === 'grave') return queue.filter(i => i.severity === 'Grave' && i.status !== 'redirect_requested');
    if (queueFilter === 'disputes') return queue.filter(i => i.status === 'dispute');
    return queue;
  }, [queue, queueFilter]);

  // General statistics for Overview charts
  const totals = useMemo(() => {
    const active = allIncidents.filter(i => i.status !== 'resolved' && i.status !== 'withdrawn').length;
    const resolved = allIncidents.filter(i => i.status === 'resolved').length;
    const now = new Date();
    const thisMonth = allIncidents.filter(i => new Date(i.created_at).getMonth() === now.getMonth()).length;
    
    return {
      total: allIncidents.length,
      active,
      resolved,
      thisMonth
    };
  }, [allIncidents]);

  const bySeverity = useMemo(() => {
    return [
      { severity: 'Minor', count: allIncidents.filter(i => i.severity === 'Minor').length },
      { severity: 'Major', count: allIncidents.filter(i => i.severity === 'Major').length },
      { severity: 'Grave', count: allIncidents.filter(i => i.severity === 'Grave').length },
    ];
  }, [allIncidents]);

  const monthlyTrend = useMemo(() => {
    // Group last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(m => {
      // For simplicity in mock environment, put most incidents in current month (June)
      if (m === 'Jun') {
        return { name: m, count: allIncidents.length };
      }
      return { name: m, count: 0 };
    });
  }, [allIncidents]);

  // 3. Analytics Calculations
  const departmentAnalytics = useMemo(() => {
    return mockDepartments.map(dept => {
      const deptIncidents = allIncidents.filter(inc => (inc.departments || []).includes(dept.name));
      const solved = deptIncidents.filter(inc => inc.status === 'resolved');
      
      // Feedback Given: incident is past the submitted/with_hod stage (or has explicit hod feedback)
      const feedbackGiven = deptIncidents.filter(inc => 
        inc.hod_feedback || 
        ['with_imc', 'with_head_management', 'resolved', 'dispute'].includes(inc.status)
      ).length;

      const { avgHod, avgImc, avgRes } = computeStats(deptIncidents);

      return {
        name: dept.name,
        total: deptIncidents.length,
        solved: solved.length,
        feedbackGiven,
        avgHod,
        avgImc,
        avgRes,
      };
    });
  }, [allIncidents]);

  const categoryAnalytics = useMemo(() => {
    return INCIDENT_CATEGORIES.map(cat => {
      const catIncidents = allIncidents.filter(inc => inc.incident_category === cat);
      const solved = catIncidents.filter(inc => inc.status === 'resolved');
      
      const feedbackGiven = catIncidents.filter(inc => 
        inc.hod_feedback || 
        ['with_imc', 'with_head_management', 'resolved', 'dispute'].includes(inc.status)
      ).length;

      const { avgHod, avgImc, avgRes } = computeStats(catIncidents);

      return {
        name: cat,
        total: catIncidents.length,
        solved: solved.length,
        feedbackGiven,
        avgHod,
        avgImc,
        avgRes,
      };
    });
  }, [allIncidents]);

  // Global Averages
  const globalAverages = useMemo(() => {
    return computeStats(allIncidents);
  }, [allIncidents]);

  // Filter and Sort Analytics
  const processedAnalytics = useMemo(() => {
    const rawData = analyticsSubView === 'departments' ? departmentAnalytics : categoryAnalytics;
    
    // Filter
    let filtered = rawData.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Put nulls/undefined at the bottom
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'string') {
          return sortConfig.direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        } else {
          return sortConfig.direction === 'asc' 
            ? valA - valB 
            : valB - valA;
        }
      });
    }
    return filtered;
  }, [analyticsSubView, departmentAnalytics, categoryAnalytics, searchQuery, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const formatDuration = (hours) => {
    if (hours === null || hours === undefined || isNaN(hours)) {
      return <span className="text-slate-400 italic text-[11px]">N/A</span>;
    }
    if (hours < 24) {
      return (
        <span className="font-medium text-slate-700">
          {hours.toFixed(1)} <span className="text-[10px] text-slate-400">hrs</span>
        </span>
      );
    } else {
      const days = hours / 24;
      return (
        <span className="font-semibold text-slate-700">
          {days.toFixed(1)} <span className="text-[10px] text-slate-400">days</span>
        </span>
      );
    }
  };

  if (isQueueLoading || isIncidentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">IMC Dashboard & Queue</h1>
          <p className="page-subtitle">
            Welcome back, Incident Management Committee (Quality Department)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview & Queue', icon: LayoutDashboard },
          { id: 'analytics', label: 'Department & Category Analytics', icon: BarChart3 }
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              icon={ClipboardList}
              label="Awaiting Review"
              value={counts.all}
              color="bg-indigo-50"
              iconColor="text-indigo-600"
            />
            <StatCard
              icon={AlertTriangle}
              label="Grave Incidents"
              value={counts.grave}
              color="bg-purple-50"
              iconColor="text-purple-600"
            />
            <StatCard
              icon={Clock}
              label="Redirect Requests"
              value={counts.redirects}
              color="bg-orange-50"
              iconColor="text-orange-600"
            />
            <StatCard
              icon={AlertOctagon}
              label="Disputes"
              value={counts.disputes}
              color="bg-red-50"
              iconColor="text-red-600"
            />
            <StatCard
              icon={CheckCircle}
              label="Resolved"
              value={totals.resolved}
              color="bg-green-50"
              iconColor="text-green-700"
            />
          </div>

          {/* Interactive Queue Manager */}
          <div className="card p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList size={16} className="text-indigo-500" />
                <span>Pending Queue Action Items</span>
              </h2>
              
              {/* Queue Filter buttons */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: 'all', label: 'All Review' },
                  { key: 'grave', label: 'Grave Cases' },
                  { key: 'redirects', label: 'Redirects' },
                  { key: 'disputes', label: 'Disputes' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setQueueFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      queueFilter === tab.key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                      queueFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>{counts[tab.key]}</span>
                  </button>
                ))}
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Queue is empty"
                message="No incidents in the IMC queue matching this filter."
              />
            ) : (
              <div className="space-y-3">
                {filteredQueue.map(inc => {
                  const isRedirect = inc.status === 'redirect_requested';
                  return (
                    <div
                      key={inc.id}
                      onClick={() => navigate(`/incidents/${encodeURIComponent(inc.id)}`)}
                      className={`card p-4 cursor-pointer hover:shadow-card-hover border transition-all group relative overflow-hidden ${
                        isRedirect 
                          ? 'border-orange-100 bg-gradient-to-r from-orange-50/10 to-transparent' 
                          : inc.status === 'dispute'
                          ? 'border-red-100 bg-gradient-to-r from-red-50/10 to-transparent'
                          : 'border-slate-150 hover:border-indigo-100'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${
                          inc.severity === 'Grave' ? 'bg-purple-400' :
                          inc.severity === 'Major' ? 'bg-amber-400' : 'bg-green-400'
                        }`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-green-700">{inc.reference_id}</span>
                            <span className={`badge ${getSeverityClass(inc.severity)}`}>{inc.severity}</span>
                            <span className={getStatusClass(inc.status)}>{getStatusLabel(inc.status)}</span>
                            {isRedirect && (
                              <span className="badge bg-orange-100 text-orange-850 font-bold">Redirect Requested</span>
                            )}
                            {inc.attachments && inc.attachments.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5" title={`${inc.attachments.length} attachment(s)`}>
                                <Paperclip size={10} />
                                <span>{inc.attachments.length}</span>
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-slate-800 mb-1">{inc.incident_type}</p>
                          <p className="text-xs text-slate-500 mb-2">
                            Reporter: {inc.reporter_name} ({inc.reporter_department}) · Location: {inc.main_location_name}{inc.sub_location_name ? ` - ${inc.sub_location_name}` : ''} · Date: {formatDate(inc.incident_date)}
                          </p>

                          {isRedirect && (
                            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 my-2 text-xs text-slate-700">
                              <div className="flex items-center gap-1.5 font-semibold text-orange-800 mb-1">
                                <AlertTriangle size={13} />
                                <span>Requested by HOD of {inc.redirect_requested_by_dept || 'Department'}</span>
                              </div>
                              <p className="italic">"{inc.redirect_reason || 'No reason provided.'}"</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1.5">
                            {(inc.departments || []).filter(Boolean).map((d, i) => (
                              <span key={i} className="badge-gray text-[10px]">{d}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={11} />
                            <span>{timeAgo(inc.created_at)}</span>
                          </div>
                          
                          <div className={`flex items-center gap-1 text-xs font-semibold transition-colors mt-4 group-hover:underline ${
                            isRedirect ? 'text-orange-700' : 'text-indigo-600'
                          }`}>
                            <span>{isRedirect ? 'Resolve Redirect' : 'Process Review'}</span>
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Trend */}
            <div className="card p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Trend (All Incidents)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e8edf4', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Severity */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Severity breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={bySeverity} cx="50%" cy="45%" innerRadius={50} outerRadius={75} dataKey="count" nameKey="severity" paddingAngle={3}>
                    {bySeverity.map((entry, i) => (
                      <Cell key={i} fill={COLORS_SEVERITY[entry.severity] || COLORS_PIE[i]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} formatter={val => <span style={{ fontSize: 11, color: '#64748b' }}>{val}</span>} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e8edf4', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Global Response KPI Averages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={Timer}
              label="Avg HOD Feedback Time"
              value={globalAverages.avgHod ? `${(globalAverages.avgHod).toFixed(1)} hrs` : 'N/A'}
              color="bg-amber-50"
              iconColor="text-amber-700"
              sub="Avg time from report to HOD action"
            />
            <StatCard
              icon={Timer}
              label="Avg IMC Feedback Time"
              value={globalAverages.avgImc ? `${(globalAverages.avgImc).toFixed(1)} hrs` : 'N/A'}
              color="bg-indigo-50"
              iconColor="text-indigo-700"
              sub="Avg time from HOD review to IMC action"
            />
            <StatCard
              icon={CheckCircle}
              label="Avg Resolution Time"
              value={globalAverages.avgRes ? `${(globalAverages.avgRes).toFixed(1)} hrs` : 'N/A'}
              color="bg-green-50"
              iconColor="text-green-700"
              sub="Avg overall resolution SLA"
            />
          </div>

          {/* Tables and Controls Card */}
          <div className="card p-5 space-y-4">
            {/* View selectors and search bar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
              {/* Toggle switch between departments and categories */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setAnalyticsSubView('departments');
                    setSortConfig({ key: 'total', direction: 'desc' });
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    analyticsSubView === 'departments'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Department-wise
                </button>
                <button
                  onClick={() => {
                    setAnalyticsSubView('categories');
                    setSortConfig({ key: 'total', direction: 'desc' });
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    analyticsSubView === 'categories'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Category-wise
                </button>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${analyticsSubView === 'departments' ? 'departments' : 'categories'}…`}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400"
                />
              </div>
            </div>

            {/* Table wrapper */}
            <div className="table-wrapper border border-slate-150 rounded-xl overflow-x-auto bg-white">
              <table className="table min-w-full divide-y divide-slate-150">
                <thead>
                  <tr className="bg-slate-50">
                    <th 
                      onClick={() => handleSort('name')} 
                      className="cursor-pointer select-none hover:bg-slate-100 transition-colors text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{analyticsSubView === 'departments' ? 'Department' : 'Incident Category'}</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('total')} 
                      className="cursor-pointer select-none hover:bg-slate-100 transition-colors text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-center w-36"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Received Incidents</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('feedbackGiven')} 
                      className="cursor-pointer select-none hover:bg-slate-100 transition-colors text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-center w-40"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Feedback Given</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('solved')} 
                      className="cursor-pointer select-none hover:bg-slate-100 transition-colors text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-center w-32"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Solved</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('avgHod')} 
                      className="cursor-pointer select-none hover:bg-slate-100 transition-colors text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-center w-48"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Avg HOD Response</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('avgImc')} 
                      className="cursor-pointer select-none hover:bg-slate-100 transition-colors text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-center w-48"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Avg IMC Response</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('avgRes')} 
                      className="cursor-pointer select-none hover:bg-slate-100 transition-colors text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 text-center w-44"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Avg Resolution SLA</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {processedAnalytics.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                        No matches found for "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    processedAnalytics.map(row => {
                      const pctFeedback = row.total > 0 ? Math.round((row.feedbackGiven / row.total) * 100) : 0;
                      
                      return (
                        <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                          {/* Name */}
                          <td className="py-3.5 px-4 text-sm font-semibold text-slate-800">
                            {row.name}
                          </td>
                          
                          {/* Received Count */}
                          <td className="py-3.5 px-4 text-sm font-bold text-slate-700 text-center">
                            {row.total}
                          </td>
                          
                          {/* Feedback Given Progress & Count */}
                          <td className="py-3.5 px-4 text-center">
                            {row.total > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-between w-full max-w-[120px] text-xs font-semibold text-slate-650">
                                  <span>{pctFeedback}%</span>
                                  <span>({row.feedbackGiven}/{row.total})</span>
                                </div>
                                <div className="w-full max-w-[120px] h-1.5 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      pctFeedback === 100 ? 'bg-green-500' : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${pctFeedback}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">—</span>
                            )}
                          </td>
                          
                          {/* Solved Count */}
                          <td className="py-3.5 px-4 text-center">
                            {row.total > 0 ? (
                              <span className={`inline-flex items-center gap-1 font-bold text-sm ${
                                row.solved === row.total 
                                  ? 'text-green-700' 
                                  : row.solved > 0 
                                  ? 'text-indigo-600' 
                                  : 'text-slate-500'
                              }`}>
                                {row.solved}
                                {row.solved === row.total && (
                                  <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-150 rounded px-1 py-0.5">
                                    All
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">—</span>
                            )}
                          </td>
                          
                          {/* Avg HOD Feedback time */}
                          <td className="py-3.5 px-4 text-sm text-center">
                            {formatDuration(row.avgHod)}
                          </td>
                          
                          {/* Avg IMC Feedback time */}
                          <td className="py-3.5 px-4 text-sm text-center">
                            {formatDuration(row.avgImc)}
                          </td>
                          
                          {/* Avg Resolution time */}
                          <td className="py-3.5 px-4 text-sm text-center">
                            {formatDuration(row.avgRes)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
