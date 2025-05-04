/**
 * مكون منتقي الألوان
 * الإصدار 1.0 - مايو 2025
 * 
 * مكون بسيط لاختيار الألوان مع دعم الألوان الشفافة (RGBA)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

// واجهة مكون منتقي الألوان
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  enableAlpha?: boolean;
  presetColors?: string[];
}

// قائمة الألوان المسبقة الافتراضية
const DEFAULT_PRESET_COLORS = [
  '#EF4444', // أحمر
  '#F97316', // برتقالي 
  '#F59E0B', // أصفر داكن
  '#10B981', // أخضر
  '#06B6D4', // تركواز
  '#3B82F6', // أزرق
  '#8B5CF6', // بنفسجي
  '#EC4899', // وردي
  '#18181B', // أسود
  '#A1A1AA', // رمادي
  '#FFFFFF', // أبيض
];

/**
 * تحويل اللون من سداسي عشري إلى RGB
 */
const hexToRgb = (hex: string): { r: number, g: number, b: number, a: number } => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const formattedHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
  
  return result 
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 1
      }
    : { r: 0, g: 0, b: 0, a: 1 };
};

/**
 * تحويل RGB إلى سداسي عشري
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b]
    .map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
};

/**
 * تحويل لون RGBA إلى سلسلة نصية
 */
const rgbaToString = (r: number, g: number, b: number, a: number): string => {
  return a < 1 
    ? `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(2)})`
    : rgbToHex(r, g, b);
};

/**
 * استخراج مكونات RGB من سلسلة نصية
 */
const parseColorString = (color: string): { r: number, g: number, b: number, a: number } => {
  if (color.startsWith('#')) {
    return hexToRgb(color);
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*(?:\.\d+)?))?\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] ? parseFloat(match[4]) : 1
      };
    }
  }
  return { r: 0, g: 0, b: 0, a: 1 };
};

/**
 * مكون منتقي الألوان
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  className,
  enableAlpha = true,
  presetColors = DEFAULT_PRESET_COLORS
}) => {
  // تحليل اللون المدخل
  const parsedColor = parseColorString(color);
  
  // حالة مكونات اللون
  const [r, setR] = useState(parsedColor.r);
  const [g, setG] = useState(parsedColor.g);
  const [b, setB] = useState(parsedColor.b);
  const [a, setA] = useState(parsedColor.a);
  const [hexValue, setHexValue] = useState(rgbToHex(r, g, b));
  
  // تحديث حالة اللون عند تغيير اللون من الخارج
  useEffect(() => {
    const parsed = parseColorString(color);
    setR(parsed.r);
    setG(parsed.g);
    setB(parsed.b);
    setA(parsed.a);
    setHexValue(rgbToHex(parsed.r, parsed.g, parsed.b));
  }, [color]);
  
  // تحديث اللون عند تغيير أي من مكوناته
  const updateColor = useCallback(() => {
    const newColor = rgbaToString(r, g, b, a);
    onChange(newColor);
  }, [r, g, b, a, onChange]);
  
  // تحديث مكونات اللون عند تغيير القيمة السداسية عشرية
  const handleHexChange = (value: string) => {
    setHexValue(value);
    
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      const { r: newR, g: newG, b: newB } = hexToRgb(value);
      setR(newR);
      setG(newG);
      setB(newB);
      onChange(rgbaToString(newR, newG, newB, a));
    }
  };
  
  // اختيار لون مسبق
  const handlePresetClick = (presetColor: string) => {
    const parsed = parseColorString(presetColor);
    setR(parsed.r);
    setG(parsed.g);
    setB(parsed.b);
    setHexValue(rgbToHex(parsed.r, parsed.g, parsed.b));
    onChange(rgbaToString(parsed.r, parsed.g, parsed.b, a));
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "w-10 h-10 rounded-md border",
            className
          )} 
          style={{
            background: color,
            boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
          }}
          type="button"
          aria-label="Pick a color"
        />
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-3" sideOffset={5}>
        <Tabs defaultValue="rgb">
          <TabsList className="grid grid-cols-2 mb-3">
            <TabsTrigger value="rgb">RGB</TabsTrigger>
            <TabsTrigger value="hex">HEX</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rgb" className="space-y-3">
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="r-slider">R</Label>
                <span className="text-xs w-8 text-center">{r}</span>
              </div>
              <Slider 
                id="r-slider"
                min={0} 
                max={255} 
                step={1} 
                value={[r]} 
                onValueChange={(value) => {
                  setR(value[0]);
                  setHexValue(rgbToHex(value[0], g, b));
                  updateColor();
                }}
                className="slider-red"
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="g-slider">G</Label>
                <span className="text-xs w-8 text-center">{g}</span>
              </div>
              <Slider 
                id="g-slider"
                min={0} 
                max={255} 
                step={1} 
                value={[g]} 
                onValueChange={(value) => {
                  setG(value[0]);
                  setHexValue(rgbToHex(r, value[0], b));
                  updateColor();
                }}
                className="slider-green"
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="b-slider">B</Label>
                <span className="text-xs w-8 text-center">{b}</span>
              </div>
              <Slider 
                id="b-slider"
                min={0} 
                max={255} 
                step={1} 
                value={[b]} 
                onValueChange={(value) => {
                  setB(value[0]);
                  setHexValue(rgbToHex(r, g, value[0]));
                  updateColor();
                }}
                className="slider-blue"
              />
            </div>
            
            {enableAlpha && (
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="a-slider">Alpha</Label>
                  <span className="text-xs w-8 text-center">{a.toFixed(2)}</span>
                </div>
                <Slider 
                  id="a-slider"
                  min={0} 
                  max={1} 
                  step={0.01} 
                  value={[a]} 
                  onValueChange={(value) => {
                    setA(value[0]);
                    updateColor();
                  }}
                  className="slider-alpha"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="hex">
            <div className="grid gap-2">
              <Label htmlFor="hex-input">قيمة HEX</Label>
              <Input 
                id="hex-input"
                value={hexValue} 
                onChange={(e) => handleHexChange(e.target.value)}
                className="font-mono uppercase"
                placeholder="#RRGGBB"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-center my-3">
          <div 
            className="w-12 h-12 rounded-md border border-gray-200"
            style={{
              background: rgbaToString(r, g, b, a),
              boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
        
        <div className="grid grid-cols-5 gap-2 mt-3">
          {presetColors.map((presetColor, i) => (
            <button
              key={i}
              className="w-6 h-6 rounded-md border border-gray-200"
              style={{
                background: presetColor,
                boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
              }}
              onClick={() => handlePresetClick(presetColor)}
              type="button"
              aria-label={`Color preset ${presetColor}`}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};