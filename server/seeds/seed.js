const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('../models/User');
const WorkflowTemplate = require('../models/WorkflowTemplate');
const Resident = require('../models/Resident');
const Task = require('../models/Task');

const SALIMA = 'Salima';
const MICHELLE = 'Michelle';

// Helper: parse DD/MM/YYYY or DD/MM/YY → Date
function parseDate(str) {
  if (!str || str === 'N/A' || str === 'null') return null;
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  let [d, m, y] = parts;
  if (y.length === 2) y = '20' + y;
  const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  return isNaN(date) ? null : date;
}

// Helper: create tasks for a resident from templates, mark sections complete
async function createResidentTasks(resident, completedSections, adminUserId) {
  const templates = await WorkflowTemplate.find({
    $or: [{ fundingType: resident.fundingType }, { fundingType: 'all' }],
    isActive: true
  });

  const tasks = [];
  for (const tmpl of templates) {
    const isCompleted = completedSections.includes(tmpl.category);
    for (const t of tmpl.tasks) {
      const dueDate = new Date(resident.admissionDate || Date.now());
      dueDate.setDate(dueDate.getDate() + (t.estimatedDays || 7));
      tasks.push({
        residentId: resident._id,
        title: t.title,
        description: t.description,
        category: tmpl.category,
        fundingType: tmpl.fundingType,
        status: isCompleted ? 'completed' : 'pending',
        priority: t.priority,
        assignedTo: t.defaultAssignee || '',
        dueDate,
        dateCompleted: isCompleted ? new Date() : null,
        order: t.order,
        createdBy: adminUserId
      });
    }
  }
  if (tasks.length) await Task.insertMany(tasks);
}

