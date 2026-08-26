import { ProductDetailData } from '../types';
import { SPONSORED_PRODUCTS_DB } from './sponsoredProductsData';

export interface SellerProfileData {
  id: string;
  alternateIds: string[];
  name: string;
  legalName: string;
  shortCode: string;
  logoUrl: string;
  bannerUrl: string;
  businessType: string; // 'Verified Manufacturer', 'OEM / Contract Manufacturer', 'Wholesaler & Stockist', 'Packaging Manufacturer', etc.
  city: string;
  state: string;
  pincode: string;
  industrialZone: string;
  fullAddress: string;
  establishedYear: string;
  employeeCount: string;
  gstin: string;
  
  // Trust & Ratings
  isGstVerified: boolean;
  isNexoraVerified: boolean;
  trustTier: 'Gold' | 'Silver' | 'Platinum';
  trustScore: number;
  overallRating: number;
  totalReviewsCount: number;
  responseSla: string;
  responseRate: string;
  ordersFulfilled: string;
  minOrderValue: string;
  
  // Certifications
  certifications: string[];
  
  // Infrastructure & Story
  aboutStory: string;
  cleanroomCapacity: string;
  facilityArea: string;
  monthlyProductionCapacity: string;
  
  // OEM / Private Label
  oemCapabilityOverview: string;
  packagingOptions: string[];
  formulationTypes: string[];
  sampleLeadTime: string;
  samplePriceText: string;
  
  // Contact
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
}

