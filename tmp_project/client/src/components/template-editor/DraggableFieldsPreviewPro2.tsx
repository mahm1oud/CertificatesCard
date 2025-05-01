/**
 * محرر حقول متقدم مع دعم الطبقات والتحكم المرئي
 * الإصدار 4.0 - أبريل 2025
 * 
 * ميزات جديدة:
 * - إدارة الطبقات (رفع/تنزيل Layer)
 * - حذف ونسخ الحقول
 * - إخفاء وإظهار الحقول
 * - تحجيم مباشر للحقول
 * - توافق 100% مع مولد الصور على السيرفر
 */

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group, Rect, Line, Transformer } from 'react-konva';
import { 
  Download, RotateCcw, RotateCw, ZoomIn, ZoomOut, Grid, Magnet, 
  Copy, Trash2, MoveUp, MoveDown, Eye, EyeOff
} from 'lucide-react';

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
  zIndex?: number; // إضافة دعم الطبقات
  visible?: boolean; // إضافة دعم الإخفاء
  rotation?: number; // إضافة دعم الدوران
  size?: { width: number; height: number }; // إضافة دعم التحجيم
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

export const DraggableFieldsPreviewPro2: React.FC<DraggableFieldsPreviewProProps> = ({
  templateImage,
  fields,
  onFieldsChange,
  editorSettings,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);

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
      
      // حذف العناصر المحددة
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
      
      // نسخ ولصق العناصر
      if (e.ctrlKey && e.key === 'c') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          handleDuplicateSelected();
        }
      }
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

  // -------------- إضافات جديدة --------------

  // تحديث ترتيب الطبقات (Layer Order)
  const updateLayerOrder = (fieldId: number, direction: 'up' | 'down') => {
    if (!fieldId) return;
    
    saveHistory();
    
    // استخراج الحقل المراد تحريكه
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;
    
    const sortedFields = [...fields].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const currentIndex = sortedFields.findIndex(f => f.id === fieldId);
    
    // تحديد الحقل الذي سنبادله
    let targetIndex;
    if (direction === 'up') {
      targetIndex = currentIndex + 1;
      if (targetIndex >= sortedFields.length) return; // لا يمكن الرفع أكثر
    } else {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) return; // لا يمكن الخفض أكثر
    }
    
    // تبادل قيم zIndex
    const currentZIndex = sortedFields[currentIndex].zIndex || 0;
    const targetZIndex = sortedFields[targetIndex].zIndex || 0;
    
    // تحديث مصفوفة الحقول
    const updatedFields = fields.map(field => {
      if (field.id === fieldId) {
        return { ...field, zIndex: targetZIndex };
      } else if (field.id === sortedFields[targetIndex].id) {
        return { ...field, zIndex: currentZIndex };
      }
      return field;
    });
    
    onFieldsChange(updatedFields);
  };

  // تحديث رؤية الحقل (ظاهر/مخفي)
  const toggleFieldVisibility = (fieldId: number) => {
    if (!fieldId) return;
    
    saveHistory();
    
    const updatedFields = fields.map(field => {
      if (field.id === fieldId) {
        return { ...field, visible: field.visible === false ? true : false };
      }
      return field;
    });
    
    onFieldsChange(updatedFields);
  };

  // حذف الحقول المحددة
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    const updatedFields = fields.filter(field => !selectedIds.includes(field.id));
    setSelectedIds([]);
    
    onFieldsChange(updatedFields);
  };

  // نسخ الحقول المحددة
  const handleDuplicateSelected = () => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    const selectedFields = fields.filter(field => selectedIds.includes(field.id));
    const maxId = Math.max(...fields.map(f => f.id), 0);
    
    const duplicatedFields = selectedFields.map((field, index) => {
      // إنشاء نسخة مع معرف جديد
      return {
        ...JSON.parse(JSON.stringify(field)),
        id: maxId + index + 1,
        position: {
          ...field.position,
          x: field.position.x + 3, // إزاحة بسيطة للتمييز بين الأصل والنسخة
          y: field.position.y + 3
        }
      };
    });
    
    const updatedFields = [...fields, ...duplicatedFields];
    
    // اختيار النسخ الجديدة
    setSelectedIds(duplicatedFields.map(f => f.id));
    
    onFieldsChange(updatedFields);
  };

  // تحديث حجم العنصر بعد التحويل
  const handleTransformEnd = (fieldId: number, newProps: any) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    saveHistory();
    
    const { x, y, width, height, rotation } = newProps;
    
    // تحويل إلى نسب مئوية
    const updatedField = {
      ...field,
      position: {
        x: parseFloat(((x / imageSize.width) * 100).toFixed(2)),
        y: parseFloat(((y / imageSize.height) * 100).toFixed(2)),
        snapToGrid: field.position.snapToGrid
      },
      size: {
        width,
        height
      },
      rotation: rotation
    };
    
    const updatedFields = fields.map(f => f.id === fieldId ? updatedField : f);
    onFieldsChange(updatedFields);
  };

  // رسم حقل واحد
  const renderField = (field: FieldType) => {
    // تجاهل الحقول المخفية
    if (field.visible === false) return null;
    
    const pos = getFieldPosition(field);
    const style = field.style || {};
    
    // حساب حجم الخط كنسبة من حجم الصورة الأصلية
    // كما هو مستخدم في مولد الصورة على السيرفر تمامًا
    const fontSize = (style.fontSize || 24) * (imageSize.width / BASE_IMAGE_WIDTH);
    const fieldWidth = field.size?.width || (style.width || 200) * (imageSize.width / BASE_IMAGE_WIDTH);
    const fieldHeight = field.size?.height || (style.height || 100) * (imageSize.width / BASE_IMAGE_WIDTH);
    
    const isSelected = selectedIds.includes(field.id);
    const fieldRotation = field.rotation || 0;

    if (field.type === 'text') {
      return (
        <Text
          key={field.id}
          id={`field-${field.id}`}
          text={field.label || field.name}
          fontSize={fontSize}
          fontFamily={style.fontFamily || 'Cairo'}
          fontStyle={style.fontWeight === 'bold' ? 'bold' : 'normal'}
          fill={style.color || '#000000'}
          align={style.align || 'center'}
          width={fieldWidth}
          height={fieldHeight}
          wrap="word"
          x={pos.x}
          y={pos.y}
          rotation={fieldRotation}
          shadowColor={style.textShadow?.enabled ? (style.textShadow?.color || '#000000') : 'transparent'}
          shadowBlur={style.textShadow?.enabled ? (style.textShadow?.blur || 3) : 0}
          perfectDrawEnabled={true}
          draggable={true}
          onClick={() => {
            setSelectedIds([field.id]);
          }}
          onDragStart={() => {
            if (!selectedIds.includes(field.id)) {
              setSelectedIds([field.id]);
            }
          }}
          onDragEnd={(e) => {
            // تحويل من بكسل إلى نسبة مئوية
            const newX = parseFloat(((e.target.x() / imageSize.width) * 100).toFixed(2));
            const newY = parseFloat(((e.target.y() / imageSize.height) * 100).toFixed(2));
            
            // تطبيق التغييرات
            const updatedField = {
              ...field,
              position: {
                x: newX,
                y: newY,
                snapToGrid: field.position.snapToGrid
              }
            };
            
            // تحديث الحقول
            saveHistory();
            const updatedFields = fields.map(f => f.id === field.id ? updatedField : f);
            onFieldsChange(updatedFields);
          }}
        />
      );
    } else if (field.type === 'image') {
      // حقول الصور تعرض مربع يمثل الصورة
      return (
        <Rect
          key={field.id}
          id={`field-${field.id}`}
          x={pos.x}
          y={pos.y}
          width={fieldWidth}
          height={fieldHeight}
          fill="rgba(200, 200, 255, 0.3)"
          stroke="#aaa"
          strokeWidth={1}
          cornerRadius={style.imageRounded ? Math.min(fieldWidth, fieldHeight) / 10 : 0}
          perfectDrawEnabled={true}
          draggable={true}
          rotation={fieldRotation}
          onClick={() => {
            setSelectedIds([field.id]);
          }}
          onDragStart={() => {
            if (!selectedIds.includes(field.id)) {
              setSelectedIds([field.id]);
            }
          }}
          onDragEnd={(e) => {
            // تحويل من بكسل إلى نسبة مئوية
            const newX = parseFloat(((e.target.x() / imageSize.width) * 100).toFixed(2));
            const newY = parseFloat(((e.target.y() / imageSize.height) * 100).toFixed(2));
            
            // تطبيق التغييرات
            const updatedField = {
              ...field,
              position: {
                x: newX,
                y: newY,
                snapToGrid: field.position.snapToGrid
              }
            };
            
            // تحديث الحقول
            saveHistory();
            const updatedFields = fields.map(f => f.id === field.id ? updatedField : f);
            onFieldsChange(updatedFields);
          }}
        />
      );
    }
    
    return null;
  };

  // ترتيب الحقول حسب zIndex
  const sortedFields = [...fields].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-4">
        {/* أزرار الإجراءات والأدوات */}
        <div className="flex gap-2 mb-3">
          <button 
            onClick={() => setStageScale(s => Math.min(s + 0.1, 4))} 
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded"
            title="تكبير"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={() => setStageScale(s => Math.max(s - 0.1, 0.2))} 
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded"
            title="تصغير"
          >
            <ZoomOut size={18} />
          </button>
          <button 
            onClick={() => setIsGridVisible(!isGridVisible)} 
            className={`p-2 ${isGridVisible ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'} rounded`}
            title="إظهار/إخفاء الشبكة"
          >
            <Grid size={18} />
          </button>
          <button 
            onClick={exportImage} 
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded"
            title="تصدير كصورة"
          >
            <Download size={18} />
          </button>
        </div>
        
        {/* أزرار التحرير عند تحديد حقل */}
        {selectedIds.length > 0 && (
          <div className="flex gap-2 mb-3">
            <button 
              onClick={handleDuplicateSelected} 
              className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded" 
              title="نسخ"
            >
              <Copy size={18} />
            </button>
            <button 
              onClick={handleDeleteSelected} 
              className="p-2 bg-red-100 hover:bg-red-200 rounded" 
              title="حذف"
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={() => selectedIds.length === 1 && updateLayerOrder(selectedIds[0], 'up')} 
              className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded" 
              title="طبقة للأمام"
            >
              <MoveUp size={18} />
            </button>
            <button 
              onClick={() => selectedIds.length === 1 && updateLayerOrder(selectedIds[0], 'down')} 
              className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded" 
              title="طبقة للخلف"
            >
              <MoveDown size={18} />
            </button>
            <button 
              onClick={() => selectedIds.length === 1 && toggleFieldVisibility(selectedIds[0])} 
              className="p-2 bg-purple-100 hover:bg-purple-200 rounded" 
              title="إظهار/إخفاء"
            >
              {selectedIds.length === 1 && fields.find(f => f.id === selectedIds[0])?.visible === false ? (
                <Eye size={18} />
              ) : (
                <EyeOff size={18} />
              )}
            </button>
          </div>
        )}
      </div>
      
      <div className="relative border rounded-lg overflow-hidden" onWheel={handleWheel}>
        <Stage
          ref={stageRef}
          width={imageSize.width}
          height={imageSize.height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          onClick={(e) => {
            // إلغاء تحديد العناصر عند النقر على منطقة فارغة
            if (e.target === e.currentTarget) {
              setSelectedIds([]);
            }
          }}
        >
          <Layer>
            {/* صورة الخلفية (القالب) */}
            {backgroundImage && (
              <KonvaImage
                image={backgroundImage}
                width={imageSize.width}
                height={imageSize.height}
                x={0}
                y={0}
                listening={false}
              />
            )}
            
            {/* رسم الشبكة */}
            {isGridVisible && gridEnabled && (
              <>
                {/* خطوط الشبكة الأفقية */}
                {Array.from({ length: Math.ceil(imageSize.height / gridSize) + 1 }).map((_, i) => (
                  <Line
                    key={`grid-h-${i}`}
                    points={[0, i * gridSize, imageSize.width, i * gridSize]}
                    stroke="rgba(200, 200, 200, 0.3)"
                    strokeWidth={1}
                    perfectDrawEnabled={true}
                    listening={false}
                  />
                ))}
                
                {/* خطوط الشبكة العمودية */}
                {Array.from({ length: Math.ceil(imageSize.width / gridSize) + 1 }).map((_, i) => (
                  <Line
                    key={`grid-v-${i}`}
                    points={[i * gridSize, 0, i * gridSize, imageSize.height]}
                    stroke="rgba(200, 200, 200, 0.3)"
                    strokeWidth={1}
                    perfectDrawEnabled={true}
                    listening={false}
                  />
                ))}
                
                {/* خطوط المنتصف (أكثر وضوحًا) */}
                <Line
                  points={[imageSize.width / 2, 0, imageSize.width / 2, imageSize.height]}
                  stroke="rgba(100, 100, 255, 0.5)"
                  strokeWidth={1}
                  dash={[5, 5]}
                  perfectDrawEnabled={true}
                  listening={false}
                />
                <Line
                  points={[0, imageSize.height / 2, imageSize.width, imageSize.height / 2]}
                  stroke="rgba(100, 100, 255, 0.5)"
                  strokeWidth={1}
                  dash={[5, 5]}
                  perfectDrawEnabled={true}
                  listening={false}
                />
              </>
            )}
            
            {/* رسم الحقول مرتبة حسب zIndex */}
            {sortedFields.map(field => renderField(field))}
            
            {/* رسم خطوط التوجيه للتجاذب */}
            {snapToGrid && (
              <>
                {guidelines.x !== undefined && (
                  <Line
                    points={[guidelines.x, 0, guidelines.x, imageSize.height]}
                    stroke={
                      guidelines.xType === 'center' ? 'rgba(255, 0, 0, 0.7)' : 
                      guidelines.xType === 'field' ? 'rgba(0, 100, 255, 0.7)' : 
                      'rgba(0, 255, 0, 0.7)'
                    }
                    strokeWidth={1}
                    dash={[4, 4]}
                    perfectDrawEnabled={true}
                    listening={false}
                  />
                )}
                
                {guidelines.y !== undefined && (
                  <Line
                    points={[0, guidelines.y, imageSize.width, guidelines.y]}
                    stroke={
                      guidelines.yType === 'center' ? 'rgba(255, 0, 0, 0.7)' : 
                      guidelines.yType === 'field' ? 'rgba(0, 100, 255, 0.7)' : 
                      'rgba(0, 255, 0, 0.7)'
                    }
                    strokeWidth={1}
                    dash={[4, 4]}
                    perfectDrawEnabled={true}
                    listening={false}
                  />
                )}
              </>
            )}
            
            {/* Transformer للتحجيم */}
            {selectedIds.length === 1 && (
              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // التأكد من أن الحجم الجديد ضمن الحدود المعقولة
                  if (newBox.width < 10 || newBox.height < 10) {
                    return oldBox;
                  }
                  return newBox;
                }}
                rotateEnabled={true}
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                // اختيار العنصر المناسب للتحويل
                node={stageRef.current?.findOne(`#field-${selectedIds[0]}`)}
                onTransformEnd={() => {
                  // الحصول على المرجع للعنصر
                  const fieldNode = stageRef.current?.findOne(`#field-${selectedIds[0]}`);
                  if (!fieldNode) return;
                  
                  // الحصول على الخصائص بعد التحويل
                  const newProps = {
                    x: fieldNode.x(),
                    y: fieldNode.y(),
                    width: fieldNode.width() * fieldNode.scaleX(),
                    height: fieldNode.height() * fieldNode.scaleY(),
                    rotation: fieldNode.rotation()
                  };
                  
                  // إعادة تعيين مقياس العنصر
                  fieldNode.scaleX(1);
                  fieldNode.scaleY(1);
                  
                  // تحديث الحقل في مصفوفة الحقول
                  handleTransformEnd(selectedIds[0], newProps);
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>
      
      {/* معلومات الحقل المحدد */}
      {selectedIds.length === 1 && (
        <div className="mt-4 p-3 bg-gray-50 rounded border">
          <h3 className="text-sm font-bold mb-2">معلومات الحقل</h3>
          <div className="text-xs">
            {(() => {
              const field = fields.find(f => f.id === selectedIds[0]);
              if (!field) return null;
              
              return (
                <>
                  <div>الاسم: {field.name}</div>
                  <div>النوع: {field.type === 'text' ? 'نص' : 'صورة'}</div>
                  <div>الموضع: {field.position.x.toFixed(1)}%, {field.position.y.toFixed(1)}%</div>
                  {field.rotation && <div>الدوران: {field.rotation.toFixed(1)}°</div>}
                  {field.type === 'text' && field.style?.fontSize && (
                    <div>حجم الخط: {field.style.fontSize}px</div>
                  )}
                  {field.type === 'text' && field.style?.fontFamily && (
                    <div>الخط: {field.style.fontFamily}</div>
                  )}
                  {field.visible === false && <div className="text-red-500">مخفي</div>}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggableFieldsPreviewPro2;