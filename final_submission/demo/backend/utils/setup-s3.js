#!/usr/bin/env node

/**
 * S3 Setup Utility
 * This utility helps set up the S3 bucket and test the connection
 */

const AWS = require('aws-sdk');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const bucketName = process.env.S3_BUCKET_NAME || 'healthcare-app-uploads';

/**
 * Create S3 bucket if it doesn't exist
 */
async function createBucket() {
  try {
    console.log(`🪣 Checking if bucket '${bucketName}' exists...`);
    
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`✅ Bucket '${bucketName}' already exists`);
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      try {
        console.log(`📦 Creating bucket '${bucketName}'...`);
        
        const params = {
          Bucket: bucketName,
          CreateBucketConfiguration: {
            LocationConstraint: process.env.AWS_REGION || 'us-east-1'
          }
        };

        // Remove LocationConstraint for us-east-1
        if (params.CreateBucketConfiguration.LocationConstraint === 'us-east-1') {
          delete params.CreateBucketConfiguration;
        }

        await s3.createBucket(params).promise();
        console.log(`✅ Bucket '${bucketName}' created successfully`);
        return true;
      } catch (createError) {
        console.error(`❌ Failed to create bucket: ${createError.message}`);
        return false;
      }
    } else {
      console.error(`❌ Error checking bucket: ${error.message}`);
      return false;
    }
  }
}

/**
 * Set up bucket CORS configuration
 */
async function configureCORS() {
  try {
    console.log(`🔧 Configuring CORS for bucket '${bucketName}'...`);
    
    const corsParams = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'], // Restrict this in production
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    };

    await s3.putBucketCors(corsParams).promise();
    console.log(`✅ CORS configuration applied`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to configure CORS: ${error.message}`);
    return false;
  }
}

/**
 * Set up bucket lifecycle configuration
 */
async function configureLifecycle() {
  try {
    console.log(`♻️  Configuring lifecycle rules for bucket '${bucketName}'...`);
    
    const lifecycleParams = {
      Bucket: bucketName,
      LifecycleConfiguration: {
        Rules: [
          {
            ID: 'DeleteIncompleteMultipartUploads',
            Status: 'Enabled',
            AbortIncompleteMultipartUpload: {
              DaysAfterInitiation: 1
            }
          },
          {
            ID: 'TransitionToIA',
            Status: 'Enabled',
            Transitions: [
              {
                Days: 30,
                StorageClass: 'STANDARD_IA'
              },
              {
                Days: 90,
                StorageClass: 'GLACIER'
              }
            ]
          }
        ]
      }
    };

    await s3.putBucketLifecycleConfiguration(lifecycleParams).promise();
    console.log(`✅ Lifecycle configuration applied`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to configure lifecycle: ${error.message}`);
    return false;
  }
}

/**
 * Test file upload and download
 */
