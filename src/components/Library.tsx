import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Play, Shield, AlertTriangle, CheckCircle, Clock, Eye, Download, Share2, Calendar, User, Zap, Brain, Sparkles, TrendingUp, Activity, BarChart3, Cpu, Database, Network, Globe, Users, Heart, Star, X, Flame, Layers, Shuffle, ArrowRight, ChevronDown, Tag } from 'lucide-react';
import { Typography, Heading } from './Typography';
import { db } from '../lib/database';
import { getPublicUrl } from '../lib/storage';
import Footer from './Footer';

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
  tags?: string[]; // Added tags support
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
  const [libraryStats, setLibraryStats] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // Popular search terms and tags
  const popularSearchTerms = [
    'deepfake', 'AI generated', 'face swap', 'synthetic media', 'authentic video',
    'portrait', 'interview', 'news', 'social media', 'viral content',
    'high confidence', 'suspicious content', 'verified authentic', 'fake detection'
  ];

  // Load public library items with enhanced search
  const loadLibraryItems = async (page = 0, reset = false) => {
    try {
      setError(null);
      if (reset) {
        setIsLoading(true);
        setLibraryItems([]);
      }

      console.log('🔍 Loading library items with search:', {
        searchQuery,
        selectedFilter,
        contentTypeFilter,
        page
      });

      const { data, error } = await db.supabase.rpc('get_public_library_items', {
        p_limit: ITEMS_PER_PAGE,
        p_offset: page * ITEMS_PER_PAGE,
        p_status_filter: selectedFilter === 'all' ? null : selectedFilter,
        p_content_type_filter: contentTypeFilter === 'all' ? null : contentTypeFilter,
        p_search_term: searchQuery.trim() || null
      });

      if (error) {
        console.error('❌ Error loading library items:', error);
        setError('Failed to load library items. Please try again.');
        return;
      }

      const items = data || [];
      console.log(`✅ Loaded ${items.length} items for page ${page}`);
      
      if (reset) {
        setLibraryItems(items);
      } else {
        setLibraryItems(prev => [...prev, ...items]);
      }
      
      setHasMore(items.length === ITEMS_PER_PAGE);
      setCurrentPage(page);
    } catch (err) {
      console.error('❌ Exception loading library items:', err);
      setError('Failed to load library items. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate search suggestions based on input
  const generateSearchSuggestions = (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions(popularSearchTerms.slice(0, 6));
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const suggestions = [];

    // Add matching popular terms
    const matchingTerms = popularSearchTerms.filter(term => 
      term.toLowerCase().includes(lowercaseQuery)
    );
    suggestions.push(...matchingTerms.slice(0, 4));

    // Add exact matches from current items
    const exactMatches = libraryItems
      .filter(item => {
        const searchableText = [
          item.file_name,
          item.original_filename,
          item.uploader_name,
          ...(item.tags || []),
          ...(item.risk_factors || [])
        ].join(' ').toLowerCase();
        
        return searchableText.includes(lowercaseQuery);
      })
      .map(item => item.original_filename || item.file_name)
      .slice(0, 3);
    
    suggestions.push(...exactMatches);

    // Remove duplicates and limit
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 6);
    setSearchSuggestions(uniqueSuggestions);
  };

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    generateSearchSuggestions(value);
    
    // Show suggestions when typing
    if (value.trim()) {
      setShowSuggestions(true);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (query?: string) => {
    const searchTerm = query || searchQuery;
    setSearchQuery(searchTerm);
    setShowSuggestions(false);
    loadLibraryItems(0, true);
  };

  // Load library statistics
  const loadLibraryStats = async () => {
    try {
      const { data, error } = await db.supabase
        .from('public_library_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Error loading library stats:', error);
        return;
      }

      setLibraryStats(data);
    } catch (err) {
      console.error('Exception loading library stats:', err);
    }
  };

  // Initial load
  useEffect(() => {
    loadLibraryItems(0, true);
    loadLibraryStats();
    generateSearchSuggestions('');
  }, []);

  // Reload when filters change (but not search - that's handled by submit)
  useEffect(() => {
    loadLibraryItems(0, true);
  }, [selectedFilter, contentTypeFilter]);

  // Apply client-side sorting
  useEffect(() => {
    let sorted = [...libraryItems];

    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'popular':
        sorted.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'confidence':
        sorted.sort((a, b) => b.confidence_score - a.confidence_score);
        break;
      case 'title':
        sorted.sort((a, b) => (a.original_filename || a.file_name).localeCompare(b.original_filename || b.file_name));
        break;
      case 'relevance':
        // Sort by search relevance if there's a search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          sorted.sort((a, b) => {
            const aScore = calculateRelevanceScore(a, query);
            const bScore = calculateRelevanceScore(b, query);
            return bScore - aScore;
          });
        }
        break;
    }

    setFilteredItems(sorted);
  }, [libraryItems, sortBy, searchQuery]);

  // Calculate relevance score for search results
  const calculateRelevanceScore = (item: LibraryItem, query: string): number => {
    let score = 0;
    const queryWords = query.split(' ').filter(word => word.length > 2);

    queryWords.forEach(word => {
      // Exact filename match (highest priority)
      if ((item.original_filename || item.file_name).toLowerCase().includes(word)) {
        score += 10;
      }
      
      // Tag matches (high priority)
      if (item.tags?.some(tag => tag.toLowerCase().includes(word))) {
        score += 8;
      }
      
      // Risk factor matches (medium priority)
      if (item.risk_factors?.some(factor => factor.toLowerCase().includes(word))) {
        score += 6;
      }
      
      // Uploader name matches (medium priority)
      if (item.uploader_name.toLowerCase().includes(word)) {
        score += 5;
      }
      
      // Status matches (low priority)
      if (item.verification_status.toLowerCase().includes(word)) {
        score += 3;
      }
    });

    // Boost score for higher confidence items
    score += item.confidence_score / 10;
    
    // Boost score for more popular items
    score += Math.log(item.view_count + 1);

    return score;
  };

  // Increment view count when viewing an item
  const handleItemView = async (itemId: string) => {
    try {
      await db.supabase.rpc('increment_public_item_views', {
        p_verification_id: itemId
      });
      
      // Update local state
      setLibraryItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, view_count: item.view_count + 1 }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to increment view count:', err);
    }
  };

  // Handle item click to open modal
  const handleItemClick = (item: LibraryItem) => {
    setSelectedItem(item);
    setShowModal(true);
    handleItemView(item.id);
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
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Calculate statistics from current data
  const stats = libraryStats || {
    total_public_items: filteredItems.length,
    authentic_count: filteredItems.filter(v => v.verification_status === 'authentic').length,
    fake_count: filteredItems.filter(v => v.verification_status === 'fake').length,
    suspicious_count: filteredItems.filter(v => v.verification_status === 'suspicious').length,
    video_count: filteredItems.filter(v => isVideo(v.content_type)).length,
    image_count: filteredItems.filter(v => isImage(v.content_type)).length,
    avg_confidence_score: filteredItems.reduce((sum, v) => sum + v.confidence_score, 0) / filteredItems.length || 0,
    total_views: filteredItems.reduce((sum, v) => sum + v.view_count, 0)
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Centered Hero Search Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Particles */}
          {[...Array(15)].map((_, i) => (
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
          <div className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse" />
          <div className="absolute w-80 h-80 bg-gradient-to-r from-cyan-500/10 to-green-500/10 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto text-center">
          {/* Hero Title */}
          <div className="mb-12">
          
            
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-xl leading-relaxed">
              Explore our comprehensive database of verified media content. Search through thousands of 
              analyzed videos and images to understand AI detection patterns and learn from real-world examples.
            </Typography>
          </div>

          {/* Main Search Interface */}
          <div className="mb-12">
            {/* Primary Search Bar */}
            <div className={`relative mb-8 transition-all duration-700 ${
              searchFocused 
                ? 'transform scale-105 shadow-2xl shadow-blue-500/25' 
                : 'hover:transform hover:scale-102'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-60" />
              <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-3 shadow-2xl">
                <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }}>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center flex-1 gap-6 px-8 py-6">
                      <Search className={`h-8 w-8 transition-all duration-300 ${
                        searchFocused ? 'text-blue-400 scale-110' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        placeholder="Search verified content, creators, tags, or keywords..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => {
                          setSearchFocused(true);
                          if (searchQuery.trim()) setShowSuggestions(true);
                        }}
                        onBlur={() => {
                          setSearchFocused(false);
                          // Delay hiding suggestions to allow clicks
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        className="flex-1 bg-transparent text-white placeholder-gray-400 text-xl focus:outline-none"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setShowSuggestions(false);
                            handleSearchSubmit('');
                          }}
                          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-full"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      )}
                    </div>
                    
                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-3 pr-4">
                      <button
                        type="button"
                        onClick={() => handleSearchSubmit('AI generated')}
                        className="group px-6 py-3 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/30 transition-all duration-300 text-sm font-medium border border-red-500/30 hover:border-red-500/50 hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>AI Content</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSearchSubmit('authentic')}
                        className="group px-6 py-3 bg-green-500/20 text-green-400 rounded-2xl hover:bg-green-500/30 transition-all duration-300 text-sm font-medium border border-green-500/30 hover:border-green-500/50 hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Verified</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl z-50">
                    <div className="p-4">
                      <Typography variant="caption" color="secondary" className="mb-3 block">
                        {searchQuery.trim() ? 'Suggestions' : 'Popular searches'}
                      </Typography>
                      <div className="space-y-2">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearchSubmit(suggestion)}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-colors flex items-center gap-3"
                          >
                            <Search className="h-4 w-4 text-gray-400" />
                            <span className="text-white">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 ${
                  showFilters 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <Filter className="h-5 w-5" />
                <span className="font-medium">Advanced Filters</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expandable Filter Section */}
            <div className={`transition-all duration-500 overflow-hidden ${
              showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Status Filters */}
                  <div>
                    <Typography variant="cardTitle" className="mb-4 text-blue-400">Verification Status</Typography>
                    <div className="space-y-2">
                      {[
                        { key: 'all', label: 'All Content', icon: Layers },
                        { key: 'authentic', label: 'Authentic', icon: CheckCircle, color: 'text-green-400' },
                        { key: 'fake', label: 'AI Generated', icon: Shield, color: 'text-red-400' },
                        { key: 'suspicious', label: 'Suspicious', icon: AlertTriangle, color: 'text-yellow-400' }
                      ].map(({ key, label, icon: Icon, color = 'text-gray-400' }) => (
                        <button
                          key={key}
                          onClick={() => setSelectedFilter(key)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                            selectedFilter === key
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/30 border border-transparent'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${selectedFilter === key ? 'text-blue-400' : color}`} />
                          <span className="font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Type */}
                  <div>
                    <Typography variant="cardTitle" className="mb-4 text-purple-400">Content Type</Typography>
                    <div className="space-y-2">
                      {[
                        { key: 'all', label: 'All Media', icon: Layers },
                        { key: 'video', label: 'Videos', icon: Play },
                        { key: 'image', label: 'Images', icon: Eye }
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setContentTypeFilter(key)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                            contentTypeFilter === key
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/30 border border-transparent'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort & View Options */}
                  <div>
                    <Typography variant="cardTitle" className="mb-4 text-cyan-400">Sort & View</Typography>
                    <div className="space-y-4">
                      {/* Sort Options */}
                      <div className="space-y-2">
                        {[
                          { key: 'recent', label: 'Latest', icon: Clock },
                          { key: 'popular', label: 'Most Popular', icon: Flame },
                          { key: 'confidence', label: 'Highest Rated', icon: Star },
                          { key: 'relevance', label: 'Most Relevant', icon: TrendingUp }
                        ].map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() => setSortBy(key)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                              sortBy === key
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/30 border border-transparent'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{label}</span>
                          </button>
                        ))}
                      </div>

                      {/* View Mode */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                            viewMode === 'grid'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/30 border border-transparent'
                          }`}
                        >
                          <Grid className="h-4 w-4" />
                          <span className="text-sm font-medium">Grid</span>
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                            viewMode === 'list'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/30 border border-transparent'
                          }`}
                        >
                          <List className="h-4 w-4" />
                          <span className="text-sm font-medium">List</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Stats Bar */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-400 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/30 rounded-xl backdrop-blur-sm">
                <Database className="h-4 w-4 text-blue-400" />
                <span className="numeric-text font-bold">{stats.total_public_items || 0}</span>
                <span>items</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/30 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="numeric-text font-bold">{stats.authentic_count || 0}</span>
                <span>authentic</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/30 rounded-xl backdrop-blur-sm">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="numeric-text font-bold">{stats.fake_count || 0}</span>
                <span>AI-generated</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/30 rounded-xl backdrop-blur-sm">
                <Eye className="h-4 w-4 text-cyan-400" />
                <span className="numeric-text font-bold">{formatViews(stats.total_views || 0)}</span>
                <span>views</span>
              </div>
            </div>

            {/* Search Results Info */}
            {searchQuery.trim() && (
              <div className="flex justify-center mb-8">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-6 py-3">
                  <Typography variant="body" className="text-blue-400">
                    <span className="numeric-text font-bold">{filteredItems.length}</span> results for "{searchQuery}"
                    {filteredItems.length === 0 && (
                      <span className="text-gray-400 ml-2">- Try different keywords or check filters</span>
                    )}
                  </Typography>
                </div>
              </div>
            )}

           
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="bg-gray-800/30 rounded-2xl overflow-hidden border border-gray-700 animate-pulse">
                  <div className="aspect-video bg-gray-700" />
                  <div className="p-4 space-y-3">
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
                No content found
              </Heading>
              <Typography variant="body" color="secondary" className="mb-6">
                {searchQuery.trim() 
                  ? `No results found for "${searchQuery}". Try different keywords or adjust your filters.`
                  : 'No content matches your current filters. Try adjusting your search criteria.'
                }
              </Typography>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                    setContentTypeFilter('all');
                    handleSearchSubmit('');
                  }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => handleSearchSubmit('deepfake')}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Try "deepfake"
                </button>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-gray-800/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-gray-600 transition-all duration-300 group hover:transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      {/* Media Preview */}
                      <div className="relative aspect-video overflow-hidden bg-gray-900">
                        {renderMediaPreview(item)}
                        
                        {/* Content Type Badge */}
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                          {isVideo(item.content_type) ? '🎥' : '🖼️'}
                        </div>
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(item.verification_status)}`}>
                            {getStatusIcon(item.verification_status)}
                            <span className="capitalize">{item.verification_status}</span>
                          </div>
                        </div>

                        {/* View Count */}
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span className="numeric-text">{formatViews(item.view_count)}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-blue-400">
                            <span className="numeric-text text-lg font-bold">{item.confidence_score.toFixed(1)}%</span>
                          </div>
                          <div className="text-gray-400 text-xs">
                            {item.ai_probability ? (
                              <span>AI: <span className="numeric-text">{item.ai_probability.toFixed(1)}%</span></span>
                            ) : null}
                          </div>
                        </div>

                        {/* Tags Display */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/30 truncate">
                                  #{tag}
                                </span>
                              ))}
                              {item.tags.length > 2 && (
                                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                                  +{item.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Risk Factors Preview */}
                        {item.risk_factors && item.risk_factors.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {item.risk_factors.slice(0, 1).map((factor, index) => (
                                <span key={index} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/30 truncate">
                                  {factor.length > 15 ? factor.substring(0, 15) + '...' : factor}
                                </span>
                              ))}
                              {item.risk_factors.length > 1 && (
                                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                                  +{item.risk_factors.length - 1}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Processing Time */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-yellow-400" />
                            <span className="numeric-text">{item.processing_time.toFixed(1)}s</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Brain className="h-3 w-3 text-purple-400" />
                            <span>AI Check</span>
                          </div>
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
                      className="bg-gray-800/20 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300 group cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex flex-col md:flex-row gap-6 p-6">
                        {/* Media Preview */}
                        <div className="relative w-full md:w-80 aspect-video overflow-hidden rounded-xl flex-shrink-0 bg-gray-900">
                          {renderMediaPreview(item)}
                          
                          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span className="numeric-text">{formatViews(item.view_count)}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <Typography variant="h3" className="text-blue-400">
                                <span className="numeric-text">{item.confidence_score.toFixed(1)}%</span> Confidence
                              </Typography>
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getStatusColor(item.verification_status)}`}>
                                {getStatusIcon(item.verification_status)}
                                <span className="capitalize">{item.verification_status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mb-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-4 w-4" />
                              <span className="numeric-text">{item.confidence_score.toFixed(1)}%</span> accuracy
                            </div>
                            {item.ai_probability && (
                              <div className="flex items-center gap-1">
                                <Brain className="h-4 w-4 text-red-400" />
                                <span className="numeric-text">{item.ai_probability.toFixed(1)}%</span> AI probability
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Zap className="h-4 w-4 text-yellow-400" />
                              <span className="numeric-text">{item.processing_time.toFixed(1)}s</span> analysis
                            </div>
                          </div>

                          {/* Tags Display */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="mb-4">
                              <Typography variant="caption" color="secondary" className="mb-2 block">
                                Tags:
                              </Typography>
                              <div className="flex flex-wrap gap-2">
                                {item.tags.slice(0, 5).map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/30">
                                    #{tag}
                                  </span>
                                ))}
                                {item.tags.length > 5 && (
                                  <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                                    +{item.tags.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

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
                                <span className="text-blue-400">Click to view full analysis</span>
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(item);
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-colors text-sm"
                              >
                                View Analysis
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFile(item);
                                }}
                                className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors"
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
                    Load More Content
                  </button>
                </div>
              )}

              {/* Loading More Indicator */}
              {isLoading && filteredItems.length > 0 && (
                <div className="text-center mt-12">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 rounded-2xl">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <Typography variant="body" color="secondary">
                      Loading more content...
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
                  <span className="numeric-text">{selectedItem.confidence_score.toFixed(1)}%</span> Confidence
                </Typography>
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
                  {/* Analysis Metrics */}
                  <div>
                    <Typography variant="cardTitle" className="mb-4">Analysis Results</Typography>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence Score</span>
                        <span className="numeric-text text-blue-400 font-bold">{selectedItem.confidence_score.toFixed(1)}%</span>
                      </div>
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
                      <div className="flex justify-between">
                        <span className="text-gray-400">Processing Time</span>
                        <span className="numeric-text">{selectedItem.processing_time.toFixed(1)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Views</span>
                        <span className="numeric-text">{formatViews(selectedItem.view_count)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div>
                      <Typography variant="cardTitle" className="mb-3">Tags</Typography>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-sm border border-blue-500/30">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {selectedItem.risk_factors && selectedItem.risk_factors.length > 0 && (
                    <div>
                      <Typography variant="cardTitle" className="mb-3">Risk Factors</Typography>
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
                      <Typography variant="cardTitle" className="mb-3">Recommendations</Typography>
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
                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={() => downloadFile(selectedItem)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="h-5 w-5" />
                      Download File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Library;