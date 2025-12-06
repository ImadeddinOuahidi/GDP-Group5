const S3Service = require('../services/s3Service');
const AppError = require('../utils/appError');
const { sendSuccess, sendCreated, sendNotFound } = require('../utils/responseHelper');
const { formatFileData, formatFilesData, createUploadSummary } = require('../utils/fileHelper');

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

      const fileData = formatFileData(req.file, req.user.id);

      return sendCreated(res, fileData, 'File uploaded successfully');
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

      const filesData = formatFilesData(req.files, req.user.id);
      const summary = createUploadSummary(filesData);

      return sendCreated(res, {
        files: filesData,
        ...summary
      }, `${filesData.length} files uploaded successfully`);
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

      const imagesData = formatFilesData(req.files, req.user.id);
      const summary = createUploadSummary(imagesData);

      return sendCreated(res, {
        images: imagesData,
        totalImages: imagesData.length,
        totalSize: summary.totalSize,
        totalSizeFormatted: summary.totalSizeFormatted
      }, `${imagesData.length} images uploaded successfully`);
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

      const videosData = formatFilesData(req.files, req.user.id);
      const summary = createUploadSummary(videosData);

      return sendCreated(res, {
        videos: videosData,
        totalVideos: videosData.length,
        totalSize: summary.totalSize,
        totalSizeFormatted: summary.totalSizeFormatted
      }, `${videosData.length} videos uploaded successfully`);
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

      const documentsData = formatFilesData(req.files, req.user.id);
      const summary = createUploadSummary(documentsData);

      return sendCreated(res, {
        documents: documentsData,
        totalDocuments: documentsData.length,
        totalSize: summary.totalSize,
        totalSizeFormatted: summary.totalSizeFormatted
      }, `${documentsData.length} documents uploaded successfully`);
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

      const decodedKey = decodeURIComponent(key);
      await S3Service.deleteFile(decodedKey);

      return sendSuccess(res, {
        data: {
          key: decodedKey,
          deletedAt: new Date()
        },
        message: 'File deleted successfully'
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
        return sendNotFound(res, result.message);
      }

      return sendSuccess(res, {
        data: result.data,
        message: 'File info retrieved successfully'
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
      const { expires = 3600 } = req.query;
      
      if (!key) {
        return next(new AppError('File key is required', 400));
      }

      const decodedKey = decodeURIComponent(key);
      const expiresIn = parseInt(expires) || 3600;
      
      const result = await S3Service.generatePresignedUrl(decodedKey, expiresIn);

      return sendSuccess(res, {
        data: result.data,
        message: 'Presigned URL generated successfully'
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

      return sendSuccess(res, {
        data: {
          ...result.data,
          folder: searchFolder,
          category: category || 'all'
        },
        message: 'Files listed successfully'
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

      return sendSuccess(res, {
        data: result.data,
        message: 'File copied successfully'
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

      return sendSuccess(res, {
        data: result.data,
        message: 'Upload statistics retrieved successfully'
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
      await S3Service.ensureBucketExists();

      return sendSuccess(res, {
        data: {
          bucketName: process.env.S3_BUCKET_NAME || 'healthcare-app-uploads',
          region: process.env.AWS_REGION || 'us-east-1',
          status: 'connected',
          timestamp: new Date()
        },
        message: 'S3 service is healthy'
      });
    } catch (error) {
      next(new AppError(`S3 health check failed: ${error.message}`, 500));
    }
  }
}

module.exports = UploadController;