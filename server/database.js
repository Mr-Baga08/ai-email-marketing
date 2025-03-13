// const mongoose = require('mongoose');
// const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// // GCP Secret Manager setup
// const secretClient = new SecretManagerServiceClient();

// // Get MongoDB URI from Secret Manager
// async function getMongoURI() {
//   try {
//     // Try to get from Secret Manager first
//     try {
//       const [version] = await secretClient.accessSecretVersion({
//         name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/mongodb-uri/versions/latest`,
//       });
      
//       return version.payload.data.toString();
//     } catch (secretError) {
//       console.warn('Could not get MongoDB URI from Secret Manager:', secretError.message);
//       console.warn('Falling back to environment variable');
      
//       // Fallback to environment variable
//       if (process.env.MONGODB_URI) {
//         return process.env.MONGODB_URI;
//       }
      
//       throw new Error('MongoDB URI not available in Secret Manager or environment variables');
//     }
//   } catch (error) {
//     console.error('Failed to get MongoDB URI:', error);
//     throw error;
//   }
// }

// // Connect to MongoDB with VPC peering support
// async function connectToDatabase() {
//   try {
//     const mongoURI = await getMongoURI();
//     console.log("Attempting to connect to MongoDB Atlas through VPC peering...");
    
//     // MongoDB connection options with Stable API configuration
//     const clientOptions = { 
//       serverApi: { 
//         version: '1', 
//         strict: true, 
//         deprecationErrors: true 
//       },
//       // Options for private VPC connectivity
//       directConnection: false,
//       serverSelectionTimeoutMS: 30000,
//       heartbeatFrequencyMS: 30000,
//       maxPoolSize: 10
//     };
    
//     // Connect with mongoose
//     await mongoose.connect(mongoURI, clientOptions);
    
//     // Verify connection with ping
//     await mongoose.connection.db.admin().command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB via private VPC connection!");
    
//     // Set up connection error handlers
//     mongoose.connection.on('error', (err) => {
//       console.error('MongoDB connection error:', err);
//     });
    
//     mongoose.connection.on('disconnected', () => {
//       console.warn('MongoDB disconnected. Attempting to reconnect...');
//     });
    
//     return mongoose.connection;
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     // Log more details about the error
//     if (error.name === 'MongooseServerSelectionError') {
//       console.error('Server selection error details:');
//       console.error(JSON.stringify(error.reason, null, 2));
//     }
    
//     // If we're in production, we might want to exit
//     if (process.env.NODE_ENV === 'production') {
//       console.error('Exiting due to MongoDB connection failure');
//       throw error; // Let the calling function decide whether to exit
//     }
    
//     throw error;
//   }
// }

// module.exports = { 
//   connectToDatabase,
//   getMongoURI
// };

// server/database.js
const mongoose = require('mongoose');

/**
 * Get MongoDB URI from environment variable with fallback
 * @returns {Promise<string>} MongoDB connection URI
 */
async function getMongoURI() {
  // Return the environment variable if set
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  
  // Fallback to a default development URI if not set
  console.warn('MONGODB_URI environment variable not set. Using default development URI.');
  return 'mongodb://localhost:27017/email-marketing-ai';
}

/**
 * Connect to MongoDB database
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function connectToDatabase() {
  try {
    const mongoURI = await getMongoURI();
    console.log("Attempting to connect to MongoDB...");
    
    if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MongoDB URI format. URI must start with mongodb:// or mongodb+srv://');
    }
    
    const clientOptions = { 
      serverApi: { 
        version: '1', 
        strict: true, 
        deprecationErrors: true 
      },
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10
    };
    
    await mongoose.connect(mongoURI, clientOptions);
    console.log("Successfully connected to MongoDB");
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // For production environments, it might be better to exit
    if (process.env.NODE_ENV === 'production') {
      console.error('Fatal: Unable to connect to MongoDB in production environment');
      throw error;
    }
    
    // For development, we might want to continue with a warning
    console.warn('WARNING: Server will start without database connection');
    return null;
  }
}

module.exports = { 
  connectToDatabase,
  getMongoURI
};