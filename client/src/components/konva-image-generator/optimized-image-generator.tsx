/**
 * مكون معاينة محسّن للبطاقات والشهادات
 * الإصدار 3.1 - مايو 2025
 * 
 * ميزات هذا المكون المحسّن:
 * 1. يضمن تطابق 100% بين المعاينة والصورة النهائية
 * 2. يستخدم نفس خوارزمية الحساب الموجودة في السيرفر
 * 3. أكثر قابلية للصيانة وإعادة الاستخدام
 * 4. كود أكثر إيجازاً وأسهل للقراءة
 * 
 * تحديثات الإصدار 3.1:
 * - توحيد معامل القياس بين السيرفر والواجهة (BASE_IMAGE_WIDTH = 1000)
 * - إضافة معالجة إزاحة الظلال (shadowOffset) لمطابقة السيرفر
 * - تحسين لون وقيم الظلال للتطابق مع طريقة الرسم في السيرفر
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Image, Text } from 'react-konva';

/**
 * مهم جداً: هذه القيمة يجب أن تكون متطابقة مع
 * 1. BASE_IMAGE_WIDTH في DraggableFieldsPreviewPro.tsx
 * 2. BASE_IMAGE_WIDTH في server/optimized-image-generator.ts
 * لضمان التطابق 100% بين المعاينة والصورة النهائية
 */
const BASE_IMAGE_WIDTH = 1000;

interface FieldConfig {
  name: string;
  label?: string;
  defaultValue?: string;
  position: { x: number; y: number };
  rotation?: number; // إضافة دعم الدوران
  visible?: boolean; // إضافة دعم الرؤية
  zIndex?: number;   // إضافة دعم ترتيب الطبقات
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
  
  // استخدام الحقول المخصصة من formData._designFields إذا كانت متوفرة
  const effectiveFields = useMemo(() => {
    // التحقق من وجود حقول مخصصة في بيانات النموذج
    if (formData._designFields && Array.isArray(formData._designFields) && formData._designFields.length > 0) {
      console.log("استخدام حقول التصميم المخصصة:", formData._designFields.length);
      return formData._designFields;
    }
    // إذا لم تكن هناك حقول مخصصة، استخدم الحقول الأصلية
    console.log("استخدام حقول التصميم الأصلية:", fields.length);
    return fields;
  }, [fields, formData._designFields]);
  
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
      
      console.log(`Original Image: ${img.width}x${img.height}, ratio: ${aspectRatio}`);
      console.log(`BASE_IMAGE_WIDTH: ${BASE_IMAGE_WIDTH}`);
      
      // حساب الحجم المناسب للعرض
      let displayWidth, displayHeight;
      
      // الحفاظ على نسبة العرض إلى الارتفاع الأصلية لضمان عدم تشويه الصورة
      if (width && !height) {
        // إذا تم تحديد العرض فقط
        displayWidth = width;
        displayHeight = width / aspectRatio;
      } else if (height && !width) {
        // إذا تم تحديد الارتفاع فقط
        displayHeight = height;
        displayWidth = height * aspectRatio;
      } else if (width && height) {
        // إذا تم تحديد كلاهما، استخدم التناسب الأقل لضمان تناسب الصورة ضمن المساحة المحددة
        const widthRatio = width / img.width;
        const heightRatio = height / img.height;
        const ratio = Math.min(widthRatio, heightRatio);
        
        displayWidth = img.width * ratio;
        displayHeight = img.height * ratio;
      } else {
        // إذا لم يتم تحديد أي منهما، استخدم حجم مناسب استنادًا إلى BASE_IMAGE_WIDTH
        displayWidth = Math.min(BASE_IMAGE_WIDTH, window.innerWidth - 40);
        displayHeight = displayWidth / aspectRatio;
      }
      
      console.log(`Using stage size: ${displayWidth}x${displayHeight}`);
      setStageSize({ width: displayWidth, height: displayHeight });
    };
  }, [templateImage, width, height]);

  // استخراج قيمة الحقل من بيانات النموذج
  const getFieldValue = (field: FieldConfig): string => {
    return (formData[field.name] ?? field.defaultValue ?? field.label ?? '').toString();
  };

  // معالجة خصائص النص لاستخدامها في Konva
  const getTextProps = (field: FieldConfig) => {
    const style = field.style || {};
    
    // اختيار نوع الخط من خصائص الحقل أو استخدام القيمة الافتراضية
    const fontFamily = style.fontFamily || 'Cairo';
    
    // حساب حجم الخط بنفس الطريقة المستخدمة في السيرفر - مع مراعاة معامل القياس
    const scaleFactor = stageSize.width / BASE_IMAGE_WIDTH;
    
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
    const shadowColor = shadowEnabled ? (style.textShadow?.color || 'rgba(0, 0, 0, 0.5)') : 'transparent';
    const shadowBlur = shadowEnabled ? (style.textShadow?.blur || 3) * scaleFactor : 0;
    const shadowOffsetX = shadowEnabled ? 2 * scaleFactor : 0;
    const shadowOffsetY = shadowEnabled ? 2 * scaleFactor : 0;
    
    // لون النص من خصائص الحقل
    const textColor = style.color || '#000000';
    
    console.log(`Field ${field.name}: font="${fontFamily} ${fontWeight} ${fontSize}px", color=${textColor}, scaleFactor=${scaleFactor.toFixed(2)}, x=${x}, y=${y}`);
    
    // دعم الدوران (إذا كان موجوداً)
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
      // إضافة دعم الدوران
      rotation,
      shadowColor,
      shadowBlur,
      shadowOffset: { x: shadowOffsetX, y: shadowOffsetY },
      // تعيين الرؤية (إذا كانت موجودة)
      visible: field.visible !== false, // افتراضيًا مرئي ما لم يتم تعيينه على false
      perfectDrawEnabled: true,
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
    console.log(`Generating preview image with pixelRatio: ${pixelRatio}`);
    
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
    if (image && stageRef.current) {
      // انتظر قليلاً للتأكد من رسم جميع العناصر
      const timer = setTimeout(() => {
        console.log("Generating image after elements loaded");
        generatePreviewImage();
      }, 200); // زيادة فترة الانتظار لضمان رسم جميع العناصر بشكل صحيح
      
      return () => clearTimeout(timer);
    }
  }, [image, effectiveFields, formData, stageSize, quality]);

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
          
          {/* رسم الحقول بترتيب حسب zIndex */}
          {[...effectiveFields]
            // ترتيب الحقول حسب zIndex (تصاعدي) بحيث تظهر الحقول ذات zIndex العالي فوق الحقول ذات zIndex المنخفض
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            // رسم كل حقل حسب النوع وخصائصه
            .map((field, index) => (
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