const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const template = await WorkflowTemplate.findOne({ category: 'invoicing-agreement', fundingType: 'la' });
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

  // Update task name for LA residents
  const updated = await Task.updateMany(
    { title: 'Generate LA Invoice', category: 'invoicing-agreement', fundingType: 'la' },
    { $set: { title: 'Generate FA Invoice' } }
  );
  console.log(`Updated "Generate LA Invoice" tasks: ${updated.modifiedCount} tasks`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
