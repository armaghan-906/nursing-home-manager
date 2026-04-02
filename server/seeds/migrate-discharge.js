const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Update the workflow template
  const template = await WorkflowTemplate.findOne({ category: 'post-demise-discharge', fundingType: 'all' });
  if (!template) {
    console.log('Template not found');
    process.exit(1);
  }

  template.tasks = [
    { title: 'Record Discharge / Demise Date',                                             defaultAssignee: 'Salima',  priority: 'urgent', order: 1, estimatedDays: 1 },
    { title: 'Upload Discharge Notification',                                              defaultAssignee: 'Salima',  priority: 'urgent', order: 2, estimatedDays: 1 },
    { title: 'Update TWH Bed List',                                                        defaultAssignee: 'Salima',  priority: 'urgent', order: 3, estimatedDays: 1 },
    { title: 'Archive Resident NOK List Entry',                                            defaultAssignee: 'Salima',  priority: 'high',   order: 4, estimatedDays: 1 },
    { title: 'Remove from Birthday List',                                                  defaultAssignee: 'Salima',  priority: 'medium', order: 5, estimatedDays: 2 },
    { title: 'Cancel Recurring Invoice Profile',                                           defaultAssignee: 'Salima',  priority: 'urgent', order: 6, estimatedDays: 1 },
    { title: 'Send Condolence Email with Invoice/Credit and O/S Expenses (if applicable)', defaultAssignee: 'Shirley', priority: 'high',   order: 7, estimatedDays: 3 },
    { title: 'Update FNC List (if applicable)',                                            defaultAssignee: 'Salima',  priority: 'medium', order: 8, estimatedDays: 2 },
    { title: 'Archive Entry from Database',                                                defaultAssignee: 'Salima',  priority: 'medium', order: 9, estimatedDays: 7 }
  ];
  await template.save();
  console.log('Template updated');

  // Renames
  const renames = [
    { from: 'Update TWH Bed List (remove resident)',     to: 'Update TWH Bed List',                                                                        order: 3 },
    { from: 'Update Resident NOK List (archive)',        to: 'Archive Resident NOK List Entry',                                                             order: 4 },
    { from: 'Send Condolence Communication (if demise)', to: 'Send Condolence Email with Invoice/Credit and O/S Expenses (if applicable)',                  order: 7 },
    { from: 'Archive Resident Folder',                   to: 'Archive Entry from Database',                                                                 order: 9 }
  ];
  for (const { from, to, order } of renames) {
    const r = await Task.updateMany(
      { title: from, category: 'post-demise-discharge' },
      { $set: { title: to, order } }
    );
    console.log(`Renamed "${from}" → "${to}": ${r.modifiedCount} tasks`);
  }

  // Reorder unchanged
  const reorders = [
    { title: 'Record Discharge / Demise Date', order: 1 },
    { title: 'Remove from Birthday List',      order: 5 },
    { title: 'Cancel Recurring Invoice Profile', order: 6 }
  ];
  for (const { title, order } of reorders) {
    await Task.updateMany({ title, category: 'post-demise-discharge' }, { $set: { order } });
    console.log(`Reordered "${title}" to order ${order}`);
  }

  // Delete removed tasks
  const removed = ['Issue Final Invoice (pro-rated)', 'Notify Funding Authority of Discharge', 'Return Personal Belongings to Family'];
  for (const title of removed) {
    const del = await Task.deleteMany({ title, category: 'post-demise-discharge' });
    console.log(`Deleted "${title}": ${del.deletedCount} tasks`);
  }

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
