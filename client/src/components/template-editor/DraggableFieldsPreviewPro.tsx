/*
نسخة متكاملة من DraggableFieldsPreview
- توليد صورة PNG
- تحديد متعدد
- Undo/Redo
- شريط أدوات أنيق
- مقابض للتحجيم والتدوير
- تحسينات في مقابض التحجيم والتدوير
*/

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group, Rect, Line, Circle, Transformer } from 'react-konva';
import { Download, RotateCcw, RotateCw, ZoomIn, ZoomOut, Grid, Magnet, Move, Lock, Unlock } from 'lucide-react';

/**
 * العرض المرجعي للتصميم الأصلي - يتطابق مع القيمة في جميع مكونات النظام
 * هذه القيمة مهمة جدًا لضمان التطابق 100% بين المعاينة والصورة النهائية
 * 
 * 🔴 ملاحظة مهمة: 
 * يجب أن تكون هذه القيمة متطابقة في الملفات التالية:
 * 1. `BASE_IMAGE_WIDTH` في ملف `server/optimized-image-generator.ts`
 * 2. `BASE_IMAGE_WIDTH` في ملف `client/src/components/konva-image-generator/optimized-image-generator.tsx`
 * 3. `BASE_IMAGE_WIDTH` في ملف `client/src/components/template-editor/FieldsPositionEditor.tsx`
 */
const BASE_IMAGE_WIDTH = 1000;

interface Position {
  x: number;
  y: number;
  snapToGrid?: boolean;
}

interface FieldType {
  id: number;
  name: string;
  label?: string;
  type: 'text' | 'image' | 'template';
  position: Position;
  style?: any;
  zIndex?: number;
  visible?: boolean;
  rotation?: number;
  size?: { width: number; height: number };
}

interface EditorSettings {
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  snapThreshold?: number;
  templateImageLayer?: number;
  locked?: boolean; // إضافة خاصية القفل لمنع التحريك
}

interface DraggableFieldsPreviewProProps {
  templateImage: string;
  fields: FieldType[];
  selectedFieldId?: number | null; // حقل واحد محدد
  onFieldSelect?: (id: number | null) => void;
  onFieldsChange: (fields: FieldType[]) => void;
  className?: string;
  editorSettings?: EditorSettings;
  formData?: Record<string, any>;
  showGrid?: boolean;
  snapToGrid?: boolean;
  readOnly?: boolean;
  onGeneratePreview?: (dataUrl: string) => void;
}

