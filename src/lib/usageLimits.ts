import { supabase } from './supabase';
import { db } from './database';

// Monthly usage limits
export const USAGE_LIMITS = {
  VIDEOS_PER_MONTH: 2,
  IMAGES_PER_MONTH: 10
} as const;

export interface UsageInfo {
  userId: string;
  periodStart: string; // ISO date string
  periodEnd: string;   // ISO date string
  videosUsed: number;
  imagesUsed: number;
  videosRemaining: number;
  imagesRemaining: number;
  canUploadVideo: boolean;
  canUploadImage: boolean;
}

export interface UsageCheckResult {
  canUpload: boolean;
  reason: string;
  currentUsage: UsageInfo;
}

// Calculate rolling period dates based on user's account creation date
export const calculateRollingPeriod = (userCreatedAt: string): { periodStart: string; periodEnd: string } => {
  const createdDate = new Date(userCreatedAt);
  const now = new Date();
  
  // Get the day of month when user created account
  const creationDay = createdDate.getDate();
  
  // Calculate current period start
  let periodStart = new Date(now.getFullYear(), now.getMonth(), creationDay);
  
  // If the creation day hasn't occurred this month yet, use last month
  if (periodStart > now) {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, creationDay);
  }
  
  // Calculate period end (one month from start)
  let periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  
  // Handle edge case where the creation day doesn't exist in the next month (e.g., Jan 31 -> Feb 28)
  if (periodEnd.getDate() !== creationDay) {
    // Set to last day of the month
    periodEnd = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 0);
  }
  
  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString()
  };
};

// Get user's current rolling monthly usage
export const getUserMonthlyUsage = async (userId: string): Promise<UsageInfo | null> => {
  try {
    console.log('🔍 getUserMonthlyUsage called with userId:', userId);
    
    // First, get the user's creation date
    const { data: profile, error: profileError } = await db.profiles.get(userId);
    
    if (profileError || !profile) {
      console.error('❌ Error getting user profile:', profileError);
      return null;
    }
    
    const userCreatedAt = profile.created_at;
    console.log('📅 User created at:', userCreatedAt);
    
    // Calculate rolling period
    const { periodStart, periodEnd } = calculateRollingPeriod(userCreatedAt);
    console.log('📊 Rolling period:', { periodStart, periodEnd });
    
    // Query verifications within the rolling period
    const { data: verifications, error: verificationsError } = await supabase
      .from('verifications')
      .select('content_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', periodStart)
      .lt('created_at', periodEnd);
    
    if (verificationsError) {
      console.error('❌ Error getting verifications:', verificationsError);
      return null;
    }
    
    console.log('📋 Found verifications in period:', verifications?.length || 0);
    
    // Count usage by content type
    const videosUsed = verifications?.filter(v => v.content_type.startsWith('video/')).length || 0;
    const imagesUsed = verifications?.filter(v => v.content_type.startsWith('image/')).length || 0;
    
    const videosRemaining = Math.max(0, USAGE_LIMITS.VIDEOS_PER_MONTH - videosUsed);
    const imagesRemaining = Math.max(0, USAGE_LIMITS.IMAGES_PER_MONTH - imagesUsed);
    
    const usage: UsageInfo = {
      userId,
      periodStart,
      periodEnd,
      videosUsed,
      imagesUsed,
      videosRemaining,
      imagesRemaining,
      canUploadVideo: videosUsed < USAGE_LIMITS.VIDEOS_PER_MONTH,
      canUploadImage: imagesUsed < USAGE_LIMITS.IMAGES_PER_MONTH
    };
    
    console.log('✅ Usage calculated:', usage);
    return usage;
    
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
    
    const usage = await getUserMonthlyUsage(userId);
    
    if (!usage) {
      console.log('📝 No usage data found');
      return null;
    }
    
    const canUpload = contentType === 'video' ? usage.canUploadVideo : usage.canUploadImage;
    const used = contentType === 'video' ? usage.videosUsed : usage.imagesUsed;
    const limit = contentType === 'video' ? USAGE_LIMITS.VIDEOS_PER_MONTH : USAGE_LIMITS.IMAGES_PER_MONTH;
    
    let reason = '';
    if (!canUpload) {
      reason = `You have reached your monthly limit of ${limit} ${contentType}s. Your limit resets on ${new Date(usage.periodEnd).toLocaleDateString()}.`;
    } else {
      const remaining = contentType === 'video' ? usage.videosRemaining : usage.imagesRemaining;
      reason = `You have ${remaining} ${contentType}${remaining === 1 ? '' : 's'} remaining this month.`;
    }
    
    console.log('✅ Usage limit check result:', { canUpload, reason });
    
    return {
      canUpload,
      reason,
      currentUsage: usage
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
    
    // Since we're counting actual verification records, we don't need to manually update usage
    // The usage will be automatically reflected when we query the verifications table
    
    // Get updated usage
    const updatedUsage = await getUserMonthlyUsage(userId);
    
    if (!updatedUsage) {
      return { success: false, message: 'Failed to get updated usage' };
    }
    
    console.log('✅ Usage updated successfully');
    
    return {
      success: true,
      message: `${contentType} upload counted successfully`,
      updatedUsage
    };
    
  } catch (err) {
    console.error('❌ Exception updating usage after upload:', err);
    return { success: false, message: 'Exception occurred while updating usage' };
  }
};

// Format remaining count for display
export const formatRemainingCount = (count: number, type: 'videos' | 'images'): string => {
  if (count <= 0) return `0 ${type}`;
  if (count === 1) return `1 ${type.slice(0, -1)}`; // Remove 's' for singular
  return `${count} ${type}`;
};

// Format period for display
export const formatPeriod = (periodStart: string, periodEnd: string): string => {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  
  if (start.getMonth() === end.getMonth()) {
    // Same month: "Jan 15 - Feb 14"
    return `${startMonth} ${startDay} - ${endDay}`;
  } else {
    // Different months: "Jan 15 - Feb 14"
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
};

// Get days until period reset
export const getDaysUntilReset = (periodEnd: string): number => {
  const end = new Date(periodEnd);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Check if user is in a new period (for UI updates)
export const isNewPeriod = (lastCheckedPeriodEnd: string): boolean => {
  const lastEnd = new Date(lastCheckedPeriodEnd);
  const now = new Date();
  return now >= lastEnd;
};

// Usage limits utilities
export const usageLimits = {
  getUserMonthlyUsage,
  checkUsageLimits,
  updateUsageAfterUpload,
  calculateRollingPeriod,
  formatRemainingCount,
  formatPeriod,
  getDaysUntilReset,
  isNewPeriod,
  LIMITS: USAGE_LIMITS
};

export default usageLimits;