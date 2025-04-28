import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Loader2,
  Search,
  MoreVertical,
  Download,
  Copy,
  Share2,
  ExternalLink,
  Trash2,
  Mail,
  QrCode,
  Award
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { downloadImage } from "@/lib/utils";

// Types
type Certificate = {
  id: number;
  title: string;
  titleAr?: string;
  templateId: number;
  certificateType: string;
  formData: Record<string, any>;
  imageUrl: string;
  createdAt: string;
  expiryDate?: string;
  status: string;
  issuedTo?: string;
  verificationCode: string;
  publicId: string;
  template?: {
    title: string;
    titleAr?: string;
    slug: string;
  };
};

export default function UserCertificatesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState<Certificate | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Fetch user certificates
  const { data, isLoading } = useQuery({
    queryKey: ["/api/user/certificates"],
    queryFn: getQueryFn({ on401: 'redirect-to-login' }),
  });
  
  // Safely access certificates array
  const certificates = Array.isArray(data?.certificates) ? data.certificates : [] as Certificate[];

  // Delete certificate mutation
  const deleteCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/certificates"] });
      setIsDeleteDialogOpen(false);
      setCurrentCertificate(null);
      toast({
        title: "تم حذف الشهادة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حذف الشهادة",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Share certificate by email mutation
  const shareCertificateByEmailMutation = useMutation({
    mutationFn: async (data: { certificateId: number, email: string }) => {
      const res = await apiRequest("POST", "/api/certificates/share-email", data);
      return res.json();
    },
    onSuccess: () => {
      setIsShareDialogOpen(false);
      setShareEmail("");
      toast({
        title: "تم مشاركة الشهادة بنجاح",
        description: "تم إرسال الشهادة إلى البريد الإلكتروني المحدد",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل مشاركة الشهادة",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle download certificate
  const handleDownloadCertificate = (certificate: Certificate) => {
    setIsDownloading(true);
    downloadImage(
      certificate.imageUrl,
      `شهادة_${certificate.issuedTo || certificate.id}.png`
    ).finally(() => {
      setIsDownloading(false);
    });
  };

  // Handle copy verification link
  const handleCopyVerificationLink = (verificationCode: string) => {
    const url = `${window.location.origin}/certificates/verify/${verificationCode}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast({
      title: "تم نسخ رابط التحقق",
      description: "تم نسخ رابط التحقق إلى الحافظة",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle share certificate
  const handleShareCertificate = (certificate: Certificate) => {
    setCurrentCertificate(certificate);
    setIsShareDialogOpen(true);
  };

  // Handle delete certificate
  const handleDeleteCertificate = (certificate: Certificate) => {
    setCurrentCertificate(certificate);
    setIsDeleteDialogOpen(true);
  };

  // Get certificate type translation
  const getCertificateType = (type: string) => {
    switch (type) {
      case 'appreciation': return 'شهادة تقدير';
      case 'training': return 'شهادة تدريب';
      case 'education': return 'شهادة تعليم';
      case 'teacher': return 'شهادة معلم';
      default: return type;
    }
  };

  // Filter certificates
  const filteredCertificates = certificates.filter((certificate: Certificate) => {
    // Filter by search query
    const matchesSearch = searchQuery
      ? certificate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (certificate.issuedTo && certificate.issuedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        certificate.verificationCode.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Filter by status
    const matchesStatus = selectedTab === "all" || 
      (selectedTab === "active" && certificate.status === "active") || 
      (selectedTab === "expired" && certificate.status === "expired");

    return matchesSearch && matchesStatus;
  });

  // Group certificates by month and year
  const groupedCertificates = filteredCertificates.reduce((groups: Record<string, Certificate[]>, certificate: Certificate) => {
    const date = new Date(certificate.createdAt);
    const monthYear = `${date.getMonth()}-${date.getFullYear()}`;
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(certificate);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">شهاداتي</h1>
          <p className="text-muted-foreground">الشهادات التي تم إصدارها لك</p>
        </div>
        <Button asChild>
          <Link href="/#templates?tab=certificates">
            إنشاء شهادة جديدة
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="البحث في الشهادات..."
          className="pr-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">الكل ({certificates.length || 0})</TabsTrigger>
          <TabsTrigger value="active">
            نشطة ({certificates.filter((c: Certificate) => c.status === "active").length || 0})
          </TabsTrigger>
          <TabsTrigger value="expired">
            منتهية ({certificates.filter((c: Certificate) => c.status === "expired").length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {Object.keys(groupedCertificates).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedCertificates).map(([monthYear, certificates]) => {
                const [month, year] = monthYear.split('-').map(Number);
                const date = new Date(year, month);
                const formattedDate = new Intl.DateTimeFormat('ar-SA', {
                  year: 'numeric',
                  month: 'long'
                }).format(date);

                return (
                  <div key={monthYear} className="space-y-4">
                    <h2 className="text-xl font-semibold">{formattedDate}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {certificates.map((certificate: Certificate) => (
                        <Card key={certificate.id} className="overflow-hidden">
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={certificate.imageUrl}
                              alt={`شهادة ${certificate.issuedTo || certificate.id}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">
                                  {certificate.title}
                                </h3>
                                {certificate.issuedTo && (
                                  <p className="text-sm text-muted-foreground">
                                    {certificate.issuedTo}
                                  </p>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                certificate.status === 'active' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {certificate.status === 'active' ? 'نشطة' : 'منتهية'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-sm text-muted-foreground">
                                {getCertificateType(certificate.certificateType)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(certificate.createdAt).toLocaleDateString('ar-SA')}
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0 flex justify-between">
                            <Button variant="outline" size="sm" onClick={() => handleDownloadCertificate(certificate)}>
                              <Download className="h-4 w-4 ml-1" />
                              تحميل
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-4 w-4 ml-1" />
                                  خيارات
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleCopyVerificationLink(certificate.verificationCode)}>
                                  <QrCode className="h-4 w-4 ml-2" />
                                  نسخ رابط التحقق
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShareCertificate(certificate)}>
                                  <Share2 className="h-4 w-4 ml-2" />
                                  مشاركة
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteCertificate(certificate)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد شهادات حتى الآن</h3>
              <p className="text-muted-foreground mb-6">
                لم يتم إصدار أي شهادات لك بعد
              </p>
              <Button asChild>
                <Link href="/#templates?tab=certificates">
                  استكشاف القوالب
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Share Certificate Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مشاركة الشهادة</DialogTitle>
            <DialogDescription>
              مشاركة الشهادة عبر البريد الإلكتروني أو وسائل التواصل الاجتماعي.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">رابط التحقق</h3>
              <div className="flex">
                <Input
                  readOnly
                  value={currentCertificate ? `${window.location.origin}/certificates/verify/${currentCertificate.verificationCode}` : ''}
                  className="flex-1 ml-2"
                />
                <Button 
                  variant="outline" 
                  onClick={() => currentCertificate && handleCopyVerificationLink(currentCertificate.verificationCode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                يمكن لأي شخص التحقق من صحة الشهادة باستخدام هذا الرابط
              </p>
            </div>
            
            <div className="space-y-2 mt-6">
              <h3 className="font-medium">مشاركة عبر البريد الإلكتروني</h3>
              <div className="space-y-4">
                <Input
                  placeholder="أدخل البريد الإلكتروني للمستلم"
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
                <Button 
                  onClick={() => {
                    if (currentCertificate && shareEmail) {
                      setIsSending(true);
                      shareCertificateByEmailMutation.mutate(
                        { certificateId: currentCertificate.id, email: shareEmail },
                        {
                          onSettled: () => setIsSending(false)
                        }
                      );
                    }
                  }}
                  disabled={!shareEmail || isSending}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Mail className="ml-2 h-4 w-4" />
                      إرسال
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف الشهادة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف هذه الشهادة؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentCertificate && (
              <div className="aspect-video w-[200px] h-[120px] mx-auto overflow-hidden rounded-md border">
                <img
                  src={currentCertificate.imageUrl}
                  alt="الشهادة"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-6 text-center">
              سيتم حذف الشهادة نهائياً ولن تتمكن من استعادتها.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => currentCertificate && deleteCertificateMutation.mutate(currentCertificate.id)}
              disabled={deleteCertificateMutation.isPending}
            >
              {deleteCertificateMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "تأكيد الحذف"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}