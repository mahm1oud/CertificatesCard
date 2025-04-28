import { useSidebar } from "@/hooks/use-sidebar";
import { Link } from "wouter";

export function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="md:hidden bg-primary-500 text-white py-2 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <button
          type="button"
          className="text-white focus:outline-none"
          onClick={toggleSidebar}
        >
          <i className="fas fa-bars h-6 w-6"></i>
        </button>
        <Link href="/">
          <a className="mr-3 text-white text-xl font-bold">شهاداتي</a>
        </Link>
      </div>
      <div>
        <div className="h-8 w-8 rounded-full bg-primary-400 flex items-center justify-center">
          <i className="fas fa-user text-white"></i>
        </div>
      </div>
    </div>
  );
}
