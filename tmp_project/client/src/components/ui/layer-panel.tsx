import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Layer } from '@shared/schema';
import { LayerCreateData, LayerUpdateData, useLayers } from '@/hooks/useLayers';
import { Trash2, ArrowUpCircle, ArrowDownCircle, Plus, ChevronUp, ChevronDown, Image, Type, Stamp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LayerPanelProps {
  templateId: number;
  onSelectLayer?: (layer: Layer) => void;
  onUpdateLayerPosition?: (layer: Layer, position: any) => void;
  onToggleLayerVisibility?: (layer: Layer, visible: boolean) => void;
  selectedLayerId?: number;
}

export function LayerPanel({
  templateId,
  onSelectLayer,
  onUpdateLayerPosition,
  onToggleLayerVisibility,
  selectedLayerId
}: LayerPanelProps) {
  const { layers, updateLayer, createLayer, deleteLayer, reorderLayers } = useLayers(templateId);
  const { toast } = useToast();
  const [expandedLayers, setExpandedLayers] = useState<string[]>([]);
  const [newLayerData, setNewLayerData] = useState<Partial<LayerCreateData>>({
    name: '',
    type: 'field',
    templateId,
  });

  // توسيع الطبقة المحددة تلقائيًا
  useEffect(() => {
    if (selectedLayerId && !expandedLayers.includes(selectedLayerId.toString())) {
      setExpandedLayers(prev => [...prev, selectedLayerId.toString()]);
    }
  }, [selectedLayerId]);
  
  const handleLayerSelect = (layer: Layer) => {
    if (onSelectLayer) {
      onSelectLayer(layer);
    }
  };

  const handlePositionChange = (layer: Layer, position: any) => {
    if (onUpdateLayerPosition) {
      onUpdateLayerPosition(layer, position);
    }
  };

  const handleVisibilityToggle = (layer: Layer, visible: boolean) => {
    if (onToggleLayerVisibility) {
      onToggleLayerVisibility(layer, visible);
    }
  };

  const handleLayerUpdate = (id: number, data: Partial<LayerUpdateData>) => {
    updateLayer.mutate(
      { id, ...data },
      {
        onSuccess: () => {
          toast({
            title: "تم التحديث",
            description: "تم تحديث الطبقة بنجاح",
          });
        },
        onError: () => {
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء تحديث الطبقة",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleLayerDelete = (id: number) => {
    deleteLayer.mutate(id, {
      onSuccess: () => {
        toast({
          title: "تم الحذف",
          description: "تم حذف الطبقة بنجاح",
        });
      },
      onError: () => {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حذف الطبقة",
          variant: "destructive",
        });
      },
    });
  };

  const handleCreateLayer = () => {
    if (!newLayerData.name) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم للطبقة",
        variant: "destructive",
      });
      return;
    }

    createLayer.mutate(
      { ...newLayerData, templateId } as LayerCreateData,
      {
        onSuccess: () => {
          toast({
            title: "تم الإنشاء",
            description: "تم إنشاء الطبقة بنجاح",
          });
          setNewLayerData({
            name: '',
            type: 'field',
            templateId,
          });
        },
        onError: () => {
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء إنشاء الطبقة",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleMoveLayer = (direction: 'up' | 'down', index: number) => {
    if (!layers.data) return;
    
    const newLayers = [...layers.data];
    if (direction === 'up' && index > 0) {
      // تحريك لأعلى
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    } else if (direction === 'down' && index < newLayers.length - 1) {
      // تحريك لأسفل
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    } else {
      return; // لا يمكن التحريك أكثر
    }

    // إعادة ترتيب الطبقات
    reorderLayers.mutate(
      newLayers.map(layer => layer.id),
      {
        onError: () => {
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء إعادة ترتيب الطبقات",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'field':
        return <Type className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'logo':
        return <Image className="h-4 w-4" />;
      case 'signature':
      case 'stamp':
        return <Stamp className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  if (layers.isLoading) {
    return <div className="p-4 text-center">جاري تحميل الطبقات...</div>;
  }

  if (layers.isError) {
    return <div className="p-4 text-center text-red-500">حدث خطأ أثناء تحميل الطبقات</div>;
  }

  return (
    <div className="border rounded-md p-4 space-y-4 bg-white">
      <h3 className="text-lg font-medium">الطبقات</h3>
      
      {/* قائمة الطبقات */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        <Accordion
          type="multiple"
          value={expandedLayers}
          onValueChange={setExpandedLayers}
          className="space-y-2"
        >
          {layers.data && layers.data.length > 0 ? (
            layers.data.map((layer, index) => (
              <AccordionItem
                key={layer.id}
                value={layer.id.toString()}
                className={cn(
                  "border p-2 rounded-md",
                  selectedLayerId === layer.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => handleLayerSelect(layer)}
                  >
                    {getLayerIcon(layer.type)}
                    <span className="text-sm font-medium">{layer.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveLayer('up', index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveLayer('down', index)}
                      disabled={index === layers.data.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <AccordionTrigger className="h-6 w-6 p-0 hover:bg-gray-100 rounded-sm" />
                  </div>
                </div>
                
                <AccordionContent className="pt-3 space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">الاسم</label>
                    <Input
                      value={layer.name}
                      onChange={(e) => handleLayerUpdate(layer.id, { name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium">النوع</label>
                    <Select
                      value={layer.type}
                      onValueChange={(value) => handleLayerUpdate(layer.id, { type: value })}
                      disabled={true} // لا يمكن تغيير نوع الطبقة بعد إنشائها
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="field">حقل نص</SelectItem>
                        <SelectItem value="image">صورة</SelectItem>
                        <SelectItem value="logo">شعار</SelectItem>
                        <SelectItem value="signature">توقيع</SelectItem>
                        <SelectItem value="stamp">ختم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {layer.type === 'field' && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium">اسم الحقل</label>
                      <Input
                        value={layer.fieldName || ''}
                        onChange={(e) => handleLayerUpdate(layer.id, { fieldName: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleLayerDelete(layer.id)}
                      className="h-8 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      حذف
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <div className="text-center p-4 text-gray-500 text-sm">
              لا توجد طبقات. أضف طبقة جديدة للبدء.
            </div>
          )}
        </Accordion>
      </div>
      
      {/* إضافة طبقة جديدة */}
      <div className="pt-4 border-t space-y-3">
        <h4 className="text-sm font-medium">إضافة طبقة جديدة</h4>
        
        <div className="space-y-2">
          <label className="text-xs font-medium">الاسم</label>
          <Input
            value={newLayerData.name || ''}
            onChange={(e) => setNewLayerData({ ...newLayerData, name: e.target.value })}
            placeholder="اسم الطبقة"
            className="h-8 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-medium">النوع</label>
          <Select
            value={newLayerData.type}
            onValueChange={(value) => setNewLayerData({ ...newLayerData, type: value })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="field">حقل نص</SelectItem>
              <SelectItem value="image">صورة</SelectItem>
              <SelectItem value="logo">شعار</SelectItem>
              <SelectItem value="signature">توقيع</SelectItem>
              <SelectItem value="stamp">ختم</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {newLayerData.type === 'field' && (
          <div className="space-y-2">
            <label className="text-xs font-medium">اسم الحقل</label>
            <Input
              value={newLayerData.fieldName || ''}
              onChange={(e) => setNewLayerData({ ...newLayerData, fieldName: e.target.value })}
              placeholder="اسم الحقل"
              className="h-8 text-sm"
            />
          </div>
        )}
        
        <Button
          onClick={handleCreateLayer}
          className="w-full mt-2"
          size="sm"
          disabled={createLayer.isPending}
        >
          {createLayer.isPending ? (
            "جارِ الإضافة..."
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              إضافة طبقة
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default LayerPanel;