import React, { useState } from 'react';
import { OptimizedImageGenerator } from './optimized-image-generator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * KonvaImageGenerator هو غلاف (wrapper) لمكون OptimizedImageGenerator المحسّن
 * 
 * هذا المكون يضمن:
 * 1. التوافقية مع الكود القديم (backwards compatibility)
 * 2. متوافق مع واجهة الاستخدام (API) السابقة ويحافظ على نفس الوظائف
 * 3. يستخدم المكون المحسّن داخليًا دون الحاجة لتغيير كافة استدعاءات المكون في التطبيق
 */

interface KonvaImageGeneratorProps {
  templateImage: string;
  fields?: any[];
  formData?: Record<string, any>;
  width?: number;
  height?: number;
  onImageGenerated?: (imageURL: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  quality?: 'preview' | 'medium' | 'high';
}

const KonvaImageGenerator: React.FC<KonvaImageGeneratorProps> = ({
  templateImage,
  fields = [],
  formData = {},
  width = 800,
  height = 600,
  onImageGenerated,
  onError,
  className = '',
  quality = 'medium',
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // تحويل مسار الصورة إلى مسار صحيح للتوافق مع الاستخدامات السابقة
  const fixImagePath = (imagePath: string): string => {
    if (!imagePath) return '';
    
    // إذا كان المسار بدأ بـ data: فهو صورة base64، نتركه كما هو
    if (imagePath.startsWith('data:')) return imagePath;
    
    // إذا كان المسار بدأ بـ http أو https، نتركه كما هو
    if (imagePath.startsWith('http')) return imagePath;
    
    // إذا كان المسار موجود في مجلد temp، نستبدله بـ uploads
    if (imagePath.includes('/temp/')) {
      imagePath = imagePath.replace('/temp/', '/uploads/');
    }
    
    // إذا كان المسار في مجلد generated، نتأكد من أنه يظهر بشكل صحيح
    if (imagePath.includes('/uploads/generated/')) {
      // المسار صحيح بالفعل، لا نحتاج لتغييره
    } else if (imagePath.includes('/generated/')) {
      // إذا وجدنا /generated/ بدون /uploads/، نضيف /uploads/
      imagePath = imagePath.replace('/generated/', '/uploads/generated/');
    }
    
    // وأيضاً التحقق من استلام مسار نسبي بدون /
    if (!imagePath.startsWith('/')) {
      imagePath = '/' + imagePath;
    }
    
    // إضافة origin للحصول على مسار كامل
    return window.location.origin + imagePath;
  };
  
  // تحضير الصورة
  const fixedTemplatePath = fixImagePath(templateImage);
  
  // معالجة توليد الصورة
  const handleImageGenerated = (imageURL: string) => {
    setIsLoading(false);
    if (onImageGenerated) {
      onImageGenerated(imageURL);
    }
  };
  
  // معالجة الأخطاء
  const handleError = (error: Error) => {
    setIsLoading(false);
    console.error('Error generating image:', error);
    if (onError) {
      onError(error);
    } else {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء توليد الصورة',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className={`konva-image-generator ${className}`}>
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>جاري توليد الصورة...</span>
        </div>
      ) : (
        <OptimizedImageGenerator
          templateImage={fixedTemplatePath}
          fields={fields}
          formData={formData}
          width={width}
          height={height}
          onImageGenerated={handleImageGenerated}
          onError={handleError}
          className={className}
          quality={quality}
        />
      )}
    </div>
  );
};

// تصدير المكون كافتراضي ونمطي للتوافق مع الكود القديم
export default KonvaImageGenerator;
export { KonvaImageGenerator };