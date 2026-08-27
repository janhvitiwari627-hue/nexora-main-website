'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface StatsCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label: string;
}

export default function StatsCounter({
  end,
  suffix = '',
  prefix = '',
  duration = 2,
  label
}: StatsCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  // Decimal targets (e.g. a 4.9 rating) keep one fractional digit while
  // integer targets count up normally (50,000 → "50,000").
  const decimals = Number.isInteger(end) ? 0 : 1;

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      setCount(progress * end);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, type: 'spring' }}
        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-nexora-pink to-nexora-pink-vibrant bg-clip-text text-transparent"
      >
        {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
      </motion.div>
      <div className="text-xs md:text-sm text-nexora-muted mt-1">{label}</div>
    </div>
  );
}
