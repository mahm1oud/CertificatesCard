/**
 * مكون معاينة محسّن للصور الاجتماعية مع دعم طبقات متعددة
 * الإصدار 4.0 - أبريل 2025
 * 
 * ميزات هذا المكون المحسّن:
 * 1. يضمن تطابق 100% بين المعاينة والصورة النهائية
 * 2. دعم تنسيقات مواقع التواصل الاجتماعي المختلفة
 * 3. دعم لخصائص طبقات zIndex
 * 4. دعم إخفاء وإظهار الحقول
 */

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image, Text } from 'react-konva';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * مهم جداً: هذه القيمة يجب أن تكون متطابقة مع
 * 1. BASE_IMAGE_WIDTH في DraggableFieldsPreviewPro.tsx
 * 2. clientBaseWidth في server/optimized-image-generator.ts
 * لضمان التطابق 100% بين المعاينة والصورة النهائية
 */
const BASE_IMAGE_WIDTH = 1000;

interface FieldConfig {
  id?: number;
  name: string;
  label?: string;
  defaultValue?: string;
  position: { x: number; y: number };
  zIndex?: number;
  rotation?: number;
  visible?: boolean;
  type?: 'text' | 'image' | string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    align?: string;
    verticalPosition?: string;
    maxWidth?: number;
    textShadow?: {
      enabled?: boolean;
      color?: string;
      blur?: number;
    };
    imageMaxWidth?: number;
    imageMaxHeight?: number;
    imageBorder?: boolean;
    imageRounded?: boolean;
    layer?: number;
  };
}

interface SocialFormat {
  width: number;
  height: number;
  ratio: string;
  description: string;
}

interface SocialOptimizedImageGeneratorProps {
  templateImage: string;
  fields?: FieldConfig[];
  formData?: Record<string, any>;
  format?: string; // 'instagram', 'facebook', etc.
  onImageGenerated?: (imageURL: string) => void;
  className?: string;
  quality?: 'preview' | 'medium' | 'high';
}

