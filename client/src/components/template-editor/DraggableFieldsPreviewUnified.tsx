/**
 * مكون معاينة الحقول القابلة للسحب - النسخة الموحدة
 * الإصدار 5.0 - مايو 2025
 * 
 * هذا المكون يجمع بين مميزات المكونات السابقة:
 * - DraggableFieldsPreviewPro: وظائف السحب، التجاذب، الشبكة
 * - DraggableFieldsPreviewPro2: دعم الطبقات، تحجيم مباشر، إخفاء وإظهار
 * 
 * مع ضمان التوافق 100% مع مولد الصور على السيرفر
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
 * 3. `BASE_IMAGE_WIDTH` في جميع مكونات معاينة الحقول
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
  labelAr?: string;
  type: 'text' | 'image' | 'dropdown' | 'radio';
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: any;
  zIndex?: number; // دعم الطبقات
  visible?: boolean; // دعم الإخفاء
  rotation?: number; // دعم الدوران
  size?: { width: number; height: number }; // دعم التحجيم المباشر
  templateId?: number;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  placeholderAr?: string;
  options?: { value: string; label: string }[];
}

interface DraggableFieldsPreviewUnifiedProps {
  templateImage: string;
  fields: FieldType[];
  onFieldsChange: (fields: FieldType[]) => void;
  editorSettings?: EditorSettings;
  width?: number;
  height?: number;
  className?: string;
  showControls?: boolean; // إمكانية إخفاء شريط التحكم
  allowMultipleSelection?: boolean; // دعم تحديد متعدد
  allowResize?: boolean; // السماح بتغيير الحجم مباشرة
  onImageExport?: (dataUrl: string) => void; // استدعاء عند تصدير الصورة
}

export const DraggableFieldsPreviewUnified: React.FC<DraggableFieldsPreviewUnifiedProps> = ({
  templateImage,
  fields,
  onFieldsChange,
  editorSettings,
  className,
  showControls = true,
  allowMultipleSelection = true,
  allowResize = true,
  onImageExport
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

  // إضافات موحدة من المكونات السابقة
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [history, setHistory] = useState<FieldType[][]>([]);
  const [future, setFuture] = useState<FieldType[][]>([]);
  const [isGridVisible, setIsGridVisible] = useState<boolean>(
    editorSettings?.gridEnabled !== undefined ? editorSettings.gridEnabled : true
  );
  const [magnetEnabled, setMagnetEnabled] = useState<boolean>(
    editorSettings?.snapToGrid !== undefined ? editorSettings.snapToGrid : true
  );

  // إعدادات الشبكة والتجاذب من الخارج
  const gridSize = editorSettings?.gridSize || 50;
  const snapThreshold = editorSettings?.snapThreshold || 10;
  const gridEnabled = editorSettings?.gridEnabled !== undefined ? editorSettings.gridEnabled : true;
  const snapToGrid = magnetEnabled && (editorSettings?.snapToGrid !== undefined ? editorSettings.snapToGrid : true);

  // تحميل صورة القالب وضبط أبعاد Stage ليطابق أبعاد الصورة تمامًا (1:1)
  useEffect(() => {
    // دالة لتحميل صورة وإعداد إعدادات العرض
    const loadImage = (src: string) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        console.log(`تم تحميل الصورة بأبعاد: ${img.width}x${img.height}`);
        
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
      
      // معالجة خطأ تحميل الصورة
      img.onerror = (e) => {
        console.error(`فشل تحميل الصورة: ${src}`, e);
        
        // إذا فشل تحميل صورة القالب، نحاول تحميل الصورة الافتراضية (شعار الموقع)
        if (src !== '/logo.svg') {
          console.log('⚠️ جاري تحميل الصورة الافتراضية (شعار الموقع)...');
          loadImage('/logo.svg');
        }
      };
      
      // بدء تحميل الصورة
      img.src = src;
    };
    
    // محاولة تحميل صورة القالب أولًا
    loadImage(templateImage);
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
      
      // استخدام واجهة الاستدعاء إذا كانت موجودة
      if (onImageExport) {
        onImageExport(dataURL);
      } else {
        // إنشاء رابط تنزيل
        const link = document.createElement('a');
        link.download = 'تصميم-القالب.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
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

  // تحديد حقل
  const handleSelect = (fieldId: number, isMultiSelect: boolean = false) => {
    // إذا كان الحقل محدداً بالفعل
    if (selectedIds.includes(fieldId)) {
      if (isMultiSelect || allowMultipleSelection) {
        // إلغاء تحديد الحقل المحدد فقط
        setSelectedIds(selectedIds.filter(id => id !== fieldId));
      } else {
        // تحديد الحقل فقط (النقر مرة أخرى على عنصر محدد)
        setSelectedIds([fieldId]);
      }
    } else {
      if (isMultiSelect && allowMultipleSelection) {
        // إضافة إلى التحديد الحالي
        setSelectedIds([...selectedIds, fieldId]);
      } else {
        // تحديد هذا الحقل فقط
        setSelectedIds([fieldId]);
      }
    }
  };

  // إلغاء تحديد جميع الحقول
  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // سحب الحقل
  const handleDragStart = (e: any, field: FieldType) => {
    e.cancelBubble = true;
    
    // إذا كان هذا حقل غير محدد، وليس تحديداً متعدداً، حدده وحده
    if (!selectedIds.includes(field.id) && !e.evt.ctrlKey && !e.evt.shiftKey) {
      setSelectedIds([field.id]);
    }
    
    saveHistory();
  };

  // نقل الحقل
  const handleDragMove = (e: any, field: FieldType) => {
    e.cancelBubble = true;
    
    // تحديث الخطوط الإرشادية للتجاذب
    if (snapToGrid) {
      const pos = e.target.position();
      applySnapToGuidelines(pos.x, pos.y, field.id);
    }
  };

  // انتهاء سحب الحقل
  const handleDragEnd = (e: any, field: FieldType) => {
    e.cancelBubble = true;
    
    // الحصول على موضع النقطة النهائي
    const pos = e.target.position();
    
    // تطبيق التجاذب إذا كان مفعلاً
    const snappedPos = snapToGrid ? applySnapToGuidelines(pos.x, pos.y, field.id) : pos;
    
    // تحديث جميع الحقول المحددة (إذا كان هناك أكثر من واحد)
    if (selectedIds.length > 1 && selectedIds.includes(field.id)) {
      const deltaX = snappedPos.x - getFieldPosition(field).x;
      const deltaY = snappedPos.y - getFieldPosition(field).y;
      
      const updatedFields = fields.map(f => {
        if (selectedIds.includes(f.id)) {
          // تطبيق نفس الإزاحة على جميع الحقول المحددة
          const pos = getFieldPosition(f);
          const newPos = {
            x: pos.x + deltaX,
            y: pos.y + deltaY
          };
          
          // تحويل من بكسل إلى نسبة مئوية
          return {
            ...f,
            position: {
              x: parseFloat(((newPos.x / imageSize.width) * 100).toFixed(2)),
              y: parseFloat(((newPos.y / imageSize.height) * 100).toFixed(2)),
              snapToGrid: f.position.snapToGrid
            }
          };
        }
        return f;
      });
      
      onFieldsChange(updatedFields);
    } else {
      // تحديث حقل واحد فقط
      const updatedFields = fields.map(f => {
        if (f.id === field.id) {
          // تحويل من بكسل إلى نسبة مئوية
          return {
            ...f,
            position: {
              x: parseFloat(((snappedPos.x / imageSize.width) * 100).toFixed(2)),
              y: parseFloat(((snappedPos.y / imageSize.height) * 100).toFixed(2)),
              snapToGrid: f.position.snapToGrid
            }
          };
        }
        return f;
      });
      
      onFieldsChange(updatedFields);
    }
    
    // مسح خطوط التوجيه بعد الانتهاء من السحب
    setGuidelines({});
  };

  // تغيير حجم العنصر مع المحول (Transformer)
  const handleTransform = (e: any) => {
    if (!allowResize || selectedIds.length === 0) return;
    
    const fieldId = selectedIds[0]; // نستخدم الأول فقط - لأن المحول يدعم عنصراً واحداً فقط
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    // الحصول على الحجم الجديد من المحول
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // إعادة تعيين المقياس إلى 1 (لمنع تراكم التحويلات)
    node.scaleX(1);
    node.scaleY(1);
    
    // حساب الحجم الجديد بناءً على المقياس
    const style = field.style || {};
    let width = style.maxWidth || 200;
    let height = style.maxHeight || 100;
    
    // تحديث الحجم
    const updatedFields = fields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          style: {
            ...f.style,
            maxWidth: Math.round(width * scaleX),
            maxHeight: Math.round(height * scaleY)
          }
        };
      }
      return f;
    });
    
    onFieldsChange(updatedFields);
  };

  // رسم حقل واحد
  const renderField = (field: FieldType) => {
    // إذا كان الحقل مخفياً، لا ترسمه
    if (field.visible === false) return null;
    
    const pos = getFieldPosition(field);
    const style = field.style || {};
    
    // حساب حجم الخط كنسبة من حجم الصورة الأصلية
    // كما هو مستخدم في مولد الصورة على السيرفر تمامًا
    const fontSize = (style.fontSize || 24) * (imageSize.width / BASE_IMAGE_WIDTH);
    const fieldWidth = (style.width || 200) * (imageSize.width / BASE_IMAGE_WIDTH);
    const fieldHeight = (style.height || 100) * (imageSize.width / BASE_IMAGE_WIDTH);
    
    const isSelected = selectedIds.includes(field.id);
    
    // دعم الدوران
    const rotation = field.rotation || 0;

    if (field.type === 'text') {
      return (
        <Text
          text={field.label || field.name}
          fontSize={fontSize}
          fontFamily={style.fontFamily || 'Cairo'}
          fontStyle={style.fontWeight === 'bold' ? 'bold' : 'normal'}
          fill={style.color || '#000000'}
          align={style.align || 'center'}
          width={fieldWidth}
          x={pos.x}
          y={pos.y}
          draggable
          rotation={rotation}
          offsetX={style.align === 'center' ? fieldWidth / 2 : 0}
          offsetY={fontSize / 2}
          onDragStart={(e) => handleDragStart(e, field)}
          onDragMove={(e) => handleDragMove(e, field)}
          onDragEnd={(e) => handleDragEnd(e, field)}
          onClick={(e) => handleSelect(field.id, e.evt.ctrlKey || e.evt.shiftKey)}
          onTap={() => handleSelect(field.id)}
          shadowColor={style.textShadow?.enabled ? (style.textShadow?.color || 'rgba(0,0,0,0.5)') : 'transparent'}
          shadowBlur={style.textShadow?.enabled ? (style.textShadow?.blur || 3) : 0}
          shadowOffset={{ x: 0, y: 0 }}
        />
      );
    } else if (field.type === 'image') {
      // حساب أبعاد الصورة
      const imgWidth = style.imageMaxWidth || Math.round(imageSize.width / 4);
      const imgHeight = style.imageMaxHeight || Math.round(imageSize.height / 4);
      
      return (
        <Rect
          x={pos.x}
          y={pos.y}
          width={imgWidth}
          height={imgHeight}
          offsetX={imgWidth / 2}
          offsetY={imgHeight / 2}
          fill={style.backgroundColor || 'rgba(200, 200, 200, 0.3)'}
          stroke="#aaa"
          strokeWidth={1}
          draggable
          rotation={rotation}
          onDragStart={(e) => handleDragStart(e, field)}
          onDragMove={(e) => handleDragMove(e, field)}
          onDragEnd={(e) => handleDragEnd(e, field)}
          onClick={(e) => handleSelect(field.id, e.evt.ctrlKey || e.evt.shiftKey)}
          onTap={() => handleSelect(field.id)}
          // إضافة خصائص الصورة
          cornerRadius={style.imageRounded ? 10 : 0}
        />
      );
    }
    
    return null;
  };

  // رسم مستطيل التحديد للعناصر المحددة
  const renderSelectionRect = (field: FieldType) => {
    if (!selectedIds.includes(field.id)) return null;
    
    const pos = getFieldPosition(field);
    const style = field.style || {};
    
    // حساب الأبعاد
    let width, height;
    if (field.type === 'text') {
      const fontSize = (style.fontSize || 24) * (imageSize.width / BASE_IMAGE_WIDTH);
      width = (style.width || 200) * (imageSize.width / BASE_IMAGE_WIDTH);
      height = fontSize * 1.2; // ارتفاع تقريبي للنص
    } else if (field.type === 'image') {
      width = style.imageMaxWidth || Math.round(imageSize.width / 4);
      height = style.imageMaxHeight || Math.round(imageSize.height / 4);
    } else {
      width = 100;
      height = 100;
    }
    
    // تعديل موضع المستطيل حسب المحاذاة
    let offsetX = 0;
    if (field.type === 'text' && style.align === 'center') {
      offsetX = width / 2;
    }
    
    // دعم الدوران
    const rotation = field.rotation || 0;
    
    return (
      <Rect
        x={pos.x}
        y={pos.y}
        width={width}
        height={height}
        offsetX={offsetX}
        offsetY={field.type === 'text' ? ((style.fontSize || 24) * (imageSize.width / BASE_IMAGE_WIDTH)) / 2 : height / 2}
        stroke="#3498db"
        strokeWidth={2}
        dash={[5, 5]}
        rotation={rotation}
        fillEnabled={false}
      />
    );
  };

  // إضافة الميزات المتقدمة

  // حذف العناصر المحددة
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // حذف العناصر المحددة
    const updatedFields = fields.filter(field => !selectedIds.includes(field.id));
    onFieldsChange(updatedFields);
    
    // مسح التحديد
    setSelectedIds([]);
  };

  // نسخ العناصر المحددة
  const handleDuplicateSelected = () => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // البحث عن أكبر معرف موجود لتجنب التكرار
    const maxId = Math.max(...fields.map(f => f.id), 0);
    
    // إنشاء نسخ مع معرفات جديدة وإزاحة قليلة
    const copiedFields = selectedIds.map(id => {
      const original = fields.find(f => f.id === id);
      if (!original) return null;
      
      // إزاحة النسخة قليلاً للتمييز عن الأصل
      const newPosition = {
        x: Math.min(99, original.position.x + 2),
        y: Math.min(99, original.position.y + 2),
        snapToGrid: original.position.snapToGrid
      };
      
      // إنشاء نسخة جديدة
      return {
        ...original,
        id: maxId + 1 + selectedIds.indexOf(id), // معرف فريد جديد
        position: newPosition,
        name: `${original.name}_copy`
      };
    }).filter(Boolean) as FieldType[];
    
    // دمج العناصر المنسوخة مع القائمة الحالية
    const updatedFields = [...fields, ...copiedFields];
    onFieldsChange(updatedFields);
    
    // تحديد العناصر المنسوخة الجديدة
    setSelectedIds(copiedFields.map(f => f.id));
  };

  // تغيير ترتيب طبقة العناصر المحددة (رفع/خفض)
  const handleChangeLayer = (direction: 'up' | 'down') => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    const updatedFields = [...fields];
    
    if (direction === 'up') {
      // رفع الطبقة بترتيب العناصر في المصفوفة
      selectedIds.forEach(id => {
        const index = updatedFields.findIndex(f => f.id === id);
        if (index < updatedFields.length - 1) {
          // تبادل هذا العنصر مع العنصر التالي
          [updatedFields[index], updatedFields[index + 1]] = [updatedFields[index + 1], updatedFields[index]];
        }
      });
    } else {
      // خفض الطبقة (معكوس التسلسل لتجنب تعارض العمليات)
      [...selectedIds].reverse().forEach(id => {
        const index = updatedFields.findIndex(f => f.id === id);
        if (index > 0) {
          // تبادل هذا العنصر مع العنصر السابق
          [updatedFields[index], updatedFields[index - 1]] = [updatedFields[index - 1], updatedFields[index]];
        }
      });
    }
    
    onFieldsChange(updatedFields);
  };

  // تغيير حالة الرؤية للعناصر المحددة
  const handleToggleVisibility = () => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // تبديل حالة الرؤية (إخفاء/إظهار)
    const areAllVisible = selectedIds.every(id => {
      const field = fields.find(f => f.id === id);
      return field && field.visible !== false;
    });
    
    // تحديث الحقول
    const updatedFields = fields.map(field => {
      if (selectedIds.includes(field.id)) {
        return {
          ...field,
          visible: !areAllVisible
        };
      }
      return field;
    });
    
    onFieldsChange(updatedFields);
  };
  
  // تدوير العناصر المحددة
  const handleRotate = (degrees: number) => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // تحديث الحقول بإضافة درجات التدوير إلى الدوران الحالي
    const updatedFields = fields.map(field => {
      if (selectedIds.includes(field.id)) {
        const currentRotation = field.rotation || 0;
        const newRotation = (currentRotation + degrees) % 360; // تأكد من أن الدوران بين 0 و 359 درجة
        
        return {
          ...field,
          rotation: newRotation
        };
      }
      return field;
    });
    
    onFieldsChange(updatedFields);
    
    toast?.({
      title: "تم تدوير العناصر",
      description: `تم تدوير ${selectedIds.length} عنصر بمقدار ${degrees} درجة`,
      duration: 2000
    });
  };
  
  // تغيير حجم العناصر المحددة
  const handleResize = (scale: number) => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // تحديث الحقول بتطبيق نسبة التكبير/التصغير
    const updatedFields = fields.map(field => {
      if (selectedIds.includes(field.id)) {
        if (field.type === 'text') {
          // للنصوص، نقوم بتكبير/تصغير حجم الخط والعرض الأقصى
          const style = field.style || {};
          const fontSize = style.fontSize || 24;
          const maxWidth = style.maxWidth || 200;
          
          return {
            ...field,
            style: {
              ...style,
              fontSize: Math.max(8, Math.round(fontSize * scale)), // الحد الأدنى لحجم الخط هو 8
              maxWidth: Math.max(50, Math.round(maxWidth * scale)) // الحد الأدنى للعرض هو 50
            }
          };
        } else if (field.type === 'image') {
          // للصور، نقوم بتكبير/تصغير الحجم الأقصى للصورة
          const style = field.style || {};
          const imageMaxWidth = style.imageMaxWidth || Math.round(imageSize.width / 4);
          const imageMaxHeight = style.imageMaxHeight || Math.round(imageSize.height / 4);
          
          return {
            ...field,
            style: {
              ...style,
              imageMaxWidth: Math.max(20, Math.round(imageMaxWidth * scale)), // الحد الأدنى لعرض الصورة هو 20
              imageMaxHeight: Math.max(20, Math.round(imageMaxHeight * scale)) // الحد الأدنى لارتفاع الصورة هو 20
            }
          };
        }
      }
      return field;
    });
    
    onFieldsChange(updatedFields);
    
    toast?.({
      title: scale > 1 ? "تم تكبير العناصر" : "تم تصغير العناصر",
      description: `تم تغيير حجم ${selectedIds.length} عنصر بنسبة ${(scale * 100 - 100).toFixed(0)}%`,
      duration: 2000
    });
  };

  // تحديد لون الخط الإرشادي حسب النوع
  const getGuidelineColor = (type: string = '') => {
    if (type === 'center') return '#ff3333'; // أحمر للمركز
    if (type.includes('field')) return '#3366ff'; // أزرق للحقول الأخرى
    return '#33cc33'; // أخضر للشبكة
  };

  return (
    <div className={`draggable-fields-preview-unified ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* شريط أدوات المحرر */}
      {showControls && (
        <div className="editor-toolbar bg-neutral-100 p-2 mb-2 rounded-md flex gap-2 items-center flex-wrap">
          {/* التراجع والإعادة */}
          <button 
            className={`p-1 rounded ${history.length > 0 ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={undo}
            disabled={history.length === 0}
            title="التراجع عن آخر تغيير (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button 
            className={`p-1 rounded ${future.length > 0 ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={redo}
            disabled={future.length === 0}
            title="إعادة التغيير (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          
          {/* التكبير والتصغير */}
          <button 
            className="p-1 rounded bg-blue-100 hover:bg-blue-200"
            onClick={() => setStageScale(s => Math.min(s + 0.1, 4))}
            title="تكبير (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button 
            className="p-1 rounded bg-blue-100 hover:bg-blue-200"
            onClick={() => setStageScale(s => Math.max(s - 0.1, 0.2))}
            title="تصغير (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          
          {/* إظهار/إخفاء الشبكة */}
          <button 
            className={`p-1 rounded ${isGridVisible ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setIsGridVisible(!isGridVisible)}
            title="إظهار/إخفاء الشبكة"
          >
            <Grid className="w-4 h-4" />
          </button>
          
          {/* تفعيل/تعطيل التجاذب */}
          <button 
            className={`p-1 rounded ${magnetEnabled ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setMagnetEnabled(!magnetEnabled)}
            title="تفعيل/تعطيل التجاذب"
          >
            <Magnet className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          
          {/* أدوات التحكم بالعناصر */}
          <button 
            className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => handleDuplicateSelected()}
            disabled={selectedIds.length === 0}
            title="نسخ العناصر المحددة (Ctrl+C)"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button 
            className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-red-100 hover:bg-red-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => handleDeleteSelected()}
            disabled={selectedIds.length === 0}
            title="حذف العناصر المحددة (Delete)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          
          {/* التحكم في الطبقات */}
          <button 
            className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-purple-100 hover:bg-purple-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => handleChangeLayer('up')}
            disabled={selectedIds.length === 0}
            title="رفع الطبقة"
          >
            <MoveUp className="w-4 h-4" />
          </button>
          
          <button 
            className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-purple-100 hover:bg-purple-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => handleChangeLayer('down')}
            disabled={selectedIds.length === 0}
            title="خفض الطبقة"
          >
            <MoveDown className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          
          {/* التحكم في الرؤية */}
          <button 
            className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-yellow-100 hover:bg-yellow-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => handleToggleVisibility()}
            disabled={selectedIds.length === 0}
            title="إظهار/إخفاء العناصر المحددة"
          >
            {selectedIds.length > 0 && selectedIds.every(id => {
              const field = fields.find(f => f.id === id);
              return field && field.visible === false;
            }) ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
          
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          
          {/* التحكم في التدوير */}
          <button 
            className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-orange-100 hover:bg-orange-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => handleRotate(-15)} // تدوير 15 درجة عكس عقارب الساعة
            disabled={selectedIds.length === 0}
            title="تدوير العناصر لليسار"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button 
            className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-orange-100 hover:bg-orange-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => handleRotate(15)} // تدوير 15 درجة مع عقارب الساعة
            disabled={selectedIds.length === 0}
            title="تدوير العناصر لليمين"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-gray-300 mx-1"></div>
          
          {/* التحكم في الحجم */}
          <button 
            className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-teal-100 hover:bg-teal-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => handleResize(1.1)} // تكبير بنسبة 10%
            disabled={selectedIds.length === 0}
            title="تكبير العناصر"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button 
            className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-teal-100 hover:bg-teal-200' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => handleResize(0.9)} // تصغير بنسبة 10%
            disabled={selectedIds.length === 0}
            title="تصغير العناصر"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <div className="ml-auto"></div>
          
          {/* تصدير الصورة */}
          <button 
            className="p-1 rounded bg-green-100 hover:bg-green-200"
            onClick={exportImage}
            title="تصدير كصورة"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* حاوية الكانفاس */}
      <div 
        ref={containerRef}
        className="editor-canvas relative bg-neutral-50 rounded-md overflow-hidden"
        style={{ height: 'calc(100% - 48px)', width: '100%' }}
        onWheel={handleWheel}
        onClick={handleDeselectAll} // إلغاء تحديد جميع الحقول عند النقر خارجها
      >
        <Stage
          ref={stageRef}
          width={imageSize.width}
          height={imageSize.height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          style={{ margin: '0 auto' }}
        >
          <Layer>
            {/* صورة القالب */}
            {backgroundImage && (
              <KonvaImage 
                image={backgroundImage} 
                width={imageSize.width}
                height={imageSize.height}
              />
            )}
            
            {/* شبكة الإرشاد */}
            {isGridVisible && gridEnabled && (
              <>
                {/* خطوط أفقية */}
                {Array.from({ length: Math.ceil(imageSize.height / gridSize) }).map((_, i) => (
                  <Line
                    key={`h-${i}`}
                    points={[0, i * gridSize, imageSize.width, i * gridSize]}
                    stroke="#ccc"
                    strokeWidth={0.5}
                    dash={[2, 2]}
                    opacity={0.5}
                  />
                ))}
                
                {/* خطوط عمودية */}
                {Array.from({ length: Math.ceil(imageSize.width / gridSize) }).map((_, i) => (
                  <Line
                    key={`v-${i}`}
                    points={[i * gridSize, 0, i * gridSize, imageSize.height]}
                    stroke="#ccc"
                    strokeWidth={0.5}
                    dash={[2, 2]}
                    opacity={0.5}
                  />
                ))}
                
                {/* خطوط المنتصف - أكثر وضوحاً */}
                <Line
                  points={[imageSize.width / 2, 0, imageSize.width / 2, imageSize.height]}
                  stroke="#f00"
                  strokeWidth={0.5}
                  dash={[5, 5]}
                  opacity={0.5}
                />
                <Line
                  points={[0, imageSize.height / 2, imageSize.width, imageSize.height / 2]}
                  stroke="#f00"
                  strokeWidth={0.5}
                  dash={[5, 5]}
                  opacity={0.5}
                />
              </>
            )}
            
            {/* رسم الحقول */}
            {fields.map(field => renderField(field))}
            
            {/* رسم مستطيلات التحديد */}
            {fields.map(field => renderSelectionRect(field))}
            
            {/* رسم خطوط التوجيه للتجاذب */}
            {snapToGrid && guidelines.x !== undefined && (
              <Line
                points={[guidelines.x, 0, guidelines.x, imageSize.height]}
                stroke={getGuidelineColor(guidelines.xType)}
                strokeWidth={1}
                dash={[4, 4]}
              />
            )}
            {snapToGrid && guidelines.y !== undefined && (
              <Line
                points={[0, guidelines.y, imageSize.width, guidelines.y]}
                stroke={getGuidelineColor(guidelines.yType)}
                strokeWidth={1}
                dash={[4, 4]}
              />
            )}
          </Layer>
        </Stage>
        
        {/* عرض مقياس العرض الحالي */}
        <div className="absolute bottom-2 right-2 bg-white rounded px-1 text-xs opacity-70">
          {Math.round(stageScale * 100)}%
        </div>
      </div>
    </div>
  );
};

export default DraggableFieldsPreviewUnified;