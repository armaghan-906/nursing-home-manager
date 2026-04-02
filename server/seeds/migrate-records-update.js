const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Update the workflow template
  const template = await WorkflowTemplate.findOne({ category: 'records-update', fundingType: 'all' });
  if (!template) {
    console.log('Template not found');
    process.exit(1);
  }

  template.tasks = [
    { title: 'Upload Admission Notification', defaultAssignee: 'Shirley', priority: 'medium', order: 1, estimatedDays: 2 },
    { title: 'Update TWH Bed List',           defaultAssignee: 'Salima',  priority: 'high',   order: 2, estimatedDays: 1 },
    { title: 'Update Resident NOK List',      defaultAssignee: 'Salima',  priority: 'high',   order: 3, estimatedDays: 1 },
    { title: 'Update Birthday List',          defaultAssignee: 'Salima',  priority: 'medium', order: 4, estimatedDays: 1 },
    { title: 'Update Invoicee Sheet',         defaultAssignee: 'Salima',  priority: 'high',   order: 5, estimatedDays: 1 }
  ];
  await template.save();
  console.log('Template updated');

  // Rename existing tasks in the Task collection
  const renames = [
    { from: 'File Admission Notification', to: 'Upload Admission Notification' }
  ];
  for (const { from, to } of renames) {
    const result = await Task.updateMany({ title: from, category: 'records-update' }, { $set: { title: to, order: 1 } });
    console.log(`Renamed "${from}" → "${to}": ${result.modifiedCount} tasks`);
  }

  // Reorder existing tasks
  const reorder = [
    { title: 'Update TWH Bed List',      order: 2 },
    { title: 'Update Resident NOK List', order: 3 },
    { title: 'Update Birthday List',     order: 4 },
    { title: 'Update Invoicee Sheet',    order: 5 }
  ];
  for (const { title, order } of reorder) {
    await Task.updateMany({ title, category: 'records-update' }, { $set: { order } });
    console.log(`Reordered "${title}" to order ${order}`);
  }

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
