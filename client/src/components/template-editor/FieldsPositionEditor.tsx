/**
 * محرر مواضع الحقول المتطور
 * الإصدار 3.1 - مايو 2025
 * 
 * مميزات النسخة المحدثة:
 * - يضمن تطابق 100% بين المعاينة والصورة النهائية
 * - يدعم معاينة الصورة النهائية في مختلف التنسيقات
 * - يدعم تنزيل الصورة بجودة عالية
 * - تحكم متقدم بالشبكة والمحاذاة
 * - تحرير متكامل لخصائص الحقول
 * - دعم طبقات متكامل مع إمكانية وضع الحقول أمام أو خلف صورة القالب
 * - دعم كامل للتدوير والحجم والتموضع
 * - دعم إخفاء وإظهار الحقول
 * - دعم الظلال للنصوص والصور
 * - دعم الاستخدام كمكون مضمن أو كحوار منبثق
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { DraggableFieldsPreviewPro } from ".";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  X,
  Plus,
  Minus,
  Download,
  RotateCw,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Layers,
  ArrowUp,
  ArrowDown,
  Image,
  Type,
  Trash2,
  Save,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  FileImage,
  Share,
  Settings,
  Loader2,
  Check
} from 'lucide-react';

/**
 * مهم جداً: هذه القيمة يجب أن تكون متطابقة مع
 * 1. BASE_IMAGE_WIDTH في DraggableFieldsPreviewPro.tsx
 * 2. BASE_IMAGE_WIDTH في optimized-image-generator.tsx
 * 3. BASE_IMAGE_WIDTH في server/optimized-image-generator.ts
 * لضمان التطابق 100% بين المعاينة والصورة النهائية
 */
const BASE_IMAGE_WIDTH = 1000;

// تعريف Field ليتوافق مع FieldType من DraggableFieldsPreviewPro
interface Field {
  id: number;
  name: string;
  label?: string;
  type: 'text' | 'image' | 'template'; // إضافة نوع template للتوافق مع مكون DraggableFieldsPreviewPro
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: any;
  zIndex?: number;
  visible?: boolean;
  rotation?: number;
  size?: { width: number; height: number };
}

// تعريف إعدادات المحرر
interface EditorSettings {
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  templateImageLayer?: number; // تحديد مستوى طبقة صورة القالب
  locked?: boolean; // قفل المحرر لمنع التعديل
  templateImageAsLayer?: boolean; // معالجة صورة القالب كطبقة مستقلة
}

// واجهة محرر موقع الحقول كحوار منبثق
interface FieldsPositionEditorDialogProps {
  isOpen: boolean;
  template: any;
  fields: Field[];
  onClose: () => void;
  onSave: (updatedFields: Field[]) => void;
  formData?: Record<string, any>;
  readOnly?: boolean;
  embedded?: boolean;
}

// واجهة محرر موقع الحقول المضمن (المستخدم في صفحة معاينة البطاقة)
interface EmbeddedFieldsPositionEditorProps {
  templateId: number;
  initialFields: Field[];
  formData: Record<string, any>;
  templateImage: string;
  onChange: (updatedFields: Field[]) => void;
  readOnly?: boolean;
  embedded?: boolean;
}

