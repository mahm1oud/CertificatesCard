import React from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { 
  Home,
  FileText,
  Image,
  ListFilter,
  Settings,
  Users,
  Shield,
  LayoutGrid,
  GraduationCap,
  FileEdit,
  Brush,
  Globe,
  Languages,
  ChevronRight,
  Search
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };
  
  const navItems = [
    {
      title: t('admin.menu.dashboard'),
      href: '/admin/dashboard',  // تم تعديله من /admin إلى /admin/dashboard
      icon: <Home className="h-4 w-4" />,
      exact: true
    },
    {
      title: t('admin.menu.content'),
      icon: <FileText className="h-4 w-4" />,
      children: [
        {
          title: t('admin.menu.certificates'),
          href: '/admin/certificates',
          icon: <GraduationCap className="h-4 w-4" />
        },
        {
          title: t('admin.menu.cards'),
          href: '/admin/cards',
          icon: <Image className="h-4 w-4" />
        },
        {
          title: t('admin.menu.templates'),
          href: '/admin/templates',
          icon: <FileEdit className="h-4 w-4" />
        },
        {
          title: t('admin.menu.categories'),
          href: '/admin/categories',
          icon: <ListFilter className="h-4 w-4" />
        }
      ]
    },
    // مؤقتاً: تعطيل قسم المظهر حتى يتم تنفيذ الصفحات ذات الصلة
    /*
    {
      title: t('admin.menu.appearance'),
      icon: <Brush className="h-4 w-4" />,
      children: [
        {
          title: t('admin.menu.themes'),
          href: '/admin/appearance/themes',
          icon: <LayoutGrid className="h-4 w-4" />
        },
        {
          title: t('admin.menu.fonts'),
          href: '/admin/appearance/fonts',
          icon: <FileText className="h-4 w-4" />
        }
      ]
    },
    */
    {
      title: t('admin.menu.users'),
      href: '/admin/users',
      icon: <Users className="h-4 w-4" />
    },
    {
      title: t('admin.menu.settings'),
      icon: <Settings className="h-4 w-4" />,
      children: [
        {
          title: "الإعدادات العامة",
          href: '/admin/settings',
          icon: <Settings className="h-4 w-4" />
        },
        {
          title: "إعدادات العرض",
          href: '/admin/display-settings',
          icon: <LayoutGrid className="h-4 w-4" />
        },
        {
          title: "إعدادات المصادقة",
          href: '/admin/settings/auth',
          icon: <Shield className="h-4 w-4" />
        },
        {
          title: "إعدادات مواقع التواصل",
          href: '/admin/social-auth-settings',
          icon: <Globe className="h-4 w-4" />
        },
        {
          title: "إعدادات محركات البحث (SEO)",
          href: '/admin/seo-settings',
          icon: <Search className="h-4 w-4" />
        }
      ]
    }
  ];

  // Single nav item with no children
  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const active = item.exact ? location === item.href : isActive(item.href as string);
    
    return (
      <Link href={item.href as string}>
        <a className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
          active 
            ? "bg-accent text-accent-foreground font-medium" 
            : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
        )}>
          {item.icon}
          <span>{item.title}</span>
        </a>
      </Link>
    );
  };
  
  // Navigation item inside accordion
  const NavItemChild = ({ item }: { item: { title: string; href: string; icon: React.ReactNode } }) => {
    const active = isActive(item.href);
    
    return (
      <Link href={item.href}>
        <a className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
          active 
            ? "bg-accent text-accent-foreground font-medium" 
            : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
        )}>
          {item.icon}
          <span>{item.title}</span>
        </a>
      </Link>
    );
  };
  
  return (
    <aside className={cn("flex flex-col border-r bg-card py-4 h-screen sticky top-0", className)}>
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          {t('admin.title')}
        </h2>
      </div>
      
      <div className="flex-1 overflow-auto py-2 px-3">
        <nav className="flex flex-col gap-1">
          {navItems.map((item, idx) => 
            !item.children ? (
              <NavItem key={idx} item={item} />
            ) : (
              <Accordion key={idx} type="single" collapsible className="w-full">
                <AccordionItem value={`item-${idx}`} className="border-none">
                  <AccordionTrigger className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all no-underline hover:no-underline",
                    "hover:bg-accent/50 hover:text-accent-foreground data-[state=open]:font-medium"
                  )}>
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-1 pr-2 pl-5 pt-1">
                      {item.children?.map((child, childIdx) => (
                        <NavItemChild key={childIdx} item={child} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )
          )}
        </nav>
      </div>
      
      <div className="mt-auto px-3 py-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/" className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent/50 text-muted-foreground hover:text-accent-foreground">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4" />
                  <span>{t('admin.viewWebsite')}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('admin.viewWebsiteTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}