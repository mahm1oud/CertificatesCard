import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  Save,
  UserCircle,
  KeyRound,
  ShieldAlert,
  BellRing,
  Mail,
  LogOut,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function UserProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newCardNotifications: true,
    marketingNotifications: false,
  });

  // Fetch user stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: getQueryFn({}),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "تم تحديث الملف الشخصي بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل تحديث الملف الشخصي",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PUT", "/api/user/password", data);
      return res.json();
    },
    onSuccess: () => {
      setIsChangePasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast({
        title: "تم تغيير كلمة المرور بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل تغيير كلمة المرور",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (data: typeof notificationSettings) => {
      const res = await apiRequest("PUT", "/api/user/notifications", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث إعدادات الإشعارات بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل تحديث إعدادات الإشعارات",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("DELETE", "/api/user/account", { password });
      return res.json();
    },
    onSuccess: () => {
      logoutMutation.mutate();
      navigate('/');
      toast({
        title: "تم حذف الحساب بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حذف الحساب",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle profile form change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password form change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle notification settings change
  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Handle profile form submit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  // Handle password form submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "كلمات المرور غير متطابقة",
        description: "تأكد من تطابق كلمة المرور الجديدة وتأكيدها",
        variant: "destructive",
      });
      return;
    }
    
    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  // Handle notification settings submit
  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationSettingsMutation.mutate(notificationSettings);
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Loading state
  const isLoading = isStatsLoading || isLoadingStats;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">الملف الشخصي</h1>
          <p className="text-muted-foreground">
            إدارة الملف الشخصي والإعدادات
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
              <CardDescription>
                تحديث معلومات ملفك الشخصي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    name="username"
                    value={profileForm.username}
                    onChange={handleProfileChange}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    لا يمكن تغيير اسم المستخدم
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    placeholder="أدخل بريدك الإلكتروني"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="ml-2 h-4 w-4" />
                        حفظ التغييرات
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الحساب</CardTitle>
              <CardDescription>
                إحصائيات عن نشاطك في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-center space-y-1">
                    <p className="text-sm text-muted-foreground">البطاقات</p>
                    <p className="text-3xl font-bold">{stats?.totalCards || 0}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center space-y-1">
                    <p className="text-sm text-muted-foreground">الشهادات</p>
                    <p className="text-3xl font-bold">{stats?.totalCertificates || 0}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center space-y-1">
                    <p className="text-sm text-muted-foreground">المشاهدات</p>
                    <p className="text-3xl font-bold">{stats?.totalViews || 0}</p>
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  تاريخ الانضمام: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : 'غير متوفر'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  آخر تسجيل دخول: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-SA') : 'غير متوفر'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الأمان</CardTitle>
              <CardDescription>
                إدارة كلمة المرور وإعدادات الأمان
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b">
                <div className="space-y-0.5">
                  <h3 className="font-medium">كلمة المرور</h3>
                  <p className="text-sm text-muted-foreground">
                    تغيير كلمة المرور الخاصة بك
                  </p>
                </div>
                <Button
                  onClick={() => setIsChangePasswordDialogOpen(true)}
                  variant="outline"
                >
                  <KeyRound className="h-4 w-4 ml-2" />
                  تغيير كلمة المرور
                </Button>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b">
                <div className="space-y-0.5">
                  <h3 className="font-medium">جلسات تسجيل الدخول</h3>
                  <p className="text-sm text-muted-foreground">
                    إدارة جلسات تسجيل الدخول الخاصة بك
                  </p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-medium text-destructive">حذف الحساب</h3>
                  <p className="text-sm text-muted-foreground">
                    حذف حسابك وجميع بياناتك نهائياً
                  </p>
                </div>
                <Button
                  onClick={() => setIsDeleteAccountDialogOpen(true)}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف الحساب
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
              <CardDescription>
                تحكم في كيفية تلقي الإشعارات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNotificationSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">إشعارات البريد الإلكتروني</Label>
                      <p className="text-sm text-muted-foreground">
                        تلقي جميع الإشعارات عبر البريد الإلكتروني
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="space-y-0.5">
                      <Label htmlFor="newCardNotifications">إشعارات البطاقات الجديدة</Label>
                      <p className="text-sm text-muted-foreground">
                        إعلامك عندما تقوم بإنشاء بطاقة جديدة
                      </p>
                    </div>
                    <Switch
                      id="newCardNotifications"
                      checked={notificationSettings.newCardNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('newCardNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketingNotifications">إشعارات تسويقية</Label>
                      <p className="text-sm text-muted-foreground">
                        تلقي إشعارات حول العروض والميزات الجديدة
                      </p>
                    </div>
                    <Switch
                      id="marketingNotifications"
                      checked={notificationSettings.marketingNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('marketingNotifications', checked)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateNotificationSettingsMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {updateNotificationSettingsMutation.isPending ? (
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
      </Tabs>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
            <DialogDescription>
              أدخل كلمة المرور الحالية وكلمة المرور الجديدة.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsChangePasswordDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit"
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التغيير...
                  </>
                ) : (
                  "تغيير كلمة المرور"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف الحساب</DialogTitle>
            <DialogDescription>
              هذا الإجراء سيؤدي إلى حذف حسابك وجميع بياناتك نهائياً ولا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium text-destructive">
              تحذير: سيتم حذف جميع البطاقات والشهادات الخاصة بك.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              لتأكيد الحذف، أدخل كلمة المرور الخاصة بك:
            </p>
            <Input
              className="mt-4"
              type="password"
              placeholder="كلمة المرور"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteAccountDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteAccountMutation.mutate(passwordForm.currentPassword)}
              disabled={deleteAccountMutation.isPending || !passwordForm.currentPassword}
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "تأكيد حذف الحساب"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}