import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import ShareOptions from "@/components/share-options";
import { downloadImage } from "@/lib/utils";
import { Loader2, Eye, Download, X, RefreshCw, Save, Trash, Paintbrush, Edit, Palette } from "lucide-react";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import KonvaImageGenerator from "@/components/konva-image-generator";
import { FieldsPositionEditor } from "@/components/template-editor/FieldsPositionEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// تعريف نوع البطاقة
interface Card {
  id: number;
  publicId: string;
  templateId: number;
  categoryId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  formData?: Record<string, any>;
  status: string;
  template?: {
    id: number;
    title: string;
    titleAr?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    category?: {
      id: number;
      name: string;
      nameAr?: string;
      slug: string;
    }
  };
  category?: {
    id: number;
    name: string;
    nameAr?: string;
    slug: string;
  };
}

interface TemplateField {
  id: number;
  name: string;
  label: string;
  labelAr?: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  options?: any[];
  position?: { x: number; y: number };
  style?: Record<string, any>;
}

const CardPreview = () => {
  const params = useParams();
  const { category, templateId, cardId } = params;
  console.log("URL Params:", params);
  const [_, setLocation] = useLocation();
  const [isShareOptionsVisible, setIsShareOptionsVisible] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasRegenerated, setHasRegenerated] = useState(false);
  
  // استخدام React Query لجلب بيانات البطاقة
  const { data: card, isLoading: isLoadingCard, error: cardError } = useQuery<Card>({
    queryKey: [`/api/cards/${cardId}`],
    queryFn: getQueryFn<Card>({ on401: "redirect-to-login" }),
    enabled: !!cardId,
    retry: 1
  });

  // جلب حقول القالب (باستخدام المسار العام الذي لا يتطلب مصادقة)
  const { data: templateFields = [], isLoading: isLoadingFields } = useQuery<TemplateField[]>({
    queryKey: [`/api/templates/${card?.templateId}/public-fields`],
    queryFn: getQueryFn<TemplateField[]>({ on401: "returnNull" }),
    enabled: !!card?.templateId,
    retry: 3,
    staleTime: 60000 // تخزين مؤقت لمدة دقيقة واحدة لتجنب التحميل المتكرر
  });
  
  // تسجيل وصول للتشخيص
  useEffect(() => {
    if (card) {
      console.log("Card data loaded:", {
        id: card.id,
        publicId: card.publicId,
        templateId: card.templateId,
        imageUrl: card.imageUrl,
        formData: card.formData
      });
    }
  }, [card]);
  
  useEffect(() => {
    if (templateFields && templateFields.length > 0) {
      console.log("Template fields loaded:", templateFields);
    } else if (card?.templateId) {
      console.log("No template fields found for template ID:", card.templateId);
    }
  }, [templateFields, card?.templateId]);

  // التحقق من الصورة وتوليدها إذا لزم الأمر
  useEffect(() => {
    if (card && card.imageUrl) {
      console.log("Checking image URL:", card.imageUrl);
      
      // التحقق إذا كان المسار يحتوي على '/generated/' وإصلاحه إذا لزم الأمر
      const correctedUrl = card.imageUrl.includes('/generated/') 
        ? card.imageUrl 
        : card.imageUrl.replace('/uploads/', '/uploads/generated/');
      
      console.log("Corrected URL to check:", correctedUrl);
      
      // التحقق من صحة رابط الصورة
      fetch(correctedUrl, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.log("Image URL not valid, will regenerate");
            setPreviewUrl(null);
          } else {
            console.log("Image URL is valid:", correctedUrl);
            setPreviewUrl(correctedUrl);
          }
        })
        .catch((error) => {
          console.log("Error fetching image:", error);
          console.log("Will try original URL as fallback:", card.imageUrl);
          
          // محاولة أخرى باستخدام المسار الأصلي
          fetch(card.imageUrl, { method: 'HEAD' })
            .then(response => {
              if (response.ok) {
                console.log("Original URL is valid:", card.imageUrl);
                setPreviewUrl(card.imageUrl);
              } else {
                console.log("Both URLs failed, will regenerate");
                setPreviewUrl(null);
              }
            })
            .catch(() => {
              console.log("Both URLs failed with error, will regenerate");
              setPreviewUrl(null);
            });
        });
    } else {
      setPreviewUrl(null);
    }
  }, [card]);

  // توليد صورة البطاقة
  const handleImageGenerated = async (imageDataUrl: string) => {
    try {
      console.log("Image generated successfully, data URL length:", imageDataUrl.length);
      setIsLoadingImage(false);
      setPreviewUrl(imageDataUrl);

      // حفظ الصورة الجديدة على الخادم إذا تم إعادة التوليد
      if (isRegenerating && card) {
        console.log("Uploading regenerated image to server...");
        
        try {
          const response = await apiRequest<{ success: boolean; imageUrl: string }>(
            'POST',
            `/api/cards/${card.id}/update-image`,
            { imageData: imageDataUrl },
            { 
              timeout: 20000, // زيادة زمن الانتظار إلى 20 ثانية
            }
          );

          if (response && response.imageUrl) {
            console.log("Image updated successfully, new URL:", response.imageUrl);
            
            // تحديث التخزين المؤقت
            queryClient.setQueryData<Card>([`/api/cards/${cardId}`], (oldData) => {
              return oldData ? {
                ...oldData,
                imageUrl: response.imageUrl
              } : oldData;
            });
            
            setPreviewUrl(response.imageUrl);
            
            toast({
              title: "تم تحديث الصورة",
              description: "تم إعادة توليد صورة البطاقة بنجاح"
            });
          } else {
            // إذا نجح الطلب ولكن لم يتم استلام عنوان URL جديد
            console.warn("Image update succeeded but no URL returned");
            // الاستمرار في استخدام عنوان URL المؤقت
          }
        } catch (uploadError) {
          console.error("Error uploading regenerated image:", uploadError);
          // لا نريد إظهار خطأ للمستخدم هنا لأن الصورة المولدة ستستخدم محليًا على أي حال
          console.log("Using locally generated image as fallback");
        }
        
        setIsRegenerating(false);
        setHasRegenerated(true);
      }
    } catch (error) {
      console.error("Error in image generation process:", error);
      setIsLoadingImage(false);
      setIsRegenerating(false);
      
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث صورة البطاقة",
        variant: "destructive"
      });
    }
  };

  // معالجة أخطاء توليد الصورة
  const handleImageError = (error: Error) => {
    console.error("Error generating image:", error);
    setIsLoadingImage(false);
    setIsRegenerating(false);
    
    toast({
      title: "خطأ في توليد الصورة",
      description: error.message || "حدث خطأ أثناء توليد صورة البطاقة",
      variant: "destructive"
    });
  };

  // إعادة توليد الصورة
  const handleRegenerateImage = () => {
    setIsRegenerating(true);
    setPreviewUrl(null); // إزالة الصورة الحالية
  };
  
  // تحديث حقول التصميم
  const handleFieldsUpdated = async (updatedFields: any[]) => {
    console.log("تم تحديث حقول التصميم:", updatedFields);
    setUpdatedFields(updatedFields);
    
    // إعادة توليد الصورة باستخدام الحقول المحدثة
    setIsRegenerating(true);
    setPreviewUrl(null);
    
    try {
      // حفظ تحديثات التصميم في قاعدة البيانات إذا كانت البطاقة محفوظة
      if (card?.id && card.status === 'saved') {
        await apiRequest('PATCH', `/api/cards/${card.id}/update-design`, {
          fields: updatedFields
        });
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث تصميم البطاقة وحفظ التغييرات"
        });
      }
    } catch (error) {
      console.error("خطأ في تحديث التصميم:", error);
      // لا نظهر خطأ للمستخدم هنا، لأن الصورة ستتولد محلياً على أي حال
      console.log("سيتم استخدام التصميم المحدث محلياً فقط");
    }
  };

  const handleViewFullCard = () => {
    // استخدام المعرف العام (publicId) بدلاً من معرف البطاقة الداخلي
    if (card && card.publicId) {
      console.log(`Navigating to view card with publicId: ${card.publicId}`);
      setLocation(`/view/${card.publicId}`);
    } else {
      console.error("Cannot view card: missing publicId");
    }
  };

  // إضافة خيارات الجودة
  const [selectedQuality, setSelectedQuality] = useState<'low' | 'medium' | 'high' | 'download'>('medium');
  const [showQualitySelector, setShowQualitySelector] = useState(false);

  // حفظ البطاقة
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  // محرر التصميم
  const [isDesignEditorOpen, setIsDesignEditorOpen] = useState(false);
  const [updatedFields, setUpdatedFields] = useState<TemplateField[]>([]);
  
  // حفظ البطاقة في نماذجي
  const saveCardMutation = useMutation({
    mutationFn: async () => {
      // استخدام PATCH لتحديث حالة البطاقة إلى "حفظ"
      const response = await apiRequest('PATCH', `/api/cards/${card?.id}`, {
        status: 'saved',
        isPreview: false
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ البطاقة في نماذجك بنجاح",
      });
      setIsSaveDialogOpen(false);
      
      // تحديث البيانات المخزنة مؤقتاً بعد الحفظ
      queryClient.setQueryData<Card>([`/api/cards/${cardId}`], (oldData) => {
        return oldData ? {
          ...oldData,
          status: 'saved'
        } : oldData;
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحفظ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ البطاقة",
        variant: "destructive"
      });
    }
  });
  
  // حفظ البطاقة كمسودة
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      // استخدام PATCH لتحديث حالة البطاقة إلى "مسودة"
      const response = await apiRequest('PATCH', `/api/cards/${card?.id}`, {
        status: 'draft',
        isPreview: false,
        quality: 'preview' // استخدام جودة منخفضة للمسودات لتوفير مساحة التخزين
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/cards'] });
      toast({
        title: "تم الحفظ كمسودة",
        description: "تم حفظ البطاقة كمسودة ويمكنك تعديلها لاحقاً من صفحة نماذجي",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحفظ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ المسودة",
        variant: "destructive"
      });
    }
  });

  // حذف البطاقة
  const deleteCardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/cards/${card?.id}`, {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف البطاقة بنجاح",
      });
      setIsSaveDialogOpen(false);
      setLocation(`/cards/${category || 'other'}/${templateId}`);
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحذف",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حذف البطاقة",
        variant: "destructive"
      });
    }
  });

  // تنزيل البطاقة بجودة محددة
  const downloadCardMutation = useMutation({
    mutationFn: async (quality: 'low' | 'medium' | 'high' | 'download') => {
      console.log(`Requesting download with quality: ${quality}`);
      const response = await apiRequest('POST', `/api/cards/${card?.id}/download`, {
        quality
      });
      // تخزين الجودة المستخدمة في الاستجابة لاستخدامها في تسمية الملف
      return { ...response, usedQuality: quality };
    },
    onSuccess: (data) => {
      if (data?.imageUrl) {
        const fileName = `بطاقة-${card?.id || 'custom'}-${data.usedQuality || selectedQuality}.png`;
        console.log(`Downloading image: ${data.imageUrl} with filename: ${fileName}`);
        downloadImage(data.imageUrl, fileName);
        toast({
          title: "تم التنزيل",
          description: `تم تنزيل البطاقة بنجاح بجودة ${
            data.usedQuality === 'low' ? 'منخفضة' : 
            data.usedQuality === 'medium' ? 'متوسطة' : 
            data.usedQuality === 'high' ? 'عالية' : 'ممتازة'
          }`
        });
      } else {
        handleFallbackDownload();
      }
    },
    onError: () => {
      handleFallbackDownload();
    }
  });

  // تنزيل احتياطي إذا فشلت عملية التنزيل بالجودة المحددة
  const handleFallbackDownload = () => {
    const imageToDownload = previewUrl || (card && card.imageUrl);
    
    if (imageToDownload) {
      const fileName = `بطاقة-${card?.id || 'custom'}.png`;
      downloadImage(imageToDownload, fileName);
    } else {
      toast({
        title: "تعذر التحميل",
        description: "الصورة غير متوفرة للتحميل حالياً",
        variant: "destructive"
      });
    }
  };

  // التنزيل مع خيارات الجودة
  const handleDownloadCard = () => {
    if (showQualitySelector) {
      // استخدام الجودة المحددة
      downloadCardMutation.mutate(selectedQuality);
      setShowQualitySelector(false);
    } else {
      // عرض خيارات الجودة
      setShowQualitySelector(true);
    }
  };

  // تغيير منطق التحميل ليظهر الواجهة بشكل أسرع مع إضافة مؤشر تحميل داخل المحتوى
  const isLoading = isLoadingCard;
  const isLoadingDetails = isLoadingFields || (previewUrl === null && !cardError);

  // إظهار شاشة التحميل فقط إذا كانت البطاقة نفسها قيد التحميل
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto mx-4 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          جاري تحميل البطاقة...
        </div>
      </div>
    );
  }

  if (cardError || !card) {
    return (
      <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto mx-4 p-6 text-center">
          <p className="text-red-500 mb-4">حدث خطأ أثناء تحميل البطاقة</p>
          <Button onClick={() => window.history.back()}>العودة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full h-[95vh] max-h-[95vh] overflow-hidden mx-2 flex flex-col">
        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-neutral-800">معاينة البطاقة</h3>
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-500 hover:text-neutral-700"
            onClick={() => setLocation(`/cards/${category || 'other'}/${templateId}`)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-3 md:p-4 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg p-2 md:p-4">
            <div className="relative max-w-3xl h-full flex items-center justify-center">
              {/* عرض مؤشر التحميل أثناء تحميل تفاصيل البطاقة أو الصورة */}
              {isLoadingDetails ? (
                <div className="rounded-md shadow-md bg-white flex items-center justify-center" style={{ aspectRatio: '3/4', minHeight: '300px' }}>
                  <div className="text-center p-4">
                    <Loader2 className="w-10 h-10 animate-spin mb-2 mx-auto text-primary" />
                    <p className="text-sm text-gray-600">جاري تحميل الصورة...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt={card.template?.title || "البطاقة المخصصة"} 
                  className="w-auto h-auto object-contain rounded-md shadow-md max-h-[calc(95vh-140px)] max-w-full"
                  loading="lazy"
                />
              ) : (
                // إذا لم تكن هناك صورة متاحة، استخدم Konva لتوليد واحدة
                <div className="rounded-md shadow-md bg-white flex items-center justify-center" style={{ maxHeight: 'calc(95vh - 140px)', minHeight: '600px' }}>
                  <KonvaImageGenerator
                    templateImage={card.template?.imageUrl || ''}
                    fields={updatedFields.length > 0 ? updatedFields : templateFields}
                    formData={card.formData || {}}
                    width={500}
                    height={700}
                    onImageGenerated={handleImageGenerated}
                    onError={handleImageError}
                    className="max-h-[calc(95vh_-_140px)] max-w-full object-contain"
                  />
                </div>
              )}
              
              {/* زر إعادة توليد الصورة - عرضه فقط عندما تكون الصورة جاهزة وليست قيد التوليد */}
              {!isRegenerating && !isLoadingImage && !isLoadingDetails && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2 opacity-80 hover:opacity-100"
                  onClick={handleRegenerateImage}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  إعادة توليد
                </Button>
              )}
            </div>
          </div>
          
        </div>
        
        {/* أزرار التحكم في شريط ثابت في الأسفل */}
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          {/* كل الأزرار في صف واحد */}
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={handleViewFullCard}
                className="flex items-center gap-1"
                disabled={!previewUrl && !card.imageUrl}
                size="sm"
              >
                <Eye className="h-4 w-4" />
                عرض
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsDesignEditorOpen(true)}
                className="flex items-center gap-1"
                size="sm"
              >
                <Palette className="h-4 w-4" />
                تعديل التصميم
              </Button>
              
              {showQualitySelector ? (
                <div className="flex items-center gap-1">
                  <Select value={selectedQuality} onValueChange={(value: any) => setSelectedQuality(value)}>
                    <SelectTrigger className="h-9 w-28">
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
                  className="flex items-center gap-1"
                  disabled={!previewUrl && !card.imageUrl}
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  تنزيل
                </Button>
              )}
              
              <ShareOptions 
                cardId={card.id || card.publicId} 
                imageUrl={previewUrl || card.imageUrl} 
                size="sm"
                templateId={card.templateId}
              />
            </div>
            
            <div className="flex gap-2">
              {/* أزرار الحفظ والحذف */}
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1"
                    size="sm"
                  >
                    <Save className="h-4 w-4" />
                    حفظ
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>حفظ البطاقة</DialogTitle>
                    <DialogDescription>
                      يمكنك حفظ البطاقة في نماذجك للرجوع إليها لاحقاً أو حفظها كمسودة لتعديلها لاحقاً.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="default"
                        onClick={() => saveCardMutation.mutate()}
                        disabled={saveCardMutation.isPending}
                        className="w-full"
                      >
                        {saveCardMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        حفظ البطاقة
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => {
                          saveDraftMutation.mutate();
                          setIsSaveDialogOpen(false);
                        }}
                        disabled={saveDraftMutation.isPending}
                        className="w-full"
                      >
                        {saveDraftMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                            <path d="M14 3c.3 0 .5.1.7.3L20 8.6c.2.2.3.4.3.7V18c0 .6-.2 1-.6 1.4-.4.4-.8.6-1.4.6H5.6c-.6 0-1-.2-1.4-.6-.4-.4-.6-.8-.6-1.4V5.6c0-.6.2-1 .6-1.4.4-.4.8-.6 1.4-.6H14z"/>
                            <path d="M15 3v5c0 .6.2 1 .6 1.4.4.4.8.6 1.4.6h5"/>
                            <path d="m9 15 3 3 3-3" />
                            <path d="M12 9v9" />
                          </svg>
                        )}
                        حفظ كمسودة
                      </Button>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsSaveDialogOpen(false)}
                      className="w-full"
                    >
                      إلغاء
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => deleteCardMutation.mutate()}
                disabled={deleteCardMutation.isPending}
                size="sm"
              >
                {deleteCardMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
                عدم الحفظ
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* محرر تصميم البطاقة */}
      <DesignEditorDialog
        isOpen={isDesignEditorOpen}
        onClose={() => setIsDesignEditorOpen(false)}
        templateId={card.templateId}
        templateFields={templateFields}
        formData={card.formData || {}}
        // استخدام صورة البطاقة نفسها أو صورة القالب كاحتياطي
        templateImage={card.template?.imageUrl || card.imageUrl || ''}
        onFieldsUpdated={handleFieldsUpdated}
      />
    </div>
  );
};

// الستايل الخاص بمحرر التصميم
const DesignEditorDialog = ({ 
  isOpen, 
  onClose, 
  templateId,
  templateFields,
  formData,
  templateImage,
  onFieldsUpdated
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  templateId: number;
  templateFields: TemplateField[];
  formData: Record<string, any>;
  templateImage: string;
  onFieldsUpdated: (fields: any[]) => void;
}) => {
  const [editedFields, setEditedFields] = useState<any[]>([]);
  const { toast } = useToast();

  // عندما تفتح النافذة، حول الحقول إلى التنسيق المطلوب للمحرر
  useEffect(() => {
    if (isOpen && templateFields && templateFields.length > 0) {
      // تحويل حقول القالب إلى التنسيق المطلوب لمكون المحرر
      const convertedFields = templateFields.map(field => {
        // التأكد من أن لكل حقل موضع صالح
        let position = field.position;
        if (!position || typeof position !== 'object') {
          position = { x: 50, y: 50 };
        }
        
        // التأكد من أن خصائص النمط موجودة ومعرفة
        const fieldStyle = field.style || {};
        
        return {
          ...field,
          id: field.id,
          position,
          style: fieldStyle,
          // ضمان وجود خصائص ضرورية لعرض الحقل
          visible: fieldStyle.visible !== false,
          zIndex: fieldStyle.zIndex || fieldStyle.layer || 1,
          rotation: fieldStyle.rotation || 0,
          // إضافة معلومات الحجم إذا كانت متوفرة
          size: {
            width: fieldStyle.width || 200,
            height: fieldStyle.height || 50
          }
        };
      });
      
      setEditedFields(convertedFields);
      console.log("تم تحويل حقول القالب للمحرر:", convertedFields);
    }
  }, [isOpen, templateFields]);

  // عند حفظ التغييرات
  const handleSaveDesign = () => {
    try {
      onFieldsUpdated(editedFields);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ تغييرات التصميم بنجاح",
      });
      onClose();
    } catch (error) {
      console.error("خطأ أثناء حفظ التصميم:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ التصميم، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  };

  // الاستماع لتغييرات الحقول من محرر المواضع
  const handleFieldsChange = (updatedFields: any[]) => {
    setEditedFields(updatedFields);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>تعديل تصميم البطاقة</DialogTitle>
            <DialogDescription>
              يمكنك تعديل مظهر العناصر وموضعها في البطاقة هنا. اسحب العناصر لتغيير مواضعها.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-0">
            <FieldsPositionEditor
              templateId={templateId}
              initialFields={editedFields}
              formData={formData}
              templateImage={templateImage}
              onChange={handleFieldsChange}
              readOnly={false}
              embedded={true}
            />
          </div>
          
          <div className="p-4 border-t flex justify-between">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button onClick={handleSaveDesign}>
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardPreview;
