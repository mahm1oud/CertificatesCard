import React from 'react';
import { useTranslation } from '@/lib/i18n';
import AdminLayout from '@/components/admin/layout';
import AdminDashboard from '@/components/admin/dashboard';

export default function AdminPage() {
  const { t } = useTranslation();
  
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}