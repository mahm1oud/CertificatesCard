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
  User
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Types
type Card = {
  id: number;
  templateId: number;
  userId: number | null;
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
  status: string;
  template?: {
    title: string;
    titleAr?: string;
    slug: string;
  };
  category?: {
    name: string;
    nameAr?: string;
  };
  user?: {
    username: string;
    email: string;
  };
};

export default function AdminCardsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch cards with pagination
  const {
    data: cardsData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["/api/admin/cards", page, limit, selectedStatus, selectedCategory, searchQuery],
    queryFn: () => getQueryFn({})({
      queryKey: ["/api/admin/cards"],
      meta: {
        params: {
          page,
          limit,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          search: searchQuery || undefined
        }
      }
    }),
  });

  // Fetch categories for filter
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({}),
  });

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cards"] });
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

  // Handle delete card
  const handleDeleteCard = (card: Card) => {
    setCurrentCard(card);
    setIsDeleteDialogOpen(true);
  };

  // Get cards and total count
  const cards = cardsData?.cards || [];
  const totalCards = cardsData?.total || 0;
  const totalPages = Math.ceil(totalCards / limit);

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
          <h1 className="text-3xl font-bold">البطاقات</h1>
          <p className="text-muted-foreground">إدارة البطاقات المنشأة في النظام</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث في البطاقات..."
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="جميع التصنيفات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="حالة البطاقة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="deleted">محذوفة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>البطاقات</CardTitle>
          <CardDescription>
            عدد البطاقات: {totalCards}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cards.length ? (
            <>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">الصورة</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>التصنيف</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead className="text-center">المشاهدات</TableHead>
                      <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                      <TableHead className="text-center">آخر وصول</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cards.map((card: Card) => (
                      <TableRow key={card.id}>
                        <TableCell>
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt="البطاقة"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                <FileImage className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{card.template?.title || `بطاقة ${card.id}`}</div>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {card.publicId}
                          </code>
                        </TableCell>
                        <TableCell>{card.category?.name || "غير معروف"}</TableCell>
                        <TableCell>
                          {card.user ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{card.user.username}</div>
                                <div className="text-xs text-muted-foreground">{card.user.email}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">زائر</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{card.accessCount}</TableCell>
                        <TableCell className="text-center">
                          {new Date(card.createdAt).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell className="text-center">
                          {card.lastAccessed ? new Date(card.lastAccessed).toLocaleDateString('ar-SA') : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            card.status === 'active' ? 'bg-green-100 text-green-800' : 
                            card.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {card.status === 'active' ? 'نشطة' : 
                            card.status === 'draft' ? 'مسودة' : 
                            card.status === 'deleted' ? 'محذوفة' : card.status}
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
                                <Link href={`/view/${card.publicId}`}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  عرض البطاقة
                                </Link>
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
                    عرض {(page - 1) * limit + 1} - {Math.min(page * limit, totalCards)} من {totalCards}
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
              لا توجد بطاقات متطابقة مع معايير البحث
            </div>
          )}
        </CardContent>
      </Card>

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