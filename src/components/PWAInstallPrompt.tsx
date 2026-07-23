import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share2, Sparkles, Shield, Info, ArrowRight, ExternalLink } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'installed'>('idle');

  useEffect(() => {
    // Check if running in standalone PWA mode
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(inStandalone);
    if (inStandalone) {
      setInstallState('installed');
      setShowBanner(false);
      return;
    }

    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);

      // Auto-trigger native prompt once after short delay if on mobile
      const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      if (isMobile) {
        setTimeout(() => {
          setShowModal(true);
        }, 1200);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Custom event listener for manual trigger button in header
    const handleOpenInstall = () => {
      setShowModal(true);
    };
    window.addEventListener('open-pwa-install', handleOpenInstall);

    // Detect when app gets installed
    window.addEventListener('appinstalled', () => {
      setInstallState('installed');
      setShowModal(false);
      setShowBanner(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstallState('installing');
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallState('installed');
          setShowModal(false);
          setShowBanner(false);
        } else {
          setInstallState('idle');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error triggering install:', err);
        setInstallState('idle');
      }
    } else {
      // Fallback modal guides step-by-step
      setShowModal(true);
    }
  };

  if (isStandalone || installState === 'installed') return null;

  return (
    <>
      {/* Floating Bottom Quick Install Bar */}
      {showBanner && (
        <div className="fixed inset-x-0 bottom-4 z-[90] px-4 flex justify-center pointer-events-none animate-in slide-in-from-bottom duration-300">
          <div className="pointer-events-auto w-full max-w-md bg-[#12121a]/95 backdrop-blur-2xl border border-[#00f2ff]/40 rounded-2xl p-3.5 shadow-[0_0_30px_rgba(0,242,255,0.3)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 rounded-xl bg-[#0a0a0f] border border-[#00f2ff]/60 p-1 flex-shrink-0 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)]">
                <img src="/icon-192.png" alt="JARVIS Logo" className="w-full h-full object-contain rounded-lg" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00f2ff] border-2 border-[#12121a] flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-black" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white truncate">JARVIS Voice App</h4>
                  <span className="text-[9px] bg-[#00f2ff]/20 text-[#00f2ff] px-1.5 py-0.2 rounded font-mono font-bold">PWA</span>
                </div>
                <p className="text-[11px] text-gray-300 truncate">Instalar aplicación nativa con ícono</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-[#00f2ff] to-[#0088ff] hover:from-[#33f5ff] hover:to-[#1a94ff] text-black font-extrabold text-xs uppercase px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,242,255,0.4)] active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5 stroke-[3]" />
                <span>Instalar</span>
              </button>

              <button
                onClick={() => setShowBanner(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main App Store Style Native Installation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#141420] border-t sm:border border-[#00f2ff]/40 rounded-t-3xl sm:rounded-3xl p-6 shadow-[0_0_50px_rgba(0,242,255,0.35)] relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00f2ff]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* App Header Card */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-5">
              <div className="relative w-20 h-20 rounded-2xl bg-[#0a0a0f] border-2 border-[#00f2ff] p-2 flex-shrink-0 flex items-center justify-center shadow-[0_0_25px_rgba(0,242,255,0.5)]">
                <img src="/icon-512.png" alt="JARVIS Logo" className="w-full h-full object-contain rounded-xl" />
                <span className="absolute -bottom-1 -right-1 bg-[#00f2ff] text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shadow-md">
                  NATIVO
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-[#00f2ff]/15 text-[#00f2ff] px-2 py-0.5 rounded border border-[#00f2ff]/30 font-bold">
                    Aplicación Web Nativa (PWA)
                  </span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight mt-1">
                  JARVIS Voice Assistant
                </h2>
                <p className="text-xs text-cyan-200 mt-0.5">
                  Asistente IA por Voz e Intención
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1 text-green-400 font-semibold">
                    <Shield className="w-3.5 h-3.5" /> Verificado
                  </span>
                  <span>•</span>
                  <span>v1.0.4</span>
                  <span>•</span>
                  <span>1.8 MB</span>
                </div>
              </div>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-2 gap-2.5 my-4 text-xs text-gray-300">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00f2ff]" />
                <span>Ícono directo en pantalla</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Modo Pantalla Completa</span>
              </div>
            </div>

            {/* Direct Action Button */}
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                disabled={installState === 'installing'}
                className="w-full py-4 bg-gradient-to-r from-[#00f2ff] via-[#00a2ff] to-[#0066ff] hover:brightness-110 text-black font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(0,242,255,0.5)] flex items-center justify-center gap-2 active:scale-[0.98] transition"
              >
                <Download className="w-5 h-5 stroke-[3]" />
                <span>{installState === 'installing' ? 'Instalando...' : 'INSTALAR JARVIS AHORA'}</span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleInstall}
                  className="w-full py-3.5 bg-gradient-to-r from-[#00f2ff] to-[#0088ff] hover:brightness-110 text-black font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,242,255,0.4)] flex items-center justify-center gap-2 active:scale-95 transition"
                >
                  <Download className="w-4 h-4 stroke-[3]" />
                  <span>DESCARGAR / AGREGAR A PANTALLA</span>
                </button>

                {/* Manual step instructions depending on OS */}
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00f2ff] uppercase tracking-wide">
                    <Info className="w-4 h-4" />
                    <span>Instrucciones de Instalación Manual</span>
                  </div>

                  {isIOS ? (
                    <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside">
                      <li>En tu iPhone / Safari, toca el botón <b>Compartir</b> <Share2 className="w-3.5 h-3.5 inline text-[#00f2ff]" /> abajo.</li>
                      <li>Desplázate y selecciona <b>"Agregar a inicio"</b> (Add to Home Screen).</li>
                      <li>Confirma y verás el ícono de JARVIS instalado en tu teléfono.</li>
                    </ol>
                  ) : (
                    <ol className="text-xs text-gray-300 space-y-2.5">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#00f2ff]/20 text-[#00f2ff] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                        <span>Abre el menú de tu navegador (los <b>3 puntos ⋮</b> en Chrome/Edge).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#00f2ff]/20 text-[#00f2ff] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                        <span>Selecciona <b>"Instalar aplicación"</b> o <b>"Agregar a la pantalla principal"</b>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#00f2ff]/20 text-[#00f2ff] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                        <span>¡Listo! Se guardará con el ícono azul de JARVIS en tus aplicaciones.</span>
                      </li>
                    </ol>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowModal(false)}
                className="text-xs text-gray-400 hover:text-white underline"
              >
                Continuar usando en el navegador
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
