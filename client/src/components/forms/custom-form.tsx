import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTemplateForm } from "@/hooks/use-template-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomFormProps {
  onChange: (data: any) => void;
  template: any;
}

const CustomForm = ({ onChange, template }: CustomFormProps) => {
  // التحقق من وجود الحقول المخصصة في القالب
  const customFields = template?.templateFields || [];
  
  // استخدام الحقول المخصصة من القالب إذا كانت متوفرة وإلا استخدم الحقول الافتراضية
  let fields = customFields.length > 0 ? customFields : 
    template?.fields ? template.fields.map((field: string) => ({
      name: field,
      label: getDefaultFieldLabel(field),
      type: getDefaultFieldType(field),
      required: isFieldRequired(field),
      placeholder: getDefaultFieldPlaceholder(field),
      displayOrder: 0, // قيمة افتراضية للترتيب
    })) : [];
    
  // ترتيب الحقول حسب خاصية displayOrder
  fields = [...fields].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  
  console.log("Fields after sorting by displayOrder:", fields);
  
  // إنشاء حالة افتراضية تعتمد على الحقول المتاحة في القالب
  const initialState: Record<string, any> = {};
  fields.forEach((field: any) => {
    // استخدام القيم الافتراضية إذا كانت موجودة
    initialState[field.name] = field.defaultValue || "";
  });

  const { formData, updateFormField } = useTemplateForm(initialState);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  // رسم حقل استنادًا إلى نوعه
  const renderField = (field: any) => {
    const fieldType = field.type || "text";
    const required = field.required || false;
    
    switch (fieldType) {
      case "image":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Input
                id={field.name}
                name={field.name}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // قراءة الملف كـ Data URL وتخزينه
                    const reader = new FileReader();
                    reader.onload = () => {
                      updateFormField(field.name, reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                required={required}
                className="rtl"
              />
            </div>
            {formData[field.name] && (
              <div className="mt-2 rounded border p-2">
                <img 
                  src={formData[field.name]} 
                  alt={field.label} 
                  className="max-h-32 object-contain mx-auto" 
                />
              </div>
            )}
          </div>
        );
      
      case "text":
        return (
          <Input
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ""}
            value={formData[field.name] || ""}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            required={required}
            className="rtl"
          />
        );
      
      case "textarea":
        return (
          <Textarea
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ""}
            value={formData[field.name] || ""}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            required={required}
            className="rtl"
          />
        );
      
      case "select":
        return (
          <Select
            value={formData[field.name] || ""}
            onValueChange={(value) => updateFormField(field.name, value)}
            required={required}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "اختر..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "radio":
        return (
          <RadioGroup
            value={formData[field.name] || ""}
            onValueChange={(value) => updateFormField(field.name, value)}
            required={required}
            className="space-y-2"
          >
            {field.options?.map((option: any) => (
              <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem id={`${field.name}-${option.value}`} value={option.value} />
                <Label htmlFor={`${field.name}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case "checkbox":
        return (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id={field.name}
              checked={formData[field.name] || false}
              onCheckedChange={(checked) => updateFormField(field.name, checked)}
            />
            <Label htmlFor={field.name}>{field.label}</Label>
          </div>
        );
      
      case "date":
        return (
          <Input
            id={field.name}
            name={field.name}
            type="date"
            value={formData[field.name] || ""}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            required={required}
          />
        );
      
      default:
        return (
          <Input
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ""}
            value={formData[field.name] || ""}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            required={required}
            className="rtl"
          />
        );
    }
  };

  // وظائف مساعدة للتعامل مع الحقول الافتراضية
  function getDefaultFieldLabel(fieldName: string): string {
    switch (fieldName) {
      case "sender": return "اسم المرسل";
      case "recipient": return "اسم المستلم";
      case "message": return "رسالة البطاقة";
      case "event": return "المناسبة";
      case "date": return "التاريخ";
      case "time": return "الوقت";
      case "occasion": return "نوع المناسبة";
      default: return fieldName;
    }
  }

  function getDefaultFieldType(fieldName: string): string {
    // التعرف على حقول الصور من خلال الاسم
    if (fieldName.includes('image') || 
        fieldName.includes('img') || 
        fieldName.includes('logo') || 
        fieldName.includes('photo') || 
        fieldName.includes('picture') || 
        fieldName.includes('صورة') || 
        fieldName.includes('شعار')) {
      return "image";
    }
    
    switch (fieldName) {
      case "message": return "textarea";
      case "date": return "date";
      case "time": return "time";
      default: return "text";
    }
  }

  function isFieldRequired(fieldName: string): boolean {
    switch (fieldName) {
      case "sender": return true;
      case "recipient": return true;
      case "message": return true;
      default: return false;
    }
  }

  function getDefaultFieldPlaceholder(fieldName: string): string {
    switch (fieldName) {
      case "sender": return "أدخل اسمك";
      case "recipient": return "أدخل اسم الشخص الذي تريد إرسال البطاقة له";
      case "message": return "اكتب رسالتك هنا...";
      case "event": return "أدخل اسم المناسبة";
      case "occasion": return "أدخل نوع المناسبة";
      default: return "";
    }
  }

  // رسم الحقول الديناميكية بناء على التكوين
  return (
    <div className="space-y-4">
      {fields.map((field: any, index: number) => (
        <div key={`${field.name}-${index}`} className="form-group">
          <Label htmlFor={field.name} className="block text-sm font-medium mb-1">
            {field.label}
            {field.required && <span className="text-destructive mr-1">*</span>}
          </Label>
          {renderField(field)}
          {field.description && (
            <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default CustomForm;