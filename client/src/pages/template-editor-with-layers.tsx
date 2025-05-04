/**
 * صفحة محرر القوالب مع دعم الطبقات
 * الإصدار 1.0 - مايو 2025
 * 
 * هذه الصفحة تستخدم النسخة المحسنة من محرر القوالب التي تدعم الطبقات
 * وتصورة القالب كطبقة مستقلة يمكن التحكم بها
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { DraggableFieldsPreviewWithLayers } from '../components/template-editor/DraggableFieldsPreviewWithLayers';
import { FieldType } from '../components/template-editor/DraggableFieldsPreviewFixed';
import { LayersPanelSimple } from '../components/template-editor/LayersPanelSimple';
import { FieldPropertiesPanel } from '../components/template-editor/FieldPropertiesPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Image, Type as TextIcon, Download, Loader2, Layers, Settings, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// عينة من الحقول للاختبار
const sampleFields = [
  {
    id: 1,
    name: 'name_field',
    label: 'الاسم',
    type: 'text',
    position: { x: 400, y: 200 },
    style: {
      fontFamily: 'Cairo',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      maxWidth: 300
    },
    zIndex: 2,
    visible: true,
    rotation: 0
  },
  {
    id: 2,
    name: 'certificate_title',
    label: 'شهادة تقدير',
    type: 'text',
    position: { x: 400, y: 100 },
    style: {
      fontFamily: 'Cairo',
      fontSize: 30,
      fontWeight: 'bold',
      color: '#1e3a8a',
      align: 'center',
      maxWidth: 400
    },
    zIndex: 3,
    visible: true,
    rotation: 0
  },
  {
    id: 3,
    name: 'date_field',
    label: 'التاريخ',
    type: 'text',
    position: { x: 400, y: 350 },
    style: {
      fontFamily: 'Cairo',
      fontSize: 16,
      fontWeight: 'normal',
      color: '#666666',
      align: 'center',
      maxWidth: 200
    },
    zIndex: 1,
    visible: true,
    rotation: 0
  }
];

// صورة قالب للاختبار
const sampleTemplateImage = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1080&q=80';

export default function TemplateEditorWithLayers() {
  // استخراج معرّف القالب من المسار
  const params = useParams<{ templateId?: string }>();
  const { templateId } = params;
  const [, navigate] = useLocation();
  
  // بيانات للاختبار في حالة عدم وجود قالب محدد
  const [fields, setFields] = useState<FieldType[]>(templateId ? [] : sampleFields);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [templateImageLayer, setTemplateImageLayer] = useState<number>(0); // طبقة صورة القالب
  const [isTemplateImageVisible, setIsTemplateImageVisible] = useState<boolean>(true); // حالة رؤية صورة القالب
  const [templateImage, setTemplateImage] = useState<string>(templateId ? '' : sampleTemplateImage);
  
  // استعلام لجلب بيانات القالب إذا كان هناك معرّف للقالب
  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      return await apiRequest('GET', `/api/templates/${templateId}`);
    },
    enabled: !!templateId
  });
  
  // استعلام لجلب حقول القالب
  const { data: templateFields, isLoading: isLoadingFields } = useQuery({
    queryKey: ['template-fields', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      return await apiRequest('GET', `/api/admin/template-fields/${templateId}`);
    },
    enabled: !!templateId
  });
  
  // تحميل القالب وحقوله
  useEffect(() => {
    if (template && !isLoadingTemplate) {
      // تعيين صورة القالب
      if (template.imageUrl) {
        setTemplateImage(template.imageUrl);
      }
      
      // طباعة البيانات للتصحيح
      console.log('تم تحميل القالب:', template);
    }
    
    if (templateFields && !isLoadingFields) {
      // تحويل حقول القالب إلى الصيغة المطلوبة
      const convertedFields = templateFields.map((field: any) => {
        // التأكد من وجود جميع البيانات المطلوبة
        return {
          id: field.id,
          name: field.name,
          label: field.label || field.name || '',
          type: field.type || 'text',
          position: field.position || { x: 200, y: 200 },
          style: field.style || {
            fontFamily: 'Cairo',
            fontSize: 24,
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
            maxWidth: 300
          },
          zIndex: field.zIndex || 1,
          visible: field.visible !== false,
          rotation: field.rotation || 0
        };
      });
      
      // تحديث الحقول
      setFields(convertedFields);
      
      // طباعة البيانات للتصحيح
      console.log('تم تحميل الحقول:', convertedFields);
    }
  }, [template, templateFields, isLoadingTemplate, isLoadingFields]);
  
  const { toast } = useToast();
  
  // تجهيز قائمة الطبقات للعرض
  const layersForDisplay = React.useMemo(() => {
    // إنشاء طبقة لصورة القالب
    const templateLayer = {
      id: -1, // معرف خاص لصورة القالب
      name: 'template_image',
      label: 'صورة القالب',
      type: 'template',
      zIndex: templateImageLayer,
      visible: isTemplateImageVisible
    };
    
    // دمج طبقة صورة القالب مع الحقول العادية
    return [templateLayer, ...fields].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [fields, templateImageLayer, isTemplateImageVisible]);
  
  // إضافة حقل جديد
  const handleAddField = (type: 'text' | 'image') => {
    const maxId = fields.length > 0 ? Math.max(...fields.map(f => f.id)) : 0;
    
    const newField = {
      id: maxId + 1,
      name: type === 'text' ? `text_field_${maxId + 1}` : `image_field_${maxId + 1}`,
      label: type === 'text' ? 'نص جديد' : 'صورة جديدة',
      type,
      position: { x: 400, y: 200 },
      style: type === 'text' ? {
        fontFamily: 'Cairo',
        fontSize: 24,
        fontWeight: 'normal',
        color: '#000000',
        align: 'center',
        maxWidth: 300
      } : {
        // التأكد من وجود جميع الخصائص المطلوبة للتوافق مع TypeScript
        fontFamily: 'Arial',
        fontSize: 0,
        fontWeight: 'normal',
        color: '#000000',
        align: 'center',
        maxWidth: 300,
        // خصائص الصورة
        imageMaxWidth: 150,
        imageMaxHeight: 150
      },
      zIndex: Math.max(...fields.map(f => f.zIndex || 0), 0) + 1, // أعلى من كل الطبقات
      visible: true,
      rotation: 0
    };
    
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
    
    toast({
      title: 'تم إضافة حقل جديد',
      description: `تم إضافة حقل ${type === 'text' ? 'نصي' : 'صورة'} جديد`
    });
  };
  
  // تغيير ترتيب الطبقات
  const handleLayerOrderChange = (sourceIndex: number, destinationIndex: number) => {
    // نسخ قائمة الطبقات لتطبيق التغيير عليها
    const updatedLayers = [...layersForDisplay];
    
    // إزالة العنصر من مكانه السابق وإضافته في المكان الجديد
    const [removed] = updatedLayers.splice(sourceIndex, 1);
    updatedLayers.splice(destinationIndex, 0, removed);
    
    // تحديث قيمة zIndex لكل العناصر بناءً على موقعها في المصفوفة
    const layersWithUpdatedIndices = updatedLayers.map((layer, index) => ({
      ...layer,
      zIndex: index
    }));
    
    // تحديث صورة القالب إذا تم تغييرها
    const templateLayer = layersWithUpdatedIndices.find(layer => layer.id === -1);
    if (templateLayer) {
      setTemplateImageLayer(templateLayer.zIndex || 0);
    }
    
    // تحديث الحقول العادية (باستثناء صورة القالب)
    const updatedFields = layersWithUpdatedIndices
      .filter(layer => layer.id !== -1)
      .map(layer => {
        // نسخ الحقل الأصلي وتحديث zIndex فقط
        const originalField = fields.find(f => f.id === layer.id);
        if (originalField) {
          return { ...originalField, zIndex: layer.zIndex };
        }
        // فقط للتوافق مع TypeScript - لن يتم الوصول إلى هنا عملياً
        return {
          ...fields[0],
          id: layer.id || 1,
          name: layer.name || 'field',
          label: layer.label || 'حقل',
          type: layer.type || 'text',
          position: { x: 0, y: 0 },
          style: { fontFamily: 'Cairo', fontSize: 24, fontWeight: 'normal', color: '#000000', align: 'center', maxWidth: 300 },
          zIndex: layer.zIndex || 0,
          visible: layer.visible !== undefined ? layer.visible : true,
          rotation: 0
        };
      });
    
    setFields(updatedFields);
  };
  
  // تبديل رؤية طبقة
  const handleLayerVisibilityToggle = (layerId: number) => {
    if (layerId === -1) {
      // تبديل رؤية صورة القالب
      setIsTemplateImageVisible(!isTemplateImageVisible);
    } else {
      // تبديل رؤية حقل عادي
      setFields(fields.map(field => {
        if (field.id === layerId) {
          return { ...field, visible: field.visible === false ? true : false };
        }
        return field;
      }));
    }
  };
  
  // معالجة تصدير الصورة
  const handleExportImage = (imageDataUrl: string) => {
    // إنشاء رابط تنزيل
    const link = document.createElement('a');
    link.download = `template-${Date.now()}.png`;
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'تم تصدير الصورة',
      description: 'تم تصدير الصورة بنجاح'
    });
  };
  
  // حفظ التغييرات في قاعدة البيانات
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!templateId) return null;
      
      // حفظ حقول القالب
      const fieldsToSave = fields.map(field => ({
        ...field,
        templateId: parseInt(templateId)
      }));
      
      return await apiRequest('PUT', `/api/admin/template-fields/${templateId}`, fieldsToSave);
    },
    onSuccess: () => {
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم حفظ جميع تغييرات القالب'
      });
    },
    onError: (error) => {
      console.error('خطأ في الحفظ:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ بيانات القالب',
        variant: 'destructive'
      });
    }
  });
  
  // الحقل المحدد حالياً
  const selectedField = React.useMemo(() => {
    if (selectedFieldId === null) return null;
    if (selectedFieldId === -1) {
      // حقل خاص لصورة القالب
      return {
        id: -1,
        name: 'template_image',
        label: 'صورة القالب',
        type: 'template',
        position: { x: 0, y: 0 },
        zIndex: templateImageLayer,
        visible: isTemplateImageVisible
      };
    }
    return fields.find(f => f.id === selectedFieldId) || null;
  }, [selectedFieldId, fields, templateImageLayer, isTemplateImageVisible]);
  
  // تحديث حقل
  const handleFieldUpdate = (updatedField: any) => {
    if (updatedField.id === -1) {
      // تحديث خصائص صورة القالب
      setTemplateImageLayer(updatedField.zIndex || 0);
      setIsTemplateImageVisible(updatedField.visible !== false);
    } else {
      // تحديث حقل عادي
      setFields(fields.map(field => 
        field.id === updatedField.id ? updatedField : field
      ));
    }
  };
  
  return (
    <div className="template-editor-page p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/templates')}>
            <XCircle className="mr-2 h-4 w-4" />
            الرجوع للقوالب
          </Button>
          <h1 className="text-2xl font-bold">
            {isLoadingTemplate ? 'جاري التحميل...' : 
              template ? template.titleAr || template.title : 'محرر القوالب مع دعم الطبقات'}
          </h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleAddField('text')}>
            <TextIcon className="mr-2 h-4 w-4" />
            إضافة نص
          </Button>
          
          <Button variant="outline" onClick={() => handleAddField('image')}>
            <Image className="mr-2 h-4 w-4" />
            إضافة صورة
          </Button>
          
          <Button 
            variant="default" 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !templateId}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* لوحة الطبقات */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="layers" className="h-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="layers">
                <Layers className="w-4 h-4 mr-2" />
                الطبقات
              </TabsTrigger>
              <TabsTrigger value="properties">
                <Settings className="w-4 h-4 mr-2" />
                الخصائص
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="layers" className="h-[calc(100%-50px)]">
              <ScrollArea className="h-full">
                <LayersPanelSimple
                  fields={fields}
                  hasTemplateImage={true}
                  templateImageZIndex={templateImageLayer}
                  isTemplateImageVisible={isTemplateImageVisible}
                  onFieldsUpdate={setFields}
                  onLayerClick={setSelectedFieldId}
                  activeLayerId={selectedFieldId}
                  onTemplateImageUpdate={(zIndex, isVisible) => {
                    setTemplateImageLayer(zIndex);
                    setIsTemplateImageVisible(isVisible);
                  }}
                  onAddField={handleAddField}
                />
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="properties" className="h-[calc(100%-50px)]">
              <ScrollArea className="h-full">
                <FieldPropertiesPanel
                  field={selectedField}
                  onFieldUpdate={handleFieldUpdate}
                  availableFonts={['Cairo', 'Tajawal', 'Arial', 'sans-serif', 'Verdana', 'Tahoma']}
                />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* معاينة القالب */}
        <div className="lg:col-span-9">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>معاينة القالب مع دعم الطبقات</CardTitle>
              <CardDescription>
                يمكنك سحب العناصر لتغيير مواضعها، وتحريك طبقات أمام أو خلف صورة القالب
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 pb-0">
              {isLoadingTemplate || isLoadingFields ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p>جاري تحميل بيانات القالب...</p>
                </div>
              ) : (
                <div className="h-full">
                  <DraggableFieldsPreviewWithLayers
                    templateImage={templateImage}
                    fields={fields}
                    onFieldsChange={(updatedFields: FieldType[]) => setFields(updatedFields)}
                    selectedFieldId={selectedFieldId}
                    onSelectedFieldChange={setSelectedFieldId}
                    onImageExport={handleExportImage}
                    templateImageLayer={templateImageLayer}
                    isTemplateImageVisible={isTemplateImageVisible}
                    onTemplateImageLayerChange={setTemplateImageLayer}
                    onTemplateImageVisibilityChange={setIsTemplateImageVisible}
                    editorSettings={{
                      gridEnabled: true,
                      snapToGrid: true,
                      gridSize: 20,
                      snapThreshold: 10
                    }}
                  />
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t mt-auto">
              <div className="text-sm text-muted-foreground">
                <strong>طريقة الاستخدام:</strong> انقر على حقل لتحديده، ثم يمكنك تعديل خصائصه في لوحة الخصائص. استخدم لوحة الطبقات لتغيير ترتيب العناصر ووضعها أمام أو خلف صورة القالب.
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
