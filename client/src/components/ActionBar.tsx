import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { FilterIcon, Search, PlusCircle } from "lucide-react";

interface ActionBarProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (selectedTypes: string[]) => void;
  onAddClick: () => void;
}

// Certificate type options for filter
const typeOptions = [
  { value: "technical", label: "تقني" },
  { value: "administrative", label: "إداري" },
  { value: "training", label: "تدريبي" },
  { value: "graduation", label: "تخرج" },
  { value: "leadership", label: "قيادة" },
  { value: "volunteer", label: "تطوع" },
];

export default function ActionBar({ onSearch, onFilter, onAddClick }: ActionBarProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => {
      const newTypes = prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type];
      
      onFilter(newTypes);
      return newTypes;
    });
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <div className="mb-6 flex flex-wrap justify-between items-center">
      <div className="mb-4 md:mb-0">
        <h2 className="text-2xl font-bold text-gray-800">الشهادات</h2>
        <p className="text-gray-500">إدارة وعرض شهادات التقدير</p>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="بحث عن شهادات..."
            className="pr-10 w-full md:w-64"
            onChange={handleSearchInput}
          />
        </div>
        
        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center">
              <FilterIcon className="ml-2 h-5 w-5" />
              تصفية
              {selectedTypes.length > 0 && (
                <span className="mr-1 bg-primary/20 text-primary text-xs rounded-full px-2 py-0.5">
                  {selectedTypes.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>تصفية حسب النوع</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {typeOptions.map((type) => (
              <DropdownMenuCheckboxItem
                key={type.value}
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={() => handleTypeToggle(type.value)}
              >
                {type.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Add Certificate Button */}
        <Button onClick={onAddClick}>
          <PlusCircle className="ml-2 h-5 w-5" />
          إضافة شهادة
        </Button>
      </div>
    </div>
  );
}
