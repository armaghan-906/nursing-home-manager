const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Update the workflow template
  const template = await WorkflowTemplate.findOne({ category: 'contract', fundingType: 'all' });
  if (!template) {
    console.log('Template not found');
    process.exit(1);
  }

  template.tasks = [
    { title: 'Confirm Welcome Email Received',                  defaultAssignee: 'Salima',  priority: 'medium', order: 1, estimatedDays: 3  },
    { title: 'Schedule PAQ Survey',                             defaultAssignee: 'Ajitha',  priority: 'high',   order: 2, estimatedDays: 5  },
    { title: 'Send Service User Contract for Signature',        defaultAssignee: 'Salima',  priority: 'urgent', order: 3, estimatedDays: 2  },
    { title: 'Upload Signed SU Contract to Folder',             defaultAssignee: 'Salima',  priority: 'high',   order: 4, estimatedDays: 7  },
    { title: 'Schedule Fee 10-Month Fee Increase Notification', defaultAssignee: 'Salima',  priority: 'medium', order: 5, estimatedDays: 14 },
    { title: 'Update Resident NOK List with Address',           defaultAssignee: 'Salima',  priority: 'medium', order: 6, estimatedDays: 2  },
    { title: 'Forward NOK Details to Home Liaison',             defaultAssignee: 'Shirley', priority: 'medium', order: 7, estimatedDays: 2  }
  ];
  await template.save();
  console.log('Template updated');

  // Renames
  const renames = [
    { from: 'Schedule PAQ Assessment',          to: 'Schedule PAQ Survey',                             order: 2 },
    { from: 'Upload Signed Service User Contract', to: 'Upload Signed SU Contract to Folder',          order: 4 },
    { from: 'Forward NOK Details to Care Team', to: 'Forward NOK Details to Home Liaison',             order: 7 }
  ];
  for (const { from, to, order } of renames) {
    const r = await Task.updateMany(
      { title: from, category: 'contract' },
      { $set: { title: to, order } }
    );
    console.log(`Renamed "${from}" → "${to}": ${r.modifiedCount} tasks`);
  }

  // Reorder unchanged tasks
  const reorders = [
    { title: 'Confirm Welcome Email Received',            order: 1 },
    { title: 'Send Service User Contract for Signature',  order: 3 }
  ];
  for (const { title, order } of reorders) {
    await Task.updateMany({ title, category: 'contract' }, { $set: { order } });
    console.log(`Reordered "${title}" to order ${order}`);
  }

  // Delete removed task
  const del = await Task.deleteMany({ title: 'Upload Signed Fee Letter', category: 'contract' });
  console.log(`Deleted "Upload Signed Fee Letter": ${del.deletedCount} tasks`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
