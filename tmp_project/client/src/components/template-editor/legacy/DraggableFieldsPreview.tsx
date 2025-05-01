import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image, Text, Line, Group, Rect, Circle } from 'react-konva';
import { Image as ImageIcon } from 'lucide-react';

interface EditorSettings {
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  snapThreshold?: number;
}

interface DraggableFieldsPreviewProps {
  templateImage: string;
  fields: any[];
  selectedField?: any;
  onFieldPositionChange?: (fieldId: number, position: { x: number, y: number }, snapToGrid?: boolean) => void;
  onSelectField?: (field: any) => void;
  width?: number;
  height?: number;
  className?: string;
  editorSettings?: EditorSettings;
}

// إعدادات الشبكة الافتراضية
const DEFAULT_GRID_SIZE = 50; // المسافة بين الخطوط بالبكسل
const DEFAULT_GRID_COLOR = '#cccccc';
const DEFAULT_GRID_OPACITY = 0.3;
const DEFAULT_SNAP_THRESHOLD = 15; // المسافة التي سيتم عندها التجاذب (بالبكسل)

/**
 * محرر حقول القالب المحسّن مع دعم السحب والإفلات
 * يستخدم أبعاد صورة القالب الأصلية لضمان تطابق 100% بين المعاينة والصورة النهائية
 * الإصدار 4.0 - أضيفت شبكة المحاذاة الديناميكية مع نقاط تجاذب مخصصة
 */
