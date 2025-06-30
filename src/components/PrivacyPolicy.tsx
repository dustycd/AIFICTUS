import React from 'react';
import { ArrowLeft, Shield, Eye, Database, Lock, Globe, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Typography, Heading } from './Typography';

const PrivacyPolicy: React.FC = () => {
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
            Privacy Policy
          </Heading>
          
          <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-lg mb-8 leading-relaxed">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </Typography>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            
            {/* Information We Collect */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Database className="h-6 w-6 text-blue-400" />
                <Heading level={2}>Information We Collect</Heading>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Typography variant="h4" className="mb-3 text-blue-400">Account Information</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed">
                    When you create an account, we collect your email address, name, and any profile information you choose to provide. This information is necessary to provide our verification services and maintain your account.
                  </Typography>
                </div>

                <div>
                  <Typography variant="h4" className="mb-3 text-blue-400">Uploaded Content</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed">
                    We process videos and images you upload for verification purposes. These files are temporarily stored during analysis and may be retained for quality improvement and fraud prevention. You control whether your verification results are shared publicly.
                  </Typography>
                </div>

                <div>
                  <Typography variant="h4" className="mb-3 text-blue-400">Usage Data</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed">
                    We collect information about how you use our service, including verification history, feature usage, and performance metrics. This helps us improve our service and provide better user experiences.
                  </Typography>
                </div>

                <div>
                  <Typography variant="h4" className="mb-3 text-blue-400">Technical Information</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed">
                    We automatically collect certain technical information including IP addresses, browser type, device information, and usage patterns. This information is used for security, analytics, and service optimization.
                  </Typography>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-6 w-6 text-green-400" />
                <Heading level={2}>How We Use Your Information</Heading>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <Typography variant="body" color="secondary">
                    <strong>Service Provision:</strong> To provide video and image verification services, process your uploads, and deliver analysis results.
                  </Typography>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <Typography variant="body" color="secondary">
                    <strong>Account Management:</strong> To create and maintain your account, authenticate your identity, and provide customer support.
                  </Typography>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <Typography variant="body" color="secondary">
                    <strong>Service Improvement:</strong> To analyze usage patterns, improve our AI models, and develop new features.
                  </Typography>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <Typography variant="body" color="secondary">
                    <strong>Communication:</strong> To send you service updates, security alerts, and respond to your inquiries.
                  </Typography>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <Typography variant="body" color="secondary">
                    <strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.
                  </Typography>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-6 w-6 text-purple-400" />
                <Heading level={2}>Data Security</Heading>
              </div>
              
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                We implement industry-standard security measures to protect your information:
              </Typography>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <Typography variant="h4" className="mb-2 text-purple-400">Encryption</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    All data is encrypted in transit and at rest using AES-256 encryption standards.
                  </Typography>
                </div>
                
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <Typography variant="h4" className="mb-2 text-purple-400">Access Controls</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    Strict access controls ensure only authorized personnel can access your data.
                  </Typography>
                </div>
                
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <Typography variant="h4" className="mb-2 text-purple-400">Regular Audits</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    We conduct regular security audits and vulnerability assessments.
                  </Typography>
                </div>
                
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <Typography variant="h4" className="mb-2 text-purple-400">Data Minimization</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    We collect and retain only the minimum data necessary for our services.
                  </Typography>
                </div>
              </div>
            </div>

            {/* Data Sharing */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="h-6 w-6 text-cyan-400" />
                <Heading level={2}>Data Sharing and Disclosure</Heading>
              </div>
              
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </Typography>

              <div className="space-y-4">
                <div className="border-l-4 border-cyan-400 pl-4">
                  <Typography variant="h4" className="mb-2">With Your Consent</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    When you explicitly choose to share verification results in our public library.
                  </Typography>
                </div>
                
                <div className="border-l-4 border-cyan-400 pl-4">
                  <Typography variant="h4" className="mb-2">Service Providers</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    With trusted third-party service providers who help us operate our service, under strict confidentiality agreements.
                  </Typography>
                </div>
                
                <div className="border-l-4 border-cyan-400 pl-4">
                  <Typography variant="h4" className="mb-2">Legal Requirements</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    When required by law, court order, or to protect our rights and the safety of our users.
                  </Typography>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-yellow-400" />
                <Heading level={2}>Your Rights and Choices</Heading>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Typography variant="h4" className="mb-3 text-yellow-400">Access and Portability</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    You can access and download your personal data and verification history at any time through your account dashboard.
                  </Typography>
                </div>
                
                <div>
                  <Typography variant="h4" className="mb-3 text-yellow-400">Correction and Updates</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    You can update your profile information and account settings directly through our platform.
                  </Typography>
                </div>
                
                <div>
                  <Typography variant="h4" className="mb-3 text-yellow-400">Deletion</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    You can delete your account and associated data at any time. Some data may be retained for legal compliance.
                  </Typography>
                </div>
                
                <div>
                  <Typography variant="h4" className="mb-3 text-yellow-400">Opt-out</Typography>
                  <Typography variant="cardCaption" color="secondary">
                    You can opt out of non-essential communications and choose not to share verification results publicly.
                  </Typography>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="h-6 w-6 text-blue-400" />
                <Heading level={2}>Contact Us</Heading>
              </div>
              
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </Typography>

              <div className="space-y-3">
                <Typography variant="body">
                  <strong>Email:</strong> privacy@fictus.ai
                </Typography>
                <Typography variant="body">
                  <strong>Address:</strong> Fictus AI Privacy Team, [Your Address]
                </Typography>
                <Typography variant="body">
                  <strong>Response Time:</strong> We aim to respond to all privacy inquiries within 48 hours.
                </Typography>
              </div>
            </div>

            {/* Updates to Policy */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <Heading level={2} className="mb-4">Changes to This Policy</Heading>
              <Typography variant="body" color="secondary" className="leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. 
                We will notify you of any material changes by posting the updated policy on our website and, where appropriate, 
                by sending you an email notification. Your continued use of our service after such changes constitutes your 
                acceptance of the updated policy.
              </Typography>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;