import { GalleryItem, LinkedServiceOption, SalonTheme, SalonThemeInfo } from '../types/gallery';

export const SALON_THEMES_INFO: Record<SalonTheme, SalonThemeInfo> = {
  barber: {
    id: 'barber',
    name: 'Barber Studio',
    tagline: 'Gentlemen\'s Craft Barbering & Grooming',
    badgeBg: 'bg-[#1E293B]',
    badgeText: 'text-[#F8FAFC]',
    accentColor: '#3B82F6',
    iconName: 'Scissors',
    description: 'Precision fade cuts, beard sculpting, traditional hot towel shaves & hair tattoo art.',
    categories: ['Fade & Precision Cuts', 'Beard Styling & Shave', 'Hair Tattoo & Design', 'Hot Towel Treatment', 'Grooming Package']
  },
  hair_studio: {
    id: 'hair_studio',
    name: 'Hair Studio',
    tagline: 'High-End Color Lounge & Hair Design',
    badgeBg: 'bg-[#FDE7F3]',
    badgeText: 'text-[#8E004B]',
    accentColor: '#8E004B',
    iconName: 'Sparkles',
    description: 'Balayage transformations, custom hair coloring, keratin glossing & couture styling.',
    categories: ['Balayage & Coloring', 'Keratin & Smoothing', 'Precision Cuts & Styling', 'Hair Extensions', 'Scalp & Hair Spa']
  },
  beauty_spa: {
    id: 'beauty_spa',
    name: 'Beauty & Spa',
    tagline: 'Holistic Skin Aesthetics & Spa Rituals',
    badgeBg: 'bg-[#ECFDF5]',
    badgeText: 'text-[#065F46]',
    accentColor: '#10B981',
    iconName: 'Flower2',
    description: 'Hydra-facials, organic spa therapies, aromatherapy massage & holistic bridal aesthetics.',
    categories: ['Advanced Facials', 'Aromatherapy Massage', 'Body Spa Rituals', 'Bridal Makeup', 'Waxing & Threading']
  },
  family: {
    id: 'family',
    name: 'Family Salon',
    tagline: 'Welcoming Salon Experience for All Ages',
    badgeBg: 'bg-[#EFF6FF]',
    badgeText: 'text-[#1E40AF]',
    accentColor: '#2563EB',
    iconName: 'HeartHandshake',
    description: 'Kid-friendly haircuts, parent-child packages, organic gentle formulas & multi-generational styling.',
    categories: ['Kids Haircuts', 'Parent & Child Duo', 'Family Care Packages', 'Gentle Organic Styling', 'Teen Makeovers']
  },
  nail_lash: {
    id: 'nail_lash',
    name: 'Nail & Lash',
    tagline: 'Couture Nail Artistry & Lash Studio',
    badgeBg: 'bg-[#FFF7ED]',
    badgeText: 'text-[#C2410C]',
    accentColor: '#F97316',
    iconName: 'Crown',
    description: 'Hand-painted gel extensions, Russian volume lashes, brow lamination & spa manicures.',
    categories: ['Gel Extensions & Nail Art', 'Eyelash Extensions', 'Lash Lift & Brow Tint', 'Spa Pedicure', 'Acrylic Sculpting']
  }
};

