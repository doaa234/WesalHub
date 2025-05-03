import express from 'express';
import multer from 'multer';
import { verifyToken, requirePermission } from '../middleware/authMiddleware';
import * as fileController from '../controllers/fileController';
import config from '../config';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: config.fileStorage.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    // Check if file type is allowed
    if (Object.keys(config.fileStorage.allowedFileTypes).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Apply authentication middleware to all routes
router.use(verifyToken);

// Upload file for a resident
router.post(
  '/:residentId/:category',
  requirePermission('residents', 'edit', 'files'),
  upload.single('file'),
  fileController.uploadFile
);

// Get file for a resident
router.get(
  '/:fileId',
  requirePermission('residents', 'view', 'files'),
  fileController.getFile
);

// Delete file for a resident
router.delete(
  '/:fileId',
  requirePermission('residents', 'delete', 'files'),
  fileController.deleteFile
);

// Get all files for a resident
router.get(
  '/resident/:residentId',
  requirePermission('residents', 'view', 'files'),
  fileController.getResidentFiles
);

export default router;