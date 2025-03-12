// client/src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaEnvelope, 
  FaUsers, 
  FaRobot, 
  FaCog, 
  FaChartBar, 
  FaSignOutAlt,
  FaQuestionCircle,
  FaBookOpen
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items configuration
  const navItems = [
    { 
      path: '/dashboard', 
      name: 'Dashboard', 
      icon: <FaHome className="w-5 h-5" /> 
    },
    { 
      path: '/campaigns', 
      name: 'Campaigns', 
      icon: <FaEnvelope className="w-5 h-5" /> 
    },
    { 
      path: '/contacts', 
      name: 'Contacts', 
      icon: <FaUsers className="w-5 h-5" /> 
    },
    { 
      path: '/analytics', 
      name: 'Analytics', 
      icon: <FaChartBar className="w-5 h-5" /> 
    },
    { 
      path: '/automation', 
      name: 'AI Automation', 
      icon: <FaRobot className="w-5 h-5" />,
      requiresFeature: 'aiEmailAutomation'
    },
    { 
      path: '/knowledge-base', 
      name: 'Knowledge Base', 
      icon: <FaBookOpen className="w-5 h-5" />,
      requiresFeature: 'aiEmailAutomation'
    },
    { 
      path: '/settings', 
      name: 'Settings', 
      icon: <FaCog className="w-5 h-5" /> 
    },
    { 
      path: '/help', 
      name: 'Help & Support', 
      icon: <FaQuestionCircle className="w-5 h-5" /> 
    },
  ];

  // Check if user has access to a feature
  const hasFeatureAccess = (feature) => {
    if (!feature) return true;
    if (feature === 'aiEmailAutomation') {
      return user?.subscription?.aiEmailAutomation;
    }
    return user?.subscription?.features?.some(f => f.name === feature && f.active);
  };

  // Calculate subscription badge color based on plan
  const getSubscriptionBadgeColor = () => {
    switch (user?.subscription?.plan) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition-all duration-300 transform bg-indigo-900 lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'
        }`}
      >
        {/* Sidebar header with logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-800">
          <div className="flex items-center">
            <img src="/logo.svg" alt="Email AI" className="w-8 h-8 mr-2" />
            <span className="text-xl font-bold text-white">Email AI</span>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-indigo-800">
          <div className="flex items-center">
            <div className="w-10 h-10 mr-3 bg-indigo-700 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{user?.name || 'User'}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionBadgeColor()}`}>
                {user?.subscription?.plan || 'Free'} Plan
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              hasFeatureAccess(item.requiresFeature) && (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => closeSidebar()}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                      ${isActive
                        ? 'bg-indigo-800 text-white'
                        : 'text-indigo-100 hover:bg-indigo-700'
                      }
                    `}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </NavLink>
                </li>
              )
            ))}
          </ul>
        </nav>

        {/* Sidebar footer with logout button */}
        <div className="px-6 py-4 mt-auto border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-indigo-100 rounded-md hover:bg-indigo-700 transition-colors"
          >
            <FaSignOutAlt className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;