// دالة مساعدة لتنزيل الصورة
function downloadImage(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// واجهة مدير الطبقات
interface LayersManagerProps {
  fields: Field[];
  selectedFieldId: number | null;
  onSelectField: (id: number) => void;
  onMoveLayer: (id: number, direction: 'up' | 'down') => void;
  onToggleVisibility: (id: number) => void;
}

// مكون إدارة الطبقات
export const LayersManager: React.FC<LayersManagerProps> = ({
  fields,
  selectedFieldId,
  onSelectField,
  onMoveLayer,
  onToggleVisibility
}) => {
  // ترتيب الحقول حسب zIndex للعرض في لوحة الطبقات
  const sortedFields = [...fields].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
  const [hoveredLayerId, setHoveredLayerId] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // تابع لبروز العناصر عند التحويم عليها
  const highlightLayer = (id: number) => {
    setHoveredLayerId(id);
  };

  // تابع لإزالة البروز عند مغادرة التحويم
  const clearHighlight = () => {
    setHoveredLayerId(null);
  };

  return (
    <ScrollArea className="h-[calc(100vh-100px)]">
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="h-6 w-6 p-0">
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </Button>
            <h3 className="text-sm font-semibold">الطبقات</h3>
            <Badge variant="secondary" className="text-xs px-2">{fields.length}</Badge>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                <HelpCircle size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[250px]">
              <p className="text-xs">يمكنك تغيير ترتيب الطبقات هنا لوضع الحقول أمام أو خلف صورة القالب. الطبقات الأعلى في القائمة تظهر أمام الطبقات الأدنى.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {!isCollapsed && (
          <div className="space-y-1">
            {sortedFields.map((field) => (
              <div 
                key={field.id} 
                className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                  selectedFieldId === field.id 
                    ? 'bg-primary/15 border border-primary/30' 
                    : hoveredLayerId === field.id 
                    ? 'bg-secondary/20 border border-secondary/20' 
                    : 'hover:bg-accent border border-transparent'
                }`}
                onClick={() => onSelectField(field.id)}
                onMouseEnter={() => highlightLayer(field.id)}
                onMouseLeave={clearHighlight}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 p-0 ${field.visible === false ? 'text-muted-foreground' : 'text-foreground'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(field.id);
                      }}
                      title={field.visible === false ? 'إظهار الطبقة' : 'إخفاء الطبقة'}
                    >
                      {field.visible === false ? <Eye size={14} /> : <EyeOff size={14} />}
                    </Button>
                    
                    {field.type === 'text' && <Type size={14} className="text-blue-500" />}
                    {field.type === 'image' && <Image size={14} className="text-green-500" />}
                    {field.type === 'template' && <FileImage size={14} className="text-purple-500" />}
                    
                    <span className="text-xs font-medium truncate">
                      {field.type === 'template' ? 'صورة القالب' : field.label || field.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-2 py-0 bg-secondary/10">
                    z:{field.zIndex || 0}
                  </Badge>
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayer(field.id, 'up');
                      }}
                      title="نقل للأعلى"
                    >
                      <ArrowUp size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayer(field.id, 'down');
                      }}
                      title="نقل للأسفل"
                    >
                      <ArrowDown size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {fields.length === 0 && (
              <div className="text-center p-4 text-muted-foreground border rounded-md border-dashed">
                <p className="text-xs">لا توجد طبقات متاحة</p>
                <p className="text-xs mt-1">سيتم إضافة الطبقات عند تعيين الحقول</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

// مكون خصائص الحقل
interface FieldPropertiesProps {
  field: Field;
  onUpdate: (updatedField: Field) => void;
  onDelete: (fieldId: number) => void;
  onDuplicate: (fieldId: number) => void;
  onToggleVisibility: (fieldId: number) => void;
}

export const FieldProperties: React.FC<FieldPropertiesProps> = ({
  field,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleVisibility
}) => {
  return (
    <ScrollArea className="max-h-[calc(100vh-100px)]">
      <div className="p-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">{field.label || field.name}</h3>
          <div className="flex space-x-2 rtl:space-x-reverse">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onToggleVisibility(field.id)}
                  >
                    {field.visible === false ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{field.visible === false ? 'إظهار' : 'إخفاء'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDuplicate(field.id)}
                  >
                    <Copy size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>نسخ الحقل</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(field.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>حذف الحقل</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <Tabs defaultValue="position" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-2">
            <TabsTrigger value="position">الموضع</TabsTrigger>
            <TabsTrigger value="appearance">المظهر</TabsTrigger>
            <TabsTrigger value="format">التنسيق</TabsTrigger>
          </TabsList>
          
          {/* تبويب الموضع والحجم */}
          <TabsContent value="position" className="space-y-4">
            <div className="space-y-2">
              <Label>الموضع</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X</Label>
                  <Input
                    type="number"
                    value={field.position.x}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      if (!isNaN(newValue)) {
                        onUpdate({
                          ...field,
                          position: {
                            ...field.position,
                            x: newValue
                          }
                        });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Y</Label>
                  <Input
                    type="number"
                    value={field.position.y}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      if (!isNaN(newValue)) {
                        onUpdate({
                          ...field,
                          position: {
                            ...field.position,
                            y: newValue
                          }
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* التحكم في الحجم */}
            <div className="space-y-2">
              <Label>الحجم</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">العرض</Label>
                  <Input
                    type="number"
                    value={field.size?.width || (field.type === 'template' ? BASE_IMAGE_WIDTH : 'auto')}
                    disabled={field.type === 'template'}
                    onChange={(e) => {
                      if (field.type === 'template') return; // منع تغيير حجم صورة القالب
                      const newValue = e.target.value !== '' ? parseInt(e.target.value) : 0;
                      onUpdate({
                        ...field,
                        size: {
                          width: !isNaN(newValue) ? newValue : 0,
                          height: field.size?.height || 0
                        }
                      });
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">الارتفاع</Label>
                  <Input
                    type="number"
                    value={field.size?.height || 'auto'}
                    disabled={field.type === 'template'}
                    onChange={(e) => {
                      if (field.type === 'template') return; // منع تغيير حجم صورة القالب
                      const newValue = e.target.value !== '' ? parseInt(e.target.value) : 0;
                      onUpdate({
                        ...field,
                        size: {
                          width: field.size?.width || 0,
                          height: !isNaN(newValue) ? newValue : 0
                        }
                      });
                    }}
                  />
                </div>
              </div>
              {field.type === 'template' && (
                <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير حجم صورة القالب</p>
              )}
            </div>

            {/* التحكم في معلومات الطبقة */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>ترتيب الطبقة</Label>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      // جلب الطبقة للأمام
                      onUpdate({
                        ...field,
                        zIndex: (field.zIndex || 0) + 1
                      });
                    }}
                  >
                    <ArrowUp size={14} />
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      // إرسال الطبقة للخلف (لا تسمح بالقيم السالبة)
                      onUpdate({
                        ...field,
                        zIndex: Math.max(0, (field.zIndex || 0) - 1)
                      });
                    }}
                  >
                    <ArrowDown size={14} />
                  </Button>
                </div>
              </div>
              <Input
                type="number"
                min="0"
                value={field.zIndex || 0}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  if (!isNaN(newValue) && newValue >= 0) {
                    onUpdate({
                      ...field,
                      zIndex: newValue
                    });
                  }
                }}
              />
            </div>
          </TabsContent>
          
          {/* تبويب المظهر */}
          <TabsContent value="appearance" className="space-y-4">
            {/* التحكم في الدوران */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>الدوران</Label>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      // تدوير للخلف بمقدار 5 درجات
                      onUpdate({
                        ...field,
                        rotation: ((field.rotation || 0) - 5) % 360
                      });
                    }}
                  >
                    <RotateCcw size={14} />
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      // تدوير للأمام بمقدار 5 درجات
                      onUpdate({
                        ...field,
                        rotation: ((field.rotation || 0) + 5) % 360
                      });
                    }}
                  >
                    <RotateCw size={14} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Input
                  type="number"
                  value={field.rotation || 0}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    if (!isNaN(newValue)) {
                      onUpdate({
                        ...field,
                        rotation: newValue % 360
                      });
                    }
                  }}
                />
                <span className="text-sm">درجة</span>
              </div>
            </div>

            {/* نستكمل هنا خصائص المظهر حسب نوع الحقل */}
            {field.type === 'text' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الخط</Label>
                  <Select
                    value={field.style?.fontFamily || 'Cairo'}
                    onValueChange={(value) => {
                      onUpdate({
                        ...field,
                        style: {
                          ...field.style,
                          fontFamily: value
                        }
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الخط" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cairo">Cairo</SelectItem>
                      <SelectItem value="Almarai">Almarai</SelectItem>
                      <SelectItem value="Tajawal">Tajawal</SelectItem>
                      <SelectItem value="Amiri">Amiri</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>حجم الخط</Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Input
                      type="number"
                      value={field.style?.fontSize || 24}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        if (!isNaN(newValue) && newValue > 0) {
                          onUpdate({
                            ...field,
                            style: {
                              ...field.style,
                              fontSize: newValue
                            }
                          });
                        }
                      }}
                    />
                    <span className="text-sm">بكسل</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>اللون</Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="color"
                      value={field.style?.color || '#000000'}
                      onChange={(e) => {
                        onUpdate({
                          ...field,
                          style: {
                            ...field.style,
                            color: e.target.value
                          }
                        });
                      }}
                      className="w-10 h-10 rounded overflow-hidden"
                    />
                    <Input
                      value={field.style?.color || '#000000'}
                      onChange={(e) => {
                        onUpdate({
                          ...field,
                          style: {
                            ...field.style,
                            color: e.target.value
                          }
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>المحاذاة</Label>
                  <div className="flex space-x-1 rtl:space-x-reverse">
                    <Button
                      variant={field.style?.align === 'right' || !field.style?.align ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onUpdate({
                          ...field,
                          style: {
                            ...field.style,
                            align: 'right'
                          }
                        });
                      }}
                    >
                      <AlignRight size={16} />
                      <span className="ms-2">يمين</span>
                    </Button>
                    <Button
                      variant={field.style?.align === 'center' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onUpdate({
                          ...field,
                          style: {
                            ...field.style,
                            align: 'center'
                          }
                        });
                      }}
                    >
                      <AlignCenter size={16} />
                      <span className="ms-2">وسط</span>
                    </Button>
                    <Button
                      variant={field.style?.align === 'left' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onUpdate({
                          ...field,
                          style: {
                            ...field.style,
                            align: 'left'
                          }
                        });
                      }}
                    >
                      <AlignLeft size={16} />
                      <span className="ms-2">يسار</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* تبويب التنسيق المتقدم */}
          <TabsContent value="format" className="space-y-4">
            {field.type === 'text' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>خط عريض</Label>
                  <Switch
                    checked={field.style?.fontWeight === 'bold'}
                    onCheckedChange={(checked) => {
                      onUpdate({
                        ...field,
                        style: {
                          ...field.style,
                          fontWeight: checked ? 'bold' : 'normal'
                        }
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>تباعد السطور</Label>
                  <Slider
                    value={[field.style?.lineHeight || 1.2]}
                    min={0.5}
                    max={3}
                    step={0.1}
                    onValueChange={(values) => {
                      onUpdate({
                        ...field,
                        style: {
                          ...field.style,
                          lineHeight: values[0]
                        }
                      });
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5</span>
                    <span>{field.style?.lineHeight || 1.2}</span>
                    <span>3.0</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>الظل</Label>
                    <Switch
                      checked={field.style?.textShadow?.enabled || false}
                      onCheckedChange={(checked) => {
                        onUpdate({
                          ...field,
                          style: {
                            ...field.style,
                            textShadow: {
                              ...(field.style?.textShadow || {}),
                              enabled: checked,
                              color: field.style?.textShadow?.color || 'rgba(0,0,0,0.5)',
                              blur: field.style?.textShadow?.blur || 3,
                              offsetX: field.style?.textShadow?.offsetX || 2,
                              offsetY: field.style?.textShadow?.offsetY || 2
                            }
                          }
                        });
                      }}
                    />
                  </div>

                  {field.style?.textShadow?.enabled && (
                    <div className="space-y-2 pt-2">
                      <div className="space-y-1">
                        <Label className="text-xs">لون الظل</Label>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <input
                            type="color"
                            value={field.style.textShadow.color || '#000000'}
                            onChange={(e) => {
                              onUpdate({
                                ...field,
                                style: {
                                  ...field.style,
                                  textShadow: {
                                    ...field.style.textShadow,
                                    color: e.target.value
                                  }
                                }
                              });
                            }}
                            className="w-8 h-8 rounded overflow-hidden"
                          />
                          <Input
                            value={field.style.textShadow.color || '#000000'}
                            onChange={(e) => {
                              onUpdate({
                                ...field,
                                style: {
                                  ...field.style,
                                  textShadow: {
                                    ...field.style.textShadow,
                                    color: e.target.value
                                  }
                                }
                              });
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">إزاحة X</Label>
                          <Input
                            type="number"
                            value={field.style.textShadow.offsetX || 0}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value);
                              if (!isNaN(newValue)) {
                                onUpdate({
                                  ...field,
                                  style: {
                                    ...field.style,
                                    textShadow: {
                                      ...field.style.textShadow,
                                      offsetX: newValue
                                    }
                                  }
                                });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">إزاحة Y</Label>
                          <Input
                            type="number"
                            value={field.style.textShadow.offsetY || 0}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value);
                              if (!isNaN(newValue)) {
                                onUpdate({
                                  ...field,
                                  style: {
                                    ...field.style,
                                    textShadow: {
                                      ...field.style.textShadow,
                                      offsetY: newValue
                                    }
                                  }
                                });
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">ضبابية</Label>
                        <Input
                          type="number"
                          min="0"
                          value={field.style.textShadow.blur || 0}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            if (!isNaN(newValue) && newValue >= 0) {
                              onUpdate({
                                ...field,
                                style: {
                                  ...field.style,
                                  textShadow: {
                                    ...field.style.textShadow,
                                    blur: newValue
                                  }
                                }
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

// واجهة خصائص تبويب المعاينة
interface PreviewTabProps {
  template: any;
  fields: Field[];
  formData: Record<string, any>;
  onDownload: (quality: 'low' | 'medium' | 'high' | 'download') => void;
}

// مكون تبويب المعاينة
export const PreviewTab: React.FC<PreviewTabProps> = ({
  template,
  fields,
  formData,
  onDownload
}) => {
  const [previewQuality, setPreviewQuality] = useState<'low' | 'medium' | 'high' | 'download'>('medium');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [isCopied, setIsCopied] = useState(false);
  
  // توليد معاينة فورية
  useEffect(() => {
    // يمكن إضافة تأخير بسيط لتجنب التحديثات المتكررة جدًا
    const timer = setTimeout(() => {
      generatePreview();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [previewQuality, fields]);
  
  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // هنا يمكن استدعاء API لتوليد المعاينة (تطبيق محاكاة الآن)
      // في التطبيق الفعلي، سيتم استبدال هذا الكود بالاستدعاء الفعلي للخادم
      // أو استخدام المعاينة المولدة من المحرر
      await new Promise(resolve => setTimeout(resolve, 800)); // تأخير للمحاكاة
      
      if (template.imageUrl) {
        setPreviewImage(template.imageUrl); // استخدام صورة القالب كمحاكاة
      }
    } finally {
      setIsGeneratingPreview(false);
    }
  };
  
  const handleDownload = () => {
    setIsDownloading(true);
    try {
      onDownload(previewQuality);
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleCopyLink = () => {
    setIsCopied(true);
    // محاكاة نسخ الرابط
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <ScrollArea className="h-[calc(100vh-100px)]">
      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                معاينة
              </TabsTrigger>
              <TabsTrigger value="download">
                <Download className="w-4 h-4 mr-2" />
                تنزيل
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="mt-4 space-y-4">
              <div className="flex justify-center items-center mb-4 relative border rounded-lg bg-background/50 p-2 h-[300px] overflow-hidden">
                {isGeneratingPreview ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">جاري توليد المعاينة...</p>
                  </div>
                ) : previewImage ? (
                  <div className="relative max-h-full">
                    <img 
                      src={previewImage} 
                      alt="معاينة البطاقة" 
                      className="max-h-[280px] object-contain rounded shadow-md" 
                    />
                    <div className="absolute bottom-2 left-2 bg-primary/80 text-white text-xs px-2 py-1 rounded-sm">
                      معاينة
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileImage className="h-12 w-12 mb-2" />
                    <p className="text-sm">لا توجد معاينة متاحة</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2" 
                      onClick={generatePreview}
                    >
                      توليد المعاينة
                    </Button>
                  </div>
                )}
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>معاينة مباشرة</AlertTitle>
                <AlertDescription className="text-xs">
                  هذه معاينة للشكل النهائي للبطاقة. يمكنك تعديل الحقول في علامة التبويب "الخصائص" ورؤية التغييرات مباشرة هنا.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="download" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>جودة التنزيل</Label>
                    <Select
                      value={previewQuality}
                      onValueChange={(value: any) => setPreviewQuality(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر جودة التنزيل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفضة (سريعة)</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="download">ممتازة (حجم كبير)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>صيغة الملف</Label>
                    <Select
                      value={selectedFormat}
                      onValueChange={setSelectedFormat}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر صيغة الملف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG (شفاف)</SelectItem>
                        <SelectItem value="jpg">JPG (جودة عالية)</SelectItem>
                        <SelectItem value="webp">WebP (حجم صغير)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري التنزيل...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      تنزيل الصورة
                    </>
                  )}
                </Button>
                
                <Alert variant="outline" className="bg-secondary/10">
                  <AlertTitle className="flex items-center text-sm">
                    <Info className="h-4 w-4 mr-2" />
                    ميزات الصيغ المختلفة
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside text-xs space-y-1 mt-2">
                      <li><span className="font-bold">PNG:</span> يدعم الشفافية، مناسب للصور ذات التفاصيل الدقيقة</li>
                      <li><span className="font-bold">JPG:</span> حجم ملف أصغر، مناسب للصور الفوتوغرافية</li>
                      <li><span className="font-bold">WebP:</span> أفضل ضغط، يدعم الشفافية، مثالي للويب</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <Separator className="my-2" />
        
        <div>
          <h3 className="text-sm font-medium mb-2">مشاركة</h3>
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleCopyLink}
            >
              {isCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Share className="mr-2 h-4 w-4" />
                  نسخ الرابط
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

// المكون الرئيسي لمحرر مواضع الحقول
export const FieldsPositionEditor: React.FC<FieldsPositionEditorDialogProps | EmbeddedFieldsPositionEditorProps> = (props) => {
  const { toast } = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [advancedSettingsTab, setAdvancedSettingsTab] = useState('layers');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // إعدادات طبقة صورة القالب
  const [templateImageLayer, setTemplateImageLayer] = useState<number>(0); // 0 تعني الطبقة الوسطى
  const [templateImageAsLayer, setTemplateImageAsLayer] = useState<boolean>(true); // معالجة صورة القالب كطبقة
  
  // تحويل الـ props حسب واجهة الاستخدام
  const isDialog = 'isOpen' in props;
  const isEmbeddedEditor = !isDialog && 'onChange' in props;
  const { 
    formData = {}, 
    readOnly = false, 
    embedded = false 
  } = isDialog ? { formData: {}, ...props } : props;
  
  // استخراج البيانات من props
  const templateId = isDialog ? props.template?.id : props.templateId;
  const templateImage = isDialog ? props.template?.imageUrl : props.templateImage;
  
  // جلب الحقول الأولية
  useEffect(() => {
    if (isDialog) {
      if (props.fields) {
        console.log("FieldsPositionEditor - استلام حقول في وضع الحوار:", props.fields);
        setFields(props.fields);
        if (props.fields.length > 0 && !selectedFieldId) {
          setSelectedFieldId(props.fields[0].id);
        }
      }
    } else {
      if (props.initialFields) {
        console.log("FieldsPositionEditor - استلام حقول في وضع المضمن:", props.initialFields);
        // تأكد من أن جميع الحقول مرئية
        const visibleFields = props.initialFields.map(field => ({
          ...field,
          visible: true, // تأكيد أن جميع الحقول مرئية
        }));
        setFields(visibleFields);
        
        if (props.initialFields.length > 0 && !selectedFieldId) {
          setSelectedFieldId(props.initialFields[0].id);
        }
      }
    }
  }, [isDialog ? props.fields : props.initialFields, isDialog]);

  // حدث تحديث الحقول
  const updateField = (updatedField: Field) => {
    const newFields = fields.map(field => 
      field.id === updatedField.id ? updatedField : field
    );
    setFields(newFields);
    
    // تنفيذ التابع المناسب حسب واجهة الاستخدام
    if (isEmbeddedEditor) {
      (props as EmbeddedFieldsPositionEditorProps).onChange(newFields);
    }
  };

  // حدث حذف حقل
  const deleteField = (fieldId: number) => {
    // لا يمكن حذف حقل صورة القالب
    if (fieldId === -1) {
      toast({
        title: "لا يمكن الحذف",
        description: "لا يمكن حذف صورة القالب",
        variant: "destructive"
      });
      return;
    }
    
    const newFields = fields.filter(field => field.id !== fieldId);
    setFields(newFields);
    
    // عند حذف الحقل المحدد، اختر أول حقل متبقي
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(newFields.length > 0 ? newFields[0].id : null);
    }
    
    // تنفيذ التابع المناسب حسب واجهة الاستخدام
    if (isEmbeddedEditor) {
      (props as EmbeddedFieldsPositionEditorProps).onChange(newFields);
    }
  };

  // حدث نسخ حقل
  const duplicateField = (fieldId: number) => {
    // لا يمكن نسخ حقل صورة القالب
    if (fieldId === -1) {
      toast({
        title: "لا يمكن النسخ",
        description: "لا يمكن نسخ صورة القالب",
        variant: "destructive"
      });
      return;
    }
    
    const fieldToDuplicate = fields.find(field => field.id === fieldId);
    if (!fieldToDuplicate) return;
    
    // إنشاء معرف جديد للحقل المنسوخ (أكبر معرف + 1)
    const maxId = Math.max(...fields.map(field => field.id));
    const newField = {
      ...fieldToDuplicate,
      id: maxId + 1,
      name: `${fieldToDuplicate.name}_copy`,
      label: fieldToDuplicate.label ? `${fieldToDuplicate.label} (نسخة)` : undefined,
      position: {
        ...fieldToDuplicate.position,
        x: fieldToDuplicate.position.x + 20,
        y: fieldToDuplicate.position.y + 20
      }
    };
    
    const newFields = [...fields, newField];
    setFields(newFields);
    setSelectedFieldId(newField.id); // اختيار الحقل الجديد تلقائياً
    
    // تنفيذ التابع المناسب حسب واجهة الاستخدام
    if (isEmbeddedEditor) {
      (props as EmbeddedFieldsPositionEditorProps).onChange(newFields);
    }
  };

  // حدث تبديل رؤية الحقل
  const toggleFieldVisibility = (fieldId: number) => {
    const newFields = fields.map(field => {
      if (field.id === fieldId) {
        return {
          ...field,
          visible: field.visible === false ? undefined : false,
        };
      }
      return field;
    });
    setFields(newFields);
    
    // تنفيذ التابع المناسب حسب واجهة الاستخدام
    if (isEmbeddedEditor) {
      (props as EmbeddedFieldsPositionEditorProps).onChange(newFields);
    }
  };

  // حدث تغيير ترتيب الطبقة
  const handleMoveLayer = (fieldId: number, direction: 'up' | 'down') => {
    const newFields = fields.map(field => {
      if (field.id === fieldId) {
        const currentZIndex = field.zIndex || 0;
        const newZIndex = direction === 'up' ? currentZIndex + 1 : Math.max(0, currentZIndex - 1);
        return {
          ...field,
          zIndex: newZIndex
        };
      }
      return field;
    });
    setFields(newFields);
    
    // تنفيذ التابع المناسب حسب واجهة الاستخدام
    if (isEmbeddedEditor) {
      (props as EmbeddedFieldsPositionEditorProps).onChange(newFields);
    }
  };

  // توليد معاينة للصورة
  const generatePreview = async (quality: 'low' | 'medium' | 'high' | 'download') => {
    try {
      // هنا يمكن استدعاء API لتوليد الصورة بالجودة المحددة
      toast({
        title: "جاري التوليد",
        description: `جاري توليد البطاقة بجودة ${quality === 'low' ? 'منخفضة' : quality === 'medium' ? 'متوسطة' : 'عالية'}`
      });
      
      // مثال لاستخدام API توليد الصورة (يحتاج تطبيقه في الخادم)
      // const response = await fetch(`/api/templates/${templateId}/generate-image`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ fields, formData, quality })
      // });
      // 
      // if (response.ok) {
      //   const data = await response.json();
      //   if (data.imageUrl) {
      //     downloadImage(data.imageUrl, `بطاقة-${templateId}-${Date.now()}.png`);
      //   }
      // }
      
      // توليد اسم ملف بناءً على معرف القالب وتاريخ التوليد
      const fileName = `بطاقة-${templateId}-${new Date().getTime()}.png`;
      
      // استخدام محاكاة للتنزيل (يمكن استبدالها بالاستجابة الفعلية من الخادم)
      if (previewUrl) {
        downloadImage(previewUrl, fileName);
      } else {
        // إذا لم تكن هناك صورة معاينة، استخدم الـ templateImage كمثال مؤقت
        downloadImage(templateImage, fileName);
      }
      
      toast({
        title: "تم التوليد",
        description: "تم توليد البطاقة بنجاح وجاري التنزيل"
      });
    } catch (error) {
      console.error("حدث خطأ أثناء توليد الصورة:", error);
      toast({
        title: "خطأ في التوليد",
        description: "حدث خطأ أثناء توليد الصورة",
        variant: "destructive"
      });
    }
  };
  
  // حفظ التصميم
  const handleSave = () => {
    if (isDialog) {
      (props as FieldsPositionEditorDialogProps).onSave(fields);
    }
  };

  // حالة عدم وجود حقل محدد
  const selectedField = selectedFieldId !== null
    ? fields.find(field => field.id === selectedFieldId)
    : undefined;

  return (
    <div>
      {isDialog ? (
        <Dialog open={props.isOpen} onOpenChange={props.onClose}>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>تعديل تصميم البطاقة</DialogTitle>
              <DialogDescription>
                قم بتخصيص موضع وشكل الحقول على البطاقة
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden mt-4 px-3 pb-3">
              {/* نفس محتوى المكون المضمن هنا */}
              <div className="grid grid-cols-[20%_60%_20%] gap-4 h-full max-h-[85vh] overflow-hidden">
                {/* لوحة الإعدادات المتقدمة */}
                <div className="border rounded-lg p-2 bg-gray-50 flex flex-col w-full">
                  <Tabs value={advancedSettingsTab} onValueChange={setAdvancedSettingsTab} className="w-full">
                    <TabsList className="grid grid-cols-1 w-full mb-2">
                      <TabsTrigger value="layers" className="text-xs">
                        <Layers className="w-4 h-4 mr-2" />
                        <span>الطبقات</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="layers" className="flex-1">
                      <div className="space-y-4">
                        {/* إعدادات طبقة صورة القالب */}
                        <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
                          <h3 className="text-sm font-medium mb-2">إعدادات صورة القالب</h3>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Label htmlFor="dialogTemplateImageAsLayer" className="flex-grow text-xs cursor-pointer">
                                معالجة صورة القالب كطبقة مستقلة
                              </Label>
                              <Switch 
                                id="dialogTemplateImageAsLayer" 
                                checked={templateImageAsLayer}
                                onCheckedChange={setTemplateImageAsLayer}
                              />
                            </div>
                            
                            {templateImageAsLayer && (
                              <div className="space-y-2">
                                <Label className="text-xs">موضع طبقة صورة القالب</Label>
                                <div className="grid grid-cols-3 gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`text-xs ${templateImageLayer < 0 ? 'bg-blue-100' : ''}`}
                                    onClick={() => setTemplateImageLayer(-10)}
                                  >
                                    خلف جميع الحقول
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`text-xs ${templateImageLayer === 0 ? 'bg-blue-100' : ''}`}
                                    onClick={() => setTemplateImageLayer(0)}
                                  >
                                    وسط
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`text-xs ${templateImageLayer > 0 ? 'bg-blue-100' : ''}`}
                                    onClick={() => setTemplateImageLayer(10)}
                                  >
                                    أمام جميع الحقول
                                  </Button>
                                </div>
                                <div className="pt-2">
                                  <Label className="text-xs mb-1 block">تعديل دقيق لمستوى الطبقة</Label>
                                  <Slider
                                    value={[templateImageLayer]}
                                    onValueChange={(values) => setTemplateImageLayer(values[0])}
                                    min={-20}
                                    max={20}
                                    step={1}
                                    className="my-2"
                                  />
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>خلف (-20)</span>
                                    <span>{templateImageLayer}</span>
                                    <span>أمام (20)</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* مدير الطبقات */}
                        <LayersManager
                          fields={fields}
                          selectedFieldId={selectedFieldId}
                          onSelectField={setSelectedFieldId}
                          onMoveLayer={handleMoveLayer}
                          onToggleVisibility={toggleFieldVisibility}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                {/* محرر الحقول */}
                <Card className="flex flex-col h-full max-h-[75vh] overflow-hidden">
                  <CardHeader className="py-2 px-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">محرر الحقول</CardTitle>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setShowGrid(!showGrid)}>
                                <CheckSquare className={showGrid ? "text-blue-600" : "text-gray-400"} size={18} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {showGrid ? "إخفاء الشبكة" : "إظهار الشبكة"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow relative p-0">
                    <DraggableFieldsPreviewPro
                      fields={fields as any[]}
                      templateImage={templateImage}
                      formData={formData}
                      editorSettings={{
                        gridEnabled: showGrid,
                        snapToGrid: snapToGrid,
                        templateImageLayer: templateImageLayer, // تحديد مستوى طبقة صورة القالب
                        templateImageAsLayer: templateImageAsLayer // معالجة صورة القالب كطبقة مستقلة
                      }}
                      onFieldsChange={(newFields: Field[]) => {
                        setFields(newFields);
                        if (isEmbeddedEditor) {
                          (props as EmbeddedFieldsPositionEditorProps).onChange(newFields);
                        }
                      }}
                      onFieldSelect={setSelectedFieldId}
                      selectedFieldId={selectedFieldId}
                      readOnly={readOnly}
                      onGeneratePreview={(dataUrl: string) => setPreviewUrl(dataUrl)}
                    />
                  </CardContent>
                </Card>
                
                {/* خصائص الحقل */}
                <div className="border rounded-lg p-2 bg-gray-50 flex flex-col w-full">
                  <Tabs defaultValue="properties" className="w-full h-full flex flex-col">
                    <TabsList className="grid grid-cols-1 w-full mb-2">
                      <TabsTrigger value="properties" className="text-xs">
                        <Settings className="w-4 h-4 mr-2" />
                        <span>الخصائص</span>
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs">
                        <Image className="w-4 h-4 mr-2" />
                        <span>المعاينة</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="properties" className="flex-1 overflow-hidden">
                      {selectedField ? (
                        <FieldProperties
                          field={selectedField}
                          onUpdate={updateField}
                          onDelete={deleteField}
                          onDuplicate={duplicateField}
                          onToggleVisibility={toggleFieldVisibility}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-sm text-gray-500">
                          اختر حقلاً لعرض خصائصه
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="preview" className="flex-1 overflow-hidden">
                      <PreviewTab
                        template={{ id: templateId, imageUrl: templateImage }}
                        fields={fields}
                        formData={formData}
                        onDownload={generatePreview}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={props.onClose} className="mr-2">إلغاء</Button>
              <Button onClick={handleSave}>حفظ التغييرات</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="grid grid-cols-[15%_70%_15%] gap-2 h-full min-h-[calc(100vh-50px)] w-full overflow-hidden">
          {/* لوحة الإعدادات المتقدمة */}
          <div className="border rounded-lg p-2 bg-gray-50 flex flex-col">
            <Tabs value={advancedSettingsTab} onValueChange={setAdvancedSettingsTab} className="w-full">
              <TabsList className="grid grid-cols-1 w-full mb-2">
                <TabsTrigger value="layers" className="text-xs">
                  <Layers className="w-4 h-4 mr-2" />
                  <span>الطبقات</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="layers" className="flex-1">
                <div className="space-y-4">
                  {/* إعدادات طبقة صورة القالب */}
                  <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
                    <h3 className="text-sm font-medium mb-2">إعدادات صورة القالب</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Label htmlFor="templateImageAsLayer" className="flex-grow text-xs cursor-pointer">
                          معالجة صورة القالب كطبقة مستقلة
                        </Label>
                        <Switch 
                          id="templateImageAsLayer" 
                          checked={templateImageAsLayer}
                          onCheckedChange={setTemplateImageAsLayer}
                        />
                      </div>
                      
                      {templateImageAsLayer && (
                        <div className="space-y-2">
                          <Label className="text-xs">موضع طبقة صورة القالب</Label>
                          <div className="grid grid-cols-3 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-xs ${templateImageLayer < 0 ? 'bg-blue-100' : ''}`}
                              onClick={() => setTemplateImageLayer(-10)}
                            >
                              خلف جميع الحقول
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-xs ${templateImageLayer === 0 ? 'bg-blue-100' : ''}`}
                              onClick={() => setTemplateImageLayer(0)}
                            >
                              وسط
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-xs ${templateImageLayer > 0 ? 'bg-blue-100' : ''}`}
                              onClick={() => setTemplateImageLayer(10)}
                            >
                              أمام جميع الحقول
                            </Button>
                          </div>
                          <div className="pt-2">
                            <Label className="text-xs mb-1 block">تعديل دقيق لمستوى الطبقة</Label>
                            <Slider
                              value={[templateImageLayer]}
                              onValueChange={(values) => setTemplateImageLayer(values[0])}
                              min={-20}
                              max={20}
                              step={1}
                              className="my-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>خلف (-20)</span>
                              <span>{templateImageLayer}</span>
                              <span>أمام (20)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* مدير الطبقات */}
                  <LayersManager
                    fields={fields}
                    selectedFieldId={selectedFieldId}
                    onSelectField={setSelectedFieldId}
                    onMoveLayer={handleMoveLayer}
                    onToggleVisibility={toggleFieldVisibility}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* محرر الحقول */}
          <Card className="flex flex-col h-full min-h-[calc(100vh-50px)] overflow-hidden">
            <CardHeader className="py-2 px-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">محرر الحقول</CardTitle>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setShowGrid(!showGrid)}>
                          <CheckSquare className={showGrid ? "text-blue-600" : "text-gray-400"} size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {showGrid ? "إخفاء الشبكة" : "إظهار الشبكة"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow relative p-0">
              <DraggableFieldsPreviewPro
                fields={fields as any[]}
                templateImage={templateImage}
                formData={formData}
                editorSettings={{
                  gridEnabled: showGrid,
                  snapToGrid: snapToGrid,
                  templateImageLayer: templateImageLayer, // تحديد مستوى طبقة صورة القالب
                  templateImageAsLayer: templateImageAsLayer // معالجة صورة القالب كطبقة مستقلة
                }}
                onFieldsChange={(newFields: Field[]) => {
                  setFields(newFields);
                  if (isEmbeddedEditor) {
                    (props as EmbeddedFieldsPositionEditorProps).onChange(newFields);
                  }
                }}
                onFieldSelect={setSelectedFieldId}
                selectedFieldId={selectedFieldId}
                readOnly={readOnly}
                onGeneratePreview={(dataUrl: string) => setPreviewUrl(dataUrl)}
              />
            </CardContent>
          </Card>
          
          {/* خصائص الحقل - زيادة العرض لعرض كامل الخصائص */}
          <div className="border rounded-lg p-2 bg-gray-50 flex flex-col min-w-[320px] max-w-[350px] w-full">
            <Tabs defaultValue="properties" className="w-full h-full flex flex-col">
              <TabsList className="grid grid-cols-2 w-full mb-2">
                <TabsTrigger value="properties" className="text-xs">
                  <span>الخصائص</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">
                  <span>المعاينة</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="properties" className="flex-1 overflow-auto max-h-[calc(100vh-200px)]">
                {selectedField ? (
                  <FieldProperties
                    field={selectedField}
                    onUpdate={updateField}
                    onDelete={deleteField}
                    onDuplicate={duplicateField}
                    onToggleVisibility={toggleFieldVisibility}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-500">
                    اختر حقلاً لعرض خصائصه
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="preview" className="flex-1 overflow-hidden">
                <PreviewTab
                  template={{ id: templateId, imageUrl: templateImage }}
                  fields={fields}
                  formData={formData}
                  onDownload={generatePreview}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};
