/*
نسخة احترافية من DraggableFieldsPreview
- أحجام النصوص والحقول كنسب من حجم الصورة الأصلية
- Stage فقط يعمل له Scale
- معاينة = صورة نهائية بدقة 100%
*/

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group, Rect, Line } from 'react-konva';

// إعدادات ثابتة
const BASE_IMAGE_WIDTH = 1000; // العرض المرجعي للتصميم الأصلي

interface EditorSettings {
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  snapThreshold?: number;
}

interface FieldType {
  id: number;
  name: string;
  label?: string;
  type: 'text' | 'image';
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: any;
}

interface DraggableFieldsPreviewProps {
  templateImage: string;
  fields: FieldType[];
  selectedField?: FieldType;
  onFieldPositionChange?: (id: number, pos: { x: number; y: number, snapToGrid?: boolean }) => void;
  onSelectField?: (field: FieldType) => void;
  editorSettings?: EditorSettings;
  width?: number;
  height?: number;
  className?: string;
}

export const DraggableFieldsPreviewEnhanced: React.FC<DraggableFieldsPreviewProps> = ({
  templateImage,
  fields,
  selectedField,
  onFieldPositionChange,
  onSelectField,
  editorSettings,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [guidelines, setGuidelines] = useState<{ x?: number; y?: number }>({});

  const gridSize = editorSettings?.gridSize || 50;
  const snapThreshold = editorSettings?.snapThreshold || 10;
  const gridEnabled = editorSettings?.gridEnabled !== undefined ? editorSettings.gridEnabled : true;
  const snapToGrid = editorSettings?.snapToGrid !== undefined ? editorSettings.snapToGrid : true;

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setBackgroundImage(img);
      setImageSize({ width: img.width, height: img.height });
      
      // حساب حجم Stage المناسب ليناسب الحاوية
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight || 600;
        
        const widthRatio = containerWidth / img.width;
        const heightRatio = containerHeight / img.height;
        const newScale = Math.min(widthRatio, heightRatio, 1);
        
        setStageScale(newScale);
      }
    };
    img.src = templateImage;
  }, [templateImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedField) return;
      const moveAmount = e.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -moveAmount;
      if (e.key === 'ArrowRight') dx = moveAmount;
      if (e.key === 'ArrowUp') dy = -moveAmount;
      if (e.key === 'ArrowDown') dy = moveAmount;

      if (e.ctrlKey) {
        // تحريك Stage (تمرير الكنفا)
        setStagePos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      } else {
        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          const current = getFieldPosition(selectedField);
          const newPos = { x: current.x + dx, y: current.y + dy };
          if (onFieldPositionChange) {
            onFieldPositionChange(selectedField.id, {
              x: (newPos.x / imageSize.width) * 100,
              y: (newPos.y / imageSize.height) * 100,
              snapToGrid: selectedField.position.snapToGrid
            });
          }
        }
      }
      if (e.key === '+') setStageScale(s => Math.min(s + 0.1, 4));
      if (e.key === '-') setStageScale(s => Math.max(s - 0.1, 0.2));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedField, onFieldPositionChange, imageSize]);

  // تحويل النسب المئوية إلى بكسل
  const getFieldPosition = (field: FieldType) => {
    const x = (field.position.x / 100) * imageSize.width;
    const y = (field.position.y / 100) * imageSize.height;
    return { x, y };
  };

  const calculateSnapGuidelines = () => {
    const lines = [];
    for (let i = 0; i <= imageSize.width; i += gridSize) {
      lines.push({ x: i });
    }
    for (let j = 0; j <= imageSize.height; j += gridSize) {
      lines.push({ y: j });
    }
    lines.push({ x: imageSize.width / 2 });
    lines.push({ y: imageSize.height / 2 });
    fields.forEach(f => {
      const pos = getFieldPosition(f);
      lines.push({ x: pos.x });
      lines.push({ y: pos.y });
    });
    return lines;
  };

  const applySnapToGuidelines = (x: number, y: number) => {
    const lines = calculateSnapGuidelines();
    let closestX: number | undefined;
    let closestY: number | undefined;

    lines.forEach(line => {
      if (line.x !== undefined && Math.abs(x - line.x) < snapThreshold) closestX = line.x;
      if (line.y !== undefined && Math.abs(y - line.y) < snapThreshold) closestY = line.y;
    });

    setGuidelines({ x: closestX, y: closestY });
    return {
      x: closestX !== undefined ? closestX : x,
      y: closestY !== undefined ? closestY : y
    };
  };

  // معالجة عجلة الموس للتكبير/التصغير والتمرير الأفقي
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      // التكبير/التصغير
      e.preventDefault();
      const delta = e.deltaY;
      const scaleBy = delta > 0 ? 0.9 : 1.1;
      setStageScale(prev => Math.max(0.2, Math.min(4, prev * scaleBy)));
    } else if (e.shiftKey) {
      // التمرير الأفقي
      e.preventDefault();
      setStagePos(prev => ({ x: prev.x - e.deltaY, y: prev.y }));
    } else {
      // التمرير العمودي (سلوك افتراضي للمتصفح)
    }
  };

  const renderField = (field: FieldType) => {
    const pos = getFieldPosition(field);
    const style = field.style || {};
    
    // حساب حجم الخط كنسبة من حجم الصورة الأصلية
    // كما هو مستخدم في مولد الصورة على السيرفر تمامًا
    const fontSize = (style.fontSize || 24) * (imageSize.width / BASE_IMAGE_WIDTH);
    const fieldWidth = (style.width || 200) * (imageSize.width / BASE_IMAGE_WIDTH);
    const fieldHeight = (style.height || 100) * (imageSize.width / BASE_IMAGE_WIDTH);

    if (field.type === 'text') {
      return (
        <Text
          text={field.label || field.name}
          fontSize={fontSize}
          fontFamily={style.fontFamily || 'Cairo'}
          fontStyle={style.fontWeight === 'bold' ? 'bold' : 'normal'}
          fill={style.color || '#1e293b'}
          align={style.align || 'center'}
          width={fieldWidth}
          offsetX={style.align === 'center' ? fieldWidth / 2 : 0}
          offsetY={fontSize / 2}
          stroke={selectedField?.id === field.id ? '#3b82f6' : undefined}
          strokeWidth={selectedField?.id === field.id ? 1 : 0}
        />
      );
    }
    if (field.type === 'image') {
      const imgWidth = style.imageMaxWidth || Math.round(imageSize.width / 4);
      const imgHeight = style.imageMaxHeight || Math.round(imageSize.height / 4);
      
      return (
        <Rect
          width={imgWidth}
          height={imgHeight}
          fill="#e0f2fe"
          stroke="#0ea5e9"
          strokeWidth={2}
          cornerRadius={8}
          offsetX={imgWidth / 2}
          offsetY={imgHeight / 2}
        />
      );
    }
  };

  // رسم الشبكة إذا كانت مفعلة
  const renderGrid = () => {
    if (!gridEnabled) return null;
    
    const lines = [];
    
    // خطوط أفقية
    for (let i = 0; i <= imageSize.height; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, imageSize.width, i]}
          stroke="#cccccc"
          strokeWidth={i % (gridSize * 2) === 0 ? 0.5 : 0.3}
          opacity={0.5}
        />
      );
    }
    
    // خطوط عمودية
    for (let i = 0; i <= imageSize.width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, imageSize.height]}
          stroke="#cccccc"
          strokeWidth={i % (gridSize * 2) === 0 ? 0.5 : 0.3}
          opacity={0.5}
        />
      );
    }
    
    // خطوط منتصف الصورة
    lines.push(
      <Line
        key="center-h"
        points={[0, imageSize.height / 2, imageSize.width, imageSize.height / 2]}
        stroke="#ff0000"
        strokeWidth={0.8}
        opacity={0.5}
        dash={[5, 5]}
      />
    );
    lines.push(
      <Line
        key="center-v"
        points={[imageSize.width / 2, 0, imageSize.width / 2, imageSize.height]}
        stroke="#ff0000"
        strokeWidth={0.8}
        opacity={0.5}
        dash={[5, 5]}
      />
    );
    
    return lines;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[600px] overflow-auto border border-gray-300 rounded-md ${className || ''}`}
      onWheel={handleWheel}
    >
      <Stage
        ref={stageRef}
        width={imageSize.width}
        height={imageSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        style={{ backgroundColor: '#f9fafb' }}
      >
        <Layer>
          {backgroundImage && (
            <KonvaImage
              image={backgroundImage}
              width={imageSize.width}
              height={imageSize.height}
            />
          )}
        </Layer>

        <Layer>
          {renderGrid()}
        </Layer>

        <Layer>
          {fields.map((field) => (
            <Group
              key={field.id}
              x={getFieldPosition(field).x}
              y={getFieldPosition(field).y}
              draggable
              onClick={() => onSelectField?.(field)}
              onDragMove={(e) => {
                const snap = applySnapToGuidelines(e.target.x(), e.target.y());
                e.target.position(snap);
              }}
              onDragEnd={(e) => {
                const newX = (e.target.x() / imageSize.width) * 100;
                const newY = (e.target.y() / imageSize.height) * 100;
                
                // تحديد ما إذا كان الموضع منجذبًا للشبكة
                const snappedToX = Math.abs(e.target.x() - Math.round(e.target.x() / gridSize) * gridSize) < snapThreshold;
                const snappedToY = Math.abs(e.target.y() - Math.round(e.target.y() / gridSize) * gridSize) < snapThreshold;
                const isSnappedToGrid = snappedToX && snappedToY;
                
                onFieldPositionChange?.(field.id, { 
                  x: parseFloat(newX.toFixed(2)), 
                  y: parseFloat(newY.toFixed(2)),
                  snapToGrid: isSnappedToGrid
                });
                setGuidelines({});
              }}
            >
              {renderField(field)}
            </Group>
          ))}
        </Layer>

        <Layer>
          {guidelines.x !== undefined && (
            <Line points={[guidelines.x, 0, guidelines.x, imageSize.height]} stroke="#3b82f6" dash={[4, 4]} />
          )}
          {guidelines.y !== undefined && (
            <Line points={[0, guidelines.y, imageSize.width, guidelines.y]} stroke="#3b82f6" dash={[4, 4]} />
          )}
        </Layer>
      </Stage>

      <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 px-2 py-1 rounded text-xs">
        <span>{Math.round(stageScale * 100)}% | </span>
        <span>{imageSize.width}×{imageSize.height}px</span>
      </div>
    </div>
  );
};