export const SELLER_PROFILES_DB: Record<string, SellerProfileData> = {
  'seller_aura_001': {
    id: 'seller_aura_001',
    alternateIds: ['sup-1', 'ss-1', 'Aura Beauty Labs'],
    name: 'Aura Beauty Labs',
    legalName: 'Aura Beauty Formulations & Manufacturing Pvt. Ltd.',
    shortCode: 'ABL',
    logoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?auto=format&fit=crop&w=1600&q=80',
    businessType: 'Verified Manufacturer & OEM',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '410208',
    industrialZone: 'MIDC Taloja Special Chemical & Cosmetic Zone',
    fullAddress: 'Plot C-14, Sector 19, MIDC Taloja Industrial Area, Navi Mumbai, MH 410208',
    establishedYear: '2014 (12 Yrs)',
    employeeCount: '180+ Full-Time Specialists',
    gstin: '27AABCU9601R1ZM',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Platinum',
    trustScore: 98,
    overallRating: 4.9,
    totalReviewsCount: 184,
    responseSla: '< 1 hr',
    responseRate: '98% Response Rate',
    ordersFulfilled: '2,850+ B2B Shipments',
    minOrderValue: '₹25,000',
    certifications: ['WHO-GMP Certified', 'ISO 22716:2007', 'US-FDA MoCRA Reg.', 'AYUSH Approved', 'ISO 9001:2015'],
    aboutStory: 'Aura Beauty Labs is a premier WHO-GMP certified formulation research and manufacturing enterprise located in MIDC Taloja, Navi Mumbai. We specialize in high-efficacy cosmeceutical serums, barrier repair creams, and trichological scalp therapies. Equipped with 32,000 sq.ft Class 10,000 cleanroom lines and automated aseptic high-speed filling machinery.',
    cleanroomCapacity: 'Class 10,000 (ISO 7) HEPA-filtered Cleanroom lines',
    facilityArea: '32,000 sq.ft WHO-GMP Facility',
    monthlyProductionCapacity: '150,000 Serum Units / Month',
    oemCapabilityOverview: 'Complete end-to-end turn-key private labeling for dermatologist brands and salon chains. We offer over 120+ benchmarked stock formulations ready for immediate customization.',
    packagingOptions: ['UV Amber Glass Droppers (30ml/50ml)', 'Airless Vacuum Pump Bottles', 'Heavy-Bottom Acrylic Jars', 'Eco Aluminium Tubes'],
    formulationTypes: ['Stabilized Vitamin C Actives', 'Multi-Peptide Matrix', 'Ceramide Barrier Complex', 'Redensyl Scalp Tonics'],
    sampleLeadTime: '1 - 2 Days Dispatch',
    samplePriceText: '₹500 / Lab Sample Box (Refundable on Bulk Order)',
    phone: '+91 98201 55443',
    whatsapp: '919820155443',
    email: 'b2b@aurabeautylabs.in',
    website: 'https://aurabeautylabs.in'
  },
  'seller_luxe_002': {
    id: 'seller_luxe_002',
    alternateIds: ['sup-2', 'ss-2', 'seller_luxeform_003', 'LuxeForm Cosmetics', 'LuxeCosmetics Mfg.', 'LuxeForm Cosmetic Packaging Ltd.', 'LuxeForm Packaging'],
    name: 'LuxeForm Cosmetics',
    legalName: 'LuxeForm Cosmeceuticals & Labs Pvt. Ltd.',
    shortCode: 'LFC',
    logoUrl: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1600&q=80',
    businessType: 'OEM / Contract Manufacturer',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382213',
    industrialZone: 'Changodar GIDC Cosmetic Hub',
    fullAddress: 'Plot 112, Changodar Industrial Estate, GIDC Phase II, Ahmedabad, GJ 382213',
    establishedYear: '2012 (14 Yrs)',
    employeeCount: '220+ Workers & Chemists',
    gstin: '24AABCL8841P1ZN',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Gold',
    trustScore: 97,
    overallRating: 4.8,
    totalReviewsCount: 142,
    responseSla: '< 1 hr',
    responseRate: '96% Response Rate',
    ordersFulfilled: '1,920+ Shipments',
    minOrderValue: '₹30,000',
    certifications: ['ISO 22716 GMP', 'ISO 9001:2015', 'Cruelty-Free Certified', 'ECOCERT Compliant'],
    aboutStory: 'LuxeForm Cosmetics is an established contract manufacturing hub in Ahmedabad with dedicated cleanrooms for emulsion bases, facial moisturizers, and sunscreens. We engineer custom formulations for D2C brands, export distributors, and retail chains.',
    cleanroomCapacity: 'ISO Class 8 Emulsification Cleanrooms',
    facilityArea: '45,000 sq.ft Manufacturing Plant',
    monthlyProductionCapacity: '200,000 Jars & Bottles / Month',
    oemCapabilityOverview: 'Full-spectrum OEM contract manufacturing with custom viscosity testing, fragrance matching, and stability testing across temperature extremes.',
    packagingOptions: ['Double-Wall Frosted Jars (50g)', 'Soft Touch Squeeze Tubes', 'Airless Lotion Dispensers'],
    formulationTypes: ['Ceramide Barrier Hydration Creams', 'Peptide Matrix Smoothers', 'Broad Spectrum SPF 50 Fluids'],
    sampleLeadTime: '2 Days Dispatch',
    samplePriceText: '₹400 / Sample Kit',
    phone: '+91 98790 44556',
    whatsapp: '919879044556',
    email: 'b2b@luxeform.co.in',
    website: 'https://luxeformcosmetics.in'
  },
  'seller_derma_003': {
    id: 'seller_derma_003',
    alternateIds: ['sup-3', 'ss-3', 'seller_dermaglow_002', 'Dermaglow India', 'Dermaglow India Cosmeceuticals'],
    name: 'Dermaglow India',
    legalName: 'Dermaglow Healthcare & Beauty Wholesale Pvt. Ltd.',
    shortCode: 'DGI',
    logoUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80',
    businessType: 'Wholesaler & Stockist',
    city: 'Delhi NCR',
    state: 'Delhi',
    pincode: '122051',
    industrialZone: 'IMT Manesar Cleanroom Zone',
    fullAddress: 'Plot 88, Sector 6, IMT Manesar, Gurugram, Delhi NCR 122051',
    establishedYear: '2017 (9 Yrs)',
    employeeCount: '95 Staff Members',
    gstin: '07AABCD4412Q1ZX',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Gold',
    trustScore: 96,
    overallRating: 4.8,
    totalReviewsCount: 118,
    responseSla: '< 1 hr',
    responseRate: '95% Response Rate',
    ordersFulfilled: '1,450+ Orders',
    minOrderValue: '₹30,000',
    certifications: ['Halal Certified', 'AYUSH Approved', 'ISO 14001', 'Dermatologist Tested'],
    aboutStory: 'Dermaglow India is a leading national supplier and master stockist of salon spa therapy kits, clinical dermaceutical actives, and barrier repair lines. We serve over 1,200+ salon chains and medical aesthetic clinics across Northern and Western India.',
    cleanroomCapacity: 'Temperature-Controlled Central Logistics Depot',
    facilityArea: '50,000 sq.ft Warehouse & Lab',
    monthlyProductionCapacity: '50,000 Salon Kits / Month',
    oemCapabilityOverview: 'Bulk stock supply and custom kitting for chain salons, luxury spa franchises, and dermatological clinics.',
    packagingOptions: ['Multi-Step Salon Kit Box Sets', 'Bulk 1L Pump Dispensers', 'Amber Glass Vials'],
    formulationTypes: ['Nano-Keratin Intensive Hair Spa', 'Clinical Peeling Bases', 'Collagen Hydration Seals'],
    sampleLeadTime: '1 Day Dispatch',
    samplePriceText: '₹600 / Full Demo Kit',
    phone: '+91 98110 33221',
    whatsapp: '919811033221',
    email: 'orders@dermaglow.in',
    website: 'https://dermaglowindia.com'
  },
  'seller_pure_004': {
    id: 'seller_pure_004',
    alternateIds: ['sup-4', 'ss-4', 'seller_pureessence_005', 'PureFormulations Pvt', 'PureFormulations Pvt.', 'PureEssence Distillers & Oils'],
    name: 'PureFormulations Pvt',
    legalName: 'PureFormulations Chemical & Cosmetic Actives Ltd.',
    shortCode: 'PFP',
    logoUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=1600&q=80',
    businessType: 'Raw Material & Active Producer',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411013',
    industrialZone: 'Hadampsar Industrial Estate Phase II',
    fullAddress: 'Plot A-12, Hadapsar Industrial Area, Pune, MH 411013',
    establishedYear: '2011 (15 Yrs)',
    employeeCount: '130 Engineers & Chemist Team',
    gstin: '27AABCP7720M1ZK',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Silver',
    trustScore: 95,
    overallRating: 4.7,
    totalReviewsCount: 96,
    responseSla: '< 2 hrs',
    responseRate: '96% Response Rate',
    ordersFulfilled: '1,120+ Batches',
    minOrderValue: '₹20,000',
    certifications: ['FDA Approved Pigments', 'ECOCERT Organic', 'ISO 9001:2015'],
    aboutStory: 'PureFormulations specializes in synthesis of color cosmetic bases, pigment dispersants, matte lip color vehicle bases, and organic cold-pressed oil extracts.',
    cleanroomCapacity: 'Chemical Reactor & Blending Cleanroom',
    facilityArea: '28,000 sq.ft Processing Facility',
    monthlyProductionCapacity: '25,000 kg Bulk Pigment Base / Month',
    oemCapabilityOverview: 'Custom color shade matching, pigment dispersion stability, and bulk drum supply for color cosmetic manufacturers.',
    packagingOptions: ['Stainless Steel Sealed Drums (10kg/25kg)', 'High-Density Fluorinated Containers'],
    formulationTypes: ['Transfer-Proof Liquid Lip Base', 'Silicone Elastomer Gels', 'Cold-Pressed Botanical Bases'],
    sampleLeadTime: '2 Days Dispatch',
    samplePriceText: '₹350 / Shade Sample Swatch',
    phone: '+91 98220 77889',
    whatsapp: '919822077889',
    email: 'tech@pureformulations.in',
    website: 'https://pureformulations.in'
  },
  'seller_biotech_005': {
    id: 'seller_biotech_005',
    alternateIds: ['sup-5', 'ss-5', 'seller_novapharma_007', 'BioTech Derma Labs', 'NovaPharma Clinical Cosmeceuticals'],
    name: 'BioTech Derma Labs',
    legalName: 'BioTech Derma Laboratories India Pvt. Ltd.',
    shortCode: 'BDL',
    logoUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=80',
    businessType: 'Verified Manufacturer',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
    industrialZone: 'Sanand GIDC Bio-Pharma Zone',
    fullAddress: 'Plot B-45, Sanand GIDC Industrial Estate, Ahmedabad, GJ 380015',
    establishedYear: '2015 (11 Yrs)',
    employeeCount: '160+ Staff',
    gstin: '24AABCB3321R1ZP',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Platinum',
    trustScore: 98,
    overallRating: 4.9,
    totalReviewsCount: 165,
    responseSla: '< 1 hr',
    responseRate: '97% Response Rate',
    ordersFulfilled: '2,100+ Orders',
    minOrderValue: '₹25,000',
    certifications: ['AYUSH Approved', 'ISO 9001:2015', 'WHO-GMP Cleanroom', 'COA Batch Certified'],
    aboutStory: 'BioTech Derma Labs is a science-driven trichology and dermatological active manufacturer. Known for clinical Redensyl hair tonics, rosemary steam distillates, and anti-hairfall peptide complexes.',
    cleanroomCapacity: 'Sterile Processing Cleanrooms',
    facilityArea: '30,000 sq.ft Bio-Lab',
    monthlyProductionCapacity: '100,000 Bottles / Month',
    oemCapabilityOverview: 'Custom bio-active hair serums with verified active peptide percentages, trichological testing, and custom dropper packaging.',
    packagingOptions: ['UV Matte Black Glass Droppers', 'Scalp Applicator Bottles with Comb Nozzles'],
    formulationTypes: ['3% Redensyl + 2% Anagain Tonic', 'Biotin & Rosemary Scalp Elixir'],
    sampleLeadTime: '1 Day Dispatch',
    samplePriceText: '₹450 / Sample Bottle',
    phone: '+91 98791 22334',
    whatsapp: '919879122334',
    email: 'info@biotechderma.com',
    website: 'https://biotechderma.com'
  },
  'seller_cosmo_006': {
    id: 'seller_cosmo_006',
    alternateIds: ['sup-6', 'ss-6', 'CosmoTech Packaging', 'CosmoTech Industries'],
    name: 'CosmoTech Packaging',
    legalName: 'CosmoTech Cosmetic Packaging Solutions Pvt. Ltd.',
    shortCode: 'CTP',
    logoUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=1600&q=80',
    businessType: 'Packaging Manufacturer',
    city: 'Thane',
    state: 'Maharashtra',
    pincode: '400604',
    industrialZone: 'Wagle Industrial Estate Glass & Plastic Hub',
    fullAddress: 'Plot W-18, Wagle Industrial Estate, Thane West, MH 400604',
    establishedYear: '2010 (16 Yrs)',
    employeeCount: '280 Industrial Machine Operators',
    gstin: '27AABCC9902K1ZQ',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Platinum',
    trustScore: 99,
    overallRating: 4.9,
    totalReviewsCount: 210,
    responseSla: '< 30 mins',
    responseRate: '99% Response Rate',
    ordersFulfilled: '4,500+ Shipments',
    minOrderValue: '₹15,000',
    certifications: ['US-FDA Cosmetic Grade', 'RoHS Compliant', 'ISO 9001:2015 Quality QC'],
    aboutStory: 'CosmoTech Packaging is India’s premier manufacturer of high-precision pharmaceutical and cosmetic glassware, frosted amber dropper bottles, airless pump containers, and acrylic jars.',
    cleanroomCapacity: 'Dust-Free Automated Molding & Silk Printing Line',
    facilityArea: '60,000 sq.ft Manufacturing Facility',
    monthlyProductionCapacity: '500,000 Pcs / Month',
    oemCapabilityOverview: 'Custom bottle color spraying, frosted glass finishes, gold/silver hot-foil stamping, and automated screen printing.',
    packagingOptions: ['Frosted Amber Glass Droppers (15ml, 30ml, 50ml, 100ml)', 'Airless Acrylic Lotion Bottles', 'Aluminum Cosmetic Jars'],
    formulationTypes: ['Compatible with Essential Oils, Actives, Acids & Emulsions'],
    sampleLeadTime: '1 Day Dispatch',
    samplePriceText: 'Free Sample Box (3 Bottle Sizes Included)',
    phone: '+91 98205 88990',
    whatsapp: '919820588990',
    email: 'sales@cosmotechpack.in',
    website: 'https://cosmotechpack.in'
  },
  'seller_radiant_007': {
    id: 'seller_radiant_007',
    alternateIds: ['sup-7', 'ss-7', 'seller_radiant_004', 'Radiant Cosmeceuticals', 'Radiant Bulk Beauty Wholesale', 'Radiant Botanicals & Active Extracts'],
    name: 'Radiant Cosmeceuticals',
    legalName: 'Radiant Cosmeceuticals & Wholesale Labs Pvt. Ltd.',
    shortCode: 'RCL',
    logoUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1600&q=80',
    businessType: 'Private Label Manufacturer',
    city: 'Delhi NCR',
    state: 'Delhi',
    pincode: '110020',
    industrialZone: 'Okhla Phase III Cosmetic Hub',
    fullAddress: 'B-21, Okhla Industrial Area Phase III, New Delhi 110020',
    establishedYear: '2016 (10 Yrs)',
    employeeCount: '110 Staff',
    gstin: '07AABCR5519J1ZV',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Gold',
    trustScore: 96,
    overallRating: 4.8,
    totalReviewsCount: 140,
    responseSla: '< 1 hr',
    responseRate: '97% Response Rate',
    ordersFulfilled: '1,680+ Orders',
    minOrderValue: '₹20,000',
    certifications: ['ISO 22716 GMP', 'Dermatologist Tested', 'COA Batch Certified'],
    aboutStory: 'Radiant Cosmeceuticals formulates brighteners, 10% Niacinamide cleansers, cold-pressed argan oil bulk drums, and botanical face washes for D2C sellers and pharmacy brands.',
    cleanroomCapacity: 'Cleanroom Liquid Formulation & Mixing Unit',
    facilityArea: '25,000 sq.ft Production Facility',
    monthlyProductionCapacity: '80,000 Cleanser Units / Month',
    oemCapabilityOverview: 'Sulfates-free gel cleanser bases, customized pH balancing (pH 5.5), and custom scent/essential oil infusions.',
    packagingOptions: ['Airless Pump Bottles (150ml)', 'Clear PET Squeeze Bottles', 'Bulk 50L HDPE Carboys'],
    formulationTypes: ['10% Niacinamide + Zinc PCA Gel Cleanser', 'Salicylic Acid Acne Wash Base'],
    sampleLeadTime: '2 Days Dispatch',
    samplePriceText: '₹350 / Sample Unit',
    phone: '+91 98118 99887',
    whatsapp: '919811899887',
    email: 'contact@radiantcosmo.in',
    website: 'https://radiantcosmo.in'
  },
  'seller_velvet_008': {
    id: 'seller_velvet_008',
    alternateIds: ['sup-8', 'ss-8', 'VelvetTouch Botanical'],
    name: 'VelvetTouch Botanical',
    legalName: 'VelvetTouch Botanical Distillates Pvt. Ltd.',
    shortCode: 'VTB',
    logoUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=1600&q=80',
    businessType: 'Distiller & Wholesaler',
    city: 'Kannauj / Lucknow',
    state: 'Uttar Pradesh',
    pincode: '209725',
    industrialZone: 'Kannauj Traditional & Modern Distillation Park',
    fullAddress: 'Plot 4, Aroma & Essential Oil Complex, Kannauj Industrial Area, UP 209725',
    establishedYear: '2008 (18 Yrs)',
    employeeCount: '85 Traditional Master Distillers & Lab Techs',
    gstin: '09AABCV2210T1ZU',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Gold',
    trustScore: 95,
    overallRating: 4.8,
    totalReviewsCount: 105,
    responseSla: '< 2 hrs',
    responseRate: '94% Response Rate',
    ordersFulfilled: '1,320+ Bulk Drums Delivered',
    minOrderValue: '₹25,000',
    certifications: ['AYUSH License', 'ECOCERT Organic Compliant', 'ISO 9001 Quality'],
    aboutStory: 'VelvetTouch Botanical is a renowned steam distiller producing 100% pure Damask rose hydrosols, sandalwood distillates, vetiver extracts, and natural floral waters without artificial preservatives or synthetic alcohol.',
    cleanroomCapacity: 'Copper & Stainless Steel Steam Distillation Stills',
    facilityArea: '40,000 sq.ft Distillation Yard & Lab',
    monthlyProductionCapacity: '10,000 Liters / Month',
    oemCapabilityOverview: 'Bulk 50L/100L carboy supply, custom floral water blends, and private label spray bottle filling.',
    packagingOptions: ['Food-Grade 50L HDPE Carboys with Bung Seal', 'Fine-Mist Spray Bottles (100ml)'],
    formulationTypes: ['100% Pure Rosa Damascena Hydrosol', 'Pure Vetiver & Kewra Distillates'],
    sampleLeadTime: '1 Day Dispatch',
    samplePriceText: '₹300 / 500ml Sample Bottle',
    phone: '+91 98390 11223',
    whatsapp: '919839011223',
    email: 'sales@velvettouch.co.in',
    website: 'https://velvettouch.co.in'
  },
  'seller_apex_009': {
    id: 'seller_apex_009',
    alternateIds: ['sup-9', 'ss-9', 'Apex Beauty Equipment', 'BeautyPro Equipment Co.', 'Prime Beauty Distribution Network'],
    name: 'Apex Beauty Equipment',
    legalName: 'Apex Aesthetic & Beauty Equipment India Pvt. Ltd.',
    shortCode: 'ABE',
    logoUrl: 'https://images.unsplash.com/photo-1512290900676-26c2a4d4b57b?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80',
    businessType: 'ISO Equipment Manufacturer',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560058',
    industrialZone: 'Peenya Industrial Estate Phase I',
    fullAddress: 'Plot 44, 2nd Cross, Peenya Industrial Area, Bengaluru, KA 560058',
    establishedYear: '2013 (13 Yrs)',
    employeeCount: '140 Biomedical Technicians',
    gstin: '29AABCA1129E1ZW',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Platinum',
    trustScore: 98,
    overallRating: 4.9,
    totalReviewsCount: 175,
    responseSla: '< 1 hr',
    responseRate: '98% Response Rate',
    ordersFulfilled: '1,850+ Machine Installs',
    minOrderValue: '₹35,000',
    certifications: ['CE Certified Equipment', 'ISO 13485 Medical Devices', 'ISO 9001:2015', 'BIS Approved'],
    aboutStory: 'Apex Beauty Equipment designs and manufactures medical-grade diamond micro-dermabrasion consoles, ozone micro-mist hair spa machinery, hydra-facial consoles, and salon hydraulic styling furniture.',
    cleanroomCapacity: 'Precision Electrical & Vacuum Pump Assembly Bay',
    facilityArea: '35,000 sq.ft Equipment Assembly Plant',
    monthlyProductionCapacity: '150 Machines / Month',
    oemCapabilityOverview: 'Custom branding on metal/plastic consoles, customized electrical voltage export builds, and pan-India warranty servicing.',
    packagingOptions: ['Reinforced Plywood Export Flight Crates', 'Molded Foam Shockproof Casing'],
    formulationTypes: ['Aesthetic Clinic Consoles & Diamond Wand Sets'],
    sampleLeadTime: 'Onsite Demo Available',
    samplePriceText: 'Demo Video & Live Video Walkthrough Available',
    phone: '+91 98450 11992',
    whatsapp: '919845011992',
    email: 'support@apexbeautydevice.in',
    website: 'https://apexbeautydevice.in'
  },
  'seller_silk_010': {
    id: 'seller_silk_010',
    alternateIds: ['sup-10', 'ss-10', 'seller_glampack_006', 'Silk&Shine Manufacturing', 'GlamPack Sustainable Tooling Co.'],
    name: 'Silk&Shine Manufacturing',
    legalName: 'Silk&Shine Haircare & Cosmetics Mfg. Pvt. Ltd.',
    shortCode: 'SSM',
    logoUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?auto=format&fit=crop&w=1600&q=80',
    businessType: 'OEM Haircare Specialist',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395006',
    industrialZone: 'Ichhapore GIDC Chemical & Textile Zone',
    fullAddress: 'Plot 77, Ichhapore GIDC, Surat, GJ 395006',
    establishedYear: '2014 (12 Yrs)',
    employeeCount: '150 Workers',
    gstin: '24AABCS6612H1ZY',
    isGstVerified: true,
    isNexoraVerified: true,
    trustTier: 'Gold',
    trustScore: 97,
    overallRating: 4.8,
    totalReviewsCount: 130,
    responseSla: '< 1 hr',
    responseRate: '96% Response Rate',
    ordersFulfilled: '2,050+ Export Orders',
    minOrderValue: '₹25,000',
    certifications: ['GMP Certified', 'ISO 9001:2015', 'Halal Export Certified'],
    aboutStory: 'Silk&Shine Manufacturing is a specialized haircare OEM producing keratin-infused hair treatment oils, thermal heat protector serums, and argan shine elixirs exported to over 12 countries.',
    cleanroomCapacity: 'Oil Blending Cleanroom Unit',
    facilityArea: '38,000 sq.ft Manufacturing Facility',
    monthlyProductionCapacity: '120,000 Units / Month',
    oemCapabilityOverview: 'Custom hair serum formulations with Marula, Camellia, and Argan oil blends, custom bottle pump dispensers, and export documentation.',
    packagingOptions: ['Glass Pump Bottles (100ml)', 'PET Dropper Bottles'],
    formulationTypes: ['Hydrolyzed Keratin Oil', 'Argan & Camellia Heat Shield Serum'],
    sampleLeadTime: '2 Days Dispatch',
    samplePriceText: '₹400 / Sample Bottle',
    phone: '+91 98251 44332',
    whatsapp: '919825144332',
    email: 'export@silkshinehair.com',
    website: 'https://silkshinehair.com'
  }
};

