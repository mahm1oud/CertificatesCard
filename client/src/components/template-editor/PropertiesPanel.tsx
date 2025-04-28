import { useState, useEffect } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Slider } from '../ui/slider';
// @ts-ignore
import * as fabricModule from 'fabric';
const fabric = (fabricModule as any).fabric || fabricModule;
import { debounce, hexToRgba, rgbaToHex } from '@/lib/utils';

interface PropertiesPanelProps {
  selectedObject: fabric.Object | null;
  canvas: fabric.Canvas | null;
}

export function PropertiesPanel({ selectedObject, canvas }: PropertiesPanelProps) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fill, setFill] = useState('#000000');
  const [opacity, setOpacity] = useState(100);
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textAlign, setTextAlign] = useState('right');
  const [stroke, setStroke] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('');
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [angle, setAngle] = useState(0);
  
  // Update form values when selected object changes
  useEffect(() => {
    if (!selectedObject) {
      // Reset values when no object is selected
      setText('');
      setFontSize(20);
      setFill('#000000');
      setOpacity(100);
      setFontFamily('Arial');
      setFontWeight('normal');
      setFontStyle('normal');
      setTextAlign('right');
      setStroke('#000000');
      setStrokeWidth(0);
      setBackgroundColor('');
      setLeft(0);
      setTop(0);
      setScaleX(1);
      setScaleY(1);
      setAngle(0);
      return;
    }
    
    // Update common properties
    setOpacity(Math.round(selectedObject.opacity || 1) * 100);
    setLeft(Math.round(selectedObject.left || 0));
    setTop(Math.round(selectedObject.top || 0));
    setScaleX(selectedObject.scaleX || 1);
    setScaleY(selectedObject.scaleY || 1);
    setAngle(Math.round(selectedObject.angle || 0));
    
    // For text objects
    if (selectedObject.type === 'text' || selectedObject.type === 'textbox') {
      const textObj = selectedObject as fabric.Text;
      setText(textObj.text || '');
      setFontSize(textObj.fontSize || 20);
      setFill(textObj.fill?.toString() || '#000000');
      setFontFamily(textObj.fontFamily || 'Arial');
      setFontWeight(textObj.fontWeight?.toString() || 'normal');
      setFontStyle(textObj.fontStyle || 'normal');
      setTextAlign(textObj.textAlign || 'right');
      setStroke(textObj.stroke?.toString() || '#000000');
      setStrokeWidth(textObj.strokeWidth || 0);
      setBackgroundColor(textObj.backgroundColor?.toString() || '');
    }
    
    // For image objects
    if (selectedObject.type === 'image') {
      setFill('');
      setStroke(selectedObject.stroke?.toString() || '#000000');
      setStrokeWidth(selectedObject.strokeWidth || 0);
    }
    
    // For shape objects
    if (selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'path') {
      setFill(selectedObject.fill?.toString() || '#000000');
      setStroke(selectedObject.stroke?.toString() || '#000000');
      setStrokeWidth(selectedObject.strokeWidth || 0);
    }
    
  }, [selectedObject]);
  
  // Apply text changes
  const updateText = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ text: value });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply font size changes
  const updateFontSize = debounce((value: number) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ fontSize: value });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply color changes
  const updateFill = debounce((value: string) => {
    if (selectedObject && canvas) {
      selectedObject.set({ fill: value });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply opacity changes
  const updateOpacity = debounce((value: number) => {
    if (selectedObject && canvas) {
      selectedObject.set({ opacity: value / 100 });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply font family changes
  const updateFontFamily = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ fontFamily: value });
      canvas.renderAll();
    }
  }, 300);

  // Apply font weight changes
  const updateFontWeight = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ fontWeight: value });
      canvas.renderAll();
    }
  }, 300);

  // Apply font style changes
  const updateFontStyle = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ fontStyle: value });
      canvas.renderAll();
    }
  }, 300);

  // Apply text alignment changes
  const updateTextAlign = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ textAlign: value });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply stroke color changes
  const updateStroke = debounce((value: string) => {
    if (selectedObject && canvas) {
      selectedObject.set({ stroke: value });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply stroke width changes
  const updateStrokeWidth = debounce((value: number) => {
    if (selectedObject && canvas) {
      selectedObject.set({ strokeWidth: value });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply background color changes
  const updateBackgroundColor = debounce((value: string) => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && canvas) {
      (selectedObject as fabric.Text).set({ backgroundColor: value });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply position changes
  const updatePosition = debounce((x: number, y: number) => {
    if (selectedObject && canvas) {
      selectedObject.set({
        left: x,
        top: y
      });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply scale changes
  const updateScale = debounce((x: number, y: number) => {
    if (selectedObject && canvas) {
      selectedObject.set({
        scaleX: x,
        scaleY: y
      });
      canvas.renderAll();
    }
  }, 300);
  
  // Apply rotation changes
  const updateAngle = debounce((value: number) => {
    if (selectedObject && canvas) {
      selectedObject.set({ angle: value });
      canvas.renderAll();
    }
  }, 300);
  
  // Helper function to handle text input changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    updateText(e.target.value);
  };
  
  // No object selected message
  if (!selectedObject) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-slate-500 text-center">
        <div>
          <p>اختر عنصراً من اللوحة لتعديل خصائصه</p>
          <p className="text-xs mt-2">أو اسحب حقلاً من القائمة على اليمين</p>
        </div>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="font-semibold mb-4">خصائص العنصر</h3>
        
        {/* Position and Size */}
        <div className="mb-6">
          <h4 className="font-medium mb-2 text-sm border-b pb-1">الموضع والحجم</h4>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs mb-1">س</label>
              <input
                type="number"
                value={left}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setLeft(val);
                  updatePosition(val, top);
                }}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">ص</label>
              <input
                type="number"
                value={top}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setTop(val);
                  updatePosition(left, val);
                }}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs mb-1">عرض</label>
              <input
                type="number"
                value={parseFloat(scaleX.toFixed(2))}
                min={0.1}
                max={5}
                step={0.1}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setScaleX(val);
                  updateScale(val, scaleY);
                }}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">ارتفاع</label>
              <input
                type="number"
                value={parseFloat(scaleY.toFixed(2))}
                min={0.1}
                max={5}
                step={0.1}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setScaleY(val);
                  updateScale(scaleX, val);
                }}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs mb-1">زاوية: {angle}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={angle}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setAngle(val);
                updateAngle(val);
              }}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Text Properties (only for text objects) */}
        {(selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
          <>
            <div className="mb-6">
              <h4 className="font-medium mb-2 text-sm border-b pb-1">النص</h4>
              
              <div className="mb-3">
                <label className="block text-xs mb-1">المحتوى</label>
                <textarea
                  value={text}
                  onChange={handleTextChange}
                  rows={3}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-xs mb-1">نوع الخط</label>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    updateFontFamily(e.target.value);
                  }}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  {/* خطوط عربية مدعومة في الخادم */}
                  <option value="Cairo">Cairo - القاهرة</option>
                  <option value="Tajawal">Tajawal - تجوال</option>
                  <option value="Amiri">Amiri - أميري</option>
                  <option disabled>──────────</option>
                  
                  {/* خطوط لاتينية قد لا تدعم العربية بشكل كامل - ستستخدم Cairo كبديل */}
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Tahoma">Tahoma</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-xs mb-1">حجم الخط: {fontSize}px</label>
                <Slider
                  value={[fontSize]}
                  min={8}
                  max={100}
                  step={1}
                  onValueChange={(value) => {
                    setFontSize(value[0]);
                    updateFontSize(value[0]);
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-xs mb-1">وزن الخط</label>
                  <select
                    value={fontWeight}
                    onChange={(e) => {
                      setFontWeight(e.target.value);
                      updateFontWeight(e.target.value);
                    }}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="normal">عادي</option>
                    <option value="bold">غامق</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs mb-1">نمط الخط</label>
                  <select
                    value={fontStyle}
                    onChange={(e) => {
                      setFontStyle(e.target.value);
                      updateFontStyle(e.target.value);
                    }}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="normal">عادي</option>
                    <option value="italic">مائل</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-xs mb-1">محاذاة النص</label>
                <select
                  value={textAlign}
                  onChange={(e) => {
                    setTextAlign(e.target.value);
                    updateTextAlign(e.target.value);
                  }}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="right">يمين</option>
                  <option value="center">وسط</option>
                  <option value="left">يسار</option>
                </select>
              </div>
            </div>
          </>
        )}
        
        {/* Appearance Properties */}
        <div className="mb-6">
          <h4 className="font-medium mb-2 text-sm border-b pb-1">المظهر</h4>
          
          {(selectedObject.type === 'text' || selectedObject.type === 'textbox' || 
            selectedObject.type === 'rect' || selectedObject.type === 'circle') && (
            <div className="mb-3">
              <label className="block text-xs mb-1">اللون</label>
              <input
                type="color"
                value={fill}
                onChange={(e) => {
                  setFill(e.target.value);
                  updateFill(e.target.value);
                }}
                className="w-full border rounded h-8"
              />
            </div>
          )}
          
          <div className="mb-3">
            <label className="block text-xs mb-1">الشفافية: {opacity}%</label>
            <Slider
              value={[opacity]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => {
                setOpacity(value[0]);
                updateOpacity(value[0]);
              }}
            />
          </div>
          
          {(selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
            <div className="mb-3">
              <label className="block text-xs mb-1">لون الخلفية</label>
              <input
                type="color"
                value={backgroundColor || '#ffffff'}
                onChange={(e) => {
                  setBackgroundColor(e.target.value);
                  updateBackgroundColor(e.target.value);
                }}
                className="w-full border rounded h-8"
              />
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  checked={!!backgroundColor}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newColor = '#ffffff';
                      setBackgroundColor(newColor);
                      updateBackgroundColor(newColor);
                    } else {
                      setBackgroundColor('');
                      updateBackgroundColor('');
                    }
                  }}
                  className="ml-2"
                />
                <label className="text-xs">تفعيل الخلفية</label>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1">لون الإطار</label>
              <input
                type="color"
                value={stroke}
                onChange={(e) => {
                  setStroke(e.target.value);
                  updateStroke(e.target.value);
                }}
                className="w-full border rounded h-8"
              />
            </div>
            
            <div>
              <label className="block text-xs mb-1">سمك الإطار</label>
              <input
                type="number"
                value={strokeWidth}
                min={0}
                max={20}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setStrokeWidth(val);
                  updateStrokeWidth(val);
                }}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={() => {
              if (selectedObject && canvas) {
                selectedObject.sendToBack();
                canvas.renderAll();
              }
            }}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            إلى الخلف
          </button>
          
          <button
            onClick={() => {
              if (selectedObject && canvas) {
                selectedObject.bringToFront();
                canvas.renderAll();
              }
            }}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            إلى الأمام
          </button>
          
          <button
            onClick={() => {
              if (selectedObject && canvas) {
                canvas.remove(selectedObject);
              }
            }}
            className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
          >
            حذف
          </button>
        </div>
      </div>
    </ScrollArea>
  );
}