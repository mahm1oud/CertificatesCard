import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LayerPanel from '@/components/ui/layer-panel';
import LogoPicker from '@/components/ui/logo-picker';
import SignaturePicker from '@/components/ui/signature-picker';
import { Layer } from '@shared/schema';
import { useUserLogos } from '@/hooks/useLogos';
import { useSignatures } from '@/hooks/useSignatures';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Layers, Image, Settings, Save, ArrowLeft, FileImage,
  Pen, Stamp, ImagePlus, Undo, Redo 
} from 'lucide-react';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EditorState {
  template: {
    id: number;
    name: string;
    imageUrl: string;
  };
  selectedLayerId?: number;
  formData: Record<string, any>;
  selectedLogo?: {
    id: number;
    imageUrl: string;
  };
  selectedSignature?: {
    id: number;
    imageUrl: string;
  };
  selectedStamp?: {
    id: number;
    imageUrl: string;
  };
}

interface LayeredTemplateEditorProps {
  templateId: number;
  templateName: string;
  templateImageUrl: string;
  initialFormData?: Record<string, any>;
  onSave?: (editorState: EditorState) => void;
  onBack?: () => void;
}

export function LayeredTemplateEditor({
  templateId,
  templateName,
  templateImageUrl,
  initialFormData = {},
  onSave,
  onBack
}: LayeredTemplateEditorProps) {
  const { toast } = useToast();
  const [editorState, setEditorState] = useState<EditorState>({
    template: {
      id: templateId,
      name: templateName,
      imageUrl: templateImageUrl
    },
    formData: initialFormData,
    selectedLayerId: undefined,
    selectedLogo: undefined,
    selectedSignature: undefined,
    selectedStamp: undefined
  });
  
  const [activeTab, setActiveTab] = useState('layers');
  
  // معالجة اختيار طبقة
  const handleSelectLayer = (layer: Layer) => {
    setEditorState(prev => ({
      ...prev,
      selectedLayerId: layer.id
    }));
  };
  
  // معالجة تحديث موضع الطبقة
  const handleUpdateLayerPosition = (layer: Layer, position: Position) => {
    // تنفيذ منطق تحديث موضع الطبقة
    console.log('تحديث موضع الطبقة:', layer, position);
  };
  
  // معالجة اختيار شعار
  const handleSelectLogo = (logo: { id: number; imageUrl: string }) => {
    setEditorState(prev => ({
      ...prev,
      selectedLogo: logo.id ? logo : undefined
    }));
  };
  
  // معالجة اختيار توقيع
  const handleSelectSignature = (signature: { id: number; imageUrl: string }) => {
    setEditorState(prev => ({
      ...prev,
      selectedSignature: signature.id ? signature : undefined
    }));
  };
  
  // معالجة اختيار ختم
  const handleSelectStamp = (stamp: { id: number; imageUrl: string }) => {
    setEditorState(prev => ({
      ...prev,
      selectedStamp: stamp.id ? stamp : undefined
    }));
  };
  
  // معالجة حفظ القالب
  const handleSave = () => {
    if (onSave) {
      onSave(editorState);
    }
    
    toast({
      title: "تم الحفظ",
      description: "تم حفظ التعديلات بنجاح",
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* شريط الأدوات العلوي */}
      <div className="bg-white border-b p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 ml-1" />
            <span>رجوع</span>
          </Button>
          <h2 className="font-medium">{templateName}</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Redo className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 ml-1" />
            <span>حفظ</span>
          </Button>
        </div>
      </div>
      
      {/* منطقة التحرير الرئيسية */}
      <div className="flex-1 flex">
        {/* لوحة الطبقات والخصائص */}
        <div className="w-80 border-l bg-gray-50 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="layers">
                <Layers className="h-4 w-4 mr-1" />
                <span>الطبقات</span>
              </TabsTrigger>
              <TabsTrigger value="assets">
                <Image className="h-4 w-4 mr-1" />
                <span>الأصول</span>
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-1" />
                <span>الإعدادات</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="layers" className="p-2">
              <LayerPanel
                templateId={templateId}
                onSelectLayer={handleSelectLayer}
                onUpdateLayerPosition={handleUpdateLayerPosition}
                selectedLayerId={editorState.selectedLayerId}
              />
            </TabsContent>
            
            <TabsContent value="assets" className="p-4 space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">الشعار</h3>
                <LogoPicker
                  onSelect={handleSelectLogo}
                  selectedLogoId={editorState.selectedLogo?.id}
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">التوقيع</h3>
                <SignaturePicker
                  onSelect={handleSelectSignature}
                  selectedSignatureId={editorState.selectedSignature?.id}
                  signatureType="signature"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">الختم</h3>
                <SignaturePicker
                  onSelect={handleSelectStamp}
                  selectedSignatureId={editorState.selectedStamp?.id}
                  signatureType="stamp"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">صورة مخصصة</h3>
                <Button variant="outline" className="w-full h-auto p-4 border-dashed flex flex-col items-center justify-center gap-2">
                  <ImagePlus className="h-10 w-10 text-gray-400" />
                  <span className="text-sm">إضافة صورة</span>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="p-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-center text-gray-500">
                    إعدادات القالب (قريبًا)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* منطقة العرض الرئيسية للقالب */}
        <div className="flex-1 bg-gray-100 p-0 flex items-center justify-center overflow-auto">
          <div
            className="relative bg-white shadow-lg w-full h-full"
            style={{ minHeight: 'calc(100vh - 57px)' }} // الارتفاع الكامل للشاشة مع مراعاة شريط الأدوات العلوي
          >
            {/* صورة القالب الأساسية */}
            <img
              src={templateImageUrl}
              alt={templateName}
              className="w-full h-full object-contain absolute inset-0 z-0"
              style={{ maxHeight: '100%', maxWidth: '100%' }}
              onError={(e) => {
                console.error("Error loading template image:", templateId);
                e.currentTarget.src = 'https://via.placeholder.com/794x1123?text=Template+Image+Not+Found';
              }}
            />
            
            {/* تراكبات الطبقات ستظهر هنا */}
            {editorState.selectedLogo && (
              <div
                className="absolute cursor-move border-2 border-transparent hover:border-blue-400"
                style={{
                  top: '50px',
                  left: '50px',
                  width: '100px',
                  height: '100px',
                  zIndex: 10 // إضافة z-index للشعار
                }}
              >
                <img
                  src={editorState.selectedLogo.imageUrl}
                  alt="شعار"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("Error loading logo image");
                    e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Logo+Not+Found';
                  }}
                />
              </div>
            )}
            
            {editorState.selectedSignature && (
              <div
                className="absolute cursor-move border-2 border-transparent hover:border-blue-400"
                style={{
                  bottom: '100px',
                  left: '100px',
                  width: '150px',
                  height: '80px',
                  zIndex: 20 // إضافة z-index للتوقيع
                }}
              >
                <img
                  src={editorState.selectedSignature.imageUrl}
                  alt="توقيع"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("Error loading signature image");
                    e.currentTarget.src = 'https://via.placeholder.com/150x80?text=Signature+Not+Found';
                  }}
                />
              </div>
            )}
            
            {editorState.selectedStamp && (
              <div
                className="absolute cursor-move border-2 border-transparent hover:border-blue-400"
                style={{
                  bottom: '120px',
                  right: '80px',
                  width: '120px',
                  height: '120px',
                  zIndex: 30 // إضافة z-index للختم
                }}
              >
                <img
                  src={editorState.selectedStamp.imageUrl}
                  alt="ختم"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("Error loading stamp image");
                    e.currentTarget.src = 'https://via.placeholder.com/120x120?text=Stamp+Not+Found';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LayeredTemplateEditor;