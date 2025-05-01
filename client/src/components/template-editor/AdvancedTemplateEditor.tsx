/**
 * محرر قوالب متقدم وموحد
 * الإصدار 5.0 - مايو 2025
 *
 * هذا المكون يجمع بين مميزات:
 * - TemplateEditor: المحرر الأساسي
 * - TemplateEditor-v2: المحرر المحسن
 * - LayeredTemplateEditor: دعم الطبقات
 *
 * كما يضمن توافق 100% مع مولد الصور على السيرفر
 */

import React, { useState, useEffect, useRef } from 'react';
import { DraggableFieldsPreviewUnified } from './DraggableFieldsPreviewUnified';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  Save,
  Trash,
  Image,
  Edit3,
  Copy,
  Download,
  List,
  Layers,
  Grid,
  Text as TextIcon,
  ChevronsUpDown
} from "lucide-react";
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';

// ثابت العرض المرجعي - يجب أن يكون متطابقًا مع جميع مكونات النظام
const BASE_IMAGE_WIDTH = 1000;

interface FieldType {
  id: number;
  name: string;
  label?: string;
  labelAr?: string;
  type: 'text' | 'image';
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: any;
  zIndex?: number;
  visible?: boolean;
  rotation?: number;
  templateId?: number;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  placeholderAr?: string;
  options?: any[];
}

interface EditorSettings {
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  snapThreshold?: number;
}

