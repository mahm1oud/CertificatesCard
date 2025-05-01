import React, { useState, useCallback, useEffect } from 'react';
import { SimpleCanvas } from './SimpleCanvas';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Save, Layout, Type, Square, Circle, Image, 
  ArrowLeft, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fabric from '@/lib/fabric-import';

interface TemplateEditorProps {
  templateId: number;
  templateImage: string;
  fields: any[];
  initialLayout?: any[];
  onSave?: (layoutData: any[]) => void;
  onBack?: () => void;
  className?: string;
}

export function SimpleEditor({
  templateId,
  templateImage,
  fields = [],
  initialLayout = [],
  onSave,
  onBack,
  className = ''
}: TemplateEditorProps) {
  const { toast } = useToast();
  const [canvas, setCanvas] = useState<any>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasError, setCanvasError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // حدث تهيئة الكانفاس
  const handleCanvasReady = useCallback((canvasInstance: any) => {
    console.log("Canvas is ready");
    setCanvas(canvasInstance);
    setError(null);
    setCanvasError(null);
  }, []);
  
  // Handle canvas errors
  const handleCanvasError = useCallback((err: Error) => {
    console.error("Canvas error:", err);
    setCanvasError(err);
    setError(`خطأ في تهيئة اللوحة: ${err.message}`);
    
    // Show error toast
    toast({
      title: "خطأ في محرر القوالب",
      description: `حدث خطأ أثناء تهيئة اللوحة: ${err.message}`,
      variant: "destructive",
    });
  }, [toast]);
  
  // إضافة أحداث التفاعل مع العناصر والكانفاس
  useEffect(() => {
    if (!canvas) return;
    
    try {
      // إضافة مستمعات الأحداث لتحديد العناصر والتفاعل معها
      canvas.on('selection:created', (e: any) => {
        console.log('Selection created:', e.selected);
        if (e.selected && e.selected.length === 1) {
          setSelectedObject(e.selected[0]);
        }
      });
      
      canvas.on('selection:updated', (e: any) => {
        console.log('Selection updated:', e.selected);
        if (e.selected && e.selected.length === 1) {
          setSelectedObject(e.selected[0]);
        }
      });
      
      canvas.on('selection:cleared', () => {
        console.log('Selection cleared');
        setSelectedObject(null);
      });
      
      canvas.on('object:modified', (e: any) => {
        console.log('Object modified:', e.target);
        canvas.renderAll();
      });
      
      console.log("Canvas event listeners added successfully");
      
      // تمكين التفاعل مع الكانفاس
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.renderAll();
    } catch (error) {
      console.error("Error setting up canvas events:", error);
    }
    
    // إزالة الأحداث عند تفكيك المكون
    return () => {
      try {
        canvas.off('selection:created');
        canvas.off('selection:updated');
        canvas.off('selection:cleared');
        canvas.off('object:modified');
      } catch (error) {
        console.error("Error removing canvas events:", error);
      }
    };
  }, [canvas]);

  // Apply initial layout when canvas is ready
  useEffect(() => {
    if (!canvas || !initialLayout || initialLayout.length === 0) return;
    
    try {
      console.log("Applying initial layout:", initialLayout);
      
      // Clear existing objects (keeping background)
      const bgImage = canvas.backgroundImage;
      canvas.clear();
      if (bgImage) {
        canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
      }
      
      // Apply each object from the layout
      initialLayout.forEach((item: any) => {
        if (!item || !item.type) return;
        
        try {
          let obj;
          
          switch (item.type) {
            case 'textbox':
              obj = new fabric.Textbox(item.text || 'نص', {
                left: item.left,
                top: item.top,
                width: item.width,
                fontSize: item.fontSize,
                fontFamily: item.fontFamily,
                fill: item.fill,
                scaleX: item.scaleX,
                scaleY: item.scaleY,
                angle: item.angle,
                data: item.data,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                lockMovementX: false,
                lockMovementY: false
              });
              break;
              
            case 'rect':
              obj = new fabric.Rect({
                left: item.left,
                top: item.top,
                width: item.width,
                height: item.height,
                fill: item.fill,
                stroke: item.stroke,
                strokeWidth: item.strokeWidth,
                scaleX: item.scaleX,
                scaleY: item.scaleY,
                angle: item.angle,
                rx: item.rx || 0,
                ry: item.ry || 0,
                data: item.data,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                lockMovementX: false,
                lockMovementY: false
              });
              break;
              
            case 'circle':
              obj = new fabric.Circle({
                left: item.left,
                top: item.top,
                radius: item.radius || 50,
                fill: item.fill,
                stroke: item.stroke,
                strokeWidth: item.strokeWidth,
                scaleX: item.scaleX,
                scaleY: item.scaleY,
                angle: item.angle,
                data: item.data,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                lockMovementX: false,
                lockMovementY: false
              });
              break;
              
            default:
              console.warn(`Unsupported object type: ${item.type}`);
              return;
          }
          
          console.log(`Adding object of type ${item.type} to canvas`);
          canvas.add(obj);
        } catch (itemError) {
          console.error(`Error adding item of type ${item.type}:`, itemError);
        }
      });
      
      // تحديث الكانفاس
      canvas.renderAll();
      
      toast({
        title: "تم تحميل التخطيط",
        description: `تم تحميل ${initialLayout.length} عنصر من التخطيط المحفوظ`,
      });
    } catch (layoutError) {
      console.error("Error applying initial layout:", layoutError);
      setError(`خطأ في تطبيق التخطيط: ${layoutError.message}`);
      
      toast({
        title: "خطأ في تحميل التخطيط",
        description: "حدث خطأ أثناء تطبيق التخطيط المحفوظ",
        variant: "destructive",
      });
    }
  }, [canvas, initialLayout, toast]);
  
  // إضافة عنصر نصي جديد
  const addText = () => {
    if (!canvas) {
      console.error("Canvas is not ready");
      toast({
        title: "خطأ",
        description: "محرر الرسم غير جاهز، يرجى الانتظار أو إعادة تحميل الصفحة",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Adding text element to canvas");
      
      // تحديد موضع عشوائي للإضافة بدلاً من موضع ثابت
      const randomLeft = 50 + Math.random() * 200;
      const randomTop = 50 + Math.random() * 200;
      
      const text = new fabric.Textbox('نص جديد', {
        left: randomLeft,
        top: randomTop,
        fontSize: 20,
        fontFamily: 'Arial',
        fill: '#000000',
        width: 200,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false
      });
      
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      
      console.log("Text added successfully:", text);
      
      // تحديث حالة العنصر المحدد
      setSelectedObject(text);
      
      // عرض إشعار نجاح إضافة العنصر
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة نص جديد بنجاح",
      });
    } catch (error) {
      console.error("Error adding text element:", error);
      toast({
        title: "خطأ في إضافة نص",
        description: "حدث خطأ أثناء إضافة عنصر نصي جديد",
        variant: "destructive"
      });
    }
  };
  
  // إضافة مستطيل
  const addRectangle = () => {
    if (!canvas) {
      console.error("Canvas is not ready");
      toast({
        title: "خطأ",
        description: "محرر الرسم غير جاهز، يرجى الانتظار أو إعادة تحميل الصفحة",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Adding rectangle to canvas");
      
      // تحديد موضع عشوائي للإضافة
      const randomLeft = 50 + Math.random() * 200;
      const randomTop = 50 + Math.random() * 200;
      
      const rect = new fabric.Rect({
        left: randomLeft,
        top: randomTop,
        width: 100,
        height: 50,
        fill: '#e9ecef',
        stroke: '#ced4da',
        strokeWidth: 1,
        rx: 5,
        ry: 5,
        selectable: true,
        hasControls: true,
        hasBorders: true
      });
      
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
      
      console.log("Rectangle added successfully:", rect);
      
      // تحديث حالة العنصر المحدد
      setSelectedObject(rect);
      
      // عرض إشعار نجاح إضافة العنصر
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة مستطيل جديد بنجاح",
      });
    } catch (error) {
      console.error("Error adding rectangle:", error);
      toast({
        title: "خطأ في إضافة مستطيل",
        description: "حدث خطأ أثناء إضافة مستطيل جديد",
        variant: "destructive"
      });
    }
  };
  
  // إضافة دائرة
  const addCircle = () => {
    if (!canvas) {
      console.error("Canvas is not ready");
      toast({
        title: "خطأ",
        description: "محرر الرسم غير جاهز، يرجى الانتظار أو إعادة تحميل الصفحة",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Adding circle to canvas");
      
      // تحديد موضع عشوائي للإضافة
      const randomLeft = 80 + Math.random() * 150;
      const randomTop = 80 + Math.random() * 150;
      
      const circle = new fabric.Circle({
        left: randomLeft,
        top: randomTop,
        radius: 40,
        fill: '#e9ecef',
        stroke: '#ced4da',
        strokeWidth: 1,
        selectable: true,
        hasControls: true,
        hasBorders: true
      });
      
      canvas.add(circle);
      canvas.setActiveObject(circle);
      canvas.renderAll();
      
      console.log("Circle added successfully:", circle);
      
      // تحديث حالة العنصر المحدد
      setSelectedObject(circle);
      
      // عرض إشعار نجاح إضافة العنصر
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة دائرة جديدة بنجاح",
      });
    } catch (error) {
      console.error("Error adding circle:", error);
      toast({
        title: "خطأ في إضافة دائرة",
        description: "حدث خطأ أثناء إضافة دائرة جديدة",
        variant: "destructive"
      });
    }
  };
  
  // إضافة صورة
  const addImage = () => {
    if (!canvas) {
      console.error("Canvas is not ready");
      toast({
        title: "خطأ",
        description: "محرر الرسم غير جاهز، يرجى الانتظار أو إعادة تحميل الصفحة",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Opening file picker for image");
      
      // فتح مربع اختيار الملفات
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (e: Event) => {
        try {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files[0]) {
            const file = target.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
              toast({
                title: "حجم الملف كبير جداً",
                description: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
                variant: "destructive"
              });
              return;
            }
            
            const reader = new FileReader();
            
            // عرض مؤشر التحميل
            toast({
              title: "جاري تحميل الصورة",
              description: "يرجى الانتظار...",
            });
            
            reader.onload = (event) => {
              try {
                const imgData = event.target?.result as string;
                
                if (!imgData) {
                  toast({
                    title: "خطأ في قراءة الصورة",
                    description: "فشل في قراءة بيانات الصورة",
                    variant: "destructive"
                  });
                  return;
                }
                
                // تحديد موضع عشوائي للإضافة
                const randomLeft = 50 + Math.random() * 200;
                const randomTop = 50 + Math.random() * 200;
                
                fabric.Image.fromURL(imgData, (img) => {
                  if (!img) {
                    console.error("Failed to create image from data");
                    toast({
                      title: "خطأ في إنشاء الصورة",
                      description: "فشل في إنشاء عنصر الصورة",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // تحجيم الصورة بشكل مناسب
                  img.scaleToWidth(200);
                  
                  // تعيين موضع الصورة
                  img.set({
                    left: randomLeft,
                    top: randomTop,
                    selectable: true,
                    hasControls: true,
                    hasBorders: true
                  });
                  
                  // إضافة الصورة إلى الكانفاس
                  canvas.add(img);
                  canvas.setActiveObject(img);
                  canvas.renderAll();
                  
                  // تحديث العنصر المحدد
                  setSelectedObject(img);
                  
                  console.log("Image added successfully");
                  
                  toast({
                    title: "تمت إضافة الصورة",
                    description: "تم إضافة الصورة بنجاح إلى القالب",
                  });
                }, { crossOrigin: 'anonymous' }, (err: Error) => {
                  console.error("Error loading image:", err);
                  toast({
                    title: "خطأ في تحميل الصورة",
                    description: "فشل في تحميل الصورة، يرجى المحاولة مرة أخرى",
                    variant: "destructive"
                  });
                });
              } catch (loadError) {
                console.error("Error processing image data:", loadError);
                toast({
                  title: "خطأ في معالجة الصورة",
                  description: "حدث خطأ أثناء معالجة بيانات الصورة",
                  variant: "destructive"
                });
              }
            };
            
            reader.onerror = () => {
              console.error("FileReader error:", reader.error);
              toast({
                title: "خطأ في قراءة الملف",
                description: "حدث خطأ أثناء قراءة ملف الصورة",
                variant: "destructive"
              });
            };
            
            // بدء قراءة ملف الصورة
            reader.readAsDataURL(file);
          }
        } catch (fileError) {
          console.error("Error handling file:", fileError);
          toast({
            title: "خطأ في معالجة الملف",
            description: "حدث خطأ أثناء معالجة ملف الصورة",
            variant: "destructive"
          });
        }
      };
      
      input.click();
    } catch (error) {
      console.error("Error adding image:", error);
      toast({
        title: "خطأ في إضافة صورة",
        description: "حدث خطأ أثناء محاولة إضافة صورة جديدة",
        variant: "destructive"
      });
    }
  };
  
  // إضافة حقل من الحقول المتاحة
  const addField = (field: any) => {
    if (!canvas) {
      console.error("Canvas is not ready");
      toast({
        title: "خطأ",
        description: "محرر الرسم غير جاهز، يرجى الانتظار أو إعادة تحميل الصفحة",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Adding field to canvas:", field);
      
      // تحديد موضع عشوائي للإضافة بدلاً من موضع ثابت
      const randomLeft = 50 + Math.random() * 200;
      const randomTop = 50 + Math.random() * 200;
      
      const text = new fabric.Textbox(field.label || field.name, {
        left: randomLeft,
        top: randomTop,
        fontSize: 20,
        fontFamily: 'Arial',
        fill: '#000000',
        width: 200,
        data: { 
          fieldId: field.id,
          fieldName: field.name,
          fieldType: field.type 
        },
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false
      });
      
      // إضافة العنصر إلى الكانفاس
      canvas.add(text);
      
      // تحديد العنصر المضاف
      canvas.setActiveObject(text);
      
      // تحديث الكانفاس
      canvas.renderAll();
      
      console.log("Field added successfully:", text);
      
      // تحديث حالة العنصر المحدد
      setSelectedObject(text);
      
      // عرض إشعار نجاح إضافة العنصر
      toast({
        title: "تمت الإضافة",
        description: `تم إضافة الحقل "${field.label || field.name}" بنجاح`,
      });
    } catch (error) {
      console.error("Error adding field:", error);
      toast({
        title: "خطأ في إضافة الحقل",
        description: "حدث خطأ أثناء إضافة الحقل إلى المحرر",
        variant: "destructive"
      });
    }
  };
  
  // حفظ التغييرات
  const handleSave = async () => {
    if (!canvas || !onSave) return;
    
    setSaving(true);
    
    try {
      // استخراج العناصر من الكانفاس
      const objects = canvas.getObjects().map((obj: any) => {
        return {
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          text: obj.text || '',
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          fontFamily: obj.fontFamily,
          fontSize: obj.fontSize,
          data: obj.data || {}
        };
      });
      
      // استدعاء معالج الحفظ
      await onSave(objects);
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ تخطيط القالب بنجاح",
      });
    } catch (error) {
      console.error('Error saving template layout:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ تخطيط القالب",
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4 p-2">
        <h2 className="text-xl font-bold">محرر القوالب</h2>
        
        <div className="flex space-x-2 rtl:space-x-reverse">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 ml-1" />
              رجوع
            </Button>
          )}
          
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                جاري الحفظ...
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="h-4 w-4 ml-1" />
                حفظ
              </span>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-4 gap-4">
        {/* لوحة الأدوات */}
        <div className="col-span-1">
          <Tabs defaultValue="elements">
            <TabsList className="w-full">
              <TabsTrigger value="elements" className="flex-1">العناصر</TabsTrigger>
              <TabsTrigger value="fields" className="flex-1">الحقول</TabsTrigger>
            </TabsList>
            
            <TabsContent value="elements" className="border rounded-md mt-2">
              <Card className="border-0 shadow-none">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">إضافة عناصر</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={addText}
                  >
                    <Type className="h-4 w-4 ml-2" />
                    <span>نص</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={addRectangle}
                  >
                    <Square className="h-4 w-4 ml-2" />
                    <span>مستطيل</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={addCircle}
                  >
                    <Circle className="h-4 w-4 ml-2" />
                    <span>دائرة</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={addImage}
                  >
                    <Image className="h-4 w-4 ml-2" />
                    <span>صورة</span>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="fields" className="border rounded-md mt-2">
              <Card className="border-0 shadow-none">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">حقول القالب</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] p-3">
                    {fields.length > 0 ? (
                      <div className="space-y-2">
                        {fields.map((field) => (
                          <Button
                            key={field.id}
                            variant="outline"
                            className="w-full justify-start text-right"
                            onClick={() => addField(field)}
                          >
                            <Layout className="h-4 w-4 ml-2" />
                            <div className="flex flex-col items-start">
                              <span>{field.label || field.name}</span>
                              <span className="text-xs text-muted-foreground">{field.type}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>لا توجد حقول متاحة</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* لوحة الرسم */}
        <div className="col-span-3 bg-slate-100 rounded-md p-4 flex items-center justify-center overflow-auto">
          <SimpleCanvas
            templateImage={templateImage}
            onCanvasReady={handleCanvasReady}
          />
        </div>
      </div>
    </div>
  );
}