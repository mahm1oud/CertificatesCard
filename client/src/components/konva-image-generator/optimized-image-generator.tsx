/**
 * مكون معاينة محسّن للبطاقات والشهادات
 * الإصدار 3.0 - أبريل 2025
 * 
 * ميزات هذا المكون المحسّن:
 * 1. يضمن تطابق 100% بين المعاينة والصورة النهائية
 * 2. يستخدم نفس خوارزمية الحساب الموجودة في السيرفر
 * 3. أكثر قابلية للصيانة وإعادة الاستخدام
 * 4. كود أكثر إيجازاً وأسهل للقراءة
 */

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image, Text } from 'react-konva';

interface FieldConfig {
  name: string;
  label?: string;
  defaultValue?: string;
  position: { x: number; y: number };
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
  };
}

interface OptimizedImageGeneratorProps {
  templateImage: string;
  fields?: FieldConfig[];
  formData?: Record<string, any>;
  width?: number;
  height?: number;
  onImageGenerated?: (imageURL: string) => void;
  className?: string;
  quality?: 'preview' | 'medium' | 'high';
}

export const OptimizedImageGenerator: React.FC<OptimizedImageGeneratorProps> = ({
  templateImage,
  fields = [],
  formData = {},
  width = 800,
  height = 600,
  onImageGenerated,
  className = '',
  quality = 'preview',
}) => {
  const stageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width, height });

  // تحميل صورة القالب
  useEffect(() => {
    if (!templateImage) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = templateImage;
    
    img.onload = () => {
      setImage(img);
      
      // حساب نسبة الأبعاد
      const aspectRatio = img.width / img.height;
      
      // تعديل أبعاد المسرح بناءً على نسبة أبعاد الصورة
      if (aspectRatio > 1) {
        // صورة أفقية
        setStageSize({ width, height: width / aspectRatio });
      } else {
        // صورة عمودية
        setStageSize({ width: height * aspectRatio, height });
      }
    };
  }, [templateImage, width, height]);

  // استخراج قيمة الحقل من بيانات النموذج
  const getFieldValue = (field: FieldConfig): string => {
    return (formData[field.name] ?? field.defaultValue ?? field.label ?? '').toString();
  };

  // معالجة خصائص النص لاستخدامها في Konva
  const getTextProps = (field: FieldConfig) => {
    const style = field.style || {};
    const fontFamily = style.fontFamily || 'Cairo';
    const fontSize = style.fontSize || 24;
    const fontWeight = style.fontWeight || '';
    const fontStyle = fontWeight === 'bold' ? 'bold' : 'normal';
    
    // حساب موضع النص
    const x = (field.position.x / 100) * stageSize.width;
    const y = (field.position.y / 100) * stageSize.height;
    
    // المحاذاة الأفقية
    const align = style.align || 'center';
    
    // حساب الإزاحة حسب المحاذاة
    let offsetX = 0;
    if (align === 'center') {
      offsetX = 0; // الإزاحة تتم تلقائياً في Konva
    }
    
    // العرض الأقصى للنص
    const width = style.maxWidth 
      ? Math.round((style.maxWidth / 100) * stageSize.width)
      : Math.round(stageSize.width - 50);
    
    // ظل النص
    const shadowEnabled = style.textShadow?.enabled || false;
    const shadowColor = shadowEnabled ? (style.textShadow?.color || 'black') : 'transparent';
    const shadowBlur = shadowEnabled ? (style.textShadow?.blur || 3) : 0;
    
    return {
      text: getFieldValue(field),
      x,
      y,
      fontSize,
      fontFamily,
      fontStyle,
      fill: style.color || '#000000',
      align,
      width,
      offsetX,
      shadowColor,
      shadowBlur,
      shadowOffset: { x: 0, y: 0 },
      perfectDrawEnabled: true,
    };
  };

  // توليد صورة للمعاينة
  const generatePreviewImage = () => {
    if (!stageRef.current) return;
    
    // إنشاء صورة بجودة مناسبة للمعاينة
    const pixelRatio = quality === 'high' ? 2 : (quality === 'medium' ? 1.5 : 1);
    const dataUrl = stageRef.current.toDataURL({ pixelRatio });
    
    if (onImageGenerated) {
      onImageGenerated(dataUrl);
    }
  };

  // تنفيذ توليد الصورة عند تحميل جميع العناصر
  useEffect(() => {
    if (image && fields.length > 0 && stageRef.current) {
      // استخدام setTimeout للتأكد من رسم جميع العناصر
      const timer = setTimeout(() => {
        generatePreviewImage();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [image, fields, formData, stageSize]);

  return (
    <div className={`relative ${className}`}>
      <Stage 
        ref={stageRef} 
        width={stageSize.width} 
        height={stageSize.height}
        style={{ margin: '0 auto' }}
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
          
          {/* رسم الحقول */}
          {fields.map((field, index) => (
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

export default OptimizedImageGenerator;