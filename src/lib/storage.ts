import { supabase } from './supabase'

// Storage configuration
export const STORAGE_BUCKETS = {
  VIDEOS: 'verification-videos',
  IMAGES: 'verification-images', 
  THUMBNAILS: 'verification-thumbnails'
} as const

export const FILE_SIZE_LIMITS = {
  VIDEO: 500 * 1024 * 1024, // 500MB
  IMAGE: 50 * 1024 * 1024,  // 50MB
  THUMBNAIL: 5 * 1024 * 1024 // 5MB
} as const

// Supported file types
export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv',
  'video/webm', 'video/mkv', 'video/m4v', 'video/3gp', 'video/3g2',
  'video/mts', 'video/m2ts', 'video/ts', 'video/mxf', 'video/asf',
  'video/rm', 'video/rmvb', 'video/vob', 'video/ogv', 'video/dv',
  'video/quicktime'
]

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
  'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif',
  'image/avif', 'image/jxl', 'image/raw', 'image/cr2', 'image/nef',
  'image/arw', 'image/dng', 'image/psd', 'image/ico', 'image/jp2',
  'image/jpm', 'image/jpx'
]

export const SUPPORTED_THUMBNAIL_TYPES = [
  'image/jpeg', 'image/png', 'image/webp'
]

// File type detection utilities
export const isVideoFile = (file: File): boolean => {
  return SUPPORTED_VIDEO_TYPES.includes(file.type) || 
         /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|3g2|mts|m2ts|ts|mxf|asf|rm|rmvb|vob|ogv|dv)$/i.test(file.name)
}

export const isImageFile = (file?: File, url?: string): boolean => {
  if (file) {
    return SUPPORTED_IMAGE_TYPES.includes(file.type) ||
           /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|svg|heic|heif|avif|jxl|raw|cr2|nef|arw|dng|psd|ico|jp2|jpm|jpx)$/i.test(file.name)
  }
  if (url) {
    return /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|svg|heic|heif|avif|jxl|raw|cr2|nef|arw|dng|psd|ico|jp2|jpm|jpx)(\?.*)?$/i.test(url)
  }
  return false
}

export const isVideoUrl = (url: string): boolean => {
  return /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|3g2|mts|m2ts|ts|mxf|asf|rm|rmvb|vob|ogv|dv)(\?.*)?$/i.test(url)
}

export const isImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|svg|heic|heif|avif|jxl|raw|cr2|nef|arw|dng|psd|ico|jp2|jpm|jpx)(\?.*)?$/i.test(url)
}

