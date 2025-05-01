import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * مكون رأس الصفحة
 * يوفر عنوان ووصف موحد للصفحات
 * 
 * @param title - عنوان الصفحة
 * @param description - وصف الصفحة (اختياري)
 * @param className - classes إضافية (اختياري)
 * @param children - محتوى إضافي (اختياري)
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  className,
  children
}) => {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
      {children}
    </div>
  );
};

export default PageHeader;