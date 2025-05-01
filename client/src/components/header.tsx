import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation, LanguageSwitcher } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Menu,
  Award,
  Mail,
  Settings,
  User,
  LogOut,
  FileHeart,
  Grid3X3,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import ThemeToggle from "./theme-toggle";

const ListItem = forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center px-4 sm:px-8 lg:px-10">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <FileHeart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">بـــطـــاقـــة</span>
          </Link>
          <div className="md:hidden ml-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="text-right">القائمة</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  <SheetClose asChild>
                    <Button
                      variant={location === "/" ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/">
                        <Home className="ml-2 h-4 w-4" />
                        الرئيسية
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/?tab=certificates">
                        <Award className="ml-2 h-4 w-4" />
                        الشهادات
                      </Link>
                    </Button>
                  </SheetClose>
                  
                  <Separator className="my-2" />
                  
                  {user ? (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">الحساب الشخصي</p>
                      </div>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          asChild
                        >
                          <Link href="/user/dashboard">
                            <Grid3X3 className="ml-2 h-4 w-4" />
                            لوحة التحكم
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          asChild
                        >
                          <Link href="/user/profile">
                            <User className="ml-2 h-4 w-4" />
                            الملف الشخصي
                          </Link>
                        </Button>
                      </SheetClose>
                      {user.role === 'admin' && (
                        <>
                          <div className="px-2 py-1.5">
                            <p className="text-xs text-muted-foreground">المدير</p>
                          </div>
                          <SheetClose asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              asChild
                            >
                              <Link href="/admin/dashboard">
                                <Settings className="ml-2 h-4 w-4" />
                                إدارة النظام
                              </Link>
                            </Button>
                          </SheetClose>
                        </>
                      )}
                      <Separator className="my-2" />
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">الإعدادات</p>
                      </div>
                      <div className="flex items-center px-4 py-2 justify-between">
                        <LanguageSwitcher />
                        <ThemeToggle />
                      </div>
                      <Separator className="my-2" />
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => logoutMutation.mutate()}
                        >
                          <LogOut className="ml-2 h-4 w-4" />
                          تسجيل الخروج
                        </Button>
                      </SheetClose>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          asChild
                        >
                          <Link href="/auth">
                            <User className="ml-2 h-4 w-4" />
                            تسجيل الدخول
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          asChild
                        >
                          <Link href="/auth?tab=register">
                            <User className="ml-2 h-4 w-4" />
                            إنشاء حساب
                          </Link>
                        </Button>
                      </SheetClose>
                      <Separator className="my-2" />
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">الإعدادات</p>
                      </div>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          asChild
                        >
                          <Link href="/user/preferences">
                            <Settings className="ml-2 h-4 w-4" />
                            إعدادات العرض
                          </Link>
                        </Button>
                      </SheetClose>
                      <div className="flex items-center px-4 py-2 justify-between">
                        <LanguageSwitcher />
                        <ThemeToggle />
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="flex-1 mr-4">
          <nav className="hidden md:flex items-center space-x-4 space-x-reverse lg:space-x-6 lg:space-x-reverse">
            <NavigationMenu>
              <NavigationMenuList className="space-x-2 space-x-reverse">
                <NavigationMenuItem>
                  <Link href="/">
                    <NavigationMenuTrigger 
                      className={cn(location === "/" && "bg-accent text-accent-foreground")}
                    >
                      البطاقات
                    </NavigationMenuTrigger>
                  </Link>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/"
                          >
                            <FileHeart className="h-6 w-6 text-primary" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              بطاقة
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              إنشاء بطاقات جميلة لمختلف المناسبات
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/?category=wedding" title="بطاقات الأفراح">
                        بطاقات زفاف، دعوات، تهاني
                      </ListItem>
                      <ListItem href="/?category=eid" title="بطاقات العيد">
                        عيد الفطر، عيد الأضحى
                      </ListItem>
                      <ListItem href="/?category=ramadan" title="بطاقات رمضان">
                        تهنئة بشهر رمضان المبارك
                      </ListItem>
                      <ListItem href="/?category=birthday" title="بطاقات أعياد الميلاد">
                        احتفالات، بطاقات تهنئة
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/?tab=certificates">
                    <NavigationMenuTrigger 
                      className={cn(location.includes("certificates") && "bg-accent text-accent-foreground")}
                    >
                      الشهادات
                    </NavigationMenuTrigger>
                  </Link>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/?tab=certificates"
                          >
                            <Award className="h-6 w-6 text-primary" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              شهادات
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              إنشاء شهادات احترافية قابلة للتحقق
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/?tab=certificates&type=appreciation" title="شهادات تقدير">
                        للتكريم والإنجازات
                      </ListItem>
                      <ListItem href="/?tab=certificates&type=training" title="شهادات تدريب">
                        تخريج برامج تدريبية
                      </ListItem>
                      <ListItem href="/?tab=certificates&type=education" title="شهادات تعليمية">
                        مناسبة للمؤسسات التعليمية
                      </ListItem>
                      <ListItem href="/?tab=certificates&type=teacher" title="شهادات المعلمين">
                        تكريم المعلمين والمعلمات
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </div>
        <div className="hidden md:flex items-center mr-auto space-x-4 space-x-reverse">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="ml-2 h-4 w-4" />
                  {user.name || user.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/user/dashboard">
                    <Grid3X3 className="ml-2 h-4 w-4" />
                    لوحة التحكم
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/user/profile">
                    <User className="ml-2 h-4 w-4" />
                    الملف الشخصي
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/user/cards">
                    <FileHeart className="ml-2 h-4 w-4" />
                    بطاقاتي
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/user/certificates">
                    <Award className="ml-2 h-4 w-4" />
                    شهاداتي
                  </Link>
                </DropdownMenuItem>
                
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>لوحة المدير</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard">
                        <Settings className="ml-2 h-4 w-4" />
                        لوحة التحكم
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/templates">
                        <Grid3X3 className="ml-2 h-4 w-4" />
                        القوالب
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users">
                        <Users className="ml-2 h-4 w-4" />
                        المستخدمين
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>الإعدادات</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/user/preferences">
                    <Settings className="ml-2 h-4 w-4" />
                    إعدادات العرض
                  </Link>
                </DropdownMenuItem>
                <div className="p-2">
                  <LanguageSwitcher />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex space-x-2 space-x-reverse items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>الإعدادات</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/user/preferences">
                      <Settings className="ml-2 h-4 w-4" />
                      إعدادات العرض
                    </Link>
                  </DropdownMenuItem>
                  <div className="p-2">
                    <LanguageSwitcher />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button size="sm" variant="outline" asChild>
                <Link href="/auth">
                  تسجيل الدخول
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth?tab=register">
                  إنشاء حساب
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}