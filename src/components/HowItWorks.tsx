import React from 'react';
import { Shield, Zap, Eye, CheckCircle, AlertTriangle, Database, Film, Volume2 } from 'lucide-react';
import { Typography, Heading } from './Typography';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Film className="h-8 w-8" />,
      title: "Upload Your Video",
      description: "Simply drag and drop your video file or browse to select from your device. We support all major video formats including MP4, MOV, AVI, WebM, MKV, and many more for comprehensive compatibility.",
      color: "text-blue-400"
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "AI Analysis Engine",
      description: "Our advanced neural networks analyze facial movements, temporal consistency, lighting patterns, and compression artifacts in real-time using sophisticated machine learning algorithms for accurate detection.",
      color: "text-cyan-400"
    },
    {
      icon: <Volume2 className="h-8 w-8" />,
      title: "Multi-Layer Detection",
      description: "We use multiple AI models including deepfake detection, face swap identification, audio-visual synchronization, and temporal analysis to provide comprehensive verification coverage.",
      color: "text-purple-400"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Verification Report",
      description: "Get a detailed confidence score, highlighted suspicious regions, and a comprehensive authenticity certificate within seconds for complete verification documentation.",
      color: "text-green-400"
    }
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Heading level={2} className="mb-6">
            How Fictus AI Works
          </Heading>
          <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto">
            Our cutting-edge AI technology combines multiple detection algorithms to provide 
            the most accurate video verification available today.
          </Typography>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-600 to-transparent z-0" />
              )}
              
              {/* Step Card */}
              <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 group-hover:transform group-hover:scale-105 h-64 flex flex-col">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className={`${step.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>
                
                {/* Content */}
                <Typography variant="cardTitle" className="mb-4">
                  {step.title}
                </Typography>
                <Typography variant="cardCaption" color="secondary" className="leading-relaxed flex-1 flex items-center">
                  {step.description}
                </Typography>
              </div>
            </div>
          ))}
        </div>

        {/* Technology Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
          <div className="text-center">
            <Typography variant="h2" color="accent" className="mb-2">99.7%</Typography>
            <Typography variant="cardCaption" color="secondary">Accuracy Rate</Typography>
          </div>
          <div className="text-center">
            <Typography variant="h2" color="accent" className="mb-2">&lt;30s</Typography>
            <Typography variant="cardCaption" color="secondary">Analysis Time</Typography>
          </div>
          <div className="text-center">
            <Typography variant="h2" color="accent" className="mb-2">7</Typography>
            <Typography variant="cardCaption" color="secondary">AI Models</Typography>
          </div>
          <div className="text-center">
            <Typography variant="h2" color="accent" className="mb-2">2M+</Typography>
            <Typography variant="cardCaption" color="secondary">Videos Verified</Typography>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;