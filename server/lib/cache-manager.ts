/**
 * وحدة إدارة ذاكرة التخزين المؤقت
 * توفر وظائف لإدارة الذاكرة المؤقتة ومسحها عند الحاجة
 */

// سجل لتخزين البيانات المؤقتة في الذاكرة
const memoryCache: Record<string, { data: any; expiry: number }> = {};

/**
 * تخزين بيانات في ذاكرة التخزين المؤقت
 * 
 * @param key مفتاح التخزين
 * @param data البيانات المراد تخزينها
 * @param ttlSeconds مدة الصلاحية بالثواني
 */
export function cacheData(key: string, data: any, ttlSeconds: number = 3600): void {
  memoryCache[key] = {
    data,
    expiry: Date.now() + (ttlSeconds * 1000)
  };
}

/**
 * استرجاع بيانات من ذاكرة التخزين المؤقت
 * 
 * @param key مفتاح التخزين
 * @returns البيانات المخزنة أو undefined إذا لم توجد أو انتهت صلاحيتها
 */
export function getCachedData(key: string): any | undefined {
  const cached = memoryCache[key];
  
  if (!cached) return undefined;
  
  // التحقق من صلاحية البيانات
  if (cached.expiry < Date.now()) {
    delete memoryCache[key];
    return undefined;
  }
  
  return cached.data;
}

/**
 * مسح بيانات محددة من ذاكرة التخزين المؤقت
 * 
 * @param key مفتاح التخزين
 */
export function invalidateCache(key: string): void {
  delete memoryCache[key];
}

/**
 * مسح جميع البيانات من ذاكرة التخزين المؤقت
 */
export async function clearCachedData(): Promise<void> {
  // مسح كل المفاتيح من الذاكرة
  Object.keys(memoryCache).forEach(key => {
    delete memoryCache[key];
  });
  
  // تطبيق جامع القمامة لتحرير الذاكرة
  if (global.gc) {
    try {
      global.gc();
    } catch (e) {
      // تجاهل أي أخطاء من جامع القمامة
    }
  }
  
  return Promise.resolve();
}

/**
 * التحقق من وجود مفتاح في ذاكرة التخزين المؤقت
 * 
 * @param key مفتاح التخزين
 * @returns true إذا كان المفتاح موجود وصالح
 */
export function hasCachedData(key: string): boolean {
  const cached = memoryCache[key];
  if (!cached) return false;
  return cached.expiry >= Date.now();
}

/**
 * الحصول على حالة ذاكرة التخزين المؤقت
 * 
 * @returns معلومات عن حالة ذاكرة التخزين المؤقت
 */
export function getCacheStats(): { keys: number; activeKeys: number; expiredKeys: number } {
  const now = Date.now();
  const keys = Object.keys(memoryCache);
  
  const stats = {
    keys: keys.length,
    activeKeys: 0,
    expiredKeys: 0
  };
  
  keys.forEach(key => {
    if (memoryCache[key].expiry >= now) {
      stats.activeKeys++;
    } else {
      stats.expiredKeys++;
    }
  });
  
  return stats;
}
