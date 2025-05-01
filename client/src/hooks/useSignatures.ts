import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Signature {
  id: number;
  name: string;
  imageUrl: string;
  userId: number;
  type: string; // 'signature' or 'stamp'
  createdAt: string;
  isActive: boolean;
}

/**
 * Hook for managing user signatures with database storage
 */
export function useSignatures() {
  const queryClient = useQueryClient();

  // Fetch user signatures
  const signatures = useQuery({
    queryKey: ['/api/user/signatures'],
    retry: 1,
  });

  // Upload a new signature
  const uploadSignature = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/user/signatures', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, it will be set automatically with boundary for FormData
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/signatures'] });
    },
  });

  // Delete a signature
  const deleteSignature = useMutation({
    mutationFn: async (signatureId: number) => {
      return apiRequest(`/api/user/signatures/${signatureId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/signatures'] });
    },
  });

  return {
    signatures,
    uploadSignature,
    deleteSignature,
  };
}