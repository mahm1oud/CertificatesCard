import { Certificate } from "@shared/schema";
import CertificateCard from "./CertificateCard";

interface CertificateGridProps {
  certificates: Certificate[];
  onView: (certificate: Certificate) => void;
  onDownload: (certificate: Certificate, e: React.MouseEvent) => void;
}

export default function CertificateGrid({ certificates, onView, onDownload }: CertificateGridProps) {
  if (certificates.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-500">لا توجد شهادات متاحة</h3>
        <p className="mt-2 text-sm text-gray-400">قم بإضافة شهادات جديدة للبدء</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificates.map((certificate) => (
        <CertificateCard
          key={certificate.id}
          certificate={certificate}
          onClick={onView}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}
