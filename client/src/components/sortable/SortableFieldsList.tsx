import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUp, ArrowDown, Move, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TemplateField {
  id: number;
  name: string;
  label: string;
  type: string;
  displayOrder: number;
  [key: string]: any;
}

interface SortableFieldsListProps {
  isOpen: boolean;
  onClose: () => void;
  fields: TemplateField[];
  onSave: (updatedFields: TemplateField[]) => void;
  title?: string;
  description?: string;
}

export function SortableFieldsList({
  isOpen,
  onClose,
  fields,
  onSave,
  title = "ترتيب حقول القالب",
  description = "يمكنك سحب وإفلات الحقول لتغيير ترتيبها، أو استخدام أزرار الأسهم للتحريك لأعلى أو لأسفل."
}: SortableFieldsListProps) {
  // نسخة من الحقول يمكن تعديلها
  const [orderedFields, setOrderedFields] = useState<TemplateField[]>([]);
  
  // حالة التحميل
  const [isSaving, setIsSaving] = useState(false);
  
  // تحديث الحقول المرتبة عندما تتغير الحقول الأصلية أو عندما يتم فتح المربع الحواري
  React.useEffect(() => {
    if (isOpen && fields && fields.length > 0) {
      console.log("تحديث الحقول المرتبة:", fields);
      const sortedFields = [...fields].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setOrderedFields(sortedFields);
    }
  }, [fields, isOpen]);

  // معالجة نهاية عملية السحب والإفلات
  const handleDragEnd = (result: any) => {
    // تجنب التحديث إذا لم يتم إسقاط العنصر في منطقة صالحة
    if (!result.destination) return;
    
    // تجنب التحديث إذا لم يتغير الموقع
    if (result.destination.index === result.source.index) return;
    
    // إنشاء نسخة جديدة من المصفوفة وإعادة ترتيبها
    const newOrderedFields = Array.from(orderedFields);
    const [movedItem] = newOrderedFields.splice(result.source.index, 1);
    newOrderedFields.splice(result.destination.index, 0, movedItem);
    
    // تحديث قيم displayOrder لكل حقل
    const updatedFields = newOrderedFields.map((field, index) => ({
      ...field,
      displayOrder: index
    }));
    
    setOrderedFields(updatedFields);
  };

  // تحريك عنصر لأعلى
  const moveUp = (index: number) => {
    if (index === 0) return; // العنصر بالفعل في الأعلى
    
    const newOrderedFields = Array.from(orderedFields);
    [newOrderedFields[index - 1], newOrderedFields[index]] = [newOrderedFields[index], newOrderedFields[index - 1]];
    
    // تحديث قيم displayOrder
    const updatedFields = newOrderedFields.map((field, idx) => ({
      ...field,
      displayOrder: idx
    }));
    
    setOrderedFields(updatedFields);
  };

  // تحريك عنصر لأسفل
  const moveDown = (index: number) => {
    if (index === orderedFields.length - 1) return; // العنصر بالفعل في الأسفل
    
    const newOrderedFields = Array.from(orderedFields);
    [newOrderedFields[index], newOrderedFields[index + 1]] = [newOrderedFields[index + 1], newOrderedFields[index]];
    
    // تحديث قيم displayOrder
    const updatedFields = newOrderedFields.map((field, idx) => ({
      ...field,
      displayOrder: idx
    }));
    
    setOrderedFields(updatedFields);
  };

  // معالجة حفظ التغييرات
  const handleSave = () => {
    setIsSaving(true);
    
    // إرسال الحقول المحدثة إلى الدالة المستدعية
    onSave(orderedFields);
    
    // مؤقت وهمي لتجربة واجهة المستخدم (يمكن إزالته في الإنتاج)
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {orderedFields.map((field, index) => (
                    <Draggable 
                      key={field.id.toString()} 
                      draggableId={field.id.toString()} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center p-3 bg-white rounded-md border ${
                            snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                          }`}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="mr-2 p-1 rounded hover:bg-gray-100 cursor-grab"
                          >
                            <Move className="h-5 w-5 text-gray-500" />
                          </div>
                          
                          <div className="flex-1 mr-4">
                            <div className="font-medium text-sm">{field.label || field.name}</div>
                            <div className="text-xs text-gray-500">
                              {field.type} {field.required && '(مطلوب)'} 
                              {field.name && <span className="opacity-50 mr-1">- {field.name}</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => moveUp(index)}
                              disabled={index === 0}
                              className="h-8 w-8"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => moveDown(index)}
                              disabled={index === orderedFields.length - 1}
                              className="h-8 w-8"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
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
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            حفظ الترتيب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}