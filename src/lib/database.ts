import { supabase } from './supabase'
import { usageLimits } from './usageLimits'
import { isImageFile } from './storage'

// Database helper functions for verifications
export const db = {
  supabase, // Export supabase instance for direct access to RPC functions
  
  verifications: {
    // Create a new verification record
    create: async (verification: {
      user_id: string;
      file_name: string;
      file_url?: string;
      file_size?: number;
      content_type: string;
      verification_status?: string;
      confidence_score?: number;
      ai_probability?: number;
      human_probability?: number;
      processing_time?: number;
      report_id?: string;
      detection_details?: any;
      risk_factors?: string[];
      recommendations?: string[];
      metadata?: any;
      storage_bucket?: string;
      storage_path?: string;
      thumbnail_path?: string;
      file_hash?: string;
      original_filename?: string;
      upload_progress?: number;
      is_public_library_item?: boolean;
    }) => {
      try {
        // First create the verification record
        const { data, error } = await supabase
          .from('verifications')
          .insert({
            ...verification,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) {
          console.error('❌ Verification create error:', error)
          return { data: null, error }
        } else {
          console.log('✅ Verification record created:', data?.id)
          
          // After successful verification creation, increment usage count
          // This ensures usage is only counted for successful uploads
          const contentType = isImageFile(undefined, verification.file_name) ? 'image' : 'video'
          console.log('📊 Incrementing usage count for:', contentType)
          
          const usageResult = await usageLimits.incrementMonthlyUsage(verification.user_id, contentType)
          
          if (!usageResult.success) {
            console.error('❌ Failed to increment usage count:', usageResult.message)
            // Note: We don't fail the entire operation if usage increment fails
            // The verification was successful, usage tracking is secondary
          } else {
            console.log('✅ Usage count incremented successfully')
          }
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Verification create exception:', err)
        return { data: null, error: { message: 'Failed to create verification record' } }
      }
    },

    // Update an existing verification
    update: async (id: string, updates: any) => {
      try {
        const { data, error } = await supabase
          .from('verifications')
          .update({ 
            ...updates, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
          .select()
          .single()
        
        if (error) {
          console.error('❌ Verification update error:', error)
        } else {
          console.log('✅ Verification record updated:', data?.id)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Verification update exception:', err)
        return { data: null, error: { message: 'Failed to update verification record' } }
      }
    },

    // Get verification by ID
    get: async (id: string) => {
      try {
        const { data, error } = await supabase
          .from('verifications')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error && error.code !== 'PGRST116') {
          console.error('❌ Verification get error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Verification get exception:', err)
        return { data: null, error: { message: 'Failed to fetch verification' } }
      }
    },

    // Get all verifications for a user
    getByUser: async (userId: string, limit = 50, offset = 0) => {
      try {
        const { data, error } = await supabase
          .from('verifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        
        if (error) {
          console.error('❌ Verification getByUser error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Verification getByUser exception:', err)
        return { data: null, error: { message: 'Failed to fetch user verifications' } }
      }
    },

    // Delete a verification (and associated storage files)
    delete: async (id: string) => {
      try {
        // First get the verification to find associated files
        const { data: verification } = await supabase
          .from('verifications')
          .select('storage_bucket, storage_path, thumbnail_path')
          .eq('id', id)
          .single()
        
        // Delete the database record
        const { data, error } = await supabase
          .from('verifications')
          .delete()
          .eq('id', id)
          .select()
          .single()
        
        if (error) {
          console.error('❌ Verification delete error:', error)
          return { data: null, error }
        }
        
        // Clean up associated storage files (best effort)
        if (verification?.storage_bucket && verification?.storage_path) {
          try {
            await supabase.storage
              .from(verification.storage_bucket)
              .remove([verification.storage_path])
            console.log('🗑️ Cleaned up storage file:', verification.storage_path)
          } catch (storageError) {
            console.warn('⚠️ Failed to clean up storage file:', storageError)
          }
        }
        
        if (verification?.thumbnail_path) {
          try {
            await supabase.storage
              .from('verification-thumbnails')
              .remove([verification.thumbnail_path])
            console.log('🗑️ Cleaned up thumbnail file:', verification.thumbnail_path)
          } catch (storageError) {
            console.warn('⚠️ Failed to clean up thumbnail file:', storageError)
          }
        }
        
        console.log('✅ Verification deleted:', id)
        console.log('ℹ️ Note: Usage limits are NOT decremented to prevent abuse')
        return { data, error: null }
      } catch (err) {
        console.error('❌ Verification delete exception:', err)
        return { data: null, error: { message: 'Failed to delete verification' } }
      }
    },

    // Get recent verifications (for library/dashboard)
    getRecent: async (limit = 20) => {
      try {
        const { data, error } = await supabase
          .from('verifications')
          .select(`
            *,
            profiles:user_id (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (error) {
          console.error('❌ Verification getRecent error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Verification getRecent exception:', err)
        return { data: null, error: { message: 'Failed to fetch recent verifications' } }
      }
    },

    // Get public library items
    getPublicLibraryItems: async (
      limit = 50,
      offset = 0,
      statusFilter?: string,
      contentTypeFilter?: string,
      searchTerm?: string
    ) => {
      try {
        const { data, error } = await supabase.rpc('get_public_library_items', {
          p_limit: limit,
          p_offset: offset,
          p_status_filter: statusFilter || null,
          p_content_type_filter: contentTypeFilter || null,
          p_search_term: searchTerm || null
        })
        
        if (error) {
          console.error('❌ Public library items error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Public library items exception:', err)
        return { data: null, error: { message: 'Failed to fetch public library items' } }
      }
    },

    // Toggle public sharing status
    togglePublicSharing: async (verificationId: string, userId: string, isPublic: boolean) => {
      try {
        const { data, error } = await supabase.rpc('toggle_verification_public_sharing', {
          p_verification_id: verificationId,
          p_user_id: userId,
          p_is_public: isPublic
        })
        
        if (error) {
          console.error('❌ Toggle sharing error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Toggle sharing exception:', err)
        return { data: null, error: { message: 'Failed to update sharing status' } }
      }
    },

    // Increment view count for public items
    incrementViewCount: async (verificationId: string) => {
      try {
        const { data, error } = await supabase.rpc('increment_public_item_views', {
          p_verification_id: verificationId
        })
        
        if (error) {
          console.error('❌ Increment view count error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Increment view count exception:', err)
        return { data: null, error: { message: 'Failed to increment view count' } }
      }
    },

    // Get verification statistics
    getStats: async (userId?: string) => {
      try {
        let query = supabase
          .from('verifications')
          .select('verification_status, created_at, file_size')
        
        if (userId) {
          query = query.eq('user_id', userId)
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('❌ Verification stats error:', error)
          return { data: null, error }
        }
        
        // Calculate statistics
        const stats = {
          total: data.length,
          authentic: data.filter(v => v.verification_status === 'authentic').length,
          suspicious: data.filter(v => v.verification_status === 'suspicious').length,
          fake: data.filter(v => v.verification_status === 'fake').length,
          pending: data.filter(v => v.verification_status === 'pending').length,
          error: data.filter(v => v.verification_status === 'error').length,
          totalFileSize: data.reduce((sum, v) => sum + (v.file_size || 0), 0),
          recentActivity: data.filter(v => {
            const createdAt = new Date(v.created_at)
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return createdAt > weekAgo
          }).length
        }
        
        return { data: stats, error: null }
      } catch (err) {
        console.error('❌ Verification stats exception:', err)
        return { data: null, error: { message: 'Failed to fetch verification statistics' } }
      }
    },

    // Search verifications
    search: async (query: string, userId?: string, limit = 20) => {
      try {
        let dbQuery = supabase
          .from('verifications')
          .select('*')
          .or(`file_name.ilike.%${query}%,report_id.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (userId) {
          dbQuery = dbQuery.eq('user_id', userId)
        }
        
        const { data, error } = await dbQuery
        
        if (error) {
          console.error('❌ Verification search error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Verification search exception:', err)
        return { data: null, error: { message: 'Failed to search verifications' } }
      }
    }
  },

  // Profile management
  profiles: {
    // Get profile by user ID
    get: async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('❌ Profile get error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Profile get exception:', err)
        return { data: null, error: { message: 'Failed to fetch profile' } }
      }
    },

    // Update profile
    update: async (userId: string, updates: any) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single()
        
        if (error) {
          console.error('❌ Profile update error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Profile update exception:', err)
        return { data: null, error: { message: 'Failed to update profile' } }
      }
    },

    // Create profile
    create: async (profile: any) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert(profile)
          .select()
          .single()
        
        if (error) {
          console.error('❌ Profile create error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Profile create exception:', err)
        return { data: null, error: { message: 'Failed to create profile' } }
      }
    }
  },

  // Storage-related database operations
  storage: {
    // Get storage usage statistics
    getUsageStats: async (userId?: string) => {
      try {
        let query = supabase
          .from('verifications')
          .select('storage_bucket, file_size, created_at')
          .not('storage_bucket', 'is', null)
        
        if (userId) {
          query = query.eq('user_id', userId)
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('❌ Storage stats error:', error)
          return { data: null, error }
        }
        
        // Calculate usage by bucket
        const usage = {
          'verification-videos': {
            count: 0,
            totalSize: 0
          },
          'verification-images': {
            count: 0,
            totalSize: 0
          },
          'verification-thumbnails': {
            count: 0,
            totalSize: 0
          }
        }
        
        data.forEach(item => {
          if (item.storage_bucket && usage[item.storage_bucket as keyof typeof usage]) {
            usage[item.storage_bucket as keyof typeof usage].count++
            usage[item.storage_bucket as keyof typeof usage].totalSize += item.file_size || 0
          }
        })
        
        return { data: usage, error: null }
      } catch (err) {
        console.error('❌ Storage usage stats exception:', err)
        return { data: null, error: { message: 'Failed to fetch storage usage statistics' } }
      }
    }
  },

  // Public library statistics
  library: {
    // Get public library statistics
    getStats: async () => {
      try {
        const { data, error } = await supabase
          .from('public_library_stats')
          .select('*')
          .single()
        
        if (error) {
          console.error('❌ Public library stats error:', error)
        }
        
        return { data, error }
      } catch (err) {
        console.error('❌ Public library stats exception:', err)
        return { data: null, error: { message: 'Failed to fetch public library statistics' } }
      }
    }
  }
}