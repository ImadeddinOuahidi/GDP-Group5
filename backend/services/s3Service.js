const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const crypto = require('crypto');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const bucketName = process.env.S3_BUCKET_NAME || 'healthcare-app-uploads';

/**
 * S3 Service for handling file uploads and management
 */
class S3Service {
  /**
   * Generate a unique filename
   */
  static generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${timestamp}-${randomString}-${baseName}${extension}`;
  }

  /**
   * Get file category based on mimetype
   */
  static getFileCategory(mimetype) {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.includes('pdf')) return 'documents';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'documents';
    return 'misc';
  }

  /**
   * Configure multer storage for S3
   */
  static createS3Storage(options = {}) {
    const {
      folder = 'uploads',
      allowedTypes = ['image', 'video', 'audio', 'document'],
      maxFileSize = 50 * 1024 * 1024, // 50MB default
      acl = 'public-read'
    } = options;

    return multerS3({
      s3: s3,
      bucket: bucketName,
      acl: acl,
      key: function (req, file, cb) {
        const category = S3Service.getFileCategory(file.mimetype);
        const uniqueFilename = S3Service.generateUniqueFilename(file.originalname);
        const key = `${folder}/${category}/${uniqueFilename}`;
        cb(null, key);
      },
      metadata: function (req, file, cb) {
        cb(null, {
          fieldName: file.fieldname,
          originalName: file.originalname,
          uploadedBy: req.user ? req.user.id : 'anonymous',
          uploadedAt: new Date().toISOString()
        });
      },
      contentType: multerS3.AUTO_CONTENT_TYPE
    });
  }

  /**
   * File filter function
   */
  static createFileFilter(allowedTypes = ['image', 'video', 'audio', 'document']) {
    return (req, file, cb) => {
      const allowedMimetypes = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'],
        audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm', 'audio/aac'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      };

      let isAllowed = false;
      let fileCategory = null;

      for (const type of allowedTypes) {
        if (allowedMimetypes[type] && allowedMimetypes[type].includes(file.mimetype)) {
          isAllowed = true;
          fileCategory = type;
          break;
        }
      }

      if (isAllowed) {
        req.fileCategory = fileCategory;
        cb(null, true);
      } else {
        const allowedExtensions = allowedTypes.map(type => 
          allowedMimetypes[type] ? allowedMimetypes[type].join(', ') : ''
        ).filter(ext => ext).join(', ');
        
        cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions}`), false);
      }
    };
  }

  /**
   * Create multer upload middleware
   */
  static createUploadMiddleware(options = {}) {
    const {
      folder = 'uploads',
      allowedTypes = ['image', 'video', 'audio', 'document'],
      maxFileSize = 50 * 1024 * 1024, // 50MB
      maxFiles = 10,
      acl = 'public-read'
    } = options;

    return multer({
      storage: this.createS3Storage({ folder, allowedTypes, maxFileSize, acl }),
      fileFilter: this.createFileFilter(allowedTypes),
      limits: {
        fileSize: maxFileSize,
        files: maxFiles
      }
    });
  }

  /**
   * Upload single file
   */
  static async uploadFile(file, folder = 'uploads', options = {}) {
    const { acl = 'public-read', metadata = {} } = options;
    
    const category = this.getFileCategory(file.mimetype);
    const uniqueFilename = this.generateUniqueFilename(file.originalname);
    const key = `${folder}/${category}/${uniqueFilename}`;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: acl,
      Metadata: {
        originalName: file.originalname,
        ...metadata
      }
    };

    try {
      const result = await s3.upload(params).promise();
      return {
        success: true,
        data: {
          url: result.Location,
          key: result.Key,
          bucket: result.Bucket,
          etag: result.ETag,
          size: file.size,
          originalName: file.originalname,
          mimetype: file.mimetype,
          category: category
        }
      };
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   */
  static async deleteFile(key) {
    const params = {
      Bucket: bucketName,
      Key: key
    };

    try {
      await s3.deleteObject(params).promise();
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * Get file info from S3
   */
  static async getFileInfo(key) {
    const params = {
      Bucket: bucketName,
      Key: key
    };

    try {
      const result = await s3.headObject(params).promise();
      return {
        success: true,
        data: {
          key: key,
          size: result.ContentLength,
          lastModified: result.LastModified,
          contentType: result.ContentType,
          metadata: result.Metadata,
          etag: result.ETag
        }
      };
    } catch (error) {
      if (error.code === 'NotFound') {
        return { success: false, message: 'File not found' };
      }
      throw new Error(`S3 head object failed: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for temporary access
   */
  static async generatePresignedUrl(key, expiresIn = 3600) {
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn
    };

    try {
      const url = await s3.getSignedUrlPromise('getObject', params);
      return {
        success: true,
        data: {
          url: url,
          expiresIn: expiresIn,
          expiresAt: new Date(Date.now() + expiresIn * 1000)
        }
      };
    } catch (error) {
      throw new Error(`Presigned URL generation failed: ${error.message}`);
    }
  }

  /**
   * List files in a folder
   */
  static async listFiles(folder = 'uploads', maxKeys = 100) {
    const params = {
      Bucket: bucketName,
      Prefix: folder + '/',
      MaxKeys: maxKeys
    };

    try {
      const result = await s3.listObjectsV2(params).promise();
      return {
        success: true,
        data: {
          files: result.Contents.map(item => ({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified,
            etag: item.ETag,
            url: `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${item.Key}`
          })),
          totalCount: result.KeyCount,
          isTruncated: result.IsTruncated
        }
      };
    } catch (error) {
      throw new Error(`S3 list objects failed: ${error.message}`);
    }
  }

  /**
   * Copy file within S3
   */
  static async copyFile(sourceKey, destinationKey) {
    const params = {
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destinationKey
    };

    try {
      const result = await s3.copyObject(params).promise();
      return {
        success: true,
        data: {
          sourceKey: sourceKey,
          destinationKey: destinationKey,
          etag: result.CopyObjectResult.ETag,
          lastModified: result.CopyObjectResult.LastModified
        }
      };
    } catch (error) {
      throw new Error(`S3 copy failed: ${error.message}`);
    }
  }

  /**
   * Check if bucket exists and create if it doesn't
   */
  static async ensureBucketExists() {
    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
      return { success: true, message: 'Bucket exists' };
    } catch (error) {
      if (error.code === 'NotFound') {
        try {
          await s3.createBucket({ Bucket: bucketName }).promise();
          return { success: true, message: 'Bucket created successfully' };
        } catch (createError) {
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }
      }
      throw new Error(`Bucket check failed: ${error.message}`);
    }
  }

  /**
   * Get bucket info and statistics
   */
  static async getBucketInfo() {
    try {
      const listResult = await s3.listObjectsV2({ Bucket: bucketName }).promise();
      
      let totalSize = 0;
      const categories = {};
      
      listResult.Contents.forEach(item => {
        totalSize += item.Size;
        const category = item.Key.split('/')[1] || 'misc';
        categories[category] = (categories[category] || 0) + 1;
      });

      return {
        success: true,
        data: {
          bucketName: bucketName,
          totalFiles: listResult.KeyCount,
          totalSize: totalSize,
          categories: categories,
          region: process.env.AWS_REGION || 'us-east-1'
        }
      };
    } catch (error) {
      throw new Error(`Failed to get bucket info: ${error.message}`);
    }
  }
}

module.exports = S3Service;