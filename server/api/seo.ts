import { Request, Response } from 'express';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { seo, insertSeoSchema } from '../../shared/schema';

/**
 * الحصول على إعدادات SEO العامة للموقع
 */
export async function getGlobalSeoSettings(req: Request, res: Response) {
  try {
    // البحث عن الإعدادات العامة (entityType = 'global')
    const seoSettings = await db.query.seo.findFirst({
      where: and(
        eq(seo.entityType, 'global'),
        eq(seo.entityId, null)
      ),
    });

    // إذا لم تكن موجودة، إرجاع إعدادات فارغة
    if (!seoSettings) {
      return res.status(200).json({
        title: 'منصة الشهادات والبطاقات الإلكترونية',
        description: 'قم بإنشاء شهادات وبطاقات إلكترونية احترافية بكل سهولة',
        keywords: [],
        entityType: 'global',
        noIndex: false,
        structuredData: {},
      });
    }

    return res.status(200).json(seoSettings);
  } catch (error) {
    console.error('Error fetching global SEO settings:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب إعدادات SEO' });
  }
}

/**
 * حفظ إعدادات SEO العامة للموقع
 */
export async function saveGlobalSeoSettings(req: Request, res: Response) {
  try {
    // التحقق من صحة البيانات المرسلة
    const payload = {
      ...req.body,
      entityType: 'global',
      entityId: null,
      updatedBy: req.user?.id || null,
    };

    // البحث عن إعدادات SEO العامة الحالية
    const existingSeo = await db.query.seo.findFirst({
      where: and(
        eq(seo.entityType, 'global'),
        eq(seo.entityId, null)
      ),
    });

    // تحديث الإعدادات الحالية، أو إنشاء إعدادات جديدة إذا لم تكن موجودة
    let result;
    if (existingSeo) {
      // تحديث الإعدادات الموجودة
      result = await db
        .update(seo)
        .set({
          title: payload.title,
          description: payload.description || null,
          keywords: payload.keywords || [],
          ogImage: payload.ogImage || null,
          canonicalUrl: payload.canonicalUrl || null,
          noIndex: payload.noIndex || false,
          structuredData: payload.structuredData || {},
          updatedAt: new Date(),
          updatedBy: payload.updatedBy,
        })
        .where(and(
          eq(seo.entityType, 'global'),
          eq(seo.entityId, null)
        ))
        .returning();
    } else {
      // إنشاء إعدادات جديدة
      result = await db.insert(seo).values({
        title: payload.title,
        description: payload.description || null,
        keywords: payload.keywords || [],
        ogImage: payload.ogImage || null,
        entityType: 'global',
        entityId: null,
        canonicalUrl: payload.canonicalUrl || null,
        structuredData: payload.structuredData || {},
        noIndex: payload.noIndex || false,
        updatedBy: payload.updatedBy,
      }).returning();
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error saving global SEO settings:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ إعدادات SEO' });
  }
}

/**
 * الحصول على إعدادات SEO لكيان معين (تصنيف، قالب، إلخ)
 */
export async function getEntitySeoSettings(req: Request, res: Response) {
  try {
    const { entityType, entityId } = req.params;
    
    // التحقق من صحة البيانات المرسلة
    if (!entityType || !entityId || isNaN(Number(entityId))) {
      return res.status(400).json({ error: 'بيانات غير صالحة' });
    }

    // البحث عن إعدادات SEO للكيان المحدد
    const seoSettings = await db.query.seo.findFirst({
      where: and(
        eq(seo.entityType, entityType),
        eq(seo.entityId, Number(entityId))
      ),
    });

    // إذا لم تكن موجودة، إرجاع إعدادات فارغة
    if (!seoSettings) {
      return res.status(404).json({ error: 'لم يتم العثور على إعدادات SEO لهذا الكيان' });
    }

    return res.status(200).json(seoSettings);
  } catch (error) {
    console.error('Error fetching entity SEO settings:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء جلب إعدادات SEO' });
  }
}

/**
 * حفظ إعدادات SEO لكيان معين (تصنيف، قالب، إلخ)
 */
export async function saveEntitySeoSettings(req: Request, res: Response) {
  try {
    const { entityType, entityId } = req.params;
    
    // التحقق من صحة البيانات المرسلة
    if (!entityType || !entityId || isNaN(Number(entityId))) {
      return res.status(400).json({ error: 'بيانات غير صالحة' });
    }

    const payload = {
      ...req.body,
      entityType,
      entityId: Number(entityId),
      updatedBy: req.user?.id || null,
    };

    // البحث عن إعدادات SEO الحالية للكيان
    const existingSeo = await db.query.seo.findFirst({
      where: and(
        eq(seo.entityType, entityType),
        eq(seo.entityId, Number(entityId))
      ),
    });

    // تحديث الإعدادات الحالية، أو إنشاء إعدادات جديدة إذا لم تكن موجودة
    let result;
    if (existingSeo) {
      // تحديث الإعدادات الموجودة
      result = await db
        .update(seo)
        .set({
          title: payload.title,
          description: payload.description || null,
          keywords: payload.keywords || [],
          ogImage: payload.ogImage || null,
          canonicalUrl: payload.canonicalUrl || null,
          noIndex: payload.noIndex || false,
          structuredData: payload.structuredData || {},
          updatedAt: new Date(),
          updatedBy: payload.updatedBy,
        })
        .where(and(
          eq(seo.entityType, entityType),
          eq(seo.entityId, Number(entityId))
        ))
        .returning();
    } else {
      // إنشاء إعدادات جديدة
      result = await db.insert(seo).values({
        title: payload.title,
        description: payload.description || null,
        keywords: payload.keywords || [],
        ogImage: payload.ogImage || null,
        entityType,
        entityId: Number(entityId),
        canonicalUrl: payload.canonicalUrl || null,
        structuredData: payload.structuredData || {},
        noIndex: payload.noIndex || false,
        updatedBy: payload.updatedBy,
      }).returning();
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error saving entity SEO settings:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ إعدادات SEO' });
  }
}