export const MOCK_LINKED_SERVICES: LinkedServiceOption[] = [
  // Barber Services
  { id: 'srv-bar-1', name: 'Royal Executive Fade & Beard Trim', theme: 'barber', category: 'Fade & Precision Cuts', price: 45 },
  { id: 'srv-bar-2', name: 'Traditional Straight Razor Hot Towel Shave', theme: 'barber', category: 'Beard Styling & Shave', price: 35 },
  { id: 'srv-bar-3', name: 'Freestyle Hair Tattoo & Geometric Fade', theme: 'barber', category: 'Hair Tattoo & Design', price: 55 },
  
  // Hair Studio Services
  { id: 'srv-hs-1', name: 'Signature Velvet Balayage & Gloss Finish', theme: 'hair_studio', category: 'Balayage & Coloring', price: 180 },
  { id: 'srv-hs-[#8E004B]', name: 'Brazilian Keratin Silk Therapy', theme: 'hair_studio', category: 'Keratin & Smoothing', price: 160 },
  { id: 'srv-hs-3', name: 'Couture Red Carpet Blowout & Styling', theme: 'hair_studio', category: 'Precision Cuts & Styling', price: 75 },

  // Beauty & Spa Services
  { id: 'srv-spa-1', name: 'Luxe Gold Infused Hydra-Facial Glow', theme: 'beauty_spa', category: 'Advanced Facials', price: 120 },
  { id: 'srv-spa-2', name: 'Deep Tissue Aromatherapy & Hot Stone Massage', theme: 'beauty_spa', category: 'Aromatherapy Massage', price: 110 },
  { id: 'srv-spa-3', name: 'Royal Bridal Glow Skin Treatment', theme: 'beauty_spa', category: 'Bridal Makeup', price: 210 },

  // Family Services
  { id: 'srv-fam-1', name: 'First Haircut Certificate & Gentle Styling (Kids)', theme: 'family', category: 'Kids Haircuts', price: 28 },
  { id: 'srv-fam-2', name: 'Mother & Daughter Pamper Spa Package', theme: 'family', category: 'Parent & Child Duo', price: 95 },
  { id: 'srv-fam-3', name: 'Family Trio Haircuts & Blowdry', theme: 'family', category: 'Family Care Packages', price: 105 },

  // Nail & Lash Services
  { id: 'srv-nl-1', name: 'Custom Hand-Painted 3D Gel Nail Art', theme: 'nail_lash', category: 'Gel Extensions & Nail Art', price: 85 },
  { id: 'srv-nl-2', name: 'Russian Volume Cashmere Lash Extensions', theme: 'nail_lash', category: 'Eyelash Extensions', price: 130 },
  { id: 'srv-nl-3', name: 'Keratin Lash Lift & HD Brow Lamination', theme: 'nail_lash', category: 'Lash Lift & Brow Tint', price: 70 }
];

