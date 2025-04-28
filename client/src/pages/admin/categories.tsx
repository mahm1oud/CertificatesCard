import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2,
  Layout,
  ArrowUpDown,
  Search
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Type for category
type Category = {
  id: number;
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
  displayOrder: number;
  icon?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// Form data for category
type CategoryFormData = {
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  descriptionAr?: string; 
  displayOrder: number;
  icon?: string;
  active: boolean;
};

export default function CategoriesPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    nameAr: "",
    slug: "",
    description: "",
    descriptionAr: "",
    displayOrder: 0,
    icon: "",
    active: true
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({}),
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const res = await apiRequest("POST", "/api/admin/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "تم إنشاء التصنيف بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل إنشاء التصنيف",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number, data: Partial<CategoryFormData> }) => {
      const res = await apiRequest("PUT", `/api/admin/categories/${data.id}`, data.data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "تم تحديث التصنيف بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل تحديث التصنيف",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsDeleteDialogOpen(false);
      setCurrentCategory(null);
      toast({
        title: "تم حذف التصنيف بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حذف التصنيف",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Helper to reset form
  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      slug: "",
      description: "",
      descriptionAr: "",
      displayOrder: 0,
      icon: "",
      active: true
    });
  };

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Generate slug from name
  const generateSlug = () => {
    if (formData.name) {
      const slug = formData.name.toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  // Handle edit category
  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      nameAr: category.nameAr || "",
      slug: category.slug,
      description: category.description || "",
      descriptionAr: category.descriptionAr || "",
      displayOrder: category.displayOrder,
      icon: category.icon || "",
      active: category.active
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete category
  const handleDeleteCategory = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Filter categories based on search query
  const filteredCategories = categories?.filter((category: Category) => {
    if (!searchQuery) return true;
    return (
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.nameAr && category.nameAr.includes(searchQuery)) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">التصنيفات</h1>
          <p className="text-muted-foreground">إدارة تصنيفات البطاقات والشهادات</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة تصنيف
        </Button>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث في التصنيفات..."
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>التصنيفات</CardTitle>
          <CardDescription>
            عدد التصنيفات: {filteredCategories?.length || 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCategories?.length ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">الأيقونة</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>معرّف التصنيف</TableHead>
                    <TableHead className="text-center">الترتيب</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category: Category) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-center">
                        {category.icon ? (
                          <span className="text-lg">{category.icon}</span>
                        ) : (
                          <Layout className="h-4 w-4 mx-auto text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                        {category.nameAr && (
                          <div className="text-sm text-muted-foreground">{category.nameAr}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted text-sm px-1 py-0.5 rounded">{category.slug}</code>
                      </TableCell>
                      <TableCell className="text-center">{category.displayOrder}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.active ? 'نشط' : 'غير نشط'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(category.createdAt).toLocaleDateString('ar-SA')}
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
                            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCategory(category)}
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
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد تصنيفات متاحة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة تصنيف جديد</DialogTitle>
            <DialogDescription>
              أضف تصنيفًا جديدًا للبطاقات والشهادات.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">اسم التصنيف</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={generateSlug}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">الاسم بالعربية (اختياري)</Label>
              <Input
                id="nameAr"
                name="nameAr"
                value={formData.nameAr}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">معرّف التصنيف</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">يجب أن يكون فريدًا وبدون مسافات</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">الوصف بالعربية (اختياري)</Label>
              <Input
                id="descriptionAr"
                name="descriptionAr"
                value={formData.descriptionAr}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">الأيقونة (اختياري)</Label>
              <Input
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="مثال: 📚"
              />
              <p className="text-xs text-muted-foreground">يمكنك استخدام رمز تعبيري (Emoji)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">ترتيب العرض</Label>
              <Input
                id="displayOrder"
                name="displayOrder"
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="active"
                name="active"
                checked={formData.active}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, active: checked }))
                }
              />
              <Label htmlFor="active">نشط</Label>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  "إضافة التصنيف"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل التصنيف</DialogTitle>
            <DialogDescription>
              تعديل بيانات التصنيف الحالي.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (currentCategory) {
                updateMutation.mutate({ id: currentCategory.id, data: formData });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم التصنيف</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nameAr">الاسم بالعربية (اختياري)</Label>
              <Input
                id="edit-nameAr"
                name="nameAr"
                value={formData.nameAr}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">معرّف التصنيف</Label>
              <Input
                id="edit-slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">الوصف (اختياري)</Label>
              <Input
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descriptionAr">الوصف بالعربية (اختياري)</Label>
              <Input
                id="edit-descriptionAr"
                name="descriptionAr"
                value={formData.descriptionAr}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">الأيقونة (اختياري)</Label>
              <Input
                id="edit-icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="مثال: 📚"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-displayOrder">ترتيب العرض</Label>
              <Input
                id="edit-displayOrder"
                name="displayOrder"
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="edit-active"
                name="active"
                checked={formData.active}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, active: checked }))
                }
              />
              <Label htmlFor="edit-active">نشط</Label>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  "تحديث"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف التصنيف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا التصنيف؟ سيؤدي ذلك إلى حذف جميع القوالب والبطاقات المرتبطة به.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">
              التصنيف: {currentCategory?.name}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              لا يمكن التراجع عن هذا الإجراء.
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
              onClick={() => currentCategory && deleteMutation.mutate(currentCategory.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
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