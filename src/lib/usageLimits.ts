import { supabase } from './supabase';

// Monthly usage limits
export const USAGE_LIMITS = {
  VIDEOS_PER_MONTH: 2, // Changed from 50 seconds to 2 videos
  IMAGES_PER_MONTH: 10
} as const;

export interface UsageInfo {
  userId: string;
  monthYear: string;
  videosUsed: number; // Changed from videoSecondsUsed
  imagesUsed: number;
  videosRemaining: number; // Changed from videoSecondsRemaining
  imagesRemaining: number;
  canUploadVideo: boolean;
  canUploadImage: boolean;
}

export interface UsageCheckResult {
  canUpload: boolean;
  reason: string;
  currentUsage: UsageInfo;
}

// Get user's current monthly usage
export const getUserMonthlyUsage = async (userId: string, monthYear?: string): Promise<UsageInfo | null> => {
  try {
    console.log('🔍 getUserMonthlyUsage called with:', { userId, monthYear });
    
    const { data, error } = await supabase.rpc('get_user_monthly_usage', {
      p_user_id: userId,
      p_month_year: monthYear || null
    });

    console.log('📊 getUserMonthlyUsage response:', { data, error });

    if (error) {
      console.error('❌ Error getting user monthly usage:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('📝 No usage data found, returning default values');
      return null;
    }

    const usage = data[0];
    console.log('✅ Usage data found:', usage);
    
    return {
      userId: usage.user_id,
      monthYear: usage.month_year,
      videosUsed: usage.videos_used || 0, // Changed from video_seconds_used
      imagesUsed: usage.images_used,
      videosRemaining: usage.videos_remaining || USAGE_LIMITS.VIDEOS_PER_MONTH, // Changed from video_seconds_remaining
      imagesRemaining: usage.images_remaining,
      canUploadVideo: usage.can_upload_video,
      canUploadImage: usage.can_upload_image
    };
  } catch (err) {
    console.error('❌ Exception getting user monthly usage:', err);
    return null;
  }
};

// Check if user can upload content
export const checkUsageLimits = async (
  userId: string,
  contentType: 'video' | 'image'
): Promise<UsageCheckResult | null> => {
  try {
    console.log('🔍 checkUsageLimits called with:', { userId, contentType });
    
    const { data, error } = await supabase.rpc('check_usage_limits', {
      p_user_id: userId,
      p_content_type: contentType,
      p_video_duration_seconds: 0 // No longer needed since we're counting videos, not seconds
    });

    console.log('📊 checkUsageLimits response:', { data, error });

    if (error) {
      console.error('❌ Error checking usage limits:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('📝 No usage limit data found');
      return null;
    }

    const result = data[0];
    const usage = result.current_usage;

    console.log('✅ Usage limit check result:', { canUpload: result.can_upload, reason: result.reason });

    return {
      canUpload: result.can_upload,
      reason: result.reason,
      currentUsage: {
        userId: userId,
        monthYear: usage.month_year,
        videosUsed: usage.videos_used || 0, // Changed from video_seconds_used
        imagesUsed: usage.images_used,
        videosRemaining: usage.videos_remaining || USAGE_LIMITS.VIDEOS_PER_MONTH, // Changed from video_seconds_remaining
        imagesRemaining: usage.images_remaining,
        canUploadVideo: (usage.videos_used || 0) < USAGE_LIMITS.VIDEOS_PER_MONTH, // Changed logic
        canUploadImage: usage.images_used < USAGE_LIMITS.IMAGES_PER_MONTH
      }
    };
  } catch (err) {
    console.error('❌ Exception checking usage limits:', err);
    return null;
  }
};

// Update usage after successful upload
export const updateUsageAfterUpload = async (
  userId: string,
  contentType: 'video' | 'image'
): Promise<{ success: boolean; message: string; updatedUsage?: UsageInfo }> => {
  try {
    console.log('🔍 updateUsageAfterUpload called with:', { userId, contentType });
    
    const { data, error } = await supabase.rpc('update_usage_after_upload', {
      p_user_id: userId,
      p_content_type: contentType,
      p_video_duration_seconds: 0 // No longer needed since we're counting videos, not seconds
    });

    console.log('📊 updateUsageAfterUpload response:', { data, error });

    if (error) {
      console.error('❌ Error updating usage after upload:', error);
      return { success: false, message: 'Failed to update usage' };
    }

    if (!data || data.length === 0) {
      console.log('📝 No data returned from usage update');
      return { success: false, message: 'No data returned from usage update' };
    }

    const result = data[0];
    const usage = result.updated_usage;

    console.log('✅ Usage updated successfully:', { success: result.success, message: result.message });

    return {
      success: result.success,
      message: result.message,
      updatedUsage: usage ? {
        userId: userId,
        monthYear: usage.month_year,
        videosUsed: usage.videos_used || 0, // Changed from video_seconds_used
        imagesUsed: usage.images_used,
        videosRemaining: usage.videos_remaining || USAGE_LIMITS.VIDEOS_PER_MONTH, // Changed from video_seconds_remaining
        imagesRemaining: usage.images_remaining,
        canUploadVideo: (usage.videos_used || 0) < USAGE_LIMITS.VIDEOS_PER_MONTH, // Changed logic
        canUploadImage: usage.images_used < USAGE_LIMITS.IMAGES_PER_MONTH
      } : undefined
    };
  } catch (err) {
    console.error('❌ Exception updating usage after upload:', err);
    return { success: false, message: 'Exception occurred while updating usage' };
  }
};

// Estimate video duration from file size (no longer needed but keeping for compatibility)
export const estimateVideoDuration = async (fileSize: number, contentType: string): Promise<number> => {
  // Since we're now counting videos instead of duration, this always returns 1
  console.log('📏 estimateVideoDuration called (now returns 1 for video count):', { fileSize, contentType });
  return 1;
};

// Format remaining count for display
export const formatRemainingCount = (count: number, type: 'videos' | 'images'): string => {
  if (count <= 0) return `0 ${type}`;
  if (count === 1) return `1 ${type.slice(0, -1)}`; // Remove 's' for singular
  return `${count} ${type}`;
};

// Get current month string
export const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Check if it's a new month (for UI updates)
export const isNewMonth = (lastCheckedMonth: string): boolean => {
  return getCurrentMonth() !== lastCheckedMonth;
};

// Usage limits utilities
export const usageLimits = {
  getUserMonthlyUsage,
  checkUsageLimits,
  updateUsageAfterUpload,
  estimateVideoDuration,
  formatRemainingCount, // Changed from formatRemainingTime
  getCurrentMonth,
  isNewMonth,
  LIMITS: USAGE_LIMITS
};

export default usageLimits;