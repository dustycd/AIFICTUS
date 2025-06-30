import React, { useEffect, useState } from 'react';
import { db } from '../lib/database';
import { getPublicUrl } from '../lib/storage';

interface LibraryItem {
  id: string;
  file_name: string;
  original_filename: string;
  content_type: string;
  verification_status: 'authentic' | 'suspicious' | 'fake';
  confidence_score: number;
  ai_probability?: number;
  human_probability?: number;
  processing_time: number;
  file_size: number;
  detection_details: any;
  risk_factors: string[];
  recommendations: string[];
  created_at: string;
  uploader_name: string;
  view_count: number;
  file_url: string;
  storage_bucket: string;
  storage_path: string;
  thumbnail_path: string;
}

// Diverse placeholder media sources for variety
const PLACEHOLDER_MEDIA = [
  // Tech/AI themed images
  'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/8439093/pexels-photo-8439093.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/8438918/pexels-photo-8438918.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  
  // People/portraits for deepfake detection context
  'https://images.pexels.com/photos/3778966/pexels-photo-3778966.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/3992209/pexels-photo-3992209.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/4144222/pexels-photo-4144222.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/4226865/pexels-photo-4226865.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  
  // Digital/cyber themed
  'https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/5011647/pexels-photo-5011647.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/4668520/pexels-photo-4668520.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/5077045/pexels-photo-5077045.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/5207262/pexels-photo-5207262.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  
  // Media/content creation
  'https://images.pexels.com/photos/4321452/pexels-photo-4321452.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/4491461/pexels-photo-4491461.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/4492129/pexels-photo-4492129.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/5359744/pexels-photo-5359744.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/5418351/pexels-photo-5418351.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  
  // Abstract/artistic
  'https://images.pexels.com/photos/5473302/pexels-photo-5473302.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/5380594/pexels-photo-5380594.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/5380666/pexels-photo-5380666.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/5273715/pexels-photo-5273715.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
  'https://images.pexels.com/photos/4672484/pexels-photo-4672484.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1'
];

