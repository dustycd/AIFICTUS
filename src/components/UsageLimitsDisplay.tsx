import React, { useState, useEffect } from 'react';
import { Clock, Image, Film, TrendingUp, Calendar, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { Typography, Heading } from './Typography';
import { useAuth } from '../hooks/useAuth';
import { usageLimits, UsageInfo, USAGE_LIMITS } from '../lib/usageLimits';

interface UsageLimitsDisplayProps {
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

const UsageLimitsDisplay: React.FC<UsageLimitsDisplayProps> = ({ 
  className = '', 
  showTitle = true,
  compact = false 
}) => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const usageData = await usageLimits.getUserMonthlyUsage(user.id);
        setUsage(usageData);
      } catch (err) {
        console.error('Failed to load usage data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load usage information';
        setError(errorMessage);
        setUsage(null);
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [user]);

  // Auto-refresh management
  useEffect(() => {
    const startAutoRefresh = () => {
      // Clear any existing interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Only start auto-refresh if there's no error and user is present
      if (!user || error) {
        return;
      }
      
      const interval = setInterval(async () => {
        try {
          console.log('🔄 Auto-refreshing usage data...');
          const usageData = await usageLimits.getUserMonthlyUsage(user.id);
          setUsage(usageData);
          setError(null); // Clear any previous errors on successful refresh
        } catch (err) {
          console.error('Failed to refresh usage data:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to refresh usage information';
          setError(errorMessage);
          
          // Stop auto-refresh on error to prevent continuous failures
          if (refreshInterval) {
            clearInterval(refreshInterval);
            setRefreshInterval(null);
          }
        }
      }, 30000); // 30 seconds
      
      setRefreshInterval(interval);
    };
    
    const stopAutoRefresh = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    };

    // Start auto-refresh when component mounts and conditions are met
    startAutoRefresh();

    // Cleanup on unmount
    return () => stopAutoRefresh();
  }, [user, error, refreshInterval]);
  
  // Manual retry function
  const handleRetry = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const usageData = await usageLimits.getUserMonthlyUsage(user.id);
      setUsage(usageData);
      
      // Restart auto-refresh on successful retry
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      const interval = setInterval(async () => {
        try {
          const refreshedData = await usageLimits.getUserMonthlyUsage(user.id);
          setUsage(refreshedData);
        } catch (refreshErr) {
          console.error('Auto-refresh failed after retry:', refreshErr);
          const refreshErrorMessage = refreshErr instanceof Error ? refreshErr.message : 'Failed to refresh usage information';
          setError(refreshErrorMessage);
          clearInterval(interval);
          setRefreshInterval(null);
        }
      }, 30000);
      
      setRefreshInterval(interval);
      
    } catch (err) {
      console.error('Retry failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load usage information';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={`bg-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 ${className}`}>
        <Typography variant="body" color="secondary" className="text-center">
          Sign in to view your monthly usage limits
        </Typography>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/30 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <Typography variant="body" className="text-red-400">
            {error}
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            disabled={loading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Retry</span>
              </>
            )}
          </button>
          <Typography variant="caption" color="secondary">
            Check your internet connection and try again
          </Typography>
        </div>
      </div>
    );
  }

  // Default usage if no data (new user)
  const currentUsage = usage || {
    userId: user.id,
    periodStart: new Date().toISOString(),
    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    videosUsed: 0,
    imagesUsed: 0,
    videosRemaining: USAGE_LIMITS.VIDEOS_PER_MONTH,
    imagesRemaining: USAGE_LIMITS.IMAGES_PER_MONTH,
    canUploadVideo: true,
    canUploadImage: true
  };

  const videoPercentUsed = (currentUsage.videosUsed / USAGE_LIMITS.VIDEOS_PER_MONTH) * 100;
  const imagePercentUsed = (currentUsage.imagesUsed / USAGE_LIMITS.IMAGES_PER_MONTH) * 100;

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'from-red-400 to-red-600';
    if (percent >= 70) return 'from-yellow-400 to-orange-500';
    return 'from-green-400 to-emerald-500';
  };

  const getUsageStatus = (percent: number) => {
    if (percent >= 100) return { icon: AlertTriangle, color: 'text-red-400', text: 'Limit Reached' };
    if (percent >= 90) return { icon: AlertTriangle, color: 'text-yellow-400', text: 'Almost Full' };
    return { icon: CheckCircle, color: 'text-green-400', text: 'Available' };
  };

  // Calculate days until reset
  const daysUntilReset = usageLimits.getDaysUntilReset(currentUsage.periodEnd);
  const formattedPeriod = usageLimits.formatPeriod(currentUsage.periodStart, currentUsage.periodEnd);

  if (compact) {
    return (
      <div className={`bg-gray-800/20 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <Typography variant="cardTitle" className="text-sm">Monthly Usage</Typography>
          <Typography variant="caption" color="secondary" className="text-xs">
            {formattedPeriod}
          </Typography>
        </div>
        
        <div className="space-y-3">
          {/* Video Usage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Film className="h-3 w-3 text-blue-400" />
                <span className="text-xs">Videos</span>
              </div>
              <span className="text-xs numeric-text">
                {currentUsage.videosUsed} / {USAGE_LIMITS.VIDEOS_PER_MONTH}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${getUsageColor(videoPercentUsed)} transition-all duration-500`}
                style={{ width: `${Math.min(100, videoPercentUsed)}%` }}
              />
            </div>
          </div>

          {/* Image Usage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Image className="h-3 w-3 text-purple-400" />
                <span className="text-xs">Images</span>
              </div>
              <span className="text-xs numeric-text">
                {currentUsage.imagesUsed} / {USAGE_LIMITS.IMAGES_PER_MONTH}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${getUsageColor(imagePercentUsed)} transition-all duration-500`}
                style={{ width: `${Math.min(100, imagePercentUsed)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Reset countdown */}
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-center gap-2">
            <RotateCcw className="h-3 w-3 text-gray-400" />
            <Typography variant="caption" color="secondary" className="text-xs">
              Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/20 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-8">
          <Heading level={3} className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-400" />
            Monthly Usage Limits
          </Heading>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4" />
            <Typography variant="caption">{formattedPeriod}</Typography>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Video Usage */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Film className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <Typography variant="cardTitle">Video Content</Typography>
                <Typography variant="caption" color="secondary">
                  Videos per month
                </Typography>
              </div>
            </div>
            {(() => {
              const status = getUsageStatus(videoPercentUsed);
              return (
                <div className="flex items-center gap-2">
                  <status.icon className={`h-5 w-5 ${status.color}`} />
                  <Typography variant="caption" className={status.color}>
                    {status.text}
                  </Typography>
                </div>
              );
            })()}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Typography variant="body" color="secondary">
                Used: <span className="numeric-text text-white">{currentUsage.videosUsed}</span> videos
              </Typography>
              <Typography variant="body" color="secondary">
                Remaining: <span className="numeric-text text-white">{currentUsage.videosRemaining}</span> videos
              </Typography>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-4 rounded-full bg-gradient-to-r ${getUsageColor(videoPercentUsed)} transition-all duration-1000`}
                style={{ width: `${Math.min(100, videoPercentUsed)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="numeric-text">0</span>
              <span className="numeric-text">{USAGE_LIMITS.VIDEOS_PER_MONTH}</span>
            </div>
          </div>
        </div>

        {/* Image Usage */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Image className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <Typography variant="cardTitle">Image Content</Typography>
                <Typography variant="caption" color="secondary">
                  Images per month
                </Typography>
              </div>
            </div>
            {(() => {
              const status = getUsageStatus(imagePercentUsed);
              return (
                <div className="flex items-center gap-2">
                  <status.icon className={`h-5 w-5 ${status.color}`} />
                  <Typography variant="caption" className={status.color}>
                    {status.text}
                  </Typography>
                </div>
              );
            })()}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Typography variant="body" color="secondary">
                Used: <span className="numeric-text text-white">{currentUsage.imagesUsed}</span> images
              </Typography>
              <Typography variant="body" color="secondary">
                Remaining: <span className="numeric-text text-white">{currentUsage.imagesRemaining}</span> images
              </Typography>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-4 rounded-full bg-gradient-to-r ${getUsageColor(imagePercentUsed)} transition-all duration-1000`}
                style={{ width: `${Math.min(100, imagePercentUsed)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="numeric-text">0</span>
              <span className="numeric-text">{USAGE_LIMITS.IMAGES_PER_MONTH}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="mt-8 pt-6 border-t border-gray-700/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <Typography variant="h3" className="mb-1 numeric-text">
              {currentUsage.videosRemaining}
            </Typography>
            <Typography variant="caption" color="secondary">
              Videos Left
            </Typography>
          </div>
          <div>
            <Typography variant="h3" className="mb-1 numeric-text">
              {currentUsage.imagesRemaining}
            </Typography>
            <Typography variant="caption" color="secondary">
              Images Left
            </Typography>
          </div>
          <div>
            <Typography variant="h3" className="mb-1 numeric-text">
              {Math.round(videoPercentUsed)}%
            </Typography>
            <Typography variant="caption" color="secondary">
              Videos Used
            </Typography>
          </div>
          <div>
            <Typography variant="h3" className="mb-1 numeric-text">
              {Math.round(imagePercentUsed)}%
            </Typography>
            <Typography variant="caption" color="secondary">
              Images Used
            </Typography>
          </div>
        </div>

        {/* Reset Information */}
        <div className="mt-6 pt-4 border-t border-gray-700/30">
          <div className="flex items-center justify-center gap-2">
            <RotateCcw className="h-4 w-4 text-gray-400" />
            <Typography variant="body" color="secondary" className="text-center">
              Your limits reset in <span className="numeric-text text-white">{daysUntilReset}</span> day{daysUntilReset !== 1 ? 's' : ''} 
              <span className="text-gray-500 ml-1">
                ({new Date(currentUsage.periodEnd).toLocaleDateString()})
              </span>
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageLimitsDisplay;