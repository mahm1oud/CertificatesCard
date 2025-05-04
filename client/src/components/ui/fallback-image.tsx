import { useState, useEffect } from 'react';

interface FallbackImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * مكون صورة مع دعم صورة بديلة في حالة فشل تحميل الصورة الأصلية
 */
export function FallbackImage({
  src,
  alt,
  fallbackSrc = "/static/default-logo.svg",
  className = "",
  width,
  height,
}: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    // إعادة ضبط مصدر الصورة وحالة الخطأ عند تغيير src
    setImgSrc(src);
    setImgError(false);
  }, [src]);

  // التعامل مع أخطاء تحميل الصورة
  const handleError = () => {
    if (!imgError) {
      console.log("Error loading image:", src);
      setImgSrc(fallbackSrc);
      setImgError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
    />
  );
}