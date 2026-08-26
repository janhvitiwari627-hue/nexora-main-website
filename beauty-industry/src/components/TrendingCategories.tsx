import React from 'react';
import {
  Sparkles,
  Scissors,
  Palette,
  Wind,
  Droplets,
  Hand,
  FlaskConical,
  Package,
  Armchair,
  Wrench,
  UserCheck,
  Factory,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { CategoryItem } from '../types';

interface TrendingCategoriesProps {
  onCategoryClick?: (categoryName: string) => void;
  onViewAll?: () => void;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Sparkles':
      return <Sparkles className="w-4 h-4" />;
    case 'Scissors':
      return <Scissors className="w-4 h-4" />;
    case 'Palette':
      return <Palette className="w-4 h-4" />;
    case 'Wind':
      return <Wind className="w-4 h-4" />;
    case 'Droplets':
      return <Droplets className="w-4 h-4" />;
    case 'HandMetal':
    case 'Hand':
      return <Hand className="w-4 h-4" />;
    case 'FlaskConical':
      return <FlaskConical className="w-4 h-4" />;
    case 'Package':
      return <Package className="w-4 h-4" />;
    case 'Armchair':
      return <Armchair className="w-4 h-4" />;
    case 'Wrench':
      return <Wrench className="w-4 h-4" />;
    case 'UserCheck':
      return <UserCheck className="w-4 h-4" />;
    case 'Factory':
      return <Factory className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

export const TrendingCategories: React.FC<TrendingCategoriesProps> = ({
  onCategoryClick,
  onViewAll,
}) => {
  return (
    <section className="my-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 pb-2 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B90064]"></span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#B90064]">
              Marketplace Verticals
            </span>
          </div>
          <h2 className="font-serif text-[22px] md:text-[28px] font-bold text-[#1C1B1B] mt-0.5 tracking-tight">
            Trending Sourcing Categories
          </h2>
          <p className="text-[13px] text-[#594047] mt-0.5">
            Discover audited manufacturers, bulk formulations, and verified beauty suppliers
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-[13px] font-bold text-[#B90064] hover:text-[#500037] flex items-center gap-1.5 transition-colors cursor-pointer group shrink-0 px-3.5 py-1.5 rounded-lg hover:bg-[#FAF1F5]"
        >
          <span>View All 7 Core Verticals</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Cinematic Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
        {CATEGORIES.map((category: CategoryItem) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick?.(category.name)}
            className={`card-hover-fx group text-left rounded-2xl flex flex-col justify-between cursor-pointer relative overflow-hidden backdrop-blur-md ${
              category.isHighlighted
                ? 'bg-gradient-to-b from-white/90 to-[#FFF5F8]/80 border-2 border-[#B90064]/40 shadow-sm'
                : 'bg-white/80 border border-[#E8DFE3] hover:border-[#B90064]/40 shadow-xs'
            }`}
          >
            {/* Card Top: Photographic Visual Hero Container with Smooth Zoom Animation */}
            <div className="relative w-full aspect-[4/3] rounded-t-2xl overflow-hidden bg-[#FAF1F5]">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              
              {/* Subtle Cinematic Ambient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"></div>

              {/* Top Floating Glass Icon Chip */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md border shadow-2xs transition-all duration-300 ${
                    category.isHighlighted
                      ? 'bg-[#B90064] text-white border-[#B90064]/50'
                      : 'bg-white/90 text-[#500037] border-white/80 group-hover:bg-[#B90064] group-hover:text-white'
                  }`}
                >
                  <div className="transition-transform duration-300 ease-out group-hover:scale-110">
                    {getCategoryIcon(category.iconName)}
                  </div>
                </div>
              </div>

              {/* Top Right Highlight Tag or Status */}
              {category.isHighlighted ? (
                <div className="absolute top-2.5 right-2.5 bg-[#B90064] text-white text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Turnkey</span>
                </div>
              ) : (
                <div className="absolute top-2.5 right-2.5 bg-black/40 backdrop-blur-md text-white/95 text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {category.itemCount.split(' ')[0]}
                </div>
              )}

              {/* Bottom Subtle Overlay Count */}
              <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-medium drop-shadow-xs">
                <span className="truncate text-white/90 text-[10.5px]">
                  {category.subtitle.split(',')[0]}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0" />
              </div>
            </div>

            {/* Card Content Details */}
            <div className="p-3.5 flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-[13.5px] sm:text-[14px] font-extrabold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors leading-snug line-clamp-1">
                  {category.name}
                </h3>
                <p className="text-[11px] text-[#594047] line-clamp-1 mt-0.5 font-normal">
                  {category.subtitle}
                </p>
              </div>

              {/* Bottom Meta & Action */}
              <div className="mt-2.5 pt-2 border-t border-[#F0E8EB] flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-[#8D8087] group-hover:text-[#500037] transition-colors">
                  {category.itemCount}
                </span>
                <span className="text-[10.5px] font-extrabold text-[#B90064] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 flex items-center gap-0.5">
                  Explore →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

