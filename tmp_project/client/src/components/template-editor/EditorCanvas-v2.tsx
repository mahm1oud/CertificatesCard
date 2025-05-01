import { useRef, useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { 
  fabric, 
  setupSelectionStyle, 
  addShadowToObject,
  updateObjectPositionByPercentage,
  getRelativePosition,
  objectToStorableJson,
  createObjectFromJson
} from '@/lib/fabric-utilities';

// ديباجر لتتبع مشاكل تحميل الكانفاس
const DEBUG = true;
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { 
  Save, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw,
  Eye,
  Grid3X3,
  Lock,
  Copy,
  Trash,
  MoreHorizontal,
  AlignHorizontalJustifyCenterIcon
} from 'lucide-react';

interface EditorCanvasProps {
  templateImage: string;
  templateFields: any[];
  initialObjects?: any[];
  onSave?: (canvas: fabric.Canvas, objects: any[]) => void;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  onObjectSelected?: (object: fabric.Object | null) => void;
  className?: string;
}

/**
 * مكون لوحة الرسم المحسن
 */
export function EditorCanvas({
  templateImage,
  templateFields = [],
  initialObjects = [],
  onSave,
  onCanvasReady,
  onObjectSelected,
  className
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  const [zoom, setZoom] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [smartGuides, setSmartGuides] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // إعداد منطقة الإفلات للسحب والإفلات
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-droppable',
  });
  
  // تهيئة canvas fabric عند تحميل المكون
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // إنشاء كائن canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: '#f8f9fa',
      stopContextMenu: true
    });
    
    fabricCanvasRef.current = canvas;
    
    // إعداد نمط التحديد
    setupSelectionStyle(canvas);
    
    // الاستماع لأحداث التحديد
    canvas.on('selection:created', (e) => {
      if (onObjectSelected) {
        onObjectSelected(canvas.getActiveObject());
      }
    });
    
    canvas.on('selection:updated', () => {
      if (onObjectSelected) {
        onObjectSelected(canvas.getActiveObject());
      }
    });
    
    canvas.on('selection:cleared', () => {
      if (onObjectSelected) {
        onObjectSelected(null);
      }
    });
    
    // تحميل صورة القالب
    fabric.Image.fromURL(templateImage, (img) => {
      // حساب النسبة
      const aspectRatio = img.width! / img.height!;
      let newWidth = canvas.width!;
      let newHeight = newWidth / aspectRatio;
      
      // إذا كان الارتفاع كبيراً جداً، قم بالتحجيم بناءً على الارتفاع
      if (newHeight > canvas.height!) {
        newHeight = canvas.height!;
        newWidth = newHeight * aspectRatio;
      }
      
      // ضبط أبعاد الكانفاس لتتطابق مع الصورة
      canvas.setWidth(newWidth);
      canvas.setHeight(newHeight);
      setCanvasSize({ width: newWidth, height: newHeight });
      
      // إضافة الصورة كخلفية
      img.set({
        scaleX: newWidth / img.width!,
        scaleY: newHeight / img.height!,
        selectable: false,
        evented: false,
      });
      
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      
      // تحميل الكائنات الأولية إذا تم توفيرها
      if (initialObjects && initialObjects.length > 0) {
        initialObjects.forEach(obj => {
          createObjectFromJson(obj, canvas);
        });
      }
      
      setLoading(false);
      
      // إعلام الأب أن الكانفاس جاهز
      if (onCanvasReady) {
        onCanvasReady(canvas);
      }
    });
    
    // التنظيف عند إزالة المكون
    return () => {
      canvas.dispose();
    };
  }, [templateImage, onObjectSelected, onCanvasReady]);
  
  // إضافة حقل إلى الكانفاس
  const addFieldToCanvas = (field: any) => {
    if (!fabricCanvasRef.current) return;
    
    // تحديد حقل القالب
    const templateField = templateFields.find(f => f.id === field.id);
    
    if (!templateField) {
      console.warn(`Template field not found for ID ${field.id}`);
      return;
    }
    
    // إنشاء كائن مناسب بناءً على نوع الحقل
    if (field.type === 'text' || field.type === 'textbox' || !field.type || field.type === 'email' || field.type === 'date') {
      const textObj = new fabric.Textbox(field.label, {
        left: 100,
        top: 100,
        fontSize: 20,
        fontFamily: 'Arial',
        fill: '#000000',
        textAlign: 'right',
        width: 200,
        name: field.name,
        id: field.id,
        data: { fieldId: field.id }
      });
      
      fabricCanvasRef.current.add(textObj);
      fabricCanvasRef.current.setActiveObject(textObj);
    } else if (field.type === 'image' || field.shapeType === 'image') {
      // إنشاء صورة افتراضية
      fabric.Image.fromURL('/placeholder-image.png', (img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
          name: field.name,
          id: field.id,
          data: { fieldId: field.id }
        });
        
        fabricCanvasRef.current!.add(img);
        fabricCanvasRef.current!.setActiveObject(img);
        fabricCanvasRef.current!.renderAll();
      });
      return;
    } else if (field.shapeType === 'rect') {
      // إنشاء مستطيل
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
      
      fabricCanvasRef.current.add(rect);
      fabricCanvasRef.current.setActiveObject(rect);
    } else if (field.shapeType === 'circle') {
      // إنشاء دائرة
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
      
      fabricCanvasRef.current.add(circle);
      fabricCanvasRef.current.setActiveObject(circle);
    } else if (field.shapeType === 'line') {
      // إنشاء خط
      const line = new fabric.Line([50, 50, 200, 50], {
        stroke: '#000000',
        strokeWidth: 2,
        name: field.name,
        id: field.id,
        data: { fieldId: field.id }
      });
      
      fabricCanvasRef.current.add(line);
      fabricCanvasRef.current.setActiveObject(line);
    }
    
    fabricCanvasRef.current.renderAll();
  };
  
  // رسم الشبكة على الكانفاس
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    // إعادة تعيين الشبكة على الكانفاس
    canvas.getObjects().forEach(obj => {
      if (obj.data?.isGridLine) {
        canvas.remove(obj);
      }
    });
    
    if (showGrid) {
      const width = canvasSize.width;
      const height = canvasSize.height;
      
      // رسم خطوط أفقية
      for (let i = 0; i <= height; i += gridSize) {
        const line = new fabric.Line([0, i, width, i], {
          stroke: '#dddddd',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          data: { isGridLine: true }
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }
      
      // رسم خطوط عمودية
      for (let i = 0; i <= width; i += gridSize) {
        const line = new fabric.Line([i, 0, i, height], {
          stroke: '#dddddd',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          data: { isGridLine: true }
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }
    }
    
    canvas.renderAll();
  }, [showGrid, gridSize, canvasSize]);
  
  // تفعيل الالتصاق بالشبكة
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const handleObjectMoving = (e: fabric.IEvent) => {
      if (!snapToGrid) return;
      
      const obj = e.target;
      if (!obj) return;
      
      // تقريب الموضع إلى أقرب خط شبكة
      const left = Math.round(obj.left! / gridSize) * gridSize;
      const top = Math.round(obj.top! / gridSize) * gridSize;
      
      obj.set({
        left: left,
        top: top
      });
    };
    
    canvas.on('object:moving', handleObjectMoving);
    
    return () => {
      canvas.off('object:moving', handleObjectMoving);
    };
  }, [snapToGrid, gridSize]);
  
  // تكبير الكانفاس
  const handleZoomIn = () => {
    if (!fabricCanvasRef.current) return;
    
    const newZoom = zoom + 10;
    setZoom(newZoom);
    fabricCanvasRef.current.setZoom(newZoom / 100);
    fabricCanvasRef.current.renderAll();
  };
  
  // تصغير الكانفاس
  const handleZoomOut = () => {
    if (!fabricCanvasRef.current) return;
    
    const newZoom = Math.max(10, zoom - 10);
    setZoom(newZoom);
    fabricCanvasRef.current.setZoom(newZoom / 100);
    fabricCanvasRef.current.renderAll();
  };
  
  // تدوير العنصر المحدد عكس عقارب الساعة
  const handleRotateLeft = () => {
    if (!fabricCanvasRef.current) return;
    
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (!activeObject) return;
    
    const currentAngle = activeObject.angle || 0;
    activeObject.set({ angle: currentAngle - 15 });
    fabricCanvasRef.current.renderAll();
  };
  
  // تدوير العنصر المحدد مع عقارب الساعة
  const handleRotateRight = () => {
    if (!fabricCanvasRef.current) return;
    
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (!activeObject) return;
    
    const currentAngle = activeObject.angle || 0;
    activeObject.set({ angle: currentAngle + 15 });
    fabricCanvasRef.current.renderAll();
  };
  
  // نسخ العنصر المحدد
  const handleDuplicate = () => {
    if (!fabricCanvasRef.current) return;
    
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (!activeObject) return;
    
    activeObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (activeObject.left || 0) + 20,
        top: (activeObject.top || 0) + 20,
      });
      
      fabricCanvasRef.current!.add(cloned);
      fabricCanvasRef.current!.setActiveObject(cloned);
      fabricCanvasRef.current!.renderAll();
    });
  };
  
  // حذف العنصر المحدد
  const handleDelete = () => {
    if (!fabricCanvasRef.current) return;
    
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (!activeObject) return;
    
    fabricCanvasRef.current.remove(activeObject);
    fabricCanvasRef.current.renderAll();
  };
  
  // حفظ تخطيط الكانفاس
  const handleSave = () => {
    if (!fabricCanvasRef.current || !onSave) return;
    
    const objects = fabricCanvasRef.current.getObjects()
      .filter(obj => !obj.data?.isGridLine)
      .map(obj => objectToStorableJson(obj));
    
    onSave(fabricCanvasRef.current, objects);
  };
  
  return (
    <div className={`${className || ''} relative`}>
      <div 
        ref={setNodeRef}
        className={`canvas-container border-2 rounded-lg overflow-hidden transition-colors ${
          isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        style={{ 
          width: canvasSize.width,
          height: canvasSize.height,
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* أدوات الكانفاس */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-2 z-10 bg-white bg-opacity-70 p-1 rounded-md shadow">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-7 w-7 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="text-xs font-medium w-12 text-center">
            {zoom}%
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-7 w-7 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className="h-7 px-2"
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            <span className="text-xs">الشبكة</span>
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="space-y-1 py-1">
                <div className="flex items-center mb-2">
                  <label className="text-xs flex-1">التصاق بالشبكة</label>
                  <Button
                    variant={snapToGrid ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className="h-6 w-6 p-0"
                  >
                    {snapToGrid ? <Lock className="h-3 w-3" /> : <Lock className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs">حجم الشبكة: {gridSize}px</label>
                  <Slider
                    value={[gridSize]}
                    min={5}
                    max={50}
                    step={5}
                    onValueChange={(values) => setGridSize(values[0])}
                  />
                </div>
                
                <div className="flex items-center mt-2">
                  <label className="text-xs flex-1">خطوط ذكية</label>
                  <Button
                    variant={smartGuides ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSmartGuides(!smartGuides)}
                    className="h-6 w-6 p-0"
                  >
                    {smartGuides ? <AlignHorizontalJustifyCenterIcon className="h-3 w-3" /> : <AlignHorizontalJustifyCenterIcon className="h-3 w-3 text-gray-400" />}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* أدوات العنصر المحدد */}
        <div className="absolute top-4 right-4 flex items-center space-x-2 rtl:space-x-reverse z-10 bg-white bg-opacity-70 p-1 rounded-md shadow">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotateLeft}
            className="h-7 w-7 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotateRight}
            className="h-7 w-7 p-0"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            className="h-7 w-7 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        
        {/* زر الحفظ */}
        {onSave && (
          <Button 
            className="absolute bottom-4 right-4 z-10 shadow"
            size="sm"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-1" />
            حفظ التغييرات
          </Button>
        )}
        
        {/* رسالة التحميل */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-2"></div>
              <p className="text-sm">جاري تحميل القالب...</p>
            </div>
          </div>
        )}
        
        <div
          ref={canvasWrapperRef}
          style={{ 
            width: '100%', 
            height: '100%',
            overflow: 'auto'
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}