import { Loader2 } from 'lucide-react';

/** Suspense fallback for full-screen lazy surfaces (dashboard shell, wizard steps, modules). */
export default function ScreenSkeleton({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-12" data-testid="screen-skeleton">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin text-[#ac0053]" />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}
