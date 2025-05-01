import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTemplateForm } from "@/hooks/use-template-form";

interface RamadanFormProps {
  onChange: (data: any) => void;
  template: any;
}

const RamadanForm = ({ onChange, template }: RamadanFormProps) => {
  const { formData, updateFormField } = useTemplateForm({
    sender: '',
    recipient: '',
    message: '',
    year: new Date().getFullYear().toString()
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
        <Label htmlFor="year" className="block text-sm font-medium text-neutral-700 mb-1">
          العام الهجري
        </Label>
        <Input
          id="year"
          name="year"
          value={formData.year}
          onChange={(e) => updateFormField('year', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل العام الهجري"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
          رسالة تهنئة رمضان
        </Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={(e) => updateFormField('message', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="اكتب رسالة تهنئة بشهر رمضان"
          required
        />
      </div>
    </div>
  );
};

export default RamadanForm;
