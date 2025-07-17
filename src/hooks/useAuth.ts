import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { auth, db } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  profile: any | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    profile: null
  })

  // Function to load user profile with timeout
  const loadUserProfile = async (userId: string, timeout = 15000) => {
    try {
      console.log('Loading profile for user:', userId)
      
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile load timeout')), timeout)
      })
      
      // Race between profile load and timeout
      const profilePromise = db.profiles.get(userId)
      
      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any
      
      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load profile:', error)
        return null
      }
      
      console.log('Profile loaded:', profile)
      return profile
    } catch (err) {
      console.error('Profile load exception:', err)
      return null
    }
  }

  // Enhanced profile creation with better duplicate handling
  const ensureUserProfile = async (user: User) => {
    try {
      console.log('Checking profile for user:', user.email)
      
      // Try to load existing profile first with longer timeout
      const profile = await loadUserProfile(user.id, 10000)
      
      if (profile) {
        console.log('Profile already exists:', profile)
        return profile
      }
      
      // If no profile exists, try to create one
      console.log('Creating new profile for user:', user.email)
      
      const newProfile = {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '', // Fixed typo
        avatar_url: user.user_metadata?.avatar_url || null,
        email_verified: !!user.email_confirmed_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Set a timeout for profile creation
      const createTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile creation timeout')), 7000)
      })
      
      const createPromise = db.profiles.create(newProfile)
      
      try {
        const { data: createdProfile, error: createError } = await Promise.race([createPromise, createTimeout]) as any
        
        if (createError) {
          console.error('Failed to create profile:', createError)
          
          // If it's a duplicate key error, try to fetch the existing profile
          if (createError.code === '23505') {
            console.log('Profile already exists (duplicate key), attempting to fetch existing profile')
            
            // Add small delay to allow any concurrent profile creation to complete
            await new Promise(resolve => setTimeout(resolve, 500))
            
            try {
              const existingProfile = await loadUserProfile(user.id, 15000)
              if (existingProfile) {
                return existingProfile
              }
            } catch (fetchErr) {
              console.error('Failed to fetch existing profile after duplicate error:', fetchErr)
            }
          }
          
          return null
        }
        
        console.log('Profile created successfully:', createdProfile)
        return createdProfile
      } catch (createErr) {
        console.error('Profile creation failed or timed out:', createErr)
        
        // If creation timed out, try to fetch existing profile as fallback
        try {
          console.log('Attempting to fetch profile after creation timeout')
          
          // Add small delay to allow any concurrent profile creation to complete
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const existingProfile = await loadUserProfile(user.id, 15000)
          if (existingProfile) {
            console.log('Found existing profile after timeout:', existingProfile)
            return existingProfile
          }
        } catch (fetchErr) {
          console.error('Failed to fetch profile after creation timeout:', fetchErr)
        }
        
        return null
      }
      
    } catch (err) {
      console.error('Profile ensure exception:', err)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Get initial session with aggressive timeout
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Set a shorter timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('Auth initialization timeout, setting loading to false')
            setAuthState({
              user: null,
              session: null,
              profile: null,
              loading: false
            })
          }
        }, 10000) // Increased to 10 seconds for better reliability

        const { data: { session }, error } = await auth.getCurrentSession()
        
        // Clear timeout since we got a response
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        if (error) {
          console.error('Failed to get session:', error)
          if (mounted) {
            setAuthState({
              user: null,
              session: null,
              profile: null,
              loading: false
            })
          }
          return
        }
        
        if (mounted) {
          if (session?.user) {
            console.log('Found existing session for:', session.user.email)
            
            // Set user immediately, then try to load profile
            setAuthState(prev => ({
              ...prev,
              user: session.user,
              session,
              loading: false
            }))
            
            // Load profile in background (don't block)
            ensureUserProfile(session.user).then(profile => {
              if (mounted) {
                setAuthState(prev => ({
                  ...prev,
                  profile
                }))
              }
            }).catch(err => {
              console.error('Background profile load failed:', err)
            })
            
          } else {
            console.log('No existing session found')
            setAuthState({
              user: null,
              session: null,
              profile: null,
              loading: false
            })
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false
          })
        }
      }
    }

    initializeAuth()

    // Listen for auth changes with simplified handling
    const { data: { subscription } } = auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (mounted) {
          if (session?.user) {
            // Set user immediately
            setAuthState(prev => ({
              ...prev,
              user: session.user,
              session,
              loading: false
            }))
            
            // Load profile in background
            ensureUserProfile(session.user).then(profile => {
              if (mounted) {
                setAuthState(prev => ({
                  ...prev,
                  profile
                }))
              }
            }).catch(err => {
              console.error('Background profile load failed:', err)
            })
            
          } else {
            setAuthState({
              user: null,
              session: null,
              profile: null,
              loading: false
            })
          }
        }
      }
    )

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, [])

  // Enhanced auth functions with hCaptcha support and better error handling
  const signUp = async (email: string, password: string, userData?: { firstName?: string; lastName?: string }, hcaptchaToken?: string) => {
    try {
      console.log('Attempting signup for:', email, 'with metadata:', userData, 'and hCaptcha token:', !!hcaptchaToken)
      
      // Set a timeout for the signup process
      const signupTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Signup timeout')), 10000)
      })
      
      const signupPromise = auth.signUp(email, password, userData, hcaptchaToken)
      
      const { data, error } = await Promise.race([signupPromise, signupTimeout]) as any
      
      if (error) {
        console.error('Signup error:', error)
        return { data: null, error }
      }
      
      console.log('Signup successful:', data)
      return { data, error: null }
    } catch (err) {
      console.error('SignUp error:', err)
      return { 
        data: null, 
        error: { message: 'Signup timed out or failed. Please try again.' } 
      }
    }
  }

  const signIn = async (email: string, password: string, hcaptchaToken?: string) => {
    try {
      console.log('Attempting signin for:', email, 'with hCaptcha token:', !!hcaptchaToken)
      
      // Set a timeout for the signin process
      const signinTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Signin timeout')), 10000)
      })
      
      const signinPromise = auth.signIn(email, password, hcaptchaToken)
      
      const { data, error } = await Promise.race([signinPromise, signinTimeout]) as any
      
      if (error) {
        console.error('Signin error:', error)
        return { data: null, error }
      }
      
      console.log('Signin successful:', data)
      return { data, error: null }
    } catch (err) {
      console.error('SignIn error:', err)
      return { 
        data: null, 
        error: { message: 'Signin timed out or failed. Please try again.' } 
      }
    }
  }

  const signInWithOAuth = async (provider: 'google', hcaptchaToken?: string) => {
    try {
      console.log('Attempting OAuth signin with provider:', provider)
      
      const oauthTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OAuth timeout')), 10000)
      })
      
      const oauthPromise = auth.signInWithOAuth(provider)
      
      const { data, error } = await Promise.race([oauthPromise, oauthTimeout]) as any
      
      if (error) {
        console.error('OAuth error:', error)
        return { data: null, error }
      }
      
      console.log('OAuth successful:', data)
      return { data, error: null }
    } catch (err) {
      console.error('OAuth error:', err)
      return { 
        data: null, 
        error: { message: 'OAuth timed out or failed. Please try again.' } 
      }
    }
  }

  const resetPassword = async (email: string, hcaptchaToken?: string) => {
    try {
      console.log('Attempting password reset for:', email, 'with hCaptcha token:', !!hcaptchaToken)
      
      const resetTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Reset timeout')), 10000)
      })
      
      const resetPromise = auth.resetPassword(email, hcaptchaToken)
      
      const { data, error } = await Promise.race([resetPromise, resetTimeout]) as any
      
      if (error) {
        console.error('Password reset error:', error)
        return { data: null, error }
      }
      
      console.log('Password reset successful:', data)
      return { data, error: null }
    } catch (err) {
      console.error('Password reset error:', err)
      return { 
        data: null, 
        error: { message: 'Password reset timed out or failed. Please try again.' } 
      }
    }
  }

  const signOut = async () => {
    try {
      console.log('Attempting signout...')
      
      const signoutTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Signout timeout')), 5000)
      })
      
      const signoutPromise = auth.signOut()
      
      const { error } = await Promise.race([signoutPromise, signoutTimeout]) as any
      
      if (error) {
        console.error('SignOut error:', error)
        return { error }
      }
      
      console.log('Signout successful')
      return { error: null }
    } catch (err) {
      console.error('SignOut exception:', err)
      return { error: { message: 'Signout timed out. Please refresh the page.' } }
    }
  }

  return {
    ...authState,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    refreshProfile: async () => {
      if (authState.user) {
        const profile = await loadUserProfile(authState.user.id)
        setAuthState(prev => ({ ...prev, profile }))
      }
    }
  }
}