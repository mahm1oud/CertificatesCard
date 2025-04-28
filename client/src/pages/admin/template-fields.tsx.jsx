import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogFooter } from "@/components/ui/dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Minus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

export default function TemplateFieldsPage() {
  const { templateId } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for template data
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [newOption, setNewOption] = useState("");
  
  // State for field form data
  const [fieldFormData, setFieldFormData] = useState({
    name: "",
    label: "",
    labelAr: "",
    type: "text",
    required: false,
    defaultValue: "",
    placeholder: "",
    placeholderAr: "",
    options: [],
    position: {
      x: 50,
      y: 50,
      snapToGrid: false
    },
    style: {
      fontFamily: "Cairo",
      fontSize: 24,
      fontWeight: "normal",
      color: "#000000",
      align: "center",
      textShadow: {
        enabled: false,
        color: "#ffffff",
        blur: 5
      }
    },
    displayOrder: 0
  });
  
  // Query to fetch template data
  const { data: templateData, isLoading: isTemplateLoading } = useQuery({
    queryKey: [`/api/templates/${templateId}`],
    queryFn: apiRequest,
    enabled: !!templateId
  });
  
  // Query to fetch template fields
  const { data: fieldsData, isLoading: isFieldsLoading, refetch: refetchFields } = useQuery({
    queryKey: [`/api/templates/${templateId}/fields`],
    queryFn: apiRequest,
    enabled: !!templateId
  });
  
  // Mutation for creating a new field
  const createFieldMutation = useMutation({
    mutationFn: (data) => {
      return apiRequest(`/api/templates/${templateId}/fields`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة الحقل بنجاح"
      });
      setDialogOpen(false);
      refetchFields();
      resetFieldForm();
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الحقل",
        variant: "destructive"
      });
    }
  });
  
  // Mutation for updating a field
  const updateFieldMutation = useMutation({
    mutationFn: (data) => {
      return apiRequest(`/api/templates/${templateId}/fields/${editingField}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الحقل بنجاح"
      });
      setDialogOpen(false);
      refetchFields();
      resetFieldForm();
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الحقل",
        variant: "destructive"
      });
    }
  });
  
  // Mutation for deleting a field
  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId) => {
      return apiRequest(`/api/templates/${templateId}/fields/${fieldId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حذف الحقل بنجاح"
      });
      refetchFields();
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "حدث خطأ أثناء حذف الحقل",
        variant: "destructive"
      });
    }
  });
  
  // Update template and fields when data changes
  useEffect(() => {
    if (templateData) {
      setTemplate(templateData);
    }
  }, [templateData]);
  
  useEffect(() => {
    if (fieldsData) {
      setFields(fieldsData);
    }
  }, [fieldsData]);
  
  // Handle opening the edit dialog
  const handleEditField = (field) => {
    setEditingField(field.id);
    setFieldFormData({
      name: field.name || "",
      label: field.label || "",
      labelAr: field.labelAr || "",
      type: field.type || "text",
      required: field.required || false,
      defaultValue: field.defaultValue || "",
      placeholder: field.placeholder || "",
      placeholderAr: field.placeholderAr || "",
      options: field.options || [],
      position: field.position || {
        x: 50,
        y: 50,
        snapToGrid: false
      },
      style: field.style || {
        fontFamily: "Cairo",
        fontSize: 24,
        fontWeight: "normal",
        color: "#000000",
        align: "center",
        textShadow: {
          enabled: false,
          color: "#ffffff",
          blur: 5
        }
      },
      displayOrder: field.displayOrder || 0
    });
    setDialogOpen(true);
  };
  
  // Handle opening the add dialog
  const handleAddField = () => {
    setEditingField(null);
    resetFieldForm();
    setDialogOpen(true);
  };
  
  // Reset field form
  const resetFieldForm = () => {
    setFieldFormData({
      name: "",
      label: "",
      labelAr: "",
      type: "text",
      required: false,
      defaultValue: "",
      placeholder: "",
      placeholderAr: "",
      options: [],
      position: {
        x: 50,
        y: 50,
        snapToGrid: false
      },
      style: {
        fontFamily: "Cairo",
        fontSize: 24,
        fontWeight: "normal",
        color: "#000000",
        align: "center",
        textShadow: {
          enabled: false,
          color: "#ffffff",
          blur: 5
        }
      },
      displayOrder: 0
    });
    setNewOption("");
  };
  
  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!fieldFormData.name) {
      toast({
        title: "اسم الحقل مطلوب",
        variant: "destructive"
      });
      return;
    }
    
    if (!fieldFormData.label) {
      toast({
        title: "عنوان الحقل مطلوب",
        variant: "destructive"
      });
      return;
    }
    
    // If editing, update field
    if (editingField) {
      updateFieldMutation.mutate(fieldFormData);
    } else {
      // If adding, create field
      createFieldMutation.mutate(fieldFormData);
    }
  };
  
  // Handle delete
  const handleDeleteField = (fieldId) => {
    if (confirm("هل أنت متأكد من حذف هذا الحقل؟")) {
      deleteFieldMutation.mutate(fieldId);
    }
  };
  
  // Handle position change
  const handlePositionChange = (axis, value) => {
    setFieldFormData((prev) => ({
      ...prev,
      position: {
        ...prev.position,
        [axis]: value
      }
    }));
  };
  
  // Handle style change
  const handleStyleChange = (prop, value) => {
    setFieldFormData((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        [prop]: value
      }
    }));
  };
  
  // Handle add option
  const handleAddOption = () => {
    if (!newOption.trim()) return;
    
    setFieldFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), newOption.trim()]
    }));
    setNewOption("");
  };
  
  // Handle remove option
  const handleRemoveOption = (index) => {
    setFieldFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };
  
  if (isTemplateLoading || isFieldsLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="container py-8">
        <p>لم يتم العثور على القالب</p>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">حقول القالب</h1>
          <p className="text-muted-foreground">{template.title}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation(`/admin/templates`)}>
            العودة للقوالب
          </Button>
          <Button onClick={handleAddField}>إضافة حقل جديد</Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">حقول القالب ({fields.length})</h2>
          
          {fields.length > 0 ? (
            <div className="border rounded-md divide-y">
              {fields.map((field) => (
                <div key={field.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{field.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {field.name} - {field.type}
                      {field.required && " (إلزامي)"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditField(field)}>
                      تعديل
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteField(field.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-md p-8 text-center">
              <p className="text-muted-foreground">لا توجد حقول لهذا القالب</p>
              <p className="text-sm text-muted-foreground mt-2">أضف حقولًا باستخدام زر "إضافة حقل جديد"</p>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">معاينة القالب</h2>
          
          <div className="border rounded-md bg-gray-100 p-4 text-center relative aspect-[3/4]">
            {template.imageUrl ? (
              <div className="relative w-full h-full">
                <img 
                  src={template.imageUrl} 
                  alt={template.title}
                  className="object-contain w-full h-full"
                />
                
                {/* Overlay field indicators */}
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="absolute border-2 border-dashed border-blue-500 rounded p-2 bg-blue-500/20"
                    style={{
                      top: `${field.position?.y || 50}%`,
                      left: `${field.position?.x || 50}%`,
                      transform: 'translate(-50%, -50%)',
                      color: field.style?.color || 'black',
                      fontFamily: field.style?.fontFamily || 'Cairo',
                      fontSize: `${field.style?.fontSize || 16}px`,
                      fontWeight: field.style?.fontWeight || 'normal',
                      textAlign: field.style?.align || 'center',
                      minWidth: '100px',
                      minHeight: '30px',
                      zIndex: 10
                    }}
                  >
                    {field.label}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">لا توجد صورة للقالب</p>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              انقر على "تعديل" لتغيير موضع وتنسيق الحقول على القالب
            </p>
          </div>
        </div>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'تعديل الحقل' : 'إضافة حقل جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="basic">معلومات أساسية</TabsTrigger>
                <TabsTrigger value="position">الموضع</TabsTrigger>
                <TabsTrigger value="style">المظهر</TabsTrigger>
                <TabsTrigger value="options">خيارات إضافية</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-2">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">اسم الحقل (ID)</Label>
                      <Input
                        id="name"
                        value={fieldFormData.name}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, name: e.target.value })}
                        placeholder="مثال: recipientName"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        يستخدم هذا المعرف في الكود، استخدم حروف إنجليزية وأرقام فقط
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="label">عنوان الحقل</Label>
                      <Input
                        id="label"
                        value={fieldFormData.label}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, label: e.target.value })}
                        placeholder="مثال: اسم المستلم"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="labelAr">عنوان الحقل (بالعربية)</Label>
                      <Input
                        id="labelAr"
                        value={fieldFormData.labelAr}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, labelAr: e.target.value })}
                        placeholder="مثال: اسم المستلم"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">نوع الحقل</Label>
                    <Select 
                      value={fieldFormData.type || 'text'}
                      onValueChange={(value) => setFieldFormData({ ...fieldFormData, type: value })}
                      required
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="اختر نوع الحقل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">نص قصير</SelectItem>
                        <SelectItem value="textarea">نص طويل</SelectItem>
                        <SelectItem value="number">رقم</SelectItem>
                        <SelectItem value="date">تاريخ</SelectItem>
                        <SelectItem value="time">وقت</SelectItem>
                        <SelectItem value="select">قائمة منسدلة</SelectItem>
                        <SelectItem value="radio">خيارات متعددة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="defaultValue">القيمة الافتراضية</Label>
                    <Input
                      id="defaultValue"
                      value={fieldFormData.defaultValue || ''}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, defaultValue: e.target.value })}
                      placeholder="القيمة الافتراضية للحقل"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="placeholder">نص توضيحي</Label>
                      <Input
                        id="placeholder"
                        value={fieldFormData.placeholder || ''}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                        placeholder="مثال: أدخل اسم المستلم"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="placeholderAr">نص توضيحي (بالعربية)</Label>
                      <Input
                        id="placeholderAr"
                        value={fieldFormData.placeholderAr || ''}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, placeholderAr: e.target.value })}
                        placeholder="مثال: أدخل اسم المستلم"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="required" 
                      checked={fieldFormData.required}
                      onCheckedChange={(checked) => setFieldFormData({ ...fieldFormData, required: !!checked })}
                    />
                    <Label htmlFor="required">حقل إلزامي</Label>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="position" className="mt-2">
                <div className="grid gap-6">
                  <div className="template-editor-controls">
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <div className="grid gap-2">
                          <Label>محاذاة عامودية</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              type="button"
                              variant={fieldFormData.style?.verticalAlign === 'top' ? 'default' : 'outline'}
                              className="w-full"
                              onClick={() => handleStyleChange('verticalAlign', 'top')}
                            >
                              أعلى
                            </Button>
                            <Button
                              type="button" 
                              variant={fieldFormData.style?.verticalAlign === 'middle' ? 'default' : 'outline'}
                              className="w-full"
                              onClick={() => handleStyleChange('verticalAlign', 'middle')}
                            >
                              وسط
                            </Button>
                            <Button
                              type="button"
                              variant={fieldFormData.style?.verticalAlign === 'bottom' ? 'default' : 'outline'}
                              className="w-full"
                              onClick={() => handleStyleChange('verticalAlign', 'bottom')}
                            >
                              أسفل
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="grid gap-2">
                          <Label>محاذاة أفقية</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              type="button"
                              variant={fieldFormData.style?.textAlign === 'right' ? 'default' : 'outline'}
                              className="w-full"
                              onClick={() => handleStyleChange('textAlign', 'right')}
                            >
                              يمين
                            </Button>
                            <Button
                              type="button"
                              variant={fieldFormData.style?.textAlign === 'center' ? 'default' : 'outline'}
                              className="w-full"
                              onClick={() => handleStyleChange('textAlign', 'center')}
                            >
                              وسط
                            </Button>
                            <Button
                              type="button"
                              variant={fieldFormData.style?.textAlign === 'left' ? 'default' : 'outline'}
                              className="w-full"
                              onClick={() => handleStyleChange('textAlign', 'left')}
                            >
                              يسار
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Label className="mb-2">الموضع</Label>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="x" className="flex-shrink-0">الموضع الأفقي (x)</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handlePositionChange('x', (fieldFormData.position?.x || 50) - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handlePositionChange('x', (fieldFormData.position?.x || 50) + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="relative">
                            <Slider
                              id="x"
                              min={0}
                              max={100}
                              step={1}
                              value={[fieldFormData.position?.x || 50]}
                              onValueChange={([value]) => handlePositionChange('x', value)}
                              className="mt-2"
                            />
                            {fieldFormData.position?.snapToGrid && (
                              <>
                                <div className="absolute top-[25%] left-2 text-xs bg-black/70 text-white px-1 rounded -translate-y-1/2 pointer-events-none">25%</div>
                                <div className="absolute top-[50%] left-2 text-xs bg-black/70 text-white px-1 rounded -translate-y-1/2 pointer-events-none">50%</div>
                                <div className="absolute top-[75%] left-2 text-xs bg-black/70 text-white px-1 rounded -translate-y-1/2 pointer-events-none">75%</div>
                              </>
                            )}
                          </div>
                          <div className="flex mt-1 justify-between items-center">
                            <span className="text-xs text-muted-foreground">0%</span>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={fieldFormData.position?.x || 50}
                              onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                              className="w-16 h-7 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">100%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="y" className="flex-shrink-0">الموضع العامودي (y)</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handlePositionChange('y', (fieldFormData.position?.y || 50) - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handlePositionChange('y', (fieldFormData.position?.y || 50) + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="relative">
                            <Slider
                              id="y"
                              min={0}
                              max={100}
                              step={1}
                              value={[fieldFormData.position?.y || 50]}
                              onValueChange={([value]) => handlePositionChange('y', value)}
                              className="mt-2"
                            />
                            {fieldFormData.position?.snapToGrid && (
                              <>
                                <div className="absolute top-[25%] right-2 text-xs bg-black/70 text-white px-1 rounded -translate-y-1/2 pointer-events-none">25%</div>
                                <div className="absolute top-[50%] right-2 text-xs bg-black/70 text-white px-1 rounded -translate-y-1/2 pointer-events-none">50%</div>
                                <div className="absolute top-[75%] right-2 text-xs bg-black/70 text-white px-1 rounded -translate-y-1/2 pointer-events-none">75%</div>
                              </>
                            )}
                          </div>
                          <div className="flex mt-1 justify-between items-center">
                            <span className="text-xs text-muted-foreground">0%</span>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={fieldFormData.position?.y || 50}
                              onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                              className="w-16 h-7 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center">
                          <Checkbox 
                            id="snapToGrid" 
                            checked={fieldFormData.position?.snapToGrid || false}
                            onCheckedChange={(checked) => {
                              setFieldFormData((prev) => ({
                                ...prev,
                                position: {
                                  ...prev.position,
                                  snapToGrid: !!checked
                                }
                              }));
                            }}
                          />
                          <Label htmlFor="snapToGrid" className="mx-2">محاذاة تلقائية للشبكة</Label>
                        </div>
                        <span className="text-xs text-muted-foreground pr-7">
                          المحاذاة التلقائية تساعدك على وضع العناصر بدقة بنسب 25%، 50%، 75%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="mt-2">
                <div className="grid gap-6">
                  <div className="template-editor-controls">
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <div className="grid gap-2">
                          <Label>أنماط النص</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="fontWeight">وزن الخط</Label>
                              <Select 
                                value={fieldFormData.style?.fontWeight || 'normal'}
                                onValueChange={(value) => setFieldFormData({ 
                                  ...fieldFormData, 
                                  style: { 
                                    ...fieldFormData.style,
                                    fontWeight: value
                                  } 
                                })}
                              >
                                <SelectTrigger id="fontWeight">
                                  <SelectValue placeholder="اختر وزن الخط" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">عادي</SelectItem>
                                  <SelectItem value="bold">عريض</SelectItem>
                                  <SelectItem value="100">رفيع جداً (100)</SelectItem>
                                  <SelectItem value="300">رفيع (300)</SelectItem>
                                  <SelectItem value="500">متوسط (500)</SelectItem>
                                  <SelectItem value="700">عريض (700)</SelectItem>
                                  <SelectItem value="900">عريض جداً (900)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label htmlFor="fontSize">حجم الخط</Label>
                              <Input
                                id="fontSize"
                                type="number"
                                min="12"
                                max="72"
                                value={fieldFormData.style?.fontSize || 24}
                                onChange={(e) => setFieldFormData({ 
                                  ...fieldFormData, 
                                  style: { 
                                    ...fieldFormData.style,
                                    fontSize: Number(e.target.value)
                                  } 
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2 mt-4">
                            <Label htmlFor="fontFamily">نوع الخط</Label>
                            <Select 
                              value={fieldFormData.style?.fontFamily || 'Cairo'}
                              onValueChange={(value) => setFieldFormData({ 
                                ...fieldFormData, 
                                style: { 
                                  ...fieldFormData.style,
                                  fontFamily: value
                                } 
                              })}
                            >
                              <SelectTrigger id="fontFamily">
                                <SelectValue placeholder="اختر نوع الخط" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cairo">Cairo</SelectItem>
                                <SelectItem value="Tajawal">Tajawal</SelectItem>
                                <SelectItem value="Amiri">Amiri</SelectItem>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="sans-serif">Sans-serif</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2 mt-2">
                            <Label htmlFor="textColor">لون النص</Label>
                            <div className="flex gap-2">
                              <Input
                                id="textColor"
                                type="color"
                                className="w-12 h-9 p-1"
                                value={fieldFormData.style?.color || '#000000'}
                                onChange={(e) => setFieldFormData({ 
                                  ...fieldFormData, 
                                  style: { 
                                    ...fieldFormData.style,
                                    color: e.target.value
                                  } 
                                })}
                              />
                              <Input
                                value={fieldFormData.style?.color || '#000000'}
                                onChange={(e) => setFieldFormData({ 
                                  ...fieldFormData, 
                                  style: { 
                                    ...fieldFormData.style,
                                    color: e.target.value
                                  } 
                                })}
                                placeholder="#000000"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2 mt-2">
                            <Label htmlFor="textAlign">محاذاة النص</Label>
                            <Select 
                              value={fieldFormData.style?.align || 'center'}
                              onValueChange={(value) => setFieldFormData({ 
                                ...fieldFormData, 
                                style: { 
                                  ...fieldFormData.style,
                                  align: value
                                } 
                              })}
                            >
                              <SelectTrigger id="textAlign">
                                <SelectValue placeholder="اختر محاذاة النص" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="center">وسط</SelectItem>
                                <SelectItem value="right">يمين</SelectItem>
                                <SelectItem value="left">يسار</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="mt-4 border p-3 rounded-md">
                          <div className="flex items-center space-x-2 space-x-reverse mb-3">
                            <Checkbox 
                              id="shadowEnabled"
                              checked={fieldFormData.style?.textShadow?.enabled || false}
                              onCheckedChange={(checked) => setFieldFormData({ 
                                ...fieldFormData, 
                                style: { 
                                  ...fieldFormData.style,
                                  textShadow: {
                                    ...fieldFormData.style?.textShadow,
                                    enabled: !!checked
                                  }
                                } 
                              })}
                            />
                            <Label htmlFor="shadowEnabled" className="text-sm">تفعيل ظل النص</Label>
                          </div>
                          
                          {fieldFormData.style?.textShadow?.enabled && (
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <div className="grid gap-1">
                                <Label htmlFor="shadowColor" className="text-xs">لون الظل</Label>
                                <div className="flex gap-1">
                                  <Input
                                    id="shadowColor"
                                    type="color"
                                    className="w-8 h-8 p-1"
                                    value={fieldFormData.style?.textShadow?.color || '#ffffff'}
                                    onChange={(e) => setFieldFormData({ 
                                      ...fieldFormData, 
                                      style: { 
                                        ...fieldFormData.style,
                                        textShadow: {
                                          ...fieldFormData.style?.textShadow,
                                          color: e.target.value
                                        }
                                      } 
                                    })}
                                  />
                                  <Input
                                    className="text-xs h-8"
                                    value={fieldFormData.style?.textShadow?.color || '#ffffff'}
                                    onChange={(e) => setFieldFormData({ 
                                      ...fieldFormData, 
                                      style: { 
                                        ...fieldFormData.style,
                                        textShadow: {
                                          ...fieldFormData.style?.textShadow,
                                          color: e.target.value
                                        }
                                      } 
                                    })}
                                  />
                                </div>
                              </div>
                              <div className="grid gap-1">
                                <Label htmlFor="shadowBlur" className="text-xs">تمويه الظل</Label>
                                <Input
                                  id="shadowBlur"
                                  type="number"
                                  min="0"
                                  max="20"
                                  className="h-8"
                                  value={fieldFormData.style?.textShadow?.blur || 5}
                                  onChange={(e) => setFieldFormData({ 
                                    ...fieldFormData, 
                                    style: { 
                                      ...fieldFormData.style,
                                      textShadow: {
                                        ...fieldFormData.style?.textShadow,
                                        blur: Number(e.target.value)
                                      }
                                    } 
                                  })}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="mb-2 block">معاينة التنسيق</Label>
                        
                        <div className="relative mt-2 border rounded-md bg-gray-100 template-editor-container">
                          {/* صورة القالب الفعلية في الخلفية */}
                          <div className="absolute inset-0">
                            {template?.imageUrl ? (
                              <img 
                                src={template.imageUrl} 
                                alt={template.title}
                                className="object-contain w-full h-full"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">لا توجد صورة للقالب</p>
                              </div>
                            )}
                          </div>
                          
                          {/* عرض تفاصيل التنسيق */}
                          <div 
                            className="absolute"
                            style={{
                              top: `${fieldFormData.position?.y || 50}%`,
                              left: `${fieldFormData.position?.x || 50}%`,
                              transform: 'translate(-50%, -50%)',
                              color: fieldFormData.style?.color || 'black',
                              fontFamily: fieldFormData.style?.fontFamily || 'Cairo',
                              fontSize: `${fieldFormData.style?.fontSize || 16}px`,
                              fontWeight: fieldFormData.style?.fontWeight || 'normal',
                              textAlign: fieldFormData.style?.align || 'center',
                              textShadow: fieldFormData.style?.textShadow?.enabled ? 
                                `0 0 ${fieldFormData.style?.textShadow?.blur || 5}px ${fieldFormData.style?.textShadow?.color || '#ffffff'}` : 
                                'none',
                              padding: '8px 16px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(59, 130, 246, 0.2)',
                              border: '2px dashed rgba(59, 130, 246, 0.7)',
                              minWidth: '100px',
                              minHeight: '30px',
                              zIndex: 10
                            }}
                          >
                            {fieldFormData.label || 'عنوان الحقل'}
                          </div>
                        </div>
                        
                        <div className="mt-8">
                          <h3 className="text-sm font-medium mb-2">نصائح لتصميم أفضل</h3>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• تأكد من أن لون النص مناسب للخلفية لتجنب صعوبة القراءة</li>
                            <li>• استخدم ظل النص عندما يكون النص غير واضح على الخلفية</li>
                            <li>• اختر حجم خط مناسب لكمية النص - الخط الكبير للنصوص القصيرة</li>
                            <li>• الخط الصغير قد يصعب قراءته في الصور المشاركة عبر الجوال</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="options" className="mt-2">
                {(fieldFormData.type === 'select' || fieldFormData.type === 'radio') ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>الخيارات</Label>
                      <p className="text-sm text-muted-foreground">
                        عدد الخيارات: {fieldFormData.options?.length || 0}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="أضف خيار جديد"
                      />
                      <Button type="button" variant="secondary" onClick={handleAddOption}>
                        إضافة
                      </Button>
                    </div>
                    
                    <div className="border rounded-md">
                      {fieldFormData.options?.length ? (
                        <div className="p-1 divide-y">
                          {fieldFormData.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{index + 1}.</span>
                                <span>{option}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (index > 0) {
                                      const newOptions = [...fieldFormData.options];
                                      [newOptions[index], newOptions[index - 1]] = [newOptions[index - 1], newOptions[index]];
                                      setFieldFormData({
                                        ...fieldFormData,
                                        options: newOptions
                                      });
                                    }
                                  }}
                                  disabled={index === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (index < fieldFormData.options.length - 1) {
                                      const newOptions = [...fieldFormData.options];
                                      [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
                                      setFieldFormData({
                                        ...fieldFormData,
                                        options: newOptions
                                      });
                                    }
                                  }}
                                  disabled={index === fieldFormData.options.length - 1}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveOption(index)}
                                  className="text-destructive hover:text-destructive/90"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-sm text-muted-foreground">لا توجد خيارات حتى الآن</p>
                          <p className="text-xs text-muted-foreground mt-1">أضف خيارات للحقل باستخدام النموذج أعلاه</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">لا توجد خيارات متاحة لهذا النوع من الحقول</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      الخيارات متاحة فقط لحقول القوائم المنسدلة والخيارات المتعددة
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 border-t pt-4">
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
                >
                  {(createFieldMutation.isPending || updateFieldMutation.isPending) && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  {editingField ? 'تحديث الحقل' : 'إضافة الحقل'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
