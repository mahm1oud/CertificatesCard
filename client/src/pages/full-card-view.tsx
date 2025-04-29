import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Loader2, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle // تغيير من Whatsapp إلى MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ShareOptions from "@/components/share-options";
import { downloadImage } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

type CardData = {
  id: number;
  publicId: string;
  title?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  lastAccessed?: string;
  accessCount: number;
  formData: Record<string, any>;
  quality?: string;
  template?: {
    id: number;
    title: string;
    titleAr?: string;
    slug: string;
    categoryId: number;
    category?: {
      id: number;
      name: string;
      nameAr?: string;
      slug: string;
    };
  };
  user?: {
    id: number;
    username: string;
    name?: string;
  };
};

export default function FullCardView() {
  const { cardId } = useParams<{ cardId: string }>();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [activeTab, setActiveTab] = useState<string>("preview");

  // Fetch card data
  const { data: card, isLoading, error } = useQuery<CardData>({
    queryKey: [`/api/cards/public/${cardId}`],
    queryFn: getQueryFn({}),
  });

  // Register view
  useEffect(() => {
    if (card?.id) {
      fetch(`/api/cards/${card.id}/view`, {
        method: 'POST'
      }).catch(err => console.error('Error registering view:', err));
    }
  }, [card?.id]);

  // Handle download
  const handleDownload = async () => {
    if (!card) return;
    
    setIsDownloading(true);
    try {
      await downloadImage(
        card.imageUrl,
        `بطاقة_${card.template?.title || card.id}.png`
      );
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle copy link
  const handleCopyLink = () => {
    if (!card) return;
    
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        setIsCopied(true);
        toast({
          title: "تم نسخ الرابط",
          description: "تم نسخ رابط البطاقة إلى الحافظة",
        });
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          title: "فشل نسخ الرابط",
          description: "يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
      }
    );
  };

  // Handle email share
  const handleEmailShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !shareEmail) return;
    
    setIsSending(true);
    fetch(`/api/cards/${card.id}/share-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: shareEmail }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('فشل إرسال البريد الإلكتروني');
        }
        return response.json();
      })
      .then(() => {
        toast({
          title: "تم إرسال البطاقة بنجاح",
          description: `تم إرسال البطاقة إلى ${shareEmail}`,
        });
        setShareEmail("");
        setIsShareDialogOpen(false);
      })
      .catch((error) => {
        toast({
          title: "فشل مشاركة البطاقة",
          description: error.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  // Handle social media sharing
  const shareVia = (platform: string) => {
    if (!card) return;
    
    const url = window.location.href;
    const title = card.template?.title || 'مشاركة بطاقة';
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank');
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "غير متوفر";
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  // Handle back button
  const handleBackClick = () => {
    // If we have a user and they were viewing their cards, go back to their cards
    if (user && card?.user?.id === user.id) {
      navigate('/user/cards');
    } else {
      // Otherwise go to home
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة
          </Button>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <Skeleton className="w-full aspect-[3/4] rounded-md" />
          </div>
          <div className="w-full md:w-1/3 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="flex space-x-2 space-x-reverse mt-6">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Link>
          </Button>
        </div>
        <Card className="text-center py-16">
          <CardContent>
            <h2 className="text-2xl font-bold mb-2">لم نتمكن من العثور على البطاقة</h2>
            <p className="text-muted-foreground mb-6">
              قد تكون البطاقة غير موجودة أو تم حذفها
            </p>
            <Button asChild>
              <Link href="/">
                العودة للصفحة الرئيسية
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-10 max-w-6xl">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 ml-2" />
          العودة
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="preview">عرض البطاقة</TabsTrigger>
            <TabsTrigger value="details">تفاصيل البطاقة</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2 space-x-reverse">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 ml-2" />
              )}
              تحميل البطاقة
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share2 className="h-4 w-4 ml-2" />
              مشاركة
            </Button>
          </div>
        </div>

        <TabsContent value="preview" className="m-0">
          <div className="flex justify-center">
            <div className="max-w-xl w-full overflow-hidden rounded-lg shadow-lg bg-gray-50">
              <img 
                src={card.imageUrl} 
                alt={card.template?.title || "بطاقة"} 
                className="w-full h-auto object-contain mx-auto max-h-[85vh]"
                style={{ aspectRatio: '3/4' }}
                loading="lazy"
                onError={(e) => {
                  console.error("Error loading image:", e);
                  e.currentTarget.src = "/placeholder-card.png";
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>تفاصيل البطاقة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">العنوان</h4>
                    <p className="font-medium">{card.template?.title || "بطاقة بدون عنوان"}</p>
                  </div>
                  {card.template?.titleAr && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">العنوان بالعربية</h4>
                      <p className="font-medium">{card.template.titleAr}</p>
                    </div>
                  )}
                  {card.template?.category && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">التصنيف</h4>
                      <p>{card.template.category.name}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">تاريخ الإنشاء</h4>
                    <p>{formatDate(card.createdAt)}</p>
                  </div>
                  {card.updatedAt && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">آخر تحديث</h4>
                      <p>{formatDate(card.updatedAt)}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">عدد المشاهدات</h4>
                    <p>{card.accessCount}</p>
                  </div>
                  {card.quality && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">الجودة</h4>
                      <p>{card.quality === 'high' ? 'عالية' : 
                          card.quality === 'medium' ? 'متوسطة' : 
                          card.quality === 'low' ? 'منخفضة' : 
                          card.quality}</p>
                    </div>
                  )}
                </div>

                {Object.keys(card.formData || {}).length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">بيانات البطاقة</h3>
                    <div className="bg-muted p-3 rounded-md space-y-2">
                      {Object.entries(card.formData).map(([key, value]) => (
                        <div key={key}>
                          <h4 className="text-xs font-medium">{key}</h4>
                          <p className="text-sm">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="space-y-4">
              {card.template && (
                <Card>
                  <CardHeader>
                    <CardTitle>بطاقات مشابهة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        استكشف المزيد من البطاقات في نفس التصنيف
                      </p>
                      <Button asChild className="w-full">
                        <Link href={`/?category=${card.template.category?.slug || ''}`}>
                          عرض المزيد من البطاقات
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>مشاركة البطاقة</DialogTitle>
            <DialogDescription>
              شارك هذه البطاقة مع العائلة والأصدقاء
            </DialogDescription>
          </DialogHeader>
          <ShareOptions 
            cardId={card.publicId} 
            imageUrl={card.imageUrl}
            templateId={card.template?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}