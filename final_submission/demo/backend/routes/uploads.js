const express = require('express');
const { body, param, query } = require('express-validator');
const UploadController = require('../controllers/uploadController');
const S3Service = require('../services/s3Service');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Upload validation middleware
const validateFileUpload = (req, res, next) => {
  if (req.file || (req.files && req.files.length > 0)) {
    next();
  } else {
    res.status(400).json({
      success: false,
      message: 'No files provided for upload'
    });
  }
};

// Error handling for multer/upload errors
const handleUploadError = (error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size allowed is 50MB per file.'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files. Maximum 10 files allowed per upload.'
    });
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  return res.status(500).json({
    success: false,
    message: `Upload error: ${error.message}`
  });
};

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             key:
 *               type: string
 *             bucket:
 *               type: string
 *             size:
 *               type: number
 *             originalName:
 *               type: string
 *             mimetype:
 *               type: string
 *             category:
 *               type: string
 */

/**
 * @swagger
 * /api/uploads/single:
 *   post:
 *     summary: Upload a single file to S3
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (images, videos, audio, documents)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Invalid file or no file provided
 *       401:
 *         description: Unauthorized
 */
router.post('/single',
  S3Service.createUploadMiddleware({
    folder: 'uploads',
    allowedTypes: ['image', 'video', 'audio', 'document'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 1
  }).single('file'),
  handleUploadError,
  validateFileUpload,
  UploadController.uploadSingle
);

/**
 * @swagger
 * /api/uploads/multiple:
 *   post:
 *     summary: Upload multiple files to S3
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 10 files)
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid files or no files provided
 *       401:
 *         description: Unauthorized
 */
router.post('/multiple',
  S3Service.createUploadMiddleware({
    folder: 'uploads',
    allowedTypes: ['image', 'video', 'audio', 'document'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10
  }).array('files', 10),
  handleUploadError,
  validateFileUpload,
  UploadController.uploadMultiple
);

/**
 * @swagger
 * /api/uploads/images:
 *   post:
 *     summary: Upload image files only
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files to upload (max 10 files)
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *       400:
 *         description: Invalid image files or no files provided
 *       401:
 *         description: Unauthorized
 */
router.post('/images',
  S3Service.createUploadMiddleware({
    folder: 'uploads/images',
    allowedTypes: ['image'],
    maxFileSize: 10 * 1024 * 1024, // 10MB for images
    maxFiles: 10
  }).array('images', 10),
  handleUploadError,
  validateFileUpload,
  UploadController.uploadImages
);

/**
 * @swagger
 * /api/uploads/videos:
 *   post:
 *     summary: Upload video files only
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Video files to upload (max 5 files)
 *     responses:
 *       201:
 *         description: Videos uploaded successfully
 *       400:
 *         description: Invalid video files or no files provided
 *       401:
 *         description: Unauthorized
 */
router.post('/videos',
  S3Service.createUploadMiddleware({
    folder: 'uploads/videos',
    allowedTypes: ['video'],
    maxFileSize: 100 * 1024 * 1024, // 100MB for videos
    maxFiles: 5
  }).array('videos', 5),
  handleUploadError,
  validateFileUpload,
  UploadController.uploadVideos
);

/**
 * @swagger
 * /api/uploads/documents:
 *   post:
 *     summary: Upload document files only
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Document files to upload (max 10 files)
 *     responses:
 *       201:
 *         description: Documents uploaded successfully
 *       400:
 *         description: Invalid document files or no files provided
 *       401:
 *         description: Unauthorized
 */
router.post('/documents',
  S3Service.createUploadMiddleware({
    folder: 'uploads/documents',
    allowedTypes: ['document'],
    maxFileSize: 50 * 1024 * 1024, // 50MB for documents
    maxFiles: 10
  }).array('documents', 10),
  handleUploadError,
  validateFileUpload,
  UploadController.uploadDocuments
);

/**
 * @swagger
 * /api/uploads/{key}:
 *   delete:
 *     summary: Delete a file from S3
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: S3 file key (URL encoded)
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       400:
 *         description: Invalid file key
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.delete('/:key',
  [
    param('key').notEmpty().withMessage('File key is required')
  ],
  UploadController.deleteFile
);

/**
 * @swagger
 * /api/uploads/{key}/info:
 *   get:
 *     summary: Get file information
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: S3 file key (URL encoded)
 *     responses:
 *       200:
 *         description: File info retrieved successfully
 *       400:
 *         description: Invalid file key
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.get('/:key/info',
  [
    param('key').notEmpty().withMessage('File key is required')
  ],
  UploadController.getFileInfo
);

/**
 * @swagger
 * /api/uploads/{key}/presigned-url:
 *   get:
 *     summary: Generate presigned URL for temporary access
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: S3 file key (URL encoded)
 *       - in: query
 *         name: expires
 *         schema:
 *           type: integer
 *           default: 3600
 *         description: URL expiration time in seconds
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *       400:
 *         description: Invalid file key
 *       401:
 *         description: Unauthorized
 */
router.get('/:key/presigned-url',
  [
    param('key').notEmpty().withMessage('File key is required'),
    query('expires').optional().isInt({ min: 60, max: 604800 }).withMessage('Expires must be between 60 seconds and 7 days')
  ],
  UploadController.generatePresignedUrl
);

/**
 * @swagger
 * /api/uploads/{key}/copy:
 *   post:
 *     summary: Copy file within S3
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Source file key (URL encoded)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destinationKey:
 *                 type: string
 *                 description: Destination file key
 *             required:
 *               - destinationKey
 *     responses:
 *       200:
 *         description: File copied successfully
 *       400:
 *         description: Invalid file key or destination
 *       401:
 *         description: Unauthorized
 */
router.post('/:key/copy',
  [
    param('key').notEmpty().withMessage('Source file key is required'),
    body('destinationKey').notEmpty().withMessage('Destination key is required')
  ],
  UploadController.copyFile
);

/**
 * @swagger
 * /api/uploads/list/{folder}:
 *   get:
 *     summary: List files in a folder
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folder
 *         schema:
 *           type: string
 *           default: uploads
 *         description: Folder name to list files from
 *       - in: query
 *         name: maxKeys
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of files to return
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [images, videos, audio, documents]
 *         description: Filter by file category
 *     responses:
 *       200:
 *         description: Files listed successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/list/:folder?',
  [
    param('folder').optional().isString().withMessage('Folder must be a string'),
    query('maxKeys').optional().isInt({ min: 1, max: 1000 }).withMessage('Max keys must be between 1 and 1000'),
    query('category').optional().isIn(['images', 'videos', 'audio', 'documents']).withMessage('Invalid category')
  ],
  UploadController.listFiles
);

/**
 * @swagger
 * /api/uploads/stats:
 *   get:
 *     summary: Get upload statistics
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upload statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats',
  restrictTo('admin', 'doctor'),
  UploadController.getUploadStats
);

/**
 * @swagger
 * /api/uploads/health:
 *   get:
 *     summary: S3 service health check
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: S3 service is healthy
 *       500:
 *         description: S3 service is unavailable
 */
router.get('/health',
  restrictTo('admin'),
  UploadController.healthCheck
);

module.exports = router;