export const INITIAL_GALLERY_ITEMS: GalleryItem[] = [
  // BARBER THEME ITEMS
  {
    id: 'gal-bar-1',
    title: 'Mid-Skin Fade & Textured Crop',
    description: 'Crisp lineup with skin taper, textured top style finished with matte clay.',
    theme: 'barber',
    category: 'Fade & Precision Cuts',
    linkedServiceId: 'srv-bar-1',
    linkedServiceName: 'Royal Executive Fade & Beard Trim',
    linkedServiceTheme: 'barber',
    salonId: 'salon-101',
    salonName: 'Maison de Luxe Barber',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-1', name: 'Alexandre Barber', role: 'staff' },
    uploadedAt: '2026-08-10T14:30:00Z',
    status: 'published',
    reviewedBy: { id: 'owner-101', name: 'Jean-Luc (Owner)', role: 'owner' },
    reviewedAt: '2026-08-10T15:00:00Z',
    likesCount: 34
  },
  {
    id: 'gal-bar-2',
    title: 'Hot Towel Beard Sculpting Before & After',
    description: 'Complete transformation from wild beard to sharply contoured outline.',
    theme: 'barber',
    category: 'Beard Styling & Shave',
    linkedServiceId: 'srv-bar-2',
    linkedServiceName: 'Traditional Straight Razor Hot Towel Shave',
    linkedServiceTheme: 'barber',
    salonId: 'salon-101',
    salonName: 'Maison de Luxe Barber',
    mediaType: 'before_after',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800',
    beforeImageUrl: 'https://images.unsplash.com/photo-1517832606589-715069686846?auto=format&fit=crop&q=80&w=800',
    afterImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-2', name: 'David Stylist', role: 'staff' },
    uploadedAt: '2026-08-14T08:15:00Z',
    status: 'pending',
    likesCount: 0
  },

  // HAIR STUDIO THEME ITEMS
  {
    id: 'gal-hs-1',
    title: 'Honey Vanilla Balayage & Gloss Blend',
    description: 'Dimensional warm blonding with zero harsh root lines and mirror gloss shine.',
    theme: 'hair_studio',
    category: 'Balayage & Coloring',
    linkedServiceId: 'srv-hs-1',
    linkedServiceName: 'Signature Velvet Balayage & Gloss Finish',
    linkedServiceTheme: 'hair_studio',
    salonId: 'salon-101',
    salonName: 'Nexora Hair Studio Mumbai',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-3', name: 'Sophie Colorist', role: 'staff' },
    uploadedAt: '2026-08-11T10:00:00Z',
    status: 'published',
    reviewedBy: { id: 'owner-101', name: 'Jean-Luc (Owner)', role: 'owner' },
    reviewedAt: '2026-08-11T11:20:00Z',
    likesCount: 89
  },
  {
    id: 'gal-hs-2',
    title: 'Silk Keratin Treatment Before & After',
    description: 'Frizzy damaged hair restored to sleek, smooth glossy strands.',
    theme: 'hair_studio',
    category: 'Keratin & Smoothing',
    linkedServiceId: 'srv-hs-[#8E004B]',
    linkedServiceName: 'Brazilian Keratin Silk Therapy',
    linkedServiceTheme: 'hair_studio',
    salonId: 'salon-101',
    salonName: 'Nexora Hair Studio Mumbai',
    mediaType: 'before_after',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    beforeImageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800',
    afterImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-4', name: 'Claire Artist', role: 'staff' },
    uploadedAt: '2026-08-14T07:45:00Z',
    status: 'pending',
    likesCount: 0
  },

  // BEAUTY & SPA THEME ITEMS
  {
    id: 'gal-spa-1',
    title: '24K Gold Hydra-Glow Facial Treatment',
    description: 'Deep pore cleansing, hyaluronic acid infusion and pure 24K gold foil mask.',
    theme: 'beauty_spa',
    category: 'Advanced Facials',
    linkedServiceId: 'srv-spa-1',
    linkedServiceName: 'Luxe Gold Infused Hydra-Facial Glow',
    linkedServiceTheme: 'beauty_spa',
    salonId: 'salon-101',
    salonName: 'Aurum Spa & Wellness',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-5', name: 'Elena Aesthetician', role: 'staff' },
    uploadedAt: '2026-08-12T16:00:00Z',
    status: 'published',
    reviewedBy: { id: 'owner-101', name: 'Jean-Luc (Owner)', role: 'owner' },
    reviewedAt: '2026-08-12T16:30:00Z',
    likesCount: 52
  },
  {
    id: 'gal-spa-2',
    title: 'Aromatherapy Lavender Spa Suite',
    description: 'Calming hot stone therapy session with custom essential oils.',
    theme: 'beauty_spa',
    category: 'Aromatherapy Massage',
    linkedServiceId: 'srv-spa-2',
    linkedServiceName: 'Deep Tissue Aromatherapy & Hot Stone Massage',
    linkedServiceTheme: 'beauty_spa',
    salonId: 'salon-101',
    salonName: 'Aurum Spa & Wellness',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-6', name: 'Sarah Therapist', role: 'staff' },
    uploadedAt: '2026-08-13T12:00:00Z',
    status: 'pending',
    likesCount: 0
  },

  // FAMILY SALON THEME ITEMS
  {
    id: 'gal-fam-1',
    title: 'First Haircut Smiles & Certificate',
    description: 'Gentle, tear-free haircut experience for little ones with fun themed seats.',
    theme: 'family',
    category: 'Kids Haircuts',
    linkedServiceId: 'srv-fam-1',
    linkedServiceName: 'First Haircut Certificate & Gentle Styling (Kids)',
    linkedServiceTheme: 'family',
    salonId: 'salon-101',
    salonName: 'Nexora Family Hair Lounge',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-7', name: 'Marc Family Stylist', role: 'staff' },
    uploadedAt: '2026-08-09T11:00:00Z',
    status: 'published',
    reviewedBy: { id: 'owner-101', name: 'Jean-Luc (Owner)', role: 'owner' },
    reviewedAt: '2026-08-09T12:00:00Z',
    likesCount: 41
  },
  {
    id: 'gal-fam-2',
    title: 'Mother & Daughter Matching Braids',
    description: 'Fun matching festival braids and organic sparkle spray.',
    theme: 'family',
    category: 'Parent & Child Duo',
    linkedServiceId: 'srv-fam-2',
    linkedServiceName: 'Mother & Daughter Pamper Spa Package',
    linkedServiceTheme: 'family',
    salonId: 'salon-101',
    salonName: 'Nexora Family Hair Lounge',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-8', name: 'Chloe Stylist', role: 'staff' },
    uploadedAt: '2026-08-14T06:30:00Z',
    status: 'pending',
    likesCount: 0
  },

  // NAIL & LASH THEME ITEMS
  {
    id: 'gal-nl-1',
    title: '3D Chrome & Pearl Gel Extensions',
    description: 'Hand-sculpted almond gel nails with metallic chrome accents and pearls.',
    theme: 'nail_lash',
    category: 'Gel Extensions & Nail Art',
    linkedServiceId: 'srv-nl-1',
    linkedServiceName: 'Custom Hand-Painted 3D Gel Nail Art',
    linkedServiceTheme: 'nail_lash',
    salonId: 'salon-101',
    salonName: 'Velvet Nail & Lash Bar',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-9', name: 'Mia Nail Artist', role: 'staff' },
    uploadedAt: '2026-08-13T09:15:00Z',
    status: 'published',
    reviewedBy: { id: 'owner-101', name: 'Jean-Luc (Owner)', role: 'owner' },
    reviewedAt: '2026-08-13T10:00:00Z',
    likesCount: 78
  },
  {
    id: 'gal-nl-2',
    title: 'Russian Volume 6D Lash Transformation',
    description: 'Wispy volume eyelash set giving a fluffy, dramatic cat-eye finish.',
    theme: 'nail_lash',
    category: 'Eyelash Extensions',
    linkedServiceId: 'srv-nl-2',
    linkedServiceName: 'Russian Volume Cashmere Lash Extensions',
    linkedServiceTheme: 'nail_lash',
    salonId: 'salon-101',
    salonName: 'Velvet Nail & Lash Bar',
    mediaType: 'before_after',
    imageUrl: 'https://images.unsplash.com/photo-1583001809873-a1284a5da271?auto=format&fit=crop&q=80&w=800',
    beforeImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    afterImageUrl: 'https://images.unsplash.com/photo-1583001809873-a1284a5da271?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-10', name: 'Hannah Lash Tech', role: 'staff' },
    uploadedAt: '2026-08-14T08:00:00Z',
    status: 'pending',
    likesCount: 0
  },

  // SAMPLE REJECTED & UNPUBLISHED ITEMS FOR MODERATION DEMO
  {
    id: 'gal-rej-1',
    title: 'Unverified Blurry Photo Submission',
    description: 'Out of focus photo lacking proper lighting.',
    theme: 'barber',
    category: 'Fade & Precision Cuts',
    linkedServiceId: 'srv-bar-1',
    linkedServiceName: 'Royal Executive Fade & Beard Trim',
    linkedServiceTheme: 'barber',
    salonId: 'salon-101',
    salonName: 'Maison de Luxe Barber',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-11', name: 'Guest User', role: 'customer' },
    uploadedAt: '2026-08-08T10:00:00Z',
    status: 'rejected',
    reviewedBy: { id: 'owner-101', name: 'Jean-Luc (Owner)', role: 'owner' },
    reviewedAt: '2026-08-08T11:00:00Z',
    rejectionReason: 'Image quality too low / blurry lighting. Please re-upload a clear high-res photo.',
    likesCount: 0
  },
  {
    id: 'gal-unp-1',
    title: 'Seasonal Winter Balayage Promo',
    description: 'Archived promotional showcase image.',
    theme: 'hair_studio',
    category: 'Balayage & Coloring',
    linkedServiceId: 'srv-hs-1',
    linkedServiceName: 'Signature Velvet Balayage & Gloss Finish',
    linkedServiceTheme: 'hair_studio',
    salonId: 'salon-101',
    salonName: 'Nexora Hair Studio Mumbai',
    mediaType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800',
    uploadedBy: { id: 'usr-3', name: 'Sophie Colorist', role: 'staff' },
    uploadedAt: '2026-08-01T10:00:00Z',
    status: 'unpublished',
    reviewedBy: { id: 'owner-101', name: 'Jean-Luc (Owner)', role: 'owner' },
    reviewedAt: '2026-08-05T10:00:00Z',
    likesCount: 15
  }
];

