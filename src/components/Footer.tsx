import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';
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
            <Typography variant="cardCaption" color="secondary" className="leading-relaxed mb-6">
              Advanced AI video verification technology for the modern digital era.
            </Typography>
            
            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <Typography variant="cardCaption" color="secondary" className="mr-2">
                Follow us:
              </Typography>
              <a
                href="https://www.facebook.com/fictusai"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 bg-gray-800/50 hover:bg-blue-600 rounded-lg transition-all duration-300 transform hover:scale-110"
                aria-label="Follow Fictus AI on Facebook"
              >
                <Facebook className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://www.instagram.com/fictusai"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 bg-gray-800/50 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 rounded-lg transition-all duration-300 transform hover:scale-110"
                aria-label="Follow Fictus AI on Instagram"
              >
                <Instagram className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://twitter.com/fictusai"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 bg-gray-800/50 hover:bg-black rounded-lg transition-all duration-300 transform hover:scale-110"
                aria-label="Follow Fictus AI on X (Twitter)"
              >
                <Twitter className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>
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
              <a 
                href="mailto:Team@fictus.io"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                <Typography variant="cardCaption">Contact Us</Typography>
              </a>
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