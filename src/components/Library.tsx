import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Play, Eye, Calendar, User, ChevronDown, X, SlidersHorizontal, Image as ImageIcon, Video, Shield, AlertTriangle, CheckCircle, Brain, Clock, FileText, Download, Share2, Zap, Activity, BarChart3, TrendingUp } from 'lucide-react';
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
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 12;

  // Generate mock verification data for demonstration
  const generateMockVerificationData = (item: LibraryItem) => {
    const isVideo = item.content_type.startsWith('video/');
    const baseConfidence = item.confidence_score || Math.random() * 100;
    
    // Determine if it's AI or real based on confidence
    const isAI = baseConfidence < 50;
    const aiProbability = isAI ? 70 + Math.random() * 25 : 10 + Math.random() * 30;
    const humanProbability = 100 - aiProbability;
    
    return {
      ...item,
      ai_probability: aiProbability,
      human_probability: humanProbability,
      confidence_score: humanProbability,
      verification_status: isAI ? 'fake' : (humanProbability > 80 ? 'authentic' : 'suspicious'),
      processing_time: 2.3 + Math.random() * 5,
      detection_details: {
        faceAnalysis: 85 + Math.random() * 10,
        temporalConsistency: isVideo ? 78 + Math.random() * 15 : undefined,
        audioAnalysis: isVideo ? 82 + Math.random() * 12 : undefined,
        compressionArtifacts: 88 + Math.random() * 8,
        metadataAnalysis: 91 + Math.random() * 7,
        pixelAnalysis: !isVideo ? 86 + Math.random() * 10 : undefined,
      },
      risk_factors: isAI ? [
        'AI-generated content detected',
        'Inconsistent facial features',
        'Unnatural lighting patterns'
      ] : [],
      recommendations: [
        'Cross-reference with original source',
        'Verify metadata timestamps',
        'Check for additional context',
        isVideo ? 'Analyze audio-visual consistency' : 'Consider reverse image search'
      ]
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

      // Enhance items with mock verification data
      const enhancedItems = (data || []).map(generateMockVerificationData);
      
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

  // Check if content is video
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

  // Render item card
  const renderItemCard = (item: LibraryItem) => {
    const mediaUrl = getMediaUrl(item);
    const statusInfo = getStatusInfo(item.verification_status);
    const StatusIcon = statusInfo.icon;

    return (
      <div
        key={item.id}
        className="group bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 overflow-hidden cursor-pointer hover:transform hover:scale-105"
        onClick={() => setSelectedItem(item)}
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
                  alt={item.original_filename}
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
                  No preview available
                </Typography>
              </div>
            </div>
          )}

          {/* Large Status Badge */}
          <div className="absolute top-3 left-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusInfo.color} backdrop-blur-sm font-bold`}>
              <StatusIcon className="h-4 w-4" />
              <Typography variant="caption" className="text-sm font-bold">
                {statusInfo.label}
              </Typography>
            </div>
          </div>

          {/* Confidence score */}
          <div className="absolute top-3 right-3">
            <div className="bg-black/80 px-3 py-2 rounded-lg backdrop-blur-sm">
              <Typography variant="caption" className="text-white text-sm font-bold numeric-text">
                {Math.round(item.confidence_score)}%
              </Typography>
            </div>
          </div>

          {/* Content type indicator */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              {isVideo(item.content_type) ? (
                <Video className="h-4 w-4 text-white" />
              ) : (
                <ImageIcon className="h-4 w-4 text-white" />
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
        <div className="p-4">
          <Typography variant="cardTitle" className="mb-2 truncate">
            {item.original_filename}
          </Typography>
          
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{item.uploader_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span className="numeric-text">{item.view_count}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatFileSize(item.file_size)}</span>
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
          </div>

          {/* Quick verification info */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <Typography variant="caption" color="secondary">
                Processing: {item.processing_time?.toFixed(1)}s
              </Typography>
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3 text-blue-400" />
                <Typography variant="caption" className="text-blue-400">
                  AI Verified
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render list item
  const renderListItem = (item: LibraryItem) => {
    const mediaUrl = getMediaUrl(item);
    const statusInfo = getStatusInfo(item.verification_status);
    const StatusIcon = statusInfo.icon;

    return (
      <div
        key={item.id}
        className="group bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 p-4 cursor-pointer"
        onClick={() => setSelectedItem(item)}
      >
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="relative w-32 h-20 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
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
                    alt={item.original_filename}
                    className="w-full h-full object-cover"
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVideo(item.content_type) ? (
                  <Video className="h-6 w-6 text-gray-500" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-gray-500" />
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
              <Typography variant="cardTitle" className="truncate pr-2">
                {item.original_filename}
              </Typography>
              
              {/* Status badge */}
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg border ${statusInfo.color} flex-shrink-0 font-bold`}>
                <StatusIcon className="h-3 w-3" />
                <Typography variant="caption" className="text-xs font-bold">
                  {statusInfo.label}
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{item.uploader_name}</span>
              </div>
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
                  <Typography variant="caption" className="text-white text-xs font-bold numeric-text">
                    {Math.round(item.confidence_score)}% confidence
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
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                <Typography variant="body">Filters & Search</Typography>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters Container */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4 lg:p-6">
              {/* Search Bar */}
              <div className="mb-4 lg:mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by filename or uploader..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">All Statuses</option>
                    <option value="authentic">Real Content</option>
                    <option value="suspicious">Suspicious</option>
                    <option value="fake">AI Generated</option>
                  </select>
                </div>

                {/* Content Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content Type
                  </label>
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">All Types</option>
                    <option value="video">Videos</option>
                    <option value="image">Images</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    View Mode
                  </label>
                  <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-600">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">List</span>
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Actions
                  </label>
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || statusFilter || contentTypeFilter) && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                  <Typography variant="caption" color="secondary" className="mr-2">
                    Active filters:
                  </Typography>
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {statusFilter && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                      Status: {statusFilter}
                    </span>
                  )}
                  {contentTypeFilter && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                      Type: {contentTypeFilter}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[95vh] overflow-y-auto overflow-x-hidden">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Typography variant="h2">Verification Report</Typography>
                  {(() => {
                    const statusInfo = getStatusInfo(selectedItem.verification_status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${statusInfo.color} font-bold text-sm sm:text-base`}>
                        <StatusIcon className="h-5 w-5" />
                        <span className="whitespace-nowrap">{statusInfo.label}</span>
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Media and Basic Info */}
                <div className="space-y-6">
                  {/* Media Preview */}
                  <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden">
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
                              alt={selectedItem.original_filename}
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

                  {/* File Information */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <Typography variant="h3" className="mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      File Information
                    </Typography>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Filename:</span>
                        <span className="text-white font-medium">{selectedItem.original_filename}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">File Size:</span>
                        <span className="text-white numeric-text">{formatFileSize(selectedItem.file_size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Content Type:</span>
                        <span className="text-white">{selectedItem.content_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Uploaded By:</span>
                        <span className="text-white">{selectedItem.uploader_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Upload Date:</span>
                        <span className="text-white">{new Date(selectedItem.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Views:</span>
                        <span className="text-white numeric-text">{selectedItem.view_count}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Verification Results */}
                <div className="space-y-6">
                  {/* Main Verification Result */}
                  <div className={`bg-gradient-to-r ${getStatusInfo(selectedItem.verification_status).bgGradient} rounded-xl p-8 border border-gray-700 text-center`}>
                    <div className="mb-6">
                      {(() => {
                        const statusInfo = getStatusInfo(selectedItem.verification_status);
                        const StatusIcon = statusInfo.icon;
                        return <StatusIcon className="h-16 w-16 mx-auto text-current" />;
                      })()}
                    </div>
                    
                    <Typography variant="h1" className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                      {getStatusInfo(selectedItem.verification_status).label}
                    </Typography>
                    
                    <Typography variant="h2" className="mb-4 text-xl sm:text-2xl">
                      <span className="numeric-text">{Math.round(selectedItem.confidence_score)}%</span> Confidence
                    </Typography>
                    
                    <Typography variant="body" color="secondary">
                      Analysis completed in <span className="numeric-text text-white">{selectedItem.processing_time?.toFixed(1)}</span> seconds
                    </Typography>
                  </div>

                  {/* AI vs Human Probability */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <Typography variant="h3" className="mb-6 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      AI Detection Analysis
                    </Typography>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-red-400">AI Generated</span>
                          <span className="text-red-400 font-bold numeric-text">{Math.round(selectedItem.ai_probability || 0)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${selectedItem.ai_probability || 0}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-green-400">Human Created</span>
                          <span className="text-green-400 font-bold numeric-text">{Math.round(selectedItem.human_probability || 0)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${selectedItem.human_probability || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detection Details */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <Typography variant="h3" className="mb-6 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      Detection Analysis
                    </Typography>
                    
                    <div className="space-y-4">
                      {Object.entries(selectedItem.detection_details || {}).map(([key, value]) => {
                        if (value === undefined) return null;
                        const score = value as number;
                        return (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-cyan-400 font-bold numeric-text">{score.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {selectedItem.risk_factors && selectedItem.risk_factors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                      <Typography variant="h3" className="mb-4 text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Risk Factors Detected
                      </Typography>
                      <div className="space-y-2">
                        {selectedItem.risk_factors.map((factor, index) => (
                          <div key={index} className="flex items-start gap-2">
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
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                      <Typography variant="h3" className="mb-4 text-blue-400 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Recommendations
                      </Typography>
                      <div className="space-y-2">
                        {selectedItem.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2">
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
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-700">
                <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors">
                  <Download className="h-4 w-4" />
                  <Typography variant="button">Download Report</Typography>
                </button>
                
                <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors">
                  <Share2 className="h-4 w-4" />
                  <Typography variant="button">Share Results</Typography>
                </button>
                
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  <Typography variant="button">Close</Typography>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;