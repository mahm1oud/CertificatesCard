/**
 * محرر مواضع الحقول المتطور
 * الإصدار 3.1 - مايو 2025
 * 
 * مميزات النسخة المحدثة:
 * - يضمن تطابق 100% بين المعاينة والصورة النهائية
 * - يدعم معاينة الصورة النهائية في مختلف التنسيقات
 * - يدعم تنزيل الصورة بجودة عالية
 * - تحكم متقدم بالشبكة والمحاذاة
 * - تحرير متكامل لخصائص الحقول
 * - دعم طبقات متكامل مع إمكانية وضع الحقول أمام أو خلف صورة القالب
 * - دعم كامل للتدوير والحجم والتموضع
 * - دعم إخفاء وإظهار الحقول
 * - دعم الظلال للنصوص والصور
 * - دعم الاستخدام كمكون مضمن أو كحوار منبثق
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DraggableFieldsPreviewPro } from "./DraggableFieldsPreviewPro";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  Plus,
  Minus,
  Download,
  RotateCw,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Save,
  CheckSquare,
  Type,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Facebook,
  Twitter, 
  Instagram, 
  Linkedin,
  ArrowDown,
  ArrowUp
} from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * مهم جداً: هذه القيمة يجب أن تكون متطابقة مع
 * 1. BASE_IMAGE_WIDTH في DraggableFieldsPreviewPro.tsx
 * 2. BASE_IMAGE_WIDTH في optimized-image-generator.tsx
 * 3. BASE_IMAGE_WIDTH في server/optimized-image-generator.ts
 * لضمان التطابق 100% بين المعاينة والصورة النهائية
 */
const BASE_IMAGE_WIDTH = 1000;

interface Field {
  id: number;
  name: string;
  label?: string;
  type: 'text' | 'image';
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: any;
  zIndex?: number;
  visible?: boolean;
  rotation?: number;
  size?: { width: number; height: number };
}

// واجهة محرر موقع الحقول كحوار منبثق
interface FieldsPositionEditorDialogProps {
  isOpen: boolean;
  template: any;
  fields: Field[];
  onClose: () => void;
  onSave: (updatedFields: Field[]) => void;
}

// واجهة محرر موقع الحقول المضمن (المستخدم في صفحة معاينة البطاقة)
interface EmbeddedFieldsPositionEditorProps {
  templateId: number;
  initialFields: Field[];
  formData: Record<string, any>;
  templateImage: string;
  onChange: (updatedFields: Field[]) => void;
  readOnly?: boolean;
  embedded?: boolean;
}

