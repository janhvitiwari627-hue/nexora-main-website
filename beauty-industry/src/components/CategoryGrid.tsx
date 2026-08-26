import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { B2B_CATEGORIES } from '../data/categories';

interface CategoryGridProps {
  onCategoryClick?: (categoryName: string) => void;
  onViewAll?: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onCategoryClick, onViewAll }) => {
  const categories = B2B_CATEGORIES.map(c => ({
    id: c.id,
    name: c.name,
    query: c.name,
    itemCount: c.itemCount,
    image: c.image
  }));

  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6 pb-2">
        <div>
          <h2 className="font-serif text-[22px] md:text-[26px] font-bold text-[#1C1B1B] border-b-2 border-[#B90064] pb-1 inline-block">
            Explore Core Verticals
          </h2>
          <p className="text-[13px] text-[#594047] mt-1">
            Source verified formulations and contract manufacturers
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-[13px] font-bold text-[#B90064] hover:text-[#500037] flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryClick?.(cat.query)}
            className="group block text-left cursor-pointer rounded-2xl bg-white/85 backdrop-blur-md border border-[#E8DFE3] hover:border-[#B90064]/40 p-2.5 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="w-full aspect-square rounded-xl overflow-hidden mb-2.5 bg-[#FAF1F5] relative">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <ChevronRight className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 text-white/90 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h3 className="text-[13px] font-extrabold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors leading-tight truncate">
              {cat.name}
            </h3>
            <p className="text-[10.5px] font-semibold text-[#8D8087] truncate mt-0.5">
              {cat.itemCount}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};

