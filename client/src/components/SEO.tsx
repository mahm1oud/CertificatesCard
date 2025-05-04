import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  structuredData?: Record<string, any>;
}

/**
 * SEO المكون المسؤول عن تحسين محركات البحث
 * يستخدم react-helmet لإدارة العلامات الوصفية في الصفحة
 */
export default function SEO({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
  structuredData
}: SeoProps) {
  const [location] = useLocation();
  const [currentPageType, setCurrentPageType] = useState<string>('website');
  const [currentEntityId, setCurrentEntityId] = useState<number | null>(null);
  const [currentEntityType, setCurrentEntityType] = useState<string | null>(null);

  // جلب إعدادات SEO العامة إذا لم يتم توفير إعدادات خاصة
  const { data: globalSeoData } = useQuery({
    queryKey: ['/api/seo/global'],
    queryFn: async () => {
      try {
        const data = await apiRequest('GET', '/api/seo/global');
        return data;
      } catch (error) {
        console.error('Error fetching global SEO settings:', error);
        return null;
      }
    },
  });

  // جلب إعدادات SEO للكيان الحالي (مثل تصنيف أو قالب) - إذا كان متاحًا
  const { data: entitySeoData } = useQuery({
    queryKey: ['/api/seo/entity', currentEntityType, currentEntityId],
    queryFn: async () => {
      if (!currentEntityType || !currentEntityId) return null;
      
      try {
        const data = await apiRequest('GET', `/api/seo/${currentEntityType}/${currentEntityId}`);
        return data;
      } catch (error) {
        console.error(`Error fetching SEO settings for ${currentEntityType}/${currentEntityId}:`, error);
        return null;
      }
    },
    enabled: !!currentEntityType && !!currentEntityId,
  });

  // تحديد نوع الصفحة والكيان من المسار
  useEffect(() => {
    if (location) {
      // المسارات المتعلقة بالشهادات
      if (location.includes('/certificate/') || location.includes('/certificates/')) {
        setCurrentPageType('article');
        
        // محاولة استخراج معرف الشهادة
        const match = location.match(/\/certificate[s]?\/(\d+)/);
        if (match && match[1]) {
          setCurrentEntityId(parseInt(match[1]));
          setCurrentEntityType('certificate');
        }
      } 
      // المسارات المتعلقة بالبطاقات
      else if (location.includes('/cards/')) {
        setCurrentPageType('product');
        
        // محاولة استخراج معرف البطاقة
        const match = location.match(/\/cards\/(\d+)/);
        if (match && match[1]) {
          setCurrentEntityId(parseInt(match[1]));
          setCurrentEntityType('card');
        }
      }
      // المسارات المتعلقة بالتصنيفات
      else if (location.match(/\/category\/[\w-]+$/)) {
        setCurrentPageType('website');
        
        // جلب معرف التصنيف سيتطلب استعلامًا للحصول على معرف التصنيف بناءً على الاسم
        const slug = location.split('/').pop();
        if (slug) {
          // يمكن إجراء استعلام لجلب معرف التصنيف من اسم المسار، ولكن في هذه البساطة نتركه
          setCurrentEntityType('category');
          // setCurrentEntityId - ستحتاج لاستعلام إضافي
        }
      }
      // صفحة رئيسية أو أخرى
      else {
        setCurrentPageType('website');
        setCurrentEntityId(null);
        setCurrentEntityType(null);
      }
    }
  }, [location]);

  // تحديد البيانات النهائية: الأولوية للبيانات المقدمة، ثم بيانات الكيان الحالي، ثم البيانات العامة
  const finalTitle = title || (entitySeoData?.title) || (globalSeoData?.title) || 'منصة الشهادات والبطاقات الإلكترونية';
  const finalDescription = description || (entitySeoData?.description) || (globalSeoData?.description) || 'قم بإنشاء شهادات وبطاقات إلكترونية احترافية بكل سهولة';
  const finalKeywords = keywords || (entitySeoData?.keywords) || (globalSeoData?.keywords) || [];
  const finalOgImage = ogImage || (entitySeoData?.ogImage) || (globalSeoData?.ogImage) || '';
  const finalCanonicalUrl = canonicalUrl || (entitySeoData?.canonicalUrl) || (globalSeoData?.canonicalUrl) || '';
  const finalNoIndex = noIndex || (entitySeoData?.noIndex) || (globalSeoData?.noIndex) || false;
  const finalStructuredData = structuredData || (entitySeoData?.structuredData) || (globalSeoData?.structuredData) || {};
  const finalOgType = ogType || currentPageType;

  return (
    <Helmet>
      {/* العنوان الأساسي */}
      <title>{finalTitle}</title>
      
      {/* وصف الصفحة */}
      {finalDescription && <meta name="description" content={finalDescription} />}
      
      {/* الكلمات المفتاحية */}
      {finalKeywords.length > 0 && <meta name="keywords" content={finalKeywords.join(', ')} />}
      
      {/* منع الفهرسة إذا كان محددًا */}
      {finalNoIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* علامات Open Graph للمشاركة الاجتماعية */}
      <meta property="og:title" content={finalTitle} />
      {finalDescription && <meta property="og:description" content={finalDescription} />}
      <meta property="og:type" content={finalOgType} />
      {finalOgImage && <meta property="og:image" content={finalOgImage} />}
      <meta property="og:url" content={window.location.href} />
      
      {/* علامات Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      {finalDescription && <meta name="twitter:description" content={finalDescription} />}
      {finalOgImage && <meta name="twitter:image" content={finalOgImage} />}
      
      {/* الرابط القانوني */}
      {finalCanonicalUrl && <link rel="canonical" href={finalCanonicalUrl} />}
      
      {/* البيانات المنظمة (JSON-LD) */}
      {Object.keys(finalStructuredData).length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredData)}
        </script>
      )}
    </Helmet>
  );
}