interface TemplateData {
  id?: number;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  categoryId?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AdvancedTemplateEditorProps {
  template?: TemplateData;
  initialFields?: FieldType[];
  onSave?: (template: TemplateData, fields: FieldType[]) => void;
  onImageExport?: (imageDataUrl: string) => void;
  readOnly?: boolean;
  allowFieldsEdit?: boolean;
  categories?: { id: number; name: string; nameAr?: string }[];
}

export const AdvancedTemplateEditor: React.FC<AdvancedTemplateEditorProps> = ({
  template,
  initialFields = [],
  onSave,
  onImageExport,
  readOnly = false,
  allowFieldsEdit = true,
  categories = []
}) => {
  const [fields, setFields] = useState<FieldType[]>(initialFields);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [selectedField, setSelectedField] = useState<FieldType | null>(null);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    gridEnabled: true,
    snapToGrid: true,
    gridSize: 50,
    snapThreshold: 10
  });
  
  const { toast } = useToast();
  
  // نموذج بيانات القالب
  const templateForm = useForm({
    defaultValues: {
      title: template?.title || '',
      titleAr: template?.titleAr || '',
      description: template?.description || '',
      descriptionAr: template?.descriptionAr || '',
      categoryId: template?.categoryId?.toString() || '',
      active: template?.active || true
    }
  });
  
  // تحديث النموذج عند تغيير بيانات القالب
  useEffect(() => {
    if (template) {
      templateForm.reset({
        title: template.title || '',
        titleAr: template.titleAr || '',
        description: template.description || '',
        descriptionAr: template.descriptionAr || '',
        categoryId: template.categoryId?.toString() || '',
        active: template.active || true
      });
    }
  }, [template]);
  
  // تحديث الحقول عند تغيير الحقول الأولية
  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);
  
  // تحديث الحقل المحدد
  const handleFieldChange = (updatedField: FieldType) => {
    const updatedFields = fields.map(f => 
      f.id === updatedField.id ? updatedField : f
    );
    setFields(updatedFields);
    setSelectedField(updatedField);
  };
  
  // إضافة حقل جديد
  const handleAddField = (type: 'text' | 'image') => {
    // إيجاد أعلى معرّف
    const maxId = fields.length > 0 ? Math.max(...fields.map(f => f.id)) : 0;
    
    // إنشاء حقل جديد
    const newField: FieldType = {
      id: maxId + 1,
      name: type === 'text' ? `text_field_${maxId + 1}` : `image_field_${maxId + 1}`,
      label: type === 'text' ? 'نص جديد' : '',
      labelAr: type === 'text' ? 'نص جديد' : '',
      type,
      position: { x: 50, y: 50 }, // وضع في وسط القالب
      templateId: template?.id,
      required: false,
      style: type === 'text' 
        ? {
            fontFamily: 'Cairo',
            fontSize: 24,
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
            maxWidth: 300
          }
        : {
            imageMaxWidth: 150,
            imageMaxHeight: 150,
            imageBorder: false,
            imageRounded: false
          },
      zIndex: fields.length + 1, // طبقة أعلى من كل الحقول الموجودة
      visible: true,
      rotation: 0
    };
    
    setFields([...fields, newField]);
    setSelectedField(newField);
    setActiveTab('fields');
    
    toast({
      title: 'تم إضافة حقل جديد',
      description: `تم إضافة حقل ${type === 'text' ? 'نصي' : 'صورة'} جديد`
    });
  };
  
  // حذف الحقل المحدد
  const handleDeleteField = () => {
    if (!selectedField) return;
    
    const updatedFields = fields.filter(f => f.id !== selectedField.id);
    setFields(updatedFields);
    setSelectedField(null);
    
    toast({
      title: 'تم حذف الحقل',
      description: `تم حذف الحقل "${selectedField.label || selectedField.name}"`
    });
  };
  
  // تحديث الحقول من معاينة الحقول
  const handleFieldsChange = (updatedFields: FieldType[]) => {
    setFields(updatedFields);
    
    // تحديث الحقل المحدد إذا كان موجودًا
    if (selectedField) {
      const updated = updatedFields.find(f => f.id === selectedField.id);
      if (updated) {
        setSelectedField(updated);
      } else {
        setSelectedField(null);
      }
    }
  };
  
  // حفظ القالب والحقول
  const handleSaveTemplate = () => {
    if (onSave) {
      const formData = templateForm.getValues();
      
      const updatedTemplate: TemplateData = {
        ...template,
        title: formData.title,
        titleAr: formData.titleAr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        categoryId: parseInt(formData.categoryId),
        active: formData.active
      };
      
      onSave(updatedTemplate, fields);
      
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ القالب والحقول بنجاح'
      });
    }
  };
  
  // تصدير الصورة
  const handleExportImage = (imageDataUrl: string) => {
    if (onImageExport) {
      onImageExport(imageDataUrl);
    } else {
      // إنشاء رابط تنزيل
      const link = document.createElement('a');
      link.download = `template-${template?.id || 'new'}.png`;
      link.href = imageDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  return (
    <div className="advanced-template-editor flex flex-col gap-4">
      {/* عنوان المحرر */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {template?.id ? 'تحرير القالب' : 'إنشاء قالب جديد'}
        </h2>
        
        {!readOnly && (
          <Button onClick={handleSaveTemplate}>
            <Save className="w-4 h-4 ml-2" />
            حفظ القالب
          </Button>
        )}
      </div>
      
      {/* نظام علامات التبويب للمحرر */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="preview">معاينة القالب</TabsTrigger>
          <TabsTrigger value="fields" disabled={readOnly && !allowFieldsEdit}>الحقول</TabsTrigger>
          <TabsTrigger value="settings" disabled={readOnly}>إعدادات القالب</TabsTrigger>
        </TabsList>
        
        {/* معاينة القالب */}
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>معاينة القالب</CardTitle>
              <CardDescription>
                يمكنك سحب العناصر لتغيير مواضعها في القالب.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="bg-neutral-50 rounded-md p-2">
                <div className="h-[600px]">
                  <DraggableFieldsPreviewUnified
                    templateImage={template?.imageUrl || ''}
                    fields={fields}
                    onFieldsChange={handleFieldsChange}
                    editorSettings={editorSettings}
                    showControls={!readOnly}
                    allowMultipleSelection={!readOnly}
                    allowResize={!readOnly}
                    onImageExport={handleExportImage}
                  />
                </div>
              </div>
            </CardContent>
            
            {!readOnly && (
              <CardFooter className="flex gap-2 border-t p-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleAddField('text')}
                >
                  <TextIcon className="w-4 h-4 ml-2" />
                  إضافة حقل نص
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleAddField('image')}
                >
                  <Image className="w-4 h-4 ml-2" />
                  إضافة حقل صورة
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* تبويب الحقول */}
        <TabsContent value="fields" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* قائمة الحقول */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>الحقول</CardTitle>
                  <CardDescription>
                    اختر حقلًا لتعديل خصائصه.
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1">
                    {fields.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        لا توجد حقول بعد
                      </div>
                    ) : (
                      fields
                        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) // ترتيب حسب الطبقة
                        .map((field) => (
                          <div
                            key={field.id}
                            className={`p-2 rounded-md flex items-center cursor-pointer ${
                              selectedField?.id === field.id
                                ? 'bg-primary/20'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            onClick={() => setSelectedField(field)}
                          >
                            {field.type === 'text' ? (
                              <TextIcon className="w-5 h-5 ml-2" />
                            ) : (
                              <Image className="w-5 h-5 ml-2" />
                            )}
                            <div className="flex-1 ml-2 text-sm">
                              <div className="font-medium truncate">
                                {field.label || field.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {field.name}
                              </div>
                            </div>
                            {field.visible === false && (
                              <span className="text-xs bg-red-100 text-red-800 px-1 rounded">
                                مخفي
                              </span>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
                
                {!readOnly && (
                  <CardFooter className="border-t p-4">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <Button 
                        variant="outline"
                        onClick={() => handleAddField('text')}
                        size="sm"
                      >
                        <TextIcon className="w-4 h-4 ml-1" />
                        حقل نص
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => handleAddField('image')}
                        size="sm"
                      >
                        <Image className="w-4 h-4 ml-1" />
                        حقل صورة
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </div>
            
            {/* خصائص الحقل المحدد */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>خصائص الحقل</CardTitle>
                  <CardDescription>
                    {selectedField
                      ? `تعديل خصائص "${selectedField.label || selectedField.name}"`
                      : 'اختر حقلاً من القائمة لتعديل خصائصه'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {!selectedField ? (
                    <div className="text-center py-16 text-gray-500">
                      الرجاء اختيار حقل من القائمة
                    </div>
                  ) : (
                    <Form {...templateForm}>
                      <div className="space-y-4">
                        {/* اسم الحقل */}
                        <FormItem>
                          <FormLabel>اسم الحقل</FormLabel>
                          <FormControl>
                            <Input
                              value={selectedField.name}
                              onChange={(e) =>
                                handleFieldChange({
                                  ...selectedField,
                                  name: e.target.value,
                                })
                              }
                              disabled={readOnly}
                            />
                          </FormControl>
                          <FormDescription>
                            اسم الحقل للاستخدام البرمجي (بالإنجليزية)
                          </FormDescription>
                        </FormItem>
                        
                        {/* عنوان الحقل */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormItem>
                            <FormLabel>عنوان الحقل</FormLabel>
                            <FormControl>
                              <Input
                                value={selectedField.label || ''}
                                onChange={(e) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    label: e.target.value,
                                  })
                                }
                                disabled={readOnly}
                              />
                            </FormControl>
                            <FormDescription>
                              عنوان الحقل للعرض (بالعربية)
                            </FormDescription>
                          </FormItem>
                          
                          <FormItem>
                            <FormLabel>عنوان الحقل (بالعربية)</FormLabel>
                            <FormControl>
                              <Input
                                value={selectedField.labelAr || ''}
                                onChange={(e) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    labelAr: e.target.value,
                                  })
                                }
                                disabled={readOnly}
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                        
                        {/* خصائص الموضع */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormItem>
                            <FormLabel>الموضع الأفقي (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                value={selectedField.position.x}
                                onChange={(e) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    position: {
                                      ...selectedField.position,
                                      x: parseFloat(e.target.value),
                                    },
                                  })
                                }
                                disabled={readOnly}
                              />
                            </FormControl>
                          </FormItem>
                          
                          <FormItem>
                            <FormLabel>الموضع العمودي (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                value={selectedField.position.y}
                                onChange={(e) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    position: {
                                      ...selectedField.position,
                                      y: parseFloat(e.target.value),
                                    },
                                  })
                                }
                                disabled={readOnly}
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                        
                        {/* خصائص محددة حسب نوع الحقل */}
                        {selectedField.type === 'text' ? (
                          <>
                            <Separator />
                            <h3 className="text-lg font-medium">خصائص النص</h3>
                            
                            {/* نوع الخط */}
                            <FormItem>
                              <FormLabel>نوع الخط</FormLabel>
                              <Select
                                value={selectedField.style?.fontFamily || 'Cairo'}
                                onValueChange={(value) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    style: {
                                      ...selectedField.style,
                                      fontFamily: value,
                                    },
                                  })
                                }
                                disabled={readOnly}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر نوع الخط" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Cairo">Cairo</SelectItem>
                                  <SelectItem value="Tajawal">Tajawal</SelectItem>
                                  <SelectItem value="Amiri">Amiri</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                            
                            {/* حجم الخط */}
                            <FormItem>
                              <FormLabel>
                                حجم الخط: {selectedField.style?.fontSize || 24}
                              </FormLabel>
                              <FormControl>
                                <Slider
                                  min={10}
                                  max={72}
                                  step={1}
                                  value={[selectedField.style?.fontSize || 24]}
                                  onValueChange={(values) =>
                                    handleFieldChange({
                                      ...selectedField,
                                      style: {
                                        ...selectedField.style,
                                        fontSize: values[0],
                                      },
                                    })
                                  }
                                  disabled={readOnly}
                                />
                              </FormControl>
                            </FormItem>
                            
                            {/* وزن الخط */}
                            <FormItem>
                              <FormLabel>وزن الخط</FormLabel>
                              <RadioGroup
                                value={selectedField.style?.fontWeight || 'normal'}
                                onValueChange={(value) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    style: {
                                      ...selectedField.style,
                                      fontWeight: value,
                                    },
                                  })
                                }
                                disabled={readOnly}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="normal" id="normal" />
                                  <label htmlFor="normal">عادي</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="bold" id="bold" />
                                  <label htmlFor="bold">غامق</label>
                                </div>
                              </RadioGroup>
                            </FormItem>
                            
                            {/* لون النص */}
                            <FormItem>
                              <FormLabel>لون النص</FormLabel>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={selectedField.style?.color || '#000000'}
                                  onChange={(e) =>
                                    handleFieldChange({
                                      ...selectedField,
                                      style: {
                                        ...selectedField.style,
                                        color: e.target.value,
                                      },
                                    })
                                  }
                                  disabled={readOnly}
                                  className="w-10 h-10 p-1"
                                />
                                <Input
                                  value={selectedField.style?.color || '#000000'}
                                  onChange={(e) =>
                                    handleFieldChange({
                                      ...selectedField,
                                      style: {
                                        ...selectedField.style,
                                        color: e.target.value,
                                      },
                                    })
                                  }
                                  disabled={readOnly}
                                />
                              </div>
                            </FormItem>
                            
                            {/* محاذاة النص */}
                            <FormItem>
                              <FormLabel>محاذاة النص</FormLabel>
                              <RadioGroup
                                value={selectedField.style?.align || 'center'}
                                onValueChange={(value) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    style: {
                                      ...selectedField.style,
                                      align: value,
                                    },
                                  })
                                }
                                disabled={readOnly}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="right" id="right" />
                                  <label htmlFor="right">يمين</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="center" id="center" />
                                  <label htmlFor="center">وسط</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="left" id="left" />
                                  <label htmlFor="left">يسار</label>
                                </div>
                              </RadioGroup>
                            </FormItem>
                            
                            {/* العرض الأقصى */}
                            <FormItem>
                              <FormLabel>
                                العرض الأقصى: {selectedField.style?.maxWidth || 300}
                              </FormLabel>
                              <FormControl>
                                <Slider
                                  min={50}
                                  max={800}
                                  step={10}
                                  value={[selectedField.style?.maxWidth || 300]}
                                  onValueChange={(values) =>
                                    handleFieldChange({
                                      ...selectedField,
                                      style: {
                                        ...selectedField.style,
                                        maxWidth: values[0],
                                      },
                                    })
                                  }
                                  disabled={readOnly}
                                />
                              </FormControl>
                            </FormItem>
                            
                            {/* ظل النص */}
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={selectedField.style?.textShadow?.enabled || false}
                                  onCheckedChange={(checked) =>
                                    handleFieldChange({
                                      ...selectedField,
                                      style: {
                                        ...selectedField.style,
                                        textShadow: {
                                          ...(selectedField.style?.textShadow || {}),
                                          enabled: checked,
                                        },
                                      },
                                    })
                                  }
                                  disabled={readOnly}
                                />
                                <FormLabel>تفعيل ظل النص</FormLabel>
                              </div>
                              
                              {selectedField.style?.textShadow?.enabled && (
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div>
                                    <FormLabel>لون الظل</FormLabel>
                                    <div className="flex gap-2">
                                      <Input
                                        type="color"
                                        value={
                                          selectedField.style?.textShadow?.color ||
                                          'rgba(0,0,0,0.5)'
                                        }
                                        onChange={(e) =>
                                          handleFieldChange({
                                            ...selectedField,
                                            style: {
                                              ...selectedField.style,
                                              textShadow: {
                                                ...(selectedField.style?.textShadow || {}),
                                                color: e.target.value,
                                              },
                                            },
                                          })
                                        }
                                        disabled={readOnly}
                                        className="w-10 h-10 p-1"
                                      />
                                      <Input
                                        value={
                                          selectedField.style?.textShadow?.color ||
                                          'rgba(0,0,0,0.5)'
                                        }
                                        onChange={(e) =>
                                          handleFieldChange({
                                            ...selectedField,
                                            style: {
                                              ...selectedField.style,
                                              textShadow: {
                                                ...(selectedField.style?.textShadow || {}),
                                                color: e.target.value,
                                              },
                                            },
                                          })
                                        }
                                        disabled={readOnly}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <FormLabel>
                                      تمويه الظل: {selectedField.style?.textShadow?.blur || 3}
                                    </FormLabel>
                                    <Slider
                                      min={0}
                                      max={20}
                                      step={1}
                                      value={[selectedField.style?.textShadow?.blur || 3]}
                                      onValueChange={(values) =>
                                        handleFieldChange({
                                          ...selectedField,
                                          style: {
                                            ...selectedField.style,
                                            textShadow: {
                                              ...(selectedField.style?.textShadow || {}),
                                              blur: values[0],
                                            },
                                          },
                                        })
                                      }
                                      disabled={readOnly}
                                    />
                                  </div>
                                </div>
                              )}
                            </FormItem>
                          </>
                        ) : (
                          <>
                            <Separator />
                            <h3 className="text-lg font-medium">خصائص الصورة</h3>
                            
                            {/* الحد الأقصى للعرض والارتفاع */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormItem>
                                <FormLabel>
                                  العرض الأقصى: {selectedField.style?.imageMaxWidth || 150}
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    min={50}
                                    max={800}
                                    step={10}
                                    value={[selectedField.style?.imageMaxWidth || 150]}
                                    onValueChange={(values) =>
                                      handleFieldChange({
                                        ...selectedField,
                                        style: {
                                          ...selectedField.style,
                                          imageMaxWidth: values[0],
                                        },
                                      })
                                    }
                                    disabled={readOnly}
                                  />
                                </FormControl>
                              </FormItem>
                              
                              <FormItem>
                                <FormLabel>
                                  الارتفاع الأقصى: {selectedField.style?.imageMaxHeight || 150}
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    min={50}
                                    max={800}
                                    step={10}
                                    value={[selectedField.style?.imageMaxHeight || 150]}
                                    onValueChange={(values) =>
                                      handleFieldChange({
                                        ...selectedField,
                                        style: {
                                          ...selectedField.style,
                                          imageMaxHeight: values[0],
                                        },
                                      })
                                    }
                                    disabled={readOnly}
                                  />
                                </FormControl>
                              </FormItem>
                            </div>
                            
                            {/* خيارات الصورة */}
                            <div className="space-y-2">
                              <FormItem>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={selectedField.style?.imageBorder || false}
                                    onCheckedChange={(checked) =>
                                      handleFieldChange({
                                        ...selectedField,
                                        style: {
                                          ...selectedField.style,
                                          imageBorder: checked === true,
                                        },
                                      })
                                    }
                                    disabled={readOnly}
                                  />
                                  <FormLabel>إظهار حدود للصورة</FormLabel>
                                </div>
                              </FormItem>
                              
                              <FormItem>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={selectedField.style?.imageRounded || false}
                                    onCheckedChange={(checked) =>
                                      handleFieldChange({
                                        ...selectedField,
                                        style: {
                                          ...selectedField.style,
                                          imageRounded: checked === true,
                                        },
                                      })
                                    }
                                    disabled={readOnly}
                                  />
                                  <FormLabel>حواف دائرية للصورة</FormLabel>
                                </div>
                              </FormItem>
                            </div>
                          </>
                        )}
                        
                        {/* خصائص متقدمة مشتركة لجميع أنواع الحقول */}
                        <Separator />
                        <h3 className="text-lg font-medium">خصائص متقدمة</h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {/* حقل إلزامي */}
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedField.required || false}
                                onCheckedChange={(checked) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    required: checked === true,
                                  })
                                }
                                disabled={readOnly}
                              />
                              <FormLabel>حقل إلزامي</FormLabel>
                            </div>
                          </FormItem>
                          
                          {/* القيمة الافتراضية */}
                          {selectedField.type === 'text' && (
                            <FormItem>
                              <FormLabel>القيمة الافتراضية</FormLabel>
                              <FormControl>
                                <Input
                                  value={selectedField.defaultValue || ''}
                                  onChange={(e) =>
                                    handleFieldChange({
                                      ...selectedField,
                                      defaultValue: e.target.value,
                                    })
                                  }
                                  disabled={readOnly}
                                />
                              </FormControl>
                              <FormDescription>
                                القيمة الافتراضية التي ستظهر في النموذج
                              </FormDescription>
                            </FormItem>
                          )}
                          
                          {/* نص توضيحي للحقل */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem>
                              <FormLabel>نص توضيحي للحقل</FormLabel>
                              <FormControl>
                                <Input
                                  value={selectedField.placeholder || ''}
                                  onChange={(e) =>
                                    handleFieldChange({
                                      ...selectedField,
                                      placeholder: e.target.value,
                                    })
                                  }
                                  disabled={readOnly}
                                />
                              </FormControl>
                            </FormItem>
                            
                            <FormItem>
                              <FormLabel>نص توضيحي (بالعربية)</FormLabel>
                              <FormControl>
                                <Input
                                  value={selectedField.placeholderAr || ''}
                                  onChange={(e) =>
                                    handleFieldChange({
                                      ...selectedField,
                                      placeholderAr: e.target.value,
                                    })
                                  }
                                  disabled={readOnly}
                                />
                              </FormControl>
                            </FormItem>
                          </div>
                          
                          {/* الدوران */}
                          <FormItem>
                            <FormLabel>
                              الدوران: {selectedField.rotation || 0} درجة
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={360}
                                step={5}
                                value={[selectedField.rotation || 0]}
                                onValueChange={(values) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    rotation: values[0],
                                  })
                                }
                                disabled={readOnly}
                              />
                            </FormControl>
                          </FormItem>
                          
                          {/* الطبقة */}
                          <FormItem>
                            <FormLabel>
                              الطبقة: {selectedField.zIndex || 1}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={100}
                                step={1}
                                value={[selectedField.zIndex || 1]}
                                onValueChange={(values) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    zIndex: values[0],
                                  })
                                }
                                disabled={readOnly}
                              />
                            </FormControl>
                            <FormDescription>
                              رقم أكبر يعني طبقة أعلى (تظهر فوق العناصر الأخرى)
                            </FormDescription>
                          </FormItem>
                          
                          {/* الرؤية */}
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={selectedField.visible !== false}
                                onCheckedChange={(checked) =>
                                  handleFieldChange({
                                    ...selectedField,
                                    visible: checked,
                                  })
                                }
                                disabled={readOnly}
                              />
                              <FormLabel>
                                {selectedField.visible === false
                                  ? 'الحقل مخفي'
                                  : 'الحقل مرئي'}
                              </FormLabel>
                            </div>
                          </FormItem>
                        </div>
                      </div>
                    </Form>
                  )}
                </CardContent>
                
                {selectedField && !readOnly && (
                  <CardFooter className="border-t p-4">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteField}
                      className="mr-auto"
                    >
                      <Trash className="w-4 h-4 ml-2" />
                      حذف الحقل
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* تبويب إعدادات القالب */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات القالب</CardTitle>
              <CardDescription>
                تعديل البيانات الأساسية للقالب.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...templateForm}>
                <form className="space-y-4">
                  {/* عنوان القالب */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="title"
                      control={templateForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان القالب</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={readOnly} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      name="titleAr"
                      control={templateForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان القالب (بالعربية)</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={readOnly} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* الوصف */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="description"
                      control={templateForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وصف القالب</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={readOnly} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      name="descriptionAr"
                      control={templateForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وصف القالب (بالعربية)</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={readOnly} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* التصنيف */}
                  <FormField
                    name="categoryId"
                    control={templateForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التصنيف</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر التصنيف" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.nameAr || category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  {/* حالة التفعيل */}
                  <FormField
                    name="active"
                    control={templateForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={readOnly}
                          />
                          <FormLabel>تفعيل القالب</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* إعدادات المحرر */}
                  <Separator />
                  <h3 className="text-lg font-medium">إعدادات المحرر</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* إظهار الشبكة */}
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editorSettings.gridEnabled}
                          onCheckedChange={(checked) =>
                            setEditorSettings({
                              ...editorSettings,
                              gridEnabled: checked,
                            })
                          }
                          disabled={readOnly}
                        />
                        <FormLabel>إظهار الشبكة في المحرر</FormLabel>
                      </div>
                    </FormItem>
                    
                    {/* تفعيل التجاذب */}
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editorSettings.snapToGrid}
                          onCheckedChange={(checked) =>
                            setEditorSettings({
                              ...editorSettings,
                              snapToGrid: checked,
                            })
                          }
                          disabled={readOnly}
                        />
                        <FormLabel>تفعيل التجاذب للشبكة</FormLabel>
                      </div>
                    </FormItem>
                    
                    {/* حجم الشبكة */}
                    <FormItem>
                      <FormLabel>
                        حجم الشبكة: {editorSettings.gridSize} بكسل
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={10}
                          max={100}
                          step={5}
                          value={[editorSettings.gridSize || 50]}
                          onValueChange={(values) =>
                            setEditorSettings({
                              ...editorSettings,
                              gridSize: values[0],
                            })
                          }
                          disabled={readOnly}
                        />
                      </FormControl>
                    </FormItem>
                    
                    {/* حساسية التجاذب */}
                    <FormItem>
                      <FormLabel>
                        حساسية التجاذب: {editorSettings.snapThreshold} بكسل
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={30}
                          step={1}
                          value={[editorSettings.snapThreshold || 10]}
                          onValueChange={(values) =>
                            setEditorSettings({
                              ...editorSettings,
                              snapThreshold: values[0],
                            })
                          }
                          disabled={readOnly}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                  
                  {!readOnly && (
                    <div className="mt-6 text-right">
                      <Button onClick={handleSaveTemplate}>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ القالب
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedTemplateEditor;