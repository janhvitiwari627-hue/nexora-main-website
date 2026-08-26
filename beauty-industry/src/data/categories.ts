import { CATEGORY_TAXONOMY, CATEGORY_TAXONOMY_LIST, CATEGORIES_DATA, getSubcategoriesForCategoryName, getAllCategoryKeys } from './categoryTaxonomy';

export { CATEGORY_TAXONOMY, CATEGORY_TAXONOMY_LIST, CATEGORIES_DATA, getSubcategoriesForCategoryName, getAllCategoryKeys };

export interface CategoryTaxonomy {
  id: string;
  name: string;
  iconName: string;
  subtitle: string;
  itemCount: string;
  image: string;
  subcategories: string[];
}

export const B2B_CATEGORIES: CategoryTaxonomy[] = [
  {
    id: 'skincare',
    name: 'Skincare',
    iconName: 'Sparkles',
    subtitle: 'Clinical Serums, Creams & Derma Care',
    itemCount: '1,840+ Listings',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'Serums & Treatments',
      'Cleansers & Toners',
      'Moisturizers & Creams',
      'Sunscreen & Sun Care',
      'Face Masks & Peels',
      'Eye & Lip Care'
    ]
  },
  {
    id: 'haircare',
    name: 'Haircare & Styling',
    iconName: 'Scissors',
    subtitle: 'Salon Formulations, Oils & Spa Kits',
    itemCount: '1,250+ Listings',
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'Shampoos & Conditioners',
      'Hair Oils & Serums',
      'Hair Colors & Developers',
      'Styling Creams, Waxes & Gels',
      'Hair Spa & Deep Treatment Masks',
      'Scalp Treatments'
    ]
  },
  {
    id: 'color-cosmetics',
    name: 'Color Cosmetics / Makeup',
    iconName: 'Palette',
    subtitle: 'Foundations, Lipsticks & Eye Cosmetics',
    itemCount: '1,410+ Listings',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'Face Makeup (Foundation, Concealer, Compact)',
      'Lip Products (Lipsticks, Glosses, Liners)',
      'Eye Makeup (Mascara, Eyeliner, Eyeshadow)',
      'Nail Care & Polish',
      'Makeup Removers & Fixers'
    ]
  },
  {
    id: 'personal-care',
    name: 'Personal Care & Body',
    iconName: 'Droplets',
    subtitle: 'Body Washes, Lotions & Hygiene Care',
    itemCount: '980+ Listings',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'Body Washes & Shower Gels',
      'Body Lotions & Lotions/Butter',
      'Soaps & Hand Washes',
      'Intimate & Hygiene Care',
      'Scrub & Exfoliators'
    ]
  },
  {
    id: 'raw-ingredients',
    name: 'Raw Ingredients & Actives',
    iconName: 'FlaskConical',
    subtitle: 'Botanicals, Actives, Oils & Polymers',
    itemCount: '860+ Bulk Actives',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'Active Botanical Extracts',
      'Essential Oils & Fragrance Oils',
      'Carrier Oils & Butters',
      'Vitamins & Antioxidants (e.g., Vitamin C, Niacinamide)',
      'Surfactants & Emulsifiers',
      'Preservatives & Thickening Agents'
    ]
  },
  {
    id: 'packaging',
    name: 'Packaging & Containers',
    iconName: 'Package',
    subtitle: 'Glass Bottles, Airless Pumps & Eco Jars',
    itemCount: '1,120+ Components',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'Bottles (Glass, PET, HDPE)',
      'Jars & Tubs',
      'Tubes & Squeeze Bottles',
      'Pumps, Sprayers & Caps',
      'Eco-friendly & Sustainable Packaging',
      'Outer Boxes & Labeling'
    ]
  },
  {
    id: 'salon-equipment',
    name: 'Salon & Spa Equipment',
    iconName: 'Microscope',
    subtitle: 'Facial Machines, Chairs & Disposables',
    itemCount: '740+ Machines',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    subcategories: [
      'Facial Machines & Tools',
      'Hair Styling & Drying Tools',
      'Massage & Spa Furniture',
      'Disposables & Sterilization Supplies',
      'Professional Tool Kits'
    ]
  }
];

export function getCategoryByName(categoryName: string): CategoryTaxonomy | undefined {
  if (!categoryName) return undefined;
  const normalized = categoryName.trim().toLowerCase();
  return B2B_CATEGORIES.find(
    cat =>
      cat.name.toLowerCase() === normalized ||
      cat.id.toLowerCase() === normalized ||
      normalized.includes(cat.name.toLowerCase()) ||
      cat.name.toLowerCase().includes(normalized)
  );
}

export function getSubcategoriesForCategory(categoryName: string): string[] {
  if (!categoryName || categoryName === 'All' || categoryName === 'All Categories') {
    return B2B_CATEGORIES.flatMap(c => c.subcategories);
  }
  const category = getCategoryByName(categoryName);
  return category ? category.subcategories : [];
}

export function getSubcategoriesForCategories(categoryNames: string[]): string[] {
  if (!categoryNames || categoryNames.length === 0) return [];
  return B2B_CATEGORIES.filter(c =>
    categoryNames.some(
      cn =>
        cn.toLowerCase() === c.name.toLowerCase() ||
        cn.toLowerCase() === c.id.toLowerCase() ||
        c.name.toLowerCase().includes(cn.toLowerCase()) ||
        cn.toLowerCase().includes(c.name.toLowerCase())
    )
  ).flatMap(c => c.subcategories);
}

export function getAllCategoryNames(): string[] {
  return B2B_CATEGORIES.map(c => c.name);
}

export function getAllSubcategoryNames(): string[] {
  return B2B_CATEGORIES.flatMap(c => c.subcategories);
}
