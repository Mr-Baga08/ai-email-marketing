// client/src/components/layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaFacebook, FaLinkedin, FaGithub } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Footer links
  const productLinks = [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/demo', label: 'Request a Demo' },
    { href: '/roadmap', label: 'Roadmap' }
  ];

  const resourceLinks = [
    { href: '/blog', label: 'Blog' },
    { href: '/guides', label: 'Guides' },
    { href: '/documentation', label: 'Documentation' },
    { href: '/help', label: 'Help Center' }
  ];

  const companyLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/careers', label: 'Careers' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/partners', label: 'Partners' }
  ];

  const legalLinks = [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cookies', label: 'Cookie Policy' },
    { href: '/security', label: 'Security' }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 pt-10 pb-6">
        {/* Main footer content */}
        <div className="flex flex-wrap">
          {/* Logo and company description */}
          <div className="w-full md:w-1/4 mb-10 md:mb-0">
            <div className="flex items-center mb-4">
              <img src="/logo.svg" alt="Email AI" className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold">Email AI</span>
            </div>
            <p className="text-gray-400 mb-4">
              Advanced email marketing and AI automation tools to help your business connect with customers more effectively.
            </p>
            
            {/* Social media links */}
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaLinkedin size={20} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaGithub size={20} />
              </a>
            </div>
          </div>
          
          {/* Footer links sections */}
          <div className="w-full md:w-3/4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Product links */}
              <div>
                <h5 className="text-lg font-semibold mb-4">Product</h5>
                <ul className="space-y-2">
                  {productLinks.map((link, index) => (
                    <li key={index}>
                      <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Resources links */}
              <div>
                <h5 className="text-lg font-semibold mb-4">Resources</h5>
                <ul className="space-y-2">
                  {resourceLinks.map((link, index) => (
                    <li key={index}>
                      <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Company links */}
              <div>
                <h5 className="text-lg font-semibold mb-4">Company</h5>
                <ul className="space-y-2">
                  {companyLinks.map((link, index) => (
                    <li key={index}>
                      <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Legal links */}
              <div>
                <h5 className="text-lg font-semibold mb-4">Legal</h5>
                <ul className="space-y-2">
                  {legalLinks.map((link, index) => (
                    <li key={index}>
                      <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom bar with copyright */}
        <div className="border-t border-gray-800 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} Email AI. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 mt-2 md:mt-0">
              Made with ❤️ for better email marketing
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;