/*
نسخة متكاملة من DraggableFieldsPreview
- توليد صورة PNG
- تحديد متعدد
- Undo/Redo
- شريط أدوات أنيق
*/

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group, Rect, Line } from 'react-konva';
import { Download, RotateCcw, RotateCw, ZoomIn, ZoomOut, Grid, Magnet } from 'lucide-react';

/**
 * العرض المرجعي للتصميم الأصلي - يتطابق مع القيمة في جميع مكونات النظام
 * هذه القيمة مهمة جدًا لضمان التطابق 100% بين المعاينة والصورة النهائية
 * 
 * 🔴 ملاحظة مهمة: 
 * يجب أن تكون هذه القيمة متطابقة في الملفات التالية:
 * 1. `BASE_IMAGE_WIDTH` في ملف `server/optimized-image-generator.ts`
 * 2. `BASE_IMAGE_WIDTH` في ملف `client/src/components/konva-image-generator/optimized-image-generator.tsx`
 * 3. `BASE_IMAGE_WIDTH` في ملف `DraggableFieldsPreviewPro.tsx`
 */
const BASE_IMAGE_WIDTH = 1000;

interface EditorSettings {
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  snapThreshold?: number;
}

interface FieldType {
  id: number;
  name: string;
  label?: string;
  type: 'text' | 'image';
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: any;
}

interface DraggableFieldsPreviewProProps {
  templateImage: string;
  fields: FieldType[];
  onFieldsChange: (fields: FieldType[]) => void;
  editorSettings?: EditorSettings;
  width?: number;
  height?: number;
  className?: string;
}

