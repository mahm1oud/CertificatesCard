import express from 'express';
import { isAdmin, isAuthenticated } from '../auth';
import { getGlobalSeoSettings, saveGlobalSeoSettings, getEntitySeoSettings, saveEntitySeoSettings } from './seo';

const router = express.Router();

// الإعدادات العامة - متاحة للجميع للقراءة ولكن المشرفين فقط للتحديث
router.get('/global', getGlobalSeoSettings);
router.post('/global', isAuthenticated, isAdmin, saveGlobalSeoSettings);

// إعدادات الكيانات المحددة (التصنيفات، القوالب، إلخ)
router.get('/:entityType/:entityId', getEntitySeoSettings);
router.post('/:entityType/:entityId', isAuthenticated, isAdmin, saveEntitySeoSettings);

export default router;