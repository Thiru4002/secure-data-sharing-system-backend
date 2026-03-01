const express = require('express');
const discoveryController = require('../controllers/discoveryController');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

// Service user discovery routes
router.use(verifyToken, requireRole('service_user'));

router.get('/owners', discoveryController.listDataOwners);
router.get('/owners/:id', discoveryController.getOwnerProfile);

module.exports = router;
