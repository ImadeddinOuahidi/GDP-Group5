/**
 * MinIO Service for Consumer
 * 
 * Handles downloading files from MinIO storage for AI processing
 */

const Minio = require('minio');

class MinioService {
  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
    });
    
    this.bucket = process.env.MINIO_BUCKET || 'adr-uploads';
  }

  /**
   * Get file as buffer for AI processing
   */
  async getFileBuffer(objectName) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      
      this.client.getObject(this.bucket, objectName, (err, stream) => {
        if (err) {
          console.error('[MinioService] Error getting file:', err);
          return reject(err);
        }
        
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err) => reject(err));
      });
    });
  }

  /**
   * Get file as base64 for AI processing
   */
  async getFileBase64(objectName) {
    const buffer = await this.getFileBuffer(objectName);
    return buffer.toString('base64');
  }

  /**
   * Get file metadata
   */
  async getFileStat(objectName) {
    try {
      return await this.client.statObject(this.bucket, objectName);
    } catch (error) {
      console.error('[MinioService] Error getting file stat:', error);
      return null;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(objectName) {
    try {
      await this.client.statObject(this.bucket, objectName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get multiple files for AI processing
   */
  async getFilesForProcessing(fileList) {
    const files = [];
    
    for (const file of fileList) {
      try {
        const exists = await this.fileExists(file.key || file.objectName);
        if (!exists) {
          console.warn(`[MinioService] File not found: ${file.key || file.objectName}`);
          continue;
        }
        
        const data = await this.getFileBase64(file.key || file.objectName);
        const stat = await this.getFileStat(file.key || file.objectName);
        
        files.push({
          key: file.key || file.objectName,
          data,
          mimeType: file.mimeType || stat?.metaData?.['content-type'] || 'application/octet-stream',
          size: stat?.size || 0
        });
      } catch (error) {
        console.error(`[MinioService] Error processing file ${file.key}:`, error);
      }
    }
    
    return files;
  }
}

module.exports = MinioService;
