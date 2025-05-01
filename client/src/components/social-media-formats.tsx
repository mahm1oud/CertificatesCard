import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { ImageIcon, InstagramIcon, TwitterIcon, FacebookIcon, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

// Define interface for social media format
export interface SocialMediaFormat {
  width: number;
  height: number;
  ratio: string;
  description: string;
}

// Define props for the SocialMediaFormats component
interface SocialMediaFormatsProps {
  onFormatSelect: (format: string, formatData: SocialMediaFormat) => void;
  selectedFormat?: string;
  cardImageUrl?: string;
  onGenerateImage?: () => void;
  templateId?: string | number; // معرف القالب إذا كان متاحًا للتعديل
}

// Social Media Format Selection Component
export const SocialMediaFormats: React.FC<SocialMediaFormatsProps> = ({
  onFormatSelect,
  selectedFormat,
  cardImageUrl,
  onGenerateImage,
  templateId
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(selectedFormat || 'instagram');
  
  // Fetch social media format settings from public API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/social-formats'],
    queryFn: () => apiRequest('GET', '/api/social-formats'),
  });
  
  // Select the format when tab changes
  // Definir un controlador para gestionar manualmente cuando llamar a onFormatSelect
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // لا نقوم بتوليد الصورة تلقائيًا عند تغيير التبويب
  };
  
  // إضافة وظيفة جديدة لتوليد الصورة عند النقر على زر "توليد"
  const handleGenerateImage = () => {
    if (data?.formats && activeTab) {
      const formatData = data.formats[activeTab];
      if (formatData) {
        onFormatSelect(activeTab, formatData);
      }
    } else if (defaultFormats && activeTab) {
      const formatData = defaultFormats[activeTab as keyof typeof defaultFormats];
      if (formatData) {
        onFormatSelect(activeTab, formatData);
      }
    }
  };
  
  // تحديد التنسيق الافتراضي فقط عند تحميل المكون
  useEffect(() => {
    // لا نقوم بتوليد الصورة تلقائيًا، بل ننتظر حتى ينقر المستخدم
    setActiveTab(selectedFormat || 'instagram');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  
  // Default formats in case API call fails - definirlo antes del useEffect
  const defaultFormats = React.useMemo(() => ({
    instagram: { width: 1080, height: 1080, ratio: '1:1', description: 'Instagram (Square)' },
    instagramStory: { width: 1080, height: 1920, ratio: '9:16', description: 'Instagram Story' },
    facebook: { width: 1200, height: 630, ratio: '1.91:1', description: 'Facebook' },
    twitter: { width: 1200, height: 675, ratio: '16:9', description: 'Twitter' },
    whatsapp: { width: 800, height: 800, ratio: '1:1', description: 'WhatsApp' },
    pinterest: { width: 1000, height: 1500, ratio: '2:3', description: 'Pinterest' }
  }), []);
  
  const formats = data?.formats || defaultFormats;
  
  // Helper function to get icon for format
  const getFormatIcon = (formatKey: string) => {
    switch(formatKey) {
      case 'instagram':
      case 'instagramStory':
        return <InstagramIcon className="h-4 w-4" />;
      case 'twitter':
        return <TwitterIcon className="h-4 w-4" />;
      case 'facebook':
        return <FacebookIcon className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-red-500">{t('errors.loadingFormats')}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-3">{t('socialMediaFormats.title')}</h3>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 grid grid-cols-3 sm:grid-cols-6">
            {Object.keys(formats).map((formatKey) => (
              <TabsTrigger 
                key={formatKey} 
                value={formatKey}
                className="flex items-center gap-1"
              >
                {getFormatIcon(formatKey)}
                <span className="hidden sm:inline">
                  {formats[formatKey].description.split(' ')[0]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.keys(formats).map((formatKey) => (
            <TabsContent key={formatKey} value={formatKey}>
              <div className="flex flex-col md:flex-row gap-4 max-h-[500px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-1">
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm mb-1">{formats[formatKey].description}</div>
                    <div className="text-xs text-muted-foreground">
                      {formats[formatKey].width} x {formats[formatKey].height} px 
                      ({formats[formatKey].ratio})
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => {
                          // استخدم دالة التوليد من الأب إذا كانت متوفرة، وإلا استخدم الدالة المحلية
                          if (onGenerateImage) {
                            onGenerateImage();
                          } else {
                            handleGenerateImage();
                          }
                        }}
                      >
                        {t('share.generate')}
                      </Button>
                      
                      {templateId && user?.role === 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full flex items-center gap-1 text-blue-600"
                          asChild
                        >
                          <Link href={`/social-template-editor/${templateId}`}>
                            <ExternalLink className="h-4 w-4" />
                            {t('share.socialEditor') || 'محرر الشبكات الاجتماعية'}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {cardImageUrl && (
                  <div className="flex-1">
                    <div 
                      className="bg-muted rounded-md flex items-center justify-center overflow-hidden" 
                      style={{
                        maxWidth: '300px',
                        maxHeight: '300px',
                        aspectRatio: formats[formatKey].ratio.replace(':', '/'),
                      }}
                    >
                      <img 
                        src={cardImageUrl} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain" 
                      />
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.open(cardImageUrl, '_blank')}
                    >
                      {t('share.preview')}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};