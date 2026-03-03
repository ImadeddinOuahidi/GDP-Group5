/**
 * MinIO Service
 * 
 * S3-compatible object storage service for file uploads
 * Replaces the AWS S3 service for local development
 */

const Minio = require('minio');
const crypto = require('crypto');
const path = require('path');

class MinioService {
  constructor() {
    this.client = null;
    this.bucket = process.env.MINIO_BUCKET || 'adr-uploads';
    this.isConfigured = false;
    
    this.initialize();
  }

  /**
   * Initialize MinIO client
   */
  initialize() {
    const endpoint = process.env.MINIO_ENDPOINT;
    
    if (!endpoint) {
      console.log('[MinIO] No MINIO_ENDPOINT configured - file uploads will use local storage');
      return;
    }

    try {
      this.client = new Minio.Client({
        endPoint: endpoint,
        port: parseInt(process.env.MINIO_PORT) || 9000,
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
      });
      
      this.isConfigured = true;
      console.log(`[MinIO] Client initialized - endpoint: ${endpoint}`);
      
      // Ensure bucket exists
      this.ensureBucket();
      
    } catch (error) {
      console.error('[MinIO] Initialization error:', error);
    }
  }

  /**
   * Ensure the bucket exists
   */
  async ensureBucket() {
    if (!this.isConfigured) return;
    
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        console.log(`[MinIO] Created bucket: ${this.bucket}`);
      }
    } catch (error) {
      console.error('[MinIO] Bucket check error:', error);
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    
    return `${timestamp}-${randomString}-${baseName}${extension}`;
  }

  /**
   * Get file category based on mimetype
   */
  getCategory(mimetype) {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'documents';
  }

  /**
   * Upload a file to MinIO
   */
  async uploadFile(file, options = {}) {
    if (!this.isConfigured) {
      throw new Error('MinIO not configured');
    }

    const {
      folder = 'uploads',
      metadata = {}
    } = options;

    try {
      const category = this.getCategory(file.mimetype);
      const filename = this.generateFilename(file.originalname);
      const objectName = `${folder}/${category}/${filename}`;

      // Get file buffer
      const buffer = file.buffer;

      // Upload to MinIO
      await this.client.putObject(
        this.bucket,
        objectName,
        buffer,
        buffer.length,
        {
          'Content-Type': file.mimetype,
          'x-amz-meta-original-name': file.originalname,
          'x-amz-meta-uploaded-at': new Date().toISOString(),
          ...metadata
        }
      );

      // Generate URL
      const url = this.getPublicUrl(objectName);

      console.log(`[MinIO] Uploaded: ${objectName}`);

      return {
        success: true,
        key: objectName,
        bucket: this.bucket,
        url,
        filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: buffer.length
      };

    } catch (error) {
      console.error('[MinIO] Upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          originalName: file.originalname,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get public URL for an object
   */
  getPublicUrl(objectName) {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    
    return `${protocol}://${endpoint}:${port}/${this.bucket}/${objectName}`;
  }

  /**
   * Get a presigned URL for temporary access
   */
  async getPresignedUrl(objectName, expirySeconds = 3600) {
    if (!this.isConfigured) {
      throw new Error('MinIO not configured');
    }

    return this.client.presignedGetObject(this.bucket, objectName, expirySeconds);
  }

  /**
   * Delete a file
   */
  async deleteFile(objectName) {
    if (!this.isConfigured) {
      throw new Error('MinIO not configured');
    }

    try {
      await this.client.removeObject(this.bucket, objectName);
      console.log(`[MinIO] Deleted: ${objectName}`);
      return { success: true };
    } catch (error) {
      console.error('[MinIO] Delete error:', error);
      throw error;
    }
  }

  /**
   * Get file info
   */
  async getFileStat(objectName) {
    if (!this.isConfigured) {
      throw new Error('MinIO not configured');
    }

    try {
      return await this.client.statObject(this.bucket, objectName);
    } catch (error) {
      if (error.code === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if MinIO is available
   */
  isAvailable() {
    return this.isConfigured;
  }
}

// Singleton instance
const minioService = new MinioService();

module.exports = minioService;