const VideoGrid = () => {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animationOffset, setAnimationOffset] = useState(0);

  // Fetch public library items
  useEffect(() => {
    const fetchLibraryItems = async () => {
      try {
        console.log('🎬 Fetching public library items for background grid...');
        
        const { data, error } = await db.supabase.rpc('get_public_library_items', {
          p_limit: 30, // Reduced to get more variety with placeholders
          p_offset: 0,
          p_status_filter: null,
          p_content_type_filter: null,
          p_search_term: null
        });

        if (error) {
          console.error('❌ Error fetching library items:', error);
          setLibraryItems([]);
        } else {
          console.log(`✅ Fetched ${data?.length || 0} library items for background`);
          setLibraryItems(data || []);
        }
      } catch (err) {
        console.error('❌ Exception fetching library items:', err);
        setLibraryItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibraryItems();
  }, []);

  // Animate the grid with more dynamic movement
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationOffset(prev => prev + 1); // Continuous increment for smooth animation
    }, 100); // Faster updates for smoother animation

    return () => clearInterval(interval);
  }, []);

  // Get media URL for preview
  const getMediaUrl = (item: LibraryItem): string | null => {
    if (item.thumbnail_path) {
      return getPublicUrl('verification-thumbnails', item.thumbnail_path);
    }
    
    if (item.file_url) {
      return item.file_url;
    }
    
    if (item.storage_bucket && item.storage_path) {
      return getPublicUrl(item.storage_bucket, item.storage_path);
    }
    
    return null;
  };

  // Check if content is video
  const isVideo = (contentType: string) => contentType.startsWith('video/');

  // Generate random verification data for placeholders
  const generateRandomVerification = (index: number) => {
    const statuses = ['authentic', 'suspicious', 'fake'];
    const status = statuses[index % 3];
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-99%
    
    return {
      status,
      confidence,
      isVideo: index % 4 === 0 // Every 4th item is a video
    };
  };

  // Render media preview
  const renderMediaPreview = (item: LibraryItem | null, index: number, columnIndex: number) => {
    const verification = item ? {
      status: item.verification_status,
      confidence: item.confidence_score,
      isVideo: isVideo(item.content_type)
    } : generateRandomVerification(index);

    const mediaUrl = item ? getMediaUrl(item) : PLACEHOLDER_MEDIA[index % PLACEHOLDER_MEDIA.length];
    
    // Calculate individual animation delay and direction based on column
    const isEvenColumn = columnIndex % 2 === 0;
    const animationDelay = index * 0.1;
    const animationDuration = 4 + (index % 3); // Vary duration between 4-6 seconds
    
    if (!mediaUrl) {
      // Fallback placeholder
      return (
        <div 
          key={`placeholder-${index}`}
          className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden animate-pulse"
          style={{
            animationDelay: `${animationDelay}s`,
            animationDuration: `${animationDuration}s`
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-1">
                <span className="text-lg">{verification.isVideo ? '🎥' : '🖼️'}</span>
              </div>
              <div className="text-xs text-gray-500">
                {verification.isVideo ? 'Video' : 'Image'}
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      );
    }

    if (verification.isVideo) {
      return (
        <div 
          key={item?.id || `video-${index}`}
          className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden"
          style={{
            animationDelay: `${animationDelay}s`,
            animationDuration: `${animationDuration}s`
          }}
        >
          <video 
            src={mediaUrl}
            poster={item?.thumbnail_path ? getPublicUrl('verification-thumbnails', item.thumbnail_path) : undefined}
            className="w-full h-full object-cover opacity-80 hover:opacity-60 transition-opacity duration-1000"
            muted
            loop
            playsInline
            preload="metadata"
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 rounded-full p-2">
              <div className="w-6 h-6 text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,3 20,12 6,21 6,3"/>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="absolute top-2 left-2 opacity-90">
            <div className={`w-3 h-3 rounded-full ${
              verification.status === 'authentic' ? 'bg-green-400' :
              verification.status === 'suspicious' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
          </div>
          
          {/* Confidence score - FIXED: Using Inter font for numbers */}
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-90">
            <span className="font-numeric font-bold" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
              {Math.round(verification.confidence)}%
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div 
          key={item?.id || `image-${index}`}
          className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden"
          style={{
            animationDelay: `${animationDelay}s`,
            animationDuration: `${animationDuration}s`
          }}
        >
          <img
            src={mediaUrl}
            alt=""
            className="w-full h-full object-cover opacity-80 hover:opacity-60 transition-opacity duration-1000"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Status indicator */}
          <div className="absolute top-2 left-2 opacity-90">
            <div className={`w-3 h-3 rounded-full ${
              verification.status === 'authentic' ? 'bg-green-400' :
              verification.status === 'suspicious' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
          </div>
          
          {/* Confidence score - FIXED: Using Inter font for numbers */}
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white opacity-90">
            <span className="font-numeric font-bold" style={{ fontFamily: 'Inter, Roboto, Helvetica Neue, Arial, sans-serif' }}>
              {Math.round(verification.confidence)}%
            </span>
          </div>
          
          {/* Image indicator */}
          <div className="absolute top-2 right-2 opacity-70">
            <div className="w-5 h-5 text-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>
          </div>
        </div>
      );
    }
  };

  // Create columns with responsive design
  const createColumns = () => {
    if (isLoading) {
      // Show loading placeholders with responsive columns
      return Array.from({ length: 10 }, (_, columnIndex) => (
        <div key={`loading-column-${columnIndex}`} className="w-1/3 sm:w-1/4 md:w-1/6 lg:w-1/8 xl:w-1/10 flex flex-col gap-3">
          {Array.from({ length: 8 }, (_, itemIndex) => (
            <div
              key={`loading-${columnIndex}-${itemIndex}`}
              className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden animate-pulse"
              style={{
                animationDelay: `${itemIndex * 0.1}s`,
                animationDuration: '3s'
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ))}
        </div>
      ));
    }

    // Create responsive columns with alternating movement
    const columns = [];
    const itemsPerColumn = 8;
    
    for (let columnIndex = 0; columnIndex < 10; columnIndex++) {
      const isEvenColumn = columnIndex % 2 === 0;
      
      // Calculate column transform based on animation offset and direction
      const baseOffset = animationOffset * 0.5; // Base movement speed
      const columnOffset = isEvenColumn ? baseOffset : -baseOffset; // Opposite directions
      const wrappedOffset = columnOffset % 400; // Wrap around every 400px
      
      const columnItems = [];
      
      // Create items for this column (duplicate for seamless loop)
      for (let itemIndex = 0; itemIndex < itemsPerColumn * 2; itemIndex++) { // Double items for seamless loop
        const globalIndex = columnIndex * itemsPerColumn + (itemIndex % itemsPerColumn);
        
        // Use real library items when available, otherwise use placeholders
        const libraryItem = libraryItems.length > 0 ? libraryItems[globalIndex % libraryItems.length] : null;
        
        // Mix in placeholders for variety
        const useLibraryItem = libraryItems.length > 0 && (globalIndex < libraryItems.length || globalIndex % 3 === 0);
        
        columnItems.push(
          renderMediaPreview(
            useLibraryItem ? libraryItem : null, 
            globalIndex, 
            columnIndex
          )
        );
      }
      
      columns.push(
        <div 
          key={`column-${columnIndex}`}
          className="w-1/3 sm:w-1/4 md:w-1/6 lg:w-1/8 xl:w-1/10 flex flex-col gap-3 transition-transform duration-100 ease-linear"
          style={{
            transform: `translateY(${wrappedOffset}px)`,
          }}
        >
          {columnItems}
        </div>
      );
    }
    
    return columns;
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="flex flex-wrap gap-3 h-full w-full opacity-30 scale-150 origin-top-left">
        {createColumns()}
      </div>
      
      {/* Additional overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />
    </div>
  );
};

export default VideoGrid;