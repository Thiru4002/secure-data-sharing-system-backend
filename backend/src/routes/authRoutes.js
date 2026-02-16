const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Swagger docs: see docs/openapi/auth.yaml

router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);

router.post('/reset-password', authController.resetPassword);

router.get('/me', verifyToken, authController.getCurrentUser);

router.patch('/profile', verifyToken, authController.updateProfile);

router.delete('/delete', verifyToken, authController.deleteAccount);

router.patch('/cancel-deletion', verifyToken, authController.cancelDeletion);

module.exports = router;

