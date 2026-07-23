import React, { useState } from 'react';
import { Mic, Bot, Sparkles, Volume2 } from 'lucide-react';

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
  const [position, setPosition] = useState({ x: 20, y: 180 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(10, Math.min(260, e.clientX - dragStart.x)),
      y: Math.max(40, Math.min(520, e.clientY - dragStart.y)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="absolute z-50 select-none cursor-grab active:cursor-grabbing transition-transform duration-75"
    >
      {/* Outer Pulse Rings when active */}
      {isListening && (
        <div className="absolute -inset-3 rounded-full bg-[#00f2ff]/30 animate-ping" />
      )}
      {isProcessing && (
        <div className="absolute -inset-3 rounded-full bg-amber-500/30 animate-pulse" />
      )}
      {isSpeaking && (
        <div className="absolute -inset-3 rounded-full bg-emerald-500/30 animate-bounce" />
      )}

      {/* Main Chat Head Bubble */}
      <button
        onMouseDown={handleMouseDown}
        onClick={onTap}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
          isListening
            ? 'bg-gradient-to-br from-[#00f2ff] to-[#0066ff] border-[#00f2ff] scale-110 shadow-[0_0_30px_rgba(0,242,255,0.6)] ring-4 ring-[#00f2ff]/30'
            : isProcessing
            ? 'bg-gradient-to-tr from-amber-600 to-orange-600 border-amber-400 animate-pulse ring-4 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
            : isSpeaking
            ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 border-emerald-400 ring-4 ring-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
            : 'bg-[#141418] border-[#00f2ff]/60 hover:scale-105 hover:border-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.3)]'
        }`}
        title="Toca para hablar con Jarvis"
      >
        {/* Glow backdrop */}
        <div className="absolute inset-0 rounded-full bg-[#00f2ff]/20 blur-md" />

        {/* Dynamic Icon */}
        <div className="relative z-10 text-white flex flex-col items-center justify-center">
          {isListening ? (
            <div className="flex flex-col items-center">
              <Mic className="w-7 h-7 text-slate-950 animate-bounce" />
            </div>
          ) : isProcessing ? (
            <Sparkles className="w-7 h-7 text-amber-100 animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="w-7 h-7 text-emerald-100 animate-pulse" />
          ) : (
            <div className="relative">
              <Bot className="w-8 h-8 text-[#00f2ff]" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00f2ff] ring-2 ring-[#0a0a0c] animate-ping" />
            </div>
          )}
        </div>

        {/* Accessibility Status Badge */}
        {accessibilityActive && (
          <div className="absolute -bottom-1 -right-1 bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow">
            ACC
          </div>
        )}
      </button>

      {/* Floating tooltip preview */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#141418] text-gray-300 text-[10px] font-mono tracking-wider px-3 py-1 rounded-full border border-white/10 shadow-xl backdrop-blur-md pointer-events-none">
        {isListening
          ? '● ESCUCHANDO...'
          : isProcessing
          ? '⚡ PROCESANDO...'
          : isSpeaking
          ? '🔊 HABLANDO...'
          : 'TOCAR PARA HABLAR'}
      </div>
    </div>
  );
};
