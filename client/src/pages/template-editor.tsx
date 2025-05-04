import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import LayeredTemplateEditor from '@/components/template-editor/LayeredTemplateEditor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function TemplateEditorPage() {
  const [, params] = useRoute<{ id: string }>('/template-editor/:id');
  const templateId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  
  console.log("Template Editor Page - Template ID:", templateId);
  
  // جلب بيانات القالب
  const { data: template, isLoading, isError } = useQuery({
    queryKey: ['/api/templates', templateId],
    queryFn: () => apiRequest(`/api/templates/${templateId}`),
    enabled: !!templateId,
  });
  
  // التعامل مع الرجوع للصفحة السابقة
  const handleBack = () => {
    window.history.back();
  };
  
  // التعامل مع حفظ القالب
  const handleSave = (editorState: any) => {
    console.log('حفظ التعديلات:', editorState);
    
    toast({
      title: "تم الحفظ",
      description: "تم حفظ التعديلات بنجاح",
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">جاري تحميل القالب...</p>
        </div>
      </div>
    );
  }
  
  if (isError || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">خطأ في التحميل</h2>
          <p className="mb-4">لا يمكن تحميل بيانات القالب. يرجى المحاولة مرة أخرى.</p>
          <Button onClick={handleBack}>العودة</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      <LayeredTemplateEditor
        templateId={template.id}
        templateName={template.title}
        templateImageUrl={template.imageUrl}
        initialFormData={template.defaultValues || {}}
        onSave={handleSave}
        onBack={handleBack}
      />
    </div>
  );
}

export default TemplateEditorPage;