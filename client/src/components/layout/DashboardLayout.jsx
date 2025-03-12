// client/src/components/layout/DashboardLayout.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaEnvelope, 
  FaUsers, 
  FaRobot, 
  FaCog, 
  FaChartBar,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaBell
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items
  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <FaHome size={20} /> },
    { path: '/campaigns', name: 'Campaigns', icon: <FaEnvelope size={20} /> },
    { path: '/contacts', name: 'Contacts', icon: <FaUsers size={20} /> },
    { path: '/analytics', name: 'Analytics', icon: <FaChartBar size={20} /> },
    { 
      path: '/automation', 
      name: 'AI Automation', 
      icon: <FaRobot size={20} />,
      requiresFeature: 'aiEmailAutomation'
    },
    { path: '/settings', name: 'Settings', icon: <FaCog size={20} /> },
  ];

  // Helper to check if nav item is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Check if a user has access to a feature
  const hasFeatureAccess = (feature) => {
    if (!feature) return true;
    if (feature === 'aiEmailAutomation') {
      return user?.subscription?.aiEmailAutomation;
    }
    return user?.subscription?.features?.some(f => f.name === feature && f.active);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 flex flex-col z-50 lg:z-auto lg:relative lg:flex 
          ${sidebarOpen ? 'left-0' : '-left-64 lg:left-0'} 
          transition-all duration-300 ease-in-out
          w-64 bg-indigo-800 text-white shadow-lg`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <img src="/logo.svg" alt="Logo" className="h-8 w-8 mr-2" />
            <span className="text-xl font-semibold">Email AI</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-300 hover:text-white"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Sidebar navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              hasFeatureAccess(item.requiresFeature) && (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors
                      ${isActive(item.path) 
                        ? 'bg-indigo-900 text-white font-medium' 
                        : 'text-indigo-100 hover:bg-indigo-700'}`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              )
            ))}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-indigo-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-indigo-300 truncate">
                {user?.subscription?.plan || 'No Plan'} Plan
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-indigo-300 hover:text-white"
              title="Logout"
            >
              <FaSignOutAlt size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 focus:outline-none"
            >
              <FaBars size={24} />
            </button>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="text-gray-500 hover:text-gray-700 relative">
                <FaBell size={20} />
                {/* Notification badge */}
                <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                  3
                </span>
              </button>

              {/* User Dropdown - simplified, would typically have a dropdown menu */}
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2 hidden md:block">
                  {user?.email}
                </span>
                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;