/**
 * VALIDATION ENGINE BEFORE PUBLISH / REACTIVATE
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateGalleryItemForPublish(
  item: GalleryItem,
  currentOwnerSalonId: string = 'salon-101',
  currentUserRole: 'owner' | 'admin' | 'customer' | 'staff' = 'owner'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. SECURITY & AUTHORIZATION CHECK
  if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
    errors.push('UNAUTHORIZED: Only authorized salon owners or admins can approve gallery content.');
  }

  if (item.salonId !== currentOwnerSalonId) {
    errors.push(`SALON MISMATCH: You do not have ownership permissions for Salon ID #${item.salonId}.`);
  }

  // 2. SALON ID VERIFICATION
  if (!item.salonId || item.salonId.trim() === '') {
    errors.push('MISSING SALON ID: Gallery item must be linked to a valid registered salon.');
  }

  // 3. THEME VERIFICATION
  const validThemes: SalonTheme[] = ['barber', 'hair_studio', 'beauty_spa', 'family', 'nail_lash'];
  if (!validThemes.includes(item.theme)) {
    errors.push(`INVALID THEME: "${item.theme}" is not a recognized salon theme.`);
  }

  // 4. CROSS-THEME MAPPING CHECK
  if (item.linkedServiceTheme && item.linkedServiceTheme !== item.theme) {
    errors.push(
      `CROSS-THEME VIOLATION: Cannot map service "${item.linkedServiceName}" (Theme: ${item.linkedServiceTheme.toUpperCase()}) to gallery theme "${item.theme.toUpperCase()}". Theme isolation strictly enforced.`
    );
  }

  // 5. CATEGORY & LINKED SERVICE VERIFICATION
  if (!item.linkedServiceId || item.linkedServiceId.trim() === '') {
    errors.push('MISSING LINKED SERVICE: Gallery item must be linked to a valid salon service.');
  }
  if (!item.category || item.category.trim() === '') {
    errors.push('MISSING CATEGORY: Gallery item must specify a service category.');
  }

  // 6. MEDIA VALIDATION
  if (item.mediaType === 'image') {
    if (!item.imageUrl || item.imageUrl.trim() === '') {
      errors.push('INVALID MEDIA: High-resolution image URL or file is required.');
    }
  } else if (item.mediaType === 'before_after') {
    if (!item.beforeImageUrl || item.beforeImageUrl.trim() === '') {
      errors.push('INVALID BEFORE IMAGE: Before + After comparison requires a valid "Before" image.');
    }
    if (!item.afterImageUrl || item.afterImageUrl.trim() === '') {
      errors.push('INVALID AFTER IMAGE: Before + After comparison requires a valid "After" image.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * CUSTOMER VISIBILITY FILTER
 * Strictly returns ONLY approved + published items for the active theme.
 */
export function getPublicCustomerGalleryItems(
  items: GalleryItem[],
  activeTheme: SalonTheme
): GalleryItem[] {
  return items.filter(
    item => item.status === 'published' && item.theme === activeTheme
  );
}
