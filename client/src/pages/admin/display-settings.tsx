import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2,
  Layout,
  Layers, 
  Check,
  Save,
  RotateCcw,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function AdminDisplaySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("layout");
  
  // Display settings
  const [displayMode, setDisplayMode] = useState<"single" | "multi">("multi");
  const [templateViewMode, setTemplateViewMode] = useState<"single-page" | "multi-page">("multi-page");
  const [enableSocialFormats, setEnableSocialFormats] = useState(true);
  const [defaultSocialFormat, setDefaultSocialFormat] = useState("instagram");
  
  // Fetch display settings - استخدام المسار الموحد
  const { data: displaySettings, isLoading } = useQuery({
    queryKey: ["/api/display-settings"],
    queryFn: getQueryFn({}),
    onSuccess: (data) => {
      if (data?.settings) {
        setDisplayMode(data.settings.displayMode || "multi");
        setTemplateViewMode(data.settings.templateViewMode || "multi-page");
        setEnableSocialFormats(data.settings.enableSocialFormats ?? true);
        setDefaultSocialFormat(data.settings.defaultSocialFormat || "instagram");
      }
    }
  });
  
  // Update settings mutation - استخدام المسار الموحد للمشرفين
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/display-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/display-settings"],
      });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات العرض بنجاح",
      });
    },
    onError: (error) => {
      console.error("Error saving display settings:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    }
  });
  
  // Handle display mode change
  const handleDisplayModeChange = (value: string) => {
    setDisplayMode(value as "single" | "multi");
  };
  
  // Handle template view mode change
  const handleTemplateViewModeChange = (value: string) => {
    setTemplateViewMode(value as "single-page" | "multi-page");
  };
  
  // Handle social formats toggle
  const handleSocialFormatsToggle = (checked: boolean) => {
    setEnableSocialFormats(checked);
  };
  
  // Handle default social format change
  const handleDefaultSocialFormatChange = (value: string) => {
    setDefaultSocialFormat(value);
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    mutate({
      displayMode,
      templateViewMode,
      enableSocialFormats,
      defaultSocialFormat
    });
  };
  
  // Reset to defaults
  const handleResetDefaults = () => {
    setDisplayMode("multi");
    setTemplateViewMode("multi-page");
    setEnableSocialFormats(true);
    setDefaultSocialFormat("instagram");
    
    mutate({
      displayMode: "multi",
      templateViewMode: "multi-page",
      enableSocialFormats: true,
      defaultSocialFormat: "instagram"
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إعدادات العرض</h1>
          <p className="text-muted-foreground">
            تخصيص كيفية عرض المحتوى للمستخدمين
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="layout">تخطيط الموقع</TabsTrigger>
          <TabsTrigger value="sharing">المشاركة الاجتماعية</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>نمط عرض القوالب</CardTitle>
                  <CardDescription>تحديد طريقة عرض صفحة القوالب الرئيسية للمستخدمين</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${displayMode === 'single' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleDisplayModeChange('single')}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">صفحة واحدة (Single-Page)</h3>
                        {displayMode === 'single' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="bg-muted h-24 rounded-md flex items-center justify-center border-2 border-muted-foreground/20">
                        <div className="w-full h-20 flex space-x-1 rtl:space-x-reverse px-2">
                          <div className="w-1/3 h-full bg-primary/20 rounded"></div>
                          <div className="w-1/3 h-full bg-primary/30 rounded"></div>
                          <div className="w-1/3 h-full bg-primary/40 rounded"></div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        عرض القوالب والنموذج والمعاينة في صفحة واحدة متكاملة
                      </p>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${displayMode === 'multi' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleDisplayModeChange('multi')}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">صفحات متعددة (Multi-Page)</h3>
                        {displayMode === 'multi' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="bg-muted h-24 rounded-md flex items-center justify-center border-2 border-muted-foreground/20">
                        <div className="w-full h-20 flex space-x-1 rtl:space-x-reverse px-2">
                          <div className="w-full h-full bg-primary/20 rounded"></div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        عرض القوالب والنموذج والمعاينة في صفحات منفصلة
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>نمط عرض التفاصيل</CardTitle>
                  <CardDescription>تحديد طريقة عرض تفاصيل القالب وملء البيانات</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${templateViewMode === 'single-page' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleTemplateViewModeChange('single-page')}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">عرض واحد</h3>
                        {templateViewMode === 'single-page' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="bg-muted h-24 rounded-md flex items-center justify-center border-2 border-muted-foreground/20">
                        <Layout className="h-12 w-12 text-primary/60" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        عرض النموذج والمعاينة في نفس الصفحة
                      </p>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${templateViewMode === 'multi-page' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleTemplateViewModeChange('multi-page')}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">عرض تقليدي</h3>
                        {templateViewMode === 'multi-page' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="bg-muted h-24 rounded-md flex items-center justify-center border-2 border-muted-foreground/20">
                        <Layers className="h-12 w-12 text-primary/60" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        عرض النموذج والمعاينة في صفحات منفصلة
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleResetDefaults} disabled={isPending}>
                    <RotateCcw className="h-4 w-4 ml-2" />
                    استعادة الإعدادات الافتراضية
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 ml-2" />
                    )}
                    حفظ الإعدادات
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="sharing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات المشاركة الاجتماعية</CardTitle>
              <CardDescription>تخصيص خيارات المشاركة عبر وسائل التواصل الاجتماعي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch
                    id="enable-social-formats"
                    checked={enableSocialFormats}
                    onCheckedChange={handleSocialFormatsToggle}
                  />
                  <Label htmlFor="enable-social-formats">تفعيل خيارات المشاركة الاجتماعية</Label>
                </div>
                
                <div className="pt-2">
                  <Label htmlFor="default-social-format">التنسيق الافتراضي للمشاركة</Label>
                  <Select
                    disabled={!enableSocialFormats}
                    value={defaultSocialFormat}
                    onValueChange={handleDefaultSocialFormatChange}
                  >
                    <SelectTrigger id="default-social-format" className="w-full mt-2">
                      <SelectValue placeholder="اختر تنسيق المشاركة الافتراضي" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">انستجرام</SelectItem>
                      <SelectItem value="facebook">فيسبوك</SelectItem>
                      <SelectItem value="twitter">تويتر</SelectItem>
                      <SelectItem value="linkedin">لينكد إن</SelectItem>
                      <SelectItem value="whatsapp">واتساب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">انستجرام</h3>
                      {defaultSocialFormat === 'instagram' && enableSocialFormats && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="bg-muted h-16 rounded-md flex items-center justify-center border border-muted-foreground/20">
                      <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-md flex items-center justify-center">
                        <Share2 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">فيسبوك</h3>
                      {defaultSocialFormat === 'facebook' && enableSocialFormats && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="bg-muted h-16 rounded-md flex items-center justify-center border border-muted-foreground/20">
                      <div className="w-16 h-16 bg-blue-600 rounded-md flex items-center justify-center">
                        <Share2 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">تويتر</h3>
                      {defaultSocialFormat === 'twitter' && enableSocialFormats && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="bg-muted h-16 rounded-md flex items-center justify-center border border-muted-foreground/20">
                      <div className="w-16 h-16 bg-sky-500 rounded-md flex items-center justify-center">
                        <Share2 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSaveSettings} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                حفظ إعدادات المشاركة
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}