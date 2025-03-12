// client/src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Nav links
  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Demo', path: '/demo' },
    { name: 'Blog', path: '/blog' }
  ];

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when changing location
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Don't show header on certain pages
  const hideOnPaths = ['/dashboard', '/campaigns', '/contacts', '/automation', '/analytics', '/settings'];
  const shouldHideHeader = hideOnPaths.some(path => location.pathname.startsWith(path));

  if (shouldHideHeader) {
    return null;
  }

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-200 ${
        isScrolled 
          ? 'bg-white shadow-md py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/home/mrunal/Documents/AutoEmail/email-marketing-ai/client/public/favicon.ico" alt="Email AI" className="h-8 w-8 mr-2" />
            <span className={`text-xl font-bold ${isScrolled ? 'text-indigo-600' : 'text-white'}`}>
              Email AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={`text-sm font-medium hover:text-indigo-500 ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {isAuthenticated ? (
              // User is logged in
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              // User is not logged in
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className={`text-sm font-medium hover:text-indigo-500 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-500 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <FaTimes size={24} className={isScrolled ? 'text-gray-700' : 'text-white'} />
            ) : (
              <FaBars size={24} className={isScrolled ? 'text-gray-700' : 'text-white'} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-2 bg-white rounded-lg shadow-lg p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  {link.name}
                </Link>
              ))}

              <div className="border-t border-gray-200 my-2 pt-2">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 w-full text-center text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="mt-2 px-4 py-2 w-full text-center text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;