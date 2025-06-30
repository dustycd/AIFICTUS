import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Auth helper functions with comprehensive error handling and hCaptcha support
export const auth = {
  // Sign up with email and password and hCaptcha token
  signUp: async (email: string, password: string, userData?: { firstName?: string; lastName?: string }, hcaptchaToken?: string) => {
    try {
      console.log('🔐 Starting signup with hCaptcha verification...');
      
      const signUpOptions: any = {
        email,
        password,
        options: {
          data: {
            first_name: userData?.firstName || '',
            last_name: userData?.lastName || '',
            email: email
          }
        }
      }

      // Add hCaptcha token if provided
      if (hcaptchaToken) {
        console.log('✅ Including hCaptcha token in signup request');
        signUpOptions.options.captchaToken = hcaptchaToken;
      } else {
        console.warn('⚠️ No hCaptcha token provided for signup');
      }

      const { data, error } = await supabase.auth.signUp(signUpOptions)

      if (error) {
        console.error('❌ Supabase signup error:', error)
        
        // Handle specific error cases
        if (error.message.includes('captcha')) {
          return { 
            data: null, 
            error: { 
              message: 'Security verification failed. Please complete the captcha and try again.' 
            } 
          }
        }
        
        if (error.message.includes('already registered')) {
          return { 
            data: null, 
            error: { 
              message: 'An account with this email already exists. Please try signing in instead.' 
            } 
          }
        }
        
        if (error.message.includes('Password should be at least')) {
          return { 
            data: null, 
            error: { 
              message: 'Password must be at least 6 characters long.' 
            } 
          }
        }
        
        if (error.message.includes('Invalid email')) {
          return { 
            data: null, 
            error: { 
              message: 'Please enter a valid email address.' 
            } 
          }
        }
        
        return { data: null, error }
      }

      console.log('✅ Signup successful:', data)
      return { data, error: null }
    } catch (err) {
      console.error('❌ Signup exception:', err)
      return { data: null, error: { message: 'An unexpected error occurred during signup' } }
    }
  },

  // Sign in with email and password and hCaptcha token
  signIn: async (email: string, password: string, hcaptchaToken?: string) => {
    try {
      console.log('🔐 Starting signin with hCaptcha verification...');
      
      const signInOptions: any = {
        email,
        password
      }

      // Add hCaptcha token if provided
      if (hcaptchaToken) {
        console.log('✅ Including hCaptcha token in signin request');
        signInOptions.options = {
          captchaToken: hcaptchaToken
        };
      } else {
        console.warn('⚠️ No hCaptcha token provided for signin');
      }

      const { data, error } = await supabase.auth.signInWithPassword(signInOptions)

      if (error) {
        console.error('❌ Supabase signin error:', error)
        
        // Handle specific error cases
        if (error.message.includes('captcha')) {
          return { 
            data: null, 
            error: { 
              message: 'Security verification failed. Please complete the captcha and try again.' 
            } 
          }
        }
        
        if (error.message.includes('Invalid login credentials')) {
          return { 
            data: null, 
            error: { 
              message: 'Invalid email or password. Please check your credentials and try again.' 
            } 
          }
        }
        
        if (error.message.includes('Email not confirmed')) {
          return { 
            data: null, 
            error: { 
              message: 'Please check your email and click the confirmation link before signing in.' 
            } 
          }
        }
        
        if (error.message.includes('Too many requests')) {
          return { 
            data: null, 
            error: { 
              message: 'Too many login attempts. Please wait a moment before trying again.' 
            } 
          }
        }
        
        return { data: null, error }
      }

      console.log('✅ Signin successful:', data)
      return { data, error: null }
    } catch (err) {
      console.error('❌ Signin exception:', err)
      return { data: null, error: { message: 'An unexpected error occurred during signin' } }
    }
  },

  // Sign in with OAuth (Google only) with hCaptcha token
  signInWithOAuth: async (provider: 'google', hcaptchaToken?: string) => {
    try {
      console.log('🔐 Starting OAuth signin with hCaptcha verification...');
      
      const oauthOptions: any = {
        provider,
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      }

      // Add hCaptcha token if provided
      if (hcaptchaToken) {
        console.log('✅ Including hCaptcha token in OAuth request');
        oauthOptions.options.captchaToken = hcaptchaToken;
      } else {
        console.warn('⚠️ No hCaptcha token provided for OAuth');
      }

      const { data, error } = await supabase.auth.signInWithOAuth(oauthOptions)

      if (error) {
        console.error('❌ OAuth error:', error)
        
        if (error.message.includes('captcha')) {
          return { 
            data: null, 
            error: { 
              message: 'Security verification failed. Please complete the captcha and try again.' 
            } 
          }
        }
        
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error('❌ OAuth exception:', err)
      return { data: null, error: { message: 'An unexpected error occurred during OAuth signin' } }
    }
  },

  // Reset password with hCaptcha token
  resetPassword: async (email: string, hcaptchaToken?: string) => {
    try {
      console.log('🔐 Starting password reset with hCaptcha verification...');
      
      const resetOptions: any = {
        redirectTo: `${window.location.origin}/auth/reset-password`
      }

      // Add hCaptcha token if provided
      if (hcaptchaToken) {
        console.log('✅ Including hCaptcha token in password reset request');
        resetOptions.captchaToken = hcaptchaToken;
      } else {
        console.warn('⚠️ No hCaptcha token provided for password reset');
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, resetOptions)

      if (error) {
        console.error('❌ Password reset error:', error)
        
        if (error.message.includes('captcha')) {
          return { 
            data: null, 
            error: { 
              message: 'Security verification failed. Please complete the captcha and try again.' 
            } 
          }
        }
        
        if (error.message.includes('Invalid email')) {
          return { 
            data: null, 
            error: { 
              message: 'Please enter a valid email address.' 
            } 
          }
        }
        
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error('❌ Password reset exception:', err)
      return { data: null, error: { message: 'An unexpected error occurred during password reset' } }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Signout error:', error)
        return { error }
      }

      console.log('Signout successful')
      return { error: null }
    } catch (err) {
      console.error('Signout exception:', err)
      return { error: { message: 'An unexpected error occurred during signout' } }
    }
  },

  // Get current user
  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  // Get current session
  getCurrentSession: () => {
    return supabase.auth.getSession()
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions with timeouts
export const db = {
  // User profiles
  profiles: {
    get: async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Profile get error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('Profile get exception:', err)
        return { data: null, error: { message: 'Failed to fetch profile' } }
      }
    },

    update: async (userId: string, updates: any) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single()
        
        if (error) {
          console.error('Profile update error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('Profile update exception:', err)
        return { data: null, error: { message: 'Failed to update profile' } }
      }
    },

    create: async (profile: any) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert(profile)
          .select()
          .single()
        
        if (error) {
          console.error('Profile create error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('Profile create exception:', err)
        return { data: null, error: { message: 'Failed to create profile' } }
      }
    }
  }
}

export default supabase