export const DraggableFieldsPreview: React.FC<DraggableFieldsPreviewProps> = ({
  templateImage,
  fields,
  selectedField,
  onFieldPositionChange,
  onSelectField,
  className,
  editorSettings
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 600 });
  const [viewportDimensions, setViewportDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const stageRef = useRef<any>(null);
  
  // إعدادات الشبكة والمحاذاة
  const [gridSize, setGridSize] = useState(editorSettings?.gridSize || DEFAULT_GRID_SIZE);
  const [gridEnabled, setGridEnabled] = useState(editorSettings?.gridEnabled !== undefined ? editorSettings.gridEnabled : true);
  const [snapToGrid, setSnapToGrid] = useState(editorSettings?.snapToGrid !== undefined ? editorSettings.snapToGrid : true);
  const [snapThreshold, setSnapThreshold] = useState(editorSettings?.snapThreshold || DEFAULT_SNAP_THRESHOLD);
  
  // قيم للتجاذب الديناميكي
  const [guideLines, setGuideLines] = useState<{orientation: 'h' | 'v', position: number}[]>([]);
  const [draggedField, setDraggedField] = useState<any>(null);
  
  // متغيرات تمرير الكنفا (pan)
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const lastCursorPositionRef = useRef({ x: 0, y: 0 });

  // تحميل صورة القالب بأبعادها الأصلية
  useEffect(() => {
    if (!templateImage) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setBackgroundImage(img);
      // استخدام الأبعاد الطبيعية للصورة (هذه هي الأبعاد التي ستستخدم في توليد الصورة النهائية)
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      setImageDimensions({ width: naturalWidth, height: naturalHeight });
      
      // حساب مقياس العرض المناسب لحاوية العرض
      updateViewportDimensions(naturalWidth, naturalHeight);
    };
    img.src = templateImage;
  }, [templateImage]);

  // تحديث أبعاد العرض عند تغيير حجم النافذة
  useEffect(() => {
    const handleResize = () => {
      if (backgroundImage) {
        updateViewportDimensions(backgroundImage.naturalWidth, backgroundImage.naturalHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [backgroundImage]);
  
  // تحديث إعدادات المحرر عند تغيير الإعدادات من المكون الأب
  useEffect(() => {
    if (editorSettings) {
      if (editorSettings.gridSize !== undefined) {
        setGridSize(editorSettings.gridSize);
      }
      if (editorSettings.gridEnabled !== undefined) {
        setGridEnabled(editorSettings.gridEnabled);
      }
      if (editorSettings.snapToGrid !== undefined) {
        setSnapToGrid(editorSettings.snapToGrid);
      }
      if (editorSettings.snapThreshold !== undefined) {
        setSnapThreshold(editorSettings.snapThreshold);
      }
    }
  }, [editorSettings]);
  
  // إضافة مستمعي الأحداث للوحة المفاتيح والموس للتمرير (pan) والتحكم بالأسهم
  useEffect(() => {
    // معالجة أحداث ضغط المفاتيح
    const handleKeyDown = (e: KeyboardEvent) => {
      // إذا تم ضغط مفتاح المسافة
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
        document.body.style.cursor = 'grab';
      }
      
      // التحكم بحركة الحقول والكنفا باستخدام مفاتيح الأسهم
      if (!selectedField) return;
      
      // تحديد مقدار الحركة (1 بكسل عادي، 10 بكسل مع Shift)
      const moveAmount = e.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
      
      // تحديد الاتجاه حسب مفتاح السهم المضغوط
      if (e.key === 'ArrowLeft') dx = -moveAmount;
      if (e.key === 'ArrowRight') dx = moveAmount;
      if (e.key === 'ArrowUp') dy = -moveAmount;
      if (e.key === 'ArrowDown') dy = moveAmount;
      
      // إذا كان Ctrl مضغوطًا، نقوم بتحريك الكنفا نفسها وليس الحقل
      if (e.ctrlKey || e.metaKey) {
        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          setStagePosition(prev => ({
            x: prev.x + dx * 5, // مضاعفة سرعة تحريك الكنفا
            y: prev.y + dy * 5
          }));
        }
      } else if (dx !== 0 || dy !== 0) {
        // تحريك الحقل المحدد
        e.preventDefault();
        const position = getPosition(selectedField);
        const newX = position.x + dx;
        const newY = position.y + dy;
        
        // تحويل الموضع إلى نسبة مئوية
        const xPercent = parseFloat(((newX / imageDimensions.width) * 100).toFixed(2));
        const yPercent = parseFloat(((newY / imageDimensions.height) * 100).toFixed(2));
        
        // محدود في النطاق 0-100%
        const clampedX = Math.max(0, Math.min(100, xPercent));
        const clampedY = Math.max(0, Math.min(100, yPercent));
        
        // محاولة تطبيق محاذاة شبكية إذا كان التجاذب مفعل
        const isSnappedToGrid = snapToGrid && 
          Math.abs(newX - Math.round(newX / gridSize) * gridSize) < snapThreshold &&
          Math.abs(newY - Math.round(newY / gridSize) * gridSize) < snapThreshold;
        
        // إرسال التغيير للمكون الأب
        if (onFieldPositionChange) {
          onFieldPositionChange(selectedField.id, { x: clampedX, y: clampedY }, isSnappedToGrid);
        }
      }
      
      // التكبير والتصغير بمفاتيح + و -
      if (e.key === '+' || e.key === '=') {
        setScale(prev => Math.min(prev + 0.1, 4)); // 400% حد أقصى
      }
      if (e.key === '-') {
        setScale(prev => Math.max(prev - 0.1, 0.2)); // 20% حد أدنى
      }
    };
    
    // معالجة أحداث تحرير المفاتيح
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsDraggingStage(false);
        document.body.style.cursor = 'default';
      }
    };
    
    // معالجة حدث تحريك الموس
    const handleMouseMove = (e: MouseEvent) => {
      if (isSpacePressed && isDraggingStage) {
        const dx = e.clientX - lastCursorPositionRef.current.x;
        const dy = e.clientY - lastCursorPositionRef.current.y;
        
        // تحديث موضع الـ Stage
        setStagePosition(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        
        // تحديث المؤشر السابق
        lastCursorPositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    
    // معالجة حدث ضغط الموس
    const handleMouseDown = (e: MouseEvent) => {
      if (isSpacePressed) {
        setIsDraggingStage(true);
        document.body.style.cursor = 'grabbing';
        lastCursorPositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    
    // معالجة حدث تحرير الموس
    const handleMouseUp = () => {
      if (isSpacePressed) {
        setIsDraggingStage(false);
        document.body.style.cursor = 'grab';
      }
    };
    
    // إضافة مستمعي الأحداث
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // إزالة مستمعي الأحداث عند إلغاء تحميل المكون
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isSpacePressed, isDraggingStage, selectedField, onFieldPositionChange, 
      imageDimensions, gridSize, snapThreshold, snapToGrid]);

  // تحديث أبعاد العرض بناءً على حجم الحاوية
  const updateViewportDimensions = (imgWidth: number, imgHeight: number) => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight || 500; // ارتفاع افتراضي إذا لم يكن محدد
    
    // حساب مقياس العرض بحيث تناسب الصورة الحاوية مع الحفاظ على النسبة
    const widthRatio = containerWidth / imgWidth;
    const heightRatio = containerHeight / imgHeight;
    const newScale = Math.min(widthRatio, heightRatio, 1); // لا نزيد المقياس عن 1 (لا تكبير)

    // تعيين أبعاد viewport
    const viewWidth = Math.floor(imgWidth * newScale);
    const viewHeight = Math.floor(imgHeight * newScale);

    setViewportDimensions({ width: viewWidth, height: viewHeight });
    setScale(newScale);
  };

  // ضبط الموضع للتوافق مع الشبكة بناءً على إعدادات التجاذب
  const snapToGridPosition = (x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;
    
    return { 
      x: Math.abs(x - snappedX) < snapThreshold ? snappedX : x,
      y: Math.abs(y - snappedY) < snapThreshold ? snappedY : y 
    };
  };

  // معالج عجلة الموس للتكبير والتصغير
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // التحقق ما إذا كان مفتاح Ctrl مضغوطًا (للتكبير/التصغير)
    const isZoomEvent = e.ctrlKey || e.metaKey; // دعم Ctrl للويندوز والمتصفحات وCommand للماك
    
    if (isZoomEvent) {
      // منع السلوك الافتراضي فقط عند التكبير/التصغير
      e.stopPropagation();
      e.preventDefault();
      
      // تحديد اتجاه التغيير
      const zoomDirection = e.deltaY < 0 ? 1 : -1;
      
      // عامل التكبير/التصغير
      const ZOOM_FACTOR = 0.1;
      const newScale = Math.max(0.1, Math.min(4, scale + (zoomDirection * ZOOM_FACTOR)));
      
      // تحديث المقياس
      setScale(newScale);
    } else if (e.shiftKey) {
      // إذا كان Shift مضغوطًا، يمكن استخدامه للتمرير الأفقي
      e.stopPropagation();
      e.preventDefault();
      
      // نحول التمرير العمودي إلى أفقي عند الضغط على Shift
      setStagePosition(prev => ({
        x: prev.x - e.deltaY,
        y: prev.y
      }));
    } else if (isSpacePressed) {
      // منع السلوك الافتراضي أثناء المسافة (وضع التحريك)
      e.stopPropagation();
      e.preventDefault();
      
      // تحريك العرض عموديًا وأفقيًا
      const dx = e.deltaX; // التغيير الأفقي
      const dy = e.deltaY; // التغيير العمودي
      
      setStagePosition(prev => ({
        x: prev.x - dx,
        y: prev.y - dy
      }));
    }
    // في الحالات الأخرى، نسمح للمتصفح بالتمرير الافتراضي
  };
  
  // معالجة بدء السحب
  const handleDragStart = (e: any, field: any) => {
    setDraggedField(field);
    
    // إنشاء خطوط المحاذاة الديناميكية بناءً على مواضع الحقول الأخرى
    const guidelines: {orientation: 'h' | 'v', position: number}[] = [];
    
    // إضافة خطوط منتصف الصورة (اللذان يقسمان الصورة)
    guidelines.push({ orientation: 'h', position: imageDimensions.height / 2 });
    guidelines.push({ orientation: 'v', position: imageDimensions.width / 2 });
    
    // إضافة الحواف
    guidelines.push({ orientation: 'h', position: 0 });
    guidelines.push({ orientation: 'h', position: imageDimensions.height });
    guidelines.push({ orientation: 'v', position: 0 });
    guidelines.push({ orientation: 'v', position: imageDimensions.width });
    
    // إضافة مواضع الحقول الأخرى كخطوط إرشاد
    fields.forEach(otherField => {
      if (otherField.id === field.id) return; // تخطي الحقل الذي نقوم بسحبه
      
      const otherPosition = getPosition(otherField);
      
      // إضافة خط أفقي في موضع الحقل الآخر
      guidelines.push({ orientation: 'h', position: otherPosition.y });
      
      // إضافة خط عمودي في موضع الحقل الآخر
      guidelines.push({ orientation: 'v', position: otherPosition.x });
    });
    
    setGuideLines(guidelines);
  };
  
  // معالجة التجاذب للخطوط الإرشادية
  const snapToGuideline = (x: number, y: number) => {
    const snapped = { x, y, snappedX: false, snappedY: false };
    
    // البحث عن خط إرشادي للتجاذب
    for (let i = 0; i < guideLines.length; i++) {
      const guideline = guideLines[i];
      
      if (guideline.orientation === 'h' && !snapped.snappedY) {
        // خط أفقي - تحقق من القرب من القيمة y
        if (Math.abs(y - guideline.position) < snapThreshold) {
          snapped.y = guideline.position;
          snapped.snappedY = true;
        }
      } else if (guideline.orientation === 'v' && !snapped.snappedX) {
        // خط عمودي - تحقق من القرب من القيمة x
        if (Math.abs(x - guideline.position) < snapThreshold) {
          snapped.x = guideline.position;
          snapped.snappedX = true;
        }
      }
    }
    
    return { x: snapped.x, y: snapped.y };
  };

  // معالجة السحب (أثناء التحرك)
  const handleDragMove = (e: any) => {
    if (!draggedField) return;
    
    // الحصول على الموضع الحالي
    const rawPos = { x: e.target.x(), y: e.target.y() };
    
    // تطبيق التجاذب للشبكة والخطوط الإرشادية
    let snappedPosition = rawPos;
    
    // التجاذب إلى الخطوط الإرشادية يكون له أولوية
    snappedPosition = snapToGuideline(rawPos.x, rawPos.y);
    
    // إذا لم يتم التجاذب إلى خط إرشادي، حاول التجاذب إلى الشبكة
    if (rawPos.x === snappedPosition.x && rawPos.y === snappedPosition.y) {
      snappedPosition = snapToGridPosition(rawPos.x, rawPos.y);
    }
    
    // تطبيق الموضع الجديد
    e.target.position({
      x: snappedPosition.x,
      y: snappedPosition.y
    });
  };

  // معالجة نهاية السحب
  const handleDragEnd = (e: any, field: any) => {
    if (!backgroundImage || !onFieldPositionChange) return;
    setDraggedField(null);
    setGuideLines([]); // إزالة خطوط الإرشاد
    
    // الحصول على الموضع المباشر من حدث السحب
    const x = e.target.x();
    const y = e.target.y();
    
    // التحقق مما إذا كان الموضع منجذب إلى الشبكة
    const isSnappedToGrid = 
      Math.abs(x - Math.round(x / gridSize) * gridSize) < 2 &&
      Math.abs(y - Math.round(y / gridSize) * gridSize) < 2;

    // تحويل الموضع إلى نسبة مئوية من أبعاد الصورة
    // استخدام نفس طريقة التقريب الموجودة في مولد الصورة على السيرفر
    const xPercent = parseFloat(((x / imageDimensions.width) * 100).toFixed(2));
    const yPercent = parseFloat(((y / imageDimensions.height) * 100).toFixed(2));

    // محدود في النطاق 0-100%
    const clampedX = Math.max(0, Math.min(100, xPercent));
    const clampedY = Math.max(0, Math.min(100, yPercent));

    console.log(`Field ${field.id} positioned at: X:${clampedX}%, Y:${clampedY}% (${isSnappedToGrid ? 'Snapped to grid' : 'Free position'})`);
    
    // إرسال التغيير للمكون الأب
    onFieldPositionChange(field.id, { x: clampedX, y: clampedY }, isSnappedToGrid);
  };

  // اختيار حقل
  const handleFieldSelect = (field: any) => {
    if (onSelectField) {
      onSelectField(field);
    }
  };
  
  // تغيير حجم الشبكة
  const changeGridSize = (newSize: number) => {
    setGridSize(newSize);
    // تحديث الشبكة
  };

  // رسم شبكة خطوط (مع مراعاة إعدادات الشبكة)
  const renderGrid = () => {
    if (!gridEnabled) return [];
    
    const lines = [];
    
    // خطوط عمودية
    for (let i = 0; i <= imageDimensions.width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, imageDimensions.height]}
          stroke={DEFAULT_GRID_COLOR}
          strokeWidth={0.5}
          opacity={DEFAULT_GRID_OPACITY}
          dash={[5, 5]}
          perfectDrawEnabled={true}
        />
      );
    }
    
    // خطوط أفقية
    for (let j = 0; j <= imageDimensions.height; j += gridSize) {
      lines.push(
        <Line
          key={`h-${j}`}
          points={[0, j, imageDimensions.width, j]}
          stroke={DEFAULT_GRID_COLOR}
          strokeWidth={0.5}
          opacity={DEFAULT_GRID_OPACITY}
          dash={[5, 5]}
          perfectDrawEnabled={true}
        />
      );
    }
    
    return lines;
  };
  
  // رسم خطوط الإرشاد الديناميكية أثناء السحب
  const renderGuideLines = () => {
    if (!draggedField) return [];
    
    return guideLines.map((guideline, i) => {
      if (guideline.orientation === 'h') {
        return (
          <Line
            key={`guide-h-${i}`}
            points={[0, guideline.position, imageDimensions.width, guideline.position]}
            stroke="#3b82f6" // لون أزرق مميز
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.7}
          />
        );
      } else {
        return (
          <Line
            key={`guide-v-${i}`}
            points={[guideline.position, 0, guideline.position, imageDimensions.height]}
            stroke="#3b82f6" // لون أزرق مميز
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.7}
          />
        );
      }
    });
  };
  
  // رسم نقاط التجاذب (تظهر عند السحب)
  const renderSnapPoints = () => {
    if (!draggedField) return [];
    
    const points = [];
    
    // نقاط شبكة التجاذب (تظهر فقط في حوالي الحقل المسحوب)
    if (snapToGrid) {
      const position = getPosition(draggedField);
      const gridPointRadius = 5; // نصف قطر نقطة التجاذب
      
      // حساب نطاق النقاط حول الحقل
      const rangeX = Math.min(3, Math.floor(imageDimensions.width / gridSize));
      const rangeY = Math.min(3, Math.floor(imageDimensions.height / gridSize));
      
      // حساب النقطة المركزية في الشبكة
      const centerGridX = Math.round(position.x / gridSize) * gridSize;
      const centerGridY = Math.round(position.y / gridSize) * gridSize;
      
      // إضافة نقاط الشبكة حول الحقل
      for (let x = -rangeX; x <= rangeX; x++) {
        for (let y = -rangeY; y <= rangeY; y++) {
          const gridX = centerGridX + (x * gridSize);
          const gridY = centerGridY + (y * gridSize);
          
          // تخطي النقاط خارج الصورة
          if (gridX < 0 || gridX > imageDimensions.width || gridY < 0 || gridY > imageDimensions.height) {
            continue;
          }
          
          points.push(
            <Circle
              key={`snap-${gridX}-${gridY}`}
              x={gridX}
              y={gridY}
              radius={gridPointRadius}
              fill="#3b82f680" // لون أزرق مع شفافية
              opacity={0.5}
            />
          );
        }
      }
    }
    
    return points;
  };

  // الحصول على خصائص النص للحقل
  const getTextStyles = (field: any) => {
    const style = field.style || {};
    
    // استخراج الخصائص مع القيم الافتراضية
    const fontFamily = style.fontFamily || 'Cairo';
    // هنا نستخدم نفس حجم الخط الأصلي كما في السيرفر
    // لا نحتاج لضرب الحجم في معامل القياس هنا لأن Konva سيقوم بذلك تلقائيًا في السيرفر
    const fontSize = style.fontSize || 24;
    const fontWeight = style.fontWeight || 'normal';
    const color = style.color || '#000000';
    const align = style.align || 'center';
    const width = 300;
    
    return {
      fontFamily,
      fontSize,
      fontStyle: fontWeight === 'bold' ? 'bold' : 'normal',
      fill: color,
      align,
      width,
      perfectDrawEnabled: true
    };
  };

  // الحصول على موضع الحقل
  const getPosition = (field: any) => {
    // استخدام النسب المئوية المحفوظة للحقل أو القيم الافتراضية
    const xPercent = field.position?.x !== undefined ? field.position.x : 50;
    const yPercent = field.position?.y !== undefined ? field.position.y : 50;
    
    // تحويل النسبة المئوية إلى بكسل
    const x = (xPercent / 100) * imageDimensions.width;
    const y = (yPercent / 100) * imageDimensions.height;
    
    return { x, y };
  };

  // تقديم المكون
  return (
    <div 
      ref={containerRef}
      className={`relative border border-gray-300 rounded-md ${className}`}
      style={{ 
        height: '100%', 
        minHeight: '400px', 
        overflow: 'auto',
        position: 'relative'
      }}
      onWheel={handleWheel}
    >
      <Stage 
        ref={stageRef}
        width={imageDimensions.width} 
        height={imageDimensions.height}
        scale={{ x: scale, y: scale }}
        x={stagePosition.x}
        y={stagePosition.y}
        style={{ 
          display: 'block', 
          margin: '0 auto',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        // يمنع انتشار السحب عند الضغط على مفتاح المسافة
        onClick={(e) => {
          if (isSpacePressed) {
            e.cancelBubble = true;
          }
        }}
      >
        <Layer>
          {/* صورة القالب */}
          {backgroundImage && (
            <Image
              image={backgroundImage}
              width={imageDimensions.width}
              height={imageDimensions.height}
              perfectDrawEnabled={true}
            />
          )}
          
          {/* شبكة المحاذاة */}
          {renderGrid()}
          
          {/* خطوط الإرشاد الديناميكية */}
          {renderGuideLines()}
          
          {/* نقاط التجاذب */}
          {renderSnapPoints()}
          
          {/* الحقول القابلة للسحب */}
          {fields.map((field) => {
            // الحصول على خصائص موضع وأنماط الحقل
            const position = getPosition(field);
            // عمق الطبقة (z-index) - القيمة الأعلى تعني طبقة أعلى
            const zIndex = field.style?.layer || 1;
            
            // تحديد ما إذا كان الحقل هو الحقل المحدد
            const isSelected = selectedField && selectedField.id === field.id;
            
            // إنشاء المجموعة الأساسية للحقل
            return (
              <Group
                key={field.id}
                x={position.x}
                y={position.y}
                draggable
                onClick={() => handleFieldSelect(field)}
                onDragStart={(e) => handleDragStart(e, field)}
                onDragMove={handleDragMove}
                onDragEnd={(e) => handleDragEnd(e, field)}
                zIndex={zIndex} // ترتيب الطبقات
              >
                {field.type === 'image' ? (
                  // عرض نموذج الصورة
                  <>
                    {/* مربع الصورة - استخدام أبعاد حقيقية بناءً على نسبة صورة القالب */}
                    <Rect
                      width={field.style?.imageMaxWidth || imageDimensions.width / 4}
                      height={field.style?.imageMaxHeight || imageDimensions.height / 4}
                      offsetX={(field.style?.imageMaxWidth || imageDimensions.width / 4) / 2}
                      offsetY={(field.style?.imageMaxHeight || imageDimensions.height / 4) / 2}
                      fill="#f0f9ff" // لون خلفية فاتح (أزرق فاتح)
                      stroke={field.style?.imageBorder ? "#64748b" : "transparent"}
                      strokeWidth={field.style?.imageBorder ? 2 : 0}
                      cornerRadius={field.style?.imageRounded ? Math.min((field.style?.imageMaxWidth || imageDimensions.width / 4), (field.style?.imageMaxHeight || imageDimensions.height / 4)) / 2 : 4}
                      shadowEnabled={isSelected}
                      shadowColor="#3b82f6"
                      shadowBlur={isSelected ? 10 : 0}
                      shadowOpacity={0.5}
                    />
                    
                    {/* أيقونة الصورة والنص */}
                    <Group
                      offsetX={0}
                      offsetY={0}
                    >
                      {/* أيقونة الصورة - نستخدم مستطيل مع نص كبديل للأيقونة */}
                      <Rect
                        width={40}
                        height={40}
                        offsetX={20}
                        offsetY={20}
                        fill="#64748b"
                        cornerRadius={4}
                      />
                      <Text
                        text="IMG"
                        fontSize={14}
                        fontFamily="Arial"
                        fontStyle="bold"
                        fill="#ffffff"
                        width={40}
                        align="center"
                        offsetX={20}
                        offsetY={-2}
                      />
                      
                      {/* نص عنوان الحقل */}
                      <Text
                        text={field.label || field.name}
                        fontSize={16}
                        fontFamily="Arial"
                        fill="#334155"
                        width={field.style?.imageMaxWidth || imageDimensions.width / 4}
                        align="center"
                        offsetX={(field.style?.imageMaxWidth || imageDimensions.width / 4) / 2}
                        offsetY={-40}
                      />
                      
                      {/* نص أبعاد الصورة - استخدام الأبعاد الحقيقية */}
                      <Text
                        text={`${field.style?.imageMaxWidth || Math.round(imageDimensions.width / 4)}×${field.style?.imageMaxHeight || Math.round(imageDimensions.height / 4)}`}
                        fontSize={12}
                        fontFamily="Arial"
                        fill="#64748b"
                        width={field.style?.imageMaxWidth || imageDimensions.width / 4}
                        align="center"
                        offsetX={(field.style?.imageMaxWidth || imageDimensions.width / 4) / 2}
                        offsetY={-60}
                      />
                    </Group>
                  </>
                ) : (
                  // عرض حقل النص العادي
                  (() => {
                    const textStyles = getTextStyles(field);
                    const clientFontSize = textStyles.fontSize;
                    
                    return (
                      <>
                        <Text
                          text={field.label || field.name}
                          fontSize={clientFontSize}
                          fontFamily={textStyles.fontFamily}
                          fontStyle={textStyles.fontStyle}
                          fill={textStyles.fill}
                          align={textStyles.align}
                          width={textStyles.width}
                          // استخدم محاذاة منتصف للنص
                          offsetX={textStyles.align === 'center' ? textStyles.width / 2 : 0}
                          offsetY={clientFontSize / 2}
                          shadowEnabled={field.style?.textShadow?.enabled}
                          shadowColor={field.style?.textShadow?.color || '#000000'}
                          shadowBlur={field.style?.textShadow?.blur || 3}
                          perfectDrawEnabled={true}
                        />
                        
                        {/* مربع التحديد للحقل المحدد */}
                        {selectedField?.id === field.id && (
                          <Rect
                            x={-5}
                            y={-5}
                            width={textStyles.width + 10}
                            height={clientFontSize + 10}
                            offsetX={textStyles.align === 'center' ? textStyles.width / 2 : 0}
                            offsetY={clientFontSize / 2}
                            stroke="#3b82f6"
                            strokeWidth={1}
                            dash={[5, 5]}
                            fill="rgba(59, 130, 246, 0.1)"
                            cornerRadius={4}
                          />
                        )}
                      </>
                    );
                  })()
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
      
      {/* التحكم بالشبكة والمحاذاة */}
      <div className="absolute bottom-12 right-2 bg-white/90 p-2 rounded-md shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="gridEnabled"
            checked={gridEnabled}
            onChange={(e) => setGridEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="gridEnabled" className="text-xs text-gray-700">
            إظهار الشبكة
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="snapToGrid"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="snapToGrid" className="text-xs text-gray-700">
            تجاذب إلى الشبكة
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="gridSize" className="text-xs text-gray-700">
            حجم الشبكة:
          </label>
          <select
            id="gridSize"
            value={gridSize}
            onChange={(e) => changeGridSize(Number(e.target.value))}
            className="text-xs p-1 border rounded"
          >
            <option value="10">10px</option>
            <option value="20">20px</option>
            <option value="25">25px</option>
            <option value="50">50px</option>
            <option value="100">100px</option>
          </select>
        </div>
      </div>
      
      {/* معلومات المقياس والأبعاد */}
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded-md text-gray-600 shadow-sm">
        {backgroundImage && (
          <>
            <span className="font-medium">أبعاد القالب: </span>
            <span>{imageDimensions.width}×{imageDimensions.height}px</span>
            <span className="mx-1">|</span>
            <span className="font-medium">المقياس: </span>
            <span>{(scale * 100).toFixed(0)}%</span>
          </>
        )}
      </div>
      
      {/* تلميحات المساعدة */}
      <div className="absolute top-2 left-2 bg-white/90 text-xs px-2 py-1 rounded-md text-gray-600 shadow-sm">
        <div className="font-medium mb-1">اختصارات لوحة المفاتيح:</div>
        <div className="flex flex-col gap-1">
          <div><span className="font-medium">Space + سحب:</span> تحريك القالب</div>
          <div><span className="font-medium">أسهم:</span> تحريك الحقل المحدد</div>
          <div><span className="font-medium">Shift + أسهم:</span> تحريك سريع (10 بكسل)</div>
          <div><span className="font-medium">Ctrl + أسهم:</span> تحريك منطقة العرض</div>
          <div><span className="font-medium">+ / -:</span> تكبير/تصغير</div>
          <div><span className="font-medium">Ctrl + عجلة:</span> تكبير/تصغير</div>
          <div><span className="font-medium">Shift + عجلة:</span> تمرير أفقي</div>
          <div><span className="font-medium">عجلة:</span> تمرير عمودي/أفقي (مع السكرول)</div>
        </div>
      </div>
    </div>
  );
};