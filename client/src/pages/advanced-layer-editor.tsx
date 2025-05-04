/**
 * صفحة محرر الطبقات المتقدم
 * الإصدار 1.0 - مايو 2025
 * 
 * هذه صفحة منفصلة تقدم تجربة تحرير متقدمة للطبقات
 * حيث يمكن للمستخدم وضع بعض العناصر خلف صورة القالب والبعض الآخر أمامها
 * مع دعم كامل للمحاذاة والشبكة والتدوير وإدارة الطبقات
 * 
 * ملاحظة: هذا المحرر مستقل تمامًا عن المحرر التقليدي ويقدم نهجًا مختلفًا للتحرير
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { AdvancedLayerEditor } from '@/components/advanced-editor/AdvancedLayerEditor';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdvancedLayerEditorPageProps {
  // خصائص إضافية يمكن إضافتها هنا
}

// الصفحة الرئيسية للمحرر المتقدم
const AdvancedLayerEditorPage: React.FC<AdvancedLayerEditorPageProps> = () => {
  // استخراج معرف القالب من معلمات URL
  const params = useParams();
  const templateId = parseInt(params.templateId || params.id || '0');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // حالة القالب والحقول
  const [template, setTemplate] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // جلب معلومات القالب والحقول
  useEffect(() => {
    async function fetchTemplateAndFields() {
      if (!templateId) {
        setError('معرف القالب غير صالح');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // جلب معلومات القالب
        const templateData = await apiRequest('GET', `/api/templates/${templateId}`);
        setTemplate(templateData);
        
        // جلب حقول القالب
        const fieldsData = await apiRequest('GET', `/api/admin/template-fields/${templateId}`);
        
        // إضافة خصائص zIndex وvisible إذا لم تكن موجودة
        const processedFields = fieldsData.map((field: any, index: number) => ({
          ...field,
          zIndex: field.style?.layer || index,
          visible: field.visible !== false,
          // التأكد من وجود موضع إذا لم يكن موجودًا
          position: field.position || { x: 50, y: 50 + (index * 50), snapToGrid: false }
        }));
        
        setFields(processedFields);
        
        // إنشاء بيانات نموذج افتراضية للمعاينة
        const defaultFormData: Record<string, any> = {};
        processedFields.forEach((field: any) => {
          if (field.type === 'text') {
            defaultFormData[field.name] = field.defaultValue || field.label || field.name;
          } else if (field.type === 'image') {
            defaultFormData[field.name] = null;
          }
        });
        
        setFormData(defaultFormData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading template data:', error);
        setError('حدث خطأ أثناء تحميل بيانات القالب. يرجى المحاولة مرة أخرى.');
        setLoading(false);
      }
    }
    
    fetchTemplateAndFields();
  }, [templateId]);
  
  // معالجة تغييرات الحقول
  const handleFieldsChange = useCallback((updatedFields: any[]) => {
    setFields(updatedFields);
  }, []);
  
  // حفظ التغييرات في الخادم
  const handleSave = useCallback(async () => {
    if (!templateId || fields.length === 0) return;
    
    try {
      setSaving(true);
      
      // تحضير الحقول للحفظ (استبعاد حقل القالب، -1)
      const fieldsToSave = fields
        .filter(field => field.id !== -1) // استبعاد حقل صورة القالب
        .map(field => ({
          id: field.id,
          templateId: field.templateId,
          name: field.name,
          label: field.label,
          labelAr: field.labelAr,
          type: field.type,
          position: field.position,
          style: {
            ...field.style,
            layer: field.zIndex || 0
          },
          visible: field.visible,
          required: field.required,
          defaultValue: field.defaultValue,
          placeholder: field.placeholder,
          placeholderAr: field.placeholderAr,
          options: field.options,
          displayOrder: field.displayOrder
        }));
      
      // إرسال الحقول المحدثة إلى الخادم
      await apiRequest('PUT', `/api/admin/template-fields/${templateId}/batch-update`, fieldsToSave);
      
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ تغييرات الطبقات بنجاح',
        duration: 3000
      });
      
      setSaving(false);
    } catch (error) {
      console.error('Error saving fields:', error);
      
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
        duration: 5000
      });
      
      setSaving(false);
    }
  }, [templateId, fields, toast]);
  
  // العودة إلى صفحة تحرير القالب
  const handleBack = useCallback(() => {
    setLocation(`/admin/templates/${templateId}/fields`);
  }, [setLocation, templateId]);
  
  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">جاري تحميل بيانات القالب...</p>
        </div>
      </div>
    );
  }
  
  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button onClick={handleBack} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container-fluid py-4">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">محرر الطبقات المتقدم</h1>
          <p className="text-muted-foreground">
            {template?.title || template?.name || 'قالب جديد'} - إدارة الطبقات والمواضع
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة
          </Button>
          
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Alert className="mb-4">
        <AlertTitle>نظام طبقات متقدم</AlertTitle>
        <AlertDescription>
          يمكنك وضع بعض الحقول أمام صورة القالب والبعض الآخر خلفها من خلال إدارة الطبقات في اللوحة الجانبية.
          استخدم زر المغناطيس للالتصاق بالشبكة لوضع أكثر دقة للحقول.
        </AlertDescription>
      </Alert>
      
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle>قالب: {template?.title || template?.name || 'قالب جديد'}</CardTitle>
          <CardDescription>
            {fields.length} حقل متاح للتحرير
          </CardDescription>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-4 px-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="overflow-hidden">
              {template && fields.length > 0 && (
                <AdvancedLayerEditor
                  templateImage={template.imageUrl}
                  fields={fields}
                  onFieldsChange={handleFieldsChange}
                  onSave={handleSave}
                  editorSettings={{
                    gridEnabled: true,
                    snapToGrid: true,
                    gridSize: 20,
                    templateImagePosition: 'middle',
                    showRulers: true
                  }}
                />
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedLayerEditorPage;