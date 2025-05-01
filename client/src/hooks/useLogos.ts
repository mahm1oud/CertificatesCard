import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Logo {
  id: number;
  name: string;
  imageUrl: string;
  userId: number;
  createdAt: string;
  isActive: boolean;
}

/**
 * Hook for managing user logos with database storage
 */
export function useUserLogos() {
  const queryClient = useQueryClient();

  // Fetch user logos
  const userLogos = useQuery({
    queryKey: ['/api/user/logos'],
    retry: 1,
  });

  // Upload a new logo
  const uploadLogo = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/user/logos', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, it will be set automatically with boundary for FormData
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/logos'] });
    },
  });

  // Delete a logo
  const deleteLogo = useMutation({
    mutationFn: async (logoId: number) => {
      return apiRequest(`/api/user/logos/${logoId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/logos'] });
    },
  });

  return {
    userLogos,
    uploadLogo,
    deleteLogo,
  };
}