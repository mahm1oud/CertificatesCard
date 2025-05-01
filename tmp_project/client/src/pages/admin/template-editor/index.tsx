import { useRoute } from 'wouter';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { SimpleEditor } from '@/components/template-editor/SimpleEditor';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { withAuth } from '@/lib/protected-route';

function TemplateEditorPage() {
  const [matched, params] = useRoute('/admin/template-editor/:id');
  const id = params?.id;
  const navigate = (path: string) => window.location.href = path;
  const { toast } = useToast();
  
  const [layout, setLayout] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [template, setTemplate] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);
  const [isFieldsLoading, setIsFieldsLoading] = useState(true);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);
  const [templateError, setTemplateError] = useState<Error | null>(null);
  const [fieldsError, setFieldsError] = useState<Error | null>(null);
  
  // Fetch template data
  useEffect(() => {
    if (!id) return;
    
    const fetchTemplate = async () => {
      setIsTemplateLoading(true);
      try {
        const response = await axios.get(`/api/admin/templates/${id}`);
        setTemplate(response.data);
      } catch (error) {
        console.error('Error fetching template:', error);
        setTemplateError(error as Error);
      } finally {
        setIsTemplateLoading(false);
      }
    };
    
    fetchTemplate();
  }, [id]);
  
  // Fetch template fields
  useEffect(() => {
    if (!id) return;
    
    const fetchFields = async () => {
      setIsFieldsLoading(true);
      try {
        const response = await axios.get(`/api/admin/template-fields?templateId=${id}`);
        
        if (Array.isArray(response.data)) {
          setFields(response.data);
        } else {
          console.warn("Template fields is not an array, initializing with empty array");
          setFields([]);
        }
      } catch (error) {
        console.error('Error fetching template fields:', error);
        setFieldsError(error as Error);
      } finally {
        setIsFieldsLoading(false);
      }
    };
    
    fetchFields();
  }, [id]);
  
  // Fetch template layout
  useEffect(() => {
    if (!id) return;
    
    const fetchLayout = async () => {
      setIsLayoutLoading(true);
      try {
        const response = await axios.get(`/api/admin/templates/${id}/layout`);
        
        if (response.data && Array.isArray(response.data.layout)) {
          setLayout(response.data.layout);
        } else if (response.data && Array.isArray(response.data)) {
          setLayout(response.data);
        }
      } catch (error) {
        console.log('No existing layout found, starting with empty layout');
      } finally {
        setIsLayoutLoading(false);
      }
    };
    
    fetchLayout();
  }, [id]);
  
  // Handle errors
  useEffect(() => {
    if (templateError || fieldsError) {
      setError('حدث خطأ أثناء تحميل بيانات القالب');
    }
  }, [templateError, fieldsError]);
  
  // Handle save layout
  const handleSaveLayout = async (layoutData: any[]) => {
    try {
      await axios.put(`/api/admin/templates/${id}/layout`, {
        layout: layoutData
      });
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ تخطيط القالب بنجاح",
      });
    } catch (error) {
      console.error('Error saving template layout:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ تخطيط القالب",
        variant: "destructive"
      });
    }
  };
  
  const isLoading = isTemplateLoading || isFieldsLoading || isLayoutLoading;
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-red-600 mb-2">خطأ</h3>
              <p className="text-slate-600">{error}</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => navigate('/admin/templates')}
              >
                العودة إلى القوالب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-slate-800 mb-2">لم يتم العثور على القالب</h3>
              <p className="text-slate-600">القالب المطلوب غير موجود أو تم حذفه</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => navigate('/admin/templates')}
              >
                العودة إلى القوالب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          <span>محرر تخطيط القالب: </span>
          <span className="text-blue-600">{template.title}</span>
        </h1>
        
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/templates')}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة إلى القوالب
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50 border-b">
          <CardTitle className="text-lg">محرر التخطيط</CardTitle>
        </CardHeader>
        
        <div className="h-[calc(100vh-250px)]">
          <SimpleEditor
            templateId={Number(id)}
            templateImage={template.imageUrl}
            fields={fields}
            initialLayout={layout}
            onSave={handleSaveLayout}
            onBack={() => navigate('/admin/templates')}
          />
        </div>
      </Card>
    </div>
  );
}

export default withAuth(TemplateEditorPage, { role: 'admin' });