import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Save,
  Mail,
  Key,
  Shield,
  UserCog,
  Clock,
  Server,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminAuthSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Authentication Settings
  const [authSettings, setAuthSettings] = useState({
    // Authentication Options
    enableRegistration: true,
    requireEmailVerification: true,
    allowPasswordReset: true,

    // Session Settings
    sessionTimeout: 86400, // 24 hours in seconds
    rememberMeDuration: 30, // 30 days

    // Password Settings
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpirationDays: 90, // 0 = never expire
    passwordHistory: 3, // 0 = no history check

    // SMTP Settings
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "نظام الشهادات",
    smtpSecure: true,
  });

  // Fetch authentication settings
  const { isLoading } = useQuery({
    queryKey: ["/api/admin/settings/auth"],
    queryFn: getQueryFn({}),
    onSuccess: (data) => {
      if (data && data.settings) {
        setAuthSettings((prev) => ({
          ...prev,
          ...data.settings,
        }));
      }
    },
    onError: (error) => {
      console.error("Error fetching auth settings:", error);
      toast({
        title: "خطأ في جلب الإعدادات",
        description: "حدث خطأ أثناء جلب إعدادات المصادقة",
        variant: "destructive",
      });
    },
  });

  // Save authentication settings
  const saveAuthSettingsMutation = useMutation({
    mutationFn: async (settings: typeof authSettings) => {
      return await apiRequest("/api/admin/settings/auth", {
        method: "POST",
        body: { settings },
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ إعدادات المصادقة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/auth"] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء حفظ إعدادات المصادقة",
        variant: "destructive",
      });
      console.error("Error saving auth settings:", error);
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    saveAuthSettingsMutation.mutate(authSettings, {
      onSettled: () => {
        setIsSaving(false);
      },
    });
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setAuthSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? parseFloat(value)
            : value,
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إعدادات المصادقة</h1>
          <p className="text-muted-foreground">
            إدارة إعدادات تسجيل الدخول وكلمات المرور وجلسات المستخدمين
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid grid-cols-1 md:grid-cols-4">
              <TabsTrigger value="general">
                <UserCog className="ml-2 h-4 w-4" />
                إعدادات عامة
              </TabsTrigger>
              <TabsTrigger value="password">
                <Key className="ml-2 h-4 w-4" />
                كلمات المرور
              </TabsTrigger>
              <TabsTrigger value="session">
                <Clock className="ml-2 h-4 w-4" />
                الجلسات
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="ml-2 h-4 w-4" />
                إعدادات البريد الإلكتروني
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCog className="ml-2 h-5 w-5" />
                    إعدادات التسجيل والمصادقة
                  </CardTitle>
                  <CardDescription>
                    تكوين خيارات التسجيل وتسجيل الدخول
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="enableRegistration"
                      name="enableRegistration"
                      checked={authSettings.enableRegistration}
                      onCheckedChange={(checked) => {
                        setAuthSettings((prev) => ({
                          ...prev,
                          enableRegistration: checked,
                        }));
                      }}
                    />
                    <Label htmlFor="enableRegistration">
                      السماح بتسجيل مستخدمين جدد
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="requireEmailVerification"
                      name="requireEmailVerification"
                      checked={authSettings.requireEmailVerification}
                      onCheckedChange={(checked) => {
                        setAuthSettings((prev) => ({
                          ...prev,
                          requireEmailVerification: checked,
                        }));
                      }}
                    />
                    <Label htmlFor="requireEmailVerification">
                      طلب تأكيد البريد الإلكتروني
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="allowPasswordReset"
                      name="allowPasswordReset"
                      checked={authSettings.allowPasswordReset}
                      onCheckedChange={(checked) => {
                        setAuthSettings((prev) => ({
                          ...prev,
                          allowPasswordReset: checked,
                        }));
                      }}
                    />
                    <Label htmlFor="allowPasswordReset">
                      السماح بإعادة تعيين كلمة المرور
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="ml-2 h-5 w-5" />
                    إعدادات كلمات المرور
                  </CardTitle>
                  <CardDescription>
                    تكوين متطلبات كلمة المرور وسياسات الأمان
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPasswordLength">
                      الحد الأدنى لطول كلمة المرور
                    </Label>
                    <Input
                      id="minPasswordLength"
                      name="minPasswordLength"
                      type="number"
                      min="6"
                      max="32"
                      value={authSettings.minPasswordLength}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="requireUppercase"
                        name="requireUppercase"
                        checked={authSettings.requireUppercase}
                        onCheckedChange={(checked) => {
                          setAuthSettings((prev) => ({
                            ...prev,
                            requireUppercase: checked,
                          }));
                        }}
                      />
                      <Label htmlFor="requireUppercase">
                        تتطلب أحرفاً كبيرة
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="requireLowercase"
                        name="requireLowercase"
                        checked={authSettings.requireLowercase}
                        onCheckedChange={(checked) => {
                          setAuthSettings((prev) => ({
                            ...prev,
                            requireLowercase: checked,
                          }));
                        }}
                      />
                      <Label htmlFor="requireLowercase">
                        تتطلب أحرفاً صغيرة
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="requireNumbers"
                        name="requireNumbers"
                        checked={authSettings.requireNumbers}
                        onCheckedChange={(checked) => {
                          setAuthSettings((prev) => ({
                            ...prev,
                            requireNumbers: checked,
                          }));
                        }}
                      />
                      <Label htmlFor="requireNumbers">تتطلب أرقام</Label>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="requireSpecialChars"
                        name="requireSpecialChars"
                        checked={authSettings.requireSpecialChars}
                        onCheckedChange={(checked) => {
                          setAuthSettings((prev) => ({
                            ...prev,
                            requireSpecialChars: checked,
                          }));
                        }}
                      />
                      <Label htmlFor="requireSpecialChars">
                        تتطلب رموز خاصة
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="passwordExpirationDays">
                        عدد أيام انتهاء صلاحية كلمات المرور (0 = لا تنتهي)
                      </Label>
                      <Input
                        id="passwordExpirationDays"
                        name="passwordExpirationDays"
                        type="number"
                        min="0"
                        value={authSettings.passwordExpirationDays}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordHistory">
                        عدد كلمات المرور السابقة التي لا يمكن إعادة استخدامها (0
                        = غير محدود)
                      </Label>
                      <Input
                        id="passwordHistory"
                        name="passwordHistory"
                        type="number"
                        min="0"
                        value={authSettings.passwordHistory}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="session" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="ml-2 h-5 w-5" />
                    إعدادات الجلسات
                  </CardTitle>
                  <CardDescription>
                    تكوين فترات الجلسات وخيارات "تذكرني"
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">
                        مدة الجلسة بالثواني (الافتراضي: 86400 - 24 ساعة)
                      </Label>
                      <Input
                        id="sessionTimeout"
                        name="sessionTimeout"
                        type="number"
                        min="300"
                        value={authSettings.sessionTimeout}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rememberMeDuration">
                        مدة "تذكرني" بالأيام
                      </Label>
                      <Input
                        id="rememberMeDuration"
                        name="rememberMeDuration"
                        type="number"
                        min="1"
                        value={authSettings.rememberMeDuration}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="ml-2 h-5 w-5" />
                    إعدادات خادم البريد الإلكتروني (SMTP)
                  </CardTitle>
                  <CardDescription>
                    تكوين خادم SMTP لإرسال رسائل البريد الإلكتروني للتحقق وإعادة
                    تعيين كلمة المرور
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">خادم SMTP</Label>
                      <Input
                        id="smtpHost"
                        name="smtpHost"
                        value={authSettings.smtpHost}
                        onChange={handleInputChange}
                        placeholder="smtp.example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">منفذ SMTP</Label>
                      <Input
                        id="smtpPort"
                        name="smtpPort"
                        type="number"
                        value={authSettings.smtpPort}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">اسم المستخدم</Label>
                      <Input
                        id="smtpUsername"
                        name="smtpUsername"
                        value={authSettings.smtpUsername}
                        onChange={handleInputChange}
                        placeholder="user@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">كلمة المرور</Label>
                      <Input
                        id="smtpPassword"
                        name="smtpPassword"
                        type="password"
                        value={authSettings.smtpPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpFromEmail">
                        البريد الإلكتروني المرسل
                      </Label>
                      <Input
                        id="smtpFromEmail"
                        name="smtpFromEmail"
                        value={authSettings.smtpFromEmail}
                        onChange={handleInputChange}
                        placeholder="noreply@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpFromName">اسم المرسل</Label>
                      <Input
                        id="smtpFromName"
                        name="smtpFromName"
                        value={authSettings.smtpFromName}
                        onChange={handleInputChange}
                        placeholder="نظام الشهادات"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="smtpSecure"
                      name="smtpSecure"
                      checked={authSettings.smtpSecure}
                      onCheckedChange={(checked) => {
                        setAuthSettings((prev) => ({
                          ...prev,
                          smtpSecure: checked,
                        }));
                      }}
                    />
                    <Label htmlFor="smtpSecure">
                      استخدام اتصال آمن (SSL/TLS)
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving || saveAuthSettingsMutation.isPending}
              className="min-w-[120px]"
            >
              {isSaving || saveAuthSettingsMutation.isPending ? (
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
      )}
    </div>
  );
}
