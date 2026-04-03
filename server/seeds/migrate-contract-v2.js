const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const template = await WorkflowTemplate.findOne({ category: 'contract', fundingType: 'all' });
  if (!template) { console.log('Template not found'); process.exit(1); }

  template.tasks = [
    { title: 'Confirm Welcome Email Received',         defaultAssignee: 'Salima',  priority: 'medium', order: 1, estimatedDays: 3 },
    { title: 'Schedule PAQ Survey',                    defaultAssignee: 'Ajitha',  priority: 'high',   order: 2, estimatedDays: 5 },
    { title: 'Send STC Contract for Signature',        defaultAssignee: 'Salima',  priority: 'urgent', order: 3, estimatedDays: 2 },
    { title: 'Upload Signed STC Contract to Folder',   defaultAssignee: 'Salima',  priority: 'high',   order: 4, estimatedDays: 7 },
    { title: 'Update Resident NOK List with Address',  defaultAssignee: 'Salima',  priority: 'medium', order: 5, estimatedDays: 2 },
    { title: 'Forward NOK Details to Home Liaison',    defaultAssignee: 'Shirley', priority: 'medium', order: 6, estimatedDays: 2 }
  ];
  await template.save();
  console.log('Template updated');

  // Renames
  const renames = [
    { from: 'Send Service User Contract for Signature', to: 'Send STC Contract for Signature',        order: 3 },
    { from: 'Upload Signed SU Contract to Folder',      to: 'Upload Signed STC Contract to Folder',   order: 4 }
  ];
  for (const { from, to, order } of renames) {
    const r = await Task.updateMany({ title: from, category: 'contract' }, { $set: { title: to, order } });
    console.log(`Renamed "${from}" → "${to}": ${r.modifiedCount} tasks`);
  }

  // Reorder unchanged
  await Task.updateMany({ title: 'Confirm Welcome Email Received',       category: 'contract' }, { $set: { order: 1 } });
  await Task.updateMany({ title: 'Schedule PAQ Survey',                  category: 'contract' }, { $set: { order: 2 } });
  await Task.updateMany({ title: 'Update Resident NOK List with Address', category: 'contract' }, { $set: { order: 5 } });
  await Task.updateMany({ title: 'Forward NOK Details to Home Liaison',  category: 'contract' }, { $set: { order: 6 } });
  console.log('Reordered existing tasks');

  // Delete removed task
  const del = await Task.deleteMany({ title: 'Schedule Fee 10-Month Fee Increase Notification', category: 'contract' });
  console.log(`Deleted "Schedule Fee 10-Month Fee Increase Notification": ${del.deletedCount} tasks`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
