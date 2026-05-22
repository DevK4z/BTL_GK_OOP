'use client';

import { useEffect, useState, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id: string;
  label: string;
  value: string | number;
  suffix?: string;
  sublabel?: string;
  icon: LucideIcon;
  accent: 'blue' | 'green' | 'amber' | 'rose';
  animateValue?: boolean;
}

export default function MetricCard({
  id,
  label,
  value,
  suffix,
  sublabel,
  icon: Icon,
  accent,
  animateValue = false,
}: MetricCardProps) {
  /**
   * FIX: Animate from PREVIOUS value → NEW value (not from 0).
   * Prevents the "0.0W flash" when toggling devices.
   * Uses a ref to track the previous value across renders.
   */
  const prevValueRef = useRef<number>(typeof value === 'number' ? value : 0);
  const [animatedValue, setAnimatedValue] = useState<number>(
    typeof value === 'number' ? value : 0,
  );

  useEffect(() => {
    if (!animateValue || typeof value !== 'number') return;

    const startVal = prevValueRef.current;
    const endVal = value;
    prevValueRef.current = value; // Save for next animation

    // If values are the same, skip animation
    if (Math.abs(startVal - endVal) < 0.01) {
      setAnimatedValue(endVal);
      return;
    }

    const duration = 800; // ms
    const stepTime = 16; // ~60fps
    const steps = duration / stepTime;
    const increment = (endVal - startVal) / steps;
    let current = startVal;

    const timer = setInterval(() => {
      current += increment;
      // Check if we've reached or passed the target
      if (
        (increment > 0 && current >= endVal) ||
        (increment < 0 && current <= endVal)
      ) {
        setAnimatedValue(endVal);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.round(current * 10) / 10);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, animateValue]);

  // For non-animated or non-number values, show directly
  const displayValue =
    animateValue && typeof value === 'number' ? animatedValue : value;

  const accentMap = {
    blue: 'metric-card--blue',
    green: 'metric-card--green',
    amber: 'metric-card--amber',
    rose: 'metric-card--rose',
  };

  return (
    <div className={`metric-card ${accentMap[accent]}`} id={id}>
      <div className="metric-card__icon">
        <Icon size={24} />
      </div>
      <div className="metric-card__content">
        <span className="metric-card__label">{label}</span>
        <div className="metric-card__value">
          <span>
            {typeof displayValue === 'number'
              ? displayValue.toFixed(1)
              : displayValue}
          </span>
          {suffix && <span className="metric-card__suffix">{suffix}</span>}
        </div>
        {sublabel && (
          <span className="metric-card__sublabel">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
