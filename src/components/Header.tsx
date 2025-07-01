import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, History } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Typography } from './Typography';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Use Supabase auth
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide navbar when scrolling down (after scrolling past 100px)
      else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsVisible(false);
        setIsMenuOpen(false); // Close mobile menu when hiding
        setShowUserMenu(false); // Close user menu when hiding
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
    setShowUserMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    
    // Try to get name from user metadata
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else {
      // Fallback to email
      return user.email?.split('@')[0] || 'User';
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else {
      return user.email?.[0]?.toUpperCase() || 'U';
    }
  };

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header 
      className={`fixed left-0 right-0 z-50 bg-black/60 backdrop-blur-md transition-all duration-300 ${
        isVisible ? 'top-8 translate-y-0' : 'top-8 -translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer" onClick={handleNavClick}>
            <img 
              src="/fictus.png" 
              alt="Fictus AI" 
              className="h-10 w-auto object-contain filter drop-shadow-sm"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Navigation Links */}
            <nav className="flex items-center space-x-8">
              <Link 
                to="/verify"
                className={`transition-colors ${
                  isActivePage('/verify') ? 'text-blue-400' : 'text-white hover:text-blue-400'
                }`}
                onClick={handleNavClick}
              >
                <Typography variant="navLink" className="text-sm">Verify Video</Typography>
              </Link>
              <Link 
                to="/library"
                className={`transition-colors ${
                  isActivePage('/library') ? 'text-blue-400' : 'text-white hover:text-blue-400'
                }`}
                onClick={handleNavClick}
              >
                <Typography variant="navLink" className="text-sm">Library</Typography>
              </Link>
              <Link 
                to="/about"
                className={`transition-colors ${
                  isActivePage('/about') ? 'text-blue-400' : 'text-white hover:text-blue-400'
                }`}
                onClick={handleNavClick}
              >
                <Typography variant="navLink" className="text-sm">About</Typography>
              </Link>
            </nav>

            {/* Auth Section */}
            {loading ? (
              <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl backdrop-blur-sm hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getUserInitials()}
                  </div>
                  <Typography variant="navLink" className="text-sm text-blue-400 font-semibold">
                    {getUserDisplayName()}
                  </Typography>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <Typography variant="cardTitle" className="mb-1">
                        {getUserDisplayName()}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {user.email}
                      </Typography>
                    </div>
                    
                    <Link
                      to="/my-verifications"
                      onClick={() => {
                        handleNavClick();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center gap-3"
                    >
                      <History className="h-4 w-4 text-gray-400" />
                      <Typography variant="cardCaption">My Verifications</Typography>
                    </Link>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="h-4 w-4 text-gray-400" />
                      <Typography variant="cardCaption">Sign Out</Typography>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/auth"
                onClick={handleNavClick}
                className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl backdrop-blur-sm hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  <Typography variant="navLink" className="text-sm text-blue-400 group-hover:text-blue-300 transition-colors font-semibold">
                    Login
                  </Typography>
                </div>
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-blue-400 transition-colors p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-sm rounded-b-2xl border-t border-gray-700/50">
            <nav className="px-6 py-6 space-y-6">
              <Link 
                to="/verify"
                onClick={handleNavClick}
                className={`block transition-colors ${
                  isActivePage('/verify') ? 'text-blue-400' : 'text-white hover:text-blue-400'
                }`}
              >
                <Typography variant="navLinkMobile" className="text-base">Verify Video</Typography>
              </Link>
              <Link 
                to="/library"
                onClick={handleNavClick}
                className={`block transition-colors ${
                  isActivePage('/library') ? 'text-blue-400' : 'text-white hover:text-blue-400'
                }`}
              >
                <Typography variant="navLinkMobile" className="text-base">Library</Typography>
              </Link>
              <Link 
                to="/about"
                onClick={handleNavClick}
                className={`block transition-colors ${
                  isActivePage('/about') ? 'text-blue-400' : 'text-white hover:text-blue-400'
                }`}
              >
                <Typography variant="navLinkMobile" className="text-base">About</Typography>
              </Link>
              
              {/* Mobile Auth Section */}
              {user ? (
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                      {getUserInitials()}
                    </div>
                    <div>
                      <Typography variant="cardTitle" className="mb-1">
                        {getUserDisplayName()}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {user.email}
                      </Typography>
                    </div>
                  </div>
                  
                  <Link
                    to="/my-verifications"
                    onClick={handleNavClick}
                    className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-colors flex items-center gap-3 mb-3"
                  >
                    <History className="h-5 w-5 text-gray-400" />
                    <Typography variant="navLinkMobile" className="text-base">
                      My Verifications
                    </Typography>
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-colors flex items-center gap-3"
                  >
                    <LogOut className="h-5 w-5 text-gray-400" />
                    <Typography variant="navLinkMobile" className="text-base">
                      Sign Out
                    </Typography>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/auth"
                  onClick={handleNavClick}
                  className="w-full group relative px-4 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl backdrop-blur-sm hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 transition-all duration-300 mt-4 block"
                >
                  <div className="flex items-center justify-center gap-2">
                    <User className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <Typography variant="navLinkMobile" className="text-base text-blue-400 group-hover:text-blue-300 transition-colors font-semibold">
                      Login / Sign Up
                    </Typography>
                  </div>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;