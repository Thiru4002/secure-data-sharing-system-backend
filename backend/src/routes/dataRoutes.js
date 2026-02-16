const express = require('express');
const multer = require('multer');
const dataController = require('../controllers/dataController');
const { verifyToken } = require('../middlewares/auth');

const tokenFromQuery = (req, _res, next) => {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
};

const router = express.Router();

// Swagger docs: see docs/openapi/data.yaml

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/upload', verifyToken, upload.single('file'), dataController.uploadData);

router.get('/my-data', verifyToken, dataController.getOwnData);

router.get('/discover', verifyToken, dataController.discoverDataAdvanced);

router.get('/user-identification', verifyToken, dataController.getUserIdentification);

router.get('/:id/view', tokenFromQuery, verifyToken, dataController.viewData);

router.get('/:id/download', verifyToken, dataController.downloadData);

router.get('/:id', verifyToken, dataController.getDataById);

router.patch('/:id', verifyToken, dataController.updateData);

router.delete('/:id', verifyToken, dataController.deleteData);

module.exports = router;

