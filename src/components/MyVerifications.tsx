import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Search, Filter, Grid, List, Play, Eye, Calendar, User, ChevronDown, X, SlidersHorizontal, Image as ImageIcon, Video, Shield, AlertTriangle, CheckCircle, Brain, Clock, Download, Share2, FileDown, Maximize, Trash2, Menu, Plus } from 'lucide-react';
import { Typography, Heading, CardSubtitle } from './Typography';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/database';
import { getPublicUrl } from '../lib/storage';
import { getVerificationDisplay, getStatusBadgeClasses, formatConfidence, getRecommendationText } from '../utils/verificationDisplayUtils';
import { usageLimits } from '../lib/usageLimits';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import UsageLimitsDisplay from './UsageLimitsDisplay';

// Helper function to format dates
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

interface VerificationItem {
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
  file_url: string;
  storage_bucket: string;
  storage_path: string;
  thumbnail_path: string;
  is_public_library_item: boolean;
  // AI or Not API specific fields
  report_id?: string;
  api_verdict?: string;
  generator_analysis?: any;
  facets?: any;
  raw_api_response?: any;
}

const MyVerifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenMediaUrl, setFullscreenMediaUrl] = useState<string | null>(null);
  const [fullscreenIsVideo, setFullscreenIsVideo] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    item: VerificationItem | null;
    loading: boolean;
  }>({
    isOpen: false,
    item: null,
    loading: false
  });

  // Load user's verifications
  useEffect(() => {
    const loadVerifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        console.log('🔍 Loading user verifications...');
        
        const { data, error } = await db.verifications.getByUser(user.id, 50, 0);

        if (error) {
          console.error('❌ Error loading verifications:', error);
          setError('Failed to load your verifications');
          setItems([]);
        } else {
          console.log(`✅ Loaded ${data?.length || 0} verifications`);
          setItems(data || []);
        }
      } catch (err) {
        console.error('❌ Exception loading verifications:', err);
        setError('Failed to load your verifications');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadVerifications();
  }, [user]);

  // Handle escape key for fullscreen and mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFullscreen) {
          setShowFullscreen(false);
        } else if (showMobileMenu) {
          setShowMobileMenu(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showFullscreen, showMobileMenu]);

  // Filter items based on search and filters
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.verification_status === statusFilter;
    
    const matchesContentType = contentTypeFilter === 'all' || 
      (contentTypeFilter === 'video' && item.content_type.startsWith('video/')) ||
      (contentTypeFilter === 'image' && item.content_type.startsWith('image/'));
    
    return matchesSearch && matchesStatus && matchesContentType;
  });

  // Get media URL for preview
  const getMediaUrl = (item: VerificationItem): string | null => {
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

  // Handle content download with unique filename
  const handleDownloadContent = async (item: VerificationItem) => {
    try {
      const mediaUrl = getMediaUrl(item);
      if (!mediaUrl) {
        alert('Content not available for download');
        return;
      }

      // Generate unique filename
      const originalName = item.original_filename || item.file_name || 'content';
      const fileExtension = originalName.split('.').pop() || '';
      const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
      const cleanBaseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_'); // Clean for URL safety
      const uniqueFilename = `${cleanBaseName}_${item.id.substring(0, 8)}.${fileExtension}`;

      console.log('Starting download for:', uniqueFilename);
      
      // Fetch the content as a blob to force download
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create download link with blob URL
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = uniqueFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL to free memory
      URL.revokeObjectURL(blobUrl);

      console.log('Content download completed:', uniqueFilename);
    } catch (error) {
      console.error('Failed to download content:', error);
      alert('Failed to download content. The file may be too large or temporarily unavailable. Please try again.');
    }
  };

  // Handle fullscreen viewing
  const handleFullscreenView = (item: VerificationItem) => {
    const mediaUrl = getMediaUrl(item);
    if (!mediaUrl) return;

    setFullscreenMediaUrl(mediaUrl);
    setFullscreenIsVideo(isVideo(item.content_type));
    setShowFullscreen(true);
  };

  // Handle delete verification
  const handleDeleteVerification = async (item: VerificationItem) => {
    setDeleteConfirmation({
      isOpen: true,
      item,
      loading: false
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.item) return;

    setDeleteConfirmation(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await db.verifications.delete(deleteConfirmation.item.id);
      
      if (error) {
        console.error('Failed to delete verification:', error);
        alert('Failed to delete verification. Please try again.');
      } else {
        // Remove from local state
        setItems(prev => prev.filter(item => item.id !== deleteConfirmation.item!.id));
        console.log('Verification deleted successfully');
      }
    } catch (err) {
      console.error('Exception deleting verification:', err);
      alert('Failed to delete verification. Please try again.');
    } finally {
      setDeleteConfirmation({
        isOpen: false,
        item: null,
        loading: false
      });
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

  // Generate PDF report
  const generatePDFReport = async (item: VerificationItem) => {
    const verificationDisplay = getVerificationDisplay(
      item.ai_probability,
      item.human_probability,
      item.verification_status
    );

    const reportContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">Fictus AI Verification Report</h1>
          <p style="color: #666; margin: 0;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">File Information</h2>
          <p><strong>Original Filename:</strong> ${item.original_filename || item.file_name}</p>
          <p><strong>Content Type:</strong> ${item.content_type}</p>
          <p><strong>File Size:</strong> ${formatFileSize(item.file_size)}</p>
          <p><strong>Verification Date:</strong> ${formatDate(item.created_at)}</p>
          <p><strong>Report ID:</strong> ${item.report_id || item.id}</p>
        </div>
        
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Verification Results</h2>
          <p><strong>Status:</strong> <span style="color: ${verificationDisplay.status === 'authentic' ? '#10B981' : '#EF4444'};">${verificationDisplay.displayStatus}</span></p>
          <p><strong>Confidence Score:</strong> ${formatConfidence(item.confidence_score)}</p>
          <p><strong>AI Probability:</strong> ${formatConfidence(item.ai_probability)}</p>
          <p><strong>Human Probability:</strong> ${formatConfidence(item.human_probability)}</p>
          <p><strong>Processing Time:</strong> ${item.processing_time.toFixed(2)} seconds</p>
        </div>
        
        ${item.risk_factors && item.risk_factors.length > 0 ? `
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Risk Factors</h2>
          <ul style="margin: 0; padding-left: 20px;">
            ${item.risk_factors.map(factor => `<li style="margin-bottom: 5px;">${factor}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${item.recommendations && item.recommendations.length > 0 ? `
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Recommendations</h2>
          <ul style="margin: 0; padding-left: 20px;">
            ${item.recommendations.map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>This report was generated by Fictus AI verification system.</p>
          <p>For questions about this report, please contact support@fictus.ai</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `fictus-ai-report-${item.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(reportContent).save();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  // Share verification result
  const shareVerification = async (item: VerificationItem) => {
    const verificationDisplay = getVerificationDisplay(
      item.ai_probability,
      item.human_probability,
      item.verification_status
    );

    const shareText = `Check out my AI verification result: ${verificationDisplay.displayStatus} with ${formatConfidence(item.confidence_score)} confidence. Verified by Fictus AI.`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Fictus AI Verification Result',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Verification details copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        alert('Failed to copy details. Please try again.');
      }
    }
  };

  // Toggle public sharing
  const togglePublicSharing = async (item: VerificationItem) => {
    if (!user) return;

    try {
      const newStatus = !item.is_public_library_item;
      const { error } = await db.verifications.togglePublicSharing(item.id, user.id, newStatus);
      
      if (error) {
        console.error('Failed to toggle sharing:', error);
        alert('Failed to update sharing status. Please try again.');
      } else {
        // Update local state
        setItems(prev => prev.map(i => 
          i.id === item.id 
            ? { ...i, is_public_library_item: newStatus }
            : i
        ));
        console.log(`Verification ${newStatus ? 'shared to' : 'removed from'} public library`);
      }
    } catch (err) {
      console.error('Exception toggling sharing:', err);
      alert('Failed to update sharing status. Please try again.');
    }
  };

  // Render media preview
  const renderMediaPreview = (item: VerificationItem) => {
    const mediaUrl = getMediaUrl(item);
    
    if (!mediaUrl) {
      return (
        <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              {isVideo(item.content_type) ? (
                <Video className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
              ) : (
                <ImageIcon className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
              )}
            </div>
            <Typography variant="caption" color="secondary" className="text-xs sm:text-sm">
              Preview not available
            </Typography>
          </div>
        </div>
      );
    }

    if (isVideo(item.content_type)) {
      return (
        <div className="relative w-full h-32 sm:h-40 md:h-48 bg-gray-900 rounded-lg overflow-hidden group">
          <video 
            src={mediaUrl}
            poster={item.thumbnail_path ? getPublicUrl('verification-thumbnails', item.thumbnail_path) : undefined}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3">
              <Play className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative w-full h-32 sm:h-40 md:h-48 bg-gray-900 rounded-lg overflow-hidden group">
          <img
            src={mediaUrl}
            alt={item.original_filename || item.file_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3">
              <Eye className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
      );
    }
  };

  // Render media preview for modal with fullscreen button
  const renderModalMediaContent = (item: VerificationItem) => {
    const mediaUrl = getMediaUrl(item);
    
    if (!mediaUrl) {
      return (
        <div className="w-full h-48 sm:h-64 lg:h-80 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              {isVideo(item.content_type) ? (
                <Video className="h-6 w-6 text-gray-400" />
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <Typography variant="caption" color="secondary">
              Preview not available
            </Typography>
          </div>
        </div>
      );
    }

    if (isVideo(item.content_type)) {
      return (
        <div className="relative w-full h-48 sm:h-64 lg:h-80 bg-gray-900 rounded-lg overflow-hidden group">
          <video 
            src={mediaUrl}
            poster={item.thumbnail_path ? getPublicUrl('verification-thumbnails', item.thumbnail_path) : undefined}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          />
          
          {/* Fullscreen Button */}
          <button
            onClick={() => handleFullscreenView(item)}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-black/60 hover:bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
            title="View fullscreen"
          >
            <Maximize className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </button>
        </div>
      );
    } else {
      return (
        <div className="relative w-full h-48 sm:h-64 lg:h-80 bg-gray-900 rounded-lg overflow-hidden group">
          <img
            src={mediaUrl}
            alt={item.original_filename || item.file_name}
            className="w-full h-full object-cover cursor-pointer"
            loading="lazy"
            onClick={() => handleFullscreenView(item)}
          />
          
          {/* Fullscreen Button */}
          <button
            onClick={() => handleFullscreenView(item)}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-black/60 hover:bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
            title="View fullscreen"
          >
            <Maximize className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </button>
        </div>
      );
    }
  };

  // Render grid item
  const renderGridItem = (item: VerificationItem) => {
    const verificationDisplay = getVerificationDisplay(
      item.ai_probability,
      item.human_probability,
      item.verification_status
    );

    return (
      <div
        key={item.id}
        className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 cursor-pointer group hover:transform hover:scale-105"
        onClick={() => setSelectedItem(item)}
      >
        {/* Media Preview */}
        {renderMediaPreview(item)}

        {/* Content */}
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full border text-xs sm:text-sm font-medium mb-3 sm:mb-4 ${getStatusBadgeClasses(verificationDisplay.status)}`}>
            {verificationDisplay.status === 'authentic' ? (
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="truncate">{verificationDisplay.displayStatus}</span>
          </div>

          {/* Filename */}
          <Typography variant="cardTitle" className="mb-2 text-sm sm:text-base truncate" title={item.original_filename || item.file_name}>
            {item.original_filename || item.file_name}
          </Typography>

          {/* Overall Assessment */}
          <Typography variant="cardCaption" color="secondary" className="mb-3 sm:mb-4 text-xs sm:text-sm line-clamp-2">
            {verificationDisplay.qualitativeStatus}
          </Typography>

          {/* Public Sharing Status */}
          {item.is_public_library_item && (
            <div className="mb-3 sm:mb-4">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs">
                <Shield className="h-3 w-3" />
                <span>Public</span>
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-center">
              <Typography variant="caption" color="secondary" className="text-xs">Confidence</Typography>
              <Typography variant="caption" className="font-medium numeric-text text-xs">
                {formatConfidence(item.confidence_score)}
              </Typography>
            </div>
            <div className="flex justify-between items-center">
              <Typography variant="caption" color="secondary" className="text-xs">Processing Time</Typography>
              <Typography variant="caption" className="font-medium numeric-text text-xs">
                {item.processing_time.toFixed(2)}s
              </Typography>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <Typography variant="caption" className="text-xs">
                {formatDate(item.created_at)}
              </Typography>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render list item
  const renderListItem = (item: VerificationItem) => {
    const verificationDisplay = getVerificationDisplay(
      item.ai_probability,
      item.human_probability,
      item.verification_status
    );

    return (
      <div
        key={item.id}
        className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 cursor-pointer p-3 sm:p-4 lg:p-6"
        onClick={() => setSelectedItem(item)}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          {/* Media Preview */}
          <div className="w-full sm:w-20 md:w-24 flex-shrink-0">
            <div className="w-full sm:w-20 md:w-24 h-16 sm:h-20 md:h-24">
              {renderMediaPreview(item)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2 sm:gap-4">
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full border text-xs sm:text-sm font-medium ${getStatusBadgeClasses(verificationDisplay.status)}`}>
                {verificationDisplay.status === 'authentic' ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span className="truncate">{verificationDisplay.displayStatus}</span>
              </div>
              {/* Date */}
              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-400 flex-shrink-0">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{formatDate(item.created_at)}</span>
              </div>
            </div>

            {/* Filename */}
            <Typography variant="cardTitle" className="mb-2 text-sm sm:text-base truncate" title={item.original_filename || item.file_name}>
              {item.original_filename || item.file_name}
            </Typography>

            {/* Overall Assessment */}
            <Typography variant="cardCaption" color="secondary" className="mb-3 sm:mb-4 text-xs sm:text-sm line-clamp-2">
              {verificationDisplay.qualitativeStatus}
            </Typography>

            {/* Public Sharing Status */}
            {item.is_public_library_item && (
              <div className="mb-3 sm:mb-4">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs">
                  <Shield className="h-3 w-3" />
                  <span>Shared Publicly</span>
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="numeric-text">{formatConfidence(item.confidence_score)} confidence</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="numeric-text">{item.processing_time.toFixed(2)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <Typography variant="h3" className="mb-2">
              Sign In Required
            </Typography>
            <Typography variant="body" color="secondary" className="mb-6">
              Please sign in to view your verifications
            </Typography>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6 sm:hidden">
          <Heading level={2} className="text-xl">
            My Verifications
          </Heading>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 bg-gray-800 rounded-lg border border-gray-700"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:block mb-8">
          <div className="text-center mb-6">
            <Heading level={1} className="mb-4">
              My Verifications
            </Heading>
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto">
              Manage and review all your AI verification results
            </Typography>
          </div>
        </div>

        {/* Usage Limits Display */}
        <div className="mb-6 sm:mb-8">
          <UsageLimitsDisplay compact={true} showTitle={false} />
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 sm:hidden">
            <div className="bg-gray-900 h-full w-80 max-w-[90vw] border-r border-gray-700 p-4">
              <div className="flex items-center justify-between mb-6">
                <Typography variant="h3">Menu</Typography>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search verifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mobile Filters */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="authentic">Authentic</option>
                    <option value="fake">AI Generated</option>
                    <option value="suspicious">Suspicious</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content Type
                  </label>
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="video">Videos</option>
                    <option value="image">Images</option>
                  </select>
                </div>
              </div>

              {/* Mobile View Mode */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  View Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setViewMode('grid');
                      setShowMobileMenu(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                    <span>Grid</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('list');
                      setShowMobileMenu(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    <span>List</span>
                  </button>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigate('/verify');
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Verification</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Search and Filters */}
        <div className="hidden sm:block space-y-4 mb-8">
          {/* Search Bar */}
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* New Verification Button */}
              <button
                onClick={() => navigate('/verify')}
                className="flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>New Verification</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex justify-center">
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-700/30 transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                <Typography variant="cardCaption">Filters</Typography>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <div className="px-4 pb-4 border-t border-gray-700/50 min-w-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Verification Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="authentic">Authentic</option>
                        <option value="fake">AI Generated</option>
                        <option value="suspicious">Suspicious</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Content Type
                      </label>
                      <select
                        value={contentTypeFilter}
                        onChange={(e) => setContentTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="all">All Types</option>
                        <option value="video">Videos</option>
                        <option value="image">Images</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-4'}`}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden animate-pulse">
                <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-700" />
                <div className="p-3 sm:p-4 lg:p-6 space-y-4">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                  <div className="h-6 bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <Typography variant="h3" className="mb-2 text-red-400">
              Error Loading Verifications
            </Typography>
            <Typography variant="body" color="secondary">
              {error}
            </Typography>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <Typography variant="h3" className="mb-2">
              {items.length === 0 ? 'No Verifications Yet' : 'No Items Found'}
            </Typography>
            <Typography variant="body" color="secondary" className="mb-6">
              {items.length === 0 
                ? 'Start by verifying your first video or image'
                : 'Try adjusting your search or filters'
              }
            </Typography>
            {items.length === 0 && (
              <button
                onClick={() => navigate('/verify')}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Verify Content
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
              : 'space-y-4'
          }>
            {filteredItems.map(item => 
              viewMode === 'grid' ? renderGridItem(item) : renderListItem(item)
            )}
          </div>
        )}

        {/* Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in-scale">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
                <div className="flex-1 min-w-0">
                  <Typography variant="h3" className="mb-2 text-lg sm:text-xl">
                    Verification Details
                  </Typography>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <Typography variant="caption">
                        {formatDate(selectedItem.created_at)}
                      </Typography>
                    </div>
                    <Typography variant="caption" className="truncate" title={selectedItem.original_filename || selectedItem.file_name}>
                      {selectedItem.original_filename || selectedItem.file_name}
                    </Typography>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Media Preview */}
                  <div>
                    <div className="w-full">
                      {/* File Type and Size */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        {isVideo(selectedItem.content_type) ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                        <Typography variant="caption">
                          {formatFileSize(selectedItem.file_size)}
                        </Typography>
                      </div>

                      {renderModalMediaContent(selectedItem)}
                    </div>
                  </div>

                  {/* Verification Details */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Status */}
                    <div>
                      <Typography variant="h4" className="mb-3 text-base sm:text-lg">Verification Status</Typography>
                      {(() => {
                        const verificationDisplay = getVerificationDisplay(
                          selectedItem.ai_probability,
                          selectedItem.human_probability,
                          selectedItem.verification_status
                        );
                        return (
                          <div className={`inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg border ${getStatusBadgeClasses(verificationDisplay.status)}`}>
                            {verificationDisplay.status === 'authentic' ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                            <span className="font-medium text-sm sm:text-base">{verificationDisplay.displayStatus}</span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gray-800/30 rounded-lg p-3 sm:p-4 border border-gray-700">
                        <Typography variant="cardCaption" color="secondary" className="mb-1 text-xs sm:text-sm">
                          Confidence Score
                        </Typography>
                        <Typography variant="cardTitle" className="numeric-text text-sm sm:text-base">
                          {formatConfidence(selectedItem.confidence_score)}
                        </Typography>
                      </div>
                      <div className="bg-gray-800/30 rounded-lg p-3 sm:p-4 border border-gray-700">
                        <Typography variant="cardCaption" color="secondary" className="mb-1 text-xs sm:text-sm">
                          Processing Time
                        </Typography>
                        <Typography variant="cardTitle" className="numeric-text text-sm sm:text-base">
                          {selectedItem.processing_time.toFixed(2)}s
                        </Typography>
                      </div>
                    </div>

                    {/* Public Sharing Toggle */}
                    <div>
                      <Typography variant="h4" className="mb-3 text-base sm:text-lg">Public Sharing</Typography>
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                        <div>
                          <Typography variant="cardTitle" className="mb-1 text-sm sm:text-base">
                            Share in Public Library
                          </Typography>
                          <Typography variant="cardCaption" color="secondary" className="text-xs sm:text-sm">
                            Allow others to see this verification result
                          </Typography>
                        </div>
                        <button
                          onClick={() => togglePublicSharing(selectedItem)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                            selectedItem.is_public_library_item ? 'bg-blue-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              selectedItem.is_public_library_item ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Risk Factors */}
                    {selectedItem.risk_factors && selectedItem.risk_factors.length > 0 && (
                      <div>
                        <Typography variant="h4" className="mb-3 text-base sm:text-lg">Risk Factors</Typography>
                        <div className="space-y-2">
                          {selectedItem.risk_factors.map((factor: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <Typography variant="cardCaption" className="text-red-400 text-xs sm:text-sm">
                                {factor}
                              </Typography>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {selectedItem.recommendations && selectedItem.recommendations.length > 0 && (
                      <div>
                        <Typography variant="h4" className="mb-3 text-base sm:text-lg">Recommendations</Typography>
                        <div className="space-y-2">
                          {selectedItem.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <Typography variant="cardCaption" className="text-blue-400 text-xs sm:text-sm">
                                {rec}
                              </Typography>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                      <button
                        onClick={() => handleDownloadContent(selectedItem)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                      >
                        <FileDown className="h-4 w-4" />
                        Download Content
                      </button>
                      <button
                        onClick={() => generatePDFReport(selectedItem)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                      >
                        <Download className="h-4 w-4" />
                        Download Report
                      </button>
                      <button
                        onClick={() => shareVerification(selectedItem)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </button>
                      <button
                        onClick={() => handleDeleteVerification(selectedItem)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Media Viewer */}
        {showFullscreen && fullscreenMediaUrl && (
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowFullscreen(false);
              }
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10"
              title="Close fullscreen"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Media Content */}
            <div className="w-full h-full flex items-center justify-center">
              {fullscreenIsVideo ? (
                <video
                  src={fullscreenMediaUrl}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={fullscreenMediaUrl}
                  alt="Fullscreen view"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
              <Typography variant="caption" color="secondary" className="bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm">
                Press ESC or click outside to close
              </Typography>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, item: null, loading: false })}
          onConfirm={confirmDelete}
          title="Delete Verification"
          message={`Are you sure you want to delete this verification? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          loading={deleteConfirmation.loading}
        />
      </div>
    </div>
  );
};

export default MyVerifications;