import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTemplateForm } from "@/hooks/use-template-form";

interface EidFormProps {
  onChange: (data: any) => void;
  template: any;
}

const EidForm = ({ onChange, template }: EidFormProps) => {
  const { formData, updateFormField } = useTemplateForm({
    sender: '',
    recipient: '',
    message: '',
    eidType: 'الفطر' // default value
  });

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-4">
      <div className="form-group">
        <Label htmlFor="sender" className="block text-sm font-medium text-neutral-700 mb-1">
          اسم المرسل
        </Label>
        <Input
          id="sender"
          name="sender"
          value={formData.sender}
          onChange={(e) => updateFormField('sender', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسمك"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="recipient" className="block text-sm font-medium text-neutral-700 mb-1">
          اسم المستلم
        </Label>
        <Input
          id="recipient"
          name="recipient"
          value={formData.recipient}
          onChange={(e) => updateFormField('recipient', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسم الشخص الذي تريد إرسال البطاقة له"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="eid-type" className="block text-sm font-medium text-neutral-700 mb-1">
          نوع العيد
        </Label>
        <select
          id="eid-type"
          name="eidType"
          value={formData.eidType}
          onChange={(e) => updateFormField('eidType', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          required
        >
          <option value="الفطر">عيد الفطر</option>
          <option value="الأضحى">عيد الأضحى</option>
        </select>
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
          placeholder="اكتب رسالة تهنئة بالعيد"
          required
        />
      </div>
    </div>
  );
};

export default EidForm;
