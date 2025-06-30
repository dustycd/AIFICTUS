// Re-export storage utilities for backward compatibility
export { 
  isImageFile, 
  isVideoFile, 
  getContentType, 
  validateFile,
  formatFileSize,
  getSupportedFileExtensions,
  getSupportedMimeTypes,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZES
} from '../lib/storage'

// API helper functions - now using the unified verifyWithAIOrNot workflow
export const getApiEndpoint = (isImage: boolean): string => {
  return isImage 
    ? 'https://api.aiornot.com/v1/reports/image'
    : 'https://api.aiornot.com/v1/reports/video'
}

export const getApiParamName = (isImage: boolean): string => {
  return isImage ? 'object' : 'video'
}

// Get API key from environment
export const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_AIORNOT_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_AIORNOT_API_KEY environment variable is not set');
  }
  return apiKey;
}