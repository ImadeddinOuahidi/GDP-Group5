const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../temp');

[uploadsDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.memoryStorage(); // Store files in memory for AI processing

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'];
  
  if (file.fieldname === 'images') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Allowed formats: JPEG, PNG, GIF, WebP'), false);
    }
  } else if (file.fieldname === 'audio') {
    if (allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format. Allowed formats: MP3, WAV, M4A, OGG, WebM'), false);
    }
  } else {
    cb(new Error('Unexpected field name'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files total
  }
});

// Middleware for AI report submission
const uploadAIReportFiles = upload.fields([
  { name: 'images', maxCount: 5 }, // Up to 5 images
  { name: 'audio', maxCount: 1 }   // Up to 1 audio file
]);

// Error handling middleware for file uploads
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File size too large. Maximum size is 10MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files. Maximum 5 images and 1 audio file allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Unexpected field name. Use "images" for images and "audio" for audio files.'
      });
    }
  }
  
  if (error.message.includes('Invalid')) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
  
  // Other errors
  return res.status(500).json({
    status: 'error',
    message: 'File upload error: ' + error.message
  });
};

// Middleware to validate and process uploaded files
const validateUploadedFiles = (req, res, next) => {
  try {
    // Check if at least one input type is provided
    const hasText = req.body.text && req.body.text.trim().length > 0;
    const hasImages = req.files && req.files.images && req.files.images.length > 0;
    const hasAudio = req.files && req.files.audio && req.files.audio.length > 0;
    
    if (!hasText && !hasImages && !hasAudio) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one input (text, image, or audio) is required.'
      });
    }
    
    // Validate text input length if provided
    if (hasText && req.body.text.length > 5000) {
      return res.status(400).json({
        status: 'error',
        message: 'Text input too long. Maximum 5000 characters allowed.'
      });
    }
    
    // Validate image files
    if (hasImages) {
      for (const image of req.files.images) {
        // Check file size (additional check)
        if (image.size > 10 * 1024 * 1024) {
          return res.status(400).json({
            status: 'error',
            message: `Image file ${image.originalname} is too large. Maximum 10MB allowed.`
          });
        }
        
        // Validate image dimensions (optional)
        if (image.buffer) {
          // You could add sharp validation here if needed
        }
      }
    }
    
    // Validate audio file
    if (hasAudio) {
      const audioFile = req.files.audio[0];
      
      // Check audio file size (additional check)
      if (audioFile.size > 25 * 1024 * 1024) { // 25MB for audio
        return res.status(400).json({
          status: 'error',
          message: 'Audio file is too large. Maximum 25MB allowed.'
        });
      }
      
      // Check audio duration (you might want to implement this)
      // This would require processing the audio file to get duration
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error validating uploaded files: ' + error.message
    });
  }
};

module.exports = {
  uploadAIReportFiles,
  handleUploadErrors,
  validateUploadedFiles
};