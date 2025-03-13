// server/config/storage.js
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

// Check if we're running in GCP environment
const isGcp = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;

// Local storage path
const localUploadsDir = path.join(__dirname, '../../uploads');

// Create local uploads directory if it doesn't exist
if (!isGcp && !fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// Initialize storage based on environment
let storage;
let contactsBucket;

if (isGcp) {
  // Google Cloud Storage setup
  storage = new Storage();
  contactsBucket = storage.bucket(process.env.CONTACT_UPLOADS_BUCKET || 'default-bucket-name');
} else {
  // Local storage adapter with compatible API
  storage = {
    bucket: (name) => {
      return {
        name,
        file: (filename) => {
          const filePath = path.join(localUploadsDir, filename);
          return {
            createWriteStream: () => {
              const stream = fs.createWriteStream(filePath);
              stream.on('finish', () => {
                console.log(`File written to ${filePath}`);
              });
              return stream;
            },
            makePublic: async () => {
              console.log(`[Local Storage] Made file public (simulated): ${filename}`);
              return [{}];
            },
            delete: async () => {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
              }
              return [{}];
            },
            exists: async () => {
              return [fs.existsSync(filePath)];
            },
            download: async () => {
              return [fs.readFileSync(filePath)];
            }
          };
        },
        upload: async (localPath, options) => {
          const filename = options?.destination || path.basename(localPath);
          const targetPath = path.join(localUploadsDir, filename);
          fs.copyFileSync(localPath, targetPath);
          return [{ name: filename }];
        }
      };
    }
  };
  
  contactsBucket = storage.bucket('local-contacts-bucket');
}

module.exports = {
  storage,
  contactsBucket,
  // Helper function to get public URL for files
  getPublicUrl: (filename) => {
    if (isGcp) {
      return `https://storage.googleapis.com/${contactsBucket.name}/${filename}`;
    } else {
      // For local development, use a relative URL
      return `/uploads/${filename}`;
    }
  },
  isGcp
};