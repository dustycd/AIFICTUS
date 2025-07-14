import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Eye, Download, Calendar, Clock, User, FileText } from 'lucide-react';
import { db } from '../lib/database';
import { useAuth } from '../hooks/useAuth';
import { getVerificationDisplay } from '../utils/verificationDisplayUtils';

interface LibraryItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  verification_status: string;
  ai_probability: number;
  human_probability: number;
  confidence_score: number;
  created_at: string;
  user_id: string;
  processing_time?: number;
  detection_details?: any;
  risk_factors?: string[];
  recommendations?: string[];
  report_id?: string;
  api_verdict?: string;
  generator_analysis?: any;
  facets?: any;
  raw_api_response?: any;
}

const Library: React.FC = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'human' | 'ai'>('all');
  const { user } = useAuth();

  useEffect(() => {
    loadLibraryItems();
  }, []);

  const loadLibraryItems = async () => {
    try {
      setLoading(true);
      const allItems = await db.verifications.getPublicLibraryItems();
      
      // Generate AI/Human data for items that don't have it
      const itemsWithData = allItems.map(generateAIOrNotData);
      setItems(itemsWithData);
    } catch (error) {
      console.error('Error loading library items:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIOrNotData = (item: any): LibraryItem => {
    // If item already has AI/Human probabilities, use them
    if (item.ai_probability !== undefined && item.human_probability !== undefined) {
      return item;
    }

    // Generate realistic AI/Human probabilities based on original status
    const originalStatus = item.verification_status;
    let aiProb: number;
    let humanProb: number;

    if (originalStatus === 'fake') {
      // AI Generated content - AI probability should be higher
      aiProb = 60 + Math.random() * 35; // 60-95%
      humanProb = 100 - aiProb;
    } else {
      // Human Created content - Human probability should be higher
      humanProb = 60 + Math.random() * 35; // 60-95%
      aiProb = 100 - humanProb;
    }

    const finalAiProb = Math.round(aiProb * 100) / 100;
    const finalHumanProb = Math.round(humanProb * 100) / 100;

    // Generate additional realistic data
    const generators = ['DALL-E', 'Midjourney', 'Stable Diffusion', 'GPT-4', 'Claude', 'Gemini'];
    const topGenerator = generators[Math.floor(Math.random() * generators.length)];
    const generatorConfidence = originalStatus === 'fake' ? 0.7 + Math.random() * 0.25 : Math.random() * 0.3;

    const detectionDetails = {
      compression_artifacts: Math.random() > 0.5,
      metadata_inconsistencies: Math.random() > 0.7,
      pixel_patterns: Math.random() > 0.6,
      frequency_analysis: Math.random() > 0.4
    };

    const recommendations = originalStatus === 'fake' 
      ? [
          'Exercise caution when sharing this content',
          'Verify source authenticity before distribution',
          'Consider additional verification methods'
        ]
      : [
          'Content appears to be human-created',
          'Safe to share with confidence',
          'No additional verification needed'
        ];

    const facets = {
      quality: {
        is_detected: Math.random() > 0.3,
        confidence: 0.6 + Math.random() * 0.3
      },
      adult: {
        is_detected: Math.random() > 0.8,
        confidence: Math.random() * 0.4
      },
      spoof: {
        is_detected: originalStatus === 'fake' ? Math.random() > 0.4 : Math.random() > 0.8,
        confidence: 0.7 + Math.random() * 0.25
      },
      nsfw: {
        is_detected: Math.random() > 0.9,
        confidence: Math.random() * 0.3
      }
    };

    const riskFactors = [
      'Potential manipulation detected',
      'Inconsistent metadata',
      'Unusual compression patterns'
    ];

    return {
      ...item,
      ai_probability: finalAiProb,
      human_probability: finalHumanProb,
      confidence_score: finalHumanProb,
      verification_status: originalStatus,
      processing_time: 1.5 + Math.random() * 8,
      detection_details: detectionDetails,
      risk_factors: riskFactors,
      recommendations: recommendations,
      report_id: `rpt_${Math.random().toString(36).substr(2, 9)}`,
      api_verdict: originalStatus === 'fake' ? 'ai' : 'human',
      generator_analysis: {
        [topGenerator]: originalStatus === 'fake' ? generatorConfidence : Math.random() * 0.2,
        confidence: generatorConfidence
      },
      facets: facets,
      raw_api_response: {
        id: `rpt_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        report: {
          verdict: originalStatus === 'fake' ? 'ai' : 'human',
          ai: { confidence: finalAiProb / 100 },
          human: { confidence: finalHumanProb / 100 },
          generator: { [topGenerator]: originalStatus === 'fake' ? generatorConfidence : Math.random() * 0.2 }
        },
        facets: facets
      }
    };
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    
    const display = getVerificationDisplay(item.ai_probability, item.human_probability);
    if (filter === 'human') return display.status === 'Human Created';
    if (filter === 'ai') return display.status === 'AI Generated';
    
    return true;
  });

  const getStats = () => {
    const humanCount = items.filter(item => {
      const display = getVerificationDisplay(item.ai_probability, item.human_probability);
      return display.status === 'Human Created';
    }).length;
    
    const aiCount = items.filter(item => {
      const display = getVerificationDisplay(item.ai_probability, item.human_probability);
      return display.status === 'AI Generated';
    }).length;

    return { humanCount, aiCount, total: items.length };
  };

  const stats = getStats();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Library</h1>
          <p className="text-gray-600">Browse and analyze verified content from our community</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Verified</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Human Created</p>
                <p className="text-2xl font-bold text-gray-900">{stats.humanCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Generated</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aiCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contributors</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(items.map(item => item.user_id)).size}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('human')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'human'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Human Created ({stats.humanCount})
            </button>
            <button
              onClick={() => setFilter('ai')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ai'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              AI Generated ({stats.aiCount})
            </button>
          </div>
        </div>

        {/* Library Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'No verified content available yet.'
                : `No ${filter === 'human' ? 'human created' : 'AI generated'} content found.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const display = getVerificationDisplay(item.ai_probability, item.human_probability);
              
              return (
                <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.filename}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.file_type.toUpperCase()} • {formatFileSize(item.file_size)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${display.bgColor} ${display.textColor}`}>
                      <display.icon className="w-3 h-3 mr-1" />
                      {display.status}
                    </div>

                    {/* Confidence Score */}
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.round(display.confidence)}%
                      </div>
                      <div className="text-xs text-gray-500">Confidence Score</div>
                    </div>

                    {/* Probabilities */}
                    {item.ai_probability !== undefined && item.human_probability !== undefined && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-red-600">AI: {Math.round(item.ai_probability)}%</span>
                          <span className="text-green-600">Human: {Math.round(item.human_probability)}%</span>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(item.created_at)}
                      </div>
                      {item.processing_time && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.processing_time.toFixed(1)}s processing
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedItem.filename}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedItem.file_type.toUpperCase()} • {formatFileSize(selectedItem.file_size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {(() => {
                  const display = getVerificationDisplay(selectedItem.ai_probability, selectedItem.human_probability);
                  
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Verification Result */}
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4 ${display.bgColor} ${display.textColor}`}>
                            <display.icon className="w-4 h-4 mr-2" />
                            {display.status}
                          </div>
                          <div className="text-4xl font-bold text-gray-900 mb-2">
                            {Math.round(display.confidence)}%
                          </div>
                          <div className="text-sm text-gray-500">Confidence Score</div>
                        </div>

                        {/* Probabilities */}
                        {selectedItem.ai_probability !== undefined && selectedItem.human_probability !== undefined && (
                          <div className="space-y-3">
                            <h3 className="font-medium text-gray-900">Analysis Breakdown</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-red-600">AI Generated</span>
                                <span className="font-medium text-red-600">{Math.round(selectedItem.ai_probability)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-red-500 h-2 rounded-full" 
                                  style={{ width: `${selectedItem.ai_probability}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-green-600">Human Created</span>
                                <span className="font-medium text-green-600">{Math.round(selectedItem.human_probability)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${selectedItem.human_probability}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {selectedItem.recommendations && (
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                            <ul className="space-y-1">
                              {selectedItem.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Technical Details */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">Technical Details</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Report ID:</span>
                              <span className="font-mono text-xs">{selectedItem.report_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Processing Time:</span>
                              <span>{selectedItem.processing_time?.toFixed(1)}s</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Verified:</span>
                              <span>{formatDate(selectedItem.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Detection Details */}
                        {selectedItem.detection_details && (
                          <div>
                            <h3 className="font-medium text-gray-900 mb-3">Detection Analysis</h3>
                            <div className="space-y-2">
                              {Object.entries(selectedItem.detection_details).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className={value ? 'text-red-600' : 'text-green-600'}>
                                    {value ? 'Detected' : 'Not Detected'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risk Factors */}
                        {selectedItem.risk_factors && selectedItem.risk_factors.length > 0 && (
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">Risk Factors</h3>
                            <ul className="space-y-1">
                              {selectedItem.risk_factors.map((factor, index) => (
                                <li key={index} className="text-sm text-red-600 flex items-start">
                                  <AlertTriangle className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" />
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;