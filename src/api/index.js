import { 
  mockUsers, 
  mockIncidents, 
  mockNotifications, 
  mockLocations,
  mockDepartments, 
  mockDesignations,
  mockKbArticles, 
  mockTraining 
} from './mockData';

// Helper to simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API instance just in case anything imports it directly
const api = {
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  }
};

const saveIncidents = () => {
  localStorage.setItem('ims_incidents', JSON.stringify(mockIncidents));
};
const saveNotifications = () => {
  localStorage.setItem('ims_notifications', JSON.stringify(mockNotifications));
};

// ── Auth ──────────────────────────────────────────
export const authApi = {
  login: async (data) => {
    await delay();
    const { employeeId, fullName } = data;
    // Find matching user in mockUsers
    let user = Object.values(mockUsers).find(
      u => u.employeeId === employeeId || u.fullName.toLowerCase() === fullName.toLowerCase()
    );
    if (!user) {
      // fallback to employee
      user = mockUsers.employee;
    }
    return { data: { token: 'mock-jwt-token', user } };
  },
  committeeLogin: async (data) => {
    await delay();
    const role = data.targetRole || data.role;
    // Map requested role to mock user
    let user = mockUsers.imc;
    if (role === 'head_management') user = mockUsers.head_management;
    if (role === 'system_admin') user = mockUsers.system_admin;
    
    return { data: { token: 'mock-jwt-token', user } };
  },
  forgotPassword: async () => {
    await delay();
    return { data: { message: 'Reset link sent' } };
  },
  resetPassword: async () => {
    await delay();
    return { data: { message: 'Password reset successful' } };
  },
  getMe: async () => {
    await delay();
    const userString = localStorage.getItem('ims_user');
    const localUser = userString ? JSON.parse(userString) : null;
    if (localUser) {
      const freshUser = Object.values(mockUsers).find(u => u.id === localUser.id);
      if (freshUser) {
        return { data: freshUser };
      }
    }
    return { data: localUser || mockUsers.employee };
  },
  updateNotificationPrefs: async (data) => {
    await delay();
    const userString = localStorage.getItem('ims_user');
    if (userString) {
      const user = JSON.parse(userString);
      const updatedUser = { ...user, ...data };
      localStorage.setItem('ims_user', JSON.stringify(updatedUser));
      const found = Object.values(mockUsers).find(u => u.id === user.id);
      if (found) {
        Object.assign(found, data);
      }
    }
    return { data: { message: 'Preferences updated' } };
  },
};

