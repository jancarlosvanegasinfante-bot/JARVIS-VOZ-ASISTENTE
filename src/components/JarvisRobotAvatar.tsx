import React from 'react';

export const JarvisRobotAvatar: React.FC<{ size?: string }> = ({ size = 'w-12 h-12' }) => {
  return (
    <div className={`relative ${size} shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#18203d] to-[#0e1329] border border-[#00f2ff]/30 p-1.5 shadow-[0_0_15px_rgba(0,242,255,0.2)]`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="botGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a3258" />
            <stop offset="100%" stopColor="#10152b" />
          </linearGradient>
          <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f2ff" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Ears/Antennas */}
        <rect x="15" y="42" width="8" height="16" rx="4" fill="#3b82f6" opacity="0.8" />
        <rect x="77" y="42" width="8" height="16" rx="4" fill="#3b82f6" opacity="0.8" />

        {/* Head Outer Shell */}
        <rect x="22" y="20" width="56" height="58" rx="20" fill="url(#botGrad)" stroke="#00f2ff" strokeWidth="2" />

        {/* Visor Screen */}
        <rect x="28" y="32" width="44" height="26" rx="10" fill="#060913" stroke="#1e293b" strokeWidth="1.5" />

        {/* Glowing Eyes */}
        <ellipse cx="40" cy="45" rx="6" ry="7" fill="url(#eyeGrad)" className="animate-pulse" />
        <ellipse cx="60" cy="45" rx="6" ry="7" fill="url(#eyeGrad)" className="animate-pulse" />

        {/* Eye Glint */}
        <circle cx="38" cy="43" r="2" fill="#ffffff" />
        <circle cx="58" cy="43" r="2" fill="#ffffff" />

        {/* Mouth/Speaker Lines */}
        <line x1="42" y1="65" x2="58" y2="65" stroke="#00f2ff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      </svg>
    </div>
  );
};
