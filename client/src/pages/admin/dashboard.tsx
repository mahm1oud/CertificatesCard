import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2,
  FileImage,
  Award,
  Users,
  Layers,
  BarChart3,
  Server,
  Activity,
  LineChart,
  PieChart,
  CalendarDays,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  Layout,
  Settings,
  Save,
  Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
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

  // Fetch admin stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: getQueryFn({}),
  });

  // Fetch recent users
  const { data: recentUsers, isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/admin/users/recent"],
    queryFn: getQueryFn({}),
  });

  // Fetch recent cards
  const { data: recentCards, isLoading: isCardsLoading } = useQuery({
    queryKey: ["/api/admin/cards/recent"],
    queryFn: getQueryFn({}),
  });

  // Fetch recent certificates
  const { data: recentCertificates, isLoading: isCertificatesLoading } = useQuery({
    queryKey: ["/api/admin/certificates/recent"],
    queryFn: getQueryFn({}),
  });

  // استخدام المسار الموحد لجلب إعدادات العرض
  useEffect(() => {
    async function fetchDisplaySettings() {
      try {
        const data = await apiRequest('GET', '/api/display-settings');
        setDisplaySettings(data.settings || {
          displayMode: "multi",
          templateViewMode: "multi-page",
          enableSocialFormats: true,
          defaultSocialFormat: "instagram"
        });
      } catch (error) {
        console.error('Error fetching display settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    
    fetchDisplaySettings();
  }, []);

  // حفظ إعدادات العرض باستخدام المسار الموحد
  const saveDisplaySettingsMutation = useMutation({
    mutationFn: async (settings: typeof displaySettings) => {
      return await apiRequest('POST', '/api/display-settings', settings);
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

  // Handle display mode change
  const handleDisplayModeChange = (isSingle: boolean) => {
    setDisplaySettings(prev => ({
      ...prev,
      displayMode: isSingle ? 'single' : 'multi'
    }));
    
    // Save changes immediately
    saveDisplaySettingsMutation.mutate({
      ...displaySettings,
      displayMode: isSingle ? 'single' : 'multi'
    });
  };

  // Handle template view mode change
  const handleTemplateViewModeChange = (isSingle: boolean) => {
    setDisplaySettings(prev => ({
      ...prev,
      templateViewMode: isSingle ? 'single-page' : 'multi-page'
    }));
    
    // Save changes immediately
    saveDisplaySettingsMutation.mutate({
      ...displaySettings,
      templateViewMode: isSingle ? 'single-page' : 'multi-page'
    });
  };

  // Get loading state
  const isLoading = isStatsLoading || isUsersLoading || isCardsLoading || isCertificatesLoading || isLoadingSettings;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">
            مرحباً {user?.name || user?.username}، مرحباً بك في لوحة تحكم المدير
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="activity">النشاط</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* إعدادات سريعة */}
                <Card className="lg:col-span-4">
                  <CardHeader className="pb-3">
                    <CardTitle>إعدادات سريعة</CardTitle>
                    <CardDescription>تحكم سريع في الإعدادات الأكثر استخداماً</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {/* طريقة عرض التطبيق */}
                      <div className="space-y-3">
                        <h3 className="text-base font-medium">طريقة عرض التطبيق</h3>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="text-sm">نمط العرض الموحد (صفحة واحدة)</div>
                            <div className="text-xs text-muted-foreground">عرض كل شيء في صفحة واحدة</div>
                          </div>
                          <Switch
                            checked={displaySettings.displayMode === 'single'}
                            onCheckedChange={(checked) => handleDisplayModeChange(checked)}
                          />
                        </div>
                      </div>

                      {/* طريقة عرض القوالب */}
                      <div className="space-y-3">
                        <h3 className="text-base font-medium">طريقة عرض القوالب</h3>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="text-sm">القوالب في صفحة واحدة</div>
                            <div className="text-xs text-muted-foreground">عرض القوالب في صفحة واحدة</div>
                          </div>
                          <Switch
                            checked={displaySettings.templateViewMode === 'single-page'}
                            onCheckedChange={(checked) => handleTemplateViewModeChange(checked)}
                          />
                        </div>
                      </div>

                      {/* الإعدادات المتقدمة */}
                      <div className="space-y-3">
                        <h3 className="text-base font-medium">إعدادات النظام</h3>
                        <Button asChild variant="outline" className="w-full justify-between">
                          <Link href="/admin/display-settings">
                            <span>إدارة إعدادات العرض</span>
                            <Settings className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* إحصائيات */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المستخدمون</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={stats?.userGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                        {stats?.userGrowth >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 inline" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 inline" />
                        )}
                        {` ${Math.abs(stats?.userGrowth || 0)}%`}
                      </span>
                      <span className="mx-1">من الشهر الماضي</span>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">البطاقات</CardTitle>
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalCards || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={stats?.cardGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                        {stats?.cardGrowth >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 inline" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 inline" />
                        )}
                        {` ${Math.abs(stats?.cardGrowth || 0)}%`}
                      </span>
                      <span className="mx-1">من الشهر الماضي</span>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الشهادات</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalCertificates || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={stats?.certificateGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                        {stats?.certificateGrowth >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 inline" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 inline" />
                        )}
                        {` ${Math.abs(stats?.certificateGrowth || 0)}%`}
                      </span>
                      <span className="mx-1">من الشهر الماضي</span>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">القوالب</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalTemplates || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span>منها {stats?.activeTemplates || 0} قالب نشط</span>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* إعدادات سريعة */}
              <Card className="col-span-7">
                <CardHeader>
                  <CardTitle>إعدادات سريعة</CardTitle>
                  <CardDescription>إدارة الإعدادات الأكثر استخداماً</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* طريقة عرض التطبيق */}
                    <div className="space-y-3">
                      <h3 className="text-base font-medium">طريقة عرض التطبيق</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm">نمط العرض الموحد (صفحة واحدة)</div>
                          <div className="text-xs text-muted-foreground">عرض كل شيء في صفحة واحدة</div>
                        </div>
                        <Switch
                          checked={displaySettings.displayMode === 'single'}
                          onCheckedChange={(checked) => handleDisplayModeChange(checked)}
                        />
                      </div>
                    </div>

                    {/* طريقة عرض القوالب */}
                    <div className="space-y-3">
                      <h3 className="text-base font-medium">طريقة عرض القوالب</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm">القوالب في صفحة واحدة</div>
                          <div className="text-xs text-muted-foreground">عرض القوالب في صفحة واحدة</div>
                        </div>
                        <Switch
                          checked={displaySettings.templateViewMode === 'single-page'}
                          onCheckedChange={(checked) => handleTemplateViewModeChange(checked)}
                        />
                      </div>
                    </div>

                    {/* الإعدادات المتقدمة */}
                    <div className="space-y-3">
                      <h3 className="text-base font-medium">إعدادات النظام</h3>
                      <Button asChild variant="outline" className="w-full justify-between">
                        <Link href="/admin/settings">
                          <span>إدارة كافة الإعدادات</span>
                          <Settings className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7 md:col-span-4">
                  <CardHeader>
                    <CardTitle>نشاط النظام</CardTitle>
                    <CardDescription>عرض لنشاط المستخدمين والعمليات خلال آخر 30 يوم</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2">
                    <div className="h-[250px] w-full py-4">
                      {/* Placeholder for chart */}
                      <div className="flex items-center justify-center h-full border rounded-md bg-muted/20">
                        <div className="text-center space-y-2">
                          <Activity className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div className="text-muted-foreground">مخطط النشاط</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-7 md:col-span-3">
                  <CardHeader>
                    <CardTitle>توزيع المستخدمين</CardTitle>
                    <CardDescription>توزيع المستخدمين حسب الحالة والدور</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2">
                    <div className="h-[250px] w-full py-4">
                      {/* Placeholder for chart */}
                      <div className="flex items-center justify-center h-full border rounded-md bg-muted/20">
                        <div className="text-center space-y-2">
                          <PieChart className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div className="text-muted-foreground">مخطط التوزيع</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>آخر المستخدمين</CardTitle>
                    <CardDescription>قائمة بآخر المستخدمين المسجلين</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentUsers?.length ? (
                      <div className="space-y-4">
                        {recentUsers.slice(0, 5).map((user: any) => (
                          <div key={user.id} className="flex items-center gap-4">
                            <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary">
                              <Users className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{user.name || user.username}</p>
                              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        لا يوجد مستخدمين حديثين
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/admin/users">
                        إدارة المستخدمين
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>آخر البطاقات</CardTitle>
                    <CardDescription>قائمة بآخر البطاقات المنشأة</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentCards?.length ? (
                      <div className="space-y-4">
                        {recentCards.slice(0, 5).map((card: any) => (
                          <div key={card.id} className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted">
                              {card.imageUrl ? (
                                <img
                                  src={card.thumbnailUrl || card.imageUrl}
                                  alt={card.template?.title || `بطاقة ${card.id}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                  <FileImage className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {card.template?.title || `بطاقة ${card.id}`}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {card.user?.username || "مستخدم غير مسجل"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        لا يوجد بطاقات حديثة
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/admin/cards">
                        إدارة البطاقات
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>إعدادات العرض</CardTitle>
                    <CardDescription>تخصيص واجهة المستخدم وطريقة عرض القوالب</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* نمط عرض التطبيق */}
                    <div className="space-y-3">
                      <div className="flex flex-col space-y-1.5">
                        <h3 className="text-lg font-semibold">نمط عرض التطبيق</h3>
                        <p className="text-sm text-muted-foreground">اختر نمط عرض التطبيق للمستخدمين</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted/80">
                              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium">النمط التقليدي (متعدد الصفحات)</h4>
                              <p className="text-sm text-muted-foreground">
                                يتم تقسيم التطبيق إلى صفحات منفصلة
                              </p>
                            </div>
                          </div>
                          <Switch
                            id="displayMode-multi"
                            checked={displaySettings.displayMode === 'multi'}
                            onCheckedChange={(checked) => {
                              if (checked) handleDisplayModeChange(false);
                            }}
                          />
                        </div>
                        
                        <div className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted/80">
                              <Layout className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium">النمط الموحد (صفحة واحدة)</h4>
                              <p className="text-sm text-muted-foreground">
                                يتم عرض كل شيء في صفحة واحدة
                              </p>
                            </div>
                          </div>
                          <Switch
                            id="displayMode-single"
                            checked={displaySettings.displayMode === 'single'}
                            onCheckedChange={(checked) => {
                              if (checked) handleDisplayModeChange(true);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>روابط سريعة</CardTitle>
                    <CardDescription>روابط سريعة للوصول إلى المهام الشائعة</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/admin/templates">
                          <Layers className="h-4 w-4 ml-2" />
                          إدارة القوالب
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/admin/categories">
                          <Layers className="h-4 w-4 ml-2" />
                          إدارة التصنيفات
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start text-primary" style={{ borderColor: "#0ea5e9", borderWidth: "1.5px" }}>
                        <Link href="/admin/templates">
                          <Layers className="h-4 w-4 ml-2" />
                          <span className="flex-1">القوالب والحقول</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">جديد</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/admin/seo-settings">
                          <Search className="h-4 w-4 ml-2" />
                          إعدادات محركات البحث (SEO)
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/admin/users">
                          <Users className="h-4 w-4 ml-2" />
                          إدارة المستخدمين
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/admin/certificates">
                          <Award className="h-4 w-4 ml-2" />
                          إدارة الشهادات
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/admin/cards">
                          <FileImage className="h-4 w-4 ml-2" />
                          إدارة البطاقات
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start text-primary" style={{ borderColor: "#0ea5e9", borderWidth: "1.5px" }}>
                        <Link href="/admin/social-auth-settings">
                          <Users className="h-4 w-4 ml-2" />
                          <span className="flex-1">إعدادات المصادقة الاجتماعية</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">جديد</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المشاهدات</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={stats?.viewGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                    {stats?.viewGrowth >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 inline" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 inline" />
                    )}
                    {` ${Math.abs(stats?.viewGrowth || 0)}%`}
                  </span>
                  <span className="mx-1">من الشهر الماضي</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المشاركات</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalShares || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={stats?.shareGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                    {stats?.shareGrowth >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 inline" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 inline" />
                    )}
                    {` ${Math.abs(stats?.shareGrowth || 0)}%`}
                  </span>
                  <span className="mx-1">من الشهر الماضي</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل التحويل</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  من الزيارات إلى إنشاء بطاقات
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المستخدمين النشطين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  خلال الـ 30 يوم الماضية
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>نشاط المشاهدات</CardTitle>
                <CardDescription>إجمالي المشاهدات حسب التاريخ</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px] w-full py-4">
                  {/* Placeholder for chart */}
                  <div className="flex items-center justify-center h-full border rounded-md bg-muted/20">
                    <div className="text-center space-y-2">
                      <LineChart className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div className="text-muted-foreground">مخطط المشاهدات</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التوزيع حسب التصنيف</CardTitle>
                <CardDescription>توزيع البطاقات حسب التصنيف</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px] w-full py-4">
                  {/* Placeholder for chart */}
                  <div className="flex items-center justify-center h-full border rounded-md bg-muted/20">
                    <div className="text-center space-y-2">
                      <PieChart className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div className="text-muted-foreground">مخطط التوزيع</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>أحدث الأنشطة</CardTitle>
              <CardDescription>سجل بأحدث الأنشطة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Recent activities timeline */}
                <div className="relative border-r-2 border-muted-foreground/10 pr-6 space-y-6">
                  <div className="relative">
                    <div className="absolute right-[-29px] top-1 w-4 h-4 rounded-full bg-primary"></div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-semibold">إضافة مستخدم جديد</div>
                      <div className="text-xs text-muted-foreground">منذ ساعتين</div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تم تسجيل مستخدم جديد في النظام.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute right-[-29px] top-1 w-4 h-4 rounded-full bg-primary"></div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-semibold">إنشاء بطاقة جديدة</div>
                      <div className="text-xs text-muted-foreground">منذ 4 ساعات</div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تم إنشاء بطاقة جديدة من قبل أحمد محمد.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute right-[-29px] top-1 w-4 h-4 rounded-full bg-primary"></div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-semibold">إصدار شهادة</div>
                      <div className="text-xs text-muted-foreground">منذ 8 ساعات</div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تم إصدار شهادة جديدة من نوع "شهادة تقدير".
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute right-[-29px] top-1 w-4 h-4 rounded-full bg-primary"></div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-semibold">إضافة قالب جديد</div>
                      <div className="text-xs text-muted-foreground">منذ يوم واحد</div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تم إضافة قالب جديد في تصنيف "بطاقات دعوة".
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute right-[-29px] top-1 w-4 h-4 rounded-full bg-muted"></div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-semibold">تحديث إعدادات النظام</div>
                      <div className="text-xs text-muted-foreground">منذ 3 أيام</div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تم تحديث إعدادات النظام بواسطة المدير.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                عرض جميع الأنشطة
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}