const Notification = require('../models/Notification');
const User = require('../models/User');

// Store active SSE connections: Map<userId, Set<response>>
const sseClients = new Map();

/**
 * Notification Service
 * Handles creating notifications, sending real-time SSE events,
 * and optional email notifications for urgent reports.
 */
const notificationService = {
  /**
   * Register an SSE client connection
   */
  addClient(userId, res) {
    if (!sseClients.has(userId)) {
      sseClients.set(userId, new Set());
    }
    sseClients.get(userId).add(res);
    console.log(`[Notifications] SSE client connected: ${userId} (${sseClients.get(userId).size} active)`);
  },

  /**
   * Remove an SSE client connection
   */
  removeClient(userId, res) {
    const clients = sseClients.get(userId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(userId);
      }
      console.log(`[Notifications] SSE client disconnected: ${userId}`);
    }
  },

  /**
   * Send a real-time SSE event to a specific user
   */
  sendSSE(userId, event, data) {
    const clients = sseClients.get(userId.toString());
    if (clients && clients.size > 0) {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      clients.forEach((client) => {
        try {
          client.write(payload);
        } catch (err) {
          console.error('[Notifications] SSE send error:', err.message);
        }
      });
      return true;
    }
    return false;
  },

  /**
   * Create a notification and send real-time alert
   */
  async notify({ recipientId, type, title, message, priority = 'medium', relatedReport, metadata = {} }) {
    try {
      if (metadata?.dedupeKey) {
        const existing = await Notification.findOne({
          recipient: recipientId,
          'metadata.dedupeKey': metadata.dedupeKey,
        }).select('_id');

        if (existing) {
          return existing;
        }
      }

      // Save to database
      const notification = await Notification.create({
        recipient: recipientId,
        type,
        title,
        message,
        priority,
        relatedReport,
        metadata,
      });

      // Send real-time SSE event
      this.sendSSE(recipientId, 'notification', {
        id: notification._id,
        type,
        title,
        message,
        priority,
        relatedReport,
        metadata,
        createdAt: notification.createdAt,
      });

      return notification;
    } catch (error) {
      console.error('[Notifications] Failed to create notification:', error);
    }
  },

  /**
   * Notify all staff (doctors + admins) about an urgent report
   */
  async notifyStaffUrgentReport(report, options = {}) {
    try {
      // Find all doctors and admins
      const staff = await User.find({
        role: { $in: ['doctor', 'admin'] },
        isActive: { $ne: false },
      }).select('_id role email firstName');

      const patientName = report.patient
        ? `${report.patient.firstName || ''} ${report.patient.lastName || ''}`.trim()
        : 'Unknown patient';

      const medicineName = report.medicine?.name || 'Unknown medication';
      const severity =
        report.metadata?.aiAnalysis?.severity?.level ||
        report.sideEffects?.[0]?.severity ||
        'Unknown';
      const urgencyLevel =
        options.urgencyLevel ||
        report.metadata?.aiAnalysis?.patientGuidance?.urgencyLevel ||
        (severity === 'Life-threatening' ? 'emergency' : severity === 'Severe' ? 'urgent' : 'routine');
      const priority =
        urgencyLevel === 'emergency'
          ? 'critical'
          : urgencyLevel === 'urgent'
            ? 'high'
            : report.priority?.toLowerCase() || 'medium';
      const type = priority === 'critical' ? 'critical_report' : 'urgent_report';
      const notificationKey = type === 'critical_report'
        ? 'notifications.types.criticalReport'
        : 'notifications.types.urgentReport';
      const dedupeKey = `${type}:${report._id}:${urgencyLevel}`;

      const notificationData = {
        type,
        title: type === 'critical_report'
          ? `CRITICAL: Immediate attention required`
          : `Urgent Report: ${medicineName}`,
        message: type === 'critical_report'
          ? `A critical ADR report for ${medicineName} by ${patientName} requires immediate review. Severity: ${severity}.`
          : `An urgent ADR report has been submitted for ${medicineName} by ${patientName}. Severity: ${severity}.`,
        priority: type === 'critical_report' ? 'critical' : 'high',
        relatedReport: report._id,
        metadata: {
          patientName,
          medicineName,
          severity,
          reportId: report._id.toString(),
          urgencyLevel,
          trigger: options.trigger || 'submission',
          notificationKey,
          notificationArgs: {
            patientName,
            medicineName,
            severity,
            urgencyLevel,
          },
          dedupeKey,
        },
      };

      // Send to all staff members
      const notifications = await Promise.all(
        staff.map((member) =>
          this.notify({ ...notificationData, recipientId: member._id })
        )
      );

      console.log(`[Notifications] Notified ${staff.length} staff members about urgent report ${report._id}`);
      return notifications;
    } catch (error) {
      console.error('[Notifications] Failed to notify staff:', error);
    }
  },

  /**
   * Notify patient when their report status changes
   */
  async notifyReportStatusUpdate(report, newStatus) {
    if (!report.patient) return;

    const medicineName = report.medicine?.name || 'your medication';
    return this.notify({
      recipientId: report.patient._id || report.patient,
      type: 'status_updated',
      title: `Report Status Updated`,
      message: `Your ADR report for ${medicineName} has been updated to: ${newStatus}.`,
      priority: 'medium',
      relatedReport: report._id,
      metadata: {
        medicineName,
        reportId: report._id.toString(),
        notificationKey: 'notifications.types.statusUpdated',
        notificationArgs: {
          medicineName,
          status: newStatus,
        },
      },
    });
  },

  /**
   * Notify patient when AI analysis is complete
   */
  async notifyAIAnalysisComplete(report) {
    if (!report.patient) return;

    const medicineName = report.medicine?.name || 'your medication';
    const urgency = report.metadata?.aiAnalysis?.patientGuidance?.urgencyLevel || 'routine';

    return this.notify({
      recipientId: report.patient._id || report.patient,
      type: 'ai_analysis_complete',
      title: `AI Analysis Complete`,
      message: `The AI analysis for your ${medicineName} report is ready. Urgency: ${urgency}.`,
      priority: urgency === 'emergency' ? 'critical' : urgency === 'urgent' ? 'high' : 'medium',
      relatedReport: report._id,
      metadata: {
        medicineName,
        severity: urgency,
        reportId: report._id.toString(),
        urgencyLevel: urgency,
        notificationKey: 'notifications.types.aiAnalysisComplete',
        notificationArgs: {
          medicineName,
          urgency,
        },
        dedupeKey: `ai_analysis_complete:${report._id}:${urgency}`,
      },
    });
  },

  /**
   * Notify patient when doctor review is complete
   */
  async notifyReviewComplete(report) {
    if (!report.patient) return;

    const medicineName = report.medicine?.name || 'your medication';
    const doctorName = report.doctorReview?.reviewedBy
      ? `Dr. ${report.doctorReview.reviewedBy.firstName || ''}`
      : 'A doctor';

    return this.notify({
      recipientId: report.patient._id || report.patient,
      type: 'review_completed',
      title: `Doctor Review Complete`,
      message: `${doctorName} has reviewed your ADR report for ${medicineName}. View the results now.`,
      priority: 'medium',
      relatedReport: report._id,
      metadata: {
        medicineName,
        reportId: report._id.toString(),
        notificationKey: 'notifications.types.reviewCompleted',
        notificationArgs: {
          medicineName,
          doctorName,
        },
      },
    });
  },
};

module.exports = notificationService;
