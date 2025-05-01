import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// مكون مبدل السمة
export default function ThemeToggle() {
  const { toast } = useToast();
  
  // جلب تفضيلات المستخدم
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/user/preferences'],
    queryFn: getQueryFn({ on401: 'silent' }),
    refetchOnWindowFocus: false,
  });
  
  // إدارة تغيير السمة
  const mutation = useMutation({
    mutationFn: (theme: string) => 
      apiRequest('POST', '/api/user/preferences', { theme, layout: preferences?.layout || 'boxed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      // تطبيق التغييرات مباشرة بدلاً من إعادة تحميل الصفحة
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تغيير السمة',
        variant: 'destructive',
      });
    }
  });
  
  // تطبيق السمة الحالية عند التحميل
  useEffect(() => {
    if (preferences?.theme) {
      applyTheme(preferences.theme);
    }
  }, [preferences?.theme]);
  
  // تطبيق السمة
  const applyTheme = (theme: string) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };
  
  // تغيير السمة
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    applyTheme(theme);
    mutation.mutate(theme);
  };
  
  // استخدام الأيقونة المناسبة بناءً على السمة الحالية
  const currentTheme = preferences?.theme || 'light';
  const ThemeIcon = currentTheme === 'dark' ? Moon : Sun;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="تغيير السمة">
          <ThemeIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="ml-2 h-4 w-4" />
          <span>فاتح</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="ml-2 h-4 w-4" />
          <span>داكن</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}