import React from 'react';
import { Award, ShieldCheck, Sparkles } from 'lucide-react';

export type SupplierBadgeTier = 'gold' | 'silver' | 'bronze' | 'verified';

export interface VerifiedBadgeProps {
  trustScore?: number;
  overallRating?: number;
  tier?: SupplierBadgeTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Calculates whether a supplier earns Gold or Silver badge based on trust score and ratings.
 * - Gold: Trust Score >= 96 OR Overall Rating >= 4.8
 * - Silver: Trust Score >= 90 OR Overall Rating >= 4.6
 */
export function getSupplierBadgeTier(trustScore?: number, overallRating?: number): SupplierBadgeTier {
  if (trustScore !== undefined) {
    if (trustScore >= 96) return 'gold';
    if (trustScore >= 90) return 'silver';
  }
  if (overallRating !== undefined) {
    if (overallRating >= 4.8) return 'gold';
    if (overallRating >= 4.6) return 'silver';
  }
  return 'silver';
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  trustScore,
  overallRating,
  tier,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const badgeTier = tier || getSupplierBadgeTier(trustScore, overallRating);

  if (badgeTier === 'gold') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border shadow-2xs ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[10px]'
            : size === 'lg'
            ? 'px-3 py-1 text-[12px]'
            : 'px-2.5 py-0.5 text-[11px]'
        } bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border-amber-300 ${className}`}
        title="Gold Verified Supplier • Audited Top Tier Quality & Reliability"
      >
        <Award className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-amber-600 fill-amber-500`} />
        {showLabel && <span>Gold Verified</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border shadow-2xs ${
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px]'
          : size === 'lg'
          ? 'px-3 py-1 text-[12px]'
          : 'px-2.5 py-0.5 text-[11px]'
      } bg-gradient-to-r from-slate-50 to-zinc-100 text-slate-800 border-slate-300 ${className}`}
      title="Silver Verified Supplier • Audited Standards & Reliable Performance"
    >
      <ShieldCheck className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-slate-600 fill-slate-200`} />
      {showLabel && <span>Silver Verified</span>}
    </span>
  );
};
