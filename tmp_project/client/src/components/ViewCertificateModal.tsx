import { Certificate } from "@shared/schema";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Edit } from "lucide-react";

interface ViewCertificateModalProps {
  certificate: Certificate | null;
  open: boolean;
  onClose: () => void;
  onDownload: (certificate: Certificate) => void;
  onEdit: (certificate: Certificate) => void;
}

// Maps certificate types to their display names in Arabic
const typeNameMap: Record<string, string> = {
  technical: "تقني",
  administrative: "إداري",
  training: "تدريبي",
  graduation: "تخرج",
  leadership: "قيادة",
  volunteer: "تطوع",
};

export default function ViewCertificateModal({ 
  certificate, 
  open, 
  onClose, 
  onDownload, 
  onEdit 
}: ViewCertificateModalProps) {
  if (!certificate) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">{certificate.title}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          <img 
            src={certificate.imageUrl || "https://images.unsplash.com/photo-1606953369506-c25e08f41ec1?auto=format&fit=crop&w=800&q=80"} 
            alt="شهادة تقدير" 
            className="w-full h-auto rounded-md"
          />
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">المستلم</h4>
              <p className="mt-1 text-sm text-gray-900">{certificate.recipient}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">تاريخ الإصدار</h4>
              <p className="mt-1 text-sm text-gray-900">
                {format(new Date(certificate.issueDate), "dd MMMM yyyy")}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">النوع</h4>
              <p className="mt-1 text-sm text-gray-900">
                {typeNameMap[certificate.certificateType] || certificate.certificateType}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">رقم الشهادة</h4>
              <p className="mt-1 text-sm text-gray-900">
                {certificate.certificateNumber || `CERT-${certificate.id}`}
              </p>
            </div>
          </div>
          
          {certificate.description && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500">الوصف</h4>
              <p className="mt-1 text-sm text-gray-900">{certificate.description}</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onEdit(certificate)}
          >
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Button>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => onDownload(certificate)}
            >
              <Download className="ml-2 h-4 w-4" />
              تحميل
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              <X className="ml-2 h-4 w-4" />
              إغلاق
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
