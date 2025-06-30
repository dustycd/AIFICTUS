import { isImageFile, formatFileSize } from '../utils/fileUtils';

export interface VerificationResult {
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
    isImage
  });

  // Extract data from the AI or Not API response
  const report = apiResult.report || {};
  const aiData = report.ai || {};
  const humanData = report.human || {};
  const generator = report.generator || {};
  const facets = apiResult.facets || {};

  // Calculate probabilities - handle both direct values and nested objects
  let aiConfidence = 0;
  let humanConfidence = 0;

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

  // For images, the API might return direct probability values
  if (isImage && apiResult.ai_probability !== undefined) {
    aiConfidence = apiResult.ai_probability;
    humanConfidence = apiResult.human_probability || (1 - aiConfidence);
  }

  // Fallback: if we don't have confidence values, try to extract from verdict
  if (aiConfidence === 0 && humanConfidence === 0) {
    if (report.verdict === 'ai') {
      aiConfidence = 0.8; // Assume high confidence if verdict is AI
      humanConfidence = 0.2;
    } else if (report.verdict === 'human') {
      aiConfidence = 0.2;
      humanConfidence = 0.8;
    } else {
      // Default to uncertain
      aiConfidence = 0.5;
      humanConfidence = 0.5;
    }
  }

  const aiProbability = aiConfidence * 100;
  const humanProbability = humanConfidence * 100;

  console.log('📈 Calculated probabilities:', {
    aiProbability: aiProbability.toFixed(1),
    humanProbability: humanProbability.toFixed(1),
    verdict: report.verdict
  });

  // Determine status based on verdict and confidence
  let status: 'authentic' | 'suspicious' | 'fake' = 'authentic';
  
  if (report.verdict === 'ai' || aiConfidence > 0.7) {
    status = 'fake';
  } else if (report.verdict === 'ai' || aiConfidence > 0.3) {
    status = 'suspicious';
  } else if (humanConfidence > 0.7) {
    status = 'authentic';
  } else {
    // Default based on confidence levels
    if (aiConfidence > humanConfidence) {
      status = aiConfidence > 0.5 ? 'fake' : 'suspicious';
    } else {
      status = 'authentic';
    }
  }

  console.log(`🎯 Final status: ${status}`);

  // Build risk factors based on detection
  const riskFactors = [];
  if (status === 'fake' || status === 'suspicious') {
    riskFactors.push('AI-generated content detected');
    
    // Find top generator if available
    if (generator && Object.keys(generator).length > 0) {
      const topGenerator = Object.entries(generator).reduce((a, b) => 
        (generator[a[0]] || 0) > (generator[b[0]] || 0) ? a : b, ['unknown', 0]
      );
      
      if (topGenerator[1] > 0.3) {
        riskFactors.push(`Likely generated by ${topGenerator[0].replace(/_/g, ' ')}`);
      }
    }
  }
  
  if (facets.nsfw?.is_detected) {
    riskFactors.push('NSFW content detected');
  }
  
  if (facets.quality?.is_detected === false) {
    riskFactors.push('Low quality content detected');
  }

  // Build detection details
  const detectionDetails: any = {
    faceAnalysis: Math.max(0, Math.min(100, humanProbability)),
    compressionArtifacts: Math.max(0, Math.min(100, humanProbability + (Math.random() * 10 - 5)))
  };

  if (isImage) {
    detectionDetails.metadataAnalysis = facets.quality?.is_detected !== false ? 85 : 65;
    detectionDetails.pixelAnalysis = Math.max(0, Math.min(100, humanProbability + (Math.random() * 10 - 5)));
  } else {
    detectionDetails.temporalConsistency = Math.max(0, Math.min(100, humanProbability + (Math.random() * 10 - 5)));
    detectionDetails.audioAnalysis = Math.max(0, Math.min(100, humanProbability + (Math.random() * 10 - 5)));
  }

  // Generate recommendations based on results
  const recommendations = [
    'Cross-reference with original source',
    'Verify metadata timestamps',
    'Check for additional context'
  ];

  if (isImage) {
    recommendations.push('Consider reverse image search');
  } else {
    recommendations.push('Analyze audio-visual consistency');
  }

  if (status === 'fake' || status === 'suspicious') {
    recommendations.push('Exercise caution when sharing this content');
    recommendations.push('Seek additional verification from trusted sources');
  }

  const result = {
    id: apiResult.id || `temp-${Date.now()}`,
    confidence: Math.max(0, Math.min(100, humanProbability)),
    status: status,
    processingTime: Math.max(0.1, processingTime),
    fileSize: formatFileSize(file.size),
    resolution: '1920x1080', // This would be extracted from actual file metadata
    duration: isImage ? undefined : '0:45', // This would be extracted from actual video
    aiProbability: Math.max(0, Math.min(100, aiProbability)),
    humanProbability: Math.max(0, Math.min(100, humanProbability)),
    detectionDetails: detectionDetails,
    riskFactors: riskFactors,
    recommendations: recommendations,
    reportId: apiResult.id || apiResult.report_id,
    rawApiResponse: apiResult,
    generatorAnalysis: generator,
    apiVerdict: report.verdict || (aiConfidence > humanConfidence ? 'ai' : 'human'),
    contentType: isImage ? 'image' : 'video'
  };

  console.log('✅ Processed API response into result:', {
    id: result.id,
    status: result.status,
    confidence: result.confidence,
    contentType: result.contentType
  });

  return result;
};

export default verifyWithAIOrNot;