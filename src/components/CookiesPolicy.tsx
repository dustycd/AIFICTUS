import React from 'react';
import { ArrowLeft, Cookie, Settings, BarChart3, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Typography, Heading } from './Typography';

const CookiesPolicy: React.FC = () => {
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(true);
  const [functionalEnabled, setFunctionalEnabled] = React.useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back Button */}
      <div className="fixed top-8 left-8 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg transition-all duration-300 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <Typography variant="cardCaption">Back to Home</Typography>
        </button>
      </div>

      {/* Header Section */}
      <section className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <img 
              src="/fictus.png" 
              alt="Fictus AI" 
              className="mx-auto h-16 w-auto object-contain filter drop-shadow-lg"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          
          <Heading level={1} className="mb-8">
            Cookies Policy
          </Heading>
          
          <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-lg mb-8 leading-relaxed">
            Learn how we use cookies and similar technologies to improve your experience on our platform.
          </Typography>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            
            {/* What Are Cookies */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Cookie className="h-6 w-6 text-orange-400" />
                <Heading level={2}>What Are Cookies?</Heading>
              </div>
              
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                Cookies are small text files that are stored on your device when you visit our website. They help us 
                provide you with a better experience by remembering your preferences, keeping you logged in, and 
                helping us understand how you use our service.
              </Typography>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <Typography variant="body" className="text-orange-400">
                  <strong>Note:</strong> Cookies do not contain personal information that can identify you directly, 
                  but they may contain unique identifiers that help us personalize your experience.
                </Typography>
              </div>
            </div>

            {/* Types of Cookies */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="h-6 w-6 text-blue-400" />
                <Heading level={2}>Types of Cookies We Use</Heading>
              </div>
              
              <div className="space-y-8">
                {/* Essential Cookies */}
                <div className="border border-green-500/30 rounded-lg p-6 bg-green-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-400" />
                      <Typography variant="h4" className="text-green-400">Essential Cookies</Typography>
                    </div>
                    <div className="text-green-400">
                      <Typography variant="caption">Always Active</Typography>
                    </div>
                  </div>
                  
                  <Typography variant="body" color="secondary" className="leading-relaxed mb-4">
                    These cookies are necessary for the website to function properly. They enable core functionality 
                    such as security, network management, and accessibility.
                  </Typography>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Authentication and session management
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Security and fraud prevention
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Load balancing and performance optimization
                      </Typography>
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="border border-blue-500/30 rounded-lg p-6 bg-blue-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-blue-400" />
                      <Typography variant="h4" className="text-blue-400">Functional Cookies</Typography>
                    </div>
                    <button
                      onClick={() => setFunctionalEnabled(!functionalEnabled)}
                      className="flex items-center gap-2"
                    >
                      {functionalEnabled ? (
                        <ToggleRight className="h-6 w-6 text-blue-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <Typography variant="body" color="secondary" className="leading-relaxed mb-4">
                    These cookies enable enhanced functionality and personalization, such as remembering your 
                    preferences and settings.
                  </Typography>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Language and region preferences
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Theme and display preferences
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Form data and user interface customization
                      </Typography>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-purple-500/30 rounded-lg p-6 bg-purple-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-purple-400" />
                      <Typography variant="h4" className="text-purple-400">Analytics Cookies</Typography>
                    </div>
                    <button
                      onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                      className="flex items-center gap-2"
                    >
                      {analyticsEnabled ? (
                        <ToggleRight className="h-6 w-6 text-purple-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <Typography variant="body" color="secondary" className="leading-relaxed mb-4">
                    These cookies help us understand how visitors interact with our website by collecting and 
                    reporting information anonymously.
                  </Typography>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Page views and user journey tracking
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Feature usage and performance metrics
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Error tracking and debugging information
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Managing Cookies */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="h-6 w-6 text-yellow-400" />
                <Heading level={2}>Managing Your Cookie Preferences</Heading>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Typography variant="h4" className="mb-3 text-yellow-400">Browser Settings</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed mb-4">
                    You can control cookies through your browser settings. Most browsers allow you to:
                  </Typography>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        View and delete existing cookies
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Block cookies from specific websites
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Block all cookies (may affect website functionality)
                      </Typography>
                    </div>
                  </div>
                </div>

                <div>
                  <Typography variant="h4" className="mb-3 text-yellow-400">Our Cookie Preferences</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed mb-4">
                    Use the toggles above to control non-essential cookies. Your preferences will be saved and 
                    respected across your visits to our website.
                  </Typography>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <Typography variant="body" className="text-yellow-400">
                      <strong>Note:</strong> Disabling certain cookies may limit some features of our service. 
                      Essential cookies cannot be disabled as they are necessary for the website to function.
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Cookie Retention */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <Heading level={2} className="mb-4">Cookie Retention</Heading>
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                Different types of cookies are stored for different periods:
              </Typography>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div>
                    <Typography variant="h4" className="mb-1">Session Cookies</Typography>
                    <Typography variant="cardCaption" color="secondary">
                      Deleted when you close your browser
                    </Typography>
                  </div>
                  <Typography variant="body" className="text-blue-400">Temporary</Typography>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div>
                    <Typography variant="h4" className="mb-1">Persistent Cookies</Typography>
                    <Typography variant="cardCaption" color="secondary">
                      Stored for a specific period or until manually deleted
                    </Typography>
                  </div>
                  <Typography variant="body" className="text-purple-400">Up to 1 year</Typography>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div>
                    <Typography variant="h4" className="mb-1">Authentication Cookies</Typography>
                    <Typography variant="cardCaption" color="secondary">
                      Keep you logged in across sessions
                    </Typography>
                  </div>
                  <Typography variant="body" className="text-green-400">30 days</Typography>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-8">
              <Heading level={2} className="mb-4">Questions About Cookies?</Heading>
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                If you have questions about our use of cookies or this Cookies Policy, please contact us:
              </Typography>

              <div className="space-y-3">
                <Typography variant="body">
                  <strong>Email:</strong> privacy@fictus.io
                </Typography>
                <Typography variant="body">
                  <strong>Subject Line:</strong> Cookie Policy Inquiry
                </Typography>
                <Typography variant="body">
                  <strong>Response Time:</strong> We typically respond within 24 hours
                </Typography>
              </div>
            </div>

            {/* Updates to Policy */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <Heading level={2} className="mb-4">Updates to This Policy</Heading>
              <Typography variant="body" color="secondary" className="leading-relaxed">
                We may update this Cookies Policy from time to time to reflect changes in our practices or applicable laws. 
                When we make changes, we will notify you through our website or by email if the changes are significant.
              </Typography>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default CookiesPolicy;