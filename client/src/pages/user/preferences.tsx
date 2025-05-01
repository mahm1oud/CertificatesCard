import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Moon, Sun, MonitorSmartphone, LayoutGrid, Maximize, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageHeader from '@/components/page-header';

// أسكيما التفضيلات
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  layout: z.enum(['boxed', 'fluid']),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export default function UserPreferences() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // جلب تفضيلات المستخدم
  const { data: preferences, isLoading } = useQuery<PreferencesFormData>({
    queryKey: ['/api/user/preferences'],
    queryFn: getQueryFn<PreferencesFormData>({ on401: 'redirect-to-login' }),
    refetchOnWindowFocus: false,
  });
  
  // إعداد نموذج التفضيلات
  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: 'light',
      layout: 'boxed',
    }
  });
  
  // تحديث قيم النموذج عند استرجاع البيانات
  useEffect(() => {
    if (preferences) {
      form.reset({
        theme: preferences.theme || 'light',
        layout: preferences.layout || 'boxed',
      });
    }
  }, [preferences, form]);
  
  // تعريف التعامل مع الطلب
  const mutation = useMutation({
    mutationFn: (data: PreferencesFormData) => 
      apiRequest('POST', '/api/user/preferences', data),
    onSuccess: () => {
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ التفضيلات بنجاح',
      });
      // تحديث البيانات في ذاكرة التخزين المؤقت
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      
      // تطبيق التغييرات مباشرة
      applyTheme(form.getValues().theme);
      applyLayout(form.getValues().layout);
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ التفضيلات',
        variant: 'destructive',
      });
    }
  });
  
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
  
  // تطبيق التخطيط
  const applyLayout = (layout: string) => {
    const root = window.document.documentElement;
    root.classList.remove('layout-boxed', 'layout-fluid');
    root.classList.add(`layout-${layout}`);
  };
  
  // عند تقديم النموذج
  const onSubmit = (data: PreferencesFormData) => {
    mutation.mutate(data);
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <PageHeader
        title="إعدادات العرض"
        description="تخصيص طريقة عرض الموقع حسب تفضيلاتك"
        className="mb-8"
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>المظهر والتخطيط</CardTitle>
              <CardDescription>خصائص العرض وتخطيط الصفحة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>سمة الألوان</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      >
                        <FormItem className="flex flex-col space-y-2">
                          <FormControl>
                            <RadioGroupItem
                              value="light"
                              className="peer sr-only"
                              id="theme-light"
                            />
                          </FormControl>
                          <label
                            htmlFor="theme-light"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Sun className="h-6 w-6 mb-2" />
                            <FormLabel className="font-normal">فاتح</FormLabel>
                          </label>
                        </FormItem>
                        <FormItem className="flex flex-col space-y-2">
                          <FormControl>
                            <RadioGroupItem
                              value="dark"
                              className="peer sr-only"
                              id="theme-dark"
                            />
                          </FormControl>
                          <label
                            htmlFor="theme-dark"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Moon className="h-6 w-6 mb-2" />
                            <FormLabel className="font-normal">داكن</FormLabel>
                          </label>
                        </FormItem>
                        <FormItem className="flex flex-col space-y-2">
                          <FormControl>
                            <RadioGroupItem
                              value="system"
                              className="peer sr-only"
                              id="theme-system"
                            />
                          </FormControl>
                          <label
                            htmlFor="theme-system"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <MonitorSmartphone className="h-6 w-6 mb-2" />
                            <FormLabel className="font-normal">تلقائي (حسب النظام)</FormLabel>
                          </label>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="layout"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>تخطيط العرض</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <FormItem className="flex flex-col space-y-2">
                          <FormControl>
                            <RadioGroupItem
                              value="boxed"
                              className="peer sr-only"
                              id="layout-boxed"
                            />
                          </FormControl>
                          <label
                            htmlFor="layout-boxed"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <LayoutGrid className="h-6 w-6 mb-2" />
                            <FormLabel className="font-normal">مربع (Boxed)</FormLabel>
                            <FormDescription className="text-center text-xs">
                              عرض المحتوى بحد أقصى مع هوامش جانبية
                            </FormDescription>
                          </label>
                        </FormItem>
                        <FormItem className="flex flex-col space-y-2">
                          <FormControl>
                            <RadioGroupItem
                              value="fluid"
                              className="peer sr-only"
                              id="layout-fluid"
                            />
                          </FormControl>
                          <label
                            htmlFor="layout-fluid"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Maximize className="h-6 w-6 mb-2" />
                            <FormLabel className="font-normal">مرن (Fluid)</FormLabel>
                            <FormDescription className="text-center text-xs">
                              عرض المحتوى على كامل مساحة الشاشة
                            </FormDescription>
                          </label>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4 space-x-reverse">
            <Button type="submit" isLoading={mutation.isPending}>
              حفظ التفضيلات
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}