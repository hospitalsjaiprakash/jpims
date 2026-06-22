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

const savedIncidents = localStorage.getItem('ims_incidents');
export let mockIncidents = savedIncidents ? JSON.parse(savedIncidents) : [];

const savedNotifications = localStorage.getItem('ims_notifications');
export let mockNotifications = savedNotifications ? JSON.parse(savedNotifications) : [];

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
