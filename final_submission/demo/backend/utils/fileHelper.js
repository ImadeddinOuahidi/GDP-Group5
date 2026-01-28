/**
 * File Upload Helper Utilities
 * Common functions for file upload processing
 */

const minioService = require('../services/minioService');
const { FILE_LIMITS } = require('./constants');

/**
 * Format uploaded file data
 * @param {Object} file - Multer file object (with S3 data)
 * @param {String} userId - User ID who uploaded the file
 * @returns {Object} Formatted file data
 */
const formatFileData = (file, userId = null) => {
  return {
    url: file.location,
    key: file.key,
    bucket: file.bucket,
    size: file.size,
    originalName: file.originalname,
    mimetype: file.mimetype,
    category: minioService.getCategory(file.mimetype),
    uploadedBy: userId,
    uploadedAt: new Date()
  };
};

/**
 * Format multiple uploaded files
 * @param {Array} files - Array of multer file objects
 * @param {String} userId - User ID who uploaded the files
 * @returns {Array} Array of formatted file data
 */
const formatFilesData = (files, userId = null) => {
  return files.map(file => formatFileData(file, userId));
};

/**
 * Calculate total size of files
 * @param {Array} files - Array of file objects
 * @returns {Number} Total size in bytes
 */
const calculateTotalSize = (files) => {
  return files.reduce((sum, file) => sum + (file.size || 0), 0);
};

/**
 * Validate file type against allowed types
 * @param {String} mimetype - File MIME type
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {Boolean} True if valid, false otherwise
 */
const isValidFileType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

/**
 * Get file size limit based on file type
 * @param {String} fileType - Type of file (image, video, audio, document)
 * @returns {Number} Size limit in bytes
 */
const getFileSizeLimit = (fileType) => {
  const limits = {
    image: FILE_LIMITS.IMAGE.MAX_SIZE,
    video: FILE_LIMITS.VIDEO.MAX_SIZE,
    audio: FILE_LIMITS.AUDIO.MAX_SIZE,
    document: FILE_LIMITS.DOCUMENT.MAX_SIZE
  };
  
  return limits[fileType] || FILE_LIMITS.GENERAL.MAX_SIZE;
};

/**
 * Get allowed file types based on category
 * @param {String} category - File category
 * @returns {Array} Array of allowed MIME types
 */
const getAllowedFileTypes = (category) => {
  const types = {
    image: FILE_LIMITS.IMAGE.ALLOWED_TYPES,
    video: FILE_LIMITS.VIDEO.ALLOWED_TYPES,
    audio: FILE_LIMITS.AUDIO.ALLOWED_TYPES,
    document: FILE_LIMITS.DOCUMENT.ALLOWED_TYPES
  };
  
  return types[category] || [];
};

/**
 * Format bytes to human readable format
 * @param {Number} bytes - Size in bytes
 * @param {Number} decimals - Number of decimal places
 * @returns {String} Formatted size string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Extract file extension from filename
 * @param {String} filename - Original filename
 * @returns {String} File extension (without dot)
 */
const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Validate file count against limit
 * @param {Number} fileCount - Number of files
 * @param {Number} maxCount - Maximum allowed count
 * @returns {Boolean} True if valid, false otherwise
 */
const isValidFileCount = (fileCount, maxCount) => {
  return fileCount > 0 && fileCount <= maxCount;
};

/**
 * Generate file metadata for database storage
 * @param {Object} fileData - Formatted file data
 * @param {Object} additionalMeta - Additional metadata
 * @returns {Object} Complete file metadata
 */
const generateFileMetadata = (fileData, additionalMeta = {}) => {
  return {
    ...fileData,
    ...additionalMeta,
    uploadedAt: new Date(),
    isActive: true,
    accessCount: 0,
    lastAccessedAt: null
  };
};

/**
 * Create upload summary for multiple files
 * @param {Array} filesData - Array of formatted file data
 * @returns {Object} Upload summary
 */
const createUploadSummary = (filesData) => {
  const totalSize = calculateTotalSize(filesData);
  const categories = {};
  
  filesData.forEach(file => {
    categories[file.category] = (categories[file.category] || 0) + 1;
  });
  
  return {
    totalFiles: filesData.length,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    categories,
    uploadedAt: new Date()
  };
};

module.exports = {
  formatFileData,
  formatFilesData,
  calculateTotalSize,
  isValidFileType,
  getFileSizeLimit,
  getAllowedFileTypes,
  formatBytes,
  getFileExtension,
  isValidFileCount,
  generateFileMetadata,
  createUploadSummary
};
