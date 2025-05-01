import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Search,
  Award,
  Mail,
  PartyPopper,
  Sparkles,
  Heart,
  GraduationCap,
  Bomb,
  Flower,
  ChevronRight,
  FileHeart,
  User
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTab, setSelectedTab] = useState("cards");
  
  // Parse location search params
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const category = params.get("category");
    const tab = params.get("tab");
    
    if (category) {
      setSelectedCategory(category);
    }
    
    if (tab === "certificates") {
      setSelectedTab("certificates");
    }
  }, [location]);
  
  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "redirect-to-login" }),
  });
  
  // Fetch all templates
  const { data: allTemplates, isLoading: isTemplatesLoading } = useQuery({
    queryKey: [selectedCategory === "all" ? "/api/templates" : `/api/categories/${selectedCategory}/templates`],
    queryFn: getQueryFn({ on401: "redirect-to-login" }),
  });
  
  // Normalize allTemplates structure since API returns different format based on endpoint
  const normalizedTemplates = Array.isArray(allTemplates) 
    ? allTemplates  // For category-specific templates, API returns array directly
    : allTemplates?.templates || []; // For all templates, API returns {templates, total}
  
  // Filter templates by type (card or certificate)
  const cardTemplates = normalizedTemplates.filter((template: any) => 
    !template.certificateType || template.certificateType === 'card'
  );
  
  const certificateTemplates = normalizedTemplates.filter((template: any) => 
    template.certificateType && template.certificateType !== 'card'
  );
  
  // Update URL when category or tab changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCategory !== "all") {
      params.set("category", selectedCategory);
    }
    
    if (selectedTab === "certificates") {
      params.set("tab", "certificates");
    }
    
    const newSearch = params.toString();
    setLocation(newSearch ? `/?${newSearch}` : "/", { replace: true });
  }, [selectedCategory, selectedTab, setLocation]);
  
  // Filter templates based on search query
  const filteredCardTemplates = cardTemplates.filter((template: any) => {
    return !searchQuery || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.titleAr && template.titleAr.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  const filteredCertificateTemplates = certificateTemplates.filter((template: any) => {
    return !searchQuery || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.titleAr && template.titleAr.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  // Get icon for category
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "wedding": return <Heart className="h-5 w-5" />;
      case "graduation": return <GraduationCap className="h-5 w-5" />;
      case "birthday": return <PartyPopper className="h-5 w-5" />;
      case "eid": return <Sparkles className="h-5 w-5" />;
      case "ramadan": return <Flower className="h-5 w-5" />;
      case "invitation": return <Mail className="h-5 w-5" />;
      case "certificates": return <Award className="h-5 w-5" />;
      default: return <FileHeart className="h-5 w-5" />;
    }
  };
  
  const isLoading = isCategoriesLoading || isTemplatesLoading;
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-10">
        <h1 className="text-4xl font-bold tracking-tight">
          أنشئ بطاقات وشهادات مخصصة بتصاميم احترافية
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          اختر من بين مجموعة واسعة من القوالب وقم بتخصيصها حسب احتياجاتك
        </p>
        
        <div className="relative max-w-md mx-auto">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن قوالب..."
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {user ? (
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link href="/user/dashboard">
                <User className="h-4 w-4 ml-2" />
                لوحة التحكم
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/user/cards">
                عرض بطاقاتي
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link href="/auth">
                تسجيل الدخول
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth?tab=register">
                إنشاء حساب
              </Link>
            </Button>
          </div>
        )}
      </section>
      
      {/* Development Testing Section */}
      <section className="container py-4 bg-blue-50 rounded-lg mb-6 border border-blue-200">
        <h2 className="text-xl font-bold mb-2">🛠️ أدوات التطوير</h2>
        <p className="text-sm text-gray-600 mb-3">تجربة الميزات الجديدة (للمطورين فقط)</p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/template-editor/1">
              محرر القوالب المطور
            </Link>
          </Button>
        </div>
      </section>
      
      {/* Categories Section */}
      <section>
        <div className="flex overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="whitespace-nowrap"
            >
              جميع القوالب
            </Button>
            
            {!isCategoriesLoading && categories?.map((category: any) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.slug)}
                className="whitespace-nowrap"
              >
                {getCategoryIcon(category.slug)}
                <span className="mr-2">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Templates Section */}
      <section>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="cards">بطاقات</TabsTrigger>
              <TabsTrigger value="certificates">شهادات</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="cards" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCardTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredCardTemplates.map((template: any) => (
                  <Link key={template.id} href={`/cards/${template.category?.slug || "other"}/${template.id}`} className="block">
                    <Card className="overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
                      <div className="aspect-square w-full overflow-hidden bg-muted">
                        {template.imageUrl ? (
                          <img
                            src={template.imageUrl}
                            alt={template.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              console.error("Error loading template image:", template.id);
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/static/placeholder-card.svg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <FileHeart className="h-16 w-16" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium">{template.title}</h3>
                        {template.titleAr && (
                          <p className="text-sm text-muted-foreground">{template.titleAr}</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <FileHeart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد قوالب متطابقة</h3>
                <p className="text-muted-foreground">
                  لم نتمكن من العثور على قوالب تطابق معايير البحث
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="certificates" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCertificateTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredCertificateTemplates.map((template: any) => (
                  <Card key={template.id} className="overflow-hidden group">
                    <div className="aspect-square w-full overflow-hidden bg-muted">
                      {template.imageUrl ? (
                        <img
                          src={template.imageUrl}
                          alt={template.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            console.error("Error loading certificate template image:", template.id);
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/static/placeholder-certificate.svg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Award className="h-16 w-16" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{template.title}</h3>
                      {template.titleAr && (
                        <p className="text-sm text-muted-foreground">{template.titleAr}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.certificateType === 'appreciation' && 'شهادة تقدير'}
                        {template.certificateType === 'training' && 'شهادة تدريب'}
                        {template.certificateType === 'education' && 'شهادة تعليم'}
                        {template.certificateType === 'teacher' && 'شهادة للمعلمين'}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button asChild className="w-full">
                        <Link href={`/certificates/${template.id}`}>
                          استخدام القالب
                          <ChevronRight className="h-4 w-4 mr-2" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد قوالب متطابقة</h3>
                <p className="text-muted-foreground">
                  لم نتمكن من العثور على قوالب تطابق معايير البحث
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
      
      {/* Features Section */}
      <section className="py-10">
        <h2 className="text-3xl font-bold text-center mb-12">مميزاتنا</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-muted/40 rounded-lg p-6 text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">تصاميم مخصصة</h3>
            <p className="text-muted-foreground">
              أضف نصوصك وصورك وخصص التصميم حسب ذوقك
            </p>
          </div>
          
          <div className="bg-muted/40 rounded-lg p-6 text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">شهادات موثقة</h3>
            <p className="text-muted-foreground">
              إنشاء شهادات مع رموز تحقق فريدة وقابلة للتحقق
            </p>
          </div>
          
          <div className="bg-muted/40 rounded-lg p-6 text-center space-y-4">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">مشاركة سهلة</h3>
            <p className="text-muted-foreground">
              شارك تصاميمك بسهولة عبر وسائل التواصل الاجتماعي والبريد الإلكتروني
            </p>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-muted/30 py-16 px-6 rounded-lg text-center space-y-6">
        <h2 className="text-3xl font-bold">جاهز لإنشاء تصميمك الأول؟</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          ابدأ الآن واستكشف مجموعة واسعة من القوالب المصممة لمختلف المناسبات
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="#templates">
              <Sparkles className="h-5 w-5 ml-2" />
              استكشاف القوالب
            </Link>
          </Button>
          {!user && (
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth">
                إنشاء حساب
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}