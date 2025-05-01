import { QueryClient, QueryFunction } from "@tanstack/react-query";

// الحصول على قاعدة URL للـ API من متغيرات البيئة
const API_BASE_URL = import.meta.env.VITE_API_URL || ''; // فارغة تعني استخدام المسار النسبي (الحالي)

// دالة مساعدة لبناء URL كاملة للـ API
function getApiUrl(path: string): string {
  // إذا كان المسار يحتوي على URL كاملة (مثل http://...)، استخدمه كما هو
  if (path.startsWith('http')) {
    return path;
  }
  
  // إذا كان المسار يبدأ بـ / فهو مسار نسبي
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  
  // إضافة بادئة API إذا كان المسار لا يبدأ بـ /api/
  if (!apiPath.startsWith('/api/')) {
    return `${API_BASE_URL}/api${apiPath}`;
  }
  
  // استخدام المسار كما هو مع إضافة قاعدة URL للـ API
  return `${API_BASE_URL}${apiPath}`;
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
  let url: string;
  let method: string = 'GET';
  let body: any = undefined;
  let on401: UnauthorizedBehavior = options?.on401 || "throw";
  let timeout = options?.timeout || 15000; // قيمة افتراضية 15 ثانية

  // معالجة مختلف أنماط الاستدعاء
  if (typeof urlOrMethod === 'string' && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(urlOrMethod)) {
    // الحالة: apiRequest(url, data, options)
    url = getApiUrl(urlOrMethod);
    body = urlOrData;
  } else if (typeof urlOrMethod === 'string' && typeof urlOrData === 'string') {
    // الحالة: apiRequest(method, url, data, options)
    method = urlOrMethod;
    url = getApiUrl(urlOrData);
    body = data;
  } else {
    // الحالة القديمة: apiRequest(url, { method, body }) - للتوافق مع الاستدعاءات السابقة
    if (typeof urlOrMethod === 'string') {
      url = getApiUrl(urlOrMethod);
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
    const url = getApiUrl(queryKey[0] as string);
    
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