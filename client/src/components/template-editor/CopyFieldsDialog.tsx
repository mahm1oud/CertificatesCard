import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Template {
  id: number;
  title: string;
  titleAr?: string;
  categoryId: number;
  active: boolean;
}

interface TemplateField {
  id: number;
  templateId: number;
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface CopyFieldsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTemplateId: number;
  onSuccess: () => void;
}

export function CopyFieldsDialog({ 
  open, 
  onOpenChange, 
  sourceTemplateId,
  onSuccess 
}: CopyFieldsDialogProps) {
  const { toast } = useToast();
  const [targetTemplateId, setTargetTemplateId] = useState<string>("");
  const [selectedFields, setSelectedFields] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [step, setStep] = useState<"selectTemplate" | "selectFields">("selectTemplate");
  
  // جلب قائمة القوالب
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery<{ templates: Template[] }>({
    queryKey: ["/api/templates"],
    enabled: open,
  });
  
  // جلب حقول القالب المصدر
  const { data: sourceFieldsData, isLoading: isLoadingSourceFields } = useQuery<TemplateField[]>({
    queryKey: [`/api/admin/template-fields/${sourceTemplateId}`],
    enabled: open,
  });
  
  // جلب حقول القالب الهدف (لمنع التكرار)
  const { data: targetFieldsData, isLoading: isLoadingTargetFields } = useQuery<TemplateField[]>({
    queryKey: [`/api/admin/template-fields/${targetTemplateId}`],
    enabled: !!targetTemplateId && step === "selectFields",
  });
  
  // حذف القوالب التي ليس لها حقول والقالب المصدر من القائمة
  const availableTemplates = templatesData?.templates?.filter(
    (template) => template.id !== sourceTemplateId
  ) || [];
  
  // إعداد الحقول المتاحة للنسخ مع عرض التحذير للحقول المكررة
  const sourceFields = sourceFieldsData || [];
  const targetFields = targetFieldsData || [];
  
  // التحقق من الحقول المكررة
  const getDuplicateStatus = (field: TemplateField) => {
    return targetFields.some(tf => tf.name === field.name)
      ? "duplicate" 
      : "available";
  };
  
  // إعادة تعيين حالة التحديد عند تغيير الخطوة
  useEffect(() => {
    if (step === "selectFields" && sourceFields.length > 0) {
      // افتراضياً، حدد جميع الحقول غير المكررة
      const nonDuplicateFieldIds = sourceFields
        .filter(field => getDuplicateStatus(field) !== "duplicate")
        .map(field => field.id);
      
      setSelectedFields(nonDuplicateFieldIds);
      setSelectAll(nonDuplicateFieldIds.length === sourceFields.length);
    }
  }, [step, sourceFields, targetFields]);
  
  // تحديث حالة تحديد الكل عند تغيير الحقول المحددة
  useEffect(() => {
    if (sourceFields.length > 0) {
      setSelectAll(selectedFields.length === sourceFields.length);
    }
  }, [selectedFields, sourceFields]);
  
  // تنفيذ طلب نسخ الحقول
  const copyFieldsMutation = useMutation({
    mutationFn: () => {
      return apiRequest({
        url: "/api/templates/copy-fields",
        method: "POST",
        body: {
          sourceTemplateId,
          targetTemplateId: parseInt(targetTemplateId),
          fieldIds: selectedFields
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم نسخ الحقول بنجاح",
        description: `تم نسخ ${selectedFields.length} حقل إلى القالب المحدد`
      });
      onOpenChange(false);
      onSuccess();
      // إعادة تعيين الحالة
      setStep("selectTemplate");
      setTargetTemplateId("");
      setSelectedFields([]);
    },
    onError: (error: any) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "حدث خطأ أثناء نسخ الحقول",
        variant: "destructive"
      });
    }
  });
  
  // التعامل مع تحديد الكل أو إلغاء تحديد الكل
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // تحديد جميع الحقول المتاحة (غير المكررة)
      const availableFieldIds = sourceFields
        .filter(field => getDuplicateStatus(field) !== "duplicate")
        .map(field => field.id);
      setSelectedFields(availableFieldIds);
    } else {
      setSelectedFields([]);
    }
  };
  
  // التعامل مع تغيير حالة تحديد حقل
  const handleFieldSelectionChange = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, id]);
    } else {
      setSelectedFields(prev => prev.filter(fieldId => fieldId !== id));
    }
  };
  
  // التحقق من وجود حقول في القالب المصدر
  const hasSourceFields = sourceFields.length > 0;
  
  // التحقق من وجود حقول متاحة للنسخ (غير مكررة)
  const hasAvailableFields = sourceFields.some(field => 
    getDuplicateStatus(field) !== "duplicate"
  );
  
  // التعامل مع النقر على زر "التالي"
  const handleNextStep = () => {
    if (!targetTemplateId) {
      toast({
        title: "يرجى اختيار قالب",
        description: "يجب عليك اختيار قالب لنسخ الحقول إليه",
        variant: "destructive"
      });
      return;
    }
    
    // إذا لم يكن هناك حقول في القالب المصدر
    if (!hasSourceFields) {
      toast({
        title: "لا توجد حقول",
        description: "لا توجد حقول في القالب المصدر للنسخ",
        variant: "destructive"
      });
      return;
    }
    
    setStep("selectFields");
  };
  
  // التعامل مع تقديم النموذج
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFields.length === 0) {
      toast({
        title: "يرجى اختيار حقول",
        description: "يجب عليك اختيار حقل واحد على الأقل لنسخه",
        variant: "destructive"
      });
      return;
    }
    
    copyFieldsMutation.mutate();
  };
  
  // التعامل مع الرجوع للخطوة السابقة
  const handleBack = () => {
    setStep("selectTemplate");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>نسخ حقول القالب</DialogTitle>
          <DialogDescription>
            {step === "selectTemplate" 
              ? "اختر القالب الهدف الذي تريد نسخ الحقول إليه" 
              : "حدد الحقول التي تريد نسخها إلى القالب الهدف"}
          </DialogDescription>
        </DialogHeader>
        
        {step === "selectTemplate" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetTemplate">اختر القالب الهدف</Label>
              
              {isLoadingTemplates ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : availableTemplates.length > 0 ? (
                <Select value={targetTemplateId} onValueChange={setTargetTemplateId}>
                  <SelectTrigger id="targetTemplate">
                    <SelectValue placeholder="اختر قالباً لنسخ الحقول إليه" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center p-4 border rounded-md">
                  <p className="text-muted-foreground">لا توجد قوالب أخرى متاحة لنسخ الحقول إليها</p>
                </div>
              )}
            </div>
            
            {isLoadingSourceFields ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !hasSourceFields ? (
              <div className="text-center p-4 border rounded-md">
                <p className="text-muted-foreground">لا توجد حقول في القالب المصدر للنسخ</p>
              </div>
            ) : null}
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="button"
                onClick={handleNextStep}
                disabled={!targetTemplateId || !hasSourceFields || isLoadingSourceFields}
              >
                التالي
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLoadingTargetFields ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Checkbox 
                    id="selectAll" 
                    checked={selectAll} 
                    onCheckedChange={handleSelectAllChange}
                    disabled={!hasAvailableFields}
                  />
                  <Label htmlFor="selectAll">تحديد الكل</Label>
                </div>
                
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  <div className="space-y-3">
                    {sourceFields.map((field) => {
                      const isDuplicate = getDuplicateStatus(field) === "duplicate";
                      return (
                        <div key={field.id} className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Checkbox 
                            id={`field-${field.id}`} 
                            checked={selectedFields.includes(field.id)}
                            onCheckedChange={(checked) => handleFieldSelectionChange(field.id, !!checked)}
                            disabled={isDuplicate}
                          />
                          <div className="grid gap-1">
                            <Label htmlFor={`field-${field.id}`} className={isDuplicate ? "text-muted-foreground line-through" : ""}>
                              {field.label}
                              <span className="text-xs text-muted-foreground mr-1">({field.name})</span>
                            </Label>
                            {isDuplicate && (
                              <p className="text-xs text-destructive">هذا الحقل موجود مسبقاً في القالب الهدف</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {sourceFields.length === 0 && (
                      <p className="text-center text-muted-foreground">لا توجد حقول في القالب المصدر</p>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
            
            <DialogFooter className="mt-6 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={copyFieldsMutation.isPending}
                >
                  رجوع
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={copyFieldsMutation.isPending}
                >
                  إلغاء
                </Button>
              </div>
              <Button 
                type="submit"
                disabled={selectedFields.length === 0 || copyFieldsMutation.isPending}
              >
                {copyFieldsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري النسخ...
                  </>
                ) : "نسخ الحقول"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}