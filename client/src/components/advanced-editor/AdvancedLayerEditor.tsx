/**
 * محرر الطبقات المتقدم
 * الإصدار 1.0 - مايو 2025
 * 
 * هذا مكون محرر متقدم للطبقات يسمح بتحرير الحقول كطبقات مستقلة
 * المميزات:
 * - دعم الطبقات المستقلة مع القدرة على تغيير ترتيب الحقول
 * - القدرة على وضع الحقول خلف أو أمام صورة القالب
 * - دعم المحاذاة والشبكة لدقة أكبر في وضع الحقول
 * - أدوات تحرير متقدمة لكل حقل (تدوير، تحجيم، إلخ)
 * - حفظ تلقائي للتغييرات مع دعم التراجع والإعادة
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Group, Text, Rect, Transformer, Line } from 'react-konva';
import {
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  Grid3X3, 
  Magnet, 
  Layers as LayersIcon,
  Download, 
  Undo, 
  Redo, 
  Eye, 
  EyeOff,
  Lock, 
  Unlock,
  Trash2,
  MoveVertical,
  Square,
  PanelTop,
  Settings
} from 'lucide-react';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { FieldPropertyHint } from '@/components/ui/field-property-hint';

// العرض المرجعي للتصميم
const BASE_IMAGE_WIDTH = 1000;

// الحد الأدنى والأقصى للتكبير/التصغير
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

// حجم الشبكة الافتراضي
const GRID_SIZE = 20;

// عدد خطوات التراجع المتاحة
const MAX_HISTORY_STEPS = 30;

// واجهة الحقل
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
  size?: { width: number; height: number };
}

// واجهة إعدادات المحرر
interface EditorSettings {
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
  templateImagePosition: 'back' | 'middle' | 'front';
  showRulers: boolean;
}

// واجهة خصائص المكون
interface AdvancedLayerEditorProps {
  templateImage: string;
  fields: FieldType[];
  onFieldsChange: (fields: FieldType[]) => void;
  editorSettings?: Partial<EditorSettings>;
  onSave?: () => void;
  readOnly?: boolean;
}

// دالة مساعدة لتنزيل الصورة
function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const AdvancedLayerEditor: React.FC<AdvancedLayerEditorProps> = ({
  templateImage,
  fields,
  onFieldsChange,
  editorSettings: userSettings,
  onSave,
  readOnly = false
}) => {
  // المراجع
  const stageRef = useRef<Konva.Stage>(null);
  const backgroundLayerRef = useRef<Konva.Layer>(null);
  const gridLayerRef = useRef<Konva.Layer>(null);
  const mainLayerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // دمج إعدادات المستخدم مع الإعدادات الافتراضية
  const defaultSettings: EditorSettings = {
    gridEnabled: true,
    snapToGrid: true,
    gridSize: GRID_SIZE,
    templateImagePosition: 'middle',
    showRulers: true
  };
  
  const [settings, setSettings] = useState<EditorSettings>({ ...defaultSettings, ...userSettings });
  
  // حالة المحرر
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 1000, height: 600 });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isTemplateImageVisible, setIsTemplateImageVisible] = useState<boolean>(true);
  const [templateImageLayer, setTemplateImageLayer] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [history, setHistory] = useState<FieldType[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const { toast } = useToast();
  
  // صورة القالب
  const [templateImageObj, setTemplateImageObj] = useState<HTMLImageElement | null>(null);
  const [isTemplateImageLoaded, setIsTemplateImageLoaded] = useState<boolean>(false);
  const [templateImageSize, setTemplateImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [templateImagePosition, setTemplateImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // تهيئة التاريخ عند تحميل الحقول لأول مرة
  useEffect(() => {
    if (fields.length > 0 && history.length === 0) {
      setHistory([[...fields]]);
      setHistoryIndex(0);
    }
  }, [fields, history.length]);
  
  // تحميل صورة القالب
  useEffect(() => {
    if (!templateImage) {
      setIsTemplateImageLoaded(false);
      setTemplateImageObj(null);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = templateImage;
    
    img.onload = () => {
      setTemplateImageObj(img);
      setIsTemplateImageLoaded(true);
      
      // حساب أبعاد الصورة الحقيقية مع الحفاظ على النسبة
      const aspectRatio = img.width / img.height;
      const width = BASE_IMAGE_WIDTH;
      const height = width / aspectRatio;
      
      setTemplateImageSize({ width, height });
      setTemplateImagePosition({ x: 0, y: 0 });
      setStageSize({ width, height });
      
      // اختيار طبقة صورة القالب بناء على الإعدادات
      const templatePosition = settings.templateImagePosition;
      const zIndices = fields.map(f => f.zIndex || 0);
      
      if (templatePosition === 'back') {
        // أقل من أصغر قيمة zIndex
        setTemplateImageLayer(Math.min(...zIndices, 0) - 1);
      } else if (templatePosition === 'front') {
        // أكبر من أكبر قيمة zIndex
        setTemplateImageLayer(Math.max(...zIndices, 0) + 1);
      } else {
        // في المنتصف - قيمة وسطية
        const minZ = Math.min(...zIndices, 0);
        const maxZ = Math.max(...zIndices, 0);
        setTemplateImageLayer(Math.floor((minZ + maxZ) / 2));
      }
    };
    
    img.onerror = () => {
      console.error('Error loading template image');
      setIsTemplateImageLoaded(false);
      setTemplateImageObj(null);
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [templateImage, fields, settings.templateImagePosition]);
  
  // ضبط مرجع المحول
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    
    // الحصول على العناصر المحددة
    const nodes = selectedIds.map(id => {
      return stageRef.current?.findOne(`#field-${id}`);
    }).filter(Boolean) as Konva.Node[];
    
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds]);
  
  // إنشاء حقل صورة القالب
  const templateField = React.useMemo(() => ({
    id: -1, // معرف خاص للقالب
    name: 'template_image',
    label: 'صورة القالب',
    type: 'template',
    position: templateImagePosition,
    zIndex: templateImageLayer,
    visible: isTemplateImageVisible,
    size: templateImageSize,
    rotation: 0,
    locked: true
  }), [templateImagePosition, templateImageLayer, templateImageSize, isTemplateImageVisible]);
  
  // دمج حقل صورة القالب مع بقية الحقول
  const allFields = React.useMemo(() => {
    if (isTemplateImageLoaded && templateImageObj) {
      return [templateField, ...fields];
    }
    return fields;
  }, [templateField, fields, isTemplateImageLoaded, templateImageObj]);
  
  // ترتيب الحقول حسب zIndex
  const sortedFields = React.useMemo(() => {
    return [...allFields].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [allFields]);
  
  // تغيير طبقة صورة القالب
  const moveTemplateImageLayer = useCallback((direction: 'up' | 'down') => {
    const newLayer = direction === 'up' 
      ? templateImageLayer + 1 
      : Math.max(templateImageLayer - 1, -10);
    
    setTemplateImageLayer(newLayer);
  }, [templateImageLayer]);
  
  // تغيير رؤية صورة القالب
  const toggleTemplateImageVisibility = useCallback(() => {
    setIsTemplateImageVisible(prev => !prev);
  }, []);
  
  // إضافة التغييرات للتاريخ
  const commitChanges = useCallback((updatedFields: FieldType[]) => {
    // حذف الأجزاء الأمامية من التاريخ إذا كنا في وسط التاريخ
    const newHistory = history.slice(0, historyIndex + 1);
    
    // إضافة الحالة الجديدة للتاريخ
    const newHistoryEntry = [...updatedFields];
    
    // احتفظ فقط بالحد الأقصى المسموح من خطوات التاريخ
    const newHistoryData = [...newHistory, newHistoryEntry].slice(-MAX_HISTORY_STEPS);
    
    setHistory(newHistoryData);
    setHistoryIndex(newHistoryData.length - 1);
    
    // تحديث الحقول
    onFieldsChange(updatedFields);
  }, [history, historyIndex, onFieldsChange]);
  
  // وظيفة التراجع
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevFields = history[prevIndex];
      
      setHistoryIndex(prevIndex);
      onFieldsChange(prevFields);
    }
  }, [history, historyIndex, onFieldsChange]);
  
  // وظيفة الإعادة
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextFields = history[nextIndex];
      
      setHistoryIndex(nextIndex);
      onFieldsChange(nextFields);
    }
  }, [history, historyIndex, onFieldsChange]);
  
  // تحديث إعدادات المحرر
  const updateSettings = useCallback((newSettings: Partial<EditorSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  // تجاذب إلى الشبكة
  const snapToGrid = useCallback((pos: { x: number; y: number }) => {
    if (!settings.snapToGrid) return pos;
    
    const gridSize = settings.gridSize;
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize
    };
  }, [settings.snapToGrid, settings.gridSize]);
  
  // إلغاء تحديد الحقول عند النقر على الخلفية
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // إذا كان النقر على المنصة نفسها (وليس على حقل)
    if (e.target === e.currentTarget) {
      setSelectedIds([]);
    }
  }, []);
  
  // معالجة عملية النقر المزدوج على حقل
  const handleFieldDoubleClick = useCallback((fieldId: number) => {
    // يمكن هنا تنفيذ سلوك خاص مثل فتح مربع حوار خصائص الحقل
    console.log('Field double clicked:', fieldId);
  }, []);
  
  // تحديد حقل
  const handleFieldSelect = useCallback((fieldId: number, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      // إضافة أو إزالة من التحديد المتعدد
      setSelectedIds(prev => 
        prev.includes(fieldId)
          ? prev.filter(id => id !== fieldId)
          : [...prev, fieldId]
      );
    } else {
      // تحديد الحقل فقط
      setSelectedIds([fieldId]);
    }
  }, []);
  
  // تغيير طبقة الحقل
  const moveFieldLayer = useCallback((fieldId: number, direction: 'up' | 'down') => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const currentZIndex = field.zIndex || 0;
    const newZIndex = direction === 'up' ? currentZIndex + 1 : currentZIndex - 1;
    
    const updatedFields = fields.map(f => 
      f.id === fieldId 
        ? { ...f, zIndex: newZIndex } 
        : f
    );
    
    commitChanges(updatedFields);
  }, [fields, commitChanges]);
  
  // تغيير رؤية الحقل
  const toggleFieldVisibility = useCallback((fieldId: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const updatedFields = fields.map(f => 
      f.id === fieldId 
        ? { ...f, visible: f.visible === false ? true : false } 
        : f
    );
    
    commitChanges(updatedFields);
  }, [fields, commitChanges]);
  
  // تغيير قفل الحقل
  const toggleFieldLock = useCallback((fieldId: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const updatedFields = fields.map(f => 
      f.id === fieldId 
        ? { ...f, locked: !f.locked } 
        : f
    );
    
    commitChanges(updatedFields);
  }, [fields, commitChanges]);
  
  // حذف الحقل
  const deleteField = useCallback((fieldId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحقل؟')) {
      const updatedFields = fields.filter(f => f.id !== fieldId);
      
      // إلغاء تحديد الحقل المحذوف
      setSelectedIds(prev => prev.filter(id => id !== fieldId));
      
      commitChanges(updatedFields);
    }
  }, [fields, commitChanges]);
  
  // نسخ الحقل
  const duplicateField = useCallback((fieldId: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    // توليد معرف جديد
    const newId = Math.max(0, ...fields.map(f => f.id)) + 1;
    
    // تعديل الموقع قليلاً للتمييز
    const newField = {
      ...field,
      id: newId,
      position: {
        x: field.position.x + 20,
        y: field.position.y + 20,
        snapToGrid: field.position.snapToGrid
      },
      name: `${field.name}_copy`
    };
    
    const updatedFields = [...fields, newField];
    commitChanges(updatedFields);
    
    // تحديد الحقل الجديد
    setSelectedIds([newId]);
  }, [fields, commitChanges]);
  
  // تصدير الصورة كملف
  const exportImage = useCallback(() => {
    if (!stageRef.current) return;
    
    // إخفاء المحول وإزالة التحديد مؤقتًا
    const selectedIdsBackup = [...selectedIds];
    setSelectedIds([]);
    
    // إخفاء طبقة الشبكة عند التصدير
    const gridLayerVisible = gridLayerRef.current?.visible();
    if (gridLayerRef.current) {
      gridLayerRef.current.visible(false);
    }
    
    // تأخير قصير لضمان تحديث الرسم
    setTimeout(() => {
      if (stageRef.current) {
        const dataUrl = stageRef.current.toDataURL({
          pixelRatio: 2,
          mimeType: 'image/png'
        });
        
        // استعادة رؤية الطبقات
        if (gridLayerRef.current) {
          gridLayerRef.current.visible(gridLayerVisible);
        }
        
        // استعادة التحديد
        setSelectedIds(selectedIdsBackup);
        
        // تحديد اسم الملف
        const date = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const fileName = `template-export-${date}.png`;
        
        // تنزيل الصورة
        downloadImage(dataUrl, fileName);
        
        toast({
          title: 'تم تصدير الصورة بنجاح',
          duration: 3000
        });
      }
    }, 100);
  }, [selectedIds, toast]);
  
  // نظام العرض المختلف للمكونات
  
  // عرض حقل نصي
  const renderTextField = useCallback((field: FieldType, index: number) => {
    // تجاهل الحقول المخفية
    if (field.visible === false) return null;
    
    const style = field.style || {};
    const text = field.defaultValue || field.label || field.placeholder || field.name;
    
    const fontSize = style.fontSize || 24;
    const fontFamily = style.fontFamily || 'Cairo';
    const fontWeight = style.fontWeight || 'normal';
    const color = style.color || '#000';
    const maxWidth = style.maxWidth || 300;
    const align = style.align || 'center';
    
    // تحقق من وجود ظل نصي
    const textShadow = style.textShadow;
    const hasShadow = textShadow?.enabled === true;
    const shadowColor = textShadow?.color || 'rgba(0,0,0,0.5)';
    const shadowBlur = textShadow?.blur || 4;
    const shadowOffsetX = textShadow?.offsetX || 2;
    const shadowOffsetY = textShadow?.offsetY || 2;
    
    return (
      <Group
        key={field.id}
        id={`field-${field.id}`}
        x={field.position.x}
        y={field.position.y}
        rotation={field.rotation || 0}
        draggable={!field.locked && !readOnly}
        onDragStart={() => {
          setIsDragging(true);
        }}
        onDragEnd={(e) => {
          setIsDragging(false);
          
          const pos = snapToGrid({
            x: e.target.x(),
            y: e.target.y()
          });
          
          const updatedFields = fields.map(f => 
            f.id === field.id 
              ? { ...f, position: pos } 
              : f
          );
          
          commitChanges(updatedFields);
        }}
        onClick={(e) => {
          // منع انتشار الحدث للمنصة
          e.cancelBubble = true;
          handleFieldSelect(field.id, e.evt.shiftKey);
        }}
        onTap={() => {
          handleFieldSelect(field.id, false);
        }}
        onDblClick={() => {
          handleFieldDoubleClick(field.id);
        }}
        onDblTap={() => {
          handleFieldDoubleClick(field.id);
        }}
      >
        {/* خلفية للنص لتسهيل التحديد */}
        <Rect
          width={maxWidth}
          height={fontSize * 1.5}
          fill="transparent"
          strokeEnabled={selectedIds.includes(field.id)}
          stroke="#3498db"
          strokeWidth={1}
          dash={[5, 5]}
          cornerRadius={4}
        />
        
        {/* النص الفعلي */}
        <Text
          text={text}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={fontWeight}
          fill={color}
          width={maxWidth}
          align={align}
          verticalAlign="middle"
          padding={10}
          wrap="word"
          shadowEnabled={hasShadow}
          shadowColor={shadowColor}
          shadowBlur={shadowBlur}
          shadowOffset={{ x: shadowOffsetX, y: shadowOffsetY }}
        />
        
        {/* مؤشر قفل الحقل */}
        {field.locked && (
          <Lock
            x={maxWidth - 16}
            y={-8}
            width={14}
            height={14}
            fill="#f0f0f0"
            stroke="#888"
          />
        )}
      </Group>
    );
  }, [fields, selectedIds, snapToGrid, handleFieldSelect, handleFieldDoubleClick, commitChanges, readOnly]);
  
  // عرض حقل صورة
  const renderImageField = useCallback((field: FieldType, index: number) => {
    // تجاهل الحقول المخفية
    if (field.visible === false) return null;
    
    const style = field.style || {};
    const maxWidth = style.imageMaxWidth || 200;
    const maxHeight = style.imageMaxHeight || 200;
    const imageRounded = style.imageRounded === true;
    const imageBorder = style.imageBorder === true;
    
    // إعدادات الظل
    const imageShadow = style.imageShadow;
    const hasShadow = imageShadow?.enabled === true;
    const shadowColor = imageShadow?.color || 'rgba(0,0,0,0.3)';
    const shadowBlur = imageShadow?.blur || 8;
    const shadowOffsetX = imageShadow?.offsetX || 4;
    const shadowOffsetY = imageShadow?.offsetY || 4;
    
    return (
      <Group
        key={field.id}
        id={`field-${field.id}`}
        x={field.position.x}
        y={field.position.y}
        rotation={field.rotation || 0}
        draggable={!field.locked && !readOnly}
        onDragStart={() => {
          setIsDragging(true);
        }}
        onDragEnd={(e) => {
          setIsDragging(false);
          
          const pos = snapToGrid({
            x: e.target.x(),
            y: e.target.y()
          });
          
          const updatedFields = fields.map(f => 
            f.id === field.id 
              ? { ...f, position: pos } 
              : f
          );
          
          commitChanges(updatedFields);
        }}
        onClick={(e) => {
          // منع انتشار الحدث للمنصة
          e.cancelBubble = true;
          handleFieldSelect(field.id, e.evt.shiftKey);
        }}
        onTap={() => {
          handleFieldSelect(field.id, false);
        }}
        onDblClick={() => {
          handleFieldDoubleClick(field.id);
        }}
        onDblTap={() => {
          handleFieldDoubleClick(field.id);
        }}
      >
        {/* مستطيل يمثل الصورة */}
        <Rect
          width={maxWidth}
          height={maxHeight}
          fill="#f0f0f0"
          stroke={imageBorder ? "#ddd" : "transparent"}
          strokeWidth={imageBorder ? 1 : 0}
          cornerRadius={imageRounded ? Math.min(maxWidth, maxHeight) / 5 : 4}
          shadowEnabled={hasShadow}
          shadowColor={shadowColor}
          shadowBlur={shadowBlur}
          shadowOffset={{ x: shadowOffsetX, y: shadowOffsetY }}
        />
        
        {/* نص "صورة" في حالة عدم وجود صورة فعلية */}
        <Text
          text="صورة"
          fontSize={14}
          fontFamily="Cairo"
          fill="#999"
          width={maxWidth}
          height={maxHeight}
          align="center"
          verticalAlign="middle"
        />
        
        {/* مؤشر قفل الحقل */}
        {field.locked && (
          <Lock
            x={maxWidth - 16}
            y={-8}
            width={14}
            height={14}
            fill="#f0f0f0"
            stroke="#888"
          />
        )}
      </Group>
    );
  }, [fields, selectedIds, snapToGrid, handleFieldSelect, handleFieldDoubleClick, commitChanges, readOnly]);
  
  // عرض حقل صورة القالب
  const renderTemplateImageField = useCallback((field: FieldType) => {
    if (!isTemplateImageLoaded || !templateImageObj || field.visible === false) return null;
    
    return (
      <Group
        key={field.id}
        id={`field-${field.id}`}
        x={field.position.x}
        y={field.position.y}
        draggable={false} // صورة القالب ثابتة
      >
        {/* خلفية بيضاء لتسهيل رؤية العناصر خلف القالب */}
        <Rect
          width={templateImageSize.width}
          height={templateImageSize.height}
          fill="#ffffff"
          stroke="#f0f0f0"
          strokeWidth={1}
        />
        
        {/* صورة القالب الفعلية */}
        <KonvaImage
          image={templateImageObj}
          width={templateImageSize.width}
          height={templateImageSize.height}
          listening={false} // تجاهل أحداث الماوس
        />
      </Group>
    );
  }, [isTemplateImageLoaded, templateImageObj, templateImageSize]);
  
  // عرض الشبكة
  const renderGrid = useCallback(() => {
    if (!settings.gridEnabled) return null;
    
    const gridSize = settings.gridSize;
    const lines = [];
    
    // خطوط أفقية
    for (let i = 0; i <= stageSize.height; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, stageSize.width, i]}
          stroke="#ddd"
          strokeWidth={0.5}
          dash={[2, 2]}
          listening={false}
        />
      );
    }
    
    // خطوط عمودية
    for (let i = 0; i <= stageSize.width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, stageSize.height]}
          stroke="#ddd"
          strokeWidth={0.5}
          dash={[2, 2]}
          listening={false}
        />
      );
    }
    
    return <>{lines}</>;
  }, [settings.gridEnabled, settings.gridSize, stageSize]);
  
  // عرض المساطر
  const renderRulers = useCallback(() => {
    if (!settings.showRulers) return null;
    
    const rulerSize = 20;
    const rulerStep = settings.gridSize;
    const rulerElements = [];
    
    // المسطرة الأفقية
    rulerElements.push(
      <Rect
        key="horizontal-ruler"
        x={0}
        y={0}
        width={stageSize.width}
        height={rulerSize}
        fill="#f9f9f9"
        stroke="#ddd"
        strokeWidth={0.5}
        listening={false}
      />
    );
    
    // المسطرة العمودية
    rulerElements.push(
      <Rect
        key="vertical-ruler"
        x={0}
        y={0}
        width={rulerSize}
        height={stageSize.height}
        fill="#f9f9f9"
        stroke="#ddd"
        strokeWidth={0.5}
        listening={false}
      />
    );
    
    // علامات المسطرة الأفقية
    for (let i = rulerStep; i <= stageSize.width; i += rulerStep) {
      // علامة
      rulerElements.push(
        <Line
          key={`h-mark-${i}`}
          points={[i, 0, i, i % (rulerStep * 5) === 0 ? rulerSize : rulerSize / 2]}
          stroke="#999"
          strokeWidth={0.5}
          listening={false}
        />
      );
      
      // أرقام للعلامات الرئيسية
      if (i % (rulerStep * 5) === 0) {
        rulerElements.push(
          <Text
            key={`h-text-${i}`}
            x={i - 10}
            y={3}
            text={`${i}`}
            fontSize={8}
            fontFamily="sans-serif"
            fill="#666"
            align="center"
            width={20}
            listening={false}
          />
        );
      }
    }
    
    // علامات المسطرة العمودية
    for (let i = rulerStep; i <= stageSize.height; i += rulerStep) {
      // علامة
      rulerElements.push(
        <Line
          key={`v-mark-${i}`}
          points={[0, i, i % (rulerStep * 5) === 0 ? rulerSize : rulerSize / 2, i]}
          stroke="#999"
          strokeWidth={0.5}
          listening={false}
        />
      );
      
      // أرقام للعلامات الرئيسية
      if (i % (rulerStep * 5) === 0) {
        rulerElements.push(
          <Text
            key={`v-text-${i}`}
            x={2}
            y={i - 4}
            text={`${i}`}
            fontSize={8}
            fontFamily="sans-serif"
            fill="#666"
            width={16}
            listening={false}
          />
        );
      }
    }
    
    // زاوية تقاطع المساطر
    rulerElements.push(
      <Rect
        key="ruler-corner"
        x={0}
        y={0}
        width={rulerSize}
        height={rulerSize}
        fill="#f0f0f0"
        stroke="#ddd"
        strokeWidth={0.5}
        listening={false}
      />
    );
    
    return <>{rulerElements}</>;
  }, [settings.showRulers, settings.gridSize, stageSize]);
  
  // معالجة انتهاء التحويل
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    setIsTransforming(false);
    
    const node = e.target;
    const id = parseInt(node.id().replace('field-', ''));
    
    // البحث عن الحقل المحدد
    const field = fields.find(f => f.id === id);
    if (!field) return;
    
    // تحديث موضع وتدوير الحقل
    const updatedFields = fields.map(f => {
      if (f.id === id) {
        const newPosition = { x: node.x(), y: node.y() };
        const snappedPosition = settings.snapToGrid ? snapToGrid(newPosition) : newPosition;
        
        return {
          ...f,
          position: snappedPosition,
          rotation: Math.round(node.rotation())
        };
      }
      return f;
    });
    
    commitChanges(updatedFields);
  }, [fields, settings.snapToGrid, snapToGrid, commitChanges]);
  
  // مكون لوحة الطبقات
  const LayersPanel = () => {
    // ترتيب الحقول للعرض في لوحة الطبقات (من الأعلى إلى الأسفل)
    const layersSortedFields = [...allFields].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    const [hoveredLayerId, setHoveredLayerId] = useState<number | null>(null);
    
    return (
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-2 space-y-1">
          {layersSortedFields.map(field => (
            <div
              key={field.id}
              className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                selectedIds.includes(field.id)
                  ? 'bg-primary/15 border border-primary/30'
                  : hoveredLayerId === field.id
                  ? 'bg-secondary/20 border border-secondary/20'
                  : 'hover:bg-accent border border-transparent'
              }`}
              onClick={() => handleFieldSelect(field.id, false)}
              onMouseEnter={() => setHoveredLayerId(field.id)}
              onMouseLeave={() => setHoveredLayerId(null)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 p-0 ${field.visible === false ? 'text-muted-foreground' : 'text-foreground'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (field.id === -1) {
                        toggleTemplateImageVisibility();
                      } else {
                        toggleFieldVisibility(field.id);
                      }
                    }}
                    title={field.visible === false ? 'إظهار الطبقة' : 'إخفاء الطبقة'}
                    disabled={readOnly}
                  >
                    {field.visible === false ? <Eye size={14} /> : <EyeOff size={14} />}
                  </Button>
                  
                  {field.type === 'text' && <Text as="div" size={14} className="text-blue-500" />}
                  {field.type === 'image' && <Square size={14} className="text-green-500" />}
                  {field.type === 'template' && <PanelTop size={14} className="text-purple-500" />}
                  
                  <span className="text-xs font-medium truncate">
                    {field.type === 'template' ? 'صورة القالب' : field.label || field.name}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-2 py-0 bg-secondary/10">
                  z:{field.zIndex || 0}
                </Badge>
                
                {field.id !== -1 && (
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveFieldLayer(field.id, 'up');
                      }}
                      title="نقل الطبقة للأعلى"
                      disabled={readOnly}
                    >
                      <MoveVertical size={12} />
                    </Button>
                  </div>
                )}
                
                {field.id === -1 && (
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTemplateImageLayer('up');
                      }}
                      title="رفع طبقة صورة القالب"
                      disabled={readOnly}
                    >
                      <MoveVertical size={12} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };
  
  // مكون لوحة الخصائص
  const PropertiesPanel = () => {
    // الحصول على الحقل المحدد
    const selectedField = React.useMemo(() => {
      if (selectedIds.length !== 1) return null;
      return fields.find(f => f.id === selectedIds[0]) || null;
    }, [selectedIds, fields]);
    
    // إذا لم يكن هناك حقل محدد
    if (!selectedField) {
      return (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4 text-center">
            <p className="text-muted-foreground">قم بتحديد حقل لعرض خصائصه</p>
          </div>
        </ScrollArea>
      );
    }
    
    // تحديث خصائص الحقل
    const updateFieldProperty = (property: string, value: any) => {
      if (!selectedField) return;
      
      const updatedFields = fields.map(field => 
        field.id === selectedField.id 
          ? { ...field, [property]: value } 
          : field
      );
      
      commitChanges(updatedFields);
    };
    
    // تحديث style في الحقل
    const updateFieldStyle = (styleProperty: string, value: any) => {
      if (!selectedField) return;
      
      const updatedFields = fields.map(field => 
        field.id === selectedField.id 
          ? { 
              ...field, 
              style: { 
                ...field.style, 
                [styleProperty]: value 
              } 
            } 
          : field
      );
      
      commitChanges(updatedFields);
    };
    
    // تحديث ظل النص
    const updateTextShadow = (shadowProperty: string, value: any) => {
      if (!selectedField) return;
      
      const currentShadow = selectedField.style?.textShadow || { enabled: false };
      
      const updatedFields = fields.map(field => 
        field.id === selectedField.id 
          ? { 
              ...field, 
              style: { 
                ...field.style, 
                textShadow: { 
                  ...currentShadow, 
                  [shadowProperty]: value 
                } 
              } 
            } 
          : field
      );
      
      commitChanges(updatedFields);
    };
    
    // تحديث موضع الحقل
    const updatePosition = (positionData: any) => {
      if (!selectedField) return;
      
      const updatedFields = fields.map(field => 
        field.id === selectedField.id 
          ? { 
              ...field, 
              position: { 
                ...field.position, 
                x: positionData.x !== undefined ? positionData.x : field.position.x,
                y: positionData.y !== undefined ? positionData.y : field.position.y
              } 
            } 
          : field
      );
      
      commitChanges(updatedFields);
    };
    
    return (
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4 space-y-4">
          <div className="border rounded-md p-3 bg-muted/10">
            <h3 className="text-lg font-semibold mb-1">{selectedField.label || selectedField.name}</h3>
            <p className="text-sm text-muted-foreground">
              النوع: {selectedField.type === 'text' ? 'نص' : selectedField.type === 'image' ? 'صورة' : 'غير معروف'}
            </p>
          </div>
          
          {/* طبقة الحقل */}
          <FieldPropertyHint
            propertyType="layer"
            currentValue={{ zIndex: selectedField.zIndex || 0 }}
            onChange={(value) => updateFieldProperty('zIndex', value.zIndex)}
            hint="ضبط طبقة العنصر لتحديد ما إذا كان أمام أو خلف العناصر الأخرى. القيم الأعلى تظهر أمام القيم الأقل."
          />
          
          {/* موضع الحقل */}
          <FieldPropertyHint
            propertyType="position"
            currentValue={{ 
              x: selectedField.position ? selectedField.position.x / 10 : 50, 
              y: selectedField.position ? selectedField.position.y / 10 : 50 
            }}
            onChange={(value) => updatePosition({ 
              x: value.x * 10, 
              y: value.y * 10 
            })}
            hint="ضبط موضع العنصر على القالب (النسب مئوية من أبعاد القالب)"
          />
          
          {/* تدوير الحقل */}
          <FieldPropertyHint
            propertyType="rotation"
            currentValue={{ rotation: selectedField.rotation || 0 }}
            onChange={(value) => updateFieldProperty('rotation', value.rotation)}
            hint="ضبط زاوية دوران العنصر. 0 درجة هي الوضع الطبيعي."
          />
          
          {/* خصائص الخط - للنصوص فقط */}
          {selectedField.type === 'text' && (
            <FieldPropertyHint
              propertyType="font"
              currentValue={{ 
                fontFamily: selectedField.style?.fontFamily || 'Cairo', 
                fontSize: selectedField.style?.fontSize || 24, 
                fontWeight: selectedField.style?.fontWeight || 'normal', 
                color: selectedField.style?.color || '#000000',
                align: selectedField.style?.align || 'center'
              }}
              onChange={(value) => {
                updateFieldStyle('fontFamily', value.fontFamily);
                updateFieldStyle('fontSize', value.fontSize);
                updateFieldStyle('fontWeight', value.fontWeight);
                updateFieldStyle('color', value.color);
                updateFieldStyle('align', value.align);
              }}
              hint="ضبط خصائص الخط مثل النوع والحجم واللون والمحاذاة"
              previewText={selectedField.defaultValue || selectedField.label || selectedField.name}
            />
          )}
          
          {/* خصائص الظل - للنصوص فقط */}
          {selectedField.type === 'text' && (
            <FieldPropertyHint
              propertyType="shadow"
              currentValue={{ 
                textShadow: selectedField.style?.textShadow || { enabled: false } 
              }}
              onChange={(value) => {
                updateFieldStyle('textShadow', value.textShadow);
              }}
              hint="ضبط خصائص ظل النص، مثل اللون والتمويه والإزاحة"
              previewText={selectedField.defaultValue || selectedField.label || selectedField.name}
            />
          )}
          
          {/* خصائص أبعاد الحقل - للصور فقط */}
          {selectedField.type === 'image' && (
            <FieldPropertyHint
              propertyType="size"
              currentValue={{ 
                width: selectedField.style?.imageMaxWidth || 50, 
                height: selectedField.style?.imageMaxHeight || 50 
              }}
              onChange={(value) => {
                updateFieldStyle('imageMaxWidth', value.width);
                updateFieldStyle('imageMaxHeight', value.height);
              }}
              hint="ضبط أبعاد الصورة كنسبة مئوية من أبعاد القالب"
            />
          )}
          
          <div className="border rounded-md p-3 bg-muted/10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="field-visible">إظهار الحقل</Label>
                <Switch
                  id="field-visible"
                  checked={selectedField.visible !== false}
                  onCheckedChange={(checked) => updateFieldProperty('visible', checked)}
                  disabled={readOnly}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="field-locked">قفل الحقل</Label>
                <Switch
                  id="field-locked"
                  checked={selectedField.locked === true}
                  onCheckedChange={(checked) => updateFieldProperty('locked', checked)}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  // مكون لوحة الإعدادات
  const SettingsPanel = () => {
    return (
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4 space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">إعدادات المحرر</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="grid-enabled">إظهار الشبكة</Label>
                <Switch
                  id="grid-enabled"
                  checked={settings.gridEnabled}
                  onCheckedChange={(checked) => updateSettings({ gridEnabled: checked })}
                  disabled={readOnly}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="snap-to-grid">التصاق بالشبكة</Label>
                <Switch
                  id="snap-to-grid"
                  checked={settings.snapToGrid}
                  onCheckedChange={(checked) => updateSettings({ snapToGrid: checked })}
                  disabled={readOnly}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-rulers">إظهار المساطر</Label>
                <Switch
                  id="show-rulers"
                  checked={settings.showRulers}
                  onCheckedChange={(checked) => updateSettings({ showRulers: checked })}
                  disabled={readOnly}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="grid-size">حجم الشبكة: {settings.gridSize}px</Label>
              <Slider
                id="grid-size"
                min={5}
                max={50}
                step={5}
                value={[settings.gridSize]}
                onValueChange={(value) => updateSettings({ gridSize: value[0] })}
                disabled={readOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-position">موضع صورة القالب</Label>
              <div className="flex justify-between gap-2">
                <Button
                  variant={settings.templateImagePosition === 'back' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => updateSettings({ templateImagePosition: 'back' })}
                  className="flex-1"
                  disabled={readOnly}
                >
                  خلف الحقول
                </Button>
                <Button
                  variant={settings.templateImagePosition === 'middle' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => updateSettings({ templateImagePosition: 'middle' })}
                  className="flex-1"
                  disabled={readOnly}
                >
                  وسط
                </Button>
                <Button
                  variant={settings.templateImagePosition === 'front' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => updateSettings({ templateImagePosition: 'front' })}
                  className="flex-1"
                  disabled={readOnly}
                >
                  أمام الحقول
                </Button>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">إعدادات صورة القالب</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="template-visibility">إظهار صورة القالب</Label>
                  <Switch
                    id="template-visibility"
                    checked={isTemplateImageVisible}
                    onCheckedChange={toggleTemplateImageVisibility}
                    disabled={readOnly}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="template-layer">طبقة صورة القالب: {templateImageLayer}</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveTemplateImageLayer('down')}
                        disabled={readOnly}
                      >
                        <RotateCcw size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveTemplateImageLayer('up')}
                        disabled={readOnly}
                      >
                        <RotateCw size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };
  
  // مكون الميزات
  return (
    <div className="flex flex-col h-full bg-background">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap gap-2 p-2 bg-card border-b">
        {/* أدوات التكبير/التصغير */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setScale(prev => Math.max(MIN_SCALE, prev - 0.1))}
                  disabled={scale <= MIN_SCALE}
                >
                  <ZoomOut size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تصغير</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
          >
            {Math.round(scale * 100)}%
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setScale(prev => Math.min(MAX_SCALE, prev + 0.1))}
                  disabled={scale >= MAX_SCALE}
                >
                  <ZoomIn size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تكبير</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* أدوات التراجع/الإعادة */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0 || readOnly}
                >
                  <Undo size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تراجع</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1 || readOnly}
                >
                  <Redo size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>إعادة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* أدوات الشبكة */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={settings.gridEnabled ? 'secondary' : 'outline'}
                  size="icon"
                  onClick={() => updateSettings({ gridEnabled: !settings.gridEnabled })}
                >
                  <Grid3X3 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>إظهار/إخفاء الشبكة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={settings.snapToGrid ? 'secondary' : 'outline'}
                  size="icon"
                  onClick={() => updateSettings({ snapToGrid: !settings.snapToGrid })}
                  disabled={readOnly}
                >
                  <Magnet size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>التصاق بالشبكة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* أدوات صورة القالب */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isTemplateImageVisible ? 'outline' : 'secondary'}
                  size="icon"
                  onClick={toggleTemplateImageVisibility}
                  disabled={readOnly}
                >
                  {isTemplateImageVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTemplateImageVisible ? 'إخفاء صورة القالب' : 'إظهار صورة القالب'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveTemplateImageLayer('down')}
                  disabled={readOnly}
                >
                  <RotateCcw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>خفض طبقة صورة القالب</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveTemplateImageLayer('up')}
                  disabled={readOnly}
                >
                  <RotateCw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>رفع طبقة صورة القالب</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {/* أدوات أخرى */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={exportImage}
                >
                  <Download size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تصدير كصورة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {onSave && (
            <Button onClick={onSave} disabled={readOnly}>
              حفظ التغييرات
            </Button>
          )}
        </div>
      </div>
      
      {/* الجزء الرئيسي */}
      <div className="flex flex-1 overflow-hidden">
        {/* منطقة الرسم */}
        <div className="flex-1 overflow-hidden bg-slate-100" ref={containerRef}>
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scale={{ x: scale, y: scale }}
            position={position}
            draggable={!isDragging && !isTransforming}
            onDragStart={(e) => {
              if (e.target !== e.currentTarget) return;
              document.body.style.cursor = 'grabbing';
            }}
            onDragEnd={() => {
              document.body.style.cursor = 'default';
            }}
            onClick={handleStageClick}
            onWheel={(e) => {
              // التكبير/التصغير باستخدام عجلة الفأرة
              e.evt.preventDefault();
              
              const scaleBy = 1.1;
              const oldScale = scale;
              
              const pointer = stageRef.current?.getPointerPosition();
              if (!pointer) return;
              
              const mousePointTo = {
                x: (pointer.x - position.x) / oldScale,
                y: (pointer.y - position.y) / oldScale
              };
              
              // حساب المقياس الجديد مع مراعاة الحدود
              const newScale = e.evt.deltaY < 0 
                ? Math.min(oldScale * scaleBy, MAX_SCALE) 
                : Math.max(oldScale / scaleBy, MIN_SCALE);
              
              // حساب الموضع الجديد
              const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale
              };
              
              setPosition(newPos);
              setScale(newScale);
            }}
          >
            {/* طبقة الخلفية */}
            <Layer ref={backgroundLayerRef}>
              {/* خلفية بيضاء بحجم المنصة */}
              <Rect
                x={0}
                y={0}
                width={stageSize.width}
                height={stageSize.height}
                fill="#ffffff"
              />
            </Layer>
            
            {/* طبقة الشبكة */}
            <Layer ref={gridLayerRef}>
              {renderGrid()}
              {renderRulers()}
            </Layer>
            
            {/* طبقة الحقول الرئيسية */}
            <Layer ref={mainLayerRef}>
              {/* الحقول مرتبة حسب zIndex */}
              {sortedFields.map((field, index) => {
                if (field.type === 'template') {
                  return renderTemplateImageField(field);
                } else if (field.type === 'text') {
                  return renderTextField(field, index);
                } else if (field.type === 'image') {
                  return renderImageField(field, index);
                }
                return null;
              })}
              
              {/* محول كونفا لتغيير حجم وتدوير الحقول المحددة */}
              <Transformer
                ref={transformerRef}
                rotateEnabled={!readOnly}
                enabledAnchors={['middle-left', 'middle-right', 'top-center', 'bottom-center']}
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                boundBoxFunc={(oldBox, newBox) => {
                  // منع التحويل إلى قيمة سالبة
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
                onTransformStart={() => {
                  setIsTransforming(true);
                }}
                onTransformEnd={handleTransformEnd}
              />
            </Layer>
          </Stage>
          
          {/* معلومات الحقل المحدد */}
          {selectedIds.length > 0 && (
            <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded shadow-sm text-xs border">
              {selectedIds.length === 1 ? (
                <>
                  <span className="font-semibold">{fields.find(f => f.id === selectedIds[0])?.name}</span>
                  <span className="mx-1">·</span>
                  <span>الموضع: {Math.round(fields.find(f => f.id === selectedIds[0])?.position.x || 0)}, {Math.round(fields.find(f => f.id === selectedIds[0])?.position.y || 0)}</span>
                  {fields.find(f => f.id === selectedIds[0])?.rotation ? (
                    <>
                      <span className="mx-1">·</span>
                      <span>الدوران: {Math.round(fields.find(f => f.id === selectedIds[0])?.rotation || 0)}°</span>
                    </>
                  ) : null}
                </>
              ) : (
                <span>{selectedIds.length} عناصر محددة</span>
              )}
            </div>
          )}
        </div>
        
        {/* القائمة الجانبية */}
        <div className="w-72 border-r bg-card flex flex-col">
          <Tabs defaultValue="layers" className="flex-1 flex flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="layers" className="flex-1">
                <LayersIcon className="h-4 w-4 mr-2" />
                الطبقات
              </TabsTrigger>
              <TabsTrigger value="properties" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                الخصائص
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                <Grid3X3 className="h-4 w-4 mr-2" />
                الإعدادات
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="layers" className="flex-1 overflow-hidden p-0">
              <LayersPanel />
            </TabsContent>
            
            <TabsContent value="properties" className="flex-1 overflow-hidden p-0">
              <PropertiesPanel />
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 overflow-hidden p-0">
              <SettingsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};