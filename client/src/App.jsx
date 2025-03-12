// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Remove BrowserRouter import
import PrivateRoute from './components/auth/PrivateRoute';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import SelectPlanPage from './pages/SelectPlanPage';
import SetupEmailPage from './pages/SetupEmailPage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import NewCampaignPage from './pages/NewCampaignPage';
import ContactsPage from './pages/ContactsPage';
import AutomationPage from './pages/AutomationPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import BillingPage from './pages/BillingPage';
import InvoicesPage from './pages/InvoicesPage';

function App() {
  return (
    // Remove AuthProvider and ThemeProvider from here
    // Remove Router from here
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/billing" element={
        <PrivateRoute>
          <BillingPage />
        </PrivateRoute>
      } />
      <Route path="/invoices" element={
        <PrivateRoute>
          <InvoicesPage />
        </PrivateRoute>
      } />
      
      {/* Authenticated routes */}
      <Route path="/select-plan" element={
        <PrivateRoute>
          <SelectPlanPage />
        </PrivateRoute>
      } />
      <Route path="/setup-email" element={
        <PrivateRoute>
          <SetupEmailPage />
        </PrivateRoute>
      } />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <DashboardPage />
        </PrivateRoute>
      } />
      <Route path="/campaigns" element={
        <PrivateRoute>
          <CampaignsPage />
        </PrivateRoute>
      } />
      <Route path="/campaigns/new" element={
        <PrivateRoute>
          <NewCampaignPage />
        </PrivateRoute>
      } />
      <Route path="/contacts" element={
        <PrivateRoute>
          <ContactsPage />
        </PrivateRoute>
      } />
      <Route path="/automation" element={
        <PrivateRoute>
          <AutomationPage />
        </PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute>
          <SettingsPage />
        </PrivateRoute>
      } />
      
      {/* Error handling */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;