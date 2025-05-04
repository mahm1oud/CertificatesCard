import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient-updated";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2,
  Settings,
  Mail,
  Upload,
  FileImage,
  Server,
  Save,
  FileUp,
  RefreshCw,
  HardDrive,
  Clock,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Layout, LayoutGrid, Palette } from "lucide-react";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isPurgingUploads, setIsPurgingUploads] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  // Fetch system settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: getQueryFn({}),
  });
  
  // جلب إعدادات العرض من المسار الموحد
  const { data: displayData, isLoading: isDisplayLoading } = useQuery({
    queryKey: ["/api/display-settings"],
    queryFn: getQueryFn({}),
  });
  
  // حفظ إعدادات العرض باستخدام المسار الموحد
  const saveDisplaySettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/display-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/display-settings"] });
      toast({
        title: "تم حفظ إعدادات العرض بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حفظ إعدادات العرض",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save general settings mutation
  const saveGeneralSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/admin/settings/general", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "تم حفظ الإعدادات العامة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حفظ الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save email settings mutation
  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/admin/settings/email", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "تم حفظ إعدادات البريد الإلكتروني بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حفظ إعدادات البريد الإلكتروني",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save storage settings mutation
  const saveStorageSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/admin/settings/storage", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "تم حفظ إعدادات التخزين بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حفظ إعدادات التخزين",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save security settings mutation
  const saveSecuritySettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/admin/settings/security", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "تم حفظ إعدادات الأمان بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حفظ إعدادات الأمان",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/maintenance/clear-cache");
    },
    onSuccess: () => {
      toast({
        title: "تم مسح ذاكرة التخزين المؤقت بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل مسح ذاكرة التخزين المؤقت",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Purge uploads mutation
  const purgeUploadsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/maintenance/purge-uploads");
    },
    onSuccess: () => {
      toast({
        title: "تم تنظيف الملفات المرفوعة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل تنظيف الملفات المرفوعة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Restart server mutation
  const restartServerMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/maintenance/restart-server");
    },
    onSuccess: () => {
      toast({
        title: "تم إعادة تشغيل الخادم بنجاح",
        description: "قد يستغرق الاتصال بالخادم بضع دقائق",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل إعادة تشغيل الخادم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Testing email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/admin/settings/test-email", { email });
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال بريد إلكتروني تجريبي بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل إرسال البريد الإلكتروني التجريبي",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // إعدادات العرض
  const [displaySettings, setDisplaySettings] = useState<Record<string, any>>({
    displayMode: "multi",
    templateViewMode: "multi-page",
    enableSocialFormats: true,
    defaultSocialFormat: "instagram"
  });
  
  // Form states
  const [generalSettings, setGeneralSettings] = useState<Record<string, any>>({
    siteName: "",
    siteDescription: "",
    siteUrl: "",
    defaultLanguage: "ar",
    enableUserRegistration: true,
    enableGuestCards: true,
    autoDeleteDraftCards: false,
    autoDeleteDraftCardsDays: 30,
    cardQualityLevels: ""
  });

  const [emailSettings, setEmailSettings] = useState<Record<string, any>>({
    emailSender: "",
    emailReplyTo: "",
    emailTemplateDir: "",
    sendgridApiKey: "",
    enableEmailNotifications: true,
    emailNotifyOnNewUser: true,
    emailNotifyOnNewCard: false,
    emailNotifyOnNewCertificate: true,
    emailFooterText: ""
  });

  const [storageSettings, setStorageSettings] = useState<Record<string, any>>({
    storageType: "local",
    localStoragePath: "/uploads",
    s3Bucket: "",
    s3Region: "",
    s3AccessKey: "",
    s3SecretKey: "",
    imageCacheTime: 7,
    maxUploadSize: 5,
    allowedFileTypes: ""
  });

  const [securitySettings, setSecuritySettings] = useState<Record<string, any>>({
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    enableRecaptcha: false,
    recaptchaSiteKey: "",
    recaptchaSecretKey: "",
    ipBlockingEnabled: true,
    ipBlockingThreshold: 10,
    ipBlockingTime: 30
  });

  // التعامل مع إعدادات العرض
  const handleDisplaySettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setDisplaySettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  // حفظ إعدادات العرض
  const handleDisplaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting display settings:', displaySettings);
    saveDisplaySettingsMutation.mutate(displaySettings);
  };
  
  // التبديل بين أوضاع عرض القوالب
  const handleTemplateViewModeChange = (checked: boolean) => {
    setDisplaySettings(prev => ({
      ...prev,
      templateViewMode: checked ? 'single-page' : 'multi-page'
    }));
  };
  
  // Update form when settings are loaded
  useEffect(() => {
    if (!isLoading && settings) {
      if (settings.general) {
        setGeneralSettings(settings.general);
      }
      if (settings.email) {
        setEmailSettings(settings.email);
      }
      if (settings.storage) {
        setStorageSettings(settings.storage);
      }
      if (settings.security) {
        setSecuritySettings(settings.security);
      }
    }
    
    // تحديث إعدادات العرض
    if (!isDisplayLoading && displayData && displayData.settings) {
      setDisplaySettings(displayData.settings);
    }
  }, [isLoading, settings, isDisplayLoading, displayData]);

  // Handle form input change
  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleEmailSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setEmailSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleStorageSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setStorageSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSecuritySettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Handle form switch change
  const handleSwitchChange = (checked: boolean, settingsType: string, name: string) => {
    if (settingsType === 'general') {
      setGeneralSettings(prev => ({ ...prev, [name]: checked }));
    } else if (settingsType === 'email') {
      setEmailSettings(prev => ({ ...prev, [name]: checked }));
    } else if (settingsType === 'storage') {
      setStorageSettings(prev => ({ ...prev, [name]: checked }));
    } else if (settingsType === 'security') {
      setSecuritySettings(prev => ({ ...prev, [name]: checked }));
    }
  };

  // Handle form submit
  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeneralSettingsMutation.mutate(generalSettings);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailSettingsMutation.mutate(emailSettings);
  };

  const handleStorageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveStorageSettingsMutation.mutate(storageSettings);
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSecuritySettingsMutation.mutate(securitySettings);
  };

  // Show confirmation dialog
  const showConfirmation = (title: string, description: string, action: () => void) => {
    setConfirmAction({
      title,
      description,
      action
    });
    setIsConfirmDialogOpen(true);
  };

  // Handle restart server
  const handleRestartServer = () => {
    showConfirmation(
      "إعادة تشغيل الخادم",
      "سيؤدي إعادة تشغيل الخادم إلى قطع الاتصال بجميع المستخدمين. هل أنت متأكد من رغبتك في المتابعة؟",
      () => {
        setIsRestarting(true);
        restartServerMutation.mutate(undefined, {
          onSettled: () => setIsRestarting(false)
        });
      }
    );
  };

  // Handle clear cache
  const handleClearCache = () => {
    showConfirmation(
      "مسح ذاكرة التخزين المؤقت",
      "سيؤدي مسح ذاكرة التخزين المؤقت إلى إعادة تحميل جميع الملفات والبيانات. هل أنت متأكد من رغبتك في المتابعة؟",
      () => {
        setIsClearingCache(true);
        clearCacheMutation.mutate(undefined, {
          onSettled: () => setIsClearingCache(false)
        });
      }
    );
  };

  // Handle purge uploads
  const handlePurgeUploads = () => {
    showConfirmation(
      "تنظيف الملفات المرفوعة",
      "سيؤدي تنظيف الملفات المرفوعة إلى حذف جميع الملفات غير المستخدمة. هل أنت متأكد من رغبتك في المتابعة؟",
      () => {
        setIsPurgingUploads(true);
        purgeUploadsMutation.mutate(undefined, {
          onSettled: () => setIsPurgingUploads(false)
        });
      }
    );
  };

  // Handle test email
  const handleTestEmail = () => {
    const email = emailSettings.emailSender || 'test@example.com';
    testEmailMutation.mutate(email);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إعدادات النظام</h1>
          <p className="text-muted-foreground">
            إدارة إعدادات وتكوين النظام
          </p>
        </div>
      </div>

      <Tabs 
        defaultValue="general" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="display">العرض</TabsTrigger>
          <TabsTrigger value="email">البريد الإلكتروني</TabsTrigger>
          <TabsTrigger value="storage">التخزين</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
              <CardDescription>
                إعدادات عامة للنظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGeneralSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">اسم الموقع</Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={generalSettings.siteName}
                      onChange={handleGeneralSettingsChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">رابط الموقع</Label>
                    <Input
                      id="siteUrl"
                      name="siteUrl"
                      value={generalSettings.siteUrl}
                      onChange={handleGeneralSettingsChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">وصف الموقع</Label>
                  <Textarea
                    id="siteDescription"
                    name="siteDescription"
                    rows={3}
                    value={generalSettings.siteDescription}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">اللغة الافتراضية</Label>
                    <select
                      id="defaultLanguage"
                      name="defaultLanguage"
                      value={generalSettings.defaultLanguage}
                      onChange={handleGeneralSettingsChange}
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="autoDeleteDraftCardsDays">أيام الاحتفاظ بالمسودات</Label>
                    <Input
                      id="autoDeleteDraftCardsDays"
                      name="autoDeleteDraftCardsDays"
                      type="number"
                      min="1"
                      max="365"
                      value={generalSettings.autoDeleteDraftCardsDays}
                      onChange={handleGeneralSettingsChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardQualityLevels">مستويات جودة البطاقات (مفصولة بفواصل)</Label>
                  <Input
                    id="cardQualityLevels"
                    name="cardQualityLevels"
                    value={generalSettings.cardQualityLevels}
                    onChange={handleGeneralSettingsChange}
                    placeholder="low,medium,high"
                  />
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="enableUserRegistration"
                      checked={generalSettings.enableUserRegistration}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'general', 'enableUserRegistration')}
                    />
                    <Label htmlFor="enableUserRegistration">تفعيل تسجيل المستخدمين</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="enableGuestCards"
                      checked={generalSettings.enableGuestCards}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'general', 'enableGuestCards')}
                    />
                    <Label htmlFor="enableGuestCards">تفعيل بطاقات الزوار</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="autoDeleteDraftCards"
                      checked={generalSettings.autoDeleteDraftCards}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'general', 'autoDeleteDraftCards')}
                    />
                    <Label htmlFor="autoDeleteDraftCards">حذف المسودات تلقائياً</Label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saveGeneralSettingsMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {saveGeneralSettingsMutation.isPending ? (
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
        </TabsContent>
        
        <TabsContent value="display" className="space-y-4">
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
                            if (checked) {
                              setDisplaySettings(prev => ({ ...prev, displayMode: 'multi' }));
                            }
                          }}
                        />
                        <Label htmlFor="displayMode-multi">تفعيل</Label>
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
                            if (checked) {
                              setDisplaySettings(prev => ({ ...prev, displayMode: 'single' }));
                            }
                          }}
                        />
                        <Label htmlFor="displayMode-single">تفعيل</Label>
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
                        <Label htmlFor="templateViewMode-multi">تفعيل</Label>
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
                        <Label htmlFor="templateViewMode-single">تفعيل</Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* إعدادات تنسيقات وسائل التواصل الاجتماعي */}
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1.5">
                    <h3 className="text-lg font-semibold">إعدادات التنسيقات الاجتماعية</h3>
                    <p className="text-sm text-muted-foreground">إعدادات تصدير البطاقات لوسائل التواصل الاجتماعي</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="enableSocialFormats"
                      checked={displaySettings.enableSocialFormats}
                      onCheckedChange={(checked) => {
                        setDisplaySettings(prev => ({ ...prev, enableSocialFormats: checked }));
                      }}
                    />
                    <Label htmlFor="enableSocialFormats">تفعيل تنسيقات وسائل التواصل الاجتماعي</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultSocialFormat">التنسيق الافتراضي</Label>
                    <select
                      id="defaultSocialFormat"
                      name="defaultSocialFormat"
                      value={displaySettings.defaultSocialFormat}
                      onChange={handleDisplaySettingsChange}
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background"
                    >
                      <option value="instagram">Instagram (1:1)</option>
                      <option value="story">Instagram Story (9:16)</option>
                      <option value="facebook">Facebook (16:9)</option>
                      <option value="twitter">Twitter (16:9)</option>
                    </select>
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
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات البريد الإلكتروني</CardTitle>
              <CardDescription>
                تكوين خدمة البريد الإلكتروني والإشعارات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailSender">البريد الإلكتروني للمرسل</Label>
                    <Input
                      id="emailSender"
                      name="emailSender"
                      type="email"
                      value={emailSettings.emailSender}
                      onChange={handleEmailSettingsChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailReplyTo">البريد الإلكتروني للرد</Label>
                    <Input
                      id="emailReplyTo"
                      name="emailReplyTo"
                      type="email"
                      value={emailSettings.emailReplyTo}
                      onChange={handleEmailSettingsChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailTemplateDir">مسار قوالب البريد الإلكتروني</Label>
                  <Input
                    id="emailTemplateDir"
                    name="emailTemplateDir"
                    value={emailSettings.emailTemplateDir}
                    onChange={handleEmailSettingsChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendgridApiKey">مفتاح API لـ SendGrid</Label>
                  <Input
                    id="sendgridApiKey"
                    name="sendgridApiKey"
                    type="password"
                    value={emailSettings.sendgridApiKey}
                    onChange={handleEmailSettingsChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFooterText">نص تذييل البريد الإلكتروني</Label>
                  <Textarea
                    id="emailFooterText"
                    name="emailFooterText"
                    rows={3}
                    value={emailSettings.emailFooterText}
                    onChange={handleEmailSettingsChange}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="enableEmailNotifications"
                      checked={emailSettings.enableEmailNotifications}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'email', 'enableEmailNotifications')}
                    />
                    <Label htmlFor="enableEmailNotifications">تفعيل إشعارات البريد الإلكتروني</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="emailNotifyOnNewUser"
                      checked={emailSettings.emailNotifyOnNewUser}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'email', 'emailNotifyOnNewUser')}
                    />
                    <Label htmlFor="emailNotifyOnNewUser">إشعار عند تسجيل مستخدم جديد</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="emailNotifyOnNewCard"
                      checked={emailSettings.emailNotifyOnNewCard}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'email', 'emailNotifyOnNewCard')}
                    />
                    <Label htmlFor="emailNotifyOnNewCard">إشعار عند إنشاء بطاقة جديدة</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="emailNotifyOnNewCertificate"
                      checked={emailSettings.emailNotifyOnNewCertificate}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'email', 'emailNotifyOnNewCertificate')}
                    />
                    <Label htmlFor="emailNotifyOnNewCertificate">إشعار عند إصدار شهادة جديدة</Label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={testEmailMutation.isPending}
                  >
                    {testEmailMutation.isPending ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Mail className="ml-2 h-4 w-4" />
                        اختبار الإرسال
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={saveEmailSettingsMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {saveEmailSettingsMutation.isPending ? (
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
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التخزين</CardTitle>
              <CardDescription>
                تكوين خيارات تخزين الملفات والصور
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStorageSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storageType">نوع التخزين</Label>
                  <select
                    id="storageType"
                    name="storageType"
                    value={storageSettings.storageType}
                    onChange={handleStorageSettingsChange}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background"
                  >
                    <option value="local">Local Storage</option>
                    <option value="s3">Amazon S3</option>
                  </select>
                </div>

                {storageSettings.storageType === 'local' ? (
                  <div className="space-y-2">
                    <Label htmlFor="localStoragePath">مسار التخزين المحلي</Label>
                    <Input
                      id="localStoragePath"
                      name="localStoragePath"
                      value={storageSettings.localStoragePath}
                      onChange={handleStorageSettingsChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="s3Bucket">S3 Bucket</Label>
                        <Input
                          id="s3Bucket"
                          name="s3Bucket"
                          value={storageSettings.s3Bucket}
                          onChange={handleStorageSettingsChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="s3Region">S3 Region</Label>
                        <Input
                          id="s3Region"
                          name="s3Region"
                          value={storageSettings.s3Region}
                          onChange={handleStorageSettingsChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="s3AccessKey">S3 Access Key</Label>
                        <Input
                          id="s3AccessKey"
                          name="s3AccessKey"
                          value={storageSettings.s3AccessKey}
                          onChange={handleStorageSettingsChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="s3SecretKey">S3 Secret Key</Label>
                        <Input
                          id="s3SecretKey"
                          name="s3SecretKey"
                          type="password"
                          value={storageSettings.s3SecretKey}
                          onChange={handleStorageSettingsChange}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUploadSize">الحد الأقصى لحجم الملف (ميجابايت)</Label>
                    <Input
                      id="maxUploadSize"
                      name="maxUploadSize"
                      type="number"
                      min="1"
                      max="100"
                      value={storageSettings.maxUploadSize}
                      onChange={handleStorageSettingsChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="imageCacheTime">مدة تخزين الصور مؤقتاً (أيام)</Label>
                    <Input
                      id="imageCacheTime"
                      name="imageCacheTime"
                      type="number"
                      min="1"
                      max="365"
                      value={storageSettings.imageCacheTime}
                      onChange={handleStorageSettingsChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedFileTypes">أنواع الملفات المسموح بها (مفصولة بفواصل)</Label>
                  <Input
                    id="allowedFileTypes"
                    name="allowedFileTypes"
                    value={storageSettings.allowedFileTypes}
                    onChange={handleStorageSettingsChange}
                    placeholder="png,jpg,jpeg,gif,webp"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saveStorageSettingsMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {saveStorageSettingsMutation.isPending ? (
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
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأمان</CardTitle>
              <CardDescription>
                تكوين خيارات الأمان والحماية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecuritySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">مدة الجلسة (ساعات)</Label>
                    <Input
                      id="sessionTimeout"
                      name="sessionTimeout"
                      type="number"
                      min="1"
                      max="720"
                      value={securitySettings.sessionTimeout}
                      onChange={handleSecuritySettingsChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">الحد الأقصى لمحاولات تسجيل الدخول</Label>
                    <Input
                      id="maxLoginAttempts"
                      name="maxLoginAttempts"
                      type="number"
                      min="1"
                      max="100"
                      value={securitySettings.maxLoginAttempts}
                      onChange={handleSecuritySettingsChange}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <Switch
                    id="enableRecaptcha"
                    checked={securitySettings.enableRecaptcha}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'security', 'enableRecaptcha')}
                  />
                  <Label htmlFor="enableRecaptcha">تفعيل reCAPTCHA</Label>
                </div>

                {securitySettings.enableRecaptcha && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recaptchaSiteKey">رمز الموقع (Site Key)</Label>
                      <Input
                        id="recaptchaSiteKey"
                        name="recaptchaSiteKey"
                        value={securitySettings.recaptchaSiteKey}
                        onChange={handleSecuritySettingsChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="recaptchaSecretKey">الرمز السري (Secret Key)</Label>
                      <Input
                        id="recaptchaSecretKey"
                        name="recaptchaSecretKey"
                        type="password"
                        value={securitySettings.recaptchaSecretKey}
                        onChange={handleSecuritySettingsChange}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <Switch
                    id="ipBlockingEnabled"
                    checked={securitySettings.ipBlockingEnabled}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'security', 'ipBlockingEnabled')}
                  />
                  <Label htmlFor="ipBlockingEnabled">تفعيل حظر عناوين IP</Label>
                </div>

                {securitySettings.ipBlockingEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ipBlockingThreshold">عتبة المحاولات للحظر</Label>
                      <Input
                        id="ipBlockingThreshold"
                        name="ipBlockingThreshold"
                        type="number"
                        min="1"
                        max="100"
                        value={securitySettings.ipBlockingThreshold}
                        onChange={handleSecuritySettingsChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ipBlockingTime">مدة الحظر (دقائق)</Label>
                      <Input
                        id="ipBlockingTime"
                        name="ipBlockingTime"
                        type="number"
                        min="1"
                        max="1440"
                        value={securitySettings.ipBlockingTime}
                        onChange={handleSecuritySettingsChange}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saveSecuritySettingsMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {saveSecuritySettingsMutation.isPending ? (
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
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أدوات الصيانة</CardTitle>
              <CardDescription>
                أدوات لصيانة وإدارة النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">إعادة تشغيل الخادم</CardTitle>
                    <CardDescription>
                      إعادة تشغيل خادم التطبيق
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      استخدم هذا الخيار لإعادة تشغيل الخادم في حالة وجود مشاكل. سيؤدي ذلك إلى قطع الاتصال بجميع المستخدمين.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleRestartServer}
                      disabled={isRestarting}
                      className="w-full"
                    >
                      {isRestarting ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري إعادة التشغيل...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="ml-2 h-4 w-4" />
                          إعادة تشغيل الخادم
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">مسح ذاكرة التخزين المؤقت</CardTitle>
                    <CardDescription>
                      مسح ملفات التخزين المؤقت للنظام
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      استخدم هذا الخيار لمسح ذاكرة التخزين المؤقت في حالة وجود مشاكل في عرض الملفات أو البيانات.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleClearCache}
                      disabled={isClearingCache}
                      className="w-full"
                    >
                      {isClearingCache ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري المسح...
                        </>
                      ) : (
                        <>
                          <HardDrive className="ml-2 h-4 w-4" />
                          مسح ذاكرة التخزين المؤقت
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">تنظيف الملفات المرفوعة</CardTitle>
                    <CardDescription>
                      حذف الملفات المرفوعة غير المستخدمة
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      استخدم هذا الخيار لتنظيف مساحة التخزين عن طريق حذف الملفات المرفوعة غير المستخدمة.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handlePurgeUploads}
                      disabled={isPurgingUploads}
                      className="w-full"
                    >
                      {isPurgingUploads ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري التنظيف...
                        </>
                      ) : (
                        <>
                          <FileUp className="ml-2 h-4 w-4" />
                          تنظيف الملفات المرفوعة
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">معلومات النظام</CardTitle>
                    <CardDescription>
                      معلومات عن حالة النظام
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">إصدار النظام:</span>
                        <span className="text-sm font-medium">1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">آخر تحديث:</span>
                        <span className="text-sm font-medium">
                          {new Date().toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">مساحة التخزين:</span>
                        <span className="text-sm font-medium">
                          {storageSettings.storageType === 'local' ? '5.2 GB / 10 GB' : 'S3 Storage'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">حالة الخادم:</span>
                        <span className="text-sm font-medium text-green-600">نشط</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>سجل الأحداث</CardTitle>
              <CardDescription>
                سجل بآخر أحداث النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md h-[300px] overflow-auto font-mono text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-blue-600">[2023-04-23 12:34:56]</span>{" "}
                    <span className="text-green-600">[INFO]</span> النظام يعمل بشكل طبيعي
                  </div>
                  <div>
                    <span className="text-blue-600">[2023-04-23 12:30:22]</span>{" "}
                    <span className="text-yellow-600">[WARN]</span> استخدام الذاكرة مرتفع (75%)
                  </div>
                  <div>
                    <span className="text-blue-600">[2023-04-23 12:15:43]</span>{" "}
                    <span className="text-green-600">[INFO]</span> تم إنشاء نسخة احتياطية بنجاح
                  </div>
                  <div>
                    <span className="text-blue-600">[2023-04-23 11:54:12]</span>{" "}
                    <span className="text-green-600">[INFO]</span> تم تسجيل مستخدم جديد (user@example.com)
                  </div>
                  <div>
                    <span className="text-blue-600">[2023-04-23 11:23:45]</span>{" "}
                    <span className="text-red-600">[ERROR]</span> فشل في الاتصال بخدمة البريد الإلكتروني
                  </div>
                  <div>
                    <span className="text-blue-600">[2023-04-23 10:45:33]</span>{" "}
                    <span className="text-green-600">[INFO]</span> تم تحديث إعدادات النظام
                  </div>
                  <div>
                    <span className="text-blue-600">[2023-04-23 10:30:21]</span>{" "}
                    <span className="text-green-600">[INFO]</span> تم بدء تشغيل النظام
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction?.title}</DialogTitle>
            <DialogDescription>
              {confirmAction?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (confirmAction?.action) {
                  confirmAction.action();
                }
                setIsConfirmDialogOpen(false);
              }}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}