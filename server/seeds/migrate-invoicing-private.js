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
  if (!template) {
    console.log('Template not found');
    process.exit(1);
  }

  template.tasks = [
    { title: 'Generate FA Invoice',         defaultAssignee: 'Salima', priority: 'urgent', order: 1, estimatedDays: 1 },
    { title: 'Prepare Fee Letter',          defaultAssignee: 'Salima', priority: 'high',   order: 2, estimatedDays: 2 },
    { title: 'Prepare Standing Order Form', defaultAssignee: 'Salima', priority: 'high',   order: 3, estimatedDays: 3 },
    { title: 'Attach PE Price List',        defaultAssignee: 'Salima', priority: 'medium', order: 4, estimatedDays: 2 },
    { title: 'Attach Generic SU Contract',  defaultAssignee: 'Salima', priority: 'urgent', order: 5, estimatedDays: 2 },
    { title: 'Send Welcome Email',          defaultAssignee: 'Salima', priority: 'high',   order: 6, estimatedDays: 1 }
  ];
  await template.save();
  console.log('Template updated');

  // Renames
  const renames = [
    { from: 'Send Standing Order Form',             to: 'Prepare Standing Order Form', order: 3 },
    { from: 'Prepare PE Price List',                to: 'Attach PE Price List',         order: 4 },
    { from: 'Prepare Service User Contract (SUPA)', to: 'Attach Generic SU Contract',   order: 5 },
    { from: 'Send Welcome Email to NOK',            to: 'Send Welcome Email',           order: 6 }
  ];
  for (const { from, to, order } of renames) {
    const r = await Task.updateMany(
      { title: from, category: 'invoicing-agreement' },
      { $set: { title: to, order } }
    );
    console.log(`Renamed "${from}" → "${to}": ${r.modifiedCount} tasks`);
  }

  // Reorder unchanged tasks
  await Task.updateMany({ title: 'Generate FA Invoice',  category: 'invoicing-agreement' }, { $set: { order: 1 } });
  await Task.updateMany({ title: 'Prepare Fee Letter',   category: 'invoicing-agreement' }, { $set: { order: 2 } });
  console.log('Reordered Generate FA Invoice and Prepare Fee Letter');

  // Remove deprecated task
  const del = await Task.deleteMany({ title: 'Issue Invoice to NOK', category: 'invoicing-agreement' });
  console.log(`Deleted "Issue Invoice to NOK": ${del.deletedCount} tasks`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
