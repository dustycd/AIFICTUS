import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Play, Shield, AlertTriangle, CheckCircle, Clock, Eye, Download, Share2, Calendar, User, X, Film, Image as ImageIcon, Zap, Brain, Globe, Lock } from 'lucide-react';
import { Typography, Heading } from './Typography';
import { db } from '../lib/database';
import { formatFileSize, getPublicUrl } from '../lib/storage';

interface LibraryItem {
  id: string;
  file_name: string;
  original_filename: string;
  content_type: string;
  verification_status: 'pending' | 'uploading' | 'processing' | 'authentic' | 'suspicious' | 'fake' | 'error';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // Load public library items
  const loadLibraryItems = async (page = 0, reset = false) => {
    try {
      setError(null);
      if (reset) {
        setIsLoading(true);
        setLibraryItems([]);
      }

      // Map filter values to API parameters
      const statusFilter = selectedFilter === 'all' ? null : 
                          selectedFilter === 'ai-generated' ? 'fake' :
                          selectedFilter === 'verified' ? 'authentic' :
                          selectedFilter === 'suspicious' ? 'suspicious' : null;

      const typeFilter = contentTypeFilter === 'all' ? null :
                        contentTypeFilter === 'videos' ? 'video' :
                        contentTypeFilter === 'images' ? 'image' : null;

      console.log('🔍 Loading library items with filters:', {
        page,
        statusFilter,
        typeFilter,
        searchQuery: searchQuery || null
      });

      const { data, error } = await db.verifications.getPublicLibraryItems(
        ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE,
        statusFilter,
        typeFilter,
        searchQuery || null
      );

      if (error) {
        console.error('Error loading library items:', error);
        setError('Failed to load library items');
        return;
      }

      const items = data || [];
      
      if (reset) {
        setLibraryItems(items);
      } else {
        setLibraryItems(prev => [...prev, ...items]);
      }
      
      setHasMore(items.length === ITEMS_PER_PAGE);
      setCurrentPage(page);
    } catch (err) {
      console.error('Exception loading library items:', err);
      setError('Failed to load library items');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadLibraryItems(0, true);
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadLibraryItems(0, true);
  }, [selectedFilter, contentTypeFilter, searchQuery]);

