const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: [
        'login',
        'logout',
        'data_upload',
        'data_delete',
        'consent_approve',
        'consent_reject',
        'consent_revoke',
        'consent_auto_approve',
        'data_request_create',
        'data_request_reject',
        'data_request_fulfill',
        'user_register',
      ],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['user', 'data', 'consent', 'data_request'],
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    description: String,
    ipAddress: String,
    userAgent: String,
    statusCode: {
      type: Number,
      default: 200,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
