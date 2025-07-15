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
  confidenceScore?: number; // Add confidenceScore to the interface
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
): Promise<VerificationResult> => { // Changed return type to Promise<VerificationResult>
  console.log('🚀 Starting AI or Not verification workflow...');
  console.log('📁 File details:', {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString()
  });
  
  if (!file) throw new Error('No file provided');
  if (!apiKey) throw new Error('API key not provided');
  
  const isImage = isImageFile(file);
  const isVideo = file.type.startsWith('video/') || (!isImage && file.name.match(/\.(mp4|mov|avi|webm|mkv|m4v|3gp|flv|wmv)$/i));
  console.log('🔍 File type analysis:', {
    contentType: file.type,
    isImage,
    isVideo,
    detectedBy: isImage ? 'isImageFile()' : 'video pattern match'
  });
  
  if (!isImage && !isVideo) {
    throw new Error(`Unsupported file type: ${file.type}. Please upload an image or video file.`);
  }

  console.log(`📊 Processing ${isImage ? 'image' : 'video'}: ${file.name} (${formatFileSize(file.size)})`);

  const endpoint = isImage
    ? 'https://api.aiornot.com/v1/reports/image'
    : 'https://api.aiornot.com/v1/reports/video';

  const paramName = isImage ? 'object' : 'video';
  const formData = new FormData();
  formData.append(paramName, file);
  
  console.log('🌐 API Request Configuration:', {
    endpoint,
    paramName,
    method: 'POST',
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none'
  });

  const startTime = Date.now();

  try {
    // Submit to API with proper CORS headers and error handling
    const controller = new AbortController();
    const uploadTimeout = isImage ? 45000 : 180000; // 45s for images, 3 minutes for videos
    const timeoutId = setTimeout(() => controller.abort(), uploadTimeout);

    console.log(`⏱️ Upload timeout configured: ${uploadTimeout / 1000}s for ${isImage ? 'image' : 'video'}`);
    console.log('📤 Initiating API request...');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json', // Explicitly request JSON
        'Authorization': `Bearer ${apiKey}`,
        // Remove Content-Type header to let browser set it with boundary for FormData
      },
      body: formData,
      signal: controller.signal,
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Don't send credentials to avoid CORS issues
    });

    clearTimeout(timeoutId);
    console.log('📥 API Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      console.error(`❌ API Response not OK: ${response.status} ${response.statusText}`);
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
    console.log('✅ Raw API Response Structure:', {
      hasReport: !!apiResult.report,
      hasId: !!apiResult.id,
      hasReportId: !!apiResult.report_id,
      topLevelKeys: Object.keys(apiResult),
      reportKeys: apiResult.report ? Object.keys(apiResult.report) : null
    });
    console.log('📋 Complete API Response:', JSON.stringify(apiResult, null, 2));

    // For videos, we need to poll for results since they process asynchronously
    let finalResult = apiResult;
    if (!isImage && apiResult.report_id && !apiResult.report) {
      console.log('⏳ Video requires polling - initial submission successful');
      console.log('🔄 Starting polling workflow for report_id:', apiResult.report_id);
      finalResult = await pollForVideoResults(apiResult.report_id, apiKey);
    } else if (!isImage) {
      console.log('✅ Video processing completed immediately - no polling required');
    } else {
      console.log('✅ Image processing completed immediately');
    }

    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`⏱️ Total processing time: ${processingTime.toFixed(2)}s`);

    // Process the API response into our standard format
    console.log('🔄 Processing API response into standard format...');
    const result = processApiResponse(finalResult, file, processingTime, isImage);
    console.log('✅ Final verification result:', {
      id: result.id,
      status: result.status,
      confidence: result.confidence,
      aiProbability: result.aiProbability,
      humanProbability: result.humanProbability,
      contentType: result.contentType,
      processingTime: result.processingTime
    });
    
    console.log('🎉 Verification workflow completed successfully');
    return result;

  } catch (error: any) {
    console.error('❌ Verification workflow failed:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    
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
  console.log(`🔄 Starting video polling workflow`);
  console.log('📋 Polling configuration:', {
    reportId,
    maxAttempts: 60,
    pollInterval: '10s',
    maxDuration: '10 minutes'
  });
  
  const maxAttempts = 60; // 10 minutes max (10 seconds * 60)
  const pollInterval = 10000; // 10 seconds between polls
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}`);
    
    // Wait before checking (except for first attempt)
    if (attempts > 1) {
      console.log(`⏳ Waiting ${pollInterval/1000}s before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout per request
      
      console.log(`📤 Checking status for report ${reportId}...`);

      const statusResponse = await fetch(`https://api.aiornot.com/v1/reports/${reportId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
      });

      clearTimeout(timeoutId);
      console.log(`📥 Status check response:`, {
        status: statusResponse.status,
        statusText: statusResponse.statusText,
        ok: statusResponse.ok
      });

      if (!statusResponse.ok) {
        console.error(`❌ Status check failed:`, {
          reportId,
          status: statusResponse.status,
          statusText: statusResponse.statusText,
          attempt: attempts
        });
        
        if (statusResponse.status === 404) {
          throw new Error('Video report not found. The video may have failed to upload or process.');
        }
        
        if (statusResponse.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        }
        
        // For other errors, continue polling unless it's the last attempt
        if (attempts >= maxAttempts) {
          throw new Error(`Status check failed with error ${statusResponse.status}: ${await statusResponse.text()}`);
        }
        
        console.warn(`⚠️ Status check failed, will retry on next attempt`);
        continue;
      }

      const statusResult = await statusResponse.json();
      console.log(`📊 Video processing status:`, {
        reportId,
        status: statusResult.status,
        hasReport: !!statusResult.report,
        attempt: attempts,
        responseKeys: Object.keys(statusResult)
      });

      // Check for completion
      if (statusResult.status === 'completed' && statusResult.report) {
        console.log('🎉 Video analysis completed successfully!');
        console.log('📋 Final video result structure:', {
          hasReport: !!statusResult.report,
          reportKeys: statusResult.report ? Object.keys(statusResult.report) : null,
          hasAiVideo: !!(statusResult.report && statusResult.report.ai_video),
          aiVideoKeys: (statusResult.report && statusResult.report.ai_video) ? Object.keys(statusResult.report.ai_video) : null
        });
        return statusResult;
      }
      
      // Check for failure states
      if (statusResult.status === 'failed') {
        console.error('❌ Video analysis failed:', {
          reportId,
          status: statusResult.status,
          attempt: attempts,
          result: statusResult
        });
        throw new Error('Video analysis failed. The file may be corrupted, too large, or in an unsupported format.');
      }
      
      if (statusResult.status === 'error') {
        console.error('❌ Video analysis error:', {
          reportId,
          status: statusResult.status,
          attempt: attempts,
          result: statusResult
        });
        throw new Error('Video analysis encountered an error. Please try again with a different file.');
      }

      // Continue polling for processing states
      if (statusResult.status === 'processing' || statusResult.status === 'pending' || statusResult.status === 'uploaded') {
        const progressPercent = Math.min(95, (attempts / maxAttempts) * 100);
        console.log(`⏳ Video still processing:`, {
          status: statusResult.status,
          progress: `${progressPercent.toFixed(1)}%`,
          attempt: attempts,
          maxAttempts
        });
        continue;
      }

      // Unknown status - log and continue
      console.warn(`⚠️ Unknown video processing status:`, {
        status: statusResult.status,
        reportId,
        attempt: attempts,
        willContinue: attempts < maxAttempts
      });
      
    } catch (error: any) {
      console.error(`❌ Error during polling attempt ${attempts}:`, {
        errorName: error.name,
        errorMessage: error.message,
        reportId,
        willRetry: attempts < maxAttempts
      });
      
      // If it's the last attempt, throw the error
      if (attempts >= maxAttempts) {
        throw new Error(`Video processing failed after ${maxAttempts} attempts: ${error.message}`);
      }
      
      // For network errors, continue polling
      if (error.name === 'AbortError') {
        console.warn('⚠️ Status check timed out, will retry');
        continue;
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('⚠️ Network error during status check, will retry');
        continue;
      }
      
      // For other errors, wait a bit longer before retrying
      console.warn(`⚠️ Status check error, waiting extra time before retry:`, {
        error: error.message,
        extraWait: '5s'
      });
      await new Promise(resolve => setTimeout(resolve, 5000)); // Extra 5 second wait
    }
  }

  // If we get here, we've exceeded max attempts
  const totalTime = (maxAttempts * pollInterval) / 1000 / 60; // Convert to minutes
  console.error(`❌ Video polling timeout after ${totalTime} minutes`);
  throw new Error(`Video processing timeout after ${totalTime} minutes. The video may be too large or complex to process. Please try with a smaller or shorter video file.`);
};

// Process API response into our standard format
const processApiResponse = (
  apiResult: any, 
  file: File, 
  processingTime: number, 
  isImage: boolean
): VerificationResult => {
  
  console.log('🔄 Starting API response processing:', {
    hasReport: !!apiResult.report,
    reportKeys: apiResult.report ? Object.keys(apiResult.report) : [],
    hasFacets: !!apiResult.facets,
    hasMediaInfo: !!apiResult.report?.media_info,
    facetKeys: apiResult.facets ? Object.keys(apiResult.facets) : [],
    isImage,
    contentType: isImage ? 'image' : 'video'
  });

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
  
  console.log('🎯 Starting confidence extraction process...');
  
  if (isImage) {
    // Existing image processing logic (unchanged)
    console.log('📸 Processing IMAGE confidence values (unchanged logic)...');
    if (typeof apiResult.ai_probability === 'number' && typeof apiResult.human_probability === 'number') {
      aiConfidence = apiResult.ai_probability;
      humanConfidence = apiResult.human_probability;
      console.log('✅ Image: Using direct API probabilities:', { aiConfidence, humanConfidence });
    } else if (typeof apiResult.ai_probability === 'number') {
      aiConfidence = apiResult.ai_probability;
      humanConfidence = 1 - aiConfidence;
      console.log('⚠️ Image: Using AI probability only, inferring human:', { aiConfidence, humanConfidence });
    } else if (typeof aiData.confidence === 'number' || typeof aiData === 'number') {
      if (typeof aiData.confidence === 'number') {
        aiConfidence = aiData.confidence;
      } else if (typeof aiData === 'number') {
        aiConfidence = aiData;
      }
      if (typeof humanData.confidence === 'number') {
        humanConfidence = humanData.confidence;
      } else if (typeof humanData === 'number') {
        humanConfidence = humanData;
      } else {
        humanConfidence = 1 - aiConfidence;
      }
      console.log('⚠️ Image: Using fallback aiData/humanData:', { aiConfidence, humanConfidence });
    } else {
      console.warn('❌ Image: No confidence values found.');
    }
  } else {
    console.log('📹 Processing VIDEO confidence values...');
    
    // Prioritize ai_video.is_detected and ai_video.confidence for video
    if (typeof aiVideo.is_detected === 'boolean' && typeof aiVideo.confidence === 'number') {
      console.log('✅ Video: Using ai_video.is_detected and ai_video.confidence.');
      if (aiVideo.is_detected) {
        status = 'fake';
        aiConfidence = aiVideo.confidence;
        humanConfidence = 1 - aiConfidence;
        console.log('  -> Detected as FAKE:', { aiConfidence, humanConfidence });
      } else {
        status = 'authentic';
        humanConfidence = aiVideo.confidence;
        aiConfidence = 1 - humanConfidence;
        console.log('  -> Detected as AUTHENTIC:', { aiConfidence, humanConfidence });
      }
    } else if (typeof aiVideo.ai_probability === 'number' && typeof aiVideo.human_probability === 'number') {
      // Fallback to ai_video.ai_probability/human_probability
      aiConfidence = aiVideo.ai_probability;
      humanConfidence = aiVideo.human_probability;
      console.log('⚠️ Video: Using ai_video.ai_probability/human_probability fallback:', { aiConfidence, humanConfidence });
    } else if (typeof aiVideo.confidence === 'number') {
      // Fallback to general ai_video.confidence (inferring human)
      aiConfidence = aiVideo.confidence;
      humanConfidence = 1 - aiConfidence;
      console.log('⚠️ Video: Using ai_video.confidence fallback (human inferred):', { aiConfidence, humanConfidence });
    } else if (typeof aiData.confidence === 'number' || typeof aiData === 'number') {
      // Final fallback to general aiData/humanData
      console.log('⚠️ Video: Using general aiData/humanData fallback.');
      if (typeof aiData.confidence === 'number') {
        aiConfidence = aiData.confidence;
      } else if (typeof aiData === 'number') {
        aiConfidence = aiData;
      }
      
      if (typeof humanData.confidence === 'number') {
        humanConfidence = humanData.confidence;
      } else if (typeof humanData === 'number') {
        humanConfidence = humanData;
      } else {
        humanConfidence = 1 - aiConfidence; // Infer if not provided
      }
      console.log('  -> Fallback results:', { aiConfidence, humanConfidence });
    } else {
      console.warn('❌ Video: No confidence values found for video.');
    }
  }
  
  const aiProbability = aiConfidence * 100;
  const humanProbability = humanConfidence * 100;
  
  // Determine status and final confidence
  console.log('🎯 Determining final status and confidence...');
  let status: 'authentic' | 'fake';
  let finalConfidence: number;
  
  if (!isImage) {
    // Video-specific status determination
    if (typeof aiVideo.is_detected === 'boolean') {
      status = aiVideo.is_detected ? 'fake' : 'authentic';
      finalConfidence = aiVideo.confidence * 100;
      console.log('✅ Video: Status and confidence from ai_video.is_detected/confidence:', { status, finalConfidence });
    } else if (report.verdict === 'ai') {
      status = 'fake';
      finalConfidence = aiProbability;
      console.log('✅ Video: Status determined by API verdict "ai":', { status, finalConfidence });
    } else if (report.verdict === 'human') {
      status = 'authentic';
      finalConfidence = humanProbability;
      console.log('✅ Video: Status determined by API verdict "human":', { status, finalConfidence });
    } else if (aiProbability > humanProbability && aiProbability > 0) {
      status = 'fake';
      finalConfidence = aiProbability;
      console.log('✅ Video: Status determined by AI probability dominance:', { status, finalConfidence });
    } else if (humanProbability > aiProbability && humanProbability > 0) {
      status = 'authentic';
      finalConfidence = humanProbability;
      console.log('✅ Video: Status determined by human probability dominance:', { status, finalConfidence });
    } else {
      status = 'authentic'; // Default fallback
      finalConfidence = 0;
      console.warn('⚠️ Video: No clear status signal from API, defaulting to authentic.');
    }
  } else {
    // Existing image-specific status determination (unchanged)
    if (report.verdict === 'ai') {
      status = 'fake';
      finalConfidence = aiProbability;
      console.log('✅ Image: Status determined by API verdict "ai":', { status, finalConfidence });
    } else if (report.verdict === 'human') {
      status = 'authentic';
      finalConfidence = humanProbability;
      console.log('✅ Image: Status determined by API verdict "human":', { status, finalConfidence });
    } else if (aiProbability > humanProbability && aiProbability > 0) {
      status = 'fake';
      finalConfidence = aiProbability;
      console.log('✅ Image: Status determined by AI probability dominance:', { status, finalConfidence });
    } else if (humanProbability > aiProbability && humanProbability > 0) {
      status = 'authentic';
      finalConfidence = humanProbability;
      console.log('✅ Image: Status determined by human probability dominance:', { status, finalConfidence });
    } else {
      status = report.verdict === 'ai' ? 'fake' : 'authentic'; // Fallback to verdict or default
      finalConfidence = 0;
      console.warn('⚠️ Image: No clear status signal from API, using verdict or defaulting.');
    }
  }

  console.log('🎯 Final status determination:', {
    status,
    finalConfidence: finalConfidence.toFixed(1) + '%',
    contentType: isImage ? 'image' : 'video'
  });

  console.log('📈 Final extracted probabilities:', {
    aiConfidence: aiConfidence.toFixed(4),
    humanConfidence: humanConfidence.toFixed(4),
    aiProbability: aiProbability.toFixed(1) + '%',
    humanProbability: humanProbability.toFixed(1) + '%'
  });
  
  // Extract resolution and duration ONLY from API media info - no defaults
  console.log('📐 Extracting media information...');
  let resolution = undefined;
  let duration = undefined;
  
  if (mediaInfo.width && mediaInfo.height) {
    resolution = `${mediaInfo.width}x${mediaInfo.height}`;
    console.log('✅ Resolution extracted:', resolution);
  } else {
    console.log('⚠️ No resolution data in API response');
  }

  if (!isImage && mediaInfo.duration_seconds) {
    const minutes = Math.floor(mediaInfo.duration_seconds / 60);
    const seconds = Math.floor(mediaInfo.duration_seconds % 60);
    duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    console.log('✅ Duration extracted:', duration);
  } else if (!isImage) {
    console.log('⚠️ No duration data in API response');
  }

  // Extract risk factors ONLY from API - no derived values
  console.log('🚨 Extracting risk factors...');
  const riskFactors = [];
  
  if (report.risk_factors && Array.isArray(report.risk_factors)) {
    riskFactors.push(...report.risk_factors);
    console.log('✅ Risk factors extracted:', report.risk_factors.length, 'factors');
  } else {
    console.log('⚠️ No risk factors in API response');
  }


  // Extract recommendations ONLY from API - no derived values
  console.log('💡 Extracting recommendations...');
  const recommendations = [];
  
  if (report.recommendations && Array.isArray(report.recommendations)) {
    recommendations.push(...report.recommendations);
    console.log('✅ Recommendations extracted:', report.recommendations.length, 'recommendations');
  } else {
    console.log('⚠️ No recommendations in API response');
  }
  
  // Build detection details ONLY from API facets and report details - no fallbacks
  console.log('🔍 Building detection details...');
  const detectionDetails: any = {};

  // Only set values if API provides them
  if (facets.face_detection?.score !== undefined) {
    detectionDetails.faceAnalysis = Math.round(facets.face_detection.score * 100);
    console.log('✅ Face analysis score:', detectionDetails.faceAnalysis + '%');
  } else if (aiData.details?.face_analysis !== undefined) {
    detectionDetails.faceAnalysis = Math.round(aiData.details.face_analysis * 100);
    console.log('✅ Face analysis score (fallback):', detectionDetails.faceAnalysis + '%');
  }
  
  if (facets.quality?.score !== undefined) {
    detectionDetails.compressionArtifacts = Math.round(facets.quality.score * 100);
    console.log('✅ Compression artifacts score:', detectionDetails.compressionArtifacts + '%');
  }
  
  if (isImage) {
    console.log('📸 Adding image-specific detection details...');
    if (facets.metadata?.score !== undefined) {
      detectionDetails.metadataAnalysis = Math.round(facets.metadata.score * 100);
      console.log('✅ Metadata analysis score:', detectionDetails.metadataAnalysis + '%');
    }
    
    if (aiData.details?.pixel_analysis !== undefined) {
      detectionDetails.pixelAnalysis = Math.round(aiData.details.pixel_analysis * 100);
      console.log('✅ Pixel analysis score:', detectionDetails.pixelAnalysis + '%');
    }
  } else {
    console.log('📹 Adding video-specific detection details...');
    if (aiData.details?.temporal_consistency !== undefined) {
      detectionDetails.temporalConsistency = Math.round(aiData.details.temporal_consistency * 100);
      console.log('✅ Temporal consistency score:', detectionDetails.temporalConsistency + '%');
    }
    
    if (facets.audio_analysis?.score !== undefined) {
      detectionDetails.audioAnalysis = Math.round(facets.audio_analysis.score * 100);
      console.log('✅ Audio analysis score:', detectionDetails.audioAnalysis + '%');
    }
  }
  
  console.log('🔍 Final detection details:', {
    detailsCount: Object.keys(detectionDetails).length,
    details: detectionDetails
  });
  
  const result = {
    id: apiResult.id || `temp-${Date.now()}`,
    confidence: finalConfidence,
    confidenceScore: finalConfidence, // Add confidenceScore to the result
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

  console.log('✅ Final processed result summary:', {
    id: result.id,
    status: result.status,
    confidence: result.confidence.toFixed(1) + '%',
    aiProbability: result.aiProbability.toFixed(1) + '%',
    humanProbability: result.humanProbability.toFixed(1) + '%',
    contentType: result.contentType,
    resolution: result.resolution || 'unknown',
    duration: result.duration || 'N/A',
    riskFactorsCount: result.riskFactors.length,
    recommendationsCount: result.recommendations.length,
    detectionDetailsCount: Object.keys(result.detectionDetails).length
  });

  console.log('🎉 API response processing completed successfully');
  return result;
};

export default verifyWithAIOrNot;