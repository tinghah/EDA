const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const fileController = require('../controllers/fileController');
const aiController = require('../controllers/aiController');

// Multer (UTF-8 safe)
const uploadsDir = path.join(__dirname, '../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueName = `${uuidv4()}-${safeName}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const allowed = ['.xlsx', '.xls', '.xlsb', '.csv'];
    const ext = path.extname(originalName).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.get('/health', fileController.getHealth);

// File management
router.post('/upload', upload.array('files', 10), fileController.uploadFiles);
router.get('/files', fileController.listFiles);
router.get('/file/:id', fileController.getFileData);
router.delete('/file/:id', fileController.deleteFile);
router.post('/search', fileController.searchFile);
router.post('/column-stats', fileController.getColumnStats);
router.post('/export', fileController.exportFile);

// AI functions
router.post('/chat-context', aiController.getChatContextRoute);
router.post('/save-results', aiController.saveResultsRoute);
router.post('/transform-file', aiController.transformFileRoute);

module.exports = router;