// ─── RESIDENT DATA (from Google Sheet) ─────────────────────────────────────
const RESIDENTS = [
  {
    firstName: 'Thelma', lastName: 'Caldera',
    roomNumber: '1', fundingType: 'private', fundingRate: '1500',
    admissionDate: '22/10/2024', status: 'ongoing-care',
    primaryContact: { name: 'Lawrence Quill', relationship: 'Son', email: 'quilltrust@gmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','hl-tasks']
  },
  {
    firstName: 'Zia', lastName: 'Esaw',
    roomNumber: '2', fundingType: 'private', fundingRate: '1564.71',
    admissionDate: '09/01/2024', status: 'ongoing-care',
    primaryContact: { name: 'Wanda Mcfarlane', relationship: 'Daughter', email: 'wandalmm@googlemail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc']
  },
  {
    firstName: 'Janet', lastName: 'Galsworthy',
    roomNumber: '3', fundingType: 'la', fundingRate: '1100',
    admissionDate: '28/06/2023', status: 'ongoing-care',
    primaryContact: { name: 'Jenny Galsworthy', relationship: 'Sister', email: '', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc']
  },
  {
    firstName: 'Joan', lastName: 'Hale',
    roomNumber: '4', fundingType: 'private', fundingRate: '1580.88',
    admissionDate: '17/06/2024', status: 'ongoing-care',
    primaryContact: { name: 'Sally Peto', relationship: 'Friend', email: 'sally57peto@gmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc','hl-tasks']
  },
  {
    firstName: 'Helen', lastName: 'Ebbs',
    roomNumber: '6', fundingType: 'ccg-icb', fundingRate: '',
    admissionDate: '22/06/2022', status: 'ongoing-care',
    primaryContact: { name: '', relationship: '', email: '', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc']
  },
  {
    firstName: 'Ruth', lastName: 'Rayner',
    roomNumber: '8', fundingType: 'private', fundingRate: '1409.82',
    admissionDate: '03/05/2025', status: 'ongoing-care',
    primaryContact: { name: 'Sue Davies', relationship: 'Niece', email: 'mikeandsue.davies@sky.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc','hl-tasks']
  },
  {
    firstName: 'Kevin', lastName: 'Gardiner',
    roomNumber: '9', fundingType: 'la', fundingRate: '1200',
    admissionDate: '13/11/2024', status: 'ongoing-care',
    primaryContact: { name: '', relationship: '', email: '', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','fnc','hl-tasks']
  },
  {
    firstName: 'Robert', lastName: 'Coffin',
    roomNumber: '11', fundingType: 'private', fundingRate: '',
    admissionDate: '28/07/2025', status: 'ongoing-care',
    primaryContact: { name: 'Pierrette Coffin', relationship: 'Wife', email: 'pierrettec@talktalk.net', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc','hl-tasks']
  },
  {
    firstName: 'Adrianna', lastName: 'Fitzpatrick',
    roomNumber: '12', fundingType: 'la', fundingRate: '1428',
    admissionDate: '30/10/2024', status: 'ongoing-care',
    primaryContact: { name: 'Dawn Fitzpatrick', relationship: 'Daughter', email: 'lillyfitz@btinternet.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','long-term-funding','fnc']
  },
  {
    firstName: 'Rayappu', lastName: 'Atputhaseeli',
    roomNumber: '13', fundingType: 'la', fundingRate: '1100',
    admissionDate: '08/04/2024', status: 'ongoing-care',
    primaryContact: { name: 'Mr. Ettrick', relationship: 'Son', email: 'ettrick57@gmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding']
  },
  {
    firstName: 'Jennifer', lastName: 'Marshall',
    roomNumber: '14', fundingType: 'la', fundingRate: '950',
    admissionDate: '13/06/2023', status: 'ongoing-care',
    primaryContact: { name: '', relationship: '', email: '', phone: '' },
    completedSections: ['records-update','invoicing-agreement','long-term-funding']
  },
  {
    firstName: 'Christopher', lastName: 'Banfield',
    roomNumber: '16', fundingType: 'private', fundingRate: '1580.88',
    admissionDate: '05/07/2024', status: 'ongoing-care',
    primaryContact: { name: 'Sue Banfield', relationship: 'Wife', email: 'banfield17@btinternet.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc','hl-tasks']
  },
  {
    firstName: 'Andrew', lastName: 'Clare',
    roomNumber: '19', fundingType: 'la', fundingRate: '1300',
    admissionDate: '06/02/2024', status: 'ongoing-care',
    primaryContact: { name: 'Karen Mockeridge', relationship: 'Cousin', email: 'karenmockeridge@gmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc']
  },
  {
    firstName: 'Gerald', lastName: 'Railton',
    roomNumber: '20', fundingType: 'private', fundingRate: '1663.88',
    admissionDate: '26/02/2025', dischargeDate: '16/01/2026', status: 'discharged',
    primaryContact: { name: 'Mark Middlemiss', relationship: 'Nephew', email: 'markmiddlemiss@gmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc','hl-tasks','post-demise-discharge']
  },
  {
    firstName: 'Gillian', lastName: 'Dungate',
    roomNumber: '21', fundingType: 'private', fundingRate: '1428',
    admissionDate: '27/03/2025', status: 'ongoing-care',
    primaryContact: { name: 'Steve Dungate', relationship: 'Son', email: 'stevedungate@aol.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc','hl-tasks']
  },
  {
    firstName: 'William', lastName: 'Clarke',
    roomNumber: '23', fundingType: 'la', fundingRate: '1100',
    admissionDate: '25/01/2024', status: 'ongoing-care',
    primaryContact: { name: 'Anne Densem', relationship: 'Daughter', email: 'annedensem@gmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','hl-tasks']
  },
  {
    firstName: 'Amineh', lastName: 'Golmohamed',
    roomNumber: '25', fundingType: 'ccg-icb', fundingRate: '1600',
    admissionDate: '26/09/2025', status: 'admission',
    primaryContact: { name: 'Mouna Golmohamed', relationship: 'Daughter', email: 'mgolmohama@aol.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','hl-tasks']
  },
  {
    firstName: 'David', lastName: 'Grainger',
    roomNumber: '29', fundingType: 'la', fundingRate: '1150',
    admissionDate: '11/04/2025', status: 'ongoing-care',
    primaryContact: { name: 'Sheila Grainger', relationship: 'Wife', email: 'snowsapphire@me.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','fnc']
  },
  {
    firstName: 'Anna', lastName: 'Watson',
    roomNumber: '30', fundingType: 'ccg-icb', fundingRate: '4524',
    admissionDate: '18/07/2024', status: 'ongoing-care',
    primaryContact: { name: 'Denise Rushmer', relationship: 'Daughter', email: 'Denise.Rushmer@swlondon.nhs.uk', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','hl-tasks']
  },
  {
    firstName: 'Christopher', lastName: 'Hughes',
    roomNumber: '31', fundingType: 'private', fundingRate: '1428',
    admissionDate: '29/05/2025', status: 'ongoing-care',
    primaryContact: { name: '', relationship: '', email: '', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc']
  },
  {
    firstName: 'Kwai', lastName: 'Fung',
    roomNumber: '32', fundingType: 'la', fundingRate: '1200',
    admissionDate: '01/10/2025', status: 'admission',
    primaryContact: { name: 'Steve Fung', relationship: 'Son', email: 'Sfung88@hotmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','fnc','hl-tasks']
  },
  {
    firstName: 'Gerda', lastName: 'Kennedy',
    roomNumber: '33', fundingType: 'private', fundingRate: '1580.88',
    admissionDate: '06/07/2024', status: 'ongoing-care',
    primaryContact: { name: 'Jacob Kennedy', relationship: 'Son', email: 'jacobkennedy@hotmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','long-term-funding','fnc','hl-tasks']
  },
  {
    firstName: 'Jarka', lastName: 'Juric',
    roomNumber: '36', fundingType: 'la', fundingRate: '1200',
    admissionDate: '30/05/2025', status: 'ongoing-care',
    primaryContact: { name: 'Andrew Juric', relationship: 'Son', email: 'Andrew.juric@gmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','fnc','hl-tasks']
  },
  {
    firstName: 'Henry', lastName: 'Matthews',
    roomNumber: '25B', fundingType: 'private', fundingRate: '',
    admissionDate: '26/06/2025', dischargeDate: '23/07/2025', status: 'discharged',
    primaryContact: { name: 'Joan Matthews', relationship: 'Wife', email: 'joanmatthews6@icloud.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','hl-tasks','post-demise-discharge']
  },
  {
    firstName: 'Lizzie', lastName: 'Chetty',
    roomNumber: '28', fundingType: 'ccg-icb', fundingRate: '1600',
    admissionDate: '30/09/2025', status: 'admission',
    primaryContact: { name: 'Linda Chetty', relationship: 'Daughter', email: 'lindy.chetty@hotmail.com', phone: '' },
    completedSections: ['records-update','invoicing-agreement','contract','hl-tasks']
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await WorkflowTemplate.deleteMany({});
    await Resident.deleteMany({});
    await Task.deleteMany({});

    // ── USERS ──────────────────────────────────────────────────────────────
    const users = await User.create([
      { name: 'Admin User',  email: 'admin@twhnh.com',   password: 'admin123', role: 'admin'   },
      { name: 'Salima',      email: 'salima@twhnh.com',  password: 'staff123', role: 'manager' },
      { name: 'Michelle',    email: 'michelle@twhnh.com', password: 'staff123', role: 'staff'   }
    ]);
    const adminUser = users[0];
    console.log(`✓ Seeded ${users.length} users`);

    // ── WORKFLOW TEMPLATES ─────────────────────────────────────────────────
    const templates = await WorkflowTemplate.create([
      // SECTION 2: RECORDS UPDATE — all
      {
        fundingType: 'all', category: 'records-update',
        name: 'Records Update — All',
        tasks: [
          { title: 'Upload Admission Notification',  defaultAssignee: MICHELLE, priority: 'medium', order: 1, estimatedDays: 2 },
          { title: 'Update TWH Bed List',            defaultAssignee: MICHELLE,  priority: 'high',   order: 2, estimatedDays: 1 },
          { title: 'Update Resident NOK List',       defaultAssignee: MICHELLE,  priority: 'high',   order: 3, estimatedDays: 1 },
          { title: 'Update Birthday List',           defaultAssignee: MICHELLE,  priority: 'medium', order: 4, estimatedDays: 1 },
          { title: 'Update Invoicee Sheet',          defaultAssignee: MICHELLE,  priority: 'high',   order: 5, estimatedDays: 1 }
        ]
      },
      // SECTION 3: INVOICING — Private
      {
        fundingType: 'private', category: 'invoicing-agreement',
        name: 'Invoicing & Agreement — Private',
        tasks: [
          { title: 'Generate FA Invoice',            defaultAssignee: MICHELLE, priority: 'urgent', order: 1, estimatedDays: 1 },
          { title: 'Prepare Fee Letter',             defaultAssignee: MICHELLE, priority: 'high',   order: 2, estimatedDays: 2 },
          { title: 'Prepare Standing Order Form',    defaultAssignee: MICHELLE, priority: 'high',   order: 3, estimatedDays: 3 },
          { title: 'Attach PE Price List',           defaultAssignee: MICHELLE, priority: 'medium', order: 4, estimatedDays: 2 },
          { title: 'Attach Generic SU Contract',     defaultAssignee: MICHELLE, priority: 'urgent', order: 5, estimatedDays: 2 },
          { title: 'Send Welcome Email',             defaultAssignee: MICHELLE, priority: 'high',   order: 6, estimatedDays: 1 }
        ]
      },
      // SECTION 3: INVOICING — D2A
      {
        fundingType: 'd2a', category: 'invoicing-agreement',
        name: 'Invoicing & Agreement — NHS D2A',
        tasks: [
          { title: 'Receive and Upload Signed SUPA Agreement', defaultAssignee: MICHELLE, priority: 'urgent', order: 1, estimatedDays: 2 },
          { title: 'Generate FA Invoice',                      defaultAssignee: MICHELLE, priority: 'urgent', order: 2, estimatedDays: 1 },
          { title: 'Send Welcome Email with PE Price List and Generic STC', defaultAssignee: MICHELLE, priority: 'high', order: 3, estimatedDays: 1 }
        ]
      },
      // SECTION 3: INVOICING — CCG ICB
      {
        fundingType: 'ccg-icb', category: 'invoicing-agreement',
        name: 'Invoicing & Agreement — NHS CHC',
        tasks: [
          { title: 'Receive and Upload Signed SUPA Agreement', defaultAssignee: MICHELLE, priority: 'urgent', order: 1, estimatedDays: 2 },
          { title: 'Generate FA Invoice',                      defaultAssignee: MICHELLE, priority: 'urgent', order: 2, estimatedDays: 1 },
          { title: 'Send Welcome Email with PE Price List and Generic STC', defaultAssignee: MICHELLE, priority: 'high', order: 3, estimatedDays: 1 }
        ]
      },
      // SECTION 3: INVOICING — LA
      {
        fundingType: 'la', category: 'invoicing-agreement',
        name: 'Invoicing & Agreement — LA',
        tasks: [
          { title: 'Receive and Upload Signed Service Agreement', defaultAssignee: MICHELLE, priority: 'urgent', order: 1, estimatedDays: 2 },
          { title: 'Generate FA Invoice',                         defaultAssignee: MICHELLE, priority: 'urgent', order: 2, estimatedDays: 1 },
          { title: 'Attach PE Price List',                        defaultAssignee: MICHELLE, priority: 'medium', order: 3, estimatedDays: 2 },
          { title: 'Attach Generic STC Contract',                 defaultAssignee: MICHELLE, priority: 'urgent', order: 4, estimatedDays: 2 },
          { title: 'Send Welcome Email',                          defaultAssignee: MICHELLE, priority: 'high',   order: 5, estimatedDays: 1 }
        ]
      },
      // SECTION 4: CONTRACT — all
      {
        fundingType: 'all', category: 'contract',
        name: 'Contract — All',
        tasks: [
          { title: 'Confirm Welcome Email Received',        defaultAssignee: MICHELLE,  priority: 'medium', order: 1, estimatedDays: 3 },
          { title: 'Schedule PAQ Survey',                  defaultAssignee: MICHELLE,  priority: 'high',   order: 2, estimatedDays: 5 },
          { title: 'Send STC Contract for Signature',      defaultAssignee: MICHELLE,  priority: 'urgent', order: 3, estimatedDays: 2 },
          { title: 'Upload Signed STC Contract to Folder', defaultAssignee: MICHELLE,  priority: 'high',   order: 4, estimatedDays: 7 },
          { title: 'Update Resident NOK List with Address', defaultAssignee: MICHELLE,  priority: 'medium', order: 5, estimatedDays: 2 },
          { title: 'Forward NOK Details to Home Liaison',  defaultAssignee: MICHELLE, priority: 'medium', order: 6, estimatedDays: 2 }
        ]
      },
      // SECTION 5: LONG-TERM FUNDING — Private
      {
        fundingType: 'private', category: 'long-term-funding',
        name: 'Long-Term Funding — Private',
        tasks: [
          { title: 'Signed SU Received',                defaultAssignee: MICHELLE, priority: 'high',   order: 1, estimatedDays: 3 },
          { title: 'Set Up Recurring Invoice Profile',  defaultAssignee: MICHELLE, priority: 'high',   order: 2, estimatedDays: 3 },
          { title: 'Confirm SO Payment Method Active',  defaultAssignee: MICHELLE, priority: 'high',   order: 3, estimatedDays: 7 }
        ]
      },
      // SECTION 6: FNC — D2A
      {
        fundingType: 'd2a', category: 'fnc',
        name: 'FNC Assessment — NHS D2A',
        tasks: [
          { title: 'Add Resident to WCL FNC Section',              defaultAssignee: MICHELLE, priority: 'high',   order: 1, estimatedDays: 2  },
          { title: 'Add FNC Assessment Update to WCL',             defaultAssignee: MICHELLE, priority: 'high',   order: 2, estimatedDays: 7  },
          { title: 'Add to Current FNC Schedule (if eligible)',     defaultAssignee: MICHELLE, priority: 'medium', order: 3, estimatedDays: 14 },
          { title: 'Raise Retrospective FNC Invoice (if applicable)',defaultAssignee: MICHELLE, priority: 'high',  order: 4, estimatedDays: 7  }
        ]
      },
      // SECTION 6: FNC — CCG ICB
      {
        fundingType: 'ccg-icb', category: 'fnc',
        name: 'FNC Assessment — NHS CHC',
        tasks: [
          { title: 'Add Resident to WCL FNC Section',              defaultAssignee: MICHELLE, priority: 'high',   order: 1, estimatedDays: 2  },
          { title: 'Add FNC Assessment Update to WCL',             defaultAssignee: MICHELLE, priority: 'high',   order: 2, estimatedDays: 7  },
          { title: 'Add to Current FNC Schedule (if eligible)',     defaultAssignee: MICHELLE, priority: 'medium', order: 3, estimatedDays: 14 },
          { title: 'Raise Retrospective FNC Invoice (if applicable)',defaultAssignee: MICHELLE, priority: 'high',  order: 4, estimatedDays: 7  }
        ]
      },
      // SECTION 6: FNC — Private
      {
        fundingType: 'private', category: 'fnc',
        name: 'FNC Assessment — Private',
        tasks: [
          { title: 'Add Resident to WCL FNC Section',              defaultAssignee: MICHELLE, priority: 'high',   order: 1, estimatedDays: 2  },
          { title: 'Add FNC Assessment Update to WCL',             defaultAssignee: MICHELLE, priority: 'high',   order: 2, estimatedDays: 7  },
          { title: 'Add to Current FNC Schedule (if eligible)',     defaultAssignee: MICHELLE, priority: 'medium', order: 3, estimatedDays: 14 },
          { title: 'Raise Retrospective FNC Invoice (if applicable)',defaultAssignee: MICHELLE, priority: 'high',  order: 4, estimatedDays: 7  }
        ]
      },
      // SECTION 6: FNC — LA
      {
        fundingType: 'la', category: 'fnc',
        name: 'FNC Assessment — LA',
        tasks: [
          { title: 'Add Resident to WCL FNC Section',              defaultAssignee: MICHELLE, priority: 'high',   order: 1, estimatedDays: 2  },
          { title: 'Add FNC Assessment Update to WCL',             defaultAssignee: MICHELLE, priority: 'high',   order: 2, estimatedDays: 7  },
          { title: 'Add to Current FNC Schedule (if eligible)',     defaultAssignee: MICHELLE, priority: 'medium', order: 3, estimatedDays: 14 },
          { title: 'Raise Retrospective FNC Invoice (if applicable)',defaultAssignee: MICHELLE, priority: 'high',  order: 4, estimatedDays: 7  }
        ]
      },
      // SECTION 7: POST DEMISE/DISCHARGE — all
      {
        fundingType: 'all', category: 'post-demise-discharge',
        name: 'Post Demise / Discharge — All',
        tasks: [
          { title: 'Record Discharge / Demise Date',                        defaultAssignee: MICHELLE,  priority: 'urgent', order: 1, estimatedDays: 1 },
          { title: 'Upload Discharge Notification',                         defaultAssignee: MICHELLE,  priority: 'urgent', order: 2, estimatedDays: 1 },
          { title: 'Update TWH Bed List',                                   defaultAssignee: MICHELLE,  priority: 'urgent', order: 3, estimatedDays: 1 },
          { title: 'Archive Resident NOK List Entry',                       defaultAssignee: MICHELLE,  priority: 'high',   order: 4, estimatedDays: 1 },
          { title: 'Remove from Birthday List',                             defaultAssignee: MICHELLE,  priority: 'medium', order: 5, estimatedDays: 2 },
          { title: 'Send Condolence Email O/S Expenses (if applicable)',    defaultAssignee: MICHELLE, priority: 'high',   order: 6, estimatedDays: 3 },
          { title: 'Update FNC List (if applicable)',                       defaultAssignee: MICHELLE,  priority: 'medium', order: 7, estimatedDays: 2 },
          { title: 'Archive Entry from Database',                           defaultAssignee: MICHELLE,  priority: 'medium', order: 8, estimatedDays: 7 }
        ]
      },
      // HL TASKS — all
      {
        fundingType: 'all', category: 'hl-tasks',
        name: 'HL Supplementary Tasks',
        tasks: [
          { title: 'Add NOK to Friends & Family List',         defaultAssignee: MICHELLE,  priority: 'medium', order: 1, estimatedDays: 2  },
          { title: 'Media Consent Obtained',                   defaultAssignee: MICHELLE,  priority: 'medium', order: 2, estimatedDays: 7  },
          { title: 'Create Activity Album',                    defaultAssignee: MICHELLE,  priority: 'low',    order: 3, estimatedDays: 7  },
          { title: 'Send Welcome & Life Story Request Email',  defaultAssignee: MICHELLE,  priority: 'medium', order: 4, estimatedDays: 3  },
          { title: 'Obtain Life Story from Family',            defaultAssignee: MICHELLE,  priority: 'medium', order: 5, estimatedDays: 14 },
          { title: 'Create Door Poster',                       defaultAssignee: MICHELLE,  priority: 'low',    order: 6, estimatedDays: 7  },
          { title: 'Complete DNACPR / Advance Directive',      defaultAssignee: MICHELLE, priority: 'urgent', order: 7, estimatedDays: 7  },
          { title: 'Notify Chaplaincy / Pastoral Care',        defaultAssignee: MICHELLE,priority: 'low',    order: 8, estimatedDays: 7  }
        ]
      },
      // SECTION 8: CHANGE IN FUNDING — Private
      {
        fundingType: 'private', category: 'change-in-funding',
        name: 'Change in Funding — Private',
        tasks: [
          { title: 'Date of Commencement',                                                            defaultAssignee: MICHELLE,  priority: 'urgent', order: 1, estimatedDays: 0 },
          { title: 'New Funding Type',                                                                defaultAssignee: MICHELLE,  priority: 'urgent', order: 2, estimatedDays: 0 },
          { title: 'Rate',                                                                            defaultAssignee: MICHELLE,  priority: 'urgent', order: 3, estimatedDays: 0 },
          { title: 'Fee Letter and Invoice Sent (if Private)',                                        defaultAssignee: MICHELLE,  priority: 'high',   order: 4, estimatedDays: 2 },
          { title: 'New STC/SU Issued as Applicable',                                                 defaultAssignee: MICHELLE,  priority: 'urgent', order: 5, estimatedDays: 2 },
          { title: 'Signed STC/SU Received and Filed',                                                defaultAssignee: MICHELLE,  priority: 'high',   order: 6, estimatedDays: 7 },
          { title: 'TWH Bed List Updated',                                                            defaultAssignee: MICHELLE,  priority: 'medium', order: 7, estimatedDays: 1 },
          { title: 'Resident NOK List Updated',                                                       defaultAssignee: MICHELLE,  priority: 'medium', order: 8, estimatedDays: 1 },
          { title: 'Invoicee Sheet Updated (Care Fee & RPE)',                                         defaultAssignee: MICHELLE,  priority: 'medium', order: 9, estimatedDays: 1 },
          { title: 'Recurring Invoice Profile Set Up on FA (if Private)',                             defaultAssignee: MICHELLE,  priority: 'high',   order: 10, estimatedDays: 3 },
          { title: 'Signed SU Email Snoozed for 11 Mos to Issue Fee Inc/Fee Inc Master Updated (if Private)', defaultAssignee: MICHELLE, priority: 'medium', order: 11, estimatedDays: 1 }
        ]
      },
      // SECTION 8: CHANGE IN FUNDING — D2A
      {
        fundingType: 'd2a', category: 'change-in-funding',
        name: 'Change in Funding — NHS D2A',
        tasks: [
          { title: 'Date of Commencement',                                                            defaultAssignee: MICHELLE,  priority: 'urgent', order: 1, estimatedDays: 0 },
          { title: 'New Funding Type',                                                                defaultAssignee: MICHELLE,  priority: 'urgent', order: 2, estimatedDays: 0 },
          { title: 'Rate',                                                                            defaultAssignee: MICHELLE,  priority: 'urgent', order: 3, estimatedDays: 0 },
          { title: 'SUPA Filed and FA/TS Invoices Drafted (if CHC)',                                  defaultAssignee: MICHELLE,  priority: 'high',   order: 4, estimatedDays: 2 },
          { title: 'New STC/SU Issued as Applicable',                                                 defaultAssignee: MICHELLE,  priority: 'urgent', order: 5, estimatedDays: 2 },
          { title: 'Signed STC/SU Received and Filed',                                                defaultAssignee: MICHELLE,  priority: 'high',   order: 6, estimatedDays: 7 },
          { title: 'TWH Bed List Updated',                                                            defaultAssignee: MICHELLE,  priority: 'medium', order: 7, estimatedDays: 1 },
          { title: 'Resident NOK List Updated',                                                       defaultAssignee: MICHELLE,  priority: 'medium', order: 8, estimatedDays: 1 },
          { title: 'Invoicee Sheet Updated (Care Fee & RPE)',                                         defaultAssignee: MICHELLE,  priority: 'medium', order: 9, estimatedDays: 1 }
        ]
      },
      // SECTION 8: CHANGE IN FUNDING — CCG ICB
      {
        fundingType: 'ccg-icb', category: 'change-in-funding',
        name: 'Change in Funding — NHS CHC',
        tasks: [
          { title: 'Date of Commencement',                                                            defaultAssignee: MICHELLE,  priority: 'urgent', order: 1, estimatedDays: 0 },
          { title: 'New Funding Type',                                                                defaultAssignee: MICHELLE,  priority: 'urgent', order: 2, estimatedDays: 0 },
          { title: 'Rate',                                                                            defaultAssignee: MICHELLE,  priority: 'urgent', order: 3, estimatedDays: 0 },
          { title: 'SUPA Filed and FA/TS Invoices Drafted (if CHC)',                                  defaultAssignee: MICHELLE,  priority: 'high',   order: 4, estimatedDays: 2 },
          { title: 'New STC/SU Issued as Applicable',                                                 defaultAssignee: MICHELLE,  priority: 'urgent', order: 5, estimatedDays: 2 },
          { title: 'Signed STC/SU Received and Filed',                                                defaultAssignee: MICHELLE,  priority: 'high',   order: 6, estimatedDays: 7 },
          { title: 'TWH Bed List Updated',                                                            defaultAssignee: MICHELLE,  priority: 'medium', order: 7, estimatedDays: 1 },
          { title: 'Resident NOK List Updated',                                                       defaultAssignee: MICHELLE,  priority: 'medium', order: 8, estimatedDays: 1 },
          { title: 'Invoicee Sheet Updated (Care Fee & RPE)',                                         defaultAssignee: MICHELLE,  priority: 'medium', order: 9, estimatedDays: 1 }
        ]
      },
      // SECTION 8: CHANGE IN FUNDING — LA
      {
        fundingType: 'la', category: 'change-in-funding',
        name: 'Change in Funding — LA',
        tasks: [
          { title: 'Date of Commencement',                                                            defaultAssignee: MICHELLE,  priority: 'urgent', order: 1, estimatedDays: 0 },
          { title: 'New Funding Type',                                                                defaultAssignee: MICHELLE,  priority: 'urgent', order: 2, estimatedDays: 0 },
          { title: 'Rate',                                                                            defaultAssignee: MICHELLE,  priority: 'urgent', order: 3, estimatedDays: 0 },
          { title: 'Signed SLA Uploaded to SU Contracts (if LA Funding)',                             defaultAssignee: MICHELLE,  priority: 'urgent', order: 4, estimatedDays: 3 },
          { title: 'New STC/SU Issued as Applicable',                                                 defaultAssignee: MICHELLE,  priority: 'urgent', order: 5, estimatedDays: 2 },
          { title: 'Signed STC/SU Received and Filed',                                                defaultAssignee: MICHELLE,  priority: 'high',   order: 6, estimatedDays: 7 },
          { title: 'TWH Bed List Updated',                                                            defaultAssignee: MICHELLE,  priority: 'medium', order: 7, estimatedDays: 1 },
          { title: 'Resident NOK List Updated',                                                       defaultAssignee: MICHELLE,  priority: 'medium', order: 8, estimatedDays: 1 },
          { title: 'Invoicee Sheet Updated (Care Fee & RPE)',                                         defaultAssignee: MICHELLE,  priority: 'medium', order: 9, estimatedDays: 1 }
        ]
      }
    ]);
    console.log(`✓ Seeded ${templates.length} workflow templates`);

    // ── RESIDENTS + TASKS ──────────────────────────────────────────────────
    let residentCount = 0;
    let taskCount = 0;

    for (const data of RESIDENTS) {
      const admissionDate = parseDate(data.admissionDate) || new Date();
      const dischargeDate = parseDate(data.dischargeDate);
      const demiseDate    = parseDate(data.demiseDate);

      const resident = await Resident.create({
        firstName:      data.firstName,
        lastName:       data.lastName,
        roomNumber:     data.roomNumber,
        admissionDate,
        dischargeDate,
        demiseDate,
        fundingType:    data.fundingType,
        fundingRate:    data.fundingRate || '',
        status:         data.status,
        primaryContact: data.primaryContact,
        createdBy:      adminUser._id
      });

      // Generate tasks from templates, marking completed sections
      const matchingTemplates = templates.filter(t =>
        t.fundingType === resident.fundingType || t.fundingType === 'all'
      );

      const tasks = [];
      for (const tmpl of matchingTemplates) {
        const isCompleted = data.completedSections.includes(tmpl.category);
        for (const t of tmpl.tasks) {
          const dueDate = new Date(admissionDate);
          dueDate.setDate(dueDate.getDate() + (t.estimatedDays || 7));
          tasks.push({
            residentId:    resident._id,
            title:         t.title,
            description:   t.description || '',
            category:      tmpl.category,
            fundingType:   tmpl.fundingType,
            status:        isCompleted ? 'completed' : 'pending',
            priority:      t.priority,
            assignedTo:    t.defaultAssignee || '',
            dueDate,
            dateCompleted: isCompleted ? admissionDate : null,
            order:         t.order,
            createdBy:     adminUser._id
          });
        }
      }

      if (tasks.length) {
        await Task.insertMany(tasks);
        taskCount += tasks.length;
      }

      residentCount++;
    }

    console.log(`✓ Seeded ${residentCount} residents with ${taskCount} tasks`);

    console.log('\n✅ Seed complete!');
    console.log('\nLogin credentials:');
    console.log('  Admin:    admin@twhnh.com / admin123');
    console.log('  Salima:   salima@twhnh.com / staff123');
    console.log('  Michelle: michelle@twhnh.com / staff123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
