import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/admin/layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Globe, Tag, Link as LinkIcon, Check, X } from 'lucide-react';

// نموذج بيانات SEO
interface SeoFormData {
  title: string;
  description: string | null;
  keywords: string[];
  ogImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  structuredData: any;
}

// الصفحة الرئيسية لإعدادات SEO
export default function AdminSeoSettings() {
  const { toast } = useToast();
  const [newKeyword, setNewKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('global');

  // استعلام لجلب إعدادات SEO العامة
  const { 
    data: globalSeoData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/seo/global'],
    queryFn: async () => {
      const data = await apiRequest('GET', '/api/seo/global');
      return data;
    }
  });

  // تحديث بيانات SEO
  const updateSeoMutation = useMutation({
    mutationFn: async (data: SeoFormData) => {
      const response = await apiRequest('POST', '/api/seo/global', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث إعدادات SEO بنجاح",
        description: "تم حفظ إعدادات تحسين محركات البحث بنجاح",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/seo/global'] });
    },
    onError: (error) => {
      console.error('خطأ في تحديث إعدادات SEO:', error);
      toast({
        title: "خطأ في تحديث الإعدادات",
        description: "حدث خطأ أثناء محاولة حفظ إعدادات SEO",
        variant: "destructive"
      });
    }
  });

  // إضافة كلمة مفتاحية جديدة
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const keywords = [...(formData.keywords || [])];
    if (!keywords.includes(newKeyword.trim())) {
      keywords.push(newKeyword.trim());
      setFormData({ ...formData, keywords });
    }
    setNewKeyword('');
  };

  // إزالة كلمة مفتاحية
  const handleRemoveKeyword = (keyword: string) => {
    const keywords = formData.keywords.filter(k => k !== keyword);
    setFormData({ ...formData, keywords });
  };

  // إعداد بيانات النموذج
  const [formData, setFormData] = useState<SeoFormData>({
    title: '',
    description: '',
    keywords: [],
    ogImage: '',
    canonicalUrl: '',
    noIndex: false,
    structuredData: {}
  });

  // تحديث النموذج عند استلام البيانات
  React.useEffect(() => {
    if (globalSeoData) {
      setFormData({
        title: globalSeoData.title || '',
        description: globalSeoData.description || '',
        keywords: globalSeoData.keywords || [],
        ogImage: globalSeoData.ogImage || '',
        canonicalUrl: globalSeoData.canonicalUrl || '',
        noIndex: globalSeoData.noIndex || false,
        structuredData: globalSeoData.structuredData || {}
      });
    }
  }, [globalSeoData]);

  // معالجة تقديم النموذج
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSeoMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h3 className="text-xl font-bold mb-2">حدث خطأ</h3>
          <p className="text-muted-foreground">لم نتمكن من تحميل إعدادات SEO</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">إعدادات تحسين محركات البحث (SEO)</h1>
            <p className="text-muted-foreground mt-1">
              تخصيص بيانات الوصف والكلمات المفتاحية لتحسين ظهور الموقع في نتائج البحث
            </p>
          </div>
        </div>

        <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="global">الإعدادات العامة</TabsTrigger>
            <TabsTrigger value="help">إرشادات SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            <Card>
              <CardHeader>
                <CardTitle>الإعدادات العامة لتحسين محركات البحث</CardTitle>
                <CardDescription>
                  هذه الإعدادات تؤثر على كافة صفحات الموقع التي لا تمتلك إعدادات SEO خاصة بها
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان الموقع</Label>
                    <Input
                      id="title"
                      placeholder="عنوان الموقع الرئيسي"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      يظهر في نتائج البحث وشريط المتصفح (يفضل أن يكون أقل من 60 حرف)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">وصف الموقع</Label>
                    <Textarea
                      id="description"
                      placeholder="وصف مختصر للموقع"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      وصف يظهر في نتائج البحث تحت عنوان الموقع (يفضل أن يكون بين 120-160 حرف)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">الكلمات المفتاحية</Label>
                    <div className="flex gap-2">
                      <Input
                        id="keywords"
                        placeholder="أضف كلمة مفتاحية"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddKeyword}>إضافة</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="ml-1 rounded-full hover:bg-primary/20 p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {formData.keywords.length === 0 && (
                        <p className="text-sm text-muted-foreground">لا توجد كلمات مفتاحية</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogImage">رابط صورة المشاركة (Open Graph)</Label>
                    <Input
                      id="ogImage"
                      placeholder="https://example.com/image.jpg"
                      value={formData.ogImage || ''}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value || null })}
                    />
                    <p className="text-xs text-muted-foreground">
                      صورة تظهر عند مشاركة الموقع على وسائل التواصل الاجتماعي
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="canonicalUrl">عنوان URL الأساسي (Canonical URL)</Label>
                    <Input
                      id="canonicalUrl"
                      placeholder="https://example.com"
                      value={formData.canonicalUrl || ''}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value || null })}
                    />
                    <p className="text-xs text-muted-foreground">
                      المسار الأساسي للموقع لتجنب مشكلة المحتوى المكرر
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="noIndex"
                      checked={formData.noIndex}
                      onCheckedChange={(checked) => setFormData({ ...formData, noIndex: checked })}
                    />
                    <Label htmlFor="noIndex">منع الفهرسة (noindex)</Label>
                    <p className="text-xs text-muted-foreground mr-2">
                      تفعيل هذا الخيار سيمنع محركات البحث من فهرسة الموقع
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                  <Button variant="outline" type="button" onClick={() => setFormData({
                    title: globalSeoData?.title || '',
                    description: globalSeoData?.description || '',
                    keywords: globalSeoData?.keywords || [],
                    ogImage: globalSeoData?.ogImage || '',
                    canonicalUrl: globalSeoData?.canonicalUrl || '',
                    noIndex: globalSeoData?.noIndex || false,
                    structuredData: globalSeoData?.structuredData || {}
                  })}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={updateSeoMutation.isPending}>
                    {updateSeoMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        حفظ الإعدادات
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>إرشادات تحسين محركات البحث (SEO)</CardTitle>
                <CardDescription>
                  نصائح لتحسين ظهور موقعك في نتائج البحث
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium flex items-center">
                      <Search className="mr-2 h-5 w-5" />
                      العنوان (Title)
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      • يجب أن يكون العنوان وصفيًا ومختصرًا (أقل من 60 حرف).
                      <br />
                      • ابدأ بالكلمات المفتاحية الأكثر أهمية.
                      <br />
                      • اجعل كل عنوان فريدًا لكل صفحة.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium flex items-center">
                      <Globe className="mr-2 h-5 w-5" />
                      الوصف (Description)
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      • يجب أن يكون الوصف ملخصًا دقيقًا لمحتوى الصفحة (120-160 حرف).
                      <br />
                      • أضف دعوة للعمل لتشجيع النقر.
                      <br />
                      • استخدم الكلمات المفتاحية بطريقة طبيعية.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium flex items-center">
                      <Tag className="mr-2 h-5 w-5" />
                      الكلمات المفتاحية (Keywords)
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      • اختر الكلمات المفتاحية المرتبطة بمحتوى موقعك.
                      <br />
                      • لا تكرر الكلمات المفتاحية بشكل مفرط.
                      <br />
                      • استخدم مزيجًا من الكلمات المفتاحية العامة والمحددة.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium flex items-center">
                      <LinkIcon className="mr-2 h-5 w-5" />
                      الروابط والهيكل
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      • استخدم عناوين URL قصيرة ووصفية.
                      <br />
                      • تأكد من أن جميع الروابط الهامة قابلة للوصول.
                      <br />
                      • استخدم Canonical URL لتجنب مشكلة المحتوى المكرر.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}