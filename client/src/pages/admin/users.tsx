import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient-updated";
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
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2,
  Search,
  UserPlus,
  UserX,
  ShieldAlert,
  Shield,
  User
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Types
type User = {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
};

export default function UsersManagementPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    role: "user",
    active: true
  });

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({}),
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;

  // Filtered users
  const filteredUsers = users.filter((user: User) => {
    // Filter by search query
    const matchesSearch = searchQuery
      ? user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    // Filter by active status
    const matchesStatus = selectedTab === "all" || 
      (selectedTab === "active" && user.active) || 
      (selectedTab === "inactive" && !user.active) ||
      (selectedTab === "admin" && user.role === "admin") ||
      (selectedTab === "user" && user.role === "user");

    return matchesSearch && matchesStatus;
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "تم إنشاء المستخدم بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل إنشاء المستخدم",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<typeof formData> }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "تم تحديث المستخدم بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل تحديث المستخدم",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDeleteDialogOpen(false);
      setCurrentUser(null);
      toast({
        title: "تم حذف المستخدم بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل حذف المستخدم",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Helper to reset form
  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      name: "",
      password: "",
      role: "user",
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

  // Handle edit user
  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      name: user.name || "",
      password: "", // Don't include password when editing
      role: user.role,
      active: user.active
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
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
          <h1 className="text-3xl font-bold">المستخدمون</h1>
          <p className="text-muted-foreground">إدارة مستخدمي النظام</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 ml-2" />
          إضافة مستخدم
        </Button>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث في المستخدمين..."
            className="pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">الكل ({users.length})</TabsTrigger>
          <TabsTrigger value="active">
            نشط ({users.filter((u: User) => u.active).length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            غير نشط ({users.filter((u: User) => !u.active).length})
          </TabsTrigger>
          <TabsTrigger value="admin">
            مدير ({users.filter((u: User) => u.role === "admin").length})
          </TabsTrigger>
          <TabsTrigger value="user">
            مستخدم ({users.filter((u: User) => u.role === "user").length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={selectedTab} className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>المستخدمون</CardTitle>
              <CardDescription>
                عدد المستخدمين المعروضين: {filteredUsers.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المستخدم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                        <TableHead>تاريخ التسجيل</TableHead>
                        <TableHead>آخر تسجيل دخول</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium">{user.username}</div>
                            {user.name && (
                              <div className="text-sm text-muted-foreground">{user.name}</div>
                            )}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.role === "admin" ? (
                                <>
                                  <ShieldAlert className="h-4 w-4 text-primary" />
                                  <span>مدير</span>
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>مستخدم</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={user.active}
                              onCheckedChange={(checked) => 
                                updateUserMutation.mutate({ id: user.id, data: { active: checked } })
                              }
                              disabled={updateUserMutation.isPending}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-SA') : 'لا يوجد'}
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
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Pencil className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                {/* Toggle role item */}
                                <DropdownMenuItem 
                                  onClick={() => 
                                    updateUserMutation.mutate({ 
                                      id: user.id, 
                                      data: { role: user.role === "admin" ? "user" : "admin" } 
                                    })
                                  }
                                >
                                  {user.role === "admin" ? (
                                    <>
                                      <User className="h-4 w-4 ml-2" />
                                      تغيير إلى مستخدم
                                    </>
                                  ) : (
                                    <>
                                      <ShieldAlert className="h-4 w-4 ml-2" />
                                      تغيير إلى مدير
                                    </>
                                  )}
                                </DropdownMenuItem>
                                {/* Delete user item */}
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <UserX className="h-4 w-4 ml-2" />
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
                  لا يوجد مستخدمين متطابقين مع معايير البحث
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            <DialogDescription>
              أضف مستخدمًا جديدًا إلى النظام.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              createUserMutation.mutate(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل (اختياري)</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">الدور</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, active: checked })
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
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  "إضافة المستخدم"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>
              تعديل بيانات المستخدم.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (currentUser) {
                // Exclude password if it's empty (no change)
                const { password, ...dataWithoutPassword } = formData;
                const dataToSend = password ? formData : dataWithoutPassword;
                updateUserMutation.mutate({ id: currentUser.id, data: dataToSend });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-email">البريد الإلكتروني</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">الاسم الكامل (اختياري)</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">كلمة المرور (اتركها فارغة للإبقاء على الحالية)</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="اتركها فارغة للإبقاء على كلمة المرور الحالية"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">الدور</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, active: checked })
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
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? (
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
            <DialogTitle>حذف المستخدم</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ سيؤدي ذلك إلى حذف جميع البيانات المرتبطة به.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">
              المستخدم: {currentUser?.username}
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
              onClick={() => currentUser && deleteUserMutation.mutate(currentUser.id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
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