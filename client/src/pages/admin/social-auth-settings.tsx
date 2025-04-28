import React, { useState, useEffect } from 'react';
import { useToast } from '@/lib/hooks/use-toast';
import { useProtectedPage } from '@/lib/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { api } from '@/lib/api';

interface AuthSettings {
  id: number;
  provider: string;
  enabled: boolean;
  clientId: string | null;
  clientSecret: string | null;
  redirectUri: string | null;
  scope: string | null;
  additionalSettings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function SocialAuthSettings() {
  useProtectedPage({ role: 'admin' });
  const { toast } = useToast();
  const [settings, setSettings] = useState<AuthSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, Partial<AuthSettings>>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/admin/auth-settings');
        setSettings(response.data);
        
        // تهيئة بيانات النموذج مع البيانات المجلوبة
        const initialFormData: Record<string, Partial<AuthSettings>> = {};
        response.data.forEach((setting: AuthSettings) => {
          initialFormData[setting.provider] = { ...setting };
        });
        setFormData(initialFormData);
      } catch (error) {
        console.error('Error fetching auth settings:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في جلب إعدادات المصادقة الاجتماعية',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleChange = (provider: string, field: keyof AuthSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (provider: string) => {
    try {
      setSaving({ ...saving, [provider]: true });
      
      const response = await api.put(`/api/admin/auth-settings/${provider}`, formData[provider]);
      
      // تحديث البيانات المحلية مع الاستجابة
      setSettings(prev => 
        prev.map(setting => 
          setting.provider === provider ? response.data : setting
        )
      );
      
      toast({
        title: 'تم الحفظ',
        description: `تم تحديث إعدادات ${getProviderName(provider)} بنجاح`,
      });
    } catch (error) {
      console.error(`Error updating ${provider} settings:`, error);
      toast({
        title: 'خطأ',
        description: `فشل في تحديث إعدادات ${getProviderName(provider)}`,
        variant: 'destructive'
      });
    } finally {
      setSaving({ ...saving, [provider]: false });
    }
  };
  
  const getProviderName = (provider: string): string => {
    const names: Record<string, string> = {
      google: 'جوجل',
      facebook: 'فيسبوك',
      twitter: 'تويتر',
      linkedin: 'لينكد إن'
    };
    return names[provider] || provider;
  };
  
  const getProviderIcon = (provider: string): string => {
    const icons: Record<string, string> = {
      google: '🔍',
      facebook: '📘',
      twitter: '🐦',
      linkedin: '💼'
    };
    return icons[provider] || '🔑';
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <PageHeader
        title="إعدادات المصادقة الاجتماعية"
        subtitle="قم بإعداد وتكوين طرق تسجيل الدخول باستخدام حسابات وسائل التواصل الاجتماعي"
      />

      <Tabs defaultValue="google" className="mt-6">
        <TabsList className="mb-4 grid w-full grid-cols-4">
          {settings.map(setting => (
            <TabsTrigger key={setting.provider} value={setting.provider} className="text-center">
              <span className="ml-2">{getProviderIcon(setting.provider)}</span>
              {getProviderName(setting.provider)}
              {setting.enabled ? 
                <span className="mr-2 py-0.5 px-1.5 bg-green-100 text-green-800 text-xs rounded-full">مفعّل</span> : 
                <span className="mr-2 py-0.5 px-1.5 bg-gray-100 text-gray-600 text-xs rounded-full">معطل</span>
              }
            </TabsTrigger>
          ))}
        </TabsList>

        {settings.map(setting => (
          <TabsContent key={setting.provider} value={setting.provider}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="ml-2 text-xl">{getProviderIcon(setting.provider)}</span>
                  {getProviderName(setting.provider)}
                </CardTitle>
                <CardDescription>
                  قم بتكوين إعدادات المصادقة باستخدام {getProviderName(setting.provider)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id={`${setting.provider}-enabled`}
                      checked={!!formData[setting.provider]?.enabled}
                      onCheckedChange={(checked) => handleChange(setting.provider, 'enabled', checked)}
                    />
                    <Label htmlFor={`${setting.provider}-enabled`}>
                      {formData[setting.provider]?.enabled ? 'مفعّل' : 'معطل'}
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${setting.provider}-clientId`}>معرّف العميل (Client ID)</Label>
                    <Input
                      id={`${setting.provider}-clientId`}
                      value={formData[setting.provider]?.clientId || ''}
                      onChange={(e) => handleChange(setting.provider, 'clientId', e.target.value)}
                      placeholder="أدخل معرّف العميل..."
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${setting.provider}-clientSecret`}>السر (Client Secret)</Label>
                    <Input
                      id={`${setting.provider}-clientSecret`}
                      type="password"
                      value={formData[setting.provider]?.clientSecret || ''}
                      onChange={(e) => handleChange(setting.provider, 'clientSecret', e.target.value)}
                      placeholder={formData[setting.provider]?.clientSecret ? '●●●●●●●●●●●●' : 'أدخل السر...'}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${setting.provider}-redirectUri`}>رابط إعادة التوجيه (Redirect URI)</Label>
                    <Input
                      id={`${setting.provider}-redirectUri`}
                      value={formData[setting.provider]?.redirectUri || ''}
                      onChange={(e) => handleChange(setting.provider, 'redirectUri', e.target.value)}
                      placeholder={`/auth/${setting.provider}/callback`}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">رابط إعادة التوجيه الكامل: 
                      <code className="mx-1 p-1 bg-gray-100 rounded">
                        {window.location.origin}/auth/{setting.provider}/callback
                      </code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${setting.provider}-scope`}>الصلاحيات (Scope)</Label>
                    <Input
                      id={`${setting.provider}-scope`}
                      value={formData[setting.provider]?.scope || ''}
                      onChange={(e) => handleChange(setting.provider, 'scope', e.target.value)}
                      placeholder={setting.provider === 'google' ? 'profile,email' : 
                                    setting.provider === 'linkedin' ? 'r_emailaddress,r_liteprofile' : 
                                    'email'}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">افصل بين الصلاحيات المتعددة بفاصلة (,)</p>
                  </div>

                  <Button 
                    onClick={() => handleSubmit(setting.provider)} 
                    disabled={saving[setting.provider]}
                    className="mt-4"
                  >
                    {saving[setting.provider] && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    حفظ الإعدادات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}