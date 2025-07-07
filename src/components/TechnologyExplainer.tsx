import React, { useState } from 'react';
import { Brain, Shield, Cpu, Database, ChevronRight, Play, Pause, Film } from 'lucide-react';
import { Typography, Heading } from './Typography';

const TechnologyExplainer = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const technologies = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Neural Network Analysis",
      description: "Deep learning models trained on millions of authentic and synthetic videos",
      details: [
        "Facial landmark detection and tracking",
        "Micro-expression analysis for unnatural movements",
        "Temporal consistency checking across frames",
        "Biometric authentication patterns"
      ]
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Deepfake Detection",
      description: "Specialized algorithms to identify AI-generated faces and voice synthesis",
      details: [
        "GAN artifact detection in generated content",
        "Face swap boundary analysis",
        "Voice cloning pattern recognition",
        "Compression artifact inconsistencies"
      ]
    },
    {
      icon: <Cpu className="h-6 w-6" />,
      title: "Real-time Processing",
      description: "Optimized inference pipeline for instant verification results",
      details: [
        "GPU-accelerated processing clusters",
        "Parallel analysis across multiple models",
        "Edge computing for reduced latency",
        "Scalable cloud infrastructure"
      ]
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Secure Storage",
      description: "Encrypted storage and verification certificates for audit trails",
      details: [
        "End-to-end encryption",
        "Immutable verification records",
        "Secure cloud storage",
        "Privacy-first architecture"
      ]
    }
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Technology Tabs */}
          <div className="space-y-4">
            {technologies.map((tech, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 ${
                  activeTab === index
                    ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setActiveTab(index)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    activeTab === index ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {tech.icon}
                  </div>
                  <div className="flex-1">
                    <Typography variant="cardTitle" className="mb-2">
                      {tech.title}
                    </Typography>
                    <Typography variant="cardCaption" color="secondary">
                      {tech.description}
                    </Typography>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                    activeTab === index ? 'rotate-90 text-blue-400' : ''
                  }`} />
                </div>

                {/* Expanded Details */}
                {activeTab === index && (
                  <div className="mt-6 pl-14 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    {tech.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <Typography variant="cardCaption" color="secondary">
                          {detail}
                        </Typography>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Visual Demo */}
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <div className="mb-6">
              <Typography variant="cardTitle" className="mb-2">
                Live Analysis Demo
              </Typography>
              <Typography variant="cardCaption" color="secondary">
                Watch how our AI processes video frames in real-time
              </Typography>
            </div>

            {/* Mock Analysis Interface */}
            <div className="bg-black rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <Typography variant="caption" color="accent">
                  Analysis Progress
                </Typography>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500 rounded text-white text-sm hover:bg-blue-600 transition-colors"
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {isPlaying ? 'Pause' : 'Start'}
                </button>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Facial Analysis</span>
                    <span>94%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full w-[94%] transition-all duration-1000" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Temporal Consistency</span>
                    <span>87%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full w-[87%] transition-all duration-1000" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Audio Synthesis</span>
                    <span>99%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full w-[99%] transition-all duration-1000" />
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-green-400" />
                <Typography variant="cardTitle" color="success">
                  Verification Complete
                </Typography>
              </div>
              <Typography variant="cardCaption" color="secondary">
                Confidence Score: 96.8% Authentic
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologyExplainer;