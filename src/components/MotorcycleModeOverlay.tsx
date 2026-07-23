import React, { useState } from 'react';
import {
  Navigation,
  Headphones,
  PhoneCall,
  MessageSquare,
  Music,
  Mic,
  Volume2,
  X,
  Zap,
  CheckCircle2,
  Shield,
  Sparkles,
  PhoneOff,
  Radio,
} from 'lucide-react';
import { audioEngine } from '../utils/audioSynth';

interface MotorcycleModeOverlayProps {
  onClose: () => void;
  onRunVoiceCommand: (cmd: string) => void;
}

export const MotorcycleModeOverlay: React.FC<MotorcycleModeOverlayProps> = ({
  onClose,
  onRunVoiceCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'wake' | 'call' | 'msg' | 'music'>('wake');
  const [incomingCallActive, setIncomingCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [simulatedLog, setSimulatedLog] = useState<string>('Esperando activación "Oye Jan"...');

  // Trigger simulated incoming call
  const handleSimulateIncomingCall = () => {
    setIncomingCallActive(true);
    setCallStatus('ringing');
    setSimulatedLog('📞 LLAMADA ENTRANTE DE: Mamá (+57 300 456 7890)');
    audioEngine.playWakeChime();
    audioEngine.speak('Llamada entrante de Mamá. Di "Oye Jan, contéstale" o "Oye Jan, rechaza"');
  };

  const handleVoiceAnswerCall = () => {
    setCallStatus('connected');
    setSimulatedLog('✅ LLAMADA CONECTADA VÍA AUDÍFONOS BLUETOOTH');
    audioEngine.playSuccessPing();
    audioEngine.speak('Llamada contestada en tus audífonos. Hablando con Mamá.');
    setTimeout(() => {
      setCallStatus('ended');
      setIncomingCallActive(false);
    }, 4000);
  };

  const handleSimulateReadMessage = () => {
    setSimulatedLog('📩 LEYENDO NOTIFICACIÓN DE WHATSAPP AL OÍDO...');
    audioEngine.playSuccessPing();
    audioEngine.speak(
      'Te escribió Juan Carlos por WhatsApp a las 10:42 AM. Dijo: "Oye hermano, ¿dónde vienes? Ya estoy en el taller con la moto".'
    );
    onRunVoiceCommand('Leer notificaciones recientes');
  };

  const handleSimulatePlayMusic = () => {
    setSimulatedLog('🎵 REPRODUCIENDO SPOTIFY EN AUDÍFONOS...');
    audioEngine.playSuccessPing();
    audioEngine.speak('Reproduciendo tu lista Favoritos en Spotify.');
    onRunVoiceCommand('Pon música en Spotify');
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#0a0a0c]/98 backdrop-blur-xl flex flex-col justify-between p-4 animate-in fade-in duration-200 font-sans text-white border-4 border-amber-500/40 rounded-[32px]">
      {/* Top Banner Header */}
      <div className="bg-[#141418] border border-amber-500/30 rounded-2xl p-3 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                Modo Moto Hands-Free
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              Audífonos BT • Pantalla Apagada • "Oye Jan"
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Hands-Free Interface Content */}
      <div className="my-auto space-y-4">
        {/* Bluetooth Headset Connection Card */}
        <div className="bg-[#141418] border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-[#00f2ff] animate-pulse" />
            <span>Casco / Audífonos Bluetooth</span>
          </div>
          <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
            CONECTADO
          </span>
        </div>

        {/* Incoming Call Simulation Card */}
        {incomingCallActive ? (
          <div className="bg-gradient-to-b from-amber-500/20 to-red-500/10 border-2 border-amber-500 rounded-2xl p-4 text-center space-y-3 shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-pulse">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 mx-auto flex items-center justify-center font-bold text-xl shadow-lg">
              📞
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                LLAMADA ENTRANTE EN AUDÍFONOS
              </span>
              <h4 className="text-lg font-bold text-white">Mamá (+57 300 456 7890)</h4>
              <p className="text-xs text-gray-300 font-mono mt-1">
                {callStatus === 'ringing'
                  ? 'Di por micrófono: "Oye Jan, contéstale"'
                  : callStatus === 'connected'
                  ? 'Llamada conectada en tus audífonos'
                  : 'Llamada finalizada'}
              </p>
            </div>

            {callStatus === 'ringing' && (
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={handleVoiceAnswerCall}
                  className="px-4 py-2 bg-green-500 hover:bg-green-400 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center gap-1.5"
                >
                  <PhoneCall className="w-4 h-4" />
                  Di: "Oye Jan, contéstale"
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Hands-Free Quick Simulator Buttons for Motorcycle Riding */
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">
              Simular Comandos conduciendo con Guantes:
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleSimulateReadMessage}
                className="w-full bg-[#141418] hover:bg-white/10 border border-white/10 hover:border-[#00f2ff]/50 p-3 rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00f2ff]/20 text-[#00f2ff] flex items-center justify-center font-bold text-xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">"Oye Jan, ¿quién me escribió y qué dijo?"</h5>
                    <p className="text-[10px] text-gray-400 font-mono">Lee tus WhatsApps al oído sin mirar la pantalla</p>
                  </div>
                </div>
                <Zap className="w-4 h-4 text-[#00f2ff]" />
              </button>

              <button
                onClick={handleSimulateIncomingCall}
                className="w-full bg-[#141418] hover:bg-white/10 border border-white/10 hover:border-amber-500/50 p-3 rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Simular Llamada Entrante en Moto</h5>
                    <p className="text-[10px] text-gray-400 font-mono">Responde diciendo "Oye Jan, contéstale porfa"</p>
                  </div>
                </div>
                <Zap className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={handleSimulatePlayMusic}
                className="w-full bg-[#141418] hover:bg-white/10 border border-white/10 hover:border-green-500/50 p-3 rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">"Oye Jan, ponme Spotify en la moto"</h5>
                    <p className="text-[10px] text-gray-400 font-mono">Inicia música en segundo plano automáticamente</p>
                  </div>
                </div>
                <Zap className="w-4 h-4 text-green-400" />
              </button>

              <button
                onClick={() => {
                  setSimulatedLog('💬 ENVIANDO WHATSAPP POR VOZ DESDE LA MOTO...');
                  onRunVoiceCommand('Enviar WhatsApp a Andrés diciendo ya voy en la moto');
                }}
                className="w-full bg-[#141418] hover:bg-white/10 border border-white/10 hover:border-[#00f2ff]/50 p-3 rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00f2ff]/20 text-[#00f2ff] flex items-center justify-center font-bold text-xs">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">"Oye Jan, dile a Andrés que ya voy en camino"</h5>
                    <p className="text-[10px] text-gray-400 font-mono">Abre WhatsApp y envía el mensaje con Accessibility</p>
                  </div>
                </div>
                <Zap className="w-4 h-4 text-[#00f2ff]" />
              </button>
            </div>
          </div>
        )}

        {/* Live Simulation Feedback Console */}
        <div className="bg-[#0a0a0c] border border-white/10 rounded-xl p-2.5 text-[11px] font-mono text-[#00f2ff] flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-[#00f2ff]" />
          <span className="truncate">{simulatedLog}</span>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="bg-[#141418] border border-white/10 rounded-xl p-2.5 text-center text-[10px] font-mono text-gray-400">
        🛡️ En tu celular real (APK Android), el plugin Porcupine detecta "Oye Jan" con la pantalla apagada.
      </div>
    </div>
  );
};
