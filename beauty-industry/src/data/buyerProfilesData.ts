import { BuyerProfileData } from '../components/EditProfileModal';

export const BUYER_PROFILES_DB: Record<string, BuyerProfileData & { id: string; alternateIds: string[] }> = {
  'buyer_priya_001': {
    id: 'buyer_priya_001',
    alternateIds: ['mem_priya_002', 'Priya Sharma', 'Radiant Beauty', 'Radiant Beauty Solutions'],
    fullName: 'Priya Sharma',
    businessName: 'Radiant Beauty Solutions',
    businessType: 'Salon / Spa',
    designation: 'Head of Procurement',
    email: 'priya.procurement@radiantbeauty.in',
    phone: '+91 98201 54321',
    alternatePhone: '+91 22 2650 4321',
    gstin: '27AAACR1234F1Z5',
    pancard: 'AAACR1234F',
    address: 'Plot No. 42, Bandra-Kurla Complex (BKC)',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    annualProcurementBudget: '₹25 Lakhs - ₹1 Crore',
    primaryCategories: ['Skincare & Serums', 'Haircare & Treatments', 'Bulk Salon Consumables'],
    preferredDeliveryTimeline: '3 - 7 Days',
    whatsappAlerts: true,
    emailAlerts: true,
    isGstVerified: true,
    isBusinessVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80',
    bio: 'Lead procurement strategist for Radiant Beauty Solutions managing premium salon inventory and bulk consumable supplies across 14 salon branches in Mumbai and Pune.',
    joinedDate: 'January 2024',
    followersCount: '1,481',
    partnerCardNumber: 'NXP 807A 45DF 9875',
    partnerTier: 'Gold',
    sourcingDistrict: 'Mumbai Metro Region, MH',
    responseSla: '99.8% SLA',
    socialLinks: {
      website: 'https://radiantbeauty.in',
      linkedin: 'https://linkedin.com/in/priya-sharma-radiant',
      instagram: 'https://instagram.com/radiantbeautyspa'
    }
  },
  'buyer_vikram_002': {
    id: 'buyer_vikram_002',
    alternateIds: ['mem_vikram_005', 'Vikram Mehta', 'Apex Glow', 'Apex Glow Dist.'],
    fullName: 'Vikram Mehta',
    businessName: 'Apex Glow Distribution Ltd.',
    businessType: 'Cosmetics Distributor',
    designation: 'Managing Director & Supply Chain Head',
    email: 'vikram.mehta@apexglowdist.com',
    phone: '+91 98201 54325',
    alternatePhone: '+91 11 2334 5678',
    gstin: '07AABCA5678D1Z2',
    pancard: 'AABCA5678D',
    address: 'Suite 404, Barakhamba Road, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi NCR',
    pincode: '110001',
    annualProcurementBudget: '₹1 Crore - ₹5 Crores',
    primaryCategories: ['Color Cosmetics & Equipment', 'Salon Machinery', 'Haircare Treatments'],
    preferredDeliveryTimeline: '2 - 5 Days',
    whatsappAlerts: true,
    emailAlerts: true,
    isGstVerified: true,
    isBusinessVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
    bio: 'Apex Glow Distribution supplies to 450+ verified salon chains, aesthetic spas, and boutique cosmetic counters across North India. Looking for bulk OEM contracts and regional distributorships.',
    joinedDate: 'March 2024',
    followersCount: '2,100',
    partnerCardNumber: 'NXP 912B 78CD 4410',
    partnerTier: 'Platinum',
    sourcingDistrict: 'Delhi NCR & North Region',
    responseSla: '99.5% SLA',
    socialLinks: {
      website: 'https://apexglowdist.com',
      linkedin: 'https://linkedin.com/in/vikram-mehta-distribution'
    }
  },
  'buyer_ananya_003': {
    id: 'buyer_ananya_003',
    alternateIds: ['mem_ananya_008', 'Ananya Verma', 'DermaLuxe', 'DermaLuxe Spa'],
    fullName: 'Dr. Ananya Verma',
    businessName: 'DermaLuxe Aesthetic & Spa Clinics',
    businessType: 'Salon / Spa',
    designation: 'Chief Dermatologist & Sourcing Director',
    email: 'dr.ananya@dermaluxeclinics.in',
    phone: '+91 98201 54328',
    alternatePhone: '+91 80 4123 9876',
    gstin: '29AAACD9012E1Z8',
    pancard: 'AAACD9012E',
    address: '12th Main Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    annualProcurementBudget: '₹50 Lakhs - ₹1.5 Crores',
    primaryCategories: ['Clinical Peels & Sunscreens', 'Skincare & Serums', 'Medi-Facial Formulations'],
    preferredDeliveryTimeline: '3 - 5 Days',
    whatsappAlerts: true,
    emailAlerts: true,
    isGstVerified: true,
    isBusinessVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80',
    bio: 'Founder and Chief Dermatologist at DermaLuxe Aesthetic Clinics operating across Bengaluru and Hyderabad. Procuring medical-grade chemical peels, meso-serums, and sterilized clinic consumables.',
    joinedDate: 'May 2024',
    followersCount: '980',
    partnerCardNumber: 'NXP 654K 89AB 3302',
    partnerTier: 'Gold',
    sourcingDistrict: 'Bengaluru & South Region',
    responseSla: '99.9% SLA',
    socialLinks: {
      website: 'https://dermaluxeclinics.in',
      instagram: 'https://instagram.com/dermaluxe_clinics',
      linkedin: 'https://linkedin.com/in/dr-ananya-verma'
    }
  }
};

/**
 * Retrieve buyer profile by buyerId or full name or fallback to default (Priya Sharma)
 */
export function getBuyerProfile(buyerIdOrName?: string): BuyerProfileData {
  if (!buyerIdOrName) {
    return BUYER_PROFILES_DB['buyer_priya_001'];
  }

  // Exact ID match
  if (BUYER_PROFILES_DB[buyerIdOrName]) {
    return BUYER_PROFILES_DB[buyerIdOrName];
  }

  // Search by alternate IDs or name
  const q = buyerIdOrName.toLowerCase();
  for (const profile of Object.values(BUYER_PROFILES_DB)) {
    if (
      profile.id.toLowerCase() === q ||
      profile.fullName.toLowerCase().includes(q) ||
      profile.businessName.toLowerCase().includes(q) ||
      profile.alternateIds.some(alt => alt.toLowerCase() === q || alt.toLowerCase().includes(q))
    ) {
      return profile;
    }
  }

  // If not found in DB, return default Priya Sharma profile
  return BUYER_PROFILES_DB['buyer_priya_001'];
}
