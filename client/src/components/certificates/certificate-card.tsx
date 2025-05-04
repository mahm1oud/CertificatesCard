import { Certificate } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CertificateCardProps {
  certificate: Certificate;
  onView: (certificate: Certificate) => void;
  onEdit: (certificate: Certificate) => void;
  onDelete: (certificate: Certificate) => void;
}

export function CertificateCard({ certificate, onView, onEdit, onDelete }: CertificateCardProps) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case "verified":
        return "status-verified";
      case "pending":
        return "status-pending";
      case "rejected":
        return "status-rejected";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "مصدقة";
      case "pending":
        return "قيد الانتظار";
      case "rejected":
        return "مرفوضة";
      default:
        return "غير محدد";
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg transition-all hover:shadow-md">
      <div className="relative">
        {/* Use a default SVG pattern instead of an image for placeholder */}
        <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
          <i className="fas fa-certificate text-4xl text-gray-400"></i>
        </div>
        <div className="absolute top-0 left-0 m-2">
          <Badge className={cn("font-medium", getStatusClass(certificate.status))}>
            {getStatusText(certificate.status)}
          </Badge>
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 truncate">{certificate.title}</h3>
          <span className="text-sm text-gray-500">{certificate.issueDate}</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">الجهة المانحة: {certificate.issuer}</p>
        <p className="text-sm text-gray-500">المستفيد: {certificate.recipient}</p>
        <p className="text-sm text-gray-500">المدة: {certificate.duration} ساعة</p>
        <div className="mt-4 flex space-x-2 space-x-reverse">
          <Button 
            size="sm" 
            onClick={() => onView(certificate)}
            className="flex items-center"
          >
            <i className="fas fa-eye ml-2"></i>
            عرض
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit(certificate)}
            className="flex items-center"
          >
            <i className="fas fa-edit ml-2"></i>
            تعديل
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => onDelete(certificate)}
            className="flex items-center"
          >
            <i className="fas fa-trash ml-2"></i>
            حذف
          </Button>
        </div>
      </div>
    </div>
  );
}
