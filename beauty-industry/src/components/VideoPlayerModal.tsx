import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ShieldCheck,
  Building2,
  MapPin,
  Sparkles,
  Heart,
  Share2,
  ShoppingBag,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Award,
  Clock,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { VideoTestimonial, Product, SupplierPartner } from '../types';
import { StarRating } from './StarRating';

interface VideoPlayerModalProps {
  isOpen: boolean;
  video: VideoTestimonial | null;
  allVideos: VideoTestimonial[];
  products: Product[];
  onClose: () => void;
  onSelectVideo: (video: VideoTestimonial) => void;
  onSelectProduct?: (product: Product) => void;
  onSelectSupplier?: (supplierId: string) => void;
  onAddToQuote?: (product: Product, quantity: number) => void;
  onMessageSupplier?: (supplierId: string, product?: Product) => void;
  onLikeVideo?: (videoId: string) => void;
  isLiked?: boolean;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  video,
  allVideos,
  products,
  onClose,
  onSelectVideo,
  onSelectProduct,
  onSelectSupplier,
  onAddToQuote,
  onMessageSupplier,
  onLikeVideo,
  isLiked = false
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && videoRef.current) {
        e.preventDefault();
        togglePlay();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (video && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [video]);

  if (!isOpen || !video) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1;
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Find linked product if available
  const linkedProduct = video.featuredProductId
    ? products.find((p) => p.id === video.featuredProductId)
    : undefined;

  const relatedVideos = allVideos.filter((v) => v.id !== video.id).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-6xl max-h-[95vh] bg-[#121212] border border-[#2D2D2D] rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left / Top: Video Player Stream Area */}
        <div className="w-full lg:w-[62%] bg-black flex flex-col justify-between relative group select-none min-h-[300px] sm:min-h-[420px] lg:min-h-[600px]">
          {/* Main Video Element */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
            <video
              ref={videoRef}
              src={video.videoUrl || undefined}
              poster={video.thumbnail || undefined}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
              playsInline
              className="w-full h-full object-contain max-h-[70vh] cursor-pointer"
            />

            {/* Big Play Overlay if paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute w-20 h-20 rounded-full bg-[#B8005A]/90 hover:bg-[#B8005A] text-white flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 cursor-pointer backdrop-blur-sm border-2 border-white/30"
              >
                <Play className="w-8 h-8 ml-1 fill-white" />
              </button>
            )}

            {/* Top Bar Badges on Video */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-none">
              <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
                DISTRIBUTOR SPOTLIGHT
              </span>
              <span className="bg-[#B8005A]/90 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full border border-[#FF85B2]/40 flex items-center gap-1 shadow-md uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                {video.category}
              </span>
            </div>
          </div>

          {/* Video Control Bar */}
          <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex flex-col gap-2.5 z-20">
            {/* Progress Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#B8005A]"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-xs text-white/90">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="font-mono text-white/80 text-[11px]">
                  {formatTime(currentTime)} / {formatTime(duration) || video.duration}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeedChange}
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>

                <button
                  onClick={handleFullscreen}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Bottom: Distributor Story, Tagged Product & Actions */}
        <div className="w-full lg:w-[38%] bg-[#1A1A1A] p-5 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[50vh] lg:max-h-[85vh] divide-y divide-[#2D2D2D]">
          {/* Section 1: Distributor & Speaker Profile */}
          <div className="pb-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B8005A] to-[#80003E] text-white flex items-center justify-center font-extrabold text-base tracking-wider shadow-md shrink-0">
                  {video.distributorInitials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-base hover:text-[#FF85B2] transition-colors cursor-pointer"
                      onClick={() => onSelectSupplier?.(video.distributorId)}
                    >
                      {video.distributorName}
                    </h3>
                    {video.distributorVerified && (
                      <ShieldCheck className="w-4 h-4 text-[#FF85B2]" />
                    )}
                  </div>
                  <p className="text-xs text-white/60 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#FF85B2]" />
                    {video.distributorLocation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onLikeVideo?.(video.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isLiked
                      ? 'bg-[#B8005A] text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                  title="Approve Highlight"
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                  <span>{video.likesCount + (isLiked ? 1 : 0)}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
                  title="Share Link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {copiedLink && (
              <div className="bg-[#B8005A]/20 border border-[#B8005A]/40 text-[#FF85B2] text-[11px] font-bold px-3 py-1 rounded-lg mb-3 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Link copied to clipboard!
              </div>
            )}

            {/* Video Headline */}
            <h2 className="text-lg font-bold text-white leading-snug mt-3">
              {video.title}
            </h2>

            {/* Testimonial Quote Card */}
            <div className="mt-3.5 p-4 rounded-2xl bg-[#242424] border border-[#333333] relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{video.speakerName}</span>
                  <span className="text-[10px] text-[#FF85B2] bg-[#B8005A]/20 px-2 py-0.5 rounded-full font-semibold">
                    {video.speakerRole}
                  </span>
                </div>
                <div className="flex items-center text-amber-400 text-xs">
                  <StarRating rating={video.rating} size="xs" compact={true} />
                </div>
              </div>
              <p className="text-xs text-white/80 italic leading-relaxed">
                "{video.quote}"
              </p>
              <div className="mt-2 text-[11px] text-white/50 font-medium">
                🏛️ {video.salonOrBusiness} • {video.date}
              </div>
            </div>

            {/* Key Verified Highlight Bullet */}
            <div className="mt-3 flex items-start gap-2 bg-[#2D1B28] border border-[#B8005A]/30 p-3 rounded-xl">
              <Sparkles className="w-4 h-4 text-[#FF85B2] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-extrabold text-[#FF85B2] uppercase tracking-wider block">
                  Commercial Verification Takeaway:
                </span>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  {video.keyHighlight}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Featured Wholesale Product Tag */}
          {(linkedProduct || video.featuredProductName) && (
            <div className="py-5">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2.5">
                Featured Product in Video
              </span>

              <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-3.5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3">
                  <img
                    src={linkedProduct?.image || video.featuredProductImage || undefined}
                    alt={linkedProduct?.name || video.featuredProductName}
                    className="w-14 h-14 object-cover rounded-xl border border-white/10 bg-white/5 shrink-0"
                  />
                  <div>
                    <h4
                      onClick={() => linkedProduct && onSelectProduct?.(linkedProduct)}
                      className="text-xs font-bold text-white group-hover:text-[#FF85B2] transition-colors cursor-pointer line-clamp-1"
                    >
                      {linkedProduct?.name || video.featuredProductName}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-extrabold text-[#FF85B2]">
                        ₹{(linkedProduct?.price || video.featuredProductPrice || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-white/50">
                        MOQ: {linkedProduct?.moq || video.featuredProductMoq || 10} units
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {linkedProduct && onAddToQuote && (
                    <button
                      onClick={() => onAddToQuote(linkedProduct, linkedProduct.moq)}
                      className="bg-[#B8005A] hover:bg-[#960049] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>+ RFQ</span>
                    </button>
                  )}
                  {linkedProduct && onSelectProduct && (
                    <button
                      onClick={() => onSelectProduct(linkedProduct)}
                      className="text-[10px] font-bold text-white/70 hover:text-white underline text-center cursor-pointer"
                    >
                      Dossier
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: More Highlights from Verified Partners */}
          {relatedVideos.length > 0 && (
            <div className="pt-5">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2.5">
                More Partner Highlights
              </span>
              <div className="grid grid-cols-3 gap-2">
                {relatedVideos.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectVideo(item)}
                    className="group cursor-pointer flex flex-col gap-1"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-[#B8005A] transition-all">
                      <img
                        src={item.thumbnail || undefined}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 fill-white text-white" />
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono px-1 rounded text-white/80">
                        {item.duration}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/80 group-hover:text-[#FF85B2] line-clamp-1">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-5 flex items-center gap-2.5 mt-auto">
            <button
              onClick={() => onMessageSupplier?.(video.distributorId, linkedProduct)}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#FF85B2]" />
              <span>Chat with Distributor</span>
            </button>

            <button
              onClick={() => onSelectSupplier?.(video.distributorId)}
              className="bg-[#B8005A] hover:bg-[#960049] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <span>Distributor Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
