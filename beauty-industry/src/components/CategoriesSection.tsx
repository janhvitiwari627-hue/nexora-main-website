import React from 'react';
import { TrendingCategories } from './TrendingCategories';

interface CategoriesSectionProps {
  onCategoryClick?: (categoryName: string) => void;
  onViewAll?: () => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = (props) => {
  return <TrendingCategories {...props} />;
};

export default CategoriesSection;
