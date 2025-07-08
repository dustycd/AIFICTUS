import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, ButtonText } from './Typography';
import { Sparkles, Play } from 'lucide-react';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  const handleVerifyClick = () => {
    navigate('/verify');
  };

  const handleBrowseClick = () => {
    navigate('/library');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
      <div className="text-center max-w-4xl mx-auto">
        {/* Main Header - PNG Logo */}
        <div className="mb-8">
          <img 
            src="/fictus.png" 
            alt="Fictus AI" 
            className="mx-auto h-24 sm:h-32 lg:h-40 w-auto object-contain filter drop-shadow-lg hover:scale-105 transition-transform duration-500"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
        
        {/* Subtitle */}
        <Typography variant="heroSubtitle" className="mb-6">
          VERIFY ANY VIDEO OR IMAGE. INSTANTLY.
        </Typography>
        
        {/* Subtext */}
        <Typography variant="heroCaption" color="secondary" className="mb-12 max-w-xl mx-auto">
          Trusted by creators. Built for the AI era.
        </Typography>
        
        {/* Enhanced CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
          {/* Primary Button - Verify Video */}
          <button 
            onClick={handleVerifyClick}
            className="group relative w-full sm:w-auto min-w-[200px] px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 overflow-hidden"
          >
            {/* Animated Background Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            
            {/* Button Content */}
            <div className="relative flex items-center justify-center gap-3">
              <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <ButtonText>Verify a Video</ButtonText>
            </div>
            
            {/* Subtle Glow Effect */}
            <div className="absolute inset-0 rounded-xl bg-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          </button>
          
          {/* Secondary Button - Browse Videos */}
          <button 
            onClick={handleBrowseClick}
            className="group relative w-full sm:w-auto min-w-[200px] px-8 py-4 bg-transparent border-2 border-gray-300 hover:border-white text-gray-300 hover:text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-white/10 overflow-hidden"
          >
            {/* Animated Background Fill */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            
            {/* Button Content */}
            <div className="relative flex items-center justify-center gap-3">
              <Play className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              <ButtonText>Browse Verified Videos</ButtonText>
            </div>
            
            {/* Border Glow Effect */}
            <div className="absolute inset-0 rounded-xl border-2 border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>

        {/* Additional Info Badge */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-full text-sm text-gray-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>99.7% Accuracy Rate</span>
            <span className="text-gray-500">•</span>
            <span>2M+ Videos Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;