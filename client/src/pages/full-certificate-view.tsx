import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, ChevronLeft, Download, Share2, Copy, Check, QrCode, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadImage } from "@/lib/utils";
import ShareOptions from "@/components/share-options";

type Certificate = {
  id: number;
  publicId: string;
  title: string;
  templateId: number;
  certificateType: string;
  formData: Record<string, any>;
  imageUrl: string;
  createdAt: string;
  updatedAt?: string;
  expiryDate?: string;
  status: string;
  issuedTo?: string;
  issuedBy?: string;
  verificationCode: string;
  verificationCount: number;
  template?: {
    id: number;
    title: string;
    titleAr?: string;
    certificateType: string;
  };
  user?: {
    id: number;
    username: string;
    name?: string;
  };
};

export default function FullCertificateView() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  
  // Fetch certificate data
  const { data: certificate, isLoading, error } = useQuery<Certificate>({
    queryKey: [`/api/certificates/public/${certificateId}`],
    queryFn: getQueryFn({}),
  });
  
  // Register view
  useEffect(() => {
    if (certificate?.id) {
      fetch(`/api/certificates/${certificate.id}/view`, {
        method: 'POST'
      }).catch(err => console.error('Error registering view:', err));
    }
  }, [certificate]);
  
  // Handle certificate download
  const handleDownload = () => {
    if (certificate) {
      setIsDownloading(true);
      downloadImage(
        certificate.imageUrl,
        `شهادة_${certificate.issuedTo || certificate.id}.png`
      ).finally(() => {
        setIsDownloading(false);
      });
    }
  };
  
  // Handle copy verification link
  const handleCopyLink = () => {
    if (certificate?.verificationCode) {
      const url = `${window.location.origin}/certificates/verify/${certificate.verificationCode}`;
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط التحقق إلى الحافظة",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  // Handle email share
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shareEmail || !certificate) {
      return;
    }
    
    setIsSending(true);
    
    try {
      const response = await fetch(`/api/certificates/${certificate.id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: shareEmail }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل إرسال البريد الإلكتروني");
      }
      
      toast({
        title: "تم الإرسال بنجاح",
        description: `تم إرسال الشهادة إلى ${shareEmail}`,
      });
      
      setIsShareDialogOpen(false);
      setShareEmail("");
    } catch (error: any) {
      toast({
        title: "فشل الإرسال",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !certificate) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="max-w-md mx-auto">
          <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-4">الشهادة غير موجودة</h2>
          <p className="text-muted-foreground mb-6">
            لم نتمكن من العثور على الشهادة المطلوبة. قد تكون الشهادة غير صالحة أو تم حذفها.
          </p>
          <Button onClick={() => navigate("/")}>
            <ChevronLeft className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }
  
  // Certificate type in Arabic
  const getCertificateType = (type: string) => {
    switch(type) {
      case 'appreciation': return 'شهادة تقدير';
      case 'training': return 'شهادة تدريب';
      case 'education': return 'شهادة تعليم';
      case 'teacher': return 'شهادة للمعلمين';
      default: return 'شهادة';
    }
  };
  
  // Generate QR Code URL for verification
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `${window.location.origin}/certificates/verify/${certificate.verificationCode}`
  )}`;
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/")}>
          <ChevronLeft className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={isDownloading} className="min-w-[100px]">
            {isDownloading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحميل...
              </>
            ) : (
              <>
                <Download className="ml-2 h-4 w-4" />
                تحميل
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
            <Share2 className="ml-2 h-4 w-4" />
            مشاركة الشهادة
          </Button>
          
          <Button variant="outline" onClick={handleCopyLink}>
            {isCopied ? (
              <>
                <Check className="ml-2 h-4 w-4 text-green-500" />
                تم النسخ!
              </>
            ) : (
              <>
                <Copy className="ml-2 h-4 w-4" />
                نسخ رابط التحقق
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={() => setIsQRDialogOpen(true)}>
            <QrCode className="ml-2 h-4 w-4" />
            عرض رمز QR
          </Button>
        </div>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{certificate.title}</h1>
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <div className="flex items-center">
            <Award className="h-4 w-4 ml-1" />
            {getCertificateType(certificate.certificateType)}
          </div>
          {certificate.createdAt && (
            <div>
              تاريخ الإصدار: {new Date(certificate.createdAt).toLocaleDateString('ar-SA')}
            </div>
          )}
          {certificate.expiryDate && (
            <div>
              تاريخ الانتهاء: {new Date(certificate.expiryDate).toLocaleDateString('ar-SA')}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-[1.414/1] w-full bg-white">
                <img 
                  src={certificate.imageUrl} 
                  alt={certificate.title} 
                  className="w-full h-full object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">معلومات الشهادة</h2>
              
              {certificate.issuedTo && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">الممنوحة إلى</h3>
                  <p className="font-medium">{certificate.issuedTo}</p>
                </div>
              )}
              
              {certificate.issuedBy && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">الجهة المانحة</h3>
                  <p>{certificate.issuedBy}</p>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">رمز التحقق</h3>
                <div className="flex items-center mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {certificate.verificationCode}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 ml-2" 
                    onClick={handleCopyLink}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">رابط التحقق</h3>
                <p className="text-sm break-all mt-1 text-muted-foreground">
                  {`${window.location.origin}/certificates/verify/${certificate.verificationCode}`}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center">
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="mx-auto mb-2 max-w-[150px]" 
            />
            <p className="text-sm text-muted-foreground mb-4">
              امسح رمز QR للتحقق من صحة الشهادة
            </p>
          </div>
          
          {/* زر مشاركة الشهادة */}
          <Card>
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share2 className="ml-2 h-4 w-4" />
                مشاركة الشهادة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>مشاركة الشهادة</DialogTitle>
            <DialogDescription>
              شارك هذه الشهادة مع العائلة والأصدقاء
            </DialogDescription>
          </DialogHeader>
          <ShareOptions 
            cardId={certificate.publicId} 
            imageUrl={certificate.imageUrl}
            templateId={certificate.templateId}
          />
        </DialogContent>
      </Dialog>
      
      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>رمز QR للتحقق</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex justify-center">
            <img src={qrCodeUrl} alt="QR Code" className="max-w-full" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            يمكن استخدام رمز QR للتحقق من صحة الشهادة
          </p>
          <Button variant="outline" onClick={handleCopyLink}>
            {isCopied ? (
              <>
                <Check className="ml-2 h-4 w-4 text-green-500" />
                تم النسخ!
              </>
            ) : (
              <>
                <Copy className="ml-2 h-4 w-4" />
                نسخ رابط التحقق
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}