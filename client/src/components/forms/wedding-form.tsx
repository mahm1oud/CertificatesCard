import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTemplateForm } from "@/hooks/use-template-form";

interface WeddingFormProps {
  onChange: (data: any) => void;
  template: any;
}

const WeddingForm = ({ onChange, template }: WeddingFormProps) => {
  const { formData, updateFormField } = useTemplateForm({
    groomName: '',
    brideName: '',
    weddingDate: '',
    weddingTime: '',
    weddingLocation: '',
    additionalNotes: '',
    coupleImage: '', // صورة العروسين
    familyImage: '', // صورة العائلة أو إطار تزييني
    venueImage: ''   // صورة مكان الحفل
  });

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-4">
      <div className="form-group">
        <Label htmlFor="groom-name" className="block text-sm font-medium text-neutral-700 mb-1">
          اسم العريس
        </Label>
        <Input
          id="groom-name"
          name="groomName"
          value={formData.groomName}
          onChange={(e) => updateFormField('groomName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسم العريس"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="bride-name" className="block text-sm font-medium text-neutral-700 mb-1">
          اسم العروس
        </Label>
        <Input
          id="bride-name"
          name="brideName"
          value={formData.brideName}
          onChange={(e) => updateFormField('brideName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسم العروس"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="wedding-date" className="block text-sm font-medium text-neutral-700 mb-1">
          تاريخ الزفاف
        </Label>
        <Input
          type="date"
          id="wedding-date"
          name="weddingDate"
          value={formData.weddingDate}
          onChange={(e) => updateFormField('weddingDate', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="wedding-time" className="block text-sm font-medium text-neutral-700 mb-1">
          وقت الزفاف
        </Label>
        <Input
          type="time"
          id="wedding-time"
          name="weddingTime"
          value={formData.weddingTime}
          onChange={(e) => updateFormField('weddingTime', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="wedding-location" className="block text-sm font-medium text-neutral-700 mb-1">
          مكان الزفاف
        </Label>
        <Input
          id="wedding-location"
          name="weddingLocation"
          value={formData.weddingLocation}
          onChange={(e) => updateFormField('weddingLocation', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل مكان الزفاف"
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
      
      {/* حقل صورة العروسين */}
      <div className="form-group">
        <Label htmlFor="couple-image" className="block text-sm font-medium text-neutral-700 mb-1">
          صورة العروسين
        </Label>
        <Input
          id="couple-image"
          name="coupleImage"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // قراءة الملف كـ Data URL وتخزينه
              const reader = new FileReader();
              reader.onload = () => {
                updateFormField('coupleImage', reader.result as string);
              };
              reader.readAsDataURL(file);
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
        />
        {formData.coupleImage && (
          <div className="mt-2 rounded border p-2">
            <img 
              src={formData.coupleImage} 
              alt="صورة العروسين" 
              className="max-h-32 object-contain mx-auto" 
            />
          </div>
        )}
      </div>
      
      {/* حقل صورة العائلة */}
      <div className="form-group">
        <Label htmlFor="family-image" className="block text-sm font-medium text-neutral-700 mb-1">
          صورة العائلة/إطار تزييني
        </Label>
        <Input
          id="family-image"
          name="familyImage"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                updateFormField('familyImage', reader.result as string);
              };
              reader.readAsDataURL(file);
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
        />
        {formData.familyImage && (
          <div className="mt-2 rounded border p-2">
            <img 
              src={formData.familyImage} 
              alt="صورة العائلة/إطار تزييني" 
              className="max-h-32 object-contain mx-auto" 
            />
          </div>
        )}
      </div>
      
      {/* حقل صورة مكان الحفل */}
      <div className="form-group">
        <Label htmlFor="venue-image" className="block text-sm font-medium text-neutral-700 mb-1">
          صورة مكان الحفل
        </Label>
        <Input
          id="venue-image"
          name="venueImage"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                updateFormField('venueImage', reader.result as string);
              };
              reader.readAsDataURL(file);
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
        />
        {formData.venueImage && (
          <div className="mt-2 rounded border p-2">
            <img 
              src={formData.venueImage} 
              alt="صورة مكان الحفل" 
              className="max-h-32 object-contain mx-auto" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WeddingForm;
