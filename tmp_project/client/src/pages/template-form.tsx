import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import WeddingForm from "@/components/forms/wedding-form";
import EngagementForm from "@/components/forms/engagement-form";
import GraduationForm from "@/components/forms/graduation-form";
import EidForm from "@/components/forms/eid-form";
import RamadanForm from "@/components/forms/ramadan-form";
import CustomForm from "@/components/forms/custom-form";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { getCategoryName } from "@/lib/utils";

const TemplateForm = () => {
  const { category, templateId } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // جلب بيانات القالب
  const { data: template, isLoading } = useQuery({
    queryKey: [`/api/templates/${category}/${templateId}`],
    queryFn: getQueryFn({ on401: "redirect-to-login" }),
    enabled: !!category && !!templateId,
    retry: 3
  });
  
  // جلب الحقول المخصصة للقالب (المسار العام المباشر - لا يتطلب تسجيل دخول)
  const { data: templateFields, isLoading: isLoadingFields, error: templateFieldsError } = useQuery({
    queryKey: [`/api/template-fields/${templateId}`],
    queryFn: getQueryFn(),
    enabled: !!templateId,
  });

  // طباعة معلومات تشخيصية للتأكد من العمل الصحيح
  console.log(`[DEBUG] Template ID: ${templateId}, isLoadingFields: ${isLoadingFields}, 
    fieldsCount: ${templateFields ? (Array.isArray(templateFields) ? templateFields.length : 'not array') : 'null'}`);
  if (templateFieldsError) {
    console.error(`[ERROR] Failed to fetch template fields:`, templateFieldsError);
  }
  
  const [formData, setFormData] = useState({});

  const handleFormChange = (data: any) => {
    setFormData(data);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log("Submitting form data:", { templateId, category, formData });
      
      // إضافة بيانات توضيحية للتشخيص
      if (!templateId || !category) {
        console.error("Missing required parameters:", { templateId, category });
        toast({
          title: "خطأ",
          description: "بيانات القالب غير مكتملة",
          variant: "destructive",
        });
        return;
      }
      
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
            // لا تضبط headers هنا لأن fetch سيقوم بضبطها تلقائيًا لـ FormData
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
            description: "تم إنشاء البطاقة ولكن تعذر الانتقال إلى صفحة المعاينة",
            variant: "destructive",
          });
          return;
        }
        
        // الانتقال إلى صفحة المعاينة
        const previewUrl = `/preview/${category}/${templateId}/${data.cardId}`;
        console.log("Navigating to preview URL:", previewUrl);
        setLocation(previewUrl);
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
    }
  };

  const renderFormByCategory = () => {
    if (isLoading || isLoadingFields) {
      return <div className="p-6 text-center">جاري تحميل القالب...</div>;
    }
    
    if (!template) {
      console.error("Template not loaded for category:", category, "templateId:", templateId);
      return (
        <div className="p-6 text-center bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-500 mb-2">تعذر تحميل القالب</p>
          <p className="text-sm text-gray-600">
            حدث خطأ أثناء تحميل القالب، الرجاء العودة واختيار قالب آخر.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setLocation("/?tab=cards")}
          >
            العودة إلى القوالب
          </Button>
        </div>
      );
    }
    
    // إذا كان لدينا حقول مخصصة للقالب، نستخدم نموذج مخصص (يعمل الآن للمستخدمين غير المسجلين أيضاً)
    if (templateFields && Array.isArray(templateFields) && templateFields.length > 0) {
      console.log(`Using custom form with ${templateFields.length} template fields for template ${templateId}`);
      return <CustomForm 
        onChange={handleFormChange} 
        template={{
          ...template as any, 
          templateFields: templateFields
        }} 
      />;
    }

    // إذا لم يكن لدينا حقول مخصصة، نستخدم النموذج الافتراضي حسب الفئة
    let CategoryForm;
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
      return <CategoryForm onChange={handleFormChange} template={template as any} />;
    }

    return (
      <div className="p-6 text-center">
        نوع البطاقة غير مدعوم. الرجاء العودة واختيار قالب آخر.
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Button
        variant="ghost"
        className="mb-6 flex items-center text-primary hover:text-primary/80 font-medium"
        onClick={() => setLocation("/?tab=cards")}
      >
        <i className="fas fa-arrow-right ml-2"></i>
        العودة إلى القوالب
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template preview */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="relative pb-[140%]">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">جاري التحميل...</div>
            ) : (
              <img 
                src={(template as any)?.imageUrl} 
                alt={(template as any)?.title} 
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </div>
        </div>
        
        {/* Form inputs */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">
            تخصيص بطاقة {getCategoryName(category || '')}
          </h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {renderFormByCategory()}
            
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                معاينة البطاقة
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TemplateForm;
