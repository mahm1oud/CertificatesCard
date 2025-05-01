import { useState } from "react";

export function useTemplateForm<T>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState);

  const updateFormField = (field: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData(initialState);
  };

  return {
    formData,
    updateFormField,
    resetForm
  };
}
