// ============================================================================
// NEXORA LUXE - PHASE 4 UNIFIED BACKEND API & REST/RELATIONAL CLIENT LAYER
// ============================================================================

import { db } from './database';
import { supabase } from '../lib/supabase';
import {
  DBUser,
  DBProfileBuyer,
  DBProfileSupplier,
  DBProduct,
  DBRFQEnquiry,
  DBQuote,
  DBMessage,
  DBFollowUp,
  PopulatedRFQEnquiry,
  PopulatedQuote,
  PopulatedProduct,
  UserRole
} from './types';

function mapSupabaseUser(user: { id: string; email?: string | null; phone?: string | null; created_at?: string; updated_at?: string; user_metadata?: { role?: UserRole } }): DBUser {
  const role = (user.user_metadata?.role as UserRole) || 'buyer';
  return {
    id: user.id,
    email: user.email || '',
    phone: user.phone || '',
    password_hash: 'managed-by-supabase-auth', // Never persist or expose a password locally.
    role,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString(),
  };
}

// ============================================================================
// AUTH & SESSION API
// ============================================================================

export interface AuthSession {
  user: DBUser;
  buyerProfile?: DBProfileBuyer;
  supplierProfile?: DBProfileSupplier;
  token: string;
}

export const authApi = {
  async getSession(): Promise<AuthSession | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const buyerProfile = session.user.user_metadata?.role === 'buyer'
        ? db.getBuyerProfileByUserId(session.user.id)
        : undefined;
      const supplierProfile = session.user.user_metadata?.role === 'supplier'
        ? db.getSupplierProfileByUserId(session.user.id)
        : undefined;

      return {
        user: mapSupabaseUser(session.user),
        buyerProfile,
        supplierProfile,
        token: session.access_token,
      };
    } catch {
      return null;
    }
  },

  async login(identifier: string, passwordOrOtp: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const isEmail = identifier.includes('@');
    const { data, error } = isEmail && passwordOrOtp.length >= 8
      ? await supabase.auth.signInWithPassword({ email: identifier, password: passwordOrOtp })
      : await supabase.auth.signInWithOtp(isEmail ? { email: identifier } : { phone: identifier });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data?.session?.user) {
      return { success: false, error: 'Verification required. No active session yet.' };
    }

    return {
      success: true,
      session: {
        user: mapSupabaseUser(data.session.user),
        token: data.session.access_token,
      },
    };
  },

  async register(data: {
    emailOrPhone: string;
    businessName: string;
    role: UserRole;
    contactName?: string;
    password?: string;
  }): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const isEmail = data.emailOrPhone.includes('@');
    if (!isEmail) {
      return { success: false, error: 'Business email is required for registration.' };
    }

    const password = data.password && data.password.length >= 8
      ? data.password
      : `Nexora${Date.now()}`;

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.emailOrPhone,
      password,
      options: {
        data: { role: data.role, business_name: data.businessName },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!authData.user) {
      return { success: false, error: 'Registration could not create a user.' };
    }

    const user = mapSupabaseUser(authData.user);
    return {
      success: true,
      session: authData.session
        ? { user, token: authData.session.access_token }
        : undefined,
    };
  },

  async switchRole(userId: string, targetRole: UserRole): Promise<DBUser | undefined> {
    const { data } = await supabase.auth.updateUser({ data: { role: targetRole } });
    if (!data?.user) return undefined;
    return mapSupabaseUser(data.user);
  },

  logout(): void {
    void supabase.auth.signOut();
  }
};

// ============================================================================
// BUYER API (RFQs, Enquiries, Quotes Comparison & Negotiation)
// ============================================================================

