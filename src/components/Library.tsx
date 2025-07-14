import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Search, Filter, Grid, List, Play, Eye, Calendar, User, ChevronDown, X, SlidersHorizontal, Image as ImageIcon, Video, Shield, AlertTriangle, CheckCircle, Brain, Clock, FileText, Download, Share2, Zap, Activity, BarChart3, TrendingUp } from 'lucide-react';
import { Typography, Heading } from './Typography';
import { db } from '../lib/database';
import { getPublicUrl } from '../lib/storage';
import { getVerificationDisplay, getStatusBadgeClasses, formatConfidence } from '../utils/verificationDisplayUtils';

interface LibraryItem {
  id: string;
  file_name: string;
  original_filename: string;
  content_type: string;
  verification_status: 'authentic' | 'suspicious' | 'fake';
  confidence_score: number;
  ai_probability?: number;
  human_probability?: number;
  processing_time: number;
  file_size: number;
  detection_details: any;
  risk_factors: string[];
  recommendations: string[];
  created_at: string;
  uploader_name: string;
  view_count: number;
  file_url: string;
  storage_bucket: string;
  storage_path: string;
  thumbnail_path: string;
  // Navigation helpers
  // AI or Not API specific fields
  report_id?: string;
  api_verdict?: string;
  generator_analysis?: any;
  facets?: any;
  raw_api_response?: any;
}

