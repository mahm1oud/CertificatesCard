import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: "fas fa-home" },
  { href: "/certificates", label: "الشهادات", icon: "fas fa-certificate" },
  { href: "/students", label: "الطلاب", icon: "fas fa-user-graduate" },
  { href: "/teachers", label: "المعلمين", icon: "fas fa-chalkboard-teacher" },
  { href: "/settings", label: "الإعدادات", icon: "fas fa-cog" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-l border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      location === item.href
                        ? "bg-gray-100 text-secondary-800"
                        : "text-secondary-600 hover:bg-gray-100 hover:text-secondary-800"
                    )}
                  >
                    <i className={cn(item.icon, "ml-3 text-secondary-600")}></i>
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
