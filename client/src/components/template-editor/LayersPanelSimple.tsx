/**
 * مكون لوحة الطبقات البسيط
 * يعرض قائمة بجميع الطبقات (الحقول) ويسمح بتغيير ترتيبها وإظهارها/إخفائها
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Image as ImageIcon, Type, TextIcon, Layers, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// نفس الواجهة المستخدمة في FieldPropertiesPanel
interface FieldType {
  id: number;
  name: string;
  label?: string;
  labelAr?: string;
  type: 'text' | 'image' | 'template' | string;
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

interface LayersPanelSimpleProps {
  fields: FieldType[];
  hasTemplateImage?: boolean;
  templateImageZIndex?: number;
  isTemplateImageVisible?: boolean;
  onFieldsUpdate: (updatedFields: FieldType[]) => void;
  onLayerClick: (fieldId: number) => void;
  activeLayerId?: number | null;
  onTemplateImageUpdate?: (zIndex: number, isVisible: boolean) => void;
  onAddField: (type: 'text' | 'image') => void;
}

export const LayersPanelSimple: React.FC<LayersPanelSimpleProps> = ({
  fields,
  hasTemplateImage = false,
  templateImageZIndex = 0,
  isTemplateImageVisible = true,
  onFieldsUpdate,
  onLayerClick,
  activeLayerId = null,
  onTemplateImageUpdate,
  onAddField
}) => {
  // كل الحقول + حقل خاص لصورة القالب
  const [allLayers, setAllLayers] = useState<(FieldType & { isTemplateImage?: boolean })[]>([]);

  // دمج جميع الطبقات (الحقول والصورة) في مصفوفة واحدة
  useEffect(() => {
    let layers: (FieldType & { isTemplateImage?: boolean })[] = [...fields];
    
    if (hasTemplateImage) {
      // إضافة صورة القالب كطبقة خاصة
      layers.push({
        id: -1, // معرف خاص لصورة القالب
        name: 'template-image',
        label: 'صورة القالب',
        type: 'template',
        position: { x: 0, y: 0 },
        zIndex: templateImageZIndex,
        visible: isTemplateImageVisible,
        isTemplateImage: true
      });
    }
    
    // ترتيب الطبقات حسب zIndex
    const sortedLayers = layers.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    setAllLayers(sortedLayers);
  }, [fields, hasTemplateImage, templateImageZIndex, isTemplateImageVisible]);

  // تغيير ترتيب طبقة للأعلى
  const moveLayerUp = (index: number) => {
    if (index <= 0) return; // لا يمكن تحريك الطبقة العليا للأعلى
    
    const layerToMove = allLayers[index];
    const layerAbove = allLayers[index - 1];
    
    if (layerToMove.isTemplateImage) {
      // تحديث zIndex صورة القالب
      if (onTemplateImageUpdate) {
        onTemplateImageUpdate((layerAbove.zIndex || 0) + 1, layerToMove.visible !== false);
      }
    } else if (layerAbove.isTemplateImage) {
      // تحديث zIndex الحقل ليكون أعلى من صورة القالب
      const updatedFields = fields.map(field => {
        if (field.id === layerToMove.id) {
          return { ...field, zIndex: (templateImageZIndex || 0) + 1 };
        }
        return field;
      });
      onFieldsUpdate(updatedFields);
    } else {
      // تحديث zIndex الحقل ليكون أعلى من الحقل الذي فوقه
      const updatedFields = fields.map(field => {
        if (field.id === layerToMove.id) {
          return { ...field, zIndex: (layerAbove.zIndex || 0) + 1 };
        }
        return field;
      });
      onFieldsUpdate(updatedFields);
    }
  };

  // تغيير ترتيب طبقة للأسفل
  const moveLayerDown = (index: number) => {
    if (index >= allLayers.length - 1) return; // لا يمكن تحريك الطبقة السفلى للأسفل
    
    const layerToMove = allLayers[index];
    const layerBelow = allLayers[index + 1];
    
    if (layerToMove.isTemplateImage) {
      // تحديث zIndex صورة القالب
      if (onTemplateImageUpdate) {
        onTemplateImageUpdate((layerBelow.zIndex || 0) - 1, layerToMove.visible !== false);
      }
    } else if (layerBelow.isTemplateImage) {
      // تحديث zIndex الحقل ليكون أقل من صورة القالب
      const updatedFields = fields.map(field => {
        if (field.id === layerToMove.id) {
          return { ...field, zIndex: (templateImageZIndex || 0) - 1 };
        }
        return field;
      });
      onFieldsUpdate(updatedFields);
    } else {
      // تحديث zIndex الحقل ليكون أقل من الحقل الذي تحته
      const updatedFields = fields.map(field => {
        if (field.id === layerToMove.id) {
          return { ...field, zIndex: (layerBelow.zIndex || 0) - 1 };
        }
        return field;
      });
      onFieldsUpdate(updatedFields);
    }
  };

  // تبديل حالة الرؤية
  const toggleVisibility = (id: number, isTemplateImage = false) => {
    if (isTemplateImage) {
      if (onTemplateImageUpdate) {
        onTemplateImageUpdate(templateImageZIndex, !isTemplateImageVisible);
      }
    } else {
      const updatedFields = fields.map(field => {
        if (field.id === id) {
          return { ...field, visible: field.visible === false ? true : false };
        }
        return field;
      });
      onFieldsUpdate(updatedFields);
    }
  };

  // تبديل حالة القفل
  const toggleLock = (id: number) => {
    const updatedFields = fields.map(field => {
      if (field.id === id) {
        return { ...field, locked: field.locked === true ? false : true };
      }
      return field;
    });
    onFieldsUpdate(updatedFields);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex">
            <Layers className="mr-2 h-5 w-5 text-primary" />
            <CardTitle>الطبقات</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddField('text')}
              className="h-8 w-8"
              title="إضافة حقل نص"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddField('image')}
              className="h-8 w-8"
              title="إضافة حقل صورة"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {fields.length} حقل {hasTemplateImage ? '+ صورة القالب' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="px-2 pb-4">
            <div className="space-y-1 layers-panel-simple">
              {allLayers.map((layer, index) => (
                <div
                  key={layer.isTemplateImage ? 'template-image' : `layer-${layer.id}`}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md layer-item",
                    (activeLayerId === layer.id) && !layer.isTemplateImage 
                      ? "bg-primary/10 border-r-2 border-primary" 
                      : "hover:bg-accent",
                    layer.visible === false && "opacity-50"
                  )}
                  onClick={() => !layer.isTemplateImage && onLayerClick(layer.id)}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="cursor-pointer w-6 h-6 flex items-center justify-center">
                      {layer.isTemplateImage ? (
                        <ImageIcon className="h-4 w-4 text-primary" />
                      ) : layer.type === 'text' ? (
                        <Type className="h-4 w-4 text-primary" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className={layer.isTemplateImage ? "template-image-layer" : ""}>
                      <span className="font-medium mr-2" dir="auto">
                        {layer.label || layer.name}
                      </span>
                      <span className="text-xs text-muted-foreground opacity-70">
                        {layer.zIndex === 0 ? '' : layer.zIndex && layer.zIndex > 0 ? `(فوق: ${layer.zIndex})` : `(تحت: ${Math.abs(layer.zIndex || 0)})`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 overflow-x-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(layer.id, layer.isTemplateImage);
                      }}
                      className="h-7 w-7"
                    >
                      {layer.isTemplateImage ? (
                        isTemplateImageVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        layer.visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    
                    {!layer.isTemplateImage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLock(layer.id);
                        }}
                        className="h-7 w-7"
                      >
                        {layer.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayerUp(index);
                      }}
                      className="h-7 w-7"
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayerDown(index);
                      }}
                      className="h-7 w-7"
                      disabled={index === allLayers.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};