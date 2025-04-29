import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2,
  FileImage,
  Award,
  User,
  Clock,
  Settings,
  Plus,
  Share2,
  Palette,
  LayoutGrid,
  Eye
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch user stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: getQueryFn({}),
  });

  // Fetch recent cards
  const { data: recentCards, isLoading: isCardsLoading } = useQuery({
    queryKey: ["/api/user/cards/recent"],
    queryFn: getQueryFn({}),
  });

  // Fetch recent certificates
  const { data: recentCertificates, isLoading: isCertificatesLoading } = useQuery({
    queryKey: ["/api/user/certificates/recent"],
    queryFn: getQueryFn({}),
  });

  // Get recent activity data
  const isLoading = isStatsLoading || isCardsLoading || isCertificatesLoading;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">
            مرحباً {user?.name || user?.username}، مرحباً بك في لوحة التحكم الخاصة بك
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Plus className="h-4 w-4 ml-2" />
            إنشاء بطاقة جديدة
          </Link>
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="recent">النشاط الأخير</TabsTrigger>
          <TabsTrigger value="popular">الأكثر مشاهدة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">البطاقات</CardTitle>
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalCards || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeCards || 0} نشطة • {stats?.draftCards || 0} مسودة
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
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeCertificates || 0} نشطة • {stats?.expiredCertificates || 0} منتهية
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المشاهدات</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      هذا الشهر: {stats?.monthlyViews || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المشاركات</CardTitle>
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalShares || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      هذا الشهر: {stats?.monthlyShares || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle>البطاقات الأخيرة</CardTitle>
                    <CardDescription>آخر البطاقات التي أنشأتها</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentCards?.length ? (
                      <div className="space-y-4">
                        {recentCards.slice(0, 5).map((card: any) => (
                          <div key={card.id} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
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
                              <h4 className="font-medium truncate">{card.template?.title || `بطاقة ${card.id}`}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(card.createdAt).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/view/${card.publicId}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        لم تقم بإنشاء أي بطاقات حتى الآن
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/user/cards">
                        عرض جميع البطاقات
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>الروابط السريعة</CardTitle>
                    <CardDescription>روابط سريعة للوصول إلى المميزات</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/">
                          <Palette className="h-4 w-4 ml-2" />
                          استعراض القوالب
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/user/cards">
                          <FileImage className="h-4 w-4 ml-2" />
                          إدارة البطاقات
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/user/certificates">
                          <Award className="h-4 w-4 ml-2" />
                          إدارة الشهادات
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/user/profile">
                          <User className="h-4 w-4 ml-2" />
                          الملف الشخصي
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link href="/user/preferences">
                          <Settings className="h-4 w-4 ml-2" />
                          تفضيلات المستخدم
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>النشاط الأخير</CardTitle>
                <CardDescription>آخر الأنشطة على البطاقات والشهادات</CardDescription>
              </CardHeader>
              <CardContent>
                {(recentCards?.length || recentCertificates?.length) ? (
                  <div className="space-y-6">
                    {/* Merge and sort recent activities */}
                    {[
                      ...(recentCards || []).map((card: any) => ({
                        id: `card-${card.id}`,
                        title: card.template?.title || `بطاقة ${card.id}`,
                        type: 'card',
                        date: card.updatedAt || card.createdAt,
                        url: `/view/${card.publicId}`,
                        publicId: card.publicId,
                        thumbnail: card.thumbnailUrl || card.imageUrl,
                        status: card.status,
                      })),
                      ...(recentCertificates || []).map((cert: any) => ({
                        id: `cert-${cert.id}`,
                        title: cert.title,
                        type: 'certificate',
                        date: cert.createdAt,
                        url: `/certificates/verify/${cert.verificationCode}`,
                        publicId: cert.publicId,
                        thumbnail: cert.imageUrl,
                        status: cert.status,
                      }))
                    ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 border-b pb-4">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                          {activity.thumbnail ? (
                            <img
                              src={activity.thumbnail}
                              alt={activity.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                              {activity.type === 'card' ? (
                                <FileImage className="h-5 w-5" />
                              ) : (
                                <Award className="h-5 w-5" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{activity.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              activity.status === 'active' ? 'bg-green-100 text-green-800' : 
                              activity.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              activity.status === 'expired' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.status === 'active' ? 'نشط' : 
                               activity.status === 'draft' ? 'مسودة' : 
                               activity.status === 'expired' ? 'منتهي' : activity.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.type === 'card' ? 'بطاقة' : 'شهادة'} • {formatDate(activity.date)}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={activity.url}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    لم يتم تسجيل أي أنشطة حتى الآن
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>البطاقات الأكثر مشاهدة</CardTitle>
                  <CardDescription>البطاقات التي حصلت على أكبر عدد من المشاهدات</CardDescription>
                </CardHeader>
                <CardContent>
                  {(recentCards?.length) ? (
                    <div className="space-y-4">
                      {recentCards
                        .sort((a: any, b: any) => (b.accessCount || 0) - (a.accessCount || 0))
                        .slice(0, 5)
                        .map((card: any) => (
                          <div key={card.id} className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted">
                              {card.thumbnailUrl || card.imageUrl ? (
                                <img
                                  src={card.thumbnailUrl || card.imageUrl}
                                  alt={card.template?.title || `بطاقة ${card.id}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                  <FileImage className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{card.template?.title || `بطاقة ${card.id}`}</h4>
                              <p className="text-sm text-muted-foreground">
                                المشاهدات: {card.accessCount || 0}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/view/${card.publicId}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      لا يوجد بيانات متاحة
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الشهادات الأكثر تحققاً</CardTitle>
                  <CardDescription>الشهادات التي تم التحقق منها أكثر من مرة</CardDescription>
                </CardHeader>
                <CardContent>
                  {(recentCertificates?.length) ? (
                    <div className="space-y-4">
                      {recentCertificates
                        .sort((a: any, b: any) => (b.verificationCount || 0) - (a.verificationCount || 0))
                        .slice(0, 5)
                        .map((cert: any) => (
                          <div key={cert.id} className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted">
                              {cert.imageUrl ? (
                                <img
                                  src={cert.imageUrl}
                                  alt={cert.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                  <Award className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{cert.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                التحققات: {cert.verificationCount || 0}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/certificates/verify/${cert.verificationCode}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      لا يوجد بيانات متاحة
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}