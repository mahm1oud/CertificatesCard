/**
 * مكون إدارة الطبقات - يحاكي نظام فوتوشوب لإدارة الطبقات
 * الإصدار 2.0 - مايو 2025
 * 
 * هذا المكون يعرض قائمة بجميع الطبقات (الحقول + صورة القالب)
 * ويسمح بتغيير ترتيبها، إخفائها، تحديدها، وتأمينها
 * 
 * ميزات هذا المكون:
 * - عرض جميع الطبقات مع أيقونات تدل على نوع الطبقة (نص، صورة، الخ)
 * - إمكانية تغيير ترتيب الطبقات (Z-index) بسحبها وإفلاتها
 * - تمييز الطبقة المحددة بلون خاص
 * - إمكانية إخفاء/إظهار الطبقات
 * - إمكانية تأمين/إلغاء تأمين الطبقات لمنع التعديل العرضي
 * - زر لتغيير اسم الطبقة
 * - تسمية افتراضية واضحة للعناصر
 */

import React, { useState, useEffect } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult
} from 'react-beautiful-dnd';
import {
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Edit, 
  Trash2, 
  Move, 
  Image, 
  Type, 
  GripVertical, 
  ChevronUp, 
  ChevronDown,
  MoreHorizontal,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * واجهة الحقل المتوقع من مكون إدارة الطبقات
 * تتوافق مع واجهة DraggableFieldsPreviewPro
 */
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
  locked?: boolean;
  rotation?: number;
  size?: { width: number; height: number };
  // حقول إضافية
  templateId?: number;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  placeholderAr?: string;
}

/**
 * واجهة خصائص مكون إدارة الطبقات
 */
interface LayersManagerProps {
  fields: FieldType[];
  selectedFieldId: number | null;
  onFieldSelect: (id: number | null) => void;
  onFieldsChange: (fields: FieldType[]) => void;
  onDeleteField?: (id: number) => void;
  className?: string;
  collapsible?: boolean;
  initiallyCollapsed?: boolean;
}

/**
 * مكون إدارة الطبقات
 */
