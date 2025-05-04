import { useRef, useEffect, useState } from 'react';
// @ts-ignore
import * as fabricModule from 'fabric';
const fabric = (fabricModule as any).fabric || fabricModule;
import { useDroppable } from '@dnd-kit/core';

interface EditorCanvasProps {
  templateImage: string;
  templateFields: any[];
  initialObjects?: any[];
  onSave?: (canvas: fabric.Canvas, objects: any[]) => void;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export function EditorCanvas({
  templateImage,
  templateFields,
  initialObjects = [],
  onSave,
  onCanvasReady
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  
  // Setup droppable area
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-droppable',
  });
  
  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Create canvas instance
    const canvas = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: '#f8f9fa',
    });
    
    fabricCanvasRef.current = canvas;
    
    // Handle selection events
    canvas.on('selection:created', (e) => {
      setSelectedObject(canvas.getActiveObject());
    });
    
    canvas.on('selection:updated', (e) => {
      setSelectedObject(canvas.getActiveObject());
    });
    
    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });
    
    // Load template image
    fabric.Image.fromURL(templateImage, (img) => {
      // Calculate aspect ratio
      const aspectRatio = img.width! / img.height!;
      let newWidth = canvas.width!;
      let newHeight = newWidth / aspectRatio;
      
      // If height is too large, scale based on height
      if (newHeight > canvas.height!) {
        newHeight = canvas.height!;
        newWidth = newHeight * aspectRatio;
      }
      
      // Set canvas dimensions to match image
      canvas.setWidth(newWidth);
      canvas.setHeight(newHeight);
      setCanvasSize({ width: newWidth, height: newHeight });
      
      // Add image as background
      img.set({
        scaleX: newWidth / img.width!,
        scaleY: newHeight / img.height!,
        selectable: false,
        evented: false,
      });
      
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      
      // Load initial objects if provided
      if (initialObjects && initialObjects.length > 0) {
        initialObjects.forEach(obj => {
          addObjectToCanvas(obj, canvas);
        });
      }
      
      // Notify parent that canvas is ready
      if (onCanvasReady) {
        onCanvasReady(canvas);
      }
    });
    
    // Clean up
    return () => {
      canvas.dispose();
    };
  }, [templateImage]);
  
  // Add a field object to the canvas
  const addObjectToCanvas = (obj: any, canvas: fabric.Canvas) => {
    try {
      if (obj.type === 'text' || obj.type === 'textbox') {
        // Create text object
        const textObj = new fabric.Textbox(obj.text || obj.label || 'Text', {
          left: obj.left || 100,
          top: obj.top || 100,
          fontSize: obj.fontSize || 20,
          fontFamily: obj.fontFamily || 'Arial',
          fill: obj.fill || '#000000',
          textAlign: obj.textAlign || 'right',
          width: obj.width || 200,
          editable: true,
          name: obj.name,
          id: obj.id,
          data: { fieldId: obj.id }
        });
        
        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        canvas.renderAll();
        return textObj;
      }
      
      if (obj.type === 'image') {
        // Create image placeholder
        fabric.Image.fromURL(obj.src || '/placeholder-image.png', (img) => {
          img.set({
            left: obj.left || 100,
            top: obj.top || 100,
            scaleX: obj.scaleX || 0.5,
            scaleY: obj.scaleY || 0.5,
            name: obj.name,
            id: obj.id,
            data: { fieldId: obj.id }
          });
          
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
        return;
      }
      
      if (obj.type === 'rect') {
        // Create rectangle
        const rect = new fabric.Rect({
          left: obj.left || 100,
          top: obj.top || 100,
          width: obj.width || 100,
          height: obj.height || 50,
          fill: obj.fill || '#e9ecef',
          stroke: obj.stroke || '#ced4da',
          strokeWidth: obj.strokeWidth || 1,
          rx: obj.rx || 5,
          ry: obj.ry || 5,
          name: obj.name,
          id: obj.id,
          data: { fieldId: obj.id }
        });
        
        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.renderAll();
        return rect;
      }
      
      if (obj.type === 'circle') {
        // Create circle
        const circle = new fabric.Circle({
          left: obj.left || 100,
          top: obj.top || 100,
          radius: obj.radius || 50,
          fill: obj.fill || '#e9ecef',
          stroke: obj.stroke || '#ced4da',
          strokeWidth: obj.strokeWidth || 1,
          name: obj.name,
          id: obj.id,
          data: { fieldId: obj.id }
        });
        
        canvas.add(circle);
        canvas.setActiveObject(circle);
        canvas.renderAll();
        return circle;
      }
      
      if (obj.type === 'line') {
        // Create line
        const line = new fabric.Line([obj.x1 || 50, obj.y1 || 50, obj.x2 || 200, obj.y2 || 50], {
          stroke: obj.stroke || '#000000',
          strokeWidth: obj.strokeWidth || 2,
          name: obj.name,
          id: obj.id,
          data: { fieldId: obj.id }
        });
        
        canvas.add(line);
        canvas.setActiveObject(line);
        canvas.renderAll();
        return line;
      }
    } catch (error) {
      console.error('Error adding object to canvas:', error);
    }
  };
  
  // Add field to canvas (used when dropping from FieldsPanel)
  const addFieldToCanvas = (field: any) => {
    if (!fabricCanvasRef.current) return;
    
    // Find template field
    const templateField = templateFields.find(f => f.id === field.id);
    
    if (!templateField) {
      console.warn(`Template field not found for ID ${field.id}`);
      return;
    }
    
    // Create appropriate object based on field type
    const obj = {
      ...templateField,
      left: 100,
      top: 100,
      text: templateField.label,
      fontSize: 20,
      fontFamily: 'Arial',
      fill: '#000000'
    };
    
    addObjectToCanvas(obj, fabricCanvasRef.current);
  };
  
  // Save canvas state
  const saveCanvas = () => {
    if (!fabricCanvasRef.current || !onSave) return;
    
    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects().map(obj => {
      // Convert fabric objects to JSON
      const objData = obj.toJSON(['id', 'name', 'data']);
      
      // Get the field ID from the object's data
      const fieldId = obj.data?.fieldId;
      const templateField = templateFields.find(f => f.id === fieldId);
      
      return {
        ...objData,
        fieldId,
        fieldName: templateField?.name || '',
        fieldLabel: templateField?.label || ''
      };
    });
    
    onSave(canvas, objects);
  };
  
  return (
    <div 
      ref={setNodeRef} 
      className={`relative canvas-container border-2 rounded-lg ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      style={{ 
        width: canvasSize.width, 
        height: canvasSize.height,
        margin: '0 auto'
      }}
    >
      <canvas ref={canvasRef} />
      
      {/* Save button */}
      {onSave && (
        <button 
          className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm"
          onClick={saveCanvas}
        >
          حفظ التغييرات
        </button>
      )}
    </div>
  );
}