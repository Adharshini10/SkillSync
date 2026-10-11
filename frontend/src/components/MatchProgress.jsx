import React, { useEffect, useState } from 'react';

/**
 * Animated circular progress indicator for match percentage.
 * Renders an SVG ring with gradient stroke and centered percentage text.
 */
export default function MatchProgress({
  percentage = 0,
  size = 64,
  strokeWidth = 5.5,
  showLabel = true,
  className = '',
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Trigger smooth entrance animation on mount
    const timer = setTimeout(() => {
      setAnimatedProgress(Math.min(100, Math.max(0, percentage)));
    }, 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  // Generate unique gradient ID to prevent SVG defs collision
  const gradientId = `match-grad-${size}-${Math.round(percentage)}`;

  return (
    <div
      className={`circular-match-progress ${className}`}
      style={{ width: size, height: size }}
      title={`${percentage}% Skill Match`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          className="progress-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Progress Indicator */}
        <circle
          className="progress-bar"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {showLabel && (
        <div className="progress-center-text">
          <span className="progress-value">{Math.round(percentage)}%</span>
          <span className="progress-caption">match</span>
        </div>
      )}
    </div>
  );
}
