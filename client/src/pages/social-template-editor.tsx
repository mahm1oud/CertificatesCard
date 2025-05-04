/**
 * محرر قوالب اجتماعية متكامل
 * الإصدار 1.0 - أبريل 2025
 * 
 * صفحة خاصة لتحرير القوالب مع معاينة للشبكات الاجتماعية
 * يوفر هذا المحرر:
 * - إمكانية سحب وإفلات للعناصر
 * - تحرير خصائص العناصر
 * - معاينة فورية للشبكات الاجتماعية
 * - إمكانية تنزيل الصور بتنسيقات مختلفة
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { DraggableFieldsPreviewPro2 } from '@/components/template-editor/DraggableFieldsPreviewPro2';
import { SocialOptimizedImageGenerator } from '@/components/konva-image-generator/social-optimized-image-generator';
import { downloadImage } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { 
  Download, Save, Image as ImageIcon, Type, Layers, Eye, EyeOff, 
  Copy, Facebook, Twitter, Instagram, Linkedin
} from 'lucide-react';

interface Field {
  id: number;
  name: string;
  label?: string;
  type: 'text' | 'image';
  position: { x: number; y: number, snapToGrid?: boolean };
  style?: any;
  zIndex?: number;
  visible?: boolean;
  rotation?: number;
  size?: { width: number; height: number };
}

interface TemplateData {
  id: number;
  title: string;
  imageUrl: string;
  fields: Field[];
}

interface SocialTemplateEditorProps {
  templateId?: string;
  params?: { templateId: string };
}

const SocialTemplateEditor: React.FC<SocialTemplateEditorProps> = (props) => {
  // دعم مباشر من الواجهة أو من wouter router params
  const templateId = props.templateId || props.params?.templateId;
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('editor');
  const [socialFormat, setSocialFormat] = useState('instagram');
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<Field[]>([]);
  const [socialPreviewUrl, setSocialPreviewUrl] = useState<string | null>(null);
  
  // جلب معلومات القالب
  const { data: templateData, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['/api/templates', templateId],
    queryFn: () => apiRequest('GET', `/api/templates/${templateId}`),
    enabled: !!templateId,
  });
  
  // جلب تنسيقات وسائل التواصل الاجتماعي
  const { data: socialFormats } = useQuery({
    queryKey: ['/api/social-formats'],
    queryFn: () => apiRequest('GET', '/api/social-formats'),
  });
  
  // حفظ تعديلات القالب
  const { mutate: saveTemplate, isPending: isSaving } = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/templates/${templateId}`, data);
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('templateSaved'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('errorSavingTemplate'),
        variant: 'destructive',
      });
    },
  });
  
  // إعداد الحقول عند تحميل القالب
  useEffect(() => {
    if (templateData) {
      const template = templateData as TemplateData;
      // تأكد من وجود zIndex لجميع الحقول
      const fieldsWithZIndex = template.fields.map((field, index) => ({
        ...field,
        zIndex: field.zIndex !== undefined ? field.zIndex : index,
      }));
      setFields(fieldsWithZIndex);
    }
  }, [templateData]);
  
  // تحديد الحقل المحدد
  const selectedField = selectedFieldId !== null ? fields.find(f => f.id === selectedFieldId) : null;
  
  // تحديث حقل
  const updateField = (updatedField: Field) => {
    const newFields = fields.map(field => 
      field.id === updatedField.id ? updatedField : field
    );
    setFields(newFields);
  };
  
  // إضافة حقل جديد
  const addNewField = (type: 'text' | 'image') => {
    const maxId = Math.max(0, ...fields.map(f => f.id));
    const maxZIndex = Math.max(0, ...fields.map(f => f.zIndex || 0));
    
    const newField: Field = {
      id: maxId + 1,
      name: type === 'text' ? `text_${maxId + 1}` : `image_${maxId + 1}`,
      label: type === 'text' ? t('newTextField') : t('newImageField'),
      type,
      position: { x: 50, y: 50 },
      zIndex: maxZIndex + 1,
      style: type === 'text' ? {
        fontFamily: 'Cairo',
        fontSize: 24,
        color: '#000000',
        align: 'center',
      } : {
        imageMaxWidth: 200,
        imageMaxHeight: 200,
      }
    };
    
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };
  
  // حذف حقل
  const deleteField = (fieldId: number) => {
    const newFields = fields.filter(field => field.id !== fieldId);
    setFields(newFields);
    setSelectedFieldId(null);
  };
  
  // نسخ حقل
  const duplicateField = (fieldId: number) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;
    
    const maxId = Math.max(0, ...fields.map(f => f.id));
    const maxZIndex = Math.max(0, ...fields.map(f => f.zIndex || 0));
    
    const newField = {
      ...JSON.parse(JSON.stringify(fieldToDuplicate)),
      id: maxId + 1,
      name: `${fieldToDuplicate.name}_copy`,
      zIndex: maxZIndex + 1,
      position: {
        ...fieldToDuplicate.position,
        x: fieldToDuplicate.position.x + 5,
        y: fieldToDuplicate.position.y + 5,
      }
    };
    
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };
  
  // تبديل رؤية الحقل
  const toggleFieldVisibility = (fieldId: number) => {
    const fieldToToggle = fields.find(f => f.id === fieldId);
    if (!fieldToToggle) return;
    
    updateField({
      ...fieldToToggle,
      visible: fieldToToggle.visible === false ? true : false,
    });
  };
  
  // حفظ كل التغييرات
  const handleSaveTemplate = () => {
    const dataToSave = {
      fields: fields.map(field => ({
        ...field,
        position: {
          x: field.position.x,
          y: field.position.y,
        }
      }))
    };
    
    saveTemplate(dataToSave);
  };
  
  // تنزيل الصورة الاجتماعية الحالية
  const handleDownloadSocialImage = () => {
    if (socialPreviewUrl) {
      const fileName = `${templateData?.title || 'template'}_${socialFormat}.png`;
      downloadImage(socialPreviewUrl, fileName);
    }
  };
  
  // تعبئة بيانات المعاينة
  const fillPreviewData = () => {
    const data: Record<string, any> = {};
    
    fields.forEach(field => {
      if (field.type === 'text') {
        data[field.name] = field.label || field.name;
      } else if (field.type === 'image') {
        // استخدم صورة افتراضية للمعاينة
        data[field.name] = '/uploads/placeholder.jpg';
      }
    });
    
    setPreviewData(data);
  };
  
  // تحديث بيانات المعاينة عند تغيير الحقول
  useEffect(() => {
    fillPreviewData();
  }, [fields]);
  
  // رسم محرر الخصائص للحقل المحدد
  const renderFieldProperties = () => {
    if (!selectedField) {
      return (
        <div className="p-4 text-center text-gray-500">
          {t('selectFieldToEdit')}
        </div>
      );
    }
    
    const { type, style = {} } = selectedField;
    
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{selectedField.name}</h3>
          <div className="space-x-2 rtl:space-x-reverse">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => toggleFieldVisibility(selectedField.id)}
              title={selectedField.visible === false ? t('show') : t('hide')}
            >
              {selectedField.visible === false ? <Eye size={18} /> : <EyeOff size={18} />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => duplicateField(selectedField.id)}
              title={t('duplicate')}
            >
              <Copy size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => deleteField(selectedField.id)}
              title={t('delete')}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label htmlFor="field-label">{t('label')}</Label>
          <Input 
            id="field-label" 
            value={selectedField.label || ''} 
            onChange={(e) => updateField({ ...selectedField, label: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="field-position-x">{t('positionX')} (%)</Label>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Slider 
              id="field-position-x"
              min={0}
              max={100}
              step={0.1}
              value={[selectedField.position.x]}
              onValueChange={(value) => updateField({ 
                ...selectedField, 
                position: { ...selectedField.position, x: value[0] } 
              })}
            />
            <span className="w-10 text-center">{selectedField.position.x.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="field-position-y">{t('positionY')} (%)</Label>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Slider 
              id="field-position-y"
              min={0}
              max={100}
              step={0.1}
              value={[selectedField.position.y]}
              onValueChange={(value) => updateField({ 
                ...selectedField, 
                position: { ...selectedField.position, y: value[0] } 
              })}
            />
            <span className="w-10 text-center">{selectedField.position.y.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="field-rotation">{t('rotation')} (°)</Label>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Slider 
              id="field-rotation"
              min={0}
              max={360}
              step={1}
              value={[selectedField.rotation || 0]}
              onValueChange={(value) => updateField({ 
                ...selectedField, 
                rotation: value[0]
              })}
            />
            <span className="w-10 text-center">{(selectedField.rotation || 0).toFixed(0)}°</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="field-z-index">{t('layer')}</Label>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Slider 
              id="field-z-index"
              min={0}
              max={Math.max(10, ...fields.map(f => f.zIndex || 0) + 1)}
              step={1}
              value={[selectedField.zIndex || 0]}
              onValueChange={(value) => updateField({ 
                ...selectedField, 
                zIndex: value[0]
              })}
            />
            <span className="w-10 text-center">{selectedField.zIndex || 0}</span>
          </div>
        </div>
        
        <Separator />
        
        {type === 'text' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="field-font-family">{t('fontFamily')}</Label>
              <Select
                value={style.fontFamily || 'Cairo'}
                onValueChange={(value) => updateField({
                  ...selectedField,
                  style: { ...style, fontFamily: value }
                })}
              >
                <SelectTrigger id="field-font-family">
                  <SelectValue placeholder={t('selectFont')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cairo">Cairo</SelectItem>
                  <SelectItem value="Tajawal">Tajawal</SelectItem>
                  <SelectItem value="Amiri">Amiri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-font-size">{t('fontSize')} (px)</Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Slider 
                  id="field-font-size"
                  min={14}
                  max={60}
                  step={1}
                  value={[style.fontSize || 24]}
                  onValueChange={(value) => updateField({ 
                    ...selectedField, 
                    style: { ...style, fontSize: value[0] } 
                  })}
                />
                <span className="w-10 text-center">{style.fontSize || 24}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-font-weight">{t('fontWeight')}</Label>
              <Select
                value={style.fontWeight || 'normal'}
                onValueChange={(value) => updateField({
                  ...selectedField,
                  style: { ...style, fontWeight: value }
                })}
              >
                <SelectTrigger id="field-font-weight">
                  <SelectValue placeholder={t('selectFontWeight')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{t('normal')}</SelectItem>
                  <SelectItem value="bold">{t('bold')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-text-align">{t('textAlign')}</Label>
              <Select
                value={style.align || 'center'}
                onValueChange={(value) => updateField({
                  ...selectedField,
                  style: { ...style, align: value }
                })}
              >
                <SelectTrigger id="field-text-align">
                  <SelectValue placeholder={t('selectAlignment')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">{t('left')}</SelectItem>
                  <SelectItem value="center">{t('center')}</SelectItem>
                  <SelectItem value="right">{t('right')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-color">{t('color')}</Label>
              <div className="flex">
                <Input 
                  id="field-color" 
                  type="color" 
                  value={style.color || '#000000'} 
                  onChange={(e) => updateField({ 
                    ...selectedField, 
                    style: { ...style, color: e.target.value } 
                  })}
                  className="w-12 h-10 p-1 ml-2"
                />
                <Input 
                  type="text" 
                  value={style.color || '#000000'} 
                  onChange={(e) => updateField({ 
                    ...selectedField, 
                    style: { ...style, color: e.target.value } 
                  })}
                  className="flex-1 ml-2"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="field-text-shadow">{t('textShadow')}</Label>
                <Switch 
                  id="field-text-shadow"
                  checked={style.textShadow?.enabled || false}
                  onCheckedChange={(checked) => updateField({
                    ...selectedField,
                    style: { 
                      ...style, 
                      textShadow: { 
                        ...(style.textShadow || {}), 
                        enabled: checked,
                        color: style.textShadow?.color || '#000000',
                        blur: style.textShadow?.blur || 3
                      } 
                    }
                  })}
                />
              </div>
              
              {style.textShadow?.enabled && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Label className="w-20">{t('shadowColor')}</Label>
                    <Input 
                      type="color" 
                      value={style.textShadow?.color || '#000000'} 
                      onChange={(e) => updateField({ 
                        ...selectedField, 
                        style: { 
                          ...style, 
                          textShadow: { 
                            ...style.textShadow, 
                            color: e.target.value 
                          } 
                        } 
                      })}
                      className="w-12 h-10 p-1"
                    />
                    <Input 
                      type="text" 
                      value={style.textShadow?.color || '#000000'} 
                      onChange={(e) => updateField({ 
                        ...selectedField, 
                        style: { 
                          ...style, 
                          textShadow: { 
                            ...style.textShadow, 
                            color: e.target.value 
                          } 
                        } 
                      })}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Label className="w-20">{t('shadowBlur')}</Label>
                    <Slider 
                      min={0}
                      max={20}
                      step={1}
                      value={[style.textShadow?.blur || 3]}
                      onValueChange={(value) => updateField({ 
                        ...selectedField, 
                        style: { 
                          ...style, 
                          textShadow: { 
                            ...style.textShadow, 
                            blur: value[0] 
                          } 
                        } 
                      })}
                      className="flex-1"
                    />
                    <span className="w-10 text-center">{style.textShadow?.blur || 3}px</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {type === 'image' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="field-max-width">{t('maxWidth')}</Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Slider 
                  id="field-max-width"
                  min={50}
                  max={500}
                  step={10}
                  value={[style.imageMaxWidth || 200]}
                  onValueChange={(value) => updateField({ 
                    ...selectedField, 
                    style: { ...style, imageMaxWidth: value[0] } 
                  })}
                />
                <span className="w-12 text-center">{style.imageMaxWidth || 200}px</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="field-max-height">{t('maxHeight')}</Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Slider 
                  id="field-max-height"
                  min={50}
                  max={500}
                  step={10}
                  value={[style.imageMaxHeight || 200]}
                  onValueChange={(value) => updateField({ 
                    ...selectedField, 
                    style: { ...style, imageMaxHeight: value[0] } 
                  })}
                />
                <span className="w-12 text-center">{style.imageMaxHeight || 200}px</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Label htmlFor="field-image-rounded" className="flex-1">{t('roundedCorners')}</Label>
              <Switch 
                id="field-image-rounded"
                checked={style.imageRounded || false}
                onCheckedChange={(checked) => updateField({
                  ...selectedField,
                  style: { ...style, imageRounded: checked }
                })}
              />
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Label htmlFor="field-image-border" className="flex-1">{t('border')}</Label>
              <Switch 
                id="field-image-border"
                checked={style.imageBorder || false}
                onCheckedChange={(checked) => updateField({
                  ...selectedField,
                  style: { ...style, imageBorder: checked }
                })}
              />
            </div>
          </>
        )}
      </div>
    );
  };
  
  if (isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-6 rtl:space-x-reverse">
        <div className="lg:w-3/4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>
                  {templateData?.title || t('templateEditor')}
                </CardTitle>
                <div className="space-x-2 rtl:space-x-reverse">
                  <Button variant="outline" onClick={handleSaveTemplate} disabled={isSaving}>
                    {isSaving ? t('saving') : t('save')}
                    <Save className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="editor">
                    <Layers className="h-4 w-4 mr-2" />
                    {t('editor')}
                  </TabsTrigger>
                  <TabsTrigger value="social">
                    <svg width="16" height="16" className="mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 2H6a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM16 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="m8.5 13.5 5-3M12.5 11.5l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t('socialPreviews')}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="mt-0">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addNewField('text')}
                      >
                        <Type className="h-4 w-4 mr-2" />
                        {t('addTextField')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addNewField('image')}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {t('addImageField')}
                      </Button>
                    </div>
                    
                    <DraggableFieldsPreviewPro2
                      templateImage={templateData?.imageUrl || ''}
                      fields={fields}
                      onFieldsChange={setFields}
                      className="mb-4"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="social" className="mt-0">
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-wrap gap-2 mt-2 mb-4">
                      <Button 
                        variant={socialFormat === 'instagram' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSocialFormat('instagram')}
                      >
                        <Instagram className="h-4 w-4 mr-2" />
                        Instagram
                      </Button>
                      <Button 
                        variant={socialFormat === 'facebook' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSocialFormat('facebook')}
                      >
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </Button>
                      <Button 
                        variant={socialFormat === 'twitter' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSocialFormat('twitter')}
                      >
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </Button>
                      <Button 
                        variant={socialFormat === 'linkedin' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSocialFormat('linkedin')}
                      >
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </Button>
                    </div>
                    
                    <SocialOptimizedImageGenerator
                      templateImage={templateData?.imageUrl || ''}
                      fields={fields}
                      formData={previewData}
                      format={socialFormat}
                      quality="medium"
                      onImageGenerated={setSocialPreviewUrl}
                      className="mb-4"
                    />
                    
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleDownloadSocialImage}
                        disabled={!socialPreviewUrl}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t('downloadImage')}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:w-1/4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('properties')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderFieldProperties()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SocialTemplateEditor;