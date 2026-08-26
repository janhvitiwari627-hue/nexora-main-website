import React from 'react';
import { Home, LayoutGrid, PlusCircle, MessageSquare, User } from 'lucide-react';

interface MobileBottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  isLoggedIn: boolean;
  userRole: 'buyer' | 'supplier' | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onNavigate,
  isLoggedIn,
  userRole,
  onOpenAuth
}) => {
  const getProfileRoute = () => {
    if (!isLoggedIn) return null;
    if (userRole === 'supplier') return 'supplier-portal';
    return 'buyer-dashboard';
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      onNavigate(getProfileRoute()!);
    } else {
      onOpenAuth();
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#F0EDEC] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around px-2 h-16">
        
        {/* Home */}
        <button 
          onClick={() => onNavigate('explore')}
          className="flex flex-col items-center justify-center w-16 h-full gap-1"
        >
          <Home className={`w-5 h-5 ${currentScreen === 'explore' ? 'text-[#B90064] fill-[#B90064]/10' : 'text-[#594047]'}`} strokeWidth={currentScreen === 'explore' ? 2.5 : 2} />
          <span className={`text-[10px] font-medium ${currentScreen === 'explore' ? 'text-[#B90064]' : 'text-[#594047]'}`}>
            Home
          </span>
        </button>

        {/* Categories / Directory */}
        <button 
          onClick={() => onNavigate('directory')}
          className="flex flex-col items-center justify-center w-16 h-full gap-1"
        >
          <LayoutGrid className={`w-5 h-5 ${(currentScreen === 'directory' || currentScreen === 'plp') ? 'text-[#B90064] fill-[#B90064]/10' : 'text-[#594047]'}`} strokeWidth={(currentScreen === 'directory' || currentScreen === 'plp') ? 2.5 : 2} />
          <span className={`text-[10px] font-medium ${(currentScreen === 'directory' || currentScreen === 'plp') ? 'text-[#B90064]' : 'text-[#594047]'}`}>
            Categories
          </span>
        </button>

        {/* Post RFQ - Prominent Center */}
        <button 
          onClick={() => onNavigate('post-rfq')}
          className="relative -top-5 flex flex-col items-center justify-center group"
        >
          <div className="w-14 h-14 rounded-full bg-[#B90064] shadow-lg shadow-[#B90064]/30 flex items-center justify-center text-white transition-transform active:scale-95 border-4 border-[#FCF9F8]">
            <PlusCircle className="w-6 h-6" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold text-[#1C1B1B] mt-1">Post RFQ</span>
        </button>

        {/* Chats / Enquiries */}
        <button 
          onClick={() => onNavigate('buyer-enquiry-log')}
          className="flex flex-col items-center justify-center w-16 h-full gap-1 relative"
        >
          <MessageSquare className={`w-5 h-5 ${currentScreen === 'buyer-enquiry-log' ? 'text-[#B90064] fill-[#B90064]/10' : 'text-[#594047]'}`} strokeWidth={currentScreen === 'buyer-enquiry-log' ? 2.5 : 2} />
          {/* Notification dot placeholder */}
          <span className="absolute top-2 right-4 w-2 h-2 bg-[#E6007E] rounded-full border-2 border-white"></span>
          <span className={`text-[10px] font-medium ${currentScreen === 'buyer-enquiry-log' ? 'text-[#B90064]' : 'text-[#594047]'}`}>
            Chats
          </span>
        </button>

        {/* Profile */}
        <button 
          onClick={handleProfileClick}
          className="flex flex-col items-center justify-center w-16 h-full gap-1"
        >
          <User className={`w-5 h-5 ${(currentScreen === 'buyer-dashboard' || currentScreen === 'supplier-portal') ? 'text-[#B90064] fill-[#B90064]/10' : 'text-[#594047]'}`} strokeWidth={(currentScreen === 'buyer-dashboard' || currentScreen === 'supplier-portal') ? 2.5 : 2} />
          <span className={`text-[10px] font-medium ${(currentScreen === 'buyer-dashboard' || currentScreen === 'supplier-portal') ? 'text-[#B90064]' : 'text-[#594047]'}`}>
            Profile
          </span>
        </button>

      </div>
    </div>
  );
};
