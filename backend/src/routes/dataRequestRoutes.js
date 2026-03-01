const express = require('express');
const dataRequestController = require('../controllers/dataRequestController');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use(verifyToken);

// Service user endpoints
router.post('/', requireRole('service_user'), dataRequestController.createRequest);
router.get('/my', requireRole('service_user'), dataRequestController.getMyRequests);

// Data owner endpoints
router.get('/incoming', requireRole('data_owner'), dataRequestController.getIncomingRequests);
router.patch('/:id/reject', requireRole('data_owner'), dataRequestController.rejectRequest);
router.patch('/:id/fulfill', requireRole('data_owner'), dataRequestController.fulfillRequest);

module.exports = router;
