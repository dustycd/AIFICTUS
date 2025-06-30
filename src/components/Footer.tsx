import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from './Typography';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-black border-t border-gray-800/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <img 
                src="/fictus.png" 
                alt="Fictus AI" 
                className="h-6 w-auto object-contain filter drop-shadow-sm"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <Typography variant="cardCaption" color="secondary" className="leading-relaxed">
              Advanced AI video verification technology for the modern digital era.
            </Typography>
          </div>

          {/* Company Links */}
          <div>
            <Typography variant="cardTitle" className="mb-4">
              Company
            </Typography>
            <nav className="space-y-3">
              <Link 
                to="/about"
                onClick={handleLinkClick}
                className="block text-gray-400 hover:text-white transition-colors"
              >
                <Typography variant="cardCaption">About</Typography>
              </Link>
              <Link 
                to="/privacy-policy"
                onClick={handleLinkClick}
                className="block text-gray-400 hover:text-white transition-colors"
              >
                <Typography variant="cardCaption">Privacy</Typography>
              </Link>
              <Link 
                to="/terms-of-service"
                onClick={handleLinkClick}
                className="block text-gray-400 hover:text-white transition-colors"
              >
                <Typography variant="cardCaption">Terms</Typography>
              </Link>
              <Link 
                to="/cookies-policy"
                onClick={handleLinkClick}
                className="block text-gray-400 hover:text-white transition-colors"
              >
                <Typography variant="cardCaption">Cookies</Typography>
              </Link>
            </nav>
          </div>

          {/* Support Links */}
          <div>
            <Typography variant="cardTitle" className="mb-4">
              Support
            </Typography>
            <nav className="space-y-3">
              <Link 
                to="/contact"
                onClick={handleLinkClick}
                className="block text-gray-400 hover:text-white transition-colors"
              >
                <Typography variant="cardCaption">Contact</Typography>
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Typography variant="cardCaption" color="secondary">
              © {currentYear} Fictus AI. All rights reserved.
            </Typography>
            
            <div className="flex items-center gap-6">
              <Link 
                to="/privacy-policy"
                onClick={handleLinkClick}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Typography variant="cardCaption">Privacy Policy</Typography>
              </Link>
              <Link 
                to="/terms-of-service"
                onClick={handleLinkClick}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Typography variant="cardCaption">Terms of Service</Typography>
              </Link>
              <Link 
                to="/cookies-policy"
                onClick={handleLinkClick}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Typography variant="cardCaption">Cookies Policy</Typography>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;