export const DraggableFieldsPreviewPro: React.FC<DraggableFieldsPreviewProProps> = ({
  templateImage,
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldsChange,
  className,
  editorSettings = {},
  formData = {}
}) => {
  const {
    gridEnabled = true,
    snapToGrid = true,
    gridSize = 50,
    snapThreshold = 15,
    templateImageLayer = 0,
    locked = false
  } = editorSettings;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const templateImageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const rotateHandleRef = useRef<any>(null);
  
  const [isTemplateImageLoaded, setIsTemplateImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [templateImageObj, setTemplateImageObj] = useState<HTMLImageElement | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<FieldType[][]>([]);
  const [future, setFuture] = useState<FieldType[][]>([]);
  const [guidelines, setGuidelines] = useState<any>({});
  const [isTransforming, setIsTransforming] = useState(false);
  const [showControls, setShowControls] = useState(false); // إظهار/إخفاء أدوات التحكم
  
  // حالة موضع صورة القالب
  const [templateImagePosition, setTemplateImagePosition] = useState({ x: 0, y: 0 });
  const [isTemplateImageDraggable, setIsTemplateImageDraggable] = useState(false);
  const [templateImageSize, setTemplateImageSize] = useState({ width: 0, height: 0 });
  // لم نعد نحتاج لتتبع حالة تحديد صورة القالب بشكل منفصل لأنها أصبحت طبقة مثل باقي الحقول
  
  // تحميل صورة القالب
  useEffect(() => {
    if (!templateImage) return;
    
    const image = new window.Image();
    image.crossOrigin = 'Anonymous';
    image.src = templateImage;
    
    image.onload = () => {
      setIsTemplateImageLoaded(true);
      setTemplateImageObj(image);
      
      // حساب الأبعاد المناسبة مع الحفاظ على نسبة العرض إلى الارتفاع
      const containerWidth = containerRef.current?.clientWidth || 800;
      const scale = containerWidth / image.width;
      const width = containerWidth;
      const height = image.height * scale;
      
      setImageSize({ width, height });
      setTemplateImageSize({ width, height }); // تعيين حجم صورة القالب مبدئياً
      
      // إعادة تعيين موضع المرحلة بعد تحميل الصورة
      setStagePos({ x: 0, y: 0 });
      setStageScale(1);
      
      // إعادة رسم الطبقة
      if (templateImageRef.current) {
        templateImageRef.current.getLayer()?.batchDraw();
      }
    };
    
    image.onerror = () => {
      console.error('Error loading template image');
      setIsTemplateImageLoaded(false);
      setTemplateImageObj(null);
    };
  }, [templateImage]);
  
  // إنشاء حقل صورة قالب افتراضي ليتم معالجته كطبقة كاملة في نظام الطبقات
  const templateField: FieldType = useMemo(() => ({
    id: -1, // استخدام -1 كمعرف خاص لصورة القالب
    name: 'template-image',
    label: 'صورة القالب',
    type: 'template',
    position: templateImagePosition,
    // نظام الطبقات يستخدم zIndex لتحديد ترتيب الطبقات:
    // zIndex سالب (مثل -10): يضع صورة القالب خلف جميع الحقول
    // zIndex = 0: يضع صورة القالب في المنتصف ويعتمد على قيم zIndex للحقول الأخرى
    // zIndex موجب عالي (مثل 100): يضع صورة القالب أمام جميع الحقول
    zIndex: templateImageLayer || 0,
    visible: true, // صورة القالب مرئية بشكل افتراضي
    rotation: 0,
    size: templateImageSize
  }), [templateImagePosition, templateImageLayer, templateImageSize]);

  // دمج حقل القالب مع باقي الحقول لمعالجته ضمن نظام الطبقات
  const allFields = useMemo(() => {
    // إضافة حقل القالب إلى قائمة الحقول ليتم معالجته كطبقة عادية
    // يمكن وضع الحقول أمام أو خلف صورة القالب باستخدام خاصية zIndex
    if (isTemplateImageLoaded && templateImageObj) {
      return [templateField, ...fields]; 
    }
    return fields;
  }, [templateField, fields, isTemplateImageLoaded, templateImageObj]);
  
  // تحديث القيم المحددة عند تغيير selectedFieldId من الخارج
  useEffect(() => {
    if (selectedFieldId !== undefined) {
      if (selectedFieldId === null) {
        setSelectedIds([]);
      } else {
        setSelectedIds([selectedFieldId]);
      }
    }
  }, [selectedFieldId]);
  
  // تحديث transformer عند تغيير الحقول المحددة
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      // البحث عن العناصر المحددة
      const nodes = selectedIds.map(id => 
        stageRef.current.findOne(`#field-${id}`)
      ).filter(Boolean);
      
      if (nodes.length > 0) {
        transformerRef.current.nodes(nodes);
        transformerRef.current.getLayer().batchDraw();
        // عرض أدوات التحكم عند تحديد حقل
        setShowControls(true);
      } else {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
        // إخفاء أدوات التحكم عند عدم تحديد أي حقل
        setShowControls(false);
      }
    }
  }, [selectedIds, fields, isTemplateImageLoaded]);
  
  // استمع لأحداث لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // تراجع: Ctrl + Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // إعادة: Ctrl + Y or Ctrl + Shift + Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      
      // حذف العناصر المحددة: Delete
      if (e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault();
        // حفظ الحالة قبل الحذف
        saveHistory();
        
        // حذف العناصر المحددة
        const newFields = fields.filter(f => !selectedIds.includes(f.id));
        onFieldsChange(newFields);
        
        // إلغاء التحديد
        setSelectedIds([]);
        if (onFieldSelect) {
          onFieldSelect(null);
        }
      }
      
      // إضافة تحريك الحقل باستخدام مفاتيح الأسهم
      if (selectedIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        if (locked) return; // لا تسمح بالتحريك إذا كان المحرر مقفلاً
        
        // إذا لم تكن في سجل التاريخ بالفعل، احفظ الحالة الحالية
        saveHistory();
        
        // تحديد مقدار التحريك (أكبر مع الShift)
        const moveAmount = e.shiftKey ? 10 : 1;
        
        // تحديث مواضع الحقول المحددة
        const updatedFields = fields.map(field => {
          if (selectedIds.includes(field.id)) {
            let { x, y } = field.position;
            
            switch (e.key) {
              case 'ArrowUp':
                y -= moveAmount;
                break;
              case 'ArrowDown':
                y += moveAmount;
                break;
              case 'ArrowLeft':
                x -= moveAmount;
                break;
              case 'ArrowRight':
                x += moveAmount;
                break;
            }
            
            return {
              ...field,
              position: {
                ...field.position,
                x,
                y
              }
            };
          }
          return field;
        });
        
        onFieldsChange(updatedFields);
      }
      
      // تدوير الحقل باستخدام Ctrl + الأسهم
      if (selectedIds.length > 0 && e.ctrlKey && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        if (locked) return; // لا تسمح بالتدوير إذا كان المحرر مقفلاً
        
        // إذا لم تكن في سجل التاريخ بالفعل، احفظ الحالة الحالية
        saveHistory();
        
        // تحديد مقدار التدوير (أكبر مع الShift)
        const rotateAmount = e.shiftKey ? 45 : 5;
        
        // تحديث دوران الحقول المحددة
        const updatedFields = fields.map(field => {
          if (selectedIds.includes(field.id)) {
            let rotation = field.rotation || 0;
            
            if (e.key === 'ArrowLeft') {
              rotation -= rotateAmount;
            } else {
              rotation += rotateAmount;
            }
            
            // التأكد من أن الزاوية بين 0 و 360
            rotation = ((rotation % 360) + 360) % 360;
            
            return {
              ...field,
              rotation
            };
          }
          return field;
        });
        
        onFieldsChange(updatedFields);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, fields, locked]);

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

  // إعادة آخر تغيير تم التراجع عنه
  const redo = () => {
    if (future.length === 0) return;
    
    const nextState = future[0];
    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev, fields]);
    onFieldsChange(nextState);
  };

  // تكبير/تصغير العرض
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
    };
    
    const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    setStageScale(newScale);
    setStagePos({
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
    });
  };

  // تقريب القيمة إلى أقرب gridSize
  const snapValue = (value: number, size: number): number => {
    return Math.round(value / size) * size;
  };

  // التحقق من إمكانية الالتصاق بالحدود
  const checkSnapping = (x: number, y: number, fieldId: number) => {
    if (!snapToGrid) return { x, y, guidelines: {} };
    
    let newX = x;
    let newY = y;
    const newGuidelines: any = {};
    
    // الالتصاق بالشبكة
    if (editorSettings.snapToGrid) {
      newX = snapValue(x, gridSize);
      newY = snapValue(y, gridSize);
      
      // تسجيل خطوط الإرشاد للشبكة
      if (Math.abs(x - newX) < snapThreshold) {
        newGuidelines.vertical = { position: newX, orientation: 'vertical' };
      }
      
      if (Math.abs(y - newY) < snapThreshold) {
        newGuidelines.horizontal = { position: newY, orientation: 'horizontal' };
      }
    }
    
    // الالتصاق بحدود الصورة
    const snapToEdge = (value: number, edge: number): number => {
      return Math.abs(value - edge) < snapThreshold ? edge : value;
    };
    
    // حدود الصورة
    const left = 0;
    const right = imageSize.width;
    const top = 0;
    const bottom = imageSize.height;
    const center = imageSize.width / 2;
    const middle = imageSize.height / 2;
    
    // التصاق بحدود الصورة
    const originalX = newX;
    const originalY = newY;
    
    newX = snapToEdge(newX, left);
    if (originalX !== newX) {
      newGuidelines.leftEdge = { position: left, orientation: 'vertical' };
    }
    
    newX = snapToEdge(newX, right);
    if (originalX !== newX) {
      newGuidelines.rightEdge = { position: right, orientation: 'vertical' };
    }
    
    newX = snapToEdge(newX, center);
    if (originalX !== newX) {
      newGuidelines.centerX = { position: center, orientation: 'vertical' };
    }
    
    newY = snapToEdge(newY, top);
    if (originalY !== newY) {
      newGuidelines.topEdge = { position: top, orientation: 'horizontal' };
    }
    
    newY = snapToEdge(newY, bottom);
    if (originalY !== newY) {
      newGuidelines.bottomEdge = { position: bottom, orientation: 'horizontal' };
    }
    
    newY = snapToEdge(newY, middle);
    if (originalY !== newY) {
      newGuidelines.middleY = { position: middle, orientation: 'horizontal' };
    }
    
    // الالتصاق بالحقول الأخرى
    fields.forEach(otherField => {
      if (otherField.id === fieldId || otherField.visible === false) return;
      
      const otherPos = getFieldPosition(otherField);
      
      // التصاق بحدود الحقول الأخرى
      const snapToFieldEdge = (value: number, edge: number, name: string, direction: string): number => {
        if (Math.abs(value - edge) < snapThreshold) {
          newGuidelines[`${name}_${direction}`] = {
            position: edge,
            orientation: direction === 'left' || direction === 'right' ? 'vertical' : 'horizontal'
          };
          return edge;
        }
        return value;
      };
      
      // التصاق بالحواف الأربعة للحقل الآخر
      newX = snapToFieldEdge(newX, otherPos.x, otherField.name, 'left');
      newY = snapToFieldEdge(newY, otherPos.y, otherField.name, 'top');
    });
    
    return { x: newX, y: newY, guidelines: newGuidelines };
  };

  // رسم الحقول النصية
  const renderTextField = (field: FieldType, index: number) => {
    const position = getFieldPosition(field);
    const style = field.style || {};
    
    // حساب حجم الخط كنسبة من حجم الصورة الأصلية
    // كما هو مستخدم في مولد الصورة على السيرفر تمامًا
    const fontSize = (style.fontSize || 24) * (imageSize.width / BASE_IMAGE_WIDTH);
    
    // حساب أبعاد الحقل وتطبيق عامل تناسب الحجم للتطابق مع السيرفر
    let fieldWidth = style.width || 200;
    let fieldHeight = style.height || 50;
    
    // إذا كان الحقل يحتوي على خاصية size، نستخدمها
    if (field.size) {
      fieldWidth = field.size.width || fieldWidth;
      fieldHeight = field.size.height || fieldHeight;
    }
    
    // تطبيق عامل التناسب
    fieldWidth = fieldWidth * (imageSize.width / BASE_IMAGE_WIDTH);
    fieldHeight = fieldHeight * (imageSize.width / BASE_IMAGE_WIDTH);
    
    const isSelected = selectedIds.includes(field.id);
    
    // إذا كان الحقل غير مرئي، لا نعرضه
    if (field.visible === false) {
      return null;
    }
    
    // إضافة تدوير للحقل إذا كانت قيمة التدوير محددة
    const rotation = field.rotation || 0;
    
    // استخدام بيانات النموذج إذا كانت متوفرة
    let fieldText = field.label || field.name;
    
    // إذا كانت بيانات النموذج تحتوي على قيمة لهذا الحقل، استخدمها
    if (formData && formData[field.name]) {
      fieldText = formData[field.name];
    }

    return (
      <Group
        key={`field-${field.id}`}
        x={position.x}
        y={position.y}
        draggable={!isTransforming && !locked}
        rotation={rotation}
        id={`field-${field.id}`}
        onClick={(e) => {
          e.cancelBubble = true;
          let newSelectedIds = [];
          
          if (e.evt.shiftKey) {
            // إذا تم الضغط على مفتاح Shift، أضف/احذف من التحديد المتعدد
            if (selectedIds.includes(field.id)) {
              newSelectedIds = selectedIds.filter(id => id !== field.id);
            } else {
              newSelectedIds = [...selectedIds, field.id];
            }
          } else {
            // إذا لم يتم الضغط على Shift، تحديد فقط هذا الحقل
            newSelectedIds = [field.id];
          }
          
          setSelectedIds(newSelectedIds);
          if (onFieldSelect) {
            if (newSelectedIds.length === 1) {
              onFieldSelect(newSelectedIds[0]);
            } else {
              onFieldSelect(null);
            }
          }
        }}
        onDragStart={(e) => {
          if (locked) {
            e.evt.preventDefault(); // منع السحب إذا كان المحرر مقفلاً
            return;
          }
          e.evt.stopPropagation();
          setIsDragging(true);
          saveHistory();
        }}
        onDragMove={(e) => {
          if (locked) return;
          e.evt.stopPropagation();
          const pos = e.target.position();
          const { x, y, guidelines: newGuidelines } = checkSnapping(pos.x, pos.y, field.id);
          
          setGuidelines(newGuidelines);
          
          e.target.position({ x, y });
        }}
        onDragEnd={(e) => {
          if (locked) return;
          e.evt.stopPropagation();
          setIsDragging(false);
          
          const pos = e.target.position();
          
          // تحويل الإحداثيات المطلقة إلى نسب مئوية من أبعاد الصورة
          const newX = (pos.x / imageSize.width) * 100;
          const newY = (pos.y / imageSize.height) * 100;
          
          // تحديد إذا كان يجب تفعيل التجاذب للموضع
          const currentSnapToGrid = field.position.snapToGrid !== undefined
            ? field.position.snapToGrid
            : snapToGrid;
          
          setGuidelines({});
          
          onFieldsChange(
            fields.map(f => {
              if (f.id === field.id) {
                return {
                  ...f,
                  position: {
                    x: newX,
                    y: newY,
                    snapToGrid: currentSnapToGrid
                  }
                };
              }
              return f;
            })
          );
          
          setGuidelines({});
        }}
      >
        <Text
          text={fieldText}
          fontSize={fontSize}
          fontFamily={style.fontFamily || 'Cairo'}
          fontStyle={style.fontWeight === 'bold' ? 'bold' : 'normal'}
          fill={style.color || '#1e293b'}
          align={style.align || 'center'}
          width={fieldWidth}
          height={fieldHeight}
          verticalAlign={style.verticalPosition || 'middle'}
          offsetX={style.align === 'center' ? fieldWidth / 2 : 0}
          offsetY={fieldHeight / 2}
          // إضافة ظل النص إذا كان مفعل في الستايل
          shadowColor={style.textShadow?.enabled ? (style.textShadow.color || 'rgba(0, 0, 0, 0.5)') : undefined}
          shadowBlur={style.textShadow?.enabled ? (style.textShadow.blur || 4) : undefined}
          shadowOffset={style.textShadow?.enabled ? { 
            x: style.textShadow.offsetX || 2, 
            y: style.textShadow.offsetY || 2 
          } : undefined}
        />
      </Group>
    );
  };

  // رسم الحقول من نوع صورة
  const renderImageField = (field: FieldType, index: number) => {
    // إذا كان الحقل غير مرئي، لا نرسمه
    if (field.visible === false) {
      return null;
    }
    
    const position = getFieldPosition(field);
    const style = field.style || {};
    const rotation = field.rotation || 0;
    const isSelected = selectedIds.includes(field.id);
    
    // حساب أبعاد الصورة
    let imageWidth = style.imageMaxWidth || 200;
    let imageHeight = style.imageMaxHeight || 200;
    
    // إذا كان الحقل يحتوي على خاصية size، نستخدمها
    if (field.size) {
      imageWidth = field.size.width || imageWidth;
      imageHeight = field.size.height || imageHeight;
    }
    
    // تطبيق عامل التناسب للتطابق مع وحدة قياس السيرفر
    imageWidth = imageWidth * (imageSize.width / BASE_IMAGE_WIDTH);
    imageHeight = imageHeight * (imageSize.width / BASE_IMAGE_WIDTH);
    
    // لون الخلفية المستخدم في مكان الصورة
    const placeholderColor = style.backgroundColor || '#e2e8f0';
    
    // استخدام بيانات النموذج لعرض الصورة إذا كانت متوفرة
    const imageUrl = formData && formData[field.name] ? formData[field.name] : null;
    
    return (
      <Group
        key={`field-${field.id}`}
        x={position.x}
        y={position.y}
        draggable={!isTransforming && !locked}
        rotation={rotation}
        id={`field-${field.id}`}
        onClick={(e) => {
          e.cancelBubble = true;
          let newSelectedIds = [];
          
          if (e.evt.shiftKey) {
            // تعديل التحديد المتعدد مع Shift
            if (selectedIds.includes(field.id)) {
              newSelectedIds = selectedIds.filter(id => id !== field.id);
            } else {
              newSelectedIds = [...selectedIds, field.id];
            }
          } else {
            // تحديد حقل واحد فقط
            newSelectedIds = [field.id];
          }
          
          setSelectedIds(newSelectedIds);
          if (onFieldSelect) {
            if (newSelectedIds.length === 1) {
              onFieldSelect(newSelectedIds[0]);
            } else {
              onFieldSelect(null);
            }
          }
        }}
        onDragStart={(e) => {
          if (locked) {
            e.evt.preventDefault();
            return;
          }
          e.evt.stopPropagation();
          setIsDragging(true);
          saveHistory();
        }}
        onDragMove={(e) => {
          if (locked) return;
          e.evt.stopPropagation();
          const pos = e.target.position();
          const { x, y, guidelines: newGuidelines } = checkSnapping(pos.x, pos.y, field.id);
          
          setGuidelines(newGuidelines);
          
          e.target.position({ x, y });
        }}
        onDragEnd={(e) => {
          if (locked) return;
          e.evt.stopPropagation();
          setIsDragging(false);
          
          const pos = e.target.position();
          
          // تحويل الإحداثيات إلى نسب مئوية
          const newX = (pos.x / imageSize.width) * 100;
          const newY = (pos.y / imageSize.height) * 100;
          
          // تحديد إذا كان يجب تفعيل التجاذب للموضع
          const currentSnapToGrid = field.position.snapToGrid !== undefined
            ? field.position.snapToGrid
            : snapToGrid;
          
          setGuidelines({});
          
          onFieldsChange(
            fields.map(f => {
              if (f.id === field.id) {
                return {
                  ...f,
                  position: {
                    x: newX,
                    y: newY,
                    snapToGrid: currentSnapToGrid
                  }
                };
              }
              return f;
            })
          );
        }}
      >
        {/* خلفية مستطيلة للصورة */}
        <Rect
          width={imageWidth}
          height={imageHeight}
          fill={placeholderColor}
          strokeWidth={2}
          stroke={style.imageBorder ? '#94a3b8' : undefined}
          cornerRadius={style.imageRounded ? 8 : 0}
          opacity={0.8}
          perfectDrawEnabled={false}
          shadowColor={style.imageShadow?.enabled ? (style.imageShadow.color || 'rgba(0, 0, 0, 0.3)') : undefined}
          shadowBlur={style.imageShadow?.enabled ? (style.imageShadow.blur || 4) : undefined}
          shadowOffset={style.imageShadow?.enabled ? {
            x: style.imageShadow.offsetX || 2,
            y: style.imageShadow.offsetY || 2
          } : undefined}
          offsetX={imageWidth / 2}
          offsetY={imageHeight / 2}
        />
        
        {/* رمز الصورة في المنتصف */}
        {!imageUrl && (
          <Text
            text="🖼️"
            fontSize={imageHeight / 4}
            fill="#64748b"
            align="center"
            verticalAlign="middle"
            width={imageWidth}
            height={imageHeight}
            offsetX={imageWidth / 2}
            offsetY={imageHeight / 2}
          />
        )}
        
        {/* عرض الصورة إذا كانت متوفرة في formData */}
        {imageUrl && (
          // استخدام KonvaImage لعرض الصورة الحقيقية
          <KonvaImage
            image={undefined} // سيتم تعيينه بواسطة useEffect إذا تم تحميل الصورة بنجاح
            width={imageWidth}
            height={imageHeight}
            offsetX={imageWidth / 2}
            offsetY={imageHeight / 2}
            ref={(node) => {
              if (node && imageUrl) {
                const img = new window.Image();
                img.crossOrigin = 'Anonymous';
                img.src = imageUrl;
                img.onload = () => {
                  node.image(img);
                  node.getLayer()?.batchDraw();
                };
              }
            }}
          />
        )}
        
        {/* تسمية الحقل أسفل الصورة للتوضيح */}
        <Text
          text={field.label || field.name}
          fontSize={12 * (imageSize.width / BASE_IMAGE_WIDTH)}
          fill="#475569"
          align="center"
          width={imageWidth}
          height={20 * (imageSize.width / BASE_IMAGE_WIDTH)}
          y={imageHeight / 2 + 10 * (imageSize.width / BASE_IMAGE_WIDTH)}
          offsetX={imageWidth / 2}
        />
      </Group>
    );
  };

  // رسم الشبكة لتسهيل محاذاة العناصر
  const renderGrid = () => {
    if (!gridEnabled) return null;
    
    const lines = [];
    
    // خطوط عمودية للشبكة
    for (let x = 0; x <= imageSize.width; x += gridSize) {
      lines.push(
        <Line
          key={`vertical-${x}`}
          points={[x, 0, x, imageSize.height]}
          stroke="#cbd5e1"
          strokeWidth={0.5}
          opacity={0.5}
        />
      );
    }
    
    // خطوط أفقية للشبكة
    for (let y = 0; y <= imageSize.height; y += gridSize) {
      lines.push(
        <Line
          key={`horizontal-${y}`}
          points={[0, y, imageSize.width, y]}
          stroke="#cbd5e1"
          strokeWidth={0.5}
          opacity={0.5}
        />
      );
    }
    
    return lines;
  };

  // رسم خطوط الإرشاد لتسهيل المحاذاة
  const renderGuidelines = () => {
    return Object.values(guidelines).map((guide: any, i) => {
      const { position, orientation } = guide;
      const points = orientation === 'horizontal'
        ? [0, position, imageSize.width, position]
        : [position, 0, position, imageSize.height];
      
      return (
        <Line
          key={`guide-${i}`}
          points={points}
          stroke="#3b82f6"
          strokeWidth={1}
          dash={[4, 4]}
        />
      );
    });
  };

  // معالجة التحويل (تغيير الحجم والتدوير)
  const handleTransform = (e: any) => {
    e.cancelBubble = true;
    
    // معالجة تحويل صورة القالب
    if (selectedIds.length === 1 && selectedIds[0] === -1) {
      const node = e.target;
      if (node) {
        // تحديث حجم وموضع صورة القالب
        const newScale = {
          x: node.scaleX(),
          y: node.scaleY()
        };
        
        const newPosition = {
          x: node.x(),
          y: node.y()
        };
        
        const newRotation = node.rotation();
        
        // تحديث القيم في الstate
        setTemplateImagePosition(newPosition);
        setTemplateImageSize({
          width: imageSize.width * newScale.x,
          height: imageSize.height * newScale.y
        });
        
        return;
      }
    }
    
    // معالجة تحويل الحقول العادية
    if (selectedIds.length !== 1) return;
    
    const fieldId = selectedIds[0];
    const field = fields.find(f => f.id === fieldId);
    
    if (!field) return;
    
    // الحصول على الnode المُحدد
    const node = e.currentTarget;
    
    // الحصول على القياسات الجديدة
    const transform = node.getTransform();
    
    // قياسات التحويل
    const scaleX = transform.m[0];
    const scaleY = transform.m[3];
    const newRotation = node.rotation();
    
    // حساب الحجم الجديد
    let newWidth = field.size?.width || 200;
    let newHeight = field.size?.height || 50;
    
    if (field.type === 'text') {
      newWidth = (field.style?.width || 200) * scaleX;
      newHeight = (field.style?.height || 50) * scaleY;
    } else {
      newWidth = (field.style?.imageMaxWidth || 200) * scaleX;
      newHeight = (field.style?.imageMaxHeight || 200) * scaleY;
    }

    // تحديث المقاييس على الكائن
    node.setAttrs({
      scaleX: 1,
      scaleY: 1,
    });
    
    // عرض معلومات التحويل عند التحكم بالحقل
    const infoElement = document.getElementById('transform-info');
    if (infoElement) {
      infoElement.textContent = `Width: ${Math.round(newWidth)}, Height: ${Math.round(newHeight)}, Rotation: ${Math.round(newRotation)}°`;
      infoElement.style.display = 'block';
    }
    
    // تحديث الحقل مباشرة في الحالة لرؤية التغييرات في الوقت الحقيقي
    onFieldsChange(
      fields.map(f => {
        if (f.id === fieldId) {
          // تحديث الحجم والدوران
          const updatedField = {
            ...f,
            rotation: newRotation,
            size: {
              width: newWidth,
              height: newHeight
            }
          };
          
          // إذا كان الحقل نصيًا، نحدث أيضًا عرض وارتفاع النص
          if (f.type === 'text') {
            updatedField.style = {
              ...f.style,
              width: newWidth,
              height: newHeight
            };
          } else {
            // وإذا كان الحقل صورة، نحدث الأبعاد القصوى للصورة
            updatedField.style = {
              ...f.style,
              imageMaxWidth: newWidth,
              imageMaxHeight: newHeight
            };
          }
          
          return updatedField;
        }
        return f;
      })
    );
  };

  const handleTransformEnd = (e: any) => {
    e.cancelBubble = true;
    setIsTransforming(false);
    
    // إخفاء معلومات التحويل
    const infoElement = document.getElementById('transform-info');
    if (infoElement) {
      infoElement.style.display = 'none';
    }
    
    // معالجة حالة صورة القالب
    if (selectedIds.length === 1 && selectedIds[0] === -1) {
      const node = e.target;
      if (node) {
        // الحصول على أحدث قيم التحويل
        const newScale = {
          x: node.scaleX(),
          y: node.scaleY()
        };
        
        const newPosition = {
          x: node.x(),
          y: node.y()
        };
        
        const newRotation = node.rotation();
        
        // تحديث القيم النهائية في state
        setTemplateImagePosition(newPosition);
        setTemplateImageSize({
          width: imageSize.width * newScale.x,
          height: imageSize.height * newScale.y
        });
        
        // إعادة تعيين المقياس إلى 1 بعد تطبيق التغييرات
        node.scaleX(1);
        node.scaleY(1);
      }
    }
    
    // حفظ التاريخ بعد التحويل
    saveHistory();
  };

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
      
      {/* عنصر لعرض معلومات التحويل أثناء تغيير الحجم أو التدوير */}
      <div id="transform-info" className="absolute top-4 left-4 bg-white px-2 py-1 rounded shadow-md text-sm hidden z-40"></div>
      
      {/* مساحة الإنشاء Konva */}
      <Stage
        ref={stageRef}
        width={imageSize.width}
        height={imageSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onClick={(e) => {
          // إلغاء التحديد عند النقر خارج أي حقل
          if (e.target === e.currentTarget) {
            setSelectedIds([]);
            if (onFieldSelect) {
              onFieldSelect(null);
            }
          }
        }}
      >
        {/* طبقة الخلفية البيضاء والشبكة */}
        <Layer>
          {/* خلفية بيضاء بنفس أبعاد الصورة */}
          <Rect
            x={0}
            y={0}
            width={imageSize.width}
            height={imageSize.height}
            fill="white"
          />
          
          {/* رسم الشبكة للتوجيه */}
          {renderGrid()}
        </Layer>
        
        {/* طبقة الحقول القابلة للسحب */}
        <Layer>
          {/* 
           * ترتيب جميع الحقول بما فيها صورة القالب حسب الـ zIndex
           * هذا النظام يسمح بوضع الحقول أمام أو خلف صورة القالب مثل نظام فوتوشوب
           * مثال: إذا كانت قيمة zIndex للحقل أقل من قيمة zIndex لصورة القالب، فسيظهر الحقل خلف الصورة
           * وإذا كانت قيمة zIndex للحقل أكبر من قيمة zIndex لصورة القالب، فسيظهر الحقل أمام الصورة
           * يمكن تغيير فيمة zIndex من خلال لوحة الطبقات ونقل العناصر للأعلى أو الأسفل
           */}
          {allFields
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((field, index) => {
              if (field.type === 'text') {
                return renderTextField(field, index);
              } else if (field.type === 'image') {
                return renderImageField(field, index);
              } else if (field.type === 'template' && isTemplateImageLoaded && templateImageObj) {
                // رسم صورة القالب كطبقة مثل بقية الحقول
                return (
                  <Group
                    key="template-image-group"
                    id={`field-${field.id}`} // تعديل مهم: استخدام نفس نمط التسمية ليعمل مع المحول (transformer)
                    x={templateImagePosition.x}
                    y={templateImagePosition.y}
                    draggable={isTemplateImageDraggable && !locked}
                    visible={field.visible !== false} // للتحكم في رؤية الطبقة
                    opacity={1}
                    onDragStart={() => {
                      saveHistory();
                      setGuidelines({});
                    }}
                    onDragMove={(e) => {
                      if (snapToGrid) {
                        const { x, y, guidelines: newGuidelines } = checkSnapping(e.target.x(), e.target.y(), field.id);
                        setGuidelines(newGuidelines);
                        e.target.position({ x, y });
                      }
                    }}
                    onDragEnd={(e) => {
                      setTemplateImagePosition({
                        x: e.target.x(),
                        y: e.target.y()
                      });
                      setGuidelines({});
                      // نقوم أيضاً بتحديث الموقع في templateField ليتم حفظه
                      const updatedFields = [...fields];
                      onFieldsChange(updatedFields);
                    }}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      // تحديد الطبقة بنفس طريقة الحقول الأخرى
                      // إذا كان Shift مضغوطاً، قم بإضافة/إزالة الحقل من التحديد
                      let newSelectedIds: number[] = [];
                      if (e.evt.shiftKey) {
                        if (selectedIds.includes(field.id)) {
                          newSelectedIds = selectedIds.filter(id => id !== field.id);
                        } else {
                          newSelectedIds = [...selectedIds, field.id];
                        }
                      } else {
                        // تحديد هذه الطبقة فقط
                        newSelectedIds = [field.id];
                      }
                      
                      setSelectedIds(newSelectedIds);
                      if (onFieldSelect) {
                        if (newSelectedIds.length === 1) {
                          onFieldSelect(newSelectedIds[0]);
                        } else {
                          onFieldSelect(null);
                        }
                      }
                    }}
                  >
                    <KonvaImage
                      ref={templateImageRef}
                      image={templateImageObj}
                      width={templateImageSize.width || imageSize.width}
                      height={templateImageSize.height || imageSize.height}
                      rotation={(field.rotation || 0)}
                    />
                  </Group>
                );
              }
              return null;
            })}
          
          {/* خطوط التوجيه للمحاذاة */}
          {renderGuidelines()}
          
          {/* Transformer لتغيير حجم وتدوير الحقول */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // حد أدنى للحجم
              if (newBox.width < 10 || newBox.height < 10) {
                return oldBox;
              }
              return newBox;
            }}
            enabledAnchors={locked ? [] : [
              'top-left', 'top-center', 'top-right', 
              'middle-right', 'middle-left', 
              'bottom-left', 'bottom-center', 'bottom-right'
            ]}
            rotateEnabled={!locked}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            resizeEnabled={!locked}
            keepRatio={false}
            onTransformStart={() => {
              setIsTransforming(true);
              saveHistory();
            }}
            onTransform={handleTransform}
            onTransformEnd={handleTransformEnd}
            borderStroke="#3b82f6"
            borderStrokeWidth={2}
            borderDash={[5, 5]}
            anchorCornerRadius={4}
            anchorStroke="#3b82f6"
            anchorFill="#ffffff"
            anchorSize={8}
            rotateAnchorOffset={30}
            rotateAnchorColor="#3b82f6"
          />

          {/* كرة التدوير العلوية */}
          {selectedIds.length === 1 && (
            <Circle
              ref={rotateHandleRef}
              x={0}
              y={0}
              radius={10}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth={2}
              draggable={true}
              visible={false} // سيتم تحديثه بواسطة transformer
            />
          )}
        </Layer>
      </Stage>

      {/* شريط أدوات التحرير */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 rtl:space-x-reverse bg-white px-3 py-2 rounded-lg shadow-md border border-gray-200">
        {/* أزرار التراجع والإعادة */}
        <button
          className={`p-1.5 rounded-md ${history.length > 0 ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400'}`}
          disabled={history.length === 0}
          onClick={undo}
          title="تراجع (Ctrl+Z)"
        >
          <RotateCcw size={18} />
        </button>
        
        <button
          className={`p-1.5 rounded-md ${future.length > 0 ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400'}`}
          disabled={future.length === 0}
          onClick={redo}
          title="إعادة (Ctrl+Y)"
        >
          <RotateCw size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        
        {/* زر تفعيل/تعطيل الشبكة */}
        <button
          className={`p-1.5 rounded-md ${gridEnabled ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => {
            const newSettings = { ...editorSettings, gridEnabled: !gridEnabled };
            if (onFieldsChange) {
              // حفظ إعدادات المحرر مع الحقول
              const updatedFields = [...fields];
              onFieldsChange(updatedFields);
            }
          }}
          title="إظهار/إخفاء الشبكة"
        >
          <Grid size={18} />
        </button>
        
        {/* زر تفعيل/تعطيل الالتصاق بالشبكة */}
        <button
          className={`p-1.5 rounded-md ${snapToGrid ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => {
            const newSettings = { ...editorSettings, snapToGrid: !snapToGrid };
            if (onFieldsChange) {
              // حفظ إعدادات المحرر مع الحقول
              const updatedFields = [...fields];
              onFieldsChange(updatedFields);
            }
          }}
          title="تفعيل/تعطيل الالتصاق بالشبكة"
        >
          <Magnet size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        
        {/* أزرار التكبير والتصغير */}
        <button
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          onClick={() => {
            setStageScale(scale => Math.min(scale * 1.2, 3));
          }}
          title="تكبير"
        >
          <ZoomIn size={18} />
        </button>
        
        <button
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          onClick={() => {
            setStageScale(scale => Math.max(scale / 1.2, 0.3));
          }}
          title="تصغير"
        >
          <ZoomOut size={18} />
        </button>
        
        {/* زر تحريك القالب */}
        <button
          className={`p-1.5 rounded-md ${isTemplateImageDraggable ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setIsTemplateImageDraggable(!isTemplateImageDraggable)}
          title={isTemplateImageDraggable ? "إيقاف تحريك القالب" : "تفعيل تحريك القالب"}
        >
          <Move size={18} />
        </button>
        
        {/* زر طبقة صورة القالب (تعديل zIndex) */}
        <button
          className={`p-1.5 rounded-md text-blue-600 bg-blue-50`}
          onClick={() => {
            // تغيير قيمة zIndex لصورة القالب
            // القيمة -10 للخلفية (zIndex منخفض)
            // القيمة 100 للمقدمة (zIndex مرتفع)
            // القيمة 0 للوسط (بين الحقول حسب ترتيبها)
            let newZIndex = 0;
            if (templateImageLayer <= -10) newZIndex = 0; // من الخلف إلى الوسط
            else if (templateImageLayer >= 0 && templateImageLayer < 100) newZIndex = 100; // من الوسط إلى المقدمة
            else newZIndex = -10; // من المقدمة إلى الخلف

            const newSettings = { ...editorSettings, templateImageLayer: newZIndex };
            if (onFieldsChange) {
              // حفظ إعدادات المحرر مع الحقول
              const updatedFields = [...fields];
              onFieldsChange(updatedFields);
            }
          }}
          title={
            templateImageLayer <= -10 ? "انقل إلى الوسط" : 
            (templateImageLayer >= 0 && templateImageLayer < 100) ? "انقل إلى المقدمة" : 
            "انقل إلى الخلف"
          }
        >
          {templateImageLayer <= -10 ? 
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M12 7v10"/>
            </svg> : 
            (templateImageLayer >= 0 && templateImageLayer < 100) ? 
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M15 7v10"/>
            </svg> :
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 7v10"/>
            </svg>
          }
        </button>
        
        {/* إضافة زر قفل المحرر لمنع التحرير */}
        <button
          className={`p-1.5 rounded-md ${locked ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => {
            const newSettings = { ...editorSettings, locked: !locked };
            if (onFieldsChange) {
              const updatedFields = [...fields];
              onFieldsChange(updatedFields);
            }
          }}
          title={locked ? "إلغاء قفل المحرر" : "قفل المحرر"}
        >
          {locked ? <Lock size={18} /> : <Unlock size={18} />}
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        
        {/* زر توليد صورة نهائية */}
        <button
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          onClick={() => {
            // الحصول على صورة
            const dataURL = stageRef.current.toDataURL();
            
            // فتح نافذة جديدة مع الصورة
            const win = window.open("", "_blank");
            if (win) {
              win.document.write(`<html><body><img src="${dataURL}" alt="Generated Image" /></body></html>`);
            }
          }}
          title="تنزيل صورة"
        >
          <Download size={18} />
        </button>
      </div>
      
      {/* اظهار معلومات التحكم عند تحديد حقل */}
      {showControls && selectedIds.length === 1 && (
        <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded-lg shadow-md text-sm border border-gray-200">
          <div className="text-gray-600">استخدم المقابض لتعديل الحجم والتدوير:</div>
          <div className="text-gray-500 text-xs mt-1">
            <span className="inline-block bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 mr-1">Shift + سحب</span>
            <span>للحفاظ على نسبة العرض إلى الارتفاع</span>
          </div>
          <div className="text-gray-500 text-xs mt-1">
            <span className="inline-block bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 mr-1">Ctrl + أسهم</span>
            <span>لتدوير الحقل</span>
          </div>
          <div className="text-gray-500 text-xs mt-1">
            <span className="inline-block bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 mr-1">أسهم</span>
            <span>لتحريك الحقل</span>
          </div>
        </div>
      )}
      
      {/* اظهار معلومات التحكم عند تحديد صورة القالب */}
      {showControls && selectedIds.length === 1 && selectedIds[0] === -1 && (
        <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded-lg shadow-md text-sm border border-gray-200">
          <div className="text-gray-600">تحكم بصورة القالب:</div>
          <div className="text-gray-500 text-xs mt-1">
            <span className="inline-block bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 mr-1">زر تحريك القالب</span>
            <span>لتفعيل/تعطيل سحب القالب</span>
          </div>
          <div className="text-gray-500 text-xs mt-1">
            <span className="inline-block bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 mr-1">زر طبقة القالب</span>
            <span>لنقل الصورة للأمام/للخلف</span>
          </div>
          <div className="text-gray-500 text-xs mt-1">
            <span className="inline-block bg-green-100 text-green-800 rounded px-1.5 py-0.5 mr-1 font-bold">جديد!</span>
            <span>يمكنك الآن تحجيم وتدوير صورة القالب</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggableFieldsPreviewPro;