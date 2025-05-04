/**
 * مكون معاينة الحقول القابلة للسحب - النسخة المحسنة
 * الإصدار 6.0 - مايو 2025
 * 
 * هذا المكون يجمع بين مميزات المكونات السابقة ويضيف ميزات جديدة:
 * - دعم التدوير للحقول (15 درجة لليمين/اليسار)
 * - تغيير حجم النصوص والصور مباشرة من شريط الأدوات
 * - دعم الطبقات (رفع/خفض العناصر)
 * - التحكم في إخفاء وإظهار العناصر
 * - دعم الشبكة والتجاذب للمحاذاة الدقيقة
 * - تصدير الصورة مباشرة
 * - التكبير والتصغير في المعاينة
 * 
 * مع ضمان التوافق 100% مع مولد الصور على السيرفر
 */

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group, Rect, Line, Transformer } from 'react-konva';
import { 
  Download, RotateCcw, RotateCw, ZoomIn, ZoomOut, Grid, Magnet, 
  Copy, Trash2, MoveUp, MoveDown, Eye, EyeOff, Maximize, Minimize,
  Layers, ArrowUp, ArrowDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * العرض المرجعي للتصميم الأصلي - يتطابق مع القيمة في جميع مكونات النظام
 * هذه القيمة مهمة جدًا لضمان التطابق 100% بين المعاينة والصورة النهائية
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

interface DraggableFieldsPreviewProps {
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

export const DraggableFieldsPreviewEnhanced: React.FC<DraggableFieldsPreviewProps> = ({
  templateImage,
  fields,
  onFieldsChange,
  editorSettings,
  width,
  height,
  className = '',
  showControls = true,
  allowMultipleSelection = true,
  allowResize = true,
  onImageExport
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const { toast } = useToast();

  // حالة صورة الخلفية
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  
  // أبعاد الكنفاس والمقياس
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // خطوط الإرشاد للتجاذب والمحاذاة
  const [guidelines, setGuidelines] = useState<{ 
    x?: number; 
    y?: number;
    xType?: string;
    yType?: string;
  }>({});

  // تحديد الحقول وإدارة التراجع/الإعادة
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [history, setHistory] = useState<FieldType[][]>([]);
  const [future, setFuture] = useState<FieldType[][]>([]);
  
  // إعدادات الشبكة والتجاذب
  const [isGridVisible, setIsGridVisible] = useState<boolean>(
    editorSettings?.gridEnabled !== undefined ? editorSettings.gridEnabled : true
  );
  const [magnetEnabled, setMagnetEnabled] = useState<boolean>(
    editorSettings?.snapToGrid !== undefined ? editorSettings.snapToGrid : true
  );
  
  // قيم مستخرجة من الإعدادات
  const gridSize = editorSettings?.gridSize || 50;
  const snapThreshold = editorSettings?.snapThreshold || 10;
  const snapToGrid = magnetEnabled && (editorSettings?.snapToGrid !== undefined ? editorSettings.snapToGrid : true);

  // تحميل صورة القالب وضبط أبعاد Stage ليطابق أبعاد الصورة تمامًا (1:1)
  useEffect(() => {
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
      
      img.onerror = (e) => {
        console.error(`فشل تحميل الصورة: ${src}`, e);
        
        // إذا فشل تحميل صورة القالب، نحاول تحميل الصورة الافتراضية (شعار الموقع)
        if (src !== '/logo.svg') {
          console.log('⚠️ جاري تحميل الصورة الافتراضية (شعار الموقع)...');
          loadImage('/logo.svg');
        }
      };
      
      img.src = src;
    };
    
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

      // تحريك العناصر باستخدام مفاتيح الأسهم
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

  // تحويل البكسل إلى نسب مئوية
  const getPercentagePosition = (x: number, y: number) => {
    const percentX = (x / imageSize.width) * 100;
    const percentY = (y / imageSize.height) * 100;
    return { x: percentX, y: percentY };
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

  // تحريك العناصر المحددة
  const moveSelectedFields = (dx: number, dy: number) => {
    saveHistory();
    
    const updatedFields = fields.map(field => {
      if (selectedIds.includes(field.id)) {
        const pixelPos = getFieldPosition(field);
        
        // حساب الموضع الجديد بإضافة التغيير
        const newPixelX = pixelPos.x + dx;
        const newPixelY = pixelPos.y + dy;
        
        // تحويل الموضع للنسب المئوية
        const newPercentagePos = getPercentagePosition(newPixelX, newPixelY);
        
        return {
          ...field,
          position: {
            ...field.position,
            x: newPercentagePos.x,
            y: newPercentagePos.y
          }
        };
      }
      return field;
    });
    
    onFieldsChange(updatedFields);
  };

  // معالجة بدء سحب الحقل
  const handleDragStart = (e: any, fieldId: number) => {
    saveHistory();
    
    // تحديد الحقل إذا لم يكن محددًا مسبقًا
    if (allowMultipleSelection && e.evt.shiftKey) {
      // إضافة/إزالة من التحديد الحالي
      if (selectedIds.includes(fieldId)) {
        setSelectedIds(prev => prev.filter(id => id !== fieldId));
      } else {
        setSelectedIds(prev => [...prev, fieldId]);
      }
    } else if (!selectedIds.includes(fieldId)) {
      // تحديد فقط هذا الحقل
      setSelectedIds([fieldId]);
    }
  };

  // معالجة التحديد على الكنفاس
  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    // إزالة التحديد إذا تم النقر خارج الحقول
    if (clickedOnEmpty) {
      setSelectedIds([]);
    }
  };

  // حساب موضع التجاذب للحقل أثناء السحب
  const calculateSnap = (value: number, type: 'x' | 'y') => {
    if (!snapToGrid) return value;
    
    // التجاذب للشبكة
    if (type === 'x') {
      // حساب أقرب خط شبكة
      const gridLineX = Math.round(value / gridSize) * gridSize;
      
      // تحقق من المسافة للتجاذب
      if (Math.abs(value - gridLineX) < snapThreshold) {
        return gridLineX;
      }
    } else {
      // نفس العملية للمحور العمودي
      const gridLineY = Math.round(value / gridSize) * gridSize;
      
      if (Math.abs(value - gridLineY) < snapThreshold) {
        return gridLineY;
      }
    }
    
    return value;
  };

  // معالجة تحريك الحقل بالسحب
  const handleDragMove = (e: any, fieldId: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const newPos = { x: e.target.x(), y: e.target.y() };
    
    // تطبيق التجاذب على الموضع الجديد إذا كان مفعلاً
    const snappedX = calculateSnap(newPos.x, 'x');
    const snappedY = calculateSnap(newPos.y, 'y');
    
    // إظهار خطوط التوجيه إذا تم التجاذب
    if (snappedX !== newPos.x || snappedY !== newPos.y) {
      setGuidelines({
        x: snappedX !== newPos.x ? snappedX : undefined,
        y: snappedY !== newPos.y ? snappedY : undefined,
        xType: 'grid',
        yType: 'grid'
      });
      
      // تحديث موضع العنصر المسحوب
      e.target.position({ x: snappedX, y: snappedY });
    } else {
      setGuidelines({});
    }
  };

  // معالجة انتهاء سحب الحقل
  const handleDragEnd = (e: any, fieldId: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    // الحصول على الموضع النهائي بعد السحب
    const finalPosition = { x: e.target.x(), y: e.target.y() };
    
    // تحويل الموضع من بكسل إلى نسبة مئوية
    const percentagePos = getPercentagePosition(finalPosition.x, finalPosition.y);
    
    // تحديث الحقول مع الموضع الجديد
    const updatedFields = fields.map(f => {
      // تحديث جميع الحقول المحددة بنفس الفرق
      if (selectedIds.includes(f.id)) {
        // للحقل الذي تم سحبه، استخدم الموضع النهائي
        if (f.id === fieldId) {
          return {
            ...f,
            position: {
              x: percentagePos.x,
              y: percentagePos.y,
              snapToGrid: field.position.snapToGrid
            }
          };
        } else {
          // للحقول الأخرى المحددة، حسب نفس مقدار التغيير
          const oldPixelPos = getFieldPosition(field);
          const oldPos = getFieldPosition(f);
          
          // حساب مقدار التغيير بالبكسل
          const deltaX = finalPosition.x - oldPixelPos.x;
          const deltaY = finalPosition.y - oldPixelPos.y;
          
          // تطبيق نفس التغيير على هذا الحقل
          const newPixelPos = {
            x: oldPos.x + deltaX,
            y: oldPos.y + deltaY
          };
          
          // تحويل الموضع الجديد إلى نسبة مئوية
          const newPercentagePos = getPercentagePosition(newPixelPos.x, newPixelPos.y);
          
          return {
            ...f,
            position: {
              x: newPercentagePos.x,
              y: newPercentagePos.y,
              snapToGrid: f.position.snapToGrid
            }
          };
        }
      }
      
      return f;
    });
    
    onFieldsChange(updatedFields);
    
    // إخفاء خطوط التوجيه بعد انتهاء السحب
    setGuidelines({});
  };

  // حذف العناصر المحددة
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // حذف جميع الحقول المحددة
    const updatedFields = fields.filter(field => !selectedIds.includes(field.id));
    onFieldsChange(updatedFields);
    
    // إزالة التحديد
    setSelectedIds([]);
    
    toast?.({
      title: "تم الحذف",
      description: `تم حذف ${selectedIds.length} عنصر`,
      duration: 2000
    });
  };

  // نسخ العناصر المحددة
  const handleDuplicateSelected = () => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // البحث عن أعلى معرف حالي
    const maxId = fields.reduce((max, field) => Math.max(max, field.id), 0);
    
    // إنشاء نسخ من العناصر المحددة مع معرفات جديدة
    const copiedFields = selectedIds.map(id => {
      const original = fields.find(f => f.id === id);
      if (!original) return null;
      
      // حساب موضع جديد (مزاح قليلاً)
      const pos = getFieldPosition(original);
      const newPixelPos = { x: pos.x + 20, y: pos.y + 20 };
      const newPosition = getPercentagePosition(newPixelPos.x, newPixelPos.y);
      
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
    
    toast?.({
      title: "تم النسخ",
      description: `تم نسخ ${copiedFields.length} عنصر`,
      duration: 2000
    });
  };

  // تغيير طبقة العناصر المحددة
  const handleMoveLayer = (direction: number) => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // تحديث الحقول بتغيير قيمة zIndex
    const updatedFields = fields.map(field => {
      if (selectedIds.includes(field.id)) {
        const currentZIndex = field.zIndex || 1;
        return {
          ...field,
          zIndex: Math.max(1, currentZIndex + direction) // لا يمكن أن تكون الطبقة أقل من 1
        };
      }
      return field;
    });
    
    onFieldsChange(updatedFields);
    
    toast?.({
      title: direction > 0 ? "تم رفع الطبقة" : "تم خفض الطبقة",
      description: `تم تغيير طبقة ${selectedIds.length} عنصر`,
      duration: 2000
    });
  };

  // تغيير حالة الرؤية للعناصر المحددة
  const handleToggleVisibility = () => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // تحديد ما إذا كانت جميع العناصر المحددة مرئية
    const areAllVisible = selectedIds.every(id => {
      const field = fields.find(f => f.id === id);
      return field && field.visible !== false;
    });
    
    // تحديث الحقول بعكس حالة الرؤية
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
  };

  // تغيير حجم العناصر المحددة
  const handleResize = (scale: number) => {
    if (selectedIds.length === 0) return;
    
    saveHistory();
    
    // تحديث الحقول بتطبيق نسبة التكبير/التصغير
    const updatedFields = fields.map(field => {
      if (selectedIds.includes(field.id)) {
        if (field.type === 'text' || field.type === 'dropdown' || field.type === 'radio') {
          // للنصوص والقوائم، نقوم بتكبير/تصغير حجم الخط والعرض الأقصى
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
  };

  // تصدير الصورة
  const handleExportImage = () => {
    if (!stageRef.current) return;
    
    // تأكد من إخفاء أي عناصر واجهة مثل المحول قبل التصدير
    const prevSelection = [...selectedIds];
    setSelectedIds([]);
    
    // انتظر دورة رسم واحدة قبل التصدير
    setTimeout(() => {
      // الحصول على البيانات كـ URL للصورة
      const dataURL = stageRef.current.toDataURL({ 
        pixelRatio: 2, // جودة أعلى للتصدير
        mimeType: 'image/png'
      });
      
      // استعادة التحديد بعد التصدير
      setSelectedIds(prevSelection);
      
      // استدعاء الدالة الخارجية إذا وجدت
      if (onImageExport) {
        onImageExport(dataURL);
      } else {
        // تنزيل الصورة مباشرة إذا لم تكن هناك دالة خارجية
        const link = document.createElement('a');
        link.download = 'template-preview.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast?.({
        title: "تم تصدير الصورة",
        description: "تم تصدير الصورة بنجاح",
        duration: 2000
      });
    }, 50);
  };

  // معالجة تكبير/تصغير العجلة
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY;
      const scaleBy = delta > 0 ? 0.9 : 1.1;
      
      setStageScale(prevScale => {
        const newScale = prevScale * scaleBy;
        return Math.min(Math.max(0.2, newScale), 4);
      });
    } else {
      // التمرير العادي في حالة عدم الضغط على Ctrl
      setStagePos(prev => ({
        x: prev.x,
        y: prev.y - e.deltaY
      }));
    }
  };

  return (
    <div 
      className={`draggable-fields-preview-enhanced ${className}`} 
      style={{ position: 'relative', width: '100%', height: height || '500px' }}
      ref={containerRef}
      onWheel={handleWheel}
    >
      {/* شريط أدوات المحرر */}
      {showControls && (
        <div className="editor-toolbar bg-neutral-100 p-2 mb-2 rounded-md flex gap-2 justify-between flex-wrap">
          <div className="toolbar-left flex gap-2">
            {/* التراجع والإعادة */}
            <div className="tool-group flex items-center gap-1">
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
            </div>
            
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            
            {/* التكبير والتصغير */}
            <div className="tool-group flex items-center gap-1">
              <button 
                className="p-1 rounded bg-blue-100 hover:bg-blue-200"
                onClick={() => setStageScale(s => Math.min(s + 0.1, 4))}
                title="تكبير (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <span className="text-xs bg-white px-1 rounded border">
                {Math.round(stageScale * 100)}%
              </span>
              
              <button 
                className="p-1 rounded bg-blue-100 hover:bg-blue-200"
                onClick={() => setStageScale(s => Math.max(s - 0.1, 0.2))}
                title="تصغير (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            
            {/* تدوير العناصر */}
            <div className="tool-group flex items-center gap-1">
              <button 
                className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`}
                onClick={() => handleRotate(-15)}
                disabled={selectedIds.length === 0}
                title="تدوير 15 درجة لليسار"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button 
                className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`}
                onClick={() => handleRotate(15)}
                disabled={selectedIds.length === 0}
                title="تدوير 15 درجة لليمين"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            
            {/* تغيير الحجم */}
            <div className="tool-group flex items-center gap-1">
              <button 
                className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`}
                onClick={() => handleResize(1.1)}
                disabled={selectedIds.length === 0}
                title="تكبير العناصر بنسبة 10%"
              >
                <Maximize className="w-4 h-4" />
              </button>
              
              <button 
                className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`}
                onClick={() => handleResize(0.9)}
                disabled={selectedIds.length === 0}
                title="تصغير العناصر بنسبة 10%"
              >
                <Minimize className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="toolbar-right flex gap-2">
            {/* الطبقات */}
            <div className="tool-group flex items-center gap-1">
              <button 
                className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-purple-100 hover:bg-purple-200' : 'bg-gray-100 text-gray-400'}`}
                onClick={() => handleMoveLayer(1)}
                disabled={selectedIds.length === 0}
                title="رفع طبقة"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              
              <button 
                className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-purple-100 hover:bg-purple-200' : 'bg-gray-100 text-gray-400'}`}
                onClick={() => handleMoveLayer(-1)}
                disabled={selectedIds.length === 0}
                title="خفض طبقة"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            
            {/* الشبكة والتجاذب */}
            <div className="tool-group flex items-center gap-1">
              <button 
                className={`p-1 rounded ${isGridVisible ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setIsGridVisible(!isGridVisible)}
                title="إظهار/إخفاء الشبكة"
              >
                <Grid className="w-4 h-4" />
              </button>
              
              <button 
                className={`p-1 rounded ${magnetEnabled ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setMagnetEnabled(!magnetEnabled)}
                title="تفعيل/تعطيل التجاذب للشبكة"
              >
                <Magnet className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            
            {/* الرؤية */}
            <div className="tool-group flex items-center gap-1">
              <button 
                className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-amber-100 hover:bg-amber-200' : 'bg-gray-100 text-gray-400'}`}
                onClick={handleToggleVisibility}
                disabled={selectedIds.length === 0}
                title="إظهار/إخفاء العناصر المحددة"
              >
                {selectedIds.length > 0 && selectedIds.every(id => {
                  const field = fields.find(f => f.id === id);
                  return field && field.visible !== false;
                }) 
                  ? <EyeOff className="w-4 h-4" /> 
                  : <Eye className="w-4 h-4" />
                }
              </button>
            </div>
            
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            
            {/* عمليات العناصر */}
            <div className="tool-group flex items-center gap-1">
              <button 
                className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-amber-100 hover:bg-amber-200' : 'bg-gray-100 text-gray-400'}`}
                onClick={handleDuplicateSelected}
                disabled={selectedIds.length === 0}
                title="نسخ العناصر المحددة"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              <button 
                className={`p-1 rounded ${selectedIds.length > 0 ? 'bg-red-100 hover:bg-red-200' : 'bg-gray-100 text-gray-400'}`}
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                title="حذف العناصر المحددة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            
            {/* تصدير الصورة */}
            <div className="tool-group">
              <button 
                className="p-1 px-2 rounded bg-primary text-white hover:bg-primary/90 flex gap-1 items-center"
                onClick={handleExportImage}
                title="تصدير الصورة"
              >
                <Download className="w-4 h-4" /> 
                <span className="text-xs font-medium">تصدير</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* منطقة الكنفاس */}
      <div 
        className="stage-container" 
        style={{ 
          width: '100%', 
          height: 'calc(100% - 50px)', 
          overflow: 'hidden',
          background: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}
      >
        <Stage
          ref={stageRef}
          width={imageSize.width}
          height={imageSize.height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          onClick={handleStageClick}
          style={{ background: '#fff' }}
        >
          <Layer>
            {/* الخلفية */}
            {backgroundImage && (
              <KonvaImage
                image={backgroundImage}
                width={imageSize.width}
                height={imageSize.height}
              />
            )}
            
            {/* الشبكة */}
            {isGridVisible && (
              <>
                {Array.from({ length: Math.ceil(imageSize.width / gridSize) + 1 }).map((_, i) => (
                  <Line
                    key={`grid-v-${i}`}
                    x={i * gridSize}
                    y={0}
                    points={[0, 0, 0, imageSize.height]}
                    stroke="#aaa"
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                ))}
                {Array.from({ length: Math.ceil(imageSize.height / gridSize) + 1 }).map((_, i) => (
                  <Line
                    key={`grid-h-${i}`}
                    x={0}
                    y={i * gridSize}
                    points={[0, 0, imageSize.width, 0]}
                    stroke="#aaa"
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                ))}
                <Line
                  x={imageSize.width / 2}
                  y={0}
                  points={[0, 0, 0, imageSize.height]}
                  stroke="#f55"
                  strokeWidth={1}
                  opacity={0.5}
                  dash={[5, 5]}
                />
                <Line
                  x={0}
                  y={imageSize.height / 2}
                  points={[0, 0, imageSize.width, 0]}
                  stroke="#f55"
                  strokeWidth={1}
                  opacity={0.5}
                  dash={[5, 5]}
                />
              </>
            )}
            
            {/* خطوط التوجيه للتجاذب */}
            {guidelines.x !== undefined && (
              <Line
                x={guidelines.x}
                y={0}
                points={[0, 0, 0, imageSize.height]}
                stroke="#0a0"
                strokeWidth={1}
                dash={[5, 5]}
              />
            )}
            {guidelines.y !== undefined && (
              <Line
                x={0}
                y={guidelines.y}
                points={[0, 0, imageSize.width, 0]}
                stroke="#0a0"
                strokeWidth={1}
                dash={[5, 5]}
              />
            )}
            
            {/* الحقول */}
            {fields
              .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) // ترتيب الحقول حسب الطبقة
              .map(field => {
                if (field.visible === false) return null; // تجاهل الحقول المخفية
                
                const pos = getFieldPosition(field);
                
                if (field.type === 'text' || field.type === 'dropdown' || field.type === 'radio') {
                  const style = field.style || {};
                  // معامل التحويل للطباعة (لضمان نفس الحجم في مولد الصور)
                  const scalingFactor = imageSize.width / BASE_IMAGE_WIDTH;
                  
                  // حساب حجم الخط بناءً على المعامل
                  const fontSize = (style.fontSize || 24) * scalingFactor;
                  const fontFamily = style.fontFamily || 'Cairo';
                  const fontWeight = style.fontWeight || 'normal';
                  const textColor = style.color || 'black';
                  const align = style.align || 'center';
                  const maxWidth = (style.maxWidth || 300) * scalingFactor;
                  const rotation = field.rotation || 0;
                  
                  const displayText = field.type === 'text' 
                    ? (field.defaultValue || field.placeholder || field.name)
                    : field.type === 'dropdown'
                      ? `[قائمة: ${field.options?.find(o => o.value === field.defaultValue)?.label || 'اختيار من القائمة'}]`
                      : `[اختيار: ${field.options?.find(o => o.value === field.defaultValue)?.label || 'خيار من المتاح'}]`;
                  
                  return (
                    <Group
                      key={field.id}
                      x={pos.x}
                      y={pos.y}
                      draggable
                      onDragStart={(e) => handleDragStart(e, field.id)}
                      onDragMove={(e) => handleDragMove(e, field.id)}
                      onDragEnd={(e) => handleDragEnd(e, field.id)}
                      onClick={(e) => handleDragStart(e, field.id)}
                      rotation={rotation}
                    >
                      <Text
                        text={displayText}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        fontStyle={fontWeight === 'bold' ? 'bold' : 'normal'}
                        fill={textColor}
                        align={align}
                        width={maxWidth}
                        offsetX={align === 'center' ? maxWidth / 2 : align === 'right' ? maxWidth : 0}
                        offsetY={fontSize / 2}
                      />
                    </Group>
                  );
                } else if (field.type === 'image') {
                  const style = field.style || {};
                  const placeholderWidth = style.imageMaxWidth || Math.round(imageSize.width / 4);
                  const placeholderHeight = style.imageMaxHeight || Math.round(imageSize.height / 4);
                  const rotation = field.rotation || 0;
                  
                  return (
                    <Group
                      key={field.id}
                      x={pos.x}
                      y={pos.y}
                      draggable
                      onDragStart={(e) => handleDragStart(e, field.id)}
                      onDragMove={(e) => handleDragMove(e, field.id)}
                      onDragEnd={(e) => handleDragEnd(e, field.id)}
                      onClick={(e) => handleDragStart(e, field.id)}
                      rotation={rotation}
                    >
                      <Rect
                        width={placeholderWidth}
                        height={placeholderHeight}
                        offsetX={placeholderWidth / 2}
                        offsetY={placeholderHeight / 2}
                        fill="#f5f5f5"
                        stroke="#ddd"
                        strokeWidth={1}
                        dash={[5, 5]}
                      />
                      <Text
                        text={`صورة: ${field.name}`}
                        fontSize={14}
                        fontFamily="Cairo"
                        fill="#999"
                        align="center"
                        width={placeholderWidth}
                        offsetX={placeholderWidth / 2}
                        offsetY={8}
                      />
                    </Group>
                  );
                }
                
                return null;
              })}
              
            {/* المحول (Transformer) للتحجيم المباشر */}
            {allowResize && selectedIds.length > 0 && (
              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // التأكد من أن حجم المربع المحدد ضمن الحدود المسموح بها
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DraggableFieldsPreviewEnhanced;