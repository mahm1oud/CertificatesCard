import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(start + 2, totalPages - 1);
      
      // Adjust start if end is too close to totalPages
      if (end === totalPages - 1) {
        start = Math.max(2, end - 2);
      }
      
      // Add ellipsis if there's a gap after page 1
      if (start > 2) {
        pages.push(-1); // Use -1 to represent ellipsis
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if there's a gap before last page
      if (end < totalPages - 1) {
        pages.push(-2); // Use -2 to represent ellipsis (needs different key)
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  return (
    <div className="mt-8 flex items-center justify-between">
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          السابق
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          التالي
        </Button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            عرض 
            <span className="font-medium mx-1">{startItem}</span>
            إلى 
            <span className="font-medium mx-1">{endItem}</span>
            من
            <span className="font-medium mx-1">{totalItems}</span>
            شهادة
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="التنقل بين الصفحات">
            <Button
              variant="outline"
              className="relative inline-flex items-center px-2 py-2 rounded-r-md text-sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              <span className="sr-only">السابق</span>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            {getPageNumbers().map((pageNum, idx) => (
              pageNum < 0 ? (
                // Render ellipsis
                <span 
                  key={`ellipsis-${pageNum}`} 
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                >
                  ...
                </span>
              ) : (
                // Render page number
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                    currentPage === pageNum 
                      ? "bg-primary text-white" 
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            ))}
            
            <Button
              variant="outline"
              className="relative inline-flex items-center px-2 py-2 rounded-l-md text-sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">التالي</span>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
