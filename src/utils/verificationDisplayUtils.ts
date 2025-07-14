// Utility functions for consistent verification result display across components

export interface VerificationDisplayResult {
  status: 'authentic' | 'fake';
  displayStatus: 'Human Created' | 'AI Generated';
  qualitativeStatus: string;
  statusColor: string;
  statusIcon: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Determines the display status and qualitative assessment based on AI and Human probabilities
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
  
  // Determine confidence level for qualitative status
  let confidenceLevel = 0;
  let status: 'authentic' | 'fake' = 'authentic';
  
  // If we have valid probabilities from API, use them
  if (aiProb > 0 || humanProb > 0) {
    console.log('✅ Using API probabilities');
    if (aiProb > humanProb) {
      status = 'fake';
      confidenceLevel = aiProb;
    } else {
      status = 'authentic';
      confidenceLevel = humanProb;
    }
  }
  // Use database confidence if available (from previous API response)
  else if (dbConfidence !== undefined && dbConfidence > 0) {
    console.log('✅ Using database confidence from previous API response');
    status = fallbackStatus === 'fake' || fallbackStatus === 'ai' ? 'fake' : 'authentic';
    confidenceLevel = dbConfidence;
  }
  // Use fallback status only if API provided a verdict but no probabilities
  else if (fallbackStatus === 'authentic' || fallbackStatus === 'human') {
    console.log('⚠️ Using fallback status (authentic) - API provided verdict but no confidence');
    status = 'authentic';
    confidenceLevel = 0;
  } else if (fallbackStatus === 'fake' || fallbackStatus === 'ai') {
    console.log('⚠️ Using fallback status (fake) - API provided verdict but no confidence');
    status = 'fake';
    confidenceLevel = 0;
  }

  // Generate qualitative status based on confidence level
  const qualitativeStatus = getQualitativeStatus(status, confidenceLevel);

  if (status === 'fake') {
    return {
      status: 'fake',
      displayStatus: 'AI Generated',
      qualitativeStatus,
      statusColor: 'text-red-400',
      statusIcon: 'AlertTriangle',
      bgColor: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/30'
    };
  } else {
    return {
      status: 'authentic',
      displayStatus: 'Human Created',
      qualitativeStatus,
      statusColor: 'text-green-400',
      statusIcon: 'CheckCircle',
      bgColor: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30'
    };
  }
};

/**
 * Generate qualitative status description based on status and confidence level
 */
const getQualitativeStatus = (status: 'authentic' | 'fake', confidenceLevel: number): string => {
  if (status === 'authentic') {
    if (confidenceLevel >= 90) {
      return 'Highly Authentic';
    } else if (confidenceLevel >= 70) {
      return 'Likely Authentic';
    } else if (confidenceLevel >= 50) {
      return 'Possibly Authentic';
    } else if (confidenceLevel > 0) {
      return 'Uncertain - Lean Authentic';
    } else {
      return 'Status Unknown';
    }
  } else {
    if (confidenceLevel >= 90) {
      return 'Highly AI Generated';
    } else if (confidenceLevel >= 70) {
      return 'Likely AI Generated';
    } else if (confidenceLevel >= 50) {
      return 'Possibly AI Generated';
    } else if (confidenceLevel > 0) {
      return 'Uncertain - Lean AI Generated';
    } else {
      return 'Status Unknown';
    }
  }
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
 * Get recommendation text based on status and qualitative assessment
 */
export const getRecommendationText = (status: 'authentic' | 'fake', qualitativeStatus: string): string => {
  if (status === 'authentic') {
    if (qualitativeStatus.includes('Highly')) {
      return 'Strong evidence suggests this content is human-created';
    } else if (qualitativeStatus.includes('Likely')) {
      return 'Evidence suggests this content is human-created';
    } else if (qualitativeStatus.includes('Possibly')) {
      return 'Some evidence suggests human creation, verify with additional sources';
    } else {
      return 'Uncertain analysis, recommend additional verification';
    }
  } else {
    if (qualitativeStatus.includes('Highly')) {
      return 'Strong evidence suggests this content is AI-generated';
    } else if (qualitativeStatus.includes('Likely')) {
      return 'Evidence suggests this content is AI-generated';
    } else if (qualitativeStatus.includes('Possibly')) {
      return 'Some evidence suggests AI generation, exercise caution';
    } else {
      return 'Uncertain analysis, exercise caution and seek additional verification';
    }
  }
};

/**
 * Format confidence score as percentage string
 */
export const formatConfidence = (confidence: number): string => {
  return `${confidence.toFixed(1)}%`;
};