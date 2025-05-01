import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { insertCertificateSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Extend the insert schema with validation rules
const formSchema = insertCertificateSchema.extend({
  title: z.string().min(3, {
    message: "يجب أن يكون عنوان الشهادة 3 أحرف على الأقل",
  }),
  recipient: z.string().min(3, {
    message: "يجب أن يكون اسم المستفيد 3 أحرف على الأقل",
  }),
  issuer: z.string().min(2, {
    message: "يجب أن يكون اسم الجهة المانحة حرفين على الأقل",
  }),
  duration: z.coerce.number().min(1, {
    message: "يجب أن تكون المدة رقم موجب",
  }),
});

export default function AddCertificate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Define form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      recipient: "",
      issuer: "",
      issueDate: new Date().toISOString().substring(0, 10), // Today's date in YYYY-MM-DD format
      expiryDate: "",
      duration: 0,
      status: "pending",
      description: "",
    },
  });

  // Certificate creation mutation
  const createCertificate = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/certificates", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "تم إنشاء الشهادة بنجاح",
        description: "تمت إضافة الشهادة الجديدة إلى النظام",
      });
      setLocation("/certificates");
    },
    onError: (error) => {
      toast({
        title: "خطأ في إنشاء الشهادة",
        description: error.message || "حدث خطأ أثناء إنشاء الشهادة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    createCertificate.mutate(values);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <div className="flex flex-col md:mr-64 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">إضافة شهادة جديدة</h1>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>معلومات الشهادة</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>عنوان الشهادة</FormLabel>
                              <FormControl>
                                <Input placeholder="أدخل عنوان الشهادة" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="recipient"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم المستفيد</FormLabel>
                              <FormControl>
                                <Input placeholder="أدخل اسم المستفيد" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="issuer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الجهة المانحة</FormLabel>
                              <FormControl>
                                <Input placeholder="أدخل اسم الجهة المانحة" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المدة (بالساعات)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="أدخل مدة الشهادة"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="issueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تاريخ الإصدار</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="expiryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تاريخ الانتهاء (اختياري)</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الحالة</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر حالة الشهادة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                                  <SelectItem value="verified">مصدقة</SelectItem>
                                  <SelectItem value="rejected">مرفوضة</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الوصف (اختياري)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="أدخل وصف الشهادة"
                                className="resize-none"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-4 space-x-reverse">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setLocation("/certificates")}
                        >
                          إلغاء
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createCertificate.isPending}
                        >
                          {createCertificate.isPending ? (
                            <div className="flex items-center">
                              <i className="fas fa-spinner fa-spin ml-2"></i>
                              جاري الإضافة...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <i className="fas fa-save ml-2"></i>
                              حفظ الشهادة
                            </div>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