// ── Incidents ─────────────────────────────────────
export const incidentsApi = {
  list: async (params) => {
    await delay();
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;
    
    let filtered = [...mockIncidents];
    
    if (currentUser) {
      if (currentUser.role === 'employee') {
        filtered = filtered.filter(i => i.reporter_id === currentUser.id);
      } else if (currentUser.role === 'hod') {
        if (params?.viewMode === 'my_incidents') {
          filtered = filtered.filter(i => i.reporter_id === currentUser.id);
        } else {
          filtered = filtered.filter(i => (i.departments || []).includes(currentUser.department));
        }
      }
    }
    
    if (params) {
      if (params.status) {
        if (params.status === 'active') {
          filtered = filtered.filter(i => i.status !== 'resolved' && i.status !== 'withdrawn');
        } else {
          filtered = filtered.filter(i => i.status === params.status);
        }
      }
      if (params.severity) {
        filtered = filtered.filter(i => i.severity === params.severity);
      }
      if (params.incidentCategory) {
        filtered = filtered.filter(i => i.incident_category === params.incidentCategory);
      }
      if (params.dateFrom) {
        filtered = filtered.filter(i => new Date(i.incident_date) >= new Date(params.dateFrom));
      }
      if (params.dateTo) {
        filtered = filtered.filter(i => new Date(i.incident_date) <= new Date(params.dateTo + 'T23:59:59'));
      }
    }

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { 
      data: {
        incidents: filtered,
        total: filtered.length,
        totalPages: 1
      }
    };
  },
  get: async (id) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    if (!incident) throw new Error('Not found');

    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;

    if (currentUser?.role === 'hod' && incident.status === 'submitted') {
      incident.status = incident.severity === 'Grave' ? 'with_hod_and_imc' : 'with_hod';
      incident.hod_first_viewed_at = new Date().toISOString();
      incident.workflow_history.push({
        action: 'HOD Viewed',
        by: currentUser.fullName,
        timestamp: new Date().toISOString()
      });
      saveIncidents();
    }

    const feedbacks = [];
    if (incident.hod_feedback) {
      feedbacks.push({
        id: 'fb-1',
        full_name: 'Dr. Anita Desai',
        designation: 'HOD - Medical Services',
        role: 'hod',
        feedback_text: incident.hod_feedback,
        created_at: incident.created_at
      });
    }
    if (incident.imc_feedback) {
      feedbacks.push({
        id: 'fb-2',
        full_name: 'IMC Committee Member',
        designation: 'Quality Management',
        role: 'imc',
        feedback_text: incident.imc_feedback,
        created_at: incident.created_at
      });
    }
    if (incident.management_feedback) {
      feedbacks.push({
        id: 'fb-3',
        full_name: 'MD Office',
        designation: 'Head of Management',
        role: 'head_management',
        feedback_text: incident.management_feedback,
        created_at: incident.created_at
      });
    }

    return { 
      data: { 
        incident,
        feedbacks,
        attachments: incident.attachments || [],
        disputes: [],
        finalReport: incident.status === 'Resolved' ? {
          fault_type: incident.category || 'Clinical',
          corrective_actions: incident.management_feedback || 'Resolved successfully.',
          generated_at: incident.created_at
        } : null
      } 
    };
  },
  create: async (data) => {
    await delay();
    const mainLoc = mockLocations.mainLocations.find(l => l.id == data.mainLocationId);
    const subLocName = data.subLocationId || '';

    // Departments are now derived from the selected incident categories
    const departments = data.derivedDepartments && data.derivedDepartments.length
      ? data.derivedDepartments
      : (data.incidentCategories && data.incidentCategories.length
          ? data.incidentCategories
          : [data.incidentCategory].filter(Boolean));

    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;

    const currentYear = new Date().getFullYear();
    const newIncident = {
      ...data,
      id: `JPHRC/IMS/${currentYear}/${String(mockIncidents.length + 1).padStart(4, '0')}`,
      reference_id: `JPHRC/IMS/${currentYear}/${String(mockIncidents.length + 1).padStart(4, '0')}`,
      reporter_id: currentUser ? currentUser.id : '1',
      reporter_name: currentUser ? currentUser.fullName : 'Mock User',
      reporter_department: currentUser ? currentUser.department : 'Digital Communications',
      reporter_employee_id: currentUser ? currentUser.employeeId : '13574',
      status: 'submitted',
      created_at: new Date().toISOString(),
      main_location_name: mainLoc ? mainLoc.name : 'Unknown',
      sub_location_name: subLocName,
      departments: departments,
      location: `${mainLoc ? mainLoc.name : 'Unknown'}${subLocName ? ` - ${subLocName}` : ''}`,
      incident_type: data.incidentType,
      incident_category: data.incidentCategory,
      incident_types: data.incidentTypes || [],
      incident_categories: data.incidentCategories || [],
      occurred_to: data.occurredTo,
      workflow_history: [{ action: 'Reported', by: currentUser ? currentUser.fullName : 'Mock User', timestamp: new Date().toISOString() }]
    };
    mockIncidents.unshift(newIncident);
    saveIncidents();
    return { data: newIncident };
  },

  // Employee can edit their own incident while it's still in 'submitted' status
  updateIncident: async (id, data) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;
    if (incident) {
      if (data.description !== undefined) incident.description = data.description;
      if (data.severity !== undefined) incident.severity = data.severity;
      if (data.occurredTo !== undefined) incident.occurred_to = data.occurredTo;
      if (data.incidentDate !== undefined) incident.incident_date = data.incidentDate;
      if (data.incidentTime !== undefined) incident.incident_time = data.incidentTime;
      if (!incident.workflow_history) incident.workflow_history = [];
      incident.workflow_history.push({
        action: 'Incident Edited',
        by: currentUser ? currentUser.fullName : 'Reporter',
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },

  getStats: async () => {
    await delay();
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;

    const all = [...mockIncidents];
    let filtered = [...mockIncidents];
    if (currentUser) {
      if (currentUser.role === 'employee') {
        filtered = filtered.filter(i => i.reporter_id === currentUser.id);
      } else if (currentUser.role === 'hod') {
        filtered = filtered.filter(i => (i.departments || []).includes(currentUser.department));
      }
    }

    const now = new Date();

    // ── HOD report ──────────────────────────────────
    const hodReport = currentUser?.role === 'hod' ? (() => {
      const myInc = mockIncidents.filter(i => i.reporter_id === currentUser.id);
      return {
        received: filtered.length,
        feedbackGiven: filtered.filter(i => i.hod_feedback || ['with_imc', 'with_head_management', 'resolved', 'dispute'].includes(i.status)).length,
        avgFeedbackTime: '4.5 Hours',
        myIncidents: {
          total: myInc.length,
          active: myInc.filter(i => i.status !== 'resolved' && i.status !== 'withdrawn').length,
          resolved: myInc.filter(i => i.status === 'resolved').length,
          thisMonth: myInc.filter(i => new Date(i.created_at).getMonth() === now.getMonth() && new Date(i.created_at).getFullYear() === now.getFullYear()).length,
        }
      };
    })() : null;

    // ── Management report ────────────────────────────
    const managementReport = currentUser?.role === 'head_management' ? (() => {
      const awaitingDecision = all.filter(i => i.status === 'with_head_management');
      const resolved = all.filter(i => i.status === 'resolved');
      const thisMonth = all.filter(i => new Date(i.created_at).getMonth() === now.getMonth() && new Date(i.created_at).getFullYear() === now.getFullYear());
      return {
        awaitingDecision: awaitingDecision.length,
        resolved: resolved.length,
        totalIncidents: all.length,
        thisMonth: thisMonth.length,
        disputes: all.filter(i => i.status === 'dispute').length,
        pendingItems: awaitingDecision,
        bySeverity: [
          { severity: 'Minor', count: all.filter(i => i.severity === 'Minor').length },
          { severity: 'Major', count: all.filter(i => i.severity === 'Major').length },
          { severity: 'Grave', count: all.filter(i => i.severity === 'Grave').length },
        ],
        monthly: [
          { name: 'Jan', count: 0 }, { name: 'Feb', count: 0 }, { name: 'Mar', count: 0 },
          { name: 'Apr', count: 0 }, { name: 'May', count: 0 }, { name: 'Jun', count: all.length }
        ],
      };
    })() : null;

    // ── System Admin report ──────────────────────────
    const adminReport = currentUser?.role === 'system_admin' ? (() => {
      return {
        totalUsers: Object.keys(mockUsers).length,
        totalIncidents: all.length,
        activeIncidents: all.filter(i => i.status !== 'resolved' && i.status !== 'withdrawn').length,
        resolved: all.filter(i => i.status === 'resolved').length,
        imcQueue: all.filter(i => ['with_imc', 'with_hod_and_imc'].includes(i.status)).length,
        pendingRedirects: all.filter(i => i.status === 'redirect_requested').length,
        disputes: all.filter(i => i.status === 'dispute').length,
        thisMonth: all.filter(i => new Date(i.created_at).getMonth() === now.getMonth() && new Date(i.created_at).getFullYear() === now.getFullYear()).length,
        bySeverity: [
          { severity: 'Minor', count: all.filter(i => i.severity === 'Minor').length },
          { severity: 'Major', count: all.filter(i => i.severity === 'Major').length },
          { severity: 'Grave', count: all.filter(i => i.severity === 'Grave').length },
        ],
        monthly: [
          { name: 'Jan', count: 0 }, { name: 'Feb', count: 0 }, { name: 'Mar', count: 0 },
          { name: 'Apr', count: 0 }, { name: 'May', count: 0 }, { name: 'Jun', count: all.length }
        ],
        recentIncidents: all.slice(0, 5),
      };
    })() : null;

    return {
      data: {
        totals: {
          total: filtered.length,
          active: filtered.filter(i => i.status !== 'resolved' && i.status !== 'withdrawn').length,
          resolved: filtered.filter(i => i.status === 'resolved').length,
          this_month: filtered.filter(i => new Date(i.created_at).getMonth() === now.getMonth()).length,
        },
        monthly: [
          { name: 'Jan', count: 0 }, { name: 'Feb', count: 0 }, { name: 'Mar', count: 0 },
          { name: 'Apr', count: 0 }, { name: 'May', count: 0 }, { name: 'Jun', count: filtered.length }
        ],
        bySeverity: [
          { severity: 'Minor', count: filtered.filter(i => i.severity === 'Minor').length },
          { severity: 'Major', count: filtered.filter(i => i.severity === 'Major').length },
          { severity: 'Grave', count: filtered.filter(i => i.severity === 'Grave').length }
        ],
        byType: [
          { incident_type: 'Clinical', count: filtered.filter(i => i.incident_category === 'Nursing Care Related' || i.incident_category === 'Biomedical Related').length },
          { incident_type: 'Non-Clinical', count: filtered.filter(i => i.incident_category === 'Store Related').length }
        ],
        hodReport,
        managementReport,
        adminReport,
      }
    };
  },
  withdraw: async (id) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    if (incident) incident.status = 'withdrawn';
    saveIncidents();
    return { data: incident };
  },
  hodFeedback: async (id, data) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;
    const userName = currentUser ? currentUser.fullName : 'HOD';
    if (incident) {
      incident.status = 'with_imc';
      incident.hod_feedback = data.feedbackText;
      if (!incident.workflow_history) incident.workflow_history = [];
      incident.workflow_history.push({
        action: 'HOD Reviewed',
        by: userName,
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },

  imcFeedback: async (id, data) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    if (incident) {
      incident.status = data.forwardToMd ? 'with_head_management' : 'with_imc';
      incident.imc_feedback = data.feedbackText;
      if (!incident.workflow_history) incident.workflow_history = [];
      incident.workflow_history.push({
        action: 'IMC Processed',
        by: 'IMC Committee',
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },
  mdDecision: async (id, data) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    if (incident) {
      if (data.requireTraining) {
        incident.status = 'pending_training';
        incident.has_responsible_person = true;
        incident.responsible_person_name = incident.occurred_to !== 'None' ? `${incident.occurred_to} (Responsible Person)` : 'Responsible Employee';
        incident.training_completed = false;
      } else {
        incident.status = 'resolved';
      }
      incident.management_feedback = data.correctiveActions;
      incident.category = data.faultType;
      if (!incident.workflow_history) incident.workflow_history = [];
      incident.workflow_history.push({
        action: data.requireTraining ? 'Management Mandated Training' : 'Resolved',
        by: 'Management',
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },
  raiseDispute: async (id) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    if (incident) incident.status = 'dispute';
    saveIncidents();
    return { data: incident };
  },
  reopen: async (id) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    if (incident) incident.status = 'with_hod';
    saveIncidents();
    return { data: incident };
  },
  assignInvestigator: async (id, data) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    if (incident) {
      incident.investigator_name = 'Assigned Investigator';
      incident.status = 'with_imc';
    }
    saveIncidents();
    return { data: incident };
  },
  requestRedirect: async (id, data) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;
    if (incident) {
      incident.status = 'redirect_requested';
      incident.redirect_reason = data.reason;
      incident.redirect_requested_by_dept = currentUser ? currentUser.department : 'Unknown';
      incident.workflow_history.push({
        action: 'Redirect Requested',
        by: currentUser ? currentUser.fullName : 'HOD',
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },
  verifyTraining: async (id) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;
    if (incident) {
      incident.training_completed = true;
      incident.status = 'resolved';
      if (!incident.workflow_history) incident.workflow_history = [];
      incident.workflow_history.push({
        action: 'Training Verified & Incident Closed',
        by: currentUser ? currentUser.fullName : 'IMC',
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },
  approveRedirect: async (id, data) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;
    if (incident) {
      const targetDeptName = data.targetDepartment;
      incident.departments = [targetDeptName];
      incident.status = incident.severity === 'Grave' ? 'with_hod_and_imc' : 'with_hod';
      incident.workflow_history.push({
        action: `Redirected to ${targetDeptName}`,
        by: currentUser ? currentUser.fullName : 'IMC',
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },
  rejectRedirect: async (id, data) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;
    if (incident) {
      incident.status = incident.severity === 'Grave' ? 'with_hod_and_imc' : 'with_hod';
      incident.workflow_history.push({
        action: `Redirect Rejected: ${data.reason}`,
        by: currentUser ? currentUser.fullName : 'IMC',
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },

  // Management can edit HOD / IMC / management feedback if incorrect
  editFeedback: async (id, { feedbackType, feedbackText }) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;
    if (incident) {
      if (feedbackType === 'hod') incident.hod_feedback = feedbackText;
      else if (feedbackType === 'imc') incident.imc_feedback = feedbackText;
      else if (feedbackType === 'management') incident.management_feedback = feedbackText;
      if (!incident.workflow_history) incident.workflow_history = [];
      incident.workflow_history.push({
        action: `${feedbackType.toUpperCase()} Feedback Edited`,
        by: currentUser ? currentUser.fullName : 'Management',
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },

  escalatePriority: async (id) => {
    await delay();
    const incident = mockIncidents.find(i => i.id === id);
    const userString = localStorage.getItem('ims_user');
    const currentUser = userString ? JSON.parse(userString) : null;
    if (incident && currentUser) {
      incident.priority_escalated_by = currentUser.role === 'head_management' ? 'Management' : 'IMC';
      if (!incident.workflow_history) incident.workflow_history = [];
      incident.workflow_history.push({
        action: 'Priority Escalated',
        by: currentUser.fullName,
        timestamp: new Date().toISOString()
      });
    }
    saveIncidents();
    return { data: incident };
  },
};

// ── Notifications ─────────────────────────────────
export const notificationsApi = {
  list: async () => {
    await delay();
    return { data: mockNotifications };
  },
  markRead: async (id) => {
    await delay();
    const notif = mockNotifications.find(n => n.id === id);
    if (notif) notif.read = true;
    saveNotifications();
    return { data: { success: true } };
  },
};

// ── Locations, Departments & Designations ─────────
export const metaApi = {
  locations: async () => {
    await delay();
    return { data: mockLocations };
  },
  departments: async () => {
    await delay();
    return { data: mockDepartments };
  },
  designations: async () => {
    await delay();
    return { data: mockDesignations };
  },
};

// ── IMC ───────────────────────────────────────────
export const imcApi = {
  queue: async () => {
    await delay();
    const q = mockIncidents.filter(i => 
      ['with_imc', 'with_hod_and_imc', 'redirect_requested', 'dispute', 'pending_training'].includes(i.status) ||
      (i.status === 'resolved' && i.has_responsible_person && !i.training_completed)
    );
    q.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { data: q };
  },
};

// ── Knowledge Base ────────────────────────────────
export const kbApi = {
  list: async () => {
    await delay();
    return { data: mockKbArticles };
  },
  create: async (data) => {
    await delay();
    const newArticle = { ...data, id: mockKbArticles.length + 1, created_at: new Date().toISOString() };
    mockKbArticles.push(newArticle);
    return { data: newArticle };
  },
};

// ── Training ──────────────────────────────────────
export const trainingApi = {
  list: async () => {
    await delay();
    return { data: mockTraining };
  },
  complete: async (id) => {
    await delay();
    const item = mockTraining.find(t => t.id === id);
    if (item) item.completed = true;
    return { data: item };
  },
};

// ── Admin ─────────────────────────────────────────
export const adminApi = {
  getConfig: async () => {
    await delay();
    return { data: { settings: { maintenance_mode: false, auto_assign: true } } };
  },
  updateConfig: async () => {
    await delay();
    return { data: { success: true } };
  },
  requestRolePasswordOtp: async () => {
    await delay();
    return { data: { message: 'OTP Sent' } };
  },
  updateRoleCredentials: async () => {
    await delay();
    return { data: { success: true } };
  },
  getImcMembers: async () => {
    await delay();
    const members = Object.values(mockUsers)
      .filter(u => u.isImcMember)
      .map(u => ({
        id: u.id,
        full_name: u.fullName,
        employee_id: u.employeeId,
        department: u.department
      }));
    return { data: members };
  },
  assignImc: async (data) => {
    await delay();
    const { employeeId } = data;
    const user = Object.values(mockUsers).find(u => u.employeeId === employeeId);
    if (user) {
      user.isImcMember = true;
    }
    return { data: { success: true } };
  },
  removeImc: async (id) => {
    await delay();
    const user = Object.values(mockUsers).find(u => u.id === id);
    if (user) {
      user.isImcMember = false;
    }
    return { data: { success: true } };
  },
  getAuditLogs: async () => {
    await delay();
    return { data: [{ id: 1, action: 'User Login', user: 'Admin', timestamp: new Date().toISOString() }] };
  },
  getAnalytics: async () => {
    await delay();
    return { data: { total_users: 50, active_incidents: 10, resolved_incidents: 120 } };
  },
  getUsers: async () => {
    await delay();
    const users = Object.values(mockUsers).map(u => ({
      id: u.id,
      full_name: u.fullName,
      employee_id: u.employeeId,
      department: u.department,
      designation: u.designation,
      role: u.role,
      last_sync: u.lastSync || new Date().toISOString()
    }));
    return { data: { users, totalPages: 1 } };
  },
  getRoleAudit: async () => {
    await delay();
    return { data: [] };
  },
};

export default api;
