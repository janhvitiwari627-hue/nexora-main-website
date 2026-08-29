import { lazy, Suspense } from 'react';
import WelcomeScreen from './landing/WelcomeScreen';
import ScreenSkeleton from './landing/ScreenSkeleton';
import type { LandingProps } from './landing/types';

/**
 * Landing — public entry for both the pre-publish welcome page and the
 * published owner dashboard. The dashboard shell (and every owner tab behind
 * it) is code-split and only downloaded once the site is published, so the
 * public landing path never pulls owner screens.
 *
 * Props contract is byte-compatible with the pre-refactor monolith —
 * src/App.tsx renders this at two sites without changes.
 */
const DashboardScreen = lazy(() => import('./landing/DashboardScreen'));

export default function Landing({ data, setData, onNext, goToStep, onOpenStaffManagement, forcedActiveTab, onTabChange, onThemeChange }: LandingProps) {
  // If not published, render the initial welcome page
  if (data.publishState !== 'published') {
    return <WelcomeScreen onNext={onNext} />;
  }

  return (
    <Suspense fallback={<ScreenSkeleton label="Loading dashboard…" />}>
      <DashboardScreen
        data={data}
        setData={setData}
        onNext={onNext}
        goToStep={goToStep}
        onOpenStaffManagement={onOpenStaffManagement}
        forcedActiveTab={forcedActiveTab}
        onTabChange={onTabChange}
        onThemeChange={onThemeChange}
      />
    </Suspense>
  );
}
