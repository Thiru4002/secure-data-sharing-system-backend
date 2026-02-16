const express = require('express');
const reportController = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Swagger docs: see docs/openapi/report.yaml

router.use(verifyToken);

router.post('/', requireRole('data_owner', 'service_user'), reportController.createReport);
router.get('/my', requireRole('data_owner', 'service_user'), reportController.getMyReports);

module.exports = router;