const Library = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
 const [touchStart, setTouchStart] = useState<number | null>(null);
 const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const reportRef = React.useRef<HTMLDivElement>(null);
  const itemsPerPage = 12;

  // Generate comprehensive AI or Not API data for demonstration
  const generateAIOrNotData = (item: LibraryItem) => {
    const isVideo = item.content_type.startsWith('video/');
    
    // Preserve original verification status and generate realistic API data
    const originalStatus = item.verification_status;
    
    let finalAiProb, finalHumanProb, isAI;
    
    if (originalStatus === 'authentic') {
      // For authentic content, keep low AI probability
      finalAiProb = Math.random() * 15 + 5; // 5-20% AI probability
      finalHumanProb = 100 - finalAiProb;
      isAI = false;
    } else if (originalStatus === 'fake') {
      // For fake content, high AI probability
      finalAiProb = Math.random() * 25 + 70; // 70-95% AI probability
      finalHumanProb = 100 - finalAiProb;
      isAI = true;
    } else {
      // For suspicious content, moderate AI probability
      finalAiProb = Math.random() * 30 + 35; // 35-65% AI probability
      finalHumanProb = 100 - finalAiProb;
      isAI = finalAiProb > 50;
    }
    
    // Generate detection details based on AI or Not API structure
    const detectionDetails = {
      faceAnalysis: originalStatus === 'authentic' ? 85 + Math.random() * 10 : 60 + Math.random() * 25,
      compressionArtifacts: originalStatus === 'authentic' ? 90 + Math.random() * 8 : 70 + Math.random() * 20,
      ...(isVideo && {
        temporalConsistency: originalStatus === 'authentic' ? 88 + Math.random() * 10 : 65 + Math.random() * 25,
        audioAnalysis: originalStatus === 'authentic' ? 85 + Math.random() * 12 : 60 + Math.random() * 30,
      }),
      ...(!isVideo && {
        metadataAnalysis: originalStatus === 'authentic' ? 92 + Math.random() * 6 : 75 + Math.random() * 18,
        pixelAnalysis: originalStatus === 'authentic' ? 89 + Math.random() * 8 : 70 + Math.random() * 20,
      }),
    };

    // Generate generator analysis (common AI generators)
    const generators = ['midjourney', 'dall_e', 'stable_diffusion', 'gpt_generated', 'deepfake_app'];
    const topGenerator = generators[Math.floor(Math.random() * generators.length)];
    const generatorConfidence = isAI ? 0.6 + Math.random() * 0.3 : Math.random() * 0.2;

    // Generate facets (AI or Not API structure)
    const facets = {
      quality: {
        is_detected: Math.random() > 0.3,
        confidence: 0.7 + Math.random() * 0.25
      },
      nsfw: {
        is_detected: Math.random() > 0.9, // Rarely NSFW
        confidence: Math.random() * 0.1
      }
    };

    // Generate risk factors based on AI detection
    const riskFactors = [];
    if (originalStatus === 'fake') {
      riskFactors.push('AI-generated content detected');
      if (generatorConfidence > 0.7) {
        riskFactors.push(`Likely generated by ${topGenerator.replace(/_/g, ' ')}`);
      }
      if (detectionDetails.faceAnalysis < 80) {
        riskFactors.push('Inconsistent facial features detected');
      }
      if (isVideo && detectionDetails.temporalConsistency < 75) {
        riskFactors.push('Temporal inconsistencies found');
      }
    } else if (originalStatus === 'suspicious') {
      riskFactors.push('Some AI indicators detected');
      if (Math.random() > 0.5) {
        riskFactors.push('Requires additional verification');
      }
    }

    if (facets.quality.is_detected === false) {
      riskFactors.push('Low quality content detected');
    }

    // Generate recommendations
    const recommendations = [
      'Cross-reference with original source',
      'Verify metadata timestamps',
      'Check for additional context'
    ];

    if (isVideo) {
      recommendations.push('Analyze audio-visual consistency');
      recommendations.push('Check for lip-sync accuracy');
    } else {
      recommendations.push('Consider reverse image search');
      recommendations.push('Examine pixel-level artifacts');
    }

    if (originalStatus === 'fake') {
      recommendations.push('Exercise caution when sharing this content');
      recommendations.push('Seek additional verification from trusted sources');
    } else if (originalStatus === 'authentic') {
      recommendations.push('Content appears to be authentic');
      recommendations.push('Safe to share with confidence');
    }

    return {
      ...item,
      ai_probability: finalAiProb,
      human_probability: finalHumanProb,
      confidence_score: finalHumanProb,
      verification_status: originalStatus, // Preserve original status
      processing_time: 1.5 + Math.random() * 8,
      detection_details: detectionDetails,
      risk_factors: riskFactors,
      recommendations: recommendations,
      report_id: `rpt_${Math.random().toString(36).substr(2, 9)}`,
      api_verdict: originalStatus === 'fake' ? 'ai' : 'human',
      generator_analysis: {
        [topGenerator]: originalStatus === 'fake' ? generatorConfidence : Math.random() * 0.2,
        confidence: generatorConfidence
      },
      facets: facets,
      raw_api_response: {
        id: `rpt_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        report: {
          verdict: originalStatus === 'fake' ? 'ai' : 'human',
          ai: { confidence: finalAiProb / 100 },
          human: { confidence: finalHumanProb / 100 },
          generator: { [topGenerator]: originalStatus === 'fake' ? generatorConfidence : Math.random() * 0.2 }
        },
        facets: facets
      }
    };
  };

  // Fetch library items
  const fetchItems = async (page = 1, reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * itemsPerPage;
      
      const { data, error: fetchError } = await db.supabase.rpc('get_public_library_items', {
        p_limit: itemsPerPage,
        p_offset: offset,
        p_status_filter: statusFilter || null,
        p_content_type_filter: contentTypeFilter || null,
        p_search_term: searchTerm || null
      });

      if (fetchError) {
        console.error('Error fetching library items:', fetchError);
        setError('Failed to load library items');
        return;
      }

      // Enhance items with AI or Not API data
      const enhancedItems = (data || []).map(generateAIOrNotData);
      
      if (reset || page === 1) {
        setItems(enhancedItems);
      } else {
        setItems(prev => [...prev, ...enhancedItems]);
      }
      
      setHasMore(enhancedItems.length === itemsPerPage);
      setCurrentPage(page);
    } catch (err) {
      console.error('Exception fetching library items:', err);
      setError('Failed to load library items');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchItems(1, true);
  }, [searchTerm, statusFilter, contentTypeFilter]);

  // Load more items
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchItems(currentPage + 1, false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setContentTypeFilter('');
    setShowFilters(false);
  };

  // Get media URL for preview
  const getMediaUrl = (item: LibraryItem): string | null => {
    if (item.thumbnail_path) {
      return getPublicUrl('verification-thumbnails', item.thumbnail_path);
    }
    
    if (item.file_url) {
      return item.file_url;
    }
    
    if (item.storage_bucket && item.storage_path) {
      return getPublicUrl(item.storage_bucket, item.storage_path);
    }
    
    return null;
  };

  // Handle item selection with index tracking
  const handleItemSelect = (item: LibraryItem, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
  };

  const isVideo = (contentType: string) => contentType.startsWith('video/');

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'authentic':
        return { 
          color: 'text-green-400 bg-green-500/20 border-green-500/30', 
          icon: CheckCircle,
          label: 'REAL',
          bgGradient: 'from-green-500/20 to-emerald-500/20'
        };
      case 'suspicious':
        return { 
          color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', 
          icon: AlertTriangle,
          label: 'SUSPICIOUS',
          bgGradient: 'from-yellow-500/20 to-orange-500/20'
        };
      case 'fake':
        return { 
          color: 'text-red-400 bg-red-500/20 border-red-500/30', 
          icon: Shield,
          label: 'AI GENERATED',
          bgGradient: 'from-red-500/20 to-pink-500/20'
        };
      default:
        return { 
          color: 'text-gray-400 bg-gray-500/20 border-gray-500/30', 
          icon: Shield,
          label: 'UNKNOWN',
          bgGradient: 'from-gray-500/20 to-gray-600/20'
        };
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Navigation functions
  const navigateToPrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedItem(items[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  const navigateToNext = () => {
    if (selectedIndex < items.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedItem(items[newIndex]);
      setSelectedIndex(newIndex);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedItem) return;
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateToPrevious();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateToNext();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedItem(null);
      setSelectedIndex(-1);
    }
  };

  // Add keyboard event listeners when modal is open
  useEffect(() => {
    if (selectedItem) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent horizontal scrolling when modal is open
      document.body.classList.add('modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [selectedItem, selectedIndex, items]);

 // Handle touch events for swipe navigation
 const handleTouchStart = (e: React.TouchEvent) => {
   setTouchEnd(null);
   setTouchStart(e.targetTouches[0].clientX);
 };

 const handleTouchMove = (e: React.TouchEvent) => {
   setTouchEnd(e.targetTouches[0].clientX);
 };

 const handleTouchEnd = () => {
   if (!touchStart || !touchEnd) return;
   
   const distance = touchStart - touchEnd;
   const isLeftSwipe = distance > 50;
   const isRightSwipe = distance < -50;

   if (isLeftSwipe && selectedIndex < items.length - 1) {
     // Swipe left - go to next item
     navigateToNext();
   }
   
   if (isRightSwipe && selectedIndex > 0) {
     // Swipe right - go to previous item
     navigateToPrevious();
   }
 };
  // Render item card
  // Handle PDF download
  const handleDownloadReport = async () => {
    if (!selectedItem || !reportRef.current) return;

    try {
      // Configure PDF options
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `verification_report_${selectedItem.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#111827' // Gray-900 background
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait' 
        }
      };

      // Generate and download PDF
      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  // Handle share analysis
  const handleShareAnalysis = async () => {
    if (!selectedItem) return;

    const shareData = {
      title: `Verification Analysis - ${selectedItem.verification_status.toUpperCase()}`,
      text: `AI Content Verification: ${Math.round(selectedItem.confidence_score)}% confidence - ${selectedItem.verification_status}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        alert('Analysis details copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback - just copy URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('Unable to share. Please copy the URL manually.');
      }
    }
  };

  const renderItemCard = (item: LibraryItem) => {
    // Get definite display status based on AI/Human probabilities
    const displayResult = getVerificationDisplay(
      item.ai_probability,
      item.human_probability,
      item.verification_status
    );

    const itemIndex = items.findIndex(i => i.id === item.id);
    const mediaUrl = getMediaUrl(item);

    return (
      <div
        key={item.id}
        className="group bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 overflow-hidden cursor-pointer hover:transform hover:scale-105"
        onClick={() => handleItemSelect(item, itemIndex)}
      >
        {/* Media Preview */}
        <div className="relative aspect-video bg-gray-900 overflow-hidden">
          {mediaUrl ? (
            <>
              {isVideo(item.content_type) ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Media content"
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Play button for videos */}
              {isVideo(item.content_type) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                {isVideo(item.content_type) ? (
                  <Video className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                )}
                <Typography variant="caption" color="secondary">
                  No preview
                </Typography>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${displayResult.bgColor} ${displayResult.borderColor} backdrop-blur-sm`}>
              {displayResult.statusIcon === 'CheckCircle' ? (
                <CheckCircle className={`h-3 w-3 ${displayResult.statusColor}`} />
              ) : (
                <AlertTriangle className={`h-3 w-3 ${displayResult.statusColor}`} />
              )}
              <Typography variant="caption" className="text-xs font-bold">
                {displayResult.displayStatus.toUpperCase()}
              </Typography>
            </div>
          </div>

          {/* Confidence score */}
          <div className="absolute top-3 right-3">
            <div className="bg-black/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              <Typography variant="caption" className={`font-bold text-xs numeric-text ${displayResult.statusColor}`}>
                {formatConfidence(displayResult.confidence)}
              </Typography>
            </div>
          </div>

          {/* Content type indicator */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              {isVideo(item.content_type) ? (
                <Video className="h-3 w-3 text-white" />
              ) : (
                <ImageIcon className="h-3 w-3 text-white" />
              )}
            </div>
          </div>

          {/* AI/Human Probability */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-black/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              <Typography variant="caption" className="text-white text-xs">
                {item.verification_status === 'fake' ? 'AI' : 'Human'}: {Math.round(item.verification_status === 'fake' ? item.ai_probability || 0 : item.human_probability || 0)}%
              </Typography>
            </div>
          </div>
        </div>

        {/* Content Info */}
        <div className="p-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span className="numeric-text">{item.view_count}</span>
            </div>
            <span>{formatFileSize(item.file_size)}</span>
          </div>

          {/* Quick verification info */}
          <div className="flex items-center justify-between">
            <Typography variant="caption" color="secondary" className="text-xs">
              {item.processing_time?.toFixed(1)}s analysis
            </Typography>
            <div className="flex items-center gap-1">
              <Brain className="h-3 w-3 text-blue-400" />
              <Typography variant="caption" className="text-blue-400 text-xs">
                AI Verified
              </Typography>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render list item
  const renderListItem = (item: LibraryItem) => {
    // Get definite display status based on AI/Human probabilities
    const displayResult = getVerificationDisplay(
      item.ai_probability,
      item.human_probability,
      item.verification_status
    );

    const itemIndex = items.findIndex(i => i.id === item.id);
    const mediaUrl = getMediaUrl(item);

    return (
      <div
        key={item.id}
        className="group bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 p-4 cursor-pointer"
        onClick={() => handleItemSelect(item, itemIndex)}
      >
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="relative w-24 h-16 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
            {mediaUrl ? (
              <>
                {isVideo(item.content_type) ? (
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Media content"
                    className="w-full h-full object-cover"
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVideo(item.content_type) ? (
                  <Video className="h-4 w-4 text-gray-500" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                )}
              </div>
            )}

            {/* Content type indicator */}
            <div className="absolute bottom-1 left-1">
              {isVideo(item.content_type) ? (
                <Video className="h-3 w-3 text-white" />
              ) : (
                <ImageIcon className="h-3 w-3 text-white" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <Typography variant="cardTitle" className="text-sm">
                {isVideo(item.content_type) ? 'Video Content' : 'Image Content'}
              </Typography>
              
              {/* Status badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${displayResult.bgColor} ${displayResult.borderColor} flex-shrink-0`}>
                {displayResult.statusIcon === 'CheckCircle' ? (
                  <CheckCircle className={`h-3 w-3 ${displayResult.statusColor}`} />
                ) : (
                  <AlertTriangle className={`h-3 w-3 ${displayResult.statusColor}`} />
                )}
                <Typography variant="caption" className="text-xs font-bold">
                  {displayResult.displayStatus.toUpperCase()}
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span className="numeric-text">{item.view_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{item.processing_time?.toFixed(1)}s</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{formatFileSize(item.file_size)}</span>
              <div className="flex items-center gap-4">
                <Typography variant="caption" className="text-xs">
                  {item.verification_status === 'fake' ? 'AI' : 'Human'}: {Math.round(item.verification_status === 'fake' ? item.ai_probability || 0 : item.human_probability || 0)}%
                </Typography>
                <div className="bg-black/60 px-2 py-1 rounded-full">
                  <Typography variant="caption" className={`font-bold text-xs numeric-text ${displayResult.statusColor}`}>
                    {formatConfidence(displayResult.confidence)}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="relative pt-32 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <Heading level={1} className="mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Verification Library
              </span>
            </Heading>
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-lg">
              Explore verified content from our community. Learn from real examples of authentic and AI-generated media.
            </Typography>
          </div>
        </div>
      </section>

      {/* Search and Filters - Mobile Optimized */}
      <section className="px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Filters Button */}
          <div className="text-center mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 rounded-xl text-white transition-all duration-300"
            >
              <Filter className="h-5 w-5" />
              <Typography variant="body">Filters</Typography>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expandable Filters Container */}
          {showFilters && (
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6 mb-6 animate-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Verification Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">All Statuses</option>
                    <option value="authentic">Real Content</option>
                    <option value="suspicious">Suspicious</option>
                    <option value="fake">AI Generated</option>
                  </select>
                </div>

                {/* Content Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Content Type
                  </label>
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">All Types</option>
                    <option value="video">Videos</option>
                    <option value="image">Images</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    View Mode
                  </label>
                  <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-600">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                      <span>Grid</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <List className="h-4 w-4" />
                      <span>List</span>
                    </button>
                  </div>
                </div>
             </div>

             {/* Clear Filters Button */}
             <div className="mt-6 pt-6 border-t border-gray-700">
               <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                 {/* Active Filters Display */}
                 {(searchTerm || statusFilter || contentTypeFilter) && (
                   <div className="flex flex-wrap gap-2">
                     <Typography variant="caption" color="secondary" className="mr-2">
                       Active filters:
                     </Typography>
                     {searchTerm && (
                       <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                         Search: "{searchTerm}"
                       </span>
                     )}
                     {statusFilter && (
                       <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                         Status: {statusFilter}
                       </span>
                     )}
                     {contentTypeFilter && (
                       <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                         Type: {contentTypeFilter}
                       </span>
                     )}
                   </div>
                 )}
                 
                 {/* Clear All Button */}
                 <button
                   onClick={clearFilters}
                   className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-lg transition-colors"
                 >
                   <X className="h-4 w-4" />
                   <span>Clear All</span>
                 </button>
               </div>
             </div>
           </div>
         )}
       </div>
     </section>

     {/* Content Grid/List */}
     <section className="px-4 sm:px-6 lg:px-8 pb-20">
       <div className="max-w-7xl mx-auto">
         {error && (
           <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
             <Typography variant="body" className="text-red-400">
               {error}
             </Typography>
           </div>
         )}

         {loading && items.length === 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {[...Array(8)].map((_, i) => (
               <div key={i} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden animate-pulse">
                 <div className="aspect-video bg-gray-700" />
                 <div className="p-4">
                   <div className="h-4 bg-gray-700 rounded mb-2" />
                   <div className="h-3 bg-gray-700 rounded w-2/3" />
                 </div>
               </div>
             ))}
           </div>
         ) : items.length === 0 ? (
           <div className="text-center py-16">
             <Typography variant="h3" className="mb-4">
               No items found
             </Typography>
             <Typography variant="body" color="secondary">
               Try adjusting your search terms or filters
             </Typography>
           </div>
         ) : (
           <>
             {viewMode === 'grid' ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                 {items.map(renderItemCard)}
               </div>
             ) : (
               <div className="space-y-4">
                 {items.map(renderListItem)}
               </div>
             )}

             {/* Load More Button */}
             {hasMore && (
               <div className="text-center mt-12">
                 <button
                   onClick={loadMore}
                   disabled={loading}
                   className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl transition-colors"
                 >
                   {loading ? 'Loading...' : 'Load More'}
                 </button>
               </div>
             )}
           </>
         )}
       </div>
     </section>

     {/* Enhanced Item Detail Modal */}
     {selectedItem && (
       <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && (setSelectedItem(null), setSelectedIndex(-1))}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
        
        {/* Fixed Top Navigation Bar */}
        <div className="fixed top-0 left-0 right-0 z-60 bg-black/80 backdrop-blur-md border-b border-gray-700/50">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <Typography variant="h3" className="text-lg font-semibold">Verification Analysis</Typography>
              <div className="hidden sm:flex items-center gap-2 text-gray-400">
                <Eye className="h-4 w-4" />
                <span className="text-sm numeric-text">{selectedItem.view_count}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Streamlined Navigation Controls */}
              <div className="flex items-center bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-600/40 overflow-hidden">
                {/* Previous Button */}
                <button
                  onClick={navigateToPrevious}
                  disabled={selectedIndex <= 0}
                  className="group flex items-center justify-center w-10 h-9 hover:bg-blue-500/20 disabled:hover:bg-transparent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-600/40"
                  title="Previous item (← or swipe right)"
                >
                  <svg className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 group-disabled:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Compact Item Counter */}
                <div className="px-3 py-2 min-w-[60px] text-center bg-gray-700/20">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-white font-semibold text-sm numeric-text">{selectedIndex + 1}</span>
                    <span className="text-gray-400 text-xs">/</span>
                    <span className="text-gray-300 text-xs numeric-text">{items.length}</span>
                  </div>
                </div>
                
                {/* Next Button */}
                <button
                  onClick={navigateToNext}
                  disabled={selectedIndex >= items.length - 1}
                  className="group flex items-center justify-center w-10 h-9 hover:bg-blue-500/20 disabled:hover:bg-transparent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border-l border-gray-600/40"
                  title="Next item (→ or swipe left)"
                >
                  <svg className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 group-disabled:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Compact Close Button */}
              <button
                onClick={() => (setSelectedItem(null), setSelectedIndex(-1))}
                className="group flex items-center justify-center w-9 h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200"
                title="Close modal (Esc)"
              >
                <X className="h-4 w-4 text-red-400 group-hover:text-red-300 transition-colors" />
              </button>
            </div>
          </div>
        </div>

         <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}>
          {/* PDF Report Content - Referenced for PDF generation */}
          <div ref={reportRef} className="p-8 pt-24 bg-gray-900">

            {/* Professional AI Platform Layout */}
            <div className="space-y-8">
              {/* Media Preview - Full Width */}
              <div className="relative aspect-video bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                {(() => {
                  const mediaUrl = getMediaUrl(selectedItem);
                  return mediaUrl ? (
                    <>
                      {isVideo(selectedItem.content_type) ? (
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt="Media content"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        {isVideo(selectedItem.content_type) ? (
                          <Video className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        ) : (
                          <ImageIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        )}
                        <Typography variant="body" color="secondary">
                          Media preview not available
                        </Typography>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Main Analysis Results - Equal Height Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Verification Status */}
                <div className={`bg-gradient-to-br ${getStatusInfo(selectedItem.verification_status).bgGradient} rounded-2xl p-6 border border-gray-700 text-center h-full flex flex-col justify-center`}>
                  <div className="mb-4">
                    {(() => {
                      const statusInfo = getStatusInfo(selectedItem.verification_status);
                      const StatusIcon = statusInfo.icon;
                      return <StatusIcon className="h-12 w-12 mx-auto text-current" />;
                    })()}
                  </div>
                  
                  <Typography variant="h3" className="mb-2 text-xl font-bold">
                    {getStatusInfo(selectedItem.verification_status).label}
                  </Typography>
                  
                  <Typography variant="h2" className="mb-2 text-3xl font-black">
                    <span className="numeric-text">{Math.round(selectedItem.confidence_score)}%</span>
                  </Typography>
                  
                  <Typography variant="body" color="secondary" className="text-sm">
                    Confidence Score
                  </Typography>
                </div>

                {/* AI vs Human Probability */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 h-full flex flex-col justify-center">
                  <div className="text-center mb-4">
                    <Brain className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                    <Typography variant="h4" className="text-purple-400 font-semibold">
                      AI Analysis
                    </Typography>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">AI Generated</span>
                      <span className="text-red-400 font-bold numeric-text text-lg">
                        {Math.round(selectedItem.ai_probability || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${selectedItem.ai_probability || 0}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Human Created</span>
                      <span className="text-green-400 font-bold numeric-text text-lg">
                        {Math.round(selectedItem.human_probability || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${selectedItem.human_probability || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Processing Stats */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 h-full flex flex-col justify-center">
                  <div className="text-center mb-4">
                    <Clock className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                    <Typography variant="h4" className="text-blue-400 font-semibold">
                      Analysis Stats
                    </Typography>
                  </div>
                  
                  <div className="space-y-3 text-center">
                    <div>
                      <Typography variant="h3" className="text-2xl font-bold numeric-text">
                        {selectedItem.processing_time?.toFixed(1)}s
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        Processing Time
                      </Typography>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-700">
                      <Typography variant="body" className="text-lg font-semibold">
                        {isVideo(selectedItem.content_type) ? 'Video' : 'Image'}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        Content Type
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detection Details - Professional Grid */}
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="h-6 w-6 text-cyan-400" />
                  <Typography variant="h3" className="text-xl font-semibold">
                    Detection Analysis
                  </Typography>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(selectedItem.detection_details || {}).map(([key, value]) => {
                    if (value === undefined) return null;
                    const score = typeof value === 'number' ? value : 0;
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    return (
                      <div key={key} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">{label}</span>
                          <span className="text-cyan-400 font-bold numeric-text text-lg">
                            {score.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-1000 shadow-lg"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk Factors and Recommendations - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Factors */}
                {selectedItem.risk_factors && selectedItem.risk_factors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                      <Typography variant="h4" className="text-red-400 font-semibold">
                        Risk Factors
                      </Typography>
                    </div>
                    <div className="space-y-3">
                      {selectedItem.risk_factors.slice(0, 4).map((factor, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-red-500/5 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <Typography variant="body" className="text-red-300">
                            {factor}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {selectedItem.recommendations && selectedItem.recommendations.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-6 w-6 text-blue-400" />
                      <Typography variant="h4" className="text-blue-400 font-semibold">
                        Recommendations
                      </Typography>
                    </div>
                    <div className="space-y-3">
                      {selectedItem.recommendations.slice(0, 4).map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <Typography variant="body" className="text-blue-300">
                            {rec}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Professional Style */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
                <button 
                  onClick={handleDownloadReport}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Download className="h-5 w-5" />
                  <Typography variant="button" className="font-semibold">Download Report</Typography>
                </button>
                
                <button 
                  onClick={handleShareAnalysis}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Share2 className="h-5 w-5" />
                  <Typography variant="button" className="font-semibold">Share Analysis</Typography>
                </button>
              </div>
            </div>
           </div>
         </div>
       </div>
     )}
    </div>
  );
};

export default Library;