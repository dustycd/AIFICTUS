import { isImageFile, formatFileSize } from '../utils/fileUtils';

export interface VerificationResult {
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

export const verifyWithAIOrNot = async (
  file: File,
  apiKey: string
): Promise<VerificationResult> => {
  console.log('🚀 Starting AI or Not verification...');
  
  if (!file) throw new Error('No file provided');
  if (!apiKey) throw new Error('API key not provided');
  
  const isImage = isImageFile(file);
  const isVideo = file.type.startsWith('video/') || (!isImage && file.name.match(/\.(mp4|mov|avi|webm|mkv|m4v|3gp|flv|wmv)$/i));
  
  if (!isImage && !isVideo) {
    throw new Error(`Unsupported file type: ${file.type}. Please upload an image or video file.`);
  }

  console.log(`📁 Processing ${isImage ? 'image' : 'video'}: ${file.name} (${formatFileSize(file.size)})`);

  const endpoint = isImage
    ? 'https://api.aiornot.com/v1/reports/image'
    : 'https://api.aiornot.com/v1/reports/video';

  const paramName = isImage ? 'object' : 'video';
  const formData = new FormData();
  formData.append(paramName, file);

  console.log(`🌐 Submitting to: ${endpoint}`);
  console.log(`🎯 Parameter name: ${paramName}`);

  const startTime = Date.now();

  try {
    // Submit to API with proper CORS headers and error handling
    const controller = new AbortController();
    const uploadTimeout = isImage ? 45000 : 180000; // 45s for images, 3 minutes for videos
    const timeoutId = setTimeout(() => controller.abort(), uploadTimeout);

    console.log(`⏱️ Upload timeout set to: ${uploadTimeout / 1000}s`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // Remove Content-Type header to let browser set it with boundary for FormData
      },
      body: formData,
      signal: controller.signal,
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Don't send credentials to avoid CORS issues
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }
      
      console.error(`❌ API Error ${response.status}: ${errorText}`);
      
      // Handle specific HTTP status codes
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your configuration.');
      } else if (response.status === 403) {
        throw new Error('Access forbidden. Please check your API key permissions.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 413) {
        throw new Error('File is too large. Please try with a smaller file.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`API Error ${response.status}: ${errorText || 'Unknown error'}`);
      }
    }

    const apiResult = await response.json();
    console.log('✅ API Response received:', apiResult);

    // For videos, we need to poll for results since they process asynchronously
    let finalResult = apiResult;
    if (!isImage && apiResult.report_id && !apiResult.report) {
      console.log('⏳ Video submitted for processing - polling for results...');
      finalResult = await pollForVideoResults(apiResult.report_id, apiKey);
    }

    const processingTime = (Date.now() - startTime) / 1000;

    // Process the API response into our standard format
    const result = processApiResponse(finalResult, file, processingTime, isImage);
    
    console.log('✅ Verification completed successfully');
    return result;

  } catch (error: any) {
    console.error('❌ Verification failed:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error('Upload timed out. Please try again with a smaller file or check your internet connection.');
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    if (error.message.includes('CORS')) {
      throw new Error('Network configuration error. Please contact support.');
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to verification service. Please check your internet connection.');
    }
    
    // Re-throw our custom errors
    if (error.message.includes('Invalid API key') || 
        error.message.includes('Rate limit') || 
        error.message.includes('too large') ||
        error.message.includes('Server error')) {
      throw error;
    }
    
    // Generic fallback
    throw new Error(`Verification failed: ${error.message}. Please try again or contact support.`);
  }
};

// Poll for video results with better error handling and CORS support
const pollForVideoResults = async (reportId: string, apiKey: string): Promise<any> => {
  console.log(`🔄 Starting to poll for video results (Report ID: ${reportId})`);
  
  const maxAttempts = 60; // 10 minutes max (10 seconds * 60)
  const pollInterval = 10000; // 10 seconds between polls
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🔄 Polling attempt ${attempts}/${maxAttempts} (waiting ${pollInterval/1000}s between attempts)...`);
    
    // Wait before checking (except for first attempt)
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout per request

      const statusResponse = await fetch(`https://api.aiornot.com/v1/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
      });

      clearTimeout(timeoutId);

      if (!statusResponse.ok) {
        console.error(`❌ Status check failed: ${statusResponse.status}`);
        
        if (statusResponse.status === 404) {
          throw new Error('Video report not found. The video may have failed to upload or process.');
        }
        
        if (statusResponse.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        }
        
        // For other errors, continue polling unless it's the last attempt
        if (attempts >= maxAttempts) {
          throw new Error(`Status check failed with error ${statusResponse.status}`);
        }
        
        console.warn(`⚠️ Status check failed (${statusResponse.status}), retrying...`);
        continue;
      }

      const statusResult = await statusResponse.json();
      console.log(`📊 Status check result:`, {
        status: statusResult.status,
        hasReport: !!statusResult.report,
        reportId: statusResult.id || reportId
      });

      // Check for completion
      if (statusResult.status === 'completed' && statusResult.report) {
        console.log('✅ Video analysis completed successfully!');
        return statusResult;
      }
      
      // Check for failure states
      if (statusResult.status === 'failed') {
        console.error('❌ Video analysis failed:', statusResult);
        throw new Error('Video analysis failed. The file may be corrupted, too large, or in an unsupported format.');
      }
      
      if (statusResult.status === 'error') {
        console.error('❌ Video analysis error:', statusResult);
        throw new Error('Video analysis encountered an error. Please try again with a different file.');
      }

      // Continue polling for processing states
      if (statusResult.status === 'processing' || statusResult.status === 'pending' || statusResult.status === 'uploaded') {
        const progressPercent = Math.min(95, (attempts / maxAttempts) * 100);
        console.log(`⏳ Video still processing (status: ${statusResult.status}) - ${progressPercent.toFixed(1)}% complete`);
        continue;
      }

      // Unknown status - log and continue
      console.warn(`⚠️ Unknown status: ${statusResult.status}, continuing to poll...`);
      
    } catch (error: any) {
      console.error(`❌ Error during status check attempt ${attempts}:`, error.message);
      
      // If it's the last attempt, throw the error
      if (attempts >= maxAttempts) {
        throw new Error(`Video processing failed after ${maxAttempts} attempts: ${error.message}`);
      }
      
      // For network errors, continue polling
      if (error.name === 'AbortError') {
        console.warn('⚠️ Status check timed out, retrying...');
        continue;
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('⚠️ Network error during status check, retrying...');
        continue;
      }
      
      // For other errors, wait a bit longer before retrying
      console.warn(`⚠️ Status check error, waiting longer before retry: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Extra 5 second wait
    }
  }

  // If we get here, we've exceeded max attempts
  const totalTime = (maxAttempts * pollInterval) / 1000 / 60; // Convert to minutes
  throw new Error(`Video processing timeout after ${totalTime} minutes. The video may be too large or complex to process. Please try with a smaller or shorter video file.`);
};

// Process API response into our standard format
const processApiResponse = (
  apiResult: any, 
  file: File, 
  processingTime: number, 
  isImage: boolean
): VerificationResult => {
  
  console.log('📊 Processing API response:', {
    hasReport: !!apiResult.report,
    reportKeys: apiResult.report ? Object.keys(apiResult.report) : [],
    hasFacets: !!apiResult.facets,
    hasMediaInfo: !!apiResult.report?.media_info,
    facetKeys: apiResult.facets ? Object.keys(apiResult.facets) : [],
    isImage
  });

  // Log the complete raw API response for debugging
  console.log('🔍 Complete API Response:', JSON.stringify(apiResult, null, 2));

  // Extract data from the AI or Not API response
  const report = apiResult.report || {};
  const aiData = report.ai || {};
  const humanData = report.human || {};
  const generator = report.generator || {};
  const facets = apiResult.facets || {};
  const mediaInfo = report.media_info || {};
  const aiVideo = report.ai_video || {};

  let aiConfidence = 0;
  let humanConfidence = 0;

  // Prioritize probabilities from the most specific fields
  if (isImage) {
    // For images, probabilities are often directly in apiResult
    if (apiResult.ai_probability !== undefined && typeof apiResult.ai_probability === 'number') {
      aiConfidence = apiResult.ai_probability;
      humanConfidence = apiResult.human_probability !== undefined && typeof apiResult.human_probability === 'number'
        ? apiResult.human_probability
        : (1 - aiConfidence); // Fallback if human_probability is missing
      console.log('📸 Using direct probabilities from API for image:', { aiConfidence, humanConfidence });
    } else {
      // Fallback to general aiData/humanData if direct probabilities are not found
      if (typeof aiData.confidence === 'number') {
        aiConfidence = aiData.confidence;
      } else if (typeof aiData === 'number') {
        aiConfidence = aiData;
      }
      if (typeof humanData.confidence === 'number') {
        humanConfidence = humanData.confidence;
      } else if (typeof humanData === 'number') {
        humanConfidence = humanData;
      }
      console.warn('⚠️ Image API did not provide direct probabilities, falling back to aiData/humanData:', { aiConfidence, humanConfidence });
    }
  } else { // It's a video
    // For videos, probabilities are typically in report.ai_video
    if (aiVideo.ai_probability !== undefined && typeof aiVideo.ai_probability === 'number') {
      aiConfidence = aiVideo.ai_probability;
      humanConfidence = aiVideo.human_probability !== undefined && typeof aiVideo.human_probability === 'number'
        ? aiVideo.human_probability
        : (1 - aiConfidence); // Fallback if human_probability is missing
      console.log('📹 Using ai_video probabilities from API for video:', { aiConfidence, humanConfidence });
    } else if (aiVideo.confidence !== undefined && typeof aiVideo.confidence === 'number') {
      // Fallback if only aiVideo.confidence is provided, assume it's AI confidence
      aiConfidence = aiVideo.confidence;
      humanConfidence = 1 - aiConfidence; // Infer human confidence
      console.warn('⚠️ Video API provided only ai_video.confidence, inferring human confidence:', { aiConfidence, humanConfidence });
    } else {
      // Fallback to general aiData/humanData if ai_video probabilities are not found
      if (typeof aiData.confidence === 'number') {
        aiConfidence = aiData.confidence;
      } else if (typeof aiData === 'number') {
        aiConfidence = aiData;
      }
      if (typeof humanData.confidence === 'number') {
        humanConfidence = humanData.confidence;
      } else if (typeof humanData === 'number') {
        humanConfidence = humanData;
      }
      console.warn('⚠️ Video API did not provide ai_video probabilities or confidence, falling back to aiData/humanData:', { aiConfidence, humanConfidence });
    }
  }

  // Log extracted probabilities from API
  console.log('📈 API Probabilities:', {
    aiConfidence,
    humanConfidence,
    verdict: report.verdict,
    hasAiData: !!aiData,
    hasHumanData: !!humanData
  });
  // If API doesn't provide probabilities, warn and keep them as zero
  if (aiConfidence === 0 && humanConfidence === 0) {
    console.warn('⚠️ API did not provide confidence values - using zero values (no fallback)');
  }

  const aiProbability = aiConfidence * 100;
  const humanProbability = humanConfidence * 100;

  console.log('📈 Calculated probabilities:', {
    aiProbability: aiProbability.toFixed(1),
    humanProbability: humanProbability.toFixed(1),
    verdict: report.verdict
  });

  // Determine status based on API verdict or probabilities - no defaults
  let status: 'authentic' | 'fake';
  let finalConfidence = humanProbability;
  
  // Use API verdict if available
  if (report.verdict === 'ai') {
    status = 'fake';
    finalConfidence = aiProbability;
  } else if (report.verdict === 'human') {
    status = 'authentic';
    finalConfidence = humanProbability;
  } else if (aiProbability > humanProbability && aiProbability > 0) {
    status = 'fake';
    finalConfidence = aiProbability;
  } else if (humanProbability > aiProbability && humanProbability > 0) {
    status = 'authentic';
    finalConfidence = humanProbability;
  } else {
    // No clear signal from API - use verdict or default to authentic
    status = report.verdict === 'ai' ? 'fake' : 'authentic';
    finalConfidence = 0; // No confidence if API doesn't provide clear signal
    console.warn('⚠️ API provided no clear status signal - using verdict or defaulting to authentic with 0% confidence');
  }

  console.log(`🎯 Final status: ${status} with ${finalConfidence.toFixed(1)}% confidence`);

  // Extract resolution and duration ONLY from API media info - no defaults
  let resolution = undefined;
  let duration = undefined;
  
  if (mediaInfo.width && mediaInfo.height) {
    resolution = `${mediaInfo.width}x${mediaInfo.height}`;
    console.log('📐 Extracted resolution from API:', resolution);
  } else {
    console.log('📐 No resolution data provided by API');
  }
  
  if (!isImage && mediaInfo.duration_seconds) {
    const minutes = Math.floor(mediaInfo.duration_seconds / 60);
    const seconds = Math.floor(mediaInfo.duration_seconds % 60);
    duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    console.log('⏱️ Extracted duration from API:', duration);
  } else if (!isImage) {
    console.log('⏱️ No duration data provided by API');
  }
  
  // Extract risk factors ONLY from API - no derived values
  const riskFactors = [];
  
  if (report.risk_factors && Array.isArray(report.risk_factors)) {
    riskFactors.push(...report.risk_factors);
    console.log('🚨 Using API risk factors:', report.risk_factors);
  } else {
    console.log('🚨 No risk factors provided by API');
  }
  

  // Extract recommendations ONLY from API - no derived values
  const recommendations = [];
  
  if (report.recommendations && Array.isArray(report.recommendations)) {
    recommendations.push(...report.recommendations);
    console.log('💡 Using API recommendations:', report.recommendations);
  } else {
    console.log('💡 No recommendations provided by API');
  }

  // Build detection details ONLY from API facets and report details - no fallbacks
  const detectionDetails: any = {};
  
  // Only set values if API provides them
  if (facets.face_detection?.score !== undefined) {
    detectionDetails.faceAnalysis = Math.round(facets.face_detection.score * 100);
  } else if (aiData.details?.face_analysis !== undefined) {
    detectionDetails.faceAnalysis = Math.round(aiData.details.face_analysis * 100);
  }
  
  if (facets.quality?.score !== undefined) {
    detectionDetails.compressionArtifacts = Math.round(facets.quality.score * 100);
  }
  
  if (isImage) {
    if (facets.metadata?.score !== undefined) {
      detectionDetails.metadataAnalysis = Math.round(facets.metadata.score * 100);
    }
    
    if (aiData.details?.pixel_analysis !== undefined) {
      detectionDetails.pixelAnalysis = Math.round(aiData.details.pixel_analysis * 100);
    }
  } else {
    if (aiData.details?.temporal_consistency !== undefined) {
      detectionDetails.temporalConsistency = Math.round(aiData.details.temporal_consistency * 100);
    }
    
    if (facets.audio_analysis?.score !== undefined) {
      detectionDetails.audioAnalysis = Math.round(facets.audio_analysis.score * 100);
    }
  }

  console.log('🔍 Enhanced detection details:', detectionDetails);

  const result = {
    id: apiResult.id || `temp-${Date.now()}`,
    confidence: finalConfidence,
    status: status,
    processingTime: Math.max(0.1, processingTime),
    fileSize: formatFileSize(file.size),
    resolution: resolution,
    duration: duration,
    aiProbability: aiProbability,
    humanProbability: humanProbability,
    detectionDetails: detectionDetails,
    riskFactors: riskFactors,
    recommendations: recommendations,
    reportId: apiResult.id || apiResult.report_id,
    rawApiResponse: apiResult,
    generatorAnalysis: generator,
    apiVerdict: report.verdict,
    contentType: isImage ? 'image' : 'video'
  };

  console.log('✅ Processed API response into result:', {
    id: result.id,
    status: result.status,
    confidence: result.confidence,
    contentType: result.contentType,
    resolution: result.resolution,
    duration: result.duration,
    riskFactorsCount: result.riskFactors.length,
    recommendationsCount: result.recommendations.length
  });

  return result;
};

export default verifyWithAIOrNot;