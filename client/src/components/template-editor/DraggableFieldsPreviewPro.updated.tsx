/*
نسخة متكاملة من DraggableFieldsPreview
- توليد صورة PNG
- تحديد متعدد
- Undo/Redo
- شريط أدوات أنيق
- مقابض للتحجيم والتدوير
*/

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group, Rect, Line, Circle, Transformer } from 'react-konva';
import { Download, RotateCcw, RotateCw, ZoomIn, ZoomOut, Grid, Magnet } from 'lucide-react';

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
  type: 'text' | 'image';
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
    templateImageLayer = 0
  } = editorSettings;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const templateImageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const rotateHandleRef = useRef<any>(null);
  
  const [isTemplateImageLoaded, setIsTemplateImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<FieldType[][]>([]);
  const [future, setFuture] = useState<FieldType[][]>([]);
  const [guidelines, setGuidelines] = useState<any>({});
  const [isTransforming, setIsTransforming] = useState(false);
  
  // تحميل صورة القالب
  useEffect(() => {
    if (!templateImage) return;
    
    const image = new window.Image();
    image.crossOrigin = 'Anonymous';
    image.src = templateImage;
    
    image.onload = () => {
      setIsTemplateImageLoaded(true);
      
      // حساب الأبعاد المناسبة مع الحفاظ على نسبة العرض إلى الارتفاع
      const containerWidth = containerRef.current?.clientWidth || 800;
      const scale = containerWidth / image.width;
      const width = containerWidth;
      const height = image.height * scale;
      
      setImageSize({ width, height });
      
      // إعادة تعيين موضع المرحلة بعد تحميل الصورة
      setStagePos({ x: 0, y: 0 });
      setStageScale(1);
    };
    
    image.onerror = () => {
      console.error('Error loading template image');
      setIsTemplateImageLoaded(false);
    };
  }, [templateImage]);
  
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
      } else {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
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
        draggable={!isTransforming}
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
          e.evt.stopPropagation();
          setIsDragging(true);
          saveHistory();
        }}
        onDragMove={(e) => {
          e.evt.stopPropagation();
          const pos = e.target.position();
          const { x, y, guidelines: newGuidelines } = checkSnapping(pos.x, pos.y, field.id);
          
          setGuidelines(newGuidelines);
          
          e.target.position({ x, y });
        }}
        onDragEnd={(e) => {
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
    const position = getFieldPosition(field);
    const style = field.style || {};
    
    // تحديد حجم الصورة مع تطبيق عامل تناسب الحجم للتطابق مع السيرفر
    let fieldWidth = style.imageMaxWidth || 200;
    let fieldHeight = style.imageMaxHeight || 200;
    
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
    
    // عرض منطقة الصورة بخلفية إذا كانت قيمة الصورة غير متوفرة
    // عرض placeholder للصورة
    return (
      <Group
        key={`field-${field.id}`}
        x={position.x}
        y={position.y}
        draggable={!isTransforming}
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
          e.evt.stopPropagation();
          setIsDragging(true);
          saveHistory();
        }}
        onDragMove={(e) => {
          e.evt.stopPropagation();
          const pos = e.target.position();
          const { x, y, guidelines: newGuidelines } = checkSnapping(pos.x, pos.y, field.id);
          
          setGuidelines(newGuidelines);
          
          e.target.position({ x, y });
        }}
        onDragEnd={(e) => {
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
        {/* موضع الصورة */}
        <Rect
          width={fieldWidth}
          height={fieldHeight}
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth={1}
          cornerRadius={style.imageRounded ? 5 : 0}
          opacity={0.7}
          perfectDrawEnabled={false}
          shadowColor={style.imageShadow?.enabled ? (style.imageShadow.color || 'rgba(0, 0, 0, 0.3)') : undefined}
          shadowBlur={style.imageShadow?.enabled ? (style.imageShadow.blur || 5) : undefined}
          shadowOffset={style.imageShadow?.enabled ? { 
            x: style.imageShadow.offsetX || 3, 
            y: style.imageShadow.offsetY || 3 
          } : undefined}
        />
        
        {/* أيقونة الصورة داخل الحقل */}
        <Rect
          width={Math.min(fieldWidth, 40)}
          height={Math.min(fieldHeight, 40)}
          fill="#e2e8f0"
          cornerRadius={3}
          x={fieldWidth / 2 - Math.min(fieldWidth, 40) / 2}
          y={fieldHeight / 2 - Math.min(fieldHeight, 40) / 2}
          perfectDrawEnabled={false}
        />
        
        {/* نص الحقل أسفل الصورة */}
        <Text
          text={field.label || field.name}
          fontSize={14 * (imageSize.width / BASE_IMAGE_WIDTH)}
          fontFamily="Cairo"
          fill="#64748b"
          width={fieldWidth}
          height={fieldHeight * 0.3}
          align="center"
          y={fieldHeight * 0.7}
          verticalAlign="middle"
        />
      </Group>
    );
  };

  // رسم خطوط الإرشاد
  const renderGuidelines = () => {
    if (!isDragging) return null;
    
    return Object.values(guidelines).map((guideline: any, i) => {
      return (
        <Line
          key={i}
          points={
            guideline.orientation === 'vertical'
              ? [guideline.position, 0, guideline.position, imageSize.height]
              : [0, guideline.position, imageSize.width, guideline.position]
          }
          stroke="#3b82f6"
          strokeWidth={1}
          dash={[5, 5]}
          opacity={0.8}
        />
      );
    });
  };

  // رسم الشبكة
  const renderGrid = () => {
    if (!gridEnabled) return null;
    
    const lines = [];
    
    // خطوط رأسية
    for (let i = 0; i <= imageSize.width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, imageSize.height]}
          stroke="#e2e8f0"
          strokeWidth={i % (gridSize * 5) === 0 ? 0.5 : 0.2}
        />
      );
    }
    
    // خطوط أفقية
    for (let i = 0; i <= imageSize.height; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, imageSize.width, i]}
          stroke="#e2e8f0"
          strokeWidth={i % (gridSize * 5) === 0 ? 0.5 : 0.2}
        />
      );
    }
    
    return lines;
  };

  // معالجة التحويل (التكبير/التصغير/التدوير)
  const handleTransform = (e: any) => {
    e.cancelBubble = true;
    
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
    
    // تحديث الحقل
    onFieldsChange(
      fields.map(f => {
        if (f.id === fieldId) {
          // حفظ الموضع (يتم تحديثه من onDragEnd)
          const updatedField = { ...f };
          
          // تحديث الحجم
          updatedField.size = {
            width: Math.round(newWidth),
            height: Math.round(newHeight)
          };
          
          // تحديث التدوير
          updatedField.rotation = newRotation;
          
          return updatedField;
        }
        return f;
      })
    );
    
    // إعادة تعيين التحويل لتجنب التراكم
    node.setAttrs({
      scaleX: 1,
      scaleY: 1
    });
  };

  // معالجة نهاية التحويل
  const handleTransformEnd = (e: any) => {
    e.cancelBubble = true;
    setIsTransforming(false);
    
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

      <Stage
        ref={stageRef}
        width={imageSize.width}
        height={imageSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        style={{ backgroundColor: '#f9fafb' }}
        draggable={true}
        onDragStart={e => {
          e.evt.stopPropagation();
        }}
        onDragMove={e => {
          e.evt.stopPropagation();
          setStagePos({ x: e.currentTarget.x(), y: e.currentTarget.y() });
        }}
        onClick={e => {
          if (e.target === e.currentTarget) {
            setSelectedIds([]);
            if (onFieldSelect) {
              onFieldSelect(null);
            }
          }
        }}
      >
        <Layer>
          {/* رسم الشبكة تحت كل شيء */}
          {renderGrid()}

          {/* رسم صورة القالب */}
          {templateImageLayer === 0 && (
            <KonvaImage
              ref={templateImageRef}
              image={new window.Image()}
              width={imageSize.width}
              height={imageSize.height}
              onLoad={e => {
                const img = e.target;
                img.getLayer().batchDraw();
              }}
              setAttrs={{
                image: (() => {
                  const img = new window.Image();
                  img.crossOrigin = 'Anonymous';
                  img.src = templateImage;
                  return img;
                })(),
              }}
            />
          )}

          {/* رسم خطوط الإرشاد */}
          {renderGuidelines()}

          {/* رسم الحقول */}
          {fields
            .filter(f => f.visible !== false)
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((field, index) => {
              return field.type === 'text'
                ? renderTextField(field, index)
                : renderImageField(field, index);
            })}

          {/* رسم صورة القالب فوق الحقول إذا كان templateImageLayer !== 0 */}
          {templateImageLayer !== 0 && (
            <KonvaImage
              ref={templateImageRef}
              image={new window.Image()}
              width={imageSize.width}
              height={imageSize.height}
              onLoad={e => {
                const img = e.target;
                img.getLayer().batchDraw();
              }}
              setAttrs={{
                image: (() => {
                  const img = new window.Image();
                  img.crossOrigin = 'Anonymous';
                  img.src = templateImage;
                  return img;
                })(),
              }}
            />
          )}

          {/* Transformer للتحجيم والتدوير */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // حد أدنى للحجم
              if (newBox.width < 10 || newBox.height < 10) {
                return oldBox;
              }
              return newBox;
            }}
            enabledAnchors={[
              'top-left', 'top-center', 'top-right', 
              'middle-right', 'middle-left', 
              'bottom-left', 'bottom-center', 'bottom-right'
            ]}
            rotateEnabled={true}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            resizeEnabled={true}
            keepRatio={false}
            onTransformStart={() => {
              setIsTransforming(true);
              saveHistory();
            }}
            onTransform={handleTransform}
            onTransformEnd={handleTransformEnd}
            borderStroke="#3b82f6"
            borderStrokeWidth={1}
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
        {/* زر التكبير */}
        <button
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
          onClick={() => {
            const newScale = stageScale * 1.1;
            setStageScale(newScale);
          }}
          title="تكبير"
        >
          <ZoomIn size={16} />
        </button>
        
        {/* زر التصغير */}
        <button
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
          onClick={() => {
            const newScale = stageScale / 1.1;
            setStageScale(newScale);
          }}
          title="تصغير"
        >
          <ZoomOut size={16} />
        </button>
        
        {/* فاصل */}
        <div className="h-6 border-r border-gray-300 mx-1"></div>
        
        {/* زر التراجع */}
        <button
          className={`p-2 hover:bg-gray-100 rounded-md transition-colors ${history.length > 0 ? 'text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
          onClick={undo}
          disabled={history.length === 0}
          title="تراجع"
        >
          <RotateCcw size={16} />
        </button>
        
        {/* زر الإعادة */}
        <button
          className={`p-2 hover:bg-gray-100 rounded-md transition-colors ${future.length > 0 ? 'text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
          onClick={redo}
          disabled={future.length === 0}
          title="إعادة"
        >
          <RotateCw size={16} />
        </button>
        
        {/* فاصل */}
        <div className="h-6 border-r border-gray-300 mx-1"></div>
        
        {/* زر إظهار/إخفاء الشبكة */}
        <button
          className={`p-2 hover:bg-gray-100 rounded-md transition-colors ${gridEnabled ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
          onClick={() => editorSettings.gridEnabled !== undefined && setGridEnabled(!gridEnabled)}
          title={gridEnabled ? 'إخفاء الشبكة' : 'إظهار الشبكة'}
        >
          <Grid size={16} />
        </button>
        
        {/* زر تفعيل/تعطيل التجاذب */}
        <button
          className={`p-2 hover:bg-gray-100 rounded-md transition-colors ${snapToGrid ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
          onClick={() => editorSettings.snapToGrid !== undefined && setSnapToGrid(!snapToGrid)}
          title={snapToGrid ? 'تعطيل التجاذب' : 'تفعيل التجاذب'}
        >
          <Magnet size={16} />
        </button>
      </div>
    </div>
  );
};