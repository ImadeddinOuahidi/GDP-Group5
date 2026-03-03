const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'urgent_report',
      'critical_report',
      'new_report',
      'review_requested',
      'review_completed',
      'status_updated',
      'ai_analysis_complete',
      'duplicate_detected',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  relatedReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportSideEffect',
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
  metadata: {
    patientName: String,
    medicineName: String,
    severity: String,
    reportId: String,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static: Get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static: Get recent notifications for user
notificationSchema.statics.getRecent = function(userId, limit = 20) {
  return this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('relatedReport', 'status priority')
    .lean();
};

module.exports = mongoose.model('Notification', notificationSchema);
