export const mockUsers = {
  employee: {
    id: '1',
    fullName: 'NIRMAL NAIK',
    employeeId: '13574',
    role: 'employee',
    department: 'Digital Communications',
    designation: 'Department Assistant',
    email: 'nirmalnaik1402@gmail.com',
    isImcMember: false,
  },
  hod: {
    id: '2',
    fullName: 'Shubranshu Samal',
    employeeId: '11111',
    role: 'hod',
    department: 'Digital Communications',
    designation: 'HOD',
    email: 'shubranshu@jphrc.com',
    isImcMember: false,
  },
  imc: {
    id: '3',
    fullName: 'Incident Management Committee',
    employeeId: 'IMC',
    role: 'imc',
    department: 'Quality Management',
    designation: 'Committee',
    email: 'imc@jphrc.com',
  },
  head_management: {
    id: '4',
    fullName: 'Management Director',
    employeeId: 'JPHRC_MD',
    role: 'head_management',
    department: 'MD Office',
    email: 'md@jphrc.com',
  },
  system_admin: {
    id: '5',
    fullName: 'System Administrator',
    employeeId: 'JPHRC_ADMIN',
    role: 'system_admin',
    department: 'IT',
    email: 'admin@jphrc.com',
  }
};

export let mockIncidents = [
  {
    id: 'JPHRC/IMS/2026/0001',
    reference_id: 'JPHRC/IMS/2026/0001',
    reporter_id: '1',
    reporter_name: 'Rahul Sharma',
    reporter_department: 'Medical Services',
    reporter_employee_id: '13574',
    departments: ['Facility', 'Medical Services'],
    incident_type: 'Injury or fall of patient',
    severity: 'Major',
    location: 'MAIN Hospital Danidiapali - Ward C',
    main_location_name: 'MAIN Hospital Danidiapali',
    sub_location_name: 'Ward C',
    occurred_to: 'Patient',
    incident_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    incident_time: '14:30',
    description: 'Patient slipped in the bathroom due to wet floor.',
    immediate_action: 'Helped patient up, checked for injuries. Doctor notified immediately.',
    status: 'with_head_management',
    incident_category: 'Nursing Care Related',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    attachments: [
      { id: 'att-1', name: 'wet_floor_photo.jpg', url: '#', size: '1.2 MB' },
      { id: 'att-2', name: 'witness_statement.pdf', url: '#', size: '420 KB' }
    ],
    hod_feedback: 'Facility team must ensure regular floor mopping schedules are strictly adhered to. Nursing staff should assist high-risk patients.',
    imc_feedback: 'We recommend installing anti-slip mats in all patient washrooms. Reviewed and forwarded to Management for budget approval.',
    management_feedback: '',
    workflow_history: [
      { action: 'Reported', by: 'Rahul Sharma', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
      { action: 'HOD Reviewed', by: 'Dr. Anita Desai', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString() },
      { action: 'IMC Processed', by: 'IMC Committee', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
  },
  {
    id: 'JPHRC/IMS/2026/0002',
    reference_id: 'JPHRC/IMS/2026/0002',
    reporter_id: '2',
    reporter_name: 'Priya Singh',
    reporter_department: 'Nursing Services',
    reporter_employee_id: '11111',
    departments: ['Bio-Medical', 'Nursing Services'],
    incident_type: 'Equipment Safety Hazard',
    severity: 'Grave',
    location: 'MAIN Hospital Danidiapali - ICU',
    main_location_name: 'MAIN Hospital Danidiapali',
    sub_location_name: 'ICU',
    occurred_to: 'Asset/Consumables',
    incident_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    incident_time: '03:15',
    description: 'Ventilator alarm triggered repeatedly without patient distress. Equipment recalibrated but issue persists.',
    immediate_action: 'Patient immediately shifted to backup ventilator. Bio-med alerted.',
    status: 'with_imc',
    incident_category: 'Biomedical Related',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    attachments: [
      { id: 'att-3', name: 'ventilator_error_log.txt', url: '#', size: '24 KB' }
    ],
    investigator_name: 'IMC Committee',
    hod_feedback: 'Critical equipment failure. Need immediate replacement and vendor root cause analysis.',
    imc_feedback: 'Currently investigating maintenance logs with the Bio-Medical team to determine if preventive maintenance was missed.',
    management_feedback: '',
    workflow_history: [
      { action: 'Reported', by: 'Priya Singh', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
      { action: 'HOD Reviewed', by: 'Dr. Anita Desai', timestamp: new Date(Date.now() - 86400000 * 4).toISOString() },
      { action: 'Under Investigation', by: 'IMC Committee', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() }
    ]
  },
  {
    id: 'JPHRC/IMS/2026/0003',
    reference_id: 'JPHRC/IMS/2026/0003',
    reporter_id: '3',
    reporter_name: 'Amit Patel',
    reporter_department: 'Bio-Medical',
    reporter_employee_id: '22222',
    departments: ['Finance and Accounts', 'Purchase'],
    incident_type: 'Inappropriate delay in procurement of item',
    severity: 'Minor',
    location: 'City Center Uditnagar - Pharmacy',
    main_location_name: 'City Center Uditnagar',
    sub_location_name: 'Pharmacy',
    occurred_to: 'Process Flow',
    incident_date: new Date(Date.now() - 86400000 * 10).toISOString(),
    incident_time: '11:45',
    description: 'Delays in procurement of emergency surgical kits leading to temporary stock out.',
    immediate_action: 'Procured emergency kits from nearby partner hospital to ensure zero patient impact.',
    status: 'resolved',
    incident_category: 'Store Related',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    hod_feedback: 'Purchase workflow needs optimization to prevent such delays.',
    imc_feedback: 'New re-order level alerts configured in the inventory system to trigger automatically.',
    management_feedback: 'Approved the new inventory protocol. Good job avoiding patient impact.',
    workflow_history: [
      { action: 'Reported', by: 'Amit Patel', timestamp: new Date(Date.now() - 86400000 * 10).toISOString() },
      { action: 'HOD Reviewed', by: 'Vikram Mehta', timestamp: new Date(Date.now() - 86400000 * 9).toISOString() },
      { action: 'Resolved', by: 'Management', timestamp: new Date(Date.now() - 86400000 * 8).toISOString() }
    ]
  },
  {
    id: 'JPHRC/IMS/2026/0004',
    reference_id: 'JPHRC/IMS/2026/0004',
    reporter_id: '1',
    reporter_name: 'Rahul Sharma',
    reporter_department: 'Medical Services',
    reporter_employee_id: '13574',
    departments: ['Digital Communications'],
    incident_type: 'Communication link failure in ward',
    severity: 'Minor',
    location: 'MAIN Hospital Danidiapali - Ward C',
    main_location_name: 'MAIN Hospital Danidiapali',
    sub_location_name: 'Ward C',
    occurred_to: 'Process Flow',
    incident_date: new Date(Date.now() - 86400000 * 1).toISOString(),
    incident_time: '09:00',
    description: 'Digital communications screen has been frozen for the past 24 hours, preventing notifications from displaying.',
    immediate_action: 'Restarted local display unit, but connection is not restored.',
    status: 'with_hod',
    incident_category: 'Nursing Care Related',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    hod_feedback: '',
    imc_feedback: '',
    management_feedback: '',
    workflow_history: [
      { action: 'Reported', by: 'Rahul Sharma', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
  },
  {
    id: 'JPHRC/IMS/2026/0005',
    reference_id: 'JPHRC/IMS/2026/0005',
    reporter_id: '2',
    reporter_name: 'Priya Singh',
    reporter_department: 'Nursing Services',
    reporter_employee_id: '11111',
    departments: ['Digital Communications'],
    incident_type: 'Wrong routing of patient records',
    severity: 'Major',
    location: 'MAIN Hospital Danidiapali - ICU',
    main_location_name: 'MAIN Hospital Danidiapali',
    sub_location_name: 'ICU',
    occurred_to: 'Process Flow',
    incident_date: new Date(Date.now() - 86400000 * 3).toISOString(),
    incident_time: '10:30',
    description: 'Patient records for Ward C were routed to Digital Communications department. This is a medical records/facility issue.',
    immediate_action: 'Kept records in a safe folder and notified supervisor.',
    status: 'redirect_requested',
    incident_category: 'Biomedical Related',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    hod_feedback: '',
    imc_feedback: '',
    management_feedback: '',
    redirect_reason: 'This incident targets Digital Communications, but our department does not handle physical/medical patient records. This belongs to Medical Services or Infection Control.',
    redirect_requested_by_dept: 'Digital Communications',
    workflow_history: [
      { action: 'Reported', by: 'Priya Singh', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
      { action: 'Redirect Requested', by: 'Shubranshu Samal', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() }
    ]
  }
];

export let mockNotifications = [
  {
    id: '1',
    user_id: '1',
    title: 'New Incident Assigned',
    message: 'You have been assigned to investigate INC-2026-0002.',
    read: false,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: '1',
    title: 'Incident Resolved',
    message: 'Incident INC-2026-0003 has been marked as resolved.',
    read: true,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

export const mockLocations = {
  mainLocations: [
    { id: 1, name: 'MAIN Hospital Danidiapali' },
    { id: 2, name: 'City Center Uditnagar' },
    { id: 3, name: 'City Center Rajgangpur' }
  ],
  subLocations: [
    { id: 1, main_location_id: 1, name: '1st Floor' },
    { id: 2, main_location_id: 1, name: '2nd Floor' },
    { id: 3, main_location_id: 1, name: 'ICU' },
    { id: 4, main_location_id: 1, name: 'Ward C' },
    { id: 5, main_location_id: 1, name: 'OT 1' },
    { id: 6, main_location_id: 1, name: 'OT 2' },
    { id: 7, main_location_id: 2, name: 'Ground Floor OPD' },
    { id: 8, main_location_id: 2, name: 'Pharmacy' },
    { id: 9, main_location_id: 2, name: 'Consultation Room' },
    { id: 10, main_location_id: 3, name: 'Emergency Room' },
    { id: 11, main_location_id: 3, name: 'General Ward' },
    { id: 12, main_location_id: 3, name: 'Reception' }
  ]
};

export const mockDepartments = [
  { id: 1, name: 'Medical Services' },
  { id: 2, name: 'Nursing Services' },
  { id: 3, name: 'Purchase' },
  { id: 4, name: 'Finance and Accounts' },
  { id: 5, name: 'Public Relations' },
  { id: 6, name: 'Legal Cell' },
  { id: 7, name: 'Corporate Relations and Business Development' },
  { id: 8, name: 'Human Resource' },
  { id: 9, name: 'Facility' },
  { id: 10, name: 'Food and Beverages' },
  { id: 11, name: 'Housekeeping' },
  { id: 12, name: 'Linen and Laundry' },
  { id: 13, name: 'Ambulance / Travel / Transport' },
  { id: 14, name: 'Security Services' },
  { id: 15, name: 'Quality Management' },
  { id: 16, name: 'Training and Development' },
  { id: 17, name: 'Stores' },
  { id: 18, name: 'Fire Safety' },
  { id: 19, name: 'Patient Care' },
  { id: 20, name: 'General Maintenance' },
  { id: 21, name: 'Bio-Medical' },
  { id: 22, name: 'Digital Communications' },
  { id: 23, name: 'Strategy and External Communications' },
  { id: 24, name: 'Asset' },
  { id: 25, name: 'JPIEE' },
  { id: 26, name: 'Lab Medicine' },
  { id: 27, name: 'Blood Centre' },
  { id: 28, name: 'Radiology' },
  { id: 29, name: 'MD Office' },
  { id: 30, name: 'Infection Control and Microbiology' }
];

export const mockDesignations = [
  { id: 1, name: 'Consultant - D1 to D3' },
  { id: 2, name: 'Sr. Medical Officer - D4' },
  { id: 3, name: 'Jr. Medical Officer - D5' },
  { id: 4, name: 'Clinical Assistant - D6' },
  { id: 5, name: 'Infection Control Nurse' },
  { id: 6, name: 'Nursing Sup. - NS1' },
  { id: 7, name: 'Deputy Nursing Sup. - NS2' },
  { id: 8, name: 'Asst. Nursing Sup. - NS3' },
  { id: 9, name: 'Ward In-charge - NS4' },
  { id: 10, name: 'Sr. Nurse - NS5' },
  { id: 11, name: 'Jr. Nurse - NS6' },
  { id: 12, name: 'Nursing Assistant - NS7' },
  { id: 13, name: 'Health Assistant - NS8' },
  { id: 14, name: 'Sr. Technician' },
  { id: 15, name: 'Jr. Technician' },
  { id: 16, name: 'Technical Assistant' },
  { id: 17, name: 'HOD' },
  { id: 18, name: 'Assistant HOD' },
  { id: 19, name: 'In-charge' },
  { id: 20, name: 'Assistant In-charge' },
  { id: 21, name: 'Senior Co-Ordinator' },
  { id: 22, name: 'Junior Co-Ordinator' },
  { id: 23, name: 'Department Assistant' },
  { id: 24, name: 'MPW' },
  { id: 25, name: 'DNB Doctor' },
  { id: 26, name: 'COO' },
  { id: 27, name: 'Assistant COO' },
  { id: 28, name: 'Others' }
];

export let mockKbArticles = [
  {
    id: 1,
    title: 'How to report a Patient Fall',
    content: 'Ensure you fill out the location and time accurately...',
    category: 'Guidelines',
    created_at: new Date().toISOString()
  }
];

export const mockTraining = [
  {
    id: 1,
    title: 'Fire Safety Protocols 2026',
    description: 'Mandatory training for all staff regarding fire safety.',
    completed: false
  }
];
