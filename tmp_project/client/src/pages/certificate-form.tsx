import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function CertificateForm() {
  const { templateId } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch template data
  const { data: template, isLoading } = useQuery<any>({
    queryKey: [`/api/certificate-templates/${templateId}`],
    queryFn: getQueryFn({ on401: "redirect-to-login" }),
    enabled: !!templateId
  });
  
  // Fetch template fields - أزلنا إجبار تسجيل الدخول للحصول على الحقول المخصصة
  const { data: templateFields, isLoading: isLoadingFields } = useQuery<any[]>({
    queryKey: [`/api/certificate-templates/${templateId}/fields`],
    queryFn: getQueryFn(), // إزالة التوجيه إلى صفحة تسجيل الدخول
    enabled: !!templateId
  });
  
  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Handle form change
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template || Object.keys(template).length === 0) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على القالب",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await apiRequest("POST", "/api/certificates/generate", {
        templateId: Number(templateId),
        formData: {
          ...formData,
          certificateType: (template as any).certificateType || "appreciation"
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل إنشاء الشهادة");
      }
      
      const data = await response.json();
      
      // Navigate to certificate preview
      setLocation(`/certificates/preview/${data.certificateId}`);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء الشهادة",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle field value change based on field type
  const renderField = (field: any) => {
    const fieldType = field.type || "text";
    const required = field.required || false;
    
    switch (fieldType) {
      case "text":
        return (
          <Input
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ""}
            value={formData[field.name] || ""}
            onChange={(e) => handleFormChange(field.name, e.target.value)}
            required={required}
            className="rtl"
          />
        );
      
      case "textarea":
        return (
          <Textarea
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ""}
            value={formData[field.name] || ""}
            onChange={(e) => handleFormChange(field.name, e.target.value)}
            required={required}
            className="rtl"
          />
        );
      
      case "select":
        return (
          <Select
            value={formData[field.name] || ""}
            onValueChange={(value) => handleFormChange(field.name, value)}
            required={required}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "اختر..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "radio":
        return (
          <RadioGroup
            value={formData[field.name] || ""}
            onValueChange={(value) => handleFormChange(field.name, value)}
            required={required}
            className="space-y-2"
          >
            {field.options?.map((option: any) => (
              <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem id={`${field.name}-${option.value}`} value={option.value} />
                <Label htmlFor={`${field.name}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case "checkbox":
        return (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id={field.name}
              checked={formData[field.name] || false}
              onCheckedChange={(checked) => handleFormChange(field.name, checked)}
              required={required}
            />
            <Label htmlFor={field.name}>{field.label}</Label>
          </div>
        );
      
      case "date":
        return (
          <DatePicker
            value={formData[field.name] ? new Date(formData[field.name]) : undefined}
            onChange={(date) => handleFormChange(field.name, date ? format(date, "yyyy-MM-dd") : "")}
            placeholder={field.placeholder || "اختر تاريخ..."}
            locale={ar}
          />
        );
      
      default:
        return (
          <Input
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ""}
            value={formData[field.name] || ""}
            onChange={(e) => handleFormChange(field.name, e.target.value)}
            required={required}
            className="rtl"
          />
        );
    }
  };
  
  if (isLoading || isLoadingFields) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">لم يتم العثور على القالب</h2>
        <p className="text-muted-foreground mb-6">
          لم نتمكن من العثور على القالب المطلوب. يرجى اختيار قالب آخر.
        </p>
        <Button onClick={() => setLocation("/")}>
          <ChevronLeft className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>
      </div>
    );
  }
  
  const defaultFields = [
    {
      name: "issuedTo",
      label: "اسم المستفيد",
      placeholder: "أدخل الاسم الكامل للمستفيد",
      type: "text",
      required: true,
    },
    {
      name: "issuedToGender",
      label: "الجنس",
      type: "radio",
      options: [
        { value: "male", label: "ذكر" },
        { value: "female", label: "أنثى" },
      ],
      required: true,
    },
    {
      name: "title",
      label: "عنوان الشهادة",
      placeholder: "أدخل عنوان الشهادة",
      type: "text",
      required: false,
    },
    {
      name: "schoolName",
      label: "اسم المدرسة / المؤسسة",
      placeholder: "أدخل اسم المدرسة أو المؤسسة",
      type: "text",
      required: false,
    },
    {
      name: "reason",
      label: "سبب المنح",
      placeholder: "أدخل سبب منح الشهادة",
      type: "textarea",
      required: true,
    },
    {
      name: "date",
      label: "تاريخ الإصدار",
      type: "date",
      required: true,
    },
    {
      name: "principalName",
      label: "اسم المسؤول",
      placeholder: "أدخل اسم المسؤول",
      type: "text",
      required: false,
    },
    {
      name: "principalTitle",
      label: "المسمى الوظيفي للمسؤول",
      placeholder: "مثال: المدير / المشرف / الرئيس",
      type: "text",
      required: false,
    },
  ];
  
  // Use template fields if available, otherwise use default fields
  console.log("Template fields received:", templateFields);
  const fields = (templateFields && Array.isArray(templateFields) && templateFields.length > 0) 
    ? templateFields 
    : defaultFields;
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => setLocation("/?tab=certificates")}>
          <ChevronLeft className="ml-2 h-4 w-4" />
          العودة للقوالب
        </Button>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="sticky top-6">
            <div className="bg-muted/50 p-4 rounded-lg mb-6">
              <h2 className="text-xl font-bold">{(template as any)?.title || 'قالب شهادة'}</h2>
              {(template as any)?.titleAr && (
                <p className="text-muted-foreground">{(template as any).titleAr}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {(template as any)?.certificateType === 'appreciation' && 'شهادة تقدير'}
                {(template as any)?.certificateType === 'training' && 'شهادة تدريب'}
                {(template as any)?.certificateType === 'education' && 'شهادة تعليم'}
                {(template as any)?.certificateType === 'teacher' && 'شهادة للمعلمين'}
              </p>
            </div>
            
            <div className="bg-muted/50 aspect-[1.414/1] w-full rounded-lg overflow-hidden">
              {(template as any)?.imageUrl ? (
                <img 
                  src={(template as any).imageUrl} 
                  alt={(template as any).title || 'قالب شهادة'} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  لا توجد صورة معاينة
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">معلومات الشهادة</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-destructive mr-1">*</span>}
                    </Label>
                    {renderField(field)}
                    {field.description && (
                      <p className="text-sm text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                ))}
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري إنشاء الشهادة...
                      </>
                    ) : (
                      "إنشاء الشهادة"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}