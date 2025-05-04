import { useState, useMemo } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Search, Tag, Plus, ArrowRight } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { TabPanel, TabContent } from '../ui/tabs-advanced';

// نوع الحقل
interface Field {
  id: number;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  defaultValue?: string;
  [key: string]: any;
}

// واجهة مكون FieldsPanel
interface FieldsPanelProps {
  fields: Field[] | undefined;
  onAddField?: (field: Field) => void;
  className?: string;
}

// مكون عنصر الحقل القابل للسحب
function DraggableFieldItem({ field, onAddField }: { field: Field, onAddField?: (field: Field) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.id}`,
    data: field,
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center border p-2 rounded-md mb-2 bg-white shadow-sm hover:bg-blue-50 transition-colors cursor-grab rtl"
      {...listeners} 
      {...attributes}
    >
      <div className="flex-1">
        <p className="font-medium text-sm">{field.label}</p>
        <p className="text-xs text-slate-500">{field.name}</p>
      </div>
      
      {onAddField && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAddField(field)}
          className="p-1 rounded-full"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// مكون القسم
function FieldSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center">
        <ArrowRight className="h-3.5 w-3.5 ml-1 transform -rotate-90" />
        {title}
      </h3>
      <div className="space-y-2 pr-2">
        {children}
      </div>
    </div>
  );
}

// المكون الرئيسي
export function FieldsPanel({ fields = [], onAddField, className }: FieldsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // تجميع الحقول حسب النوع
  const fieldGroups = useMemo(() => {
    // التأكد من أن fields مصفوفة
    if (!Array.isArray(fields)) return {};
    
    // فلترة الحقول بناءً على البحث
    const filteredFields = fields.filter(field => {
      if (!field) return false;
      
      const label = field.label?.toLowerCase() || '';
      const name = field.name?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      
      return label.includes(term) || name.includes(term);
    });
    
    // تجميع الحقول حسب النوع
    return filteredFields.reduce((acc: { [key: string]: Field[] }, field) => {
      const type = field.type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(field);
      return acc;
    }, {});
  }, [fields, searchTerm]);
  
  // تحديد ما إذا كانت نتائج البحث فارغة
  const isEmptyResult = useMemo(() => {
    return Object.keys(fieldGroups).length === 0;
  }, [fieldGroups]);
  
  // قائمة التابات
  const tabs = [
    { id: 'all', label: 'الحقول', icon: <Tag className="h-4 w-4" /> },
    { id: 'predefined', label: 'جاهزة', icon: <Plus className="h-4 w-4" /> },
  ];
  
  // تاب الحقول
  const allFieldsTab = (
    <TabContent id="all" className="p-2">
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ابحث عن حقل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3"
          />
        </div>
      </div>
      
      {isEmptyResult ? (
        <div className="text-center py-8 text-slate-500">
          <p>لا توجد حقول مطابقة للبحث</p>
          <p className="text-xs mt-1">جرب بحثاً مختلفاً</p>
        </div>
      ) : (
        Object.entries(fieldGroups).map(([type, typeFields]) => (
          <FieldSection key={type} title={getTypeTitle(type)}>
            {typeFields.map(field => (
              <DraggableFieldItem 
                key={field.id} 
                field={field} 
                onAddField={onAddField}
              />
            ))}
          </FieldSection>
        ))
      )}
    </TabContent>
  );
  
  // تاب العناصر الجاهزة
  const predefinedTab = (
    <TabContent id="predefined" className="p-2">
      <FieldSection title="نصوص جاهزة">
        {getPredefinedTextFields().map(field => (
          <DraggableFieldItem 
            key={field.id} 
            field={field} 
            onAddField={onAddField}
          />
        ))}
      </FieldSection>
      
      <FieldSection title="أشكال جاهزة">
        {getPredefinedShapes().map(field => (
          <DraggableFieldItem 
            key={field.id} 
            field={field} 
            onAddField={onAddField}
          />
        ))}
      </FieldSection>
    </TabContent>
  );
  
  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      <TabPanel
        tabs={tabs}
        variant="underline"
        tabClassName="text-xs"
      >
        {allFieldsTab}
        {predefinedTab}
      </TabPanel>
      
      <div className="p-2 border-t text-xs text-slate-500 mt-auto">
        <p>اسحب الحقول إلى منطقة القالب</p>
        <p className="mt-1">أو استخدم زر "+" لإضافة الحقل مباشرةً</p>
      </div>
    </div>
  );
}

// وظائف مساعدة
function getTypeTitle(type: string): string {
  const typeMap: Record<string, string> = {
    'text': 'حقول نصية',
    'number': 'حقول رقمية',
    'date': 'حقول تاريخ',
    'email': 'حقول بريد',
    'textarea': 'حقول نص طويل',
    'select': 'قوائم منسدلة',
    'image': 'صور',
    'other': 'أخرى'
  };
  
  return typeMap[type] || 'أخرى';
}

// وظائف توليد حقول جاهزة
function getPredefinedTextFields(): Field[] {
  return [
    { id: -1, name: 'title', label: 'عنوان رئيسي', type: 'text', predefined: true },
    { id: -2, name: 'subtitle', label: 'عنوان فرعي', type: 'text', predefined: true },
    { id: -3, name: 'paragraph', label: 'فقرة نصية', type: 'textarea', predefined: true },
    { id: -4, name: 'quote', label: 'اقتباس', type: 'text', predefined: true },
  ];
}

function getPredefinedShapes(): Field[] {
  return [
    { id: -101, name: 'rectangle', label: 'مستطيل', type: 'shape', shapeType: 'rect', predefined: true },
    { id: -102, name: 'circle', label: 'دائرة', type: 'shape', shapeType: 'circle', predefined: true },
    { id: -103, name: 'line', label: 'خط', type: 'shape', shapeType: 'line', predefined: true },
  ];
}