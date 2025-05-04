import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      // محاولة قراءة الرسالة من جسم الاستجابة
      const text = await res.text();
      if (text) {
        // محاولة تحليل النص كـ JSON للحصول على رسالة الخطأ
        try {
          const jsonError = JSON.parse(text);
          errorMessage = jsonError.message || jsonError.error || text;
        } catch {
          // إذا لم يكن النص JSON، استخدم النص مباشرة
          errorMessage = text;
        }
      }
    } catch (e) {
      // إذا فشلت قراءة النص، استخدم res.statusText كما هو
      console.error('Failed to read error response:', e);
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
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
    url = urlOrMethod;
    body = urlOrData;
  } else if (typeof urlOrMethod === 'string' && typeof urlOrData === 'string') {
    // الحالة: apiRequest(method, url, data, options)
    method = urlOrMethod;
    url = urlOrData;
    body = data;
  } else {
    // الحالة القديمة: apiRequest(url, { method, body }) - للتوافق مع الاستدعاءات السابقة
    if (typeof urlOrMethod === 'string') {
      url = urlOrMethod;
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
    
    // معالجة محسنة لقراءة البيانات من الاستجابة لتجنب خطأ 'body stream already read'
    let responseData: T;
    
    const contentType = res.headers.get('content-type');
    try {
      // محاولة قراءة البيانات كـ JSON أولاً بغض النظر عن نوع المحتوى
      responseData = await res.json() as T;
    } catch (error) {
      try {
        // إذا فشلت قراءة JSON، نحاول قراءة المحتوى كنص
        const text = await res.text();
        // محاولة تحويل النص إلى JSON إذا كان ممكناً
        try {
          responseData = JSON.parse(text) as T;
        } catch {
          // إذا فشل التحويل، نعيد النص كما هو
          responseData = text as unknown as T;
        }
      } catch (textError) {
        // إذا فشل كل شيء، نعيد كائن فارغ أو قيمة افتراضية
        console.error('Failed to read response body:', textError);
        responseData = {} as T;
      }
    }
    
    return responseData;
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
    const res = await fetch(queryKey[0] as string, {
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
    
    // استخدام نفس منطق معالجة الاستجابة المُحسَّن من دالة apiRequest
    try {
      return await res.json();
    } catch (error) {
      try {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      } catch (textError) {
        console.error('Failed to read response body in queryFn:', textError);
        return {};
      }
    }
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
