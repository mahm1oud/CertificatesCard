import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Facebook, Twitter, Globe, Linkedin, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Social providers configuration
const socialProviders = [
  {
    id: 'google',
    name: 'Google',
    color: '#EA4335',
    icon: <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
          </svg>,
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { name: 'redirectUri', label: 'Redirect URI', type: 'text', required: true },
    ],
    scopes: 'email,profile',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    icon: <Facebook className="h-4 w-4" />,
    fields: [
      { name: 'clientId', label: 'App ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'App Secret', type: 'password', required: true },
      { name: 'redirectUri', label: 'Redirect URI', type: 'text', required: true },
    ],
    scopes: 'email,public_profile',
  },
  {
    id: 'twitter',
    name: 'Twitter',
    color: '#1DA1F2',
    icon: <Twitter className="h-4 w-4" />,
    fields: [
      { name: 'clientId', label: 'API Key', type: 'text', required: true },
      { name: 'clientSecret', label: 'API Secret', type: 'password', required: true },
      { name: 'redirectUri', label: 'Callback URL', type: 'text', required: true },
    ],
    scopes: '',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: <Linkedin className="h-4 w-4" />,
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { name: 'redirectUri', label: 'Redirect URI', type: 'text', required: true },
    ],
    scopes: 'r_liteprofile,r_emailaddress',
  },
];

export default function SocialAuthSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(socialProviders[0].id);
  
  // Fetch social auth settings
  const { data: authSettings, isLoading } = useQuery({
    queryKey: ['/api/auth-settings'],
    queryFn: async () => {
      const response = await fetch('/api/auth-settings');
      if (!response.ok) throw new Error('Failed to fetch auth settings');
      const data = await response.json();
      return data.settings || [];
    },
  });
  
  // Update social auth settings
  const updateMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/auth-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('admin.settings.auth.saveSuccess'),
        description: t('admin.settings.auth.saveSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth-settings'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.settings.auth.saveError'),
        description: error.message,
      });
    }
  });
  
  // Find provider settings from the fetched data
  const getProviderSettings = (providerId: string) => {
    if (!authSettings) return null;
    return authSettings.find((setting: any) => setting.provider === providerId) || {
      provider: providerId,
      enabled: false,
      clientId: '',
      clientSecret: '',
      redirectUri: `${window.location.origin}/auth/${providerId}/callback`,
    };
  };
  
  // Handle form submission
  const handleSaveSettings = (providerId: string, formData: FormData) => {
    const currentSettings = getProviderSettings(providerId);
    if (!currentSettings) return;
    
    const updatedSettings = {
      ...currentSettings,
      clientId: formData.get('clientId') as string,
      clientSecret: formData.get('clientSecret') as string,
      redirectUri: formData.get('redirectUri') as string,
      enabled: formData.get('enabled') === 'on',
    };
    
    updateMutation.mutate(updatedSettings);
  };
  
  // Handle toggle switch change
  const handleToggleProvider = (providerId: string, enabled: boolean) => {
    const currentSettings = getProviderSettings(providerId);
    if (!currentSettings) return;
    
    const updatedSettings = {
      ...currentSettings,
      enabled,
    };
    
    updateMutation.mutate(updatedSettings);
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('admin.settings.auth.title')}
        </h1>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('admin.settings.auth.setupDescription')}
        </AlertDescription>
      </Alert>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          {socialProviders.map(provider => (
            <TabsTrigger 
              key={provider.id} 
              value={provider.id}
              className="flex items-center gap-2"
            >
              <span 
                className="flex h-6 w-6 items-center justify-center rounded-full" 
                style={{ backgroundColor: provider.color }}
              >
                {provider.icon}
              </span>
              <span className="hidden md:inline">{provider.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {socialProviders.map(provider => {
          const providerSettings = getProviderSettings(provider.id);
          const isEnabled = providerSettings?.enabled || false;
          
          return (
            <TabsContent key={provider.id} value={provider.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <CardTitle>
                        <span className="flex items-center gap-2">
                          <span 
                            className="flex h-6 w-6 items-center justify-center rounded-full" 
                            style={{ backgroundColor: provider.color }}
                          >
                            {provider.icon}
                          </span>
                          {provider.name} {t('admin.settings.auth.integration')}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {t('admin.settings.auth.integrationDescription', { provider: provider.name })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        id={`${provider.id}-enabled`}
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggleProvider(provider.id, checked)}
                      />
                      <Label htmlFor={`${provider.id}-enabled`}>
                        {isEnabled ? t('admin.settings.auth.enabled') : t('admin.settings.auth.disabled')}
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form
                    id={`${provider.id}-form`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleSaveSettings(provider.id, formData);
                    }}
                    className="space-y-4"
                  >
                    {provider.fields.map(field => (
                      <div key={field.name} className="grid gap-2">
                        <Label htmlFor={`${provider.id}-${field.name}`}>
                          {field.label} {field.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          id={`${provider.id}-${field.name}`}
                          name={field.name}
                          type={field.type}
                          defaultValue={providerSettings?.[field.name as keyof typeof providerSettings] as string || ''}
                          placeholder={t('admin.settings.auth.enterValue', { field: field.label })}
                          required={field.required}
                          disabled={!isEnabled}
                        />
                      </div>
                    ))}
                    
                    <div className="grid gap-2">
                      <Label htmlFor={`${provider.id}-scopes`}>
                        {t('admin.settings.auth.scopes')}
                      </Label>
                      <Input
                        id={`${provider.id}-scopes`}
                        name="scopes"
                        defaultValue={providerSettings?.settings?.scopes || provider.scopes}
                        placeholder={t('admin.settings.auth.scopesPlaceholder')}
                        disabled={!isEnabled}
                      />
                      <p className="text-sm text-muted-foreground">
                        {t('admin.settings.auth.scopesHint')}
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>{t('admin.settings.auth.callbackUrl')}</Label>
                      <div className="flex items-center rounded-md border px-3 py-2 text-sm">
                        <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                        <code className="text-xs">{window.location.origin}/auth/{provider.id}/callback</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('admin.settings.auth.callbackUrlHint')}
                      </p>
                    </div>
                    
                    <input type="hidden" name="enabled" value={isEnabled ? 'on' : 'off'} />
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab(
                      socialProviders[(socialProviders.findIndex(p => p.id === provider.id) + 1) % socialProviders.length].id
                    )}
                  >
                    {t('admin.settings.auth.nextProvider')}
                  </Button>
                  <Button 
                    type="submit" 
                    form={`${provider.id}-form`}
                    disabled={!isEnabled || updateMutation.isPending}
                  >
                    {updateMutation.isPending 
                      ? t('admin.settings.auth.saving') 
                      : t('admin.settings.auth.saveSettings')}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}