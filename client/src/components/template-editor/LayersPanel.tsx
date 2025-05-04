/**
 * مكون لوحة الطبقات البسيط
 * يعرض قائمة لجميع الطبقات ويسمح بترتيبها وإظهارها/إخفائها
 * الإصدار 1.0 - مايو 2025
 */

import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  EyeOff, 
  GripVertical, 
  Layers, 
  Image as ImageIcon,
  Type as TextIcon,
  List, 
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ChevronsUpDown
} from 'lucide-react';

/**
 * واجهة الحقل المتوقع من مكون إدارة الطبقات
 */
interface LayerItem {
  id: number;
  name: string;
  label?: string;
  type: 'text' | 'image' | 'template' | 'dropdown' | 'radio' | string;
  zIndex?: number;
  visible?: boolean;
  position?: { x: number; y: number };
}

/**
 * واجهة خصائص مكون إدارة الطبقات
 */
interface LayersPanelProps {
  layers: LayerItem[];
  selectedLayerId: number | null;
  onLayerSelect: (id: number | null) => void;
  onLayerOrderChange: (sourceIndex: number, destinationIndex: number) => void;
  onLayerVisibilityToggle: (id: number) => void;
  onMoveLayerUp?: (id: number) => void;
  onMoveLayerDown?: (id: number) => void;
}

/**
 * مكون لوحة الطبقات
 */
export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerOrderChange,
  onLayerVisibilityToggle,
  onMoveLayerUp,
  onMoveLayerDown
}) => {
  // معالجة نهاية السحب والإفلات
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    onLayerOrderChange(result.source.index, result.destination.index);
  };

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
    <div className="layers-panel">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Layers className="w-5 h-5 mr-2" />
          <h3 className="text-sm font-medium">الطبقات</h3>
        </div>
      </div>
      
      <ScrollArea className="h-[320px] pr-3 rounded-md border">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layers-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1 p-1"
              >
                {layers.map((layer, index) => (
                  <Draggable
                    key={`layer-${layer.id}`}
                    draggableId={`layer-${layer.id}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          flex items-center p-2 rounded-md text-sm
                          ${selectedLayerId === layer.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/40 hover:bg-muted'}
                          ${snapshot.isDragging ? 'ring-1 ring-primary' : ''}
                          ${!layer.visible ? 'opacity-50' : ''}
                        `}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-move mr-1"
                          title="سحب لتغيير ترتيب الطبقة"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>
                        
                        <button
                          type="button"
                          className="p-1 rounded-sm mr-1 hover:bg-muted-foreground/10"
                          onClick={() => onLayerVisibilityToggle(layer.id)}
                          title={layer.visible ? "إخفاء الطبقة" : "إظهار الطبقة"}
                        >
                          {layer.visible !== false ? (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        
                        <div
                          className="flex-1 flex items-center cursor-pointer py-1 px-2"
                          onClick={() => onLayerSelect(layer.id)}
                        >
                          <span className="mr-2">{getLayerIcon(layer.type)}</span>
                          <span className="flex-1 truncate">
                            {layer.label || layer.name}
                          </span>
                        </div>
                        
                        <div className="flex space-x-1 rtl:space-x-reverse">
                          {onMoveLayerUp && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-sm"
                              onClick={() => onMoveLayerUp(layer.id)}
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
                              onClick={() => onMoveLayerDown(layer.id)}
                              title="نقل لأسفل"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>
    </div>
  );
};
