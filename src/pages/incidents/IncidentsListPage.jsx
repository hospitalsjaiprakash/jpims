import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { incidentsApi } from '../../api';
import { getSeverityClass, getStatusClass, getStatusLabel, formatDate, INCIDENT_CATEGORIES, SEVERITY_OPTIONS } from '../../utils/helpers';
import { EmptyState, Pagination, Spinner, Tabs } from '../../components/ui';
import { FileText, Search, Filter, X, FilePlus, ChevronRight, Layers, User, Paperclip } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function IncidentsListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [filters, setFilters] = useState({ status: '', severity: '', incidentCategory: '', dateFrom: '', dateTo: '', page: 1, viewMode: 'department' });
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');

  const queryKey = ['incidents', filters];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => incidentsApi.list(filters).then(r => r.data),
    keepPreviousData: true,
  });

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const clearFilters = () => setFilters(f => ({ status: '', severity: '', incidentCategory: '', dateFrom: '', dateTo: '', page: 1, viewMode: f.viewMode }));
  const hasFilters = filters.status || filters.severity || filters.incidentCategory || filters.dateFrom || filters.dateTo;

  const STATUS_OPTIONS = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'with_hod', label: 'HOD Review' },
    { value: 'with_imc', label: 'IMC Review' },
    { value: 'with_head_management', label: 'Management Review' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'dispute', label: 'Under Dispute' },
  ];

  const incidents = data?.incidents || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header pb-2">
        <div>
          <h1 className="page-title">Incidents</h1>
          <p className="page-subtitle">
            {data?.total ? `${data.total} total incident${data.total !== 1 ? 's' : ''}` : 'All reported incidents'}
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
            { id: 'department', label: 'Received Incidents', icon: Layers },
            { id: 'my_incidents', label: 'My Incidents', icon: User }
          ]}
          active={filters.viewMode}
          onChange={(id) => setFilter('viewMode', id)}
        />
      )}

      {/* Search and filter bar */}
      <div className="card p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by reference ID…"
              className="input pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex-shrink-0 ${hasFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}`}
          >
            <Filter size={15} />
            Filters
            {hasFilters && <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">!</span>}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-icon flex-shrink-0" title="Clear filters">
              <X size={16} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="field-label text-xs">Status</label>
              <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="select text-xs py-2">
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label text-xs">Severity</label>
              <select value={filters.severity} onChange={e => setFilter('severity', e.target.value)} className="select text-xs py-2">
                <option value="">All Severities</option>
                {SEVERITY_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label text-xs">Category</label>
              <select value={filters.incidentCategory} onChange={e => setFilter('incidentCategory', e.target.value)} className="select text-xs py-2">
                <option value="">All Categories</option>
                {INCIDENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label text-xs">From</label>
              <input type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} className="input text-xs py-2" />
            </div>
            <div>
              <label className="field-label text-xs">To</label>
              <input type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} className="input text-xs py-2" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : incidents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No incidents found"
            message={hasFilters ? 'Try adjusting your filters to see more results.' : 'No incidents have been reported yet.'}
            action={user?.role === 'employee' && (
              <button onClick={() => navigate('/incidents/new')} className="btn-primary">
                <FilePlus size={15} />
                Report First Incident
              </button>
            )}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference ID</th>
                    {['imc', 'head_management', 'system_admin'].includes(user?.role) && <th>Reporter (Employee ID)</th>}
                    <th>Type</th>
                    <th>Department(s)</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map(inc => (
                    <tr
                      key={inc.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/incidents/${encodeURIComponent(inc.id)}`)}
                    >
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-green-700">{inc.reference_id}</span>
                          {inc.attachments && inc.attachments.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded px-1 py-0.5" title={`${inc.attachments.length} attachment(s)`}>
                              <Paperclip size={10} />
                              <span>{inc.attachments.length}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      {['imc', 'head_management', 'system_admin'].includes(user?.role) && (
                        <td className="text-xs text-slate-700">
                          <div className="font-semibold text-slate-800">{inc.reporter_name || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {inc.reporter_employee_id || 'N/A'}</div>
                        </td>
                      )}
                      <td className="text-slate-600 text-xs">{inc.incident_type}</td>
                      <td>
                        <span className="text-xs text-slate-600">
                          {(inc.departments || []).slice(0, 2).filter(Boolean).join(', ')}
                          {(inc.departments || []).filter(Boolean).length > 2 && ` +${inc.departments.length - 2}`}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getSeverityClass(inc.severity)}`}>{inc.severity}</span>
                      </td>
                      <td>
                        <span className={getStatusClass(inc.status)}>{getStatusLabel(inc.status)}</span>
                      </td>
                      <td className="text-xs text-slate-500">{formatDate(inc.incident_date)}</td>
                      <td>
                        <ChevronRight size={16} className="text-slate-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200">
              <Pagination
                page={filters.page}
                totalPages={data?.totalPages || 1}
                onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
