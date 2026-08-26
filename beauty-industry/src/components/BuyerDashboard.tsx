import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  MessageSquare, 
  Bookmark, 
  Users, 
  Plus, 
  Search, 
  ChevronRight, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  ExternalLink,
  Phone,
  Mail,
  History,
  TrendingUp,
  LayoutDashboard,
  Bell,
  UserCheck,
  UserPlus,
  FileText,
  LayoutGrid,
  ShoppingBag,
  Package,
  ShieldCheck,
  MessageCircle,
  MoreVertical,
  ArrowRight,
  Settings,
  Edit3,
  Building2,
  Check,
  Globe,
  Calendar,
  Share2,
  ThumbsUp,
  Camera,
  Image,
  Video,
  Trash2,
  Send,
  Play,
  Activity,
  Sparkles,
  Layers,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { BuyerEnquiry, BuyerRFQ, VerifiedSupplier } from '../types';
import { BUYER_MOCK_ENQUIRIES, BUYER_MOCK_RFQS, VERIFIED_SUPPLIERS } from '../data/mockData';
import { EditProfileModal, BuyerProfileData } from './EditProfileModal';
import { FollowerNetworkModal } from './FollowerNetworkModal';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../hooks/useNotifications';

interface BuyerDashboardProps {
  isLoggedIn: boolean;
  onNavigate: (screen: any, params?: any) => void;
  onPostRFQ: () => void;
  onCallSupplier: (name: string) => void;
  onWhatsAppSupplier: (name: string) => void;
  onOpenAuth: () => void;
  buyerProfile?: BuyerProfileData;
  onSaveProfile?: (updated: BuyerProfileData) => void;
  onOpenEditProfile?: () => void;
  initialTab?: 'overview' | 'about' | 'rfqs' | 'saved' | 'social' | 'activity' | 'notifications';
  isProfileRoute?: boolean;
  currentScreen?: string;
}

interface CommentItem {
  id: string;
  author: string;
  avatar?: string;
  businessName?: string;
  content: string;
  timeAgo: string;
}

