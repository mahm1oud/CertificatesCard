import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient-updated";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2,
  Search,
  Image,
  Filter,
  Eye,
  Layout,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Types
type Template = {
  id: number;
  title: string;
  titleAr?: string;
  slug: string;
  categoryId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  displayOrder: number;
  fields: string[];
  defaultValues?: Record<string, any>;
  settings?: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: number;
  name: string;
  nameAr?: string;
  slug: string;
  displayOrder: number;
};

export default function TemplatesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState<string>("all");

  // Fetch templates
  const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: getQueryFn({}),
  });

  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({}),
  });

  const templates = templatesData?.templates || [];
  const totalTemplates = templatesData?.total || 0;

  // Filter templates
  const filteredTemplates = templates.filter((template: Template) => {
    // Filter by search query
    const matchesSearch = searchQuery
      ? template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.titleAr && template.titleAr.toLowerCase().includes(searchQuery.toLowerCase())) ||
        template.slug.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Filter by category
    const matchesCategory = selectedCategory === "all" || 
      categories?.find((cat: Category) => cat.id === template.categoryId)?.slug === selectedCategory;

    // Filter by active status
    const matchesStatus = selectedTab === "all" || 
      (selectedTab === "active" && template.active) || 
      (selectedTab === "inactive" && !template.active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/templates/${id}`, { active });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "تم تحديث حالة القالب بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل تحديث القالب",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "تم حذف القالب بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حذف القالب",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle template active status
  const toggleTemplateStatus = (id: number, currentStatus: boolean) => {
    updateTemplateMutation.mutate({ id, active: !currentStatus });
  };
  
  // Delete template
  const deleteTemplate = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذه العملية.')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  // Get category name by id
  const getCategoryName = (categoryId: number) => {
    const category = categories?.find((cat: Category) => cat.id === categoryId);
    return category ? category.name : "غير معروف";
  };

  if (isTemplatesLoading || isCategoriesLoading) {
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
          <h1 className="text-3xl font-bold">القوالب</h1>
          <p className="text-muted-foreground">إدارة قوالب البطاقات والشهادات</p>
        </div>
        <Button asChild>
          <Link href="/admin/templates/new">
            <Plus className="h-4 w-4 ml-2" />
            إضافة قالب
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث في القوالب..."
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
                {categories?.map((category: Category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">الكل ({templates.length})</TabsTrigger>
          <TabsTrigger value="active">
            نشط ({templates.filter((t: Template) => t.active).length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            غير نشط ({templates.filter((t: Template) => !t.active).length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <TemplatesTable 
            templates={filteredTemplates} 
            getCategoryName={getCategoryName}
            toggleStatus={toggleTemplateStatus}
            isUpdating={updateTemplateMutation.isPending}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          <TemplatesTable 
            templates={filteredTemplates} 
            getCategoryName={getCategoryName}
            toggleStatus={toggleTemplateStatus}
            isUpdating={updateTemplateMutation.isPending}
          />
        </TabsContent>
        <TabsContent value="inactive" className="mt-4">
          <TemplatesTable 
            templates={filteredTemplates} 
            getCategoryName={getCategoryName}
            toggleStatus={toggleTemplateStatus}
            isUpdating={updateTemplateMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Templates table component
function TemplatesTable({ 
  templates, 
  getCategoryName,
  toggleStatus,
  isUpdating
}: { 
  templates: any[];
  getCategoryName: (id: number) => string;
  toggleStatus: (id: number, currentStatus: boolean) => void;
  isUpdating: boolean;
}) {
  const { toast } = useToast();
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "تم حذف القالب بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حذف القالب",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteTemplate = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذه العملية.')) {
      deleteTemplateMutation.mutate(id);
    }
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>القوالب</CardTitle>
        <CardDescription>
          عدد القوالب: {templates.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {templates.length ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">الصورة</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead className="text-center">المعرف</TableHead>
                  <TableHead className="text-center">الترتيب</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-muted">
                        {template.imageUrl ? (
                          <img
                            src={template.imageUrl}
                            alt={template.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                            <Image className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{template.title}</div>
                      {template.titleAr && (
                        <div className="text-sm text-muted-foreground">{template.titleAr}</div>
                      )}
                    </TableCell>
                    <TableCell>{getCategoryName(template.categoryId)}</TableCell>
                    <TableCell className="text-center">
                      <code className="bg-muted text-sm px-1 py-0.5 rounded">{template.slug}</code>
                    </TableCell>
                    <TableCell className="text-center">{template.displayOrder}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={template.active}
                        onCheckedChange={() => toggleStatus(template.id, template.active)}
                        disabled={isUpdating}
                      />
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
                            <Link href={`/admin/templates/${template.id}`}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="text-primary">
                            <Link href={`/admin/templates/${template.id}/fields`}>
                              <Eye className="h-4 w-4 ml-2" />
                              <span className="flex-1">إدارة الحقول</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">محسن</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="text-primary">
                            <Link href={`/admin/template-editor/${template.id}`}>
                              <Layout className="h-4 w-4 ml-2" />
                              <span className="flex-1">محرر التخطيط</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-500">جديد</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="text-indigo-600">
                            <Link href={`/template-editor-with-layers/${template.id}`}>
                              <svg className="h-4 w-4 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 3h12M6 15h12M6 11h12M6 7h12M6 19h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <span className="flex-1">محرر الطبقات القياسي</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-500">مستقر</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="text-green-600">
                            <Link href={`/advanced-layer-editor/${template.id}`}>
                              <PanelLeft className="h-4 w-4 ml-2" />
                              <span className="flex-1">محرر الطبقات المتقدم</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-500">جديد</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="text-blue-600">
                            <Link href={`/social-template-editor/${template.id}`}>
                              <svg width="16" height="16" className="ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 2H6a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM16 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="m8.5 13.5 5-3M12.5 11.5l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="flex-1">محرر الشبكات الاجتماعية</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-500">ميزة متقدمة</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
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
            لا توجد قوالب متطابقة مع معايير البحث
          </div>
        )}
      </CardContent>
    </Card>
  );
}