import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="mr-2 font-bold text-primary-700">نظام إدارة الشهادات</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <Button variant="ghost" size="icon" className="p-1 rounded-full text-secondary-600 hover:text-secondary-800">
                  <i className="fas fa-bell"></i>
                </Button>
                
                {/* Profile Dropdown */}
                <div className="mr-3 relative" ref={dropdownRef}>
                  <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center max-w-xs text-sm rounded-full">
                        <span className="mr-2 text-secondary-700">محمود أحمد</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                            alt="صورة المستخدم"
                          />
                          <AvatarFallback>م أ</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem as="a" href="#">
                        الملف الشخصي
                      </DropdownMenuItem>
                      <DropdownMenuItem as="a" href="#">
                        الإعدادات
                      </DropdownMenuItem>
                      <DropdownMenuItem as="a" href="#">
                        تسجيل الخروج
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="mr-2 flex md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="inline-flex items-center justify-center p-2 rounded-md text-secondary-600 hover:text-secondary-800 hover:bg-gray-100" 
                onClick={() => setIsOpen(!isOpen)}
                aria-controls="mobile-menu"
                aria-expanded={isOpen}
              >
                <i className="fas fa-bars"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/">
            <a className="block px-3 py-2 rounded-md text-base font-medium text-secondary-800 bg-gray-100">
              الرئيسية
            </a>
          </Link>
          <Link href="/certificates">
            <a className="block px-3 py-2 rounded-md text-base font-medium text-secondary-600 hover:bg-gray-100">
              الشهادات
            </a>
          </Link>
          <Link href="/students">
            <a className="block px-3 py-2 rounded-md text-base font-medium text-secondary-600 hover:bg-gray-100">
              الطلاب
            </a>
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-5">
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                  alt="صورة المستخدم"
                />
                <AvatarFallback>م أ</AvatarFallback>
              </Avatar>
            </div>
            <div className="mr-3">
              <div className="text-base font-medium text-secondary-800">محمود أحمد</div>
              <div className="text-sm font-medium text-secondary-600">admin@example.com</div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Link href="/profile">
              <a className="block px-4 py-2 text-base font-medium text-secondary-600 hover:bg-gray-100">
                الملف الشخصي
              </a>
            </Link>
            <Link href="/settings">
              <a className="block px-4 py-2 text-base font-medium text-secondary-600 hover:bg-gray-100">
                الإعدادات
              </a>
            </Link>
            <Link href="/logout">
              <a className="block px-4 py-2 text-base font-medium text-secondary-600 hover:bg-gray-100">
                تسجيل الخروج
              </a>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
