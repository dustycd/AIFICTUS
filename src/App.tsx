import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import VideoGrid from './components/VideoGrid';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import TrustIndicators from './components/TrustIndicators';
import Footer from './components/Footer';
import About from './components/About';
import Library from './components/Library';
import UnifiedVerify from './components/UnifiedVerify';
import AuthPage from './components/AuthPage';
import MyVerifications from './components/MyVerifications';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import CookiesPolicy from './components/CookiesPolicy';
import { useAuth } from './hooks/useAuth';
import { initializeStorage } from './lib/storage';

function App() {
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const location = useLocation();

  // Initialize storage on app startup
  useEffect(() => {
    const setupStorage = async () => {
      try {
        console.log('🚀 Initializing application storage...');
        setStorageError(null);
        
        const isReady = await initializeStorage();
        setStorageReady(isReady);
        
        if (isReady) {
          console.log('✅ Storage system ready');
        } else {
          console.warn('⚠️ Storage system not fully ready - some features may be limited');
          setStorageError('Storage buckets are not properly configured. Please check the setup instructions.');
        }
      } catch (error: any) {
        console.error('❌ Storage initialization failed:', error);
        setStorageReady(false);
        setStorageError(error.message || 'Failed to initialize storage system');
      }
    };

    setupStorage();
  }, []);

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/fictus.png" 
            alt="Fictus AI" 
            className="h-16 w-auto mx-auto mb-6 object-contain filter drop-shadow-lg animate-pulse"
            style={{ imageRendering: 'crisp-edges' }}
          />
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Initializing...</p>
          
          {/* Storage status indicator */}
          <div className="mt-4 text-xs text-gray-500">
            {storageReady ? '✅ Storage Ready' : '⏳ Setting up storage...'}
          </div>
          
          {/* Show storage error if any */}
          {storageError && (
            <div className="mt-2 text-xs text-red-400 max-w-md mx-auto">
              ⚠️ {storageError}
            </div>
          )}
          
          {/* Fallback button in case loading gets stuck */}
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Home page component
  const HomePage = () => (
    <>
      {/* Animated Background Video Grid */}
      <VideoGrid />
      
      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <Hero />
        
        {/* How It Works Section */}
        <HowItWorks />
        
        {/* Trust Indicators */}
        <TrustIndicators />
      </main>
    </>
  );

  // Protected route wrapper for verify page
  const ProtectedVerify = () => {
    if (!user) {
      return <AuthPage />;
    }
    return <UnifiedVerify />;
  };

  // Determine if header should be shown
  const shouldShowHeader = !['/auth', '/privacy-policy', '/terms-of-service', '/cookies-policy'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Fixed Header - hide on auth and legal pages */}
      {shouldShowHeader && <Header />}
      
      {/* Storage status warning for verify page */}
      {!storageReady && location.pathname === '/verify' && user && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
          <p className="text-yellow-400 text-sm">
            ⚠️ Storage system not fully ready. File uploads may be limited.
          </p>
          {storageError && (
            <p className="text-yellow-300 text-xs mt-1">
              {storageError}
            </p>
          )}
          <p className="text-yellow-300 text-xs mt-1">
            Check the console for setup instructions or see STORAGE_SETUP_INSTRUCTIONS.md
          </p>
        </div>
      )}
      
      {/* Global storage error notification */}
      {storageError && location.pathname !== '/verify' && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-500/10 border border-red-500/30 rounded-lg p-3 max-w-sm">
          <p className="text-red-400 text-sm font-medium">Storage Configuration Issue</p>
          <p className="text-red-300 text-xs mt-1">
            Some features may not work properly. Check setup instructions.
          </p>
        </div>
      )}
      
      {/* Main Content Area */}
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/verify" element={<ProtectedVerify />} />
          <Route path="/about" element={<About />} />
          <Route path="/library" element={<Library />} />
          <Route path="/my-verifications" element={<MyVerifications />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookies-policy" element={<CookiesPolicy />} />
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      {/* Constant Footer - appears on all pages */}
      <Footer />
    </div>
  );
}

export default App;