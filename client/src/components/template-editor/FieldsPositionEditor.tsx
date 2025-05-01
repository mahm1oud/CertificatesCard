/**
 * محرر مواضع الحقول المتطور
 * الإصدار 2.0 - مايو 2025
 * 
 * مميزات النسخة المحدثة:
 * - يضمن تطابق 100% بين المعاينة والصورة النهائية
 * - يدعم معاينة الصورة النهائية في مختلف التنسيقات
 * - يدعم تنزيل الصورة بجودة عالية
 * - تحكم متقدم بالشبكة والمحاذاة
 * - تحرير متكامل لخصائص الحقول
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
import { DraggableFieldsPreviewPro } from './DraggableFieldsPreviewPro';
import { OptimizedImageGenerator } from '../konva-image-generator/optimized-image-generator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { downloadImage } from '@/lib/utils';
import { 
  Grid, 
  Info, 
  Ruler, 
  CheckSquare, 
  Move,
  Download,
  Save,
  Image as ImageIcon,
  Type,
  Layers,
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Trash2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

interface FieldsPositionEditorProps {
  isOpen: boolean;
  template: any;
  fields: Field[];
  onClose: () => void;
  onSave: (updatedFields: Field[]) => void;
}

export const FieldsPositionEditor: React.FC<FieldsPositionEditorProps> = ({
  isOpen,
  template,
  fields,
  onClose,
  onSave
}) => {
  const { toast } = useToast();
  const [updatedFields, setUpdatedFields] = useState<Field[]>([...fields]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  // إضافة حالة لصورة القالب كطبقة
  const [templateImageLayer, setTemplateImageLayer] = useState<number>(10); // القيمة الافتراضية هي 10 (متوسطة)
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
    // تأكد من وجود zIndex لجميع الحقول
    const fieldsWithZIndex = fields.map((field, index) => ({
      ...field,
      zIndex: field.zIndex !== undefined ? field.zIndex : index,
      visible: field.visible !== undefined ? field.visible : true,
    }));
    setUpdatedFields(fieldsWithZIndex);
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
  
  // إضافة حقل جديد
  const addNewField = (type: 'text' | 'image') => {
    const maxId = Math.max(0, ...updatedFields.map(f => f.id));
    const maxZIndex = Math.max(0, ...updatedFields.map(f => f.zIndex || 0));
    
    const newField: Field = {
      id: maxId + 1,
      name: type === 'text' ? `text_${maxId + 1}` : `image_${maxId + 1}`,
      label: type === 'text' ? 'حقل نص جديد' : 'حقل صورة جديد',
      type,
      position: { x: 50, y: 50 },
      zIndex: maxZIndex + 1,
      visible: true,
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
  
  // تدوير الحقل
  const rotateField = (fieldId: number, direction: 'clockwise' | 'counterclockwise') => {
    const fieldToRotate = updatedFields.find(f => f.id === fieldId);
    if (!fieldToRotate) return;
    
    const currentRotation = fieldToRotate.rotation || 0;
    const rotationStep = 15; // 15 درجة في كل خطوة
    const newRotation = direction === 'clockwise' 
      ? currentRotation + rotationStep 
      : currentRotation - rotationStep;
    
    updateField({
      ...fieldToRotate,
      rotation: newRotation,
    });
  };
  
  // معالجة حفظ التغييرات
  const handleSaveChanges = () => {
    // نحتفظ بالترتيب الذي يحدده المستخدم عند السحب والإفلات
    onSave(updatedFields);
    toast({
      title: "تم الحفظ",
      description: "تم حفظ مواضع الحقول بنجاح",
    });
  };
  
  // تحديث إعدادات المحرر في DraggableFieldsPreview
  const updateEditorSettings = {
    gridEnabled,
    snapToGrid,
    gridSize,
    snapThreshold,
    templateImageLayer  // إضافة رقم طبقة صورة القالب
  };
  
  // معالجة تحديث المعاينة
  const handleUpdatePreview = () => {
    // تحديث بيانات المعاينة - بيانات افتراضية من أسماء الحقول
    const previewFormData: Record<string, any> = {};
    updatedFields.forEach(field => {
      previewFormData[field.name] = field.label || field.name;
    });
    setPreviewData(previewFormData);
    
    // تغيير لعلامة تبويب المعاينة
    setActiveTab('preview');
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
  
  // معالجة تغيير الزووم
  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(50, Math.min(150, newZoom)));
  };
  
  // معالجة توليد الصورة
  const handleImageGenerated = (imageUrl: string) => {
    setPreviewUrl(imageUrl);
  };

  return (
    <Dialog open={isOpen === true} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] h-[95vh] flex flex-col p-3 overflow-hidden">
        {/* زر إغلاق محسن في أعلى اليسار */}
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-2 mb-2 bg-gray-100 rounded flex flex-wrap justify-between items-center text-sm space-x-2 rtl:space-x-reverse">
            <div className="flex flex-wrap">
              <div className="flex items-center ml-4">
                <Info className="w-4 h-4 ml-2" />
                <span>اسحب الحقول وأفلتها على موضعها المناسب في القالب. ستظهر بنفس المكان في البطاقة النهائية.</span>
              </div>
              
              <div className="flex items-center ml-4">
                <Grid className="w-4 h-4 ml-2" />
                <span>يمكنك ضبط إعدادات الشبكة من التحكم أسفل المحرر.</span>
              </div>
            </div>
            
            <TabsList className="mr-auto">
              <TabsTrigger value="editor" className="flex items-center gap-1">
                <Layers className="w-4 h-4" />
                <span>المحرر</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>المعاينة</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="editor" className="flex-1 overflow-hidden flex mt-0">
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex gap-2 mb-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9" onClick={() => handleZoomChange(zoom - 10)}>
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>تصغير</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="flex-1">
                  <Slider 
                    min={50} 
                    max={150} 
                    step={5}
                    value={[zoom]} 
                    onValueChange={(value) => handleZoomChange(value[0])}
                  />
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9" onClick={() => handleZoomChange(zoom + 10)}>
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>تكبير</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button variant="default" size="sm" className="h-9" onClick={handleUpdatePreview}>
                  <Eye className="w-4 h-4 ml-1" />
                  <span>معاينة</span>
                </Button>
                
                <Button variant="outline" size="sm" className="h-9" onClick={() => addNewField('text')}>
                  <Type className="w-4 h-4 ml-1" />
                  <span>نص جديد</span>
                </Button>
                
                <Button variant="outline" size="sm" className="h-9" onClick={() => addNewField('image')}>
                  <ImageIcon className="w-4 h-4 ml-1" />
                  <span>صورة جديدة</span>
                </Button>
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                  {template && (
                    <div style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top right' }}>
                      <DraggableFieldsPreviewPro
                        templateImage={template.imageUrl || ''}
                        fields={updatedFields}
                        onFieldsChange={setUpdatedFields}
                        onFieldSelect={setSelectedFieldId}
                        selectedFieldId={selectedFieldId}
                        className="border border-gray-200 shadow-sm"
                        editorSettings={updateEditorSettings}
                      />
                    </div>
                  )}
                </div>
                
                <div className="w-96 border-r border-gray-200 p-3 overflow-y-auto">
                  <div className="space-y-4">
                    {/* إضافة بانل التحكم بعرض صورة القالب كطبقة */}
                    <div className="bg-gray-50 p-3 rounded-md shadow-sm border border-gray-200 mb-4">
                      <h3 className="text-lg font-semibold mb-2">صورة القالب</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>رقم الطبقة</Label>
                          <div className="flex">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    className="h-7 w-7 ml-1"
                                    onClick={() => setTemplateImageLayer(Math.max(0, templateImageLayer - 1))}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>خفض طبقة القالب (للخلف)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Input 
                              value={templateImageLayer} 
                              onChange={(e) => setTemplateImageLayer(parseInt(e.target.value) || 0)}
                              className="w-16 text-center h-7 mx-1"
                              type="number"
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    className="h-7 w-7 mr-1"
                                    onClick={() => setTemplateImageLayer(templateImageLayer + 1)}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>رفع طبقة القالب (للأمام)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>ملاحظة: كلما قل رقم الطبقة، ظهرت الصورة أكثر للخلف. وكلما زاد رقم الطبقة، ظهرت الصورة أكثر للأمام.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-lg font-medium">الحقول</div>
                    <div className="space-y-1 max-h-[250px] overflow-y-auto">
                      {updatedFields.map((field) => (
                        <div 
                          key={field.id}
                          className={`flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer ${selectedFieldId === field.id ? 'bg-blue-50 border border-blue-200' : ''}`}
                          onClick={() => setSelectedFieldId(field.id)}
                        >
                          <div className="flex items-center">
                            {field.type === 'text' ? (
                              <Type className="w-4 h-4 ml-2 text-gray-500" />
                            ) : (
                              <ImageIcon className="w-4 h-4 ml-2 text-gray-500" />
                            )}
                            <span className="text-sm">{field.label || field.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={(e) => { e.stopPropagation(); toggleFieldVisibility(field.id); }}
                                  >
                                    {field.visible === false ? (
                                      <EyeOff className="w-3 h-3" />
                                    ) : (
                                      <Eye className="w-3 h-3" />
                                    )}
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
                                    className="h-6 w-6"
                                    onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }}
                                  >
                                    <Copy className="w-3 h-3" />
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
                                    className="h-6 w-6"
                                    onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>حذف الحقل</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    {selectedField && (
                      <div className="space-y-4">
                        <div className="text-lg font-medium">خصائص الحقل</div>
                        <div className="space-y-3">
                          {/* خصائص مشتركة */}
                          <div>
                            <Label>عنوان الحقل</Label>
                            <Input 
                              value={selectedField.label || ''} 
                              onChange={(e) => updateField({ ...selectedField, label: e.target.value })} 
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>الموضع الأفقي</Label>
                              <div className="flex items-center mt-1">
                                <Input 
                                  type="number"
                                  value={selectedField.position.x} 
                                  onChange={(e) => {
                                    const x = parseInt(e.target.value) || 0;
                                    updateField({
                                      ...selectedField,
                                      position: { ...selectedField.position, x }
                                    });
                                  }}
                                  className="text-center"
                                />
                                <span className="mr-1 text-sm">%</span>
                              </div>
                            </div>
                            <div>
                              <Label>الموضع الرأسي</Label>
                              <div className="flex items-center mt-1">
                                <Input 
                                  type="number"
                                  value={selectedField.position.y} 
                                  onChange={(e) => {
                                    const y = parseInt(e.target.value) || 0;
                                    updateField({
                                      ...selectedField,
                                      position: { ...selectedField.position, y }
                                    });
                                  }}
                                  className="text-center"
                                />
                                <span className="mr-1 text-sm">%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>التدوير</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9" 
                                onClick={() => rotateField(selectedField.id, 'counterclockwise')}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <div className="flex-1">
                                <Slider 
                                  min={-180} 
                                  max={180} 
                                  step={5}
                                  value={[selectedField.rotation || 0]} 
                                  onValueChange={(value) => updateField({
                                    ...selectedField,
                                    rotation: value[0]
                                  })}
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9" 
                                onClick={() => rotateField(selectedField.id, 'clockwise')}
                              >
                                <RotateCw className="w-4 h-4" />
                              </Button>
                              <span className="font-mono w-12 text-center">{selectedField.rotation || 0}°</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label>رقم الطبقة (zIndex)</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9" 
                                onClick={() => updateField({
                                  ...selectedField,
                                  zIndex: Math.max(0, (selectedField.zIndex || 0) - 1)
                                })}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <div className="flex-1">
                                <Input 
                                  type="number"
                                  value={selectedField.zIndex || 0} 
                                  onChange={(e) => updateField({
                                    ...selectedField,
                                    zIndex: parseInt(e.target.value) || 0
                                  })} 
                                  className="text-center"
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9" 
                                onClick={() => updateField({
                                  ...selectedField,
                                  zIndex: (selectedField.zIndex || 0) + 1
                                })}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-9"
                                    >
                                      <HelpCircle className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">رقم الطبقة يحدد مستوى ظهور الحقل. القيم الأعلى تظهر فوق القيم الأقل.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>الظل</Label>
                              <Switch
                                checked={selectedField.style?.textShadow?.enabled || false}
                                onCheckedChange={(checked) => {
                                  const currentStyle = selectedField.style || {};
                                  const currentShadow = currentStyle.textShadow || {};
                                  
                                  updateField({
                                    ...selectedField,
                                    style: {
                                      ...currentStyle,
                                      textShadow: {
                                        ...currentShadow,
                                        enabled: checked,
                                        color: currentShadow.color || 'rgba(0, 0, 0, 0.5)',
                                        blur: currentShadow.blur || 3
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                            
                            {selectedField.style?.textShadow?.enabled && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <Label>لون الظل</Label>
                                  <Input
                                    type="text"
                                    value={selectedField.style?.textShadow?.color || 'rgba(0, 0, 0, 0.5)'}
                                    onChange={(e) => {
                                      const currentStyle = selectedField.style || {};
                                      const currentShadow = currentStyle.textShadow || {};
                                      
                                      updateField({
                                        ...selectedField,
                                        style: {
                                          ...currentStyle,
                                          textShadow: {
                                            ...currentShadow,
                                            color: e.target.value
                                          }
                                        }
                                      });
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label>ضبابية الظل</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={selectedField.style?.textShadow?.blur || 3}
                                    onChange={(e) => {
                                      const currentStyle = selectedField.style || {};
                                      const currentShadow = currentStyle.textShadow || {};
                                      
                                      updateField({
                                        ...selectedField,
                                        style: {
                                          ...currentStyle,
                                          textShadow: {
                                            ...currentShadow,
                                            blur: parseInt(e.target.value) || 3
                                          }
                                        }
                                      });
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            )}
                          
                          {/* خصائص خاصة بالنصوص */}
                          {selectedField.type === 'text' && (
                            <>
                              <div>
                                <Label>نوع الخط</Label>
                                <Select
                                  value={selectedField.style?.fontFamily || 'Cairo'}
                                  onValueChange={(value) => updateField({
                                    ...selectedField,
                                    style: { ...selectedField.style, fontFamily: value }
                                  })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="اختر نوع الخط" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Cairo">Cairo</SelectItem>
                                    <SelectItem value="Tajawal">Tajawal</SelectItem>
                                    <SelectItem value="Amiri">Amiri</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label>حجم الخط</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1">
                                    <Slider 
                                      min={14} 
                                      max={60} 
                                      step={1}
                                      value={[selectedField.style?.fontSize || 24]} 
                                      onValueChange={(value) => updateField({
                                        ...selectedField,
                                        style: { ...selectedField.style, fontSize: value[0] }
                                      })}
                                    />
                                  </div>
                                  <span className="font-mono w-10 text-center">{selectedField.style?.fontSize || 24}px</span>
                                </div>
                              </div>
                              
                              <div>
                                <Label>لون الخط</Label>
                                <div className="flex mt-1">
                                  <Input 
                                    type="color"
                                    value={selectedField.style?.color || '#000000'} 
                                    onChange={(e) => updateField({
                                      ...selectedField,
                                      style: { ...selectedField.style, color: e.target.value }
                                    })}
                                    className="w-12 p-1 h-9"
                                  />
                                  <Input 
                                    value={selectedField.style?.color || '#000000'} 
                                    onChange={(e) => updateField({
                                      ...selectedField,
                                      style: { ...selectedField.style, color: e.target.value }
                                    })}
                                    className="flex-1 mr-2 text-center font-mono"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <Label>المحاذاة</Label>
                                <Select
                                  value={selectedField.style?.align || 'center'}
                                  onValueChange={(value) => updateField({
                                    ...selectedField,
                                    style: { ...selectedField.style, align: value }
                                  })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="اختر المحاذاة" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="right">يمين</SelectItem>
                                    <SelectItem value="center">وسط</SelectItem>
                                    <SelectItem value="left">يسار</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between">
                                  <Label>تفعيل الظل</Label>
                                  <Switch 
                                    checked={selectedField.style?.textShadow?.enabled || false}
                                    onCheckedChange={(checked) => updateField({
                                      ...selectedField,
                                      style: { 
                                        ...selectedField.style, 
                                        textShadow: { 
                                          ...selectedField.style?.textShadow,
                                          enabled: checked,
                                          color: selectedField.style?.textShadow?.color || 'rgba(0, 0, 0, 0.5)',
                                          blur: selectedField.style?.textShadow?.blur || 3
                                        } 
                                      }
                                    })}
                                  />
                                </div>
                                
                                {selectedField.style?.textShadow?.enabled && (
                                  <>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      <div>
                                        <Label>لون الظل</Label>
                                        <Input 
                                          type="color"
                                          value={selectedField.style?.textShadow?.color || 'rgba(0, 0, 0, 0.5)'} 
                                          onChange={(e) => updateField({
                                            ...selectedField,
                                            style: { 
                                              ...selectedField.style, 
                                              textShadow: { 
                                                ...selectedField.style?.textShadow,
                                                color: e.target.value 
                                              } 
                                            }
                                          })}
                                          className="mt-1 w-full h-8 p-1"
                                        />
                                      </div>
                                      <div>
                                        <Label>حدة الظل</Label>
                                        <div className="flex items-center mt-1">
                                          <Input 
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={selectedField.style?.textShadow?.blur || 3} 
                                            onChange={(e) => updateField({
                                              ...selectedField,
                                              style: { 
                                                ...selectedField.style, 
                                                textShadow: { 
                                                  ...selectedField.style?.textShadow,
                                                  blur: parseInt(e.target.value) || 3 
                                                } 
                                              }
                                            })}
                                            className="text-center"
                                          />
                                          <span className="mr-1 text-sm">px</span>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                          
                          {/* خصائص خاصة بالصور */}
                          {selectedField.type === 'image' && (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label>العرض الأقصى</Label>
                                  <div className="flex items-center mt-1">
                                    <Input 
                                      type="number"
                                      value={selectedField.style?.imageMaxWidth || 200} 
                                      onChange={(e) => updateField({
                                        ...selectedField,
                                        style: { 
                                          ...selectedField.style, 
                                          imageMaxWidth: parseInt(e.target.value) || 200 
                                        }
                                      })}
                                      className="text-center"
                                    />
                                    <span className="mr-1 text-sm">px</span>
                                  </div>
                                </div>
                                <div>
                                  <Label>الارتفاع الأقصى</Label>
                                  <div className="flex items-center mt-1">
                                    <Input 
                                      type="number"
                                      value={selectedField.style?.imageMaxHeight || 200} 
                                      onChange={(e) => updateField({
                                        ...selectedField,
                                        style: { 
                                          ...selectedField.style, 
                                          imageMaxHeight: parseInt(e.target.value) || 200 
                                        }
                                      })}
                                      className="text-center"
                                    />
                                    <span className="mr-1 text-sm">px</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label>إظهار إطار</Label>
                                <Switch 
                                  checked={selectedField.style?.imageBorder || false}
                                  onCheckedChange={(checked) => updateField({
                                    ...selectedField,
                                    style: { ...selectedField.style, imageBorder: checked }
                                  })}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Label>حواف دائرية</Label>
                                <Switch 
                                  checked={selectedField.style?.imageRounded || false}
                                  onCheckedChange={(checked) => updateField({
                                    ...selectedField,
                                    style: { ...selectedField.style, imageRounded: checked }
                                  })}
                                />
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between">
                                  <Label>تفعيل ظل الصورة</Label>
                                  <Switch 
                                    checked={selectedField.style?.imageShadow?.enabled || false}
                                    onCheckedChange={(checked) => updateField({
                                      ...selectedField,
                                      style: { 
                                        ...selectedField.style, 
                                        imageShadow: { 
                                          ...selectedField.style?.imageShadow,
                                          enabled: checked,
                                          color: selectedField.style?.imageShadow?.color || 'rgba(0, 0, 0, 0.5)',
                                          blur: selectedField.style?.imageShadow?.blur || 5
                                        } 
                                      }
                                    })}
                                  />
                                </div>
                                
                                {selectedField.style?.imageShadow?.enabled && (
                                  <div className="mt-3 space-y-3">
                                    <div>
                                      <Label>لون الظل</Label>
                                      <div className="flex mt-1">
                                        <Input 
                                          type="color"
                                          value={selectedField.style?.imageShadow?.color?.startsWith('#') ? selectedField.style?.imageShadow?.color : '#000000'} 
                                          onChange={(e) => updateField({
                                            ...selectedField,
                                            style: { 
                                              ...selectedField.style, 
                                              imageShadow: {
                                                ...selectedField.style?.imageShadow,
                                                color: e.target.value
                                              }
                                            }
                                          })}
                                          className="w-12 p-1 h-9"
                                        />
                                        <Input 
                                          value={selectedField.style?.imageShadow?.color || 'rgba(0, 0, 0, 0.5)'} 
                                          onChange={(e) => updateField({
                                            ...selectedField,
                                            style: { 
                                              ...selectedField.style, 
                                              imageShadow: {
                                                ...selectedField.style?.imageShadow,
                                                color: e.target.value
                                              }
                                            }
                                          })}
                                          className="flex-1 mr-2 text-center font-mono"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label>تمويه الظل</Label>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1">
                                          <Slider 
                                            min={0} 
                                            max={20} 
                                            step={1}
                                            value={[selectedField.style?.imageShadow?.blur || 5]} 
                                            onValueChange={(value) => updateField({
                                              ...selectedField,
                                              style: { 
                                                ...selectedField.style, 
                                                imageShadow: {
                                                  ...selectedField.style?.imageShadow,
                                                  blur: value[0]
                                                }
                                              }
                                            })}
                                          />
                                        </div>
                                        <span className="font-mono w-10 text-center">{selectedField.style?.imageShadow?.blur || 5}px</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* تحكم الشبكة والتجاذب */}
              <div className="mt-2 p-2 bg-gray-50 rounded-md flex flex-wrap items-center gap-4 rtl:space-x-reverse">
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">إظهار الشبكة</Label>
                  <Switch 
                    checked={gridEnabled}
                    onCheckedChange={setGridEnabled}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">تفعيل التجاذب</Label>
                  <Switch 
                    checked={snapToGrid}
                    onCheckedChange={setSnapToGrid}
                  />
                </div>
                
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Grid className="w-4 h-4 ml-1" />
                  <Label className="text-xs whitespace-nowrap">حجم الشبكة</Label>
                  <div className="flex-1">
                    <Slider 
                      min={20} 
                      max={100} 
                      step={5}
                      value={[gridSize]} 
                      onValueChange={(value) => setGridSize(value[0])}
                    />
                  </div>
                  <span className="text-xs font-mono w-8 text-center">{gridSize}px</span>
                </div>
                
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Move className="w-4 h-4 ml-1" />
                  <Label className="text-xs whitespace-nowrap">قوة التجاذب</Label>
                  <div className="flex-1">
                    <Slider 
                      min={5} 
                      max={30} 
                      step={5}
                      value={[snapThreshold]} 
                      onValueChange={(value) => setSnapThreshold(value[0])}
                    />
                  </div>
                  <span className="text-xs font-mono w-8 text-center">{snapThreshold}px</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 overflow-hidden flex mt-0">
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2 items-center">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('editor')}>
                    <Layers className="w-4 h-4 ml-1" />
                    <span>العودة للمحرر</span>
                  </Button>
                  
                  <Select
                    value={previewQuality}
                    onValueChange={(value) => setPreviewQuality(value as any)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="جودة المعاينة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preview">جودة منخفضة</SelectItem>
                      <SelectItem value="medium">جودة متوسطة</SelectItem>
                      <SelectItem value="high">جودة عالية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownloadImage}
                  disabled={!previewUrl}
                >
                  <Download className="w-4 h-4 ml-1" />
                  <span>تنزيل الصورة</span>
                </Button>
              </div>
              
              <div className="flex-1 flex justify-center items-start overflow-auto bg-gray-50 rounded p-4" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                <div className="bg-white shadow-md">
                  {template && (
                    <OptimizedImageGenerator
                      templateImage={template.imageUrl || ''}
                      fields={updatedFields.filter(f => f.visible !== false)}
                      formData={previewData}
                      onImageGenerated={handleImageGenerated}
                      quality={previewQuality}
                      className="max-w-full max-h-full"
                    />
                  )}
                </div>
              </div>
              
              {/* معلومات المعاينة */}
              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-500 flex items-center">
                  <Info className="w-4 h-4 ml-1 text-blue-500" />
                  <span>تم إنشاء هذه المعاينة بتطابق 100% مع النتيجة النهائية التي ستظهر في البطاقة.</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
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