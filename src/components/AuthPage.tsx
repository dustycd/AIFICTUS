import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Chrome, CheckCircle, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Typography, Heading, ButtonText } from './Typography';
import { useAuth } from '../hooks/useAuth';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<any>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Use Supabase auth hook
  const { signUp, signIn, signInWithOAuth, resetPassword, user } = useAuth();

  // hCaptcha site key - MUST be configured in production
  const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

  // Debug logging for hCaptcha
  useEffect(() => {
    console.log('🔧 hCaptcha Debug Info:');
    console.log('- Site Key:', HCAPTCHA_SITE_KEY ? `${HCAPTCHA_SITE_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('- Current Domain:', window.location.hostname);
    console.log('- Current Protocol:', window.location.protocol);
    console.log('- User Agent:', navigator.userAgent.substring(0, 50) + '...');
  }, [HCAPTCHA_SITE_KEY]);

  // Check if hCaptcha is properly configured
  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) {
      console.error('❌ hCaptcha site key not configured! Please set VITE_HCAPTCHA_SITE_KEY in your environment variables.');
      setErrors({ 
        general: 'Security verification is not properly configured. Please contact support.' 
      });
    } else {
      console.log('✅ hCaptcha site key is configured');
    }
  }, [HCAPTCHA_SITE_KEY]);

  // Reset form when switching between login/signup
  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      rememberMe: false
    });
    setErrors({});
    setFocusedField(null);
    setAuthSuccess(false);
    setIsLoading(false);
    setCaptchaToken(null);
    setCaptchaError(null);
    setCaptchaLoaded(false);
    
    // Reset captcha
    if (captchaRef.current) {
      try {
        captchaRef.current.resetCaptcha();
        console.log('🔄 hCaptcha reset successfully');
      } catch (error) {
        console.warn('⚠️ Failed to reset hCaptcha:', error);
      }
    }
  }, [isLogin]);

  // Redirect when user is authenticated
  useEffect(() => {
    if (user && authSuccess) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, authSuccess, navigate]);

  // Handle captcha verification
  const handleCaptchaVerify = (token: string) => {
    console.log('✅ hCaptcha verified successfully');
    console.log('- Token length:', token.length);
    console.log('- Token preview:', token.substring(0, 20) + '...');
    
    setCaptchaToken(token);
    setCaptchaError(null);
    
    // Clear captcha error if it exists
    if (errors.captcha) {
      setErrors((prev: any) => ({ ...prev, captcha: undefined }));
    }
  };

  const handleCaptchaExpire = () => {
    console.log('⏰ hCaptcha expired');
    setCaptchaToken(null);
    setCaptchaError('Security verification expired. Please verify again.');
  };

  const handleCaptchaError = (err: string) => {
    console.error('❌ hCaptcha error:', err);
    console.error('- Error details:', {
      error: err,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      domain: window.location.hostname
    });
    
    setCaptchaToken(null);
    
    // Provide more specific error messages
    let errorMessage = 'Security verification failed. Please try again.';
    
    if (err.includes('network')) {
      errorMessage = 'Network error during verification. Please check your connection and try again.';
    } else if (err.includes('timeout')) {
      errorMessage = 'Verification timed out. Please try again.';
    } else if (err.includes('invalid')) {
      errorMessage = 'Invalid verification. Please refresh the page and try again.';
    }
    
    setCaptchaError(errorMessage);
  };

  const handleCaptchaLoad = () => {
    console.log('📦 hCaptcha loaded successfully');
    setCaptchaLoaded(true);
    setCaptchaError(null);
  };

  const handleCaptchaOpen = () => {
    console.log('👁️ hCaptcha challenge opened');
  };

  const handleCaptchaClose = () => {
    console.log('👁️ hCaptcha challenge closed');
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: any = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Signup-specific validation
    if (!isLogin) {
      if (!formData.firstName?.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName?.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Captcha validation - REQUIRED for all operations
    if (!captchaToken) {
      newErrors.captcha = 'Please complete the security verification';
      console.log('❌ Form validation failed: Missing captcha token');
    } else {
      console.log('✅ Form validation passed: Captcha token present');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with hCaptcha token
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Form submission started');
    console.log('- Is Login:', isLogin);
    console.log('- Email:', formData.email);
    console.log('- Has Captcha Token:', !!captchaToken);
    console.log('- Captcha Token Preview:', captchaToken ? captchaToken.substring(0, 20) + '...' : 'None');
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setIsLoading(true);
    setErrors({});

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setErrors({ general: 'Request timed out. Please try again.' });
      console.log('⏰ Request timed out');
    }, 15000);

    try {
      let result;
      
      if (isLogin) {
        console.log('🔐 Attempting sign in for:', formData.email, 'with hCaptcha token');
        result = await signIn(formData.email, formData.password, captchaToken);
      } else {
        console.log('📝 Attempting sign up for:', formData.email, 'with hCaptcha token');
        result = await signUp(
          formData.email, 
          formData.password,
          {
            firstName: formData.firstName,
            lastName: formData.lastName
          },
          captchaToken
        );
      }
      
      // Clear timeout since we got a response
      clearTimeout(timeoutId);
      
      const { data, error } = result;
      
      if (error) {
        console.error('❌ Auth error:', error);
        setErrors({ general: error.message });
        
        // Reset captcha on error
        if (captchaRef.current) {
          try {
            captchaRef.current.resetCaptcha();
            console.log('🔄 hCaptcha reset after auth error');
          } catch (resetError) {
            console.warn('⚠️ Failed to reset hCaptcha after auth error:', resetError);
          }
        }
        setCaptchaToken(null);
      } else if (data?.user) {
        console.log('✅ Auth successful:', data.user.email);
        setAuthSuccess(true);
        
        // For signup, check if email confirmation is required
        if (!isLogin && !data.session) {
          setErrors({ 
            general: 'Account created successfully! Please check your email to verify your account before signing in.' 
          });
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ Auth exception:', error);
      setErrors({ general: 'Something went wrong. Please try again.' });
      
      // Reset captcha on error
      if (captchaRef.current) {
        try {
          captchaRef.current.resetCaptcha();
          console.log('🔄 hCaptcha reset after auth exception');
        } catch (resetError) {
          console.warn('⚠️ Failed to reset hCaptcha after auth exception:', resetError);
        }
      }
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error when user makes changes
    if (errors.general) {
      setErrors((prev: any) => ({ ...prev, general: undefined }));
    }
  };

  // Handle social login (Google only) with hCaptcha token
  const handleGoogleLogin = async () => {
    console.log('🔐 Starting Google OAuth');
    setIsLoading(true);
    
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setErrors({ general: 'Google authentication timed out. Please try again.' });
      console.log('⏰ Google OAuth timed out');
    }, 10000);
    
    try {
      console.log('🔐 Attempting Google OAuth...');
      const { error } = await signInWithOAuth('google');
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        setErrors({ general: 'Google authentication failed. Please try again.' });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ OAuth exception:', error);
      setErrors({ general: 'Google authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password with hCaptcha token
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ general: 'Please enter your email address first.' });
      return;
    }

    if (!captchaToken) {
      setErrors({ captcha: 'Please complete the security verification before requesting password reset' });
      console.log('❌ Password reset blocked: Missing captcha token');
      return;
    }

    console.log('📧 Starting password reset with captcha verification');
    console.log('- Email:', formData.email);
    console.log('- Captcha Token Preview:', captchaToken.substring(0, 20) + '...');
    setIsLoading(true);
    
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setErrors({ general: 'Password reset request timed out. Please try again.' });
      console.log('⏰ Password reset timed out');
    }, 10000);
    
    try {
      console.log('📧 Sending password reset for:', formData.email, 'with hCaptcha token');
      const { error } = await resetPassword(formData.email, captchaToken);
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('❌ Password reset error:', error);
        setErrors({ general: error.message });
        
        // Reset captcha on error
        if (captchaRef.current) {
          try {
            captchaRef.current.resetCaptcha();
            console.log('🔄 hCaptcha reset after password reset error');
          } catch (resetError) {
            console.warn('⚠️ Failed to reset hCaptcha after password reset error:', resetError);
          }
        }
        setCaptchaToken(null);
      } else {
        setErrors({ 
          general: 'Password reset instructions have been sent to your email address.' 
        });
        console.log('✅ Password reset email sent successfully');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ Password reset exception:', error);
      setErrors({ general: 'Failed to send reset email. Please try again.' });
      
      // Reset captcha on error
      if (captchaRef.current) {
        try {
          captchaRef.current.resetCaptcha();
          console.log('🔄 hCaptcha reset after password reset exception');
        } catch (resetError) {
          console.warn('⚠️ Failed to reset hCaptcha after password reset exception:', resetError);
        }
      }
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (authSuccess && user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            
            <Heading level={2} className="mb-4">
              {isLogin ? 'Welcome Back!' : 'Account Created!'}
            </Heading>
            
            <Typography variant="body" color="secondary" className="mb-6">
              {isLogin 
                ? `Welcome back, ${user.email}!` 
                : 'Your account has been created successfully. Welcome to Fictus AI!'
              }
            </Typography>
            
            <div className="w-full bg-gray-700 rounded-full h-1 overflow-hidden">
              <div className="bg-green-400 h-1 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
            
            <Typography variant="caption" color="secondary" className="mt-3">
              Redirecting you now...
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if hCaptcha is not configured
  if (!HCAPTCHA_SITE_KEY) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-red-700 shadow-2xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            
            <Heading level={2} className="mb-4 text-red-400">
              Configuration Error
            </Heading>
            
            <Typography variant="body" color="secondary" className="mb-6">
              Security verification is not properly configured. Please contact support or check the application setup.
            </Typography>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <Typography variant="caption" className="text-red-400">
                <strong>For Developers:</strong> Set VITE_HCAPTCHA_SITE_KEY in your environment variables.
                See HCAPTCHA_SETUP.md for detailed instructions.
              </Typography>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle w-2 h-2 bg-blue-400/30 top-1/4 left-1/4 float-animation"></div>
        <div className="particle w-3 h-3 bg-cyan-400/20 top-3/4 left-3/4 float-animation"></div>
        <div className="particle w-1 h-1 bg-purple-400/40 top-1/2 left-1/6 float-animation"></div>
        <div className="particle w-2 h-2 bg-blue-500/25 top-1/6 right-1/4 float-animation"></div>
        <div className="particle w-1 h-1 bg-cyan-500/30 bottom-1/4 right-1/6 float-animation"></div>
      </div>

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg transition-all duration-300 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <Typography variant="cardCaption">Back to Home</Typography>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/fictus.png" 
                alt="Fictus AI" 
                className="h-12 w-auto mx-auto object-contain filter drop-shadow-sm"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            
            <Heading level={2} className="mb-4">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Heading>
            
            <Typography variant="body" color="secondary" className="mb-6">
              {isLogin 
                ? 'Sign in to your Fictus AI account' 
                : 'Join thousands of users verifying AI content'
              }
            </Typography>

            {/* Tab Switcher */}
            <div className="flex bg-gray-800 rounded-lg p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                  isLogin 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                  !isLogin 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
            {/* General Error/Success */}
            {errors.general && (
              <div className={`mb-6 p-4 rounded-lg border ${
                errors.general.includes('reset') || errors.general.includes('sent') || errors.general.includes('check your email') || errors.general.includes('created successfully')
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  {errors.general.includes('reset') || errors.general.includes('sent') || errors.general.includes('check your email') || errors.general.includes('created successfully') ? (
                    <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <Typography variant="body" className={
                    errors.general.includes('reset') || errors.general.includes('sent') || errors.general.includes('check your email') || errors.general.includes('created successfully')
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }>
                    {errors.general}
                  </Typography>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields (Signup only) */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        onFocus={() => setFocusedField('firstName')}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 disabled:opacity-50 ${
                          errors.firstName 
                            ? 'border-red-500' 
                            : focusedField === 'firstName'
                            ? 'border-blue-500'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        placeholder="John"
                        aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                      />
                    </div>
                    {errors.firstName && (
                      <Typography variant="caption" className="text-red-400 mt-1" id="firstName-error">
                        {errors.firstName}
                      </Typography>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        onFocus={() => setFocusedField('lastName')}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 disabled:opacity-50 ${
                          errors.lastName 
                            ? 'border-red-500' 
                            : focusedField === 'lastName'
                            ? 'border-blue-500'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        placeholder="Doe"
                        aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                      />
                    </div>
                    {errors.lastName && (
                      <Typography variant="caption" className="text-red-400 mt-1" id="lastName-error">
                        {errors.lastName}
                      </Typography>
                    )}
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 disabled:opacity-50 ${
                      errors.email 
                        ? 'border-red-500' 
                        : focusedField === 'email'
                        ? 'border-blue-500'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    placeholder="john@example.com"
                    autoComplete="email"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <Typography variant="caption" className="text-red-400 mt-1" id="email-error">
                    {errors.email}
                  </Typography>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 disabled:opacity-50 ${
                      errors.password 
                        ? 'border-red-500' 
                        : focusedField === 'password'
                        ? 'border-blue-500'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    placeholder="Enter your password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <Typography variant="caption" className="text-red-400 mt-1" id="password-error">
                    {errors.password}
                  </Typography>
                )}
              </div>

              {/* Confirm Password (Signup only) */}
              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword || ''}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 disabled:opacity-50 ${
                        errors.confirmPassword 
                          ? 'border-red-500' 
                          : focusedField === 'confirmPassword'
                          ? 'border-blue-500'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <Typography variant="caption" className="text-red-400 mt-1" id="confirmPassword-error">
                      {errors.confirmPassword}
                    </Typography>
                  )}
                </div>
              )}

              {/* hCaptcha - REQUIRED */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    Security Verification *
                  </div>
                </label>
                
                <div className="flex justify-center">
                  <div className="relative">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={HCAPTCHA_SITE_KEY}
                      onVerify={handleCaptchaVerify}
                      onExpire={handleCaptchaExpire}
                      onError={handleCaptchaError}
                      onLoad={handleCaptchaLoad}
                      onOpen={handleCaptchaOpen}
                      onClose={handleCaptchaClose}
                      theme="dark"
                      size="normal"
                      tabindex={0}
                    />
                    
                    {/* Loading indicator */}
                    {!captchaLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                          <Typography variant="caption" color="secondary">
                            Loading security verification...
                          </Typography>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Captcha status indicators */}
                <div className="mt-2 text-center">
                  {captchaToken && (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <Typography variant="caption" className="text-green-400">
                        Security verification completed
                      </Typography>
                    </div>
                  )}
                  
                  {(errors.captcha || captchaError) && (
                    <div className="flex items-center justify-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <Typography variant="caption" className="text-red-400">
                        {errors.captcha || captchaError}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                      disabled={isLoading}
                      className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded transition-colors disabled:opacity-50"
                    />
                    <Typography variant="body" className="ml-2 text-gray-300">
                      Remember me
                    </Typography>
                  </label>
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  >
                    <Typography variant="body">
                      Forgot password?
                    </Typography>
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !captchaToken}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <ButtonText>
                  {isLoading 
                    ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                    : (isLogin ? 'Sign In' : 'Create Account')
                  }
                </ButtonText>
              </button>

              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-700"></div>
                <Typography variant="body" color="secondary" className="px-4">
                  or continue with
                </Typography>
                <div className="flex-1 border-t border-gray-700"></div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Chrome className="h-5 w-5" />
                <Typography variant="body">Continue with Google</Typography>
              </button>
            </form>

            {/* Switch Mode */}
            <div className="mt-6 text-center">
              <Typography variant="body" color="secondary">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  disabled={isLoading}
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium disabled:opacity-50"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </Typography>
            </div>

            {/* Security Notice */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2 justify-center">
                <Shield className="h-4 w-4 text-green-400" />
                <Typography variant="caption" color="secondary" className="text-center">
                  Protected by hCaptcha for enhanced security
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;