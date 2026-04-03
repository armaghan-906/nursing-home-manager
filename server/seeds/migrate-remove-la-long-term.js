const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const WorkflowTemplate = require('../models/WorkflowTemplate');
const Task = require('../models/Task');
const Resident = require('../models/Resident');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Remove the LA long-term-funding template
  const del = await WorkflowTemplate.deleteOne({ category: 'long-term-funding', fundingType: 'la' });
  console.log(`Deleted LA long-term-funding template: ${del.deletedCount}`);

  // Find all LA residents
  const laResidents = await Resident.find({ fundingType: 'la' }).select('_id');
  const laIds = laResidents.map(r => r._id);
  console.log(`Found ${laIds.length} LA residents`);

  // Delete long-term-funding tasks for LA residents
  const taskDel = await Task.deleteMany({ category: 'long-term-funding', resident: { $in: laIds } });
  console.log(`Deleted long-term-funding tasks for LA residents: ${taskDel.deletedCount}`);

  console.log('Migration complete');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
