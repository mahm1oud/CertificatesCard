import React from 'react';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Trash } from 'lucide-react';

interface FieldOption {
  value: string;
  label: string;
}

interface FieldStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  [key: string]: any;
}

interface FieldType {
  id: number;
  name: string;
  label?: string;
  labelAr?: string;
  type: 'text' | 'image' | 'dropdown' | 'radio';
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: FieldStyle;
  zIndex?: number;
  visible?: boolean;
  rotation?: number;
  templateId?: number;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  placeholderAr?: string;
  options?: FieldOption[];
}

interface FieldOptionsEditorProps {
  field: FieldType;
  onFieldChange: (field: FieldType) => void;
  readOnly?: boolean;
}

export const FieldOptionsEditor: React.FC<FieldOptionsEditorProps> = ({
  field,
  onFieldChange,
  readOnly = false
}) => {
  if (field.type !== 'dropdown' && field.type !== 'radio') {
    return null;
  }

  return (
    <>
      <Separator />
      <h3 className="text-lg font-medium">
        {field.type === 'dropdown' ? 'خصائص القائمة المنسدلة' : 'خصائص الاختيارات المتعددة'}
      </h3>
      
      {/* الخيارات */}
      <FormItem>
        <FormLabel>الخيارات</FormLabel>
        <div className="space-y-2">
          {field.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
              <Input
                placeholder="القيمة"
                value={option.value}
                onChange={(e) => {
                  const newOptions = [...(field.options || [])];
                  newOptions[index] = {
                    ...newOptions[index],
                    value: e.target.value
                  };
                  onFieldChange({
                    ...field,
                    options: newOptions
                  });
                }}
                disabled={readOnly}
                className="flex-1"
              />
              <Input
                placeholder="العنوان"
                value={option.label}
                onChange={(e) => {
                  const newOptions = [...(field.options || [])];
                  newOptions[index] = {
                    ...newOptions[index],
                    label: e.target.value
                  };
                  onFieldChange({
                    ...field,
                    options: newOptions
                  });
                }}
                disabled={readOnly}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const newOptions = [...(field.options || [])];
                  newOptions.splice(index, 1);
                  onFieldChange({
                    ...field,
                    options: newOptions
                  });
                }}
                disabled={readOnly}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={() => {
              const newOptions = [...(field.options || [])];
              newOptions.push({
                value: `option${newOptions.length + 1}`,
                label: `الخيار ${newOptions.length + 1}`
              });
              onFieldChange({
                ...field,
                options: newOptions
              });
            }}
            disabled={readOnly}
            className="w-full"
          >
            إضافة خيار جديد
          </Button>
        </div>
      </FormItem>
      
      {/* تخصيص مظهر القائمة */}
      <Separator className="my-4" />
      <h4 className="text-md font-medium mb-2">مظهر الحقل</h4>
      
      {/* نوع الخط */}
      <FormItem>
        <FormLabel>نوع الخط</FormLabel>
        <Select
          value={field.style?.fontFamily || 'Cairo'}
          onValueChange={(value) =>
            onFieldChange({
              ...field,
              style: {
                ...field.style,
                fontFamily: value,
              },
            })
          }
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع الخط" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cairo">Cairo</SelectItem>
            <SelectItem value="Tajawal">Tajawal</SelectItem>
            <SelectItem value="Amiri">Amiri</SelectItem>
          </SelectContent>
        </Select>
      </FormItem>
      
      {/* حجم الخط */}
      <FormItem>
        <FormLabel>
          حجم الخط: {field.style?.fontSize || 18}
        </FormLabel>
        <FormControl>
          <Slider
            min={10}
            max={32}
            step={1}
            value={[field.style?.fontSize || 18]}
            onValueChange={(values) =>
              onFieldChange({
                ...field,
                style: {
                  ...field.style,
                  fontSize: values[0],
                },
              })
            }
            disabled={readOnly}
          />
        </FormControl>
      </FormItem>
      
      {/* لون النص */}
      <FormItem>
        <FormLabel>لون النص</FormLabel>
        <div className="flex space-x-2">
          <input
            type="color"
            value={field.style?.color || '#000000'}
            onChange={(e) =>
              onFieldChange({
                ...field,
                style: {
                  ...field.style,
                  color: e.target.value,
                },
              })
            }
            disabled={readOnly}
            className="w-10 h-10 rounded-md"
          />
          <Input
            value={field.style?.color || '#000000'}
            onChange={(e) =>
              onFieldChange({
                ...field,
                style: {
                  ...field.style,
                  color: e.target.value,
                },
              })
            }
            disabled={readOnly}
          />
        </div>
      </FormItem>
    </>
  );
};