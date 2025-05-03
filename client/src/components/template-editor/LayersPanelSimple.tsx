/**
 * مكون لوحة الطبقات البسيط
 * يعرض قائمة بسيطة لجميع الطبقات بما فيها صورة القالب
 * ويسمح بتحديدها وإخفائها وإظهارها
 */

import React from 'react';
import { 
  Eye, 
  EyeOff, 
  Layers, 
  Image as ImageIcon,
  Type as TextIcon,
  List, 
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ChevronsUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LayerItem {
  id: number;
  name: string;
  label?: string;
  type: 'text' | 'image' | 'template' | 'dropdown' | 'radio' | string;
  zIndex?: number;
  visible?: boolean;
}

interface LayersPanelSimpleProps {
  layers: LayerItem[];
  selectedLayerId: number | null;
  onLayerSelect: (id: number | null) => void;
  onLayerVisibilityToggle: (id: number) => void;
  onMoveLayerUp?: (id: number) => void;
  onMoveLayerDown?: (id: number) => void;
}

export const LayersPanelSimple: React.FC<LayersPanelSimpleProps> = ({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerVisibilityToggle,
  onMoveLayerUp,
  onMoveLayerDown
}) => {
  // تحديد أيقونة حسب نوع الطبقة
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <TextIcon className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'template':
        return <LayoutGrid className="w-4 h-4" />;
      case 'dropdown':
        return <ChevronsUpDown className="w-4 h-4" />;
      case 'radio':
        return <List className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="layers-panel-simple">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Layers className="w-5 h-5 mr-2" />
          <h3 className="text-sm font-medium">الطبقات</h3>
        </div>
      </div>
      
      <ScrollArea className="h-[320px] pr-3 rounded-md border">
        <div className="space-y-1 p-1">
          {layers.map((layer) => (
            <div
              key={`layer-${layer.id}`}
              className={`
                flex items-center p-2 rounded-md text-sm cursor-pointer
                ${selectedLayerId === layer.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/40 hover:bg-muted'}
                ${!layer.visible ? 'opacity-50' : ''}
              `}
              onClick={() => onLayerSelect(layer.id)}
            >
              <button
                type="button"
                className="p-1 rounded-sm mr-1 hover:bg-muted-foreground/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerVisibilityToggle(layer.id);
                }}
                title={layer.visible ? "إخفاء الطبقة" : "إظهار الطبقة"}
              >
                {layer.visible !== false ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              <div className="flex-1 flex items-center py-1 px-2">
                <span className="mr-2">{getLayerIcon(layer.type)}</span>
                <span className="flex-1 truncate">
                  {layer.label || layer.name}
                </span>
                <div className="text-xs bg-gray-100 text-gray-800 ml-2 px-1 rounded">
                  {layer.zIndex}
                </div>
              </div>
              
              {(onMoveLayerUp || onMoveLayerDown) && (
                <div className="flex space-x-1 rtl:space-x-reverse">
                  {onMoveLayerUp && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayerUp(layer.id);
                      }}
                      title="نقل لأعلى"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {onMoveLayerDown && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayerDown(layer.id);
                      }}
                      title="نقل لأسفل"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
