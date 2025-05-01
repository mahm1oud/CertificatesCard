import { useEffect } from "react";
import { Certificate, certificateTypes, insertCertificateSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Upload } from "lucide-react";

interface AddCertificateModalProps {
  open: boolean;
  certificate?: Certificate; // For editing existing certificate
  onClose: () => void;
  onSubmit: (data: any) => void;
}

// Maps certificate types to their display names in Arabic
const typeNameMap: Record<string, string> = {
  technical: "تقني",
  administrative: "إداري",
  training: "تدريبي",
  graduation: "تخرج",
  leadership: "قيادة",
  volunteer: "تطوع",
};

export default function AddCertificateModal({
  open,
  certificate,
  onClose,
  onSubmit
}: AddCertificateModalProps) {
  const isEditMode = !!certificate;
  
  // Set up form with zod validation
  const form = useForm({
    resolver: zodResolver(insertCertificateSchema),
    defaultValues: {
      title: "",
      recipient: "",
      issueDate: new Date().toISOString().split('T')[0],
      certificateType: "",
      description: "",
      imageUrl: "",
      certificateNumber: ""
    }
  });
  
  // Update form when editing an existing certificate
  useEffect(() => {
    if (certificate) {
      const { id, createdAt, updatedAt, ...formValues } = certificate;
      
      // Format the date to YYYY-MM-DD for the date input
      const formattedDate = new Date(formValues.issueDate)
        .toISOString()
        .split('T')[0];
      
      form.reset({
        ...formValues,
        issueDate: formattedDate
      });
    } else {
      form.reset({
        title: "",
        recipient: "",
        issueDate: new Date().toISOString().split('T')[0],
        certificateType: "",
        description: "",
        imageUrl: "",
        certificateNumber: ""
      });
    }
  }, [certificate, form]);

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">
            {isEditMode ? "تعديل الشهادة" : "إضافة شهادة جديدة"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                  <FormLabel>اسم المستلم</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم المستلم" {...field} />
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
              name="certificateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع الشهادة</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الشهادة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {certificateTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {typeNameMap[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certificateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الشهادة</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل رقم الشهادة (اختياري)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea placeholder="أدخل وصف الشهادة (اختياري)" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صورة الشهادة</FormLabel>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-primary-600 hover:text-primary-500"
                          onClick={() => {
                            // In a real app, this would open a file picker
                            const demoUrl = "https://images.unsplash.com/photo-1606953369506-c25e08f41ec1?auto=format&fit=crop&w=800&q=80";
                            field.onChange(demoUrl);
                          }}
                        >
                          <Upload className="ml-2 h-4 w-4" />
                          رفع ملف
                        </Button>
                        <p className="pr-1 mt-2">أو سحب وإفلات</p>
                      </div>
                      <FormControl>
                        <Input
                          type="text"
                          className="sr-only"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF حتى 10MB
                      </p>
                      {field.value && (
                        <div className="mt-2">
                          <p className="text-xs text-primary-600 truncate max-w-xs mx-auto">
                            {field.value}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                <X className="ml-2 h-4 w-4" />
                إلغاء
              </Button>
              <Button type="submit">
                <Save className="ml-2 h-4 w-4" />
                {isEditMode ? "حفظ التعديلات" : "إضافة الشهادة"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
