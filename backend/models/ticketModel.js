const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String
  }
});

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  slaDeadline: {
    type: Date,
    required: true
  },
  timeline: [timelineSchema],
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Virtual for SLA status
ticketSchema.virtual('slaStatus').get(function() {
  const now = new Date();
  return now > this.slaDeadline ? 'breached' : 'active';
});

// Virtual for SLA time remaining
ticketSchema.virtual('slaTimeRemaining').get(function() {
  const now = new Date();
  const remaining = this.slaDeadline - now;
  return remaining > 0 ? remaining : 0;
});

// Ensure virtual fields are serialized
ticketSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema);
