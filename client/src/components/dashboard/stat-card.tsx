import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: "primary" | "green" | "yellow" | "red";
  href: string;
}

export function StatCard({ title, value, icon, color, href }: StatCardProps) {
  const colorClasses = {
    primary: {
      bg: "bg-primary-100",
      text: "text-primary-600",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
    },
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-600",
    },
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div
            className={cn("flex-shrink-0 rounded-md p-3", colorClasses[color].bg)}
          >
            <i className={cn(`fas ${icon} h-6 w-6`, colorClasses[color].text)}></i>
          </div>
          <div className="mr-5">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <Link href={href}>
            <a className="font-medium text-primary-600 hover:text-primary-900">
              عرض الكل
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
