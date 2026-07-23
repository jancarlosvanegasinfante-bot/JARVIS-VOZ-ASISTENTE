import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Send, Clock, Globe, Bell, FileText, Music, Play, Pause, SkipForward, BarChart3, X, Check, Search, TrendingUp, DollarSign, Package } from 'lucide-react';
import { IntentResult, SalesData } from '../types';

interface ActionOverlayProps {
  intent: IntentResult;
  onClose: () => void;
  salesData?: SalesData;
}

export const ActionOverlay: React.FC<ActionOverlayProps> = ({ intent, onClose, salesData }) => {
  const { action, params, feedbackText } = intent;

  // Phone Call State
  const [callDuration, setCallDuration] = useState(0);
  const [callConnected, setCallConnected] = useState(false);

  // Music Player State
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (action === 'make_call') {
      const timer = setTimeout(() => setCallConnected(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [action]);

  useEffect(() => {
    if (action === 'make_call' && callConnected) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [action, callConnected]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#0a0a0c]/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200 font-sans">
      {/* Top Header bar with close button */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-ping shadow-[0_0_8px_#00f2ff]" />
          <span className="text-xs font-mono font-bold text-[#00f2ff] uppercase tracking-wider">
            Acción Ejecutada: {action}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Rendered by Action Type */}
      <div className="my-auto py-4">
        {/* 1. MAKE CALL OVERLAY */}
        {action === 'make_call' && (
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-[#00f2ff]/20 border border-[#00f2ff]/50 mx-auto flex items-center justify-center text-3xl font-mono font-bold text-[#00f2ff] shadow-[0_0_25px_rgba(0,242,255,0.3)]">
                {(params.contact || 'Desconocido').charAt(0)}
              </div>
              {callConnected && (
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-green-500 border-2 border-[#0a0a0c] flex items-center justify-center text-slate-950 text-[10px] font-black">
                  ✓
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-1">{params.contact || 'Contacto'}</h2>
              <p className="text-xs font-mono text-gray-400 mb-2">{params.phoneNumber || '+57 300 000 0000'}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-[#141418] border border-white/10 text-[#00f2ff] text-xs font-mono">
                {callConnected ? `Llamada en curso: ${formatDuration(callDuration)}` : 'Conectando llamada...'}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6">
              <button
                onClick={onClose}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 transition-all active:scale-95"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          </div>
        )}

        {/* 2. SEND SMS OVERLAY */}
        {action === 'send_sms' && (
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-full bg-[#00f2ff]/20 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff] font-bold text-sm">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Mensaje SMS Enviado</h3>
                <p className="text-xs font-mono text-[#00f2ff]">Para: {params.contact || 'Contacto'}</p>
              </div>
            </div>

            <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/10 text-xs text-gray-200 font-mono">
              <p className="italic">"{params.message || 'Mensaje de texto por voz'}"</p>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1 text-green-400 font-medium">
                <Check className="w-3.5 h-3.5" /> SMS Entregado por operador nativo
              </span>
              <span>Hace instantes</span>
            </div>
          </div>
        )}

        {/* 3. SET REMINDER / ALARM OVERLAY */}
        {action === 'set_reminder' && (
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/20 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Alarma y Recordatorio Creado</h3>
                <p className="text-xs font-mono text-[#00f2ff]">Android AlarmManager System API</p>
              </div>
            </div>

            <div className="bg-[#0a0a0c] p-3.5 rounded-xl border border-white/10 space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Título:</span>
                <span className="text-xs font-semibold text-white">{params.title || 'Recordatorio Jarvis'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Hora:</span>
                <span className="text-sm font-bold text-[#00f2ff]">{params.time || '07:00 AM'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Fecha:</span>
                <span className="text-xs text-gray-300">{params.date || 'Hoy'}</span>
              </div>
            </div>

            <div className="text-center text-[11px] font-mono text-[#00f2ff] font-medium">
              🔔 Sonará en la hora programada en tu teléfono.
            </div>
          </div>
        )}

        {/* 4. JANBOT / JANSEL SHOP BUSINESS QUERY OVERLAY */}
        {action === 'janbot_query' && (
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f2ff] to-[#0066ff] flex items-center justify-center text-slate-950 font-bold shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                  <BarChart3 className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Jansel Shop • Reporte de Ventas</h3>
                  <p className="text-[10px] font-mono text-[#00f2ff]">Integración en tiempo real JANBOT API</p>
                </div>
              </div>
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-mono">
                EN VIVO
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono">
              <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-gray-400 block mb-0.5">Ventas Totales Hoy</span>
                <p className="text-base font-bold text-green-400">
                  ${(salesData?.todaySales || 2840000).toLocaleString('es-CO')} COP
                </p>
              </div>

              <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-gray-400 block mb-0.5">Pedidos Confirmados</span>
                <p className="text-base font-bold text-[#00f2ff]">
                  {salesData?.ordersCount || 18} Pedidos
                </p>
              </div>
            </div>

            <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/10 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#00f2ff]" /> Producto Top:
                </span>
                <span className="font-medium text-white truncate max-w-[140px]">
                  {salesData?.topProduct || 'Curso IA JanBot'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" /> Tasa Conversión:
                </span>
                <span className="font-bold text-green-400">
                  {salesData?.conversionRate || '4.8%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Inversión JanAds:
                </span>
                <span className="text-gray-300">
                  ${(salesData?.adsSpent || 320000).toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 5. CONTROL MUSIC / SPOTIFY OVERLAY */}
        {action === 'control_music' && (
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00f2ff] to-green-400 mx-auto flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(0,242,255,0.4)]">
              <Music className="w-10 h-10 animate-pulse text-slate-950" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{params.track || 'JanBot Audio Playlist'}</h3>
              <p className="text-xs text-[#00f2ff] font-mono font-medium">Spotify Music Player</p>
            </div>

            {/* Simulated Progress bar */}
            <div className="space-y-1 font-mono">
              <div className="w-full h-1.5 bg-[#0a0a0c] rounded-full overflow-hidden">
                <div className="h-full bg-[#00f2ff] w-2/5 rounded-full shadow-[0_0_8px_#00f2ff]" />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>1:24</span>
                <span>3:45</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6 pt-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_15px_#00f2ff] transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-6 h-6 text-slate-950" /> : <Play className="w-6 h-6 ml-0.5 text-slate-950" />}
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 6. SEARCH WEB OVERLAY */}
        {action === 'search_web' && (
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 bg-[#0a0a0c] border border-white/10 px-3 py-2 rounded-xl text-xs text-white">
              <Search className="w-4 h-4 text-[#00f2ff]" />
              <span className="flex-1 truncate font-mono">"{params.query || 'Búsqueda en Google'}"</span>
              <Globe className="w-4 h-4 text-gray-500" />
            </div>

            <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/10 space-y-2 text-xs">
              <h4 className="font-bold text-[#00f2ff] uppercase font-mono">Resultados de Búsqueda</h4>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Obteniendo información en tiempo real desde los servidores de Google...
              </p>
              <div className="p-2 bg-[#141418] rounded border border-white/5 text-[11px] font-mono text-gray-400">
                💡 Jarvis sintetiza las mejores fuentes para darte la respuesta leída por voz.
              </div>
            </div>
          </div>
        )}

        {/* 7. READ NOTIFICATIONS OVERLAY */}
        {action === 'read_notifications' && (
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              Lectura de Notificaciones Android
            </div>

            <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">WhatsApp • Juan Carlos</span>
                <span className="text-[10px] text-gray-500">Hace 5 min</span>
              </div>
              <p className="text-gray-300 italic">
                "¿A qué hora nos vemos hoy para revisar la arquitectura del bot?"
              </p>
            </div>
          </div>
        )}

        {/* 8. DICTATE NOTE OVERLAY */}
        {action === 'dictate_note' && (
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              Nota Rápida Guardada
            </div>

            <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
              <h4 className="font-bold text-white">{params.title || 'Nota Jarvis'}</h4>
              <p className="text-gray-300 leading-relaxed">{params.content || 'Contenido de la nota guardada por voz.'}</p>
            </div>
          </div>
        )}

        {/* 9. OPEN APP OVERLAY */}
        {action === 'open_app' && (
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00f2ff] to-[#0066ff] mx-auto flex items-center justify-center text-slate-950 font-bold text-xl shadow-[0_0_20px_rgba(0,242,255,0.4)]">
              {(params.appName || 'App').charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Abriendo {params.appName || 'Aplicación'}</h3>
              <p className="text-xs font-mono text-gray-400">PackageManager Android Intent Executed</p>
            </div>
          </div>
        )}
      </div>

      {/* Voice Feedback Text Box */}
      <div className="bg-[#141418] p-3 rounded-xl border border-white/10 text-xs text-white text-center font-mono">
        <p className="text-[#00f2ff] font-medium">"{feedbackText}"</p>
      </div>
    </div>
  );
};
