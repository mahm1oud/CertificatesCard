import React from 'react';
import { useTranslation } from '@/lib/i18n';
import AdminLayout from '@/components/admin/layout';
import SocialAuthSettings from '@/components/admin/social-auth-settings';

export default function AuthSettingsPage() {
  const { t } = useTranslation();
  
  return (
    <AdminLayout>
      <SocialAuthSettings />
    </AdminLayout>
  );
}