const S3Service = require('../services/s3Service');
const AppError = require('../utils/appError');

/**
 * Upload Controller for handling file uploads to S3
 */
class UploadController {
  /**
   * Upload single file
   * POST /api/uploads/single
   */
  static async uploadSingle(req, res, next) {
    try {
      if (!req.file) {
        return next(new AppError('No file provided', 400));
      }

      const fileData = {
        url: req.file.location,
        key: req.file.key,
        bucket: req.file.bucket,
        size: req.file.size,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        category: S3Service.getFileCategory(req.file.mimetype),
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      };

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: fileData
      });
    } catch (error) {
      next(new AppError(`Upload failed: ${error.message}`, 500));
    }
  }

  /**
   * Upload multiple files
   * POST /api/uploads/multiple
   */
  static async uploadMultiple(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return next(new AppError('No files provided', 400));
      }

      const filesData = req.files.map(file => ({
        url: file.location,
        key: file.key,
        bucket: file.bucket,
        size: file.size,
        originalName: file.originalname,
        mimetype: file.mimetype,
        category: S3Service.getFileCategory(file.mimetype),
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      }));

      res.status(201).json({
        success: true,
        message: `${filesData.length} files uploaded successfully`,
        data: {
          files: filesData,
          totalFiles: filesData.length,
          totalSize: filesData.reduce((sum, file) => sum + file.size, 0)
        }
      });
    } catch (error) {
      next(new AppError(`Upload failed: ${error.message}`, 500));
    }
  }

  /**
   * Upload images only
   * POST /api/uploads/images
   */
  static async uploadImages(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return next(new AppError('No image files provided', 400));
      }

      const imagesData = req.files.map(file => ({
        url: file.location,
        key: file.key,
        bucket: file.bucket,
        size: file.size,
        originalName: file.originalname,
        mimetype: file.mimetype,
        category: 'image',
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      }));

      res.status(201).json({
        success: true,
        message: `${imagesData.length} images uploaded successfully`,
        data: {
          images: imagesData,
          totalImages: imagesData.length,
          totalSize: imagesData.reduce((sum, file) => sum + file.size, 0)
        }
      });
    } catch (error) {
      next(new AppError(`Image upload failed: ${error.message}`, 500));
    }
  }

  /**
   * Upload videos only
   * POST /api/uploads/videos
   */
  static async uploadVideos(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return next(new AppError('No video files provided', 400));
      }

      const videosData = req.files.map(file => ({
        url: file.location,
        key: file.key,
        bucket: file.bucket,
        size: file.size,
        originalName: file.originalname,
        mimetype: file.mimetype,
        category: 'video',
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      }));

      res.status(201).json({
        success: true,
        message: `${videosData.length} videos uploaded successfully`,
        data: {
          videos: videosData,
          totalVideos: videosData.length,
          totalSize: videosData.reduce((sum, file) => sum + file.size, 0)
        }
      });
    } catch (error) {
      next(new AppError(`Video upload failed: ${error.message}`, 500));
    }
  }

  /**
   * Upload documents only
   * POST /api/uploads/documents
   */
  static async uploadDocuments(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return next(new AppError('No document files provided', 400));
      }

      const documentsData = req.files.map(file => ({
        url: file.location,
        key: file.key,
        bucket: file.bucket,
        size: file.size,
        originalName: file.originalname,
        mimetype: file.mimetype,
        category: 'document',
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      }));

      res.status(201).json({
        success: true,
        message: `${documentsData.length} documents uploaded successfully`,
        data: {
          documents: documentsData,
          totalDocuments: documentsData.length,
          totalSize: documentsData.reduce((sum, file) => sum + file.size, 0)
        }
      });
    } catch (error) {
      next(new AppError(`Document upload failed: ${error.message}`, 500));
    }
  }

  /**
   * Delete file
   * DELETE /api/uploads/:key
   */
  static async deleteFile(req, res, next) {
    try {
      const { key } = req.params;
      
      if (!key) {
        return next(new AppError('File key is required', 400));
      }

      // Decode the key in case it's URL encoded
      const decodedKey = decodeURIComponent(key);
      
      const result = await S3Service.deleteFile(decodedKey);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        data: {
          key: decodedKey,
          deletedAt: new Date()
        }
      });
    } catch (error) {
      next(new AppError(`Delete failed: ${error.message}`, 500));
    }
  }

  /**
   * Get file info
   * GET /api/uploads/:key/info
   */
  static async getFileInfo(req, res, next) {
    try {
      const { key } = req.params;
      
      if (!key) {
        return next(new AppError('File key is required', 400));
      }

      const decodedKey = decodeURIComponent(key);
      const result = await S3Service.getFileInfo(decodedKey);

      if (!result.success) {
        return next(new AppError(result.message, 404));
      }

      res.status(200).json({
        success: true,
        message: 'File info retrieved successfully',
        data: result.data
      });
    } catch (error) {
      next(new AppError(`Failed to get file info: ${error.message}`, 500));
    }
  }

  /**
   * Generate presigned URL
   * GET /api/uploads/:key/presigned-url
   */
  static async generatePresignedUrl(req, res, next) {
    try {
      const { key } = req.params;
      const { expires = 3600 } = req.query; // Default 1 hour
      
      if (!key) {
        return next(new AppError('File key is required', 400));
      }

      const decodedKey = decodeURIComponent(key);
      const expiresIn = parseInt(expires) || 3600;
      
      const result = await S3Service.generatePresignedUrl(decodedKey, expiresIn);

      res.status(200).json({
        success: true,
        message: 'Presigned URL generated successfully',
        data: result.data
      });
    } catch (error) {
      next(new AppError(`Failed to generate presigned URL: ${error.message}`, 500));
    }
  }

  /**
   * List files in folder
   * GET /api/uploads/list/:folder?
   */
  static async listFiles(req, res, next) {
    try {
      const { folder = 'uploads' } = req.params;
      const { maxKeys = 100, category } = req.query;
      
      let searchFolder = folder;
      if (category) {
        searchFolder = `${folder}/${category}`;
      }

      const result = await S3Service.listFiles(searchFolder, parseInt(maxKeys));

      res.status(200).json({
        success: true,
        message: 'Files listed successfully',
        data: {
          ...result.data,
          folder: searchFolder,
          category: category || 'all'
        }
      });
    } catch (error) {
      next(new AppError(`Failed to list files: ${error.message}`, 500));
    }
  }

  /**
   * Copy file
   * POST /api/uploads/:key/copy
   */
  static async copyFile(req, res, next) {
    try {
      const { key } = req.params;
      const { destinationKey } = req.body;
      
      if (!key) {
        return next(new AppError('Source file key is required', 400));
      }

      if (!destinationKey) {
        return next(new AppError('Destination key is required', 400));
      }

      const decodedSourceKey = decodeURIComponent(key);
      const result = await S3Service.copyFile(decodedSourceKey, destinationKey);

      res.status(200).json({
        success: true,
        message: 'File copied successfully',
        data: result.data
      });
    } catch (error) {
      next(new AppError(`Copy failed: ${error.message}`, 500));
    }
  }

  /**
   * Get upload statistics
   * GET /api/uploads/stats
   */
  static async getUploadStats(req, res, next) {
    try {
      const result = await S3Service.getBucketInfo();

      res.status(200).json({
        success: true,
        message: 'Upload statistics retrieved successfully',
        data: result.data
      });
    } catch (error) {
      next(new AppError(`Failed to get upload stats: ${error.message}`, 500));
    }
  }

  /**
   * Health check for S3 connection
   * GET /api/uploads/health
   */
  static async healthCheck(req, res, next) {
    try {
      const result = await S3Service.ensureBucketExists();

      res.status(200).json({
        success: true,
        message: 'S3 service is healthy',
        data: {
          bucketName: process.env.S3_BUCKET_NAME || 'healthcare-app-uploads',
          region: process.env.AWS_REGION || 'us-east-1',
          status: 'connected',
          timestamp: new Date()
        }
      });
    } catch (error) {
      next(new AppError(`S3 health check failed: ${error.message}`, 500));
    }
  }
}

module.exports = UploadController;