/**
 * محرر القوالب المتقدم
 * تم نقل هذا المكون إلى مكون آخر لإصلاح المشاكل النحوية
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdvancedTemplateEditorProps {
  templateId?: string | number;
  readOnly?: boolean;
}

export const AdvancedTemplateEditor: React.FC<AdvancedTemplateEditorProps> = ({ 
  templateId,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<string>('preview');

  return (
    <div className="advanced-template-editor p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">محرر القوالب المتقدم</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="preview">معاينة القالب</TabsTrigger>
          <TabsTrigger value="fields">الحقول</TabsTrigger>
          <TabsTrigger value="settings">إعدادات القالب</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>معاينة القالب</CardTitle>
              <CardDescription>انظر إلى النسخة المصلحة في AdvancedTemplateEditor-fixed.tsx</CardDescription>
            </CardHeader>
            <CardContent>
              <p>تم نقل هذا المكون إلى مكون آخر لإصلاح المشاكل النحوية</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fields" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>الحقول</CardTitle>
            </CardHeader>
            <CardContent>
              <p>تم نقل هذا المكون إلى مكون آخر لإصلاح المشاكل النحوية</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات القالب</CardTitle>
            </CardHeader>
            <CardContent>
              <p>تم نقل هذا المكون إلى مكون آخر لإصلاح المشاكل النحوية</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedTemplateEditor;
