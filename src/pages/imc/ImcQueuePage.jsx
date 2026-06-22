import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { imcApi } from '../../api';
import { getSeverityClass, getStatusClass, getStatusLabel, formatDate, timeAgo } from '../../utils/helpers';
import { EmptyState, Spinner } from '../../components/ui';
import { ClipboardList, Clock, ChevronRight, AlertTriangle, Paperclip } from 'lucide-react';

export default function ImcQueuePage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['imc-queue'],
    queryFn: () => imcApi.queue().then(r => r.data),
    refetchInterval: 30000,
  });

  const filtered = filter === 'all' ? queue.filter(i => i.status !== 'redirect_requested')
    : filter === 'redirects' ? queue.filter(i => i.status === 'redirect_requested')
    : filter === 'grave' ? queue.filter(i => i.severity === 'Grave' && i.status !== 'redirect_requested')
    : queue;

  const counts = {
    all: queue.filter(i => i.status !== 'redirect_requested').length,
    grave: queue.filter(i => i.severity === 'Grave' && i.status !== 'redirect_requested').length,
    redirects: queue.filter(i => i.status === 'redirect_requested').length,
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">IMC Queue</h1>
          <p className="page-subtitle">{queue.length} incident{queue.length !== 1 ? 's' : ''} awaiting review</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'grave', label: 'Grave' },
          { key: 'redirects', label: 'Redirect Requests' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === tab.key
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-green-300'
            }`}
          >
            {tab.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
              filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
            }`}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Queue is empty" message="No incidents in the IMC queue matching this filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map(inc => {
            if (filter === 'redirects') {
              return (
                <div
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${encodeURIComponent(inc.id)}`)}
                  className="card p-5 cursor-pointer hover:shadow-card-hover border-orange-100 bg-gradient-to-r from-orange-50/20 to-transparent transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-1.5 self-stretch rounded-full flex-shrink-0 bg-orange-400" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-green-700">{inc.reference_id}</span>
                        <span className={`badge ${getSeverityClass(inc.severity)}`}>{inc.severity}</span>
                        <span className="badge bg-orange-100 text-orange-800 font-medium">Redirect Requisition</span>
                        {inc.attachments && inc.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5" title={`${inc.attachments.length} attachment(s)`}>
                            <Paperclip size={10} />
                            <span>{inc.attachments.length}</span>
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm font-semibold text-slate-800 mb-1">{inc.incident_type}</p>
                      
                      <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 my-2 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5 font-semibold text-orange-800 mb-1">
                          <AlertTriangle size={13} />
                          <span>Requested by HOD of {inc.redirect_requested_by_dept || 'Department'}</span>
                        </div>
                        <p className="italic">"{inc.redirect_reason || 'No reason provided.'}"</p>
                      </div>

                      <p className="text-xs text-slate-500">
                        Reporter: {inc.reporter_name} ({inc.reporter_department}) · Date: {formatDate(inc.incident_date)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                      <span className="text-xs text-orange-700 bg-orange-50 border border-orange-150 rounded-lg px-2.5 py-1">
                        Awaiting Action
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:underline mt-2">
                        <span>Process Request</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={inc.id}
                onClick={() => navigate(`/incidents/${encodeURIComponent(inc.id)}`)}
                className="card p-4 cursor-pointer hover:shadow-card-hover transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Severity indicator */}
                  <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${
                    inc.severity === 'Grave' ? 'bg-purple-400' :
                    inc.severity === 'Major' ? 'bg-amber-400' : 'bg-green-400'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-green-700">{inc.reference_id}</span>
                      <span className={`badge ${getSeverityClass(inc.severity)}`}>{inc.severity}</span>
                      <span className={getStatusClass(inc.status)}>{getStatusLabel(inc.status)}</span>
                      {inc.attachments && inc.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5" title={`${inc.attachments.length} attachment(s)`}>
                          <Paperclip size={10} />
                          <span>{inc.attachments.length}</span>
                        </span>
                      )}
                      {inc.severity === 'Grave' && (
                        <span className="badge badge-purple flex items-center gap-1">
                          <AlertTriangle size={10} />
                          Grave
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-slate-800 mb-1">{inc.incident_type}</p>
                    <p className="text-xs text-slate-500 mb-2">
                      {inc.reporter_name} · {inc.main_location_name}{inc.sub_location_name ? ` - ${inc.sub_location_name}` : ''} · {formatDate(inc.incident_date)}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {(inc.departments || []).filter(Boolean).map((d, i) => (
                        <span key={i} className="badge-gray text-[10px]">{d}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={11} />
                      {timeAgo(inc.created_at)}
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
