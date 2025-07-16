import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Play, Eye, Calendar, User, Trash2, Download, Share2, AlertTriangle, CheckCircle, Clock, Shield, Brain, Film, Image as ImageIcon, Video, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Typography, Heading } from './Typography';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/database';
import { formatFileSize, getPublicUrl } from '../lib/storage';

interface UserVerification {
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
  is_public_library_item: boolean;
  report_id?: string;
  file_url?: string;
  storage_bucket?: string;
  storage_path?: string;
  thumbnail_path?: string;
  upload_progress?: number;
}

const MyVerifications = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<UserVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItem, setSelectedItem] = useState<UserVerification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [verificationToDelete, setVerificationToDelete] = useState<UserVerification | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // Generate download filename with original name preserved for user's own files
  const getDownloadFilename = (verification: UserVerification): string => {
    // For user's own files, preserve original filename
    return verification.original_filename || verification.file_name || 'download';
  };

  // Load user's verifications
  const loadVerifications = async (page = 0, reset = false) => {
    if (!user) return;

    try {
      setError(null);
      if (reset) {
        setIsLoading(true);
        setVerifications([]);
      }

      const { data, error } = await db.verifications.getByUser(
        user.id,
        ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
      );

      if (error) {
        console.error('Error loading verifications:', error);
        setError('Failed to load your verifications');
        return;
      }

      const items = data || [];
      
      if (reset) {
        setVerifications(items);
      } else {
        setVerifications(prev => [...prev, ...items]);
      }
      
      setHasMore(items.length === ITEMS_PER_PAGE);
      setCurrentPage(page);
    } catch (err) {
      console.error('Exception loading verifications:', err);
      setError('Failed to load your verifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadVerifications(0, true);
    }
  }, [user]);

  // Apply filters and search
  useEffect(() => {
    let filtered = verifications;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(verification =>
        verification.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (verification.original_filename && verification.original_filename.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (verification.report_id && verification.report_id.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(verification => verification.verification_status === selectedFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'confidence':
        filtered.sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.original_filename || a.file_name).localeCompare(b.original_filename || b.file_name));
        break;
      case 'size':
        filtered.sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
        break;
    }

    setFilteredVerifications(filtered);
  }, [verifications, searchQuery, selectedFilter, sortBy]);

  // Toggle public sharing
  const togglePublicSharing = async (verificationId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const { data, error } = await db.verifications.togglePublicSharing(
        verificationId,
        user.id,
        !currentStatus
      );

      if (error) {
        console.error('Error toggling sharing:', error);
        return;
      }

      // Update local state
      setVerifications(prev =>
        prev.map(v =>
          v.id === verificationId
            ? { ...v, is_public_library_item: !currentStatus }
            : v
        )
      );
    } catch (err) {
      console.error('Exception toggling sharing:', err);
    }
  };

  // Delete verification
  const deleteVerification = async (verificationId: string) => {
    const verification = verifications.find(v => v.id === verificationId);
    if (!verification) return;
    
    setVerificationToDelete(verification);
    setShowDeleteModal(true);
  };

  // Confirm delete verification
  const confirmDeleteVerification = async () => {
    if (!verificationToDelete) return;

    try {
      setDeleteLoading(true);
      
      const { error } = await db.verifications.delete(verificationToDelete.id);

      if (error) {
        console.error('Error deleting verification:', error);
        return;
      }

      // Remove from local state
      setVerifications(prev => prev.filter(v => v.id !== verificationToDelete.id));
      
      // Close modal
      setShowDeleteModal(false);
      setVerificationToDelete(null);
    } catch (err) {
      console.error('Exception deleting verification:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (!deleteLoading) {
      setShowDeleteModal(false);
      setVerificationToDelete(null);
    }
  };

  // Handle item click to open modal
  const handleItemClick = (verification: UserVerification) => {
    setSelectedItem(verification);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Get media URL for preview
  const getMediaUrl = (verification: UserVerification): string | null => {
    // Priority: thumbnail_path > file_url > constructed public URL
    if (verification.thumbnail_path) {
      return getPublicUrl('verification-thumbnails', verification.thumbnail_path);
    }
    
    if (verification.file_url) {
      return verification.file_url;
    }
    
    if (verification.storage_bucket && verification.storage_path) {
      return getPublicUrl(verification.storage_bucket, verification.storage_path);
    }
    
    return null;
  };

  // Get full quality media URL for modal
  const getFullMediaUrl = (verification: UserVerification): string | null => {
    // Priority: file_url > constructed public URL > thumbnail
    if (verification.file_url) {
      return verification.file_url;
    }
    
    if (verification.storage_bucket && verification.storage_path) {
      return getPublicUrl(verification.storage_bucket, verification.storage_path);
    }
    
    if (verification.thumbnail_path) {
      return getPublicUrl('verification-thumbnails', verification.thumbnail_path);
    }
    
    return null;
  };

  // Download file with original filename preserved
  const downloadFile = async (verification: UserVerification) => {
    const url = getFullMediaUrl(verification);
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getDownloadFilename(verification); // Keep original filename for user's own files
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
  const renderMediaPreview = (verification: UserVerification) => {
    const mediaUrl = getMediaUrl(verification);
    const thumbnailUrl = verification.thumbnail_path ? getPublicUrl('verification-thumbnails', verification.thumbnail_path) : null;
    
    if (!mediaUrl) {
      // Fallback to placeholder
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          {isVideo(verification.content_type) ? (
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

    if (isVideo(verification.content_type)) {
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
          alt={verification.original_filename || verification.file_name}
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

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Typography variant="h2" className="mb-4">
            Sign In Required
          </Typography>
          <Typography variant="body" color="secondary">
            Please sign in to view your verification history.
          </Typography>
        </div>
      </div>
    );
  }

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
                My Verifications
              </span>
            </Heading>
            
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-xl mb-8 leading-relaxed">
              View and manage all your verification history. Track your uploads, share results with the community, 
              and download detailed analysis reports.
            </Typography>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-center mb-3">
                  <User className="h-6 w-6 text-blue-400 mr-2" />
                  <span className="numeric-text text-2xl text-blue-400 font-bold">{verifications.length}</span>
                </div>
                <Typography variant="caption" color="secondary">Total Verifications</Typography>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-center mb-3">
                  <Globe className="h-6 w-6 text-green-400 mr-2" />
                  <span className="numeric-text text-2xl text-green-400 font-bold">
                    {verifications.filter(v => v.is_public_library_item).length}
                  </span>
                </div>
                <Typography variant="caption" color="secondary">Shared Publicly</Typography>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-center mb-3">
                  <Film className="h-6 w-6 text-purple-400 mr-2" />
                  <span className="numeric-text text-2xl text-purple-400 font-bold">
                    {verifications.filter(v => isVideo(v.content_type)).length}
                  </span>
                </div>
                <Typography variant="caption" color="secondary">Videos</Typography>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-center mb-3">
                  <ImageIcon className="h-6 w-6 text-cyan-400 mr-2" />
                  <span className="numeric-text text-2xl text-cyan-400 font-bold">
                    {verifications.filter(v => isImage(v.content_type)).length}
                  </span>
                </div>
                <Typography variant="caption" color="secondary">Images</Typography>
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
                    placeholder="Search your verifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Status Filter */}
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="all">All Status</option>
                    <option value="authentic">✓ Authentic</option>
                    <option value="suspicious">? Suspicious</option>
                    <option value="fake">⚠ AI Generated</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="processing">🔄 Processing</option>
                    <option value="error">❌ Error</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="recent">🕒 Most Recent</option>
                    <option value="confidence">📊 Highest Confidence</option>
                    <option value="name">📝 Name A-Z</option>
                    <option value="size">📏 File Size</option>
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
                      <span className="numeric-text">{filteredVerifications.length}</span> verifications found
                      {searchQuery && ` for "${searchQuery}"`}
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
                Failed to Load Verifications
              </Heading>
              <Typography variant="body" color="secondary" className="mb-6">
                {error}
              </Typography>
              <button
                onClick={() => loadVerifications(0, true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : isLoading && filteredVerifications.length === 0 ? (
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
          ) : filteredVerifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Search className="h-16 w-16 text-gray-400" />
              </div>
              <Heading level={3} className="mb-4">
                No verifications found
              </Heading>
              <Typography variant="body" color="secondary" className="mb-6">
                {searchQuery || selectedFilter !== 'all' 
                  ? 'No verifications match your current filters. Try adjusting your search or filters.'
                  : 'You haven\'t verified any content yet. Upload your first video or image to get started!'
                }
              </Typography>
              {!searchQuery && selectedFilter === 'all' && (
                <button
                  onClick={() => window.location.href = '#verify'}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Verify Your First File
                </button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVerifications.map((verification) => (
                    <div 
                      key={verification.id} 
                      className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300 group hover:transform hover:scale-105 cursor-pointer"
                      onClick={() => handleItemClick(verification)}
                    >
                      {/* Media Preview */}
                      <div className="relative aspect-video overflow-hidden bg-gray-900">
                        {renderMediaPreview(verification)}
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(verification.verification_status)}`}>
                            {getStatusIcon(verification.verification_status)}
                            <span className="capitalize">{verification.verification_status}</span>
                          </div>
                        </div>

                        {/* Sharing Status */}
                        <div className="absolute top-2 right-2">
                          {verification.is_public_library_item ? (
                            <div className="bg-green-500/20 border border-green-500/30 px-2 py-1 rounded-full text-xs text-green-400 flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span>Public</span>
                            </div>
                          ) : (
                            <div className="bg-gray-500/20 border border-gray-500/30 px-2 py-1 rounded-full text-xs text-gray-400 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              <span>Private</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar for Processing */}
                        {verification.verification_status === 'uploading' && verification.upload_progress !== undefined && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${verification.upload_progress}%` }}
                              />
                            </div>
                            <Typography variant="caption" className="text-xs text-center mt-1">
                              Uploading... {verification.upload_progress}%
                            </Typography>
                          </div>
                        )}
                      </div>

                      {/* Content - Simplified */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-blue-400">
                            <span className="numeric-text text-lg font-bold">
                              {verification.confidence_score != null ? `${verification.confidence_score.toFixed(1)}%` : 'Processing...'}
                            </span>
                          </div>
                          <div className="text-gray-400 text-xs">
                            {verification.ai_probability ? (
                              <span>AI: <span className="numeric-text">{verification.ai_probability.toFixed(1)}%</span></span>
                            ) : null}
                          </div>
                        </div>

                        {/* Show original filename for user's own files */}
                        <Typography variant="cardTitle" className="mb-2 truncate">
                          {verification.original_filename || verification.file_name}
                        </Typography>

                        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                          <span className="numeric-text">{formatFileSize(verification.file_size || 0)}</span>
                          <span>{formatDate(verification.created_at)}</span>
                        </div>

                        {/* Risk Factors Preview */}
                        {verification.risk_factors && verification.risk_factors.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {verification.risk_factors.slice(0, 2).map((factor, index) => (
                                <span key={index} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/30 truncate">
                                  {factor.length > 15 ? factor.substring(0, 15) + '...' : factor}
                                </span>
                              ))}
                              {verification.risk_factors.length > 2 && (
                                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                                  +{verification.risk_factors.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(verification);
                            }}
                            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePublicSharing(verification.id, verification.is_public_library_item);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              verification.is_public_library_item
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            title={verification.is_public_library_item ? 'Remove from public library' : 'Share to public library'}
                          >
                            <Globe className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteVerification(verification.id);
                            }}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                            title="Delete verification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVerifications.map((verification) => (
                    <div 
                      key={verification.id} 
                      className="bg-gray-800/30 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 group cursor-pointer"
                      onClick={() => handleItemClick(verification)}
                    >
                      <div className="flex flex-col md:flex-row gap-6 p-6">
                        {/* Media Preview */}
                        <div className="relative w-full md:w-80 aspect-video overflow-hidden rounded-lg flex-shrink-0 bg-gray-900">
                          {renderMediaPreview(verification)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <Typography variant="h3" className="text-blue-400">
                                <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                                  {verification.confidence_score != null ? `${verification.confidence_score.toFixed(1)}%` : 'Processing...'}
                                </span> Confidence
                              </Typography>
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getStatusColor(verification.verification_status)}`}>
                                {getStatusIcon(verification.verification_status)}
                                <span className="capitalize">{verification.verification_status}</span>
                              </div>
                            </div>
                            {verification.is_public_library_item ? (
                              <div className="flex items-center gap-1 text-green-400">
                                <Globe className="h-4 w-4" />
                                <span>Public</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Lock className="h-4 w-4" />
                                <span>Private</span>
                              </div>
                            )}
                          </div>

                          {/* Show original filename for user's own files */}
                          <Typography variant="h4" className="mb-2">
                            {verification.original_filename || verification.file_name}
                          </Typography>

                          <div className="flex items-center gap-6 mb-4 text-sm text-gray-400">
                            {verification.confidence_score != null && (
                              <div className="flex items-center gap-1">
                                <Brain className="h-4 w-4" />
                                <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                                  {verification.confidence_score.toFixed(1)}%
                                </span> confidence
                              </div>
                            )}
                            {verification.processing_time && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-4 w-4 text-yellow-400" />
                                <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                                  {verification.processing_time.toFixed(1)}s
                                </span>
                              </div>
                            )}
                            {verification.ai_probability != null && (
                              <div className="flex items-center gap-1">
                                <Brain className="h-4 w-4 text-red-400" />
                                <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                                  {verification.ai_probability.toFixed(1)}%
                                </span> AI
                              </div>
                            )}
                          </div>

                          {/* Risk Factors Preview */}
                          {verification.risk_factors && verification.risk_factors.length > 0 && (
                            <div className="mb-4">
                              <Typography variant="caption" color="secondary" className="mb-2 block">
                                Risk Factors:
                              </Typography>
                              <div className="flex flex-wrap gap-2">
                                {verification.risk_factors.slice(0, 3).map((factor, index) => (
                                  <span key={index} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/30">
                                    {factor}
                                  </span>
                                ))}
                                {verification.risk_factors.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                                    +{verification.risk_factors.length - 3} more
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
                                  handleItemClick(verification);
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                              >
                                View Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePublicSharing(verification.id, verification.is_public_library_item);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  verification.is_public_library_item
                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                                title={verification.is_public_library_item ? 'Remove from public library' : 'Share to public library'}
                              >
                                <Globe className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFile(verification);
                                }}
                                className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteVerification(verification.id);
                                }}
                                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                                title="Delete verification"
                              >
                                <Trash2 className="h-4 w-4" />
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
                    onClick={() => loadVerifications(currentPage + 1, false)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    Load More Verifications
                  </button>
                </div>
              )}

              {/* Loading More Indicator */}
              {isLoading && filteredVerifications.length > 0 && (
                <div className="text-center mt-12">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 rounded-2xl">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <Typography variant="body" color="secondary">
                      Loading more verifications...
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
                {selectedItem.is_public_library_item && (
                  <div className="flex items-center gap-1 text-green-400">
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                  </div>
                )}
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
                      <div className="flex justify-between">
                        <span className="text-gray-400">File Size</span>
                        <span className="numeric-text">{formatFileSize(selectedItem.file_size || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created</span>
                        <span className="text-sm">{formatDate(selectedItem.created_at)}</span>
                      </div>
                    </div>
                  </div>

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
                  <div className="pt-4 border-t border-gray-700 space-y-3">
                    <button
                      onClick={() => downloadFile(selectedItem)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="h-5 w-5" />
                      Download File
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePublicSharing(selectedItem.id, selectedItem.is_public_library_item)}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          selectedItem.is_public_library_item
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <Globe className="h-4 w-4" />
                        {selectedItem.is_public_library_item ? 'Make Private' : 'Share Public'}
                      </button>
                      
                      <button
                        onClick={() => {
                          deleteVerification(selectedItem.id);
                          closeModal();
                        }}
                        className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteVerification}
        title="Delete Verification"
        message={`Are you sure you want to delete "${verificationToDelete?.original_filename || verificationToDelete?.file_name}"? This action cannot be undone and will permanently remove the verification from your account.`}
        confirmText="Delete Verification"
        cancelText="Keep Verification"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default MyVerifications;