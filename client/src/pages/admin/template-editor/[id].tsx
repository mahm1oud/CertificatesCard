import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { TemplateEditor } from '@/components/template-editor';
import { withAuth } from '@/lib/auth';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

function TemplateEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [template, setTemplate] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [layout, setLayout] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch template and field data
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get template details
        const templateResponse = await axios.get(`/api/admin/templates/${id}`);
        setTemplate(templateResponse.data);
        
        // Get template fields
        const fieldsResponse = await axios.get(`/api/admin/template-fields?templateId=${id}`);
        setFields(fieldsResponse.data);
        
        // Get template layout if it exists
        try {
          const layoutResponse = await axios.get(`/api/admin/templates/${id}/layout`);
          if (layoutResponse.data && Array.isArray(layoutResponse.data.layout)) {
            setLayout(layoutResponse.data.layout);
          }
        } catch (error) {
          console.log('No existing layout found, starting with empty layout');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching template data:', error);
        setError('حدث خطأ أثناء تحميل بيانات القالب');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Handle save layout
  const handleSaveLayout = async (layoutData: any[]) => {
    try {
      await axios.put(`/api/admin/templates/${id}/layout`, {
        layout: layoutData
      });
      
      toast.success('تم حفظ تخطيط القالب بنجاح');
    } catch (error) {
      console.error('Error saving template layout:', error);
      toast.error('حدث خطأ أثناء حفظ تخطيط القالب');
    }
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="container py-6">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout>
        <div className="container py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-red-600 mb-2">خطأ</h3>
                <p className="text-slate-600">{error}</p>
                <Button 
                  className="mt-4" 
                  variant="outline" 
                  onClick={() => router.push('/admin/templates')}
                >
                  العودة إلى القوالب
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  if (!template) {
    return (
      <AdminLayout>
        <div className="container py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-slate-800 mb-2">لم يتم العثور على القالب</h3>
                <p className="text-slate-600">القالب المطلوب غير موجود أو تم حذفه</p>
                <Button 
                  className="mt-4" 
                  variant="outline" 
                  onClick={() => router.push('/admin/templates')}
                >
                  العودة إلى القوالب
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            <span>محرر تخطيط القالب: </span>
            <span className="text-blue-600">{template.title}</span>
          </h1>
          
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Link href="/admin/templates" passHref>
              <Button variant="outline" size="sm">
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة إلى القوالب
              </Button>
            </Link>
          </div>
        </div>
        
        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4 bg-slate-50 border-b">
            <CardTitle className="text-lg">محرر التخطيط</CardTitle>
          </CardHeader>
          
          <div className="h-[calc(100vh-250px)]">
            <TemplateEditor
              templateId={Number(id)}
              templateImage={template.imageUrl}
              fields={fields}
              initialLayout={layout}
              onSave={handleSaveLayout}
            />
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(TemplateEditorPage, { role: 'admin' });