export interface CategoryTaxonomyNode {
  id: string;
  name: string;
  subcategories: string[];
  iconName?: string;
  subtitle?: string;
  itemCount?: string;
  image?: string;
}

export const CATEGORY_TAXONOMY: Record<string, string[]> = {
  'Skincare': [
    'Serums & Treatments',
    'Cleansers & Toners',
    'Moisturizers & Creams',
    'Sunscreen & Sun Care',
    'Face Masks & Peels',
    'Eye & Lip Care'
  ],
  'Haircare & Styling': [
    'Shampoos & Conditioners',
    'Hair Oils & Serums',
    'Hair Colors & Developers',
    'Styling Creams, Waxes & Gels',
    'Hair Spa & Deep Treatment Masks',
    'Scalp Treatments'
  ],
  'Color Cosmetics / Makeup': [
    'Face Makeup (Foundation, Concealer, Compact)',
    'Lip Products (Lipsticks, Glosses, Liners)',
    'Eye Makeup (Mascara, Eyeliner, Eyeshadow)',
    'Nail Care & Polish',
    'Makeup Removers & Fixers'
  ],
  'Personal Care & Body': [
    'Body Washes & Shower Gels',
    'Body Lotions & Lotions/Butter',
    'Soaps & Hand Washes',
    'Intimate & Hygiene Care',
    'Scrub & Exfoliators'
  ],
  'Raw Ingredients & Actives': [
    'Active Botanical Extracts',
    'Essential Oils & Fragrance Oils',
    'Carrier Oils & Butters',
    'Vitamins & Antioxidants (e.g., Vitamin C, Niacinamide)',
    'Surfactants & Emulsifiers',
    'Preservatives & Thickening Agents'
  ],
  'Packaging & Containers': [
    'Bottles (Glass, PET, HDPE)',
    'Jars & Tubs',
    'Tubes & Squeeze Bottles',
    'Pumps, Sprayers & Caps',
    'Eco-friendly & Sustainable Packaging',
    'Outer Boxes & Labeling'
  ],
  'Salon & Spa Equipment': [
    'Facial Machines & Tools',
    'Hair Styling & Drying Tools',
    'Massage & Spa Furniture',
    'Disposables & Sterilization Supplies',
    'Professional Tool Kits'
  ]
};

export const CATEGORY_TAXONOMY_LIST: CategoryTaxonomyNode[] = [
  {
    id: 'skincare',
    name: 'Skincare',
    subcategories: CATEGORY_TAXONOMY['Skincare'],
    iconName: 'Sparkles',
    subtitle: 'Clinical Serums, Creams & Derma Care',
    itemCount: '1,840+ Listings',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'haircare',
    name: 'Haircare & Styling',
    subcategories: CATEGORY_TAXONOMY['Haircare & Styling'],
    iconName: 'Scissors',
    subtitle: 'Salon Formulations, Oils & Spa Kits',
    itemCount: '1,250+ Listings',
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'color-cosmetics',
    name: 'Color Cosmetics / Makeup',
    subcategories: CATEGORY_TAXONOMY['Color Cosmetics / Makeup'],
    iconName: 'Palette',
    subtitle: 'Foundations, Lipsticks & Eye Cosmetics',
    itemCount: '1,410+ Listings',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'personal-care',
    name: 'Personal Care & Body',
    subcategories: CATEGORY_TAXONOMY['Personal Care & Body'],
    iconName: 'Droplets',
    subtitle: 'Body Washes, Lotions & Hygiene Care',
    itemCount: '980+ Listings',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'raw-ingredients',
    name: 'Raw Ingredients & Actives',
    subcategories: CATEGORY_TAXONOMY['Raw Ingredients & Actives'],
    iconName: 'FlaskConical',
    subtitle: 'Botanicals, Actives, Oils & Polymers',
    itemCount: '860+ Bulk Actives',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'packaging',
    name: 'Packaging & Containers',
    subcategories: CATEGORY_TAXONOMY['Packaging & Containers'],
    iconName: 'Package',
    subtitle: 'Glass Bottles, Airless Pumps & Eco Jars',
    itemCount: '1,120+ Components',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'salon-equipment',
    name: 'Salon & Spa Equipment',
    subcategories: CATEGORY_TAXONOMY['Salon & Spa Equipment'],
    iconName: 'Microscope',
    subtitle: 'Facial Machines, Chairs & Disposables',
    itemCount: '740+ Machines',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'
  }
];

export const CATEGORIES_DATA = CATEGORY_TAXONOMY_LIST;

export function getSubcategoriesForCategoryName(categoryName: string): string[] {
  if (!categoryName) return [];
  if (categoryName === 'All' || categoryName === 'All Categories') {
    return Object.values(CATEGORY_TAXONOMY).flat();
  }
  const key = Object.keys(CATEGORY_TAXONOMY).find(
    k => k.toLowerCase() === categoryName.trim().toLowerCase() ||
         k.toLowerCase().includes(categoryName.trim().toLowerCase()) ||
         categoryName.trim().toLowerCase().includes(k.toLowerCase())
  );
  return key ? CATEGORY_TAXONOMY[key] : [];
}

export function getAllCategoryKeys(): string[] {
  return Object.keys(CATEGORY_TAXONOMY);
}
