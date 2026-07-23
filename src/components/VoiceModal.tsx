import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Send, X, Volume2, ArrowRight } from 'lucide-react';
import { IntentResult } from '../types';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  setTranscript: (val: string) => void;
  startListening: () => void;
  stopListening: () => void;
  onSubmitText: (text: string) => void;
  lastIntent: IntentResult | null;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  isListening,
  isProcessing,
  transcript,
  setTranscript,
  startListening,
  stopListening,
  onSubmitText,
  lastIntent,
}) => {
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (transcript) {
      setManualInput(transcript);
    }
  }, [transcript]);

  if (!isOpen) return null;

  const samplePrompts = [
    'Envía un WhatsApp a Juan diciendo que llego tarde',
    'Llamar a Mamá por teléfono',
    '¿Cuánto vendió hoy Jansel Shop?',
    'Pon alarma para las 7:00 AM',
    'Lee mis notificaciones de WhatsApp',
    'Pon música en Spotify',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onSubmitText(manualInput.trim());
    }
  };

  const handleSelectSample = (promptText: string) => {
    setManualInput(promptText);
    setTranscript(promptText);
    onSubmitText(promptText);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#0a0a0c]/90 backdrop-blur-md flex flex-col justify-end p-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_8px_#00f2ff]" />
          <span className="text-xs font-bold font-mono tracking-wider uppercase text-[#00f2ff]">
            Jan Core Voice Brain v1.0
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Voice Visualizer & Transcript */}
      <div className="my-auto py-6 flex flex-col items-center text-center">
        {/* Animated Mic Sphere */}
        <div className="relative mb-6">
          {/* Wave circles */}
          {isListening && (
            <>
              <div className="absolute -inset-6 rounded-full bg-[#00f2ff]/20 animate-ping" />
              <div className="absolute -inset-12 rounded-full bg-[#00f2ff]/10 animate-pulse" />
            </>
          )}

          <button
            onClick={isListening ? stopListening : startListening}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              isListening
                ? 'bg-gradient-to-br from-[#00f2ff] to-[#0066ff] border-[#00f2ff] shadow-[0_0_35px_rgba(0,242,255,0.6)] scale-105 ring-4 ring-[#00f2ff]/30'
                : isProcessing
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-[#141418] border-[#00f2ff]/60 hover:scale-105 shadow-[0_0_25px_rgba(0,242,255,0.3)] hover:border-[#00f2ff]'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 text-slate-950 animate-bounce" />
            ) : isProcessing ? (
              <Sparkles className="w-10 h-10 text-white animate-spin" />
            ) : (
              <Mic className="w-10 h-10 text-[#00f2ff]" />
            )}
          </button>
        </div>

        {/* Dynamic Voice Bars visualizer */}
        {isListening && (
          <div className="flex items-center gap-1.5 h-8 mb-4">
            {[40, 75, 100, 60, 90, 50, 85, 65, 95, 45].map((height, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#00f2ff] rounded-full animate-pulse shadow-[0_0_6px_#00f2ff]"
                style={{
                  height: `${height}%`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Live Transcript Display */}
        <div className="min-h-[60px] max-w-xs w-full mb-4">
          <p className="text-sm font-mono text-gray-300 leading-relaxed italic">
            {transcript ? (
              `"${transcript}"`
            ) : isListening ? (
              <span className="text-[#00f2ff] animate-pulse">
                ESCUCHANDO COMANDO DE VOZ...
              </span>
            ) : isProcessing ? (
              <span className="text-amber-400 animate-pulse flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-spin" />
                Ejecutando parser de intención (Cascada LLM)...
              </span>
            ) : (
              'Presiona el micrófono o toca una frase sugerida'
            )}
          </p>
        </div>

        {/* Intent Parse Result Card (if processed) */}
        {lastIntent && !isListening && !isProcessing && (
          <div className="w-full bg-[#141418] border border-white/10 rounded-xl p-3 text-left shadow-lg mb-4 text-xs font-mono">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[#00f2ff] uppercase tracking-wider text-[10px]">
                Intención Parseada ({Math.round(lastIntent.confidence * 100)}%)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-[10px]">
                {lastIntent.action}
              </span>
            </div>
            <p className="text-gray-200 font-sans font-medium mb-1">{lastIntent.feedbackText}</p>
            <p className="text-gray-400 text-[10px] bg-[#0a0a0c] p-1.5 rounded border border-white/10">
              Params: {JSON.stringify(lastIntent.params)}
            </p>
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="mb-4">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2 block text-left">
          Ejemplos de Comandos Reales:
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {samplePrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(promptText)}
              className="text-left text-[11px] font-mono bg-[#141418] hover:bg-white/10 border border-white/10 text-gray-300 hover:text-[#00f2ff] px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1 group"
            >
              <span>{promptText}</span>
              <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-[#00f2ff] transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Manual Text Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="O escribe tu comando aquí..."
          className="flex-1 bg-[#141418] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]"
        />
        <button
          type="submit"
          disabled={!manualInput.trim() || isProcessing}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#0066ff] text-slate-950 hover:brightness-110 disabled:opacity-40 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
