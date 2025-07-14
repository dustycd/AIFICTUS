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
 * Always returns a definite answer: either "Human Created" or "AI Generated"
 */
export const getVerificationDisplay = (
  aiProbability?: number,
  humanProbability?: number,
  fallbackStatus?: string
): VerificationDisplayResult => {
  // Normalize probabilities (handle null/undefined values)
  const aiProb = aiProbability || 0;
  const humanProb = humanProbability || 0;
  
  // If we have valid probabilities, use them to determine the result
  if (aiProb > 0 || humanProb > 0) {
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
  
  // Fallback to existing status if probabilities are not available
  if (fallbackStatus === 'authentic' || fallbackStatus === 'human') {
    return {
      status: 'authentic',
      displayStatus: 'Human Created',
      confidence: 85, // Default confidence for authentic content
      statusColor: 'text-green-400',
      statusIcon: 'CheckCircle',
      bgColor: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30'
    };
  } else if (fallbackStatus === 'fake' || fallbackStatus === 'ai') {
    return {
      status: 'fake',
      displayStatus: 'AI Generated',
      confidence: 75, // Default confidence for AI content
      statusColor: 'text-red-400',
      statusIcon: 'AlertTriangle',
      bgColor: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/30'
    };
  }
  
  // Ultimate fallback - assume human created if uncertain
  return {
    status: 'authentic',
    displayStatus: 'Human Created',
    confidence: 50,
    statusColor: 'text-green-400',
    statusIcon: 'CheckCircle',
    bgColor: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/30'
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