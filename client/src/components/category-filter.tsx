import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  if (isLoading) {
    return (
      <div className="mb-8" id="categories">
        <h1 className="text-3xl font-bold text-neutral-800 mb-6 text-center">اختر تصنيف البطاقة</h1>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <div className="animate-pulse h-10 w-24 bg-gray-200 rounded-full"></div>
          <div className="animate-pulse h-10 w-32 bg-gray-200 rounded-full"></div>
          <div className="animate-pulse h-10 w-28 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8" id="categories">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6 text-center">اختر تصنيف البطاقة</h1>
      
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button
          onClick={() => onCategoryChange(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            selectedCategory === null ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100 text-neutral-700 border border-gray-200'
          }`}
        >
          الكل
        </Button>
        
        {categories?.map((category: any) => (
          <Button
            key={category.id}
            onClick={() => onCategoryChange(category.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedCategory === category.slug
                ? 'bg-primary text-white'
                : 'bg-white hover:bg-gray-100 text-neutral-700 border border-gray-200'
            }`}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