export const buyerApi = {
  async getProfile(buyerIdOrUserId: string): Promise<DBProfileBuyer | undefined> {
    return db.getBuyerProfileById(buyerIdOrUserId) || db.getBuyerProfileByUserId(buyerIdOrUserId);
  },

  async updateProfile(profile: Partial<DBProfileBuyer> & { user_id: string; contact_name: string }): Promise<DBProfileBuyer> {
    return db.upsertBuyerProfile(profile);
  },

  async getEnquiries(buyerId: string): Promise<PopulatedRFQEnquiry[]> {
    return db.getRFQsAndEnquiries({ buyer_id: buyerId });
  },

  async getRFQs(buyerId: string): Promise<PopulatedRFQEnquiry[]> {
    return db.getRFQsAndEnquiries({ buyer_id: buyerId, type: 'public_rfq' });
  },

  async createEnquiryOrRFQ(data: {
    buyer_id: string;
    supplier_id?: string | null;
    product_id?: string | null;
    requirement_title: string;
    category: string;
    quantity_required: number;
    quantity_unit?: string;
    target_budget?: number;
    delivery_location: string;
    details: string;
    attachments?: string[];
    type: 'direct_enquiry' | 'public_rfq';
    send_to_similar_suppliers?: boolean;
  }): Promise<{ success: boolean; rfq?: DBRFQEnquiry; errors?: string[] }> {
    // Form Validation Check
    const validation = db.validateRFQ(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const rfq = db.createRFQEnquiry({
      buyer_id: data.buyer_id,
      supplier_id: data.supplier_id || null,
      product_id: data.product_id || null,
      requirement_title: data.requirement_title,
      category: data.category,
      quantity_required: data.quantity_required,
      quantity_unit: data.quantity_unit || 'Units',
      target_budget: data.target_budget,
      delivery_location: data.delivery_location,
      details: data.details,
      attachments: data.attachments || [],
      status: 'new',
      type: data.type,
      send_to_similar_suppliers: data.send_to_similar_suppliers ?? true
    });

    return { success: true, rfq };
  },

  async getQuotesForRFQ(rfqId: string): Promise<PopulatedQuote[]> {
    return db.getQuotesByRfqId(rfqId);
  },

  async acceptQuote(quoteId: string): Promise<DBQuote | undefined> {
    return db.updateQuoteStatus(quoteId, 'accepted');
  },

  async counterOfferQuote(quoteId: string, counterPrice: number, notes: string): Promise<DBQuote | undefined> {
    return db.updateQuoteStatus(quoteId, 'negotiating', {
      counter_offer_price: counterPrice,
      counter_offer_notes: notes
    });
  },

  async rejectQuote(quoteId: string): Promise<DBQuote | undefined> {
    return db.updateQuoteStatus(quoteId, 'rejected');
  }
};

// ============================================================================
// SUPPLIER API (Catalogue, Lead Funnel, Quote Submission, Follow-ups)
// ============================================================================

export const supplierApi = {
  async getProfile(supplierIdOrUserId: string): Promise<DBProfileSupplier | undefined> {
    return db.getSupplierProfileById(supplierIdOrUserId) || db.getSupplierProfileByUserId(supplierIdOrUserId);
  },

  async getAllSuppliers(): Promise<DBProfileSupplier[]> {
    return db.getSupplierProfiles();
  },

  async updateProfile(profile: Partial<DBProfileSupplier> & { user_id: string; company_name: string }): Promise<DBProfileSupplier> {
    return db.upsertSupplierProfile(profile);
  },

  async getProducts(supplierId?: string): Promise<PopulatedProduct[]> {
    return db.getProducts({ supplier_id: supplierId });
  },

  async createProduct(product: Omit<DBProduct, 'id' | 'created_at' | 'updated_at'>): Promise<DBProduct> {
    return db.createProduct(product);
  },

  async updateProduct(id: string, updates: Partial<DBProduct>): Promise<DBProduct | undefined> {
    return db.updateProduct(id, updates);
  },

  async deleteProduct(id: string): Promise<boolean> {
    return db.deleteProduct(id);
  },

  async getIncomingLeads(supplierId: string): Promise<PopulatedRFQEnquiry[]> {
    return db.getRFQsAndEnquiries({ supplier_id: supplierId });
  },

  async getMarketplaceRFQs(): Promise<PopulatedRFQEnquiry[]> {
    return db.getRFQsAndEnquiries({ type: 'public_rfq' });
  },

  async submitQuote(quoteData: {
    rfq_id: string;
    supplier_id: string;
    unit_price: number;
    total_price: number;
    moq_offered: number;
    lead_time: string;
    validity_date: string;
    terms_and_conditions: string;
    attachment_url?: string;
    sample_available: boolean;
    sample_cost?: number;
    notes?: string;
  }): Promise<DBQuote> {
    return db.createQuote({
      ...quoteData,
      status: 'submitted'
    });
  },

  async getFollowUps(supplierId: string): Promise<DBFollowUp[]> {
    return db.getFollowUps(supplierId);
  },

  async createFollowUp(data: Omit<DBFollowUp, 'id' | 'created_at' | 'updated_at'>): Promise<DBFollowUp> {
    return db.createFollowUp(data);
  },

  async completeFollowUp(id: string): Promise<DBFollowUp | undefined> {
    return db.updateFollowUpStatus(id, 'completed');
  }
};

// ============================================================================
// CHAT & DIRECT COMMUNICATION API
// ============================================================================

export const chatApi = {
  async getMessages(conversationId?: string): Promise<DBMessage[]> {
    return db.getMessages(conversationId);
  },

  async sendMessage(data: {
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    rfq_id?: string;
    product_id?: string;
    message_body: string;
    attachments?: string[];
  }): Promise<DBMessage> {
    return db.sendMessage({
      ...data,
      attachments: data.attachments || []
    });
  },

  async markRead(conversationId: string, receiverId: string): Promise<void> {
    db.markMessagesAsRead(conversationId, receiverId);
  }
};

// ============================================================================
// VALIDATION & HELPERS API
// ============================================================================

export const validationApi = {
  validateGST: (gst: string) => db.validateGST(gst),
  validatePhone: (phone: string) => db.validatePhone(phone),
  validateRFQ: (rfq: Partial<DBRFQEnquiry>) => db.validateRFQ(rfq)
};
