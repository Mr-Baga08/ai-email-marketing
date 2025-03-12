// server/utils/logger.js

const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors } = format;

// Define log directory and file paths
const LOG_DIR = process.env.LOG_DIR || 'logs';
const ERROR_LOG_FILE = `${LOG_DIR}/error.log`;
const COMBINED_LOG_FILE = `${LOG_DIR}/combined.log`;

// Create custom format for console and file outputs
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...metadata }) => {
    let log = `[${timestamp}] ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(metadata).length > 0) {
      log += ` | ${JSON.stringify(metadata)}`;
    }
    return log;
  })
);

// Create the logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'email-marketing-ai' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new transports.File({ 
      filename: ERROR_LOG_FILE, 
      level: 'error',
      handleExceptions: true 
    }),
    // Write all logs to combined.log
    new transports.File({ 
      filename: COMBINED_LOG_FILE,
      handleExceptions: true 
    })
  ],
  exitOnError: false
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: consoleFormat,
    handleExceptions: true
  }));
}

// Create a stream object for Morgan HTTP request logging
logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  }
};

// Helper function to log API requests
logger.logApiRequest = (req, extraInfo = {}) => {
  const { method, originalUrl, ip, user } = req;
  logger.info(`API Request: ${method} ${originalUrl}`, {
    ip,
    userId: user?.id || 'unauthenticated',
    ...extraInfo
  });
};

// Helper function to log errors with request context
logger.logApiError = (err, req, extraInfo = {}) => {
  const { method, originalUrl, ip, user } = req;
  logger.error(`API Error: ${method} ${originalUrl} - ${err.message}`, {
    ip,
    userId: user?.id || 'unauthenticated',
    stack: err.stack,
    ...extraInfo
  });
};

// Helper function to log application-level errors
logger.logAppError = (err, context = {}) => {
  logger.error(`Application Error: ${err.message}`, {
    stack: err.stack,
    ...context
  });
};

module.exports = logger;