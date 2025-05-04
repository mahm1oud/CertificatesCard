import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchFiltersProps {
  onSearch: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

export function SearchFilters({ onSearch, onStatusChange, onDateChange }: SearchFiltersProps) {
  return (
    <div className="bg-white shadow rounded-lg mb-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <Input
              type="text"
              placeholder="بحث عن الشهادات..."
              className="pr-10"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Select onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع الحالات</SelectItem>
              <SelectItem value="verified">مصدقة</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="rejected">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select onValueChange={onDateChange}>
            <SelectTrigger>
              <SelectValue placeholder="جميع التواريخ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع التواريخ</SelectItem>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="year">هذا العام</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
