import { Skeleton } from "@/components/ui/skeleton";
import CardTemplateItem from "@/components/card-template-item";

interface CardGridProps {
  templates: any[] | undefined;
  isLoading: boolean;
}

const CardGrid = ({ templates, isLoading }: CardGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md">
            <div className="relative pb-[130%]">
              <Skeleton className="absolute inset-0 w-full h-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl text-gray-500">لا توجد قوالب متاحة حاليًا</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {templates.map((template) => (
        <CardTemplateItem key={template.id} template={template} />
      ))}
    </div>
  );
};

export default CardGrid;
