import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { EmptyState, Spinner, Modal, Alert, Pagination } from '../../components/ui';
import { Users, Search, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ employeeId: '', isImcLead: false });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: () => adminApi.getUsers({ search, role: roleFilter, page, limit: 20 }).then(r => r.data),
  });

  const { data: imcMembers = [] } = useQuery({
    queryKey: ['imc-members'],
    queryFn: () => adminApi.getImcMembers().then(r => r.data),
  });

  const { data: roleAudit = [] } = useQuery({
    queryKey: ['role-audit'],
    queryFn: () => adminApi.getRoleAudit().then(r => r.data),
  });

  const assignMutation = useMutation({
    mutationFn: (data) => adminApi.assignImc(data),
    onSuccess: () => {
      toast.success('IMC role assigned successfully.');
      setShowAssignModal(false);
      setAssignForm({ employeeId: '', isImcLead: false });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['imc-members'] });
      qc.invalidateQueries({ queryKey: ['role-audit'] });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to assign role'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => adminApi.removeImc(id),
    onSuccess: () => {
      toast.success('IMC role removed.');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['imc-members'] });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to remove role'),
  });

  const ROLES = [
    { value: '', label: 'All Roles' },
    { value: 'employee', label: 'Employee' },
    { value: 'hod', label: 'HOD' },
    { value: 'imc', label: 'IMC' },
    { value: 'head_management', label: 'Management' },
    { value: 'system_admin', label: 'Admin' },
  ];

  const roleColorMap = {
    employee: 'badge-gray',
    hod: 'badge-yellow',
    imc: 'badge-blue',
    head_management: 'badge-purple',
    system_admin: 'badge-red',
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Roles</h1>
          <p className="page-subtitle">Manage employee roles and IMC membership</p>
        </div>
        <button onClick={() => setShowAssignModal(true)} className="btn-primary">
          <Plus size={16} />
          Assign IMC Role
        </button>
      </div>

      {/* IMC Members highlight */}
      {imcMembers.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={17} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-800">IMC Members ({imcMembers.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {imcMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-bold text-sm">{m.full_name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.full_name}</p>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{m.employee_id} · {m.department}</p>
                </div>
                <button
                  onClick={() => removeMutation.mutate(m.id)}
                  disabled={removeMutation.isPending}
                  className="btn-icon text-red-500 hover:bg-red-50"
                  title="Remove IMC role"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All users table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or employee ID…"
              className="input pl-9"
            />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="select w-40">
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size={28} /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Role</th>
                    <th>Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.users || []).length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">No users found</td></tr>
                  ) : (data?.users || []).map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 font-bold text-xs">{u.full_name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{u.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{u.employee_id}</td>
                      <td className="text-xs">{u.department || '—'}</td>
                      <td className="text-xs">{u.designation || '—'}</td>
                      <td>
                        <span className={`badge ${roleColorMap[u.role] || 'badge-gray'}`}>
                          {u.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">{u.last_sync ? formatDate(u.last_sync) : 'Never'}</td>
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

      {/* Role change audit */}
      {roleAudit.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Recent Role Changes</h2>
          <div className="space-y-2">
            {roleAudit.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center gap-3 text-xs text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-800">{a.employee_name}</span>
                <span className="text-slate-400">({a.employee_id})</span>
                <span className="text-slate-400">·</span>
                <span className="badge-gray px-1.5 py-0.5 text-[10px]">{a.previous_role}</span>
                <span>→</span>
                <span className="badge-blue px-1.5 py-0.5 text-[10px]">{a.new_role}</span>
                <span className="text-slate-400">by</span>
                <span className="font-medium">{a.changed_by_name}</span>
                <span className="ml-auto text-slate-400">{formatDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign IMC Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign IMC Role"
        footer={
          <>
            <button onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => assignMutation.mutate(assignForm)}
              disabled={!assignForm.employeeId.trim() || assignMutation.isPending}
              className="btn-primary"
            >
              {assignMutation.isPending ? <Spinner size={15} className="text-white" /> : <ShieldCheck size={15} />}
              Assign Role
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert type="info" message="This will grant the employee access to the IMC queue and review tools. The role change is logged in the audit trail." />
          <div>
            <label className="field-label field-required">Employee ID or User ID</label>
            <input
              value={assignForm.employeeId}
              onChange={e => setAssignForm(f => ({ ...f, employeeId: e.target.value }))}
              placeholder="e.g. JPHRC0042"
              className="input"
            />
            <p className="text-xs text-slate-400 mt-1">The employee must have logged in at least once to the IMS.</p>
          </div>

        </div>
      </Modal>
    </div>
  );
}
