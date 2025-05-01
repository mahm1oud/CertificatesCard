import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export const useSignatures = (type?: 'signature' | 'stamp') => {
  const queryClient = useQueryClient();
  
  // إنشاء معلمات الاستعلام
  const queryParams = type ? `?type=${type}` : '';

  // استعلام لجلب توقيعات المستخدم
  const signatures = useQuery({
    queryKey: ['/api/signatures', type],
    queryFn: () => apiRequest(`/api/signatures${queryParams}`),
  });

  // رفع توقيع جديد (استخدام FormData لرفع الملفات)
  const uploadSignature = useMutation({
    mutationFn: (formData: FormData) => 
      fetch('/api/signatures', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('فشل في رفع التوقيع');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signatures', type] });
    },
  });

  // تحديث معلومات التوقيع
  const updateSignature = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; type?: 'signature' | 'stamp'; isActive?: boolean } }) => 
      apiRequest(`/api/signatures/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signatures', type] });
    },
  });

  // حذف توقيع
  const deleteSignature = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/signatures/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signatures', type] });
    },
  });

  return {
    signatures,
    uploadSignature,
    updateSignature,
    deleteSignature,
  };
};

export default useSignatures;