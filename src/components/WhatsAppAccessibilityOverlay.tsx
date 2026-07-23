import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle2, ArrowRight, ShieldCheck, Zap, X, CornerDownLeft, Sparkles } from 'lucide-react';

interface WhatsAppAccessibilityOverlayProps {
  contactName: string;
  phoneNumber: string;
  message: string;
  onComplete: () => void;
  onClose: () => void;
}

export const WhatsAppAccessibilityOverlay: React.FC<WhatsAppAccessibilityOverlayProps> = ({
  contactName,
  phoneNumber,
  message,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [typedMessage, setTypedMessage] = useState('');

  useEffect(() => {
    // Step 1 -> 2: Intent Launched, opening WhatsApp
    const timer1 = setTimeout(() => {
      setStep(2);
    }, 1000);

    return () => clearTimeout(timer1);
  }, []);

  useEffect(() => {
    if (step === 2) {
      // Step 2 -> 3: Accessibility Service detects chat window
      const timer2 = setTimeout(() => {
        setStep(3);
      }, 1200);
      return () => clearTimeout(timer2);
    }

    if (step === 3) {
      // Step 3: Simulate auto-typing letter by letter
      let currentLength = 0;
      const typeInterval = setInterval(() => {
        if (currentLength < message.length) {
          setTypedMessage(message.substring(0, currentLength + 1));
          currentLength++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setStep(4), 600);
        }
      }, 40);

      return () => clearInterval(typeInterval);
    }

    if (step === 4) {
      // Step 4 -> 5: Simulate Accessibility Tap on Send Button
      const timer4 = setTimeout(() => {
        setStep(5);
        setTimeout(() => {
          onComplete();
        }, 2000);
      }, 1000);
      return () => clearTimeout(timer4);
    }
  }, [step, message, onComplete]);

  return (
    <div className="absolute inset-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200 font-sans">
      {/* WhatsApp Header bar */}
      <div className="bg-[#141418] border border-white/10 text-white p-3 rounded-t-xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#00f2ff]/20 border border-[#00f2ff]/50 flex items-center justify-center font-mono font-bold text-xs text-[#00f2ff]">
            {contactName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-xs leading-tight text-white">{contactName}</h3>
            <p className="text-[10px] font-mono text-[#00f2ff]">{phoneNumber} • WhatsApp Personal</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Accessibility Service Automation Visualizer */}
      <div className="my-auto py-2">
        {/* Step Indicator Pills */}
        <div className="bg-[#141418] border border-white/10 rounded-xl p-3 mb-3 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-[#00f2ff] uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00f2ff]" />
              Android Accessibility Service Engine
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Paso {step} de 5</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#0a0a0c] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#00f2ff] to-green-400 transition-all duration-300 shadow-[0_0_10px_#00f2ff]"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          {/* Active Step Status Log */}
          <div className="text-xs space-y-1 font-mono">
            {step >= 1 && (
              <div className={`flex items-center gap-2 ${step === 1 ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                <Zap className="w-3.5 h-3.5" />
                <span>1. Lanzando DeepLink Intent: <code className="text-[10px] text-[#00f2ff]">wa.me/{phoneNumber}</code></span>
              </div>
            )}
            {step >= 2 && (
              <div className={`flex items-center gap-2 ${step === 2 ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>2. Inspector Accessibility: Detectado cuadro <code className="text-[10px] text-[#00f2ff]">com.whatsapp:id/entry</code></span>
              </div>
            )}
            {step >= 3 && (
              <div className={`flex items-center gap-2 ${step === 3 ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Inyectando texto por voz en tiempo real...</span>
              </div>
            )}
            {step >= 4 && (
              <div className={`flex items-center gap-2 ${step === 4 ? 'text-green-400 font-bold animate-pulse' : 'text-gray-400'}`}>
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>4. Simulando TAP en botón <code className="text-[10px] text-[#00f2ff]">com.whatsapp:id/send</code></span>
              </div>
            )}
            {step === 5 && (
              <div className="flex items-center gap-2 text-green-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>5. ¡Mensaje enviado con éxito sin tocar el celular!</span>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Chat Room Simulation Box */}
        <div className="bg-[#141418] border border-white/10 rounded-xl p-3 h-48 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Subtle Chat Wallpaper Pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#00f2ff_1px,transparent_1px)] [background-size:12px_12px]" />

          {/* Chat Messages Container */}
          <div className="relative z-10 space-y-2 overflow-y-auto">
            <div className="text-center my-1">
              <span className="text-[9px] font-mono bg-[#0a0a0c] text-gray-400 px-2 py-0.5 rounded-full border border-white/5">
                Hoy • Chat Personal WhatsApp
              </span>
            </div>

            {/* Outgoing Message Bubble */}
            <div className="flex justify-end">
              <div
                className={`max-w-[85%] rounded-2xl rounded-tr-none px-3.5 py-2 text-xs font-medium shadow-md transition-all duration-300 ${
                  step >= 3 ? 'bg-[#00f2ff] text-slate-950 font-bold scale-100 opacity-100' : 'bg-white/5 text-gray-400 scale-95 opacity-50'
                }`}
              >
                <p className="leading-snug">
                  {step >= 3 ? typedMessage || 'Escribiendo...' : 'Esperando inyección...'}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-900 font-mono font-bold">
                  <span>10:42 AM</span>
                  {step === 5 ? (
                    <span className="text-slate-950 font-black">✓✓</span>
                  ) : (
                    <span className="text-slate-800">✓</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Bottom Input Bar with Accessibility Highlight */}
          <div className="relative z-10 mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
            <div className={`flex-1 bg-[#0a0a0c] border rounded-full px-3 py-1.5 text-xs text-white transition-colors ${step === 3 ? 'border-[#00f2ff] ring-2 ring-[#00f2ff]/30' : 'border-white/10'}`}>
              <span className="text-gray-300 font-mono">{typedMessage || 'Escribe un mensaje...'}</span>
            </div>

            {/* Send Button with Tap Ripple Simulation */}
            <button
              className={`relative w-9 h-9 rounded-full flex items-center justify-center text-slate-950 font-bold transition-all ${
                step === 4 ? 'bg-[#00f2ff] scale-110 ring-4 ring-[#00f2ff]/50 shadow-[0_0_15px_#00f2ff]' : 'bg-[#00f2ff]'
              }`}
            >
              {step === 4 && (
                <span className="absolute inset-0 rounded-full bg-[#00f2ff] animate-ping opacity-75" />
              )}
              <CornerDownLeft className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="text-center pt-2">
        {step === 5 ? (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#0066ff] text-slate-950 font-bold font-mono text-xs uppercase transition-colors shadow-[0_0_20px_rgba(0,242,255,0.4)] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            Volver a la pantalla principal
          </button>
        ) : (
          <p className="text-[11px] font-mono text-gray-400">
            Automatización realizada por el servicio de accesibilidad sin requerir toque manual.
          </p>
        )}
      </div>
    </div>
  );
};
