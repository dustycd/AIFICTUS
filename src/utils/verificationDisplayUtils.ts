// Utility functions for consistent verification result display across components

export interface VerificationDisplayResult {
  status: 'authentic' | 'fake';
  displayStatus: 'Human Created' | 'AI Generated';
  confidence: number;
  statusColor: string;
  statusIcon: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Determines the display status and confidence based on AI and Human probabilities
 * Returns status based strictly on API data - no defaults
 */
export const getVerificationDisplay = (
  aiProbability?: number,
  humanProbability?: number,
  fallbackStatus?: string,
  dbConfidence?: number
): VerificationDisplayResult => {
  console.log('🎯 getVerificationDisplay called with:', {
    aiProbability,
    humanProbability,
    fallbackStatus,
    dbConfidence
  });

  // Use actual API probabilities if available
  const aiProb = aiProbability ?? 0;
  const humanProb = humanProbability ?? 0;
  
  // If we have valid probabilities from API, use them
  if (aiProb > 0 || humanProb > 0) {
    console.log('✅ Using API probabilities');
    if (aiProb > humanProb) {
      // AI Generated
      return {
        status: 'fake',
        displayStatus: 'AI Generated',
        confidence: Math.round(aiProb),
        statusColor: 'text-red-400',
        statusIcon: 'AlertTriangle',
        bgColor: 'from-red-500/20 to-pink-500/20',
        borderColor: 'border-red-500/30'
      };
    } else {
      // Human Created
      return {
        status: 'authentic',
        displayStatus: 'Human Created',
        confidence: Math.round(humanProb),
        statusColor: 'text-green-400',
        statusIcon: 'CheckCircle',
        bgColor: 'from-green-500/20 to-emerald-500/20',
        borderColor: 'border-green-500/30'
      };
    }
  }
  
  // Use database confidence if available (from previous API response)
  if (dbConfidence !== undefined && dbConfidence > 0) {
    console.log('✅ Using database confidence from previous API response');
    const status = fallbackStatus === 'fake' || fallbackStatus === 'ai' ? 'fake' : 'authentic';
    
    if (status === 'fake') {
      return {
        status: 'fake',
        displayStatus: 'AI Generated',
        confidence: Math.round(dbConfidence),
        statusColor: 'text-red-400',
        statusIcon: 'AlertTriangle',
        bgColor: 'from-red-500/20 to-pink-500/20',
        borderColor: 'border-red-500/30'
      };
    } else {
      return {
        status: 'authentic',
        displayStatus: 'Human Created',
        confidence: Math.round(dbConfidence),
        statusColor: 'text-green-400',
        statusIcon: 'CheckCircle',
        bgColor: 'from-green-500/20 to-emerald-500/20',
        borderColor: 'border-green-500/30'
      };
    }
  }
  
  // Use fallback status only if API provided a verdict but no probabilities
  if (fallbackStatus === 'authentic' || fallbackStatus === 'human') {
    console.log('⚠️ Using fallback status (authentic) - API provided verdict but no confidence');
    return {
      status: 'authentic',
      displayStatus: 'Human Created',
      confidence: 0, // No confidence since API didn't provide it
      statusColor: 'text-green-400',
      statusIcon: 'CheckCircle',
      bgColor: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30'
    };
  } else if (fallbackStatus === 'fake' || fallbackStatus === 'ai') {
    console.log('⚠️ Using fallback status (fake) - API provided verdict but no confidence');
    return {
      status: 'fake',
      displayStatus: 'AI Generated',
      confidence: 0, // No confidence since API didn't provide it
      statusColor: 'text-red-400',
      statusIcon: 'AlertTriangle',
      bgColor: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/30'
    };
  }
  
  // No API data available - return unknown state
  console.warn('⚠️ No API data available - returning unknown state');
  return {
    status: 'authentic',
    displayStatus: 'Unknown',
    confidence: 0,
    statusColor: 'text-gray-400',
    statusIcon: 'CheckCircle',
    bgColor: 'from-gray-500/20 to-gray-500/20',
    borderColor: 'border-gray-500/30'
  };
};

/**
 * Get status badge classes for consistent styling
 */
export const getStatusBadgeClasses = (status: 'authentic' | 'fake'): string => {
  if (status === 'authentic') {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  } else {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
};

/**
 * Get confidence color based on percentage
 */
export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 90) return 'text-green-400';
  if (confidence >= 70) return 'text-yellow-400';
  return 'text-red-400';
};

/**
 * Format confidence score for display
 */
export const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence)}%`;
};

/**
 * Get recommendation text based on status and confidence
 */
export const getRecommendationText = (status: 'authentic' | 'fake', confidence: number): string => {
  if (status === 'authentic') {
    if (confidence >= 90) {
      return 'High confidence this content is human-created';
    } else if (confidence >= 70) {
      return 'Likely human-created content';
    } else {
      return 'Possibly human-created, verify with additional sources';
    }
  } else {
    if (confidence >= 90) {
      return 'High confidence this content is AI-generated';
    } else if (confidence >= 70) {
      return 'Likely AI-generated content';
    } else {
      return 'Possibly AI-generated, exercise caution';
    }
  }
};