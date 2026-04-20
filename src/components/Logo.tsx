import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo = ({ className = "h-8 w-8", size = 44 }: LogoProps) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* High-fidelity Isometric Gradients */}
          <linearGradient id="side-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.7 0.2 200)" />
            <stop offset="100%" stopColor="oklch(0.45 0.2 220)" />
          </linearGradient>
          <linearGradient id="side-lime" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.8 0.2 140)" />
            <stop offset="100%" stopColor="oklch(0.6 0.2 160)" />
          </linearGradient>
          
          {/* Lighting Overlays */}
          <linearGradient id="gloss" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Depth Filters */}
          <filter id="sharp-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="black" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Structural Hexagonal Boundary (Stadium Blueprint) */}
        <path 
          d="M50 5L90 25V75L50 95L10 75V25L50 5Z" 
          fill="var(--primary)" 
          fillOpacity="0.04"
          stroke="var(--primary)"
          strokeWidth="0.5"
          strokeOpacity="0.15"
        />

        {/* The "V" Monolith - Faceted Design */}
        {/* Left Structural Beam */}
        <g filter="url(#sharp-shadow)">
          <path d="M22 24L48 84H55L55 42L22 24Z" fill="url(#side-cyan)" />
          {/* Top Surface / Highlight */}
          <path d="M22 24L55 42V45L25 28L22 24Z" fill="white" fillOpacity="0.25" />
        </g>

        {/* Right Structural Beam */}
        <g filter="url(#sharp-shadow)">
          <path d="M78 24L52 84H45L45 42L78 24Z" fill="url(#side-lime)" />
          {/* Top Surface / Highlight */}
          <path d="M78 24L45 42V45L75 28L78 24Z" fill="white" fillOpacity="0.25" />
        </g>

        {/* The "IQ" Core - A Faceted Diamond Jewel */}
        <g filter="url(#sharp-shadow)">
          <path d="M50 28L64 42L50 56L36 42L50 28Z" fill="white" />
          <path d="M50 28V56M36 42H64" stroke="var(--primary)" strokeWidth="0.5" strokeOpacity="0.4" />
          {/* Core Glint */}
          <circle cx="50" cy="42" r="2.5" fill="var(--primary)" />
        </g>

        {/* Architectural Detailing - Seating/Data Rows */}
        <g stroke="white" strokeWidth="0.7" strokeOpacity="0.2">
          <path d="M30 35H45" />
          <path d="M70 35H55" />
          <path d="M35 48H47" />
          <path d="M65 48H53" />
        </g>

        {/* Connection Points (Precision Nodes) */}
        <circle cx="22" cy="24" r="2" fill="white" />
        <circle cx="78" cy="24" r="2" fill="white" />
        <circle cx="50" cy="84" r="3" fill="white" />

        {/* Subtle Lens Flare / Gloss */}
        <path 
          d="M25 30L45 78" 
          stroke="url(#gloss)" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeOpacity="0.3" 
        />
      </svg>
    </div>
  );
};

export default Logo;