export const DraggableFieldsPreviewPro: React.FC<DraggableFieldsPreviewProProps> = ({
  templateImage,
  fields,
  onFieldsChange,
  editorSettings,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [guidelines, setGuidelines] = useState<{ 
    x?: number; 
    y?: number;
    xType?: string;
    yType?: string;
  }>({});

  // إضافات جديدة
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [history, setHistory] = useState<FieldType[][]>([]);
  const [future, setFuture] = useState<FieldType[][]>([]);
  const [isGridVisible, setIsGridVisible] = useState<boolean>(
    editorSettings?.gridEnabled !== undefined ? editorSettings.gridEnabled : true
  );

  // إعدادات الشبكة والتجاذب من الخارج
  const gridSize = editorSettings?.gridSize || 50;
  const snapThreshold = editorSettings?.snapThreshold || 10;
  const gridEnabled = editorSettings?.gridEnabled !== undefined ? editorSettings.gridEnabled : true;
  const snapToGrid = editorSettings?.snapToGrid !== undefined ? editorSettings.snapToGrid : true;

  // تحميل صورة القالب وضبط أبعاد Stage ليطابق أبعاد الصورة تمامًا (1:1)
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log(`تم تحميل صورة القالب بأبعاد: ${img.width}x${img.height}`);
      
      // استخدام الأبعاد الطبيعية للصورة 100%
      setBackgroundImage(img);
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      
      // حساب حجم Stage المناسب ليناسب الحاوية مع الحفاظ على نسبة العرض إلى الارتفاع
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight || 600;
        
        // حساب مقياس لملاءمة الصورة في الحاوية
        const widthRatio = containerWidth / img.naturalWidth;
        const heightRatio = containerHeight / img.naturalHeight;
        const newScale = Math.min(widthRatio, heightRatio, 1);
        
        console.log(`مقياس العرض: ${widthRatio.toFixed(2)}, مقياس الارتفاع: ${heightRatio.toFixed(2)}, المقياس المختار: ${newScale.toFixed(2)}`);
        
        setStageScale(newScale);
      }
    };
    img.src = templateImage;
    
    // تسجيل أي أخطاء في تحميل الصورة
    img.onerror = (e) => {
      console.error('فشل تحميل صورة القالب:', e);
    };
  }, [templateImage]);

  // معالجة ضغط المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // التراجع / الإعادة باختصارات لوحة المفاتيح
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      const moveAmount = e.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -moveAmount;
      if (e.key === 'ArrowRight') dx = moveAmount;
      if (e.key === 'ArrowUp') dy = -moveAmount;
      if (e.key === 'ArrowDown') dy = moveAmount;

      if (e.ctrlKey) {
        // تحريك Stage (تمرير الكنفا)
        setStagePos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      } else if (selectedIds.length > 0 && (dx !== 0 || dy !== 0)) {
        // تحريك العناصر المحددة
        e.preventDefault();
        moveSelectedFields(dx, dy);
      }
      
      // التكبير والتصغير
      if (e.key === '+') setStageScale(s => Math.min(s + 0.1, 4));
      if (e.key === '-') setStageScale(s => Math.max(s - 0.1, 0.2));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, fields]);

  // تحويل النسب المئوية إلى بكسل
  const getFieldPosition = (field: FieldType) => {
    const x = (field.position.x / 100) * imageSize.width;
    const y = (field.position.y / 100) * imageSize.height;
    return { x, y };
  };

  // حفظ حالة الحقول للتراجع (Undo)
  const saveHistory = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(fields))]);
    setFuture([]);
  };

  // التراجع عن آخر تغيير
  const undo = () => {
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setFuture(prev => [fields, ...prev]);
    onFieldsChange(lastState);
  };

  // إعادة التغيير بعد التراجع
  const redo = () => {
    if (future.length === 0) return;
    
    const nextState = future[0];
    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(fields))]);
    onFieldsChange(nextState);
  };

  // حساب خطوط التوجيه للتجاذب
  const calculateSnapGuidelines = (currentFieldId?: number) => {
    const lines = [];
    
    // خطوط الشبكة
    for (let i = 0; i <= imageSize.width; i += gridSize) {
      lines.push({ x: i, type: 'grid' });
    }
    for (let j = 0; j <= imageSize.height; j += gridSize) {
      lines.push({ y: j, type: 'grid' });
    }
    
    // خطوط المنتصف
    lines.push({ x: imageSize.width / 2, type: 'center' });
    lines.push({ y: imageSize.height / 2, type: 'center' });
    
    // حواف العنصر الحالي (لمحاذاة بداية ونهاية العناصر)
    const currentField = currentFieldId 
      ? fields.find(f => f.id === currentFieldId) 
      : undefined;
    
    if (currentField) {
      const pos = getFieldPosition(currentField);
      const style = currentField.style || {};
      
      if (currentField.type === 'text') {
        const fontSize = (style.fontSize || 24) * (imageSize.width / BASE_IMAGE_WIDTH);
        const fieldWidth = (style.width || 200) * (imageSize.width / BASE_IMAGE_WIDTH);
        
        // حواف العنصر النصي
        if (style.align === 'center') {
          lines.push({ x: pos.x - fieldWidth / 2, type: 'edge', fieldId: currentField.id });
          lines.push({ x: pos.x + fieldWidth / 2, type: 'edge', fieldId: currentField.id });
        } else if (style.align === 'left') {
          lines.push({ x: pos.x, type: 'edge', fieldId: currentField.id });
          lines.push({ x: pos.x + fieldWidth, type: 'edge', fieldId: currentField.id });
        } else { // align right
          lines.push({ x: pos.x - fieldWidth, type: 'edge', fieldId: currentField.id });
          lines.push({ x: pos.x, type: 'edge', fieldId: currentField.id });
        }
      } else if (currentField.type === 'image') {
        const imgWidth = style.imageMaxWidth || Math.round(imageSize.width / 4);
        const imgHeight = style.imageMaxHeight || Math.round(imageSize.height / 4);
        
        // حواف الصورة
        lines.push({ x: pos.x - imgWidth / 2, type: 'edge', fieldId: currentField.id });
        lines.push({ x: pos.x + imgWidth / 2, type: 'edge', fieldId: currentField.id });
        lines.push({ y: pos.y - imgHeight / 2, type: 'edge', fieldId: currentField.id });
        lines.push({ y: pos.y + imgHeight / 2, type: 'edge', fieldId: currentField.id });
      }
    }
    
    // مواضع الحقول الأخرى مع حوافها
    fields.forEach(f => {
      if (currentFieldId && f.id === currentFieldId) return; // تجاهل الحقل الحالي
      
      const pos = getFieldPosition(f);
      const style = f.style || {};
      
      // مركز الحقل دائمًا
      lines.push({ x: pos.x, type: 'field', fieldId: f.id });
      lines.push({ y: pos.y, type: 'field', fieldId: f.id });
      
      // حواف العناصر الأخرى للمحاذاة
      if (f.type === 'text') {
        const fontSize = (style.fontSize || 24) * (imageSize.width / BASE_IMAGE_WIDTH);
        const fieldWidth = (style.width || 200) * (imageSize.width / BASE_IMAGE_WIDTH);
        
        if (style.align === 'center') {
          lines.push({ x: pos.x - fieldWidth / 2, type: 'field-edge', fieldId: f.id });
          lines.push({ x: pos.x + fieldWidth / 2, type: 'field-edge', fieldId: f.id });
        } else if (style.align === 'left') {
          lines.push({ x: pos.x, type: 'field-edge', fieldId: f.id });
          lines.push({ x: pos.x + fieldWidth, type: 'field-edge', fieldId: f.id });
        } else { // align right
          lines.push({ x: pos.x - fieldWidth, type: 'field-edge', fieldId: f.id });
          lines.push({ x: pos.x, type: 'field-edge', fieldId: f.id });
        }
      } else if (f.type === 'image') {
        const imgWidth = style.imageMaxWidth || Math.round(imageSize.width / 4);
        const imgHeight = style.imageMaxHeight || Math.round(imageSize.height / 4);
        
        lines.push({ x: pos.x - imgWidth / 2, type: 'field-edge', fieldId: f.id });
        lines.push({ x: pos.x + imgWidth / 2, type: 'field-edge', fieldId: f.id });
        lines.push({ y: pos.y - imgHeight / 2, type: 'field-edge', fieldId: f.id });
        lines.push({ y: pos.y + imgHeight / 2, type: 'field-edge', fieldId: f.id });
      }
    });
    
    return lines;
  };

  // تطبيق التجاذب على الإحداثيات بناءً على أنواع الخطوط وتفضيلاتها
  const applySnapToGuidelines = (x: number, y: number, fieldId?: number) => {
    if (!snapToGrid) return { x, y };
    
    const lines = calculateSnapGuidelines(fieldId);
    
    // البحث عن أقرب خط أفقي وعمودي
    let closestX = { distance: snapThreshold, value: undefined as number | undefined, type: '' };
    let closestY = { distance: snapThreshold, value: undefined as number | undefined, type: '' };
    
    // ترتيب الأولويات: 1) المركز 2) حواف الحقول الأخرى 3) الشبكة
    const typePriority: {[key: string]: number} = {
      'center': 10,        // أولوية قصوى لخطوط المنتصف
      'field': 8,          // أولوية عالية لمراكز الحقول الأخرى
      'field-edge': 6,     // أولوية متوسطة لحواف الحقول الأخرى
      'edge': 4,           // أولوية أقل لحواف العنصر نفسه
      'grid': 2            // أولوية منخفضة للشبكة
    };
    
    lines.forEach(line => {
      // التحقق من التجاذب الأفقي (خطوط س)
      if (line.x !== undefined) {
        const distance = Math.abs(x - line.x);
        const priority = typePriority[line.type || 'grid'] || 0;
        
        // إذا كان هذا الخط أقرب أو بنفس المسافة ولكن بأولوية أعلى
        if (distance < closestX.distance || 
            (distance === closestX.distance && priority > typePriority[closestX.type || 'grid'])) {
          closestX = { distance, value: line.x, type: line.type || '' };
        }
      }
      
      // التحقق من التجاذب العمودي (خطوط ص)
      if (line.y !== undefined) {
        const distance = Math.abs(y - line.y);
        const priority = typePriority[line.type || 'grid'] || 0;
        
        // إذا كان هذا الخط أقرب أو بنفس المسافة ولكن بأولوية أعلى
        if (distance < closestY.distance || 
            (distance === closestY.distance && priority > typePriority[closestY.type || 'grid'])) {
          closestY = { distance, value: line.y, type: line.type || '' };
        }
      }
    });
    
    // تحديث الخطوط الإرشادية للعرض
    // لون مختلف حسب نوع الخط (أحمر للمركز، أزرق للحقول، أخضر للشبكة)
    setGuidelines({ 
      x: closestX.value, 
      y: closestY.value,
      xType: closestX.type,
      yType: closestY.type
    });
    
    return {
      x: closestX.value !== undefined ? closestX.value : x,
      y: closestY.value !== undefined ? closestY.value : y
    };
  };

  // تحريك الحقول المحددة
  const moveSelectedFields = (dx: number, dy: number) => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    const updatedFields = fields.map(field => {
      if (selectedIds.includes(field.id)) {
        const pos = getFieldPosition(field);
        const newPos = { x: pos.x + dx, y: pos.y + dy };
        
        // تطبيق التجاذب إذا كان مفعلاً
        const snappedPos = snapToGrid ? applySnapToGuidelines(newPos.x, newPos.y) : newPos;
        
        // تحويل من بكسل إلى نسبة مئوية
        return {
          ...field,
          position: {
            x: parseFloat(((snappedPos.x / imageSize.width) * 100).toFixed(2)),
            y: parseFloat(((snappedPos.y / imageSize.height) * 100).toFixed(2)),
            snapToGrid: field.position.snapToGrid
          }
        };
      }
      return field;
    });
    
    onFieldsChange(updatedFields);
  };

  // تصدير الصورة كملف PNG
  const exportImage = () => {
    if (!stageRef.current) return;
    
    // إخفاء الخطوط الإرشادية والحدود للصورة النهائية
    const tempGuidelines = { ...guidelines };
    const tempSelectedIds = [...selectedIds];
    
    setGuidelines({});
    setSelectedIds([]);
    
    // تأخير قصير للسماح للرسم بالتحديث قبل التصدير
    setTimeout(() => {
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 2,  // جودة أعلى
        mimeType: 'image/png'
      });
      
      // إنشاء رابط تنزيل
      const link = document.createElement('a');
      link.download = 'تصميم-القالب.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // استعادة الحالة
      setGuidelines(tempGuidelines);
      setSelectedIds(tempSelectedIds);
    }, 100);
  };

  // معالجة عجلة الموس للتكبير/التصغير والتمرير الأفقي
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      // التكبير/التصغير
      e.preventDefault();
      const delta = e.deltaY;
      const scaleBy = delta > 0 ? 0.9 : 1.1;
      setStageScale(prev => Math.max(0.2, Math.min(4, prev * scaleBy)));
    } else if (e.shiftKey) {
      // التمرير الأفقي
      e.preventDefault();
      setStagePos(prev => ({ x: prev.x - e.deltaY, y: prev.y }));
    } else {
      // التمرير العمودي (سلوك افتراضي للمتصفح)
    }
  };

  // رسم حقل واحد
  const renderField = (field: FieldType) => {
    const pos = getFieldPosition(field);
    const style = field.style || {};
    
    // حساب حجم الخط كنسبة من حجم الصورة الأصلية
    // كما هو مستخدم في مولد الصورة على السيرفر تمامًا
    const fontSize = (style.fontSize || 24) * (imageSize.width / BASE_IMAGE_WIDTH);
    const fieldWidth = (style.width || 200) * (imageSize.width / BASE_IMAGE_WIDTH);
    const fieldHeight = (style.height || 100) * (imageSize.width / BASE_IMAGE_WIDTH);
    
    const isSelected = selectedIds.includes(field.id);

    if (field.type === 'text') {
      return (
        <Text
          text={field.label || field.name}
          fontSize={fontSize}
          fontFamily={style.fontFamily || 'Cairo'}
          fontStyle={style.fontWeight === 'bold' ? 'bold' : 'normal'}
          fill={style.color || '#1e293b'}
          align={style.align || 'center'}
          width={fieldWidth}
          offsetX={style.align === 'center' ? fieldWidth / 2 : 0}
          offsetY={fontSize / 2}
          stroke={isSelected ? '#3b82f6' : undefined}
          strokeWidth={isSelected ? 1 : 0}
        />
      );
    }
    
    if (field.type === 'image') {
      const imgWidth = style.imageMaxWidth || Math.round(imageSize.width / 4);
      const imgHeight = style.imageMaxHeight || Math.round(imageSize.height / 4);
      
      return (
        <Rect
          width={imgWidth}
          height={imgHeight}
          fill="#e0f2fe"
          stroke={isSelected ? "#3b82f6" : "#0ea5e9"}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={8}
          offsetX={imgWidth / 2}
          offsetY={imgHeight / 2}
        />
      );
    }
  };

  // رسم الشبكة إذا كانت مفعلة
  const renderGrid = () => {
    if (!isGridVisible) return null;
    
    const lines = [];
    
    // خطوط أفقية
    for (let i = 0; i <= imageSize.height; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, imageSize.width, i]}
          stroke="#cccccc"
          strokeWidth={i % (gridSize * 2) === 0 ? 0.5 : 0.3}
          opacity={0.5}
        />
      );
    }
    
    // خطوط عمودية
    for (let i = 0; i <= imageSize.width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, imageSize.height]}
          stroke="#cccccc"
          strokeWidth={i % (gridSize * 2) === 0 ? 0.5 : 0.3}
          opacity={0.5}
        />
      );
    }
    
    // خطوط منتصف الصورة
    lines.push(
      <Line
        key="center-h"
        points={[0, imageSize.height / 2, imageSize.width, imageSize.height / 2]}
        stroke="#ff0000"
        strokeWidth={0.8}
        opacity={0.5}
        dash={[5, 5]}
      />
    );
    lines.push(
      <Line
        key="center-v"
        points={[imageSize.width / 2, 0, imageSize.width / 2, imageSize.height]}
        stroke="#ff0000"
        strokeWidth={0.8}
        opacity={0.5}
        dash={[5, 5]}
      />
    );
    
    return lines;
  };

  // إضافة دالة التحقق من تحميل الصورة
  const isTemplateImageLoaded = backgroundImage !== null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[600px] overflow-auto border border-gray-300 rounded-md ${className || ''}`}
      onWheel={handleWheel}
    >
      {/* عرض رسالة جاري التحميل إذا كانت الصورة لم تحمل بعد */}
      {!isTemplateImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-10">
          <div className="p-4 bg-white rounded shadow-md text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-700">جاري تحميل صورة القالب...</p>
          </div>
        </div>
      )}

      <Stage
        ref={stageRef}
        width={imageSize.width}
        height={imageSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        style={{ backgroundColor: '#f9fafb' }}
        draggable={true} // إضافة القابلية للسحب للـ Stage
        onDragStart={e => {
          // منع التحديد عند سحب الـ Stage
          e.evt.stopPropagation();
        }}
        onDragMove={e => {
          // إخفاء الخطوط الإرشادية عند تحريك النموذج
          setGuidelines({});
        }}
      >
        <Layer>
          {backgroundImage && (
            <KonvaImage
              image={backgroundImage}
              width={imageSize.width}
              height={imageSize.height}
            />
          )}
        </Layer>

        <Layer>
          {renderGrid()}
        </Layer>

        <Layer>
          {fields.map((field) => (
            <Group
              key={field.id}
              x={getFieldPosition(field).x}
              y={getFieldPosition(field).y}
              draggable
              onClick={(e) => {
                // إذا كان Shift مضغوطًا أضف/احذف الحقل من التحديد
                if (e.evt.shiftKey) {
                  setSelectedIds(prev => 
                    prev.includes(field.id)
                      ? prev.filter(id => id !== field.id)
                      : [...prev, field.id]
                  );
                } else {
                  // وإلا حدد فقط هذا الحقل
                  setSelectedIds([field.id]);
                }
              }}
              onDragStart={() => {
                // إذا بدأنا السحب، احفظ الحالة الحالية للتراجع
                saveHistory();
                
                // تأكد من أن الحقل محدد
                if (!selectedIds.includes(field.id)) {
                  setSelectedIds([field.id]);
                }
              }}
              onDragMove={(e) => {
                const pos = { x: e.target.x(), y: e.target.y() };
                
                // استخدام وظيفة التجاذب المحسنة مع تمرير معرف الحقل الحالي
                if (snapToGrid) {
                  const snappedPos = applySnapToGuidelines(pos.x, pos.y, field.id);
                  e.target.position(snappedPos);
                } else {
                  // إذا كان التجاذب غير مفعل، إخفاء الخطوط الإرشادية
                  setGuidelines({});
                }
              }}
              onDragEnd={(e) => {
                const newX = (e.target.x() / imageSize.width) * 100;
                const newY = (e.target.y() / imageSize.height) * 100;
                
                // تحديد ما إذا كان الموضع منجذبًا للشبكة
                // أكثر دقة من التحقق السابق
                const currentSnapToGrid = snapToGrid && (
                  guidelines.x !== undefined || 
                  guidelines.y !== undefined || 
                  Math.abs(e.target.x() - Math.round(e.target.x() / gridSize) * gridSize) < snapThreshold ||
                  Math.abs(e.target.y() - Math.round(e.target.y() / gridSize) * gridSize) < snapThreshold
                );
                
                // تحديث جميع الحقول المحددة، وليس فقط الحقل الذي تم سحبه
                const updatedFields = fields.map(f => {
                  if (selectedIds.includes(f.id)) {
                    // إذا كان هذا هو الحقل الذي تم سحبه
                    if (f.id === field.id) {
                      return {
                        ...f,
                        position: {
                          x: parseFloat(newX.toFixed(2)),
                          y: parseFloat(newY.toFixed(2)),
                          snapToGrid: field.position.snapToGrid !== undefined 
                            ? field.position.snapToGrid 
                            : currentSnapToGrid
                        }
                      };
                    } 
                    // إذا كان هذا حقل آخر محدد، حافظ على وضعه الحالي
                    // ولكن تحديث القيمة snapToGrid
                    return {
                      ...f,
                      position: {
                        ...f.position,
                        snapToGrid: f.position.snapToGrid !== undefined 
                          ? f.position.snapToGrid 
                          : currentSnapToGrid
                      }
                    };
                  }
                  return f;
                });
                
                onFieldsChange(updatedFields);
                
                // إخفاء الخطوط الإرشادية
                setTimeout(() => {
                  setGuidelines({});
                }, 100);
              }}
            >
              {renderField(field)}
            </Group>
          ))}
        </Layer>

        <Layer>
          {guidelines.x !== undefined && (
            <Line 
              points={[guidelines.x, 0, guidelines.x, imageSize.height]} 
              // اختيار اللون بناءً على نوع الخط الإرشادي
              stroke={
                guidelines.xType === 'center' ? '#FF5555' : 
                guidelines.xType?.startsWith('field') ? '#3b82f6' : 
                '#22bb66'
              } 
              // جعل الخط منقط إلا في حالة المركز
              dash={guidelines.xType === 'center' ? undefined : [4, 4]} 
              opacity={0.8}
              strokeWidth={guidelines.xType === 'center' ? 1.0 : 0.8}
            />
          )}
          {guidelines.y !== undefined && (
            <Line 
              points={[0, guidelines.y, imageSize.width, guidelines.y]} 
              // اختيار اللون بناءً على نوع الخط الإرشادي
              stroke={
                guidelines.yType === 'center' ? '#FF5555' : 
                guidelines.yType?.startsWith('field') ? '#3b82f6' : 
                '#22bb66'
              }
              // جعل الخط منقط إلا في حالة المركز
              dash={guidelines.yType === 'center' ? undefined : [4, 4]} 
              opacity={0.8}
              strokeWidth={guidelines.yType === 'center' ? 1.0 : 0.8}
            />
          )}
        </Layer>
      </Stage>

      {/* شريط أدوات محسن */}
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <div className="flex gap-2 bg-white/90 p-2 rounded-md shadow-sm">
          <button 
            onClick={undo} 
            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
            disabled={history.length === 0}
            title="تراجع (Ctrl+Z)"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={redo} 
            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
            disabled={future.length === 0}
            title="إعادة (Ctrl+Y)"
          >
            <RotateCw size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1 my-auto"></div> {/* فاصل */}
          <button 
            onClick={() => setStageScale(s => Math.min(s + 0.1, 4))} 
            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            title="تكبير (+)"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            onClick={() => setStageScale(s => Math.max(s - 0.1, 0.2))} 
            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            title="تصغير (-)"
          >
            <ZoomOut size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1 my-auto"></div> {/* فاصل */}
          <button 
            onClick={() => setIsGridVisible(!isGridVisible)} 
            className={`p-2 rounded transition-colors ${isGridVisible ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="إظهار/إخفاء الشبكة"
          >
            <Grid size={16} />
          </button>
          <button 
            onClick={() => 
              onFieldsChange(fields.map(field => ({
                ...field,
                position: {
                  ...field.position,
                  snapToGrid: !snapToGrid
                }
              })))
            } 
            className={`p-2 rounded transition-colors ${snapToGrid ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="تفعيل/تعطيل التثبيت على الشبكة"
          >
            <Magnet size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1 my-auto"></div> {/* فاصل */}
          <button 
            onClick={exportImage} 
            className="p-2 rounded bg-green-100 hover:bg-green-200 transition-colors"
            title="تصدير الصورة كملف PNG"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* معلومات الحالة */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 px-2 py-1 rounded text-xs">
        <span>{Math.round(stageScale * 100)}% | </span>
        <span>{imageSize.width}×{imageSize.height}px</span>
        {selectedIds.length > 0 && (
          <span> | تم تحديد {selectedIds.length} حقل</span>
        )}
      </div>
      
      {/* تعليمات المستخدم */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-80 px-2 py-1 rounded text-xs max-w-xs text-right">
        <div className="text-gray-600 mb-1 font-semibold">تعليمات الاستخدام:</div>
        <div>• <span className="text-blue-600">Shift + النقر</span>: لتحديد حقول متعددة</div>
        <div>• <span className="text-blue-600">Ctrl+Z/Y</span>: للتراجع/الإعادة</div>
        <div>• <span className="text-blue-600">زر وسط الماوس</span>: لتحريك النموذج بالكامل</div>
        <div>• <span className="text-blue-600">Ctrl + عجلة الموس</span>: للتكبير/التصغير</div>
        <div>• <span className="text-blue-600">الأسهم</span>: لتحريك العناصر المحددة</div>
      </div>
    </div>
  );
};