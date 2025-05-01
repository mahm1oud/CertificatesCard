import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Certificate } from "@/types";
import { cn } from "@/lib/utils";

interface CertificateModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (certificate: Certificate) => void;
  onPrint: (certificate: Certificate) => void;
}

export function CertificateModal({
  certificate,
  isOpen,
  onClose,
  onDownload,
  onPrint,
}: CertificateModalProps) {
  if (!certificate) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">تفاصيل الشهادة</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* Use a default SVG pattern instead of an image for placeholder */}
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <i className="fas fa-certificate text-6xl text-gray-400"></i>
            </div>
          </div>

          <div className="text-right">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">عنوان الشهادة</h4>
              <p className="mt-1 text-lg text-gray-900">{certificate.title}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">المستفيد</h4>
              <p className="mt-1 text-gray-900">{certificate.recipient}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">الجهة المانحة</h4>
              <p className="mt-1 text-gray-900">{certificate.issuer}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">تاريخ الإصدار</h4>
              <p className="mt-1 text-gray-900">{certificate.issueDate}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">تاريخ الانتهاء</h4>
              <p className="mt-1 text-gray-900">{certificate.expiryDate || "غير محدد"}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">المدة</h4>
              <p className="mt-1 text-gray-900">{certificate.duration} ساعة</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">الحالة</h4>
              <p className="mt-1">
                <Badge className={cn("font-medium", getStatusClass(certificate.status))}>
                  {getStatusText(certificate.status)}
                </Badge>
              </p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">رقم التحقق</h4>
              <p className="mt-1 text-gray-900">{certificate.verificationId || "غير متاح"}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-500">الوصف</h4>
          <p className="mt-1 text-gray-900">{certificate.description || "لا يوجد وصف متاح"}</p>
        </div>

        <DialogFooter className="sm:justify-start gap-2">
          <Button onClick={() => onDownload(certificate)} className="flex items-center">
            <i className="fas fa-download ml-2"></i>
            تحميل الشهادة
          </Button>
          <Button variant="secondary" onClick={() => onPrint(certificate)} className="flex items-center">
            <i className="fas fa-print ml-2"></i>
            طباعة
          </Button>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
