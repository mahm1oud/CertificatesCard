import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DisplaySettingsFormProps {
  onChange?: (settings: DisplaySettings) => void;
}

export interface DisplaySettings {
  displayMode: 'single' | 'multi';
  enableSocialFormats: boolean;
  defaultSocialFormat: string | null;
}

export const DisplaySettingsForm: React.FC<DisplaySettingsFormProps> = ({ onChange }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<DisplaySettings>({
    displayMode: 'multi',
    enableSocialFormats: true,
    defaultSocialFormat: null
  });
  
  // استعلام عن الإعدادات الحالية
  const { data: settings, isLoading } = useQuery<{ settings: DisplaySettings }>({
    queryKey: ['/api/display-settings'],
    queryFn: ({ queryKey }) => apiRequest('GET', queryKey[0], undefined, { on401: 'redirect-to-login' }),
  });
  
  // mutation لحفظ الإعدادات باستخدام المسار الموحد
  const mutation = useMutation({
    mutationFn: (data: DisplaySettings) => 
      apiRequest('POST', '/api/display-settings', data, { on401: 'redirect-to-login' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/display-settings'] });
      toast({
        title: t('admin.settings.saved'),
        description: t('admin.settings.savedDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('errors.title'),
        description: error.message || t('errors.unknown'),
        variant: "destructive",
      });
    }
  });
  
  // تحديث النموذج عند استلام البيانات
  useEffect(() => {
    if (settings?.settings) {
      setFormData(settings.settings);
    }
  }, [settings]);
  
  // تحديث البيانات عند تغيير الحقول
  const handleChange = (key: keyof DisplaySettings, value: any) => {
    const updatedData = { ...formData, [key]: value };
    setFormData(updatedData);
    if (onChange) {
      onChange(updatedData);
    }
  };
  
  // إرسال النموذج
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.settings.display.title')}</CardTitle>
        <CardDescription>{t('admin.settings.display.description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('admin.settings.displayMode')}</h3>
            <RadioGroup 
              value={formData.displayMode} 
              onValueChange={(value) => handleChange('displayMode', value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="single" id="displayMode-single" />
                <Label htmlFor="displayMode-single" className="flex-1">
                  <div className="font-medium">{t('admin.settings.display.singlePage')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('admin.settings.display.singlePageDescription')}
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="multi" id="displayMode-multi" />
                <Label htmlFor="displayMode-multi" className="flex-1">
                  <div className="font-medium">{t('admin.settings.display.multiPage')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('admin.settings.display.multiPageDescription')}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('admin.settings.socialFormats')}</h3>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <input 
                type="checkbox" 
                id="enableSocialFormats" 
                checked={formData.enableSocialFormats}
                onChange={(e) => handleChange('enableSocialFormats', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="enableSocialFormats">{t('admin.settings.enableSocialFormats')}</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('admin.settings.socialFormatsDescription')}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};