import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, ChevronLeft, Download, Copy, Share2, Check, QrCode, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadImage } from "@/lib/utils";
import { FallbackImage } from "@/components/ui/fallback-image";

export default function CertificatePreview() {
  const { certificateId } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  
  // Fetch certificate data
  const { data: certificate, isLoading } = useQuery({
    queryKey: [`/api/certificates/${certificateId}`],
    queryFn: getQueryFn({}),
    enabled: !!certificateId
  });
  
  // Handle certificate download
  const handleDownload = () => {
    if (certificate) {
      setIsDownloading(true);
      console.log("Downloading certificate:", certificate);
      const fileName = `شهادة_${certificate.issuedTo || certificate.id || 'custom'}.png`;
      console.log(`Downloading certificate image: ${certificate.imageUrl}, filename: ${fileName}`);
      
      try {
        downloadImage(certificate.imageUrl, fileName);
        setIsDownloading(false);
      } catch (error) {
        console.error('Error downloading certificate:', error);
        toast({
          title: "خطأ في التنزيل",
          description: "حدث خطأ أثناء تنزيل الشهادة. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
        setIsDownloading(false);
      }
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
  
  // Handle view full certificate
  const handleViewFull = () => {
    if (certificate?.publicId) {
      setLocation(`/certificate/${certificate.publicId}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!certificate) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">لم يتم العثور على الشهادة</h2>
        <p className="text-muted-foreground mb-6">
          لم نتمكن من العثور على الشهادة المطلوبة. يرجى التحقق من الرابط.
        </p>
        <Button onClick={() => setLocation("/")}>
          <ChevronLeft className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>
      </div>
    );
  }
  
  // Generate QR Code URL for verification
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `${window.location.origin}/certificates/verify/${certificate.verificationCode}`
  )}`;
  
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ChevronLeft className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="ml-2 h-4 w-4" />
                  مشاركة
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                  <Mail className="ml-2 h-4 w-4" />
                  مشاركة عبر البريد الإلكتروني
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  {isCopied ? (
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="ml-2 h-4 w-4" />
                  )}
                  نسخ رابط التحقق
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsQRDialogOpen(true)}>
                  <QrCode className="ml-2 h-4 w-4" />
                  عرض رمز QR للتحقق
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 border-b pb-4">
            <h1 className="text-2xl font-bold">{certificate.title}</h1>
            <p className="text-muted-foreground">
              {certificate.certificateType === 'appreciation' && 'شهادة تقدير'}
              {certificate.certificateType === 'training' && 'شهادة تدريب'}
              {certificate.certificateType === 'education' && 'شهادة تعليم'}
              {certificate.certificateType === 'teacher' && 'شهادة للمعلمين'}
            </p>
          </div>
          
          {certificate.issuedTo && (
            <div className="mb-4 text-center py-2 bg-muted/30 rounded">
              <p className="text-sm text-muted-foreground">تم إصدار هذه الشهادة إلى</p>
              <p className="text-lg font-medium">{certificate.issuedTo}</p>
            </div>
          )}
          
          <div className="aspect-[1.414/1] w-full border rounded-lg overflow-hidden mb-6">
            <FallbackImage 
              src={certificate.imageUrl} 
              alt={certificate.title} 
              className="w-full h-full object-contain"
              fallbackSrc="/static/default-logo.svg"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/30 p-4 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">رمز التحقق</p>
              <p className="font-mono font-medium">{certificate.verificationCode}</p>
            </div>
            
            <Button onClick={handleViewFull}>
              <Award className="ml-2 h-4 w-4" />
              عرض الشهادة كاملة
            </Button>
          </div>
        </div>
      </div>
      
      {/* Email Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>مشاركة عبر البريد الإلكتروني</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-160px)]">
            <form onSubmit={handleSendEmail}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">عنوان البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="أدخل عنوان البريد الإلكتروني"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    "إرسال"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="text-center max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>رمز QR للتحقق</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-160px)]">
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}