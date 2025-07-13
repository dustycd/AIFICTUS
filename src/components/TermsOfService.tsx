import React from 'react';
import { ArrowLeft, FileText, Shield, AlertTriangle, Scale, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Typography, Heading } from './Typography';

const TermsOfService: React.FC = () => {
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
            Terms of Service
          </Heading>
          
          <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-lg mb-8 leading-relaxed">
            Please read these terms carefully before using our AI video verification service.
          </Typography>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            
            {/* Acceptance of Terms */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-blue-400" />
                <Heading level={2}>Acceptance of Terms</Heading>
              </div>
              
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                By accessing or using Fictus AI's video verification service ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, please do not use our Service.
              </Typography>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <Typography variant="body" className="text-blue-400">
                  <strong>Important:</strong> These Terms constitute a legally binding agreement between you and Fictus AI. 
                  Please read them carefully and contact us if you have any questions.
                </Typography>
              </div>
            </div>

            {/* Service Description */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="h-6 w-6 text-purple-400" />
                <Heading level={2}>Service Description</Heading>
              </div>
              
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                Fictus AI provides artificial intelligence-powered video and image verification services to help users determine 
                the authenticity of digital media content. Our Service includes:
              </Typography>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                  <Typography variant="body" color="secondary">
                    AI-powered analysis of uploaded videos and images to detect potential manipulation or artificial generation
                  </Typography>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                  <Typography variant="body" color="secondary">
                    Detailed verification reports with confidence scores and risk assessments
                  </Typography>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                  <Typography variant="body" color="secondary">
                    Optional sharing of verification results in our public library for educational purposes
                  </Typography>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                  <Typography variant="body" color="secondary">
                    User account management and verification history tracking
                  </Typography>
                </div>
              </div>
            </div>

            {/* User Responsibilities */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-green-400" />
                <Heading level={2}>User Responsibilities</Heading>
              </div>
              
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                By using our Service, you agree to:
              </Typography>

              <div className="space-y-6">
                <div>
                  <Typography variant="h4" className="mb-3 text-green-400">Acceptable Use</Typography>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Use the Service only for lawful purposes and in accordance with these Terms
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Provide accurate information when creating your account
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Respect the intellectual property rights of others
                      </Typography>
                    </div>
                  </div>
                </div>

                <div>
                  <Typography variant="h4" className="mb-3 text-red-400">Prohibited Content</Typography>
                  <Typography variant="body" color="secondary" className="mb-3">
                    You may not upload content that:
                  </Typography>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Contains illegal, harmful, or offensive material
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Violates privacy rights or contains non-consensual intimate content
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Infringes on copyrights, trademarks, or other intellectual property rights
                      </Typography>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Contains malware, viruses, or other harmful code
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Limitations */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
                <Heading level={2}>Service Limitations and Disclaimers</Heading>
              </div>
              
              <div className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <Typography variant="h4" className="mb-3 text-yellow-400">AI Technology Limitations</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed">
                    Our AI verification technology, while advanced, is not infallible. Results should be considered as 
                    one factor in determining content authenticity, not as definitive proof. We continuously improve 
                    our algorithms, but cannot guarantee 100% accuracy in all cases.
                  </Typography>
                </div>

                <div>
                  <Typography variant="h4" className="mb-3 text-yellow-400">Usage Limits</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed mb-3">
                    Free accounts are subject to monthly usage limits:
                  </Typography>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Maximum 2 videos per month
                      </Typography>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                      <Typography variant="cardCaption" color="secondary">
                        Maximum 10 images per month
                      </Typography>
                    </div>
                  </div>
                </div>

                <div>
                  <Typography variant="h4" className="mb-3 text-yellow-400">Service Availability</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed">
                    We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                    The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
                  </Typography>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Scale className="h-6 w-6 text-cyan-400" />
                <Heading level={2}>Intellectual Property</Heading>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Typography variant="h4" className="mb-3 text-cyan-400">Our Rights</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed">
                    The Service, including all software, algorithms, designs, and content (excluding user-uploaded content), 
                    is owned by Fictus AI and protected by intellectual property laws. You may not copy, modify, distribute, 
                    or reverse engineer any part of our Service.
                  </Typography>
                </div>

                <div>
                  <Typography variant="h4" className="mb-3 text-cyan-400">Your Content</Typography>
                  <Typography variant="body" color="secondary" className="leading-relaxed">
                    You retain ownership of content you upload to our Service. By uploading content, you grant us a limited 
                    license to process, analyze, and store your content for the purpose of providing our verification services. 
                    If you choose to share verification results publicly, you grant us additional rights to display that content 
                    in our public library.
                  </Typography>
                </div>
              </div>
            </div>

            {/* Liability and Warranties */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-red-400" />
                <Heading level={2}>Limitation of Liability</Heading>
              </div>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
                <Typography variant="body" className="text-red-400 leading-relaxed">
                  <strong>IMPORTANT DISCLAIMER:</strong> The Service is provided "as is" without warranties of any kind. 
                  To the maximum extent permitted by law, Fictus AI disclaims all warranties, express or implied, 
                  including but not limited to merchantability, fitness for a particular purpose, and non-infringement.
                </Typography>
              </div>

              <Typography variant="body" color="secondary" className="leading-relaxed mb-4">
                In no event shall Fictus AI be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including but not limited to loss of profits, data, or business opportunities, arising from your use of the Service.
              </Typography>

              <Typography variant="body" color="secondary" className="leading-relaxed">
                Our total liability to you for any claims arising from these Terms or your use of the Service shall not exceed 
                the amount you paid us in the twelve months preceding the claim.
              </Typography>
            </div>

            {/* Termination */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <Heading level={2} className="mb-4">Termination</Heading>
              <Typography variant="body" color="secondary" className="leading-relaxed mb-4">
                You may terminate your account at any time by contacting us or using the account deletion feature. 
                We may suspend or terminate your access to the Service if you violate these Terms or engage in 
                activities that harm our Service or other users.
              </Typography>
              
              <Typography variant="body" color="secondary" className="leading-relaxed">
                Upon termination, your right to use the Service will cease immediately. We may retain certain 
                information as required by law or for legitimate business purposes.
              </Typography>
            </div>

            {/* Changes to Terms */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <Heading level={2} className="mb-4">Changes to Terms</Heading>
              <Typography variant="body" color="secondary" className="leading-relaxed">
                We may update these Terms from time to time to reflect changes in our Service or applicable laws. 
                We will notify you of material changes by posting the updated Terms on our website and, where appropriate, 
                by email. Your continued use of the Service after such changes constitutes acceptance of the updated Terms.
              </Typography>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-8">
              <Heading level={2} className="mb-4">Contact Information</Heading>
              <Typography variant="body" color="secondary" className="leading-relaxed mb-6">
                If you have questions about these Terms of Service, please contact us:
              </Typography>

              <div className="space-y-3">
                <Typography variant="body">
                  <strong>Email:</strong> Team@fictus.io
                </Typography>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;