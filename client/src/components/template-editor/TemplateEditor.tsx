import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable';
import { FieldsPanel } from './FieldsPanel';
import { EditorCanvas } from './EditorCanvas';
import { PropertiesPanel } from './PropertiesPanel';
// @ts-ignore
import * as fabricModule from 'fabric';
const fabric = (fabricModule as any).fabric || fabricModule;
import { Save, Undo, Redo, ZoomIn, ZoomOut, Plus, Image, Square, Circle, TextIcon } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

interface TemplateEditorProps {
  templateId: number;
  templateImage: string;
  fields: any[];
  initialLayout?: any[];
  onSave?: (layoutData: any[]) => void;
}

export function TemplateEditor({
  templateId,
  templateImage,
  fields,
  initialLayout = [],
  onSave
}: TemplateEditorProps) {
  console.log('Template Editor Fields:', fields);
  console.log('Template Editor Fields Type:', typeof fields, Array.isArray(fields));
  const { toast } = useToast();
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  
  // Handle canvas ready event
  const handleCanvasReady = useCallback((canvasInstance: fabric.Canvas) => {
    setCanvas(canvasInstance);
    
    // Listen for selection events
    canvasInstance.on('selection:created', () => {
      setSelectedObject(canvasInstance.getActiveObject());
    });
    
    canvasInstance.on('selection:updated', () => {
      setSelectedObject(canvasInstance.getActiveObject());
    });
    
    canvasInstance.on('selection:cleared', () => {
      setSelectedObject(null);
    });
    
    // Listen for object modifications to update undo/redo stack
    canvasInstance.on('object:modified', () => {
      // Save current state to undo stack
      const currentState = JSON.stringify(canvasInstance.toJSON(['id', 'name', 'data']));
      setUndoStack(prev => [...prev, currentState]);
      setRedoStack([]);
    });
    
  }, []);
  
  // Handle drag end from fields panel
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Only process if dropped over the canvas
    if (over && over.id === 'canvas-droppable' && canvas) {
      // Get the field data
      const fieldData = active.data.current;
      
      // Create a new object on the canvas based on field type
      if (fieldData.type === 'text' || fieldData.type === 'textbox') {
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
        
        // Save state for undo
        const currentState = JSON.stringify(canvas.toJSON(['id', 'name', 'data']));
        setUndoStack(prev => [...prev, currentState]);
      }
      
      // Add more field types as needed
      
      canvas.renderAll();
    }
  }, [canvas]);
  
  // Add a shape to the canvas
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
      // Open file picker
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
              // Scale image to reasonable size
              if (img.width && img.height) {
                if (img.width > 300) {
                  const scale = 300 / img.width;
                  img.scale(scale);
                }
              }
              
              canvas.add(img);
              canvas.setActiveObject(img);
              canvas.renderAll();
              
              // Save state for undo
              const currentState = JSON.stringify(canvas.toJSON(['id', 'name', 'data']));
              setUndoStack(prev => [...prev, currentState]);
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
      
      // Save state for undo
      const currentState = JSON.stringify(canvas.toJSON(['id', 'name', 'data']));
      setUndoStack(prev => [...prev, currentState]);
    }
  };
  
  // Undo last action
  const handleUndo = () => {
    if (!canvas || undoStack.length === 0) return;
    
    // Get current state for redo
    const currentState = JSON.stringify(canvas.toJSON(['id', 'name', 'data']));
    
    // Pop last state from undo stack
    const newUndoStack = [...undoStack];
    const lastState = newUndoStack.pop();
    
    if (lastState) {
      // Add current state to redo stack
      setRedoStack(prev => [...prev, currentState]);
      
      // Update undo stack
      setUndoStack(newUndoStack);
      
      // Load the previous state
      canvas.loadFromJSON(lastState, () => {
        canvas.renderAll();
      });
    }
  };
  
  // Redo last undone action
  const handleRedo = () => {
    if (!canvas || redoStack.length === 0) return;
    
    // Get current state for undo
    const currentState = JSON.stringify(canvas.toJSON(['id', 'name', 'data']));
    
    // Pop last state from redo stack
    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop();
    
    if (nextState) {
      // Add current state to undo stack
      setUndoStack(prev => [...prev, currentState]);
      
      // Update redo stack
      setRedoStack(newRedoStack);
      
      // Load the next state
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
      });
    }
  };
  
  // Zoom in
  const handleZoomIn = () => {
    if (!canvas) return;
    
    const zoom = canvas.getZoom();
    canvas.setZoom(zoom * 1.1);
    canvas.renderAll();
  };
  
  // Zoom out
  const handleZoomOut = () => {
    if (!canvas) return;
    
    const zoom = canvas.getZoom();
    canvas.setZoom(zoom / 1.1);
    canvas.renderAll();
  };
  
  // Save the template layout
  const handleSave = async () => {
    if (!canvas) return;
    
    setSaving(true);
    
    try {
      // Serialize all objects
      const objects = canvas.getObjects().map((obj: any) => {
        // Convert fabric objects to JSON
        const objData = obj.toJSON(['id', 'name', 'data']);
        
        // Get the field ID from the object's data
        const fieldId = obj.data?.fieldId;
        const field = fields.find(f => f.id === fieldId);
        
        return {
          ...objData,
          fieldId,
          fieldName: field?.name || '',
          fieldLabel: field?.label || ''
        };
      });
      
      // Call API to save layout
      await axios.put(`/api/admin/templates/${templateId}/layout`, {
        layout: objects
      });
      
      // Call the onSave callback if provided
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
  
  // Add a field from the fields panel to the canvas
  const handleAddField = (field: any) => {
    if (!canvas) return;
    
    // Create a text object for the field
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
    canvas.renderAll();
    
    // Save state for undo
    const currentState = JSON.stringify(canvas.toJSON(['id', 'name', 'data']));
    setUndoStack(prev => [...prev, currentState]);
  };
  
  // Render the editor tab content
  const renderEditorTab = () => (
    <div className="h-full">
      <DndContext onDragEnd={handleDragEnd}>
        <div className="border-b p-2 flex items-center space-x-2 rtl:space-x-reverse bg-slate-50">
          <span className="text-sm font-medium">اضافة عناصر:</span>
          
          <button
            type="button"
            className="p-2 rounded hover:bg-slate-200 flex items-center"
            onClick={() => addShape('text')}
          >
            <TextIcon className="h-4 w-4 ml-1" />
            <span className="text-sm">نص</span>
          </button>
          
          <button
            type="button"
            className="p-2 rounded hover:bg-slate-200 flex items-center"
            onClick={() => addShape('rectangle')}
          >
            <Square className="h-4 w-4 ml-1" />
            <span className="text-sm">مستطيل</span>
          </button>
          
          <button
            type="button"
            className="p-2 rounded hover:bg-slate-200 flex items-center"
            onClick={() => addShape('circle')}
          >
            <Circle className="h-4 w-4 ml-1" />
            <span className="text-sm">دائرة</span>
          </button>
          
          <button
            type="button"
            className="p-2 rounded hover:bg-slate-200 flex items-center"
            onClick={() => addShape('image')}
          >
            <Image className="h-4 w-4 ml-1" />
            <span className="text-sm">صورة</span>
          </button>
        </div>
        
        <ResizablePanelGroup
          direction="horizontal"
          className="h-[calc(100%-40px)]"
        >
          {/* Properties Panel */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <PropertiesPanel
              selectedObject={selectedObject}
              canvas={canvas}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Canvas Panel */}
          <ResizablePanel defaultSize={60}>
            <div className="h-full overflow-auto p-4 flex items-center justify-center bg-slate-100">
              <EditorCanvas
                templateImage={templateImage}
                templateFields={fields}
                initialObjects={initialLayout}
                onCanvasReady={handleCanvasReady}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Fields Panel */}
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

  // Render the preview tab content
  const renderPreviewTab = () => (
    <div className="h-full flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl">
        <h2 className="text-xl font-bold mb-4">معاينة القالب</h2>
        <p className="text-slate-600 mb-6">
          هذه معاينة للقالب مع البيانات التي ستظهر للمستخدم.
          الحقول المضافة ستظهر بالقيم الفعلية عند استخدام القالب.
        </p>
        
        {/* Simple preview - can be enhanced later */}
        <div className="border rounded-lg overflow-hidden">
          <img src={templateImage} alt="Preview" className="w-full object-contain" />
        </div>
      </div>
    </div>
  );

  // Render the code tab content
  const renderCodeTab = () => (
    <div className="h-full flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl w-full">
        <h2 className="text-xl font-bold mb-4">شيفرة القالب</h2>
        <p className="text-slate-600 mb-6">
          هذه الشيفرة الخاصة بتخطيط القالب. يمكنك تعديلها مباشرة أو نسخها لاستخدامها في مكان آخر.
        </p>
        
        <div className="border rounded-lg p-4 bg-slate-50 overflow-auto max-h-96">
          <pre className="text-sm">
            {canvas ? JSON.stringify(canvas.toJSON(['id', 'name', 'data']), null, 2) : 'No data available'}
          </pre>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b">
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex space-x-4 rtl:space-x-reverse">
            <button
              type="button"
              className={`px-3 py-2 ${activeTab === 'editor' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('editor')}
            >
              محرر التخطيط
            </button>
            <button
              type="button"
              className={`px-3 py-2 ${activeTab === 'preview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('preview')}
            >
              معاينة
            </button>
            <button
              type="button"
              className={`px-3 py-2 ${activeTab === 'code' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('code')}
            >
              الشيفرة
            </button>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              type="button"
              className="p-2 rounded hover:bg-slate-100"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
            >
              <Undo className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 rounded hover:bg-slate-100"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
            >
              <Redo className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 rounded hover:bg-slate-100"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 rounded hover:bg-slate-100"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-5 w-5 ml-1" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ'}</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'editor' && renderEditorTab()}
        {activeTab === 'preview' && renderPreviewTab()}
        {activeTab === 'code' && renderCodeTab()}
      </div>
    </div>
  );
}