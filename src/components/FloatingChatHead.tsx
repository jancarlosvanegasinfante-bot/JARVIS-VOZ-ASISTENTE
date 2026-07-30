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
  const [posY, setPosY] = useState(240);
  const [posX, setPosX] = useState(300); // Temporary coordinate during active drag

  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    
    const currentX = snappedSide === 'left' ? 12 : 300; // approximation of boundary
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: isDragging ? posX : currentX,
      posY: posY
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Handle Dragging (Mouse & Touch)
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    // Constrain Y position within safe vertical phone boundaries (40px to 540px)
    const nextY = Math.max(60, Math.min(520, dragStartRef.current.posY + deltaY));
    const nextX = dragStartRef.current.posX + deltaX;

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

    // If dragged, snap to closest edge based on final horizontal position
    // Center point of mock phone screen width (~320px inside frame) is around 160px
    const dragThreshold = 160;
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
    // If the drag displacement is very small, count as a tap
    const displacementX = Math.abs(posX - dragStartRef.current.posX);
    const displacementY = Math.abs(posY - dragStartRef.current.posY);
    if (displacementX < 8 && displacementY < 8) {
      onTap();
    }
  };

  // Compute final styles for positioning & transition
  const getPositionStyles = () => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${posY}px`,
      zIndex: 50,
      userSelect: 'none',
      touchAction: 'none',
    };

    if (isDragging) {
      // Free positioning during active drag
      baseStyle.left = `${Math.max(10, Math.min(270, posX))}px`;
    } else {
      // Snapped alignment with smooth animated transitions
      baseStyle.transition = 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
      
      if (snappedSide === 'left') {
        baseStyle.left = '12px';
        if (isInactive) {
          // Hide half of the bubble off-screen to the left
          baseStyle.transform = 'translateX(-34px)';
          baseStyle.opacity = 0.35;
        } else {
          baseStyle.transform = 'translateX(0)';
          baseStyle.opacity = 1;
        }
      } else {
        baseStyle.left = 'calc(100% - 76px)'; // 64px width + 12px margin
        if (isInactive) {
          // Hide half of the bubble off-screen to the right
          baseStyle.transform = 'translateX(34px)';
          baseStyle.opacity = 0.35;
        } else {
          baseStyle.transform = 'translateX(0)';
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
      className={`select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} transition-opacity duration-300`}
    >
      {/* Glow aura (grows beautifully without radiating/pinging rings) */}
      <div 
        className={`absolute inset-0 rounded-full bg-[#00f2ff]/20 blur-xl transition-all duration-500 ${
          isListening ? 'scale-125 opacity-70 bg-[#00f2ff]/30' : 
          isProcessing ? 'scale-110 opacity-60 bg-amber-500/20' : 
          isSpeaking ? 'scale-115 opacity-60 bg-emerald-500/20' : 'scale-90 opacity-40'
        }`} 
      />

      {/* Main button frame */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleTap}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 ${
          isListening
            ? 'bg-gradient-to-br from-[#0c162b] to-[#040914] border-[#00f2ff] scale-92 shadow-[inset_0_4px_12px_rgba(0,0,0,0.7),_0_0_20px_rgba(0,242,255,0.4)] ring-2 ring-[#00f2ff]/40'
            : isProcessing
            ? 'bg-gradient-to-tr from-[#241705] to-[#0d0a04] border-amber-500 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse'
            : isSpeaking
            ? 'bg-gradient-to-tr from-[#052214] to-[#030c08] border-emerald-500 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            : 'bg-[#0e1017]/95 border-[#00f2ff]/35 shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:scale-105 hover:border-[#00f2ff]/80 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)]'
        }`}
        title="Toca para hablar con Jarvis"
      >
        {/* Breathing ambient ring */}
        <div className={`absolute inset-0 rounded-full border-2 border-transparent transition-all duration-500 ${
          isListening ? 'border-[#00f2ff] animate-pulse' : ''
        }`} />

        {/* Dynamic visual state representation */}
        <div className="relative z-10 text-white flex flex-col items-center justify-center">
          {isListening ? (
            /* High-tech audio waveform (equalizer bars) instead of expanding orbs */
            <div className="flex gap-1 items-center justify-center h-5 px-1">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-full animate-[pulse_0.8s_infinite_ease-in-out]" />
              <span className="w-1.5 h-5 bg-cyan-300 rounded-full animate-[pulse_0.8s_infinite_ease-in-out_150ms]" />
              <span className="w-1.5 h-4 bg-cyan-400 rounded-full animate-[pulse_0.8s_infinite_ease-in-out_300ms]" />
              <span className="w-1.5 h-2.5 bg-cyan-500 rounded-full animate-[pulse_0.8s_infinite_ease-in-out_450ms]" />
            </div>
          ) : isProcessing ? (
            <Sparkles className="w-7 h-7 text-amber-300 animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="w-7 h-7 text-emerald-300 animate-bounce" />
          ) : (
            <div className="relative">
              <Bot className="w-7 h-7 text-[#00f2ff]" />
              {/* Active breathing dot inside the robot eye or top right */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0e1017] animate-pulse" />
            </div>
          )}
        </div>

        {/* Accessibility Indicator Badge */}
        {accessibilityActive && !isListening && (
          <div className="absolute -bottom-1 -right-1 bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/30 text-[8px] font-mono font-black px-1 py-0.2 rounded-md shadow">
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
