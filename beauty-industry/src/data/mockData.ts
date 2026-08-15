import { Product, SupplierPartner, Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'skincare',
    name: 'Skincare',
    subtext: 'Professional Formulations',
    iconName: 'Sparkles',
    itemCount: 420,
    featuredImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACGmKxH3sKXQzfZ0ok5I09A_2UZ5Lk-zeaa_4Xt6mSPDZDL1IIZA2tVmblc0QziC47pQfp-5Wk6BBt42duT67QeBqYZkN6UH6HkVEU1iqTWHgMbCSUnsvb1PvD9o6hW_C1ySvLZ_q-7F2xmSh4Hn7gBVNzLuNTcqufs4ML63tl-Ng1UqB9kTB8g3uuBZvYf2yAOh8efzkvt74XQrLNEMOurN9E_4tW-0W_K5wpWHASxqrA6QQOfNH1'
  },
  {
    id: 'haircare',
    name: 'Haircare',
    iconName: 'Scissors',
    itemCount: 310
  },
  {
    id: 'haircolor',
    name: 'Hair Color',
    iconName: 'Palette',
    itemCount: 185
  },
  {
    id: 'makeup',
    name: 'Makeup',
    iconName: 'Brush',
    itemCount: 540
  },
  {
    id: 'nails',
    name: 'Nails',
    iconName: 'Hand',
    itemCount: 260
  },
  {
    id: 'spa',
    name: 'Spa',
    iconName: 'Flower2',
    itemCount: 195
  },
  {
    id: 'massage',
    name: 'Massage',
    iconName: 'HeartHandshake',
    itemCount: 140
  },
  {
    id: 'tattoo',
    name: 'Tattoo Studio',
    iconName: 'PenTool',
    itemCount: 95
  },
  {
    id: 'furniture',
    name: 'Salon Furniture',
    iconName: 'Armchair',
    itemCount: 110,
    featuredImg: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'tools',
    name: 'Salon Tools & Eq.',
    iconName: 'Wrench',
    itemCount: 340,
    featuredImg: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'backbar',
    name: 'Backbar Essentials',
    iconName: 'Package',
    itemCount: 190,
    featuredImg: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'aesthetic',
    name: 'Aesthetic Clinic Tools',
    iconName: 'Sparkles',
    itemCount: 125,
    featuredImg: 'https://images.unsplash.com/photo-1512290900672-8a25e2d6f28e?auto=format&fit=crop&q=80&w=800'
  }
];

