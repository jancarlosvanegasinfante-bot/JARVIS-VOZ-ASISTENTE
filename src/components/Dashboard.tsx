import React, { useState } from 'react';
import {
  Bell,
  Wifi,
  Volume2,
  Shield,
  Settings,
  Mic,
  Sparkles,
  Send,
  Keyboard,
  History,
  Users,
  Phone,
  MessageCircle,
  Grid,
  Plus,
  Trash2,
  Camera,
  Image as ImageIcon,
  Globe,
  MapPin,
  User,
  Home,
  ChevronDown,
  Clock,
  Smartphone,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { CommandLog, Contact, IntentResult } from '../types';
import { audioEngine } from '../utils/audioSynth';
import { JarvisLogo } from './JarvisLogo';
import { JarvisRobotAvatar } from './JarvisRobotAvatar';

interface DashboardProps {
  logs: CommandLog[];
  contacts: Contact[];
  installedApps: any[];
  isNativeBridgeActive: boolean;
  onAddContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  accessibilityActive: boolean;
  setAccessibilityActive: (val: boolean) => void;
  lastIntent: IntentResult | null;
  onTestCommand: (cmd: string) => void;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  setTranscript: (val: string) => void;
  startListening: () => void;
  stopListening: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  logs,
  contacts,
  installedApps,
  isNativeBridgeActive,
  onAddContact,
  onDeleteContact,
  accessibilityActive,
  setAccessibilityActive,
  lastIntent,
  onTestCommand,
  isListening,
  isProcessing,
  isSpeaking,
  transcript,
  setTranscript,
  startListening,
  stopListening,
}) => {
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [manualCommand, setManualCommand] = useState('');
  const [activeTab, setActiveTab] = useState<'inicio' | 'asistente' | 'contactos' | 'ajustes'>('inicio');
  const [showQuickAccess, setShowQuickAccess] = useState(true);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [showAllAppsModal, setShowAllAppsModal] = useState(false);

  // Handle Command Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCommand.trim()) {
      onTestCommand(manualCommand.trim());
      setManualCommand('');
    }
  };

  // Handle Contact Creation
  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newPhone.trim()) {
      onAddContact({
        id: `c_${Date.now()}`,
        name: newName.trim(),
        phone: newPhone.trim(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newName.trim())}`,
        hasWhatsapp: true,
      });
      setNewName('');
      setNewPhone('');
    }
  };

  // Preset Apps list with exact styling as in Image 2
  const systemAppIcons = [
    { name: 'WhatsApp', icon: <MessageCircle className="w-5 h-5 text-white" />, color: 'bg-emerald-500', cmd: 'Abrir WhatsApp' },
    { name: 'Teléfono', icon: <Phone className="w-5 h-5 text-white" />, color: 'bg-blue-500', cmd: 'Abrir Teléfono' },
    { name: 'Mensajes', icon: <MessageCircle className="w-5 h-5 text-white" />, color: 'bg-purple-600', cmd: 'Abrir Mensajes' },
    { name: 'Cámara', icon: <Camera className="w-5 h-5 text-white" />, color: 'bg-pink-600', cmd: 'Abrir Cámara' },
    { name: 'Galería', icon: <ImageIcon className="w-5 h-5 text-white" />, color: 'bg-[#d946ef]', cmd: 'Abrir Galería' },
    { name: 'Chrome', icon: <Globe className="w-5 h-5 text-white" />, color: 'bg-emerald-600', cmd: 'Abrir Chrome' },
    { name: 'Maps', icon: <MapPin className="w-5 h-5 text-white" />, color: 'bg-rose-500', cmd: 'Abrir Maps' },
    { name: 'Contactos', icon: <User className="w-5 h-5 text-slate-950" />, color: 'bg-[#00f2ff]', cmd: 'Abrir Contactos' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 px-3 md:px-6 font-sans pb-28 text-slate-100 selection:bg-cyan-400 selection:text-slate-950">
      
      {/* 1. TOP HEADER (Logo, App Name, Status Badge, Notifications & Profile) */}
      <header className="bg-[#101426]/90 border border-cyan-500/15 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
        <JarvisLogo size="md" showText={true} />

        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <button
            onClick={() => {
              setShowNotificationsModal(true);
              setNotificationsCount(0);
            }}
            className="relative p-2.5 rounded-full bg-[#161c36] border border-purple-500/20 hover:border-purple-500/50 text-gray-300 hover:text-white transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.15)]"
            title="Notificaciones del sistema"
          >
            <Bell className="w-5 h-5 text-purple-300" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold font-mono flex items-center justify-center border border-[#101426] shadow-[0_0_8px_#a855f7]">
                {notificationsCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar with Online Status */}
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-400/60 p-0.5 overflow-hidden shadow-[0_0_12px_rgba(0,242,255,0.3)] bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Usuario"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#101426] shadow-[0_0_6px_#22c55e]" />
          </div>
        </div>
      </header>

      {/* 2. ENGINE STATUS BANNER */}
      <div className="bg-[#101426]/90 border border-cyan-500/20 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Wifi className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
                ENGINE: ACTIVO
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span>Android Bridge:</span>
              <span className={isNativeBridgeActive ? "text-emerald-400 font-bold" : "text-cyan-400 font-semibold"}>
                {isNativeBridgeActive ? 'Conectado (Celular Real)' : 'Conectado (Simulador Directo)'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            </p>
          </div>
        </div>

        {/* Dynamic Soundwave Animation on Right */}
        <div className="flex items-center gap-1 h-7 pr-2 shrink-0">
          {[30, 65, 90, 45, 100, 75, 85, 50, 95, 40, 70].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full animate-pulse shadow-[0_0_6px_#00f2ff]"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* 3. ACCESOS RÁPIDOS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono font-bold tracking-widest text-gray-300 uppercase flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            ACCESOS RÁPIDOS
          </span>
          <button
            onClick={() => setShowQuickAccess(!showQuickAccess)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showQuickAccess ? '' : '-rotate-90'}`} />
          </button>
        </div>

        {showQuickAccess && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Probar Voz */}
            <button
              onClick={() => {
                audioEngine.playSuccessPing();
                audioEngine.speak("Hola, soy Jarvis. Tu asistente inteligente de voz está totalmente activo.");
              }}
              className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-4 rounded-2xl border border-blue-400/40 text-left space-y-2.5 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Volume2 className="w-5 h-5 text-cyan-200" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wider font-bold text-cyan-200 uppercase">PROBAR VOZ</p>
                <p className="text-xs font-black text-white leading-snug">DE JARVIS</p>
              </div>
            </button>

            {/* 2. Asistente de Voz Activo */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-4 rounded-2xl border text-left space-y-2.5 transition-all cursor-pointer group ${
                isListening
                  ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.4)]'
                  : 'bg-[#181335]/90 border-purple-500/30 hover:border-purple-400/60 shadow-lg'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wider font-bold text-purple-300 uppercase">ASISTENTE</p>
                <p className="text-xs font-black text-white leading-snug">
                  {isListening ? 'ESCUCHANDO...' : 'DE VOZ ACTIVO'}
                </p>
              </div>
            </button>

            {/* 3. Accesibilidad Activa */}
            <button
              onClick={() => setAccessibilityActive(!accessibilityActive)}
              className={`p-4 rounded-2xl border text-left space-y-2.5 transition-all cursor-pointer group ${
                accessibilityActive
                  ? 'bg-[#0e2136]/90 border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                  : 'bg-slate-900/80 border-slate-700/50 opacity-60'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wider font-bold text-cyan-300 uppercase">ACCESIBILIDAD</p>
                <p className="text-xs font-black text-white leading-snug">
                  {accessibilityActive ? 'ACTIVA' : 'INACTIVA'}
                </p>
              </div>
            </button>

            {/* 4. Ajustes del Sistema */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.AndroidBridge?.openAccessibilitySettings) {
                  window.AndroidBridge.openAccessibilitySettings();
                } else {
                  onTestCommand("Ajustes del sistema");
                }
              }}
              className="bg-[#0d242a]/90 border border-teal-500/30 p-4 rounded-2xl text-left space-y-2.5 hover:border-teal-400/60 shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 group-hover:scale-110 transition-transform">
                <Settings className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-wider font-bold text-teal-300 uppercase">AJUSTES</p>
                <p className="text-xs font-black text-white leading-snug">DEL SISTEMA</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN DASHBOARD CONTENT GRID (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: VIRTUAL VOICE ORB & COMMAND LOGS (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* MAIN VIRTUAL ASSISTANT ORB CARD */}
          <div className="bg-[#101426]/90 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[420px] shadow-2xl backdrop-blur-md">
            
            {/* Header Title inside card */}
            <div className="w-full flex items-center gap-2 border-b border-cyan-500/10 pb-3 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-purple-300 uppercase">
                ASISTENTE VIRTUAL ACTIVO
              </span>
            </div>

            {/* Glowing Hero Headline */}
            <div className="space-y-1 my-2">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Presiona el Orbe para
              </h2>
              <p className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]">
                Hablar con Jarvis
              </p>
            </div>

            {/* Central Voice Orb with Soundwave visualizers on left & right */}
            <div className="relative my-4 flex items-center justify-center gap-6 w-full max-w-md">
              
              {/* Left Equalizer Lines */}
              <div className="flex items-center gap-1 h-12 shrink-0">
                {[40, 75, 100, 60, 85].map((h, i) => (
                  <div
                    key={`l-${i}`}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isListening ? 'bg-cyan-400 animate-bounce shadow-[0_0_8px_#00f2ff]' : 'bg-cyan-500/40'
                    }`}
                    style={{ height: isListening ? `${h}%` : '20%', animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>

              {/* Multi-layered Glowing Orb Button */}
              <div className="relative shrink-0">
                {/* Glow rings */}
                <div
                  className={`absolute -inset-4 rounded-full blur-xl transition-all duration-500 ${
                    isListening
                      ? 'bg-cyan-400/50 animate-ping'
                      : isSpeaking
                      ? 'bg-emerald-400/40 animate-pulse'
                      : 'bg-purple-600/30'
                  }`}
                />

                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center border-4 transition-all duration-300 cursor-pointer shadow-2xl ${
                    isListening
                      ? 'bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 border-cyan-300 shadow-[0_0_40px_rgba(0,242,255,0.8)] scale-105'
                      : isSpeaking
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-600 border-emerald-300 shadow-[0_0_35px_rgba(34,197,94,0.7)]'
                      : isProcessing
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.7)] animate-pulse'
                      : 'bg-[#0a0d1d] border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_25px_rgba(0,242,255,0.3)] hover:scale-105'
                  }`}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#121832] to-[#0a0c18] border border-cyan-400/40 flex items-center justify-center shadow-inner">
                    <Mic className={`w-10 h-10 ${isListening ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
                  </div>
                </button>
              </div>

              {/* Right Equalizer Lines */}
              <div className="flex items-center gap-1 h-12 shrink-0">
                {[85, 60, 100, 75, 40].map((h, i) => (
                  <div
                    key={`r-${i}`}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isListening ? 'bg-purple-400 animate-bounce shadow-[0_0_8px_#a855f7]' : 'bg-purple-500/40'
                    }`}
                    style={{ height: isListening ? `${h}%` : '20%', animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>

            {/* Helper State Text */}
            <div className="min-h-[28px] max-w-md w-full px-2 my-1">
              <p className="text-xs font-mono text-gray-400">
                {transcript ? (
                  <span className="text-cyan-300 font-sans italic font-medium">"{transcript}"</span>
                ) : isListening ? (
                  <span className="text-cyan-400 font-bold tracking-wider uppercase animate-pulse">
                    Escuchando comando de voz...
                  </span>
                ) : isProcessing ? (
                  <span className="text-amber-400 font-bold uppercase animate-pulse">
                    Procesando orden con IA...
                  </span>
                ) : isSpeaking ? (
                  <span className="text-emerald-400 font-bold uppercase animate-pulse">
                    Jarvis respondiendo por voz...
                  </span>
                ) : (
                  'Micrófono libre. Haz clic para activar el reconocimiento de voz.'
                )}
              </p>
            </div>

            {/* Last Execution Intent Output */}
            {lastIntent && (
              <div className="w-full bg-[#0a0c1a]/90 border border-cyan-500/20 rounded-xl p-3 text-left font-mono text-xs my-2 space-y-1">
                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                  <span className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider">ÚLTIMA ACCIÓN</span>
                  <span className="text-purple-300 font-bold text-[10px] uppercase">{lastIntent.action}</span>
                </div>
                <p className="text-white font-sans text-xs font-bold pt-1">{lastIntent.feedbackText}</p>
              </div>
            )}

            {/* Text Command Input Bar at Bottom */}
            <form onSubmit={handleManualSubmit} className="w-full max-w-lg mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Keyboard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={manualCommand}
                  onChange={(e) => setManualCommand(e.target.value)}
                  placeholder="Escribe un comando..."
                  className="w-full bg-[#0a0c1b] border border-cyan-500/20 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all shrink-0 cursor-pointer"
                title="Enviar comando"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* HISTORIAL DE ACCIONES CARD */}
          <div className="bg-[#101426]/90 border border-cyan-500/20 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white">
                  HISTORIAL DE ACCIONES
                </h3>
              </div>
              <button
                onClick={() => onTestCommand("Ver historial de acciones")}
                className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg transition-colors"
              >
                VER TODO
              </button>
            </div>

            {/* Display empty state or command logs */}
            {logs.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                {/* Illustration icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#161d3b] to-[#0c1024] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.15)]">
                  <CheckCircle2 className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Aún no hay acciones registradas</p>
                  <p className="text-xs text-gray-400 font-sans">
                    Tus comandos de voz y acciones aparecerán aquí.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#0a0c1b] border border-cyan-500/10 rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-sans italic font-medium truncate">"{log.transcript}"</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                        <span className="text-cyan-400 font-bold uppercase">{log.intent.action}</span>
                        <span>•</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      EJECUTADO
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: AGENDA DE CONTACTOS & APLICACIONES INTEGRADAS (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* AGENDA DE CONTACTOS CARD */}
          <div className="bg-[#101426]/90 border border-cyan-500/20 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white">
                  AGENDA DE CONTACTOS
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg">
                VER TODOS
              </span>
            </div>

            {/* Manual add contact form */}
            <form onSubmit={handleCreateContact} className="space-y-2.5 bg-[#0a0c1b] p-3 rounded-xl border border-cyan-500/15">
              <span className="text-[10px] font-mono font-bold uppercase text-gray-400 block">
                Agregar contacto manual
              </span>
              <div className="space-y-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre"
                    className="w-full bg-[#101426] border border-cyan-500/20 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Teléfono (ej: +57...)"
                    className="w-full bg-[#101426] border border-cyan-500/20 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider font-mono rounded-lg transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer"
              >
                + AGREGAR CONTACTO
              </button>
            </form>

            {/* List of contacts */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0a0c1b] border border-cyan-500/10 rounded-xl p-2.5 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-9 h-9 rounded-full border border-cyan-400/30 object-cover shrink-0 bg-slate-900"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{c.phone}</p>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onTestCommand(`Llamar a ${c.nickname || c.name}`)}
                      className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                      title="Llamar por voz"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onTestCommand(`Enviar mensaje a ${c.nickname || c.name} por WhatsApp`)}
                      className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
                      title="Enviar WhatsApp por voz"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteContact(c.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Eliminar contacto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* APLICACIONES INTEGRADAS CARD */}
          <div className="bg-[#101426]/90 border border-cyan-500/20 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white">
                  APLICACIONES INTEGRADAS
                </h3>
              </div>
            </div>

            {/* Grid of 8 app shortcut icons matching Image 2 */}
            <div className="grid grid-cols-4 gap-3 pt-1">
              {systemAppIcons.map((app, idx) => (
                <button
                  key={idx}
                  onClick={() => onTestCommand(app.cmd)}
                  className="flex flex-col items-center text-center gap-1.5 group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    {app.icon}
                  </div>
                  <span className="text-[10px] font-sans font-semibold text-gray-300 group-hover:text-white transition-colors truncate w-full">
                    {app.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAllAppsModal(true)}
              className="w-full py-2 bg-[#0a0c1b] hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-400/40 text-cyan-400 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>VER TODAS (12)</span>
            </button>
          </div>

        </div>

      </div>

      {/* 5. BOTTOM ROBOT BANNER */}
      <div className="bg-gradient-to-r from-[#101428] via-[#141b38] to-[#0e1224] border border-cyan-500/25 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <JarvisRobotAvatar size="w-14 h-14" />
          <div className="space-y-1 text-left">
            <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
              Jarvis siempre listo para ayudarte
            </h3>
            <p className="text-xs text-gray-400 max-w-xl leading-relaxed font-sans">
              Se conecta con tu sistema operativo para lanzar y controlar tus aplicaciones de manera instantánea mediante órdenes de voz.
            </p>
          </div>
        </div>

        {/* Dynamic soundwave right */}
        <div className="flex items-center gap-1 h-8 shrink-0">
          {[20, 50, 80, 100, 60, 90, 40, 70, 95, 30].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-cyan-400 to-purple-500 rounded-full animate-pulse shadow-[0_0_6px_#00f2ff]"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 6. BOTTOM NAVIGATION DOCK BAR (Sticky / Fixed at bottom of screen) */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-50 bg-[#0c1022]/95 border border-cyan-500/30 rounded-2xl px-4 py-2 shadow-[0_0_30px_rgba(0,242,255,0.25)] backdrop-blur-xl flex items-center justify-around">
        
        {/* Inicio */}
        <button
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'inicio' ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'inicio' ? 'bg-blue-600/30 border border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono font-bold">Inicio</span>
        </button>

        {/* Asistente */}
        <button
          onClick={() => {
            setActiveTab('asistente');
            startListening();
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'asistente' ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Mic className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">Asistente</span>
        </button>

        {/* Central Floating Mic Orb */}
        <div className="relative -top-5 shrink-0">
          <div className="absolute -inset-2 rounded-full bg-cyan-400/30 blur-md animate-pulse" />
          <button
            onClick={isListening ? stopListening : startListening}
            className={`relative w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-600 to-purple-600 border-2 border-cyan-300 flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,242,255,0.8)] cursor-pointer hover:scale-105 transition-transform ${
              isListening ? 'animate-bounce' : ''
            }`}
          >
            <Mic className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Contactos */}
        <button
          onClick={() => setActiveTab('contactos')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'contactos' ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">Contactos</span>
        </button>

        {/* Ajustes */}
        <button
          onClick={() => {
            setActiveTab('ajustes');
            if (typeof window !== 'undefined' && window.AndroidBridge?.openAccessibilitySettings) {
              window.AndroidBridge.openAccessibilitySettings();
            } else {
              setAccessibilityActive(!accessibilityActive);
            }
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'ajustes' ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-mono font-bold">Ajustes</span>
        </button>
      </nav>

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101426] border border-purple-500/30 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-400" />
                Notificaciones del Sistema
              </h3>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="text-gray-400 hover:text-white text-xs font-mono"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-2 text-xs font-sans">
              <div className="p-3 bg-[#0a0c1b] border border-cyan-500/10 rounded-xl space-y-1">
                <p className="font-bold text-cyan-300">Conexión con Android Puente OK</p>
                <p className="text-gray-400 text-[11px]">Jarvis está listo para recibir comandos de voz directamente desde tu celular.</p>
              </div>
              <div className="p-3 bg-[#0a0c1b] border border-purple-500/10 rounded-xl space-y-1">
                <p className="font-bold text-purple-300">Servicio de Accesibilidad Activo</p>
                <p className="text-gray-400 text-[11px]">Control automático de WhatsApp y llamadas habilitado.</p>
              </div>
              <div className="p-3 bg-[#0a0c1b] border border-emerald-500/10 rounded-xl space-y-1">
                <p className="font-bold text-emerald-300">Sintetizador de Voz TTS Creado</p>
                <p className="text-gray-400 text-[11px]">Respuesta por voz en español latino con alta fidelidad.</p>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationsModal(false)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* All Apps Modal */}
      {showAllAppsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101426] border border-cyan-500/30 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-cyan-400" />
                Todas las Aplicaciones ({installedApps.length})
              </h3>
              <button
                onClick={() => setShowAllAppsModal(false)}
                className="text-gray-400 hover:text-white text-xs font-mono"
              >
                Cerrar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {installedApps.map((app, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setShowAllAppsModal(false);
                    onTestCommand(`Abrir ${app.name}`);
                  }}
                  className="p-2.5 bg-[#0a0c1b] border border-cyan-500/10 hover:border-cyan-400/40 rounded-xl text-left flex items-center gap-2.5 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0">
                    <Grid className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{app.name}</p>
                    <p className="text-[9px] font-mono text-gray-500 truncate">{app.packageName}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAllAppsModal(false)}
              className="w-full py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
