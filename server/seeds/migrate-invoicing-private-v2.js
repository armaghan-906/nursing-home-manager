const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Update the workflow template
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

  // Rename
  const r = await Task.updateMany(
    { title: 'Attach Generic SU Contract', category: 'invoicing-agreement' },
    { $set: { title: 'Attach Generic STC Contract', order: 4 } }
  );
  console.log(`Renamed "Attach Generic SU Contract" → "Attach Generic STC Contract": ${r.modifiedCount} tasks`);

  // Reorder unchanged
  await Task.updateMany({ title: 'Generate FA Invoice',  category: 'invoicing-agreement' }, { $set: { order: 2 } });
  await Task.updateMany({ title: 'Attach PE Price List', category: 'invoicing-agreement' }, { $set: { order: 3 } });
  await Task.updateMany({ title: 'Send Welcome Email',   category: 'invoicing-agreement' }, { $set: { order: 5 } });
  console.log('Reordered existing tasks');

  // Delete removed tasks
  const removed = ['Prepare Fee Letter', 'Prepare Standing Order Form'];
  for (const title of removed) {
    const del = await Task.deleteMany({ title, category: 'invoicing-agreement' });
    console.log(`Deleted "${title}": ${del.deletedCount} tasks`);
  }

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
