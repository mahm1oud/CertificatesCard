import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * الحصول على قاعدة عنوان API من متغيرات البيئة
 * يستخدم VITE_API_URL إذا كان متوفراً، وإلا يستخدم عنوان محلي
 * في بيئة التطوير: http://localhost:5000
 * في بيئة الإنتاج: يجب تعيين VITE_API_URL
 * @returns عنوان قاعدة API
 */
export function getApiBaseUrl(): string {
  // الحصول على عنوان API من متغيرات البيئة
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // إذا كان العنوان متوفراً، استخدمه
  if (apiUrl) {
    return apiUrl;
  }
  
  // إذا لم يكن متوفراً، استخدم عنوان محلي
  console.warn('VITE_API_URL غير محدد، استخدام عنوان محلي: http://localhost:5000');
  return 'http://localhost:5000';
}

/**
 * إنشاء عنوان URL كامل للوصول إلى API
 * @param path مسار API
 * @returns عنوان URL كامل
 */
export function createApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  
  // إذا كان المسار يبدأ بـ http:// أو https://، فهو عنوان كامل بالفعل
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // تأكد من أن المسار يبدأ بـ / وأن العنوان الأساسي لا ينتهي بـ /
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  const formattedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return `${formattedBaseUrl}${formattedPath}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  urlOrMethod: string | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  urlOrData?: string | any,
  data?: any,
  options?: {
    timeout?: number;
    on401?: UnauthorizedBehavior;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }
): Promise<T> {
  let path: string;
  let method: string = 'GET';
  let body: any = undefined;
  let on401: UnauthorizedBehavior = options?.on401 || "throw";
  let timeout = options?.timeout || 15000; // قيمة افتراضية 15 ثانية

  // معالجة مختلف أنماط الاستدعاء
  if (typeof urlOrMethod === 'string' && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(urlOrMethod)) {
    // الحالة: apiRequest(url, data, options)
    path = urlOrMethod;
    body = urlOrData;
  } else if (typeof urlOrMethod === 'string' && typeof urlOrData === 'string') {
    // الحالة: apiRequest(method, url, data, options)
    method = urlOrMethod;
    path = urlOrData;
    body = data;
  } else {
    // الحالة القديمة: apiRequest(url, { method, body }) - للتوافق مع الاستدعاءات السابقة
    if (typeof urlOrMethod === 'string') {
      path = urlOrMethod;
      method = (urlOrData as any)?.method || 'GET';
      body = (urlOrData as any)?.body;
      // معالجة خيارات من النمط القديم
      if ((urlOrData as any)?.on401) {
        on401 = (urlOrData as any).on401;
      }
    } else {
      throw new Error('طريقة استدعاء غير صحيحة لدالة apiRequest');
    }
  }

  // تحويل المسار إلى عنوان URL كامل
  const url = createApiUrl(path);

  // إنشاء إشارة إلغاء للمهلة الزمنية
  const controller = new AbortController();
  const signal = options?.signal || controller.signal;
  
  // إعداد المهلة الزمنية
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // لا نقوم بإرسال body مع طلبات GET و HEAD
    const res = await fetch(url, {
      method,
      headers: {
        ...((body && method !== 'GET' && method !== 'HEAD') ? { "Content-Type": "application/json" } : {}),
        ...(options?.headers || {})
      },
      body: (body && method !== 'GET' && method !== 'HEAD') ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal
    });

    // إلغاء المهلة الزمنية بعد الانتهاء من الطلب
    clearTimeout(timeoutId);

    if (res.status === 401) {
      if (on401 === "returnNull") {
        return null as T;
      } else if (on401 === "redirect-to-login") {
        window.location.href = "/auth";
        return null as T;
      }
    }

    await throwIfResNotOk(res);
    
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json() as T;
    }
    
    return res as unknown as T;
  } catch (error) {
    // إلغاء المهلة الزمنية في حالة حدوث خطأ
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('تم إلغاء الطلب بسبب تجاوز المهلة الزمنية');
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect-to-login";

export const getQueryFn: <T>(options?: {
  on401?: UnauthorizedBehavior;
}) => QueryFunction<T> =
  (options = { on401: "throw" }) =>
  async ({ queryKey }) => {
    const unauthorizedBehavior = options?.on401 || "throw";
    
    // تحويل المسار إلى عنوان URL كامل
    const url = createApiUrl(queryKey[0] as string);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else if (unauthorizedBehavior === "redirect-to-login") {
        window.location.href = "/auth";
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});