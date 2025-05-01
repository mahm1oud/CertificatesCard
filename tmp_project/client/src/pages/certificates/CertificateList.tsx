import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Certificate } from "@shared/schema";

interface CertificateListProps {
  limit?: number;
  showPagination?: boolean;
}

export default function CertificateList({ 
  limit = 10, 
  showPagination = true 
}: CertificateListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{
    certificates: Certificate[];
    total: number;
  }>({
    queryKey: ["/api/certificates", page, search, limit],
  });

  const certificates = data?.certificates || [];
  const total = data?.total || 0;
  const pageCount = Math.ceil(total / limit);

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "مفعلة":
        return "bg-green-100 text-green-800";
      case "قيد المراجعة":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <>
      {/* Search and Add Button */}
      <div className="mb-4 flex justify-between">
        <div className="relative w-64">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <Input
            type="text"
            className="block w-full pr-10 border-gray-300 rounded-md"
            placeholder="بحث عن شهادة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700 text-white">
          <i className="fas fa-plus ml-2"></i>
          إضافة شهادة
        </Button>
      </div>

      {/* Certificates Table */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">عنوان الشهادة</TableHead>
              <TableHead className="text-right">اسم الطالب</TableHead>
              <TableHead className="text-right">تاريخ الإصدار</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-left">
                <span className="sr-only">تعديل</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : certificates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  لا توجد شهادات متاحة
                </TableCell>
              </TableRow>
            ) : (
              certificates.map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm font-medium text-secondary-800">
                      {certificate.title}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={certificate.student.avatar} alt={certificate.student.name} />
                          <AvatarFallback>{certificate.student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-secondary-800">
                          {certificate.student.name}
                        </div>
                        <div className="text-sm text-secondary-600">
                          {certificate.student.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm text-secondary-600">
                      {certificate.issueDate}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge className={getStatusBadgeClass(certificate.status)} variant="outline">
                      {certificate.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-left text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-secondary-600 hover:text-secondary-700 mr-3">
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 mr-3">
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && pageCount > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-secondary-700">
                عرض <span className="font-medium">{(page - 1) * limit + 1}</span>{" "}
                إلى{" "}
                <span className="font-medium">
                  {Math.min(page * limit, total)}
                </span>{" "}
                من أصل <span className="font-medium">{total}</span> شهادة
              </p>
            </div>
            <Pagination
              totalPages={pageCount}
              currentPage={page}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </>
  );
}
