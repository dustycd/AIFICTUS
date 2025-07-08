import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileVideo, FileImage, AlertTriangle, CheckCircle, Clock, Shield, Zap, Brain, Download, Share2, X, User, LogIn, UserPlus } from 'lucide-react';
import { Typography, Heading } from './Typography';
import { useAuth } from '../hooks/useAuth';
import { validateFile, uploadFile, isVideoFile, isImageFile, getContentType, formatFileSize } from '../lib/storage';
import { db } from '../lib/database';
import { usageLimits } from '../lib/usageLimits';
import UsageLimitsDisplay from './UsageLimitsDisplay';
import verifyWithAIOrNot from '../workflows/verifyWithAIOrNot';

interface VerificationResult {
  id: string;
  confidence: number;
  status: 'authentic' | 'suspicious' | 'fake';
  processingTime: number;
  fileSize: string;
  resolution: string;
  duration?: string;
  aiProbability?: number;
  humanProbability?: number;
  detectionDetails: {
    faceAnalysis: number;
    temporalConsistency?: number;
    audioAnalysis?: number;
    compressionArtifacts: number;
    metadataAnalysis?: number;
    pixelAnalysis?: number;
  };
  riskFactors: string[];
  recommendations: string[];
  reportId?: string;
  storagePath?: string;
  storageUrl?: string;
  rawApiResponse?: any;
  generatorAnalysis?: any;
  apiVerdict?: string;
  contentType: 'image' | 'video';
}

