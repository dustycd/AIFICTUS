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
  periodIdentifier: string; // YYYY-MM-DD format for the period start
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

// Calculate rolling monthly period based on user creation date
const getRollingPeriod = (userCreatedAt: string): {
  periodStart: string;
  periodEnd: string;
  periodIdentifier: string;
} => {
  const createdDate = new Date(userCreatedAt);
  const now = new Date();
  
  // Get the day of the month when the user was created
  const createdDay = createdDate.getDate();
  
  // Calculate the current period start
  let periodStart = new Date(now.getFullYear(), now.getMonth(), createdDay);
  
  // If the period start is in the future, move it back one month
  if (periodStart > now) {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, createdDay);
  }
  
  // Calculate the period end (one month after period start, minus 1 day)
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, createdDay - 1);
  // Set end time to end of day
  periodEnd.setHours(23, 59, 59, 999);
  
  // Create period identifier (YYYY-MM-DD format of period start)
  const periodIdentifier = periodStart.toISOString().split('T')[0];
  
  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    periodIdentifier
  };
};

// Get user's current monthly usage from user_usage_limits table
export const getUserMonthlyUsage = async (userId: string): Promise<UsageInfo | null> => {
  try {
    console.log('🔍 getUserMonthlyUsage called with userId:', userId);
    
    // First, get the user's profile to find their creation date
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Error getting user profile:', profileError);
      return null;
    }
    
    if (!profile?.created_at) {
      console.error('❌ User profile has no creation date');
      return null;
    }
    
    // Calculate the rolling period based on user creation date
    const rollingPeriod = getRollingPeriod(profile.created_at);
    console.log('📅 Rolling period calculated:', {
      periodStart: rollingPeriod.periodStart,
      periodEnd: rollingPeriod.periodEnd,
      periodIdentifier: rollingPeriod.periodIdentifier
    });
    
    // Query user_usage_limits table for current month
    const { data: usageRecord, error: usageError } = await supabase
      .from('user_usage_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', rollingPeriod.periodIdentifier)
      .limit(1);
    
    let videosUsed = 0;
    let imagesUsed = 0;
    
    if (usageError) {
      console.error('❌ Error getting usage record:', usageError);
      return null;
    }
    
    if (usageRecord && usageRecord.length > 0) {
      videosUsed = usageRecord[0].videos_used || 0;
      imagesUsed = usageRecord[0].images_used || 0;
      console.log('📊 Found usage record:', { videosUsed, imagesUsed });
    } else {
      console.log('📊 No usage record found for current rolling period (new user or new period)');
    }
    
    const videosRemaining = Math.max(0, USAGE_LIMITS.VIDEOS_PER_MONTH - videosUsed);
    const imagesRemaining = Math.max(0, USAGE_LIMITS.IMAGES_PER_MONTH - imagesUsed);
    
    const usage: UsageInfo = {
      userId,
      periodStart: rollingPeriod.periodStart,
      periodEnd: rollingPeriod.periodEnd,
      periodIdentifier: rollingPeriod.periodIdentifier,
      videosUsed,
      imagesUsed,
      videosRemaining,
      imagesRemaining,
      canUploadVideo: videosUsed < USAGE_LIMITS.VIDEOS_PER_MONTH,
      canUploadImage: imagesUsed < USAGE_LIMITS.IMAGES_PER_MONTH
    };
    
    console.log('✅ Rolling usage calculated from user_usage_limits table:', usage);
    return usage;
    
  } catch (err) {
    console.error('❌ Exception getting user rolling monthly usage:', err);
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
    
    // First, get the user's profile to find their creation date
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Error getting user profile for increment:', profileError);
      return { success: false, message: 'Failed to get user profile for usage increment' };
    }
    
    if (!profile?.created_at) {
      console.error('❌ User profile has no creation date for increment');
      return { success: false, message: 'User profile missing creation date' };
    }
    
    // Calculate the rolling period based on user creation date
    const rollingPeriod = getRollingPeriod(profile.created_at);
    console.log('📅 Rolling period for increment:', {
      periodIdentifier: rollingPeriod.periodIdentifier,
      contentType
    });
    
    // Use upsert to either update existing record or create new one
    const updateData: any = {
      user_id: userId,
      month_year: rollingPeriod.periodIdentifier,
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
      p_month_year: rollingPeriod.periodIdentifier,
      p_content_type: contentType
    });
    
    if (error) {
      console.error('❌ Error incrementing usage:', error);
      return { success: false, message: `Failed to update ${contentType} usage count` };
    }
    
    console.log('✅ Rolling usage incremented successfully');
    
    // Get updated usage info
    const updatedUsage = await getUserMonthlyUsage(userId);
    
    return {
      success: true,
      message: `${contentType} usage incremented successfully for rolling period`,
      updatedUsage: updatedUsage || undefined
    };
    
  } catch (err) {
    console.error('❌ Exception incrementing rolling monthly usage:', err);
    return { success: false, message: 'Exception occurred while incrementing usage' };
  }
};

// Create RPC function fallback if it doesn't exist
const createUsageRecordFallback = async (
  userId: string,
  periodIdentifier: string,
  contentType: 'video' | 'image'
): Promise<boolean> => {
  try {
    const insertData: any = {
      user_id: userId,
      month_year: periodIdentifier,
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
  formatRemainingCount,
  formatPeriod,
  getDaysUntilReset,
  isNewPeriod,
  LIMITS: USAGE_LIMITS
};

export default usageLimits;