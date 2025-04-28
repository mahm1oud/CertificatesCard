import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserLogos } from '@/hooks/useLogos';
import { useToast } from '@/hooks/use-toast';
import { Image, Upload, Plus, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoPickerProps {
  onSelect: (logo: { id: number; imageUrl: string }) => void;
  selectedLogoId?: number;
}

export function LogoPicker({ onSelect, selectedLogoId }: LogoPickerProps) {
  const { userLogos, uploadLogo, deleteLogo } = useUserLogos();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة صالح",
        variant: "destructive",
      });
      return;
    }

    // التحقق من اسم الشعار
    if (!uploadName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للشعار",
        variant: "destructive",
      });
      return;
    }

    // إنشاء كائن FormData
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('name', uploadName);

    try {
      setIsUploading(true);
      await uploadLogo.mutateAsync(formData);
      
      toast({
        title: "تم الرفع",
        description: "تم رفع الشعار بنجاح",
      });
      
      // إعادة تعيين النموذج
      setUploadName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفع الشعار",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLogo = async (id: number) => {
    try {
      await deleteLogo.mutateAsync(id);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الشعار بنجاح",
      });
      
      // إذا كان الشعار المحذوف هو المحدد حاليًا، قم بإلغاء التحديد
      if (selectedLogoId === id) {
        onSelect({ id: 0, imageUrl: '' });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الشعار",
        variant: "destructive",
      });
    }
  };

  const handleSelectLogo = (logo: { id: number; imageUrl: string }) => {
    onSelect(logo);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-auto p-4 border-dashed flex flex-col items-center justify-center gap-2">
          {selectedLogoId ? (
            <>
              {userLogos.data?.find(logo => logo.id === selectedLogoId)?.imageUrl ? (
                <img 
                  src={userLogos.data?.find(logo => logo.id === selectedLogoId)?.imageUrl} 
                  alt="الشعار المحدد" 
                  className="w-24 h-24 object-contain" 
                />
              ) : (
                <Image className="h-10 w-10 text-gray-400" />
              )}
              <span className="text-sm">تغيير الشعار</span>
            </>
          ) : (
            <>
              <Image className="h-10 w-10 text-gray-400" />
              <span className="text-sm">إضافة شعار</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إختيار شعار</DialogTitle>
          <DialogDescription>
            اختر من شعاراتك الحالية أو قم برفع شعار جديد
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="my-logos" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-logos">شعاراتي</TabsTrigger>
            <TabsTrigger value="upload">رفع شعار جديد</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-logos" className="mt-4">
            {userLogos.isLoading ? (
              <div className="text-center p-8">جاري التحميل...</div>
            ) : userLogos.data && userLogos.data.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {userLogos.data.map((logo) => (
                  <Card 
                    key={logo.id} 
                    className={cn(
                      "cursor-pointer transition-all overflow-hidden",
                      selectedLogoId === logo.id ? "ring-2 ring-blue-500" : "hover:border-blue-200"
                    )}
                    onClick={() => handleSelectLogo({ id: logo.id, imageUrl: logo.imageUrl })}
                  >
                    <CardContent className="p-4 flex justify-center items-center h-[140px]">
                      <img 
                        src={logo.imageUrl} 
                        alt={logo.name} 
                        className="max-w-full max-h-full object-contain" 
                      />
                    </CardContent>
                    <CardFooter className="p-2 flex justify-between items-center bg-gray-50">
                      <p className="text-xs truncate">{logo.name}</p>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLogo(logo.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                لا توجد شعارات. قم برفع شعار جديد.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upload" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="logo-name" className="text-sm font-medium">
                  اسم الشعار
                </label>
                <Input
                  id="logo-name"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="أدخل اسمًا للشعار"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="logo-file" className="text-sm font-medium">
                  ملف الشعار
                </label>
                <div
                  className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">اضغط لاختيار ملف، أو اسحب وأفلت</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG or SVG (أقصى حجم: 5MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="logo-file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              
              <Button
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? "جارِ الرفع..." : "رفع الشعار"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LogoPicker;