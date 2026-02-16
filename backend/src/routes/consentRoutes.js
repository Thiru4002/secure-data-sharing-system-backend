const express = require('express');
const consentController = require('../controllers/consentController');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Swagger docs: see docs/openapi/consent.yaml

router.post('/request', verifyToken, consentController.requestAccess);

router.get('/my-requests', verifyToken, consentController.getMyRequests);

router.get('/approvals', verifyToken, consentController.getApprovals);

router.patch('/:id/approve', verifyToken, consentController.approveConsent);

router.patch('/:id/reject', verifyToken, consentController.rejectConsent);

router.patch('/:id/revoke', verifyToken, consentController.revokeConsent);

router.get('/access-history', verifyToken, consentController.getAccessHistory);

module.exports = router;

