import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Play, AlertCircle, Video } from 'lucide-react';
import { SponsoredReelItem } from '../types';

interface SponsoredReelLightboxModalProps {
  reel: SponsoredReelItem | null;
  onClose: () => void;
}

export const SponsoredReelLightboxModal: React.FC<SponsoredReelLightboxModalProps> = ({
  reel,
  onClose
}) => {
  const [hasEmbedError, setHasEmbedError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Reset state when reel changes
    setHasEmbedError(false);
    setIsPlaying(false);
  }, [reel]);

  useEffect(() => {
    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!reel) return null;

  // Platform label & button text
  const platformActionText = reel.platform === 'X' ? 'View on X' : `Watch on ${reel.platform}`;

  // Platform icon style
  const getPlatformBadgeColor = () => {
    switch (reel.platform) {
      case 'YouTube': return 'bg-red-600 text-white';
      case 'Instagram': return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white';
      case 'Facebook': return 'bg-blue-600 text-white';
      case 'X': return 'bg-black text-white';
      case 'LinkedIn': return 'bg-blue-700 text-white';
      default: return 'bg-[#b90064] text-white';
    }
  };

  // Determine if platform supports direct iframe embed smoothly in MVP
  // YouTube embed works cleanly; others may block cross-origin or require direct link
  const supportsDirectEmbed = reel.platform === 'YouTube' && !!reel.embed_url;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#111011] text-white w-full max-w-md md:max-w-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl my-auto flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Lightbox"
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Column / Aspect Ratio Container */}
        <div className="relative w-full md:w-[320px] bg-black flex-shrink-0 flex items-center justify-center aspect-[9/16] min-h-[380px] max-h-[560px] overflow-hidden">
          {supportsDirectEmbed && !hasEmbedError ? (
            <iframe
              src={reel.embed_url}
              title={reel.display_title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={() => setHasEmbedError(true)}
            />
          ) : (
            /* Fallback or non-iframe social platform container */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
              {/* Background poster */}
              <img
                src={reel.poster_url}
                alt={reel.display_title}
                className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

              <div className="relative z-10 flex flex-col items-center max-w-xs">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${getPlatformBadgeColor()}`}>
                  {reel.platform} Video
                </div>

                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4 shadow-lg">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/80 border border-amber-500/30 px-3 py-1.5 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Playback is available on the original platform.</span>
                </div>

                <a
                  href={reel.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#b90064] hover:bg-[#a00056] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{platformActionText}</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="p-5 flex flex-col justify-between flex-1 bg-[#181617] text-white overflow-y-auto">
          <div>
            {/* Header badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getPlatformBadgeColor()}`}>
                {reel.platform} Reel
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#b90064]/20 border border-[#b90064]/40 text-[#f7a0cd] text-[10px] font-bold uppercase tracking-wider">
                Sponsored Ad
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
              {reel.display_title}
            </h3>

            {/* Supplier / Brand */}
            <div className="flex items-center gap-2 text-xs font-semibold text-pink-300 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#b90064]" />
              <span>{reel.supplierName}</span>
            </div>

            {/* Description */}
            {reel.display_description && (
              <p className="text-xs text-gray-300 leading-relaxed mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
                {reel.display_description}
              </p>
            )}

            {reel.duration && (
              <div className="text-[11px] text-gray-400 font-mono mb-4">
                Duration: <span className="text-white font-semibold">{reel.duration}</span>
              </div>
            )}
          </div>

          {/* Primary Action CTA */}
          <div className="pt-4 border-t border-white/10 mt-auto">
            <a
              href={reel.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-[#111011] text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <ExternalLink className="w-4 h-4 text-[#b90064]" />
              <span>{platformActionText}</span>
            </a>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Opens original video on {reel.platform}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
