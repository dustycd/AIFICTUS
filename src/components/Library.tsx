import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Search, Filter, Grid, List, Play, Eye, Calendar, User, ChevronDown, X, SlidersHorizontal, Image as ImageIcon, Video, Shield, AlertTriangle, CheckCircle, Brain, Clock, Download, Share2 } from 'lucide-react';
import { Typography, Heading, CardSubtitle } from './Typography';
import { db } from '../lib/database';
import { getPublicUrl } from '../lib/storage';
import { getVerificationDisplay, getStatusBadgeClasses, formatConfidence, getRecommendationText } from '../utils/verificationDisplayUtils';

// Helper function to format dates
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

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
  file_url: string;
  storage_bucket: string;
  storage_path: string;
  thumbnail_path: string;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Load library items
  useEffect(() => {
    const loadLibraryItems = async () => {
      try {
        setError(null);
        console.log('🔍 Loading public library items...');
        
        const { data, error } = await db.verifications.getPublicLibraryItems(
          50, // limit
          0,  // offset
          statusFilter === 'all' ? undefined : statusFilter,
          contentTypeFilter === 'all' ? undefined : contentTypeFilter,
          searchTerm || undefined
        );

        if (error) {
          console.error('❌ Error loading library items:', error);
          setError('Failed to load library items');
          setItems([]);
        } else {
          console.log(`✅ Loaded ${data?.length || 0} library items`);
          setItems(data || []);
        }
      } catch (err) {
        console.error('❌ Exception loading library items:', err);
        setError('Failed to load library items');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadLibraryItems();
  }, [searchTerm, statusFilter, contentTypeFilter]);

  // Load library statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data, error } = await db.library.getStats();
        if (!error && data) {
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load library stats:', err);
      }
    };

    loadStats();
  }, []);

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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  // Generate PDF report
  const generatePDFReport = async (item: LibraryItem) => {
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
          <p><strong>Content Type:</strong> ${item.content_type}</p>
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
  const shareVerification = async (item: LibraryItem) => {
    const verificationDisplay = getVerificationDisplay(
      item.ai_probability,
      item.human_probability,
      item.verification_status
    );

    const shareText = `Check out this AI verification result: ${verificationDisplay.displayStatus} with ${formatConfidence(item.confidence_score)} confidence. Verified by Fictus AI.`;
    const shareUrl = `${window.location.origin}/library?item=${item.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fictus AI Verification Result',
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
        alert('Verification link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        alert('Failed to copy link. Please try again.');
      }
    }
  };

  // Render media preview
  const renderMediaPreview = (item: LibraryItem) => {
    const mediaUrl = getMediaUrl(item);
    
    if (!mediaUrl) {
      return (
        <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
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
        <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden group">
          <video 
            src={mediaUrl}
            poster={item.thumbnail_path ? getPublicUrl('verification-thumbnails', item.thumbnail_path) : undefined}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden group">
          <img
            src={mediaUrl}
            alt={item.original_filename || item.file_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      );
    }
  };

  // Render grid item
  const renderGridItem = (item: LibraryItem) => {
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
        <div className="p-6">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium mb-4 ${getStatusBadgeClasses(verificationDisplay.status)}`}>
            {verificationDisplay.status === 'authentic' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {verificationDisplay.displayStatus}
          </div>

          {/* Overall Assessment */}
          <Typography variant="cardTitle" className="mb-2">
            {verificationDisplay.qualitativeStatus}
          </Typography>
          <Typography variant="cardCaption" color="secondary" className="mb-4">
            {getRecommendationText(verificationDisplay.status, verificationDisplay.qualitativeStatus)}
          </Typography>

          {/* Risk Factors (if any) */}
          {item.risk_factors && item.risk_factors.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <CardSubtitle className="text-red-400">
                  Detected Risk Factors:
                </CardSubtitle>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                {item.risk_factors.slice(0, 2).map((factor, idx) => ( // Limit to 2 for brevity in grid view
                  <li key={idx} className="truncate">{factor}</li>
                ))}
                {item.risk_factors.length > 2 && (
                  <li className="text-blue-400 cursor-pointer">...view all</li>
                )}
              </ul>
            </div>
          )}

          {/* Recommendations (if any) */}
          {item.recommendations && item.recommendations.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <CardSubtitle className="text-green-400">
                  Recommendations:
                </CardSubtitle>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                {item.recommendations.slice(0, 2).map((rec, idx) => ( // Limit to 2 for brevity
                  <li key={idx} className="truncate">{rec}</li>
                ))}
                {item.recommendations.length > 2 && (
                  <li className="text-blue-400 cursor-pointer">...view all</li>
                )}
              </ul>
            </div>
          )}

          {/* Metrics (Confidence and Processing Time) */}
          <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-2">
            <div className="flex justify-between items-center">
              <Typography variant="caption" color="secondary">Confidence</Typography>
              <Typography variant="caption" className="font-medium numeric-text">
                {formatConfidence(item.confidence_score)}
              </Typography>
            </div>
            <div className="flex justify-between items-center">
              <Typography variant="caption" color="secondary">Processing Time</Typography>
              <Typography variant="caption" className="font-medium numeric-text">
                {item.processing_time.toFixed(2)}s
              </Typography>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="h-4 w-4" />
              <Typography variant="caption">
                {formatDate(item.created_at)}
              </Typography>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render list item
  const renderListItem = (item: LibraryItem) => {
    const verificationDisplay = getVerificationDisplay(
      item.ai_probability,
      item.human_probability,
      item.verification_status
    );

    return (
      <div
        key={item.id}
        className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 cursor-pointer p-6"
        onClick={() => setSelectedItem(item)}
      >
        <div className="flex items-center gap-6">
          {/* Media Preview */}
          <div className="w-24 h-24 flex-shrink-0">
            {renderMediaPreview(item)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2 gap-4">
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusBadgeClasses(verificationDisplay.status)}`}>
                {verificationDisplay.status === 'authentic' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {verificationDisplay.displayStatus}
              </div>
              {/* Date */}
              <div className="flex items-center gap-1 text-sm text-gray-400 flex-shrink-0">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(item.created_at)}</span>
              </div>
            </div>

            {/* Overall Assessment */}
            <Typography variant="cardTitle" className="mb-2">
              {verificationDisplay.qualitativeStatus}
            </Typography>
            <Typography variant="cardCaption" color="secondary" className="mb-4">
              {getRecommendationText(verificationDisplay.status, verificationDisplay.qualitativeStatus)}
            </Typography>

            {/* Risk Factors (if any) */}
            {item.risk_factors && item.risk_factors.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <CardSubtitle className="text-red-400">
                    Detected Risk Factors:
                  </CardSubtitle>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                  {item.risk_factors.slice(0, 1).map((factor, idx) => ( // Limit to 1 for brevity in list view
                    <li key={idx} className="truncate">{factor}</li>
                  ))}
                  {item.risk_factors.length > 1 && (
                    <li className="text-blue-400 cursor-pointer">...view all</li>
                  )}
                </ul>
              </div>
            )}

            {/* Recommendations (if any) */}
            {item.recommendations && item.recommendations.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <CardSubtitle className="text-green-400">
                    Recommendations:
                  </CardSubtitle>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                  {item.recommendations.slice(0, 1).map((rec, idx) => ( // Limit to 1 for brevity
                    <li key={idx} className="truncate">{rec}</li>
                  ))}
                  {item.recommendations.length > 1 && (
                    <li className="text-blue-400 cursor-pointer">...view all</li>
                  )}
                </ul>
              </div>
            )}

            {/* Metrics (Confidence and Processing Time) */}
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-1">
                <Brain className="h-4 w-4" />
                <span className="numeric-text">{formatConfidence(item.confidence_score)} confidence</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="numeric-text">{item.processing_time.toFixed(2)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="mb-8">
              <img 
                src="/FICTUS ARCHIVE NO BG.png" 
                alt="Fictus Archive" 
                className="mx-auto h-40 sm:h-52 lg:h-64 xl:h-60 w-auto object-contain filter drop-shadow-lg"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto">
              Explore verified content from our community. See real examples of AI detection in action.
            </Typography>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center gap-4">
                {/* Expanded Search */}
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
              </div>
            </div>

            {/* Filters Button */}
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

                {/* Expanded Filters */}
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
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-700" />
                <div className="p-6 space-y-4">
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
              Error Loading Library
            </Typography>
            <Typography variant="body" color="secondary">
              {error}
            </Typography>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <Typography variant="h3" className="mb-2">
              No Items Found
            </Typography>
            <Typography variant="body" color="secondary">
              {searchTerm || statusFilter !== 'all' || contentTypeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No public verifications available yet'
              }
            </Typography>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {items.map(item => 
              viewMode === 'grid' ? renderGridItem(item) : renderListItem(item)
            )}
          </div>
        )}

        {/* Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in-scale">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex-1 min-w-0">
                  <Typography variant="h3" className="truncate mb-2">
                    {selectedItem.original_filename || selectedItem.file_name}
                  </Typography>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <Typography variant="caption">
                        {formatDate(selectedItem.created_at)}
                      </Typography>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Media Preview */}
                  <div>
                    <div className="w-full h-64 lg:h-80">
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

                      {renderMediaPreview(selectedItem)}
                    </div>
                  </div>

                  {/* Verification Details */}
                  <div className="space-y-6">
                    {/* Status */}
                    <div>
                      <Typography variant="h4" className="mb-3">Verification Status</Typography>
                      {(() => {
                        const verificationDisplay = getVerificationDisplay(
                          selectedItem.ai_probability,
                          selectedItem.human_probability,
                          selectedItem.verification_status
                        );
                        return (
                          <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border ${getStatusBadgeClasses(verificationDisplay.status)}`}>
                            {verificationDisplay.status === 'authentic' ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5" />
                            )}
                            <span className="font-medium">{verificationDisplay.displayStatus}</span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                        <Typography variant="cardCaption" color="secondary" className="mb-1">
                          Confidence Score
                        </Typography>
                        <Typography variant="cardTitle" className="numeric-text">
                          {formatConfidence(selectedItem.confidence_score)}
                        </Typography>
                      </div>
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                        <Typography variant="cardCaption" color="secondary" className="mb-1">
                          Processing Time
                        </Typography>
                        <Typography variant="cardTitle" className="numeric-text">
                          {selectedItem.processing_time.toFixed(2)}s
                        </Typography>
                      </div>
                    </div>



                    {/* Risk Factors */}
                    {selectedItem.risk_factors && selectedItem.risk_factors.length > 0 && (
                      <div>
                        <Typography variant="h4" className="mb-3">Risk Factors</Typography>
                        <div className="space-y-2">
                          {selectedItem.risk_factors.map((factor: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <Typography variant="cardCaption" className="text-red-400">
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
                        <Typography variant="h4" className="mb-3">Recommendations</Typography>
                        <div className="space-y-2">
                          {selectedItem.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <Typography variant="cardCaption" className="text-blue-400">
                                {rec}
                              </Typography>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-700">
                      <button
                        onClick={() => generatePDFReport(selectedItem)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download Report
                      </button>
                      <button
                        onClick={() => shareVerification(selectedItem)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;