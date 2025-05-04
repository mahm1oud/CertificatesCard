import { Link } from "wouter";
import { FallbackImage } from "./ui/fallback-image";

interface CardTemplateItemProps {
  template: {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
  };
}

const CardTemplateItem = ({ template }: CardTemplateItemProps) => {
  return (
    <div 
      className="card-template bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
      data-category={template.category}
      data-template-id={template.slug}
    >
      <Link href={`/cards/${template.category}/${template.slug}`}>
        <div className="block relative pb-[130%]">
          <FallbackImage 
            src={template.imageUrl} 
            alt={template.title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex items-end p-4">
            <h3 className="text-white font-medium text-lg">{template.title}</h3>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CardTemplateItem;
