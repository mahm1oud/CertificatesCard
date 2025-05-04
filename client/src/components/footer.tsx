import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileHeart, Mail, Phone, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t py-8 md:py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <FileHeart className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">بـــطـــاقـــة</span>
            </div>
            <p className="max-w-md text-muted-foreground">
              منصة متكاملة لإنشاء بطاقات وشهادات مخصصة بتصاميم احترافية. قم
              بتخصيص وإنشاء ومشاركة بطاقاتك بسهولة وسرعة.
            </p>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <span className="sr-only">تويتر</span>
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span className="sr-only">فيسبوك</span>
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <span className="sr-only">انستغرام</span>
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h4 className="font-medium">البطاقات</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/?category=wedding"
                    className="hover:text-foreground"
                  >
                    بطاقات الزواج
                  </Link>
                </li>
                <li>
                  <Link
                    href="/?category=birthday"
                    className="hover:text-foreground"
                  >
                    بطاقات أعياد الميلاد
                  </Link>
                </li>
                <li>
                  <Link href="/?category=eid" className="hover:text-foreground">
                    بطاقات العيد
                  </Link>
                </li>
                <li>
                  <Link
                    href="/?category=ramadan"
                    className="hover:text-foreground"
                  >
                    بطاقات رمضان
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">الشهادات</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/?tab=certificates&type=appreciation"
                    className="hover:text-foreground"
                  >
                    شهادات تقدير
                  </Link>
                </li>
                <li>
                  <Link
                    href="/?tab=certificates&type=training"
                    className="hover:text-foreground"
                  >
                    شهادات تدريب
                  </Link>
                </li>
                <li>
                  <Link
                    href="/?tab=certificates&type=education"
                    className="hover:text-foreground"
                  >
                    شهادات تعليمية
                  </Link>
                </li>
                <li>
                  <Link
                    href="/?tab=certificates&type=teacher"
                    className="hover:text-foreground"
                  >
                    شهادات المعلمين
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3 col-span-2 md:col-span-1">
              <h4 className="font-medium">تواصل معنا</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2 space-x-reverse">
                  <Mail className="h-4 w-4 text-muted-foreground/70" />
                  <a
                    href="mailto:info@bitaqa.com"
                    className="hover:text-foreground"
                  >
                    info@bitaqa.com
                  </a>
                </li>
                <li className="flex items-center space-x-2 space-x-reverse">
                  <Phone className="h-4 w-4 text-muted-foreground/70" />
                  <a href="tel:+967776036705" className="hover:text-foreground">
                    +967 776 036 705
                  </a>
                </li>
                <li className="flex items-center space-x-2 space-x-reverse">
                  <ExternalLink className="h-4 w-4 text-muted-foreground/70" />
                  <a
                    href="https://bitaqa.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    www.bitaqa.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} بطاقة. جميع الحقوق محفوظة 
            </p>
            <p className="text-sm text-muted-foreground">
             برمجة وتطوير: محمود الحكيمي
            </p>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link href="/privacy" className="hover:text-foreground text-sm">
                سياسة الخصوصية
              </Link>
              <span>&middot;</span>
              <Link href="/terms" className="hover:text-foreground text-sm">
                شروط الاستخدام
              </Link>
              <span>&middot;</span>
              <Link href="/contact" className="hover:text-foreground text-sm">
                اتصل بنا
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