export const SocialOptimizedImageGenerator: React.FC<SocialOptimizedImageGeneratorProps> = ({
  templateImage,
  fields = [],
  formData = {},
  format = 'instagram',
  onImageGenerated,
  className = '',
  quality = 'preview',
}) => {
  const stageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 800 });
  
  // جلب تنسيقات الشبكات الاجتماعية
  const { data: formatData } = useQuery({
    queryKey: ['/api/social-formats'],
    queryFn: () => apiRequest('GET', '/api/social-formats'),
  });
  
  // اختيار التنسيق المناسب
  const socialFormats = formatData?.formats || {
    instagram: { width: 1080, height: 1080, ratio: '1:1', description: 'Instagram (Square)' },
    facebook: { width: 1200, height: 630, ratio: '1.91:1', description: 'Facebook' },
    twitter: { width: 1200, height: 675, ratio: '16:9', description: 'Twitter' },
    linkedin: { width: 1200, height: 627, ratio: '1.91:1', description: 'LinkedIn' },
    whatsapp: { width: 800, height: 800, ratio: '1:1', description: 'WhatsApp' }
  };
  
  const selectedFormat = socialFormats[format] as SocialFormat;
  
  // تحميل صورة القالب
  useEffect(() => {
    if (!templateImage || !selectedFormat) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = templateImage;
    
    img.onload = () => {
      setImage(img);
      
      // حساب نسبة الأبعاد المطلوبة للتنسيق الاجتماعي
      const formatRatio = selectedFormat.width / selectedFormat.height;
      
      // حساب الحجم المناسب للعرض مع الحفاظ على نسبة الأبعاد المطلوبة
      let displayWidth = Math.min(800, window.innerWidth - 40);
      let displayHeight = displayWidth / formatRatio;
      
      console.log(`Format: ${format}, Ratio: ${formatRatio}`);
      console.log(`Display size: ${displayWidth}x${displayHeight}`);
      
      setStageSize({
        width: displayWidth,
        height: displayHeight
      });
    };
    
    img.onerror = (error) => {
      console.error('Failed to load template image:', error);
    };
  }, [templateImage, format, selectedFormat]);

  // استخراج قيمة الحقل من بيانات النموذج
  const getFieldValue = (field: FieldConfig): string => {
    return (formData[field.name] ?? field.defaultValue ?? field.label ?? '').toString();
  };

  // معالجة خصائص النص لاستخدامها في Konva
  const getTextProps = (field: FieldConfig) => {
    if (field.visible === false) return null;
    
    const style = field.style || {};
    
    // اختيار نوع الخط من خصائص الحقل أو استخدام القيمة الافتراضية
    const fontFamily = style.fontFamily || 'Cairo';
    
    // حساب حجم الخط بنفس الطريقة المستخدمة في السيرفر - مع مراعاة معامل القياس
    const scaleFactor = stageSize.width / selectedFormat.width;
    
    // استخدام حجم الخط المحدد في خصائص الحقل، مع الحد الأدنى والأقصى لضمان القراءة على جميع الأجهزة
    let baseFontSize = style.fontSize || 24;
    
    // ضمان أن حجم الخط لا يقل عن 14 ولا يزيد عن 60 بكسل لضمان القراءة على جميع الأجهزة
    if (baseFontSize < 14) baseFontSize = 14;
    if (baseFontSize > 60) baseFontSize = 60;
    
    // تطبيق معامل القياس لتناسب حجم العرض
    const fontSize = Math.round(baseFontSize * scaleFactor);
    
    // استخدام وزن الخط المحدد في خصائص الحقل
    const fontWeight = style.fontWeight || 'normal';
    const fontStyle = fontWeight === 'bold' ? 'bold' : 'normal';
    
    // حساب موضع النص كنسبة مئوية (كما في السيرفر)
    const x = (field.position.x / 100) * stageSize.width;
    const y = (field.position.y / 100) * stageSize.height;
    
    // المحاذاة الأفقية حسب خصائص الحقل
    const align = style.align || 'center';
    
    // حساب الإزاحة حسب المحاذاة للتوسيط الصحيح
    let offsetX = 0;
    if (align === 'center') {
      offsetX = 0; // الإزاحة تتم تلقائياً في Konva
    }
    
    // العرض الأقصى للنص - مع مراعاة معامل القياس
    const width = style.maxWidth 
      ? Math.round((style.maxWidth || 200) * scaleFactor)
      : Math.round(stageSize.width - (50 * scaleFactor));
    
    // ظل النص من خصائص الحقل
    const shadowEnabled = style.textShadow?.enabled || false;
    const shadowColor = shadowEnabled ? (style.textShadow?.color || 'black') : 'transparent';
    const shadowBlur = shadowEnabled ? (style.textShadow?.blur || 3) * scaleFactor : 0;
    
    // لون النص من خصائص الحقل
    const textColor = style.color || '#000000';
    
    const rotation = field.rotation || 0;
    
    return {
      text: getFieldValue(field),
      x,
      y,
      fontSize,
      fontFamily,
      fontStyle,
      fill: textColor,
      align,
      width,
      offsetX,
      shadowColor,
      shadowBlur,
      shadowOffset: { x: 0, y: 0 },
      perfectDrawEnabled: true,
      rotation: rotation
    };
  };

  // توليد صورة للمعاينة
  const generatePreviewImage = () => {
    if (!stageRef.current) return;
    
    // إنشاء صورة بجودة مناسبة للمعاينة حسب المتطلبات
    let pixelRatio: number;
    
    // تعديل نسبة البكسل حسب الجودة المطلوبة
    if (quality === 'high') {
      pixelRatio = 2; // جودة عالية (2x)
    } else if (quality === 'medium') {
      pixelRatio = 1.5; // جودة متوسطة (1.5x)
    } else {
      pixelRatio = 1; // جودة منخفضة للمعاينة (1x)
    }
    
    // التأكد من وجود عوامل قياس متناسقة لضمان الدقة
    console.log(`Generating social preview image for ${format} with pixelRatio: ${pixelRatio}`);
    
    // توليد الصورة
    const dataUrl = stageRef.current.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
      quality: 1.0
    });
    
    // سجل حجم الصورة المولدة للتحقق من أنها ضمن النطاق المطلوب
    console.log(`Generated image data URL length: ${dataUrl.length}`);
    
    if (onImageGenerated) {
      onImageGenerated(dataUrl);
    }
  };

  // تنفيذ توليد الصورة عند تحميل جميع العناصر
  useEffect(() => {
    if (image && stageRef.current && selectedFormat) {
      // انتظر قليلاً للتأكد من رسم جميع العناصر
      const timer = setTimeout(() => {
        console.log("Generating social image after elements loaded");
        generatePreviewImage();
      }, 200); // زيادة فترة الانتظار لضمان رسم جميع العناصر بشكل صحيح
      
      return () => clearTimeout(timer);
    }
  }, [image, fields, formData, stageSize, quality, format, selectedFormat]);

  // ترتيب الحقول حسب zIndex
  const sortedFields = [...fields].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                                  .filter(field => field.visible !== false);

  return (
    <div className={`relative ${className}`}>
      <h2 className="text-center text-sm font-medium mb-2">
        {selectedFormat?.description || format} ({selectedFormat?.width || 0}×{selectedFormat?.height || 0})
      </h2>
      <Stage 
        ref={stageRef} 
        width={stageSize.width} 
        height={stageSize.height}
        style={{ margin: '0 auto', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}
      >
        <Layer>
          {/* رسم صورة القالب */}
          {image && (
            <Image 
              image={image} 
              width={stageSize.width} 
              height={stageSize.height} 
              perfectDrawEnabled={true}
            />
          )}
          
          {/* رسم الحقول - ترتيب حسب zIndex */}
          {sortedFields.map((field, index) => (
            <Text 
              key={`${field.name}-${index}`} 
              {...getTextProps(field)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default SocialOptimizedImageGenerator;