export const SUPPLIERS: SupplierPartner[] = [
  {
    id: 'aura-beauty',
    initials: 'AB',
    name: 'Aura Beauty India',
    type: 'Manufacturer',
    businessTypeDetail: 'Manufacturer & Wholesaler',
    location: 'Mumbai',
    region: 'Mumbai',
    verified: true,
    isFree: false,
    tags: ['Haircare', 'Skincare', 'Organic Formulations'],
    rating: 4.9,
    reviewsCount: 124,
    productCount: 142,
    responseRate: '99% within 1h',
    minOrderValue: 25000,
    description: 'Premium manufacturer of salon-grade haircare and skincare products. Partnering with top luxury salons across the subcontinent. We specialize in organic formulations and sustainable packaging.',
    email: 'orders@aurabeautycorp.in',
    phone: '+91 22 6842 9900',
    whatsapp: '+919820012345',
    establishedYear: 2010,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCK-1tyXdcZhq03-TknCZ3gj6usizy9FmYBWyXQZlEScGfVq8T_ErDPFErYxAkuiVtq1xmegqXRtquzvh_V0hgWSBFfHqkJEGEyePtXBmhFZ6NgHonkxGvxrYSpwS5NYPGs6yOR7iHtUhmsMalVUgxHJ4wqzY_LJBzIQYY0Dw-t7B46Jglat6owcHZ9QLSSfrM8ImMQbj_n3TvkV5O37biJ2dDtkDu9PgLKS34ZsO28OndThcLh2dUo',
    sampleImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCNZWlxo1GE3RfXkL38ez9qU0PUaR7lM3gFLgHj5X30C7AnefXJPRYe2XMQqGRC7kE4z1Ktw4Jz9S_xpPzIMskSLPI-FbsfkH_mUOuZZidEIttsWlQ0Coo_R_tTmGPebKfznKeY_IPlVFQ16VrVlkTKasvjuTQY8Jd6Bq0yu2WpICmzZWm8IeXqxKd0DFZWWWVDR-trwOaAQD98vBxOIhHXcEUtC_R0Amcxb44DE-fqXreE85PhKhjK',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDnJB1h3l7QdG5inXNig2zQ_SNPj47UYUQuqySdluwxz_WqsOistnvQgDWWr3KGPj9W88GD4v4WsKhV2my9Jjy_HBdVevJqKf2wnkEYAriuiq3-SgtrzyleSHjA348ir1OZ8UydadWzsQs41aVeB2R8L4xXTjgtlv1pj7JY-dILg8my7KJaI8GQXw6frw3-h0vYuO9uFdSdR1y92b_ujj1iMWbHUtBgy_O8AKm7I1eHK42mxiWySf5T'
    ]
  },
  {
    id: 'luxe-color-dist',
    initials: 'BB',
    name: 'Bharat Backbar Wholesalers',
    type: 'Distributor',
    businessTypeDetail: 'Regional Distributor',
    location: 'Delhi',
    region: 'Delhi',
    verified: false,
    isFree: true,
    tags: ['Hair Color', 'Equipment', 'Salon Tools'],
    rating: 4.6,
    reviewsCount: 89,
    productCount: 78,
    responseRate: '94% within 4h',
    minOrderValue: 15000,
    description: 'Exclusive regional distributor for premium hair color brands and professional styling equipment. Next-day delivery available across North India.',
    email: 'contact@bharatbackbar.in',
    phone: '+91 11 4155 8820',
    whatsapp: '+919811098765',
    establishedYear: 2015,
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnJB1h3l7QdG5inXNig2zQ_SNPj47UYUQuqySdluwxz_WqsOistnvQgDWWr3KGPj9W88GD4v4WsKhV2my9Jjy_HBdVevJqKf2wnkEYAriuiq3-SgtrzyleSHjA348ir1OZ8UydadWzsQs41aVeB2R8L4xXTjgtlv1pj7JY-dILg8my7KJaI8GQXw6frw3-h0vYuO9uFdSdR1y92b_ujj1iMWbHUtBgy_O8AKm7I1eHK42mxiWySf5T',
    sampleImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBbJYm_SslFIku_82qLmRuk2k5zRvHZT8jce4mbMPDB-6-eB2ZZADEa8Z3fGAio0r-DI21vhJ1Mr_sndv1k6s18xexTuSiABEazFXa5yyXvh2nw9_0WqY-Z2BhWQ4LqO9JaZFxU8ERfPENI3Ajv5Cqh2UvAhHiDrKTp-qpqKryod_fnKK0f7bs2W8BMyOH87d0FN0e1IrvDAtynBYt3sUh2OSA8GMJ7ILRVo-517al6IOaan8oAJINt',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCfreDlJ-MCj8fxVa3-PVT_YUiuBzlJRN5KNdyZlHZOXW3AmSHzgvWBqTbw3h-HssFukxf6rkndCzlkk0h5o6lmU6qr52z0r-W2Z_p3EdRT9dhis9nxhiCboXqJFw1krftGK-fWhAw5vidF0WEItAU16yUPhOArPd8ANmOcQhyw0LFCLaFzssHKPwIrBQyl6JbKPrqG3Gh2SQNNu5KT6VclKd4OG4KjqONnQ1hq1Bd3lk9pQxJlGdfa'
    ]
  },
  {
    id: 'kavya-botanicals',
    initials: 'K',
    name: 'Kavya Ayurvedic Botanicals',
    type: 'Manufacturer',
    businessTypeDetail: 'Company / Manufacturer',
    location: 'Bengaluru',
    region: 'Bengaluru',
    verified: true,
    isFree: false,
    tags: ['Spa', 'Massage', 'Skincare', 'Ayurvedic'],
    rating: 4.95,
    reviewsCount: 160,
    productCount: 95,
    responseRate: '100% within 30m',
    minOrderValue: 20000,
    description: 'AYUSH-certified organic formulation lab delivering therapeutic herbal oils, saffron facial polishes, and backbar spa concentrates across pan-India luxury hotels.',
    email: 'b2b@kavyabotanicals.com',
    phone: '+91 80 4920 1144',
    whatsapp: '+919845012345',
    establishedYear: 2014,
    coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    sampleImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuACGmKxH3sKXQzfZ0ok5I09A_2UZ5Lk-zeaa_4Xt6mSPDZDL1IIZA2tVmblc0QziC47pQfp-5Wk6BBt42duT67QeBqYZkN6UH6HkVEU1iqTWHgMbCSUnsvb1PvD9o6hW_C1ySvLZ_q-7F2xmSh4Hn7gBVNzLuNTcqufs4ML63tl-Ng1UqB9kTB8g3uuBZvYf2yAOh8efzkvt74XQrLNEMOurN9E_4tW-0W_K5wpWHASxqrA6QQOfNH1',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    id: 'vertex-salon-tech',
    initials: 'V',
    name: 'Vertex Salon Technologies',
    type: 'Distributor',
    businessTypeDetail: 'Importer & Wholesaler',
    location: 'Kolkata',
    region: 'Kolkata',
    verified: true,
    isFree: false,
    tags: ['Salon Tools', 'Furniture', 'Equipment'],
    rating: 4.8,
    reviewsCount: 102,
    productCount: 110,
    responseRate: '97% within 2h',
    minOrderValue: 35000,
    description: 'Direct importer and pan-India distributor of high-end hydraulic styling chairs, micro-mist steamers, and diode laser backbar equipment with on-site warranty support.',
    email: 'sales@vertexsalontech.in',
    phone: '+91 40 2330 7711',
    whatsapp: '+919849012345',
    establishedYear: 2011,
    coverImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    sampleImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBbJYm_SslFIku_82qLmRuk2k5zRvHZT8jce4mbMPDB-6-eB2ZZADEa8Z3fGAio0r-DI21vhJ1Mr_sndv1k6s18xexTuSiABEazFXa5yyXvh2nw9_0WqY-Z2BhWQ4LqO9JaZFxU8ERfPENI3Ajv5Cqh2UvAhHiDrKTp-qpqKryod_fnKK0f7bs2W8BMyOH87d0FN0e1IrvDAtynBYt3sUh2OSA8GMJ7ILRVo-517al6IOaan8oAJINt',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCNZWlxo1GE3RfXkL38ez9qU0PUaR7lM3gFLgHj5X30C7AnefXJPRYe2XMQqGRC7kE4z1Ktw4Jz9S_xpPzIMskSLPI-FbsfkH_mUOuZZidEIttsWlQ0Coo_R_tTmGPebKfznKeY_IPlVFQ16VrVlkTKasvjuTQY8Jd6Bq0yu2WpICmzZWm8IeXqxKd0DFZWWWVDR-trwOaAQD98vBxOIhHXcEUtC_R0Amcxb44DE-fqXreE85PhKhjK'
    ]
  },
  {
    id: 'le-dist',
    initials: 'MB',
    name: 'Mumbai Beauty Imports',
    type: 'Wholesaler',
    businessTypeDetail: 'Wholesaler & Importer',
    location: 'Mumbai',
    region: 'Mumbai',
    verified: true,
    isFree: false,
    tags: ['Haircare', 'Skincare', 'Tools'],
    rating: 4.9,
    reviewsCount: 148,
    productCount: 86,
    responseRate: '98% within 2h',
    minOrderValue: 20000,
    description: 'Premier Indian importer of salon-grade professional treatments and patented ionic styling gear from international formulation houses.',
    email: 'wholesale@mumbaibeauty.in',
    phone: '+91 22 2490 5500',
    whatsapp: '+919822055000',
    establishedYear: 2012,
    coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
    sampleImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBbJYm_SslFIku_82qLmRuk2k5zRvHZT8jce4mbMPDB-6-eB2ZZADEa8Z3fGAio0r-DI21vhJ1Mr_sndv1k6s18xexTuSiABEazFXa5yyXvh2nw9_0WqY-Z2BhWQ4LqO9JaZFxU8ERfPENI3Ajv5Cqh2UvAhHiDrKTp-qpqKryod_fnKK0f7bs2W8BMyOH87d0FN0e1IrvDAtynBYt3sUh2OSA8GMJ7ILRVo-517al6IOaan8oAJINt',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCfreDlJ-MCj8fxVa3-PVT_YUiuBzlJRN5KNdyZlHZOXW3AmSHzgvWBqTbw3h-HssFukxf6rkndCzlkk0h5o6lmU6qr52z0r-W2Z_p3EdRT9dhis9nxhiCboXqJFw1krftGK-fWhAw5vidF0WEItAU16yUPhOArPd8ANmOcQhyw0LFCLaFzssHKPwIrBQyl6JbKPrqG3Gh2SQNNu5KT6VclKd4OG4KjqONnQ1hq1Bd3lk9pQxJlGdfa'
    ]
  },
  {
    id: 'gg-supply',
    initials: 'RG',
    name: 'Royal Glamour India Supplies',
    type: 'Manufacturer',
    businessTypeDetail: 'Company / Manufacturer',
    location: 'Pune',
    region: 'Pune',
    verified: true,
    isFree: false,
    tags: ['Makeup', 'Nails'],
    rating: 4.8,
    reviewsCount: 212,
    productCount: 145,
    responseRate: '99% within 1h',
    minOrderValue: 40000,
    description: 'ISO-certified beauty lab manufacturing high-potency active peptides, medical-grade lash kits, and rich pigments for high-volume salons.',
    email: 'orders@royalglamour.in',
    phone: '+91 522 555 0199',
    whatsapp: '+919912345678',
    establishedYear: 2008,
    coverImage: 'https://images.unsplash.com/photo-1512290900672-1f02e71edcf8?auto=format&fit=crop&w=1000&q=80',
    sampleImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCfreDlJ-MCj8fxVa3-PVT_YUiuBzlJRN5KNdyZlHZOXW3AmSHzgvWBqTbw3h-HssFukxf6rkndCzlkk0h5o6lmU6qr52z0r-W2Z_p3EdRT9dhis9nxhiCboXqJFw1krftGK-fWhAw5vidF0WEItAU16yUPhOArPd8ANmOcQhyw0LFCLaFzssHKPwIrBQyl6JbKPrqG3Gh2SQNNu5KT6VclKd4OG4KjqONnQ1hq1Bd3lk9pQxJlGdfa',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCNZWlxo1GE3RfXkL38ez9qU0PUaR7lM3gFLgHj5X30C7AnefXJPRYe2XMQqGRC7kE4z1Ktw4Jz9S_xpPzIMskSLPI-FbsfkH_mUOuZZidEIttsWlQ0Coo_R_tTmGPebKfznKeY_IPlVFQ16VrVlkTKasvjuTQY8Jd6Bq0yu2WpICmzZWm8IeXqxKd0DFZWWWVDR-trwOaAQD98vBxOIhHXcEUtC_R0Amcxb44DE-fqXreE85PhKhjK'
    ]
  },
  {
    id: 'pb-imports',
    initials: 'SI',
    name: 'South India Salon Depot',
    type: 'Distributor',
    businessTypeDetail: 'Importer & Distributor',
    location: 'Chennai',
    region: 'Chennai',
    verified: false,
    isFree: true,
    tags: ['Spa Equipment', 'Wellness'],
    rating: 4.6,
    reviewsCount: 79,
    productCount: 52,
    responseRate: '92% within 6h',
    minOrderValue: 15000,
    description: 'Direct importer of organic therapeutic clays, wellness spa stones, and hydrotherapy backbar equipment.',
    email: 'contact@southindiadepot.in',
    phone: '+91 44 2815 0912',
    whatsapp: '+919844098765',
    establishedYear: 2017,
    coverImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    sampleImages: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuACGmKxH3sKXQzfZ0ok5I09A_2UZ5Lk-zeaa_4Xt6mSPDZDL1IIZA2tVmblc0QziC47pQfp-5Wk6BBt42duT67QeBqYZkN6UH6HkVEU1iqTWHgMbCSUnsvb1PvD9o6hW_C1ySvLZ_q-7F2xmSh4Hn7gBVNzLuNTcqufs4ML63tl-Ng1UqB9kTB8g3uuBZvYf2yAOh8efzkvt74XQrLNEMOurN9E_4tW-0W_K5wpWHASxqrA6QQOfNH1'
    ]
  },
  {
    id: 'mc-milano',
    initials: 'SR',
    name: 'Shree Ram Beauty Supplies',
    type: 'Manufacturer',
    businessTypeDetail: 'Company / Manufacturer',
    location: 'Jaipur',
    region: 'Jaipur',
    verified: true,
    isFree: false,
    tags: ['Hair Color', 'Skincare'],
    rating: 5.0,
    reviewsCount: 94,
    productCount: 68,
    responseRate: '100% within 1h',
    minOrderValue: 25000,
    description: 'Vast manufacturing house based in Gujarat, specializing in professional hair color systems, micro-pigments, and bio-fermented skincare solutions.',
    email: 'wholesale@shreerambeauty.in',
    phone: '+91 79 2658 4410',
    whatsapp: '+919925012345',
    establishedYear: 2015,
    coverImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
    sampleImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuACGmKxH3sKXQzfZ0ok5I09A_2UZ5Lk-zeaa_4Xt6mSPDZDL1IIZA2tVmblc0QziC47pQfp-5Wk6BBt42duT67QeBqYZkN6UH6HkVEU1iqTWHgMbCSUnsvb1PvD9o6hW_C1ySvLZ_q-7F2xmSh4Hn7gBVNzLuNTcqufs4ML63tl-Ng1UqB9kTB8g3uuBZvYf2yAOh8efzkvt74XQrLNEMOurN9E_4tW-0W_K5wpWHASxqrA6QQOfNH1',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCNZWlxo1GE3RfXkL38ez9qU0PUaR7lM3gFLgHj5X30C7AnefXJPRYe2XMQqGRC7kE4z1Ktw4Jz9S_xpPzIMskSLPI-FbsfkH_mUOuZZidEIttsWlQ0Coo_R_tTmGPebKfznKeY_IPlVFQ16VrVlkTKasvjuTQY8Jd6Bq0yu2WpICmzZWm8IeXqxKd0DFZWWWVDR-trwOaAQD98vBxOIhHXcEUtC_R0Amcxb44DE-fqXreE85PhKhjK'
    ]
  },
  {
    id: 'td-dubai',
    initials: 'JH',
    name: 'Jaipur Luxury Beauty Hub',
    type: 'Wholesaler',
    businessTypeDetail: 'Wholesaler & Importer',
    location: 'Jaipur',
    region: 'Jaipur',
    verified: true,
    isFree: false,
    tags: ['Spa', 'Massage', 'Furniture'],
    rating: 4.9,
    reviewsCount: 116,
    productCount: 42,
    responseRate: '97% within 3h',
    minOrderValue: 30000,
    description: 'Bespoke wellness equipment, ayurvedic copper elements, and luxury massage beds designed specifically for premium Indian spas and aesthetic clinics.',
    email: 'info@jaipurbeautyhub.in',
    phone: '+91 141 382 9100',
    whatsapp: '+919829012345',
    establishedYear: 2016,
    coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    sampleImages: [
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBbJYm_SslFIku_82qLmRuk2k5zRvHZT8jce4mbMPDB-6-eB2ZZADEa8Z3fGAio0r-DI21vhJ1Mr_sndv1k6s18xexTuSiABEazFXa5yyXvh2nw9_0WqY-Z2BhWQ4LqO9JaZFxU8ERfPENI3Ajv5Cqh2UvAhHiDrKTp-qpqKryod_fnKK0f7bs2W8BMyOH87d0FN0e1IrvDAtynBYt3sUh2OSA8GMJ7ILRVo-517al6IOaan8oAJINt'
    ]
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-dryer-x2',
    name: 'Ionic Salon Dryer X2',
    brand: 'AEROPRO',
    category: 'tools',
    categoryLabel: 'Tools',
    tag: 'Tools',
    isVerified: false,
    isWholesale: true,
    price: 12500,
    unit: 'unit',
    moq: 10,
    stockStatus: 'In Stock',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbJYm_SslFIku_82qLmRuk2k5zRvHZT8jce4mbMPDB-6-eB2ZZADEa8Z3fGAio0r-DI21vhJ1Mr_sndv1k6s18xexTuSiABEazFXa5yyXvh2nw9_0WqY-Z2BhWQ4LqO9JaZFxU8ERfPENI3Ajv5Cqh2UvAhHiDrKTp-qpqKryod_fnKK0f7bs2W8BMyOH87d0FN0e1IrvDAtynBYt3sUh2OSA8GMJ7ILRVo-517al6IOaan8oAJINt',
    gallery: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBbJYm_SslFIku_82qLmRuk2k5zRvHZT8jce4mbMPDB-6-eB2ZZADEa8Z3fGAio0r-DI21vhJ1Mr_sndv1k6s18xexTuSiABEazFXa5yyXvh2nw9_0WqY-Z2BhWQ4LqO9JaZFxU8ERfPENI3Ajv5Cqh2UvAhHiDrKTp-qpqKryod_fnKK0f7bs2W8BMyOH87d0FN0e1IrvDAtynBYt3sUh2OSA8GMJ7ILRVo-517al6IOaan8oAJINt',
      'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Commercial brushless motor hair dryer engineered for back-to-back 12-hour salon shifts. Generates 110,000 RPM with negative ion saturation to cut blowout time by 45% while preserving cuticle moisture.',
    specifications: {
      'Motor': '110,000 RPM Brushless BLDC',
      'Power': '2200W Dual Voltage',
      'Weight': '390 grams ultralight',
      'Warranty': '3 Years Commercial Salon Replacement',
      'Noise Level': '< 68 dB Whisper Silent'
    },
    leadTimeDays: 3,
    certifications: ['BIS Certified', 'CE Certified', 'RoHS Compliance'],
    supplierId: 'le-dist',
    supplierName: 'Mumbai Beauty Imports',
    supplierLocation: 'Mumbai',
    rating: 4.8,
    reviewsCount: 64,
    wholesaleTiers: [
      { minUnits: 10, pricePerUnit: 12500 },
      { minUnits: 25, pricePerUnit: 11500 },
      { minUnits: 50, pricePerUnit: 10500 },
      { minUnits: 100, pricePerUnit: 8999 }
    ]
  },
  {
    id: 'prod-peptide-cream',
    name: 'Peptide Rich Formula Cream',
    brand: 'DERMAGLOW',
    category: 'skincare',
    categoryLabel: 'Skincare',
    tag: 'Skincare',
    isVerified: true,
    isWholesale: true,
    price: 2450,
    unit: 'unit',
    moq: 50,
    stockStatus: 'In Stock',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfreDlJ-MCj8fxVa3-PVT_YUiuBzlJRN5KNdyZlHZOXW3AmSHzgvWBqTbw3h-HssFukxf6rkndCzlkk0h5o6lmU6qr52z0r-W2Z_p3EdRT9dhis9nxhiCboXqJFw1krftGK-fWhAw5vidF0WEItAU16yUPhOArPd8ANmOcQhyw0LFCLaFzssHKPwIrBQyl6JbKPrqG3Gh2SQNNu5KT6VclKd4OG4KjqONnQ1hq1Bd3lk9pQxJlGdfa',
    gallery: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCfreDlJ-MCj8fxVa3-PVT_YUiuBzlJRN5KNdyZlHZOXW3AmSHzgvWBqTbw3h-HssFukxf6rkndCzlkk0h5o6lmU6qr52z0r-W2Z_p3EdRT9dhis9nxhiCboXqJFw1krftGK-fWhAw5vidF0WEItAU16yUPhOArPd8ANmOcQhyw0LFCLaFzssHKPwIrBQyl6JbKPrqG3Gh2SQNNu5KT6VclKd4OG4KjqONnQ1hq1Bd3lk9pQxJlGdfa',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Clinical grade anti-aging peptide concentrate with 6 bioactive oligopeptides, micro-encapsulated niacinamide, and marine collagen. Delivered in airtight rose gold frosted glass jars suitable for medi-spa retail or facial protocol integration.',
    specifications: {
      'Volume': '50ml / 1.7 fl. oz.',
      'Active Ingredients': 'Hexapeptide-8, Matrixyl 3000, 5% Niacinamide',
      'Skin Type': 'Mature, Sensitive, Post-Laser',
      'Formulation': 'Dermatologist Tested, Fragrance-Free',
      'Packaging': 'Recyclable Frosted Glass & Rose Gold Lid'
    },
    leadTimeDays: 5,
    certifications: ['GMP Certified', 'FDA Registered Facility', 'Cruelty-Free'],
    supplierId: 'gg-supply',
    supplierName: 'Royal Glamour India Supplies',
    supplierLocation: 'Pune',
    rating: 4.9,
    reviewsCount: 128,
    wholesaleTiers: [
      { minUnits: 50, pricePerUnit: 2450 },
      { minUnits: 150, pricePerUnit: 2100 },
      { minUnits: 500, pricePerUnit: 1750 },
      { minUnits: 1000, pricePerUnit: 1400 }
    ]
  },
  {
    id: 'prod-brush-set',
    name: 'Pro Master Brush Set',
    brand: 'ARTISTRY',
    category: 'makeup',
    categoryLabel: 'Accessories',
    tag: 'Accessories',
    isVerified: false,
    isWholesale: true,
    price: 3850,
    unit: 'set',
    moq: 20,
    stockStatus: 'Low Stock',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAPJ7s1Is9p6ROSFxD5QwYLNnpW9zcd7gy4jUolnRl1hxcYyli05KabmouymmrhiaMqkHhiX8N-uPKzn7RKWae5_0c6jAqAm6VKscmUk3lIzA2r-XL28SLfq6U_gtGZGR0CA025LykCoeXpGU4iFGEkHl997C9ihvofSl9PNUyFQPBx_UABqeb9p25GNpb9nctP-IRJpS2zK7KJ-AMQxCo3K_7YMWMGDOnLIFws66zN1my6EnpmrFi',
    gallery: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAAPJ7s1Is9p6ROSFxD5QwYLNnpW9zcd7gy4jUolnRl1hxcYyli05KabmouymmrhiaMqkHhiX8N-uPKzn7RKWae5_0c6jAqAm6VKscmUk3lIzA2r-XL28SLfq6U_gtGZGR0CA025LykCoeXpGU4iFGEkHl997C9ihvofSl9PNUyFQPBx_UABqeb9p25GNpb9nctP-IRJpS2zK7KJ-AMQxCo3K_7YMWMGDOnLIFws66zN1my6EnpmrFi',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=80'
    ],
    description: '18-piece master artistry makeup brush kit featuring dual-density antimicrobial synthetic nanofiber bristles, weighted natural birchwood handles, and rose gold brass ferrules. Includes travel roll case.',
    specifications: {
      'Piece Count': '18 Brushes + Leatherette Roll Case',
      'Bristle Tech': 'SilkNanofiber 2.0 (100% Vegan)',
      'Handles': 'Ergonomic FSC Birchwood with Matte Finish',
      'Ferrules': 'Seamless Double-Crimped Brass'
    },
    leadTimeDays: 4,
    certifications: ['Vegan Certified', 'PETA Approved', 'ISO 9001'],
    supplierId: 'gg-supply',
    supplierName: 'Royal Glamour India Supplies',
    supplierLocation: 'Pune',
    rating: 4.7,
    reviewsCount: 45,
    wholesaleTiers: [
      { minUnits: 20, pricePerUnit: 3850 },
      { minUnits: 50, pricePerUnit: 3200 },
      { minUnits: 100, pricePerUnit: 2750 }
    ]
  },
  {
    id: 'prod-gold-ampoules',
    name: '24K Bio-Collagen Cellular Ampoules',
    brand: 'NEXORA LABS',
    category: 'skincare',
    categoryLabel: 'Skincare',
    tag: 'Skincare',
    isVerified: true,
    isWholesale: true,
    price: 5500,
    unit: 'box (10x5ml)',
    moq: 15,
    stockStatus: 'In Stock',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Ultra-concentrated cellular infusion with 99.9% pure cosmetic 24K gold flakes, low-molecular weight hyaluronic acid, and stem cell ferment for instant red-carpet lifting.',
    specifications: {
      'Concentration': '99.9% Pure Gold Flakes + 4% Bio-Placenta',
      'Packaging': '10 sterile vacuum-sealed glass ampoules with dropper',
      'Origin': 'Formulated with luxury ingredients'
    },
    leadTimeDays: 2,
    certifications: ['ISO 22716', 'Ecocert', 'Dermatest 5-Star'],
    supplierId: 'le-dist',
    supplierName: 'Mumbai Beauty Imports',
    supplierLocation: 'Mumbai',
    rating: 5.0,
    reviewsCount: 82,
    wholesaleTiers: [
      { minUnits: 15, pricePerUnit: 5500 },
      { minUnits: 40, pricePerUnit: 4600 },
      { minUnits: 100, pricePerUnit: 3950 }
    ]
  },
  {
    id: 'prod-hair-color-palette',
    name: 'Chromatic Lumina Micro-Pigment Dye Kit',
    brand: 'MILANO PRO',
    category: 'haircolor',
    categoryLabel: 'Hair Color',
    tag: 'Hair Color',
    isVerified: true,
    isWholesale: true,
    price: 750,
    unit: 'tube (100ml)',
    moq: 60,
    stockStatus: 'In Stock',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Italian formulation with cold-pressed argan oil and quinoa protein. 100% grey coverage with 64 intermixable shades and 30-wash fade resistance.',
    specifications: {
      'Shades': '64 Palette Nuances',
      'Ammonia Level': '0.0% Zero Ammonia Formula',
      'Size': '100ml / 3.4 fl oz per tube'
    },
    leadTimeDays: 4,
    certifications: ['Cosmetics Compliant', 'Eco-Certified Extracts'],
    supplierId: 'mc-milano',
    supplierName: 'Shree Ram Beauty Supplies',
    supplierLocation: 'Jaipur',
    rating: 4.9,
    reviewsCount: 110,
    wholesaleTiers: [
      { minUnits: 60, pricePerUnit: 750 },
      { minUnits: 200, pricePerUnit: 620 },
      { minUnits: 500, pricePerUnit: 520 }
    ]
  },
  {
    id: 'prod-spa-bed',
    name: 'Hydraulic Cloud Spa Treatment Bed',
    brand: 'AURA LUXE',
    category: 'furniture',
    categoryLabel: 'Salon Furniture',
    tag: 'Furniture',
    isVerified: true,
    isWholesale: true,
    price: 76500,
    unit: 'unit',
    moq: 2,
    stockStatus: 'Made to Order',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Triple-motor whisper-quiet medical massage and facial recliner with built-in heated memory foam mattress and antimicrobial premium PU leather.',
    specifications: {
      'Motors': '3 Precision Actuators',
      'Weight Capacity': '320 kg (700 lbs)',
      'Dimensions': '195cm x 75cm x 60-90cm adjustable',
      'Upholstery': 'Hospital-grade PU leather, stain resistant'
    },
    leadTimeDays: 14,
    certifications: ['Medical Grade', 'ISO 13485'],
    supplierId: 'td-dubai',
    supplierName: 'Jaipur Luxury Beauty Hub',
    supplierLocation: 'Jaipur',
    rating: 4.9,
    reviewsCount: 38,
    wholesaleTiers: [
      { minUnits: 2, pricePerUnit: 76500 },
      { minUnits: 5, pricePerUnit: 67000 },
      { minUnits: 10, pricePerUnit: 59000 }
    ]
  },
  {
    id: 'prod-hyaluronic-serum',
    name: 'Multi-Molecular Barrier Repair Serum',
    brand: 'NEXORA LABS',
    category: 'skincare',
    categoryLabel: 'Skincare',
    tag: 'Skincare',
    isVerified: true,
    isWholesale: true,
    price: 2950,
    unit: 'bottle (30ml)',
    moq: 30,
    stockStatus: 'In Stock',
    image: 'https://images.unsplash.com/photo-1608248597358-752ba75fa05c?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1608248597358-752ba75fa05c?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Triple-weight hyaluronic acid serum enriched with ceramides NP/AP/EOP and Centella Asiatica for intensive epidermal hydration and barrier restoration.',
    specifications: {
      'Volume': '30ml / 1.0 fl. oz.',
      'Active Ingredients': '5 Hyaluronic Weights, Ceramide Complex (1%), Centella 3%',
      'Skin Type': 'All Skin Types, Dehydrated, Post-Peel',
      'Formulation': 'Oil-Free, Non-Comedogenic, Vegan',
      'Packaging': 'UV-Protective Amber Dropper Bottle'
    },
    leadTimeDays: 3,
    certifications: ['GMP Certified', 'Cruelty-Free', 'Ecocert', 'ISO 22716'],
    supplierId: 'le-dist',
    supplierName: 'Mumbai Beauty Imports',
    supplierLocation: 'Mumbai',
    rating: 4.8,
    reviewsCount: 94,
    wholesaleTiers: [
      { minUnits: 30, pricePerUnit: 2950 },
      { minUnits: 100, pricePerUnit: 2500 },
      { minUnits: 300, pricePerUnit: 1999 }
    ]
  },
  {
    id: 'prod-sonic-infusion',
    name: 'Cryo-Thermal Infusion Pro Wand',
    brand: 'AEROPRO',
    category: 'tools',
    categoryLabel: 'Tools',
    tag: 'Tools',
    isVerified: true,
    isWholesale: true,
    price: 16500,
    unit: 'unit',
    moq: 5,
    stockStatus: 'In Stock',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80'
    ],
    description: 'Dual-mode hot & cold sonic micro-infusion device for professional estheticians. Enhances serum penetration up to 8x with 42°C heating and 6°C cryo-firming.',
    specifications: {
      'Motor': '12,000 VPM Micro-Sonic Vibration',
      'Power': 'Rechargeable Li-Ion 2500mAh (Wireless)',
      'Weight': '210 grams ultra-portable',
      'Warranty': '2 Years Commercial Replacement',
      'Noise Level': '< 45 dB Ultra Quiet'
    },
    leadTimeDays: 3,
    certifications: ['CE Certified', 'FDA Cleared Class I', 'RoHS Compliance'],
    supplierId: 'le-dist',
    supplierName: 'Mumbai Beauty Imports',
    supplierLocation: 'Mumbai',
    rating: 4.9,
    reviewsCount: 52,
    wholesaleTiers: [
      { minUnits: 5, pricePerUnit: 16500 },
      { minUnits: 15, pricePerUnit: 14200 },
      { minUnits: 50, pricePerUnit: 12300 }
    ]
  }
];

