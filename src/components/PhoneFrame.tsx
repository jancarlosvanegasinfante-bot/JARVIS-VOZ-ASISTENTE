import React, { useState } from 'react';
import {
  MessageCircle,
  Phone,
  Music,
  BarChart3,
  Clock,
  Send,
  Globe,
  FileText,
  Wifi,
  Battery,
  ShieldCheck,
  Zap,
  Mic,
  Bot,
  Sparkles,
  Navigation,
  Headphones,
} from 'lucide-react';
import { Contact, AppItem, SystemNotification, IntentResult, SalesData } from '../types';
import { FloatingChatHead } from './FloatingChatHead';
import { VoiceModal } from './VoiceModal';
import { WhatsAppAccessibilityOverlay } from './WhatsAppAccessibilityOverlay';
import { ActionOverlay } from './ActionOverlay';
import { MotorcycleModeOverlay } from './MotorcycleModeOverlay';

interface PhoneFrameProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  setTranscript: (val: string) => void;
  startListening: () => void;
  stopListening: () => void;
  onSubmitText: (text: string) => void;
  lastIntent: IntentResult | null;
  activeWhatsAppFlow: { contactName: string; phoneNumber: string; message: string } | null;
  onCloseWhatsAppFlow: () => void;
  onCloseActionOverlay: () => void;
  accessibilityActive: boolean;
  setAccessibilityActive: (val: boolean) => void;
  salesData: SalesData;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  isListening,
  isProcessing,
  isSpeaking,
  transcript,
  setTranscript,
  startListening,
  stopListening,
  onSubmitText,
  lastIntent,
  activeWhatsAppFlow,
  onCloseWhatsAppFlow,
  onCloseActionOverlay,
  accessibilityActive,
  setAccessibilityActive,
  salesData,
}) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isMotoModeOpen, setIsMotoModeOpen] = useState(false);

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const appIconsMap: Record<string, React.ReactNode> = {
    MessageCircle: <MessageCircle className="w-5 h-5 text-white" />,
    Phone: <Phone className="w-5 h-5 text-white" />,
    Music: <Music className="w-5 h-5 text-white" />,
    BarChart3: <BarChart3 className="w-5 h-5 text-white" />,
    Clock: <Clock className="w-5 h-5 text-white" />,
    Send: <Send className="w-5 h-5 text-white" />,
    Globe: <Globe className="w-5 h-5 text-white" />,
    FileText: <FileText className="w-5 h-5 text-white" />,
  };

  const apps = [
    { name: 'WhatsApp', icon: 'MessageCircle', bg: 'bg-emerald-500', cmd: 'Enviar WhatsApp a Juan' },
    { name: 'Teléfono', icon: 'Phone', bg: 'bg-blue-500', cmd: 'Llamar a Mamá' },
    { name: 'Spotify', icon: 'Music', bg: 'bg-green-600', cmd: 'Pon música en Spotify' },
    { name: 'JANBOT', icon: 'BarChart3', bg: 'bg-indigo-600', cmd: 'Ventas de hoy Jansel Shop' },
    { name: 'Reloj', icon: 'Clock', bg: 'bg-purple-600', cmd: 'Pon alarma a las 7am' },
    { name: 'SMS', icon: 'Send', bg: 'bg-sky-500', cmd: 'Enviar SMS a Carlos' },
    { name: 'Browser', icon: 'Globe', bg: 'bg-amber-500', cmd: 'Buscar en web' },
    { name: 'Notas', icon: 'FileText', bg: 'bg-rose-500', cmd: 'Dictar una nota' },
  ];

  const handleOpenVoice = () => {
    setIsVoiceModalOpen(true);
    startListening();
  };

  const handleQuickCommand = (cmd: string) => {
    setIsVoiceModalOpen(false);
    onSubmitText(cmd);
  };

  return (
    <div className="relative w-full md:max-w-sm mx-auto h-screen md:h-[680px] bg-[#0a0a0c] md:rounded-[42px] border-0 md:border-[10px] border-[#141418] md:shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between md:ring-1 ring-white/10">
      {/* Phone Speaker & Camera Notch */}
      <div className="absolute top-0 inset-x-0 h-6 bg-[#141418] z-50 hidden md:flex items-center justify-center rounded-b-xl border-b border-white/5">
        <div className="w-16 h-3 bg-[#0a0a0c] rounded-full flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#141418]" />
        </div>
      </div>

      {/* Android Top Status Bar */}
      <div className="pt-7 px-5 pb-1 hidden md:flex items-center justify-between text-[11px] text-gray-300 font-mono font-semibold z-30 bg-gradient-to-b from-[#0a0a0c] to-transparent">
        <span>{currentTime}</span>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Wifi className="w-3.5 h-3.5 text-[#00f2ff]" />
          <span className="text-[10px] text-[#00f2ff]">5G</span>
          <Battery className="w-4 h-4 text-green-400" />
        </div>
      </div>

      {/* Screen Wallpaper Content */}
      <div className="relative flex-1 p-4 flex flex-col justify-between bg-[#0a0a0c] overflow-hidden">
        {/* Subtle glowing tech orb backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#0066ff]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Top Widget: Jarvis Status Bar */}
        <div className="bg-[#141418] border border-white/10 rounded-2xl p-3 shadow-lg z-20">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-ping" />
              <span className="text-xs font-bold text-white tracking-wider uppercase italic">Jan Jarvis Core</span>
            </div>
            <button
              onClick={() => setAccessibilityActive(!accessibilityActive)}
              className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold border transition-all flex items-center gap-1 ${
                accessibilityActive
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              {accessibilityActive ? 'ACCESIBILIDAD ACTIVE' : 'ACCESIBILIDAD OFF'}
            </button>
          </div>

          <div className="text-[11px] font-mono text-gray-300 flex items-center justify-between bg-[#0a0a0c] px-2.5 py-1.5 rounded-xl border border-white/10 mb-2">
            <span className="truncate">
              {isListening
                ? '🎙️ ESCUCHANDO COMANDO...'
                : isProcessing
                ? '⚡ PROCESANDO EN CASCADA...'
                : lastIntent
                ? `INTENT: ${lastIntent.action}`
                : 'LISTO. TOCA EL ORB FLOTANTE.'}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#00f2ff] shrink-0 ml-1" />
          </div>

          <button
            onClick={() => setIsMotoModeOpen(true)}
            className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Probador: Modo Moto Hands-Free ("Oye Jan")</span>
            </div>
            <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">
              ABRIR
            </span>
          </button>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-4 gap-3 my-auto z-10">
          {apps.map((app, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickCommand(app.cmd)}
              className="flex flex-col items-center gap-1 group transition-transform active:scale-95"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${app.bg} flex items-center justify-center shadow-lg group-hover:scale-105 transition-all border border-white/10`}
              >
                {appIconsMap[app.icon]}
              </div>
              <span className="text-[10px] font-mono text-gray-300 truncate w-full text-center">
                {app.name}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom Quick Voice Action Chips */}
        <div className="z-10 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">
            Acciones Rápidas por Voz:
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              'WhatsApp a Juan',
              'Ventas de hoy',
              'Llamar a Mamá',
              'Pon música',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickCommand(chip)}
                className="text-[10px] font-mono bg-white/5 hover:bg-white/10 text-[#00f2ff] border border-white/10 px-2.5 py-1 rounded-lg whitespace-nowrap shadow transition-colors flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-[#00f2ff]" />
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Chat Head Bubble on Screen */}
        <FloatingChatHead
          isListening={isListening}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          onTap={handleOpenVoice}
          accessibilityActive={accessibilityActive}
        />

        {/* WhatsApp Accessibility Overlay (When WhatsApp action triggers) */}
        {activeWhatsAppFlow && (
          <WhatsAppAccessibilityOverlay
            contactName={activeWhatsAppFlow.contactName}
            phoneNumber={activeWhatsAppFlow.phoneNumber}
            message={activeWhatsAppFlow.message}
            onComplete={onCloseWhatsAppFlow}
            onClose={onCloseWhatsAppFlow}
          />
        )}

        {/* Generic Action Execution Overlay (When other voice actions trigger) */}
        {lastIntent && !activeWhatsAppFlow && lastIntent.action !== 'send_whatsapp' && (
          <ActionOverlay intent={lastIntent} onClose={onCloseActionOverlay} salesData={salesData} />
        )}

        {/* Motorcycle Hands-Free Mode Overlay */}
        {isMotoModeOpen && (
          <MotorcycleModeOverlay
            onClose={() => setIsMotoModeOpen(false)}
            onRunVoiceCommand={(cmd) => {
              setIsMotoModeOpen(false);
              onSubmitText(cmd);
            }}
          />
        )}

        {/* Voice Input Modal */}
        <VoiceModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          isListening={isListening}
          isProcessing={isProcessing}
          transcript={transcript}
          setTranscript={setTranscript}
          startListening={startListening}
          stopListening={stopListening}
          onSubmitText={(txt) => {
            setIsVoiceModalOpen(false);
            onSubmitText(txt);
          }}
          lastIntent={lastIntent}
        />
      </div>

      {/* Android Bottom Navigation Bar */}
      <div className="h-6 bg-[#141418] hidden md:flex items-center justify-center z-30 border-t border-white/5">
        <div className="w-28 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
};
