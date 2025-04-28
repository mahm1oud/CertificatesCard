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
import { DraggableFieldsPreviewPro } from './DraggableFieldsPreviewPro';
import { 
  Grid, 
  Info, 
  Ruler, 
  CheckSquare, 
  Move
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FieldsPositionEditorProps {
  isOpen: boolean;
  template: any;
  fields: any[];
  onClose: () => void;
  onSave: (updatedFields: any[]) => void;
}

export const FieldsPositionEditor: React.FC<FieldsPositionEditorProps> = ({
  isOpen,
  template,
  fields,
  onClose,
  onSave
}) => {
  const [updatedFields, setUpdatedFields] = useState<any[]>([...fields]);
  
  // إعدادات الشبكة والتجاذب
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [snapThreshold, setSnapThreshold] = useState(15);
  
  // تحديث الحقول عند تغيير القيم من المكون الأب
  useEffect(() => {
    setUpdatedFields([...fields]);
  }, [fields]);
  
  // معالجة حفظ التغييرات
  const handleSaveChanges = () => {
    onSave(updatedFields);
  };
  
  // تحديث إعدادات المحرر في DraggableFieldsPreview
  const updateEditorSettings = {
    gridEnabled,
    snapToGrid,
    gridSize,
    snapThreshold
  };
  
  return (
    <Dialog open={isOpen === true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>تعديل مواضع الحقول</DialogTitle>
          <DialogDescription>
            يمكنك ضبط موقع كل حقل بدقة باستخدام السحب والإفلات
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="p-2 mb-2 bg-gray-100 rounded flex flex-wrap items-center text-sm space-x-2 rtl:space-x-reverse">
            <div className="flex items-center ml-4">
              <Info className="w-4 h-4 ml-2" />
              <span>اسحب الحقول وأفلتها على موضعها المناسب في القالب. ستظهر بنفس المكان في البطاقة النهائية.</span>
            </div>
            
            <div className="flex items-center ml-4">
              <Grid className="w-4 h-4 ml-2" />
              <span>يمكنك ضبط إعدادات الشبكة من التحكم أسفل المحرر.</span>
            </div>
            
            <div className="flex items-center">
              <Ruler className="w-4 h-4 ml-2" />
              <span>الخطوط الزرقاء تمثل خطوط إرشادية تظهر أثناء السحب للمساعدة في المحاذاة.</span>
            </div>
          </div>
          
          <div className="h-[calc(100%-6rem)] overflow-auto">
            {template && (
              <DraggableFieldsPreviewPro
                templateImage={template.imageUrl || ''}
                fields={updatedFields}
                onFieldsChange={setUpdatedFields}
                className="border-gray-200"
                editorSettings={updateEditorSettings}
              />
            )}
          </div>
          
          {/* تحكم الشبكة والتجاذب */}
          <div className="mt-2 p-2 bg-gray-50 rounded-md flex flex-wrap items-center gap-4 rtl:space-x-reverse">
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">إظهار الشبكة</Label>
              <Switch 
                checked={gridEnabled}
                onCheckedChange={setGridEnabled}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">تفعيل التجاذب</Label>
              <Switch 
                checked={snapToGrid}
                onCheckedChange={setSnapToGrid}
              />
            </div>
            
            <div className="flex items-center gap-2 min-w-[200px]">
              <Grid className="w-4 h-4 ml-1" />
              <Label className="text-xs whitespace-nowrap">حجم الشبكة</Label>
              <div className="flex-1">
                <Slider 
                  min={20} 
                  max={100} 
                  step={5}
                  value={[gridSize]} 
                  onValueChange={(value) => setGridSize(value[0])}
                />
              </div>
              <span className="text-xs font-mono w-8 text-center">{gridSize}px</span>
            </div>
            
            <div className="flex items-center gap-2 min-w-[200px]">
              <Move className="w-4 h-4 ml-1" />
              <Label className="text-xs whitespace-nowrap">قوة التجاذب</Label>
              <div className="flex-1">
                <Slider 
                  min={5} 
                  max={30} 
                  step={5}
                  value={[snapThreshold]} 
                  onValueChange={(value) => setSnapThreshold(value[0])}
                />
              </div>
              <span className="text-xs font-mono w-8 text-center">{snapThreshold}px</span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-2 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500 flex items-center">
              <CheckSquare className="w-4 h-4 ml-1 text-blue-500" />
              <span>التجاذب متاح للشبكة وحدود القالب ومواضع الحقول الأخرى</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={handleSaveChanges}>حفظ التغييرات</Button>
            <Button variant="outline" onClick={onClose}>إغلاق</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};