async function testUpload() {
  try {
    console.log(`🧪 Testing file upload...`);
    
    const testContent = 'This is a test file for S3 upload verification.';
    const testKey = 'test/upload-test.txt';
    
    // Upload test file
    const uploadParams = {
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    console.log(`✅ Test file uploaded: ${uploadResult.Location}`);
    
    // Download test file
    const downloadParams = {
      Bucket: bucketName,
      Key: testKey
    };

    const downloadResult = await s3.getObject(downloadParams).promise();
    const downloadedContent = downloadResult.Body.toString();
    
    if (downloadedContent === testContent) {
      console.log(`✅ Test file downloaded and verified`);
    } else {
      console.log(`❌ Test file content mismatch`);
      return false;
    }
    
    // Clean up test file
    await s3.deleteObject(downloadParams).promise();
    console.log(`🗑️  Test file cleaned up`);
    
    return true;
  } catch (error) {
    console.error(`❌ Test upload failed: ${error.message}`);
    return false;
  }
}

/**
 * Create necessary folders
 */
async function createFolders() {
  try {
    console.log(`📁 Creating folder structure...`);
    
    const folders = [
      'uploads/images/',
      'uploads/videos/',
      'uploads/audio/',
      'uploads/documents/',
      'temp/'
    ];

    for (const folder of folders) {
      const params = {
        Bucket: bucketName,
        Key: folder,
        Body: '',
        ContentType: 'application/x-directory'
      };

      await s3.upload(params).promise();
      console.log(`✅ Created folder: ${folder}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to create folders: ${error.message}`);
    return false;
  }
}

/**
 * Display bucket information
 */
async function displayInfo() {
  try {
    console.log(`\n📊 Bucket Information:`);
    console.log(`   Name: ${bucketName}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    
    // Get bucket location
    const location = await s3.getBucketLocation({ Bucket: bucketName }).promise();
    console.log(`   Location: ${location.LocationConstraint || 'us-east-1'}`);
    
    // List objects to get count and size
    const objects = await s3.listObjectsV2({ Bucket: bucketName }).promise();
    const totalSize = objects.Contents.reduce((sum, obj) => sum + obj.Size, 0);
    
    console.log(`   Objects: ${objects.KeyCount}`);
    console.log(`   Total Size: ${formatBytes(totalSize)}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to get bucket info: ${error.message}`);
    return false;
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  console.log(`🔍 Checking environment configuration...`);
  
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY'
  ];
  
  const optional = [
    'AWS_REGION',
    'S3_BUCKET_NAME'
  ];
  
  let hasErrors = false;
  
  for (const env of required) {
    if (!process.env[env]) {
      console.error(`❌ Missing required environment variable: ${env}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${env}: ${env.includes('SECRET') ? '***' : process.env[env]}`);
    }
  }
  
  for (const env of optional) {
    if (process.env[env]) {
      console.log(`✅ ${env}: ${process.env[env]}`);
    } else {
      console.log(`⚠️  ${env}: Using default value`);
    }
  }
  
  return !hasErrors;
}

/**
 * Main setup function
 */
async function main() {
  console.log(`\n🚀 S3 Setup Utility for Healthcare App\n`);
  
  // Check environment
  if (!checkEnvironment()) {
    console.error(`\n❌ Environment check failed. Please set required environment variables.`);
    process.exit(1);
  }
  
  console.log(`\n📋 Setup Steps:\n`);
  
  try {
    // Create bucket
    const bucketCreated = await createBucket();
    if (!bucketCreated) {
      throw new Error('Failed to create or access bucket');
    }
    
    // Configure CORS
    await configureCORS();
    
    // Configure lifecycle
    await configureLifecycle();
    
    // Create folder structure
    await createFolders();
    
    // Test upload
    const testPassed = await testUpload();
    if (!testPassed) {
      throw new Error('Upload test failed');
    }
    
    // Display info
    await displayInfo();
    
    console.log(`\n🎉 S3 setup completed successfully!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Install npm dependencies: npm install aws-sdk multer-s3`);
    console.log(`   2. Start the application: npm run dev`);
    console.log(`   3. Test file upload endpoints using the API documentation`);
    console.log(`   4. Monitor usage in AWS S3 console\n`);
    
  } catch (error) {
    console.error(`\n❌ Setup failed: ${error.message}`);
    console.log(`\n🔧 Troubleshooting:`);
    console.log(`   1. Verify AWS credentials are correct`);
    console.log(`   2. Check AWS region is valid`);
    console.log(`   3. Ensure IAM user has S3 permissions`);
    console.log(`   4. Check network connectivity to AWS`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node setup-s3.js [options]

Options:
  --help, -h     Show this help message
  --info, -i     Show bucket information only
  --test, -t     Run upload test only

Environment Variables:
  AWS_ACCESS_KEY_ID       Your AWS access key ID (required)
  AWS_SECRET_ACCESS_KEY   Your AWS secret access key (required)
  AWS_REGION             AWS region (default: us-east-1)
  S3_BUCKET_NAME         S3 bucket name (default: healthcare-app-uploads)

Examples:
  node setup-s3.js           # Full setup
  node setup-s3.js --info    # Show bucket info
  node setup-s3.js --test    # Test upload only
  `);
  process.exit(0);
}

if (args.includes('--info') || args.includes('-i')) {
  displayInfo().then(() => process.exit(0));
} else if (args.includes('--test') || args.includes('-t')) {
  testUpload().then((success) => process.exit(success ? 0 : 1));
} else {
  main();
}