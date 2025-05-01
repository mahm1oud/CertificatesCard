import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CertificateList from "@/pages/certificates/CertificateList";
import { Stats } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-secondary-800">لوحة التحكم</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Certificate Stats Card */}
            <Card className="bg-white overflow-hidden shadow rounded-lg">
              <CardContent className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <i className="fas fa-certificate text-primary-600"></i>
                  </div>
                  <div className="mr-5">
                    <dt className="text-sm font-medium text-secondary-600 truncate">عدد الشهادات</dt>
                    <dd className="mt-1 text-3xl font-semibold text-secondary-800">
                      {isLoading ? "..." : stats?.certificates || 0}
                    </dd>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/certificates">
                    <a className="font-medium text-primary-600 hover:text-primary-700">عرض التفاصيل</a>
                  </Link>
                </div>
              </CardFooter>
            </Card>

            {/* Students Stats Card */}
            <Card className="bg-white overflow-hidden shadow rounded-lg">
              <CardContent className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <i className="fas fa-user-graduate text-green-600"></i>
                  </div>
                  <div className="mr-5">
                    <dt className="text-sm font-medium text-secondary-600 truncate">عدد الطلاب</dt>
                    <dd className="mt-1 text-3xl font-semibold text-secondary-800">
                      {isLoading ? "..." : stats?.students || 0}
                    </dd>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/students">
                    <a className="font-medium text-primary-600 hover:text-primary-700">عرض التفاصيل</a>
                  </Link>
                </div>
              </CardFooter>
            </Card>

            {/* Teachers Stats Card */}
            <Card className="bg-white overflow-hidden shadow rounded-lg">
              <CardContent className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <i className="fas fa-chalkboard-teacher text-purple-600"></i>
                  </div>
                  <div className="mr-5">
                    <dt className="text-sm font-medium text-secondary-600 truncate">عدد المعلمين</dt>
                    <dd className="mt-1 text-3xl font-semibold text-secondary-800">
                      {isLoading ? "..." : stats?.teachers || 0}
                    </dd>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/teachers">
                    <a className="font-medium text-primary-600 hover:text-primary-700">عرض التفاصيل</a>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Certificates List */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-800">الشهادات الأخيرة</h2>
              <Link href="/certificates">
                <a className="text-sm font-medium text-primary-600 hover:text-primary-700">عرض الكل</a>
              </Link>
            </div>
            <CertificateList limit={5} showPagination={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
