/**
 * مكون للوصول السريع إلى معاينة محرر الطبقات الجديد
 * سيتم إزالة هذا المكون بعد دمج الميزة بشكل كامل في النظام
 */

import React from 'react';
import { Link } from 'wouter';
import { Layers } from 'lucide-react';

export default function AccessLayers() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Link href="/template-editor-layers">
        <a className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center gap-2 shadow-lg">
          <Layers className="w-5 h-5" />
          <span>محرر القوالب مع طبقات</span>
        </a>
      </Link>
    </div>
  );
}
