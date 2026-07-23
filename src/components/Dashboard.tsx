import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Shield,
  Users,
  History,
  Plus,
  Trash2,
  MessageCircle,
  Zap,
  AppWindow,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { CommandLog, Contact, IntentResult } from '../types';

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

  // Sync manual typing with command submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCommand.trim()) {
      onTestCommand(manualCommand.trim());
      setManualCommand('');
    }
  };

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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-4 md:px-0 font-sans pb-12">
      
      {/* Real-time Status Banner */}
      <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`w-3.5 h-3.5 rounded-full ${isNativeBridgeActive ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-[#00f2ff] shadow-[0_0_12px_#00f2ff] animate-pulse'}`} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#00f2ff]">
              {isNativeBridgeActive ? 'CONEXIÓN CON DISPOSITIVO ANDROID ACTIVA' : 'SISTEMA INTEGRADO DE COMANDOS'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight">
            INTERFAZ DE CONTROL REAL <span className="text-[#00f2ff] not-italic font-mono text-base">• Jarvis</span>
          </h1>
          <p className="text-xs text-gray-400 font-mono leading-relaxed max-w-3xl">
            {isNativeBridgeActive 
              ? 'Sincronizado de forma directa con tu celular. Todos los comandos que realices se procesan mediante IA y se ejecutan físicamente en tu dispositivo Android a través del puente de comunicación.'
              : 'Interactúa con Jarvis usando tu voz de forma real. Agrega tus contactos abajo, instala la aplicación en tu celular y controla todo de manera inalámbrica.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          <div className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 border ${
            isNativeBridgeActive 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-[#00f2ff]/10 border-[#00f2ff]/20 text-[#00f2ff]'
          }`}>
            <Smartphone className="w-4 h-4" />
            <span>{isNativeBridgeActive ? 'BRIDGE NATIVO: CONECTADO' : 'ASISTENTE DE VOZ ACTIVO'}</span>
          </div>

          <button
            onClick={() => setAccessibilityActive(!accessibilityActive)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-2 ${
              accessibilityActive
                ? 'bg-[#00f2ff]/15 text-[#00f2ff] border-[#00f2ff]/30 shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>ACCESIBILIDAD: {accessibilityActive ? 'ACTIVA' : 'INACTIVA'}</span>
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: VOICE ASSISTANT & COMMAND LOGS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Voice Orb Console */}
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center space-y-6 min-h-[380px] shadow-lg">
            
            {/* Ambient subtle glow backdrops */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[90px] transition-all duration-700 pointer-events-none ${
              isListening 
                ? 'bg-[#00f2ff]/15' 
                : isSpeaking 
                ? 'bg-green-500/10' 
                : isProcessing 
                ? 'bg-amber-500/10' 
                : 'bg-blue-500/5'
            }`} />

            <div className="space-y-1.5 z-10">
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-gray-400">Asistente Virtual Activo</h3>
              <p className="text-xl font-bold text-white tracking-tight">Presiona el Orbe para Hablar con Jarvis</p>
            </div>

            {/* Futuristic Sound Orbe / Microphone */}
            <div className="relative z-10">
              {/* Ping circles while listening */}
              {isListening && (
                <>
                  <div className="absolute -inset-6 rounded-full bg-[#00f2ff]/25 animate-ping" />
                  <div className="absolute -inset-12 rounded-full bg-[#00f2ff]/10 animate-pulse" />
                </>
              )}
              {isSpeaking && (
                <div className="absolute -inset-6 rounded-full bg-green-500/15 animate-pulse" />
              )}

              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isListening
                    ? 'bg-gradient-to-br from-[#00f2ff] to-[#0066ff] border-[#00f2ff] shadow-[0_0_35px_rgba(0,242,255,0.6)] scale-105'
                    : isSpeaking
                    ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)]'
                    : isProcessing
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse'
                    : 'bg-[#0a0a0c] border-[#00f2ff]/40 hover:border-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.25)] hover:scale-105'
                }`}
              >
                {isListening ? (
                  <Mic className="w-11 h-11 text-slate-950 animate-bounce" />
                ) : isSpeaking ? (
                  <Volume2 className="w-11 h-11 text-white animate-pulse" />
                ) : isProcessing ? (
                  <Sparkles className="w-11 h-11 text-white animate-spin" />
                ) : (
                  <Mic className="w-11 h-11 text-[#00f2ff]" />
                )}
              </button>
            </div>

            {/* Reactive Voice Bars Visualizer */}
            {isListening && (
              <div className="flex items-center gap-1.5 h-8 z-10">
                {[45, 80, 100, 65, 95, 55, 85, 70, 90, 40].map((height, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-[#00f2ff] rounded-full animate-pulse shadow-[0_0_8px_#00f2ff]"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Live Text Display / Speech output */}
            <div className="min-h-[50px] w-full max-w-lg z-10 space-y-1.5">
              <p className="text-sm font-medium font-sans text-gray-300 italic">
                {transcript ? (
                  `"${transcript}"`
                ) : isListening ? (
                  <span className="text-[#00f2ff] font-mono uppercase tracking-widest text-xs animate-pulse">
                    Escuchando lo que dices...
                  </span>
                ) : isProcessing ? (
                  <span className="text-amber-400 font-mono text-xs animate-pulse">
                    Procesando instrucción de voz...
                  </span>
                ) : isSpeaking ? (
                  <span className="text-green-400 font-mono text-xs animate-pulse">
                    Jarvis respondiendo por voz...
                  </span>
                ) : (
                  <span className="text-gray-500 font-mono text-xs">
                    Micrófono libre. Haz clic para activar el reconocimiento de voz.
                  </span>
                )}
              </p>
            </div>

            {/* Last execution response HUD */}
            {lastIntent && (
              <div className="w-full bg-[#0a0a0c]/80 border border-white/10 rounded-xl p-4 text-left font-mono text-xs z-10 space-y-1">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[#00f2ff] font-bold uppercase tracking-wider text-[10px]">
                    ÚLTIMA ACCIÓN EJECUTADA
                  </span>
                  <span className="text-gray-400 text-[10px] uppercase">
                    Acción: {lastIntent.action}
                  </span>
                </div>
                <p className="text-gray-200 font-sans text-sm font-bold mt-1.5">{lastIntent.feedbackText}</p>
                <div className="flex gap-4 text-[10px] text-gray-500 pt-1 uppercase">
                  <span>Confianza: {Math.round(lastIntent.confidence * 100)}%</span>
                  {isNativeBridgeActive && <span className="text-green-400 font-bold">● Ejecutada en Dispositivo Real</span>}
                </div>
              </div>
            )}

            {/* Quick Text Command Input */}
            <form onSubmit={handleManualSubmit} className="w-full max-w-md relative z-10 flex gap-2">
              <input
                type="text"
                value={manualCommand}
                onChange={(e) => setManualCommand(e.target.value)}
                placeholder="Escribe un comando (ej: Abrir WhatsApp o Llamar a...)"
                className="flex-1 bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00f2ff]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 hover:border-[#00f2ff] rounded-xl font-mono text-xs font-bold transition-all shrink-0"
              >
                Enviar
              </button>
            </form>
          </div>

          {/* Table: Command Logs Telemetry */}
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#00f2ff]" />
                Historial de Acciones y Telemetría
              </h3>
              <span className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-0.5 rounded font-mono">
                {logs.length} Comandos Reales
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase text-[9px] font-mono tracking-wider">
                    <th className="py-2.5 px-3">Hora</th>
                    <th className="py-2.5 px-3">Comando Escuchado</th>
                    <th className="py-2.5 px-3">Acción Procesada</th>
                    <th className="py-2.5 px-3">Ejecución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-2.5 px-3 text-white font-sans italic">"{log.transcript}"</td>
                        <td className="py-2.5 px-3 text-[#00f2ff] font-bold uppercase text-[10px]">{log.intent.action}</td>
                        <td className="py-2.5 px-3">
                          {isNativeBridgeActive ? (
                            <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-bold">
                              CELULAR REAL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 text-[9px] font-bold">
                              PROCESADO OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500 font-mono">
                        Esperando primer comando de voz... Presiona el botón del micrófono para comenzar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CONTACTS & COMPATIBLE APPS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section: Contacts Agenda */}
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00f2ff]" />
                Agenda de Contactos Reales
              </h3>
              <span className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-0.5 rounded font-mono">
                {contacts.length} Registrados
              </span>
            </div>

            {/* Form to Add Contact */}
            <form onSubmit={handleCreateContact} className="space-y-3 bg-[#0a0a0c] p-3 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono font-bold uppercase text-gray-400 block">Registrar Contacto Manual</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre"
                  className="bg-[#141418] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#00f2ff]"
                  required
                />
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Teléfono (ej: +57...)"
                  className="bg-[#141418] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#00f2ff]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-gradient-to-r from-[#00f2ff] to-[#0066ff] text-slate-950 font-bold text-[11px] uppercase font-mono rounded-lg transition-all"
              >
                Agregar Contacto
              </button>
            </form>

            {/* List of Contacts */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {contacts.length > 0 ? (
                contacts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#0a0a0c] border border-white/5 rounded-xl p-2.5 flex items-center justify-between hover:border-white/10 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={c.avatar} 
                        alt={c.name} 
                        className="w-8 h-8 rounded-full border border-white/10 shrink-0 bg-white/5" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{c.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onTestCommand(`Enviar mensaje a ${c.nickname || c.name} que ya voy de camino`)}
                        className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition"
                        title="Enviar WhatsApp por Voz"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteContact(c.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition"
                        title="Eliminar Contacto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-gray-500 font-mono text-xs">
                  Sincroniza tu celular o agrega tus contactos reales arriba.
                </div>
              )}
            </div>
          </div>

          {/* Section: Compatible System Apps */}
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
                <AppWindow className="w-4 h-4 text-[#00f2ff]" />
                Aplicaciones del Sistema Integradas
              </h3>
              <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded font-mono">
                {installedApps.length} Apps Detectadas
              </span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Jarvis se conecta con tu sistema operativo para lanzar y controlar tus aplicaciones de manera instantánea mediante órdenes de voz.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {installedApps.map((app) => (
                <div 
                  key={app.id || app.packageName} 
                  className="bg-[#0a0a0c] border border-white/5 rounded-xl p-3 flex items-center gap-3 hover:border-[#00f2ff]/30 transition group cursor-pointer"
                  onClick={() => onTestCommand(`Abrir ${app.name}`)}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-300 group-hover:text-[#00f2ff] transition shrink-0">
                    <AppWindow className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{app.name}</h4>
                    <p className="text-[9px] font-mono text-gray-500 truncate">{app.packageName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clean Action Shortcuts */}
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-3 shadow-lg">
            <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00f2ff]" />
              Filtro de Comandos Rápidos
            </h3>
            <p className="text-[11px] text-gray-400 leading-normal">
              Accesos directos para lanzar comandos de voz predefinidos con un toque:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Lanzar Spotify en Celular', cmd: 'Por favor abre Spotify ahora' },
                { label: 'Consultar Reporte de Ventas', cmd: 'Cuales son las ventas del dia de hoy en Jansel Shop' },
                { label: 'Iniciar llamada telefónica', cmd: 'Llamar por telefono' }
              ].map((test, index) => (
                <button
                  key={index}
                  onClick={() => onTestCommand(test.cmd)}
                  className="w-full text-left bg-[#0a0a0c] hover:bg-white/5 border border-white/5 hover:border-white/10 p-2.5 rounded-xl transition text-xs font-mono text-[#00f2ff]"
                >
                  <div className="font-bold text-white text-[10px] uppercase mb-0.5">{test.label}</div>
                  <div className="italic text-gray-400 font-sans text-[11px]">"{test.cmd}"</div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
