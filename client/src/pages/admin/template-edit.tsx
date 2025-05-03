import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type Template = {
  id?: number;
  title: string;
  titleAr?: string;
  slug: string;
  categoryId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  displayOrder: number;
  fields: string[];
  defaultValues?: any;
  settings?: any;
  active: boolean;
  templateFields?: any[];
};

type Category = {
  id: number;
  name: string;
  nameAr?: string;
  slug: string;
};

export default function TemplateEditPage() {
  const { templateId } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!templateId;
  
  const [formData, setFormData] = useState<Template>({
    title: '',
    titleAr: '',
    slug: '',
    categoryId: 0,
    imageUrl: '',
    thumbnailUrl: '',
    displayOrder: 0,
    fields: [],
    defaultValues: {},
    settings: {
      fontFamily: 'Tajawal',
      fontSize: 16,
      textColor: '#000000',
      backgroundColor: '#ffffff',
      orientation: 'portrait',
      quality: 'high',
      compressionLevel: 0,
      format: 'png',
      resolution: 300,
      aspectRatio: '3:4',
      paperSize: 'custom', // أحجام الورق: A4, A3, A5, letter, custom
      paperWidth: 0,
      paperHeight: 0,
      paperUnit: 'mm' // mm, cm, inch
    },
    active: true
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "redirect-to-login" })
  });
  
  // Ensure categories is always an array 
  const categories = categoriesData || [];

  // Fetch template details if editing
  const { data: templateData, isLoading: isTemplateLoading } = useQuery<Template>({
    queryKey: [`/api/templates/${templateId}`],
    queryFn: getQueryFn({ on401: "redirect-to-login" }),
    enabled: isEditing
  });
  
  // Update form data when template is loaded
  useEffect(() => {
    if (templateData) {
      try {
        // Include templateFields data if it exists
        const templateFields = templateData.templateFields || [];
        
        setFormData({
          id: templateData.id,
          title: templateData.title || '',
          titleAr: templateData.titleAr || '',
          slug: templateData.slug || '',
          categoryId: typeof templateData.categoryId === 'number' ? templateData.categoryId : 0,
          imageUrl: templateData.imageUrl || '',
          thumbnailUrl: templateData.thumbnailUrl || '',
          displayOrder: typeof templateData.displayOrder === 'number' ? templateData.displayOrder : 0,
          fields: Array.isArray(templateData.fields) ? templateData.fields : [],
          defaultValues: templateData.defaultValues || {},
          settings: templateData.settings || {
            fontFamily: 'Tajawal',
            fontSize: 16,
            textColor: '#000000',
            backgroundColor: '#ffffff',
            orientation: 'portrait',
            quality: 'high',
            compressionLevel: 0,
            format: 'png',
            resolution: 300,
            aspectRatio: '3:4'
          },
          active: Boolean(templateData.active),
          templateFields: templateFields
        });
        
        if (templateData.imageUrl) {
          setPreviewUrl(templateData.imageUrl);
        }
      } catch (err) {
        console.error("خطأ في معالجة بيانات القالب:", err);
        toast({
          title: "خطأ في معالجة بيانات القالب",
          description: "حدث خطأ أثناء معالجة بيانات القالب",
          variant: "destructive",
        });
      }
    }
  }, [templateData, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSwitchChange = (checked: boolean, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId: parseInt(value)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      toast({
        title: "اختر تصنيف",
        description: "يجب اختيار تصنيف للقالب",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.title) {
      toast({
        title: "أدخل عنوان",
        description: "يجب إدخال عنوان للقالب",
        variant: "destructive",
      });
      return;
    }
    
    if (!imageFile && !formData.imageUrl) {
      toast({
        title: "أضف صورة",
        description: "يجب إضافة صورة للقالب",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add template data as JSON - حذف الحقول الآلية
      formDataToSend.append('templateData', JSON.stringify({
        title: formData.title,
        titleAr: formData.titleAr,
        // سيتم إنشاء slug تلقائيًا في الخادم - تم إزالة الحقل
        categoryId: parseInt(formData.categoryId.toString()), // تأكد من تحويله إلى رقم
        // سيتم تعيين displayOrder تلقائيًا في الخادم - تم إزالة الحقل
        active: Boolean(formData.active), // تأكد من تحويله إلى قيمة منطقية
        settings: formData.settings || {},
        fields: Array.isArray(formData.fields) ? formData.fields : [],
        defaultValues: formData.defaultValues || {},
        templateFields: formData.templateFields || [],
        // إضافة imageUrl لتحديث القالب إذا لم يتم تحديث الصورة
        imageUrl: formData.imageUrl || ''
      }));
      
      // Add image file if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      // Determine URL and method
      const url = isEditing 
        ? `/api/admin/templates/${templateId}` 
        : '/api/admin/templates';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Send request
      const response = await fetch(url, {
        method,
        body: formDataToSend,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const result = await response.json();
      
      // Success
      toast({
        title: isEditing ? "تم تحديث القالب بنجاح" : "تم إضافة القالب بنجاح",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      
      // Redirect
      if (!isEditing) {
        // Go to template fields page if it's a new template
        setLocation(`/admin/templates/${result.id}/fields`);
      } else {
        // Go back to templates list
        setLocation('/admin/templates');
      }
    } catch (error) {
      console.error("Error submitting template:", error);
      toast({
        title: isEditing ? "فشل تحديث القالب" : "فشل إضافة القالب",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الطلب",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if ((isEditing && isTemplateLoading) || isCategoriesLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'تعديل القالب' : 'إضافة قالب جديد'}
        </h1>
        
        <Button variant="outline" onClick={() => setLocation('/admin/templates')}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة للقوالب
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>بيانات القالب</CardTitle>
                <CardDescription>المعلومات الأساسية للقالب</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">عنوان القالب</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="أدخل عنوان القالب"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="titleAr">عنوان القالب (بالعربية)</Label>
                  <Input
                    id="titleAr"
                    name="titleAr"
                    value={formData.titleAr || ''}
                    onChange={handleInputChange}
                    placeholder="أدخل عنوان القالب بالعربية"
                  />
                </div>
                
                {/* تم إخفاء حقل المعرف حيث سيتم إنشاؤه تلقائيًا من العنوان */}
                
                <div className="grid gap-2">
                  <Label htmlFor="category">التصنيف</Label>
                  {categories?.length > 0 ? (
                    <Select 
                      value={formData.categoryId.toString()} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="اختر تصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-yellow-600">
                      لا توجد تصنيفات. قم بإضافة تصنيفات أولًا.
                    </p>
                  )}
                </div>
                
                {/* تم إخفاء حقل ترتيب العرض حيث سيتم تعيينه تلقائيًا */}
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'active')}
                  />
                  <Label htmlFor="active">نشط</Label>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>الصورة والإعدادات</CardTitle>
                <CardDescription>صورة القالب والإعدادات المرئية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="image">صورة القالب</Label>
                  <div className="grid gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div 
                      className="border-2 border-dashed rounded-md p-6 flex flex-col items-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => document.getElementById('image')?.click()}
                    >
                      {previewUrl ? (
                        <div className="relative w-full aspect-[3/4] max-w-sm mx-auto">
                          <img 
                            src={previewUrl} 
                            alt="معاينة" 
                            className="rounded-md object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">انقر لاختيار صورة</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <Tabs defaultValue="text">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="text">إعدادات النص</TabsTrigger>
                      <TabsTrigger value="image">إعدادات الصورة</TabsTrigger>
                      <TabsTrigger value="paper">حجم الورق</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fontSize">حجم الخط</Label>
                        <Input
                          id="fontSize"
                          name="fontSize"
                          type="number"
                          value={formData.settings?.fontSize || 16}
                          onChange={handleSettingsChange}
                          min="8"
                          max="72"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="fontFamily">نوع الخط</Label>
                        <Select 
                          value={formData.settings?.fontFamily || 'Tajawal'} 
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                fontFamily: value
                              }
                            }));
                          }}
                        >
                          <SelectTrigger id="fontFamily">
                            <SelectValue placeholder="اختر نوع الخط" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tajawal">طجوال</SelectItem>
                            <SelectItem value="Cairo">كايرو</SelectItem>
                            <SelectItem value="Almarai">المراعي</SelectItem>
                            <SelectItem value="Amiri">أميري</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="textColor">لون الخط</Label>
                        <div className="flex gap-2">
                          <Input
                            id="textColor"
                            name="textColor"
                            type="color"
                            value={formData.settings?.textColor || '#000000'}
                            onChange={handleSettingsChange}
                            className="w-12 h-9 p-1"
                          />
                          <Input 
                            value={formData.settings?.textColor || '#000000'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                settings: {
                                  ...prev.settings,
                                  textColor: e.target.value
                                }
                              }));
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="backgroundColor">لون الخلفية</Label>
                        <div className="flex gap-2">
                          <Input
                            id="backgroundColor"
                            name="backgroundColor"
                            type="color"
                            value={formData.settings?.backgroundColor || '#ffffff'}
                            onChange={handleSettingsChange}
                            className="w-12 h-9 p-1"
                          />
                          <Input 
                            value={formData.settings?.backgroundColor || '#ffffff'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                settings: {
                                  ...prev.settings,
                                  backgroundColor: e.target.value
                                }
                              }));
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="image" className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="orientation">اتجاه الصورة</Label>
                        <Select 
                          value={formData.settings?.orientation || 'portrait'} 
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                orientation: value
                              }
                            }));
                          }}
                        >
                          <SelectTrigger id="orientation">
                            <SelectValue placeholder="اختر اتجاه الصورة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">طولي (Portrait)</SelectItem>
                            <SelectItem value="landscape">عرضي (Landscape)</SelectItem>
                            <SelectItem value="square">مربع (Square)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="aspectRatio">نسبة العرض إلى الارتفاع</Label>
                        <Select 
                          value={formData.settings?.aspectRatio || '3:4'} 
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                aspectRatio: value
                              }
                            }));
                          }}
                        >
                          <SelectTrigger id="aspectRatio">
                            <SelectValue placeholder="اختر نسبة العرض إلى الارتفاع" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3:4">3:4 (بطاقة قياسية)</SelectItem>
                            <SelectItem value="1:1">1:1 (مربع - انستجرام)</SelectItem>
                            <SelectItem value="9:16">9:16 (قصص انستجرام)</SelectItem>
                            <SelectItem value="4:3">4:3 (شاشة عريضة)</SelectItem>
                            <SelectItem value="16:9">16:9 (فيديو HD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="quality">جودة الصورة</Label>
                        <Select 
                          value={formData.settings?.quality || 'high'} 
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                quality: value
                              }
                            }));
                          }}
                        >
                          <SelectTrigger id="quality">
                            <SelectValue placeholder="اختر جودة الصورة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">عالية</SelectItem>
                            <SelectItem value="medium">متوسطة</SelectItem>
                            <SelectItem value="low">منخفضة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="format">صيغة الصورة</Label>
                        <Select 
                          value={formData.settings?.format || 'png'} 
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                format: value
                              }
                            }));
                          }}
                        >
                          <SelectTrigger id="format">
                            <SelectValue placeholder="اختر صيغة الصورة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="png">PNG (جودة عالية للشفافية)</SelectItem>
                            <SelectItem value="jpeg">JPEG (حجم أصغر)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="resolution">دقة الصورة (DPI)</Label>
                        <Select 
                          value={formData.settings?.resolution?.toString() || '300'} 
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                resolution: parseInt(value)
                              }
                            }));
                          }}
                        >
                          <SelectTrigger id="resolution">
                            <SelectValue placeholder="اختر دقة الصورة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="72">72 DPI (للشاشة)</SelectItem>
                            <SelectItem value="150">150 DPI (للويب)</SelectItem>
                            <SelectItem value="300">300 DPI (للطباعة)</SelectItem>
                            <SelectItem value="600">600 DPI (للطباعة عالية الجودة)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="compressionLevel">مستوى الضغط</Label>
                        <Select 
                          value={formData.settings?.compressionLevel?.toString() || '0'} 
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                compressionLevel: parseInt(value)
                              }
                            }));
                          }}
                        >
                          <SelectTrigger id="compressionLevel">
                            <SelectValue placeholder="اختر مستوى الضغط" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">بدون ضغط (جودة أعلى)</SelectItem>
                            <SelectItem value="3">ضغط منخفض</SelectItem>
                            <SelectItem value="6">ضغط متوسط</SelectItem>
                            <SelectItem value="9">ضغط عالي (حجم أصغر)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="paper" className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="paperSize">حجم الورق</Label>
                        <Select 
                          value={formData.settings?.paperSize || 'custom'} 
                          onValueChange={(value) => {
                            // تعيين الأبعاد حسب حجم الورق المختار
                            let paperWidth = 0;
                            let paperHeight = 0;
                            
                            switch(value) {
                              case 'A4':
                                paperWidth = 210;
                                paperHeight = 297;
                                break;
                              case 'A3':
                                paperWidth = 297;
                                paperHeight = 420;
                                break;
                              case 'A5':
                                paperWidth = 148;
                                paperHeight = 210;
                                break;
                              case 'letter':
                                paperWidth = 216;
                                paperHeight = 279;
                                break;
                              case 'legal':
                                paperWidth = 216;
                                paperHeight = 356;
                                break;
                              default:
                                // أبقي الأبعاد المخصصة كما هي
                                paperWidth = formData.settings?.paperWidth || 0;
                                paperHeight = formData.settings?.paperHeight || 0;
                            }
                            
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                paperSize: value,
                                paperWidth: paperWidth,
                                paperHeight: paperHeight
                              }
                            }));
                          }}
                        >
                          <SelectTrigger id="paperSize">
                            <SelectValue placeholder="اختر حجم الورق" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A4">A4 (210×297 مم)</SelectItem>
                            <SelectItem value="A3">A3 (297×420 مم)</SelectItem>
                            <SelectItem value="A5">A5 (148×210 مم)</SelectItem>
                            <SelectItem value="letter">Letter (8.5×11 إنش)</SelectItem>
                            <SelectItem value="legal">Legal (8.5×14 إنش)</SelectItem>
                            <SelectItem value="custom">مخصص</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {formData.settings?.paperSize === 'custom' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="paperWidth">العرض</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="paperWidth"
                                name="paperWidth"
                                type="number"
                                value={formData.settings?.paperWidth || 0}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    settings: {
                                      ...prev.settings,
                                      paperWidth: parseFloat(e.target.value)
                                    }
                                  }));
                                }}
                                min="0"
                                step="0.1"
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="paperHeight">الارتفاع</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="paperHeight"
                                name="paperHeight"
                                type="number"
                                value={formData.settings?.paperHeight || 0}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    settings: {
                                      ...prev.settings,
                                      paperHeight: parseFloat(e.target.value)
                                    }
                                  }));
                                }}
                                min="0"
                                step="0.1"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid gap-2">
                        <Label htmlFor="paperUnit">وحدة القياس</Label>
                        <Select 
                          value={formData.settings?.paperUnit || 'mm'} 
                          onValueChange={(value) => {
                            let paperWidth = formData.settings?.paperWidth || 0;
                            let paperHeight = formData.settings?.paperHeight || 0;
                            
                            // تحويل القيم حسب وحدة القياس الجديدة
                            if (formData.settings?.paperUnit === 'mm' && value === 'cm') {
                              paperWidth = paperWidth / 10;
                              paperHeight = paperHeight / 10;
                            } else if (formData.settings?.paperUnit === 'mm' && value === 'inch') {
                              paperWidth = paperWidth / 25.4;
                              paperHeight = paperHeight / 25.4;
                            } else if (formData.settings?.paperUnit === 'cm' && value === 'mm') {
                              paperWidth = paperWidth * 10;
                              paperHeight = paperHeight * 10;
                            } else if (formData.settings?.paperUnit === 'cm' && value === 'inch') {
                              paperWidth = paperWidth / 2.54;
                              paperHeight = paperHeight / 2.54;
                            } else if (formData.settings?.paperUnit === 'inch' && value === 'mm') {
                              paperWidth = paperWidth * 25.4;
                              paperHeight = paperHeight * 25.4;
                            } else if (formData.settings?.paperUnit === 'inch' && value === 'cm') {
                              paperWidth = paperWidth * 2.54;
                              paperHeight = paperHeight * 2.54;
                            }
                            
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                paperUnit: value,
                                paperWidth: parseFloat(paperWidth.toFixed(2)),
                                paperHeight: parseFloat(paperHeight.toFixed(2))
                              }
                            }));
                          }}
                        >
                          <SelectTrigger id="paperUnit">
                            <SelectValue placeholder="اختر وحدة القياس" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mm">ملليمتر (mm)</SelectItem>
                            <SelectItem value="cm">سنتيمتر (cm)</SelectItem>
                            <SelectItem value="inch">إنش (inch)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-2">معلومات مفيدة:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                          <li>A4: الحجم الأكثر شيوعًا للمستندات والشهادات (210×297 مم)</li>
                          <li>A3: مناسب للشهادات الكبيرة والملصقات (297×420 مم)</li>
                          <li>Letter: شائع في أمريكا الشمالية (8.5×11 إنش)</li>
                          <li>يمكنك ضبط الاتجاه (طولي/عرضي) في تبويب إعدادات الصورة</li>
                        </ul>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <div className="flex gap-2">
            <Button 
              type="submit" 
              size="lg" 
              className="min-w-32"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              <Save className="ml-2 h-4 w-4" />
              {isEditing ? 'تحديث القالب' : 'إضافة القالب'}
            </Button>
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation(`/template-editor-with-layers-new/${templateId}`)}
              >
                <ImageIcon className="ml-2 h-4 w-4" />
                محرر الطبقات المتقدم 2.0
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation(`/template-editor-with-layers/${templateId}`)}
              >
                <ImageIcon className="ml-2 h-4 w-4" />
                محرر الطبقات المتقدم 1.0
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation(`/template-editor-unified/${templateId}`)}
              >
                <ImageIcon className="ml-2 h-4 w-4" />
                محرر القوالب الموحد
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation(`/template-editor/${templateId}`)}
              >
                <ImageIcon className="ml-2 h-4 w-4" />
                محرر القوالب التقليدي
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}