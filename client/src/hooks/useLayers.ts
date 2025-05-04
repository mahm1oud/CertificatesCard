import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Layer } from '@shared/schema';

// أنواع البيانات اللازمة للعمليات المختلفة على الطبقات
export interface LayerCreateData {
  name: string;
  type: string;
  templateId: number;
  fieldName?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    align?: 'left' | 'center' | 'right';
  };
  zIndex?: number;
  visible?: boolean;
}

export interface LayerUpdateData {
  id: number;
  name?: string;
  type?: string;
  templateId?: number;
  fieldName?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    align?: 'left' | 'center' | 'right';
  };
  zIndex?: number;
  visible?: boolean;
}

export const useLayers = (templateId: number) => {
  const queryClient = useQueryClient();
  
  // جلب جميع الطبقات لقالب معين
  const layers = useQuery({
    queryKey: ['/api/layers', templateId],
    queryFn: () => apiRequest(`/api/layers/template/${templateId}`),
  });
  
  // إنشاء طبقة جديدة
  const createLayer = useMutation({
    mutationFn: (layerData: LayerCreateData) => 
      apiRequest('/api/layers', {
        method: 'POST',
        body: JSON.stringify(layerData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/layers', templateId] });
    },
  });
  
  // تحديث طبقة موجودة
  const updateLayer = useMutation({
    mutationFn: ({ id, ...data }: LayerUpdateData) => 
      apiRequest(`/api/layers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/layers', templateId] });
    },
  });
  
  // حذف طبقة
  const deleteLayer = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/layers/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/layers', templateId] });
    },
  });
  
  // إعادة ترتيب الطبقات
  const reorderLayers = useMutation({
    mutationFn: (layerIds: number[]) => 
      apiRequest(`/api/layers/reorder`, {
        method: 'POST',
        body: JSON.stringify({ layerIds, templateId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/layers', templateId] });
    },
  });
  
  return {
    layers,
    createLayer,
    updateLayer,
    deleteLayer,
    reorderLayers,
  };
};

export default useLayers;