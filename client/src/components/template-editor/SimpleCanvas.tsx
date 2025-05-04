import React, { useRef, useEffect, useState } from 'react';
import fabric from '@/lib/fabric-import';
import { AlertTriangle } from 'lucide-react';

interface SimpleCanvasProps {
  templateImage: string;
  onCanvasReady?: (canvas: any) => void;
  onError?: (error: Error) => void;
  className?: string;
}

/**
 * نسخة مبسطة من مكون EditorCanvas تركز على الوظائف الأساسية
 */
export function SimpleCanvas({
  templateImage,
  onCanvasReady,
  onError,
  className = ''
}: SimpleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // تهيئة الكانفاس
  useEffect(() => {
    // تجنب إعادة التهيئة عند كل تحديث
    if (canvas) return;
    
    console.log("Initializing canvas...");
    if (!canvasRef.current) {
      const err = new Error("Canvas reference is not available");
      setError("تعذر تهيئة اللوحة: مرجع اللوحة غير متوفر");
      if (onError) onError(err);
      setIsLoading(false);
      return;
    }
    
    try {
      // تهيئة كائن الكانفاس مع إعدادات متقدمة
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
        width: 800,
        height: 600,
        preserveObjectStacking: true,
        stopContextMenu: true,
        fireRightClick: true,
        controlsAboveOverlay: true,
        selectionBorderColor: '#2563eb', // لون حدود التحديد
        selectionColor: 'rgba(37, 99, 235, 0.1)', // لون خلفية التحديد
        selectionLineWidth: 2 // سمك حدود التحديد
      });
      
      // ضبط خيارات التفاعل الافتراضية
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.freeDrawingBrush.width = 5;
      fabricCanvas.freeDrawingBrush.color = '#2563eb';
      
      // تمكين التحديد المتعدد مع مفتاح SHIFT
      fabricCanvas.on('selection:created', (e: any) => {
        console.log('Selection created:', e.selected);
      });
      
      fabricCanvas.on('object:added', (e: any) => {
        console.log('Object added to canvas:', e.target);
        // التأكد من أن العنصر المضاف قابل للتحديد والتحرك
        if (e.target) {
          e.target.selectable = true;
          e.target.hasControls = true;
          e.target.hasBorders = true;
          e.target.lockMovementX = false;
          e.target.lockMovementY = false;
          
          // تحديث الكانفاس
          fabricCanvas.renderAll();
        }
      });
      
      fabricCanvas.on('object:modified', (e: any) => {
        console.log('Object modified:', e.target);
        fabricCanvas.renderAll();
      });
      
      fabricCanvas.on('object:selected', (e: any) => {
        console.log('Object selected:', e.target);
      });
      
      // تحديث عند تحريك الأشياء
      fabricCanvas.on('object:moving', (e: any) => {
        fabricCanvas.renderAll();
      });
      
      // تحديث عند تغيير حجم الأشياء
      fabricCanvas.on('object:scaling', (e: any) => {
        fabricCanvas.renderAll();
      });
      
      // تحديث عند تدوير الأشياء
      fabricCanvas.on('object:rotating', (e: any) => {
        fabricCanvas.renderAll();
      });
      
      // معالجة الأخطاء عند حدوثها في الكانفاس
      fabricCanvas.on('error', (err: any) => {
        console.error('Canvas error event:', err);
        setError(`خطأ في الكانفاس: ${err.message || 'خطأ غير معروف'}`);
        if (onError) onError(new Error(`Canvas error: ${err.message || 'Unknown error'}`));
      });
      
      setCanvas(fabricCanvas);
      
      // تحميل صورة القالب كخلفية
      if (templateImage) {
        console.log("Loading template image:", templateImage);
        
        // تعيين مؤقت للكشف عن استغراق تحميل الصورة وقتًا طويلاً
        const timeoutId = setTimeout(() => {
          if (isLoading) {
            const err = new Error("Template image loading timeout");
            setError("استغرق تحميل صورة القالب وقتًا طويلاً. تأكد من توفر الصورة وصحة العنوان.");
            if (onError) onError(err);
          }
        }, 10000); // 10 seconds timeout
        
        // تحميل الصورة من خلال URL
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          clearTimeout(timeoutId);
          console.log("Template image loaded successfully, width:", img.width, "height:", img.height);
          
          try {
            // ضبط حجم الصورة لتناسب الكانفاس
            const canvasWidth = fabricCanvas.width || 800;
            const canvasHeight = fabricCanvas.height || 600;
            const imgWidth = img.width || 100;
            const imgHeight = img.height || 100;
            
            const scale = Math.min(
              canvasWidth / imgWidth,
              canvasHeight / imgHeight
            );
            
            // إنشاء كائن صورة Fabric
            const fabricImage = new fabric.Image(img, {
              scaleX: scale,
              scaleY: scale,
              left: 0,
              top: 0,
              selectable: false,
              evented: false,
              hasControls: false,
              hasBorders: false
            });
            
            // تعيين الصورة كخلفية للكانفاس
            fabricCanvas.setBackgroundImage(fabricImage, fabricCanvas.renderAll.bind(fabricCanvas), {
              originX: 'left',
              originY: 'top'
            });
            
            // تعيين أبعاد الكانفاس لمطابقة أبعاد الصورة المقياسة
            fabricCanvas.setWidth(imgWidth * scale);
            fabricCanvas.setHeight(imgHeight * scale);
            fabricCanvas.renderAll();
            
            setIsLoading(false);
            setError(null);
            
            // استدعاء معالج جاهزية الكانفاس
            if (onCanvasReady) {
              onCanvasReady(fabricCanvas);
            }
          } catch (imageErr) {
            console.error("Error processing template image:", imageErr);
            const err = new Error(`Error processing template image: ${imageErr.message}`);
            setError("حدث خطأ أثناء معالجة صورة القالب");
            if (onError) onError(err);
            setIsLoading(false);
          }
        };
        
        img.onerror = (err) => {
          // معالجة خطأ تحميل الصورة
          console.error("Error loading template image:", err);
          clearTimeout(timeoutId);
          setError("فشل تحميل صورة القالب، تأكد من وجود الصورة وصحة الرابط");
          if (onError) onError(new Error("Failed to load template image"));
          setIsLoading(false);
        };
        
        // بدء تحميل الصورة
        img.src = templateImage;
      } else {
        console.warn("No template image provided");
        
        // إنشاء كانفاس فارغ مع خلفية بيضاء
        fabricCanvas.setBackgroundColor('#FFFFFF', fabricCanvas.renderAll.bind(fabricCanvas));
        fabricCanvas.renderAll();
        
        setIsLoading(false);
        setError(null);
        
        // استدعاء معالج جاهزية الكانفاس
        if (onCanvasReady) {
          onCanvasReady(fabricCanvas);
        }
      }
    } catch (error) {
      console.error("Error initializing canvas:", error);
      setError(`حدث خطأ أثناء تهيئة اللوحة: ${error.message}`);
      if (onError) onError(error);
      setIsLoading(false);
    }
    
    // تنظيف عند إزالة المكون
    return () => {
      if (canvas) {
        try {
          canvas.off(); // إزالة جميع الأحداث
          canvas.dispose();
        } catch (error) {
          console.error("Error disposing canvas:", error);
        }
      }
    };
  }, [templateImage, onCanvasReady, onError, canvas, isLoading]);
  
  // Reset error state if template image changes
  useEffect(() => {
    setError(null);
  }, [templateImage]);
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 bg-opacity-50 z-10">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="mr-2">جاري تحميل القالب...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 bg-opacity-80 z-20 p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-red-800 mb-1">خطأ في تحميل القالب</h3>
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-2">
              تأكد من وجود الصورة وصحة عنوانها، أو قم بتحديث الصفحة للمحاولة مرة أخرى
            </p>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="border rounded-md shadow-sm"></canvas>
    </div>
  );
}