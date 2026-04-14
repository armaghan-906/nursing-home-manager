const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Update D2A template
  const d2aTemplate = await WorkflowTemplate.findOne({ category: 'invoicing-agreement', fundingType: 'd2a' });
  if (d2aTemplate) {
    d2aTemplate.name = 'Invoicing & Agreement — NHS D2A';
    d2aTemplate.tasks = [
      { title: 'Receive and Upload Signed SUPA Agreement', defaultAssignee: 'Salima', priority: 'urgent', order: 1, estimatedDays: 2 },
      { title: 'Generate FA Invoice',                      defaultAssignee: 'Salima', priority: 'urgent', order: 2, estimatedDays: 1 },
      { title: 'Send Welcome Email with PE Price List and Generic STC', defaultAssignee: 'Salima', priority: 'high', order: 3, estimatedDays: 1 }
    ];
    await d2aTemplate.save();
    console.log('D2A template updated');
  }

  // Update CCG ICB template
  const chcTemplate = await WorkflowTemplate.findOne({ category: 'invoicing-agreement', fundingType: 'ccg-icb' });
  if (chcTemplate) {
    chcTemplate.name = 'Invoicing & Agreement — NHS CHC';
    chcTemplate.tasks = [
      { title: 'Receive and Upload Signed SUPA Agreement', defaultAssignee: 'Salima', priority: 'urgent', order: 1, estimatedDays: 2 },
      { title: 'Generate FA Invoice',                      defaultAssignee: 'Salima', priority: 'urgent', order: 2, estimatedDays: 1 },
      { title: 'Send Welcome Email with PE Price List and Generic STC', defaultAssignee: 'Salima', priority: 'high', order: 3, estimatedDays: 1 }
    ];
    await chcTemplate.save();
    console.log('CHC template updated');
  }

  // Delete old tasks for D2A and CCG ICB
  const d2aDel = await Task.deleteMany({ category: 'invoicing-agreement', fundingType: 'd2a' });
  const chcDel = await Task.deleteMany({ category: 'invoicing-agreement', fundingType: 'ccg-icb' });
  console.log(`Deleted D2A tasks: ${d2aDel.deletedCount}, CHC tasks: ${chcDel.deletedCount}`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
