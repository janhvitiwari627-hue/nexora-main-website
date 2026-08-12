/**
 * @nexora/auth — app-specific, server-backed access gates.
 *
 * A valid Supabase session is identity, not authorization. Every gate starts
 * with the canonical Auth Service (`getUser()` + active profile) and then
 * verifies the membership owned by the destination app. URL parameters and
 * localStorage are never accepted as role, salon, customer or partner proof.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { NexoraAuthError, toAuthError } from "./errors";
import { createAuthService, type AuthenticatedAccess } from "./service";

export type OwnerWorkspaceAccess = AuthenticatedAccess & {
  /** Active salons returned by the auth.uid()-scoped owner_salon_ids() RPC. */
  salonIds: string[];
};

export type GrowthPartnerMembership = {
  id: string;
  userId: string;
};

export type PartnerMembershipAccess = AuthenticatedAccess & {
  partner: GrowthPartnerMembership;
};

export type CustomerAccountAccess = AuthenticatedAccess;

function forbidden(message: string): NexoraAuthError {
  return new NexoraAuthError("forbidden", message, { retryable: false });
}

/**
 * Require an active Shop Owner profile and at least one active salon reached
 * through an active organization membership.
 *
 * `public.owner_salon_ids()` derives its result exclusively from auth.uid()
 * and rejects forged client-side salon ids through the database owner gate.
 */
export async function requireOwnerWorkspace(client: SupabaseClient): Promise<OwnerWorkspaceAccess> {
  const access = await createAuthService(client).requireRole("business_user");
  const { data, error } = await client.rpc("owner_salon_ids");
  if (error) throw toAuthError(error, "forbidden");

  const salonIds = (Array.isArray(data) ? data : [])
    .map((value) => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object" && "owner_salon_ids" in value) {
        const id = (value as { owner_salon_ids?: unknown }).owner_salon_ids;
        return typeof id === "string" ? id : "";
      }
      return "";
    })
    .filter((value): value is string => Boolean(value));

  if (salonIds.length === 0) {
    throw forbidden(
      "Your Shop Owner account has no active salon workspace. Ask a Nexora administrator to restore the business membership.",
    );
  }

  return { ...access, salonIds: Array.from(new Set(salonIds)) };
}

/** Require the Customer role from the active server profile. */
export async function requireCustomerAccount(client: SupabaseClient): Promise<CustomerAccountAccess> {
  return createAuthService(client).requireRole("customer");
}

/**
 * Require an active Growth Partner profile and a growth_partners row belonging
 * to the verified auth user. RLS independently constrains this read
 * to auth.uid(), so a caller cannot claim another partner membership.
 */
export async function requirePartnerMembership(client: SupabaseClient): Promise<PartnerMembershipAccess> {
  const access = await createAuthService(client).requireRole("growth_partner");
  const { data, error } = await client
    .from("growth_partners")
    .select("id,user_id")
    .eq("user_id", access.user.id)
    .maybeSingle();

  if (error) throw toAuthError(error, "forbidden");
  if (!data || data.user_id !== access.user.id) {
    throw forbidden(
      "This account is not linked to a Growth Partner membership. Contact Nexora support before opening the Partner App.",
    );
  }

  return {
    ...access,
    partner: {
      id: String(data.id),
      userId: data.user_id,
    },
  };
}