const UnifiedVerify = () => {
  const { user, loading } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareToLibrary, setShareToLibrary] = useState(false);
  const [usageInfo, setUsageInfo] = useState<any>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [isDragSupported, setIsDragSupported] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user's monthly usage on component mount
  useEffect(() => {
    const loadUsageInfo = async () => {
      if (!user) return;
      
      try {
        setUsageError(null);
        const usage = await usageLimits.getUserMonthlyUsage(user.id);
        setUsageInfo(usage);
      } catch (err) {
        console.error('Failed to load usage info:', err);
        setUsageError('Failed to load usage information');
      }
    };

    loadUsageInfo();
  }, [user]);

  // Check if device supports drag and drop
  useEffect(() => {
    const checkDragSupport = () => {
      // Check if it's a touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check if drag and drop is supported
      const div = document.createElement('div');
      const hasDragSupport = ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
      
      // Disable drag and drop on touch devices as it's unreliable
      setIsDragSupported(hasDragSupport && !isTouchDevice);
    };

    checkDragSupport();
  }, []);

  // Handle file selection
  const handleFileSelection = async (file: File) => {
    setError(null);
    setVerificationResult(null);
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Check usage limits
    const contentType = getContentType(file);
    try {
      const limitCheck = await usageLimits.checkUsageLimits(user.id, contentType);
      if (limitCheck && !limitCheck.canUpload) {
        setError(limitCheck.reason);
        return;
      }
    } catch (err) {
      console.error('Failed to check usage limits:', err);
      setError('Failed to check usage limits. Please try again.');
      return;
    }

    setSelectedFile(file);
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    if (!isDragSupported) return;
    
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!isDragSupported) return;
    
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, [handleFileSelection]);

  // Check if user is authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Authentication Required Section - Fixed padding to account for header */}
        <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 mt-8">
              <img 
                src="/fictus.png" 
                alt="Fictus AI" 
                className="mx-auto h-16 w-auto object-contain filter drop-shadow-lg"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            
            <Heading level={1} className="mb-8 text-5xl lg:text-6xl font-black">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Authentication Required
              </span>
            </Heading>
            
            <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-xl mb-12 leading-relaxed">
              To upload and verify media content, you need to create an account or sign in. 
              This helps us track your monthly usage limits and provide personalized verification history.
            </Typography>

            {/* Benefits of Creating Account */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <Typography variant="cardTitle" className="mb-3">
                  Secure Verification
                </Typography>
                <Typography variant="cardCaption" color="secondary" className="leading-relaxed">
                  Your uploads are securely processed and stored with enterprise-grade encryption
                </Typography>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-green-400" />
                </div>
                <Typography variant="cardTitle" className="mb-3">
                  Verification History
                </Typography>
                <Typography variant="cardCaption" color="secondary" className="leading-relaxed">
                  Access all your past verifications and download detailed analysis reports
                </Typography>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="h-6 w-6 text-purple-400" />
                </div>
                <Typography variant="cardTitle" className="mb-3">
                  Community Sharing
                </Typography>
                <Typography variant="cardCaption" color="secondary" className="leading-relaxed">
                  Optionally share your verifications to help educate the community
                </Typography>
              </div>
            </div>

            {/* Monthly Limits Info */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-8 mb-12 max-w-3xl mx-auto">
              <Typography variant="h3" className="mb-4 text-blue-400">
                Monthly Usage Limits
              </Typography>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <Typography variant="h2" className="text-blue-400 mb-2">2</Typography>
                  <Typography variant="cardCaption" color="secondary">Videos per month</Typography>
                </div>
                <div className="text-center">
                  <Typography variant="h2" className="text-purple-400 mb-2">10</Typography>
                  <Typography variant="cardCaption" color="secondary">Images per month</Typography>
                </div>
              </div>
              <Typography variant="body" color="secondary" className="text-center">
                Free accounts include generous monthly limits for personal use. 
                Need more? Contact us about enterprise plans.
              </Typography>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-lg mx-auto">
              <button 
                onClick={() => window.location.href = '#auth'}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-3"
              >
                <UserPlus className="h-5 w-5" />
                <Typography variant="button">Create Account</Typography>
              </button>
              
              <button 
                onClick={() => window.location.href = '#auth'}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <LogIn className="h-5 w-5" />
                <Typography variant="button">Sign In</Typography>
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-12 pt-8 border-t border-gray-700/50">
              <Typography variant="body" color="secondary" className="text-center">
                Already have an account? Click "Sign In" above to access your verification dashboard.
              </Typography>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  // Handle verification
  const handleVerification = async () => {
    if (!selectedFile || !user) return;

    setIsVerifying(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Get API key
      const apiKey = import.meta.env.VITE_AIORNOT_API_KEY;
      if (!apiKey) {
        throw new Error('API key not configured. Please check your environment variables.');
      }

      // Create verification record in database
      const verificationRecord = await db.verifications.create({
        user_id: user.id,
        file_name: selectedFile.name,
        original_filename: selectedFile.name,
        content_type: selectedFile.type,
        file_size: selectedFile.size,
        verification_status: 'uploading',
        upload_progress: 0,
        is_public_library_item: shareToLibrary
      });

      if (verificationRecord.error) {
        throw new Error('Failed to create verification record');
      }

      const verificationId = verificationRecord.data.id;

      // Upload file to storage
      setUploadProgress(25);
      const uploadResult = await uploadFile(
        selectedFile,
        user.id,
        verificationId,
        (progress) => setUploadProgress(25 + (progress * 0.25)) // 25-50%
      );

      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }

      // Update verification record with storage info
      await db.verifications.update(verificationId, {
        storage_bucket: uploadResult.bucket,
        storage_path: uploadResult.path,
        file_url: uploadResult.publicUrl,
        verification_status: 'processing',
        upload_progress: 50
      });

      setUploadProgress(50);

      // Verify with AI or Not API
      const result = await verifyWithAIOrNot(selectedFile, apiKey);
      
      setUploadProgress(90);

      // Update verification record with results
      await db.verifications.update(verificationId, {
        verification_status: result.status,
        confidence_score: result.confidence,
        ai_probability: result.aiProbability,
        human_probability: result.humanProbability,
        processing_time: result.processingTime,
        detection_details: result.detectionDetails,
        risk_factors: result.riskFactors,
        recommendations: result.recommendations,
        report_id: result.reportId,
        upload_progress: 100
      });

      // Update usage limits
      const contentType = getContentType(selectedFile);
      await usageLimits.updateUsageAfterUpload(user.id, contentType);

      // Refresh usage info
      const updatedUsage = await usageLimits.getUserMonthlyUsage(user.id);
      setUsageInfo(updatedUsage);

      setUploadProgress(100);
      setVerificationResult(result);

    } catch (err: any) {
      console.error('Verification failed:', err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setVerificationResult(null);
    setError(null);
    setUploadProgress(0);
    setShareToLibrary(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authentic':
        return <CheckCircle className="h-8 w-8 text-green-400" />;
      case 'suspicious':
        return <AlertTriangle className="h-8 w-8 text-yellow-400" />;
      case 'fake':
        return <Shield className="h-8 w-8 text-red-400" />;
      default:
        return <Clock className="h-8 w-8 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authentic':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'suspicious':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'fake':
        return 'from-red-500/20 to-pink-500/20 border-red-500/30';
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <section className="relative pt-20 sm:pt-32 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 sm:mb-8">
            <img 
              src="/fictus.png" 
              alt="Fictus AI" 
              className="mx-auto h-12 sm:h-16 w-auto object-contain filter drop-shadow-lg"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          
          <Heading level={1} className="mb-6 sm:mb-8 text-3xl sm:text-5xl lg:text-6xl font-black px-2">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Verify Media Content
            </span>
          </Heading>
          
          <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-base sm:text-xl mb-6 sm:mb-8 leading-relaxed px-2">
            Upload your video or image to verify its authenticity using our advanced AI detection technology.
            Get detailed analysis results in seconds.
          </Typography>

          {/* Usage Limits Display */}
          <div className="mb-6 sm:mb-8">
            <UsageLimitsDisplay compact={true} showTitle={false} />
          </div>
        </div>
      </section>

      {/* Main Verification Interface */}
      <section className="pb-12 sm:pb-20 px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {!verificationResult ? (
            <div className="space-y-6 sm:space-y-8">
              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-blue-400 bg-blue-500/10'
                    : selectedFile
                    ? 'border-green-400 bg-green-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                {...(isDragSupported && {
                  onDragEnter: handleDrag,
                  onDragLeave: handleDrag,
                  onDragOver: handleDrag,
                  onDrop: handleDrop
                })}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {/* File Input - Always present for mobile compatibility */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*,.mp4,.mov,.avi,.webm,.mkv,.m4v,.3gp,.flv,.wmv,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.svg,.heic,.heif,.avif"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 touch-manipulation"
                  disabled={isVerifying}
                  multiple={false}
                />

                <div className="space-y-4 sm:space-y-6">
                  {selectedFile ? (
                    <>
                      <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                        {isVideoFile(selectedFile) ? (
                          <FileVideo className="h-8 sm:h-10 w-8 sm:w-10 text-green-400" />
                        ) : (
                          <FileImage className="h-8 sm:h-10 w-8 sm:w-10 text-green-400" />
                        )}
                      </div>
                      <div>
                        <Typography variant="h3" className="mb-2 text-lg sm:text-xl break-all px-2">
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="body" color="secondary" className="text-sm sm:text-base">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </Typography>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center">
                        <Upload className="h-8 sm:h-10 w-8 sm:w-10 text-gray-400" />
                      </div>
                      <div>
                        <Typography variant="h3" className="mb-2 text-lg sm:text-xl px-2">
                          {isDragSupported ? 'Drop your file here or tap to browse' : 'Tap to select your file'}
                        </Typography>
                        <Typography variant="body" color="secondary" className="text-sm sm:text-base px-2">
                          Supports videos (MP4, MOV, AVI, WebM) and images (JPG, PNG, GIF, WebP)
                        </Typography>
                        {!isDragSupported && (
                          <Typography variant="caption" color="secondary" className="mt-2 block text-xs px-2">
                            Tap the area above to select a file from your device
                          </Typography>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Options */}
              {selectedFile && (
                <div className="bg-gray-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <Typography variant="h3" className="text-lg sm:text-xl">Verification Options</Typography>
                    <button
                      onClick={resetForm}
                      className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareToLibrary}
                        onChange={(e) => setShareToLibrary(e.target.checked)}
                        className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded touch-manipulation"
                      />
                      <div>
                        <Typography variant="body" className="text-sm sm:text-base">Share to Community Library</Typography>
                        <Typography variant="caption" color="secondary" className="text-xs sm:text-sm">
                          Help educate others by sharing your verification results anonymously
                        </Typography>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleVerification}
                    disabled={isVerifying}
                    className="w-full mt-4 sm:mt-6 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 touch-manipulation"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <Typography variant="button" className="text-sm sm:text-base">
                          {uploadProgress < 50 ? 'Uploading...' : 'Analyzing...'}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        <Typography variant="button" className="text-sm sm:text-base">Start Verification</Typography>
                      </>
                    )}
                  </button>

                  {/* Progress Bar */}
                  {isVerifying && (
                    <div className="mt-3 sm:mt-4">
                      <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span>Progress</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <Typography variant="h4" className="text-red-400 mb-2 text-base sm:text-lg">
                        Verification Failed
                      </Typography>
                      <Typography variant="body" className="text-red-300 text-sm sm:text-base">
                        {error}
                      </Typography>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-6 sm:space-y-8">
              {/* Status Header */}
              <div className={`bg-gradient-to-r ${getStatusColor(verificationResult.status)} rounded-xl sm:rounded-2xl p-6 sm:p-8 border text-center`}>
                <div className="flex justify-center mb-4">
                  {getStatusIcon(verificationResult.status)}
                </div>
                <Typography variant="h2" className="mb-2 capitalize text-xl sm:text-2xl lg:text-3xl">
                  {verificationResult.status}
                </Typography>
                <Typography variant="h3" className="mb-4 text-lg sm:text-xl">
                  <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                    {verificationResult.confidence.toFixed(1)}%
                  </span> Confidence
                </Typography>
                <Typography variant="body" color="secondary" className="text-sm sm:text-base">
                  Analysis completed in <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                    {verificationResult.processingTime.toFixed(1)}
                  </span> seconds
                </Typography>
              </div>

              {/* Detailed Results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Analysis Metrics */}
                <div className="bg-gray-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700">
                  <Typography variant="h3" className="mb-4 sm:mb-6 flex items-center gap-2 text-lg sm:text-xl">
                    <Brain className="h-5 w-5 text-blue-400" />
                    Analysis Results
                  </Typography>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm sm:text-base">Confidence Score</span>
                      <span className="numeric-text text-blue-400 font-bold text-sm sm:text-base" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                        {verificationResult.confidence.toFixed(1)}%
                      </span>
                    </div>
                    
                    {verificationResult.aiProbability && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm sm:text-base">AI Probability</span>
                        <span className="numeric-text text-red-400 text-sm sm:text-base" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                          {verificationResult.aiProbability.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    {verificationResult.humanProbability && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm sm:text-base">Human Probability</span>
                        <span className="numeric-text text-green-400 text-sm sm:text-base" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                          {verificationResult.humanProbability.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm sm:text-base">Processing Time</span>
                      <span className="numeric-text text-sm sm:text-base" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                        {verificationResult.processingTime.toFixed(1)}s
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm sm:text-base">File Size</span>
                      <span className="numeric-text text-sm sm:text-base" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                        {verificationResult.fileSize}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detection Details */}
                <div className="bg-gray-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700">
                  <Typography variant="h3" className="mb-4 sm:mb-6 text-lg sm:text-xl">
                    Detection Analysis
                  </Typography>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {Object.entries(verificationResult.detectionDetails).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-1 text-sm sm:text-base">
                          <span className="text-gray-400 capitalize text-sm sm:text-base">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-xs sm:text-sm numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                            {value.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 sm:h-3 rounded-full"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              {verificationResult.riskFactors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <Typography variant="h3" className="mb-4 text-red-400 text-lg sm:text-xl">
                    Risk Factors Detected
                  </Typography>
                  <div className="space-y-2 sm:space-y-3">
                    {verificationResult.riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <Typography variant="body" className="text-red-300 text-sm sm:text-base">
                          {factor}
                        </Typography>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {verificationResult.recommendations.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <Typography variant="h3" className="mb-4 text-blue-400 text-lg sm:text-xl">
                    Recommendations
                  </Typography>
                  <div className="space-y-2 sm:space-y-3">
                    {verificationResult.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <Typography variant="body" className="text-blue-300 text-sm sm:text-base">
                          {rec}
                        </Typography>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <button
                  onClick={resetForm}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 touch-manipulation"
                >
                  <Typography variant="button" className="text-sm sm:text-base">Verify Another File</Typography>
                </button>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button className="px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation">
                  <Download className="h-4 w-4" />
                  <Typography variant="button" className="text-xs sm:text-sm">Download</Typography>
                </button>
                
                <button className="px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation">
                  <Share2 className="h-4 w-4" />
                  <Typography variant="button" className="text-xs sm:text-sm">Share</Typography>
                </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UnifiedVerify;