interface TimelinePost {
  id: string;
  author: string;
  businessName: string;
  avatar?: string;
  timeAgo: string;
  content: string;
  tag: string;
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  commentsList?: CommentItem[];
  taggedProduct?: string;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ 
  isLoggedIn,
  onNavigate, 
  onPostRFQ,
  onCallSupplier,
  onWhatsAppSupplier,
  onOpenAuth,
  buyerProfile: propBuyerProfile,
  onSaveProfile: propOnSaveProfile,
  onOpenEditProfile: propOnOpenEditProfile,
  initialTab,
  isProfileRoute = false,
  currentScreen
}) => {
  const isProfileView = currentScreen === 'buyer-profile' || currentScreen === 'supplier-portal' || isProfileRoute;
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'about' | 'rfqs' | 'saved' | 'social' | 'activity' | 'notifications' | 'network'>(
    (initialTab as any) || 'overview'
  );
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileToast, setProfileToast] = useState<string | null>(null);

  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [localBuyerProfile, setLocalBuyerProfile] = useState<BuyerProfileData>({
    fullName: 'Priya Sharma',
    businessName: 'Radiant Beauty Solutions',
    businessType: 'Salon / Spa',
    designation: 'Head of Procurement',
    email: 'priya.procurement@radiantbeauty.in',
    phone: '+91 98201 54321',
    alternatePhone: '+91 22 2650 4321',
    gstin: '27AAACR1234F1Z5',
    pancard: 'AAACR1234F',
    address: 'Plot No. 42, Bandra-Kurla Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    annualProcurementBudget: '₹25 Lakhs - ₹1 Crore',
    primaryCategories: ['Skincare & Serums', 'Haircare & Treatments'],
    preferredDeliveryTimeline: '3 - 7 Days',
    whatsappAlerts: true,
    emailAlerts: true,
    isGstVerified: true,
    isBusinessVerified: true,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    bio: 'Head of Procurement at Radiant Beauty Solutions. Sourcing premium salon formulations, organic serums, and advanced aesthetic equipment across India.',
    joinedDate: 'January 2024',
    socialLinks: {
      facebook: 'https://facebook.com/radiantbeauty',
      instagram: 'https://instagram.com/radiantbeauty_in',
      linkedin: 'https://linkedin.com/company/radiant-beauty-solutions',
      youtube: 'https://youtube.com/@radiantbeautytv',
      twitter: 'https://twitter.com/radiantbeauty',
      website: 'https://radiantbeauty.in'
    }
  });

  const buyerProfile = propBuyerProfile || localBuyerProfile;

  // --- Dynamic Follow & Live Tracking System ---
  const [buyerFollowed, setBuyerFollowed] = useState<boolean>(() => {
    return localStorage.getItem('buyer_followed') === 'true';
  });

  const [buyerFollowers, setBuyerFollowers] = useState<number>(() => {
    if (buyerProfile?.followersCount) {
      const parsed = parseInt(String(buyerProfile.followersCount).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed)) return parsed;
    }
    const saved = localStorage.getItem('buyer_followers_count');
    return saved ? parseInt(saved, 10) : 1481;
  });

  // Dynamically update follower count when active buyer profile changes
  useEffect(() => {
    if (buyerProfile?.followersCount) {
      const parsed = parseInt(String(buyerProfile.followersCount).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed)) {
        setBuyerFollowers(parsed);
      }
    }
  }, [buyerProfile?.fullName, buyerProfile?.followersCount]);

  const handleBuyerFollowToggle = () => {
    const nextFollowed = !buyerFollowed;
    const nextCount = buyerFollowers + (nextFollowed ? 1 : -1);
    setBuyerFollowed(nextFollowed);
    setBuyerFollowers(nextCount);
    localStorage.setItem('buyer_followed', String(nextFollowed));
    localStorage.setItem('buyer_followers_count', String(nextCount));
    
    setProfileToast(nextFollowed ? 'You are now tracking your own profile followers!' : 'Profile follower tracking updated.');
    setTimeout(() => setProfileToast(null), 3000);
  };

  const mapSupplierId = (supId: string) => {
    if (supId === 'sup-1') return 'seller_aura_001';
    if (supId === 'sup-2') return 'seller_luxe_002';
    if (supId === 'sup-3') return 'seller_beautypro_003';
    if (supId === 'sup-4') return 'seller_radiant_004';
    return supId;
  };

  const [followedSuppliers, setFollowedSuppliers] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const ids = ['seller_aura_001', 'seller_luxe_002', 'seller_beautypro_003', 'seller_radiant_004'];
    ids.forEach(id => {
      initial[id] = localStorage.getItem(`follow_${id}`) === 'true';
    });
    return initial;
  });

  const [supplierFollowerCounts, setSupplierFollowerCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const ids = ['seller_aura_001', 'seller_luxe_002', 'seller_beautypro_003', 'seller_radiant_004'];
    ids.forEach(id => {
      const saved = localStorage.getItem(`follower_count_${id}`);
      if (saved) {
        initial[id] = parseInt(saved, 10);
      } else {
        let defaultVal = 1248;
        if (id === 'seller_aura_001') defaultVal = 482;
        if (id === 'seller_luxe_002') defaultVal = 310;
        if (id === 'seller_beautypro_003') defaultVal = 824;
        if (id === 'seller_radiant_004') defaultVal = 195;
        initial[id] = defaultVal;
      }
    });
    return initial;
  });

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { supplierId, isFollowed, followerCount } = customEvent.detail;
      setFollowedSuppliers(prev => ({
        ...prev,
        [supplierId]: isFollowed
      }));
      setSupplierFollowerCounts(prev => ({
        ...prev,
        [supplierId]: followerCount
      }));
    };

    window.addEventListener('supplier-follow-updated', handleSync);
    return () => {
      window.removeEventListener('supplier-follow-updated', handleSync);
    };
  }, []);

  const handleSupplierFollowToggle = (supplierId: string) => {
    const isCurrentlyFollowed = !!followedSuppliers[supplierId];
    const nextFollowed = !isCurrentlyFollowed;
    const nextCount = (supplierFollowerCounts[supplierId] || 482) + (nextFollowed ? 1 : -1);

    localStorage.setItem(`follow_${supplierId}`, String(nextFollowed));
    localStorage.setItem(`follower_count_${supplierId}`, String(nextCount));

    setFollowedSuppliers(prev => ({
      ...prev,
      [supplierId]: nextFollowed
    }));
    setSupplierFollowerCounts(prev => ({
      ...prev,
      [supplierId]: nextCount
    }));

    window.dispatchEvent(new CustomEvent('supplier-follow-updated', {
      detail: { supplierId, isFollowed: nextFollowed, followerCount: nextCount }
    }));

    setProfileToast(nextFollowed ? 'Supplier followed successfully!' : 'Supplier unfollowed.');
    setTimeout(() => setProfileToast(null), 3000);
  };
  // ---------------------------------------------

  // Timeline feed posts state with localStorage persistence
  const [newPostText, setNewPostText] = useState('');
  const [mediaInputType, setMediaInputType] = useState<'none' | 'image' | 'video'>('none');
  const [profileActivityFilter, setProfileActivityFilter] = useState<'all' | 'rfqs' | 'quotes' | 'interactions'>('all');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [postTag, setPostTag] = useState('Buyer Update');
  const [isUploadingPostPhoto, setIsUploadingPostPhoto] = useState(false);
  const [taggedProduct, setTaggedProduct] = useState<string>('');
  const [isTaggingProduct, setIsTaggingProduct] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const postPhotoInputRef = useRef<HTMLInputElement>(null);

  const handlePostPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setProfileToast(`Selected photo is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max limit is 5MB.`);
      setTimeout(() => setProfileToast(null), 3500);
      return;
    }

    setIsUploadingPostPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setMediaUrlInput(compressedDataUrl);
          setMediaInputType('image');
          setProfileToast(`Photo uploaded successfully!`);
          setTimeout(() => setProfileToast(null), 3000);
        }
        setIsUploadingPostPhoto(false);
      };
      img.onerror = () => {
        setProfileToast('Unable to process selected photo.');
        setTimeout(() => setProfileToast(null), 3000);
        setIsUploadingPostPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setProfileToast('Failed to read photo file.');
      setTimeout(() => setProfileToast(null), 3000);
      setIsUploadingPostPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  // Track comment input values and expanded/drawer status per post ID
  const [openCommentPostIds, setOpenCommentPostIds] = useState<Record<string, boolean>>({});
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});

  const [feedPosts, setFeedPosts] = useState<TimelinePost[]>(() => {
    const saved = localStorage.getItem('nexora_buyer_posts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved posts:', e);
      }
    }
    return [
      {
        id: 'post-1',
        author: 'Priya Sharma',
        businessName: 'Radiant Beauty Solutions',
        avatar: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
        timeAgo: '2 hours ago',
        content: 'Looking for verified OEM manufacturers for private label Vitamin C & Hyaluronic Acid anti-aging serums. Minimum initial batch size 500 units with custom packaging. Please share direct quotations or schedule a meeting.',
        tag: 'Sourcing RFQ',
        likes: 14,
        comments: 2,
        shares: 2,
        liked: false,
        commentsList: [
          {
            id: 'comment-1-1',
            author: 'Ananya Sen',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
            businessName: 'Aura Beauty Labs',
            content: 'We can manufacture this for you! We specialize in custom active-ingredient serums. Will send a direct message.',
            timeAgo: '1 hour ago'
          },
          {
            id: 'comment-1-2',
            author: 'Rajesh Kumar',
            avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
            businessName: 'LuxeForm Cosmetics',
            content: 'Interested! We have ready-to-go stability-tested Vitamin C formulations. Minimum order is 500 units.',
            timeAgo: '30 mins ago'
          }
        ]
      },
      {
        id: 'post-2',
        author: 'Priya Sharma',
        businessName: 'Radiant Beauty Solutions',
        avatar: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
        timeAgo: 'Yesterday',
        content: 'Successfully onboarded 3 new tier-1 skincare suppliers through Nexora Luxe verified B2B marketplace. The GST verification and direct WhatsApp RFQ features have cut our procurement turnaround time by 60%!',
        tag: 'Milestone',
        likes: 32,
        comments: 1,
        shares: 6,
        liked: true,
        mediaUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=800&q=80',
        mediaType: 'image',
        commentsList: [
          {
            id: 'comment-2-1',
            author: 'Vikram Mehta',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
            businessName: 'BeautyPro Manufacturing',
            content: 'Congratulations Priya! Proud to be one of your trusted partners here.',
            timeAgo: 'Yesterday'
          }
        ]
      }
    ];
  });

  // Persist posts to localStorage on changes
  useEffect(() => {
    localStorage.setItem('nexora_buyer_posts', JSON.stringify(feedPosts));
  }, [feedPosts]);

  const getEmbeddableVideoUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost: TimelinePost = {
      id: `post-${Date.now()}`,
      author: buyerProfile.fullName,
      businessName: buyerProfile.businessName,
      avatar: buyerProfile.avatarUrl,
      timeAgo: 'Just now',
      content: newPostText,
      tag: postTag,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      mediaUrl: mediaInputType !== 'none' && mediaUrlInput.trim() ? mediaUrlInput.trim() : undefined,
      mediaType: mediaInputType !== 'none' && mediaUrlInput.trim() ? mediaInputType : undefined,
      commentsList: [],
      taggedProduct: taggedProduct.trim() ? taggedProduct.trim() : undefined
    };

    setFeedPosts([newPost, ...feedPosts]);
    setNewPostText('');
    setMediaUrlInput('');
    setMediaInputType('none');
    setPostTag('Buyer Update');
    setTaggedProduct('');
    setIsTaggingProduct(false);
    setProfileToast('Timeline update posted successfully!');
    setTimeout(() => setProfileToast(null), 3000);
  };

  const handleToggleLike = (postId: string) => {
    setFeedPosts(posts => posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          liked: !p.liked,
          likes: p.liked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  const handleToggleCommentsDrawer = (postId: string) => {
    setOpenCommentPostIds(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = (postId: string, commentText: string) => {
    if (!commentText || !commentText.trim()) return;

    const newComment: CommentItem = {
      id: `comment-${postId}-${Date.now()}`,
      author: buyerProfile.fullName,
      avatar: buyerProfile.avatarUrl,
      businessName: buyerProfile.businessName,
      content: commentText,
      timeAgo: 'Just now'
    };

    setFeedPosts(posts => posts.map(p => {
      if (p.id === postId) {
        const commentsList = p.commentsList || [];
        return {
          ...p,
          comments: commentsList.length + 1,
          commentsList: [...commentsList, newComment]
        };
      }
      return p;
    }));

    setNewCommentTexts(prev => ({ ...prev, [postId]: '' }));
    setProfileToast('Comment published successfully!');
    setTimeout(() => setProfileToast(null), 2500);
  };

  const handleSharePost = (postId: string) => {
    setFeedPosts(posts => posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          shares: p.shares + 1
        };
      }
      return p;
    }));

    // Mock copy post url to clipboard
    const mockPostUrl = `${window.location.origin}/buyer-dashboard/posts/${postId}`;
    navigator.clipboard.writeText(mockPostUrl).then(() => {
      setProfileToast('Post link copied! (Copied to clipboard)');
      setTimeout(() => setProfileToast(null), 3000);
    }).catch(err => {
      console.error("Could not copy link", err);
      setProfileToast('Post shared!');
      setTimeout(() => setProfileToast(null), 3000);
    });
  };

  const handleTriggerEditProfile = () => {
    if (propOnOpenEditProfile) {
      propOnOpenEditProfile();
    } else {
      setIsEditProfileOpen(true);
    }
  };

  const handleSaveProfile = (updatedData: BuyerProfileData) => {
    if (propOnSaveProfile) {
      propOnSaveProfile(updatedData);
    } else {
      setLocalBuyerProfile(updatedData);
    }
    setProfileComplete(true);
    setProfileToast('Profile & Business Settings updated successfully!');
    setTimeout(() => setProfileToast(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Active RFQs', value: '08', icon: ClipboardList, color: '#b90064', trend: '+2 this week', route: 'rfq-tracking' },
    { label: 'New Quotes', value: '03', icon: BarChart3, color: '#0050d6', badge: true, trend: 'Action needed', route: 'rfq-tracking' },
    { label: 'Sent Enquiries', value: '14', icon: MessageSquare, color: '#e6007e', trend: '4 pending reply', route: 'buyer-enquiry-log' },
    { label: 'Unread Messages', value: '02', icon: MessageCircle, color: '#1c1b1b', badge: true, trend: 'Aura Labs, LuxeForm', route: 'buyer-dashboard' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-50 text-green-700 border-green-100';
      case 'Responded': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Quote Received': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Negotiating': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Converted': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Closed': return 'bg-gray-50 text-gray-700 border-gray-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const renderPostCard = (post: TimelinePost) => {
    const isCommentsOpen = !!openCommentPostIds[post.id];
    const commentText = newCommentTexts[post.id] || '';
    const commentsList = post.commentsList || [];

    const embedUrl = post.mediaUrl ? getEmbeddableVideoUrl(post.mediaUrl) : '';
    const isYoutube = embedUrl.includes('youtube.com/embed') || embedUrl.includes('youtu.be');

    return (
      <div key={post.id} className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs space-y-4 text-left">
        {/* Post Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#b90064] to-[#e6007e] text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
              {post.avatar ? (
                <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black">{post.author ? post.author[0].toUpperCase() : 'U'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#1c1b1b]">{post.author}</h4>
                <span className="text-[10px] text-[#8c7077] font-medium">• {post.timeAgo}</span>
              </div>
              <p className="text-[10px] text-[#594047] font-medium">{post.businessName}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#fde7f3] text-[#b90064] text-[10px] font-black uppercase tracking-wider">
            {post.tag}
          </span>
        </div>

        {/* Post Content */}
        <div className="space-y-3">
          <p className="text-xs text-[#1c1b1b] leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
          {post.taggedProduct && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fde7f3] border border-[#e0bec6] text-[#b90064] rounded-xl text-[11px] font-black">
              <Package className="w-3.5 h-3.5" />
              <span>Tagged Beauty Product: <span className="underline">{post.taggedProduct}</span></span>
            </div>
          )}
        </div>

        {/* Media Player or HD Image Rendering */}
        {post.mediaUrl && post.mediaType === 'image' && (
          <div className="rounded-xl overflow-hidden border border-[#e8e8e8] bg-[#fcf9f8] mt-3 max-h-96 flex justify-center items-center">
            <img src={post.mediaUrl} alt="Post Attachment" className="max-h-96 object-contain w-full hover:scale-[1.01] transition-transform duration-300" referrerPolicy="no-referrer" />
          </div>
        )}

        {post.mediaUrl && post.mediaType === 'video' && (
          <div className="rounded-xl overflow-hidden border border-[#e8e8e8] bg-black aspect-video mt-3">
            {isYoutube ? (
              <iframe src={embedUrl} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <video src={post.mediaUrl} controls className="w-full h-full object-contain" />
            )}
          </div>
        )}

        {/* Interaction Action Buttons & Live Counter */}
        <div className="pt-3 border-t border-[#f0edec] flex items-center justify-between text-xs text-[#8c7077]">
          <button 
            onClick={() => handleToggleLike(post.id)} 
            className={`flex items-center gap-1.5 font-bold transition-all px-3 py-1.5 rounded-lg hover:bg-[#fde7f3]/50 cursor-pointer ${
              post.liked ? 'text-[#b90064]' : 'hover:text-[#1c1b1b]'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 transition-transform ${post.liked ? 'fill-[#b90064] scale-110' : ''}`} /> 
            <span>{post.likes} {post.likes === 1 ? 'Like' : 'Likes'}</span>
          </button>

          <button 
            onClick={() => handleToggleCommentsDrawer(post.id)} 
            className={`flex items-center gap-1.5 font-bold transition-all px-3 py-1.5 rounded-lg hover:bg-[#0050d6]/5 cursor-pointer ${
              isCommentsOpen ? 'text-[#0050d6]' : 'hover:text-[#1c1b1b]'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> 
            <span>{commentsList.length} {commentsList.length === 1 ? 'Comment' : 'Comments'}</span>
          </button>

          <button 
            onClick={() => handleSharePost(post.id)} 
            className="flex items-center gap-1.5 font-bold transition-all px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer hover:text-[#1c1b1b]"
          >
            <Share2 className="w-4 h-4" /> 
            <span>{post.shares} {post.shares === 1 ? 'Share' : 'Shares'}</span>
          </button>
        </div>

        {/* Comments Drawer / Inline comments list & posting */}
        {isCommentsOpen && (
          <div className="pt-4 border-t border-[#f0edec] space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Existing Comments List */}
            {commentsList.length > 0 ? (
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {commentsList.map(comment => (
                  <div key={comment.id} className="bg-[#fcf9f8] p-3 rounded-xl border border-[#f0edec] text-xs space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[#fde7f3] text-[#b90064] font-black text-[9px] flex items-center justify-center overflow-hidden shrink-0">
                          {comment.avatar ? (
                            <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-black">{comment.author[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-extrabold text-[#1c1b1b]">{comment.author}</span>
                          {comment.businessName && (
                            <span className="text-[10px] text-[#8c7077] font-medium ml-1.5">({comment.businessName})</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-[#8c7077] font-medium">{comment.timeAgo}</span>
                    </div>
                    <p className="text-[#594047] pl-8 leading-relaxed font-medium">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-[#fcf9f8] rounded-xl border border-dashed border-[#e8e8e8] text-xs text-[#8c7077] font-medium">
                No comments yet. Be the first to reply!
              </div>
            )}

            {/* Post New Comment Input */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b90064] to-[#e6007e] text-white font-bold flex items-center justify-center overflow-hidden shrink-0 text-xs">
                {buyerProfile.avatarUrl ? (
                  <img src={buyerProfile.avatarUrl} alt={buyerProfile.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{buyerProfile.fullName ? buyerProfile.fullName[0].toUpperCase() : 'B'}</span>
                )}
              </div>
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setNewCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="Write a professional comment/reply..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleAddComment(post.id, commentText);
                    }
                  }}
                  className="w-full pl-3.5 pr-12 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleAddComment(post.id, commentText)}
                  className="absolute right-2.5 p-1.5 text-[#b90064] hover:text-[#8e004b] transition-colors rounded-lg cursor-pointer"
                  title="Submit Comment"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-2xl border border-[#e8e8e8] animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        <div className="w-12 h-4 bg-gray-50 rounded" />
      </div>
      <div className="w-16 h-8 bg-gray-100 rounded mb-2" />
      <div className="w-24 h-3 bg-gray-50 rounded" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#fdf8f8]">
      
      {/* Global Toast */}
      {profileToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#1c1b1b] text-white px-4 py-3 rounded-xl shadow-xl border border-[#333] flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{profileToast}</span>
        </div>
      )}

      {/* CONDITIONAL PROFILE HEADER vs CLEAN DASHBOARD HEADER */}
      {isProfileView ? (
        /* FACEBOOK-STYLE PROFILE HEADER & COVER BANNER */
        <div className="bg-white border-b border-[#e8e8e8] shadow-xs">
          {/* Cover Photo Banner */}
          <div className="relative h-48 sm:h-72 w-full bg-gradient-to-r from-[#b90064] via-[#e6007e] to-[#0050d6] overflow-hidden">
            {buyerProfile.coverPhotoUrl ? (
              <img src={buyerProfile.coverPhotoUrl} alt="Cover Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-black/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                onClick={handleTriggerEditProfile}
                className="px-3.5 py-2 bg-white/90 hover:bg-white text-[#1c1b1b] rounded-xl text-xs font-bold shadow-md backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#b90064]" />
                <span>Edit Cover & Profile</span>
              </button>
            </div>
          </div>

          {/* Profile Info Bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-10 pb-6 relative">
            
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 pt-4">
              
              {/* Left/Main Column: Avatar & Text Info */}
              <div className="flex flex-col md:flex-row md:items-start gap-6 flex-1">
                
                {/* Avatar neatly overlapped at the bottom-left edge of the cover banner */}
                <div className="-mt-16 sm:-mt-20 lg:-mt-24 relative z-20 shrink-0">
                  <div className="relative group">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white p-1.5 shadow-xl border-4 border-white overflow-hidden bg-gradient-to-br from-[#b90064] to-[#e6007e]">
                      <div className="w-full h-full rounded-2xl overflow-hidden bg-[#fde7f3] flex items-center justify-center text-white font-black text-3xl">
                        {buyerProfile.avatarUrl ? (
                          <img src={buyerProfile.avatarUrl} alt={buyerProfile.fullName} className="w-full h-full object-cover" />
                        ) : (
                          buyerProfile.fullName ? buyerProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'PS'
                        )}
                      </div>
                    </div>
                    {/* Online Status Indicator */}
                    <div className="absolute bottom-3 right-3 w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-md z-30" title="Active Now" />
                  </div>
                </div>

                {/* Text Info: User Name, Title/Role, Location, etc. sits cleanly below the cover banner in vertical flow */}
                <div className="space-y-3 pt-2 md:pt-4 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#1c1b1b] tracking-tight">{buyerProfile.fullName}</h1>
                    {buyerProfile.isGstVerified && (
                      <span className="px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Verified Business Account
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-[#fde7f3] border border-[#e0bec6] text-[#b90064] text-xs font-black flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#b90064]" /> {buyerFollowers} Followers
                    </span>
                  </div>

                  <p className="text-sm font-bold text-[#594047]">
                    {buyerProfile.designation} at <span className="text-[#1c1b1b] font-extrabold">{buyerProfile.businessName}</span> ({buyerProfile.businessType})
                  </p>

                  <div className="flex items-center gap-3.5 text-xs text-[#8c7077] font-semibold flex-wrap pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#b90064]" /> {buyerProfile.city}, {buyerProfile.state}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#0050d6]" /> Joined {buyerProfile.joinedDate || 'January 2024'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[#0050d6] bg-[#0050d6]/5 px-2.5 py-0.5 rounded border border-[#0050d6]/15">GST: {buyerProfile.gstin}</span>
                  </div>

                  {/* Quick Social Badges */}
                  {buyerProfile.socialLinks && (
                    <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                      {buyerProfile.socialLinks.website && (
                        <a href={buyerProfile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[#fcf9f8] hover:bg-[#fde7f3] border border-[#e8e8e8] text-[#1c1b1b] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                          <Globe className="w-4 h-4 text-[#b90064]" />
                          <span>Website</span>
                        </a>
                      )}
                      {buyerProfile.socialLinks.linkedin && (
                        <a href={buyerProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[#0050d6]/5 hover:bg-[#0050d6]/10 text-[#0050d6] border border-[#0050d6]/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                          <ExternalLink className="w-4 h-4 text-[#0050d6]" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {buyerProfile.socialLinks.instagram && (
                        <a href={buyerProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-pink-50/50 hover:bg-pink-50 text-[#b90064] border border-pink-200/50 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                          <ExternalLink className="w-4 h-4 text-[#b90064]" />
                          <span>Instagram</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Growth Network Partner Card & Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-5 shrink-0 w-full lg:w-auto pt-4 lg:pt-0">
                
                {/* Premium Nexora Growth Network Partner Card */}
                <div className="bg-gradient-to-br from-[#1c1b1b] to-[#2d121f] text-white rounded-2xl p-5 border border-[#44303b] shadow-xl w-full sm:max-w-xs relative overflow-hidden text-left z-20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#b90064] opacity-20 rounded-full blur-xl" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#0050d6]/10 rounded-full blur-xl" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#b90064] flex items-center justify-center text-white shrink-0 shadow-md">
                        <TrendingUp className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[8px] font-black tracking-widest text-[#e6007e] uppercase block leading-none">Nexora Luxe</span>
                        <h4 className="text-[11px] font-black tracking-tight text-white uppercase leading-tight">Growth Network Partner</h4>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[9px] font-black tracking-wider uppercase leading-none">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <div className="text-[9px] text-[#8c7077] uppercase font-bold tracking-wider leading-none">Partner Card Number</div>
                      <div className="font-mono text-xs font-black tracking-widest text-pink-100 flex items-center gap-1.5 mt-1">
                        <span>{buyerProfile.partnerCardNumber || 'NXP 807A 45DF 9875'}</span>
                        <span className="text-[9px] px-1 py-0.2 bg-white/15 text-stone-200 rounded font-sans font-black tracking-normal uppercase leading-none">
                          {buyerProfile.partnerTier || 'Gold'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] text-[#8c7077] uppercase font-bold tracking-wider leading-none">Sourcing District / Region</div>
                      <div className="text-xs font-bold text-stone-200 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#e6007e] shrink-0" />
                        <span>{buyerProfile.sourcingDistrict || `${buyerProfile.city} Metro Region, ${buyerProfile.state}`}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-stone-800">
                      <div>
                        <div className="text-[9px] text-[#8c7077] uppercase font-bold tracking-wider leading-none">Verified Status</div>
                        <div className="text-xs font-extrabold text-green-400 flex items-center gap-1 mt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <span>{buyerProfile.isGstVerified ? 'GSTIN' : 'Verified'}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#8c7077] uppercase font-bold tracking-wider leading-none">Network Reach</div>
                        <button
                          type="button"
                          onClick={() => setIsFollowersModalOpen(true)}
                          className="text-xs font-extrabold text-[#e6007e] hover:text-[#ff389b] flex items-center gap-1 mt-1 cursor-pointer transition-all group"
                          title="Click to view connected supplier profiles"
                        >
                          <Users className="w-3.5 h-3.5 text-[#e6007e] group-hover:scale-110 transition-transform shrink-0" />
                          <span className="underline decoration-dotted underline-offset-2 decoration-[#e6007e]/60 group-hover:decoration-[#ff389b]">{buyerFollowers.toLocaleString()} Followers</span>
                          <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-stone-800 text-[10px] text-stone-300 font-bold leading-none">
                    <span className="text-stone-400 font-medium">Response SLA</span>
                    <span className="text-[#e6007e] font-black">{buyerProfile.responseSla || '99.8% SLA'}</span>
                  </div>
                </div>

                {/* Action Buttons row cleanly stacked under the cover image, sitting next to details */}
                <div className="flex items-center gap-3 flex-wrap sm:justify-end w-full lg:w-auto">
                  <button
                    onClick={handleBuyerFollowToggle}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 border ${
                      buyerFollowed
                        ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064] hover:bg-[#fbc5e3]'
                        : 'bg-white border-[#e8e8e8] text-[#1c1b1b] hover:border-[#b90064] hover:text-[#b90064]'
                    }`}
                  >
                    {buyerFollowed ? (
                      <>
                        <Check className="w-4 h-4 text-[#b90064]" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-[#8c7077]" />
                        <span>Follow Profile</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleTriggerEditProfile}
                    className="px-5 py-2.5 bg-white border border-[#e8e8e8] hover:border-[#b90064] text-[#1c1b1b] hover:text-[#b90064] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Settings className="w-4 h-4 text-[#b90064]" />
                    <span>Edit Profile</span>
                  </button>

                  <button 
                    onClick={onPostRFQ}
                    className="px-6 py-2.5 bg-[#b90064] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#b90064]/25 hover:bg-[#8e004b] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post Requirement</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Facebook-Style Navigation Tabs */}
            <div className="flex items-center gap-2 mt-6 border-t border-[#e8e8e8] pt-3 overflow-x-auto no-scrollbar">
              {[
                { id: 'activity', label: 'Posts / Feed', icon: MessageSquare },
                { id: 'about', label: 'About & Bio', icon: Users },
                { id: 'social', label: 'Social Links & Credentials', icon: Globe },
                { id: 'network', label: 'Network / Followers', icon: Share2 },
                { id: 'overview', label: 'Activity', icon: History }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
                    activeTab === tab.id
                      ? 'bg-[#b90064] text-white shadow-sm shadow-[#b90064]/20'
                      : 'bg-[#fcf9f8] text-[#594047] hover:bg-[#f0edec] hover:text-[#1c1b1b]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CLEAN HIGH-DENSITY DASHBOARD HEADER FOR NON-PROFILE VIEWS */
        <div className="bg-white border-b border-[#e8e8e8] px-4 sm:px-10 py-5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-left">
              <h1 className="text-xl font-bold text-[#1c1b1b] tracking-tight flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-[#b90064]" />
                <span>Buyer Sourcing Workspace</span>
              </h1>
              <p className="text-xs text-[#594047] font-medium">Manage RFQs, direct enquiries, compare quotes, and monitor notifications.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onPostRFQ}
                className="px-5 py-2.5 bg-[#b90064] hover:bg-[#8e004b] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Post Requirement</span>
              </button>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'notifications', label: 'Notifications & Alerts', icon: Bell, badge: unreadCount > 0 ? `${unreadCount}` : undefined },
              { id: 'rfqs', label: 'Posts & Sourcing', icon: ClipboardList },
              { id: 'saved', label: 'Saved Suppliers', icon: Bookmark },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
                  activeTab === tab.id
                    ? 'bg-[#b90064] text-white shadow-sm shadow-[#b90064]/20'
                    : 'bg-[#fcf9f8] text-[#594047] hover:bg-[#f0edec] hover:text-[#1c1b1b]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-none ${
                    activeTab === tab.id ? 'bg-white text-[#b90064]' : 'bg-[#b90064] text-white animate-pulse'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in fade-in-50 duration-200">
              
              {/* Profile Notice */}
              {isProfileView && !profileComplete && (
                <div className="bg-white border border-[#b90064]/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-xs">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#b90064]" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fde7f3] flex items-center justify-center text-[#b90064]">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1c1b1b]">Complete Your Buyer Profile</h3>
                      <p className="text-xs text-[#594047] mt-0.5">Upload GST and Business Proof to gain "Nexora Trusted Buyer" status and get priority quotes.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditProfileOpen(true)}
                    className="px-5 py-2.5 bg-[#1c1b1b] text-white rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-xs"
                  >
                    Complete Verification
                  </button>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {isLoading ? (
                  [1, 2, 3, 4].map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  stats.map((stat, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.02, y: -4 }}
                      onClick={() => stat.route && onNavigate(stat.route)}
                      className="bg-white p-6 rounded-2xl border border-[#e8e8e8] shadow-xs hover:shadow-md transition-all relative overflow-hidden group cursor-pointer text-left"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-[#fcf9f8] group-hover:bg-[#fde7f3] transition-colors">
                          <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                        </div>
                        {stat.badge && (
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#b90064] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b90064]"></span>
                          </span>
                        )}
                      </div>
                      <div className="text-3xl font-black text-[#1c1b1b] tracking-tight">{stat.value}</div>
                      <div className="text-[11px] font-bold text-[#8c7077] uppercase tracking-widest mt-1">{stat.label}</div>
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        {stat.trend}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Grid: Left Intro & Right Recent Activity */}
              <div className="grid lg:grid-cols-3 gap-10">
                
                {/* Left Sidebar Intro Box (Facebook Style) */}
                <div className="space-y-6">
                  {isProfileView && (
                    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs space-y-5">
                      <h3 className="text-sm font-black text-[#1c1b1b] tracking-tight">Intro</h3>
                      
                      <p className="text-xs text-[#594047] leading-relaxed font-medium">
                        {buyerProfile.bio}
                      </p>

                      <div className="space-y-3.5 pt-2 border-t border-[#f0edec] text-xs text-[#594047]">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-[#b90064] shrink-0" />
                          <div>
                            <span className="font-bold text-[#1c1b1b]">{buyerProfile.businessName}</span>
                            <div className="text-[10px] text-[#8c7077]">{buyerProfile.businessType}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-[#0050d6] shrink-0" />
                          <div>
                            <span className="font-bold text-[#1c1b1b]">Lives in {buyerProfile.city}, {buyerProfile.state}</span>
                            <div className="text-[10px] text-[#8c7077]">{buyerProfile.pincode}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>Joined {buyerProfile.joinedDate || 'January 2024'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                          <div>
                            <span className="font-bold text-green-700">GSTIN Verified</span>
                            <div className="font-mono text-[10px] text-[#8c7077]">{buyerProfile.gstin}</div>
                          </div>
                        </div>
                      </div>

                      {/* Social links in intro box */}
                      {buyerProfile.socialLinks && (
                        <div className="pt-3 border-t border-[#f0edec] space-y-2">
                          <h4 className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider">Social Presence</h4>
                          <div className="space-y-2">
                            {buyerProfile.socialLinks.website && (
                              <a href={buyerProfile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-[#0050d6] hover:underline truncate">
                                <Globe className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{buyerProfile.socialLinks.website}</span>
                              </a>
                            )}
                            {buyerProfile.socialLinks.linkedin && (
                              <a href={buyerProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-[#1c1b1b] hover:underline truncate">
                                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#0050d6]" />
                                <span className="truncate">LinkedIn Profile</span>
                              </a>
                            )}
                            {buyerProfile.socialLinks.instagram && (
                              <a href={buyerProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-[#1c1b1b] hover:underline truncate">
                                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#b90064]" />
                                <span className="truncate">Instagram Page</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleTriggerEditProfile}
                        className="w-full py-2.5 bg-[#fcf9f8] hover:bg-[#f0edec] text-[#1c1b1b] rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#e8e8e8]"
                      >
                        Edit Intro Details
                      </button>
                    </div>
                  )}

                  {/* Sourcing Notifications & Alerts Widget */}
                  <NotificationCenter 
                    variant="widget" 
                    onNavigate={(screen, params) => {
                      if (screen === 'buyer-dashboard' && params?.tab === 'notifications') {
                        setActiveTab('notifications');
                      } else {
                        onNavigate(screen, params);
                      }
                    }} 
                  />
                </div>

                {/* Right Main Column (Active RFQs & Activity Stream) */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Active RFQs */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-[#1c1b1b] tracking-tight">Active RFQs</h2>
                        <span className="px-2 py-0.5 rounded-full bg-[#fde7f3] text-[#b90064] text-[10px] font-black uppercase">Live</span>
                      </div>
                      <button onClick={() => setActiveTab('rfqs')} className="text-xs font-bold text-[#b90064] hover:underline flex items-center gap-1">
                        View All <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {BUYER_MOCK_RFQS.slice(0, 2).map((rfq) => (
                        <motion.div 
                          key={rfq.id}
                          whileHover={{ scale: 1.01 }}
                          className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(rfq.status)}`}>
                                  {rfq.status}
                                </span>
                                <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-widest">{rfq.category}</span>
                              </div>
                              <h3 className="text-lg font-bold text-[#1c1b1b]">{rfq.title}</h3>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-bold text-[#594047]">
                                <div className="flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-[#b90064]" />
                                  Qty: {rfq.quantity}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-[#0050d6]" />
                                  {rfq.responsesCount} Supplier Responses
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-[#f0edec] md:pl-8 min-w-[140px]">
                              <button onClick={() => setActiveTab('rfqs')} className="flex-1 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[11px] font-black text-[#1c1b1b] hover:bg-white transition-all">
                                View RFQ
                              </button>
                              <button onClick={() => setActiveTab('rfqs')} className="flex-1 py-2.5 bg-[#b90064] text-white rounded-xl text-[11px] font-black shadow-sm hover:bg-[#8e004b] transition-all">
                                Compare Quotes
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  {/* Recent Activity Stream */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black text-[#1c1b1b] tracking-tight">Recent Activity Stream</h2>
                      <button onClick={() => setActiveTab('activity')} className="text-xs font-bold text-[#b90064] hover:underline flex items-center gap-1">
                        Timeline Feed <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Upgraded Post Creation Box */}
                    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#b90064] to-[#e6007e] text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
                          {buyerProfile.avatarUrl ? <img src={buyerProfile.avatarUrl} alt={buyerProfile.fullName} className="w-full h-full object-cover" /> : buyerProfile.fullName[0]}
                        </div>
                        
                        <form onSubmit={handleCreatePost} className="flex-1 space-y-3">
                          <input
                            type="file"
                            ref={postPhotoInputRef}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handlePostPhotoSelect}
                          />

                          <div className="text-xs font-black text-[#1c1b1b] tracking-tight uppercase">Create Post / Share Update</div>
                          
                          <textarea
                            rows={3}
                            value={newPostText}
                            onChange={e => setNewPostText(e.target.value)}
                            placeholder="Share a beauty sourcing requirement, salon milestone, or private label request with the Nexora community..."
                            className="w-full px-4 py-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium resize-none leading-relaxed"
                          />

                          {/* Active Media Toggle Options */}
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#f0edec]">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  postPhotoInputRef.current?.click();
                                }}
                                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                                  mediaInputType === 'image'
                                    ? 'bg-[#b90064] text-white border-[#b90064] shadow-sm'
                                    : 'bg-[#fcf9f8] text-[#594047] border-[#e8e8e8] hover:bg-[#f0edec]'
                                }`}
                              >
                                <Image className="w-3.5 h-3.5" />
                                <span>{isUploadingPostPhoto ? 'Processing...' : mediaInputType === 'image' ? 'Change Photo' : 'Upload Photo'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMediaInputType(mediaInputType === 'video' ? 'none' : 'video');
                                  if (mediaInputType !== 'video') setMediaUrlInput('');
                                }}
                                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                                  mediaInputType === 'video'
                                    ? 'bg-[#0050d6] text-white border-[#0050d6] shadow-sm'
                                    : 'bg-[#fcf9f8] text-[#594047] border-[#e8e8e8] hover:bg-[#f0edec]'
                                }`}
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Add Video URL</span>
                              </button>
                            </div>

                            {/* Tag Dropdown choice */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider">Tag:</span>
                              <select
                                value={postTag}
                                onChange={e => setPostTag(e.target.value)}
                                className="px-2.5 py-1.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[11px] font-bold text-[#1c1b1b] focus:border-[#b90064] focus:outline-hidden"
                              >
                                <option value="Buyer Update">Buyer Update</option>
                                <option value="Sourcing RFQ">Sourcing RFQ</option>
                                <option value="Milestone">Milestone</option>
                                <option value="Urgent">Urgent Requirement</option>
                              </select>
                            </div>
                          </div>

                          {/* Expanding input field ONLY for Videos */}
                          {mediaInputType === 'video' && (
                            <div className="pt-3 border-t border-dashed border-[#e8e8e8] space-y-2 animate-in fade-in slide-in-from-top-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider">
                                  Enter Video URL (YouTube Watch Link or MP4 URL)
                                </span>
                                <button 
                                  type="button" 
                                  onClick={() => { setMediaInputType('none'); setMediaUrlInput(''); }} 
                                  className="text-[10px] font-bold text-[#b90064] hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                              <input
                                type="url"
                                value={mediaUrlInput}
                                onChange={e => setMediaUrlInput(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                              />
                            </div>
                          )}

                          {/* Live validated preview */}
                          {mediaUrlInput.trim() !== '' && mediaInputType !== 'none' && (
                            <div className="mt-4 p-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl space-y-2 animate-in zoom-in-95">
                              <div className="flex items-center justify-between text-[10px] font-bold text-[#8c7077] uppercase tracking-wider pb-1.5 border-b border-[#e8e8e8]">
                                <span>{mediaInputType === 'image' ? 'Uploaded Photo Preview' : 'Live Video Preview'}</span>
                                <button 
                                  type="button" 
                                  onClick={() => { setMediaUrlInput(''); setMediaInputType('none'); }} 
                                  className="text-red-500 hover:underline"
                                >
                                  Clear Attachment
                                </button>
                              </div>
                              {mediaInputType === 'image' ? (
                                <div className="relative rounded-lg overflow-hidden border border-[#e8e8e8] bg-white max-h-48 flex items-center justify-center">
                                  <img 
                                    src={mediaUrlInput} 
                                    alt="Live preview" 
                                    className="max-h-48 object-contain" 
                                  />
                                </div>
                              ) : (
                                <div className="rounded-lg overflow-hidden border border-[#e8e8e8] bg-black aspect-video max-h-48 flex items-center justify-center">
                                  {getEmbeddableVideoUrl(mediaUrlInput).includes('youtube.com/embed') ? (
                                    <iframe src={getEmbeddableVideoUrl(mediaUrlInput)} className="w-full h-full max-h-48" frameBorder="0" allowFullScreen />
                                  ) : (
                                    <video src={mediaUrlInput} controls className="w-full h-full max-h-48 object-contain" />
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Publish Submit Button */}
                          <div className="pt-3 border-t border-[#f0edec] flex justify-end">
                            <button
                              type="submit"
                              disabled={!newPostText.trim()}
                              className={`px-6 py-2.5 bg-[#b90064] text-white rounded-xl text-xs font-extrabold shadow-md hover:bg-[#8e004b] transition-all cursor-pointer flex items-center gap-1.5 ${
                                !newPostText.trim() ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Publish Update</span>
                            </button>
                          </div>

                        </form>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {feedPosts.slice(0, 2).map(renderPostCard)}
                    </div>
                  </section>

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT / BIO */}
          {activeTab === 'about' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#f0edec] pb-5">
                  <div>
                    <h2 className="text-xl font-black text-[#1c1b1b]">About & Professional Background</h2>
                    <p className="text-xs text-[#594047] mt-0.5">Verified B2B profile and enterprise credentials</p>
                  </div>
                  <button
                    onClick={handleTriggerEditProfile}
                    className="px-4 py-2 bg-[#b90064] text-white rounded-xl text-xs font-bold hover:bg-[#8e004b] transition-all cursor-pointer"
                  >
                    Edit Bio & Details
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-1">
                    <span className="text-[#8c7077] uppercase font-bold tracking-widest text-[10px]">Full Name</span>
                    <div className="font-bold text-[#1c1b1b] text-sm">{buyerProfile.fullName}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#8c7077] uppercase font-bold tracking-widest text-[10px]">Designation / Role</span>
                    <div className="font-bold text-[#1c1b1b] text-sm">{buyerProfile.designation}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#8c7077] uppercase font-bold tracking-widest text-[10px]">Enterprise Name</span>
                    <div className="font-bold text-[#1c1b1b] text-sm">{buyerProfile.businessName}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#8c7077] uppercase font-bold tracking-widest text-[10px]">Business Classification</span>
                    <div className="font-bold text-[#1c1b1b] text-sm">{buyerProfile.businessType}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#8c7077] uppercase font-bold tracking-widest text-[10px]">Official Email</span>
                    <div className="font-bold text-[#1c1b1b] text-sm">{buyerProfile.email}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#8c7077] uppercase font-bold tracking-widest text-[10px]">Primary Mobile (WhatsApp)</span>
                    <div className="font-bold text-[#1c1b1b] text-sm">{buyerProfile.phone}</div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-[#8c7077] uppercase font-bold tracking-widest text-[10px]">Sourcing & Delivery Address</span>
                    <div className="font-bold text-[#1c1b1b] text-sm">{buyerProfile.address}, {buyerProfile.city}, {buyerProfile.state} - {buyerProfile.pincode}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#8c7077] uppercase font-bold tracking-widest text-[10px]">GST Identification Number (GSTIN)</span>
                    <div className="font-mono font-bold text-[#0050d6] text-sm">{buyerProfile.gstin}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#8c7077] uppercase font-bold tracking-widest text-[10px]">Annual Procurement Budget</span>
                    <div className="font-bold text-[#1c1b1b] text-sm">{buyerProfile.annualProcurementBudget || '₹25 Lakhs - ₹1 Crore'}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#f0edec]">
                  <h3 className="text-xs font-bold text-[#8c7077] uppercase tracking-widest mb-3">Primary Categories of Interest</h3>
                  <div className="flex flex-wrap gap-2">
                    {buyerProfile.primaryCategories.map((cat, i) => (
                      <span key={i} className="px-3 py-1 bg-[#fde7f3] text-[#b90064] rounded-lg text-xs font-bold">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POSTS & SOURCING REQUESTS */}
          {activeTab === 'rfqs' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#1c1b1b]">Posts & Sourcing Requests</h2>
                  <p className="text-xs text-[#594047] mt-0.5">Manage your active RFQs and supplier quotations</p>
                </div>
                <button
                  onClick={onPostRFQ}
                  className="px-5 py-2.5 bg-[#b90064] text-white rounded-xl text-xs font-extrabold shadow-md hover:bg-[#8e004b] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post New Requirement</span>
                </button>
              </div>

              <div className="space-y-4">
                {BUYER_MOCK_RFQS.map((rfq) => (
                  <div key={rfq.id} className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(rfq.status)}`}>
                            {rfq.status}
                          </span>
                          <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-widest">{rfq.category}</span>
                          <span className="text-[10px] text-[#8c7077]">• Posted {rfq.postedDate}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#1c1b1b]">{rfq.title}</h3>
                        <p className="text-xs text-[#594047]">{rfq.description}</p>
                        <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-[#594047] pt-2">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-[#b90064]" /> Required Qty: {rfq.quantity}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[#0050d6]" /> {rfq.responsesCount} Manufacturer Quotes Received
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button className="px-5 py-2.5 bg-[#b90064] text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-[#8e004b] transition-all cursor-pointer">
                          Compare Quotes (3)
                        </button>
                        <button className="px-5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] text-[#1c1b1b] rounded-xl text-xs font-bold hover:bg-white transition-all cursor-pointer">
                          Edit RFQ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SAVED SUPPLIERS */}
          {activeTab === 'saved' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-200">
              <div>
                <h2 className="text-xl font-black text-[#1c1b1b]">Saved Suppliers & Products</h2>
                <p className="text-xs text-[#594047] mt-0.5">Your shortlisted B2B manufacturing partners and catalog items</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {VERIFIED_SUPPLIERS.slice(0, 3).map((sup) => (
                  <div key={sup.id} className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#fde7f3] text-[#b90064] font-bold flex items-center justify-center text-lg">
                        {sup.name[0]}
                      </div>
                      <span className="px-2.5 py-1 rounded bg-green-50 text-green-700 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-600" /> Verified
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-[#1c1b1b]">{sup.name}</h3>
                      <p className="text-xs text-[#8c7077] mt-0.5">{sup.type} • {sup.city}, {sup.state}</p>
                      
                      {/* Live Follower Count Badge */}
                      <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-[#b90064] bg-[#fde7f3]/50 px-2 py-1 rounded-lg w-max border border-[#f5d6df]">
                        <Users className="w-3.5 h-3.5 text-[#b90064]" />
                        <span>{supplierFollowerCounts[mapSupplierId(sup.id)] || 482} Followers</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#f0edec] flex items-center gap-2">
                      <button 
                        onClick={() => onNavigate('supplier-profile', { supplierId: sup.id })}
                        className="flex-1 py-2 bg-[#fcf9f8] border border-[#e8e8e8] hover:bg-white text-[#1c1b1b] rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        View Profile
                      </button>
                      <button 
                        onClick={() => handleSupplierFollowToggle(mapSupplierId(sup.id))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                          followedSuppliers[mapSupplierId(sup.id)]
                            ? 'bg-[#fde7f3] text-[#b90064] border-[#e0bec6]'
                            : 'bg-[#b90064] text-white border-transparent hover:bg-[#8e004b]'
                        }`}
                      >
                        {followedSuppliers[mapSupplierId(sup.id)] ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#b90064]" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-white" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SOCIAL LINKS */}
          {activeTab === 'social' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#f0edec] pb-5">
                  <div>
                    <h2 className="text-xl font-black text-[#1c1b1b]">Social Media & Digital Presence</h2>
                    <p className="text-xs text-[#594047] mt-0.5">Connected social channels and official website links</p>
                  </div>
                  <button
                    onClick={handleTriggerEditProfile}
                    className="px-4 py-2 bg-[#b90064] text-white rounded-xl text-xs font-bold hover:bg-[#8e004b] transition-all cursor-pointer"
                  >
                    Update Social Handles
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Official Website', url: buyerProfile.socialLinks?.website, icon: Globe, color: '#0050d6' },
                    { label: 'LinkedIn Profile', url: buyerProfile.socialLinks?.linkedin, icon: ExternalLink, color: '#0050d6' },
                    { label: 'Instagram Handle', url: buyerProfile.socialLinks?.instagram, icon: ExternalLink, color: '#b90064' },
                    { label: 'Facebook Page', url: buyerProfile.socialLinks?.facebook, icon: ExternalLink, color: '#1877f2' },
                    { label: 'YouTube Channel', url: buyerProfile.socialLinks?.youtube, icon: ExternalLink, color: '#ff0000' },
                    { label: 'Twitter / X Profile', url: buyerProfile.socialLinks?.twitter, icon: ExternalLink, color: '#1da1f2' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white border border-[#e8e8e8] flex items-center justify-center" style={{ color: item.color }}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1c1b1b]">{item.label}</div>
                          <div className="text-[11px] text-[#8c7077] truncate max-w-[200px]">{item.url || 'Not connected'}</div>
                        </div>
                      </div>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white border border-[#e8e8e8] text-[#1c1b1b] hover:text-[#b90064] rounded-lg text-xs font-bold transition-all">
                          Visit
                        </a>
                      ) : (
                        <button onClick={handleTriggerEditProfile} className="text-xs font-bold text-[#b90064] hover:underline">
                          Add Link
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACTIVITY FEED */}
          {activeTab === 'activity' && (
            <div className={`animate-in fade-in-50 duration-200 ${isProfileView ? 'grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto' : 'space-y-6 max-w-3xl mx-auto'}`}>
              {isProfileView && (
                /* Left Column: Intro Box (Facebook style) */
                <div className="lg:col-span-1 space-y-6 text-left">
                  <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs space-y-5">
                    <h3 className="text-sm font-black text-[#1c1b1b] tracking-tight">Intro</h3>
                    
                    <p className="text-xs text-[#594047] leading-relaxed font-medium">
                      {buyerProfile.bio || 'Premium verified B2B beauty buyer on Nexora Luxe. Active in cosmetic and skincare procurement.'}
                    </p>

                    <div className="space-y-3.5 pt-2 border-t border-[#f0edec] text-xs text-[#594047]">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-[#b90064] shrink-0" />
                        <div>
                          <span className="font-bold text-[#1c1b1b]">{buyerProfile.businessName}</span>
                          <div className="text-[10px] text-[#8c7077]">{buyerProfile.businessType}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-[#0050d6] shrink-0" />
                        <div>
                          <span className="font-bold text-[#1c1b1b]">Lives in {buyerProfile.city}, {buyerProfile.state}</span>
                          <div className="text-[10px] text-[#8c7077]">{buyerProfile.pincode}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Joined {buyerProfile.joinedDate || 'January 2024'}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                        <div>
                          <span className="font-bold text-green-700">GSTIN Verified</span>
                          <div className="font-mono text-[10px] text-[#8c7077]">{buyerProfile.gstin}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleTriggerEditProfile}
                      className="w-full py-2.5 bg-[#fcf9f8] hover:bg-[#f0edec] text-[#1c1b1b] rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#e8e8e8]"
                    >
                      Edit Intro Details
                    </button>
                  </div>

                  {/* RECENT ACTIVITY & SOURCING INTERACTIONS WIDGET */}
                  <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 shadow-xs space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#fde7f3] text-[#b90064] flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-[#1c1b1b] tracking-tight uppercase">Recent Activity</h3>
                          <div className="text-[10px] text-[#8c7077] font-semibold">RFQs, Quotes & Social Feed</div>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[9px] font-black uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                      </span>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 p-1 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8]">
                      {[
                        { id: 'all', label: 'All Activity' },
                        { id: 'rfqs', label: 'RFQs (2)' },
                        { id: 'quotes', label: 'Quotes (2)' },
                        { id: 'interactions', label: 'Social (2)' },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setProfileActivityFilter(f.id as any)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                            profileActivityFilter === f.id
                              ? 'bg-[#b90064] text-white shadow-xs'
                              : 'text-[#594047] hover:text-[#1c1b1b] hover:bg-[#f0edec]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Aggregated Activity Feed List */}
                    <div className="space-y-3 pt-1">
                      {/* 1. RFQ Item: Vitamin C Serum */}
                      {(profileActivityFilter === 'all' || profileActivityFilter === 'rfqs') && (
                        <div className="p-3 bg-[#fcf9f8] hover:bg-[#f8f5f4] rounded-xl border border-[#e8e8e8] transition-all space-y-2 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#fde7f3] text-[#b90064] flex items-center justify-center shrink-0 mt-0.5">
                                <ClipboardList className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#1c1b1b] group-hover:text-[#b90064] transition-colors leading-tight">
                                  Posted RFQ: 5,000 units Vitamin C Serum
                                </div>
                                <div className="text-[10px] text-[#8c7077] mt-0.5 flex items-center gap-1.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>2 hours ago</span>
                                  <span>•</span>
                                  <span className="font-semibold text-[#0050d6]">3 Quotes Live</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200 shrink-0 uppercase">
                              Active RFQ
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#f0edec] text-[10px]">
                            <span className="text-[#594047] font-medium">Target: ₹150 - ₹200/unit</span>
                            <button
                              onClick={() => onNavigate('rfq-tracking')}
                              className="font-bold text-[#b90064] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Compare Quotes</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. Quote Received Item: Aura Beauty Labs */}
                      {(profileActivityFilter === 'all' || profileActivityFilter === 'quotes') && (
                        <div className="p-3 bg-[#fcf9f8] hover:bg-[#f8f5f4] rounded-xl border border-[#e8e8e8] transition-all space-y-2 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0050d6] flex items-center justify-center shrink-0 mt-0.5">
                                <BarChart3 className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#1c1b1b] group-hover:text-[#0050d6] transition-colors leading-tight">
                                  Quote Received from Aura Beauty Labs
                                </div>
                                <div className="text-[10px] text-[#8c7077] mt-0.5 flex items-center gap-1.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>45 mins ago</span>
                                  <span>•</span>
                                  <span className="font-semibold text-green-700">₹185 / Unit</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-50 text-[#0050d6] border border-blue-200 shrink-0 uppercase">
                              New Quote
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#f0edec] text-[10px]">
                            <span className="text-[#594047] font-medium">Lead time: 18 working days</span>
                            <button
                              onClick={() => onNavigate('rfq-tracking')}
                              className="font-bold text-[#0050d6] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>View Proposal</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. Social Interaction: Feed Comment */}
                      {(profileActivityFilter === 'all' || profileActivityFilter === 'interactions') && (
                        <div className="p-3 bg-[#fcf9f8] hover:bg-[#f8f5f4] rounded-xl border border-[#e8e8e8] transition-all space-y-2 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                <MessageCircle className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#1c1b1b] group-hover:text-amber-700 transition-colors leading-tight">
                                  Ananya Sen (Aura Labs) commented
                                </div>
                                <div className="text-[10px] text-[#8c7077] mt-0.5 flex items-center gap-1.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>1 hour ago</span>
                                  <span>•</span>
                                  <span>On your sourcing post</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 shrink-0 uppercase">
                              Comment
                            </span>
                          </div>
                          <p className="text-[11px] text-[#594047] italic bg-white p-2 rounded-lg border border-[#f0edec] line-clamp-2">
                            "We can manufacture this for you! We specialize in custom active-ingredient serums..."
                          </p>
                          <div className="flex items-center justify-end pt-1 text-[10px]">
                            <button
                              onClick={() => {
                                setOpenCommentPostIds(prev => ({ ...prev, 'post-1': true }));
                                setProfileToast('Opened post comments thread!');
                                setTimeout(() => setProfileToast(null), 2500);
                              }}
                              className="font-bold text-[#b90064] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Reply in Feed</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 4. RFQ Item: Dropper Bottles */}
                      {(profileActivityFilter === 'all' || profileActivityFilter === 'rfqs') && (
                        <div className="p-3 bg-[#fcf9f8] hover:bg-[#f8f5f4] rounded-xl border border-[#e8e8e8] transition-all space-y-2 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#1c1b1b] group-hover:text-green-700 transition-colors leading-tight">
                                  Posted Requirement: Dropper Bottles 30ml
                                </div>
                                <div className="text-[10px] text-[#8c7077] mt-0.5 flex items-center gap-1.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>Yesterday</span>
                                  <span>•</span>
                                  <span className="font-semibold text-green-700">10,000 Units</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-green-50 text-green-700 border border-green-200 shrink-0 uppercase">
                              Packaging
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#f0edec] text-[10px]">
                            <span className="text-[#594047] font-medium">Amber glass + gold pipette</span>
                            <button
                              onClick={() => setActiveTab('rfqs')}
                              className="font-bold text-[#b90064] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Manage RFQ</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 5. Quote Updated Item: LuxeForm Cosmetics */}
                      {(profileActivityFilter === 'all' || profileActivityFilter === 'quotes') && (
                        <div className="p-3 bg-[#fcf9f8] hover:bg-[#f8f5f4] rounded-xl border border-[#e8e8e8] transition-all space-y-2 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#1c1b1b] group-hover:text-purple-700 transition-colors leading-tight">
                                  LuxeForm updated Keratin Kits Quote
                                </div>
                                <div className="text-[10px] text-[#8c7077] mt-0.5 flex items-center gap-1.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>1 day ago</span>
                                  <span>•</span>
                                  <span className="font-semibold text-purple-700">₹450 / Kit</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200 shrink-0 uppercase">
                              Updated
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#f0edec] text-[10px]">
                            <span className="text-[#594047] font-medium">MOQ: 500 kits (Custom Branding)</span>
                            <button
                              onClick={() => onNavigate('rfq-tracking')}
                              className="font-bold text-purple-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>View Terms</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 6. Social Follower Item: Dermaglow */}
                      {(profileActivityFilter === 'all' || profileActivityFilter === 'interactions') && (
                        <div className="p-3 bg-[#fcf9f8] hover:bg-[#f8f5f4] rounded-xl border border-[#e8e8e8] transition-all space-y-2 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#fde7f3] text-[#b90064] flex items-center justify-center shrink-0 mt-0.5">
                                <UserCheck className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#1c1b1b] group-hover:text-[#b90064] transition-colors leading-tight">
                                  Dermaglow India followed your Profile
                                </div>
                                <div className="text-[10px] text-[#8c7077] mt-0.5 flex items-center gap-1.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>2 days ago</span>
                                  <span>•</span>
                                  <span>Ahmedabad, Gujarat</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-pink-50 text-[#b90064] border border-pink-200 shrink-0 uppercase">
                              Network
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#f0edec] text-[10px]">
                            <span className="text-[#594047] font-medium">Cosmeceutical Manufacturer</span>
                            <button
                              onClick={() => onNavigate('supplier-directory')}
                              className="font-bold text-[#b90064] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>View Supplier</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summary Quick Stats Footnote */}
                    <div className="pt-3 border-t border-[#f0edec] flex items-center justify-between">
                      <div className="text-[10px] font-bold text-[#8c7077]">
                        <span className="text-[#b90064] font-black">08</span> Active RFQs • <span className="text-[#0050d6] font-black">03</span> Quotes
                      </div>
                      <button
                        onClick={() => onNavigate('rfq-tracking')}
                        className="text-[10px] font-black text-[#b90064] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Full RFQ Tracker</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Column: Main Feed & Create Post */}
              <div className={`${isProfileView ? 'lg:col-span-2' : ''} space-y-6`}>
              
              {/* Upgraded Post Creation Box */}
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#b90064] to-[#e6007e] text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
                    {buyerProfile.avatarUrl ? <img src={buyerProfile.avatarUrl} alt={buyerProfile.fullName} className="w-full h-full object-cover" /> : buyerProfile.fullName[0]}
                  </div>
                  
                  <form onSubmit={handleCreatePost} className="flex-1 space-y-3">
                    <input
                      type="file"
                      ref={postPhotoInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePostPhotoSelect}
                    />

                    <div className="text-xs font-black text-[#1c1b1b] tracking-tight uppercase">Create Post / Share Update</div>
                    
                    <textarea
                      rows={3}
                      value={newPostText}
                      onChange={e => setNewPostText(e.target.value)}
                      placeholder="Share a beauty sourcing requirement, salon milestone, or private label request with the Nexora community..."
                      className="w-full px-4 py-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium resize-none leading-relaxed"
                    />

                    {/* Active Media Toggle Options */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#f0edec]">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. Photo/Video Attachment Button */}
                        <button
                          type="button"
                          onClick={() => {
                            postPhotoInputRef.current?.click();
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                            mediaInputType === 'image'
                              ? 'bg-[#b90064] text-white border-[#b90064] shadow-sm'
                              : 'bg-[#fcf9f8] text-[#594047] border-[#e8e8e8] hover:bg-[#f0edec]'
                          }`}
                        >
                          <Image className="w-3.5 h-3.5" />
                          <span>{isUploadingPostPhoto ? 'Processing...' : mediaInputType === 'image' ? 'Change Photo' : 'Photo/Video'}</span>
                        </button>

                        {/* 2. Product Tag Attachment Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsTaggingProduct(!isTaggingProduct);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                            taggedProduct
                              ? 'bg-[#0050d6] text-white border-[#0050d6]'
                              : 'bg-[#fcf9f8] text-[#594047] border-[#e8e8e8] hover:bg-[#f0edec]'
                          }`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{taggedProduct ? `Product: ${taggedProduct}` : 'Product Tag'}</span>
                        </button>

                        {/* 3. B2B Requirement Attachment Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPostTag('Sourcing RFQ');
                            setNewPostText('Sourcing Requirement: Looking to procure premium, dermatologically-tested private-label Vitamin C Serums (approx. 2000 units). Must provide custom formulation, certifications, and high-density glass dropper packaging.');
                            setProfileToast('B2B Sourcing Template Loaded!');
                            setTimeout(() => setProfileToast(null), 2500);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                            postTag === 'Sourcing RFQ'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-[#fcf9f8] text-[#594047] border-[#e8e8e8] hover:bg-[#f0edec]'
                          }`}
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>Requirement Template</span>
                        </button>
                      </div>

                      {/* Tag Dropdown choice */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider">Tag:</span>
                        <select
                          value={postTag}
                          onChange={e => setPostTag(e.target.value)}
                          className="px-2.5 py-1.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[11px] font-bold text-[#1c1b1b] focus:border-[#b90064] focus:outline-hidden"
                        >
                          <option value="Buyer Update">Buyer Update</option>
                          <option value="Sourcing RFQ">Sourcing RFQ</option>
                          <option value="Milestone">Milestone</option>
                          <option value="Urgent">Urgent Requirement</option>
                        </select>
                      </div>
                    </div>

                    {/* Product Tag Predefined Picker */}
                    {isTaggingProduct && (
                      <div className="p-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl space-y-2 animate-in slide-in-from-top-1 text-left">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#e8e8e8]">
                          <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider">Select Beauty Product to Tag</span>
                          <button
                            type="button"
                            onClick={() => { setIsTaggingProduct(false); setTaggedProduct(''); }}
                            className="text-[10px] font-bold text-red-500 hover:underline"
                          >
                            Clear Product Tag
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            'Keratin Premium Hair Serum',
                            'Peptide Glow Barrier Cream',
                            'Organic Spa Facial Kit',
                            'Niacinamide Hydration Mist',
                            'Vitamin C Spot Lightener',
                            'Clinical Scalp Purifier'
                          ].map(prod => (
                            <button
                              key={prod}
                              type="button"
                              onClick={() => {
                                setTaggedProduct(prod);
                                setIsTaggingProduct(false);
                                setProfileToast(`Tagged product: ${prod}`);
                                setTimeout(() => setProfileToast(null), 2500);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                taggedProduct === prod
                                  ? 'bg-[#b90064] text-white border-[#b90064]'
                                  : 'bg-white text-[#594047] border-[#e8e8e8] hover:border-[#b90064]'
                              }`}
                            >
                              {prod}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanding input field ONLY for Videos */}
                    {mediaInputType === 'video' && (
                      <div className="pt-3 border-t border-dashed border-[#e8e8e8] space-y-2 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider">
                            Enter Video URL (YouTube Watch Link or MP4 URL)
                          </span>
                          <button 
                            type="button" 
                            onClick={() => { setMediaInputType('none'); setMediaUrlInput(''); }} 
                            className="text-[10px] font-bold text-[#b90064] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                        <input
                          type="url"
                          value={mediaUrlInput}
                          onChange={e => setMediaUrlInput(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                        />
                      </div>
                    )}

                    {/* Live validated preview */}
                    {mediaUrlInput.trim() !== '' && mediaInputType !== 'none' && (
                      <div className="mt-4 p-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl space-y-2 animate-in zoom-in-95">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#8c7077] uppercase tracking-wider pb-1.5 border-b border-[#e8e8e8]">
                          <span>{mediaInputType === 'image' ? 'Uploaded Photo Preview' : 'Live Video Preview'}</span>
                          <button 
                            type="button" 
                            onClick={() => { setMediaUrlInput(''); setMediaInputType('none'); }} 
                            className="text-red-500 hover:underline"
                          >
                            Clear Attachment
                          </button>
                        </div>
                        {mediaInputType === 'image' ? (
                          <div className="relative rounded-lg overflow-hidden border border-[#e8e8e8] bg-white max-h-48 flex items-center justify-center">
                            <img 
                              src={mediaUrlInput} 
                              alt="Live preview" 
                              className="max-h-48 object-contain" 
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg overflow-hidden border border-[#e8e8e8] bg-black aspect-video max-h-48 flex items-center justify-center">
                            {getEmbeddableVideoUrl(mediaUrlInput).includes('youtube.com/embed') ? (
                              <iframe src={getEmbeddableVideoUrl(mediaUrlInput)} className="w-full h-full max-h-48" frameBorder="0" allowFullScreen />
                            ) : (
                              <video src={mediaUrlInput} controls className="w-full h-full max-h-48 object-contain" />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Publish Submit Button */}
                    <div className="pt-3 border-t border-[#f0edec] flex justify-end">
                      <button
                        type="submit"
                        disabled={!newPostText.trim()}
                        className={`px-6 py-2.5 bg-[#b90064] text-white rounded-xl text-xs font-extrabold shadow-md hover:bg-[#8e004b] transition-all cursor-pointer flex items-center gap-1.5 ${
                          !newPostText.trim() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish Update</span>
                      </button>
                    </div>

                  </form>
                </div>
              </div>

              {/* Timeline Feed Posts */}
              <div className="space-y-6">
                {feedPosts.length > 0 ? (
                  feedPosts.map(renderPostCard)
                ) : (
                  <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center text-xs text-[#8c7077] font-bold">
                    No timeline posts yet. Be the first to share an update!
                  </div>
                )}
              </div>

              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICATIONS & ALERTS */}
          {activeTab === 'notifications' && (
            <div className="animate-in fade-in-50 duration-200">
              <NotificationCenter 
                variant="full" 
                onNavigate={(screen, params) => {
                  if (screen === 'buyer-dashboard' && params?.tab === 'notifications') {
                    setActiveTab('notifications');
                  } else {
                    onNavigate(screen, params);
                  }
                }} 
              />
            </div>
          )}

          {/* TAB 8: NETWORK / FOLLOWERS */}
          {activeTab === 'network' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-200 text-left">
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0edec] mb-6">
                  <div>
                    <h2 className="text-base font-black text-[#1c1b1b] tracking-tight">Sourcing Network & Followers</h2>
                    <p className="text-xs text-[#594047] font-medium mt-1">Connect with professional beauty suppliers, contract manufacturers, and packaging experts.</p>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsFollowersModalOpen(true)}
                      className="px-3.5 py-1.5 bg-[#fde7f3] hover:bg-[#fbc5e3] text-[#b90064] rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group"
                    >
                      <Users className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span>1,481 Followers</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    {
                      id: 'seller_aura_001',
                      name: 'Aura Beauty Labs',
                      type: 'Manufacturer & OEM',
                      location: 'Mumbai, Maharashtra',
                      logo: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=120&q=80',
                      verified: true,
                      mutualConnections: 12,
                      followersCount: '4.8k',
                      rating: '4.9',
                      responseRate: '98%',
                      category: 'Skincare Formulations'
                    },
                    {
                      id: 'seller_luxe_002',
                      name: 'LuxeForm Cosmetics',
                      type: 'Private Label Manufacturer',
                      location: 'Ahmedabad, Gujarat',
                      logo: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=120&q=80',
                      verified: true,
                      mutualConnections: 8,
                      followersCount: '3.2k',
                      rating: '4.7',
                      responseRate: '95%',
                      category: 'Premium Cosmetics'
                    },
                    {
                      id: 'seller_beautypro_003',
                      name: 'BeautyPro Manufacturing',
                      type: 'Contract Manufacturer',
                      location: 'Baddi, Himachal Pradesh',
                      logo: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=120&q=80',
                      verified: true,
                      mutualConnections: 15,
                      followersCount: '6.1k',
                      rating: '4.8',
                      responseRate: '99%',
                      category: 'Haircare & Spa'
                    },
                    {
                      id: 'buyer_dist_004',
                      name: 'Dermaglow India Wholesalers',
                      type: 'Wholesaler & Distributor',
                      location: 'Delhi NCR',
                      logo: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=120&q=80',
                      verified: true,
                      mutualConnections: 4,
                      followersCount: '1.9k',
                      rating: '4.6',
                      responseRate: '92%',
                      category: 'Clinical Dermatological Skincare'
                    }
                  ].map((item) => (
                    <div key={item.id} className="bg-[#fcf9f8] border border-[#e8e8e8] hover:border-[#b90064]/30 rounded-2xl p-5 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <img src={item.logo} alt={item.name} className="w-11 h-11 rounded-xl object-cover border border-[#e8e8e8]" />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-black text-[#1c1b1b] tracking-tight truncate flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.verified && <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                            </h3>
                            <p className="text-[10px] text-[#8c7077] font-bold uppercase tracking-wider">{item.type}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1.5 text-xs text-[#594047]">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                            <span>{item.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-[#0050d6] shrink-0" />
                            <span>Specialty: <span className="font-bold text-[#1c1b1b]">{item.category}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-[#f0edec] flex items-center justify-between gap-2">
                        <div className="text-[10px] text-[#8c7077]">
                          <div className="font-bold text-[#1c1b1b]">{item.mutualConnections} Mutual</div>
                          <div>{item.followersCount} Followers</div>
                        </div>
                        <button
                          onClick={() => {
                            onNavigate?.('supplier-chat', { supplierId: item.id });
                          }}
                          className="px-3.5 py-1.5 bg-[#b90064] hover:bg-[#8e004b] text-white rounded-xl text-[11px] font-black tracking-tight transition-all cursor-pointer"
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Edit Profile & Business Settings Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={buyerProfile}
        onSave={handleSaveProfile}
      />

      {/* Connected Followers Network Modal */}
      <FollowerNetworkModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        onNavigateSupplier={(supplierId) => {
          onNavigate('supplier-profile', { supplierId });
        }}
        onSendRFQ={(supplierName) => {
          onPostRFQ();
        }}
        onSendMessage={(supplierId) => {
          onNavigate('supplier-chat', { supplierId });
        }}
      />
    </div>
  );
};
