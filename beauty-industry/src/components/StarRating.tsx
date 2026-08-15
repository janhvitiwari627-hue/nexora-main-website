import React, { useState } from 'react';
import { Star, ShieldCheck } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  reviewsCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  showCount?: boolean;
  showVerifiedBadge?: boolean;
  label?: string;
  compact?: boolean;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  reviewsCount,
  size = 'sm',
  showNumber = true,
  showCount = true,
  showVerifiedBadge = false,
  label,
  compact = false,
  interactive = false,
  onRate,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const sizeClasses = {
    xs: {
      star: 'w-3 h-3',
      text: 'text-[11px]',
      gap: 'gap-0.5',
      badge: 'text-[9px] px-1.5 py-0.5'
    },
    sm: {
      star: 'w-3.5 h-3.5',
      text: 'text-xs',
      gap: 'gap-1',
      badge: 'text-[10px] px-2 py-0.5'
    },
    md: {
      star: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-1',
      badge: 'text-xs px-2.5 py-1'
    },
    lg: {
      star: 'w-5 h-5',
      text: 'text-base',
      gap: 'gap-1.5',
      badge: 'text-xs px-3 py-1'
    }
  }[size];

  return (
    <div className={`inline-flex items-center flex-wrap ${sizeClasses.gap} ${className}`}>
      {label && (
        <span className={`font-medium text-[#737373] mr-1 ${sizeClasses.text}`}>
          {label}:
        </span>
      )}

      {/* 5 Stars */}
      <div className="flex items-center">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starIndex = index + 1;
          const isFilled = activeRating >= starIndex;
          const isHalf = !isFilled && activeRating > index && activeRating < starIndex;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate && onRate(starIndex)}
              onMouseEnter={() => interactive && setHoverRating(starIndex)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform p-0.5' : 'cursor-default'}`}
              aria-label={`${starIndex} star`}
            >
              {isHalf ? (
                <div className="relative">
                  <Star className={`${sizeClasses.star} text-[#E5E7EB] fill-[#E5E7EB]`} />
                  <div
                    className="absolute top-0 left-0 overflow-hidden"
                    style={{ width: `${(activeRating - index) * 100}%` }}
                  >
                    <Star className={`${sizeClasses.star} text-[#F59E0B] fill-[#F59E0B]`} />
                  </div>
                </div>
              ) : (
                <Star
                  className={`${sizeClasses.star} ${
                    isFilled
                      ? 'text-[#F59E0B] fill-[#F59E0B]'
                      : 'text-[#E5E7EB] fill-[#E5E7EB]'
                  } transition-colors`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Numerical Rating */}
      {showNumber && (
        <span className={`font-bold text-[#1E1E1E] ml-1 ${sizeClasses.text}`}>
          {activeRating.toFixed(1)}
        </span>
      )}

      {/* Review Count */}
      {showCount && reviewsCount !== undefined && (
        <span className={`text-[#8E8E93] font-normal ${sizeClasses.text}`}>
          {compact ? `(${reviewsCount})` : `(${reviewsCount} verified reviews)`}
        </span>
      )}

      {/* Verified Badge */}
      {showVerifiedBadge && (
        <span className={`inline-flex items-center gap-1 font-semibold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] rounded-md ${sizeClasses.badge} ml-1`}>
          <ShieldCheck className="w-3 h-3 text-[#059669]" />
          Verified Pro
        </span>
      )}
    </div>
  );
};
