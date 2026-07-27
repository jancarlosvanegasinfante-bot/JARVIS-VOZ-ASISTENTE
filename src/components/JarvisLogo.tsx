import React, { useState } from 'react';

interface JarvisLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const JarvisLogo: React.FC<JarvisLogoProps> = ({ size = 'md', showText = true }) => {
  const [imgError, setImgError] = useState(false);
  const iconSize = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-20 h-20' : 'w-11 h-11';

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${iconSize} shrink-0 flex items-center justify-center`}>
        {/* Glow backdrop */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 blur-md opacity-75 animate-pulse" />

        {!imgError ? (
          <img
            src="/logo.png"
            alt="Jarvis Logo"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full relative z-10 border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.8)]"
          />
        ) : (
          /* Outer glowing double-ring SVG fallback */
          <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_0_12px_rgba(0,242,255,0.8)]">
            <defs>
              <linearGradient id="jarvisGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2ff" />
                <stop offset="50%" stopColor="#805ad5" />
                <stop offset="100%" stopColor="#d53f8c" />
              </linearGradient>
              <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f2ff" />
                <stop offset="100%" stopColor="#0088ff" />
              </linearGradient>
              <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>

            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#jarvisGradient)" strokeWidth="3" className="opacity-90" />
            <circle cx="50" cy="50" r="38" fill="#090b16" stroke="#13182e" strokeWidth="2" />
            <rect x="18" y="44" width="2" height="12" rx="1" fill="#00f2ff" />
            <rect x="22" y="38" width="2" height="24" rx="1" fill="#00f2ff" />
            <rect x="26" y="42" width="2" height="16" rx="1" fill="#00f2ff" />
            <rect x="30" y="35" width="2" height="30" rx="1" fill="#00f2ff" />
            <rect x="68" y="35" width="2" height="30" rx="1" fill="#a855f7" />
            <rect x="72" y="42" width="2" height="16" rx="1" fill="#a855f7" />
            <rect x="76" y="38" width="2" height="24" rx="1" fill="#a855f7" />
            <rect x="80" y="44" width="2" height="12" rx="1" fill="#a855f7" />
            <rect x="44" y="30" width="12" height="22" rx="6" fill="none" stroke="url(#cyanGrad)" strokeWidth="3" />
            <line x1="47" y1="36" x2="47" y2="44" stroke="#00f2ff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="50" y1="34" x2="50" y2="46" stroke="#00f2ff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="53" y1="36" x2="53" y2="44" stroke="#00f2ff" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 39 44 A 11 11 0 0 0 61 44" fill="none" stroke="url(#purpleGrad)" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="55" x2="50" y2="64" stroke="url(#cyanGrad)" strokeWidth="3" strokeLinecap="round" />
            <line x1="42" y1="64" x2="58" y2="64" stroke="url(#cyanGrad)" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black text-lg md:text-xl tracking-wider text-white">
              <span className="text-[#00f2ff]">J</span>ARVIS
            </span>
            <span className="font-black text-lg md:text-xl tracking-wider bg-gradient-to-r from-[#00f2ff] via-[#a855f7] to-[#d946ef] bg-clip-text text-transparent">
              VOICE
            </span>
            <span className="ml-1 text-[10px] font-mono font-bold text-[#00f2ff] bg-[#00f2ff]/10 border border-[#00f2ff]/30 px-1.5 py-0.5 rounded-full">
              v1.1.0
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#22c55e]" />
            <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase font-semibold">
              ASISTENTE INTELIGENTE DE VOZ
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
