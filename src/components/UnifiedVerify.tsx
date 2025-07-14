import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileVideo, FileImage, AlertTriangle, CheckCircle, Clock, Shield, Zap, Brain, Download, Share2, X, User, LogIn, UserPlus } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Heading } from './Typography';
import { useAuth } from '../hooks/useAuth';
import { validateFile, uploadFile, isVideoFile, isImageFile, getContentType, formatFileSize } from '../lib/storage';
import { db } from '../lib/database';
import { usageLimits } from '../lib/usageLimits';
import UsageLimitsDisplay from './UsageLimitsDisplay';
import verifyWithAIOrNot from '../workflows/verifyWithAIOrNot';

// Local storage key for session persistence
const LOCAL_STORAGE_KEY = 'fictus_verification_session';

interface VerificationResult {
  id: string;
  confidence: number;
  status: 'authentic' | 'fake';
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
  const { verificationId } = useParams<{ verificationId: string }>();
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareToLibrary, setShareToLibrary] = useState(false);
  const [usageInfo, setUsageInfo] = useState<any>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [isDragSupported, setIsDragSupported] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileThumbnail, setFileThumbnail] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // Load verification session from localStorage on component mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        console.log('📂 Loading saved verification session:', parsedSession.fileName);
        setVerificationResult(parsedSession);
        setShareToLibrary(parsedSession.isPublicLibraryItem || false);
      }
    } catch (error) {
      console.error('❌ Error loading saved session:', error);
      // Clear corrupted data
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  // Save verification session to localStorage when result changes
  useEffect(() => {
    if (verificationResult) {
      try {
        console.log('💾 Saving verification session to localStorage:', verificationResult.fileName);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(verificationResult));
      } catch (error) {
        console.error('❌ Error saving session:', error);
      }
    } else {
      // Clear session when result is null (new verification)
      console.log('🗑️ Clearing saved verification session');
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [verificationResult]);

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

  // Load existing verification if verificationId is provided
  useEffect(() => {
    const loadExistingVerification = async () => {
      if (!verificationId || !user) return;
      
      setIsLoadingExisting(true);
      setError(null);
      
      try {
        console.log('🔍 Loading existing verification:', verificationId);
        
        const { data: verification, error: fetchError } = await db.verifications.get(verificationId);
        
        if (fetchError) {
          console.error('❌ Failed to load verification:', fetchError);
          setError('Failed to load verification. The report may not exist or you may not have permission to view it.');
          return;
        }
        
        if (!verification) {
          setError('Verification not found.');
          return;
        }
        
        // Check if user owns this verification
        if (verification.user_id !== user.id) {
          setError('You do not have permission to view this verification.');
          return;
        }
        
        console.log('✅ Loaded verification:', verification);
        
        // Convert database record to VerificationResult format
        const metadata = verification.metadata || {};
        
        const result: VerificationResult = {
          id: verification.id,
          confidence: verification.confidence_score || 0,
          status: verification.verification_status as 'authentic' | 'fake',
          processingTime: verification.processing_time || 0,
          fileSize: formatFileSize(verification.file_size || 0),
          resolution: metadata.resolution || '1920x1080',
          duration: metadata.duration || (verification.content_type.startsWith('video/') ? '0:45' : undefined),
          aiProbability: verification.ai_probability || 0,
          humanProbability: verification.human_probability || 0,
          detectionDetails: verification.detection_details || {
            faceAnalysis: 0,
            compressionArtifacts: 0
          },
          riskFactors: verification.risk_factors || [],
          recommendations: verification.recommendations || [],
          reportId: verification.report_id,
          storagePath: verification.storage_path,
          storageUrl: verification.file_url,
          rawApiResponse: metadata.rawApiResponse,
          generatorAnalysis: metadata.generatorAnalysis,
          apiVerdict: metadata.apiVerdict,
          contentType: verification.content_type.startsWith('image/') ? 'image' : 'video'
        };
        
        console.log('📊 Loaded verification with metadata:', {
          id: result.id,
          resolution: result.resolution,
          duration: result.duration,
          hasRawApiResponse: !!result.rawApiResponse,
          hasGeneratorAnalysis: !!result.generatorAnalysis,
          apiVerdict: result.apiVerdict
        });
        
        setVerificationResult(result);
        
        // Set the original filename for display
        if (verification.original_filename) {
          // Create a mock file object for display purposes
          const mockFile = new File([''], verification.original_filename, {
            type: verification.content_type
          });
          setSelectedFile(mockFile);
        }
        
      } catch (err: any) {
        console.error('❌ Exception loading verification:', err);
        setError('An error occurred while loading the verification.');
      } finally {
        setIsLoadingExisting(false);
      }
    };
    
    loadExistingVerification();
  }, [verificationId, user]);
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

  // Clear verification session
  const clearVerificationSession = () => {
    console.log('🧹 Clearing verification session...');
    setSelectedFile(null);
    setVerificationResult(null);
    setError(null);
    setIsVerifying(false);
    setShowResultModal(false);
    setUploadProgress(0);
    setShareToLibrary(false);
    setFileThumbnail(null);
    console.log('✅ Verification session cleared');
  };

  // Handle file selection
  const handleFileSelection = async (file: File) => {
    setError(null);
    // Clear previous verification result and session when new file is selected
    setVerificationResult(null);
    setFileThumbnail(null);
    
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
    setShareToLibrary(false);
    
    // Generate thumbnail for the file
    try {
      const thumbnail = await generateFileThumbnail(file);
      setFileThumbnail(thumbnail);
    } catch (err) {
      console.warn('Failed to generate thumbnail:', err);
      // Continue without thumbnail - not critical
    }
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
        upload_progress: 100,
        metadata: {
          resolution: result.resolution,
          duration: result.duration,
          rawApiResponse: result.rawApiResponse,
          generatorAnalysis: result.generatorAnalysis,
          apiVerdict: result.apiVerdict,
          contentType: result.contentType,
          fileSize: result.fileSize
        }
      });

      // Update usage limits
      const contentType = getContentType(selectedFile);
      await usageLimits.updateUsageAfterUpload(user.id, contentType);

      // Refresh usage info
      const updatedUsage = await usageLimits.getUserMonthlyUsage(user.id);
      setUsageInfo(updatedUsage);

      setUploadProgress(100);
      setVerificationResult(result);
      setShowResultModal(true);

    } catch (err: any) {
      console.error('Verification failed:', err);
      setError(err.message || 'Verification failed. Please try again.');
      setShowResultModal(true);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle closing the result modal and resetting to upload state
  const handleCloseResultModal = () => {
    setShowResultModal(false);
    clearVerificationSession();
  };

  // Generate thumbnail from file
  const generateFileThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (isImageFile(file)) {
        // For images, create a data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read image file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      } else if (isVideoFile(file)) {
        // For videos, capture a frame
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        video.onloadedmetadata = () => {
          // Set canvas size to video dimensions (max 400px width)
          const maxWidth = 400;
          const aspectRatio = video.videoHeight / video.videoWidth;
          canvas.width = Math.min(video.videoWidth, maxWidth);
          canvas.height = canvas.width * aspectRatio;
          
          // Seek to 10% of video duration for a good frame
          video.currentTime = video.duration * 0.1;
        };
        
        video.onseeked = () => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
            resolve(thumbnail);
          } catch (err) {
            reject(new Error('Failed to capture video frame'));
          }
        };
        
        video.onerror = () => reject(new Error('Failed to load video'));
        video.src = URL.createObjectURL(file);
        video.load();
      } else {
        reject(new Error('Unsupported file type for thumbnail'));
      }
    });
  };

  // Enhanced PDF generation with thumbnail
  const generatePDFReport = async () => {
    if (!verificationResult || !selectedFile) return;

    try {
      // Dynamic import to reduce bundle size
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Create a temporary container for the PDF content
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.4';
      container.style.color = '#333';
      document.body.appendChild(container);

      // Build the HTML content with thumbnail
      const thumbnailHtml = fileThumbnail ? `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${fileThumbnail}" 
               style="max-width: 300px; max-height: 200px; border: 1px solid #ddd; border-radius: 8px;" 
               alt="File thumbnail" />
          <p style="margin: 10px 0 0 0; font-size: 10px; color: #666;">
            ${selectedFile.name}
          </p>
        </div>
      ` : '';

      container.innerHTML = `
        <div style="padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px;">
            <h1 style="color: #3B82F6; margin: 0; font-size: 24px; font-weight: bold;">
              Fictus AI Verification Report
            </h1>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
              AI-Powered Content Authenticity Analysis
            </p>
          </div>

          <!-- File Information with Thumbnail -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">
              File Information
            </h2>
            ${thumbnailHtml}
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold; width: 30%;">
                  File Name
                </td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">
                  ${selectedFile.name}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">
                  File Size
                </td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">
                  ${verificationResult.fileSize}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">
                  Content Type
                </td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">
                  ${verificationResult.contentType === 'image' ? 'Image' : 'Video'}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">
                  Analysis Date
                </td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">
                  ${new Date().toLocaleString()}
                </td>
              </tr>
            </table>
          </div>

          <!-- Verification Results -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">
              Verification Results
            </h2>
            
            <!-- Status Badge -->
            <div style="text-align: center; margin: 20px 0;">
              <div style="display: inline-block; padding: 15px 30px; border-radius: 10px; font-size: 18px; font-weight: bold; 
                          background: ${verificationResult.status === 'authentic' ? '#10B981' : 
                                     verificationResult.status === 'suspicious' ? '#F59E0B' : '#EF4444'}; 
                          color: white;">
                ${verificationResult.status.toUpperCase()}
              </div>
              <p style="margin: 10px 0 0 0; font-size: 16px; font-weight: bold;">
                Confidence Score: ${verificationResult.confidence.toFixed(1)}%
              </p>
            </div>

            <!-- Analysis Metrics -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold; width: 40%;">
                  AI Probability
                </td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">
                  ${verificationResult.aiProbability?.toFixed(1) || 'N/A'}%
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">
                  Human Probability
                </td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">
                  ${verificationResult.humanProbability?.toFixed(1) || 'N/A'}%
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">
                  Processing Time
                </td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">
                  ${verificationResult.processingTime.toFixed(1)} seconds
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold;">
                  Report ID
                </td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">
                  ${verificationResult.reportId || 'N/A'}
                </td>
              </tr>
            </table>
          </div>

          <!-- Detection Analysis -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">
              Detection Analysis
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(verificationResult.detectionDetails).map(([key, value]) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: bold; width: 40%;">
                    ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </td>
                  <td style="padding: 8px; border: 1px solid #E5E7EB;">
                    ${value.toFixed(1)}%
                  </td>
                </tr>
              `).join('')}
            </table>
          </div>

          <!-- Risk Factors -->
          ${verificationResult.riskFactors.length > 0 ? `
            <div style="margin-bottom: 25px;">
              <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">
                Risk Factors
              </h2>
              <ul style="margin: 0; padding-left: 20px;">
                ${verificationResult.riskFactors.map(factor => `
                  <li style="margin: 5px 0; color: #DC2626;">${factor}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Recommendations -->
          ${verificationResult.recommendations.length > 0 ? `
            <div style="margin-bottom: 25px;">
              <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">
                Recommendations
              </h2>
              <ul style="margin: 0; padding-left: 20px;">
                ${verificationResult.recommendations.map(rec => `
                  <li style="margin: 5px 0; color: #059669;">${rec}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 10px;">
            <p style="margin: 0;">
              This report was generated by Fictus AI - Advanced AI Content Verification
            </p>
            <p style="margin: 5px 0 0 0;">
              For more information, visit fictus.ai
            </p>
          </div>
        </div>
      `;

      // Configure PDF options
      const opt = {
        margin: 0.5,
        filename: `fictus-ai-report-${selectedFile.name.replace(/\.[^/.]+$/, '')}-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      // Generate and download PDF
      await html2pdf().set(opt).from(container).save();
      
      // Clean up
      document.body.removeChild(container);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      setError('Failed to generate PDF report. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setVerificationResult(null);
    setShareToLibrary(false);
    setError(null);
    setUploadProgress(0);
    setFileThumbnail(null);
    setIsLoadingExisting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Navigate back to base verify route if we were viewing a specific verification
    if (verificationId) {
      navigate('/verify');
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authentic':
        return <CheckCircle className="h-8 w-8 text-green-400" />;
      case 'fake':
        return <AlertTriangle className="h-8 w-8 text-red-400" />;
      default:
        return <Clock className="h-8 w-8 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authentic':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'fake':
        return 'from-red-500/20 to-pink-500/20 border-red-500/30';
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  // Get status info for modal
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'authentic':
        return {
          label: 'Human Created',
          icon: CheckCircle,
          bgGradient: 'from-green-500/20 to-emerald-500/20'
        };
      case 'fake':
        return {
          label: 'AI Generated',
          icon: AlertTriangle,
          bgGradient: 'from-red-500/20 to-pink-500/20'
        };
      default:
        return {
          label: 'Unknown',
          icon: Clock,
          bgGradient: 'from-gray-500/20 to-gray-600/20'
        };
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <section className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <img 
              src="/fictus.png" 
              alt="Fictus AI" 
              className="mx-auto h-16 w-auto object-contain filter drop-shadow-lg"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          
          <Heading level={1} className="mb-8 text-5xl lg:text-6xl font-black">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {verificationId ? 'Verification Report' : 'Verify Media Content'}
            </span>
          </Heading>
          
          <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-xl mb-8 leading-relaxed">
            {verificationId 
              ? 'View your saved verification results and analysis details below.'
              : 'Upload your video or image to verify its authenticity using our advanced AI detection technology. Get detailed analysis results in seconds.'
            }
          </Typography>

          {/* Clear Verification Button - Show when there's content to clear */}
          {(selectedFile || verificationResult || error) && !isVerifying && (
            <div className="text-center">
              <button
                onClick={clearVerificationSession}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <X className="h-4 w-4" />
                <Typography variant="button">Clear Verification</Typography>
              </button>
            </div>
          )}

          {/* Usage Limits Display */}
          {!verificationId && (
            <div className="mb-8">
              <UsageLimitsDisplay compact={true} showTitle={false} />
            </div>
          )}
        </div>
      </section>

      {/* Main Verification Interface */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {isLoadingExisting ? (
            /* Loading Existing Verification */
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <Typography variant="h3" className="mb-4">
                Loading Verification Report
              </Typography>
              <Typography variant="body" color="secondary">
                Retrieving your saved verification results...
              </Typography>
            </div>
          ) : !verificationResult ? (
            <div className="space-y-8">
              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isVerifying}
                  multiple={false}
                />

                <div className="space-y-6">
                  {selectedFile ? (
                    <>
                      <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                        {isVideoFile(selectedFile) ? (
                          <FileVideo className="h-10 w-10 text-green-400" />
                        ) : (
                          <FileImage className="h-10 w-10 text-green-400" />
                        )}
                      </div>
                      <div>
                        <Typography variant="h3" className="mb-2">
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="body" color="secondary">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </Typography>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                        <Upload className="h-10 w-10 text-gray-400" />
                      </div>
                      <div>
                        <Typography variant="h3" className="mb-2">
                          {isDragSupported ? 'Drop your file here or tap to browse' : 'Tap to select your file'}
                        </Typography>
                        <Typography variant="body" color="secondary">
                          Supports videos (MP4, MOV, AVI, WebM) and images (JPG, PNG, GIF, WebP)
                        </Typography>
                        {!isDragSupported && (
                          <Typography variant="caption" color="secondary" className="mt-2 block">
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
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <Typography variant="h3">Verification Options</Typography>
                    <button
                      onClick={resetForm}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareToLibrary}
                        onChange={(e) => setShareToLibrary(e.target.checked)}
                        className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded"
                      />
                      <div>
                        <Typography variant="body">Share to Community Library</Typography>
                        <Typography variant="caption" color="secondary">
                          Help educate others by sharing your verification results anonymously
                        </Typography>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleVerification}
                    disabled={isVerifying}
                    className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <Typography variant="button">
                          {uploadProgress < 50 ? 'Uploading...' : 'Analyzing...'}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        <Typography variant="button">Start Verification</Typography>
                      </>
                    )}
                  </button>

                  {/* Progress Bar */}
                  {isVerifying && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <Typography variant="h4" className="text-red-400 mb-2">
                        Verification Failed
                      </Typography>
                      <Typography variant="body" className="text-red-300">
                        {error}
                      </Typography>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-8">
              {/* Status Header */}
              <div className={`bg-gradient-to-r ${getStatusColor(verificationResult.status)} rounded-2xl p-8 border text-center`}>
                <div className="flex justify-center mb-4">
                  {getStatusIcon(verificationResult.status)}
                </div>
                <Typography variant="h2" className="mb-2 capitalize">
                  {verificationResult.status === 'authentic' ? 'Human Created' : 'AI Generated'}
                </Typography>
                <Typography variant="h3" className="mb-4">
                  <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                    {verificationResult.confidence.toFixed(1)}%
                  </span> Confidence
                </Typography>
                <Typography variant="body" color="secondary">
                  Analysis completed in <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                    {verificationResult.processingTime.toFixed(1)}
                  </span> seconds
                </Typography>
              </div>

              {/* Detailed Results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Analysis Metrics */}
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
                  <Typography variant="h3" className="mb-6 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-400" />
                    Analysis Results
                  </Typography>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Confidence Score</span>
                      <span className="numeric-text text-blue-400 font-bold" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                        {verificationResult.confidence.toFixed(1)}%
                      </span>
                    </div>
                    
                    {verificationResult.aiProbability && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">AI Probability</span>
                        <span className="numeric-text text-red-400" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                          {verificationResult.aiProbability.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    {verificationResult.humanProbability && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Human Probability</span>
                        <span className="numeric-text text-green-400" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                          {verificationResult.humanProbability.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Processing Time</span>
                      <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                        {verificationResult.processingTime.toFixed(1)}s
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">File Size</span>
                      <span className="numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                        {verificationResult.fileSize}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detection Details */}
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
                  <Typography variant="h3" className="mb-6">
                    Detection Analysis
                  </Typography>
                  
                  <div className="space-y-4">
                    {Object.entries(verificationResult.detectionDetails).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm numeric-text" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
                            {value.toFixed(1)}%
                          </span>
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
              </div>

              {/* Risk Factors */}
              {verificationResult.riskFactors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                  <Typography variant="h3" className="mb-4 text-red-400">
                    Risk Factors Detected
                  </Typography>
                  <div className="space-y-2">
                    {verificationResult.riskFactors.map((factor, index) => (
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
              {verificationResult.recommendations.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                  <Typography variant="h3" className="mb-4 text-blue-400">
                    Recommendations
                  </Typography>
                  <div className="space-y-2">
                    {verificationResult.recommendations.map((rec, index) => (
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

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Typography variant="button">{verificationId ? 'Verify New File' : 'Verify Another File'}</Typography>
                </button>
                
               <button
                  onClick={generatePDFReport}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <Typography variant="button">Download Report</Typography>
                </button>
                
                <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Share2 className="h-4 w-4" />
                  <Typography variant="button">Share Results</Typography>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Result Modal */}
      {showResultModal && (verificationResult || error) && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Close Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleCloseResultModal}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Close & Upload New</span>
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <Typography variant="h4" className="text-red-400 mb-2">
                        Verification Failed
                      </Typography>
                      <Typography variant="body" className="text-red-300">
                        {error}
                      </Typography>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Result Display */}
              {verificationResult && (
                <div className="space-y-8">
                  {/* Status Header */}
                  <div className={`bg-gradient-to-br ${getStatusInfo(verificationResult.status).bgGradient} rounded-2xl p-8 border border-gray-700 text-center`}>
                    <div className="mb-4">
                      {(() => {
                        const statusInfo = getStatusInfo(verificationResult.status);
                        const StatusIcon = statusInfo.icon;
                        return <StatusIcon className="h-16 w-16 mx-auto text-current" />;
                      })()}
                    </div>
                    
                    <Typography variant="h2" className="mb-2 text-2xl font-bold">
                      {getStatusInfo(verificationResult.status).label}
                    </Typography>
                    
                    <Typography variant="h1" className="mb-2 text-4xl font-black">
                      <span className="numeric-text">{Math.round(verificationResult.confidence)}%</span>
                    </Typography>
                    
                    <Typography variant="body" color="secondary">
                      Confidence Score
                    </Typography>
                  </div>

                  {/* Analysis Results */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* AI vs Human Probability */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
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
                            {Math.round(verificationResult.aiProbability || 0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${verificationResult.aiProbability || 0}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Human Created</span>
                          <span className="text-green-400 font-bold numeric-text text-lg">
                            {Math.round(verificationResult.humanProbability || 0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${verificationResult.humanProbability || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Processing Stats */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                      <div className="text-center mb-4">
                        <Clock className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                        <Typography variant="h4" className="text-blue-400 font-semibold">
                          Analysis Stats
                        </Typography>
                      </div>
                      
                      <div className="space-y-4 text-center">
                        <div>
                          <Typography variant="h3" className="text-2xl font-bold numeric-text">
                            {verificationResult.processingTime?.toFixed(1)}s
                          </Typography>
                          <Typography variant="caption" color="secondary">
                            Processing Time
                          </Typography>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-700">
                          <Typography variant="body" className="text-lg font-semibold">
                            {verificationResult.contentType === 'video' ? 'Video' : 'Image'}
                          </Typography>
                          <Typography variant="caption" color="secondary">
                            Content Type
                          </Typography>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-700">
                          <Typography variant="body" className="text-lg font-semibold">
                            {verificationResult.fileSize}
                          </Typography>
                          <Typography variant="caption" color="secondary">
                            File Size
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {verificationResult.recommendations && verificationResult.recommendations.length > 0 && (
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="h-6 w-6 text-blue-400" />
                        <Typography variant="h4" className="text-blue-400 font-semibold">
                          Recommendations
                        </Typography>
                      </div>
                      
                      <div className="space-y-3">
                        {verificationResult.recommendations.slice(0, 4).map((rec, index) => (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedVerify;