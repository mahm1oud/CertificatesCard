import React, { useState, useCallback, useRef } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable';
import { FieldsPanel } from './FieldsPanel-v2';
import { EditorCanvas } from './EditorCanvas-v2';
import { PropertiesPanel } from './PropertiesPanel-v2';
import { TabPanel, TabContent } from '../ui/tabs-advanced';
import { fabric } from '@/lib/fabric-utilities';
import { Button } from '../ui/button';
import { 
  Save, 
  Undo, 
  Redo, 
  Eye, 
  Settings, 
  Layers, 
  Code,
  Layout,
  Brush,
  RotateCw,
  Image as ImageIcon,
  Square as SquareIcon, 
  Circle as CircleIcon, 
  Type as TypeIcon,
  FileQuestion,
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { createObjectFromJson } from '@/lib/fabric-utilities';
import axios from 'axios';

interface TemplateEditorProps {
  templateId: number;
  templateImage: string;
  fields: any[];
  initialLayout?: any[];
  onSave?: (layoutData: any[]) => void;
  className?: string;
}

/**
 * مكون محرر القوالب المحسن
 */
export function TemplateEditor({
  templateId,
  templateImage,
  fields = [],
  initialLayout = [],
  onSave,
  className
}: TemplateEditorProps) {
  const { toast } = useToast();
  
  // حالة Canvas
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'code'>('editor');
  const [editorTab, setEditorTab] = useState<string>('layout');
  const [saving, setSaving] = useState(false);
  const [jsonCode, setJsonCode] = useState<string>('{}');
  
  // مرجع لمشهد الطبقات
  const layersRef = useRef<any[]>([]);
  
  // معالجة حدث جاهزية الكانفاس
  const handleCanvasReady = useCallback((canvasInstance: fabric.Canvas) => {
    setCanvas(canvasInstance);
    
    // الاستماع لتعديلات الكائنات لتحديث stack التراجع/الإعادة
    canvasInstance.on('object:modified', () => {
      // حفظ الحالة الحالية للتراجع
      saveCurrentStateToUndo();
      updateLayersFromCanvas();
    });
    
    canvasInstance.on('object:added', () => {
      updateLayersFromCanvas();
    });
    
    canvasInstance.on('object:removed', () => {
      updateLayersFromCanvas();
    });
    
  }, []);
  
  // تحديث مشهد الطبقات من الكانفاس الحالي
  const updateLayersFromCanvas = () => {
    if (!canvas) return;
    
    const objects = canvas.getObjects().filter(obj => !obj.data?.isGridLine);
    layersRef.current = objects.map((obj, index) => ({
      id: obj.data?.id || index,
      name: obj.data?.name || `العنصر ${index + 1}`,
      type: obj.type,
      visible: obj.visible !== false,
      ref: obj
    }));
  };
  
  // حفظ الحالة الحالية للتراجع
  const saveCurrentStateToUndo = () => {
    if (!canvas) return;
    
    // حفظ الحالة الحالية للتراجع
    const currentState = JSON.stringify(canvas.toJSON(['id', 'name', 'data']));
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack([]);
    
    // تحديث كود JSON
    setJsonCode(JSON.stringify(canvas.toJSON(['id', 'name', 'data']), null, 2));
  };
  
  // معالجة انتهاء السحب من لوحة الحقول
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // معالجة فقط إذا تم إسقاطه فوق الكانفاس
    if (over && over.id === 'canvas-droppable' && canvas) {
      // الحصول على بيانات الحقل
      const fieldData = active.data.current;
      
      if (!fieldData) return;
      
      // إنشاء كائن نص جديد على الكانفاس إذا كان حقل نص
      if (fieldData.type === 'text' || fieldData.type === 'textbox' || !fieldData.type) {
        const text = new fabric.Textbox(fieldData.label, {
          left: 100,
          top: 100,
          fontSize: 20,
          fontFamily: 'Arial',
          fill: '#000000',
          width: 200,
          name: fieldData.name,
          id: fieldData.id,
          data: { fieldId: fieldData.id }
        });
        
        canvas.add(text);
        canvas.setActiveObject(text);
        saveCurrentStateToUndo();
      } else if (fieldData.type === 'shape' || fieldData.shapeType) {
        // إنشاء أشكال مختلفة بناءً على النوع
        let obj;
        
        switch (fieldData.shapeType) {
          case 'rect':
            obj = new fabric.Rect({
              left: 100,
              top: 100,
              width: 100,
              height: 50,
              fill: '#e9ecef',
              stroke: '#ced4da',
              strokeWidth: 1,
              rx: 5,
              ry: 5
            });
            break;
          case 'circle':
            obj = new fabric.Circle({
              left: 100,
              top: 100,
              radius: 50,
              fill: '#e9ecef',
              stroke: '#ced4da',
              strokeWidth: 1
            });
            break;
          case 'line':
            obj = new fabric.Line([50, 50, 200, 50], {
              stroke: '#000000',
              strokeWidth: 2
            });
            break;
        }
        
        if (obj) {
          obj.set({
            name: fieldData.name,
            id: fieldData.id,
            data: { fieldId: fieldData.id }
          });
          
          canvas.add(obj);
          canvas.setActiveObject(obj);
          saveCurrentStateToUndo();
        }
      }
      
      canvas.renderAll();
    }
  }, [canvas]);
  
  // إضافة حقل جديد من لوحة الحقول
  const handleAddField = (field: any) => {
    if (!canvas) return;
    
    // إنشاء كائن نص للحقل
    if (field.type === 'text' || field.type === 'textbox' || !field.type || field.type === 'email' || field.type === 'date') {
      const textObj = new fabric.Textbox(field.label, {
        left: 100,
        top: 100,
        fontSize: 20,
        fontFamily: 'Arial',
        fill: '#000000',
        width: 200,
        name: field.name,
        id: field.id,
        data: { fieldId: field.id }
      });
      
      canvas.add(textObj);
      canvas.setActiveObject(textObj);
    } else if (field.type === 'shape' || field.shapeType) {
      // إنشاء أشكال مختلفة
      if (field.shapeType === 'rect') {
        const rect = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 50,
          fill: '#e9ecef',
          stroke: '#ced4da',
          strokeWidth: 1,
          rx: 5,
          ry: 5,
          name: field.name,
          id: field.id,
          data: { fieldId: field.id }
        });
        
        canvas.add(rect);
        canvas.setActiveObject(rect);
      } else if (field.shapeType === 'circle') {
        const circle = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: '#e9ecef',
          stroke: '#ced4da',
          strokeWidth: 1,
          name: field.name,
          id: field.id,
          data: { fieldId: field.id }
        });
        
        canvas.add(circle);
        canvas.setActiveObject(circle);
      }
    }
    
    canvas.renderAll();
    saveCurrentStateToUndo();
  };
  
  // إضافة شكل جديد إلى الكانفاس
  const addShape = (type: 'rectangle' | 'circle' | 'text' | 'image') => {
    if (!canvas) return;
    
    let obj;
    
    if (type === 'rectangle') {
      obj = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 50,
        fill: '#e9ecef',
        stroke: '#ced4da',
        strokeWidth: 1,
        rx: 5,
        ry: 5
      });
    } else if (type === 'circle') {
      obj = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: '#e9ecef',
        stroke: '#ced4da',
        strokeWidth: 1
      });
    } else if (type === 'text') {
      obj = new fabric.Textbox('نص جديد', {
        left: 100,
        top: 100,
        fontSize: 20,
        fontFamily: 'Arial',
        fill: '#000000',
        width: 200
      });
    } else if (type === 'image') {
      // فتح مربع اختيار الملفات
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          const file = target.files[0];
          const reader = new FileReader();
          
          reader.onload = (event) => {
            const imgData = event.target?.result as string;
            fabric.Image.fromURL(imgData, (img: any) => {
              // تغيير حجم الصورة إلى حجم معقول
              if (img.width && img.height) {
                if (img.width > 300) {
                  const scale = 300 / img.width;
                  img.scale(scale);
                }
              }
              
              canvas.add(img);
              canvas.setActiveObject(img);
              canvas.renderAll();
              saveCurrentStateToUndo();
            });
          };
          
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
      return;
    }
    
    if (obj) {
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
      saveCurrentStateToUndo();
    }
  };
  
  // التراجع عن آخر تعديل
  const handleUndo = () => {
    if (!canvas || undoStack.length === 0) return;
    
    // الحصول على الحالة الحالية للإعادة
    const currentState = JSON.stringify(canvas.toJSON(['id', 'name', 'data']));
    
    // إزالة آخر حالة من stack التراجع
    const newUndoStack = [...undoStack];
    const lastState = newUndoStack.pop();
    
    if (lastState) {
      // إضافة الحالة الحالية إلى stack الإعادة
      setRedoStack(prev => [...prev, currentState]);
      
      // تحديث stack التراجع
      setUndoStack(newUndoStack);
      
      // تحميل الحالة السابقة
      canvas.loadFromJSON(lastState, () => {
        canvas.renderAll();
        updateLayersFromCanvas();
      });
      
      // تحديث كود JSON
      setJsonCode(lastState);
    }
  };
  
  // إعادة آخر تعديل تم التراجع عنه
  const handleRedo = () => {
    if (!canvas || redoStack.length === 0) return;
    
    // الحصول على الحالة الحالية للتراجع
    const currentState = JSON.stringify(canvas.toJSON(['id', 'name', 'data']));
    
    // إزالة آخر حالة من stack الإعادة
    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop();
    
    if (nextState) {
      // إضافة الحالة الحالية إلى stack التراجع
      setUndoStack(prev => [...prev, currentState]);
      
      // تحديث stack الإعادة
      setRedoStack(newRedoStack);
      
      // تحميل الحالة التالية
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        updateLayersFromCanvas();
      });
      
      // تحديث كود JSON
      setJsonCode(nextState);
    }
  };
  
  // حفظ تخطيط القالب
  const handleSave = async () => {
    if (!canvas) return;
    
    setSaving(true);
    
    try {
      // تسلسل جميع الكائنات
      const objects = canvas.getObjects()
        .filter(obj => !obj.data?.isGridLine)
        .map((obj: any) => {
          // تحويل كائنات fabric إلى JSON
          const objData = obj.toJSON(['id', 'name', 'data']);
          
          // الحصول على معرف الحقل من بيانات الكائن
          const fieldId = obj.data?.fieldId;
          const field = fields.find(f => f.id === fieldId);
          
          return {
            ...objData,
            fieldId,
            fieldName: field?.name || '',
            fieldLabel: field?.label || ''
          };
      });
      
      // استدعاء واجهة برمجة التطبيقات لحفظ التخطيط
      await axios.put(`/api/admin/templates/${templateId}/layout`, {
        layout: objects
      });
      
      // استدعاء رد الاتصال onSave إذا تم توفيره
      if (onSave) {
        onSave(objects);
      }
      
      toast({
        title: "تم الحفظ بنجاح",
        description: 'تم حفظ تخطيط القالب بنجاح',
      });
    } catch (error) {
      console.error('Error saving template layout:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: 'حدث خطأ أثناء حفظ تخطيط القالب',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // تطبيق كود JSON المحرر على الكانفاس
  const applyJsonCode = () => {
    if (!canvas) return;
    
    try {
      const jsonData = JSON.parse(jsonCode);
      canvas.clear();
      canvas.loadFromJSON(jsonData, () => {
        canvas.renderAll();
        updateLayersFromCanvas();
        
        toast({
          title: "تم التطبيق بنجاح",
          description: 'تم تطبيق الكود بنجاح على القالب',
        });
      });
    } catch (error) {
      console.error('Error applying JSON code:', error);
      toast({
        variant: "destructive",
        title: "خطأ في الصيغة",
        description: 'تأكد من صحة صيغة JSON المدخلة',
      });
    }
  };
  
  // تحديث ترتيب الطبقات
  const updateLayerOrder = (sourceIndex: number, targetIndex: number) => {
    if (!canvas || sourceIndex === targetIndex) return;
    
    const objects = canvas.getObjects().filter(obj => !obj.data?.isGridLine);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= objects.length || targetIndex >= objects.length) return;
    
    const objectToMove = objects[sourceIndex];
    
    // حذف الكائن من موضعه الحالي
    canvas.remove(objectToMove);
    
    // إعادة إدراج الكائن في الموضع الجديد
    if (targetIndex >= objects.length - 1) {
      // إذا كان الهدف هو آخر كائن، أضف في النهاية
      canvas.add(objectToMove);
    } else {
      // إذا كان الهدف بين الكائنات، أدرج قبل الكائن الهدف
      const targetObject = objects[targetIndex];
      canvas.insertAt(objectToMove, canvas.getObjects().indexOf(targetObject), false);
    }
    
    canvas.renderAll();
    updateLayersFromCanvas();
    saveCurrentStateToUndo();
  };
  
  // إعدادات التاب
  const tabs = [
    { id: 'layout', label: 'التخطيط', icon: <Layout className="h-4 w-4" /> },
    { id: 'style', label: 'النمط', icon: <Brush className="h-4 w-4" /> },
    { id: 'preview', label: 'معاينة', icon: <Eye className="h-4 w-4" /> },
    { id: 'code', label: 'الكود', icon: <Code className="h-4 w-4" /> },
  ];
  
  // إعدادات العرض لكل تاب
  const renderLayoutTab = () => (
    <div className="h-full">
      <DndContext onDragEnd={handleDragEnd}>
        <div className="border-b p-2 flex items-center space-x-2 rtl:space-x-reverse bg-slate-50">
          <span className="text-sm font-medium">إضافة عناصر:</span>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShape('text')}
            className="h-8"
          >
            <TypeIcon className="h-4 w-4 ml-1" />
            <span className="text-sm">نص</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShape('rectangle')}
            className="h-8"
          >
            <SquareIcon className="h-4 w-4 ml-1" />
            <span className="text-sm">مستطيل</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShape('circle')}
            className="h-8"
          >
            <CircleIcon className="h-4 w-4 ml-1" />
            <span className="text-sm">دائرة</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShape('image')}
            className="h-8"
          >
            <ImageIcon className="h-4 w-4 ml-1" />
            <span className="text-sm">صورة</span>
          </Button>
          
          <div className="ml-auto flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="h-8 w-8 p-0"
            >
              <Undo className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="h-8 w-8 p-0"
            >
              <Redo className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-8"
            >
              {saving ? (
                <span className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                  <span>جاري الحفظ...</span>
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-4 w-4 ml-1" />
                  <span>حفظ</span>
                </span>
              )}
            </Button>
          </div>
        </div>
        
        <ResizablePanelGroup
          direction="horizontal"
          className="h-[calc(100%-48px)]"
        >
          {/* لوحة الخصائص */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <PropertiesPanel
              selectedObject={selectedObject}
              canvas={canvas}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* لوحة القالب */}
          <ResizablePanel defaultSize={60}>
            <div className="h-full overflow-auto p-4 flex items-center justify-center bg-slate-100">
              <EditorCanvas
                templateImage={templateImage}
                templateFields={fields}
                initialObjects={initialLayout}
                onCanvasReady={handleCanvasReady}
                onObjectSelected={setSelectedObject}
                onSave={handleSave}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* لوحة الحقول */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <FieldsPanel
              fields={fields}
              onAddField={handleAddField}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </DndContext>
    </div>
  );
  
  // عرض تاب المعاينة
  const renderPreviewTab = () => (
    <div className="h-full flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl">
        <h2 className="text-xl font-bold mb-4">معاينة القالب</h2>
        <p className="text-sm text-slate-600 mb-6">هذه معاينة لكيف سيظهر القالب عند إنشاء شهادة أو بطاقة جديدة.</p>
        
        <div className="flex justify-center mb-4">
          <img 
            src={templateImage} 
            alt="معاينة القالب"
            className="max-w-full rounded border shadow-sm" 
          />
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => setEditorTab('layout')}>
            <RotateCw className="h-4 w-4 ml-1" />
            <span>العودة للتحرير</span>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 ml-1" />
            <span>حفظ التخطيط</span>
          </Button>
        </div>
      </div>
    </div>
  );
  
  // عرض تاب الكود
  const renderCodeTab = () => (
    <div className="h-full flex flex-col p-4 bg-slate-100">
      <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">تحرير JSON</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={applyJsonCode}
          >
            <RotateCw className="h-4 w-4 ml-1" />
            <span>تطبيق التغييرات</span>
          </Button>
        </div>
        
        <div className="flex-1 relative">
          <textarea
            value={jsonCode}
            onChange={(e) => setJsonCode(e.target.value)}
            className="w-full h-full bg-slate-950 text-slate-100 p-4 rounded text-xs font-mono overflow-auto resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            spellCheck="false"
          ></textarea>
        </div>
        
        <div className="mt-4 text-xs text-slate-500">
          <p>يمكنك تحرير كود JSON مباشرة لتخصيص القالب بشكل متقدم.</p>
          <p className="mt-1">ملاحظة: تأكد من صحة الصيغة قبل التطبيق.</p>
        </div>
      </div>
    </div>
  );
  
  // عرض المحتوى المناسب بناءً على التاب النشط
  const renderActiveTab = () => {
    switch (editorTab) {
      case 'layout':
      case 'style':
        return renderLayoutTab();
      case 'preview':
        return renderPreviewTab();
      case 'code':
        return renderCodeTab();
      default:
        return renderLayoutTab();
    }
  };
  
  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      <TabPanel
        tabs={tabs}
        defaultTab="layout"
        variant="underline"
        orientation="horizontal"
        onTabChange={setEditorTab}
      >
        <TabContent id="layout">
          {renderLayoutTab()}
        </TabContent>
        <TabContent id="style">
          {renderLayoutTab()}
        </TabContent>
        <TabContent id="preview">
          {renderPreviewTab()}
        </TabContent>
        <TabContent id="code">
          {renderCodeTab()}
        </TabContent>
      </TabPanel>
    </div>
  );
}