export const CITIES = [
  'All Locations',
  'Jaipur',
  'Delhi',
  'Mumbai',
  'Kolkata',
  'Chennai',
  'Bengaluru',
  'Pune'
];

export const MOCK_PRODUCTS = PRODUCTS;
export const MOCK_PARTNERS = SUPPLIERS;

export const MOCK_VIDEO_TESTIMONIALS: import('../types').VideoTestimonial[] = [
  {
    id: 'vid-1',
    title: 'Ionic Salon Dryer X2 Backbar Stress Test & Cuticle Scan',
    distributorId: 'le-dist',
    distributorName: 'Mumbai Beauty Imports',
    distributorLocation: 'Mumbai',
    distributorInitials: 'MB',
    distributorVerified: true,
    speakerName: 'Jean-Luc Moreau',
    speakerRole: 'Artistic Director & Master Stylist',
    salonOrBusiness: 'Mumbai Beauty Imports Hub',
    thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '02:45',
    viewsCount: 1420,
    likesCount: 284,
    rating: 5.0,
    featuredProductId: 'prod-dryer-x2',
    featuredProductName: 'Ionic Salon Dryer X2',
    featuredProductImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbJYm_SslFIku_82qLmRuk2k5zRvHZT8jce4mbMPDB-6-eB2ZZADEa8Z3fGAio0r-DI21vhJ1Mr_sndv1k6s18xexTuSiABEazFXa5yyXvh2nw9_0WqY-Z2BhWQ4LqO9JaZFxU8ERfPENI3Ajv5Cqh2UvAhHiDrKTp-qpqKryod_fnKK0f7bs2W8BMyOH87d0FN0e1IrvDAtynBYt3sUh2OSA8GMJ7ILRVo-517al6IOaan8oAJINt',
    featuredProductPrice: 12500,
    featuredProductMoq: 10,
    category: 'Haircare & Tools',
    tags: ['Blowout Speed', 'Zero Heat Damage', 'Backbar Tested'],
    keyHighlight: 'Reduces blowout turnaround by 45% while keeping high gloss reflection.',
    quote: 'We run 16 chairs for 10 hours daily. The X2 has never overheated once, and client retention on keratin blowouts jumped 32%.',
    date: 'August 2026'
  },
  {
    id: 'vid-2',
    title: 'Hyaluronic Micro-Serum Molecular Penetration Lab Demo',
    distributorId: 'mc-milano',
    distributorName: 'Shree Ram Beauty Supplies',
    distributorLocation: 'Jaipur',
    distributorInitials: 'SR',
    distributorVerified: true,
    speakerName: 'Dr. Alessandra Conti',
    speakerRole: 'Lead Formulation Chemist & R&D Head',
    salonOrBusiness: 'Jaipur Dermocosmetic Laboratories',
    thumbnail: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '03:15',
    viewsCount: 2310,
    likesCount: 419,
    rating: 4.9,
    featuredProductId: 'prod-serum-ha',
    featuredProductName: 'Hyaluronic Multi-Molecular Serum',
    featuredProductImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACGmKxH3sKXQzfZ0ok5I09A_2UZ5Lk-zeaa_4Xt6mSPDZDL1IIZA2tVmblc0QziC47pQfp-5Wk6BBt42duT67QeBqYZkN6UH6HkVEU1iqTWHgMbCSUnsvb1PvD9o6hW_C1ySvLZ_q-7F2xmSh4Hn7gBVNzLuNTcqufs4ML63tl-Ng1UqB9kTB8g3uuBZvYf2yAOh8efzkvt74XQrLNEMOurN9E_4tW-0W_K5wpWHASxqrA6QQOfNH1',
    featuredProductPrice: 2950,
    featuredProductMoq: 30,
    category: 'Skincare',
    tags: ['Triple Molecular HA', 'Derm Grade', 'Instant Plumping'],
    keyHighlight: 'Clinical trans-epidermal hydration increase of +84% within 15 minutes of application.',
    quote: 'Our partner clinics rely on this formulation post-laser and for pre-event luxury hydra-facials without any tacky residue.',
    date: 'July 2026'
  },
  {
    id: 'vid-3',
    title: '24K Gold Ritual & Diamond Peptide Infusion in 5-Star Resort Spa',
    distributorId: 'td-dubai',
    distributorName: 'Jaipur Luxury Beauty Hub',
    distributorLocation: 'Jaipur',
    distributorInitials: 'JH',
    distributorVerified: true,
    speakerName: 'Rashid Al-Mansoor',
    speakerRole: 'Regional Distribution Director',
    salonOrBusiness: 'The Royal Mirage Aesthetic Suite',
    thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '02:10',
    viewsCount: 1890,
    likesCount: 365,
    rating: 5.0,
    featuredProductId: 'prod-dryer-x2',
    featuredProductName: '24K Gold Cellular Rejuvenation Mask',
    featuredProductImage: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1000&q=80',
    featuredProductPrice: 5500,
    featuredProductMoq: 15,
    category: 'Spa & Wellness',
    tags: ['24K Bio-Gold', 'Luxury Spa Ritual', 'High Margin'],
    keyHighlight: 'Ultra-exclusive treatment protocol generating 4.2x average spa service ticket boost.',
    quote: 'Distributing this luxury line to over 40 luxury resorts across India has transformed our partners VIP menu offerings.',
    date: 'June 2026'
  },
  {
    id: 'vid-4',
    title: 'Sonic Micro-Infusion Device: In-Cabin Clinical Efficiency',
    distributorId: 'gg-supply',
    distributorName: 'Royal Glamour India Supplies',
    distributorLocation: 'Pune',
    distributorInitials: 'RG',
    distributorVerified: true,
    speakerName: 'Elena Rostova',
    speakerRole: 'Chief Esthetician & Product Evangelist',
    salonOrBusiness: 'Pune Glow MediSpa',
    thumbnail: 'https://images.unsplash.com/photo-1512290900672-1f02e71edcf8?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '01:55',
    viewsCount: 980,
    likesCount: 215,
    rating: 4.8,
    featuredProductId: 'prod-dryer-x2',
    featuredProductName: 'Sonic Micro-Infusion Wand',
    featuredProductImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    featuredProductPrice: 16500,
    featuredProductMoq: 5,
    category: 'Salon Tools & Eq.',
    tags: ['Cryo-Firming', 'Sonic Vibration', 'Esthetician Favorite'],
    keyHighlight: 'Thermal 42°C heating opens micro-channels, followed by instant 6°C cryo-locking.',
    quote: 'Our salon clients feel an immediate tightening sensation. Estheticians love the wireless freedom and 2-year warranty.',
    date: 'August 2026'
  },
  {
    id: 'vid-5',
    title: 'Glacial Silt Scalp Treatment Line Unboxing & Application',
    distributorId: 'pb-imports',
    distributorName: 'South India Salon Depot',
    distributorLocation: 'Chennai',
    distributorInitials: 'SI',
    distributorVerified: false,
    speakerName: 'Marcus Thorne',
    speakerRole: 'Wholesale Account Director',
    salonOrBusiness: 'Soho Botanical Hair Lounge',
    thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '02:30',
    viewsCount: 750,
    likesCount: 142,
    rating: 4.7,
    featuredProductId: 'prod-serum-ha',
    featuredProductName: 'Glacial Mineral Scalp Detox Mask',
    featuredProductImage: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=1000&q=80',
    featuredProductPrice: 2450,
    featuredProductMoq: 20,
    category: 'Haircare & Spa',
    tags: ['Glacial Silt', 'Scalp Health', 'Eco-Certified'],
    keyHighlight: '100% pure unrefined glacial silt rich in 60+ trace minerals for follicle rejuvenation.',
    quote: 'Eco-conscious salons across South India have made this their #1 scalp therapy upgrade for high-end clientele.',
    date: 'May 2026'
  }
];

export const DEFAULT_USER = {
  id: 'usr-101',
  name: 'Ananya Sharma',
  email: 'ananya@royalglamour.in',
  companyName: 'Jaipur Luxury Beauty Hub',
  role: 'buyer' as const,
  city: 'Jaipur',
  isVerified: true
};
