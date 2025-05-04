// نموذج Schema لقاعدة بيانات MySQL مع Drizzle ORM
// يحتاج هذا الملف للتعديل ليتوافق مع MySQL بدلاً من PostgreSQL

import {
  mysqlTable, serial, varchar, text, int, timestamp, boolean, json, date, mysqlEnum, index,
  primaryKey
} from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// جدول المستخدمين
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  firstName: varchar('firstName', { length: 255 }),
  lastName: varchar('lastName', { length: 255 }),
  profilePicture: varchar('profilePicture', { length: 255 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// جدول الفئات
export const categories = mysqlTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  displayOrder: int('display_order').default(0),
  icon: varchar('icon', { length: 50 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// جدول القوالب
export const templates = mysqlTable('templates', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  titleAr: varchar('title_ar', { length: 255 }),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  categoryId: int('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  imageUrl: varchar('image_url', { length: 1000 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 1000 }),
  displayOrder: int('display_order').default(0),
  fields: json('fields').$type<string[]>(),
  defaultValues: json('default_values').$type<unknown>(),
  settings: json('settings').$type<unknown>(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// جدول حقول القوالب
export const templateFields = mysqlTable('template_fields', {
  id: serial('id').primaryKey(),
  templateId: int('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  labelAr: varchar('label_ar', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull().default('text'),
  position: json('position').notNull().$type<any>(),
  style: json('style').$type<any>(),
  defaultValue: text('default_value'),
  required: boolean('required').notNull().default(false),
  displayOrder: int('display_order').default(0),
  placeholder: varchar('placeholder', { length: 255 }),
  placeholderAr: varchar('placeholder_ar', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// جدول الشهادات
export const certificates = mysqlTable('certificates', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  titleAr: varchar('title_ar', { length: 255 }),
  imageUrl: varchar('image_url', { length: 1000 }).notNull(),
  templateId: int('template_id').notNull().references(() => templates.id),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  certificateType: varchar('certificate_type', { length: 50 }).notNull().default('appreciation'),
  formData: json('form_data').$type<unknown>(),
  issuedTo: varchar('issued_to', { length: 255 }),
  issuedToGender: varchar('issued_to_gender', { length: 50 }),
  issuedDate: timestamp('issued_date').notNull().defaultNow(),
  expiryDate: date('expiry_date'),
  verificationCode: varchar('verification_code', { length: 50 }).unique(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  batchId: int('batch_id'),
  publicId: varchar('public_id', { length: 100 }).unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// جدول الدفعات
export const batches = mysqlTable('batches', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  templateId: int('template_id').notNull().references(() => templates.id),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  filePath: varchar('file_path', { length: 1000 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  totalCount: int('total_count').default(0),
  processedCount: int('processed_count').default(0),
  errorCount: int('error_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// جدول اللوجوهات
export const logos = mysqlTable('logos', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  imageUrl: varchar('image_url', { length: 1000 }).notNull(),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// جدول التوقيعات
export const signatures = mysqlTable('signatures', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  imageUrl: varchar('image_url', { length: 1000 }).notNull(),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// جدول إعدادات العرض
export const displaySettings = mysqlTable('display_settings', {
  id: serial('id').primaryKey(),
  settings: json('settings').notNull().$type<any>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// جدول تفضيلات المستخدم
export const userPreferences = mysqlTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: int('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  theme: varchar('theme', { length: 50 }).default('light'),
  layout: varchar('layout', { length: 50 }).default('boxed'),
  language: varchar('language', { length: 10 }).default('ar'),
  settings: json('settings').$type<any>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// جدول الجلسات
export const sessions = mysqlTable('sessions', {
  sid: varchar('sid', { length: 255 }).notNull().primaryKey(),
  sess: json('sess').notNull().$type<any>(),
  expired: timestamp('expired', { fsp: 6 }).notNull()
}, (table) => {
  return {
    expiredIdx: index('sessions_expired_idx').on(table.expired)
  };
});

// تعريف العلاقات بين الجداول
export const usersRelations = relations(users, ({ many }) => ({
  certificates: many(certificates),
  batches: many(batches),
  logos: many(logos),
  signatures: many(signatures),
  preferences: many(userPreferences)
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  templates: many(templates)
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  category: one(categories, {
    fields: [templates.categoryId],
    references: [categories.id]
  }),
  templateFields: many(templateFields),
  certificates: many(certificates),
  batches: many(batches)
}));

export const templateFieldsRelations = relations(templateFields, ({ one }) => ({
  template: one(templates, {
    fields: [templateFields.templateId],
    references: [templates.id]
  })
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  template: one(templates, {
    fields: [certificates.templateId],
    references: [templates.id]
  }),
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id]
  }),
  batch: one(batches, {
    fields: [certificates.batchId],
    references: [batches.id]
  })
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  template: one(templates, {
    fields: [batches.templateId],
    references: [templates.id]
  }),
  user: one(users, {
    fields: [batches.userId],
    references: [users.id]
  }),
  certificates: many(certificates)
}));

export const logosRelations = relations(logos, ({ one }) => ({
  user: one(users, {
    fields: [logos.userId],
    references: [users.id]
  })
}));

export const signaturesRelations = relations(signatures, ({ one }) => ({
  user: one(users, {
    fields: [signatures.userId],
    references: [users.id]
  })
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id]
  })
}));

// تعريف Validation Schemas لـ Zod
export const userInsertSchema = createInsertSchema(users, {
  username: (schema) => schema.username.min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  email: (schema) => schema.email.optional().or(z.string().email("البريد الإلكتروني غير صالح")),
  password: (schema) => schema.password.min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
});

export const categoryInsertSchema = createInsertSchema(categories, {
  name: (schema) => schema.name.min(2, "اسم الفئة يجب أن يكون حرفين على الأقل"),
  slug: (schema) => schema.slug.min(2, "الاسم المختصر يجب أن يكون حرفين على الأقل")
});

export const templateInsertSchema = createInsertSchema(templates, {
  title: (schema) => schema.title.min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  slug: (schema) => schema.slug.min(3, "الاسم المختصر يجب أن يكون 3 أحرف على الأقل"),
  imageUrl: (schema) => schema.imageUrl.min(5, "رابط الصورة إجباري")
});

export const templateFieldInsertSchema = createInsertSchema(templateFields, {
  name: (schema) => schema.name.min(2, "اسم الحقل يجب أن يكون حرفين على الأقل"),
  label: (schema) => schema.label.min(2, "عنوان الحقل يجب أن يكون حرفين على الأقل")
});

export const certificateInsertSchema = createInsertSchema(certificates, {
  title: (schema) => schema.title.min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  imageUrl: (schema) => schema.imageUrl.min(5, "رابط الصورة إجباري")
});

export const batchInsertSchema = createInsertSchema(batches, {
  name: (schema) => schema.name.min(3, "اسم الدفعة يجب أن يكون 3 أحرف على الأقل")
});

export const logoInsertSchema = createInsertSchema(logos, {
  title: (schema) => schema.title.min(2, "العنوان يجب أن يكون حرفين على الأقل"),
  imageUrl: (schema) => schema.imageUrl.min(5, "رابط الصورة إجباري")
});

export const signatureInsertSchema = createInsertSchema(signatures, {
  title: (schema) => schema.title.min(2, "العنوان يجب أن يكون حرفين على الأقل"),
  imageUrl: (schema) => schema.imageUrl.min(5, "رابط الصورة إجباري")
});

// تصدير أنماط البيانات لاستخدامها في التطبيق
export type User = z.infer<typeof createSelectSchema(users)>;
export type Category = z.infer<typeof createSelectSchema(categories)>;
export type Template = z.infer<typeof createSelectSchema(templates)>;
export type TemplateField = z.infer<typeof createSelectSchema(templateFields)>;
export type Certificate = z.infer<typeof createSelectSchema(certificates)>;
export type Batch = z.infer<typeof createSelectSchema(batches)>;
export type Logo = z.infer<typeof createSelectSchema(logos)>;
export type Signature = z.infer<typeof createSelectSchema(signatures)>;
export type DisplaySetting = z.infer<typeof createSelectSchema(displaySettings)>;
export type UserPreference = z.infer<typeof createSelectSchema(userPreferences)>;