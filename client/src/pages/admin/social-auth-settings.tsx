import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2,
  Save,
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSocialAuthSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Social Auth Settings
  const [socialAuthSettings, setSocialAuthSettings] = useState({
    enableFacebookAuth: false,
    facebookAppId: "",
    facebookAppSecret: "",
    facebookCallbackUrl: "",
    
    enableGoogleAuth: false,
    googleClientId: "",
    googleClientSecret: "",
    googleCallbackUrl: "",
    
    enableTwitterAuth: false,
    twitterApiKey: "",
    twitterApiSecret: "",
    twitterCallbackUrl: "",
    
    enableLinkedinAuth: false,
    linkedinClientId: "",
    linkedinClientSecret: "",
    linkedinCallbackUrl: "",
  });

  // Fetch social auth settings
  const { isLoading } = useQuery({
    queryKey: ['/api/admin/settings/social-auth'],
    queryFn: getQueryFn({}),
    onSuccess: (data) => {
      if (data && data.settings) {
        setSocialAuthSettings(data.settings);
      }
    },
    onError: (error) => {
      console.error('Error fetching social auth settings:', error);
      toast({
        title: "خطأ في جلب الإعدادات",
        description: "حدث خطأ أثناء جلب إعدادات المصادقة الاجتماعية",
        variant: "destructive",
      });
    }
  });

  // Save social auth settings
  const saveSocialAuthSettingsMutation = useMutation({
    mutationFn: async (settings: typeof socialAuthSettings) => {
      return await apiRequest('/api/admin/settings/social-auth', {
        method: 'POST',
        body: { settings }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ إعدادات المصادقة الاجتماعية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/social-auth'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء حفظ إعدادات المصادقة الاجتماعية",
        variant: "destructive",
      });
      console.error('Error saving social auth settings:', error);
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    saveSocialAuthSettingsMutation.mutate(socialAuthSettings, {
      onSettled: () => {
        setIsSaving(false);
      }
    });
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setSocialAuthSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إعدادات المصادقة الاجتماعية</h1>
          <p className="text-muted-foreground">
            تكوين واجهات برمجة التطبيقات للمصادقة من خلال مواقع التواصل الاجتماعي
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Facebook Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Facebook className="ml-2 h-5 w-5 text-blue-600" />
                Facebook Login
              </CardTitle>
              <CardDescription>
                إعدادات المصادقة باستخدام Facebook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="enableFacebookAuth"
                  name="enableFacebookAuth"
                  checked={socialAuthSettings.enableFacebookAuth}
                  onCheckedChange={(checked) => {
                    setSocialAuthSettings(prev => ({
                      ...prev,
                      enableFacebookAuth: checked
                    }));
                  }}
                />
                <Label htmlFor="enableFacebookAuth">تفعيل تسجيل الدخول عبر Facebook</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebookAppId">معرف التطبيق (App ID)</Label>
                  <Input
                    id="facebookAppId"
                    name="facebookAppId"
                    value={socialAuthSettings.facebookAppId}
                    onChange={handleInputChange}
                    disabled={!socialAuthSettings.enableFacebookAuth}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebookAppSecret">سر التطبيق (App Secret)</Label>
                  <Input
                    id="facebookAppSecret"
                    name="facebookAppSecret"
                    type="password"
                    value={socialAuthSettings.facebookAppSecret}
                    onChange={handleInputChange}
                    disabled={!socialAuthSettings.enableFacebookAuth}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebookCallbackUrl">رابط إعادة التوجيه (Callback URL)</Label>
                <Input
                  id="facebookCallbackUrl"
                  name="facebookCallbackUrl"
                  value={socialAuthSettings.facebookCallbackUrl}
                  onChange={handleInputChange}
                  disabled={!socialAuthSettings.enableFacebookAuth}
                  placeholder="https://example.com/auth/facebook/callback"
                />
              </div>

              <div className="flex items-center mt-2">
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  className="text-muted-foreground p-0 h-auto space-x-1 space-x-reverse"
                  onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>فتح موقع مطوري Facebook</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Google Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="ml-2 h-5 w-5 text-red-500" />
                Google Login
              </CardTitle>
              <CardDescription>
                إعدادات المصادقة باستخدام Google
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="enableGoogleAuth"
                  name="enableGoogleAuth"
                  checked={socialAuthSettings.enableGoogleAuth}
                  onCheckedChange={(checked) => {
                    setSocialAuthSettings(prev => ({
                      ...prev,
                      enableGoogleAuth: checked
                    }));
                  }}
                />
                <Label htmlFor="enableGoogleAuth">تفعيل تسجيل الدخول عبر Google</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="googleClientId">معرف العميل (Client ID)</Label>
                  <Input
                    id="googleClientId"
                    name="googleClientId"
                    value={socialAuthSettings.googleClientId}
                    onChange={handleInputChange}
                    disabled={!socialAuthSettings.enableGoogleAuth}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleClientSecret">سر العميل (Client Secret)</Label>
                  <Input
                    id="googleClientSecret"
                    name="googleClientSecret"
                    type="password"
                    value={socialAuthSettings.googleClientSecret}
                    onChange={handleInputChange}
                    disabled={!socialAuthSettings.enableGoogleAuth}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleCallbackUrl">رابط إعادة التوجيه (Callback URL)</Label>
                <Input
                  id="googleCallbackUrl"
                  name="googleCallbackUrl"
                  value={socialAuthSettings.googleCallbackUrl}
                  onChange={handleInputChange}
                  disabled={!socialAuthSettings.enableGoogleAuth}
                  placeholder="https://example.com/auth/google/callback"
                />
              </div>

              <div className="flex items-center mt-2">
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  className="text-muted-foreground p-0 h-auto space-x-1 space-x-reverse"
                  onClick={() => window.open('https://console.developers.google.com/apis/credentials', '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>فتح وحدة تحكم Google للمطورين</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Twitter Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Twitter className="ml-2 h-5 w-5 text-blue-400" />
                Twitter Login
              </CardTitle>
              <CardDescription>
                إعدادات المصادقة باستخدام Twitter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="enableTwitterAuth"
                  name="enableTwitterAuth"
                  checked={socialAuthSettings.enableTwitterAuth}
                  onCheckedChange={(checked) => {
                    setSocialAuthSettings(prev => ({
                      ...prev,
                      enableTwitterAuth: checked
                    }));
                  }}
                />
                <Label htmlFor="enableTwitterAuth">تفعيل تسجيل الدخول عبر Twitter</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitterApiKey">مفتاح API (API Key)</Label>
                  <Input
                    id="twitterApiKey"
                    name="twitterApiKey"
                    value={socialAuthSettings.twitterApiKey}
                    onChange={handleInputChange}
                    disabled={!socialAuthSettings.enableTwitterAuth}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterApiSecret">سر API (API Secret)</Label>
                  <Input
                    id="twitterApiSecret"
                    name="twitterApiSecret"
                    type="password"
                    value={socialAuthSettings.twitterApiSecret}
                    onChange={handleInputChange}
                    disabled={!socialAuthSettings.enableTwitterAuth}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitterCallbackUrl">رابط إعادة التوجيه (Callback URL)</Label>
                <Input
                  id="twitterCallbackUrl"
                  name="twitterCallbackUrl"
                  value={socialAuthSettings.twitterCallbackUrl}
                  onChange={handleInputChange}
                  disabled={!socialAuthSettings.enableTwitterAuth}
                  placeholder="https://example.com/auth/twitter/callback"
                />
              </div>

              <div className="flex items-center mt-2">
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  className="text-muted-foreground p-0 h-auto space-x-1 space-x-reverse"
                  onClick={() => window.open('https://developer.twitter.com/en/portal/dashboard', '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>فتح موقع مطوري Twitter</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Linkedin className="ml-2 h-5 w-5 text-blue-700" />
                LinkedIn Login
              </CardTitle>
              <CardDescription>
                إعدادات المصادقة باستخدام LinkedIn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="enableLinkedinAuth"
                  name="enableLinkedinAuth"
                  checked={socialAuthSettings.enableLinkedinAuth}
                  onCheckedChange={(checked) => {
                    setSocialAuthSettings(prev => ({
                      ...prev,
                      enableLinkedinAuth: checked
                    }));
                  }}
                />
                <Label htmlFor="enableLinkedinAuth">تفعيل تسجيل الدخول عبر LinkedIn</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinClientId">معرف العميل (Client ID)</Label>
                  <Input
                    id="linkedinClientId"
                    name="linkedinClientId"
                    value={socialAuthSettings.linkedinClientId}
                    onChange={handleInputChange}
                    disabled={!socialAuthSettings.enableLinkedinAuth}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedinClientSecret">سر العميل (Client Secret)</Label>
                  <Input
                    id="linkedinClientSecret"
                    name="linkedinClientSecret"
                    type="password"
                    value={socialAuthSettings.linkedinClientSecret}
                    onChange={handleInputChange}
                    disabled={!socialAuthSettings.enableLinkedinAuth}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinCallbackUrl">رابط إعادة التوجيه (Callback URL)</Label>
                <Input
                  id="linkedinCallbackUrl"
                  name="linkedinCallbackUrl"
                  value={socialAuthSettings.linkedinCallbackUrl}
                  onChange={handleInputChange}
                  disabled={!socialAuthSettings.enableLinkedinAuth}
                  placeholder="https://example.com/auth/linkedin/callback"
                />
              </div>

              <div className="flex items-center mt-2">
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  className="text-muted-foreground p-0 h-auto space-x-1 space-x-reverse"
                  onClick={() => window.open('https://www.linkedin.com/developers/apps', '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>فتح موقع مطوري LinkedIn</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSaving || saveSocialAuthSettingsMutation.isPending}
              className="min-w-[120px]"
            >
              {(isSaving || saveSocialAuthSettingsMutation.isPending) ? (
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