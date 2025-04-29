import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2,
  Settings,
  Save,
  Layout,
  LayoutGrid
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDisplaySettingsPage() {
  const { toast } = useToast();
  const [displaySettings, setDisplaySettings] = useState<{
    displayMode: string;
    templateViewMode: string;
    enableSocialFormats: boolean;
    defaultSocialFormat: string;
  }>({
    displayMode: "multi",
    templateViewMode: "multi-page",
    enableSocialFormats: true,
    defaultSocialFormat: "instagram"
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // جلب إعدادات العرض
  useEffect(() => {
    async function fetchDisplaySettings() {
      try {
        const response = await fetch('/api/display');
        if (response.ok) {
          const data = await response.json();
          setDisplaySettings(data.settings || {
            displayMode: "multi",
            templateViewMode: "multi-page",
            enableSocialFormats: true,
            defaultSocialFormat: "instagram"
          });
        }
      } catch (error) {
        console.error('Error fetching display settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    
    fetchDisplaySettings();
  }, []);
  
  // حفظ إعدادات العرض
  const saveDisplaySettingsMutation = useMutation({
    mutationFn: async (settings: typeof displaySettings) => {
      return await apiRequest('/api/admin/settings/display', {
        method: 'POST',
        body: { settings }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ إعدادات العرض بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء حفظ إعدادات العرض",
        variant: "destructive",
      });
      console.error('Error saving display settings:', error);
    }
  });
  
  // معالجة تغيير نمط العرض
  const handleDisplayModeChange = (isSingle: boolean) => {
    setDisplaySettings(prev => ({
      ...prev,
      displayMode: isSingle ? 'single' : 'multi'
    }));
    
    // حفظ التغييرات فوراً
    saveDisplaySettingsMutation.mutate({
      ...displaySettings,
      displayMode: isSingle ? 'single' : 'multi'
    });
  };
  
  // معالجة تغيير طريقة عرض القوالب
  const handleTemplateViewModeChange = (isSingle: boolean) => {
    setDisplaySettings(prev => ({
      ...prev,
      templateViewMode: isSingle ? 'single-page' : 'multi-page'
    }));
    
    // حفظ التغييرات فوراً
    saveDisplaySettingsMutation.mutate({
      ...displaySettings,
      templateViewMode: isSingle ? 'single-page' : 'multi-page'
    });
  };
  
  // حفظ جميع الإعدادات
  const handleDisplaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveDisplaySettingsMutation.mutate(displaySettings);
  };
  
  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إعدادات العرض</h1>
          <p className="text-muted-foreground">
            تخصيص طريقة عرض التطبيق والقوالب
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layout className="ml-2 h-5 w-5" />
              إعدادات العرض
            </CardTitle>
            <CardDescription>
              تخصيص واجهة المستخدم وطريقة عرض القوالب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDisplaySubmit} className="space-y-6">
              {/* نمط عرض التطبيق */}
              <div className="space-y-3">
                <div className="flex flex-col space-y-1.5">
                  <h3 className="text-lg font-semibold">نمط عرض التطبيق</h3>
                  <p className="text-sm text-muted-foreground">اختر نمط عرض التطبيق للمستخدمين</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 flex flex-col space-y-4 items-center">
                    <div className="flex items-center justify-center w-full h-32 bg-muted rounded-md">
                      <LayoutGrid className="h-16 w-16 text-muted-foreground opacity-50" />
                    </div>
                    <h4 className="font-medium">النمط التقليدي (متعدد الصفحات)</h4>
                    <p className="text-sm text-muted-foreground text-center">
                      يتم تقسيم التطبيق إلى صفحات منفصلة
                    </p>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="displayMode-multi"
                        checked={displaySettings.displayMode === 'multi'}
                        onCheckedChange={(checked) => {
                          if (checked) handleDisplayModeChange(false);
                        }}
                      />
                      <label htmlFor="displayMode-multi">تفعيل</label>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex flex-col space-y-4 items-center">
                    <div className="flex items-center justify-center w-full h-32 bg-muted rounded-md">
                      <Layout className="h-16 w-16 text-muted-foreground opacity-50" />
                    </div>
                    <h4 className="font-medium">النمط الموحد (صفحة واحدة)</h4>
                    <p className="text-sm text-muted-foreground text-center">
                      يتم عرض كل شيء في صفحة واحدة
                    </p>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="displayMode-single"
                        checked={displaySettings.displayMode === 'single'}
                        onCheckedChange={(checked) => {
                          if (checked) handleDisplayModeChange(true);
                        }}
                      />
                      <label htmlFor="displayMode-single">تفعيل</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* طريقة عرض القوالب */}
              <div className="space-y-3">
                <div className="flex flex-col space-y-1.5">
                  <h3 className="text-lg font-semibold">طريقة عرض القوالب</h3>
                  <p className="text-sm text-muted-foreground">اختر طريقة عرض صفحة القوالب للمستخدمين</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 flex flex-col space-y-4 items-center">
                    <div className="flex items-center justify-center w-full h-32 bg-muted rounded-md">
                      <LayoutGrid className="h-16 w-16 text-muted-foreground opacity-50" />
                    </div>
                    <h4 className="font-medium">الطريقة التقليدية (متعدد الصفحات)</h4>
                    <p className="text-sm text-muted-foreground text-center">
                      عرض القوالب ونموذج التعبئة والمعاينة في صفحات منفصلة
                    </p>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="templateViewMode-multi"
                        checked={displaySettings.templateViewMode === 'multi-page'}
                        onCheckedChange={(checked) => {
                          if (checked) handleTemplateViewModeChange(false);
                        }}
                      />
                      <label htmlFor="templateViewMode-multi">تفعيل</label>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex flex-col space-y-4 items-center">
                    <div className="flex items-center justify-center w-full h-32 bg-muted rounded-md">
                      <Layout className="h-16 w-16 text-muted-foreground opacity-50" />
                    </div>
                    <h4 className="font-medium">الطريقة الموحدة (صفحة واحدة)</h4>
                    <p className="text-sm text-muted-foreground text-center">
                      عرض القوالب ونموذج التعبئة والمعاينة في صفحة واحدة
                    </p>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="templateViewMode-single"
                        checked={displaySettings.templateViewMode === 'single-page'}
                        onCheckedChange={(checked) => {
                          if (checked) handleTemplateViewModeChange(true);
                        }}
                      />
                      <label htmlFor="templateViewMode-single">تفعيل</label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* زر الحفظ */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={saveDisplaySettingsMutation.isPending}
                  className="min-w-[120px]"
                >
                  {saveDisplaySettingsMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ الإعدادات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}