const AuditLog = require('../models/AuditLog');

exports.logAction = async (req, res, next) => {
  try {
    const originalSend = res.send;

    res.send = function (data) {
      // Log only successful actions (status < 400)
      if (res.statusCode < 400 && req.user) {
        const logData = {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          statusCode: res.statusCode,
        };

        // Determine action based on route
        const method = req.method;
        const path = req.baseUrl;

        if (path.includes('/auth/login')) {
          logData.action = 'login';
          logData.resourceType = 'user';
        } else if (path.includes('/data') && method === 'POST') {
          logData.action = 'data_upload';
          logData.resourceType = 'data';
        } else if (path.includes('/consent') && method === 'PATCH') {
          if (path.includes('approve')) {
            logData.action = 'consent_approve';
          } else if (path.includes('revoke')) {
            logData.action = 'consent_revoke';
          }
          logData.resourceType = 'consent';
        }

        if (logData.action) {
          AuditLog.create(logData).catch(console.error);
        }
      }

      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    next(error);
  }
};
