import { useState, useMemo } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface FieldsPanelProps {
  fields: any[] | undefined;
  onAddField?: (field: any) => void;
}

interface FieldItemProps {
  field: any;
  onAddField?: (field: any) => void;
}

function FieldItem({ field, onAddField }: FieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.id}`,
    data: field,
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center border p-2 rounded mb-2 bg-white shadow-sm hover:bg-blue-50 transition-colors"
      {...listeners} 
      {...attributes}
    >
      <div className="flex-1">
        <p className="font-medium text-sm">{field.label}</p>
        <p className="text-xs text-slate-500">{field.name}</p>
      </div>
      
      {onAddField && (
        <button
          type="button"
          className="ml-2 p-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          onClick={() => onAddField(field)}
        >
          إضافة
        </button>
      )}
    </div>
  );
}

export function FieldsPanel({ fields = [], onAddField }: FieldsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldType, setFieldType] = useState('all');
  
  // Filter fields based on search term and field type
  const filteredFields = useMemo(() => {
    return Array.isArray(fields) ? fields.filter(field => {
      if (!field) return false;
      
      const label = field.label?.toLowerCase() || '';
      const name = field.name?.toLowerCase() || '';
      const type = field.type || '';
      const term = searchTerm.toLowerCase();
      
      const matchesSearch = label.includes(term) || name.includes(term); 
      const matchesType = fieldType === 'all' || type === fieldType;
      
      return matchesSearch && matchesType;
    }) : [];
  }, [fields, searchTerm, fieldType]);
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-2">حقول القالب</h3>
        
        <div className="mb-2">
          <input
            type="text"
            placeholder="البحث عن حقل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs mb-1">نوع الحقل:</label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="all">الكل</option>
            <option value="text">نص</option>
            <option value="date">تاريخ</option>
            <option value="email">بريد إلكتروني</option>
            <option value="textarea">نص طويل</option>
            <option value="select">قائمة منسدلة</option>
            <option value="image">صورة</option>
          </select>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {filteredFields.length === 0 ? (
            <p className="text-sm text-center text-slate-500 py-4">
              لا توجد حقول مطابقة للبحث
            </p>
          ) : (
            filteredFields.map(field => (
              <FieldItem 
                key={field.id} 
                field={field} 
                onAddField={onAddField}
              />
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t text-xs text-slate-500">
        <p>اسحب الحقول إلى منطقة القالب</p>
        <p className="mt-1">أو استخدم زر "إضافة" لإضافة الحقل مباشرةً</p>
      </div>
    </div>
  );
}