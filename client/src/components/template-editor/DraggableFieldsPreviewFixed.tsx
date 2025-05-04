/**
 * محرر القوالب مع دعم الطبقات
 * الإصدار 6.0 - مايو 2025
 * 
 * هذا المكون يعالج مشكلة Konva في تداخل Layer ويسمح بتحديد طبقات واضحة
 * 1. يتم دعم صورة القالب كطبقة مستقلة يمكن التحكم بها
 * 2. يمكن وضع الحقول أمام أو خلف الصورة عن طريق التحكم في ترتيب zIndex
 * 3. تم إصلاح مشكلة Layer المتداخلة باستخدام Group بشكل صحيح
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group, Rect, Line, Transformer } from 'react-konva';
import {
  Download, ZoomIn, ZoomOut, Grid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Konva from 'konva';

// العرض المرجعي للتصميم - يتطابق مع قيمة BASE_IMAGE_WIDTH في جميع مكونات النظام
const BASE_IMAGE_WIDTH = 1000;

export interface FieldType {
  id: number;
  name: string;
  label: string;
  labelAr?: string;
  type: 'text' | 'image' | 'dropdown' | 'radio' | string;
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: any;
  zIndex?: number;
  visible?: boolean;
  rotation?: number;
  locked?: boolean;
  defaultValue?: string;
  placeholder?: string;
  placeholderAr?: string;
  options?: { value: string; label: string }[];
}

interface EditorSettings {
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  snapThreshold?: number;
}

interface DraggableFieldsPreviewProps {
  templateImage: string;
  fields: FieldType[];
  onFieldsChange: (fields: FieldType[]) => void;
  editorSettings?: EditorSettings;
  showControls?: boolean;
  allowMultipleSelection?: boolean;
  allowResize?: boolean;
  onImageExport?: (imageDataUrl: string) => void;
  selectedFieldId?: number | null;
  onSelectedFieldChange?: (fieldId: number | null) => void;
  // خصائص جديدة للتحكم بصورة القالب كطبقة
  templateImageLayer?: number;
  isTemplateImageVisible?: boolean;
  onTemplateImageLayerChange?: (zIndex: number) => void;
  onTemplateImageVisibilityChange?: (visible: boolean) => void;
}

export const DraggableFieldsPreviewFixed: React.FC<DraggableFieldsPreviewProps> = ({
  templateImage,
  fields,
  onFieldsChange,
  editorSettings = {
    gridEnabled: true,
    snapToGrid: true,
    gridSize: 50,
    snapThreshold: 10
  },
  showControls = true,
  allowMultipleSelection = true,
  allowResize = true,
  onImageExport,
  selectedFieldId,
  onSelectedFieldChange,
  // قيم افتراضية لموقع صورة القالب في نظام الطبقات
  templateImageLayer = 0,
  isTemplateImageVisible = true,
  onTemplateImageLayerChange,
  onTemplateImageVisibilityChange
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  
  // متغيرات الحالة الأساسية
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [stageSize, setStageSize] = useState({ width: 1000, height: 600 });
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [templateImageObj, setTemplateImageObj] = useState<HTMLImageElement | null>(null);
  const [isTemplateImageLoaded, setIsTemplateImageLoaded] = useState<boolean>(false);
  const [templateImageSize, setTemplateImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [templateImagePosition, setTemplateImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // تحميل صورة القالب
  useEffect(() => {
    if (!templateImage) {
      setIsTemplateImageLoaded(false);
      setTemplateImageObj(null);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = templateImage;
    
    img.onload = () => {
      setTemplateImageObj(img);
      setIsTemplateImageLoaded(true);
      
      // تحديد حجم وموضع صورة القالب
      const aspectRatio = img.width / img.height;
      const width = BASE_IMAGE_WIDTH;
      const height = width / aspectRatio;
      setTemplateImageSize({ width, height });
      
      // توسيط الصورة
      setTemplateImagePosition({ x: 0, y: 0 });
      
      // ضبط حجم منصة العرض لتناسب الصورة
      setStageSize({ width, height });
    };
    
    img.onerror = () => {
      setIsTemplateImageLoaded(false);
      setTemplateImageObj(null);
    };
  }, [templateImage]);
  
  // إنشاء حقل قالب لمعالجة صورة القالب كطبقة نظامية
  const templateField = useMemo(() => ({
    id: -1, // معرف خاص لصورة القالب
    name: 'template_image',
    label: 'صورة القالب',
    type: 'template',
    position: templateImagePosition,
    zIndex: templateImageLayer,
    visible: isTemplateImageVisible,
    rotation: 0,
    size: templateImageSize
  }), [templateImagePosition, templateImageLayer, templateImageSize, isTemplateImageVisible]);
  
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
    if (!transformerRef.current || !stageRef.current) return;
    
    // الحصول على العناصر المحددة
    const nodes = selectedIds.map(id => {
      return stageRef.current?.findOne(`#field-${id}`);
    }).filter(Boolean) as Konva.Node[];
    
    // تحديث العناصر المحددة في الـ transformer
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds]);
  
  // رسم الشبكة
  const renderGrid = () => {
    if (!editorSettings.gridEnabled) return null;
    
    const gridSize = editorSettings.gridSize || 50;
    const lines: JSX.Element[] = [];
    
    // خطوط أفقية
    for (let i = 0; i < stageSize.height; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, stageSize.width, i]}
          stroke="#ddd"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      );
    }
    
    // خطوط عمودية
    for (let i = 0; i < stageSize.width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, stageSize.height]}
          stroke="#ddd"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      );
    }
    
    return lines;
  };
  
  // معالجة تغيير موضع الحقل
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, fieldId: number) => {
    const { x, y } = e.target.position();
    
    // تحديث مواضع الحقول
    const updatedFields = fields.map(field => {
      if (field.id === fieldId) {
        return {
          ...field,
          position: { x, y, snapToGrid: field.position.snapToGrid }
        };
      }
      return field;
    });
    
    onFieldsChange(updatedFields);
  };
  
  // معالجة اختيار حقل
  const handleSelectField = (fieldId: number, e: Konva.KonvaEventObject<any>) => {
    // إيقاف انتشار الحدث لمنع اختيار المنصة نفسها
    e.cancelBubble = true;
    
    let newSelectedIds: number[];
    
    // إضافة أو إزالة الحقل من القائمة المحددة
    if (allowMultipleSelection && e.evt.shiftKey) {
      // التحديد المتعدد مع مفتاح Shift
      newSelectedIds = [...selectedIds];
      const idIndex = selectedIds.indexOf(fieldId);
      
      if (idIndex === -1) {
        // إضافة الحقل للتحديد
        newSelectedIds.push(fieldId);
      } else {
        // إزالة الحقل من التحديد
        newSelectedIds.splice(idIndex, 1);
      }
    } else {
      // تحديد فردي
      newSelectedIds = [fieldId];
    }
    
    setSelectedIds(newSelectedIds);
    
    // إرسال التغيير للأعلى عند تحديد حقل واحد
    if (onSelectedFieldChange && newSelectedIds.length === 1) {
      onSelectedFieldChange(newSelectedIds[0]);
    } else if (onSelectedFieldChange && newSelectedIds.length === 0) {
      onSelectedFieldChange(null);
    }
  };
  
  // معالجة التغييرات بعد عملية التحويل (تدوير، تغيير حجم)
  const handleTransformEnd = (e: Konva.KonvaEventObject<any>) => {
    const node = e.target;
    const fieldId = parseInt(node.id().split('-')[1]);
    
    // البحث عن الحقل المحدد
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    // تحديث موضع وتدوير الحقل
    const newAttrs = {
      ...field,
      position: {
        x: node.x(),
        y: node.y(),
        snapToGrid: field.position.snapToGrid
      },
      rotation: node.rotation()
    };
    
    // تحديث قائمة الحقول
    const updatedFields = fields.map(f => {
      if (f.id === fieldId) {
        return newAttrs;
      }
      return f;
    });
    
    onFieldsChange(updatedFields);
  };
  
  // رسم حقل نصي
  const renderTextField = (field: FieldType, index: number) => {
    if (field.visible === false) return null;
    
    const style = field.style || {};
    const fontSize = style.fontSize || 24;
    const fontFamily = style.fontFamily || 'Arial';
    const fontWeight = style.fontWeight || 'normal';
    const color = style.color || '#000000';
    const align = style.align || 'center';
    const maxWidth = style.maxWidth || 300;
    const rotation = field.rotation || 0;
    
    return (
      <Group
        key={`field-${field.id}-${index}`}
        id={`field-${field.id}`}
        x={field.position.x || 0}
        y={field.position.y || 0}
        rotation={rotation}
        draggable={!field.locked}
        onClick={(e) => handleSelectField(field.id, e)}
        onTap={(e) => handleSelectField(field.id, e)}
        onDragEnd={(e) => handleDragEnd(e, field.id)}
        onTransformEnd={handleTransformEnd}
      >
        <Text
          text={field.defaultValue || field.label || field.name}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={fontWeight}
          fill={color}
          align={align}
          width={maxWidth}
          wrap="word"
        />
      </Group>
    );
  };
  
  // رسم حقل صورة
  const renderImageField = (field: FieldType, index: number) => {
    if (field.visible === false) return null;
    
    const style = field.style || {};
    const maxWidth = style.imageMaxWidth || 150;
    const maxHeight = style.imageMaxHeight || 150;
    const rotation = field.rotation || 0;
    
    // في حالة عدم وجود صورة فعلية، نعرض إطار يمثل مكان الصورة
    return (
      <Group
        key={`field-${field.id}-${index}`}
        id={`field-${field.id}`}
        x={field.position.x || 0}
        y={field.position.y || 0}
        rotation={rotation}
        draggable={!field.locked}
        onClick={(e) => handleSelectField(field.id, e)}
        onTap={(e) => handleSelectField(field.id, e)}
        onDragEnd={(e) => handleDragEnd(e, field.id)}
        onTransformEnd={handleTransformEnd}
      >
        <Rect
          width={maxWidth}
          height={maxHeight}
          fill="#f0f0f0"
          stroke="#ddd"
          strokeWidth={1}
          dash={[4, 4]}
        />
        <Text
          text={field.label || 'صورة'}
          fontSize={14}
          fill="#666"
          align="center"
          width={maxWidth}
          y={maxHeight / 2 - 7}
        />
      </Group>
    );
  };
  
  // تصدير الصورة كملف
  const handleExportImage = () => {
    if (!stageRef.current || !onImageExport) return;
    
    // التقاط الصورة من المنصة
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 2, // جودة عالية
      mimeType: 'image/png'
    });
    
    onImageExport(dataURL);
  };
  
  return (
    <div className="draggable-fields-preview">
      <div
        className="editor-controls flex justify-between items-center space-x-2 mb-4"
        dir="ltr"
      >
        <div className="zoom-controls flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(scale * 1.1)}
          >
            <ZoomIn className="h-4 w-4 mr-1" />
            تكبير
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(scale / 1.1)}
          >
            <ZoomOut className="h-4 w-4 mr-1" />
            تصغير
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
          >
            مناسب للشاشة
          </Button>
        </div>
        
        <div className="export-controls">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportImage}
          >
            <Download className="h-4 w-4 mr-1" />
            تصدير
          </Button>
        </div>
      </div>
      
      <div 
        className="editor-stage-container"
        style={{
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden',
          direction: 'ltr'
        }}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          ref={stageRef}
          draggable={true}
          onMouseDown={(e) => {
            // إلغاء تحديد الكل عند النقر على الخلفية
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty) {
              setSelectedIds([]);
              if (onSelectedFieldChange) onSelectedFieldChange(null);
            }
          }}
          onClick={(e) => {
            // إذا كان النقر على الخلفية بدلاً من عنصر
            if (e.target === e.currentTarget) {
              setSelectedIds([]);
            }
          }}
          onWheel={(e) => {
            e.evt.preventDefault();
            const scaleBy = 1.05;
            const stage = stageRef.current;
            if (!stage) return;
            
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            
            const mousePointTo = {
              x: (pointer.x - stage.x()) / oldScale,
              y: (pointer.y - stage.y()) / oldScale,
            };
            
            const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            
            setScale(newScale);
            
            // تحديث موضع المنصة لجعل التكبير يحدث عند مؤشر الماوس
            const newPos = {
              x: pointer.x - mousePointTo.x * newScale,
              y: pointer.y - mousePointTo.y * newScale,
            };
            
            setPosition(newPos);
          }}
        >
          <Layer ref={layerRef}>
            {/* خلفية بيضاء للقالب */}
            <Rect
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
              fill="white"
            />
            
            {/* الشبكة */}
            {renderGrid()}
            
            {/* 
             * ترتيب جميع الحقول بما فيها صورة القالب حسب الـ zIndex
             * هذا النظام يسمح بوضع الحقول أمام أو خلف صورة القالب مثل نظام فوتوشوب
             * مثال: إذا كانت قيمة zIndex للحقل أقل من قيمة zIndex لصورة القالب، فسيظهر الحقل خلف الصورة
             * وإذا كانت قيمة zIndex للحقل أكبر من قيمة zIndex لصورة القالب، فسيظهر الحقل أمام الصورة
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
                  if (!isTemplateImageVisible) return null;
                  
                  return (
                    <Group
                      key="template-image-group"
                      id={`field-${field.id}`}
                    >
                      <KonvaImage
                        image={templateImageObj}
                        width={templateImageSize.width}
                        height={templateImageSize.height}
                        x={templateImagePosition.x}
                        y={templateImagePosition.y}
                        listening={false} // لا تستجيب لنقرات الماوس
                      />
                    </Group>
                  );
                }
                return null;
              })}
            
            {/* ترانسفورمر لتحريك وتدوير العناصر */}
            {showControls && allowResize && (
              <Transformer
                ref={transformerRef}
                rotateEnabled={true}
                resizeEnabled={false} // تعطيل تغيير الحجم للتبسيط
                boundBoxFunc={(oldBox, newBox) => {
                  return newBox;
                }}
                onTransformEnd={handleTransformEnd}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DraggableFieldsPreviewFixed;