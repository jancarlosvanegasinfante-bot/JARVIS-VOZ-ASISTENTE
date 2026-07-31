import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { WhatsAppAccessibilityOverlay } from './components/WhatsAppAccessibilityOverlay';
import { FloatingChatHead } from './components/FloatingChatHead';
import { INITIAL_CONTACTS, INITIAL_SALES_DATA } from './data/mockData';
import { Contact, CommandLog, IntentResult, SalesData } from './types';
import { audioEngine } from './utils/audioSynth';

// Puente hacia la app nativa de Android (solo existe cuando corres dentro
// del APK de Jarvis; en el navegador normal simplemente no está definido
// y todo sigue funcionando igual que ahora).
declare global {
  interface Window {
    AndroidBridge?: {
      executeAction: (json: string) => void;
      isAccessibilityEnabled: () => boolean;
      openAccessibilitySettings: () => void;
      getContacts?: () => string;
      getInstalledApps?: () => string;
      getLatestNotification?: () => string;
      answerPhoneCall?: () => boolean;
      speak?: (text: string) => void;
      startListening?: () => void;
      stopListening?: () => void;
      resolveContactPhone?: (name: string) => string;
      setProactiveMode?: (enabled: boolean) => void;
      isProactiveModeEnabled?: () => boolean;
      openSpotify?: (track: string) => void;
      startFloatingButton?: () => void;
      stopFloatingButton?: () => void;
    };
    updateAndroidContacts?: (contactsJson: string) => void;
    updateAndroidApps?: (appsJson: string) => void;
    onNativeTranscript?: (text: string) => void;
    onNativePartialTranscript?: (text: string) => void;
    onNativeListeningState?: (isListening: boolean) => void;
    onNativeError?: (error: string) => void;
  }
}

