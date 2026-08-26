import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  currentScreen: string;
  onNavigate: (screen: any) => void;
  params?: any;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentScreen, onNavigate, params }) => {
  // Map screen IDs to user-friendly labels
  const screenLabels: Record<string, string> = {
    'explore': 'Home',
    'directory': 'Category Catalog',
    'supplier-directory': 'Suppliers',
    'plp': 'Products',
    'product-detail': 'Product Detail',
    'search-results': 'Search',
    'brands': 'Brands',
    'oem-hub': 'OEM / Private Label',
    'supplier-profile': 'Supplier Profile',
    'onboarding': 'Supplier Onboarding',
    'supplier-portal': 'Supplier Portal',
    'supplier-verification': 'Verification',
    'buyer-dashboard': 'Dashboard',
    'rfq-tracking': 'RFQ Tracking',
    'sample-request': 'Sample Request',
    'post-rfq': 'Post Requirement',
    'buyer-enquiry-log': 'Enquiry Log'
  };

  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'Home', screen: 'explore' }];

    if (currentScreen === 'explore') return [];

    // Define hierarchies
    if (currentScreen === 'plp' || currentScreen === 'directory') {
      crumbs.push({ label: 'Marketplace', screen: 'directory' });
      crumbs.push({ label: screenLabels[currentScreen], screen: currentScreen });
    } else if (currentScreen === 'search-results') {
      crumbs.push({ label: 'Search Results', screen: 'search-results' });
    } else if (currentScreen === 'product-detail') {
      crumbs.push({ label: 'Products', screen: 'plp' });
      crumbs.push({ label: params?.productName || 'Detail', screen: 'product-detail' });
    } else if (currentScreen === 'supplier-profile') {
      crumbs.push({ label: 'Suppliers', screen: 'supplier-directory' });
      crumbs.push({ label: params?.supplierName || 'Profile', screen: 'supplier-profile' });
    } else if (currentScreen === 'supplier-directory') {
      crumbs.push({ label: 'Marketplace', screen: 'directory' });
      crumbs.push({ label: 'Suppliers', screen: 'supplier-directory' });
    } else if (currentScreen === 'brands' || currentScreen === 'oem-hub') {
      crumbs.push({ label: 'Solutions', screen: 'directory' });
      crumbs.push({ label: screenLabels[currentScreen], screen: currentScreen });
    } else if (currentScreen.startsWith('supplier-') || currentScreen === 'onboarding') {
      crumbs.push({ label: 'Supplier Portal', screen: 'supplier-portal' });
      if (currentScreen !== 'supplier-portal') {
        crumbs.push({ label: screenLabels[currentScreen], screen: currentScreen });
      }
    } else if (currentScreen.startsWith('buyer-') || currentScreen === 'rfq-tracking' || currentScreen === 'sample-request' || currentScreen === 'post-rfq') {
      crumbs.push({ label: 'Buyer Dashboard', screen: 'buyer-dashboard' });
      if (currentScreen !== 'buyer-dashboard') {
        crumbs.push({ label: screenLabels[currentScreen], screen: currentScreen });
      }
    } else {
      crumbs.push({ label: screenLabels[currentScreen] || currentScreen, screen: currentScreen });
    }

    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1.5 text-[11px] md:text-[12px] font-medium text-[#594047] mb-4 md:mb-6 px-4 md:px-8 max-w-[1440px] mx-auto w-full overflow-x-auto whitespace-nowrap scrollbar-hide py-2">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={crumb.screen + index}>
          {index > 0 && <ChevronRight className="w-3 h-3 text-[#E8DFE3] shrink-0" />}
          <button
            onClick={() => onNavigate(crumb.screen)}
            className={`transition-colors hover:text-[#B90064] ${
              index === crumbs.length - 1 ? 'text-[#B90064] font-bold' : ''
            }`}
          >
            {crumb.label === 'Home' ? (
              <Home className="w-3.5 h-3.5" />
            ) : (
              crumb.label
            )}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};
