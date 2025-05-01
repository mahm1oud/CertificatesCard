import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SearchFilters } from "@/components/dashboard/search-filters";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { CertificateModal } from "@/components/certificates/certificate-modal";
import { Pagination } from "@/components/pagination";
import { Certificate } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { toast } = useToast();
  const itemsPerPage = 6;

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => fetch("/api/stats").then(res => res.json()),
  });

  // Fetch certificates with filters
  const { data: certificatesData, isLoading: certificatesLoading } = useQuery({
    queryKey: ["/api/certificates", searchTerm, statusFilter, dateFilter, currentPage],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append("search", searchTerm);
      if (statusFilter) queryParams.append("status", statusFilter);
      if (dateFilter) queryParams.append("date", dateFilter);
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", itemsPerPage.toString());
      
      return fetch(`/api/certificates?${queryParams.toString()}`).then(res => res.json());
    },
  });

  const certificates = certificatesData?.certificates || [];
  const totalItems = certificatesData?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDateChange = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsModalOpen(true);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    // Redirect to edit page (to be implemented)
    toast({
      title: "تحت التطوير",
      description: "ميزة تعديل الشهادة غير متاحة حالياً",
    });
  };

  const handleDeleteCertificate = (certificate: Certificate) => {
    // Show delete confirmation (to be implemented)
    toast({
      title: "تحت التطوير",
      description: "ميزة حذف الشهادة غير متاحة حالياً",
      variant: "destructive",
    });
  };

  const handleDownloadCertificate = (certificate: Certificate) => {
    toast({
      title: "تحت التطوير",
      description: "ميزة تحميل الشهادة غير متاحة حالياً",
    });
  };

  const handlePrintCertificate = (certificate: Certificate) => {
    toast({
      title: "تحت التطوير",
      description: "ميزة طباعة الشهادة غير متاحة حالياً",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <div className="flex flex-col md:mr-64 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">لوحة التحكم</h1>
                <Link href="/add-certificate">
                  <Button className="flex items-center gap-2">
                    <i className="fas fa-plus"></i>
                    إضافة شهادة جديدة
                  </Button>
                </Link>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {statsLoading ? (
                  // Skeleton loading for stats
                  Array(4).fill(0).map((_, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg p-5">
                      <div className="animate-pulse flex items-center">
                        <div className="rounded-md bg-gray-200 h-12 w-12"></div>
                        <div className="mr-5 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-8 bg-gray-200 rounded w-1/2 mt-2"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <StatCard
                      title="إجمالي الشهادات"
                      value={stats?.totalCertificates || 0}
                      icon="fa-certificate"
                      color="primary"
                      href="/certificates"
                    />
                    <StatCard
                      title="الشهادات المصدقة"
                      value={stats?.verifiedCertificates || 0}
                      icon="fa-check-circle"
                      color="green"
                      href="/certificates?status=verified"
                    />
                    <StatCard
                      title="قيد الانتظار"
                      value={stats?.pendingCertificates || 0}
                      icon="fa-clock"
                      color="yellow"
                      href="/certificates?status=pending"
                    />
                    <StatCard
                      title="مرفوضة"
                      value={stats?.rejectedCertificates || 0}
                      icon="fa-times-circle"
                      color="red"
                      href="/certificates?status=rejected"
                    />
                  </>
                )}
              </div>

              {/* Search and Filters */}
              <SearchFilters
                onSearch={handleSearch}
                onStatusChange={handleStatusChange}
                onDateChange={handleDateChange}
              />

              {/* Certificates Section */}
              <h2 className="text-lg font-medium text-gray-900 mb-4">آخر الشهادات</h2>

              {/* Certificates Cards Grid */}
              {certificatesLoading ? (
                // Skeleton loading for certificates
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array(6).fill(0).map((_, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="animate-pulse">
                        <div className="h-48 bg-gray-200 w-full"></div>
                        <div className="p-4">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="flex space-x-2 space-x-reverse">
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : certificates.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {certificates.map((certificate) => (
                    <CertificateCard
                      key={certificate.id}
                      certificate={certificate}
                      onView={handleViewCertificate}
                      onEdit={handleEditCertificate}
                      onDelete={handleDeleteCertificate}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد شهادات</h3>
                  <p className="text-gray-500">لم يتم العثور على شهادات مطابقة لمعايير البحث</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Certificate Details Modal */}
      <CertificateModal
        certificate={selectedCertificate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDownload={handleDownloadCertificate}
        onPrint={handlePrintCertificate}
      />
    </div>
  );
}
