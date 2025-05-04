/**
 * مكون تلميحات خصائص الحقول
 * الإصدار 1.0 - مايو 2025
 * 
 * هذا المكون يعرض معاينة مرئية لخصائص الحقول المختلفة
 * ويوفر تلميحات بصرية للمستخدم لفهم تأثير كل خاصية على الحقل
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/ui/color-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle, Eye, Layers, RotateCcw, RotateCw, Type, Palette, MoveHorizontal, MoveVertical } from 'lucide-react';

// الخصائص الأساسية لمكون تلميحات الحقول
interface FieldPropertyHintProps {
  propertyType: 'font' | 'layer' | 'position' | 'rotation' | 'shadow' | 'size';
  currentValue: any;
  onChange: (value: any) => void;
  hint?: string;
  showPreview?: boolean;
  previewText?: string;
}

/**
 * مكون عرض تلميحات خصائص الحقول بشكل مرئي
 */
export const FieldPropertyHint: React.FC<FieldPropertyHintProps> = ({
  propertyType,
  currentValue,
  onChange,
  hint,
  showPreview = true,
  previewText = 'نص معاينة'
}) => {
  // استخراج القيم الحالية
  const getPropertyValue = (key: string, defaultValue: any) => {
    if (typeof currentValue === 'object' && currentValue !== null) {
      return currentValue[key] !== undefined ? currentValue[key] : defaultValue;
    }
    return defaultValue;
  };

  // عناصر معاينة للخصائص المختلفة
  const renderPreview = () => {
    if (!showPreview) return null;

    switch (propertyType) {
      case 'font':
        const fontFamily = getPropertyValue('fontFamily', 'Arial');
        const fontSize = getPropertyValue('fontSize', 16);
        const fontWeight = getPropertyValue('fontWeight', 'normal');
        const color = getPropertyValue('color', '#000000');
        const align = getPropertyValue('align', 'center');
        
        return (
          <div className="border rounded-lg p-4 h-28 flex items-center justify-center bg-gray-50 mb-4 overflow-hidden">
            <div
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight,
                color,
                textAlign: align,
                maxWidth: '100%',
                wordBreak: 'break-word'
              }}
            >
              {previewText}
            </div>
          </div>
        );
        
      case 'layer':
        const zIndex = getPropertyValue('zIndex', 1);
        const layers = Array.from({ length: 5 }, (_, i) => i + 1);
        
        return (
          <div className="border rounded-lg p-4 h-28 relative bg-gray-50 mb-4 overflow-hidden">
            {layers.map((layer) => (
              <div
                key={layer}
                className={`absolute rounded-md flex items-center justify-center ${layer === zIndex ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'}`}
                style={{
                  width: '50px',
                  height: '50px',
                  left: `${30 + (layer - 1) * 15}%`,
                  top: `${30 + (layer - 1) * 5}%`,
                  zIndex: layer,
                  transition: 'all 0.3s ease',
                  transform: layer === zIndex ? 'scale(1.2)' : 'scale(1)',
                  opacity: Math.max(0.3, layer === zIndex ? 1 : 0.7)
                }}
              >
                {layer}
              </div>
            ))}
          </div>
        );
        
      case 'rotation':
        const rotation = getPropertyValue('rotation', 0);
        
        return (
          <div className="border rounded-lg p-4 h-28 flex items-center justify-center bg-gray-50 mb-4 overflow-hidden">
            <div
              className="bg-primary text-white p-4 rounded"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease'
              }}
            >
              {previewText}
            </div>
          </div>
        );
        
      case 'position':
        const x = getPropertyValue('x', 50);
        const y = getPropertyValue('y', 50);
        
        return (
          <div className="border rounded-lg p-4 h-28 relative bg-gray-50 mb-4 overflow-hidden">
            <div
              className="absolute bg-primary text-white p-2 rounded text-xs"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                transition: 'all 0.3s ease'
              }}
            >
              {`X: ${x}%, Y: ${y}%`}
            </div>
          </div>
        );
        
      case 'shadow':
        const shadow = getPropertyValue('textShadow', { enabled: false });
        const shadowEnabled = shadow.enabled || false;
        const shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
        const shadowBlur = shadow.blur || 4;
        const shadowOffsetX = shadow.offsetX || 2;
        const shadowOffsetY = shadow.offsetY || 2;
        
        return (
          <div className="border rounded-lg p-4 h-28 flex items-center justify-center bg-gray-50 mb-4 overflow-hidden">
            <div
              className="bg-white p-4 rounded text-black font-semibold"
              style={{
                textShadow: shadowEnabled 
                  ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`
                  : 'none',
                transition: 'text-shadow 0.3s ease'
              }}
            >
              {previewText}
            </div>
          </div>
        );
        
      case 'size':
        const width = getPropertyValue('width', 50);
        const height = getPropertyValue('height', 50);
        
        return (
          <div className="border rounded-lg p-4 h-28 flex items-center justify-center bg-gray-50 mb-4 overflow-hidden">
            <div
              className="bg-primary flex items-center justify-center text-white text-xs"
              style={{
                width: `${width}%`,
                height: `${height}%`,
                transition: 'all 0.3s ease'
              }}
            >
              {`${width}% × ${height}%`}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // عناصر التحكم للخصائص المختلفة
  const renderControls = () => {
    switch (propertyType) {
      case 'font':
        const fontFamily = getPropertyValue('fontFamily', 'Arial');
        const fontSize = getPropertyValue('fontSize', 16);
        const fontWeight = getPropertyValue('fontWeight', 'normal');
        const color = getPropertyValue('color', '#000000');
        const align = getPropertyValue('align', 'center');
        
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="fontFamily">نوع الخط</Label>
              <Select
                value={fontFamily}
                onValueChange={(value) => onChange({ ...currentValue, fontFamily: value })}
              >
                <SelectTrigger id="fontFamily">
                  <SelectValue placeholder="اختر نوع الخط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Cairo">Cairo</SelectItem>
                  <SelectItem value="Almarai">Almarai</SelectItem>
                  <SelectItem value="Tajawal">Tajawal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="fontSize">حجم الخط</Label>
                <span className="text-xs text-muted-foreground">{fontSize}px</span>
              </div>
              <Slider
                id="fontSize"
                min={8}
                max={72}
                step={1}
                value={[fontSize]}
                onValueChange={(value) => onChange({ ...currentValue, fontSize: value[0] })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="fontWeight">سمك الخط</Label>
              <Select
                value={fontWeight}
                onValueChange={(value) => onChange({ ...currentValue, fontWeight: value })}
              >
                <SelectTrigger id="fontWeight">
                  <SelectValue placeholder="اختر سمك الخط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">عادي</SelectItem>
                  <SelectItem value="bold">عريض</SelectItem>
                  <SelectItem value="300">رفيع (300)</SelectItem>
                  <SelectItem value="500">متوسط (500)</SelectItem>
                  <SelectItem value="700">عريض (700)</SelectItem>
                  <SelectItem value="900">عريض جداً (900)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="color">لون الخط</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => onChange({ ...currentValue, color: e.target.value })}
                  className="w-12 h-8 p-0"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => onChange({ ...currentValue, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="align">محاذاة النص</Label>
              <RadioGroup
                id="align"
                value={align}
                onValueChange={(value) => onChange({ ...currentValue, align: value })}
                className="flex justify-between"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="align-right" />
                  <Label htmlFor="align-right">يمين</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="center" id="align-center" />
                  <Label htmlFor="align-center">وسط</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="align-left" />
                  <Label htmlFor="align-left">يسار</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
        
      case 'layer':
        const zIndex = getPropertyValue('zIndex', 1);
        
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="zIndex">ترتيب الطبقة</Label>
                <span className="text-xs text-muted-foreground">{zIndex}</span>
              </div>
              <Slider
                id="zIndex"
                min={0}
                max={10}
                step={1}
                value={[zIndex]}
                onValueChange={(value) => onChange({ ...currentValue, zIndex: value[0] })}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>خلف (0)</span>
                <span>أمام (10)</span>
              </div>
            </div>
          </div>
        );
        
      case 'rotation':
        const rotation = getPropertyValue('rotation', 0);
        
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="rotation">زاوية الدوران</Label>
                <span className="text-xs text-muted-foreground">{rotation}°</span>
              </div>
              <Slider
                id="rotation"
                min={-180}
                max={180}
                step={5}
                value={[rotation]}
                onValueChange={(value) => onChange({ ...currentValue, rotation: value[0] })}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-180°</span>
                <span>0°</span>
                <span>180°</span>
              </div>
              <div className="flex justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...currentValue, rotation: (rotation - 45) % 360 })}
                  className="p-2 border rounded hover:bg-gray-100"
                  title="تدوير عكس عقارب الساعة"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...currentValue, rotation: 0 })}
                  className="p-2 border rounded hover:bg-gray-100"
                  title="إعادة الضبط"
                >
                  0°
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...currentValue, rotation: (rotation + 45) % 360 })}
                  className="p-2 border rounded hover:bg-gray-100"
                  title="تدوير مع عقارب الساعة"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'position':
        const x = getPropertyValue('x', 50);
        const y = getPropertyValue('y', 50);
        
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="x-position">الموضع الأفقي (X)</Label>
                <span className="text-xs text-muted-foreground">{x}%</span>
              </div>
              <Slider
                id="x-position"
                min={0}
                max={100}
                step={1}
                value={[x]}
                onValueChange={(value) => onChange({ ...currentValue, x: value[0] })}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="y-position">الموضع الرأسي (Y)</Label>
                <span className="text-xs text-muted-foreground">{y}%</span>
              </div>
              <Slider
                id="y-position"
                min={0}
                max={100}
                step={1}
                value={[y]}
                onValueChange={(value) => onChange({ ...currentValue, y: value[0] })}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                onClick={() => onChange({ ...currentValue, x: 50, y: 0 })}
                className="p-2 border rounded hover:bg-gray-100 text-xs"
                title="أعلى"
              >
                أعلى
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...currentValue, x: 50, y: 50 })}
                className="p-2 border rounded hover:bg-gray-100 text-xs"
                title="وسط"
              >
                وسط
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...currentValue, x: 50, y: 100 })}
                className="p-2 border rounded hover:bg-gray-100 text-xs"
                title="أسفل"
              >
                أسفل
              </button>
            </div>
          </div>
        );
        
      case 'shadow':
        const shadow = getPropertyValue('textShadow', { enabled: false });
        const shadowEnabled = shadow.enabled || false;
        const shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
        const shadowBlur = shadow.blur || 4;
        const shadowOffsetX = shadow.offsetX || 2;
        const shadowOffsetY = shadow.offsetY || 2;
        
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="shadow-enabled"
                checked={shadowEnabled}
                onCheckedChange={(checked) => onChange({ 
                  ...currentValue, 
                  textShadow: { 
                    ...currentValue.textShadow, 
                    enabled: checked 
                  } 
                })}
              />
              <Label htmlFor="shadow-enabled">تفعيل الظل</Label>
            </div>
            
            {shadowEnabled && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="shadow-color">لون الظل</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="shadow-color"
                      type="color"
                      value={shadowColor.startsWith('rgba') ? '#000000' : shadowColor}
                      onChange={(e) => onChange({ 
                        ...currentValue, 
                        textShadow: { 
                          ...currentValue.textShadow, 
                          color: e.target.value 
                        } 
                      })}
                      className="w-12 h-8 p-0"
                    />
                    <Input
                      type="text"
                      value={shadowColor}
                      onChange={(e) => onChange({ 
                        ...currentValue, 
                        textShadow: { 
                          ...currentValue.textShadow, 
                          color: e.target.value 
                        } 
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="shadow-blur">تمويه الظل</Label>
                    <span className="text-xs text-muted-foreground">{shadowBlur}px</span>
                  </div>
                  <Slider
                    id="shadow-blur"
                    min={0}
                    max={20}
                    step={1}
                    value={[shadowBlur]}
                    onValueChange={(value) => onChange({ 
                      ...currentValue, 
                      textShadow: { 
                        ...currentValue.textShadow, 
                        blur: value[0] 
                      } 
                    })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label htmlFor="shadow-offset-x">إزاحة X</Label>
                      <span className="text-xs text-muted-foreground">{shadowOffsetX}px</span>
                    </div>
                    <Slider
                      id="shadow-offset-x"
                      min={-20}
                      max={20}
                      step={1}
                      value={[shadowOffsetX]}
                      onValueChange={(value) => onChange({ 
                        ...currentValue, 
                        textShadow: { 
                          ...currentValue.textShadow, 
                          offsetX: value[0] 
                        } 
                      })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label htmlFor="shadow-offset-y">إزاحة Y</Label>
                      <span className="text-xs text-muted-foreground">{shadowOffsetY}px</span>
                    </div>
                    <Slider
                      id="shadow-offset-y"
                      min={-20}
                      max={20}
                      step={1}
                      value={[shadowOffsetY]}
                      onValueChange={(value) => onChange({ 
                        ...currentValue, 
                        textShadow: { 
                          ...currentValue.textShadow, 
                          offsetY: value[0] 
                        } 
                      })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );
        
      case 'size':
        const width = getPropertyValue('width', 50);
        const height = getPropertyValue('height', 50);
        
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="width">العرض</Label>
                <span className="text-xs text-muted-foreground">{width}%</span>
              </div>
              <Slider
                id="width"
                min={10}
                max={100}
                step={1}
                value={[width]}
                onValueChange={(value) => onChange({ ...currentValue, width: value[0] })}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="height">الارتفاع</Label>
                <span className="text-xs text-muted-foreground">{height}%</span>
              </div>
              <Slider
                id="height"
                min={10}
                max={100}
                step={1}
                value={[height]}
                onValueChange={(value) => onChange({ ...currentValue, height: value[0] })}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                onClick={() => onChange({ ...currentValue, width: 25, height: 25 })}
                className="p-2 border rounded hover:bg-gray-100 text-xs"
                title="صغير"
              >
                صغير
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...currentValue, width: 50, height: 50 })}
                className="p-2 border rounded hover:bg-gray-100 text-xs"
                title="متوسط"
              >
                متوسط
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...currentValue, width: 100, height: 100 })}
                className="p-2 border rounded hover:bg-gray-100 text-xs"
                title="كبير"
              >
                كبير
              </button>
            </div>
          </div>
        );
        
      default:
        return <div>نوع الخاصية غير معروف</div>;
    }
  };

  // عنوان اللمحة حسب نوع الخاصية
  const getHintTitle = () => {
    switch (propertyType) {
      case 'font':
        return 'خصائص الخط';
      case 'layer':
        return 'ترتيب الطبقات';
      case 'position':
        return 'موضع العنصر';
      case 'rotation':
        return 'تدوير العنصر';
      case 'shadow':
        return 'خصائص الظل';
      case 'size':
        return 'حجم العنصر';
      default:
        return 'خصائص متقدمة';
    }
  };

  // أيقونة اللمحة حسب نوع الخاصية
  const getHintIcon = () => {
    switch (propertyType) {
      case 'font':
        return <Type className="h-5 w-5" />;
      case 'layer':
        return <Layers className="h-5 w-5" />;
      case 'position':
        return <MoveHorizontal className="h-5 w-5" />;
      case 'rotation':
        return <RotateCw className="h-5 w-5" />;
      case 'shadow':
        return <Eye className="h-5 w-5" />;
      case 'size':
        return <MoveVertical className="h-5 w-5" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
    }
  };

  // المكون الرئيسي
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getHintIcon()}
            <CardTitle className="text-md">{getHintTitle()}</CardTitle>
          </div>
          
          {hint && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 rounded-full text-muted-foreground hover:bg-gray-100">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm">
                <p>{hint}</p>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <CardDescription>
          قم بضبط الخصائص لرؤية التأثير مباشرةً
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-2">
        {renderPreview()}
        {renderControls()}
      </CardContent>
    </Card>
  );
};

// مكون التلميحات مع مثال
export const FieldPropertyHintExample = () => {
  const [fontProps, setFontProps] = React.useState({
    fontFamily: 'Cairo',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a4a4a',
    align: 'center'
  });
  
  const [layerProps, setLayerProps] = React.useState({
    zIndex: 3
  });
  
  const [rotationProps, setRotationProps] = React.useState({
    rotation: 15
  });
  
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <FieldPropertyHint
        propertyType="font"
        currentValue={fontProps}
        onChange={setFontProps}
        hint="ضبط نوع الخط وحجمه ولونه وسمكه ومحاذاته"
        previewText="مثال على نص"
      />
      
      <FieldPropertyHint
        propertyType="layer"
        currentValue={layerProps}
        onChange={setLayerProps}
        hint="ضبط ترتيب الطبقة (القيمة الأكبر للعناصر التي تظهر في المقدمة)"
      />
      
      <FieldPropertyHint
        propertyType="rotation"
        currentValue={rotationProps}
        onChange={setRotationProps}
        hint="ضبط زاوية دوران العنصر"
        previewText="نص مدوَر"
      />
    </div>
  );
};