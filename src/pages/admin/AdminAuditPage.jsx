import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { Spinner, Pagination } from '../../components/ui';
import { Shield, Search } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

const ACTION_COLORS = {
  LOGIN: 'badge-green',
  INCIDENT_CREATED: 'badge-blue',
  INCIDENT_RESOLVED: 'badge-green',
  INCIDENT_WITHDRAWN: 'badge-gray',
  INCIDENT_REOPENED: 'badge-yellow',
  HOD_FEEDBACK_SUBMITTED: 'badge-yellow',
  IMC_FEEDBACK_SUBMITTED: 'badge-blue',
  IMC_CLAIM: 'badge-blue',
  DISPUTE_RAISED: 'badge-red',
  ROLE_ASSIGNED_IMC: 'badge-purple',
  CONFIG_UPDATED: 'badge-red',
};

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, dateFrom, dateTo, action],
    queryFn: () => adminApi.getAuditLogs({ page, limit: 50, dateFrom, dateTo, action }).then(r => r.data),
  });

  const ACTIONS = [
    'LOGIN', 'INCIDENT_CREATED', 'INCIDENT_RESOLVED', 'INCIDENT_WITHDRAWN',
    'HOD_FEEDBACK_SUBMITTED', 'IMC_FEEDBACK_SUBMITTED', 'IMC_CLAIM',
    'DISPUTE_RAISED', 'ROLE_ASSIGNED_IMC', 'CONFIG_UPDATED',
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Complete history of all system actions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className="select w-52">
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">From</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="input w-36 text-xs py-2" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">To</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="input w-36 text-xs py-2" />
        </div>
        {data?.total && (
          <span className="ml-auto text-xs text-slate-500 self-center">
            {data.total.toLocaleString()} total records
          </span>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={28} /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Incident</th>
                    <th>IP Address</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.logs || []).length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">No audit logs found</td></tr>
                  ) : (data?.logs || []).map(log => (
                    <tr key={log.id}>
                      <td className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                      <td>
                        <div>
                          <p className="text-xs font-medium text-slate-800">{log.full_name || '—'}</p>
                          <p className="text-[10px] text-slate-400">{log.employee_id}</p>
                        </div>
                      </td>
                      <td>
                        <span className={`badge text-[10px] ${ACTION_COLORS[log.action] || 'badge-gray'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-blue-700">{log.reference_id || '—'}</td>
                      <td className="font-mono text-xs text-slate-500">{log.ip_address || '—'}</td>
                      <td className="max-w-48">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <details className="group">
                            <summary className="text-xs text-blue-600 cursor-pointer">View</summary>
                            <pre className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded mt-1 overflow-auto max-h-24">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200">
              <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
