import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share2, Sparkles, Shield, ArrowDown } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setShowPrompt(true);

      // Try automatic prompt immediately if possible
      setTimeout(() => {
        try {
          installEvent.prompt();
        } catch (err) {
          console.log('Auto prompt postponed:', err);
        }
      }, 1000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }

    // Show prompt automatically after 1.5s on mobile if not standalone
    const timer = setTimeout(() => {
      const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      if (isMobile && !isStandalone) {
        setShowPrompt(true);
      }
    }, 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted PWA installation');
          setIsInstalled(true);
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    } else if (isIOS) {
      alert('En tu iPhone: toca el botón Compartir (cuadrado con flecha hacia arriba) y luego selecciona "Agregar a la pantalla de inicio".');
    } else {
      // Fallback for browsers that don't support beforeinstallprompt directly or already dismissed
      alert('Para instalar JARVIS:\n1. Toca el menú de opciones de tu navegador (⋮ en Android / Compartir en iOS).\n2. Selecciona "Instalar Aplicación" o "Agregar a la Pantalla Principal".');
    }
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6 pointer-events-none flex justify-center animate-in slide-in-from-bottom duration-500">
      <div className="pointer-events-auto w-full max-w-lg bg-[#14141d]/95 backdrop-blur-xl border border-[#00f2ff]/40 rounded-3xl p-5 shadow-[0_0_40px_rgba(0,242,255,0.25)] relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-[#00f2ff]/15 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={() => setShowPrompt(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00f2ff]/20 to-[#0066ff]/30 border border-[#00f2ff] flex items-center justify-center text-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.4)]">
            <Smartphone className="w-7 h-7" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00f2ff] rounded-full border-2 border-[#14141d] flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-black" />
            </span>
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase bg-[#00f2ff]/15 text-[#00f2ff] px-2 py-0.5 rounded-full border border-[#00f2ff]/30 font-bold">
                Instalación Nativa
              </span>
              <span className="text-[10px] text-gray-400 font-mono">PWA Android / iOS</span>
            </div>
            
            <h3 className="text-base font-bold text-white mt-1">
              Descargar App JARVIS
            </h3>
            
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Instala la aplicación nativa en tu teléfono para acceder directo desde tu pantalla de inicio con respuesta por voz instantánea.
            </p>

            {isIOS ? (
              <div className="mt-3 p-2.5 bg-white/5 rounded-xl border border-white/10 text-[11px] text-cyan-200 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#00f2ff] flex-shrink-0" />
                <span>Toca <b>Compartir</b> y elige <b>"Agregar a inicio"</b></span>
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-[#00f2ff] to-[#0088ff] hover:from-[#33f5ff] hover:to-[#1a94ff] text-black font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.4)] active:scale-95 transition"
              >
                <Download className="w-4 h-4 text-black stroke-[3]" />
                <span>DESCARGAR / INSTALAR AHORA</span>
              </button>

              <button
                onClick={() => setShowPrompt(false)}
                className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition"
              >
                Luego
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
