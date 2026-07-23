import React, { useState } from 'react';
import {
  Cpu,
  Shield,
  Users,
  History,
  CheckCircle2,
  Zap,
  Code,
  Terminal,
  Server,
  Layers,
  Sparkles,
  PhoneCall,
  MessageCircle,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { CommandLog, Contact, IntentResult } from '../types';

interface DashboardProps {
  logs: CommandLog[];
  contacts: Contact[];
  onAddContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  accessibilityActive: boolean;
  setAccessibilityActive: (val: boolean) => void;
  lastIntent: IntentResult | null;
  onTestCommand: (cmd: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  logs,
  contacts,
  onAddContact,
  onDeleteContact,
  accessibilityActive,
  setAccessibilityActive,
  lastIntent,
  onTestCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'cascade' | 'accessibility' | 'contacts' | 'logs' | 'roadmap'>('cascade');

  // New contact form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newPhone) {
      onAddContact({
        id: `c_${Date.now()}`,
        name: newName,
        phone: newPhone,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
        hasWhatsapp: true,
      });
      setNewName('');
      setNewPhone('');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans">
      {/* Top Banner Header */}
      <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_8px_#00f2ff]" />
            <span className="text-xs font-mono font-bold text-[#00f2ff] uppercase tracking-widest">
              Arquitectura de Voz Jarvis v1.0.4-STABLE
            </span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">
            JARVIS CORE <span className="text-[#00f2ff] not-italic font-mono text-lg">• Technical Control Panel</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl font-mono">
            Inspección de IA en cascada (NVIDIA NIM + OpenRouter + Gemini 3.6 Flash), Servicio de Accesibilidad Android para WhatsApp personal, y registro telemétrico.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAccessibilityActive(!accessibilityActive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 border transition-all ${
              accessibilityActive
                ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>ACCESSIBILITY SERVICE: {accessibilityActive ? 'ACTIVE' : 'INACTIVE'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'cascade', label: 'Cascada de IA LLM', icon: Cpu },
          { id: 'accessibility', label: 'Servicio Accesibilidad WA', icon: Shield },
          { id: 'contacts', label: 'Agenda de Contactos', icon: Users },
          { id: 'logs', label: 'Historial Telemétrico', icon: History },
          { id: 'roadmap', label: 'Roadmap & Fases', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#0066ff] text-slate-950 font-bold shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                  : 'bg-[#141418] hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CASCADING AI LLM INSPECTOR */}
      {activeTab === 'cascade' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cascade Providers Flow */}
          <div className="md:col-span-2 bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00f2ff]" />
              Flujo de Cascada de Inferencias LLM
            </h3>

            <div className="space-y-3">
              {/* Provider 1 */}
              <div className="bg-[#0a0a0c] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff] font-bold text-xs font-mono">
                    1º
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">NVIDIA NIM (LLaMA-3.3 70B Instruct)</h4>
                    <p className="text-[11px] text-gray-400 font-mono">Inferencia ultra-rápida microsegundos • Intenciones directas</p>
                  </div>
                </div>
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-mono">
                  ~110ms
                </span>
              </div>

              {/* Fallback 2 */}
              <div className="bg-[#0a0a0c] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs font-mono">
                    2º
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">OpenRouter (DeepSeek-R1 / LLaMA)</h4>
                    <p className="text-[11px] text-gray-400 font-mono">Fallback para comandos complejos con razonamiento</p>
                  </div>
                </div>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded font-mono">
                  ~240ms
                </span>
              </div>

              {/* Fallback 3 */}
              <div className="bg-[#0a0a0c] p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00f2ff]/20 border border-[#00f2ff]/50 flex items-center justify-center text-[#00f2ff] font-bold text-xs font-mono">
                    3º
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Gemini 3.6 Flash (Google AI Studio Backend)</h4>
                    <p className="text-[11px] text-gray-400 font-mono">Servidor Node.js Express • Schema JSON Estricto Garantizado</p>
                  </div>
                </div>
                <span className="text-[10px] bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 px-2 py-0.5 rounded font-mono">
                  ACTIVO
                </span>
              </div>
            </div>

            {/* Quick Test Prompt Launcher */}
            <div className="pt-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-gray-400 block mb-2">
                Probar Inferencia por Servidor:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Mandale un whatsapp a Juan que llego en 10 min',
                  '¿Llamar a Mamá?',
                  '¿Ventas de hoy Jansel Shop?',
                ].map((testCmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => onTestCommand(testCmd)}
                    className="text-xs font-mono bg-[#0a0a0c] hover:bg-white/10 text-[#00f2ff] border border-white/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Zap className="w-3 h-3 text-[#00f2ff]" />
                    <span>{testCmd}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Last Parsed Intent JSON Output Inspector */}
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-[#00f2ff]" />
              Inspector de Salida JSON
            </h3>

            {lastIntent ? (
              <div className="bg-[#0a0a0c] p-3 rounded-xl border border-white/10 font-mono text-[11px] text-green-400 overflow-x-auto max-h-72">
                <pre>{JSON.stringify(lastIntent, null, 2)}</pre>
              </div>
            ) : (
              <div className="p-8 text-center text-xs font-mono text-gray-500 bg-[#0a0a0c] rounded-xl border border-white/10">
                Aún no hay intenciones parseadas. Inicia un comando de voz en el teléfono.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACCESSIBILITY SERVICE FOR WHATSAPP */}
      {activeTab === 'accessibility' && (
        <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Servicio de Accesibilidad Nivel Android OS (AccessibilityService)
              </h3>
              <p className="text-xs font-mono text-gray-400 mt-1">
                La técnica oficial usada por Tasker/AutoInput para automatización nativa de WhatsApp Personal sin requirir API Business.
              </p>
            </div>
            <button
              onClick={() => setAccessibilityActive(!accessibilityActive)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border ${
                accessibilityActive
                  ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
            >
              {accessibilityActive ? 'SERVICIOM HABILITADO EN ANDROID' : 'HABILITAR SERVICIO'}
            </button>
          </div>

          {/* Technical Architecture Step Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0a0a0c] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-mono font-bold text-xs">
                1
              </div>
              <h4 className="text-xs font-bold text-white">Lanzamiento de Intent URL</h4>
              <p className="text-[11px] font-mono text-gray-400">
                Se invoca el intent nativo <code className="text-[#00f2ff]">wa.me/3004567890?text=...</code> que abre directamente el chat deseado.
              </p>
            </div>

            <div className="bg-[#0a0a0c] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-mono font-bold text-xs">
                2
              </div>
              <h4 className="text-xs font-bold text-white">Inspección de Nodos UI</h4>
              <p className="text-[11px] font-mono text-gray-400">
                AccessibilityService intercepta el evento <code className="text-[#00f2ff]">TYPE_WINDOW_STATE_CHANGED</code> y localiza el botón de envío.
              </p>
            </div>

            <div className="bg-[#0a0a0c] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-mono font-bold text-xs">
                3
              </div>
              <h4 className="text-xs font-bold text-white">Inyección & Tap Simulado</h4>
              <p className="text-[11px] font-mono text-gray-400">
                Se ejecuta <code className="text-[#00f2ff]">performAction(ACTION_CLICK)</code> enviando el mensaje instantáneamente sin requerir toque físico.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTACTS AGENDA */}
      {activeTab === 'contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Contact Form */}
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#00f2ff]" />
              Añadir Contacto a la Agenda
            </h3>

            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Nombre o Apodo:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Andrés Pérez"
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00f2ff]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Número de Teléfono:</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00f2ff]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-[#00f2ff] to-[#0066ff] text-slate-950 font-bold text-xs uppercase font-mono rounded-xl shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-all"
              >
                Guardar Contacto
              </button>
            </form>
          </div>

          {/* Contacts List */}
          <div className="md:col-span-2 bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00f2ff]" />
              Agenda de Contactos Reconocidos por Jarvis ({contacts.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0a0a0c] border border-white/10 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-white/20" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      <p className="text-[11px] text-gray-400 font-mono">{c.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onTestCommand(`Enviar WhatsApp a ${c.nickname || c.name} diciendo hola`)}
                      className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                      title="Probar enviar mensaje"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteContact(c.id)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOGS & TELEMETRY */}
      {activeTab === 'logs' && (
        <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#00f2ff]" />
            Registro de Ejecuciones y Telemetría
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-2.5 px-3">Hora</th>
                  <th className="py-2.5 px-3">Transcripción Voz</th>
                  <th className="py-2.5 px-3">Acción Parseada</th>
                  <th className="py-2.5 px-3">Proveedor IA</th>
                  <th className="py-2.5 px-3">Latencia</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-gray-400">{log.timestamp}</td>
                      <td className="py-2.5 px-3 text-white font-sans italic">"{log.transcript}"</td>
                      <td className="py-2.5 px-3 text-[#00f2ff] font-bold">{log.intent.action}</td>
                      <td className="py-2.5 px-3 text-gray-300">{log.providerUsed}</td>
                      <td className="py-2.5 px-3 text-green-400">{log.latencyMs}ms</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-[10px]">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500 font-mono">
                      Aún no hay registros de voz ejecutados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00f2ff]" />
            Roadmap de Construcción Android (Fases del Proyecto)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0a0a0c] p-4 rounded-xl border border-green-500/30 space-y-2">
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                Fase 1 — MVP (Completada)
              </span>
              <h4 className="text-xs font-bold text-white">Botón Flotante Persistente + STT + Cascada LLM</h4>
              <p className="text-[11px] font-mono text-gray-400">
                Overlay tipo Chat Heads de Facebook Messenger, Parser de intención por voz y TTS de respuesta.
              </p>
            </div>

            <div className="bg-[#0a0a0c] p-4 rounded-xl border border-green-500/30 space-y-2">
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                Fase 2 — WhatsApp Real (Completada)
              </span>
              <h4 className="text-xs font-bold text-white">Servicio de Accesibilidad Android + Matching Agenda</h4>
              <p className="text-[11px] font-mono text-gray-400">
                Inspector UI que abre el chat de WhatsApp y presiona enviar automáticamente.
              </p>
            </div>

            <div className="bg-[#0a0a0c] p-4 rounded-xl border border-[#00f2ff]/30 space-y-2">
              <span className="text-[10px] bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                Fase 3 — Wake Word + JANBOT (Integrada)
              </span>
              <h4 className="text-xs font-bold text-white">Activación "Oye Jarvis" + Métricas Jansel Shop</h4>
              <p className="text-[11px] font-mono text-gray-400">
                Picovoice Porcupine local para detección sin tocar y consultas de ventas del negocio.
              </p>
            </div>

            <div className="bg-[#0a0a0c] p-4 rounded-xl border border-white/10 space-y-2">
              <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded font-mono font-bold uppercase">
                Fase 4 — Modo Manos Libres en Carro
              </span>
              <h4 className="text-xs font-bold text-white">Confirmación por Voz e Integración Bluetooth</h4>
              <p className="text-[11px] font-mono text-gray-400">
                Lectura continua de mensajes entrantes y confirmación por voz antes de enviar mensajes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
