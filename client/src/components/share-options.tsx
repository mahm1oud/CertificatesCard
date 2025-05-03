import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Copy, 
  Share2, 
  Loader2,
  Check,
  Download,
  QrCode
} from 'lucide-react';
import { SocialMediaFormats, type SocialMediaFormat } from './social-media-formats';
import { useTranslation } from '@/lib/i18n';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { downloadImage } from '@/lib/utils';

interface ShareOptionsProps {
  cardId: string | number;
  imageUrl: string;
  size?: 'sm' | 'md' | 'lg' | 'default';
  templateId?: string | number; // إضافة معرف القالب للوصول إلى محرر الشبكات الاجتماعية
}

const ShareOptions: React.FC<ShareOptionsProps> = ({ cardId, imageUrl, size = 'default', templateId }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('instagram');
  const [selectedFormatData, setSelectedFormatData] = useState<SocialMediaFormat | null>(null);
  const [socialImageUrl, setSocialImageUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Mutation for generating social media image
  const { mutate, isPending } = useMutation({
    mutationFn: async ({ format }: { format: string }) => {
      return apiRequest('POST', `/api/cards/${cardId}/social`, {
        format,
        options: {
          quality: 'high',
          watermark: false
        }
      });
    },
    onSuccess: (data) => {
      if (data && data.imageUrl) {
        setSocialImageUrl(data.imageUrl);
      }
    }
  });
  
  // Mutation for generating QR code
  const { mutate: generateQrCode, isPending: isQrCodePending } = useMutation({
    mutationFn: async () => {
      // Get the card public view URL
      const cardViewUrl = `${window.location.origin}/view/${cardId}`;
      
      // Create QR code SVG on client side (no need for server API)
      // Return a data URL with QR code
      return {
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardViewUrl)}`
      };
    },
    onSuccess: (data) => {
      if (data && data.qrCodeUrl) {
        setQrCodeUrl(data.qrCodeUrl);
        setShowQrCode(true);
      }
    }
  });
  
  // Handle format selection
  const handleFormatSelect = React.useCallback((format: string, formatData: SocialMediaFormat) => {
    setSelectedFormat(format);
    setSelectedFormatData(formatData);
    setSocialImageUrl(null);
    
    // لا نقوم بتوليد الصورة تلقائيًا هنا، بل سنستخدم زر "توليد" ليقوم المستخدم بالضغط عليه عندما يريد
  }, []);
  
  // وظيفة جديدة لتوليد الصورة عند الضغط على زر "توليد"
  const generateImage = React.useCallback(() => {
    if (selectedFormat) {
      mutate({ format: selectedFormat });
    }
  }, [selectedFormat, mutate]);
  
  // Handle copy link
  const handleCopyLink = () => {
    if (socialImageUrl) {
      const fullUrl = `${window.location.origin}${socialImageUrl}`;
      navigator.clipboard.writeText(fullUrl)
        .then(() => {
          setCopyStatus('copied');
          setTimeout(() => setCopyStatus('idle'), 3000);
        })
        .catch(error => {
          console.error('Could not copy text: ', error);
        });
    }
  };
  
  // Handle download
  const handleDownload = () => {
    if (socialImageUrl) {
      const fileName = `card-${selectedFormat}-${cardId}.png`;
      downloadImage(socialImageUrl, fileName);
    }
  };
  
  // Share to social networks
  const shareToFacebook = () => {
    if (socialImageUrl) {
      const url = encodeURIComponent(`${window.location.origin}${socialImageUrl}`);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  };
  
  const shareToTwitter = () => {
    if (socialImageUrl) {
      const url = encodeURIComponent(`${window.location.origin}${socialImageUrl}`);
      const text = encodeURIComponent(t('share.twitterText'));
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size={size}
        className="flex items-center gap-1"
        onClick={() => setIsOpen(true)}
      >
        <Share2 className="h-4 w-4" />
        {size === 'sm' ? '' : t('share.share')}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('share.title')}</DialogTitle>
            <DialogDescription>
              {t('share.description')}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-160px)] pr-4">
            <div className="space-y-4">
            <div className="flex flex-row gap-4 mb-4">
              <Button
                variant={!showQrCode ? "default" : "outline"}
                className="flex-1 flex justify-center items-center gap-2"
                onClick={() => {
                  setShowQrCode(false);
                }}
              >
                <Share2 className="h-4 w-4" />
                {t('share.socialMedia')}
              </Button>
              
              <Button
                variant={showQrCode ? "default" : "outline"}
                className="flex-1 flex justify-center items-center gap-2"
                onClick={() => {
                  setShowQrCode(true);
                  if (!qrCodeUrl) {
                    generateQrCode();
                  }
                }}
              >
                <QrCode className="h-4 w-4" />
                {t('share.qrCode')}
              </Button>
            </div>
            
            {!showQrCode && (
              <>
                <SocialMediaFormats 
                  onFormatSelect={handleFormatSelect}
                  selectedFormat={selectedFormat}
                  cardImageUrl={imageUrl}
                  onGenerateImage={generateImage}
                  templateId={templateId}
                />
                
                {isPending && (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                
                {socialImageUrl && !isPending && (
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <div className="text-sm font-medium mb-2">{t('share.preview')}</div>
                      <div className="flex justify-center">
                        <img 
                          src={socialImageUrl} 
                          alt="Social Media Version" 
                          className="max-w-full max-h-[300px] object-contain" 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={handleCopyLink}
                      >
                        {copyStatus === 'copied' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copyStatus === 'copied' ? t('share.copied') : t('share.copyLink')}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4" />
                        {t('share.download')}
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 bg-[#1877F2] text-white hover:bg-[#0b5ed7]"
                        onClick={shareToFacebook}
                      >
                        <Facebook className="h-4 w-4" />
                        {t('share.facebook')}
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 bg-[#1DA1F2] text-white hover:bg-[#0c85d0]"
                        onClick={shareToTwitter}
                      >
                        <Twitter className="h-4 w-4" />
                        {t('share.twitter')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {showQrCode && (
              <div className="space-y-4">
                {isQrCodePending && (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                
                {qrCodeUrl && !isQrCodePending && (
                  <>
                    <div className="border rounded-md p-4">
                      <div className="text-sm font-medium mb-2">{t('share.qrCodePreview')}</div>
                      <div className="flex justify-center">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code" 
                          className="max-w-full max-h-[300px] object-contain" 
                        />
                      </div>
                      <div className="text-xs text-center mt-2 text-gray-500">
                        {t('share.qrCodeDescription')}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2 sm:col-span-2"
                        onClick={() => downloadImage(qrCodeUrl, `qrcode-${cardId}.png`)}
                      >
                        <Download className="h-4 w-4" />
                        {t('share.downloadQrCode')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareOptions;