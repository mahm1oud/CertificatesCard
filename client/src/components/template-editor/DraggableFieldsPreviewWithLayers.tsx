/**
 * مكون معاينة الحقول القابلة للسحب مع دعم الطبقات
 * الإصدار 5.1 - مايو 2025
 * 
 * هذا المكون يجمع بين مميزات المكونات السابقة مع دعم صريح لصورة القالب كطبقة
 * 
 * الميزات الجديدة:
 * - التحكم في في جميع جوانب صورة القالب من الخارج (طبقة، رؤية)
 * - ضمان تحديث لوحة الطبقات بشكل صحيح
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group, Rect, Line, Transformer } from 'react-konva';
import {
  Download, RotateCcw, RotateCw, ZoomIn, ZoomOut, Grid, Magnet,
  Copy, Trash2, MoveUp, MoveDown, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Konva from 'konva';

// العرض المرجعي للتصميم الأصلي - يتطابق مع القيمة في جميع مكونات النظام
const BASE_IMAGE_WIDTH = 1000;

interface FieldType {
  id: number;
  name: string;
  label?: string;
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

export const DraggableFieldsPreviewWithLayers: React.FC<DraggableFieldsPreviewProps> = ({
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
  const containerRef = useRef<HTMLDivElement>(null);
  
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
    
    // تعيين العناصر المحددة للمحول
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
    
    // إرسال الحقل المحدد للمكون الأب
    if (onSelectedFieldChange) {
      if (selectedIds.length === 0) {
        onSelectedFieldChange(null);
      } else {
        const fieldId = selectedIds[0];
        // لا ترسل صورة القالب كحقل محدد لتحريره
        if (fieldId !== -1) {
          onSelectedFieldChange(fieldId);
        }
      }
    }
  }, [selectedIds, onSelectedFieldChange]);
  
  // إعدادات الشبكة والتجاذب
  const snapToGrid = (pos: { x: number; y: number }) => {
    if (!editorSettings?.snapToGrid) return pos;
    
    const gridSize = editorSettings?.gridSize || 50;
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize
    };
  };
  
  // رسم حقل نصي
  const renderTextField = (field: FieldType, index: number) => {
    // تجاهل الحقول غير المرئية
    if (field.visible === false) return null;
    
    const style = field.style || {};
    const text = field.defaultValue || field.label || field.placeholder || field.name;
    
    // إعدادات النص
    const fontSize = style.fontSize || 24;
    const fontFamily = style.fontFamily || 'Cairo';
    const fontWeight = style.fontWeight || 'normal';
    const color = style.color || '#000';
    const maxWidth = style.maxWidth || 300;
    const align = style.align || 'center';
    
    // طبق النص مع التدوير
    return (
      <Group
        key={field.id}
        id={`field-${field.id}`}
        x={field.position.x}
        y={field.position.y}
        rotation={field.rotation || 0}
        draggable={!field.locked && showControls}
        onDragStart={() => {
          if (!allowMultipleSelection) {
            setSelectedIds([field.id]);
          }
        }}
        onDragEnd={(e) => {
          const pos = snapToGrid({
            x: e.target.x(),
            y: e.target.y()
          });
          
          // تحديث موضع الحقل
          const updatedFields = fields.map(f => {
            if (f.id === field.id) {
              return {
                ...f,
                position: pos
              };
            }
            return f;
          });
          
          onFieldsChange(updatedFields);
        }}
        onClick={() => {
          if (allowMultipleSelection) {
            // إضافة أو إزالة من التحديد المتعدد
            if (selectedIds.includes(field.id)) {
              setSelectedIds(selectedIds.filter(id => id !== field.id));
            } else {
              setSelectedIds([...selectedIds, field.id]);
            }
          } else {
            // تحديد فردي
            setSelectedIds([field.id]);
          }
        }}
        onTap={() => {
          setSelectedIds([field.id]);
        }}
      >
        <Text
          text={text}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={fontWeight}
          fill={color}
          width={maxWidth}
          align={align}
          verticalAlign="middle"
          padding={10}
          wrap="word"
        />
      </Group>
    );
  };
  
  // رسم حقل صورة
  const renderImageField = (field: FieldType, index: number) => {
    // تجاهل الحقول غير المرئية
    if (field.visible === false) return null;
    
    // لا رسم لحقل الصورة بدون قيمة
    if (!field.defaultValue) {
      return (
        <Group
          key={field.id}
          id={`field-${field.id}`}
          x={field.position.x}
          y={field.position.y}
          rotation={field.rotation || 0}
          draggable={!field.locked && showControls}
          onDragStart={() => {
            if (!allowMultipleSelection) {
              setSelectedIds([field.id]);
            }
          }}
          onDragEnd={(e) => {
            const pos = snapToGrid({
              x: e.target.x(),
              y: e.target.y()
            });
            
            // تحديث موضع الحقل
            const updatedFields = fields.map(f => {
              if (f.id === field.id) {
                return {
                  ...f,
                  position: pos
                };
              }
              return f;
            });
            
            onFieldsChange(updatedFields);
          }}
          onClick={() => {
            if (allowMultipleSelection) {
              // إضافة أو إزالة من التحديد المتعدد
              if (selectedIds.includes(field.id)) {
                setSelectedIds(selectedIds.filter(id => id !== field.id));
              } else {
                setSelectedIds([...selectedIds, field.id]);
              }
            } else {
              // تحديد فردي
              setSelectedIds([field.id]);
            }
          }}
          onTap={() => {
            setSelectedIds([field.id]);
          }}
        >
          <Rect
            width={100}
            height={100}
            fill="#f0f0f0"
            stroke="#ddd"
            strokeWidth={1}
            cornerRadius={4}
            dash={[5, 5]}
          />
          <Text
            text="صورة"
            fontSize={14}
            fontFamily="Cairo"
            fill="#999"
            width={100}
            align="center"
            verticalAlign="middle"
            y={40}
          />
        </Group>
      );
    }
    
    // إعدادات الصورة
    const style = field.style || {};
    
    // تم تحميل صورة من قبل وسيتم إظهارها في المستقبل
    return null;
  };
  
  // رسم الشبكة
  const renderGrid = () => {
    if (!editorSettings?.gridEnabled) return null;
    
    const gridSize = editorSettings?.gridSize || 50;
    const lines = [];
    
    // خطوط عمودية
    for (let i = 0; i < stageSize.width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, stageSize.height]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }
    
    // خطوط أفقية
    for (let i = 0; i < stageSize.height; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, stageSize.width, i]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }
    
    return <>{lines}</>;
  };

  // كونفا ترانسفورمر مسؤول عن شكل التحديد
  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const id = parseInt(node.id().replace('field-', ''));
    
    // الحصول على الحقل المعني
    const field = fields.find(f => f.id === id);
    if (!field) return;
    
    // تحديث موضع وتدوير الحقل
    const updatedFields = fields.map(f => {
      if (f.id === id) {
        return {
          ...f,
          position: { x: node.x(), y: node.y() },
          rotation: node.rotation()
        };
      }
      return f;
    });
    
    onFieldsChange(updatedFields);
  };
  
  // تصدير الصورة
  const exportImage = () => {
    if (!stageRef.current || !onImageExport) return;
    
    // إخفاء المحول وإزالة التحديد مؤقتًا
    setSelectedIds([]);
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
    
    // تنفيذ بعد لحظة للتأكد من إعادة رسم المحول
    setTimeout(() => {
      const dataUrl = stageRef.current?.toDataURL({
        pixelRatio: 2, // جودة أعلى
        mimeType: 'image/png'
      });
      
      if (dataUrl && onImageExport) {
        onImageExport(dataUrl);
      }
    }, 10);
  };
  
  // تغيير طبقة صورة القالب
  const moveTemplateImageLayer = (direction: 'up' | 'down') => {
    const newLayer = direction === 'up' 
      ? templateImageLayer + 1 
      : templateImageLayer - 1;
    
    if (onTemplateImageLayerChange) {
      onTemplateImageLayerChange(newLayer);
    }
  };
  
  // إظهار/إخفاء صورة القالب
  const toggleTemplateImageVisibility = () => {
    if (onTemplateImageVisibilityChange) {
      onTemplateImageVisibilityChange(!isTemplateImageVisible);
    }
  };
  
  return (
    <div className="draggable-fields-preview-with-layers" ref={containerRef}>
      {/* أزرار التحكم */}
      {showControls && (
        <div className="controls bg-muted/80 p-2 rounded-md mb-2 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(scale + 0.1)}
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(Math.max(0.2, scale - 0.1))}
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFieldsChange([...fields])} // Trigger refresh of fields
            title={editorSettings?.gridEnabled ? "إخفاء الشبكة" : "إظهار الشبكة"}
            className={editorSettings?.gridEnabled ? 'bg-muted/50' : undefined}
          >
            <Grid className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFieldsChange([...fields])} // Trigger refresh of fields
            title={editorSettings?.snapToGrid ? "إلغاء الالتصاق بالشبكة" : "تفعيل الالتصاق بالشبكة"}
            className={editorSettings?.snapToGrid ? 'bg-muted/50' : undefined}
          >
            <Magnet className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportImage}
            title="تصدير صورة"
          >
            <Download className="w-4 h-4" />
          </Button>
          
          {/* أزرار تحكم طبقة صورة القالب */}
          <div className="h-6 w-px bg-border mx-1" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => moveTemplateImageLayer('up')}
            title="رفع صورة القالب للأمام"
          >
            <MoveUp className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => moveTemplateImageLayer('down')}
            title="إرجاع صورة القالب للخلف"
          >
            <MoveDown className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTemplateImageVisibility}
            title={isTemplateImageVisible ? "إخفاء صورة القالب" : "إظهار صورة القالب"}
          >
            {isTemplateImageVisible ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
      
      {/* معلومات الطبقة */}
      {showControls && (
        <div className="layer-info text-xs mb-1 text-muted-foreground">
          طبقة القالب: {templateImageLayer} | الحالة: {isTemplateImageVisible ? 'مرئية' : 'مخفية'}
        </div>
      )}
      
      {/* منصة العرض */}
      <div 
        className="stage-container bg-white border rounded-md overflow-hidden"
        style={{ 
          width: '100%', 
          height: '600px',
          position: 'relative'
        }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scale={{ x: scale, y: scale }}
          position={position}
          draggable={showControls}
          onDragEnd={(e) => {
            setPosition({
              x: e.target.x(),
              y: e.target.y()
            });
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
            
            {/* خلفية بيضاء بحجم صورة القالب - تظهر خلف صورة القالب لرؤية الحقول التي خلفها */}
            {isTemplateImageLoaded && templateImageObj && (
              <Rect
                x={templateImagePosition.x}
                y={templateImagePosition.y}
                width={templateImageSize.width}
                height={templateImageSize.height}
                fill="#f8f8f8"
                stroke="#e0e0e0"
                strokeWidth={1}
                dash={[5, 5]}
                cornerRadius={4}
              />
            )}
            
            {/* الشبكة */}
            {renderGrid()}
            
            {/* مجموعة الحقول القابلة للسحب */}
            <Group>
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
                    if (!isTemplateImageVisible) return null;
                    
                    return (
                      <Group
                        key="template-image-group"
                        id="field--1"
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
            </Group>
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
