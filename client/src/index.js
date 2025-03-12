import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import App from './App';
import './styles/index.css';

// Configure React Query for API data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create root element for React 18
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render application with providers
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider> 
    </QueryClientProvider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can enable
// service worker registration by uncommenting the code below.

// Register service worker for PWA support
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/service-worker.js').then(registration => {
//       console.log('Service Worker registered: ', registration);
//     }).catch(error => {
//       console.log('Service Worker registration failed: ', error);
//     });
//   });
// }

// Enable usage tracking in production 
if (process.env.NODE_ENV === 'production') {
  // Initialize analytics
  import('./utils/analytics-utils').then(({ initializeAnalytics }) => {
    initializeAnalytics();
  });
}

// Log application version
console.log(
  `%cEmail Marketing AI v${process.env.REACT_APP_VERSION || '1.0.0'}`,
  'background: #0d6efd; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
); 