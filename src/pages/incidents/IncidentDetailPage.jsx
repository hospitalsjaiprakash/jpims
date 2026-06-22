import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsApi, metaApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import {
  getSeverityClass, getStatusLabel, getStatusClass,
  formatDate, formatDateTime
} from '../../utils/helpers';
import { OCCURRED_TO_OPTIONS, SEVERITY_OPTIONS } from '../../utils/helpers';
import { Alert, Modal, Spinner } from '../../components/ui';
import {
  ArrowLeft, MapPin, Calendar, User, FileText, CheckCircle,
  Clock, XCircle, AlertTriangle, MessageSquare, ChevronRight,
  Undo2, ThumbsDown, Users, Building, Pencil, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const TIMELINE_STAGES = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'with_hod', label: 'HOD Review' },
  { key: 'with_imc', label: 'IMC Review' },
  { key: 'with_head_management', label: 'Management Review' },
  { key: 'resolved', label: 'Resolved' },
];

const statusOrder = {
  submitted: 0, with_hod: 1, with_hod_and_imc: 1, with_imc: 2,
  redirect_requested: 2, with_head_management: 3, resolved: 4,
};

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showMdModal, setShowMdModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  // Edit own feedback modal (HOD / IMC / Management)
  const [editFbModal, setEditFbModal] = useState(null); // { feedbackType, currentText }
  const [editFbText, setEditFbText] = useState('');

  // Edit incident modal (Employee only, while still 'submitted')
  const [showEditIncModal, setShowEditIncModal] = useState(false);
  const [editInc, setEditInc] = useState({});

  const [withdrawReason, setWithdrawReason] = useState('');
  const [disputeMsg, setDisputeMsg] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [mdFaultType, setMdFaultType] = useState('');
  const [mdActions, setMdActions] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [hodAcknowledged, setHodAcknowledged] = useState(false);
  const [redirectReason, setRedirectReason] = useState('');
  const [redirectTargetDept, setRedirectTargetDept] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentsApi.get(id).then(r => r.data),
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ['incident', id] });

  const withdrawMutation = useMutation({
    mutationFn: () => incidentsApi.withdraw(id, { reason: withdrawReason }),
    onSuccess: () => { toast.success('Incident withdrawn.'); setShowWithdrawModal(false); refetch(); }
  });

  const disputeMutation = useMutation({
    mutationFn: () => incidentsApi.raiseDispute(id, { message: disputeMsg }),
    onSuccess: () => { toast.success('Dispute raised.'); setShowDisputeModal(false); refetch(); }
  });

  const hodFeedbackMutation = useMutation({
    mutationFn: () => incidentsApi.hodFeedback(id, { feedbackText, acknowledged: hodAcknowledged }),
    onSuccess: () => { toast.success('Feedback submitted.'); setShowFeedbackModal(false); refetch(); }
  });

  const imcFeedbackMutation = useMutation({
    mutationFn: (forwardToMd) => incidentsApi.imcFeedback(id, { feedbackText, forwardToMd }),
    onSuccess: () => { toast.success('Feedback submitted.'); setShowFeedbackModal(false); refetch(); }
  });

  const mdMutation = useMutation({
    mutationFn: () => incidentsApi.mdDecision(id, { faultType: mdFaultType, correctiveActions: mdActions }),
    onSuccess: () => { toast.success('Incident closed.'); setShowMdModal(false); refetch(); }
  });

  const reopenMutation = useMutation({
    mutationFn: () => incidentsApi.reopen(id, { reason: reopenReason }),
    onSuccess: () => { toast.success('Incident reopened.'); setShowReopenModal(false); refetch(); }
  });

  // Edit own feedback (role-based)
  const editFeedbackMutation = useMutation({
    mutationFn: ({ feedbackType, feedbackText: ft }) =>
      incidentsApi.editFeedback(id, { feedbackType, feedbackText: ft }),
    onSuccess: () => {
      toast.success('Feedback updated.');
      setEditFbModal(null);
      setEditFbText('');
      refetch();
      qc.invalidateQueries({ queryKey: ['all-incidents-analytics'] });
    },
    onError: () => toast.error('Failed to update feedback.'),
  });

  // Edit incident (employee reporter only, while still 'submitted')
  const editIncidentMutation = useMutation({
    mutationFn: (data) => incidentsApi.updateIncident(id, data),
    onSuccess: () => {
      toast.success('Incident updated.');
      setShowEditIncModal(false);
      refetch();
    },
    onError: () => toast.error('Failed to update incident.'),
  });

  const openEditFeedback = (feedbackType, currentText) => {
    setEditFbModal({ feedbackType });
    setEditFbText(currentText || '');
  };

  const openEditIncident = (inc) => {
    setEditInc({
      description: inc.description || '',
      severity: inc.severity || '',
      occurredTo: inc.occurred_to || '',
      incidentDate: inc.incident_date || '',
      incidentTime: inc.incident_time?.slice(0, 5) || '',
    });
    setShowEditIncModal(true);
  };

  const requestRedirectMutation = useMutation({
    mutationFn: () => incidentsApi.requestRedirect(id, { reason: redirectReason }),
    onSuccess: () => {
      toast.success('Redirection request submitted to IMC.');
      setShowRedirectModal(false);
      refetch();
    }
  });

  const approveRedirectMutation = useMutation({
    mutationFn: () => incidentsApi.approveRedirect(id, { targetDepartment: redirectTargetDept }),
    onSuccess: () => {
      toast.success('Incident successfully redirected.');
      setRedirectTargetDept('');
      refetch();
    }
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => metaApi.departments().then(r => r.data || []),
  });
  const departmentsList = deptsData || [];

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;
  if (error || !data) return <Alert type="error" title="Not found" message="Incident not found or access denied." />;

  const { incident, feedbacks, attachments, disputes, finalReport } = data;
  const currentStageIndex = statusOrder[incident.status] ?? -1;

  const canWithdraw = user?.id === incident.reporter_id &&
    incident.status === 'submitted' &&
    !incident.hod_first_viewed_at;

  const canHodFeedback = user?.role === 'hod' &&
    ['with_hod', 'with_hod_and_imc'].includes(incident.status);

  const canRequestRedirect = user?.role === 'hod' &&
    ['with_hod', 'with_hod_and_imc'].includes(incident.status);

  const canImcAct = user?.role === 'imc' &&
    ['with_imc', 'with_hod_and_imc', 'redirect_requested', 'dispute'].includes(incident.status);

  const canMdAct = user?.role === 'head_management' &&
    incident.status === 'with_head_management';

  const canDispute = user?.id === incident.reporter_id &&
    incident.status === 'resolved';

  const canReopen = (user?.role === 'head_management' || user?.role === 'imc') &&
    incident.status === 'resolved';

  return (
    <div className="w-full space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/incidents')} className="btn-ghost text-slate-500 -ml-1">
        <ArrowLeft size={16} />
        Back to Incidents
      </button>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-base font-bold text-green-700">{incident.reference_id}</span>
              <span className={getStatusClass(incident.status)}>{getStatusLabel(incident.status)}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 font-display">{incident.incident_type}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {formatDate(incident.incident_date)} at {incident.incident_time?.slice(0,5)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {incident.main_location_name} › {incident.sub_location_name}
              </span>
              <span className="flex items-center gap-1.5">
                <User size={13} />
                {incident.reporter_name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${getSeverityClass(incident.severity)}`}>{incident.severity}</span>
          </div>
        </div>

        {/* Action buttons */}
        {(canWithdraw || canHodFeedback || canRequestRedirect || canMdAct || canDispute || canReopen
          || (user?.id === incident.reporter_id && incident.status === 'submitted')
        ) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
            {/* Employee: edit their own incident while still submitted */}
            {user?.id === incident.reporter_id && incident.status === 'submitted' && (
              <button onClick={() => openEditIncident(incident)} className="btn-secondary btn-sm">
                <Pencil size={14} /> Edit Incident
              </button>
            )}
            {canWithdraw && (
              <button onClick={() => setShowWithdrawModal(true)} className="btn-secondary btn-sm">
                <XCircle size={14} />
                Withdraw
              </button>
            )}
            {canHodFeedback && (
              <button onClick={() => setShowFeedbackModal(true)} className="btn-primary btn-sm">
                <MessageSquare size={14} />
                Submit Feedback
              </button>
            )}
            {canRequestRedirect && (
              <button onClick={() => setShowRedirectModal(true)} className="btn-secondary btn-sm border-orange-200 text-orange-700 hover:bg-orange-50">
                <AlertTriangle size={14} />
                Request Redirection to IMC
              </button>
            )}
            {canMdAct && (
              <button onClick={() => setShowMdModal(true)} className="btn-primary btn-sm">
                <CheckCircle size={14} />
                Close & Generate Report
              </button>
            )}
            {canDispute && (
              <button onClick={() => setShowDisputeModal(true)} className="btn-secondary btn-sm">
                <ThumbsDown size={14} />
                Dispute Resolution
              </button>
            )}
            {canReopen && (
              <button onClick={() => setShowReopenModal(true)} className="btn-ghost btn-sm text-slate-600">
                <Undo2 size={14} />
                Re-open
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Incident details */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Incident Details</h2>
            <div className="space-y-3 text-sm">
              <DetailRow icon={Building} label="Departments" value={(incident.departments||[]).map(d => typeof d === 'string' ? d : d.name).join(', ') || '—'} />
              <DetailRow icon={Users} label="Occurred To" value={incident.occurred_to} />
              <DetailRow icon={AlertTriangle} label="Severity" value={incident.severity} />
              <DetailRow icon={FileText} label="Category" value={incident.incident_category} />
              <DetailRow icon={FileText} label="Type" value={incident.incident_type} />
              {incident.has_responsible_person && (
                <DetailRow icon={User} label="Responsible Person" value={incident.responsible_person_name || '—'} />
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
            </div>
          </div>

          {/* IMC Inline Review & Action Card */}
          {canImcAct && (
            <div className="card p-5 border-indigo-200 bg-indigo-50/10">
              {incident.status === 'redirect_requested' ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="text-orange-600 animate-pulse" size={18} />
                    <h2 className="text-sm font-semibold text-slate-800">Redirection Request Review</h2>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                    <p className="text-xs text-orange-800 font-semibold uppercase tracking-wider mb-1">
                      Requested by HOD of {incident.redirect_requested_by_dept || 'Department'}
                    </p>
                    <p className="text-sm text-slate-700 italic">
                      "{incident.redirect_reason || 'No reason provided.'}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="field-label field-required mb-1.5 font-medium text-slate-700">Select Concern Department (Target HOD)</label>
                      <select
                        value={redirectTargetDept}
                        onChange={e => setRedirectTargetDept(e.target.value)}
                        className="select"
                      >
                        <option value="">-- Select Department --</option>
                        {departmentsList.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => approveRedirectMutation.mutate()}
                        disabled={!redirectTargetDept || approveRedirectMutation.isPending}
                        className="btn-primary flex items-center gap-2 bg-orange-600 hover:bg-orange-700 border-orange-600"
                      >
                        {approveRedirectMutation.isPending && <Spinner size={14} className="text-white" />}
                        Approve & Redirect to Concern Department
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="text-indigo-600" size={18} />
                    <h2 className="text-sm font-semibold text-slate-800">IMC Review & Action</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="field-label field-required mb-1.5">Your Review / Feedback</label>
                      <textarea
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        className="textarea"
                        rows={4}
                        placeholder="Provide your detailed review, findings, and recommendations..."
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => imcFeedbackMutation.mutate(false)}
                        disabled={!feedbackText.trim() || imcFeedbackMutation.isPending}
                        className="btn-secondary btn-sm"
                      >
                        {imcFeedbackMutation.isPending ? <Spinner size={12} /> : null}
                        Save Feedback
                      </button>
                      <button
                        onClick={() => imcFeedbackMutation.mutate(true)}
                        disabled={!feedbackText.trim() || imcFeedbackMutation.isPending}
                        className="btn-primary btn-sm"
                      >
                        {imcFeedbackMutation.isPending ? <Spinner size={12} /> : null}
                        Forward to Management
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Status messages for employees */}
          {user?.role === 'employee' && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Current Status</h2>
              <StatusMessage status={incident.status} />
            </div>
          )}

          {/* Feedbacks */}
          {feedbacks?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Review History</h2>
              <div className="space-y-4">
                {feedbacks.map(fb => {
                  // Show Edit button only to the role that submitted this feedback
                  const canEditThisFb =
                    (fb.role === 'hod' && user?.role === 'hod') ||
                    (fb.role === 'imc' && user?.role === 'imc') ||
                    (fb.role === 'head_management' && user?.role === 'head_management');
                  return (
                    <div key={fb.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                            {fb.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{fb.full_name}</p>
                            <p className="text-[10px] text-slate-500">{fb.designation} · {fb.role?.replace('_', ' ').toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{formatDateTime(fb.created_at)}</span>
                          {canEditThisFb && (
                            <button
                              onClick={() => openEditFeedback(fb.role, fb.feedback_text)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                              title="Edit your feedback"
                            >
                              <Pencil size={11} /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed mt-2">{fb.feedback_text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Final report */}
          {finalReport && (
            <div className="card p-5 border-green-500 bg-green-50/30">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-700 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-slate-800 mb-2">Final Report</h2>
                  <p className="text-xs text-slate-500 mb-2">Fault Type: <strong>{finalReport.fault_type}</strong></p>
                  <p className="text-sm text-slate-700 leading-relaxed">{finalReport.corrective_actions}</p>
                  <p className="text-xs text-slate-400 mt-2">Generated {formatDateTime(finalReport.generated_at)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Disputes */}
          {disputes?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Dispute History</h2>
              {disputes.map(d => (
                <div key={d.id} className="border border-red-200 bg-red-50/30 rounded-xl p-4">
                  <p className="text-xs font-medium text-red-700 mb-1">Employee Dispute</p>
                  <p className="text-sm text-slate-700">{d.employee_message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">{formatDateTime(d.raised_at)}</p>
                  {d.response_text && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs font-medium text-slate-600 mb-1">Response</p>
                      <p className="text-sm text-slate-700">{d.response_text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Timeline */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Progress</h2>
            <div className="space-y-0">
              {TIMELINE_STAGES.map((stage, i) => {
                const done = statusOrder[incident.status] > i;
                const active = statusOrder[incident.status] === i;
                return (
                  <div key={stage.key} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < TIMELINE_STAGES.length - 1 && (
                      <div className={`absolute left-3.5 top-7 bottom-0 w-px ${done ? 'bg-success-400' : 'bg-slate-200'}`} />
                    )}
                    <div className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {done ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${active ? 'text-blue-700' : done ? 'text-green-700' : 'text-slate-400'}`}>
                        {stage.label}
                      </p>
                      {active && <p className="text-xs text-blue-500 mt-0.5 flex items-center gap-1"><Clock size={11} /> In progress</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attachments */}
          {attachments?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Attachments ({attachments.length})</h2>
              <div className="space-y-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                    <FileText size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate flex-1">{att.original_filename}</span>
                    <span className="badge-gray px-1.5 py-0.5 text-[10px]">{att.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Information</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Submitted</dt>
                <dd className="text-slate-700 text-right">{formatDate(incident.created_at)}</dd>
              </div>
              {incident.resolved_at && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Resolved</dt>
                  <dd className="text-slate-700 text-right">{formatDate(incident.resolved_at)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Disputes</dt>
                <dd className="text-slate-700">{incident.dispute_count || 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <Modal open={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Withdraw Incident"
        footer={<>
          <button onClick={() => setShowWithdrawModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={() => withdrawMutation.mutate()} disabled={withdrawMutation.isPending} className="btn-danger">
            {withdrawMutation.isPending ? <Spinner size={15} className="text-white" /> : null}
            Withdraw
          </button>
        </>}
      >
        <Alert type="warning" message="This action cannot be undone. The incident will be withdrawn and marked as such." className="mb-4" />
        <label className="field-label">Reason for withdrawal (optional)</label>
        <textarea value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)} className="textarea" rows={3} placeholder="Why are you withdrawing this incident?" />
      </Modal>

      {/* Dispute Modal */}
      <Modal open={showDisputeModal} onClose={() => setShowDisputeModal(false)} title="Raise a Dispute"
        footer={<>
          <button onClick={() => setShowDisputeModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={() => disputeMutation.mutate()} disabled={!disputeMsg.trim() || disputeMutation.isPending} className="btn-danger">
            Submit Dispute
          </button>
        </>}
      >
        <p className="text-sm text-slate-600 mb-4">If you disagree with the resolution, describe your concern below. The IMC and Management will review.</p>
        <label className="field-label field-required">Your message</label>
        <textarea value={disputeMsg} onChange={e => setDisputeMsg(e.target.value)} className="textarea" rows={4} placeholder="Describe why you disagree with the resolution…" />
      </Modal>

      {/* Feedback Modal (HOD only now, since IMC has inline card) */}
      <Modal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Submit Feedback" size="lg"
        footer={<>
          <button onClick={() => setShowFeedbackModal(false)} className="btn-secondary">Cancel</button>
          {canHodFeedback && (
            <button
              onClick={() => hodFeedbackMutation.mutate()}
              disabled={!feedbackText.trim() || !hodAcknowledged || hodFeedbackMutation.isPending}
              className="btn-primary"
            >
              {hodFeedbackMutation.isPending ? <Spinner size={15} className="text-white" /> : null}
              Submit Feedback
            </button>
          )}
        </>}
      >
        {canHodFeedback && (
          <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hodAcknowledged}
                onChange={e => setHodAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">
                I acknowledge that I have reviewed the incident details and am providing feedback as Head of Department.
              </span>
            </label>
          </div>
        )}
        <label className="field-label field-required">Feedback</label>
        <textarea
          value={feedbackText}
          onChange={e => setFeedbackText(e.target.value)}
          className="textarea"
          rows={5}
          placeholder="Provide your detailed review and recommendations…"
        />
      </Modal>

      {/* MD Decision Modal */}
      <Modal open={showMdModal} onClose={() => setShowMdModal(false)} title="Final Decision & Close Incident" size="lg"
        footer={<>
          <button onClick={() => setShowMdModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={() => mdMutation.mutate()} disabled={!mdFaultType || !mdActions.trim() || mdMutation.isPending} className="btn-primary">
            {mdMutation.isPending ? <Spinner size={15} className="text-white" /> : null}
            Close & Generate Report
          </button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="field-label field-required">Fault Type</label>
            <input value={mdFaultType} onChange={e => setMdFaultType(e.target.value)} className="input" placeholder="e.g. System Failure, Human Error, Process Gap…" />
          </div>
          <div>
            <label className="field-label field-required">Corrective Actions</label>
            <textarea value={mdActions} onChange={e => setMdActions(e.target.value)} className="textarea" rows={5} placeholder="Describe the corrective actions taken or recommended…" />
          </div>
        </div>
      </Modal>

      {/* Reopen Modal */}
      <Modal open={showReopenModal} onClose={() => setShowReopenModal(false)} title="Re-open Incident"
        footer={<>
          <button onClick={() => setShowReopenModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={() => reopenMutation.mutate()} disabled={!reopenReason.trim() || reopenMutation.isPending} className="btn-primary">
            Re-open
          </button>
        </>}
      >
        <Alert type="info" message="Re-opening will return this incident to IMC review. This action is logged." className="mb-4" />
        <label className="field-label field-required">Reason for re-opening</label>
        <textarea value={reopenReason} onChange={e => setReopenReason(e.target.value)} className="textarea" rows={3} placeholder="Why is this incident being re-opened?" />
      </Modal>

      {/* Redirection Request Modal */}
      <Modal open={showRedirectModal} onClose={() => setShowRedirectModal(false)} title="Request Redirection to IMC"
        footer={<>
          <button onClick={() => setShowRedirectModal(false)} className="btn-secondary">Cancel</button>
          <button
            onClick={() => requestRedirectMutation.mutate()}
            disabled={!redirectReason.trim() || requestRedirectMutation.isPending}
            className="btn-danger bg-orange-600 hover:bg-orange-700 border-orange-600 focus:ring-orange-500"
          >
            {requestRedirectMutation.isPending ? <Spinner size={15} className="text-white" /> : null}
            Request Redirection
          </button>
        </>}
      >
        <Alert type="warning" message="This action will flag this incident as misrouted. The Incident Management Committee (IMC) will review your request and route it to the correct department HOD." className="mb-4" />
        <label className="field-label field-required">Reason for redirection request</label>
        <textarea
          value={redirectReason}
          onChange={e => setRedirectReason(e.target.value)}
          className="textarea"
          rows={4}
          placeholder="Please explain why this incident is not for your department, and suggest the correct department if possible…"
        />
      </Modal>

      {/* ── EDIT OWN FEEDBACK MODAL (HOD / IMC / Management) ── */}
      <Modal
        open={!!editFbModal}
        onClose={() => { setEditFbModal(null); setEditFbText(''); }}
        title={editFbModal ? `Edit ${editFbModal.feedbackType.replace('head_management','Management').replace('hod','HOD').replace('imc','IMC').toUpperCase()} Feedback` : ''}
        size="md"
        footer={
          <>
            <button onClick={() => { setEditFbModal(null); setEditFbText(''); }} className="btn-secondary">Cancel</button>
            <button
              disabled={editFeedbackMutation.isPending || !editFbText.trim()}
              onClick={() => editFeedbackMutation.mutate({ feedbackType: editFbModal.feedbackType, feedbackText: editFbText })}
              className="btn-primary disabled:opacity-60"
            >
              {editFeedbackMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editFbModal && (
          <div className="space-y-4 pt-1">
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700">
                You are editing your own <strong>{editFbModal.feedbackType.replace('head_management','Management').replace('hod','HOD').replace('imc','IMC')}</strong> feedback.
                This change will be recorded in the audit trail.
              </p>
            </div>
            <div>
              <label className="field-label field-required">Corrected Feedback</label>
              <textarea
                rows={5}
                value={editFbText}
                onChange={e => setEditFbText(e.target.value)}
                className="textarea"
                placeholder="Update your feedback…"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── EDIT INCIDENT MODAL (Employee reporter, submitted status only) ── */}
      <Modal
        open={showEditIncModal}
        onClose={() => setShowEditIncModal(false)}
        title="Edit Incident"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowEditIncModal(false)} className="btn-secondary">Cancel</button>
            <button
              disabled={editIncidentMutation.isPending || !editInc.description?.trim()}
              onClick={() => editIncidentMutation.mutate(editInc)}
              className="btn-primary disabled:opacity-60"
            >
              {editIncidentMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4 pt-1">
          <Alert type="info" message="You can edit this incident only while it hasn't been reviewed by your HOD yet." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label field-required">Incident Date</label>
              <input
                type="date"
                value={editInc.incidentDate || ''}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setEditInc(p => ({ ...p, incidentDate: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="field-label field-required">Incident Time</label>
              <input
                type="time"
                value={editInc.incidentTime || ''}
                onChange={e => setEditInc(p => ({ ...p, incidentTime: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="field-label field-required">Occurred To</label>
              <select
                value={editInc.occurredTo || ''}
                onChange={e => setEditInc(p => ({ ...p, occurredTo: e.target.value }))}
                className="select"
              >
                <option value="">Select…</option>
                {OCCURRED_TO_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label field-required">Severity</label>
              <select
                value={editInc.severity || ''}
                onChange={e => setEditInc(p => ({ ...p, severity: e.target.value }))}
                className="select"
              >
                <option value="">Select…</option>
                {SEVERITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label field-required">
              Description
              <span className="text-slate-400 font-normal ml-1">({(editInc.description || '').length}/2000)</span>
            </label>
            <textarea
              rows={5}
              value={editInc.description || ''}
              onChange={e => setEditInc(p => ({ ...p, description: e.target.value }))}
              maxLength={2000}
              className="textarea"
              placeholder="Update the incident description…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 flex justify-between gap-4 min-w-0">
        <span className="text-slate-500 flex-shrink-0">{label}</span>
        <span className="text-slate-800 text-right font-medium truncate">{value || '—'}</span>
      </div>
    </div>
  );
}

function StatusMessage({ status }) {
  const msgs = {
    submitted: { type: 'info', msg: 'Your incident has been submitted successfully and is awaiting HOD review.' },
    with_hod: { type: 'info', msg: 'Your incident has been reviewed by the Head of Department and is being processed.' },
    with_hod_and_imc: { type: 'info', msg: 'Due to grave severity, your incident is under simultaneous HOD and IMC review.' },
    with_imc: { type: 'info', msg: 'Your incident is currently under review by the Incident Management Committee.' },
    with_head_management: { type: 'info', msg: 'Your incident is under consideration by Hospital Management.' },
    resolved: { type: 'success', msg: 'Your incident has been resolved. View the final report below.' },
    dispute: { type: 'warning', msg: 'Your dispute has been raised and is being reviewed by the IMC and Management.' },
    withdrawn: { type: 'warning', msg: 'This incident has been withdrawn by you.' },
    redirect_requested: { type: 'warning', msg: 'A redirection request has been submitted to the IMC for routing to the correct department.' },
  };
  const { type, msg } = msgs[status] || { type: 'info', msg: 'Status updated.' };
  return <Alert type={type} message={msg} />;
}
