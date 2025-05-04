/**
 * مكون لوحة خصائص الحقل
 * يظهر ويتيح تعديل خصائص الحقل المحدد حاليًا
 */

import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Move, 
  Type as TextIcon, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  LayoutTemplate,
  EyeOff 
} from 'lucide-react';

// أنواع الحقول التي يمكن تعديلها
interface FieldType {
  id: number;
  name: string;
  label?: string;
  labelAr?: string;
  type: 'text' | 'image' | 'template' | string;
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: any;
  zIndex?: number;
  visible?: boolean;
  rotation?: number;
  locked?: boolean;
  defaultValue?: string;
  placeholder?: string;
  placeholderAr?: string;
  options?: { value: string; label: string }[];
}

interface FieldPropertiesPanelProps {
  field: FieldType | null;
  onFieldUpdate: (updatedField: FieldType) => void;
  availableFonts?: string[];
}

export const FieldPropertiesPanel: React.FC<FieldPropertiesPanelProps> = ({
  field,
  onFieldUpdate,
  availableFonts = ['Cairo', 'Tajawal', 'Arial', 'sans-serif']
}) => {
  const [localField, setLocalField] = useState<FieldType | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // تحديث الحقل المحلي عند تغيير الحقل من الخارج
  useEffect(() => {
    if (field) {
      setLocalField({...field});
    } else {
      setLocalField(null);
    }
  }, [field]);

  // معالجة التغييرات في خصائص الحقل
  const handleFieldUpdate = (
    property: string, 
    value: any, 
    nestedProperty?: string
  ) => {
    if (!localField) return;

    if (nestedProperty && property === 'style') {
      // تحديث خاصية منسدلة ضمن الستايل
      const updatedStyle = {
        ...localField.style,
        [nestedProperty]: value
      };
      
      const updatedField = {
        ...localField,
        style: updatedStyle
      };
      
      setLocalField(updatedField);
      onFieldUpdate(updatedField);
    } else {
      // تحديث خاصية مباشرة
      const updatedField = {
        ...localField,
        [property]: value
      };
      
      setLocalField(updatedField);
      onFieldUpdate(updatedField);
    }
  };

  // في حالة عدم وجود حقل محدد
  if (!localField) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>خصائص الحقل</CardTitle>
          <CardDescription>
            اختر حقلاً لعرض وتعديل خصائصه
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-12">
          <LayoutTemplate className="h-16 w-16 mx-auto mb-3 opacity-25" />
          <p>قم بالنقر على حقل في المحرر</p>
          <p className="text-sm mt-2">أو</p>
          <p className="mt-2">اختر حقلاً من قائمة الطبقات</p>
        </CardContent>
      </Card>
    );
  }

  if (localField.type === 'template') {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>صورة القالب</CardTitle>
          <CardDescription>
            خصائص صورة القالب الأساسية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="zIndex">ترتيب الطبقة</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="zIndex"
                  type="number"
                  value={localField.zIndex || 0}
                  onChange={(e) => handleFieldUpdate('zIndex', parseInt(e.target.value))}
                  min={-100}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">
                  {localField.zIndex === 0 ? 'وسط الطبقات' : 
                    localField.zIndex && localField.zIndex > 0 ? 'فوق' : 'تحت'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ضع قيمة موجبة لوضع صورة القالب فوق الحقول، أو قيمة سالبة لوضعها تحت الحقول
              </p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="visible" className="flex-1">إظهار صورة القالب</Label>
                <Switch
                  id="visible"
                  checked={localField.visible !== false}
                  onCheckedChange={(checked) => handleFieldUpdate('visible', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          {localField.type === 'text' ? 
            <TextIcon className="h-5 w-5 mr-2 text-primary" /> : 
            <ImageIcon className="h-5 w-5 mr-2 text-primary" />
          }
          <CardTitle>خصائص الحقل</CardTitle>
        </div>
        <CardDescription>
          {localField.label || localField.name}
          {!localField.visible && (
            <span className="inline-flex items-center ml-2 text-xs text-amber-500">
              <EyeOff className="h-3 w-3 mr-1" /> مخفي
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mb-2">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="style">المظهر</TabsTrigger>
          <TabsTrigger value="position">الموقع</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-400px)] min-h-[280px]">
            <div className="px-6 pb-6">
              <TabsContent value="general" className="m-0 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">الاسم التقني (البرمجي)</Label>
                  <Input
                    id="name"
                    value={localField.name}
                    onChange={(e) => handleFieldUpdate('name', e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="label">التسمية (بالعربية)</Label>
                  <Input
                    id="label"
                    value={localField.label || ''}
                    onChange={(e) => handleFieldUpdate('label', e.target.value)}
                    dir="rtl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="defaultValue">القيمة الافتراضية</Label>
                  <Input
                    id="defaultValue"
                    value={localField.defaultValue || ''}
                    onChange={(e) => handleFieldUpdate('defaultValue', e.target.value)}
                    dir="auto"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="visible" className="flex-1">مرئي</Label>
                    <Switch
                      id="visible"
                      checked={localField.visible !== false}
                      onCheckedChange={(checked) => handleFieldUpdate('visible', checked)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="zIndex">ترتيب الطبقة</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="zIndex"
                      type="number"
                      value={localField.zIndex || 0}
                      onChange={(e) => handleFieldUpdate('zIndex', parseInt(e.target.value))}
                      min={-100}
                      max={100}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="style" className="m-0 space-y-4">
                {localField.type === 'text' && (
                  <>
                    <Accordion type="single" collapsible defaultValue="font">
                      <AccordionItem value="font">
                        <AccordionTrigger>الخط والنص</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="grid gap-2">
                            <Label htmlFor="fontFamily">نوع الخط</Label>
                            <Select
                              value={localField.style?.fontFamily || 'Cairo'}
                              onValueChange={(value) => handleFieldUpdate('style', value, 'fontFamily')}
                            >
                              <SelectTrigger id="fontFamily">
                                <SelectValue placeholder="اختر نوع الخط" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFonts.map((font) => (
                                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="fontSize">حجم الخط ({localField.style?.fontSize || 24}px)</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                id="fontSize"
                                min={8}
                                max={72}
                                step={1}
                                value={[localField.style?.fontSize || 24]}
                                onValueChange={([value]) => handleFieldUpdate('style', value, 'fontSize')}
                              />
                              <Input
                                type="number"
                                value={localField.style?.fontSize || 24}
                                onChange={(e) => handleFieldUpdate('style', parseInt(e.target.value), 'fontSize')}
                                className="w-16"
                                min={8}
                                max={72}
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="fontWeight">وزن الخط</Label>
                            <Select
                              value={localField.style?.fontWeight || 'normal'}
                              onValueChange={(value) => handleFieldUpdate('style', value, 'fontWeight')}
                            >
                              <SelectTrigger id="fontWeight">
                                <SelectValue placeholder="اختر وزن الخط" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">عادي</SelectItem>
                                <SelectItem value="bold">غامق</SelectItem>
                                <SelectItem value="lighter">خفيف</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="color">لون النص</Label>
                            <ColorPickerSimple
                              color={localField.style?.color || '#000000'}
                              onChange={(color) => handleFieldUpdate('style', color, 'color')}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="align">محاذاة النص</Label>
                            <div className="flex items-center rounded-md border p-1">
                              <Button
                                type="button"
                                variant={localField.style?.align === 'right' ? 'default' : 'ghost'}
                                size="sm"
                                className="flex-1"
                                onClick={() => handleFieldUpdate('style', 'right', 'align')}
                              >
                                <AlignRight className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant={localField.style?.align === 'center' ? 'default' : 'ghost'}
                                size="sm"
                                className="flex-1"
                                onClick={() => handleFieldUpdate('style', 'center', 'align')}
                              >
                                <AlignCenter className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant={localField.style?.align === 'left' ? 'default' : 'ghost'}
                                size="sm"
                                className="flex-1"
                                onClick={() => handleFieldUpdate('style', 'left', 'align')}
                              >
                                <AlignLeft className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="maxWidth">الحد الأقصى للعرض ({localField.style?.maxWidth || 300}px)</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                id="maxWidth"
                                min={50}
                                max={800}
                                step={10}
                                value={[localField.style?.maxWidth || 300]}
                                onValueChange={([value]) => handleFieldUpdate('style', value, 'maxWidth')}
                              />
                              <Input
                                type="number"
                                value={localField.style?.maxWidth || 300}
                                onChange={(e) => handleFieldUpdate('style', parseInt(e.target.value), 'maxWidth')}
                                className="w-16"
                                min={50}
                                max={800}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="textShadow">
                        <AccordionTrigger>ظل النص</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="textShadowEnabled" className="flex-1">تفعيل ظل النص</Label>
                              <Switch
                                id="textShadowEnabled"
                                checked={localField.style?.textShadow?.enabled === true}
                                onCheckedChange={(checked) => {
                                  const textShadow = {
                                    ...(localField.style?.textShadow || {}),
                                    enabled: checked,
                                    color: localField.style?.textShadow?.color || 'rgba(0,0,0,0.5)',
                                    offsetX: localField.style?.textShadow?.offsetX || 2,
                                    offsetY: localField.style?.textShadow?.offsetY || 2,
                                    blur: localField.style?.textShadow?.blur || 4
                                  };
                                  handleFieldUpdate('style', textShadow, 'textShadow');
                                }}
                              />
                            </div>
                          </div>

                          {localField.style?.textShadow?.enabled && (
                            <>
                              <div className="grid gap-2">
                                <Label htmlFor="textShadowColor">لون الظل</Label>
                                <ColorPickerSimple
                                  color={localField.style?.textShadow?.color || 'rgba(0,0,0,0.5)'}
                                  onChange={(color) => {
                                    const textShadow = {
                                      ...(localField.style?.textShadow || {}),
                                      color
                                    };
                                    handleFieldUpdate('style', textShadow, 'textShadow');
                                  }}
                                  showAlpha
                                />
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="textShadowBlur">تمويه الظل ({localField.style?.textShadow?.blur || 4}px)</Label>
                                <div className="flex items-center gap-2">
                                  <Slider
                                    id="textShadowBlur"
                                    min={0}
                                    max={20}
                                    step={1}
                                    value={[localField.style?.textShadow?.blur || 4]}
                                    onValueChange={([value]) => {
                                      const textShadow = {
                                        ...(localField.style?.textShadow || {}),
                                        blur: value
                                      };
                                      handleFieldUpdate('style', textShadow, 'textShadow');
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    value={localField.style?.textShadow?.blur || 4}
                                    onChange={(e) => {
                                      const textShadow = {
                                        ...(localField.style?.textShadow || {}),
                                        blur: parseInt(e.target.value)
                                      };
                                      handleFieldUpdate('style', textShadow, 'textShadow');
                                    }}
                                    className="w-16"
                                    min={0}
                                    max={20}
                                  />
                                </div>
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="textShadowOffset">إزاحة الظل (بكسل)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor="textShadowOffsetX" className="text-xs">أفقي</Label>
                                    <Input
                                      id="textShadowOffsetX"
                                      type="number"
                                      value={localField.style?.textShadow?.offsetX || 2}
                                      onChange={(e) => {
                                        const textShadow = {
                                          ...(localField.style?.textShadow || {}),
                                          offsetX: parseInt(e.target.value)
                                        };
                                        handleFieldUpdate('style', textShadow, 'textShadow');
                                      }}
                                      min={-20}
                                      max={20}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="textShadowOffsetY" className="text-xs">عمودي</Label>
                                    <Input
                                      id="textShadowOffsetY"
                                      type="number"
                                      value={localField.style?.textShadow?.offsetY || 2}
                                      onChange={(e) => {
                                        const textShadow = {
                                          ...(localField.style?.textShadow || {}),
                                          offsetY: parseInt(e.target.value)
                                        };
                                        handleFieldUpdate('style', textShadow, 'textShadow');
                                      }}
                                      min={-20}
                                      max={20}
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </>
                )}

                {localField.type === 'image' && (
                  <>
                    <Accordion type="single" collapsible defaultValue="image">
                      <AccordionItem value="image">
                        <AccordionTrigger>خصائص الصورة</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="grid gap-2">
                            <Label htmlFor="imageMaxWidth">الحد الأقصى للعرض ({localField.style?.imageMaxWidth || 200}px)</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                id="imageMaxWidth"
                                min={50}
                                max={800}
                                step={10}
                                value={[localField.style?.imageMaxWidth || 200]}
                                onValueChange={([value]) => handleFieldUpdate('style', value, 'imageMaxWidth')}
                              />
                              <Input
                                type="number"
                                value={localField.style?.imageMaxWidth || 200}
                                onChange={(e) => handleFieldUpdate('style', parseInt(e.target.value), 'imageMaxWidth')}
                                className="w-16"
                                min={50}
                                max={800}
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="imageMaxHeight">الحد الأقصى للارتفاع ({localField.style?.imageMaxHeight || 200}px)</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                id="imageMaxHeight"
                                min={50}
                                max={800}
                                step={10}
                                value={[localField.style?.imageMaxHeight || 200]}
                                onValueChange={([value]) => handleFieldUpdate('style', value, 'imageMaxHeight')}
                              />
                              <Input
                                type="number"
                                value={localField.style?.imageMaxHeight || 200}
                                onChange={(e) => handleFieldUpdate('style', parseInt(e.target.value), 'imageMaxHeight')}
                                className="w-16"
                                min={50}
                                max={800}
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="imageRounded" className="flex-1">حواف دائرية</Label>
                              <Switch
                                id="imageRounded"
                                checked={localField.style?.imageRounded === true}
                                onCheckedChange={(checked) => handleFieldUpdate('style', checked, 'imageRounded')}
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="imageBorder" className="flex-1">إظهار الإطار</Label>
                              <Switch
                                id="imageBorder"
                                checked={localField.style?.imageBorder === true}
                                onCheckedChange={(checked) => handleFieldUpdate('style', checked, 'imageBorder')}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="imageShadow">
                        <AccordionTrigger>ظل الصورة</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="imageShadowEnabled" className="flex-1">تفعيل ظل الصورة</Label>
                              <Switch
                                id="imageShadowEnabled"
                                checked={localField.style?.imageShadow?.enabled === true}
                                onCheckedChange={(checked) => {
                                  const imageShadow = {
                                    ...(localField.style?.imageShadow || {}),
                                    enabled: checked,
                                    color: localField.style?.imageShadow?.color || 'rgba(0,0,0,0.3)',
                                    offsetX: localField.style?.imageShadow?.offsetX || 4,
                                    offsetY: localField.style?.imageShadow?.offsetY || 4,
                                    blur: localField.style?.imageShadow?.blur || 8
                                  };
                                  handleFieldUpdate('style', imageShadow, 'imageShadow');
                                }}
                              />
                            </div>
                          </div>

                          {localField.style?.imageShadow?.enabled && (
                            <>
                              <div className="grid gap-2">
                                <Label htmlFor="imageShadowColor">لون الظل</Label>
                                <ColorPickerSimple
                                  color={localField.style?.imageShadow?.color || 'rgba(0,0,0,0.3)'}
                                  onChange={(color) => {
                                    const imageShadow = {
                                      ...(localField.style?.imageShadow || {}),
                                      color
                                    };
                                    handleFieldUpdate('style', imageShadow, 'imageShadow');
                                  }}
                                  showAlpha
                                />
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="imageShadowBlur">تمويه الظل ({localField.style?.imageShadow?.blur || 8}px)</Label>
                                <div className="flex items-center gap-2">
                                  <Slider
                                    id="imageShadowBlur"
                                    min={0}
                                    max={30}
                                    step={1}
                                    value={[localField.style?.imageShadow?.blur || 8]}
                                    onValueChange={([value]) => {
                                      const imageShadow = {
                                        ...(localField.style?.imageShadow || {}),
                                        blur: value
                                      };
                                      handleFieldUpdate('style', imageShadow, 'imageShadow');
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    value={localField.style?.imageShadow?.blur || 8}
                                    onChange={(e) => {
                                      const imageShadow = {
                                        ...(localField.style?.imageShadow || {}),
                                        blur: parseInt(e.target.value)
                                      };
                                      handleFieldUpdate('style', imageShadow, 'imageShadow');
                                    }}
                                    className="w-16"
                                    min={0}
                                    max={30}
                                  />
                                </div>
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="imageShadowOffset">إزاحة الظل (بكسل)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor="imageShadowOffsetX" className="text-xs">أفقي</Label>
                                    <Input
                                      id="imageShadowOffsetX"
                                      type="number"
                                      value={localField.style?.imageShadow?.offsetX || 4}
                                      onChange={(e) => {
                                        const imageShadow = {
                                          ...(localField.style?.imageShadow || {}),
                                          offsetX: parseInt(e.target.value)
                                        };
                                        handleFieldUpdate('style', imageShadow, 'imageShadow');
                                      }}
                                      min={-20}
                                      max={20}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="imageShadowOffsetY" className="text-xs">عمودي</Label>
                                    <Input
                                      id="imageShadowOffsetY"
                                      type="number"
                                      value={localField.style?.imageShadow?.offsetY || 4}
                                      onChange={(e) => {
                                        const imageShadow = {
                                          ...(localField.style?.imageShadow || {}),
                                          offsetY: parseInt(e.target.value)
                                        };
                                        handleFieldUpdate('style', imageShadow, 'imageShadow');
                                      }}
                                      min={-20}
                                      max={20}
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </>
                )}
              </TabsContent>

              <TabsContent value="position" className="m-0 space-y-4">
                <div className="grid gap-2">
                  <Label>الموضع (بكسل)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="positionX" className="text-xs">X (أفقي)</Label>
                      <Input
                        id="positionX"
                        type="number"
                        value={Math.round(localField.position?.x || 0)}
                        onChange={(e) => {
                          const position = {
                            ...localField.position,
                            x: parseInt(e.target.value)
                          };
                          handleFieldUpdate('position', position);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="positionY" className="text-xs">Y (عمودي)</Label>
                      <Input
                        id="positionY"
                        type="number"
                        value={Math.round(localField.position?.y || 0)}
                        onChange={(e) => {
                          const position = {
                            ...localField.position,
                            y: parseInt(e.target.value)
                          };
                          handleFieldUpdate('position', position);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="rotation">الدوران ({localField.rotation || 0}°)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="rotation"
                      min={-180}
                      max={180}
                      step={1}
                      value={[localField.rotation || 0]}
                      onValueChange={([value]) => handleFieldUpdate('rotation', value)}
                    />
                    <Input
                      type="number"
                      value={localField.rotation || 0}
                      onChange={(e) => handleFieldUpdate('rotation', parseInt(e.target.value))}
                      className="w-16"
                      min={-180}
                      max={180}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="snapToGrid" className="flex-1">الالتصاق بالشبكة</Label>
                    <Switch
                      id="snapToGrid"
                      checked={localField.position?.snapToGrid !== false}
                      onCheckedChange={(checked) => {
                        const position = {
                          ...localField.position,
                          snapToGrid: checked
                        };
                        handleFieldUpdate('position', position);
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="locked" className="flex-1">قفل الموضع</Label>
                    <Switch
                      id="locked"
                      checked={localField.locked === true}
                      onCheckedChange={(checked) => handleFieldUpdate('locked', checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    عند تفعيل هذا الخيار، لن يكون من الممكن سحب الحقل وتغيير موضعه في المحرر
                  </p>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </Card>
  );
};

// مكون منتقي الألوان البسيط
interface ColorPickerSimpleProps {
  color: string;
  onChange: (color: string) => void;
  showAlpha?: boolean;
}

const ColorPickerSimple: React.FC<ColorPickerSimpleProps> = ({ color, onChange, showAlpha = false }) => {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-10 h-10 rounded-md border cursor-pointer flex-shrink-0"
        style={{ backgroundColor: color }}
        onClick={() => {
          // فتح منتقي الألوان الافتراضي للمتصفح
          const input = document.createElement('input');
          input.type = 'color';
          input.value = color.startsWith('rgba') ? hexFromRGBA(color) : color;
          input.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            onChange(target.value);
          });
          input.click();
        }}
      />
      <Input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000 أو rgb(0,0,0)"
      />
    </div>
  );
};

// تحويل RGBA إلى HEX
function hexFromRGBA(rgba: string): string {
  // تحليل rgba(r,g,b,a)
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
  if (!match) return '#000000';
  
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  
  // تحويل إلى hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}