// File validation
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check if file type is supported
  if (!isVideoFile(file) && !isImageFile(file)) {
    return {
      isValid: false,
      error: 'Unsupported file type. Please upload a video or image file.'
    }
  }

  // Check file size limits
  const isVideo = isVideoFile(file)
  const maxSize = isVideo ? FILE_SIZE_LIMITS.VIDEO : FILE_SIZE_LIMITS.IMAGE
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit for ${isVideo ? 'videos' : 'images'}.`
    }
  }

  return { isValid: true }
}

// Get content type for API calls
export const getContentType = (file: File): 'image' | 'video' => {
  return isImageFile(file) ? 'image' : 'video'
}

// Get supported file extensions
export const getSupportedFileExtensions = (): string => {
  const videoExts = 'mp4,avi,mov,wmv,flv,webm,mkv,m4v,3gp,3g2,mts,m2ts,ts,mxf,asf,rm,rmvb,vob,ogv,dv'
  const imageExts = 'jpg,jpeg,png,gif,webp,bmp,tiff,tif,svg,heic,heif,avif,jxl,raw,cr2,nef,arw,dng,psd,ico,jp2,jpm,jpx'
  return `.${videoExts.split(',').join(',.')},${imageExts.split(',').join(',.')}`
}

// Get supported MIME types
export const getSupportedMimeTypes = (): string => {
  return [...SUPPORTED_VIDEO_TYPES, ...SUPPORTED_IMAGE_TYPES].join(',')
}

// Legacy exports for backward compatibility
export const SUPPORTED_FILE_TYPES = {
  VIDEO: SUPPORTED_VIDEO_TYPES,
  IMAGE: SUPPORTED_IMAGE_TYPES
}

export const MAX_FILE_SIZES = FILE_SIZE_LIMITS

// Generate secure file path
export const generateFilePath = async (
  userId: string,
  verificationId: string,
  originalFilename: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('generate_file_path', {
      user_id: userId,
      verification_id: verificationId,
      original_filename: originalFilename
    })

    if (error) {
      console.error('Error generating file path:', error)
      // Fallback to manual generation
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const cleanFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
      return `${userId}/${verificationId}/${timestamp}_${cleanFilename}`
    }

    return data
  } catch (err) {
    console.error('Exception generating file path:', err)
    // Fallback to manual generation
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const cleanFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
    return `${userId}/${verificationId}/${timestamp}_${cleanFilename}`
  }
}

// Helper function to parse error responses
const parseErrorResponse = (error: any): string => {
  // Handle HTML error pages (like 504 Gateway Timeout)
  if (typeof error === 'string' && error.includes('<html>')) {
    if (error.includes('504 Gateway Time-out')) {
      return 'Storage service temporarily unavailable (504 Gateway Timeout). Please try again in a few moments.'
    }
    if (error.includes('503 Service Unavailable')) {
      return 'Storage service temporarily unavailable (503 Service Unavailable). Please try again later.'
    }
    if (error.includes('502 Bad Gateway')) {
      return 'Storage service temporarily unavailable (502 Bad Gateway). Please try again later.'
    }
    return 'Storage service temporarily unavailable. Please try again later.'
  }

  // Handle Supabase error objects
  if (error && typeof error === 'object') {
    if (error.message) {
      return error.message
    }
    if (error.error) {
      return error.error
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  return 'Unknown storage error occurred'
}

// Upload file to storage with improved error handling
export const uploadFile = async (
  file: File,
  userId: string,
  verificationId: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string; bucket: string; publicUrl?: string; error?: string }> => {
  try {
    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      return { path: '', bucket: '', error: validation.error }
    }

    // Determine bucket
    const bucket = isVideoFile(file) ? STORAGE_BUCKETS.VIDEOS : STORAGE_BUCKETS.IMAGES

    // Generate secure file path
    const filePath = await generateFilePath(userId, verificationId, file.name)

    console.log(`Uploading file to bucket: ${bucket}, path: ${filePath}`)

    // Upload file with progress tracking and timeout handling
    const uploadPromise = supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    // Add timeout to the upload operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Upload timeout: The file upload took too long. Please try again with a smaller file or check your internet connection.'))
      }, 120000) // 2 minute timeout
    })

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any

    if (error) {
      console.error('Storage upload error:', error)
      const errorMessage = parseErrorResponse(error)
      
      // Provide specific guidance for common errors
      if (errorMessage.includes('504') || errorMessage.includes('Gateway Timeout')) {
        return { 
          path: '', 
          bucket: '', 
          error: 'Upload timed out due to server issues. Please try again in a few minutes, or try uploading a smaller file.' 
        }
      }
      
      if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        return { 
          path: '', 
          bucket: '', 
          error: 'File is too large for upload. Please try with a smaller file.' 
        }
      }
      
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        return { 
          path: '', 
          bucket: '', 
          error: 'Upload permission denied. Please check your account permissions or contact support.' 
        }
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return { 
          path: '', 
          bucket: '', 
          error: 'Authentication failed. Please sign in again and try uploading.' 
        }
      }

      return { 
        path: '', 
        bucket: '', 
        error: `Upload failed: ${errorMessage}` 
      }
    }

    console.log('File uploaded successfully:', data)
    
    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    // Simulate progress completion
    if (onProgress) {
      onProgress(100)
    }

    return {
      path: data.path,
      bucket: bucket,
      publicUrl: urlData.publicUrl
    }
  } catch (err: any) {
    console.error('Upload exception:', err)
    
    // Handle timeout errors specifically
    if (err.message && err.message.includes('timeout')) {
      return { 
        path: '', 
        bucket: '', 
        error: err.message
      }
    }
    
    // Handle network errors
    if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
      return { 
        path: '', 
        bucket: '', 
        error: 'Network error during upload. Please check your internet connection and try again.' 
      }
    }
    
    // Handle JSON parsing errors (when server returns HTML instead of JSON)
    if (err.message && err.message.includes('Unexpected token')) {
      return { 
        path: '', 
        bucket: '', 
        error: 'Server error during upload. The storage service may be temporarily unavailable. Please try again in a few minutes.' 
      }
    }
    
    const errorMessage = parseErrorResponse(err)
    return { 
      path: '', 
      bucket: '', 
      error: `Upload failed: ${errorMessage}` 
    }
  }
}

// Get signed URL for private file access
export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url: string; error?: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Error creating signed URL:', error)
      return { url: '', error: error.message }
    }

    return { url: data.signedUrl }
  } catch (err: any) {
    console.error('Exception creating signed URL:', err)
    return { url: '', error: err.message }
  }
}

// Get public URL for public files (thumbnails)
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

// Delete file from storage
export const deleteFile = async (
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Error deleting file:', error)
      return { success: false, error: error.message }
    }

    console.log('File deleted successfully:', path)
    return { success: true }
  } catch (err: any) {
    console.error('Exception deleting file:', err)
    return { success: false, error: err.message }
  }
}

// List files in user's folder
export const listUserFiles = async (
  userId: string,
  bucket?: string
): Promise<{ files: any[]; error?: string }> => {
  try {
    const targetBucket = bucket || STORAGE_BUCKETS.VIDEOS
    
    const { data, error } = await supabase.storage
      .from(targetBucket)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Error listing files:', error)
      return { files: [], error: error.message }
    }

    return { files: data || [] }
  } catch (err: any) {
    console.error('Exception listing files:', err)
    return { files: [], error: err.message }
  }
}

// Get storage statistics
export const getStorageStats = async (bucket?: string) => {
  try {
    const { data, error } = await supabase.rpc('get_storage_statistics', {
      bucket_name: bucket
    })

    if (error) {
      console.error('Error getting storage stats:', error)
      return { stats: [], error: error.message }
    }

    return { stats: data || [] }
  } catch (err: any) {
    console.error('Exception getting storage stats:', err)
    return { stats: [], error: err.message }
  }
}

// Find duplicate files
export const findDuplicateFiles = async (fileHash?: string) => {
  try {
    const { data, error } = await supabase.rpc('find_duplicate_files', {
      target_hash: fileHash
    })

    if (error) {
      console.error('Error finding duplicates:', error)
      return { duplicates: [], error: error.message }
    }

    return { duplicates: data || [] }
  } catch (err: any) {
    console.error('Exception finding duplicates:', err)
    return { duplicates: [], error: err.message }
  }
}

// Update verification progress
export const updateVerificationProgress = async (
  verificationId: string,
  progress: number,
  status?: string
) => {
  try {
    const { data, error } = await supabase.rpc('update_verification_progress', {
      verification_id: verificationId,
      progress: progress,
      status: status
    })

    if (error) {
      console.error('Error updating progress:', error)
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (err: any) {
    console.error('Exception updating progress:', err)
    return { success: false, error: err.message }
  }
}

// Storage utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: { [key: string]: string } = {
    // Video types
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/mov',
    'wmv': 'video/wmv',
    'flv': 'video/flv',
    'webm': 'video/webm',
    'mkv': 'video/mkv',
    'm4v': 'video/m4v',
    '3gp': 'video/3gp',
    '3g2': 'video/3g2',
    
    // Image types
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'svg': 'image/svg+xml',
    'heic': 'image/heic',
    'heif': 'image/heif',
    'avif': 'image/avif'
  }
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

// Test individual bucket with timeout and retry logic
const testBucket = async (bucketName: string, timeoutMs: number = 10000): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ Timeout testing bucket '${bucketName}' after ${timeoutMs}ms`)
      resolve(false)
    }, timeoutMs)

    supabase.storage
      .from(bucketName)
      .list('', { limit: 1 })
      .then(({ error }) => {
        clearTimeout(timeoutId)
        if (error) {
          console.warn(`⚠️ Bucket '${bucketName}' test failed:`, error.message)
          resolve(false)
        } else {
          console.log(`✅ Bucket '${bucketName}' is accessible`)
          resolve(true)
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        console.warn(`❌ Bucket '${bucketName}' test error:`, err.message)
        resolve(false)
      })
  })
}

