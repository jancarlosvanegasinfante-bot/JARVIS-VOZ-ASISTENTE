import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, LayoutDashboard, Volume2, VolumeX, ShieldCheck, Zap, Sparkles, Mic } from 'lucide-react';
import { PhoneFrame } from './components/PhoneFrame';
import { Dashboard } from './components/Dashboard';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { INITIAL_CONTACTS, INITIAL_SALES_DATA } from './data/mockData';
import { Contact, CommandLog, IntentResult, SalesData } from './types';
import { audioEngine } from './utils/audioSynth';

export default function App() {
  const [activeView, setActiveView] = useState<'phone' | 'dashboard'>('phone');

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // App Data State
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [salesData] = useState<SalesData>(INITIAL_SALES_DATA);
  const [accessibilityActive, setAccessibilityActive] = useState(true);

  // Active Executing Actions
  const [lastIntent, setLastIntent] = useState<IntentResult | null>(null);
  const [activeWhatsAppFlow, setActiveWhatsAppFlow] = useState<{
    contactName: string;
    phoneNumber: string;
    message: string;
  } | null>(null);

  // SpeechRecognition Web API Ref
  const recognitionRef = useRef<any>(null);

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
          installedApps: ['WhatsApp', 'Teléfono', 'Spotify', 'JANBOT Analytics', 'Reloj', 'SMS', 'Browser', 'Notas'],
        }),
      });

      const data = await response.json();
      setIsProcessing(false);

      if (data && data.intent) {
        const intent: IntentResult = data.intent;
        setLastIntent(intent);

        // Sound Feedback
        audioEngine.playSuccessPing();

        // Speech Feedback
        if (ttsEnabled && intent.feedbackText) {
          setIsSpeaking(true);
          audioEngine.speak(intent.feedbackText, () => setIsSpeaking(false));
        }

        // WhatsApp Accessibility Service Trigger
        if (intent.action === 'send_whatsapp' && accessibilityActive) {
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
                JARVIS VOICE <span className="text-[#00f2ff] font-mono font-bold text-xs not-italic bg-[#00f2ff]/10 px-2 py-0.5 rounded border border-[#00f2ff]/30">v1.0.4</span>
              </h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Asistente Inteligente de Voz
              </p>
            </div>
          </div>

          {/* Center View Toggle Buttons */}
          <div className="flex items-center bg-[#0a0a0c] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveView('phone')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'phone'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#0066ff] text-slate-950 font-bold shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simulador Celular</span>
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'dashboard'
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#0066ff] text-slate-950 font-bold shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Panel de Arquitectura</span>
            </button>
          </div>

          {/* Right Metrics & Controls */}
          <div className="flex items-center gap-6 text-[11px] font-mono text-gray-400">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[#00f2ff]">98% ENGINE LOAD</span>
              <span>NVIDIA NIM CASCADE</span>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-orange-400">LATENCY: 42ms</span>
              <span>OPENROUTER SYNC</span>
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
        {activeView === 'phone' ? (
          <div className="flex flex-col items-center py-2">
            <PhoneFrame
              isListening={isListening}
              isProcessing={isProcessing}
              isSpeaking={isSpeaking}
              transcript={transcript}
              setTranscript={setTranscript}
              startListening={handleStartListening}
              stopListening={handleStopListening}
              onSubmitText={handleProcessCommand}
              lastIntent={lastIntent}
              activeWhatsAppFlow={activeWhatsAppFlow}
              onCloseWhatsAppFlow={() => setActiveWhatsAppFlow(null)}
              onCloseActionOverlay={() => setLastIntent(null)}
              accessibilityActive={accessibilityActive}
              setAccessibilityActive={setAccessibilityActive}
              salesData={salesData}
            />
          </div>
        ) : (
          <Dashboard
            logs={logs}
            contacts={contacts}
            onAddContact={handleAddContact}
            onDeleteContact={handleDeleteContact}
            accessibilityActive={accessibilityActive}
            setAccessibilityActive={setAccessibilityActive}
            lastIntent={lastIntent}
            onTestCommand={handleProcessCommand}
          />
        )}
      </main>

      {/* Immersive Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0c] py-3.5 px-6 text-[10px] font-mono text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex gap-4">
            <span>ENCRYPTED_CHANNEL: AES-256</span>
            <span>MODEL: NVIDIA-LLAMA-3-70B-INSTRUCT</span>
          </div>
          <div className="flex gap-4">
            <span>SESSION_ID: J-7729-ALPHA</span>
            <span className="text-[#00f2ff]">LAT: 6.2442° N, LONG: 75.5812° W</span>
          </div>
        </div>
      </footer>

      {/* PWA Floating Native Download Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
