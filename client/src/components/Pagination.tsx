import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    // Calculate the range of page numbers to display
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Add first page
    if (startPage > 1) {
      pages.push(
        <Button
          key={1}
          variant={currentPage === 1 ? "default" : "outline"}
          size="sm"
          className={cn(
            "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium",
            currentPage === 1 && "z-10 bg-primary-50 border-primary-500 text-primary-600"
          )}
          onClick={() => onPageChange(1)}
        >
          1
        </Button>
      );
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push(
          <span
            key="start-ellipsis"
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
          >
            ...
          </span>
        );
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) { // Avoid duplicating first and last page
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            className={cn(
              "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium",
              currentPage === i && "z-10 bg-primary-50 border-primary-500 text-primary-600"
            )}
            onClick={() => onPageChange(i)}
          >
            {i}
          </Button>
        );
      }
    }

    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      pages.push(
        <span
          key="end-ellipsis"
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
        >
          ...
        </span>
      );
    }

    // Add last page
    if (endPage < totalPages) {
      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          className={cn(
            "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium",
            currentPage === totalPages && "z-10 bg-primary-50 border-primary-500 text-primary-600"
          )}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          السابق
        </Button>
        <Button
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
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
            نتيجة
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm pagination-nav" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <span className="sr-only">السابق</span>
              <i className="fas fa-chevron-right h-5 w-5"></i>
            </Button>
            
            {renderPageNumbers()}
            
            <Button
              variant="outline"
              size="sm"
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <span className="sr-only">التالي</span>
              <i className="fas fa-chevron-left h-5 w-5"></i>
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
