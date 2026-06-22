import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kbApi, metaApi } from '../../api';
import { EmptyState, Modal, Spinner, Pagination } from '../../components/ui';
import { BookOpen, Plus, Search, Lightbulb } from 'lucide-react';
import { INCIDENT_CATEGORIES, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function KnowledgeBasePage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [form, setForm] = useState({
    title: '', incidentType: '', departmentId: '', rootCause: '',
    preventiveActions: '', tags: '', incidentId: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-base', search, incidentType, page],
    queryFn: () => kbApi.list({ search, incidentType, page, limit: 10 }).then(r => r.data),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => metaApi.departments().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => kbApi.create(form),
    onSuccess: () => {
      toast.success('Knowledge base entry added.');
      setShowAdd(false);
      setForm({ title: '', incidentType: '', departmentId: '', rootCause: '', preventiveActions: '', tags: '', incidentId: '' });
      qc.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to add entry'),
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge Base</h1>
          <p className="page-subtitle">Learn from past incidents to prevent recurrence</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />
          Add Entry
        </button>
      </div>

      {/* Search & filter */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search title, cause, or tags…"
            className="input pl-9"
          />
        </div>
        <select value={incidentType} onChange={e => { setIncidentType(e.target.value); setPage(1); }} className="select w-44">
          <option value="">All Categories</option>
          {INCIDENT_CATEGORIES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Spinner size={28} /></div>
      ) : (data?.entries || []).length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No knowledge base entries yet"
          message="IMC members can add lessons learned from resolved incidents."
          action={
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={15} />
              Add First Entry
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {(data?.entries || []).map(entry => (
            <div
              key={entry.id}
              className="card overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lightbulb size={17} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-800">{entry.title}</h3>
                      <span className="badge-gray text-[10px] flex-shrink-0">{formatDate(entry.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.incident_type && (
                        <span className="badge-blue text-[10px]">{entry.incident_type}</span>
                      )}
                      {entry.department_name && (
                        <span className="badge-gray text-[10px]">{entry.department_name}</span>
                      )}
                      {entry.reference_id && (
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                          {entry.reference_id}
                        </span>
                      )}
                      {entry.tags && entry.tags.split(',').map(t => (
                        <span key={t} className="badge-gray text-[10px]">{t.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {expandedId === entry.id && (
                <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-4">
                  {entry.root_cause && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Root Cause</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{entry.root_cause}</p>
                    </div>
                  )}
                  {entry.preventive_actions && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Preventive Actions</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{entry.preventive_actions}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400">Added by {entry.created_by_name}</p>
                </div>
              )}
            </div>
          ))}
          <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
        </div>
      )}

      {/* Add Entry Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Knowledge Base Entry" size="lg"
        footer={
          <>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!form.title.trim() || !form.rootCause.trim() || createMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending ? <Spinner size={15} className="text-white" /> : null}
              Add Entry
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="field-label field-required">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Brief summary of the lesson learned" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Incident Category</label>
              <select value={form.incidentType} onChange={e => setForm(f => ({ ...f, incidentType: e.target.value }))} className="select">
                <option value="">Select…</option>
                {INCIDENT_CATEGORIES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Department</label>
              <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="select">
                <option value="">Select…</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Linked Incident Reference ID (optional)</label>
            <input value={form.incidentId} onChange={e => setForm(f => ({ ...f, incidentId: e.target.value }))} className="input font-mono" placeholder="e.g. JPHRC/IMS/2026/00001" />
          </div>
          <div>
            <label className="field-label field-required">Root Cause Analysis</label>
            <textarea value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))} className="textarea" rows={3} placeholder="What caused this incident?" />
          </div>
          <div>
            <label className="field-label">Preventive Actions</label>
            <textarea value={form.preventiveActions} onChange={e => setForm(f => ({ ...f, preventiveActions: e.target.value }))} className="textarea" rows={3} placeholder="What actions prevent recurrence?" />
          </div>
          <div>
            <label className="field-label">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="input" placeholder="e.g. medication, ward-b, nurse" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
