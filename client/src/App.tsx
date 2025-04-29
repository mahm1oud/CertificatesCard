import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import HomePageSinglePage from "@/pages/home-single-page";
import TemplateForm from "@/pages/template-form";
import CardPreview from "@/pages/card-preview";
import FullCardView from "@/pages/full-card-view";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import { lazy, Suspense, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

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
const UserDashboard = lazy(() => import("@/pages/user/dashboard"));
const UserCards = lazy(() => import("@/pages/user/cards"));
const UserCertificates = lazy(() => import("@/pages/user/certificates"));
const UserProfile = lazy(() => import("@/pages/user/profile"));
const CertificateVerify = lazy(() => import("@/pages/certificate-verify"));
const CertificateForm = lazy(() => import("@/pages/certificate-form"));
const CertificatePreview = lazy(() => import("@/pages/certificate-preview"));
const FullCertificateView = lazy(() => import("@/pages/full-certificate-view"));
const TemplateEditor = lazy(() => import("@/pages/template-editor"));

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
  
  // جلب إعدادات العرض
  useEffect(() => {
    async function fetchDisplaySettings() {
      try {
        // نحاول جلب الإعدادات من الخادم أولاً
        const response = await fetch('/api/display');
        
        if (response.ok) {
          const data = await response.json();
          setDisplaySettings(data.settings || { templateViewMode: 'multi-page' });
        } else {
          // إذا فشل الطلب (مثلاً، المسار غير متاح)، نستخدم القيم الافتراضية
          setDisplaySettings({ templateViewMode: 'multi-page' });
        }
      } catch (error) {
        console.error('Error fetching display settings:', error);
        // استخدام القيم الافتراضية في حال حدوث خطأ
        setDisplaySettings({ templateViewMode: 'multi-page' });
      } finally {
        setIsLoadingSettings(false);
      }
    }
    
    fetchDisplaySettings();
  }, []);
  
  // اختيار مكون الصفحة الرئيسية بناءً على إعدادات العرض
  const HomeComponent = displaySettings?.displayMode === 'single' 
    ? HomePageSinglePage
    : Home;
    
  if (isLoadingSettings) {
    return <LazyLoadingFallback />;
  }
  
  return (
    <div dir={dir()} className="flex flex-col min-h-screen">
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
            <Route path="/certificates/verify/:code" component={CertificateVerify} />
            <Route path="/certificates/:templateId" component={CertificateForm} />
            <Route path="/certificates/preview/:certificateId" component={CertificatePreview} />
            <Route path="/certificate/:certificateId" component={FullCertificateView} />
            <Route path="/template-editor/:id" component={TemplateEditor} />

            {/* User routes (protected) */}
            <ProtectedRoute path="/user/dashboard" component={UserDashboard} />
            <ProtectedRoute path="/user/cards" component={UserCards} />
            <ProtectedRoute path="/user/certificates" component={UserCertificates} />
            <ProtectedRoute path="/user/profile" component={UserProfile} />
            
            {/* Admin routes (protected, admin only) */}
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
      <TooltipProvider>
        <I18nProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
