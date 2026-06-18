import React, { useState, useEffect, ImgHTMLAttributes } from 'react';

// Define the name for our dedicated image cache
const CACHE_NAME = 'election-images-cache-v1';

interface CachedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export const CachedImage: React.FC<CachedImageProps> = ({ src, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      // Reset states internally on new src
      if (isMounted) {
        setHasError(false);
      }
      
      if (!src) {
        setIsLoading(false);
        return;
      }

      // We only cache full HTTP/HTTPS urls to avoid intercepting data URIs
      // If it's a relative URL or data URI, just use it directly!
      if (!src.startsWith('http://') && !src.startsWith('https://')) {
        if (isMounted) {
          setImageSrc(src);
          setIsLoading(false);
        }
        return;
      }

      try {
        const cache = await window.caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(src);

        // 1. Instantly display from cache if available
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          objectUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setImageSrc(objectUrl);
            setIsLoading(false);
          }
        }

        // 2. Fetch fresh image in the background (Stale-While-Revalidate)
        // This ensures if the candidate changes their photo but the URL remains the same (e.g. Cloudinary overwrite), it eventually updates.
        try {
          const response = await fetch(src, {
            mode: 'cors',
            credentials: 'omit'
          });

          if (response.ok) {
            await cache.put(src, response.clone());
            
            // If it wasn't in cache, display it now
            if (!cachedResponse) {
              const freshBlob = await response.blob();
              const newObjectUrl = URL.createObjectURL(freshBlob);
              if (isMounted) {
                if (objectUrl) URL.revokeObjectURL(objectUrl); // cleanup old
                objectUrl = newObjectUrl;
                setImageSrc(objectUrl);
                setIsLoading(false);
              }
            }
          } else if (!cachedResponse) {
            // Fetch failed (e.g. 404) and no cache, fallback to normal src
            if (isMounted) {
              setImageSrc(src);
              setIsLoading(false);
            }
          }
        } catch (fetchErr) {
          // Network or CORS error on the fetch. 
          // If we had a cache hit, we just ignore the fetch failure and keep showing the cached image!
          // If we did NOT have a cache, fallback to normal network <img> load which bypasses CORS issues.
          if (!cachedResponse && isMounted) {
            setImageSrc(src);
            setIsLoading(false);
          }
        }
      } catch (error) {
        // `window.caches` might be missing on HTTP (non-secure context) or throw other errors
        console.warn("Cache API unavailable or threw error, falling back:", error);
        if (isMounted) {
          setImageSrc(src);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      {...props}
      onError={(e) => {
        // Ultimate fallback: If the Blob URL or cache image actually breaks when rendering,
        // we forcefully try the original source via standard browser image loading.
        if (imageSrc !== src && !hasError) {
          setHasError(true);
          setImageSrc(src);
        }
        if (props.onError) {
          props.onError(e);
        }
      }}
      style={{
        ...props.style,
        opacity: isLoading ? 0.6 : 1, // Subtle cue during loading, prevents completely hidden images
        transition: 'opacity 0.2s ease-in-out'
      }}
    />
  );
};

export default CachedImage;
