import React, { useState, useEffect } from 'react';
import { Shield, Brain, Users, Target, Zap, Globe, Heart, Github, Linkedin, Twitter, Sparkles, Cpu, Database, Network, ArrowRight, Star, Rocket, Code, Award, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { Typography, Heading } from './Typography';

const About = () => {
  const [activeValue, setActiveValue] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle mouse movement for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Trigger visibility animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const missionPoints = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Protect Digital Truth",
      description: "Combat misinformation and deepfakes with cutting-edge AI detection technology",
      color: "from-blue-500 to-cyan-500",
      delay: "0s"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Advance AI Ethics",
      description: "Lead the development of responsible AI tools that serve humanity's best interests",
      color: "from-purple-500 to-pink-500",
      delay: "0.2s"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Accessibility",
      description: "Make video verification technology accessible to everyone, everywhere",
      color: "from-green-500 to-emerald-500",
      delay: "0.4s"
    }
  ];


  const techStack = [
    { icon: <Cpu className="h-8 w-8" />, name: "Neural Networks", progress: 95 },
    { icon: <Database className="h-8 w-8" />, name: "Big Data", progress: 88 },
    { icon: <Network className="h-8 w-8" />, name: "Cloud Computing", progress: 92 },
    { icon: <Code className="h-8 w-8" />, name: "Machine Learning", progress: 97 }
  ];

  const achievements = [
    { icon: <Award className="h-6 w-6" />, title: "AI Innovation Award 2024", org: "Tech Excellence Foundation" },
    { icon: <Star className="h-6 w-6" />, title: "Best Security Solution", org: "CyberSec Awards" },
    { icon: <TrendingUp className="h-6 w-6" />, title: "Fastest Growing AI Startup", org: "Industry Weekly" },
    { icon: <Rocket className="h-6 w-6" />, title: "Top 10 AI Companies to Watch", org: "Future Tech Magazine" }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Dynamic Gradient Orbs */}
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
            left: '10%',
            top: '20%'
          }}
        />
        <div 
          className="absolute w-80 h-80 bg-gradient-to-r from-cyan-500/10 to-green-500/10 rounded-full blur-3xl"
          style={{
            transform: `translate(${-mousePosition.x * 0.05}px, ${-mousePosition.y * 0.05}px)`,
            right: '10%',
            bottom: '20%'
          }}
        />
      </div>

      {/* Hero Section with Enhanced Animations */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Heading level={1} className="mb-8 max-w-4xl mx-auto">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Building Trust in the Age of AI
              </span>
            </Heading>
          </div>
          
          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Typography variant="heroCaption" color="secondary" className="mb-12 max-w-3xl mx-auto text-lg leading-relaxed">
              We're on a mission to preserve digital truth and combat misinformation through 
              cutting-edge artificial intelligence and machine learning technologies.
            </Typography>
          </div>

          {/* Animated Mission Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {missionPoints.map((point, index) => (
              <div 
                key={index} 
                className={`group relative overflow-hidden rounded-2xl border border-gray-700 hover:border-gray-500 transition-all duration-500 hover:transform hover:scale-105 hover:rotate-1`}
                style={{ animationDelay: point.delay }}
              >
                {/* Animated Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${point.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Content */}
                <div className="relative bg-gray-800/30 backdrop-blur-sm p-6 h-full">
                  <div className={`text-transparent bg-gradient-to-r ${point.color} bg-clip-text mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {point.icon}
                  </div>
                  <Typography variant="cardTitle" className="mb-3 group-hover:text-white transition-colors">
                    {point.title}
                  </Typography>
                  <Typography variant="cardCaption" color="secondary" className="leading-relaxed">
                    {point.description}
                  </Typography>
                  
                  {/* Hover Effect Arrow */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Story Section with Parallax */}
      <section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900 relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Heading level={2} className="mb-8">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Our Story
              </span>
            </Heading>
            
            <div className="space-y-8">
              {[
                "Fictus AI started with a simple but urgent insight: as AI becomes more powerful, so does the risk of it being misused. Our founders saw firsthand how deepfakes and other AI-generated content could threaten public trust, journalism, and personal privacy.",
                "What began as a research project has now grown into a full platform designed to help creators, journalists, and organizations verify the authenticity of video content. We're building the tools needed to protect trust in our digital world.",
                "Our team brings together decades of experience in AI, machine learning, and cybersecurity. We're not just focused on detecting AI-generated content—we're also helping people understand how digital media is changing.",
                "Although we're still in the early stages, we're already working with beta users to improve and grow. Every day, we're getting closer to our mission: making video verification easy to use, widely available, and essential for digital literacy."
              ].map((text, index) => (
                <div 
                  key={index}
                  className="opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.3}s`, animationFillMode: 'forwards' }}
                >
                  <Typography variant="body" color="secondary" className="text-lg leading-relaxed">
                    {text}
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack with Progress Bars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Heading level={2} className="mb-6">
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Technology Stack
              </span>
            </Heading>
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-lg">
              Cutting-edge technologies powering our AI detection platform
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {techStack.map((tech, index) => (
              <div key={index} className="group">
                <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 group-hover:transform group-hover:scale-105">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      {tech.icon}
                    </div>
                    <Typography variant="cardTitle">{tech.name}</Typography>
                    <span className="ml-auto text-blue-400 font-bold">{tech.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${tech.progress}%`,
                        animationDelay: `${index * 0.2}s`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Enhanced CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-cyan-500/10 rounded-full animate-bounce" />
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-purple-500/10 rounded-full animate-ping" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <Heading level={2} className="mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Join Us in Protecting Digital Truth
            </span>
          </Heading>
          
          <Typography variant="heroCaption" color="secondary" className="mb-12 text-lg leading-relaxed">
            Whether you're a journalist, content creator, or organization, we're here to help you 
            navigate the complex world of AI-generated content with confidence.
          </Typography>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 relative overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <Typography variant="button">Start Verifying Videos</Typography>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <button className="group px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                <Activity className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                <Typography variant="button">Contact Our Team</Typography>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default About;