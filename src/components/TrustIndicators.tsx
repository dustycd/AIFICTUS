import React from 'react';
import { Shield, Users, Award, Globe, CheckCircle, Brain, Zap, Eye, Target, Cpu, Database, Network, AlertTriangle, Lock, Search, Play, Image as ImageIcon, Video, Sparkles, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { Typography, Heading } from './Typography';

const TrustIndicators = () => {
  const projectInsights = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Detection Technology",
      description: "Advanced neural networks analyze facial movements, temporal consistency, and compression artifacts to detect deepfakes and AI-generated content with industry-leading accuracy.",
      color: "from-blue-500 to-cyan-500",
      stats: "7 AI Models"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Combat Misinformation",
      description: "Our mission is to preserve digital truth in an era where AI-generated content can be indistinguishable from reality, protecting individuals and organizations from deception.",
      color: "from-purple-500 to-pink-500",
      stats: "99.7% Accuracy"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Impact",
      description: "Empowering content creators, journalists, and organizations worldwide with tools to verify authenticity and maintain trust in digital media.",
      color: "from-green-500 to-emerald-500",
      stats: "150+ Countries"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Real-time Analysis",
      description: "Lightning-fast processing delivers verification results in seconds, not minutes, enabling immediate decision-making for time-sensitive content.",
      color: "from-yellow-500 to-orange-500",
      stats: "<30s Analysis"
    }
  ];

  const technologyFeatures = [
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Facial Analysis",
      description: "Detects unnatural facial movements and inconsistencies",
      progress: 95
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: "Temporal Consistency",
      description: "Analyzes frame-to-frame coherence in video sequences",
      progress: 92
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Metadata Verification",
      description: "Examines file properties and creation timestamps",
      progress: 88
    },
    {
      icon: <Network className="h-6 w-6" />,
      title: "Compression Analysis",
      description: "Identifies artifacts from AI generation processes",
      progress: 90
    }
  ];

  const useCases = [
    {
      icon: <Video className="h-8 w-8" />,
      title: "Content Creators",
      description: "Verify authenticity of viral videos before sharing",
      color: "text-blue-400"
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: "Journalists",
      description: "Fact-check user-generated content and sources",
      color: "text-green-400"
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Organizations",
      description: "Protect against deepfake attacks and fraud",
      color: "text-purple-400"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Researchers",
      description: "Study AI-generated content patterns and trends",
      color: "text-cyan-400"
    }
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <Heading level={2} className="mb-8">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              What is Fictus AI?
            </span>
          </Heading>
          
          <Typography variant="heroCaption" color="secondary" className="max-w-4xl mx-auto text-lg leading-relaxed mb-12">
            Fictus AI is a cutting-edge platform that uses advanced artificial intelligence to detect deepfakes and 
            AI-generated content in videos and images. We're building the future of digital media verification.
          </Typography>

          {/* Key Mission Statement */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-3xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Target className="h-8 w-8 text-blue-400" />
              <Typography variant="h3" className="text-blue-400">
                Our Mission
              </Typography>
            </div>
            <Typography variant="body" color="secondary" className="text-lg leading-relaxed">
              To preserve digital truth and combat misinformation by making AI detection technology accessible to everyone. 
              In an age where seeing is no longer believing, we provide the tools to verify what's real.
            </Typography>
          </div>
        </div>

        {/* Core Technology Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {projectInsights.map((insight, index) => (
            <div key={index} className="group">
              <div className={`relative overflow-hidden rounded-2xl p-8 border border-gray-700 hover:border-gray-500 transition-all duration-500 group-hover:transform group-hover:scale-105 h-full bg-gradient-to-br ${insight.color} bg-opacity-5`}>
                
                {/* Animated Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${insight.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Icon */}
                <div className={`text-transparent bg-gradient-to-r ${insight.color} bg-clip-text mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {insight.icon}
                </div>
                
                {/* Content */}
                <Typography variant="cardTitle" className="mb-4 group-hover:text-white transition-colors">
                  {insight.title}
                </Typography>
                
                <Typography variant="cardCaption" color="secondary" className="leading-relaxed mb-6">
                  {insight.description}
                </Typography>

                {/* Stats Badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${insight.color} text-white`}>
                    {insight.stats}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Technology Deep Dive */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <Heading level={3} className="mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                How Our Technology Works
              </span>
            </Heading>
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto">
              Our AI detection system combines multiple advanced techniques to analyze digital media
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {technologyFeatures.map((feature, index) => (
              <div key={index} className="bg-gray-800/30 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <Typography variant="cardTitle" className="mb-1">{feature.title}</Typography>
                    <Typography variant="cardCaption" color="secondary" className="text-sm">
                      {feature.description}
                    </Typography>
                  </div>
                  <span className="text-blue-400 font-bold numeric-text">{feature.progress}%</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${feature.progress}%`,
                      animationDelay: `${index * 0.2}s`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <Heading level={3} className="mb-6">
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Who Uses Fictus AI?
              </span>
            </Heading>
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto">
              From content creators to enterprise security teams, our technology serves diverse needs
            </Typography>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 group-hover:transform group-hover:scale-105 h-full">
                  
                  <div className={`${useCase.color} mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300`}>
                    {useCase.icon}
                  </div>
                  
                  <Typography variant="cardTitle" className="mb-4">
                    {useCase.title}
                  </Typography>
                  
                  <Typography variant="cardCaption" color="secondary" className="leading-relaxed">
                    {useCase.description}
                  </Typography>
                  
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Statistics */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-3xl p-12 border border-gray-700">
          <div className="text-center mb-12">
            <Heading level={3} className="mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Making a Real Impact
              </span>
            </Heading>
            <Typography variant="heroCaption" color="secondary">
              The numbers behind our mission to protect digital truth
            </Typography>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-blue-400 mr-2" />
                <Typography variant="h2" color="accent" className="numeric-text">2M+</Typography>
              </div>
              <Typography variant="cardCaption" color="secondary">Videos Verified</Typography>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <AlertTriangle className="h-6 w-6 text-red-400 mr-2" />
                <Typography variant="h2" color="accent" className="numeric-text">50K+</Typography>
              </div>
              <Typography variant="cardCaption" color="secondary">Deepfakes Detected</Typography>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-green-400 mr-2" />
                <Typography variant="h2" color="accent" className="numeric-text">100K+</Typography>
              </div>
              <Typography variant="cardCaption" color="secondary">Active Users</Typography>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Globe className="h-6 w-6 text-purple-400 mr-2" />
                <Typography variant="h2" color="accent" className="numeric-text">150+</Typography>
              </div>
              <Typography variant="cardCaption" color="secondary">Countries Served</Typography>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default TrustIndicators;