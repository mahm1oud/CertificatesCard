import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FallbackImage } from "@/components/ui/fallback-image";
import { Certificate } from "@shared/schema";
import { format } from "date-fns";
import { Download } from "lucide-react";

interface CertificateCardProps {
  certificate: Certificate;
  onClick: (certificate: Certificate) => void;
  onDownload: (certificate: Certificate, e: React.MouseEvent) => void;
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

export default function CertificateCard({ certificate, onClick, onDownload }: CertificateCardProps) {
  const handleCardClick = () => {
    onClick(certificate);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(certificate, e);
  };

  return (
    <Card 
      className="certificate-card overflow-hidden cursor-pointer" 
      onClick={handleCardClick}
    >
      <div className="relative h-48 bg-gray-200">
        <FallbackImage 
          src={certificate.imageUrl || ""} 
          alt={certificate.title} 
          className="w-full h-full object-cover"
          fallbackSrc="/static/default-logo.svg"
        />
        <div className="absolute top-2 left-2">
          <Badge 
            variant={certificate.certificateType as any}
            className="text-xs font-medium"
          >
            {typeNameMap[certificate.certificateType] || certificate.certificateType}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{certificate.title}</h3>
        <p className="text-sm text-gray-500 mb-2">
          {format(new Date(certificate.issueDate), "dd MMMM yyyy")}
        </p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-600 mr-1">{certificate.recipient}</span>
          </div>
          <button 
            className="text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center"
            onClick={handleDownloadClick}
          >
            <Download className="h-4 w-4 ml-1" />
            تحميل
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
