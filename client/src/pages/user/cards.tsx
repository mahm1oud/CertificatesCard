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
  DialogTrigger,
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
  Mail
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { downloadImage } from "@/lib/utils";

// Types
type Card = {
  id: number;
  templateId: number;
  userId: number;
  formData: Record<string, any>;
  imageUrl: string;
  thumbnailUrl?: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  lastAccessed?: string;
  quality: string;
  publicId: string;
  accessCount: number;
  settings?: Record<string, any>;
  status: string;
  template?: {
    title: string;
    titleAr?: string;
    slug: string;
    imageUrl: string;
    category: string;
  };
  category?: {
    name: string;
  };
};

export default function UserCardsPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shareEmail, setShareEmail] = useState("");

  // Fetch user cards
  const { data: cardsData, isLoading } = useQuery({
    queryKey: ["/api/user/cards"],
    queryFn: getQueryFn({ on401: 'redirect-to-login' }),
  });

  const cards = (cardsData?.cards || []) as Card[];
  const totalCards = cardsData?.total || 0;

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/cards"] });
      setIsDeleteDialogOpen(false);
      setCurrentCard(null);
      toast({
        title: "تم حذف البطاقة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حذف البطاقة",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Share card by email mutation
  const shareCardByEmailMutation = useMutation({
    mutationFn: async (data: { cardId: number, email: string }) => {
      const res = await apiRequest("POST", "/api/cards/share-email", data);
      return res.json();
    },
    onSuccess: () => {
      setIsShareDialogOpen(false);
      setShareEmail("");
      toast({
        title: "تم مشاركة البطاقة بنجاح",
        description: "تم إرسال البطاقة إلى البريد الإلكتروني المحدد",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل مشاركة البطاقة",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle download card
  const handleDownloadCard = (card: Card) => {
    setIsDownloading(true);
    downloadImage(
      card.imageUrl,
      `بطاقة_${card.id}.png`
    ).finally(() => {
      setIsDownloading(false);
    });
  };

  // Handle copy link
  const handleCopyLink = (publicId: string) => {
    const url = `${window.location.origin}/view/${publicId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "تم نسخ الرابط",
      description: "تم نسخ رابط البطاقة إلى الحافظة",
    });
  };

  // Handle share card
  const handleShareCard = (card: Card) => {
    setCurrentCard(card);
    setIsShareDialogOpen(true);
  };

  // Handle delete card
  const handleDeleteCard = (card: Card) => {
    setCurrentCard(card);
    setIsDeleteDialogOpen(true);
  };

  // Filtered cards
  const filteredCards = cards.filter((card: Card) => {
    // Filter by search query
    const matchesSearch = searchQuery
      ? (card.template?.title && card.template.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (card.publicId && card.publicId.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    // Filter by status
    const matchesStatus = selectedTab === "all" || card.status === selectedTab;

    return matchesSearch && matchesStatus;
  });

  // Group cards by month and year
  const groupedCards = filteredCards.reduce((groups: Record<string, Card[]>, card: Card) => {
    const date = new Date(card.createdAt);
    const monthYear = `${date.getMonth()}-${date.getFullYear()}`;
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(card);
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
          <h1 className="text-3xl font-bold">بطاقاتي</h1>
          <p className="text-muted-foreground">البطاقات التي قمت بإنشائها</p>
        </div>
        <Button asChild>
          <Link href="/#templates">
            إنشاء بطاقة جديدة
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="البحث في البطاقات..."
          className="pr-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">الكل ({cards.length})</TabsTrigger>
          <TabsTrigger value="active">
            نشطة ({cards.filter((c: Card) => c.status === "active").length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            مسودة ({cards.filter((c: Card) => c.status === "draft").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {Object.keys(groupedCards).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedCards).map(([monthYear, cards]) => {
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
                      {cards.map((card: Card) => (
                        <Card key={card.id} className="overflow-hidden">
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={card.imageUrl}
                              alt={`بطاقة ${card.id}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">
                                  {card.template?.title || `بطاقة ${card.id}`}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(card.createdAt).toLocaleDateString('ar-SA')}
                                </p>
                                {card.accessCount > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    عدد المشاهدات: {card.accessCount}
                                  </p>
                                )}
                              </div>
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
                                    <Link href={`/view/${card.publicId}`}>
                                      <ExternalLink className="h-4 w-4 ml-2" />
                                      عرض
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadCard(card)}>
                                    <Download className="h-4 w-4 ml-2" />
                                    تحميل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyLink(card.publicId)}>
                                    <Copy className="h-4 w-4 ml-2" />
                                    نسخ الرابط
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleShareCard(card)}>
                                    <Share2 className="h-4 w-4 ml-2" />
                                    مشاركة
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteCard(card)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0 flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/view/${card.publicId}`}>
                                عرض البطاقة
                              </Link>
                            </Button>
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
              <h3 className="text-lg font-medium mb-2">لا توجد بطاقات حتى الآن</h3>
              <p className="text-muted-foreground mb-6">
                قم بإنشاء بطاقة جديدة للبدء
              </p>
              <Button asChild>
                <Link href="/#templates">
                  إنشاء بطاقة جديدة
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Share Card Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مشاركة البطاقة</DialogTitle>
            <DialogDescription>
              مشاركة البطاقة عبر البريد الإلكتروني أو وسائل التواصل الاجتماعي.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">رابط البطاقة</h3>
              <div className="flex">
                <Input
                  readOnly
                  value={currentCard ? `${window.location.origin}/view/${currentCard.publicId}` : ''}
                  className="flex-1 ml-2"
                />
                <Button 
                  variant="outline" 
                  onClick={() => currentCard && handleCopyLink(currentCard.publicId)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
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
                    if (currentCard && shareEmail) {
                      setIsSending(true);
                      shareCardByEmailMutation.mutate(
                        { cardId: currentCard.id, email: shareEmail },
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
            <DialogTitle>حذف البطاقة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف هذه البطاقة؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentCard && (
              <div className="aspect-video w-[200px] h-[120px] mx-auto overflow-hidden rounded-md border">
                <img
                  src={currentCard.imageUrl}
                  alt="البطاقة"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-6 text-center">
              سيتم حذف البطاقة نهائياً ولن تتمكن من استعادتها.
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
              onClick={() => currentCard && deleteCardMutation.mutate(currentCard.id)}
              disabled={deleteCardMutation.isPending}
            >
              {deleteCardMutation.isPending ? (
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