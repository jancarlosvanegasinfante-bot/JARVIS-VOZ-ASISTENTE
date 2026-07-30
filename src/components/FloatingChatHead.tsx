import React, { useState, useEffect, useRef } from 'react';
import { Mic, Bot, Sparkles, Volume2, Smartphone } from 'lucide-react';

interface FloatingChatHeadProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onTap: () => void;
  accessibilityActive: boolean;
}

export const FloatingChatHead: React.FC<FloatingChatHeadProps> = ({
  isListening,
  isProcessing,
  isSpeaking,
  onTap,
  accessibilityActive,
}) => {
  // Snapped side state: 'left' or 'right'
  const [snappedSide, setSnappedSide] = useState<'left' | 'right'>('right');
  const [isDragging, setIsDragging] = useState(false);
  const [isInactive, setIsInactive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Positional states for current dragging coordinate
  const [posY, setPosY] = useState(450);
  const [posX, setPosX] = useState(300); // Temporary coordinate during active drag

  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize position based on actual screen dimensions on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.innerHeight;
      const w = window.innerWidth;
      setPosY(h - 180);
      setPosX(w - 80);
    }
  }, []);

  // Restart/reset the idle/inactivity timer
  const resetIdleTimer = () => {
    setIsInactive(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    // If we are actively listening, processing, speaking, dragging, or hovering, do not minimize
    if (isListening || isProcessing || isSpeaking || isDragging || isHovered) {
      return;
    }

    idleTimerRef.current = setTimeout(() => {
      setIsInactive(true);
    }, 4000); // Minimize after 4 seconds of absolute silence/inactivity
  };

  // Sync state changes with the idle timer
  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isListening, isProcessing, isSpeaking, isDragging, isHovered]);

  // Handle Drag Start (Mouse & Touch)
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setIsInactive(false);
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: posX,
      posY: posY
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  // Handle Dragging (Mouse & Touch)
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    const height = typeof window !== 'undefined' ? window.innerHeight : 600;
    const width = typeof window !== 'undefined' ? window.innerWidth : 400;

    // Constrain within safe vertical & horizontal viewport boundaries
    const nextY = Math.max(20, Math.min(height - 80, dragStartRef.current.posY + deltaY));
    const nextX = Math.max(10, Math.min(width - 80, dragStartRef.current.posX + deltaX));

    setPosY(nextY);
    setPosX(nextX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Handle Drag End and Snapping (Mouse & Touch)
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const width = typeof window !== 'undefined' ? window.innerWidth : 400;
    const dragThreshold = width / 2;
    const finalX = posX;

    if (finalX < dragThreshold) {
      setSnappedSide('left');
    } else {
      setSnappedSide('right');
    }

    resetIdleTimer();
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Tap action (prevent triggering if we actually dragged more than a tiny bit)
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const displacementX = Math.abs(posX - dragStartRef.current.posX);
    const displacementY = Math.abs(posY - dragStartRef.current.posY);
    if (displacementX < 8 && displacementY < 8) {
      onTap();
    }
  };

  // Compute final styles for positioning & transition
  const getPositionStyles = () => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      top: `${posY}px`,
      zIndex: 100,
      userSelect: 'none',
      touchAction: 'none',
    };

    if (isDragging) {
      baseStyle.left = `${posX}px`;
    } else {
      baseStyle.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      
      if (snappedSide === 'left') {
        baseStyle.left = '0px';
        if (isInactive) {
          // Slide 70% off-screen to the left, dimming opacity
          baseStyle.transform = 'translateX(-40px)';
          baseStyle.opacity = 0.35;
        } else {
          baseStyle.transform = 'translateX(16px)';
          baseStyle.opacity = 1;
        }
      } else {
        baseStyle.left = 'calc(100vw - 64px)';
        if (isInactive) {
          // Slide 70% off-screen to the right, dimming opacity
          baseStyle.transform = 'translateX(40px)';
          baseStyle.opacity = 0.35;
        } else {
          baseStyle.transform = 'translateX(-16px)';
          baseStyle.opacity = 1;
        }
      }
    }

    return baseStyle;
  };

  return (
    <div
      style={getPositionStyles()}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsInactive(false);
      }}
      onMouseLeave={() => {
        handleMouseUp();
        setIsHovered(false);
        resetIdleTimer();
      }}
      className={`select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} transition-all duration-500`}
    >
      {/* Main button frame - Absolutely NO external expanding orbs or rings outside button boundary */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleTap}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 ${
          isListening
            ? 'bg-gradient-to-br from-[#005a70] to-[#041a24] border-[#00f2ff] scale-95 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8),_0_0_15px_rgba(0,242,255,0.6)] ring-2 ring-[#00f2ff]/30'
            : isProcessing
            ? 'bg-gradient-to-tr from-[#241705] to-[#0d0a04] border-amber-500 scale-100 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]'
            : isSpeaking
            ? 'bg-gradient-to-tr from-[#052214] to-[#030c08] border-emerald-500 scale-100 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]'
            : 'bg-[#0a0c14]/95 border-[#00f2ff]/30 shadow-[0_6px_20px_rgba(0,0,0,0.6)] hover:scale-105 hover:border-[#00f2ff]/75 hover:shadow-[0_0_12px_rgba(0,242,255,0.35)]'
        }`}
        title="Toca para hablar con Jarvis"
      >
        {/* Sleek inner glowing border to show the pressed action */}
        <div className={`absolute inset-0.5 rounded-full border border-transparent transition-all duration-300 ${
          isListening ? 'border-[#00f2ff]/50 bg-cyan-950/25' : ''
        }`} />

        {/* Dynamic visual state representation */}
        <div className="relative z-10 text-white flex flex-col items-center justify-center">
          {isListening ? (
            /* High-tech internal audio waveform (equalizer bars) instead of expanding orbs */
            <div className="flex gap-1 items-center justify-center h-5 px-1">
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-[pulse_0.7s_infinite_ease-in-out]" />
              <span className="w-1 h-5 bg-cyan-300 rounded-full animate-[pulse_0.7s_infinite_ease-in-out_120ms]" />
              <span className="w-1 h-4 bg-cyan-400 rounded-full animate-[pulse_0.7s_infinite_ease-in-out_240ms]" />
              <span className="w-1 h-2.5 bg-cyan-500 rounded-full animate-[pulse_0.7s_infinite_ease-in-out_360ms]" />
            </div>
          ) : isProcessing ? (
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="w-6 h-6 text-emerald-300 animate-bounce" />
          ) : (
            <div className="relative">
              <Bot className="w-6 h-6 text-[#00f2ff]" />
              {/* Active breathing dot inside the robot eye or top right */}
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 ring-2 ring-[#0a0c14] animate-pulse" />
            </div>
          )}
        </div>

        {/* Accessibility Indicator Badge */}
        {accessibilityActive && !isListening && (
          <div className="absolute -bottom-1 -right-1 bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/30 text-[8px] font-mono font-black px-1.5 py-0.5 rounded shadow">
            ACC
          </div>
        )}
      </button>

      {/* Floating neat text badge preview - only visible on hover & when not minimized */}
      {!isInactive && (isHovered || isListening || isProcessing || isSpeaking) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0b0c11]/95 text-gray-300 text-[9px] font-mono tracking-wider px-2.5 py-1 rounded-lg border border-white/10 shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-300">
          {isListening
            ? '🎙️ TE ESCUCHO...'
            : isProcessing
            ? '⚙️ PROCESANDO...'
            : isSpeaking
            ? '🔊 HABLANDO...'
            : 'TOCAR PARA DICTAR'}
        </div>
      )}
    </div>
  );
};
