import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Logo {
  id: number;
  name: string;
  imageUrl: string;
  userId: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useUserLogos = () => {
  const queryClient = useQueryClient();
  
  // جلب شعارات المستخدم
  const userLogos = useQuery({
    queryKey: ['/api/logos'],
    queryFn: () => apiRequest('/api/logos/user'),
  });
  
  // رفع شعار جديد (استخدام FormData لرفع الملفات)
  const uploadLogo = useMutation({
    mutationFn: (formData: FormData) => 
      fetch('/api/logos', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('فشل في رفع الشعار');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logos'] });
    },
  });
  
  // تحديث معلومات الشعار
  const updateLogo = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; active?: boolean } }) => 
      apiRequest(`/api/logos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logos'] });
    },
  });
  
  // حذف شعار
  const deleteLogo = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/logos/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logos'] });
    },
  });
  
  return {
    userLogos,
    uploadLogo,
    updateLogo,
    deleteLogo,
  };
};

export default useUserLogos;