/**
 * Retrieve seller profile by seller_id or supplier name or alternate ID
 */
export function getSellerProfile(sellerIdOrName?: string): SellerProfileData {
  if (!sellerIdOrName) {
    return SELLER_PROFILES_DB['seller_aura_001'];
  }

  // Exact key match
  if (SELLER_PROFILES_DB[sellerIdOrName]) {
    return SELLER_PROFILES_DB[sellerIdOrName];
  }

  // Search by alternate IDs or name
  const q = sellerIdOrName.toLowerCase();
  for (const profile of Object.values(SELLER_PROFILES_DB)) {
    if (
      profile.id.toLowerCase() === q ||
      profile.name.toLowerCase().includes(q) ||
      profile.legalName.toLowerCase().includes(q) ||
      profile.alternateIds.some(alt => alt.toLowerCase() === q || alt.toLowerCase().includes(q))
    ) {
      return profile;
    }
  }

  // Fallback default
  return SELLER_PROFILES_DB['seller_aura_001'];
}

/**
 * Fetch all products listed by a specific seller ID or seller name
 */
export function getProductsForSeller(sellerIdOrName: string): ProductDetailData[] {
  const profile = getSellerProfile(sellerIdOrName);
  const matchedProducts: ProductDetailData[] = [];

  // Match from SPONSORED_PRODUCTS_DB
  for (const product of Object.values(SPONSORED_PRODUCTS_DB)) {
    if (
      product.seller_id === profile.id ||
      product.supplierName.toLowerCase() === profile.name.toLowerCase() ||
      profile.alternateIds.some(alt => alt.toLowerCase() === product.supplierName.toLowerCase())
    ) {
      matchedProducts.push(product);
    }
  }

  return matchedProducts;
}
