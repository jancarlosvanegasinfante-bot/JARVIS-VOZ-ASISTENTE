import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { WhatsAppAccessibilityOverlay } from './components/WhatsAppAccessibilityOverlay';
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
    { id: 'a1', name: 'WhatsApp', packageName: 'com.whatsapp' },
    { id: 'a2', name: 'Teléfono', packageName: 'com.android.dialer' },
    { id: 'a3', name: 'Spotify', packageName: 'com.spotify.music' },
    { id: 'a4', name: 'JANBOT Analytics', packageName: 'com.janbot.shop' },
    { id: 'a5', name: 'Reloj', packageName: 'com.android.deskclock' },
    { id: 'a6', name: 'SMS', packageName: 'com.android.mms' },
    { id: 'a7', name: 'Chrome', packageName: 'com.android.chrome' },
    { id: 'a8', name: 'Notas', packageName: 'com.android.notes' },
    { id: 'a9', name: 'Cámara', packageName: 'com.android.camera' },
    { id: 'a10', name: 'Galería', packageName: 'com.sec.android.gallery3d' },
    { id: 'a11', name: 'Maps', packageName: 'com.google.android.apps.maps' },
    { id: 'a12', name: 'Contactos', packageName: 'com.android.contacts' },
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
    (window as any).onNativeTranscript = (text: string) => {
      console.log("⚡ [Native Speech] Transcript recibido:", text);
      setTranscript(text);
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

  // Browser-level Action Execution fallback & WEB execution
  const executeRealBrowserAction = (intent: IntentResult) => {
    const { action, params } = intent;

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
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
      } else {
        window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
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
      window.open(`sms:${cleanPhone}?body=${encodedMsg}`, '_self');
    } else if (action === 'make_call') {
      const matchedContact = contacts.find(
        (c) =>
          c.name.toLowerCase().includes((params.contact || '').toLowerCase()) ||
          (c.nickname && c.nickname.toLowerCase().includes((params.contact || '').toLowerCase()))
      );
      const rawPhone = params.phoneNumber || (matchedContact ? matchedContact.phone : '');
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      if (cleanPhone) {
        window.open(`tel:${cleanPhone}`, '_self');
      } else {
        window.open('tel:', '_self');
      }
    } else if (action === 'play_youtube') {
      const query = encodeURIComponent(params.query || params.track || 'musica');
      window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    } else if (action === 'play_spotify') {
      const track = encodeURIComponent(params.track || 'musica');
      window.open(`https://open.spotify.com/search/${track}`, '_blank');
    } else if (action === 'open_app') {
      const appName = (params.appName || '').toLowerCase();
      if (appName.includes('spotify')) {
        window.open('https://open.spotify.com', '_blank');
      } else if (appName.includes('youtube')) {
        window.open('https://youtube.com', '_blank');
      } else if (appName.includes('whatsapp')) {
        window.open('https://web.whatsapp.com', '_blank');
      } else if (appName.includes('chrome') || appName.includes('browser') || appName.includes('navegador')) {
        window.open('https://google.com', '_blank');
      } else if (appName.includes('map') || appName.includes('gps')) {
        window.open('https://maps.google.com', '_blank');
      } else if (appName.includes('camara') || appName.includes('cámara') || appName.includes('foto')) {
        window.open('https://camera.google.com', '_blank');
      } else {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(params.appName || 'app')}`, '_blank');
      }
    } else if (action === 'search_web' || action === 'general_query') {
      const query = encodeURIComponent(params.query || params.content || 'Jarvis Voice');
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    } else if (action === 'set_reminder') {
      const title = encodeURIComponent(params.title || 'Recordatorio Jarvis');
      window.open(`https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}`, '_blank');
    } else if (action === 'take_photo' || action === 'open_camera') {
      window.open('https://camera.google.com', '_blank');
    }
  };

  // Main Command Processor via Backend
  const handleProcessCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    setIsProcessing(true);

    try {
      const response = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: commandText,
          contacts,
          installedApps,
          salesData,
        }),
      });

      const data = await response.json();
      setIsProcessing(false);

      if (data && data.intent) {
        const intent: IntentResult = data.intent;
        setLastIntent(intent);

        // Hablar respuesta por voz (TTS)
        if (ttsEnabled) {
          setIsSpeaking(true);
          audioEngine.speak(intent.feedbackText, () => setIsSpeaking(false));
        }

        // Ejecutar acción DE VERDAD en el celular (vía Bridge o Browser)
        if (typeof window !== 'undefined' && window.AndroidBridge) {
          try {
            if (typeof window.AndroidBridge.executeAction === 'function') {
              window.AndroidBridge.executeAction(JSON.stringify(intent));
            } else {
              executeRealBrowserAction(intent);
            }
          } catch (e) {
            console.warn("Native executeAction error, using browser fallback:", e);
            executeRealBrowserAction(intent);
          }
        } else {
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
      }
    } catch (err) {
      console.error('Error processing voice command:', err);
      setIsProcessing(false);
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
    </div>
  );
}
