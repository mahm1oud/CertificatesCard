import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image, Text, Rect } from 'react-konva';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';

// Augment the Window interface to include the HTMLImageElement constructor
declare global {
  interface Window {
    Image: {
      new(): HTMLImageElement;
    }
  }
}

interface KonvaImageGeneratorProps {
  templateImage: string;
  fields?: any[];
  formData?: Record<string, any>;
  width?: number;
  height?: number;
  onImageGenerated?: (imageURL: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const KonvaImageGenerator: React.FC<KonvaImageGeneratorProps> = ({
  templateImage,
  fields = [],
  formData = {},
  width = 800,
  height = 600,
  onImageGenerated,
  onError,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [fieldImages, setFieldImages] = useState<Record<string, HTMLImageElement>>({});
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // تحويل مسار الصورة إلى مسار صحيح
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

  // تحميل صور الحقول من نوع image
  useEffect(() => {
    const imageFields = fields.filter(field => field.type === 'image');
    if (imageFields.length === 0) return;
    
    setLoadingImages(true);
    console.log("Loading field images for:", imageFields.map(f => f.name));
    
    const images: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;
    
    imageFields.forEach(field => {
      const fieldName = field.name;
      if (!fieldName || !formData[fieldName]) {
        loadedCount++;
        if (loadedCount === imageFields.length) {
          setFieldImages(images);
          setLoadingImages(false);
        }
        return;
      }
      
      // تصحيح مسار الصورة
      let imageUrl = fixImagePath(formData[fieldName]);
      
      console.log(`Loading image for field "${fieldName}" from:`, imageUrl);
      
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log(`Image for field "${fieldName}" loaded successfully`);
        images[fieldName] = img;
        loadedCount++;
        
        if (loadedCount === imageFields.length) {
          setFieldImages(images);
          setLoadingImages(false);
        }
      };
      
      img.onerror = (e) => {
        console.error(`Error loading image for field "${fieldName}":`, e);
        loadedCount++;
        
        if (loadedCount === imageFields.length) {
          setFieldImages(images);
          setLoadingImages(false);
        }
      };
      
      const cacheBuster = `?t=${Date.now()}`;
      img.src = imageUrl + cacheBuster;
    });
    
    // إذا كانت المصفوفة فارغة، نعتبر التحميل منتهي
    if (imageFields.length === 0) {
      setLoadingImages(false);
    }
  }, [fields, formData]);

  // Load template image
  useEffect(() => {
    if (!templateImage) {
      console.log("No template image provided, using white background");
      setLoading(false);
      
      // إنشاء صورة فارغة بيضاء بدلاً من إظهار خطأ
      const canvas = document.createElement('canvas');
      canvas.width = width || 800;
      canvas.height = height || 1200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const blankImg = document.createElement('img');
      blankImg.onload = () => {
        setBackgroundImage(blankImg);
        setError(null);
      };
      blankImg.src = canvas.toDataURL();
      
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log("Loading template image from URL:", templateImage);

    // تطبيق معالجة خاصة للروابط النسبية
    let imageUrl = templateImage;
    try {
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        // إذا كان رابط نسبي، تأكد من أنه يبدأ بـ /
        if (!imageUrl.startsWith('/')) {
          imageUrl = '/' + imageUrl;
        }
        
        // إذا كان الرابط نسبيًا، أضف العنوان الكامل للموقع
        imageUrl = window.location.origin + imageUrl;
      }
      
      console.log("Normalized image URL:", imageUrl);
    } catch (urlError) {
      console.error("Error processing image URL:", urlError);
      // استخدام صورة فارغة
      useEmptyCanvas();
      return;
    }
    
    // استخدام document.createElement بدلاً من new Image()
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    
    // تعيين معلمات كاش HTTP
    img.setAttribute('cache-control', 'no-cache');
    img.setAttribute('pragma', 'no-cache');
    
    img.onload = () => {
      console.log("Template image loaded successfully");
      setBackgroundImage(img);
      setLoading(false);
      
      // توليد الصورة تلقائيًا إذا لم تكن هناك حقول مطلوبة
      if (fields.length === 0 && onImageGenerated) {
        setTimeout(() => {
          generateImage();
        }, 500);
      }
    };
    
    img.onerror = (e) => {
      console.error("Error loading template image:", e);
      // استخدام صورة فارغة بدلاً من إظهار خطأ
      useEmptyCanvas();
    };
    
    // إضافة بارامتر عشوائي لتجنب التخزين المؤقت
    const cacheBuster = `?t=${Date.now()}`;
    img.src = imageUrl + cacheBuster;
    
    // دالة مساعدة لإنشاء كانفاس فارغ
    function useEmptyCanvas() {
      const canvas = document.createElement('canvas');
      canvas.width = width || 800;
      canvas.height = height || 1200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const blankImg = document.createElement('img');
      blankImg.onload = () => {
        setBackgroundImage(blankImg);
        setLoading(false);
      };
      blankImg.src = canvas.toDataURL();
    }
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [templateImage, onError, toast, fields, width, height]);

  // Calculate image dimensions while maintaining aspect ratio
  const calculateDimensions = () => {
    if (!backgroundImage) return { width, height };
    
    const aspectRatio = backgroundImage.width / backgroundImage.height;
    
    if (aspectRatio > 1) {
      // Landscape
      return {
        width,
        height: width / aspectRatio,
      };
    } else {
      // Portrait
      return {
        width: height * aspectRatio,
        height,
      };
    }
  };

  // Generate image as PNG
  const generateImage = () => {
    if (!stageRef.current || !containerRef.current) {
      console.error("Cannot generate image: stageRef or containerRef is null");
      return;
    }

    try {
      console.log("Generating image from stage with fields:", fields.length);
      
      // إضافة تأخير بسيط للتأكد من اكتمال التحميل
      setTimeout(() => {
        try {
          // محاولة استخدام Konva's toDataURL أولاً
          const konvaDataUrl = stageRef.current?.toDataURL({
            pixelRatio: 2, // جودة أعلى
            mimeType: 'image/png'
          });
          
          if (konvaDataUrl && onImageGenerated) {
            console.log("Image generated successfully with Konva");
            onImageGenerated(konvaDataUrl);
          } else {
            throw new Error("Failed to generate image with Konva");
          }
        } catch (konvaError) {
          console.error("Error generating image with Konva:", konvaError);
          
          // الخطة البديلة باستخدام html-to-image
          try {
            if (!containerRef.current) {
              throw new Error("Container reference is null");
            }
            
            toPng(containerRef.current, { 
              quality: 0.95,
              pixelRatio: 2,
              cacheBust: true,
              canvasWidth: width || 800,
              canvasHeight: height || 1200
            })
            .then(dataUrl => {
              console.log("Image generated successfully with html-to-image");
              if (onImageGenerated) {
                onImageGenerated(dataUrl);
              }
            })
            .catch(htmlToImageError => {
              console.error("Error generating image with html-to-image:", htmlToImageError);
              
              // محاولة أخيرة باستخدام canvas مباشرة
              try {
                const canvas = document.createElement('canvas');
                canvas.width = width || 800;
                canvas.height = height || 1200;
                const ctx = canvas.getContext('2d');
                
                if (ctx && backgroundImage) {
                  // رسم الصورة الخلفية
                  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                  
                  // إعداد نمط النص
                  ctx.font = '20px Cairo';
                  ctx.fillStyle = '#000000';
                  ctx.textAlign = 'center';
                  
                  // رسم النصوص البسيطة للحقول
                  fields.forEach((field, index) => {
                    // إذا كان نوع الحقل صورة، نرسم الصورة بدلاً من النص
                    if (field.type === 'image') {
                      const fieldName = field.name;
                      const fieldImage = fieldImages[fieldName];
                      if (fieldImage) {
                        const position = {
                          x: (field.position?.x / 100) * canvas.width || 100,
                          y: (field.position?.y / 100) * canvas.height || 100 + (index * 50)
                        };
                        const style = field.style || {};
                        // استخدام أبعاد نسبية للصورة بناءً على حجم القالب
                        const maxWidth = style.imageMaxWidth || canvas.width / 4; // ربع عرض القالب
                        const maxHeight = style.imageMaxHeight || canvas.height / 4; // ربع ارتفاع القالب
                        
                        // رسم الصورة مع الحفاظ على النسبة الأصلية
                        const aspectRatio = fieldImage.width / fieldImage.height;
                        let drawWidth, drawHeight;
                        
                        // الحفاظ على نسبة العرض إلى الارتفاع مع تطبيق الحد الأقصى للأبعاد
                        if (aspectRatio > 1) {
                          // الصورة عريضة (landscape)
                          drawWidth = Math.min(maxWidth, fieldImage.width);
                          drawHeight = drawWidth / aspectRatio;
                          
                          // تأكد من أن الارتفاع ليس أكبر من الحد الأقصى
                          if (drawHeight > maxHeight) {
                            drawHeight = maxHeight;
                            drawWidth = drawHeight * aspectRatio;
                          }
                        } else {
                          // الصورة طويلة (portrait)
                          drawHeight = Math.min(maxHeight, fieldImage.height);
                          drawWidth = drawHeight * aspectRatio;
                          
                          // تأكد من أن العرض ليس أكبر من الحد الأقصى
                          if (drawWidth > maxWidth) {
                            drawWidth = maxWidth;
                            drawHeight = drawWidth / aspectRatio;
                          }
                        }
                        
                        // رسم الصورة في الموقع المحدد
                        ctx.drawImage(
                          fieldImage,
                          position.x - (drawWidth / 2),
                          position.y - (drawHeight / 2),
                          drawWidth,
                          drawHeight
                        );
                      }
                    } else {
                      // رسم النص إذا كان الحقل نصياً
                      const value = getFieldValue(field);
                      const position = {
                        x: (field.position?.x / 100) * canvas.width || 100,
                        y: (field.position?.y / 100) * canvas.height || 100 + (index * 30)
                      };
                      
                      ctx.fillText(value, position.x, position.y);
                    }
                  });
                  
                  // استخراج الصورة النهائية
                  const fallbackDataUrl = canvas.toDataURL('image/png');
                  console.log("Image generated with canvas fallback");
                  if (onImageGenerated) {
                    onImageGenerated(fallbackDataUrl);
                  }
                } else {
                  throw new Error("Could not get canvas context or image");
                }
              } catch (canvasError) {
                console.error("All image generation methods failed:", canvasError);
                if (onError) onError(new Error('فشل في توليد الصورة بعد عدة محاولات'));
              }
            });
          } catch (fallbackError) {
            console.error("Error with fallback image generation:", fallbackError);
            if (onError) onError(new Error('فشل في توليد الصورة'));
            toast({
              title: 'خطأ في توليد الصورة',
              description: 'حدث خطأ أثناء إنشاء الصورة. يرجى المحاولة مرة أخرى.',
              variant: 'destructive',
            });
          }
        }
      }, 300); // تأخير صغير للتأكد من أن المكونات مستقرة
    } catch (error) {
      console.error("Unexpected error during image generation:", error);
      if (onError) onError(new Error('حدث خطأ غير متوقع أثناء توليد الصورة'));
    }
  };

  // Get text styles for field
  const getTextStyles = (field: any) => {
    const style = field.style || {};
    const textAlign = style.align || 'center';
    
    // تحديد الاتجاه بناءً على محاذاة النص
    const textDirection = 'rtl';
    
    // تحديد عرض النص للتفاف
    const textWidth = style.width || 300;
    
    // التعامل مع ظل النص إذا كان مفعلاً
    const textShadow = style.textShadow?.enabled
      ? {
          shadowColor: style.textShadow?.color || 'rgba(0,0,0,0.5)',
          shadowBlur: style.textShadow?.blur || 3,
          shadowOffset: { x: 1, y: 1 },
          shadowOpacity: 0.5,
        }
      : {};
    
    // تحديد نمط الخط (عادي، سميك، مائل)
    let fontStyle = 'normal';
    if (style.fontWeight === 'bold') {
      fontStyle = 'bold';
    } else if (style.fontStyle === 'italic') {
      fontStyle = 'italic';
    } else if (style.fontWeight === 'bold' && style.fontStyle === 'italic') {
      fontStyle = 'bold italic';
    }
    
    return {
      fontFamily: style.fontFamily || 'Cairo',
      fontSize: style.fontSize || 20,
      fill: style.color || '#000000',
      align: textAlign,
      verticalAlign: style.verticalPosition || 'middle',
      fontStyle,
      width: textWidth,
      padding: 5,
      direction: textDirection,
      ...textShadow
    };
  };

  // Calculate position for field
  const getPosition = (field: any, dimensions: { width: number, height: number }) => {
    const position = field.position || { x: 50, y: 50 };
    const style = field.style || {};
    const align = style.align || 'center';
    
    // Convert percentage to actual position
    let x = (position.x / 100) * dimensions.width;
    let y = (position.y / 100) * dimensions.height;
    
    // تعديل الموقع بناءً على محاذاة النص
    // انطباق محاذاة النص على موقع النص من الصورة
    if (align === 'center') {
      // النص محاذى للمركز، لا تغيير في الموقع
    } else if (align === 'right') {
      // تعديل موقع النص للمحاذاة اليمنى
      x = x + ((style.width || 300) / 2);
    } else if (align === 'left') {
      // تعديل موقع النص للمحاذاة اليسرى
      x = x - ((style.width || 300) / 2);
    }
    
    return { x, y };
  };

  // التعامل مع أنماط التنسيق المخصصة
  const applyFormatting = (value: string, field: any) => {
    if (!value) return '';
    
    // تنسيق الاسم لشهادات التقدير والتخرج
    if (field.formatting === 'certificate-name' || (field.name && (field.name === 'recipient' || field.name === 'studentName' || field.name === 'recipientName'))) {
      // تأكيد من أن النص بدأ بحرف كبير في كل كلمة
      return value.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // تنسيق التاريخ العربي
    if (field.formatting === 'arabic-date' || (field.name && (field.name === 'issuedDate' || field.name === 'certificateDate'))) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const options = { 
            year: 'numeric' as const, 
            month: 'long' as const, 
            day: 'numeric' as const 
          };
          return date.toLocaleDateString('ar-SA', options);
        }
      } catch (e) {
        console.error("Error formatting date:", e);
      }
    }
    
    return value;
  };

  // Get value from form data for a field
  const getFieldValue = (field: any) => {
    const fieldName = field.name;
    
    let value = '';
    
    if (!formData || !fieldName || !(fieldName in formData)) {
      value = field.defaultValue || field.label || '';
    } else {
      value = formData[fieldName] || field.defaultValue || '';
    }
    
    // تطبيق التنسيق على القيمة
    return applyFormatting(value, field);
  };

  const dimensions = calculateDimensions();

  return (
    <div
      ref={containerRef}
      className={`konva-image-generator relative ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/60 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/60 z-10">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <p className="text-gray-600 text-sm mb-3">
              يمكن متابعة التصميم على خلفية بيضاء، أو إعادة تحميل الصفحة للمحاولة مرة أخرى.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                onClick={() => {
                  // إنشاء صورة فارغة بيضاء كبديل
                  const canvas = document.createElement('canvas');
                  canvas.width = width || 800;
                  canvas.height = height || 1200;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                  }
                  const blankImg = document.createElement('img');
                  blankImg.src = canvas.toDataURL();
                  blankImg.onload = () => {
                    setBackgroundImage(blankImg);
                    setError(null);
                    setLoading(false);
                  };
                }}
              >
                متابعة بخلفية بيضاء
              </button>
              <button
                className="px-3 py-1.5 border border-blue-500 text-blue-500 rounded text-sm hover:bg-blue-50"
                onClick={() => window.location.reload()}
              >
                إعادة تحميل
              </button>
            </div>
          </div>
        </div>
      )}

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: (loading || error) ? 'none' : 'block' }}
      >
        <Layer>
          {/* Template Background Image */}
          {backgroundImage && (
            <Image
              image={backgroundImage}
              width={dimensions.width}
              height={dimensions.height}
              x={0}
              y={0}
            />
          )}

          {/* Field Values */}
          {!loading && !error && backgroundImage && fields.map((field, index) => {
            const position = getPosition(field, dimensions);
            const textStyles = getTextStyles(field);
            const value = getFieldValue(field);
            const style = field.style || {};
            
            // تحديد نوع الحقل وتصويره بشكل مناسب
            if (field.type === 'text' || field.type === 'email' || field.type === 'number' || !field.type) {
              // عناصر النص العادية
              return (
                <Text
                  key={`field-${index}-${field.id || index}`}
                  text={value}
                  x={position.x}
                  y={position.y}
                  offsetX={textStyles.align === 'center' ? (textStyles.width / 2) : 0}
                  offsetY={textStyles.verticalAlign === 'middle' ? (textStyles.fontSize / 2) : 0}
                  {...textStyles}
                />
              );
            } else if (field.type === 'textarea') {
              // النصوص الطويلة متعددة الأسطر
              return (
                <Text
                  key={`field-${index}-${field.id || index}`}
                  text={value}
                  x={position.x}
                  y={position.y}
                  offsetX={textStyles.align === 'center' ? (textStyles.width / 2) : 0}
                  offsetY={textStyles.verticalAlign === 'middle' ? (textStyles.fontSize / 2) : 0}
                  {...textStyles}
                  width={style.width || 300}
                  height={style.height || 200}
                  wrap="word"
                  ellipsis={style.ellipsis === true}
                />
              );
            } else if (field.type === 'date') {
              // تنسيق التاريخ
              let formattedDate = value;
              try {
                if (value && typeof value === 'string') {
                  const date = new Date(value);
                  formattedDate = date.toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                }
              } catch (e) {
                console.error("Error formatting date:", e);
              }
              
              return (
                <Text
                  key={`field-${index}-${field.id || index}`}
                  text={formattedDate}
                  x={position.x}
                  y={position.y}
                  offsetX={textStyles.align === 'center' ? (textStyles.width / 2) : 0}
                  offsetY={textStyles.verticalAlign === 'middle' ? (textStyles.fontSize / 2) : 0}
                  {...textStyles}
                />
              );
            } else if (field.type === 'image') {
              // معالجة حقول الصور
              const fieldName = field.name;
              const fieldImage = fieldImages[fieldName];

              if (fieldImage) {
                // حجم الصورة - استخدام أبعاد نسبية للصورة بناءً على حجم القالب
                const style = field.style || {};
                const maxWidth = style.imageMaxWidth || dimensions.width / 4; // ربع عرض القالب
                const maxHeight = style.imageMaxHeight || dimensions.height / 4; // ربع ارتفاع القالب
                
                // حساب الأبعاد مع الحفاظ على نسبة العرض إلى الارتفاع
                const aspectRatio = fieldImage.width / fieldImage.height;
                let imgWidth, imgHeight;
                
                // الحفاظ على نسبة العرض إلى الارتفاع مع تطبيق الحد الأقصى للأبعاد
                if (aspectRatio > 1) {
                  // صورة أفقية (landscape)
                  imgWidth = Math.min(maxWidth, fieldImage.width);
                  imgHeight = imgWidth / aspectRatio;
                  
                  // تأكد من أن الارتفاع ليس أكبر من الحد الأقصى
                  if (imgHeight > maxHeight) {
                    imgHeight = maxHeight;
                    imgWidth = imgHeight * aspectRatio;
                  }
                } else {
                  // صورة رأسية (portrait)
                  imgHeight = Math.min(maxHeight, fieldImage.height);
                  imgWidth = imgHeight * aspectRatio;
                  
                  // تأكد من أن العرض ليس أكبر من الحد الأقصى
                  if (imgWidth > maxWidth) {
                    imgWidth = maxWidth;
                    imgHeight = imgWidth / aspectRatio;
                  }
                }
                
                // الحدود المستديرة إذا كان مطلوباً
                let clipFunc = undefined;
                if (style.imageRounded) {
                  clipFunc = (ctx: any) => {
                    ctx.beginPath();
                    ctx.arc(imgWidth / 2, imgHeight / 2, Math.min(imgWidth, imgHeight) / 2, 0, Math.PI * 2, false);
                    ctx.closePath();
                  };
                }
                
                return (
                  <React.Fragment key={`field-${index}-${field.id || index}`}>
                    {/* إضافة ظل للصورة إذا كان مطلوباً */}
                    {style.imageShadow?.enabled && (
                      <Image
                        image={fieldImage}
                        x={position.x - (imgWidth / 2) + 3}
                        y={position.y - (imgHeight / 2) + 3}
                        width={imgWidth}
                        height={imgHeight}
                        shadowColor={style.imageShadow?.color || 'rgba(0,0,0,0.5)'}
                        shadowBlur={style.imageShadow?.blur || 5}
                        shadowOffset={{ x: 2, y: 2 }}
                        shadowOpacity={0.5}
                        opacity={0.5}
                        listening={false}
                        clipFunc={clipFunc}
                      />
                    )}
                    
                    {/* صورة المستخدم */}
                    <Image
                      image={fieldImage}
                      x={position.x - (imgWidth / 2)}
                      y={position.y - (imgHeight / 2)}
                      width={imgWidth}
                      height={imgHeight}
                      clipFunc={clipFunc}
                      stroke={style.imageBorder ? (style.imageBorderColor || '#000000') : undefined}
                      strokeWidth={style.imageBorder ? (style.imageBorderWidth || 2) : 0}
                    />
                  </React.Fragment>
                );
              } else {
                return null;
              }
            } else {
              // أي نوع آخر من الحقول يتم التعامل معه كنص عادي
              return (
                <Text
                  key={`field-${index}-${field.id || index}`}
                  text={value}
                  x={position.x}
                  y={position.y}
                  offsetX={textStyles.align === 'center' ? (textStyles.width / 2) : 0}
                  offsetY={textStyles.verticalAlign === 'middle' ? (textStyles.fontSize / 2) : 0}
                  {...textStyles}
                />
              );
            }
          })}
        </Layer>
      </Stage>

      {/* Manual generation button - useful for debugging */}
      {/* 
      <button
        className="absolute bottom-2 right-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
        onClick={generateImage}
      >
        توليد الصورة
      </button>
      */}
    </div>
  );
};

// التصدير الافتراضي للمكون
export default KonvaImageGenerator;