// Initialize storage with improved error handling and timeouts
export const initializeStorage = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking storage buckets availability...')
    
    // Test each bucket with timeout protection
    const bucketNames = Object.values(STORAGE_BUCKETS)
    const bucketTests = await Promise.allSettled(
      bucketNames.map(bucketName => testBucket(bucketName, 8000)) // 8 second timeout per bucket
    )
    
    const results = bucketTests.map((result, index) => {
      const bucketName = bucketNames[index]
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.warn(`⚠️ Bucket '${bucketName}' test rejected:`, result.reason)
        return false
      }
    })
    
    const accessibleBuckets = results.filter(Boolean).length
    const totalBuckets = bucketNames.length
    
    console.log(`📊 Storage status: ${accessibleBuckets}/${totalBuckets} buckets accessible`)
    
    if (accessibleBuckets === 0) {
      console.error('❌ No storage buckets are accessible.')
      console.error('📋 Please follow the setup instructions in STORAGE_SETUP_INSTRUCTIONS.md')
      console.error('🔧 Required buckets:', bucketNames.join(', '))
      return false
    }
    
    if (accessibleBuckets < totalBuckets) {
      console.warn(`⚠️ Only ${accessibleBuckets}/${totalBuckets} storage buckets are accessible.`)
      console.warn('📋 Some features may be limited. Check STORAGE_SETUP_INSTRUCTIONS.md')
      
      // Log which buckets are missing
      const missingBuckets = bucketNames.filter((_, index) => !results[index])
      console.warn('❌ Missing/inaccessible buckets:', missingBuckets.join(', '))
    }
    
    // Return true if at least one bucket is accessible
    return accessibleBuckets > 0
    
  } catch (err: any) {
    console.error('❌ Storage initialization failed:', err)
    console.error('📋 Please check your Supabase configuration and follow STORAGE_SETUP_INSTRUCTIONS.md')
    return false
  }
}

// Storage object with all functions
export const storage = {
  uploadFile,
  getSignedUrl,
  getPublicUrl,
  deleteFile,
  listUserFiles,
  getStorageStats,
  findDuplicateFiles,
  updateVerificationProgress,
  validateFile,
  generateFilePath,
  initializeStorage,
  isVideoFile,
  isImageFile,
  isVideoUrl,
  isImageUrl,
  formatFileSize,
  getFileExtension,
  getMimeTypeFromExtension,
  getContentType,
  getSupportedFileExtensions,
  getSupportedMimeTypes,
  STORAGE_BUCKETS,
  FILE_SIZE_LIMITS,
  SUPPORTED_VIDEO_TYPES,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_THUMBNAIL_TYPES
}

export default storage