import type { Dispatch, SetStateAction } from 'react';
import type { SalonData } from '../../types';
import type { ThemeId } from '../../lib/themeServices';

/** Owner dashboard tab ids (sidebar order). Screens 18–25 map onto these. */
export type DashboardTab =
  | 'overview'
  | 'website'
  | 'services'
  | 'bookings'
  | 'staff'
  | 'payments'
  | 'share'
  | 'settings'
  | 'referral'
  | 'branding';

/**
 * Public props contract of the Landing screen. This MUST stay byte-compatible
 * with the original monolith: src/App.tsx renders <Landing> at two sites and
 * must never need changes.
 */
export interface LandingProps {
  data: SalonData;
  setData: Dispatch<SetStateAction<SalonData>>;
  onNext: () => void;
  goToStep: (target: number) => void;
  onOpenStaffManagement: () => void;
  forcedActiveTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  onThemeChange?: (id: ThemeId) => void;
}

export interface Appointment {
  id: string;
  time: string;
  customerName: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  depositPaid: number;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
}

export interface DashboardNotification {
  id: string;
  text: string;
  time: string;
  read: boolean;
}
