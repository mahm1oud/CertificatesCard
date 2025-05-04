import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Download } from "lucide-react";
import { downloadImage } from "@/lib/utils";

export default function CertificateVerify() {
  const { code } = useParams();
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: verificationResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/certificates/verify/${code}`],
    queryFn: getQueryFn({}),
    retry: false,
    enabled: !!code,
  });

  // Handle certificate download
  const handleDownload = () => {
    if (verificationResult?.certificate) {
      setIsDownloading(true);
      downloadImage(
        verificationResult.certificate.imageUrl,
        `شهادة_${verificationResult.certificate.issuedTo || verificationResult.certificate.id}.png`
      ).finally(() => {
        setIsDownloading(false);
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">التحقق من الشهادة</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">خطأ في التحقق</h3>
                <p className="text-muted-foreground">
                  تعذر التحقق من الشهادة. يرجى التأكد من صحة رمز التحقق.
                </p>
              </div>
            ) : verificationResult ? (
              <div className="space-y-6">
                {verificationResult.valid ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">الشهادة صالحة</h3>
                    <p className="text-muted-foreground">
                      تم التحقق من صحة هذه الشهادة
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">الشهادة غير صالحة</h3>
                    <p className="text-muted-foreground">
                      {verificationResult.message}
                    </p>
                  </div>
                )}

                {verificationResult.certificate && (
                  <div className="space-y-6 mt-8">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted p-4 font-medium">تفاصيل الشهادة</div>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">العنوان</h4>
                            <p>{verificationResult.certificate.title}</p>
                          </div>
                          {verificationResult.certificate.issuedTo && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">الممنوحة إلى</h4>
                              <p>{verificationResult.certificate.issuedTo}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">نوع الشهادة</h4>
                            <p>
                              {verificationResult.certificate.certificateType === 'appreciation' && 'شهادة تقدير'}
                              {verificationResult.certificate.certificateType === 'training' && 'شهادة تدريب'}
                              {verificationResult.certificate.certificateType === 'education' && 'شهادة تعليم'}
                              {verificationResult.certificate.certificateType === 'teacher' && 'شهادة للمعلمين'}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">تاريخ الإصدار</h4>
                            <p>{new Date(verificationResult.certificate.createdAt).toLocaleDateString('ar-SA')}</p>
                          </div>
                          {verificationResult.certificate.expiryDate && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">تاريخ الانتهاء</h4>
                              <p>{new Date(verificationResult.certificate.expiryDate).toLocaleDateString('ar-SA')}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">رمز التحقق</h4>
                            <p className="font-mono">{verificationResult.certificate.verificationCode}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="aspect-[1.414/1] w-full border rounded-lg overflow-hidden">
                      <img
                        src={verificationResult.certificate.imageUrl}
                        alt="شهادة"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">رمز التحقق غير صالح</h3>
                <p className="text-muted-foreground">
                  يرجى التأكد من صحة رمز التحقق المدخل.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/">
              <Button variant="outline">العودة للرئيسية</Button>
            </Link>
            {verificationResult?.valid && verificationResult?.certificate && (
              <Button onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 ml-2" />
                    تحميل الشهادة
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}