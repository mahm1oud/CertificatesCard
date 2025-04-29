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
  Sun,
  Moon,
  Check,
  Save,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

export default function UserPreferencesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState("appearance");
  
  // User preferences
  const [layoutMode, setLayoutMode] = useState<"boxed" | "fluid">("fluid");
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">("system");
  
  // Fetch user preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["/api/user/preferences"],
    queryFn: getQueryFn({}),
    onSuccess: (data) => {
      if (data?.layout) {
        setLayoutMode(data.layout);
      }
      if (data?.theme) {
        setSelectedTheme(data.theme);
        setTheme(data.theme);
      }
    }
  });
  
  // Update preferences mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/user/preferences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/user/preferences"],
      });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ التفضيلات بنجاح",
      });
    },
    onError: (error) => {
      console.error("Error saving preferences:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ التفضيلات",
        variant: "destructive",
      });
    }
  });
  
  // Handle theme change
  const handleThemeChange = (value: string) => {
    setSelectedTheme(value as "light" | "dark" | "system");
    setTheme(value);
  };
  
  // Handle layout change
  const handleLayoutChange = (value: string) => {
    setLayoutMode(value as "boxed" | "fluid");
  };
  
  // Handle save preferences
  const handleSavePreferences = () => {
    mutate({
      layout: layoutMode,
      theme: selectedTheme,
    });
  };
  
  // Reset to defaults
  const handleResetDefaults = () => {
    setLayoutMode("fluid");
    setSelectedTheme("system");
    setTheme("system");
    
    mutate({
      layout: "fluid",
      theme: "system",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">تفضيلات المستخدم</h1>
          <p className="text-muted-foreground">
            قم بتخصيص تجربتك في الموقع
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="appearance">المظهر</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>تخطيط الصفحة</CardTitle>
                  <CardDescription>تحديد نمط تخطيط الصفحة للموقع</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${layoutMode === 'boxed' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleLayoutChange('boxed')}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">تخطيط محدود (Boxed)</h3>
                        {layoutMode === 'boxed' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="bg-muted h-24 rounded-md flex items-center justify-center border-2 border-muted-foreground/20">
                        <div className="w-2/3 h-16 bg-primary/20 rounded"></div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        يعرض المحتوى في عرض ثابت محدود
                      </p>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${layoutMode === 'fluid' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleLayoutChange('fluid')}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">تخطيط مرن (Fluid)</h3>
                        {layoutMode === 'fluid' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="bg-muted h-24 rounded-md flex items-center justify-center border-2 border-muted-foreground/20">
                        <div className="w-11/12 h-16 bg-primary/20 rounded"></div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        يمتد المحتوى ليشغل كامل عرض الشاشة
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>سمة الألوان</CardTitle>
                  <CardDescription>اختر سمة الألوان المفضلة لديك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${selectedTheme === 'light' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">فاتح</h3>
                        {selectedTheme === 'light' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="bg-white h-24 rounded-md flex items-center justify-center border-2 border-muted-foreground/20">
                        <Sun className="h-8 w-8 text-yellow-500" />
                      </div>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${selectedTheme === 'dark' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">داكن</h3>
                        {selectedTheme === 'dark' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="bg-zinc-900 h-24 rounded-md flex items-center justify-center border-2 border-muted-foreground/20">
                        <Moon className="h-8 w-8 text-blue-400" />
                      </div>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 cursor-pointer hover:border-primary transition-colors ${selectedTheme === 'system' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleThemeChange('system')}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">نظام التشغيل</h3>
                        {selectedTheme === 'system' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="bg-gradient-to-r from-white to-zinc-900 h-24 rounded-md flex items-center justify-center border-2 border-muted-foreground/20">
                        <div className="flex gap-2">
                          <Sun className="h-8 w-8 text-yellow-500" />
                          <Moon className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleResetDefaults} disabled={isPending}>
                    <RotateCcw className="h-4 w-4 ml-2" />
                    استعادة الإعدادات الافتراضية
                  </Button>
                  <Button onClick={handleSavePreferences} disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 ml-2" />
                    )}
                    حفظ التفضيلات
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
              <CardDescription>تحكم في كيفية تلقي الإشعارات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <div>
                  <h3 className="font-medium">إشعارات البريد الإلكتروني</h3>
                  <p className="text-sm text-muted-foreground">تلقي إشعارات عبر البريد الإلكتروني</p>
                </div>
                <Switch checked={true} />
              </div>
              
              <div className="flex justify-between items-center py-2">
                <div>
                  <h3 className="font-medium">إشعارات المتصفح</h3>
                  <p className="text-sm text-muted-foreground">تلقي إشعارات داخل المتصفح</p>
                </div>
                <Switch checked={true} />
              </div>
              
              <div className="flex justify-between items-center py-2">
                <div>
                  <h3 className="font-medium">تنبيهات الأمان</h3>
                  <p className="text-sm text-muted-foreground">إعلامك بالأنشطة المشبوهة والتغييرات في الحساب</p>
                </div>
                <Switch checked={true} />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">حفظ إعدادات الإشعارات</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}