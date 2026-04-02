const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Update the workflow template
  const template = await WorkflowTemplate.findOne({ category: 'long-term-funding', fundingType: 'private' });
  if (!template) {
    console.log('Template not found');
    process.exit(1);
  }

  template.tasks = [
    { title: 'Signed SU Received',               defaultAssignee: 'Salima', priority: 'high', order: 1, estimatedDays: 3 },
    { title: 'Set Up Recurring Invoice Profile',  defaultAssignee: 'Salima', priority: 'high', order: 2, estimatedDays: 3 },
    { title: 'Confirm SO Payment Method Active',  defaultAssignee: 'Salima', priority: 'high', order: 3, estimatedDays: 7 }
  ];
  await template.save();
  console.log('Template updated');

  // Rename
  const r = await Task.updateMany(
    { title: 'Confirm Payment Method Active', category: 'long-term-funding' },
    { $set: { title: 'Confirm SO Payment Method Active', order: 3 } }
  );
  console.log(`Renamed "Confirm Payment Method Active" → "Confirm SO Payment Method Active": ${r.modifiedCount} tasks`);

  // Reorder unchanged
  await Task.updateMany({ title: 'Set Up Recurring Invoice Profile', category: 'long-term-funding' }, { $set: { order: 2 } });
  console.log('Reordered "Set Up Recurring Invoice Profile" to order 2');

  // Delete removed task
  const del = await Task.deleteMany({ title: 'Annual Fee Review Notification', category: 'long-term-funding' });
  console.log(`Deleted "Annual Fee Review Notification": ${del.deletedCount} tasks`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
