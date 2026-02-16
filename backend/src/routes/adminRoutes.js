const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Swagger docs: see docs/openapi/admin.yaml

// All admin routes require admin role
router.use(verifyToken, requireRole('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id', adminController.updateUserByAdmin);

router.get('/data', adminController.getAllData);

router.get('/consents', adminController.getAllConsents);

router.get('/audit-logs', adminController.getAuditLogs);

router.get('/statistics', adminController.getStatistics);

router.get('/reports', require('../controllers/reportController').getAllReports);

router.patch('/reports/:id/review', require('../controllers/reportController').reviewReport);

module.exports = router;

