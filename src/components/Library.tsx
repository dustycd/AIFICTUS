import React, { useState, useEffect } from 'react';
import { Play, Eye, Calendar, User, Filter, Search, X, ChevronLeft, ChevronRight, Download, Share2, ExternalLink, AlertTriangle, CheckCircle, Shield, Clock, Zap } from 'lucide-react';
import { Typography, Heading } from './Typography';
import { db } from '../lib/database';
import { getPublicUrl } from '../lib/storage';

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
}

const Library = () => {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Fetch library items
  useEffect(() => {
    const fetchLibraryItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🎬 Fetching public library items...');
        
        const { data, error } = await db.supabase.rpc('get_public_library_items', {
          p_limit: 100,
          p_offset: 0,
          p_status_filter: statusFilter === 'all' ? null : statusFilter,
          p_content_type_filter: contentTypeFilter === 'all' ? null : contentTypeFilter,
          p_search_term: searchTerm || null
        });

        if (error) {
          console.error('❌ Error fetching library items:', error);
          setError('Failed to load library items. Please try again.');
          setLibraryItems([]);
        } else {
          console.log(`✅ Fetched ${data?.length || 0} library items`);
          
          // Sort items based on sortBy
          let sortedData = data || [];
          switch (sortBy) {
            case 'newest':
              sortedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              break;
            case 'oldest':
              sortedData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              break;
            case 'most_viewed':
              sortedData.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
              break;
            case 'confidence_high':
              sortedData.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
              break;
            case 'confidence_low':
              sortedData.sort((a, b) => (a.confidence_score || 0) - (b.confidence_score || 0));
              break;
          }
          
          setLibraryItems(sortedData);
        }
      } catch (err) {
        console.error('❌ Exception fetching library items:', err);
        setError('Failed to load library items. Please try again.');
        setLibraryItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibraryItems();
  }, [searchTerm, statusFilter, contentTypeFilter, sortBy]);

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

  // Check if content is video
  const isVideo = (contentType: string) => contentType.startsWith('video/');

  // Handle item click
  const handleItemClick = (item: LibraryItem, index: number) => {
    setSelectedItem(item);
    setCurrentIndex(index);
    
    // Increment view count
    db.verifications.incrementViewCount(item.id).catch(err => {
      console.warn('Failed to increment view count:', err);
    });
  };

  // Navigate between items in modal
  const navigateModal = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + libraryItems.length) % libraryItems.length
      : (currentIndex + 1) % libraryItems.length;
    
    setCurrentIndex(newIndex);
    setSelectedItem(libraryItems[newIndex]);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateModal('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateModal('next');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedItem, currentIndex, libraryItems]);

  // Get status icon and color
  const getStatusDisplay = (status: string, confidence: number) => {
    switch (status) {
      case 'authentic':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          label: 'Authentic'
        };
      case 'suspicious':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          label: 'Suspicious'
        };
      case 'fake':
        return {
          icon: <Shield className="h-4 w-4" />,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          label: 'AI Generated'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          label: 'Processing'
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <section className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="mb-8">
              <img 
                src="/fictus.png" 
                alt="Fictus AI" 
                className="mx-auto h-16 w-auto object-contain filter drop-shadow-lg"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            
            <Heading level={1} className="mb-8">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Verification Library
              </span>
            </Heading>
            
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-lg mb-8 leading-relaxed">
              Explore verified content from our community. Learn to identify authentic vs. AI-generated media.
            </Typography>
          </div>

          {/* Filters and Search */}
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="authentic">Authentic</option>
                <option value="suspicious">Suspicious</option>
                <option value="fake">AI Generated</option>
              </select>

              {/* Content Type Filter */}
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="image">Images</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="confidence_high">High Confidence</option>
                <option value="confidence_low">Low Confidence</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Library Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700 animate-pulse">
                  <div className="aspect-video bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <Typography variant="h3" className="mb-2 text-red-400">
                Error Loading Library
              </Typography>
              <Typography variant="body" color="secondary">
                {error}
              </Typography>
            </div>
          ) : libraryItems.length === 0 ? (
            <div className="text-center py-12">
              <Typography variant="h3" className="mb-4">
                No items found
              </Typography>
              <Typography variant="body" color="secondary">
                Try adjusting your filters or search terms.
              </Typography>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {libraryItems.map((item, index) => {
                const mediaUrl = getMediaUrl(item);
                const statusDisplay = getStatusDisplay(item.verification_status, item.confidence_score);
                
                return (
                  <div
                    key={item.id}
                    className="group bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300 cursor-pointer transform hover:scale-105"
                    onClick={() => handleItemClick(item, index)}
                  >
                    {/* Media Preview */}
                    <div className="relative aspect-video bg-gray-900">
                      {mediaUrl ? (
                        isVideo(item.content_type) ? (
                          <video
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={item.original_filename}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Typography variant="caption" color="secondary">
                            No preview available
                          </Typography>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/20 rounded-full p-3">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`absolute top-2 left-2 ${statusDisplay.bgColor} ${statusDisplay.color} px-2 py-1 rounded-full flex items-center gap-1`}>
                        {statusDisplay.icon}
                        <Typography variant="caption" className="text-xs font-medium">
                          {statusDisplay.label}
                        </Typography>
                      </div>

                      {/* Confidence Score */}
                      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                        <span className="numeric-text font-bold">
                          {Math.round(item.confidence_score)}%
                        </span>
                      </div>

                      {/* Video Indicator */}
                      {isVideo(item.content_type) && (
                        <div className="absolute bottom-2 left-2">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content Info */}
                    <div className="p-4">
                      <Typography variant="cardTitle" className="mb-2 truncate">
                        {item.original_filename}
                      </Typography>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>{formatFileSize(item.file_size)}</span>
                        <span>{item.view_count || 0} views</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <Typography variant="h4" className="truncate">
                  {selectedItem.original_filename}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {currentIndex + 1} of {libraryItems.length}
                </Typography>
              </div>
              
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
              {/* Media Display */}
              <div className="relative flex-1 bg-black flex items-center justify-center">
                {(() => {
                  const mediaUrl = getMediaUrl(selectedItem);
                  if (!mediaUrl) {
                    return (
                      <Typography variant="body" color="secondary">
                        No preview available
                      </Typography>
                    );
                  }

                  return isVideo(selectedItem.content_type) ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="max-w-full max-h-full"
                      autoPlay
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={selectedItem.original_filename}
                      className="max-w-full max-h-full object-contain"
                    />
                  );
                })()}

                {/* Navigation Arrows - Overlaid on content */}
                {libraryItems.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <button
                      onClick={() => navigateModal('prev')}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                      aria-label="Previous item"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={() => navigateModal('next')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                      aria-label="Next item"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Details Panel */}
              <div className="w-full lg:w-96 p-6 overflow-y-auto">
                {/* Status */}
                {(() => {
                  const statusDisplay = getStatusDisplay(selectedItem.verification_status, selectedItem.confidence_score);
                  return (
                    <div className={`${statusDisplay.bgColor} rounded-lg p-4 mb-6`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={statusDisplay.color}>
                          {statusDisplay.icon}
                        </div>
                        <Typography variant="h4" className={statusDisplay.color}>
                          {statusDisplay.label}
                        </Typography>
                      </div>
                      <Typography variant="body" className="mb-2">
                        <span className="numeric-text font-bold">
                          {selectedItem.confidence_score.toFixed(1)}%
                        </span> confidence
                      </Typography>
                      {selectedItem.ai_probability && (
                        <Typography variant="caption" color="secondary">
                          AI: {selectedItem.ai_probability.toFixed(1)}% • 
                          Human: {selectedItem.human_probability?.toFixed(1)}%
                        </Typography>
                      )}
                    </div>
                  );
                })()}

                {/* File Details */}
                <div className="space-y-4 mb-6">
                  <div>
                    <Typography variant="caption" color="secondary" className="uppercase tracking-wide">
                      File Details
                    </Typography>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Size</span>
                        <span>{formatFileSize(selectedItem.file_size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type</span>
                        <span>{selectedItem.content_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Uploaded</span>
                        <span>{new Date(selectedItem.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Views</span>
                        <span className="numeric-text">{selectedItem.view_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detection Details */}
                {selectedItem.detection_details && (
                  <div className="space-y-4 mb-6">
                    <Typography variant="caption" color="secondary" className="uppercase tracking-wide">
                      Analysis Details
                    </Typography>
                    <div className="space-y-3">
                      {Object.entries(selectedItem.detection_details).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400 capitalize text-sm">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-sm numeric-text">
                              {typeof value === 'number' ? `${value.toFixed(1)}%` : value}
                            </span>
                          </div>
                          {typeof value === 'number' && (
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                {selectedItem.risk_factors && selectedItem.risk_factors.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <Typography variant="caption" color="secondary" className="uppercase tracking-wide">
                      Risk Factors
                    </Typography>
                    <div className="space-y-2">
                      {selectedItem.risk_factors.map((factor, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <Typography variant="caption" className="text-yellow-300">
                            {factor}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    <Typography variant="caption">Download</Typography>
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Share2 className="h-4 w-4" />
                    <Typography variant="caption">Share</Typography>
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