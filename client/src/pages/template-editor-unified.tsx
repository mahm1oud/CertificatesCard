/**
 * صفحة محرر القوالب الموحد
 * تستخدم المكونات الموحدة الجديدة لتحرير القوالب
 * مايو 2025
 */

import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { AdvancedTemplateEditor } from "@/components/template-editor";

// نوع البيانات المستخدمة في الصفحة
interface Template {
  id?: number;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
    nameAr?: string;
  };
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplateField {
  id: number;
  name: string;
  label?: string;
  labelAr?: string;
  type: 'text' | 'image';
  position: { x: number; y: number };
  style?: any;
  required?: boolean;
  templateId?: number;
  defaultValue?: string;
  placeholder?: string;
  placeholderAr?: string;
  zIndex?: number;
  visible?: boolean;
  rotation?: number;
}

interface Category {
  id: number;
  name: string;
  nameAr?: string;
  slug?: string;
}

const TemplateEditorUnified: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // استخدام React Query لجلب بيانات القالب
  const { 
    data: template, 
    isLoading: isTemplateLoading,
    error: templateError
  } = useQuery<Template>({
    queryKey: [id ? `/api/templates/${id}` : null],
    queryFn: getQueryFn<Template>({ on401: 'redirect-to-login' }),
    enabled: !!id
  });
  
  // استخدام React Query لجلب حقول القالب
  const { 
    data: fields = [], 
    isLoading: isFieldsLoading 
  } = useQuery<TemplateField[]>({
    queryKey: [id ? `/api/templates/${id}/fields` : null],
    queryFn: getQueryFn<TemplateField[]>({ on401: 'redirect-to-login' }),
    enabled: !!id
  });
  
  // استخدام React Query لجلب التصنيفات
  const { 
    data: categories = [] 
  } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: getQueryFn<Category[]>({ on401: 'returnNull' })
  });
  
  // استخدام React Query لحفظ القالب
  const saveMutation = useMutation({
    mutationFn: async ({ 
      templateData, 
      fieldsData 
    }: { 
      templateData: Template; 
      fieldsData: TemplateField[] 
    }) => {
      // حفظ القالب نفسه أولاً
      const saveTemplateUrl = templateData.id 
        ? `/api/templates/${templateData.id}` 
        : '/api/templates';
      
      const savedTemplate = await apiRequest<Template>(
        templateData.id ? 'PATCH' : 'POST',
        saveTemplateUrl,
        templateData
      );
      
      // ثم حفظ الحقول
      if (savedTemplate && savedTemplate.id) {
        const templateId = savedTemplate.id;
        
        // إضافة معرف القالب إلى الحقول في حالة القالب الجديد
        const fieldsWithTemplateId = fieldsData.map(field => ({
          ...field,
          templateId: templateId
        }));
        
        // حفظ جميع الحقول مرة واحدة
        await apiRequest(
          'PUT',
          `/api/templates/${templateId}/fields`,
          fieldsWithTemplateId
        );
      }
      
      return savedTemplate;
    },
    onSuccess: (savedTemplate) => {
      // تحديث التخزين المؤقت (cache)
      if (savedTemplate && savedTemplate.id) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/templates/${savedTemplate.id}`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/templates/${savedTemplate.id}/fields`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/templates'] 
        });
      }
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: `تم حفظ القالب ${savedTemplate?.title || ''} بنجاح`,
      });
      
      // إعادة التوجيه إلى صفحة القوالب في حالة إنشاء قالب جديد
      if (!id && savedTemplate?.id) {
        navigate(`/template-editor-unified/${savedTemplate.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الحفظ',
        description: error?.message || 'حدث خطأ أثناء حفظ القالب',
        variant: 'destructive',
      });
    }
  });
  
  // حفظ القالب وحقوله
  const handleSave = (templateData: Template, fieldsData: TemplateField[]) => {
    saveMutation.mutate({ templateData, fieldsData });
  };
  
  // تصدير صورة القالب
  const handleExportImage = (imageDataUrl: string) => {
    // إنشاء رابط تنزيل
    const link = document.createElement('a');
    link.download = `template-${template?.id || 'new'}.png`;
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'تم تصدير الصورة',
      description: `تم تصدير صورة القالب بنجاح`,
    });
  };
  
  // أثناء التحميل
  if (isTemplateLoading || isFieldsLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
          <p className="text-lg">جاري تحميل بيانات القالب...</p>
        </div>
      </div>
    );
  }
  
  // في حالة وجود خطأ
  if (templateError && id) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-500 mb-2">حدث خطأ أثناء تحميل بيانات القالب</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/templates')}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة إلى القوالب
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      {/* صفحة تحرير القالب */}
      <div className="mb-4 flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/templates')}
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة إلى القوالب
        </Button>
        
        <h1 className="text-2xl font-bold text-center flex-1">
          {id ? 'تحرير القالب' : 'إنشاء قالب جديد'}
        </h1>
        
        <Button 
          onClick={() => {
            const templateFields = document.querySelector('form');
            if (templateFields) {
              templateFields.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
          }}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 ml-2" />
          )}
          حفظ القالب
        </Button>
      </div>
      
      {/* محرر القالب */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <AdvancedTemplateEditor
          template={template}
          initialFields={fields}
          onSave={handleSave}
          onImageExport={handleExportImage}
          categories={categories}
        />
      </div>
    </div>
  );
};

export default TemplateEditorUnified;