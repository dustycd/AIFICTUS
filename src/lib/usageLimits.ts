import { supabase } from './supabase';

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

interface UsageLimitRecord {
  user_id: string;
  month_year: string;
  video_seconds_used: number;
  images_used: number;
  videos_used: number;
  created_at: string;
  updated_at: string;
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

// Get current month-year string (YYYY-MM format)
const getCurrentMonthYear = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Get user's current monthly usage from user_usage_limits table
export const getUserMonthlyUsage = async (userId: string): Promise<UsageInfo | null> => {
  try {
    console.log('🔍 getUserMonthlyUsage called with userId:', userId);
    
    const currentMonthYear = getCurrentMonthYear();
    console.log('📅 Current month-year:', currentMonthYear);
    
    // Query user_usage_limits table for current month
    const { data: usageRecord, error: usageError } = await supabase
      .from('user_usage_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonthYear)
      .single();
    
    let videosUsed = 0;
    let imagesUsed = 0;
    
    if (usageError && usageError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine for new users
      console.error('❌ Error getting usage record:', usageError);
      return null;
    }
    
    if (usageRecord) {
      videosUsed = usageRecord.videos_used || 0;
      imagesUsed = usageRecord.images_used || 0;
      console.log('📊 Found usage record:', { videosUsed, imagesUsed });
    } else {
      console.log('📊 No usage record found for current month (new user or new month)');
    }
    
    // Calculate period dates (first day of month to last day of month)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    
    // Set end time to end of day
    periodEnd.setHours(23, 59, 59, 999);
    
    const videosRemaining = Math.max(0, USAGE_LIMITS.VIDEOS_PER_MONTH - videosUsed);
    const imagesRemaining = Math.max(0, USAGE_LIMITS.IMAGES_PER_MONTH - imagesUsed);
    
    const usage: UsageInfo = {
      userId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      videosUsed,
      imagesUsed,
      videosRemaining,
      imagesRemaining,
      canUploadVideo: videosUsed < USAGE_LIMITS.VIDEOS_PER_MONTH,
      canUploadImage: imagesUsed < USAGE_LIMITS.IMAGES_PER_MONTH
    };
    
    console.log('✅ Usage calculated from user_usage_limits table:', usage);
    return usage;
    
  } catch (err) {
    console.error('❌ Exception getting user monthly usage:', err);
    return null;
  }
};

// Increment monthly usage count (called after successful upload)
export const incrementMonthlyUsage = async (
  userId: string,
  contentType: 'video' | 'image'
): Promise<{ success: boolean; message: string; updatedUsage?: UsageInfo }> => {
  try {
    console.log('🔍 incrementMonthlyUsage called with:', { userId, contentType });
    
    const currentMonthYear = getCurrentMonthYear();
    
    // Use upsert to either update existing record or create new one
    const updateData: any = {
      user_id: userId,
      month_year: currentMonthYear,
      updated_at: new Date().toISOString()
    };
    
    if (contentType === 'video') {
      updateData.videos_used = 1; // This will be added to existing value by the database
    } else {
      updateData.images_used = 1; // This will be added to existing value by the database
    }
    
    // Use RPC function to atomically increment usage
    const { data, error } = await supabase.rpc('increment_user_usage', {
      p_user_id: userId,
      p_month_year: currentMonthYear,
      p_content_type: contentType
    });
    
    if (error) {
      console.error('❌ Error incrementing usage:', error);
      return { success: false, message: `Failed to update ${contentType} usage count` };
    }
    
    console.log('✅ Usage incremented successfully');
    
    // Get updated usage info
    const updatedUsage = await getUserMonthlyUsage(userId);
    
    return {
      success: true,
      message: `${contentType} usage incremented successfully (permanent count)`,
      updatedUsage: updatedUsage || undefined
    };
    
  } catch (err) {
    console.error('❌ Exception incrementing monthly usage:', err);
    return { success: false, message: 'Exception occurred while incrementing usage' };
  }
};

// Create RPC function fallback if it doesn't exist
const createUsageRecordFallback = async (
  userId: string,
  monthYear: string,
  contentType: 'video' | 'image'
): Promise<boolean> => {
  try {
    const insertData: any = {
      user_id: userId,
      month_year: monthYear,
      video_seconds_used: 0,
      images_used: contentType === 'image' ? 1 : 0,
      videos_used: contentType === 'video' ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('user_usage_limits')
      .upsert(insertData, {
        onConflict: 'user_id,month_year',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('❌ Fallback upsert error:', error);
      return false;
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Fallback creation exception:', err);
    return false;
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
  incrementMonthlyUsage,
  checkUsageLimits,
  calculateRollingPeriod,
  formatRemainingCount,
  formatPeriod,
  getDaysUntilReset,
  isNewPeriod,
  LIMITS: USAGE_LIMITS
};

export default usageLimits;