export default function App() {
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // App Data State
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('jarvis_contacts') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("localStorage is not available inside the Android WebView:", e);
    }
    return INITIAL_CONTACTS;
  });

  const [installedApps, setInstalledApps] = useState<any[]>(() => [
    { id: 'app_01', name: 'WA Business', category: 'Social', packageName: 'com.whatsapp.w4b', color: 'bg-emerald-600', actions: ['Enviar mensaje', 'Leer chat'] },
    { id: 'app_02', name: 'WhatsApp', category: 'Social', packageName: 'com.whatsapp', color: 'bg-emerald-500', actions: ['Enviar mensaje por voz', 'Llamada'] },
    { id: 'app_03', name: 'Telegram', category: 'Social', packageName: 'org.telegram.messenger', color: 'bg-sky-500', actions: ['Abrir Telegram', 'Enviar mensaje'] },
    { id: 'app_04', name: 'TikTok', category: 'Social', packageName: 'com.zhiliaoapp.musically', color: 'bg-slate-900', actions: ['Abrir TikTok', 'Ver tendencias'] },
    { id: 'app_05', name: 'Instagram', category: 'Social', packageName: 'com.instagram.android', color: 'bg-pink-600', actions: ['Abrir Instagram', 'Ver Reels'] },
    { id: 'app_06', name: 'Facebook', category: 'Social', packageName: 'com.facebook.lite', color: 'bg-blue-600', actions: ['Abrir Facebook', 'Ver noticias'] },
    { id: 'app_07', name: 'Messenger', category: 'Social', packageName: 'com.facebook.orca', color: 'bg-blue-500', actions: ['Abrir Messenger'] },
    { id: 'app_08', name: 'Discord', category: 'Social', packageName: 'com.discord', color: 'bg-indigo-600', actions: ['Abrir Discord'] },
    { id: 'app_09', name: 'Nequi Colombia', category: 'Finanzas', packageName: 'com.nequi.MobileApp', color: 'bg-fuchsia-700', actions: ['Abrir Nequi', 'Consultar saldo', 'Enviar plata'] },
    { id: 'app_10', name: 'DaviPlata', category: 'Finanzas', packageName: 'com.davivienda.daviplataapp', color: 'bg-red-600', actions: ['Abrir DaviPlata', 'Pasar plata'] },
    { id: 'app_11', name: 'Nu (Nubank)', category: 'Finanzas', packageName: 'com.nu.production', color: 'bg-purple-700', actions: ['Abrir Nu', 'Ver tarjeta de crédito'] },
    { id: 'app_12', name: 'AV Villas', category: 'Finanzas', packageName: 'com.grupoaval.avvillas', color: 'bg-red-700', actions: ['Abrir banco AV Villas'] },
    { id: 'app_13', name: 'MetaTrader 5', category: 'Finanzas', packageName: 'net.metaquotes.metatrader5', color: 'bg-blue-800', actions: ['Abrir MetaTrader 5', 'Ver Forex'] },
    { id: 'app_14', name: 'Billetera Google', category: 'Finanzas', packageName: 'com.google.android.apps.walletnfcrel', color: 'bg-cyan-600', actions: ['Pago sin contacto'] },
    { id: 'app_15', name: 'Dropi', category: 'Finanzas', packageName: 'com.dropi.co', color: 'bg-orange-500', actions: ['Abrir Dropi e-commerce'] },
    { id: 'app_16', name: 'Jansel AI', category: 'Finanzas', packageName: 'com.jansel.shop', color: 'bg-indigo-900', actions: ['Métricas de tienda'] },
    { id: 'app_17', name: 'Anuncios Meta', category: 'Finanzas', packageName: 'com.facebook.ads.manager', color: 'bg-blue-700', actions: ['Ver campañas Meta Ads'] },
    { id: 'app_18', name: 'ChatGPT', category: 'IA & Dev', packageName: 'com.openai.chatgpt', color: 'bg-teal-600', actions: ['Preguntar a ChatGPT', 'Dictar consulta IA'] },
    { id: 'app_19', name: 'Claude AI', category: 'IA & Dev', packageName: 'com.anthropic.claude', color: 'bg-amber-700', actions: ['Abrir Claude IA'] },
    { id: 'app_20', name: 'Gemini', category: 'IA & Dev', packageName: 'com.google.android.apps.bard', color: 'bg-cyan-600', actions: ['Abrir Google Gemini'] },
    { id: 'app_21', name: 'Janads IA', category: 'IA & Dev', packageName: 'com.janads.ia', color: 'bg-purple-900', actions: ['Abrir Janads IA'] },
    { id: 'app_22', name: 'AI Studio', category: 'IA & Dev', packageName: 'com.google.aistudio', color: 'bg-blue-600', actions: ['Abrir AI Studio'] },
    { id: 'app_23', name: 'Cursor IDE', category: 'IA & Dev', packageName: 'com.cursor.app', color: 'bg-slate-800', actions: ['Abrir Cursor'] },
    { id: 'app_24', name: 'Vercel', category: 'IA & Dev', packageName: 'com.vercel.app', color: 'bg-black', actions: ['Ver deployments Vercel'] },
    { id: 'app_25', name: 'Supabase', category: 'IA & Dev', packageName: 'com.supabase.app', color: 'bg-emerald-700', actions: ['Ver base de datos'] },
    { id: 'app_26', name: 'DiDi', category: 'Movilidad', packageName: 'com.didiglobal.passenger', color: 'bg-orange-600', actions: ['Pedir carro en DiDi', 'Pedir comida'] },
    { id: 'app_27', name: 'DiDi Conductor', category: 'Movilidad', packageName: 'com.didiglobal.driver', color: 'bg-orange-700', actions: ['Modo conductor'] },
    { id: 'app_28', name: 'inDrive', category: 'Movilidad', packageName: 'sinet.mobile.agsi', color: 'bg-lime-600', actions: ['Pedir viaje inDrive'] },
    { id: 'app_29', name: 'Waze', category: 'Movilidad', packageName: 'com.waze', color: 'bg-sky-400', actions: ['Navegar con Waze', 'Reportar tráfico'] },
    { id: 'app_30', name: 'Google Maps', category: 'Movilidad', packageName: 'com.google.android.apps.maps', color: 'bg-rose-500', actions: ['Buscar dirección', 'Ruta a casa'] },
    { id: 'app_31', name: 'YouTube', category: 'Media', packageName: 'com.google.android.youtube', color: 'bg-red-600', actions: ['Buscar video', 'Reproducir música'] },
    { id: 'app_32', name: 'Spotify', category: 'Media', packageName: 'com.spotify.music', color: 'bg-emerald-500', actions: ['Reproducir música', 'Buscar canción'] },
    { id: 'app_33', name: 'YT Music', category: 'Media', packageName: 'com.google.android.apps.youtube.music', color: 'bg-red-700', actions: ['Escuchar canciones'] },
    { id: 'app_34', name: 'Snaptube', category: 'Media', packageName: 'com.snaptube.premium', color: 'bg-amber-500', actions: ['Descargar video/música'] },
    { id: 'app_35', name: 'DramaBox', category: 'Media', packageName: 'com.storymatrix.drama', color: 'bg-rose-600', actions: ['Ver miniserie'] },
    { id: 'app_36', name: 'DramaWave', category: 'Media', packageName: 'com.dramawave.app', color: 'bg-pink-600', actions: ['Ver novenas cortas'] },
    { id: 'app_37', name: 'GoodShort', category: 'Media', packageName: 'com.goodshort.drama', color: 'bg-red-500', actions: ['Ver series GoodShort'] },
    { id: 'app_38', name: 'NetShort', category: 'Media', packageName: 'com.netshort.app', color: 'bg-orange-600', actions: ['Ver NetShort'] },
    { id: 'app_39', name: 'Cámara', category: 'Sistema', packageName: 'com.android.camera', color: 'bg-pink-600', actions: ['Tomar foto', 'Grabar video'] },
    { id: 'app_40', name: 'Galería', category: 'Sistema', packageName: 'com.sec.android.gallery3d', color: 'bg-fuchsia-600', actions: ['Abrir fotos', 'Ver imágenes'] },
    { id: 'app_41', name: 'Calculadora', category: 'Sistema', packageName: 'com.miui.calculator', color: 'bg-orange-500', actions: ['Abrir calculadora'] },
    { id: 'app_42', name: 'Reloj', category: 'Sistema', packageName: 'com.android.deskclock', color: 'bg-slate-800', actions: ['Poner alarma', 'Pon temporizador'] },
    { id: 'app_43', name: 'Bloc De Notas', category: 'Sistema', packageName: 'com.miui.notes', color: 'bg-amber-500', actions: ['Dictar nota rápida', 'Ver notas'] },
    { id: 'app_44', name: 'Calendario', category: 'Sistema', packageName: 'com.google.android.calendar', color: 'bg-blue-500', actions: ['Agendar evento', 'Ver agenda'] },
    { id: 'app_45', name: 'CamScanner', category: 'Sistema', packageName: 'com.intsig.camscanner', color: 'bg-teal-700', actions: ['Escanear documento PDF'] },
    { id: 'app_46', name: 'Archivos', category: 'Sistema', packageName: 'com.miui.fileexplorer', color: 'bg-amber-600', actions: ['Ver descargas', 'Liberar espacio'] },
    { id: 'app_47', name: 'Grabadora', category: 'Sistema', packageName: 'com.android.soundrecorder', color: 'bg-red-600', actions: ['Grabar nota de voz'] },
    { id: 'app_48', name: 'Contactos', category: 'Sistema', packageName: 'com.android.contacts', color: 'bg-cyan-500', actions: ['Buscar contacto'] },
    { id: 'app_49', name: 'Teléfono', category: 'Sistema', packageName: 'com.android.dialer', color: 'bg-emerald-600', actions: ['Hacer llamada'] },
    { id: 'app_50', name: 'Chrome', category: 'Sistema', packageName: 'com.android.chrome', color: 'bg-emerald-600', actions: ['Navegar por internet'] },
    { id: 'app_51', name: 'Gmail', category: 'Sistema', packageName: 'com.google.android.gm', color: 'bg-red-500', actions: ['Redactar correo'] },
    { id: 'app_52', name: 'Drive', category: 'Sistema', packageName: 'com.google.android.apps.docs', color: 'bg-blue-600', actions: ['Buscar documento en Drive'] },
    { id: 'app_53', name: 'Seguridad Xiaomi', category: 'Sistema', packageName: 'com.miui.securitycenter', color: 'bg-emerald-700', actions: ['Escanear virus', 'Limpiar caché'] },
    { id: 'app_54', name: 'Mi Remoto', category: 'Sistema', packageName: 'com.duokan.phone.remotecontroller', color: 'bg-slate-700', actions: ['Control infrarrojo TV'] },
    { id: 'app_55', name: 'ShareMe', category: 'Sistema', packageName: 'com.xiaomi.midrop', color: 'bg-sky-600', actions: ['Transferir archivos'] },
    { id: 'app_56', name: 'Clima', category: 'Sistema', packageName: 'com.miui.weather2', color: 'bg-blue-400', actions: ['Ver pronóstico del tiempo'] },
    { id: 'app_57', name: 'Brújula', category: 'Sistema', packageName: 'com.miui.compass', color: 'bg-slate-800', actions: ['Abrir brújula digital'] },
    { id: 'app_58', name: 'Autenticador 2FA', category: 'Sistema', packageName: 'com.google.android.apps.authenticator2', color: 'bg-blue-600', actions: ['Ver códigos 2FA'] },
    { id: 'app_59', name: 'Claro Colombia', category: 'Sistema', packageName: 'com.claro.colombia', color: 'bg-red-600', actions: ['Consultar datos', 'Recargar plan'] },
    { id: 'app_60', name: 'Xiaomi Earbuds', category: 'Sistema', packageName: 'com.xiaomi.earbuds', color: 'bg-black', actions: ['Batería de audífonos'] },
    { id: 'app_61', name: 'Google Home', category: 'Sistema', packageName: 'com.google.android.apps.chromecast.app', color: 'bg-orange-500', actions: ['Control domótico'] },
    { id: 'app_62', name: 'Free Fire', category: 'Juegos', packageName: 'com.dts.freefireth', color: 'bg-amber-600', actions: ['Lanzar Free Fire'] },
    { id: 'app_63', name: 'Clash of Clans', category: 'Juegos', packageName: 'com.supercell.clashofclans', color: 'bg-amber-500', actions: ['Abrir Clash of Clans'] },
    { id: 'app_64', name: 'Clash Royale', category: 'Juegos', packageName: 'com.supercell.clashroyale', color: 'bg-blue-600', actions: ['Abrir Clash Royale'] },
    { id: 'app_65', name: 'FC Mobile', category: 'Juegos', packageName: 'com.ea.gp.fifamobile', color: 'bg-emerald-800', actions: ['Jugar FC Mobile'] },
    { id: 'app_66', name: 'Parchís Star', category: 'Juegos', packageName: 'com.playspace.parchis', color: 'bg-purple-600', actions: ['Jugar Parchís'] },
    { id: 'app_67', name: 'BombSquad', category: 'Juegos', packageName: 'net.froemling.bombsquad', color: 'bg-purple-700', actions: ['Abrir BombSquad'] },
    { id: 'app_68', name: 'Tower War', category: 'Juegos', packageName: 'com.saygames.towerwar', color: 'bg-sky-600', actions: ['Abrir Tower War'] },
    { id: 'app_69', name: 'Adventure Ball', category: 'Juegos', packageName: 'com.adventureball.game', color: 'bg-yellow-600', actions: ['Jugar Adventure Ball'] },
    { id: 'app_70', name: 'Zoom', category: 'Social', packageName: 'us.zoom.videomeetings', color: 'bg-blue-500', actions: ['Abrir reunión Zoom'] }
  ]);

  const [isNativeBridgeActive, setIsNativeBridgeActive] = useState(false);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [salesData] = useState<SalesData>(INITIAL_SALES_DATA);
  const [accessibilityActive, setAccessibilityActive] = useState(true);

  // Sync contacts to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('jarvis_contacts', JSON.stringify(contacts));
      }
    } catch (e) {
      console.warn("Could not write to localStorage inside WebView:", e);
    }
  }, [contacts]);

  // Active Executing Actions
  const [lastIntent, setLastIntent] = useState<IntentResult | null>(null);
  const [activeWhatsAppFlow, setActiveWhatsAppFlow] = useState<{
    contactName: string;
    phoneNumber: string;
    message: string;
  } | null>(null);

  // SpeechRecognition Web API Ref
  const recognitionRef = useRef<any>(null);
  const handleProcessCommandRef = useRef<((cmd: string) => void) | null>(null);

  // Keep handleProcessCommandRef updated on every render
  useEffect(() => {
    handleProcessCommandRef.current = handleProcessCommand;
  });

  // Automatic live sync with real Android hardware
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 15;

    const trySync = () => {
      try {
        if (typeof window !== 'undefined' && window.AndroidBridge) {
          setIsNativeBridgeActive(true);
          console.log("⚡ AndroidBridge detectado - Iniciando sincronización de datos de tu celular...");

          // Sync Contacts
          try {
            if (typeof window.AndroidBridge.getContacts === 'function') {
              const contactsStr = window.AndroidBridge.getContacts();
              if (contactsStr) {
                const parsed = JSON.parse(contactsStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const mapped = parsed.map((c: any, idx: number) => ({
                    id: c.id || `contact-${idx}`,
                    name: c.name || '',
                    nickname: c.nickname || c.name || '',
                    phone: c.phone || '',
                    avatar: c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name || 'C')}`,
                    hasWhatsapp: c.hasWhatsapp !== undefined ? c.hasWhatsapp : true,
                  }));
                  setContacts(mapped);
                  console.log("✔ Sincronizados contactos reales desde getContacts():", mapped.length);
                }
              }
            }
          } catch (e) {
            console.warn("Fallo getContacts():", e);
          }

          // Sync Apps
          try {
            if (typeof window.AndroidBridge.getInstalledApps === 'function') {
              const appsStr = window.AndroidBridge.getInstalledApps();
              if (appsStr) {
                const parsed = JSON.parse(appsStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const mapped = parsed.map((a: any, idx: number) => ({
                    id: a.id || `app-${idx}`,
                    name: a.name || '',
                    packageName: a.packageName || '',
                    iconName: a.iconName || 'Globe',
                    category: a.category || 'tools',
                    color: a.color || 'bg-blue-600',
                  }));
                  setInstalledApps(mapped);
                  console.log("✔ Sincronizadas apps reales desde getInstalledApps():", mapped.length);
                }
              }
            }
          } catch (e) {
            console.warn("Fallo getInstalledApps():", e);
          }

          clearInterval(syncInterval);
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(syncInterval);
          }
        }
      } catch (err) {
        console.error("Error en trySync general:", err);
      }
    };

    const syncInterval = setInterval(trySync, 1000);
    trySync();

    // Register globally exposed bridge receivers
    (window as any).updateAndroidContacts = (contactsJson: string) => {
      try {
        const parsed = JSON.parse(contactsJson);
        if (Array.isArray(parsed)) {
          const mapped = parsed.map((c: any, idx: number) => ({
            id: c.id || `contact-${idx}-${Date.now()}`,
            name: c.name || '',
            nickname: c.nickname || c.name || '',
            phone: c.phone || '',
            avatar: c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name || 'C')}`,
            hasWhatsapp: c.hasWhatsapp !== undefined ? c.hasWhatsapp : true,
          }));
          setContacts(mapped);
          setIsNativeBridgeActive(true);
        }
      } catch (err) {
        console.error("Error en updateAndroidContacts push:", err);
      }
    };

    (window as any).updateAndroidApps = (appsJson: string) => {
      try {
        const parsed = JSON.parse(appsJson);
        if (Array.isArray(parsed)) {
          const mapped = parsed.map((a: any, idx: number) => ({
            id: a.id || `app-${idx}`,
            name: a.name || '',
            packageName: a.packageName || '',
            iconName: a.iconName || 'Globe',
            category: a.category || 'tools',
            color: a.color || 'bg-blue-600',
          }));
          setInstalledApps(mapped);
          setIsNativeBridgeActive(true);
        }
      } catch (err) {
        console.error("Error en updateAndroidApps push:", err);
      }
    };

    // Native Speech Recognition Receivers from Android App
    (window as any).onNativeTranscript = (text: string, isFinal?: boolean) => {
      console.log("⚡ [Native Speech] Transcript recibido:", text, "isFinal:", isFinal);
      setTranscript(text);
      if (isFinal === false) {
        // Partial text only! Do NOT execute command yet
        return;
      }
      setIsListening(false);
      if (text && text.trim() && handleProcessCommandRef.current) {
        handleProcessCommandRef.current(text.trim());
      }
    };

    (window as any).onNativePartialTranscript = (text: string) => {
      console.log("⚡ [Native Speech] Parcial:", text);
      setTranscript(text);
    };

    (window as any).onNativeListeningState = (listening: boolean) => {
      console.log("⚡ [Native Speech] Estado escuchando:", listening);
      setIsListening(listening);
    };

    (window as any).onNativeError = (err: string) => {
      console.warn("⚡ [Native Speech] Error de voz nativa:", err);
      setIsListening(false);
    };

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    try {
      const SpeechRecognition =
        typeof window !== 'undefined'
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'es-CO';

        recognition.onstart = () => {
          setIsListening(true);
          try {
            audioEngine.playWakeChime();
          } catch (e) {
            console.warn('Audio Chime issue:', e);
          }
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    } catch (e) {
      console.warn("Speech recognition initialization fallback:", e);
    }
  }, []);

  // Handle Speech Recognition Toggle
  const handleStartListening = () => {
    if (typeof window !== 'undefined' && window.AndroidBridge?.startListening) {
      try {
        window.AndroidBridge.startListening();
        setIsListening(true);
        return;
      } catch (e) {
        console.warn("Failed native startListening:", e);
      }
    }

    if (recognitionRef.current) {
      try {
        setTranscript('');
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition already active or failed:", e);
      }
    } else {
      const simulatedText = "Enviar un WhatsApp a Juan Carlos diciendo que ya voy de camino";
      setTranscript(simulatedText);
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        handleProcessCommand(simulatedText);
      }, 1500);
    }
  };

  const handleStopListening = () => {
    if (typeof window !== 'undefined' && window.AndroidBridge?.stopListening) {
      try {
        window.AndroidBridge.stopListening();
        setIsListening(false);
      } catch (e) {
        console.warn("Failed native stopListening:", e);
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Failed to stop recognition:", e);
      }
    }
    setIsListening(false);
    if (transcript.trim()) {
      handleProcessCommand(transcript.trim());
    }
  };

  // Browser-level Action Execution & Android Intent dispatch
  const executeRealBrowserAction = (intent: IntentResult) => {
    const { action, params } = intent;

    try {
      if (action === 'send_whatsapp') {
        const matchedContact = contacts.find(
          (c) =>
            c.name.toLowerCase().includes((params.contact || '').toLowerCase()) ||
            (c.nickname && c.nickname.toLowerCase().includes((params.contact || '').toLowerCase()))
        );
        const rawPhone = params.phoneNumber || (matchedContact ? matchedContact.phone : '');
        const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
        const encodedMsg = encodeURIComponent(params.message || 'Hola');
        if (cleanPhone) {
          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`, '_blank');
        } else {
          window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
        }
      } else if (action === 'send_sms') {
        const matchedContact = contacts.find(
          (c) =>
            c.name.toLowerCase().includes((params.contact || '').toLowerCase()) ||
            (c.nickname && c.nickname.toLowerCase().includes((params.contact || '').toLowerCase()))
        );
        const rawPhone = params.phoneNumber || (matchedContact ? matchedContact.phone : '');
        const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
        const encodedMsg = encodeURIComponent(params.message || 'Hola');
        window.location.href = `sms:${cleanPhone}?body=${encodedMsg}`;
      } else if (action === 'make_call') {
        const matchedContact = contacts.find(
          (c) =>
            c.name.toLowerCase().includes((params.contact || '').toLowerCase()) ||
            (c.nickname && c.nickname.toLowerCase().includes((params.contact || '').toLowerCase()))
        );
        const rawPhone = params.phoneNumber || (matchedContact ? matchedContact.phone : '');
        const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
        if (cleanPhone) {
          window.location.href = `tel:${cleanPhone}`;
        } else {
          window.location.href = 'tel:';
        }
      } else if (action === 'play_youtube') {
        const query = encodeURIComponent(params.query || params.track || 'musica');
        window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
      } else if (action === 'play_spotify') {
        const track = encodeURIComponent(params.track || 'musica');
        try {
          // Intent con MEDIA_PLAY_FROM_SEARCH para reproducir directamente en Spotify
          window.location.href = `intent://search/results?q=${track}#Intent;package=com.spotify.music;action=android.media.action.MEDIA_PLAY_FROM_SEARCH;S.query=${track};S.android.intent.extra.focus=vnd.android.cursor.item/*;end`;
        } catch (e) {
          window.open(`https://open.spotify.com/search/${track}`, '_blank');
        }
        setTimeout(() => {
          if (!document.hidden) {
            window.open(`https://open.spotify.com/search/${track}`, '_blank');
          }
        }, 800);
      } else if (action === 'open_app') {
        const appName = (params.appName || '').toLowerCase();
        let pkg = params.packageName;

        if (!pkg && appName) {
          const match = installedApps.find((a: any) =>
            (a.name || '').toLowerCase().includes(appName) || appName.includes((a.name || '').toLowerCase())
          );
          if (match) pkg = match.packageName;
        }

        if (pkg) {
          window.location.href = `intent://#Intent;scheme=package;package=${pkg};end`;
        } else if (appName.includes('camara') || appName.includes('cámara') || appName.includes('foto')) {
          window.open('https://camera.google.com', '_blank');
        } else if (appName.includes('chrome') || appName.includes('browser') || appName.includes('navegador')) {
          window.open('https://google.com', '_blank');
        } else if (appName.includes('whatsapp')) {
          window.open('https://web.whatsapp.com', '_blank');
        } else if (appName.includes('spotify')) {
          window.open('https://open.spotify.com', '_blank');
        } else if (appName.includes('youtube')) {
          window.open('https://youtube.com', '_blank');
        } else if (appName.includes('map') || appName.includes('gps')) {
          window.open('https://maps.google.com', '_blank');
        } else if (appName.includes('play store') || appName.includes('tienda')) {
          window.open('https://play.google.com', '_blank');
        } else {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(params.appName || 'app')}`, '_blank');
        }
      } else if (action === 'take_photo' || action === 'open_camera') {
        window.open('https://camera.google.com', '_blank');
      } else if (action === 'toggle_wifi') {
        window.location.href = 'intent://#Intent;action=android.settings.WIFI_SETTINGS;end';
      } else if (action === 'toggle_bluetooth') {
        window.location.href = 'intent://#Intent;action=android.settings.BLUETOOTH_SETTINGS;end';
      } else if (action === 'airplane_mode' || action === 'toggle_flashlight') {
        window.location.href = 'intent://#Intent;action=android.settings.SETTINGS;end';
      } else if (action === 'general_query') {
        // general_query es respondida directamente por voz (TTS) con la respuesta de Gemini. NO abre navegador.
        console.log("⚡ [General Query] Respuesta leída por voz:", params.query);
      } else if (action === 'search_web') {
        const query = encodeURIComponent(params.query || params.content || 'Jarvis Voice');
        window.open(`https://www.google.com/search?q=${query}`, '_blank');
      } else if (action === 'set_alarm') {
        let hour = 7, min = 0;
        if (typeof params.hours === 'number') {
          hour = params.hours;
        } else if (params.time) {
          const parts = params.time.split(':');
          if (parts.length >= 2) {
            hour = parseInt(parts[0], 10);
            min = parseInt(parts[1], 10) || 0;
          }
        }
        if (typeof params.minutes === 'number') {
          min = params.minutes;
        }
        if (isNaN(hour)) hour = 7;
        if (isNaN(min)) min = 0;

        const title = encodeURIComponent(params.title || 'Alarma Jarvis');
        window.location.href = `intent://#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${hour};i.android.intent.extra.alarm.MINUTES=${min};S.android.intent.extra.alarm.MESSAGE=${title};B.android.intent.extra.alarm.SKIP_UI=false;end`;
        setTimeout(() => {
          window.location.href = `intent://#Intent;action=android.provider.AlarmClock.SHOW_ALARMS;end`;
        }, 500);
      } else if (action === 'set_timer') {
        const secs = params.seconds || (params.minutes ? params.minutes * 60 : 60);
        window.location.href = `intent://#Intent;action=android.intent.action.SET_TIMER;i.android.intent.extra.alarm.LENGTH=${secs};end`;
      } else if (action === 'set_reminder') {
        const title = encodeURIComponent(params.title || 'Recordatorio Jarvis');
        window.location.href = `intent://#Intent;action=android.intent.action.INSERT;data=content://com.android.calendar/events;S.title=${title};end`;
        setTimeout(() => {
          window.open(`https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}`, '_blank');
        }, 500);
      } else if (action === 'open_calculator') {
        window.location.href = `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end`;
      } else if (action === 'open_gallery') {
        window.location.href = `intent://#Intent;action=android.intent.action.VIEW;type=image/*;end`;
      } else if (action === 'open_contacts') {
        window.location.href = `intent://#Intent;action=android.intent.action.VIEW;data=content://contacts/people;end`;
      } else if (action === 'open_calendar') {
        window.location.href = `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALENDAR;end`;
      }
    } catch (err) {
      console.warn("Error executing real action:", err);
    }
  };

  // Main Command Processor via Backend
  const handleProcessCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    setIsProcessing(true);

    // Refresh contacts from AndroidBridge dynamically if available
    let currentContacts = contacts;
    if (typeof window !== 'undefined' && window.AndroidBridge?.getContacts) {
      try {
        const cStr = window.AndroidBridge.getContacts();
        if (cStr) {
          const parsed = JSON.parse(cStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentContacts = parsed.map((c: any, idx: number) => ({
              id: c.id || `contact-${idx}`,
              name: c.name || '',
              nickname: c.nickname || c.name || '',
              phone: c.phone || '',
              avatar: c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name || 'C')}`,
              hasWhatsapp: c.hasWhatsapp !== undefined ? c.hasWhatsapp : true,
            }));
            setContacts(currentContacts);
          }
        }
      } catch (e) {
        console.warn("Contact dynamic refresh failed:", e);
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: commandText,
          contacts: currentContacts,
          installedApps,
          salesData,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      setIsProcessing(false);

      if (data && data.intent) {
        const intent: IntentResult = data.intent;

        // Auto-resolve phone number if empty and contact name provided
        if ((!intent.params.phoneNumber || intent.params.phoneNumber === '') && intent.params.contact) {
          if (typeof window !== 'undefined' && window.AndroidBridge?.resolveContactPhone) {
            try {
              const resPhone = window.AndroidBridge.resolveContactPhone(intent.params.contact);
              if (resPhone) {
                intent.params.phoneNumber = resPhone;
              }
            } catch (e) {
              console.warn("Resolve contact phone failed:", e);
            }
          }
        }

        setLastIntent(intent);

        // Hablar respuesta por voz (TTS)
        if (ttsEnabled) {
          setIsSpeaking(true);
          if (typeof window !== 'undefined' && window.AndroidBridge?.speak) {
            try {
              window.AndroidBridge.speak(intent.feedbackText);
            } catch (e) {
              console.warn("Native speak error:", e);
            }
          }
          audioEngine.speak(intent.feedbackText, () => setIsSpeaking(false));
        }

        // Ejecutar acción DE VERDAD en el celular vía AndroidBridge executeAction
        if (typeof window !== 'undefined' && window.AndroidBridge) {
          const bridge = window.AndroidBridge as any;
          try {
            if (typeof bridge.executeAction === 'function') {
              bridge.executeAction(JSON.stringify(intent));
            }
          } catch (e) {
            console.warn("Native bridge executeAction call warning:", e);
          }
        }
        
        // Ejecutar redirección de Intent / Navegador como fallback
        if (intent.action !== 'general_query') {
          executeRealBrowserAction(intent);
        }

        // WhatsApp Accessibility Service Trigger
        if (intent.action === 'send_whatsapp' && accessibilityActive && !window.AndroidBridge) {
          const matchedContact = contacts.find(
            (c) =>
              c.name.toLowerCase().includes((intent.params.contact || '').toLowerCase()) ||
              (c.nickname && c.nickname.toLowerCase().includes((intent.params.contact || '').toLowerCase()))
          ) || contacts[0];

          setActiveWhatsAppFlow({
            contactName: matchedContact.name,
            phoneNumber: intent.params.phoneNumber || matchedContact.phone,
            message: intent.params.message || 'Mensaje enviado por voz con Jarvis',
          });
        } else {
          setActiveWhatsAppFlow(null);
        }

        // Log Entry
        const newLog: CommandLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          transcript: commandText,
          intent,
          providerUsed: data.providerUsed || 'Gemini 3.6 Flash (Servidor)',
          latencyMs: data.latencyMs || 150,
          status: 'executed',
        };

        setLogs((prev) => [newLog, ...prev]);
      } else {
        const fallbackMsg = 'No entendí bien eso, ¿puedes repetirlo?';
        setIsSpeaking(true);
        if (typeof window !== 'undefined' && window.AndroidBridge?.speak) {
          try { window.AndroidBridge.speak(fallbackMsg); } catch (e) { console.warn(e); }
        }
        audioEngine.speak(fallbackMsg, () => setIsSpeaking(false));
      }
    } catch (err) {
      console.error('Error processing voice command:', err);
      setIsProcessing(false);
      const errorMsg = 'Tuve un problema para procesar eso, intenta de nuevo.';
      setIsSpeaking(true);
      if (typeof window !== 'undefined' && window.AndroidBridge?.speak) {
        try { window.AndroidBridge.speak(errorMsg); } catch (e) { console.warn(e); }
      }
      audioEngine.speak(errorMsg, () => setIsSpeaking(false));
    }
  };

  const handleAddContact = (contact: Contact) => {
    setContacts((prev) => [...prev, contact]);
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#080911] text-white flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Background ambient neon radial glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Body View */}
      <main className="flex-1 w-full pt-4 md:pt-6">
        <Dashboard
          logs={logs}
          contacts={contacts}
          installedApps={installedApps}
          isNativeBridgeActive={isNativeBridgeActive}
          onAddContact={handleAddContact}
          onDeleteContact={handleDeleteContact}
          accessibilityActive={accessibilityActive}
          setAccessibilityActive={setAccessibilityActive}
          lastIntent={lastIntent}
          onTestCommand={handleProcessCommand}
          isListening={isListening}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          transcript={transcript}
          setTranscript={setTranscript}
          startListening={handleStartListening}
          stopListening={handleStopListening}
        />
      </main>

      {/* WhatsApp Accessibility Overlay Simulation Modal */}
      {activeWhatsAppFlow && (
        <WhatsAppAccessibilityOverlay
          contactName={activeWhatsAppFlow.contactName}
          phoneNumber={activeWhatsAppFlow.phoneNumber}
          message={activeWhatsAppFlow.message}
          onComplete={() => setActiveWhatsAppFlow(null)}
          onClose={() => setActiveWhatsAppFlow(null)}
        />
      )}

      {/* Floating Chat Head Bubble at App-level */}
      <FloatingChatHead
        isListening={isListening}
        isProcessing={isProcessing}
        isSpeaking={isSpeaking}
        onTap={isListening ? handleStopListening : handleStartListening}
        accessibilityActive={accessibilityActive}
      />
    </div>
  );
}
