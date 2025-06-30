import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertTriangle, User, MessageSquare } from 'lucide-react';
import { Typography, Heading } from './Typography';

const Contact: React.FC = () => {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    try {
      // Create FormData for Netlify
      const netlifyFormData = new FormData();
      netlifyFormData.append('form-name', 'contact');
      netlifyFormData.append('name', formData.name);
      netlifyFormData.append('email', formData.email);
      netlifyFormData.append('subject', formData.subject);
      netlifyFormData.append('message', formData.message);
      netlifyFormData.append('type', formData.type);

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(netlifyFormData as any).toString()
      });

      if (response.ok) {
        setFormStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          type: 'general'
        });
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
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
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Contact Us
            </span>
          </Heading>
          
          <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto text-xl mb-8 leading-relaxed">
            Have questions about our AI video verification technology? We're here to help.
            Reach out to our team for support, partnerships, or general inquiries.
          </Typography>
        </div>
      </section>

      {/* Contact Content */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <Heading level={2} className="mb-6">
                  Get in Touch
                </Heading>
                <Typography variant="body" color="secondary" className="text-lg leading-relaxed mb-8">
                  Whether you're a journalist verifying content, a creator protecting your work, 
                  or an organization looking to implement AI detection technology, we're here to help.
                </Typography>
              </div>

              {/* Contact Methods */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 bg-gray-800/30 rounded-xl border border-gray-700">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <Typography variant="cardTitle" className="mb-2">Email Support</Typography>
                    <Typography variant="body" color="secondary" className="mb-2">
                      Get help with technical issues or general questions
                    </Typography>
                    <a href="mailto:support@fictus.ai" className="text-blue-400 hover:text-blue-300 transition-colors">
                      support@fictus.ai
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-gray-800/30 rounded-xl border border-gray-700">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <Typography variant="cardTitle" className="mb-2">Business Inquiries</Typography>
                    <Typography variant="body" color="secondary" className="mb-2">
                      Partnerships, enterprise solutions, and media requests
                    </Typography>
                    <a href="mailto:business@fictus.ai" className="text-green-400 hover:text-green-300 transition-colors">
                      business@fictus.ai
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-gray-800/30 rounded-xl border border-gray-700">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <Typography variant="cardTitle" className="mb-2">Response Time</Typography>
                    <Typography variant="body" color="secondary">
                      We typically respond to all inquiries within 24 hours during business days.
                      For urgent technical issues, please include "URGENT" in your subject line.
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Office Information */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-6 w-6 text-blue-400" />
                  <Typography variant="cardTitle">Our Mission</Typography>
                </div>
                <Typography variant="body" color="secondary" className="leading-relaxed">
                  We're building the future of digital media verification. Our team is distributed globally, 
                  working around the clock to combat misinformation and protect digital truth.
                </Typography>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700">
              <Heading level={3} className="mb-6">Send us a Message</Heading>

              {/* Hidden form for Netlify detection */}
              <form name="contact" netlify="true" hidden>
                <input type="text" name="name" />
                <input type="email" name="email" />
                <input type="text" name="subject" />
                <select name="type">
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Support</option>
                  <option value="business">Business/Partnership</option>
                  <option value="media">Media Request</option>
                  <option value="feedback">Feedback</option>
                </select>
                <textarea name="message"></textarea>
              </form>

              {/* Actual form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="form-name" value="contact" />
                
                {/* Form Status Messages */}
                {formStatus === 'success' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <Typography variant="body" className="text-green-400">
                        Thank you! Your message has been sent successfully. We'll get back to you soon.
                      </Typography>
                    </div>
                  </div>
                )}

                {formStatus === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <Typography variant="body" className="text-red-400">
                        Sorry, there was an error sending your message. Please try again or email us directly.
                      </Typography>
                    </div>
                  </div>
                )}

                {/* Name and Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                {/* Inquiry Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                    Inquiry Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="business">Business/Partnership</option>
                    <option value="media">Media Request</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="How can we help you?"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors resize-vertical"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <Typography variant="button">Sending Message...</Typography>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <Typography variant="button">Send Message</Typography>
                    </>
                  )}
                </button>

                {/* Form Note */}
                <div className="text-center">
                  <Typography variant="caption" color="secondary">
                    * Required fields. We respect your privacy and will never share your information.
                  </Typography>
                </div>
              </form>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <Heading level={2} className="mb-4">
                Frequently Asked Questions
              </Heading>
              <Typography variant="heroCaption" color="secondary" className="max-w-3xl mx-auto">
                Quick answers to common questions about our AI video verification technology
              </Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                <Typography variant="cardTitle" className="mb-3 text-blue-400">
                  How accurate is your AI detection?
                </Typography>
                <Typography variant="body" color="secondary" className="leading-relaxed">
                  Our AI models achieve 99.7% accuracy in detecting deepfakes and AI-generated content. 
                  We continuously update our algorithms to stay ahead of emerging generation techniques.
                </Typography>
              </div>

              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                <Typography variant="cardTitle" className="mb-3 text-green-400">
                  What file formats do you support?
                </Typography>
                <Typography variant="body" color="secondary" className="leading-relaxed">
                  We support all major video formats (MP4, MOV, AVI, WebM) and image formats (JPG, PNG, GIF, WebP). 
                  Maximum file size is 500MB for videos and 50MB for images.
                </Typography>
              </div>

              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                <Typography variant="cardTitle" className="mb-3 text-purple-400">
                  Is my uploaded content secure?
                </Typography>
                <Typography variant="body" color="secondary" className="leading-relaxed">
                  Yes, all uploads are encrypted and processed securely. You control whether to share 
                  verification results publicly. Private verifications remain completely confidential.
                </Typography>
              </div>

              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                <Typography variant="cardTitle" className="mb-3 text-cyan-400">
                  Do you offer enterprise solutions?
                </Typography>
                <Typography variant="body" color="secondary" className="leading-relaxed">
                  Yes, we provide API access, custom integrations, and enterprise-grade solutions. 
                  Contact our business team to discuss your organization's specific needs.
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;