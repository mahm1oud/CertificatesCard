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
import { useSignatures } from '@/hooks/useSignatures';
import { useToast } from '@/hooks/use-toast';
import { Pen, Upload, Plus, Check, Trash2, Stamp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SignaturePickerProps {
  onSelect: (signature: { id: number; imageUrl: string }) => void;
  selectedSignatureId?: number;
  signatureType?: 'signature' | 'stamp';
}

export function SignaturePicker({ 
  onSelect, 
  selectedSignatureId, 
  signatureType = 'signature' 
}: SignaturePickerProps) {
  const { signatures, uploadSignature, deleteSignature } = useSignatures();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState<'signature' | 'stamp'>(signatureType);
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

    // التحقق من اسم التوقيع
    if (!uploadName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للتوقيع",
        variant: "destructive",
      });
      return;
    }

    // إنشاء كائن FormData
    const formData = new FormData();
    formData.append('signature', file);
    formData.append('name', uploadName);
    formData.append('type', uploadType);

    try {
      setIsUploading(true);
      await uploadSignature.mutateAsync(formData);
      
      toast({
        title: "تم الرفع",
        description: uploadType === 'signature' ? "تم رفع التوقيع بنجاح" : "تم رفع الختم بنجاح",
      });
      
      // إعادة تعيين النموذج
      setUploadName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: uploadType === 'signature' ? "حدث خطأ أثناء رفع التوقيع" : "حدث خطأ أثناء رفع الختم",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSignature = async (id: number) => {
    try {
      await deleteSignature.mutateAsync(id);
      
      toast({
        title: "تم الحذف",
        description: signatureType === 'signature' ? "تم حذف التوقيع بنجاح" : "تم حذف الختم بنجاح",
      });
      
      // إذا كان التوقيع المحذوف هو المحدد حاليًا، قم بإلغاء التحديد
      if (selectedSignatureId === id) {
        onSelect({ id: 0, imageUrl: '' });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: signatureType === 'signature' ? "حدث خطأ أثناء حذف التوقيع" : "حدث خطأ أثناء حذف الختم",
        variant: "destructive",
      });
    }
  };

  const handleSelectSignature = (signature: { id: number; imageUrl: string }) => {
    onSelect(signature);
    setOpen(false);
  };

  const typeLabel = signatureType === 'signature' ? 'توقيع' : 'ختم';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-auto p-4 border-dashed flex flex-col items-center justify-center gap-2">
          {selectedSignatureId ? (
            <>
              {signatures.data?.find(sig => sig.id === selectedSignatureId)?.imageUrl ? (
                <img 
                  src={signatures.data?.find(sig => sig.id === selectedSignatureId)?.imageUrl} 
                  alt={signatureType === 'signature' ? "التوقيع المحدد" : "الختم المحدد"} 
                  className="w-24 h-24 object-contain" 
                />
              ) : (
                signatureType === 'signature' ? (
                  <Pen className="h-10 w-10 text-gray-400" />
                ) : (
                  <Stamp className="h-10 w-10 text-gray-400" />
                )
              )}
              <span className="text-sm">تغيير ال{typeLabel}</span>
            </>
          ) : (
            <>
              {signatureType === 'signature' ? (
                <Pen className="h-10 w-10 text-gray-400" />
              ) : (
                <Stamp className="h-10 w-10 text-gray-400" />
              )}
              <span className="text-sm">إضافة {typeLabel}</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>اختيار {typeLabel}</DialogTitle>
          <DialogDescription>
            {signatureType === 'signature' 
              ? "اختر من توقيعاتك الحالية أو قم برفع توقيع جديد"
              : "اختر من أختامك الحالية أو قم برفع ختم جديد"
            }
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="my-signatures" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-signatures">
              {signatureType === 'signature' ? "توقيعاتي" : "أختامي"}
            </TabsTrigger>
            <TabsTrigger value="upload">
              {signatureType === 'signature' ? "رفع توقيع جديد" : "رفع ختم جديد"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-signatures" className="mt-4">
            {signatures.isLoading ? (
              <div className="text-center p-8">جاري التحميل...</div>
            ) : signatures.data && signatures.data.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {signatures.data
                  .filter(signature => signature.type === signatureType)
                  .map((signature) => (
                  <Card 
                    key={signature.id} 
                    className={cn(
                      "cursor-pointer transition-all overflow-hidden",
                      selectedSignatureId === signature.id ? "ring-2 ring-blue-500" : "hover:border-blue-200"
                    )}
                    onClick={() => handleSelectSignature({ id: signature.id, imageUrl: signature.imageUrl })}
                  >
                    <CardContent className="p-4 flex justify-center items-center h-[140px] bg-gray-50">
                      <img 
                        src={signature.imageUrl} 
                        alt={signature.name} 
                        className="max-w-full max-h-full object-contain" 
                      />
                    </CardContent>
                    <CardFooter className="p-2 flex justify-between items-center">
                      <p className="text-xs truncate">{signature.name}</p>
                      <Button
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSignature(signature.id);
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
                {signatureType === 'signature' 
                  ? "لا توجد توقيعات. قم برفع توقيع جديد."
                  : "لا توجد أختام. قم برفع ختم جديد."
                }
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upload" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="signature-name" className="text-sm font-medium">
                  {signatureType === 'signature' ? "اسم التوقيع" : "اسم الختم"}
                </label>
                <Input
                  id="signature-name"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder={signatureType === 'signature' ? "أدخل اسمًا للتوقيع" : "أدخل اسمًا للختم"}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="signature-type" className="text-sm font-medium">
                  النوع
                </label>
                <Select 
                  value={uploadType} 
                  onValueChange={(value: 'signature' | 'stamp') => setUploadType(value)}
                >
                  <SelectTrigger id="signature-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signature">توقيع</SelectItem>
                    <SelectItem value="stamp">ختم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="signature-file" className="text-sm font-medium">
                  {uploadType === 'signature' ? "ملف التوقيع" : "ملف الختم"}
                </label>
                <div
                  className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">اضغط لاختيار ملف، أو اسحب وأفلت</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (خلفية شفافة مفضلة)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="signature-file"
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
                {isUploading 
                  ? "جارِ الرفع..." 
                  : (uploadType === 'signature' ? "رفع التوقيع" : "رفع الختم")
                }
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

export default SignaturePicker;