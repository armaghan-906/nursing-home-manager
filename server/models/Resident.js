const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  roomNumber: {
    type: String,
    required: [true, 'Please provide room number'],
    trim: true
  },
  admissionDate: {
    type: Date,
    required: [true, 'Please provide admission date'],
    default: Date.now
  },
  dischargeDate: {
    type: Date,
    default: null
  },
  demiseDate: {
    type: Date,
    default: null
  },
  fundingType: {
    type: String,
    enum: ['private', 'private-respite', 'd2a', 'ccg-icb', 'la', 'la-respite'],
    required: [true, 'Please provide funding type'],
    default: 'private'
  },
  fundingRate: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['admission', 'ongoing-care', 'discharge-planning', 'discharged', 'deceased'],
    default: 'admission'
  },
  primaryContact: {
    name: { type: String, default: '' },
    relationship: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' }
  },
  admissionNotes: {
    type: String,
    default: ''
  },
  medicalNotes: {
    type: String,
    default: ''
  },
  gpName: {
    type: String,
    default: ''
  },
  gpContact: {
    type: String,
    default: ''
  },
  nhsNumber: {
    type: String,
    default: ''
  },
  photo: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  archived: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
residentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for tasks
residentSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'residentId'
});

// Index for search
residentSchema.index({ firstName: 'text', lastName: 'text', roomNumber: 'text' });

module.exports = mongoose.model('Resident', residentSchema);
