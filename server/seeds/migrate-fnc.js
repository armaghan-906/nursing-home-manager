const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

const newTasks = [
  { title: 'Add Resident to WCL FNC Section',               defaultAssignee: 'Salima', priority: 'high',   order: 1, estimatedDays: 2  },
  { title: 'Add FNC Assessment Update to WCL',              defaultAssignee: 'Salima', priority: 'high',   order: 2, estimatedDays: 7  },
  { title: 'Add to Current FNC Schedule (if eligible)',      defaultAssignee: 'Ajitha', priority: 'medium', order: 3, estimatedDays: 14 },
  { title: 'Raise Retrospective FNC Invoice (if applicable)',defaultAssignee: 'Salima', priority: 'high',   order: 4, estimatedDays: 7  }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Update all three FNC templates
  for (const fundingType of ['ccg-icb', 'private', 'la']) {
    const template = await WorkflowTemplate.findOne({ category: 'fnc', fundingType });
    if (template) {
      template.tasks = newTasks;
      await template.save();
      console.log(`Template updated: fnc / ${fundingType}`);
    } else {
      console.log(`Template not found: fnc / ${fundingType}`);
    }
  }

  // Delete all old FNC tasks from existing residents
  const del = await Task.deleteMany({ category: 'fnc' });
  console.log(`Deleted all old FNC tasks: ${del.deletedCount} tasks`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
