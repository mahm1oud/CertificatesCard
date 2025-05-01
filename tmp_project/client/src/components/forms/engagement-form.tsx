import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTemplateForm } from "@/hooks/use-template-form";

interface EngagementFormProps {
  onChange: (data: any) => void;
  template: any;
}

const EngagementForm = ({ onChange, template }: EngagementFormProps) => {
  const { formData, updateFormField } = useTemplateForm({
    groomName: '',
    brideName: '',
    engagementDate: '',
    engagementTime: '',
    engagementLocation: '',
    additionalNotes: ''
  });

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-4">
      <div className="form-group">
        <Label htmlFor="groom-name" className="block text-sm font-medium text-neutral-700 mb-1">
          اسم الخطيب
        </Label>
        <Input
          id="groom-name"
          name="groomName"
          value={formData.groomName}
          onChange={(e) => updateFormField('groomName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسم الخطيب"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="bride-name" className="block text-sm font-medium text-neutral-700 mb-1">
          اسم الخطيبة
        </Label>
        <Input
          id="bride-name"
          name="brideName"
          value={formData.brideName}
          onChange={(e) => updateFormField('brideName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسم الخطيبة"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="engagement-date" className="block text-sm font-medium text-neutral-700 mb-1">
          تاريخ الخطوبة
        </Label>
        <Input
          type="date"
          id="engagement-date"
          name="engagementDate"
          value={formData.engagementDate}
          onChange={(e) => updateFormField('engagementDate', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="engagement-time" className="block text-sm font-medium text-neutral-700 mb-1">
          وقت الخطوبة
        </Label>
        <Input
          type="time"
          id="engagement-time"
          name="engagementTime"
          value={formData.engagementTime}
          onChange={(e) => updateFormField('engagementTime', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="engagement-location" className="block text-sm font-medium text-neutral-700 mb-1">
          مكان الخطوبة
        </Label>
        <Input
          id="engagement-location"
          name="engagementLocation"
          value={formData.engagementLocation}
          onChange={(e) => updateFormField('engagementLocation', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل مكان الخطوبة"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="additional-notes" className="block text-sm font-medium text-neutral-700 mb-1">
          ملاحظات إضافية
        </Label>
        <Textarea
          id="additional-notes"
          name="additionalNotes"
          value={formData.additionalNotes}
          onChange={(e) => updateFormField('additionalNotes', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أي ملاحظات إضافية ترغب في إضافتها"
        />
      </div>
    </div>
  );
};

export default EngagementForm;
