import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Play, Eye, Calendar, User, ChevronDown, X, SlidersHorizontal, Image as ImageIcon, Video, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
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

      const newItems = data || [];
      
      if (reset || page === 1) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
      
      setHasMore(newItems.length === itemsPerPage);
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
          label: 'Authentic'
        };
      case 'suspicious':
        return { 
          color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', 
          icon: AlertTriangle,
          label: 'Suspicious'
        };
      case 'fake':
        return { 
          color: 'text-red-400 bg-red-500/20 border-red-500/30', 
          icon: Shield,
          label: 'AI Generated'
        };
      default:
        return { 
          color: 'text-gray-400 bg-gray-500/20 border-gray-500/30', 
          icon: Shield,
          label: 'Unknown'
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

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${statusInfo.color} backdrop-blur-sm`}>
              <StatusIcon className="h-3 w-3" />
              <Typography variant="caption" className="text-xs font-medium">
                {statusInfo.label}
              </Typography>
            </div>
          </div>

          {/* Confidence score */}
          <div className="absolute top-3 right-3">
            <div className="bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm">
              <Typography variant="caption" className="text-white text-xs font-bold numeric-text">
                {Math.round(item.confidence_score)}%
              </Typography>
            </div>
          </div>

          {/* Content type indicator */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm">
              {isVideo(item.content_type) ? (
                <Video className="h-3 w-3 text-white" />
              ) : (
                <ImageIcon className="h-3 w-3 text-white" />
              )}
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
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${statusInfo.color} flex-shrink-0`}>
                <StatusIcon className="h-3 w-3" />
                <Typography variant="caption" className="text-xs font-medium">
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
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{formatFileSize(item.file_size)}</span>
              <div className="bg-black/60 px-2 py-1 rounded-full">
                <Typography variant="caption" className="text-white text-xs font-bold numeric-text">
                  {Math.round(item.confidence_score)}% confidence
                </Typography>
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
                    <option value="authentic">Authentic</option>
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

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Typography variant="h3">Verification Details</Typography>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal content would go here - detailed view of the selected item */}
              <div className="space-y-6">
                <Typography variant="body" color="secondary">
                  Detailed view for: {selectedItem.original_filename}
                </Typography>
                {/* Add more detailed content here */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;