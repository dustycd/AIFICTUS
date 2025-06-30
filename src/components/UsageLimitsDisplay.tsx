import React, { useState, useEffect } from 'react';
import { Clock, Image, Film, TrendingUp, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
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
        setError('Failed to load usage information');
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [user]);

  // Auto-refresh usage data every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const usageData = await usageLimits.getUserMonthlyUsage(user.id);
        setUsage(usageData);
      } catch (err) {
        console.error('Failed to refresh usage data:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

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
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <Typography variant="body" className="text-red-400">
            {error}
          </Typography>
        </div>
      </div>
    );
  }

  // Default usage if no data (new user)
  const currentUsage = usage || {
    userId: user.id,
    monthYear: usageLimits.getCurrentMonth(),
    videosUsed: 0, // Changed from videoSecondsUsed
    imagesUsed: 0,
    videosRemaining: USAGE_LIMITS.VIDEOS_PER_MONTH, // Changed from videoSecondsRemaining
    imagesRemaining: USAGE_LIMITS.IMAGES_PER_MONTH,
    canUploadVideo: true,
    canUploadImage: true
  };

  const videoPercentUsed = (currentUsage.videosUsed / USAGE_LIMITS.VIDEOS_PER_MONTH) * 100; // Changed calculation
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

  if (compact) {
    return (
      <div className={`bg-gray-800/20 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <Typography variant="cardTitle" className="text-sm">Monthly Usage</Typography>
          <Typography variant="caption" color="secondary" className="text-xs">
            {currentUsage.monthYear}
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
            <Typography variant="caption">{currentUsage.monthYear}</Typography>
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
      </div>
    </div>
  );
};

export default UsageLimitsDisplay;