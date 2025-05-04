import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient-updated";

// تحقق إذا كنا في بيئة تطوير
const isDevelopment = import.meta.env.MODE === 'development';

// طباعة معلومات عن البيئة
if (isDevelopment) {
  console.log(`🔄 تشغيل التطبيق في بيئة: ${import.meta.env.MODE}`);
  console.log(`🌐 عنوان API: ${import.meta.env.VITE_API_URL || 'المسار النسبي'}`);
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <App />
    </ThemeProvider>
  </QueryClientProvider>
);
