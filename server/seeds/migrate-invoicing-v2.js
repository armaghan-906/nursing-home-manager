const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const template = await WorkflowTemplate.findOne({ category: 'invoicing-agreement', fundingType: 'private' });
  if (!template) { console.log('Template not found'); process.exit(1); }

  template.tasks = [
    { title: 'Receive and Upload Signed Service Agreement', defaultAssignee: 'Salima', priority: 'urgent', order: 1, estimatedDays: 2 },
    { title: 'Generate FA Invoice',                         defaultAssignee: 'Salima', priority: 'urgent', order: 2, estimatedDays: 1 },
    { title: 'Attach PE Price List',                        defaultAssignee: 'Salima', priority: 'medium', order: 3, estimatedDays: 2 },
    { title: 'Attach Generic STC Contract',                 defaultAssignee: 'Salima', priority: 'urgent', order: 4, estimatedDays: 2 },
    { title: 'Send Welcome Email',                          defaultAssignee: 'Salima', priority: 'high',   order: 5, estimatedDays: 1 }
  ];
  await template.save();
  console.log('Template updated');

  // Update existing tasks for private residents
  const updates = [
    { old: 'Receive and Upload Signed Service Agreement', new: null }, // remove
    { old: 'Generate FA Invoice', order: 1 },
    { old: 'Prepare Fee Letter', order: 2 },
    { old: 'Prepare Standing Order Form', order: 3 },
    { old: 'Attach PE Price List', order: 4 },
    { old: 'Attach Generic SU Contract', order: 5 },
    { old: 'Send Welcome Email', order: 6 }
  ];

  // Delete the removed task
  const del = await Task.deleteMany({
    title: 'Receive and Upload Signed Service Agreement',
    category: 'invoicing-agreement',
    fundingType: 'private'
  });
  console.log(`Deleted "Receive and Upload Signed Service Agreement": ${del.deletedCount} tasks`);

  // Reorder remaining tasks
  for (const u of updates) {
    if (u.order) {
      await Task.updateMany(
        { title: u.old, category: 'invoicing-agreement', fundingType: 'private' },
        { $set: { order: u.order } }
      );
    }
  }
  console.log('Reordered tasks');

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
