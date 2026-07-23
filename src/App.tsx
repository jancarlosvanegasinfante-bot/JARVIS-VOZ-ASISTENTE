import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, LayoutDashboard, Volume2, VolumeX, ShieldCheck, Zap, Sparkles, Mic } from 'lucide-react';
import { PhoneFrame } from './components/PhoneFrame';
import { Dashboard } from './components/Dashboard';
import { INITIAL_CONTACTS, INITIAL_SALES_DATA } from './data/mockData';
import { Contact, CommandLog, IntentResult, SalesData } from './types';
import { audioEngine } from './utils/audioSynth';

// Puente hacia la app nativa de Android (solo existe cuando corres dentro
// del APK de Jarvis; en el navegador normal simplemente no está definido
// y todo sigue funcionando igual que ahora, sin control real del celular).
declare global {
  interface Window {
    AndroidBridge?: {
      executeAction: (json: string) => void;
      isAccessibilityEnabled: () => boolean;
      openAccessibilitySettings: () => void;
      getContacts?: () => string;
      getInstalledApps?: () => string;
    };
    updateAndroidContacts?: (contactsJson: string) => void;
    updateAndroidApps?: (appsJson: string) => void;
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
    const saved = localStorage.getItem('jarvis_contacts');
    return saved ? JSON.parse(saved) : [];
  });
  const [installedApps, setInstalledApps] = useState<any[]>(() => [
    { id: 'a1', name: 'WhatsApp', packageName: 'com.whatsapp' },
    { id: 'a2', name: 'Teléfono', packageName: 'com.android.dialer' },
    { id: 'a3', name: 'Spotify', packageName: 'com.spotify.music' },
    { id: 'a4', name: 'JANBOT Analytics', packageName: 'com.janbot.shop' },
    { id: 'a5', name: 'Reloj', packageName: 'com.android.deskclock' },
    { id: 'a6', name: 'SMS', packageName: 'com.android.mms' },
    { id: 'a7', name: 'Browser', packageName: 'com.android.chrome' },
    { id: 'a8', name: 'Notas', packageName: 'com.android.notes' },
  ]);
  const [isNativeBridgeActive, setIsNativeBridgeActive] = useState(false);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [salesData] = useState<SalesData>(INITIAL_SALES_DATA);
  const [accessibilityActive, setAccessibilityActive] = useState(true);

  // Sync contacts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('jarvis_contacts', JSON.stringify(contacts));
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

  // Automatic live sync with real Android hardware (retries handle webview race-conditions)
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 15;

    const trySync = () => {
      if (window.AndroidBridge) {
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
    };

    const syncInterval = setInterval(trySync, 1000);
    trySync();

    // Register globally exposed bridge receivers (if Android pushes data directly)
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
          console.log("✔ Sincronización push de contactos completada:", mapped.length);
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
          console.log("✔ Sincronización push de apps completada:", mapped.length);
        }
      } catch (err) {
        console.error("Error en updateAndroidApps push:", err);
      }
    };

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    // Initialize Web Speech Recognition if available
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-CO';

      recognition.onstart = () => {
        setIsListening(true);
        audioEngine.playWakeChime();
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
  }, []);

  const handleStartListening = () => {
    setTranscript('');
    audioEngine.playWakeChime();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(true);
      }
    } else {
      setIsListening(true);
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    if (transcript.trim()) {
      handleProcessCommand(transcript.trim());
    }
  };

  const handleProcessCommand = async (commandText: string) => {
    setIsListening(false);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: commandText,
          contacts: contacts.map((c) => ({ name: c.name, nickname: c.nickname, phone: c.phone })),
          installedApps: installedApps.map((a) => a.name),
        }),
      });

      const data = await response.json();
      setIsProcessing(false);

      if (data && data.intent) {
        const intent: IntentResult = data.intent;
        setLastIntent(intent);

        // Sound Feedback
        audioEngine.playSuccessPing();

        // Ejecutar la acción DE VERDAD en el celular, si estamos corriendo
        // dentro del APK nativo.
        if (window.AndroidBridge) {
          window.AndroidBridge.executeAction(JSON.stringify(intent));
        }

        // Speech Feedback
        if (ttsEnabled && intent.feedbackText) {
          setIsSpeaking(true);
          audioEngine.speak(intent.feedbackText, () => setIsSpeaking(false));
        }

        // WhatsApp Accessibility Service Trigger (solo en simulador / navegador normal)
        if (intent.action === 'send_whatsapp' && accessibilityActive && !window.AndroidBridge) {
          const matchedContact = contacts.find(
            (c) =>
              c.name.toLowerCase().includes((intent.params.contact || '').toLowerCase()) ||
              (c.nickname && c.nickname.toLowerCase().includes((intent.params.contact || '').toLowerCase()))
          ) || contacts[0];

          setActiveWhatsAppFlow({
            contactName: matchedContact.name,
            phoneNumber: matchedContact.phone,
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
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col font-sans selection:bg-[#00f2ff] selection:text-[#0a0a0c]">
      {/* Immersive Header Navbar */}
      <header className="bg-[#141418]/90 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00f2ff]/20 to-[#0066ff]/20 border border-[#00f2ff]/50 flex items-center justify-center text-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.4)] group">
              <Mic className="w-5 h-5 text-[#00f2ff] animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00f2ff] border-2 border-[#141418] shadow-[0_0_8px_#00f2ff]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase italic flex items-center gap-2">
                JARVIS VOICE <span className="text-[#00f2ff] font-mono font-bold text-xs not-italic bg-[#00f2ff]/10 px-2 py-0.5 rounded border border-[#00f2ff]/30">v1.1.0</span>
              </h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Asistente Inteligente de Voz
              </p>
            </div>
          </div>

          {/* Right Metrics & Controls */}
          <div className="flex items-center gap-6 text-[11px] font-mono text-gray-400">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[#00f2ff]">ENGINE LOAD ACTIVE</span>
              <span>ANDROID BRIDGE SYNCED</span>
            </div>
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                ttsEnabled
                  ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40 shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                  : 'bg-[#141418] text-gray-500 border-white/10'
              }`}
              title={ttsEnabled ? 'Voz TTS Activada' : 'Voz TTS Silenciada'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
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

      {/* Immersive Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0c] py-3.5 px-6 text-[10px] font-mono text-gray-500 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex gap-4">
            <span>SECURE CHANNEL: SSL/AES-256</span>
            <span>MODEL: GEMINI-3.5-FLASH-LIVE</span>
          </div>
          <div className="flex gap-4">
            <span>SESSION_ID: JARVIS-SYNC-LIVE</span>
            <span className="text-[#00f2ff]">MODO REAL ACTIVO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
