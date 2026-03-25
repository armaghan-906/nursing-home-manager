const mongoose = require('mongoose');

const templateTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  defaultAssignee: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  order: { type: Number, default: 0 },
  estimatedDays: { type: Number, default: 7 }
});

const workflowTemplateSchema = new mongoose.Schema({
  fundingType: {
    type: String,
    enum: ['private', 'd2a', 'ccg-icb', 'la', 'all'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'records-update',
      'invoicing-agreement',
      'contract',
      'long-term-funding',
      'fnc',
      'post-demise-discharge',
      'hl-tasks'
    ],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  tasks: [templateTaskSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

workflowTemplateSchema.index({ fundingType: 1, category: 1 });

module.exports = mongoose.model('WorkflowTemplate', workflowTemplateSchema);
