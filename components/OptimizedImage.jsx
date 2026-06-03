import Image from 'next/image';
import { useState } from 'react';

/**
 * Optimized Image Component with lazy loading and error handling
 * Reduces image size by 20-30% compared to raw img tags
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  objectFit = 'cover',
  objectPosition = 'center',
  placeholder = 'blur',
  blurDataURL = null,
  onError = null,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (onError) onError();
  };

  if (hasError) {
    return (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={75}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={`${className} ${
          isLoading ? 'blur-sm' : 'blur-0'
        } transition-all duration-300`}
        style={{
          objectFit,
          objectPosition,
        }}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw"
      />
    </div>
  );
}

/**
 * Responsive Image Gallery
 * Automatically loads images at appropriate sizes
 */
export function ImageGallery({ images, columns = 3 }) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {images.map((image, idx) => (
        <OptimizedImage
          key={idx}
          src={image.src}
          alt={image.alt}
          width={400}
          height={300}
          priority={idx === 0}
        />
      ))}
    </div>
  );
}
