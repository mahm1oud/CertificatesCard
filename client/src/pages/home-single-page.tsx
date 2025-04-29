import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Search,
  Award,
  Mail,
  PartyPopper,
  Sparkles,
  Heart,
  GraduationCap,
  Flower,
  ChevronRight,
  FileHeart,
  User,
  Download,
  Share2,
  RefreshCw,
  X,
  Check,
  FileImage,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import CustomForm from "@/components/forms/custom-form";
import WeddingForm from "@/components/forms/wedding-form";
import EngagementForm from "@/components/forms/engagement-form";
import GraduationForm from "@/components/forms/graduation-form";
import EidForm from "@/components/forms/eid-form";
import RamadanForm from "@/components/forms/ramadan-form";
import { getCategoryName, downloadImage } from "@/lib/utils";
import ShareOptions from "@/components/share-options";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HomePageSinglePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTab, setSelectedTab] = useState("cards");
  
  // المتغيرات الجديدة للنمط الموحد
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // المتغيرات الجديدة لخيارات التنزيل والمشاركة المتقدمة
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('high');
  
  // Parse location search params
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const category = params.get("category");
    const tab = params.get("tab");
    
    if (category) {
      setSelectedCategory(category);
    }
    
    if (tab === "certificates") {
      setSelectedTab("certificates");
    }
  }, [location]);
  
  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn(),
  });
  
  // Fetch all templates
  const { data: allTemplates, isLoading: isTemplatesLoading } = useQuery({
    queryKey: [selectedCategory === "all" ? "/api/templates" : `/api/categories/${selectedCategory}/templates`],
    queryFn: getQueryFn(),
  });
  
  // جلب حقول القالب المحدد
  const { data: templateFields, isLoading: isFieldsLoading } = useQuery({
    queryKey: [`/api/template-fields/${selectedTemplate?.id}`],
    queryFn: getQueryFn(),
    enabled: !!selectedTemplate?.id,
  });
  
  // إضافة mutation للتنزيل بجودة محددة
  const downloadCardMutation = useMutation({
    mutationFn: async (qualityOption: string) => {
      return apiRequest(
        'POST',
        '/api/cards/generate', 
        {
          templateId: selectedTemplate.id,
          category: selectedTemplate.category?.slug || "other",
          formData,
          quality: qualityOption,
          isPreview: false
        }
      );
    },
    onSuccess: (data, qualityOption) => {
      if (data && data.imageUrl) {
        const fileName = `بطاقة-${selectedTemplate?.title || 'مخصصة'}-${qualityOption}.png`;
        downloadImage(data.imageUrl, fileName);
        
        toast({
          title: "تم التنزيل بنجاح",
          description: `تم تنزيل البطاقة بجودة ${qualityOption === 'high' ? 'عالية' : 
            qualityOption === 'medium' ? 'متوسطة' : 
            qualityOption === 'low' ? 'منخفضة' : 'ممتازة'}`
        });
      }
    },
    onError: () => {
      handleFallbackDownload();
    }
  });
  
  // Normalize allTemplates structure since API returns different format based on endpoint
  const normalizedTemplates = Array.isArray(allTemplates) 
    ? allTemplates  // For category-specific templates, API returns array directly
    : allTemplates?.templates || []; // For all templates, API returns {templates, total}
  
  // Filter templates by type (card or certificate)
  const cardTemplates = normalizedTemplates.filter((template: any) => 
    !template.certificateType || template.certificateType === 'card'
  );
  
  const certificateTemplates = normalizedTemplates.filter((template: any) => 
    template.certificateType && template.certificateType !== 'card'
  );
  
  // Update URL when category or tab changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCategory !== "all") {
      params.set("category", selectedCategory);
    }
    
    if (selectedTab === "certificates") {
      params.set("tab", "certificates");
    }
    
    const newSearch = params.toString();
    setLocation(newSearch ? `/?${newSearch}` : "/", { replace: true });
  }, [selectedCategory, selectedTab, setLocation]);
  
  // Filter templates based on search query
  const filteredCardTemplates = cardTemplates.filter((template: any) => {
    return !searchQuery || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.titleAr && template.titleAr.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  const filteredCertificateTemplates = certificateTemplates.filter((template: any) => {
    return !searchQuery || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.titleAr && template.titleAr.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  // Get icon for category
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "wedding": return <Heart className="h-5 w-5" />;
      case "graduation": return <GraduationCap className="h-5 w-5" />;
      case "birthday": return <PartyPopper className="h-5 w-5" />;
      case "eid": return <Sparkles className="h-5 w-5" />;
      case "ramadan": return <Flower className="h-5 w-5" />;
      case "invitation": return <Mail className="h-5 w-5" />;
      case "certificates": return <Award className="h-5 w-5" />;
      default: return <FileHeart className="h-5 w-5" />;
    }
  };
  
  const handleFormChange = (data: any) => {
    setFormData(data);
  };
  
  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setFormData({});
    setPreviewImage(null);
    setCardId(null);
  };
  
  const handleCloseTemplate = () => {
    setSelectedTemplate(null);
    setFormData({});
    setPreviewImage(null);
    setCardId(null);
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!selectedTemplate) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار قالب أولًا",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      
      // إظهار إشعار بأننا نقوم بإنشاء البطاقة
      toast({
        title: "جاري الإنشاء...",
        description: "يتم الآن إنشاء صورة المعاينة، يرجى الانتظار",
      });
      
      // تحقق مما إذا كان هناك بيانات صور في النموذج
      const hasImageData = Object.entries(formData).some(([_, value]) => 
        typeof value === 'string' && value.startsWith('data:image/')
      );
      
      // اختيار طريقة الإرسال المناسبة بناءً على وجود بيانات صور
      try {
        let response;
        
        const category = selectedTemplate.category?.slug || "other";
        const templateId = selectedTemplate.id;
        
        if (hasImageData) {
          // استخدم FormData للتعامل مع الصور
          const formDataObj = new FormData();
          formDataObj.append('templateId', templateId);
          formDataObj.append('category', category);
          formDataObj.append('quality', 'preview');
          formDataObj.append('isPreview', 'true');
          
          // تحويل بيانات النموذج إلى FormData
          // معالجة الحقول العادية والصور بشكل مختلف
          for (const [key, value] of Object.entries(formData)) {
            if (typeof value === 'string' && value.startsWith('data:image/')) {
              // تحويل Data URL إلى Blob
              const blob = await fetch(value).then(r => r.blob());
              formDataObj.append(key, blob, `${key}.jpg`);
            } else {
              formDataObj.append(key, String(value));
            }
          }
          
          // إرسال FormData مباشرة إلى الخادم
          response = await fetch('/api/cards/generate', {
            method: 'POST',
            body: formDataObj,
          }).then(res => res.json());
        } else {
          // استخدم JSON للنماذج العادية بدون صور
          response = await apiRequest(
            'POST',
            '/api/cards/generate', 
            {
              templateId,
              category,
              formData,
              quality: 'preview', // إضافة خيار الجودة المنخفضة للمعاينة
              isPreview: true // إضافة علامة تشير إلى أن هذه معاينة وليست حفظ نهائي
            }, 
            {
              timeout: 20000, // خفض وقت الانتظار إلى 20 ثانية
            }
          );
        }
        
        // عند استخدام apiRequest المحسنة، النتيجة هي بالفعل JSON response
        const data = response;
        console.log("Card preview created successfully:", data);
        
        if (!data.cardId) {
          console.error("API response missing cardId:", data);
          toast({
            title: "خطأ",
            description: "تم إنشاء البطاقة ولكن تعذر الحصول على معرف البطاقة",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // تحديث معرف البطاقة وعرض الصورة المولدة
        setCardId(data.cardId);
        setPreviewImage(data.imageUrl);
        
        toast({
          title: "تم بنجاح",
          description: "تم إنشاء المعاينة بنجاح",
        });
        
      } catch (apiError: any) {
        console.error("API Error:", apiError);
        
        // معالجة أنواع الأخطاء المختلفة
        let errorMessage = "حدث خطأ أثناء إنشاء المعاينة، يرجى المحاولة مرة أخرى";
        
        if (apiError.message?.includes("timeout") || apiError.name === "AbortError") {
          errorMessage = "استغرق الطلب وقتا طويلا. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.";
        } else if (apiError.message?.includes("القالب غير موجود")) {
          errorMessage = "القالب المحدد غير متوفر، يرجى اختيار قالب آخر.";
        }
        
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("General Error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = async () => {
    if (!cardId) return;
    
    try {
      setIsLoading(true);
      
      // إنشاء نسخة عالية الجودة للتنزيل
      const response = await apiRequest(
        'POST',
        '/api/cards/generate', 
        {
          templateId: selectedTemplate.id,
          category: selectedTemplate.category?.slug || "other",
          formData,
          quality: 'high', // طلب نسخة عالية الجودة
          isPreview: false // هذه ليست معاينة، بل تنزيل نهائي
        }
      );
      
      // افتح الصورة في نافذة جديدة للتنزيل
      if (response && response.imageUrl) {
        window.open(response.imageUrl, '_blank');
      }
      
      toast({
        title: "تم بنجاح",
        description: "تم تحضير الصورة بدقة عالية، جاري التنزيل..."
      });
      
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحضير التنزيل، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // دالة للتعامل مع حالات الفشل في التنزيل - استخدام النسخة المخزنة مباشرةً
  const handleFallbackDownload = () => {
    if (previewImage) {
      try {
        // استخدام الصورة المولدة مسبقاً للتنزيل
        const fileName = `بطاقة-${selectedTemplate?.title || 'مخصصة'}.png`;
        downloadImage(previewImage, fileName);
        
        toast({
          title: "تم التنزيل",
          description: "تم تنزيل النسخة المتاحة من البطاقة"
        });
      } catch (error) {
        console.error("Fallback download error:", error);
        toast({
          title: "خطأ",
          description: "تعذر تنزيل البطاقة، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "خطأ",
        description: "لا توجد صورة متاحة للتنزيل",
        variant: "destructive",
      });
    }
  };
  
  // دالة تنزيل البطاقة بالجودة المحددة
  const handleDownloadCard = () => {
    if (!cardId || !selectedTemplate?.id) return;
    
    if (showQualitySelector) {
      downloadCardMutation.mutate(selectedQuality);
    } else {
      // استخدام الجودة العالية افتراضيًا عند عدم اختيار محدد الجودة
      downloadCardMutation.mutate('high');
      
      // إظهار منتقي الجودة إذا تم الضغط على زر التنزيل للمرة الأولى
      setShowQualitySelector(true);
    }
  };
  
  const handleShare = () => {
    if (!cardId) return;
    
    try {
      // نافذة المشاركة (مثال للتوضيح)
      const shareUrl = `${window.location.origin}/view/${cardId}`;
      
      // استخدام واجهة المشاركة الأصلية للمتصفح إن أمكن
      if (navigator.share) {
        navigator.share({
          title: selectedTemplate?.title,
          text: 'شارك هذه البطاقة',
          url: shareUrl,
        });
      } else {
        // نسخ الرابط للحافظة
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "تم النسخ",
          description: "تم نسخ رابط المشاركة إلى الحافظة"
        });
      }
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة المشاركة",
        variant: "destructive",
      });
    }
  };
  
  const renderForm = () => {
    if (isFieldsLoading) {
      return <div className="p-6 text-center">جاري تحميل القالب...</div>;
    }
    
    // إذا كان لدينا حقول مخصصة للقالب، نستخدم نموذج مخصص
    if (templateFields && Array.isArray(templateFields) && templateFields.length > 0) {
      return <CustomForm 
        onChange={handleFormChange} 
        template={{
          ...selectedTemplate, 
          templateFields: templateFields
        }} 
      />;
    }
    
    // إذا لم يكن لدينا حقول مخصصة، نستخدم النموذج الافتراضي حسب الفئة
    let CategoryForm;
    const category = selectedTemplate?.category?.slug || "other";
    
    switch (category) {
      case "wedding":
        CategoryForm = WeddingForm;
        break;
      case "engagement":
        CategoryForm = EngagementForm;
        break;
      case "graduation":
        CategoryForm = GraduationForm;
        break;
      case "eid":
        CategoryForm = EidForm;
        break;
      case "ramadan":
        CategoryForm = RamadanForm;
        break;
      case "other":
        // استخدام نموذج الزفاف كافتراضي للفئة "other"
        CategoryForm = WeddingForm;
        break;
      default:
        // إذا لم نجد نموذج مناسب، استخدم واحد افتراضي
        CategoryForm = WeddingForm;
    }
    
    // تأكد من وجود النموذج قبل عرضه
    if (CategoryForm) {
      return <CategoryForm onChange={handleFormChange} template={selectedTemplate} />;
    }
    
    return (
      <div className="p-6 text-center">
        نوع البطاقة غير مدعوم. الرجاء العودة واختيار قالب آخر.
      </div>
    );
  };
  
  const loading = isCategoriesLoading || isTemplatesLoading;
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-10">
        <h1 className="text-4xl font-bold tracking-tight">
          أنشئ بطاقات وشهادات مخصصة بتصاميم احترافية
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          اختر من بين مجموعة واسعة من القوالب وقم بتخصيصها حسب احتياجاتك
        </p>
        
        <div className="relative max-w-md mx-auto">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن قوالب..."
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {user ? (
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link href="/user/dashboard">
                <User className="h-4 w-4 ml-2" />
                لوحة التحكم
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/user/cards">
                عرض بطاقاتي
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link href="/auth">
                تسجيل الدخول
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth?tab=register">
                إنشاء حساب
              </Link>
            </Button>
          </div>
        )}
      </section>
      
      {/* Categories Section */}
      <section>
        <div className="flex overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="whitespace-nowrap"
            >
              جميع القوالب
            </Button>
            
            {!isCategoriesLoading && categories?.map((category: any) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.slug)}
                className="whitespace-nowrap"
              >
                {getCategoryIcon(category.slug)}
                <span className="mr-2">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Templates Section */}
      <section>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="cards">بطاقات</TabsTrigger>
              <TabsTrigger value="certificates">شهادات</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="cards" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCardTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredCardTemplates.map((template: any) => (
                  <Card 
                    key={template.id} 
                    className={`overflow-hidden group hover:shadow-md transition-shadow cursor-pointer ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-muted">
                      {template.imageUrl ? (
                        <img
                          src={template.imageUrl}
                          alt={template.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            console.error("Error loading template image:", template.id);
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/static/placeholder-card.svg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <FileHeart className="h-16 w-16" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{template.title}</h3>
                      {template.titleAr && (
                        <p className="text-sm text-muted-foreground">{template.titleAr}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <FileHeart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد قوالب متطابقة</h3>
                <p className="text-muted-foreground">
                  لم نتمكن من العثور على قوالب تطابق معايير البحث
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="certificates" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCertificateTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredCertificateTemplates.map((template: any) => (
                  <Card 
                    key={template.id} 
                    className={`overflow-hidden group hover:shadow-md transition-shadow cursor-pointer ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-muted">
                      {template.imageUrl ? (
                        <img
                          src={template.imageUrl}
                          alt={template.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            console.error("Error loading certificate template image:", template.id);
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/static/placeholder-certificate.svg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Award className="h-16 w-16" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{template.title}</h3>
                      {template.titleAr && (
                        <p className="text-sm text-muted-foreground">{template.titleAr}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.certificateType === 'appreciation' && 'شهادة تقدير'}
                        {template.certificateType === 'training' && 'شهادة تدريب'}
                        {template.certificateType === 'education' && 'شهادة تعليم'}
                        {template.certificateType === 'teacher' && 'شهادة للمعلمين'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد قوالب متطابقة</h3>
                <p className="text-muted-foreground">
                  لم نتمكن من العثور على قوالب تطابق معايير البحث
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
      
      {/* القسم الخاص بالقالب المحدد وتخصيصه والمعاينة */}
      {selectedTemplate && (
        <section className="bg-muted/30 p-6 rounded-lg mt-8 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 left-2" 
            onClick={handleCloseTemplate}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <h2 className="text-2xl font-bold mb-6">{selectedTemplate.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-medium mb-4">تخصيص {selectedTemplate.title}</h3>
              
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {renderForm()}
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      "معاينة البطاقة"
                    )}
                  </Button>
                </div>
              </form>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-medium mb-4">معاينة البطاقة</h3>
              
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="relative pb-[140%]">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FileHeart className="h-16 w-16 mx-auto mb-2" />
                        <p>قم بتعبئة النموذج وانقر على معاينة البطاقة لعرض المعاينة</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* أزرار التنزيل والمشاركة */}
              {previewImage && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 justify-between items-center">
                    <Button 
                      variant="default" 
                      onClick={() => window.open(previewImage, "_blank")}
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      عرض
                    </Button>
                    
                    {showQualitySelector ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Select value={selectedQuality} onValueChange={(value: any) => setSelectedQuality(value)}>
                          <SelectTrigger className="h-9 w-28 text-xs">
                            <SelectValue placeholder="اختر الجودة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">منخفضة</SelectItem>
                            <SelectItem value="medium">متوسطة</SelectItem>
                            <SelectItem value="high">عالية</SelectItem>
                            <SelectItem value="download">ممتازة</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="secondary" 
                          onClick={handleDownloadCard}
                          disabled={downloadCardMutation.isPending}
                          size="sm"
                        >
                          {downloadCardMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          تنزيل
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={handleDownloadCard}
                        className="flex items-center gap-1 flex-1"
                        disabled={!previewImage && !cardId}
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                        تنزيل
                      </Button>
                    )}
                    
                    <ShareOptions 
                      cardId={cardId || ""} 
                      imageUrl={previewImage || ""} 
                      size="sm"
                    />
                  </div>
                  
                  {user ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      حفظ إلى حسابي
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={isLoading}
                      asChild
                    >
                      <Link href="/auth">
                        تسجيل الدخول لحفظ البطاقة
                      </Link>
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setPreviewImage(null)}
                    disabled={isLoading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    إعادة المعاينة
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Features Section */}
      <section className="py-10">
        <h2 className="text-3xl font-bold text-center mb-12">مميزاتنا</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-muted/40 rounded-lg p-6 text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">تصاميم مخصصة</h3>
            <p className="text-muted-foreground">
              أضف نصوصك وصورك وخصص التصميم حسب ذوقك
            </p>
          </div>
          
          <div className="bg-muted/40 rounded-lg p-6 text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">شهادات موثقة</h3>
            <p className="text-muted-foreground">
              إنشاء شهادات مع رموز تحقق فريدة وقابلة للتحقق
            </p>
          </div>
          
          <div className="bg-muted/40 rounded-lg p-6 text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">مشاركة سهلة</h3>
            <p className="text-muted-foreground">
              شارك تصاميمك بسهولة عبر وسائل التواصل الاجتماعي والبريد الإلكتروني
            </p>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-muted/30 py-16 px-6 rounded-lg text-center space-y-6">
        <h2 className="text-3xl font-bold">جاهز لإنشاء تصميمك الأول؟</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          ابدأ الآن واستكشف مجموعة واسعة من القوالب المصممة لمختلف المناسبات
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!selectedTemplate && (
            <Button size="lg" asChild>
              <a href="#templates">
                <Sparkles className="h-5 w-5 ml-2" />
                استكشاف القوالب
              </a>
            </Button>
          )}
          {!user && (
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth">
                إنشاء حساب
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}