export const LayersManager: React.FC<LayersManagerProps> = ({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldsChange,
  onDeleteField,
  className,
  collapsible = true,
  initiallyCollapsed = false
}) => {
  // حالة انهيار/توسيع لوحة الطبقات
  const [collapsed, setCollapsed] = useState<boolean>(initiallyCollapsed);
  
  // حالة تعديل اسم الطبقة
  const [editingLayerName, setEditingLayerName] = useState<{id: number, name: string} | null>(null);
  
  // الحقول مرتبة حسب الـ zIndex
  const sortedFields = [...fields].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  
  // التعامل مع نهاية عملية السحب وإعادة الترتيب
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // نسخ مصفوفة الحقول المرتبة
    const reorderedFields = [...sortedFields];
    
    // إزالة العنصر من موضعه القديم
    const [removed] = reorderedFields.splice(source.index, 1);
    
    // إضافة العنصر في موضعه الجديد
    reorderedFields.splice(destination.index, 0, removed);
    
    // تحديث قيم zIndex بناءً على الترتيب الجديد
    const updatedFields = reorderedFields.map((field, index) => ({
      ...field,
      zIndex: index
    }));
    
    // استدعاء التابع الذي يعالج تغيير الحقول
    onFieldsChange(updatedFields);
  };
  
  // تحديث رؤية الطبقة
  const toggleVisibility = (id: number) => {
    const updatedFields = fields.map(field => 
      field.id === id 
        ? { ...field, visible: field.visible === false ? true : false } 
        : field
    );
    onFieldsChange(updatedFields);
  };
  
  // تأمين/إلغاء تأمين الطبقة
  const toggleLock = (id: number) => {
    const updatedFields = fields.map(field => 
      field.id === id 
        ? { ...field, locked: field.locked === true ? false : true } 
        : field
    );
    onFieldsChange(updatedFields);
  };
  
  // حذف طبقة
  const deleteLayer = (id: number) => {
    // فقط اذا كان الحقل ليس صورة القالب (id === -1)
    if (id !== -1 && onDeleteField) {
      onDeleteField(id);
    }
  };
  
  // تحريك الطبقة لأعلى
  const moveLayerUp = (id: number) => {
    const fieldIndex = sortedFields.findIndex(f => f.id === id);
    if (fieldIndex > 0) {
      const newFields = [...sortedFields];
      // تبديل الطبقة الحالية مع الطبقة أعلاها
      [newFields[fieldIndex], newFields[fieldIndex - 1]] = 
      [newFields[fieldIndex - 1], newFields[fieldIndex]];
      
      // تحديث الـ zIndex
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        zIndex: index
      }));
      
      onFieldsChange(updatedFields);
    }
  };
  
  // تحريك الطبقة لأسفل
  const moveLayerDown = (id: number) => {
    const fieldIndex = sortedFields.findIndex(f => f.id === id);
    if (fieldIndex < sortedFields.length - 1) {
      const newFields = [...sortedFields];
      // تبديل الطبقة الحالية مع الطبقة أسفلها
      [newFields[fieldIndex], newFields[fieldIndex + 1]] = 
      [newFields[fieldIndex + 1], newFields[fieldIndex]];
      
      // تحديث الـ zIndex
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        zIndex: index
      }));
      
      onFieldsChange(updatedFields);
    }
  };
  
  // حفظ الاسم المعدل للطبقة
  const saveLayerName = () => {
    if (editingLayerName) {
      const { id, name } = editingLayerName;
      const updatedFields = fields.map(field => 
        field.id === id ? { ...field, label: name, labelAr: name } : field
      );
      onFieldsChange(updatedFields);
      setEditingLayerName(null);
    }
  };
  
  // تحديد رمز مناسب لنوع الطبقة
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'template':
        return <Image className="w-4 h-4 text-blue-500" />;
      case 'image':
        return <Image className="w-4 h-4 text-purple-500" />;
      case 'text':
      default:
        return <Type className="w-4 h-4 text-emerald-500" />;
    }
  };
  
  // الحصول على اسم مناسب للعرض
  const getDisplayName = (field: FieldType) => {
    // استخدام label أو labelAr إذا كان متوفرًا
    if (field.label) return field.label;
    if (field.labelAr) return field.labelAr;
    
    // صياغة اسم مناسب بناءً على نوع الحقل
    if (field.type === 'template') return 'صورة القالب';
    if (field.type === 'image') return `صورة ${field.id}`;
    if (field.type === 'text') return `نص ${field.id}`;
    
    // استخدام الاسم التقني في حالة عدم توفر خيار أفضل
    return field.name;
  };
  
  return (
    <div 
      className={cn(
        "layers-manager border rounded-md overflow-hidden bg-white",
        className
      )}
    >
      {/* رأس لوحة الطبقات مع زر الطي/التوسيع */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Layers className="w-4 h-4" />
          <h3 className="text-sm font-medium">الطبقات</h3>
        </div>
        
        {collapsible && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronUp className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      {/* محتوى لوحة الطبقات */}
      {!collapsed && (
        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
          {sortedFields.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              لا توجد طبقات
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="droppable-layers">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="p-1 space-y-1"
                  >
                    {sortedFields.map((field, index) => (
                      <Draggable
                        key={field.id.toString()}
                        draggableId={field.id.toString()}
                        index={index}
                        isDragDisabled={field.locked}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "layer-item px-2 py-1.5 rounded-sm flex items-center justify-between text-sm",
                              selectedFieldId === field.id ? "bg-blue-100" : "bg-gray-50 hover:bg-gray-100",
                              snapshot.isDragging ? "opacity-70 shadow-md" : "",
                              field.locked ? "opacity-70" : "",
                              !field.visible ? "opacity-50" : ""
                            )}
                            onClick={() => onFieldSelect(field.id)}
                          >
                            {/* معلومات الطبقة الأساسية */}
                            <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-hidden">
                              <div 
                                {...provided.dragHandleProps}
                                className="cursor-move flex-shrink-0"
                              >
                                <GripVertical className="w-3 h-3 text-gray-400" />
                              </div>
                              
                              <span className="flex-shrink-0">
                                {getLayerIcon(field.type)}
                              </span>
                              
                              {editingLayerName?.id === field.id ? (
                                <Input
                                  className="h-5 py-0 text-xs max-w-[100px]"
                                  value={editingLayerName.name}
                                  onChange={(e) => setEditingLayerName({
                                    id: field.id,
                                    name: e.target.value
                                  })}
                                  onBlur={saveLayerName}
                                  onKeyDown={(e) => e.key === 'Enter' && saveLayerName()}
                                  autoFocus
                                />
                              ) : (
                                <span className="truncate">
                                  {getDisplayName(field)}
                                </span>
                              )}
                            </div>
                            
                            {/* أزرار التحكم في الطبقة */}
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleVisibility(field.id);
                                      }}
                                    >
                                      {field.visible === false ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{field.visible === false ? 'إظهار' : 'إخفاء'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLock(field.id);
                                      }}
                                    >
                                      {field.locked ? (
                                        <Lock className="h-3 w-3" />
                                      ) : (
                                        <Unlock className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{field.locked ? 'إلغاء تأمين' : 'تأمين'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>خيارات الطبقة</DropdownMenuLabel>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingLayerName({
                                        id: field.id,
                                        name: getDisplayName(field)
                                      });
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>تغيير الاسم</span>
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveLayerUp(field.id);
                                    }}
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="mr-2 h-4 w-4" />
                                    <span>تحريك لأعلى</span>
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveLayerDown(field.id);
                                    }}
                                    disabled={index === sortedFields.length - 1}
                                  >
                                    <ChevronDown className="mr-2 h-4 w-4" />
                                    <span>تحريك لأسفل</span>
                                  </DropdownMenuItem>
                                  
                                  {field.id !== -1 && (
                                    <>
                                      <DropdownMenuSeparator />
                                      
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteLayer(field.id);
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>حذف</span>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      )}
    </div>
  );
};

export default LayersManager;
