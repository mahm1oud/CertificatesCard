export interface Certificate {
  id: number;
  title: string;
  recipient: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  duration: number;
  status: string; // "verified" | "pending" | "rejected"
  description?: string;
  verificationId?: string;
}

export interface Stats {
  totalCertificates: number;
  verifiedCertificates: number;
  pendingCertificates: number;
  rejectedCertificates: number;
}

export interface CertificatesResponse {
  certificates: Certificate[];
  total: number;
}
