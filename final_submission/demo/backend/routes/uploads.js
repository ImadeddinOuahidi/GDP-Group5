/**
 * Upload Routes
 * 
 * Handles file uploads to MinIO (S3-compatible storage)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const minioService = require('../services/minioService');
const { protect } = require('../middleware/auth');
const { sendSuccess, sendCreated, sendError } = require('../utils/responseHelper');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allowed mime types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/webm',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

/**
 * @route   POST /api/uploads/single
 * @desc    Upload a single file
 * @access  Private
 */
router.post('/single', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file provided', 400);
    }

    if (!minioService.isAvailable()) {
      return sendError(res, 'File storage not configured', 503);
    }

    const result = await minioService.uploadFile(req.file, {
      folder: `reports/${req.user._id}`,
      metadata: {
        'x-amz-meta-user-id': req.user._id.toString(),
        'x-amz-meta-user-role': req.user.role
      }
    });

    sendCreated(res, {
      file: result
    }, 'File uploaded successfully');

  } catch (error) {
    console.error('Upload error:', error);
    sendError(res, error.message, 500);
  }
});

/**
 * @route   POST /api/uploads/multiple
 * @desc    Upload multiple files
 * @access  Private
 */
router.post('/multiple', protect, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No files provided', 400);
    }

    if (!minioService.isAvailable()) {
      return sendError(res, 'File storage not configured', 503);
    }

    const results = await minioService.uploadFiles(req.files, {
      folder: `reports/${req.user._id}`,
      metadata: {
        'x-amz-meta-user-id': req.user._id.toString(),
        'x-amz-meta-user-role': req.user.role
      }
    });

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    sendCreated(res, {
      files: successful,
      failed: failed.length > 0 ? failed : undefined,
      summary: {
        total: req.files.length,
        successful: successful.length,
        failed: failed.length
      }
    }, `${successful.length} file(s) uploaded successfully`);

  } catch (error) {
    console.error('Upload error:', error);
    sendError(res, error.message, 500);
  }
});

/**
 * @route   DELETE /api/uploads/:key
 * @desc    Delete a file
 * @access  Private
 */
router.delete('/:key', protect, async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    
    if (!minioService.isAvailable()) {
      return sendError(res, 'File storage not configured', 503);
    }

    await minioService.deleteFile(key);
    
    sendSuccess(res, null, 'File deleted successfully');

  } catch (error) {
    console.error('Delete error:', error);
    sendError(res, error.message, 500);
  }
});

/**
 * @route   GET /api/uploads/status
 * @desc    Check if file upload service is available
 * @access  Public
 */
router.get('/status', (req, res) => {
  sendSuccess(res, {
    available: minioService.isAvailable(),
    bucket: process.env.MINIO_BUCKET || 'adr-uploads'
  });
});

module.exports = router;