  // Apply client-side filtering and sorting
  useEffect(() => {
    let filtered = [...libraryItems];

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'confidence':
        filtered.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
        break;
      case 'views':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.original_filename || a.file_name).localeCompare(b.original_filename || b.file_name));
        break;
    }

    setFilteredItems(filtered);
  }, [libraryItems, sortBy]);

  // Handle item click to open modal and increment view count
  const handleItemClick = async (item: LibraryItem) => {
    setSelectedItem(item);
    setShowModal(true);
    
    // Increment view count
    try {
      await db.verifications.incrementViewCount(item.id);
      // Update local state
      setLibraryItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, view_count: (i.view_count || 0) + 1 } : i)
      );
    } catch (err) {
      console.error('Failed to increment view count:', err);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Get media URL for preview
  const getMediaUrl = (item: LibraryItem): string | null => {
    // Priority: thumbnail_path > file_url > constructed public URL
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

  // Get full quality media URL for modal
  const getFullMediaUrl = (item: LibraryItem): string | null => {
    // Priority: file_url > constructed public URL > thumbnail
    if (item.file_url) {
      return item.file_url;
    }
    
    if (item.storage_bucket && item.storage_path) {
      return getPublicUrl(item.storage_bucket, item.storage_path);
    }
    
    if (item.thumbnail_path) {
      return getPublicUrl('verification-thumbnails', item.thumbnail_path);
    }
    
    return null;
  };

  // Download file
  const downloadFile = async (item: LibraryItem) => {
    const url = getFullMediaUrl(item);
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = item.original_filename || item.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Check if content is video
  const isVideo = (contentType: string) => contentType.startsWith('video/');
  const isImage = (contentType: string) => contentType.startsWith('image/');

  // Render media preview
  const renderMediaPreview = (item: LibraryItem) => {
    const mediaUrl = getMediaUrl(item);
    const thumbnailUrl = item.thumbnail_path ? getPublicUrl('verification-thumbnails', item.thumbnail_path) : null;
    
    if (!mediaUrl) {
      // Fallback to placeholder
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          {isVideo(item.content_type) ? (
            <Play className="h-12 w-12 text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🖼️</span>
              </div>
              <Typography variant="caption" color="secondary" className="text-xs">
                Image
              </Typography>
            </div>
          )}
        </div>
      );
    }

    if (isVideo(item.content_type)) {
      return (
        <div className="relative w-full h-full">
          <video 
            src={mediaUrl}
            poster={thumbnailUrl || undefined}
            className="w-full h-full object-cover"
            controls={false}
            preload="metadata"
            onError={(e) => {
              // Fallback to placeholder on error
              const target = e.target as HTMLVideoElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gray-900">
                  <div class="h-12 w-12 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="6,3 20,12 6,21 6,3"/></svg>
                  </div>
                </div>
              `;
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 rounded-full p-3">
              <Play className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <img 
          src={mediaUrl}
          alt={item.original_filename || item.file_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder on error
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = `
              <div class="w-full h-full flex items-center justify-center bg-gray-900">
                <div class="text-center">
                  <div class="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <span class="text-2xl">🖼️</span>
                  </div>
                  <div class="text-xs text-gray-400">Image</div>
                </div>
              </div>
            `;
          }}
        />
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authentic':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'suspicious':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'fake':
        return <Shield className="h-4 w-4 text-red-400" />;
      case 'pending':
      case 'uploading':
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authentic':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'suspicious':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'fake':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'pending':
      case 'uploading':
      case 'processing':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'error':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            
            <Heading level={1} className="mb-6 text-5xl lg:text-6xl font-black">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Community Library
              </span>
            </Heading>
            
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-xl mb-8 leading-relaxed">
              Explore verified content shared by our community. Learn from real examples of authentic and AI-generated media.
            </Typography>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-center mb-3">
                  <Globe className="h-6 w-6 text-blue-400 mr-2" />
                  <span className="numeric-text text-2xl text-blue-400 font-bold">{filteredItems.length}</span>
                </div>
                <Typography variant="caption" color="secondary">Total Items</Typography>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-center mb-3">
                  <CheckCircle className="h-6 w-6 text-green-400 mr-2" />
                  <span className="numeric-text text-2xl text-green-400 font-bold">
                    {filteredItems.filter(item => item.verification_status === 'authentic').length}
                  </span>
                </div>
                <Typography variant="caption" color="secondary">Verified Authentic</Typography>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-center mb-3">
                  <Shield className="h-6 w-6 text-red-400 mr-2" />
                  <span className="numeric-text text-2xl text-red-400 font-bold">
                    {filteredItems.filter(item => item.verification_status === 'fake').length}
                  </span>
                </div>
                <Typography variant="caption" color="secondary">AI Generated</Typography>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-center mb-3">
                  <Eye className="h-6 w-6 text-purple-400 mr-2" />
                  <span className="numeric-text text-2xl text-purple-400 font-bold">
                    {filteredItems.reduce((sum, item) => sum + (item.view_count || 0), 0)}
                  </span>
                </div>
                <Typography variant="caption" color="secondary">Total Views</Typography>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search Bar */}
                <div className="relative flex-1 w-full lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedFilter('all')}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                        selectedFilter === 'all'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      All Content
                    </button>
                    <button
                      onClick={() => setSelectedFilter('verified')}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                        selectedFilter === 'verified'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Verified
                    </button>
                    <button
                      onClick={() => setSelectedFilter('ai-generated')}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                        selectedFilter === 'ai-generated'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      AI Content
                    </button>
                  </div>

                  {/* Content Type Filter */}
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                    className="px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="all">All Types</option>
                    <option value="videos">Videos Only</option>
                    <option value="images">Images Only</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="recent">🕒 Most Recent</option>
                    <option value="confidence">📊 Highest Confidence</option>
                    <option value="views">👁️ Most Viewed</option>
                    <option value="name">📝 Name A-Z</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-900 rounded-xl border border-gray-600 overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 transition-colors ${
                        viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 transition-colors ${
                        viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <Typography variant="cardCaption" color="secondary">
                  {isLoading ? 'Loading...' : (
                    <>
                      <span className="numeric-text">{filteredItems.length}</span> items found
                      {searchQuery && ` for "${searchQuery}"`}
                      {selectedFilter !== 'all' && ` in ${selectedFilter} content`}
                      {contentTypeFilter !== 'all' && ` (${contentTypeFilter} only)`}
                    </>
                  )}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid/List */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {error ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <AlertTriangle className="h-16 w-16 text-red-400" />
              </div>
              <Heading level={3} className="mb-4 text-red-400">
                Failed to Load Library
              </Heading>
              <Typography variant="body" color="secondary" className="mb-6">
                {error}
              </Typography>
              <button
                onClick={() => loadLibraryItems(0, true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : isLoading && filteredItems.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700 animate-pulse">
                  <div className="aspect-video bg-gray-700" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Search className="h-16 w-16 text-gray-400" />
              </div>
              <Heading level={3} className="mb-4">
                No items found
              </Heading>
              <Typography variant="body" color="secondary" className="mb-6">
                {searchQuery || selectedFilter !== 'all' || contentTypeFilter !== 'all'
                  ? 'No items match your current filters. Try adjusting your search or filters.'
                  : 'The community library is empty. Be the first to share a verification!'
                }
              </Typography>
              {(searchQuery || selectedFilter !== 'all' || contentTypeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                    setContentTypeFilter('all');
                  }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300 group hover:transform hover:scale-105 cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      {/* Media Preview */}
                      <div className="relative aspect-video overflow-hidden bg-gray-900">
                        {renderMediaPreview(item)}
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(item.verification_status)}`}>
                            {getStatusIcon(item.verification_status)}
                            <span className="capitalize">{item.verification_status}</span>
                          </div>
                        </div>

                        {/* Content Type Badge */}
                        <div className="absolute top-2 right-2">
                          <div className="bg-black/80 px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                            {isVideo(item.content_type) ? (
                              <Film className="h-3 w-3" />
                            ) : (
                              <ImageIcon className="h-3 w-3" />
                            )}
                            <span>{isVideo(item.content_type) ? 'Video' : 'Image'}</span>
                          </div>
                        </div>

                        {/* View Count */}
                        <div className="absolute bottom-2 left-2">
                          <div className="bg-black/80 px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span className="numeric-text">{item.view_count || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-blue-400">
                            <span className="numeric-text text-lg font-bold">
                              {item.confidence_score != null ? `${item.confidence_score.toFixed(1)}%` : 'Processing...'}
                            </span>
                          </div>
                          <div className="text-gray-400 text-xs">
                            {item.ai_probability ? (
                              <span>AI: <span className="numeric-text">{item.ai_probability.toFixed(1)}%</span></span>
                            ) : null}
                          </div>
                        </div>

                        <Typography variant="cardTitle" className="mb-2 truncate">
                          {item.original_filename || item.file_name}
                        </Typography>

                        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                          <span className="numeric-text">{formatFileSize(item.file_size || 0)}</span>
                          <span>{formatDate(item.created_at)}</span>
                        </div>

                        {/* Risk Factors Preview */}
                        {item.risk_factors && item.risk_factors.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {item.risk_factors.slice(0, 2).map((factor, index) => (
                                <span key={index} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/30 truncate">
                                  {factor.length > 15 ? factor.substring(0, 15) + '...' : factor}
                                </span>
                              ))}
                              {item.risk_factors.length > 2 && (
                                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                                  +{item.risk_factors.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Uploader */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <Typography variant="caption" color="secondary">
                              {item.uploader_name || 'Anonymous'}
                            </Typography>
                          </div>
                          <Typography variant="caption" className="text-blue-400">
                            Click to view details
                          </Typography>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-gray-800/30 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 group cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex flex-col md:flex-row gap-6 p-6">
                        {/* Media Preview */}
                        <div className="relative w-full md:w-80 aspect-video overflow-hidden rounded-lg flex-shrink-0 bg-gray-900">
                          {renderMediaPreview(item)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <Typography variant="h3" className="text-blue-400">
                                <span className="numeric-text">
                                  {item.confidence_score != null ? `${item.confidence_score.toFixed(1)}%` : 'Processing...'}
                                </span> Confidence
                              </Typography>
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getStatusColor(item.verification_status)}`}>
                                {getStatusIcon(item.verification_status)}
                                <span className="capitalize">{item.verification_status}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <Eye className="h-4 w-4" />
                              <span className="numeric-text">{item.view_count || 0}</span>
                            </div>
                          </div>

                          <Typography variant="h4" className="mb-2">
                            {item.original_filename || item.file_name}
                          </Typography>

                          <div className="flex items-center gap-6 mb-4 text-sm text-gray-400">
                            {item.confidence_score != null && (
                              <div className="flex items-center gap-1">
                                <Brain className="h-4 w-4" />
                                <span className="numeric-text">{item.confidence_score.toFixed(1)}%</span> confidence
                              </div>
                            )}
                            {item.processing_time && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-4 w-4 text-yellow-400" />
                                <span className="numeric-text">{item.processing_time.toFixed(1)}s</span>
                              </div>
                            )}
                            {item.ai_probability != null && (
                              <div className="flex items-center gap-1">
                                <Brain className="h-4 w-4 text-red-400" />
                                <span className="numeric-text">{item.ai_probability.toFixed(1)}%</span> AI
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              {isVideo(item.content_type) ? (
                                <Film className="h-4 w-4" />
                              ) : (
                                <ImageIcon className="h-4 w-4" />
                              )}
                              <span>{isVideo(item.content_type) ? 'Video' : 'Image'}</span>
                            </div>
                          </div>

                          {/* Risk Factors Preview */}
                          {item.risk_factors && item.risk_factors.length > 0 && (
                            <div className="mb-4">
                              <Typography variant="caption" color="secondary" className="mb-2 block">
                                Risk Factors:
                              </Typography>
                              <div className="flex flex-wrap gap-2">
                                {item.risk_factors.slice(0, 3).map((factor, index) => (
                                  <span key={index} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/30">
                                    {factor}
                                  </span>
                                ))}
                                {item.risk_factors.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                                    +{item.risk_factors.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>{item.uploader_name || 'Anonymous'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(item.created_at)}</span>
                              </div>
                              <span className="numeric-text">{formatFileSize(item.file_size || 0)}</span>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(item);
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                              >
                                View Details
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFile(item);
                                }}
                                className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && !isLoading && (
                <div className="text-center mt-12">
                  <button
                    onClick={() => loadLibraryItems(currentPage + 1, false)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    Load More Items
                  </button>
                </div>
              )}

              {/* Loading More Indicator */}
              {isLoading && filteredItems.length > 0 && (
                <div className="text-center mt-12">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 rounded-2xl">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <Typography variant="body" color="secondary">
                      Loading more items...
                    </Typography>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Modal for viewing content */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${getStatusColor(selectedItem.verification_status)}`}>
                  {getStatusIcon(selectedItem.verification_status)}
                  <span className="capitalize">{selectedItem.verification_status}</span>
                </div>
                <Typography variant="h3" className="text-blue-400">
                  <span className="numeric-text">
                    {selectedItem.confidence_score != null ? `${selectedItem.confidence_score.toFixed(1)}%` : 'Processing...'}
                  </span> Confidence
                </Typography>
                <div className="flex items-center gap-1 text-gray-400">
                  <Eye className="h-4 w-4" />
                  <span className="numeric-text">{selectedItem.view_count || 0}</span> views
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
              {/* Media Display */}
              <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] lg:min-h-[500px]">
                {isVideo(selectedItem.content_type) ? (
                  <video
                    src={getFullMediaUrl(selectedItem) || undefined}
                    controls
                    className="max-w-full max-h-full object-contain"
                    poster={selectedItem.thumbnail_path ? getPublicUrl('verification-thumbnails', selectedItem.thumbnail_path) : undefined}
                  />
                ) : (
                  <img
                    src={getFullMediaUrl(selectedItem) || undefined}
                    alt={selectedItem.original_filename || selectedItem.file_name}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Analysis Details */}
              <div className="w-full lg:w-96 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* File Info */}
                  <div>
                    <Typography variant="cardTitle" className="mb-4">File Information</Typography>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Filename</span>
                        <span className="text-sm truncate ml-2">{selectedItem.original_filename || selectedItem.file_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type</span>
                        <span className="text-sm">{isVideo(selectedItem.content_type) ? 'Video' : 'Image'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Size</span>
                        <span className="numeric-text text-sm">{formatFileSize(selectedItem.file_size || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Uploaded</span>
                        <span className="text-sm">{formatDate(selectedItem.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Uploader</span>
                        <span className="text-sm">{selectedItem.uploader_name || 'Anonymous'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Metrics */}
                  <div>
                    <Typography variant="cardTitle" className="mb-4">Analysis Results</Typography>
                    <div className="space-y-3">
                      {selectedItem.confidence_score != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Confidence Score</span>
                          <span className="numeric-text text-blue-400 font-bold">{selectedItem.confidence_score.toFixed(1)}%</span>
                        </div>
                      )}
                      {selectedItem.ai_probability && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">AI Probability</span>
                          <span className="numeric-text text-red-400">{selectedItem.ai_probability.toFixed(1)}%</span>
                        </div>
                      )}
                      {selectedItem.human_probability && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Human Probability</span>
                          <span className="numeric-text text-green-400">{selectedItem.human_probability.toFixed(1)}%</span>
                        </div>
                      )}
                      {selectedItem.processing_time && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Processing Time</span>
                          <span className="numeric-text">{selectedItem.processing_time.toFixed(1)}s</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detection Details */}
                  {selectedItem.detection_details && Object.keys(selectedItem.detection_details).length > 0 && (
                    <div>
                      <Typography variant="cardTitle" className="mb-3">Detection Analysis</Typography>
                      <div className="space-y-3">
                        {Object.entries(selectedItem.detection_details).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-400 capitalize text-sm">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-sm numeric-text">{(value as number).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {selectedItem.risk_factors && selectedItem.risk_factors.length > 0 && (
                    <div>
                      <Typography variant="cardTitle" className="mb-3 text-red-400">
                        Risk Factors
                      </Typography>
                      <div className="space-y-2">
                        {selectedItem.risk_factors.map((factor, index) => (
                          <div key={index} className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/30">
                            {factor}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedItem.recommendations && selectedItem.recommendations.length > 0 && (
                    <div>
                      <Typography variant="cardTitle" className="mb-3 text-blue-400">
                        Recommendations
                      </Typography>
                      <div className="space-y-2">
                        {selectedItem.recommendations.map((rec, index) => (
                          <div key={index} className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm border border-blue-500/30">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-700 space-y-3">
                    <button
                      onClick={() => downloadFile(selectedItem)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="h-5 w-5" />
                      Download File
                    </button>
                    
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `Fictus AI Verification: ${selectedItem.original_filename || selectedItem.file_name}`,
                            text: `This ${isVideo(selectedItem.content_type) ? 'video' : 'image'} has been verified with ${selectedItem.confidence_score?.toFixed(1)}% confidence as ${selectedItem.verification_status}.`,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          // You could add a toast notification here
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share Verification
                    </button>
                  </div>
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