import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient-updated";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Loader2,
  Search,
  MoreVertical,
  ExternalLink,
  Trash2,
  FileImage,
  Eye,
  Filter,
  User,
  Download,
  QrCode,
  Award,
  Upload,
  Plus
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Types
type Certificate = {
  id: number;
  title: string;
  titleAr?: string;
  templateId: number;
  userId: number | null;
  certificateType: string;
  formData: Record<string, any>;
  imageUrl: string;
  createdAt: string;
  expiryDate?: string;
  status: string;
  issuedTo?: string;
  issuedToGender?: string;
  verificationCode: string;
  publicId: string;
  template?: {
    title: string;
    titleAr?: string;
    slug: string;
  };
  user?: {
    username: string;
    email: string;
  };
};

type CertificateBatch = {
  id: number;
  title: string;
  userId: number;
  templateId: number;
  status: string;
  totalItems: number;
  processedItems: number;
  sourceType: string;
  sourceData?: string;
  createdAt: string;
  completedAt?: string;
  user?: {
    username: string;
  };
  template?: {
    title: string;
  };
};

export default function AdminCertificatesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("certificates");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState<Certificate | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [batchTitle, setBatchTitle] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch certificates with pagination
  const {
    data: certificatesData,
    isLoading: isCertificatesLoading,
    isFetching: isCertificatesFetching,
  } = useQuery({
    queryKey: ["/api/admin/certificates", page, limit, selectedStatus, selectedType, searchQuery],
    queryFn: () => getQueryFn({})({
      queryKey: ["/api/admin/certificates"],
      meta: {
        params: {
          page,
          limit,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          type: selectedType !== "all" ? selectedType : undefined,
          search: searchQuery || undefined
        }
      }
    }),
    enabled: activeTab === "certificates"
  });

  // Fetch batches
  const {
    data: batchesData,
    isLoading: isBatchesLoading,
    isFetching: isBatchesFetching,
  } = useQuery({
    queryKey: ["/api/admin/certificate-batches", page, limit],
    queryFn: () => getQueryFn({})({
      queryKey: ["/api/admin/certificate-batches"],
      meta: {
        params: {
          page,
          limit
        }
      }
    }),
    enabled: activeTab === "batches"
  });

  // Fetch templates for batch upload
  const { data: templates, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: getQueryFn({}),
  });

  // Delete certificate mutation
  const deleteCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/certificates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificates"] });
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

  // Delete batch mutation
  const deleteBatchMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/certificate-batches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificate-batches"] });
      toast({
        title: "تم حذف المجموعة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حذف المجموعة",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Upload batch mutation
  const uploadBatchMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/certificate-batches", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل رفع الملف");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificate-batches"] });
      setIsUploadDialogOpen(false);
      setSelectedTemplate("");
      setBatchTitle("");
      toast({
        title: "تم رفع الملف بنجاح",
        description: "جاري معالجة الشهادات"
      });
    },
    onError: (error) => {
      toast({
        title: "فشل رفع الملف",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle delete certificate
  const handleDeleteCertificate = (certificate: Certificate) => {
    setCurrentCertificate(certificate);
    setIsDeleteDialogOpen(true);
  };

  // Handle file upload
  const handleBatchUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formElement = e.currentTarget;
    const fileInput = formElement.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (!fileInput?.files?.length) {
      toast({
        title: "يرجى اختيار ملف",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedTemplate) {
      toast({
        title: "يرجى اختيار قالب",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("templateId", selectedTemplate);
    formData.append("title", batchTitle || `مجموعة شهادات ${new Date().toLocaleDateString('ar-SA')}`);
    
    uploadBatchMutation.mutate(formData);
  };

  // Get data
  const certificates = certificatesData?.certificates || [];
  const totalCertificates = certificatesData?.total || 0;
  const totalCertificatesPages = Math.ceil(totalCertificates / limit);
  
  const batches = batchesData?.batches || [];
  const totalBatches = batchesData?.total || 0;
  const totalBatchesPages = Math.ceil(totalBatches / limit);

  const isLoading = activeTab === "certificates" ? isCertificatesLoading : isBatchesLoading;
  const isFetching = activeTab === "certificates" ? isCertificatesFetching : isBatchesFetching;
  const totalPages = activeTab === "certificates" ? totalCertificatesPages : totalBatchesPages;
  const totalItems = activeTab === "certificates" ? totalCertificates : totalBatches;

  // Get translated certificate type
  const getCertificateTypeName = (type: string) => {
    switch (type) {
      case "appreciation": return "شهادة تقدير";
      case "training": return "شهادة تدريب";
      case "education": return "شهادة تعليم";
      case "teacher": return "شهادة معلم";
      default: return type;
    }
  };

  // Get batch status in Arabic
  const getBatchStatusName = (status: string) => {
    switch (status) {
      case "pending": return "قيد الانتظار";
      case "processing": return "جاري المعالجة";
      case "completed": return "مكتملة";
      case "failed": return "فشلت";
      default: return status;
    }
  };

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
          <h1 className="text-3xl font-bold">الشهادات</h1>
          <p className="text-muted-foreground">إدارة الشهادات ومجموعات الشهادات</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/certificates/new">
              <Plus className="h-4 w-4 ml-2" />
              إنشاء شهادة
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 ml-2" />
            رفع ملف إكسل
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="certificates">الشهادات</TabsTrigger>
          <TabsTrigger value="batches">مجموعات الشهادات</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="mt-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="البحث في الشهادات..."
                className="pr-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="نوع الشهادة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="appreciation">شهادة تقدير</SelectItem>
                    <SelectItem value="training">شهادة تدريب</SelectItem>
                    <SelectItem value="education">شهادة تعليم</SelectItem>
                    <SelectItem value="teacher">شهادة معلم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="حالة الشهادة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="active">نشطة</SelectItem>
                    <SelectItem value="expired">منتهية</SelectItem>
                    <SelectItem value="revoked">ملغاة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>الشهادات</CardTitle>
              <CardDescription>
                عدد الشهادات: {totalCertificates}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length ? (
                <>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">الصورة</TableHead>
                          <TableHead>العنوان</TableHead>
                          <TableHead>الممنوحة إلى</TableHead>
                          <TableHead>نوع الشهادة</TableHead>
                          <TableHead>تاريخ الإصدار</TableHead>
                          <TableHead>رمز التحقق</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {certificates.map((certificate: Certificate) => (
                          <TableRow key={certificate.id}>
                            <TableCell>
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                                {certificate.imageUrl ? (
                                  <img
                                    src={certificate.imageUrl}
                                    alt="الشهادة"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                    <Award className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{certificate.title}</div>
                              {certificate.titleAr && (
                                <div className="text-xs text-muted-foreground">{certificate.titleAr}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {certificate.issuedTo ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div>{certificate.issuedTo}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {certificate.issuedToGender === 'male' ? 'ذكر' : 'أنثى'}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getCertificateTypeName(certificate.certificateType)}</TableCell>
                            <TableCell>
                              {new Date(certificate.createdAt).toLocaleDateString('ar-SA')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="bg-muted text-xs px-1 py-0.5 rounded">
                                  {certificate.verificationCode}
                                </code>
                                <Link href={`/certificates/verify/${certificate.verificationCode}`}>
                                  <Button variant="ghost" size="icon">
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                certificate.status === 'active' ? 'bg-green-100 text-green-800' : 
                                certificate.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                                certificate.status === 'revoked' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {certificate.status === 'active' ? 'نشطة' : 
                                certificate.status === 'expired' ? 'منتهية' : 
                                certificate.status === 'revoked' ? 'ملغاة' : certificate.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>خيارات</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/certificates/public/${certificate.publicId}`}>
                                      <Eye className="h-4 w-4 ml-2" />
                                      عرض الشهادة
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => window.open(`/certificates/verify/${certificate.verificationCode}`, '_blank')}>
                                    <QrCode className="h-4 w-4 ml-2" />
                                    صفحة التحقق
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
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        عرض {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} من {totalItems}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(p - 1, 1))}
                          disabled={page === 1 || isFetching}
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                          disabled={page === totalPages || isFetching}
                        >
                          التالي
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  لا توجد شهادات متطابقة مع معايير البحث
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>مجموعات الشهادات</CardTitle>
              <CardDescription>
                عدد المجموعات: {totalBatches}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batches.length ? (
                <>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>العنوان</TableHead>
                          <TableHead>المستخدم</TableHead>
                          <TableHead>القالب</TableHead>
                          <TableHead>نوع المصدر</TableHead>
                          <TableHead className="text-center">البنود</TableHead>
                          <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batches.map((batch: CertificateBatch) => (
                          <TableRow key={batch.id}>
                            <TableCell>
                              <div className="font-medium">{batch.title}</div>
                            </TableCell>
                            <TableCell>
                              {batch.user?.username || `مستخدم ${batch.userId}`}
                            </TableCell>
                            <TableCell>
                              {batch.template?.title || `قالب ${batch.templateId}`}
                            </TableCell>
                            <TableCell>
                              {batch.sourceType === 'excel' ? 'ملف إكسل' : 
                              batch.sourceType === 'csv' ? 'ملف CSV' : 
                              batch.sourceType === 'manual' ? 'إدخال يدوي' : batch.sourceType}
                            </TableCell>
                            <TableCell className="text-center">
                              {batch.processedItems}/{batch.totalItems}
                            </TableCell>
                            <TableCell className="text-center">
                              {new Date(batch.createdAt).toLocaleDateString('ar-SA')}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                batch.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                batch.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                batch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getBatchStatusName(batch.status)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>خيارات</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/certificate-batches/${batch.id}`}>
                                      <Eye className="h-4 w-4 ml-2" />
                                      عرض التفاصيل
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => deleteBatchMutation.mutate(batch.id)}
                                    className="text-destructive focus:text-destructive"
                                    disabled={deleteBatchMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        عرض {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} من {totalItems}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(p - 1, 1))}
                          disabled={page === 1 || isFetching}
                        >
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                          disabled={page === totalPages || isFetching}
                        >
                          التالي
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  لا توجد مجموعات شهادات
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Upload Batch Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفع ملف إكسل</DialogTitle>
            <DialogDescription>
              قم برفع ملف إكسل يحتوي على بيانات الشهادات المراد إنشاؤها.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBatchUpload} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                عنوان المجموعة
              </label>
              <Input
                id="title"
                value={batchTitle}
                onChange={(e) => setBatchTitle(e.target.value)}
                placeholder="أدخل عنوان مجموعة الشهادات"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="template" className="text-sm font-medium">
                القالب
              </label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر قالب الشهادات" />
                </SelectTrigger>
                <SelectContent>
                  {(templates?.templates || []).map((template: any) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">
                ملف إكسل
              </label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                required
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                يجب أن يحتوي الملف على أعمدة تطابق حقول القالب المختار.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsUploadDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit"
                disabled={uploadBatchMutation.isPending || !selectedTemplate}
              >
                {uploadBatchMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  "رفع الملف"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}