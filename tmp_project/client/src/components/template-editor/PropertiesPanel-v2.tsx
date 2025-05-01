import { useState, useEffect, useMemo } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { debounce, hexToRgba, rgbaToHex } from '@/lib/utils';
import { TabPanel, TabContent } from '../ui/tabs-advanced';
import { 
  AlignLeft, AlignCenter, AlignRight, 
  Bold, Italic, Underline, 
  Type, Layout, Sliders, Grid, Palette
} from 'lucide-react';
import { fabric } from '@/lib/fabric-utilities';
import { Slider } from '../ui/slider';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';

interface PropertiesPanelProps {
  selectedObject: fabric.Object | null;
  canvas: fabric.Canvas | null;
  className?: string;
}

/**
 * مكون لوحة الخصائص المتقدمة
 */
export function PropertiesPanel({ selectedObject, canvas, className }: PropertiesPanelProps) {
  // مجموعة state للخصائص العامة
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 100, height: 100 });
  const [angle, setAngle] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [selectionLocked, setSelectionLocked] = useState(false);
  
  // مجموعة state لخصائص النص
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('');
  const [textAlign, setTextAlign] = useState('right');
  const [lineHeight, setLineHeight] = useState(1.2);
  
  // مجموعة state للألوان والنمط
  const [fill, setFill] = useState('#000000');
  const [stroke, setStroke] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('');
  const [borderRadius, setBorderRadius] = useState(0);
  
  // مصفوفة الخطوط المتاحة
  const availableFonts = useMemo(() => [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Trebuchet MS',
    'Verdana',
    'Tahoma',
    'Cairo',
    'Tajawal',
    'Amiri',
    'Changa',
    'El Messiri'
  ], []);
  
  // تحديث حالة المكون عند تغيير العنصر المحدد
  useEffect(() => {
    if (!selectedObject) {
      resetAllProperties();
      return;
    }
    
    // تحديث الموقع والحجم
    setPosition({
      x: Math.round(selectedObject.left || 0),
      y: Math.round(selectedObject.top || 0)
    });
    
    // تحديث الزاوية والشفافية
    setAngle(Math.round(selectedObject.angle || 0));
    setOpacity(Math.round((selectedObject.opacity || 1) * 100));
    setSelectionLocked(selectedObject.selectable === false);
    
    // متغيرات للتعامل مع الأشكال المختلفة
    const isText = selectedObject.type === 'text' || selectedObject.type === 'textbox';
    const isRect = selectedObject.type === 'rect';
    const isShape = isRect || selectedObject.type === 'circle' || selectedObject.type === 'path';
    
    // تحديث الحجم بناءً على نوع العنصر
    if (isText) {
      const textObj = selectedObject as fabric.Text;
      setSize({
        width: Math.round(textObj.width || 100),
        height: Math.round(textObj.height || 50)
      });
    } else if (isRect) {
      const rectObj = selectedObject as fabric.Rect;
      setSize({
        width: Math.round(rectObj.width || 100),
        height: Math.round(rectObj.height || 50)
      });
      setBorderRadius(rectObj.rx || 0);
    } else {
      const width = selectedObject.width || 100;
      const height = selectedObject.height || 50;
      setSize({
        width: Math.round(width * (selectedObject.scaleX || 1)),
        height: Math.round(height * (selectedObject.scaleY || 1))
      });
    }
    
    // تحديث خصائص النص للعناصر النصية
    if (isText) {
      const textObj = selectedObject as fabric.Text;
      setText(textObj.text || '');
      setFontSize(textObj.fontSize || 20);
      setFontFamily(textObj.fontFamily || 'Arial');
      setFontWeight(textObj.fontWeight?.toString() || 'normal');
      setFontStyle(textObj.fontStyle || 'normal');
      setTextDecoration(textObj.underline ? 'underline' : '');
      setTextAlign(textObj.textAlign || 'right');
      setLineHeight(textObj.lineHeight || 1.2);
    }
    
    // تحديث خصائص الألوان والنمط
    setFill(selectedObject.fill?.toString() || '#000000');
    setStroke(selectedObject.stroke?.toString() || '#000000');
    setStrokeWidth(selectedObject.strokeWidth || 0);
    
    if (isText) {
      const textObj = selectedObject as fabric.Text;
      setBackgroundColor(textObj.backgroundColor?.toString() || '');
    }
    
  }, [selectedObject]);
  
  // إعادة تعيين جميع الخصائص
  const resetAllProperties = () => {
    // خصائص عامة
    setPosition({ x: 0, y: 0 });
    setSize({ width: 100, height: 100 });
    setAngle(0);
    setOpacity(100);
    setSelectionLocked(false);
    
    // خصائص النص
    setText('');
    setFontSize(20);
    setFontFamily('Arial');
    setFontWeight('normal');
    setFontStyle('normal');
    setTextDecoration('');
    setTextAlign('right');
    setLineHeight(1.2);
    
    // ألوان ونمط
    setFill('#000000');
    setStroke('#000000');
    setStrokeWidth(0);
    setBackgroundColor('');
    setBorderRadius(0);
  };
  
  // وظائف التحديث لخصائص العنصر
  const updateText = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ text: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateFontSize = debounce((value: number) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ fontSize: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateFontFamily = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ fontFamily: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateFontWeight = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ fontWeight: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateFontStyle = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ fontStyle: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateTextDecoration = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ underline: value === 'underline' });
      canvas.renderAll();
    }
  }, 300);
  
  const updateTextAlign = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ textAlign: value });
      canvas.renderAll();
    }
  }, 300);

  const updateLineHeight = debounce((value: number) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ lineHeight: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateFill = debounce((value: string) => {
    if (selectedObject && canvas) {
      selectedObject.set({ fill: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateStroke = debounce((value: string) => {
    if (selectedObject && canvas) {
      selectedObject.set({ stroke: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateStrokeWidth = debounce((value: number) => {
    if (selectedObject && canvas) {
      selectedObject.set({ strokeWidth: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateBackgroundColor = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ backgroundColor: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateOpacity = debounce((value: number) => {
    if (selectedObject && canvas) {
      selectedObject.set({ opacity: value / 100 });
      canvas.renderAll();
    }
  }, 300);
  
  const updatePosition = debounce((x: number, y: number) => {
    if (selectedObject && canvas) {
      selectedObject.set({
        left: x,
        top: y
      });
      canvas.renderAll();
    }
  }, 300);
  
  const updateSize = debounce((width: number, height: number) => {
    if (selectedObject && canvas) {
      if (selectedObject.type === 'textbox') {
        (selectedObject as fabric.Textbox).set({
          width: width
        });
      } else if (selectedObject.type === 'rect') {
        (selectedObject as fabric.Rect).set({
          width: width,
          height: height
        });
      } else {
        const originalWidth = selectedObject.width || 100;
        const originalHeight = selectedObject.height || 50;
        
        selectedObject.set({
          scaleX: width / originalWidth,
          scaleY: height / originalHeight
        });
      }
      canvas.renderAll();
    }
  }, 300);
  
  const updateAngle = debounce((value: number) => {
    if (selectedObject && canvas) {
      selectedObject.set({ angle: value });
      canvas.renderAll();
    }
  }, 300);
  
  const updateBorderRadius = debounce((value: number) => {
    if (selectedObject && selectedObject.type === 'rect' && canvas) {
      (selectedObject as fabric.Rect).set({ 
        rx: value,
        ry: value
      });
      canvas.renderAll();
    }
  }, 300);
  
  const updateSelectionLocked = (locked: boolean) => {
    if (selectedObject && canvas) {
      selectedObject.set({ 
        selectable: !locked,
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked
      });
      setSelectionLocked(locked);
      canvas.renderAll();
    }
  };
  
  // مكون اختيار اللون
  const ColorPicker = ({ value, onChange, label }: { value: string, onChange: (color: string) => void, label: string }) => (
    <div className="flex items-center mb-2">
      <span className="text-xs w-20">{label}:</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-8 h-8 p-0 mr-2"
            style={{ background: value }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="grid grid-cols-5 gap-2">
            {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
              '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#A020F0',
              '#2E8B57', '#B22222', '#4682B4', '#708090', '#008080',
              '#D2B48C', '#CD853F', '#DDA0DD', '#90EE90', '#F0E68C'].map(color => (
              <Button 
                key={color}
                style={{ backgroundColor: color }}
                className="w-8 h-8 p-0"
                onClick={() => onChange(color)}
              />
            ))}
          </div>
          <Separator className="my-2" />
          <div className="flex items-center mt-2">
            <Input 
              type="text" 
              value={value} 
              onChange={(e) => onChange(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </PopoverContent>
      </Popover>
      <Input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs flex-1"
      />
    </div>
  );
  
  // تعريف التابات
  const tabs = [
    { id: 'general', label: 'عام', icon: <Layout className="h-4 w-4" /> },
    { id: 'text', label: 'نص', icon: <Type className="h-4 w-4" /> },
    { id: 'style', label: 'نمط', icon: <Palette className="h-4 w-4" /> },
    { id: 'grid', label: 'شبكة', icon: <Grid className="h-4 w-4" /> },
  ];
  
  // رسالة عندما لا يكون هناك عنصر محدد
  if (!selectedObject) {
    return (
      <div className={`h-full flex items-center justify-center p-4 text-slate-500 text-center ${className || ''}`}>
        <div>
          <p>اختر عنصراً من اللوحة لتعديل خصائصه</p>
          <p className="text-xs mt-2">أو اسحب حقلاً من القائمة</p>
        </div>
      </div>
    );
  }
  
  // محتوى تاب الخصائص العامة
  const generalTab = (
    <TabContent id="general">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2 border-b pb-1">الموقع</h4>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label className="text-xs block mb-1">س</Label>
              <Input
                type="number"
                value={position.x}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPosition(prev => ({ ...prev, x: val }));
                  updatePosition(val, position.y);
                }}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs block mb-1">ص</Label>
              <Input
                type="number"
                value={position.y}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPosition(prev => ({ ...prev, y: val }));
                  updatePosition(position.x, val);
                }}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2 border-b pb-1">الحجم</h4>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label className="text-xs block mb-1">عرض</Label>
              <Input
                type="number"
                value={size.width}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSize(prev => ({ ...prev, width: val }));
                  updateSize(val, size.height);
                }}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs block mb-1">ارتفاع</Label>
              <Input
                type="number"
                value={size.height}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSize(prev => ({ ...prev, height: val }));
                  updateSize(size.width, val);
                }}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2 border-b pb-1">دوران وشفافية</h4>
          
          <div className="mb-4">
            <Label className="text-xs flex justify-between mb-1">
              <span>دوران</span>
              <span>{angle}°</span>
            </Label>
            <Slider
              value={[angle]}
              min={0}
              max={360}
              step={1}
              onValueChange={(values) => {
                const val = values[0];
                setAngle(val);
                updateAngle(val);
              }}
              className="py-1"
            />
          </div>
          
          <div>
            <Label className="text-xs flex justify-between mb-1">
              <span>شفافية</span>
              <span>{opacity}%</span>
            </Label>
            <Slider
              value={[opacity]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values) => {
                const val = values[0];
                setOpacity(val);
                updateOpacity(val);
              }}
              className="py-1"
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2 border-b pb-1">خيارات متقدمة</h4>
          
          <div className="flex items-center">
            <Label className="text-xs mb-0 mr-2">قفل العنصر:</Label>
            <Button
              variant={selectionLocked ? "default" : "outline"}
              size="sm"
              onClick={() => updateSelectionLocked(!selectionLocked)}
              className="h-8 text-xs"
            >
              {selectionLocked ? 'مقفل' : 'غير مقفل'}
            </Button>
          </div>
        </div>
      </div>
    </TabContent>
  );
  
  // محتوى تاب خصائص النص
  const textTab = (
    <TabContent id="text">
      {(selectedObject.type === 'text' || selectedObject.type === 'textbox') ? (
        <div className="space-y-4">
          <div>
            <Label className="text-xs block mb-1">النص</Label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                updateText(e.target.value);
              }}
              rows={3}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2 border-b pb-1">الخط</h4>
            
            <div className="mb-3">
              <Label className="text-xs block mb-1">نوع الخط</Label>
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  updateFontFamily(e.target.value);
                }}
                className="w-full border rounded px-2 py-1 text-xs bg-white"
              >
                {availableFonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-3">
              <Label className="text-xs flex justify-between mb-1">
                <span>حجم الخط</span>
                <span>{fontSize}px</span>
              </Label>
              <Slider
                value={[fontSize]}
                min={8}
                max={72}
                step={1}
                onValueChange={(values) => {
                  const val = values[0];
                  setFontSize(val);
                  updateFontSize(val);
                }}
                className="py-1"
              />
            </div>
            
            <div className="mb-3">
              <Label className="text-xs flex justify-between mb-1">
                <span>تباعد الأسطر</span>
                <span>{lineHeight.toFixed(1)}</span>
              </Label>
              <Slider
                value={[lineHeight * 10]}
                min={10}
                max={30}
                step={1}
                onValueChange={(values) => {
                  const val = values[0] / 10;
                  setLineHeight(val);
                  updateLineHeight(val);
                }}
                className="py-1"
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2 border-b pb-1">نمط النص</h4>
            
            <div className="mb-3">
              <Label className="text-xs block mb-1">محاذاة</Label>
              <ToggleGroup type="single" value={textAlign} onValueChange={(value) => {
                if (value) {
                  setTextAlign(value);
                  updateTextAlign(value);
                }
              }}>
                <ToggleGroupItem value="right" aria-label="يمين">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="وسط">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="left" aria-label="يسار">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <div className="mb-3">
              <Label className="text-xs block mb-1">تنسيق</Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant={fontWeight === 'bold' ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newValue = fontWeight === 'bold' ? 'normal' : 'bold';
                    setFontWeight(newValue);
                    updateFontWeight(newValue);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                
                <Button
                  variant={fontStyle === 'italic' ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newValue = fontStyle === 'italic' ? 'normal' : 'italic';
                    setFontStyle(newValue);
                    updateFontStyle(newValue);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                
                <Button
                  variant={textDecoration === 'underline' ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newValue = textDecoration === 'underline' ? '' : 'underline';
                    setTextDecoration(newValue);
                    updateTextDecoration(newValue);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-slate-500">
          <p>هذا العنصر ليس نصاً</p>
          <p className="text-xs mt-2">اختر عنصراً نصياً لتعديل خصائص النص</p>
        </div>
      )}
    </TabContent>
  );
  
  // محتوى تاب خصائص النمط
  const styleTab = (
    <TabContent id="style">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2 border-b pb-1">الألوان</h4>
          
          <ColorPicker
            label="لون التعبئة"
            value={fill}
            onChange={(color) => {
              setFill(color);
              updateFill(color);
            }}
          />
          
          <ColorPicker
            label="لون الحدود"
            value={stroke}
            onChange={(color) => {
              setStroke(color);
              updateStroke(color);
            }}
          />
          
          {(selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
            <ColorPicker
              label="لون الخلفية"
              value={backgroundColor}
              onChange={(color) => {
                setBackgroundColor(color);
                updateBackgroundColor(color);
              }}
            />
          )}
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2 border-b pb-1">التفاصيل</h4>
          
          <div className="mb-3">
            <Label className="text-xs flex justify-between mb-1">
              <span>سمك الحدود</span>
              <span>{strokeWidth}px</span>
            </Label>
            <Slider
              value={[strokeWidth]}
              min={0}
              max={20}
              step={1}
              onValueChange={(values) => {
                const val = values[0];
                setStrokeWidth(val);
                updateStrokeWidth(val);
              }}
              className="py-1"
            />
          </div>
          
          {selectedObject.type === 'rect' && (
            <div className="mb-3">
              <Label className="text-xs flex justify-between mb-1">
                <span>تدوير الحواف</span>
                <span>{borderRadius}px</span>
              </Label>
              <Slider
                value={[borderRadius]}
                min={0}
                max={50}
                step={1}
                onValueChange={(values) => {
                  const val = values[0];
                  setBorderRadius(val);
                  updateBorderRadius(val);
                }}
                className="py-1"
              />
            </div>
          )}
        </div>
      </div>
    </TabContent>
  );
  
  // محتوى تاب الشبكة
  const gridTab = (
    <TabContent id="grid">
      <div className="space-y-4">
        <div className="p-4 text-center text-slate-500">
          <p>قريباً...</p>
          <p className="text-xs mt-2">سيتم إضافة إعدادات الشبكة قريباً</p>
        </div>
      </div>
    </TabContent>
  );
  
  return (
    <div className={`h-full ${className || ''}`}>
      <TabPanel
        tabs={tabs}
        defaultTab="general"
        variant="underline"
        tabClassName="text-xs"
      >
        {generalTab}
        {textTab}
        {styleTab}
        {gridTab}
      </TabPanel>
    </div>
  );
}