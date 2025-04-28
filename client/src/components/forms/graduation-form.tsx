import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTemplateForm } from "@/hooks/use-template-form";

interface GraduationFormProps {
  onChange: (data: any) => void;
  template: any;
}

const GraduationForm = ({ onChange, template }: GraduationFormProps) => {
  const { formData, updateFormField } = useTemplateForm({
    graduateName: '',
    degree: '',
    university: '',
    graduationDate: '',
    message: ''
  });

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-4">
      <div className="form-group">
        <Label htmlFor="graduate-name" className="block text-sm font-medium text-neutral-700 mb-1">
          اسم الخريج/ة
        </Label>
        <Input
          id="graduate-name"
          name="graduateName"
          value={formData.graduateName}
          onChange={(e) => updateFormField('graduateName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسم الخريج/ة"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="degree" className="block text-sm font-medium text-neutral-700 mb-1">
          الدرجة العلمية
        </Label>
        <Input
          id="degree"
          name="degree"
          value={formData.degree}
          onChange={(e) => updateFormField('degree', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="مثال: بكالوريوس هندسة"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="university" className="block text-sm font-medium text-neutral-700 mb-1">
          الجامعة / المؤسسة التعليمية
        </Label>
        <Input
          id="university"
          name="university"
          value={formData.university}
          onChange={(e) => updateFormField('university', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسم الجامعة أو المؤسسة التعليمية"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="graduation-date" className="block text-sm font-medium text-neutral-700 mb-1">
          تاريخ التخرج
        </Label>
        <Input
          type="date"
          id="graduation-date"
          name="graduationDate"
          value={formData.graduationDate}
          onChange={(e) => updateFormField('graduationDate', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
          رسالة التهنئة
        </Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={(e) => updateFormField('message', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="اكتب رسالة تهنئة للخريج/ة"
          required
        />
      </div>
    </div>
  );
};

export default GraduationForm;
