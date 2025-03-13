// client/src/services/apiSetup.js
import realApi from './api';
import mockApi from './mockApi';

// Determine which API to use based on environment
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true';

// In production builds, always use the real API
const isProduction = process.env.NODE_ENV === 'production';

// Export the appropriate API
const api = (isProduction || !USE_MOCK_API) ? realApi : mockApi;

export default api;