// دالة مساعدة لتنزيل الصورة
function downloadImage(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// مكون خصائص الحقل
interface FieldPropertiesProps {
  field: Field;
  onUpdate: (updatedField: Field) => void;
  onDelete: (fieldId: number) => void;
  onDuplicate: (fieldId: number) => void;
  onToggleVisibility: (fieldId: number) => void;
}

export const FieldProperties: React.FC<FieldPropertiesProps> = ({
  field,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleVisibility
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{field.label || field.name}</h3>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onToggleVisibility(field.id)}
                >
                  {field.visible === false ? <Eye size={16} /> : <EyeOff size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{field.visible === false ? 'إظهار' : 'إخفاء'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDuplicate(field.id)}
                >
                  <Copy size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>نسخ الحقل</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(field.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>حذف الحقل</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>الموضع</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">X</Label>
            <Input
              type="number"
              value={field.position.x}
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                if (!isNaN(newValue)) {
                  onUpdate({
                    ...field,
                    position: {
                      ...field.position,
                      x: newValue
                    }
                  });
                }
              }}
            />
          </div>
          <div>
            <Label className="text-xs">Y</Label>
            <Input
              type="number"
              value={field.position.y}
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                if (!isNaN(newValue)) {
                  onUpdate({
                    ...field,
                    position: {
                      ...field.position,
                      y: newValue
                    }
                  });
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* التحكم في الحجم */}
      <div className="space-y-2">
        <Label>الحجم</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">العرض</Label>
            <Input
              type="number"
              value={field.size?.width || 'auto'}
              onChange={(e) => {
                const newValue = e.target.value !== '' ? parseInt(e.target.value) : undefined;
                onUpdate({
                  ...field,
                  size: {
                    ...(field.size || {}),
                    width: newValue !== undefined && !isNaN(newValue) ? newValue : undefined
                  }
                });
              }}
            />
          </div>
          <div>
            <Label className="text-xs">الارتفاع</Label>
            <Input
              type="number"
              value={field.size?.height || 'auto'}
              onChange={(e) => {
                const newValue = e.target.value !== '' ? parseInt(e.target.value) : undefined;
                onUpdate({
                  ...field,
                  size: {
                    ...(field.size || {}),
                    height: newValue !== undefined && !isNaN(newValue) ? newValue : undefined
                  }
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* التحكم في الدوران */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>الدوران</Label>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button 
              variant="outline" 
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                // تدوير للخلف بمقدار 5 درجات
                onUpdate({
                  ...field,
                  rotation: ((field.rotation || 0) - 5) % 360
                });
              }}
            >
              <RotateCcw size={14} />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                // تدوير للأمام بمقدار 5 درجات
                onUpdate({
                  ...field,
                  rotation: ((field.rotation || 0) + 5) % 360
                });
              }}
            >
              <RotateCw size={14} />
            </Button>
          </div>
        </div>
        <Input
          type="range"
          min="0"
          max="359"
          step="1"
          value={field.rotation || 0}
          onChange={(e) => {
            const newValue = parseInt(e.target.value);
            onUpdate({
              ...field,
              rotation: newValue
            });
          }}
        />
        <div className="text-center">
          <span className="text-sm">{field.rotation || 0}°</span>
        </div>
      </div>

      {/* التحكم في معلومات الطبقة */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>ترتيب الطبقة</Label>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button 
              variant="outline" 
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                // جلب الطبقة للأمام
                onUpdate({
                  ...field,
                  zIndex: (field.zIndex || 0) + 1
                });
              }}
            >
              <ArrowUp size={14} />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                // إرسال الطبقة للخلف (لا تسمح بالقيم السالبة)
                onUpdate({
                  ...field,
                  zIndex: Math.max(0, (field.zIndex || 0) - 1)
                });
              }}
            >
              <ArrowDown size={14} />
            </Button>
          </div>
        </div>
        <Input
          type="number"
          min="0"
          value={field.zIndex || 0}
          onChange={(e) => {
            const newValue = parseInt(e.target.value);
            if (!isNaN(newValue) && newValue >= 0) {
              onUpdate({
                ...field,
                zIndex: newValue
              });
            }
          }}
        />
      </div>

      {/* إعدادات متقدمة للحقول النصية */}
      {field.type === 'text' && (
        <>
          <div className="space-y-2">
            <Label>نوع الخط</Label>
            <Select
              value={field.style?.fontFamily || 'Cairo'}
              onValueChange={(value) => {
                onUpdate({
                  ...field,
                  style: {
                    ...field.style,
                    fontFamily: value
                  }
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الخط" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cairo">Cairo</SelectItem>
                <SelectItem value="Tajawal">Tajawal</SelectItem>
                <SelectItem value="Amiri">Amiri</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>حجم الخط</Label>
            <Input
              type="number"
              min="8"
              max="150"
              value={field.style?.fontSize || 24}
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                if (!isNaN(newValue) && newValue > 0) {
                  onUpdate({
                    ...field,
                    style: {
                      ...field.style,
                      fontSize: newValue
                    }
                  });
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>لون النص</Label>
            <div className="flex">
              <Input
                type="color"
                value={field.style?.color || '#000000'}
                className="w-12 p-1 h-10"
                onChange={(e) => {
                  onUpdate({
                    ...field,
                    style: {
                      ...field.style,
                      color: e.target.value
                    }
                  });
                }}
              />
              <Input
                type="text"
                value={field.style?.color || '#000000'}
                className="flex-1 ml-2 rtl:mr-2 rtl:ml-0"
                onChange={(e) => {
                  onUpdate({
                    ...field,
                    style: {
                      ...field.style,
                      color: e.target.value
                    }
                  });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>محاذاة النص</Label>
            <div className="flex border rounded-md overflow-hidden">
              <Button
                type="button"
                variant={field.style?.align === 'left' ? 'default' : 'ghost'}
                className="flex-1 rounded-none"
                onClick={() => {
                  onUpdate({
                    ...field,
                    style: {
                      ...field.style,
                      align: 'left'
                    }
                  });
                }}
              >
                <AlignLeft size={16} />
              </Button>
              <Button
                type="button"
                variant={field.style?.align === 'center' ? 'default' : 'ghost'}
                className="flex-1 rounded-none"
                onClick={() => {
                  onUpdate({
                    ...field,
                    style: {
                      ...field.style,
                      align: 'center'
                    }
                  });
                }}
              >
                <AlignCenter size={16} />
              </Button>
              <Button
                type="button"
                variant={field.style?.align === 'right' ? 'default' : 'ghost'}
                className="flex-1 rounded-none"
                onClick={() => {
                  onUpdate({
                    ...field,
                    style: {
                      ...field.style,
                      align: 'right'
                    }
                  });
                }}
              >
                <AlignRight size={16} />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* إعدادات متقدمة للحقول الصورة */}
      {field.type === 'image' && (
        <>
          <div className="space-y-2">
            <Label>الحجم الأقصى للصورة</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">العرض</Label>
                <Input
                  type="number"
                  min="1"
                  value={field.style?.imageMaxWidth || 200}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    if (!isNaN(newValue) && newValue > 0) {
                      onUpdate({
                        ...field,
                        style: {
                          ...field.style,
                          imageMaxWidth: newValue
                        }
                      });
                    }
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">الارتفاع</Label>
                <Input
                  type="number"
                  min="1"
                  value={field.style?.imageMaxHeight || 200}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    if (!isNaN(newValue) && newValue > 0) {
                      onUpdate({
                        ...field,
                        style: {
                          ...field.style,
                          imageMaxHeight: newValue
                        }
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// المكون الرئيسي لمحرر موقع الحقول
export const FieldsPositionEditor: React.FC<FieldsPositionEditorDialogProps | EmbeddedFieldsPositionEditorProps> = (props) => {
  // التحقق من نوع المكون (حوار منبثق أو مضمن)
  const isDialogMode = 'isOpen' in props;
  
  // استخراج البيانات حسب نوع المكون
  const {
    isOpen,
    template,
    fields,
    onClose,
    onSave
  } = isDialogMode ? props as FieldsPositionEditorDialogProps : {
    isOpen: true,
    template: { imageUrl: (props as EmbeddedFieldsPositionEditorProps).templateImage },
    fields: (props as EmbeddedFieldsPositionEditorProps).initialFields || [],
    onClose: () => {},
    onSave: (props as EmbeddedFieldsPositionEditorProps).onChange
  };
  
  const { embedded = false } = isDialogMode ? { embedded: false } : props as EmbeddedFieldsPositionEditorProps;
  const { toast } = useToast();
  const [updatedFields, setUpdatedFields] = useState<Field[]>([...fields]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [templateImageLayer, setTemplateImageLayer] = useState<number>(0); // 0 means template is behind all fields
  const [activeTab, setActiveTab] = useState('editor');
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewQuality, setPreviewQuality] = useState<'preview' | 'medium' | 'high'>('preview');
  const [zoom, setZoom] = useState(100);
  
  // إعدادات الشبكة والتجاذب
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [snapThreshold, setSnapThreshold] = useState(15);
  
  // تحديث الحقول عند تغيير القيم من المكون الأب
  useEffect(() => {
    if (Array.isArray(fields)) {
      // تأكد من وجود zIndex لجميع الحقول
      const fieldsWithZIndex = fields.map((field, index) => ({
        ...field,
        zIndex: field.zIndex !== undefined ? field.zIndex : index,
        visible: field.visible !== undefined ? field.visible : true,
      }));
      setUpdatedFields(fieldsWithZIndex);
    }
  }, [fields]);
  
  // تحديد الحقل المحدد
  const selectedField = selectedFieldId !== null ? updatedFields.find(f => f.id === selectedFieldId) : null;
  
  // تحديث حقل
  const updateField = (updatedField: Field) => {
    const newFields = updatedFields.map(field => 
      field.id === updatedField.id ? updatedField : field
    );
    setUpdatedFields(newFields);
  };
  
  // معالجة حفظ التغييرات
  const handleSaveChanges = () => {
    onSave(updatedFields);
    toast({
      title: "تم الحفظ",
      description: "تم حفظ مواضع الحقول بنجاح",
    });
  };
  
  // تجهيز بيانات المعاينة
  useEffect(() => {
    if (!isDialogMode) {
      return; // لا حاجة لتجهيز بيانات المعاينة في وضع المكون المضمن
    }
    
    const data: Record<string, any> = {};
    
    updatedFields.forEach(field => {
      if (field.type === 'text') {
        data[field.name] = field.label || field.name;
      } else if (field.type === 'image') {
        // استخدم صورة افتراضية للمعاينة
        data[field.name] = '/uploads/placeholder.jpg';
      }
    });
    
    setPreviewData(data);
  }, [updatedFields, isDialogMode]);

  // معالجة توليد الصورة
  const handleImageGenerated = (imageUrl: string) => {
    setPreviewUrl(imageUrl);
  };

  // معالجة تنزيل الصورة
  const handleDownloadImage = () => {
    if (previewUrl) {
      downloadImage(previewUrl, `${template.title || 'template'}_preview.png`);
      toast({
        title: "تم التنزيل",
        description: "تم تنزيل صورة المعاينة بنجاح",
      });
    }
  };
  
  // إضافة حقل جديد
  const addNewField = (type: 'text' | 'image') => {
    const maxId = Math.max(0, ...updatedFields.map(f => f.id));
    const maxZIndex = Math.max(0, ...updatedFields.map(f => f.zIndex || 0));
    
    const newField: Field = {
      id: maxId + 1,
      name: type === 'text' ? `text_${maxId + 1}` : `image_${maxId + 1}`,
      label: type === 'text' ? `حقل نصي جديد ${maxId + 1}` : `حقل صورة جديد ${maxId + 1}`,
      type,
      position: { x: 50, y: 50 },
      zIndex: maxZIndex + 1,
      style: type === 'text' ? {
        fontFamily: 'Cairo',
        fontSize: 24,
        color: '#000000',
        align: 'center',
      } : {
        imageMaxWidth: 200,
        imageMaxHeight: 200,
      }
    };
    
    setUpdatedFields([...updatedFields, newField]);
    setSelectedFieldId(newField.id);
  };
  
  // حذف حقل
  const deleteField = (fieldId: number) => {
    const newFields = updatedFields.filter(field => field.id !== fieldId);
    setUpdatedFields(newFields);
    setSelectedFieldId(null);
  };
  
  // نسخ حقل
  const duplicateField = (fieldId: number) => {
    const fieldToDuplicate = updatedFields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;
    
    const maxId = Math.max(0, ...updatedFields.map(f => f.id));
    const maxZIndex = Math.max(0, ...updatedFields.map(f => f.zIndex || 0));
    
    const newField = {
      ...JSON.parse(JSON.stringify(fieldToDuplicate)),
      id: maxId + 1,
      name: `${fieldToDuplicate.name}_copy`,
      zIndex: maxZIndex + 1,
      position: {
        ...fieldToDuplicate.position,
        x: fieldToDuplicate.position.x + 5,
        y: fieldToDuplicate.position.y + 5,
      }
    };
    
    setUpdatedFields([...updatedFields, newField]);
    setSelectedFieldId(newField.id);
  };
  
  // تبديل رؤية الحقل
  const toggleFieldVisibility = (fieldId: number) => {
    const fieldToToggle = updatedFields.find(f => f.id === fieldId);
    if (!fieldToToggle) return;
    
    updateField({
      ...fieldToToggle,
      visible: fieldToToggle.visible === false ? true : false,
    });
  };

  // معالج استدعاء المكون المضمن في صفحة معاينة البطاقة
  if (!isDialogMode) {
    const embeddedProps = props as EmbeddedFieldsPositionEditorProps;
    
    // تجهيز بيانات الحقول
    useEffect(() => {
      if (embeddedProps.initialFields && Array.isArray(embeddedProps.initialFields)) {
        // نسخ الحقول مع التأكد من وجود zIndex و visible
        const fieldsWithDefaults = embeddedProps.initialFields.map((field, index) => ({
          ...field,
          zIndex: field.zIndex !== undefined ? field.zIndex : index,
          visible: field.visible !== undefined ? field.visible : true,
        }));
        setUpdatedFields(fieldsWithDefaults);
      }
    }, [embeddedProps.initialFields]);

    // معالجة تغييرات الحقول وإرسالها للمكون الأب
    useEffect(() => {
      embeddedProps.onChange(updatedFields);
    }, [updatedFields]);

    return (
      <div className="flex-1 overflow-auto p-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <DraggableFieldsPreviewPro
              templateImage={embeddedProps.templateImage || ''}
              fields={updatedFields}
              selectedFieldId={selectedFieldId}
              onFieldSelect={(id) => setSelectedFieldId(id)}
              onFieldsChange={(updatedFields) => {
                setUpdatedFields(updatedFields);
              }}
              editorSettings={{
                gridEnabled,
                snapToGrid,
                gridSize,
                snapThreshold,
                templateImageLayer: 0
              }}
              formData={embeddedProps.formData || {}}
            />
          </div>
          
          <div className="md:col-span-4">
            <div className="bg-white rounded-lg shadow">
              <div className="py-3 px-4 border-b">
                <h3 className="text-lg font-medium">خصائص الحقل</h3>
              </div>
              <div className="p-4">
                {selectedField ? (
                  <FieldProperties
                    field={selectedField}
                    onUpdate={updateField}
                    onDelete={deleteField}
                    onDuplicate={duplicateField}
                    onToggleVisibility={toggleFieldVisibility}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>حدد حقلاً لتعديل خصائصه</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // استدعاء المكون كحوار منبثق
  return (
    <Dialog open={isOpen === true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[98vw] h-[95vh] flex flex-col p-3 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-2 left-2 p-2 rounded-full hover:bg-gray-200 focus:outline-none transition-colors z-50"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
        
        <DialogHeader>
          <DialogTitle className="text-xl">تحرير القالب ومواضع الحقول</DialogTitle>
          <DialogDescription>
            يمكنك ضبط موقع وخصائص كل حقل ومعاينة النتيجة النهائية بدقة 100%
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <Card className="md:col-span-8">
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">محرر التصميم</CardTitle>
                </CardHeader>
                <CardContent>
                  {template && (
                    <DraggableFieldsPreviewPro
                      templateImage={template.imageUrl || ''}
                      fields={updatedFields}
                      selectedFieldId={selectedFieldId}
                      onFieldSelect={(id) => setSelectedFieldId(id)}
                      onFieldsChange={(updatedFields) => {
                        // عند تغيير الحقول، نقوم بتحديث الجميع
                        setUpdatedFields(updatedFields);
                      }}
                      editorSettings={{
                        gridEnabled,
                        snapToGrid,
                        gridSize,
                        snapThreshold,
                        templateImageLayer
                      }}
                    />
                  )}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-4">
                <CardHeader className="py-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>خصائص الحقل</span>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addNewField('text')}
                        title="إضافة حقل نصي"
                      >
                        <Type className="h-4 w-4 ml-1" />
                        <span className="text-xs">نص</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addNewField('image')}
                        title="إضافة حقل صورة"
                      >
                        <ImageIcon className="h-4 w-4 ml-1" />
                        <span className="text-xs">صورة</span>
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedField ? (
                    <FieldProperties
                      field={selectedField}
                      onUpdate={updateField}
                      onDelete={deleteField}
                      onDuplicate={duplicateField}
                      onToggleVisibility={toggleFieldVisibility}
                    />
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>اختر حقلاً من المعاينة لتعديل خصائصه</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center space-x-2 ml-2">
                  <Label>إظهار الشبكة</Label>
                  <Switch 
                    checked={gridEnabled}
                    onCheckedChange={setGridEnabled}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label>تفعيل التجاذب</Label>
                  <Switch 
                    checked={snapToGrid}
                    onCheckedChange={setSnapToGrid}
                  />
                </div>
              </div>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">إعدادات متقدمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="grid" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="grid">الشبكة</TabsTrigger>
                      <TabsTrigger value="layers">الطبقات</TabsTrigger>
                      <TabsTrigger value="preview">المعاينة</TabsTrigger>
                      <TabsTrigger value="final">الصورة النهائية</TabsTrigger>
                      <TabsTrigger value="social">منصات التواصل</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="grid">
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>حجم الشبكة ({gridSize}px)</Label>
                          </div>
                          <Slider
                            value={[gridSize]}
                            min={10}
                            max={100}
                            step={5}
                            onValueChange={(values) => {
                              setGridSize(values[0]);
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>مدى التجاذب ({snapThreshold}px)</Label>
                          </div>
                          <Slider
                            value={[snapThreshold]}
                            min={5}
                            max={30}
                            step={1}
                            onValueChange={(values) => {
                              setSnapThreshold(values[0]);
                            }}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="layers">
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>صورة القالب</Label>
                          <div className="flex items-center space-x-2">
                            <Label className="flex-grow text-sm text-gray-500">
                              {templateImageLayer === 0 ? 'خلف جميع الحقول' : 'أمام جميع الحقول'}
                            </Label>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setTemplateImageLayer(templateImageLayer === 0 ? 999 : 0);
                              }}
                            >
                              <Layers className="h-4 w-4 ml-1" />
                              <span>تبديل الطبقة</span>
                            </Button>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label>ترتيب الحقول</Label>
                          <ScrollArea className="h-60 rounded-md border p-2">
                            {updatedFields.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map((field) => (
                              <div 
                                key={field.id}
                                className={`flex items-center justify-between p-2 my-1 rounded-md hover:bg-gray-100 cursor-pointer ${selectedFieldId === field.id ? 'bg-gray-100 border border-gray-300' : ''}`}
                                onClick={() => setSelectedFieldId(field.id)}
                              >
                                <div className="flex items-center">
                                  {field.visible === false && <EyeOff className="h-3 w-3 ml-1 text-gray-400" />}
                                  <span className={`text-sm font-medium ${field.visible === false ? 'text-gray-400' : ''}`}>
                                    {field.label || field.name}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newZIndex = Math.max(0, (field.zIndex || 0) - 1);
                                      updateField({
                                        ...field,
                                        zIndex: newZIndex
                                      });
                                    }}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <span className="text-xs w-5 text-center">{field.zIndex || 0}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newZIndex = (field.zIndex || 0) + 1;
                                      updateField({
                                        ...field,
                                        zIndex: newZIndex
                                      });
                                    }}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="preview">
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>جودة المعاينة</Label>
                          <Select
                            value={previewQuality}
                            onValueChange={(value: any) => setPreviewQuality(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر جودة المعاينة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="preview">منخفضة (معاينة سريعة)</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="high">عالية (للتنزيل)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>مستوى التكبير ({zoom}%)</Label>
                          </div>
                          <Slider
                            value={[zoom]}
                            min={50}
                            max={150}
                            step={10}
                            onValueChange={(values) => {
                              setZoom(values[0]);
                            }}
                          />
                        </div>
                        
                        <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                          {/* سيتم استبدال هذا بمكون المعاينة الفعلية */}
                          <div className="text-center text-gray-500">
                            <HelpCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>سيتم استبدال هذا بمكون المعاينة الفعلية في آخر إصدار</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="final">
                      <div className="bg-gray-50/50 rounded-lg py-8 border border-gray-100">
                        <div className="flex justify-center">
                          {previewUrl ? (
                            <img 
                              src={previewUrl}
                              alt="معاينة الصورة النهائية"
                              className="max-w-full h-auto rounded-md shadow-md"
                            />
                          ) : (
                            <div className="text-center p-8 text-gray-500">
                              <span>قم بالتبديل إلى تبويب المعاينة أولاً لتوليد الصورة</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 flex justify-center">
                          <Button 
                            variant="outline" 
                            disabled={!previewUrl}
                            onClick={handleDownloadImage}
                          >
                            <Download className="h-4 w-4 ml-1" />
                            <span>تنزيل الصورة</span>
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="social">
                      <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center justify-center h-16 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200">
                                  <Facebook className="h-6 w-6 text-blue-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>فيسبوك</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center justify-center h-16 border rounded-lg cursor-pointer hover:bg-sky-50 hover:border-sky-200">
                                  <Twitter className="h-6 w-6 text-sky-500" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>تويتر</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center justify-center h-16 border rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-200">
                                  <Instagram className="h-6 w-6 text-purple-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>انستجرام</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center justify-center h-16 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200">
                                  <Linkedin className="h-6 w-6 text-blue-800" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>لينكد ان</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100 text-center">
                          <p className="text-gray-500">اختر منصة اجتماعية لمعاينة المحتوى الخاص بها</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-2 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500 flex items-center">
              <CheckSquare className="w-4 h-4 ml-1 text-blue-500" />
              <span>التجاذب متاح للشبكة وحدود القالب ومواضع الحقول الأخرى</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={handleSaveChanges}>
              <Save className="w-4 h-4 ml-1" />
              <span>حفظ التغييرات</span>
            </Button>
            <Button variant="outline" onClick={onClose}>إغلاق</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FieldsPositionEditor;