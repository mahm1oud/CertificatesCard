import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  updateProfileMutation: UseMutationResult<User, Error, ProfileData>;
  changePasswordMutation: UseMutationResult<{ message: string }, Error, PasswordData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
  name?: string;
};

type ProfileData = {
  name?: string;
  email?: string;
};

type PasswordData = {
  currentPassword: string;
  newPassword: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        // استخدام fetch مباشرة مع معالجة أكثر تفصيلا للخطأ
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });

        if (!response.ok) {
          // محاولة قراءة رسالة الخطأ
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || `فشل تسجيل الدخول: ${response.status}`);
          } else {
            // إذا كانت الاستجابة ليست JSON
            const errorText = await response.text();
            console.error("استجابة غير صالحة من الخادم:", errorText);
            throw new Error(`فشل تسجيل الدخول: ${response.status}`);
          }
        }

        // التحقق من نوع المحتوى قبل محاولة معالجة JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          console.error("استجابة غير متوقعة من الخادم. ليست JSON.");
          throw new Error("استجابة غير صالحة من الخادم");
        }
      } catch (error) {
        console.error("خطأ في تسجيل الدخول:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        variant: "default",
      });
      
      // استخدام setTimeout للتأكد من أن التوجيه يعمل بعد تحديث حالة المستخدم
      setTimeout(() => {
        // الحصول على معامل إعادة التوجيه من URL إن وجد
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/';
        
        // التوجيه للصفحة المطلوبة
        window.location.href = redirectTo;
      }, 500);
    },
    onError: (error: Error) => {
      console.error("خطأ في معالجة تسجيل الدخول:", error);
      toast({
        title: "فشل تسجيل الدخول",
        description: error.message || "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        // استخدام fetch مباشرة مع معالجة أكثر تفصيلا للخطأ
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
          credentials: 'include',
        });

        if (!response.ok) {
          // محاولة قراءة رسالة الخطأ
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || `فشل إنشاء الحساب: ${response.status}`);
          } else {
            // إذا كانت الاستجابة ليست JSON
            const errorText = await response.text();
            console.error("استجابة غير صالحة من الخادم:", errorText);
            throw new Error(`فشل إنشاء الحساب: ${response.status}`);
          }
        }

        // التحقق من نوع المحتوى قبل محاولة معالجة JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          console.error("استجابة غير متوقعة من الخادم. ليست JSON.");
          throw new Error("استجابة غير صالحة من الخادم");
        }
      } catch (error) {
        console.error("خطأ في إنشاء الحساب:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "تم إنشاء الحساب بنجاح",
        variant: "default",
      });
      
      // استخدام setTimeout للتأكد من أن التوجيه يعمل بعد تحديث حالة المستخدم
      setTimeout(() => {
        // الحصول على معامل إعادة التوجيه من URL إن وجد
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/';
        
        // التوجيه للصفحة المطلوبة
        window.location.href = redirectTo;
      }, 500);
    },
    onError: (error: Error) => {
      console.error("خطأ في معالجة إنشاء الحساب:", error);
      toast({
        title: "فشل إنشاء الحساب",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`فشل تسجيل الخروج: ${response.status}`);
        }
      } catch (error) {
        console.error("خطأ في تسجيل الخروج:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        variant: "default",
      });
      
      // استخدام setTimeout للتأكد من أن التوجيه يعمل بعد تحديث حالة المستخدم
      setTimeout(() => {
        // التوجيه إلى صفحة تسجيل الدخول بالمسار المتعارف عليه
        window.location.href = '/login';
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تسجيل الخروج",
        description: error.message || "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileData) => {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
          credentials: 'include',
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || `فشل تحديث الملف الشخصي: ${response.status}`);
          } else {
            const errorText = await response.text();
            console.error("استجابة غير صالحة من الخادم:", errorText);
            throw new Error(`فشل تحديث الملف الشخصي: ${response.status}`);
          }
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          console.error("استجابة غير متوقعة من الخادم. ليست JSON.");
          throw new Error("استجابة غير صالحة من الخادم");
        }
      } catch (error) {
        console.error("خطأ في تحديث الملف الشخصي:", error);
        throw error;
      }
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "تم تحديث الملف الشخصي بنجاح",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تحديث الملف الشخصي",
        description: error.message || "حدث خطأ أثناء تحديث الملف الشخصي",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: PasswordData) => {
      try {
        const response = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(passwordData),
          credentials: 'include',
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || `فشل تغيير كلمة المرور: ${response.status}`);
          } else {
            const errorText = await response.text();
            console.error("استجابة غير صالحة من الخادم:", errorText);
            throw new Error(`فشل تغيير كلمة المرور: ${response.status}`);
          }
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          console.error("استجابة غير متوقعة من الخادم. ليست JSON.");
          throw new Error("استجابة غير صالحة من الخادم");
        }
      } catch (error) {
        console.error("خطأ في تغيير كلمة المرور:", error);
        throw error;
      }
    },
    onSuccess: (data: { message: string }) => {
      toast({
        title: "تم تغيير كلمة المرور بنجاح",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تغيير كلمة المرور",
        description: error.message || "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
        changePasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}