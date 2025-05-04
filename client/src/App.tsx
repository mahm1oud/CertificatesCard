import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient-updated";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense, useState, useEffect } from "react";
import AccessLayers from "@/components/access-layers";
import { Loader2 } from "lucide-react";
import SEO from "@/components/SEO";

// تحميل كل الصفحات بشكل متأخر لتقليل حجم الحزمة الأساسية
const Home = lazy(() => import("@/pages/home"));
const HomePageSinglePage = lazy(() => import("@/pages/home-single-page"));
const TemplateForm = lazy(() => import("@/pages/template-form"));
const CardPreview = lazy(() => import("@/pages/card-preview"));
const FullCardView = lazy(() => import("@/pages/full-card-view"));
const TemplateEditorUnified = lazy(() => import("@/pages/template-editor-unified"));
const TemplateEditorWithLayers = lazy(() => import("@/pages/template-editor-with-layers"));
const TemplateEditorWithLayersNew = lazy(() => import("@/pages/template-editor-with-layers-new"));
const AdvancedLayerEditor = lazy(() => import("@/pages/advanced-layer-editor"));

// Lazy load admin and auth pages
const AuthPage = lazy(() => import("@/pages/auth-page"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminCategories = lazy(() => import("@/pages/admin/categories"));
const AdminTemplates = lazy(() => import("@/pages/admin/templates"));
const AdminTemplateEdit = lazy(() => import("@/pages/admin/template-edit"));
const AdminTemplateFields = lazy(() => import("@/pages/admin/template-fields"));
const AdminTemplateEditor = lazy(() => import("@/pages/admin/template-editor/index"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminCards = lazy(() => import("@/pages/admin/cards"));
const AdminCertificates = lazy(() => import("@/pages/admin/certificates"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminAuthSettings = lazy(() => import("@/pages/admin/settings/auth-page"));
const AdminSocialAuth = lazy(() => import("@/pages/admin/social-auth-settings"));
const AdminDisplaySettings = lazy(() => import("@/pages/admin/display-settings"));
const AdminSeoSettings = lazy(() => import("@/pages/admin/seo-settings"));
const UserDashboard = lazy(() => import("@/pages/user/dashboard"));
const UserCards = lazy(() => import("@/pages/user/cards"));
const UserCertificates = lazy(() => import("@/pages/user/certificates"));
const UserProfile = lazy(() => import("@/pages/user/profile"));
const UserPreferences = lazy(() => import("@/pages/user/preferences"));
const CertificateVerify = lazy(() => import("@/pages/certificate-verify"));
const CertificateForm = lazy(() => import("@/pages/certificate-form"));
const CertificatePreview = lazy(() => import("@/pages/certificate-preview"));
const FullCertificateView = lazy(() => import("@/pages/full-certificate-view"));
const TemplateEditor = lazy(() => import("@/pages/template-editor"));
const SocialTemplateEditor = lazy(() => import("@/pages/social-template-editor"));

// Loading component for lazy loaded routes
const LazyLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function Router() {
  const { dir } = useTranslation();
  const [displaySettings, setDisplaySettings] = useState<any>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [userPreferences, setUserPreferences] = useState<{ layout?: 'boxed' | 'fluid', theme?: 'light' | 'dark' | 'system' }>({
    layout: 'fluid',
    theme: 'system'
  });
  
  // جلب إعدادات العرض من المسار الموحد
  useEffect(() => {
    async function fetchDisplaySettings() {
      try {
        // نحاول جلب الإعدادات من الخادم باستخدام apiRequest
        const data = await apiRequest('GET', '/api/display-settings');
        setDisplaySettings(data.settings || { templateViewMode: 'multi-page' });
      } catch (error) {
        // إذا فشل الطلب (مثلاً، المسار غير متاح)، نستخدم القيم الافتراضية
        console.error('Error fetching display settings:', error);
        // استخدام القيم الافتراضية في حال حدوث خطأ
        setDisplaySettings({ templateViewMode: 'multi-page' });
      } finally {
        setIsLoadingSettings(false);
      }
    }
    
    fetchDisplaySettings();
  }, []);
  
  // جلب تفضيلات المستخدم
  useEffect(() => {
    async function fetchUserPreferences() {
      try {
        const data = await apiRequest('GET', '/api/user/preferences', undefined, { on401: 'returnNull' });
        if (data) {
          setUserPreferences({
            layout: data.layout || 'fluid',
            theme: data.theme || 'system'
          });
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    }
    
    fetchUserPreferences();
  }, []);
  
  // اختيار مكون الصفحة الرئيسية بناءً على إعدادات العرض
  const HomeComponent = displaySettings?.displayMode === 'single' 
    ? HomePageSinglePage
    : Home;
    
  if (isLoadingSettings) {
    return <LazyLoadingFallback />;
  }
  
  return (
    <div dir={dir()} className={`flex flex-col min-h-screen layout-${userPreferences.layout}`}>
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<LazyLoadingFallback />}>
          <Switch>
            {/* Public routes */}
            <Route path="/" component={HomeComponent} />
            <Route path="/single" component={HomePageSinglePage} />
            <Route path="/multi" component={Home} />
            <Route path="/cards/:category/:templateId" component={TemplateForm} />
            <Route path="/preview/:category/:templateId/:cardId" component={CardPreview} />
            <Route path="/view/:cardId" component={FullCardView} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/login" component={AuthPage} />
            <Route path="/certificates/verify/:code" component={CertificateVerify} />
            <Route path="/certificates/:templateId" component={CertificateForm} />
            <Route path="/certificates/preview/:certificateId" component={CertificatePreview} />
            <Route path="/certificate/:certificateId" component={FullCertificateView} />
            <Route path="/template-editor/:id" component={TemplateEditor} />
            <Route path="/template-editor-unified/:id?" component={TemplateEditorUnified} />
            <Route path="/template-editor-with-layers/:templateId?" component={TemplateEditorWithLayers} />
            <Route path="/template-editor-with-layers-new/:templateId?" component={TemplateEditorWithLayersNew} />
            <Route path="/advanced-layer-editor/:templateId?" component={AdvancedLayerEditor} />
            {/* تم تعطيل هذا المسار مؤقتًا */}
            <Route path="/social-template-editor/:templateId" component={SocialTemplateEditor} />

            {/* User routes (protected) */}
            <ProtectedRoute path="/user/dashboard" component={UserDashboard} />
            <ProtectedRoute path="/user/cards" component={UserCards} />
            <ProtectedRoute path="/user/certificates" component={UserCertificates} />
            <ProtectedRoute path="/user/profile" component={UserProfile} />
            <ProtectedRoute path="/user/preferences" component={UserPreferences} />
            
            {/* Admin routes (protected, admin only) */}
            <Route path="/admin">
              {() => {
                window.location.href = "/admin/dashboard";
                return null;
              }}
            </Route>
            <Route path="/admin/profile">
              {() => {
                window.location.href = "/user/profile";
                return null;
              }}
            </Route>
            <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly />
            <ProtectedRoute path="/admin/categories" component={AdminCategories} adminOnly />
            <ProtectedRoute path="/admin/templates" component={AdminTemplates} adminOnly />
            <ProtectedRoute path="/admin/templates/new" component={AdminTemplateEdit} adminOnly />
            <ProtectedRoute path="/admin/templates/:templateId" component={AdminTemplateEdit} adminOnly />
            <ProtectedRoute path="/admin/templates/:templateId/fields" component={AdminTemplateFields} adminOnly />
            <ProtectedRoute path="/admin/template-editor/:id" component={AdminTemplateEditor} adminOnly />
            <ProtectedRoute path="/admin/users" component={AdminUsers} adminOnly />
            <ProtectedRoute path="/admin/cards" component={AdminCards} adminOnly />
            <ProtectedRoute path="/admin/certificates" component={AdminCertificates} adminOnly />
            <ProtectedRoute path="/admin/settings" component={AdminSettings} adminOnly />
            <ProtectedRoute path="/admin/display-settings" component={AdminDisplaySettings} adminOnly />
            <ProtectedRoute path="/admin/settings/auth" component={AdminAuthSettings} adminOnly />
            <ProtectedRoute path="/admin/social-auth-settings" component={AdminSocialAuth} adminOnly />
            <ProtectedRoute path="/admin/seo-settings" component={AdminSeoSettings} adminOnly />
            
            {/* 404 route */}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <I18nProvider>
            <AuthProvider>
              <SEO />
              <Toaster />
              <Router />
              <AccessLayers />
            </AuthProvider>
          </I18nProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
