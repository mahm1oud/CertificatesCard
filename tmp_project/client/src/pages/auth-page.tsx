import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  
  // Form states
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: ""
  });
  
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: ""
  });
  
  // Get redirect URL from query params
  const redirectUrl = new URLSearchParams(location.split("?")[1]).get("redirect") || "/";
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(redirectUrl);
    }
  }, [user, redirectUrl, navigate]);
  
  // Handle login form change
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle register form change
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle login form submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };
  
  // Handle register form submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "كلمات المرور غير متطابقة",
        description: "تأكد من تطابق كلمة المرور وتأكيدها",
        variant: "destructive",
      });
      return;
    }
    
    const { confirmPassword, ...registrationData } = registerForm;
    registerMutation.mutate(registrationData);
  };
  
  // If user is already logged in, don't render the auth page
  if (user) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 min-h-screen flex flex-col justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Hero section */}
        <div className="flex flex-col justify-center space-y-6 p-6 hidden md:flex">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">مرحباً بك في منصتنا</h1>
            <p className="text-muted-foreground mt-2">
              قم بإنشاء بطاقات مخصصة وشهادات رسمية بتصاميم احترافية
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">1</div>
              <div>
                <h3 className="font-medium">اختر القالب</h3>
                <p className="text-sm text-muted-foreground">
                  اختر من بين مجموعة واسعة من قوالب البطاقات والشهادات
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">2</div>
              <div>
                <h3 className="font-medium">خصص التصميم</h3>
                <p className="text-sm text-muted-foreground">
                  أضف النصوص والتفاصيل الخاصة بك حسب المناسبة
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">3</div>
              <div>
                <h3 className="font-medium">شارك أو قم بالتحميل</h3>
                <p className="text-sm text-muted-foreground">
                  قم بتحميل التصميم النهائي أو مشاركته مع الآخرين
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Auth forms */}
        <div>
          <Card className="border-none md:border shadow-none md:shadow">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">تسجيل الدخول / إنشاء حساب</CardTitle>
              <CardDescription className="text-center">
                قم بتسجيل الدخول أو إنشاء حساب جديد للوصول إلى جميع الميزات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  {loginMutation.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {loginMutation.error.message || "فشل تسجيل الدخول، تحقق من اسم المستخدم وكلمة المرور"}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">اسم المستخدم</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="أدخل اسم المستخدم"
                        value={loginForm.username}
                        onChange={handleLoginChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <Button variant="link" className="h-auto p-0" asChild>
                          <a href="/forgot-password">نسيت كلمة المرور؟</a>
                        </Button>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="أدخل كلمة المرور"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري تسجيل الدخول...
                        </>
                      ) : (
                        <>
                          <LogIn className="ml-2 h-4 w-4" />
                          تسجيل الدخول
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  {registerMutation.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {registerMutation.error.message || "فشل إنشاء الحساب، يرجى المحاولة مرة أخرى"}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">اسم المستخدم</Label>
                      <Input
                        id="register-username"
                        name="username"
                        placeholder="أدخل اسم المستخدم"
                        value={registerForm.username}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email">البريد الإلكتروني</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="أدخل البريد الإلكتروني"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-name">الاسم الكامل (اختياري)</Label>
                      <Input
                        id="register-name"
                        name="name"
                        placeholder="أدخل اسمك الكامل"
                        value={registerForm.name}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">كلمة المرور</Label>
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="أدخل كلمة المرور"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">تأكيد كلمة المرور</Label>
                      <Input
                        id="register-confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="أعد إدخال كلمة المرور"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري إنشاء الحساب...
                        </>
                      ) : (
                        <>
                          <UserPlus className="ml-2 h-4 w-4" />
                          إنشاء حساب
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground text-center">
                بتسجيل الدخول أو إنشاء حساب، فإنك توافق على 
                <Button variant="link" className="h-auto p-0 mx-1">شروط الاستخدام</Button>
                و
                <Button variant="link" className="h-auto p-0 mx-1">سياسة الخصوصية</Button>
                الخاصة بنا
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}