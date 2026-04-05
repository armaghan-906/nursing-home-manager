const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const template = await WorkflowTemplate.findOne({ category: 'post-demise-discharge', fundingType: 'all' });
  if (!template) { console.log('Template not found'); process.exit(1); }

  template.tasks = [
    { title: 'Record Discharge / Demise Date',                     defaultAssignee: 'Salima',  priority: 'urgent', order: 1, estimatedDays: 1 },
    { title: 'Upload Discharge Notification',                      defaultAssignee: 'Salima',  priority: 'urgent', order: 2, estimatedDays: 1 },
    { title: 'Update TWH Bed List',                                defaultAssignee: 'Salima',  priority: 'urgent', order: 3, estimatedDays: 1 },
    { title: 'Archive Resident NOK List Entry',                    defaultAssignee: 'Salima',  priority: 'high',   order: 4, estimatedDays: 1 },
    { title: 'Remove from Birthday List',                          defaultAssignee: 'Salima',  priority: 'medium', order: 5, estimatedDays: 2 },
    { title: 'Send Condolence Email O/S Expenses (if applicable)', defaultAssignee: 'Shirley', priority: 'high',   order: 6, estimatedDays: 3 },
    { title: 'Update FNC List (if applicable)',                    defaultAssignee: 'Salima',  priority: 'medium', order: 7, estimatedDays: 2 },
    { title: 'Archive Entry from Database',                        defaultAssignee: 'Salima',  priority: 'medium', order: 8, estimatedDays: 7 }
  ];
  await template.save();
  console.log('Template updated');

  // Rename condolence email task
  const r = await Task.updateMany(
    { title: 'Send Condolence Email with Invoice/Credit and O/S Expenses (if applicable)', category: 'post-demise-discharge' },
    { $set: { title: 'Send Condolence Email O/S Expenses (if applicable)', order: 6 } }
  );
  console.log(`Renamed condolence email task: ${r.modifiedCount} tasks`);

  // Reorder unchanged tasks
  await Task.updateMany({ title: 'Update FNC List (if applicable)',  category: 'post-demise-discharge' }, { $set: { order: 7 } });
  await Task.updateMany({ title: 'Archive Entry from Database',      category: 'post-demise-discharge' }, { $set: { order: 8 } });
  console.log('Reordered tasks');

  // Delete removed task
  const del = await Task.deleteMany({ title: 'Cancel Recurring Invoice Profile', category: 'post-demise-discharge' });
  console.log(`Deleted "Cancel Recurring Invoice Profile": ${del.deletedCount} tasks`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
