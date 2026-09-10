import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Bell,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
  AlertCircle,
  RefreshCw,
  Tag,
  Share2,
  CalendarCheck,
  Check,
  Flame,
  ArrowRight,
  ShieldCheck,
  Sliders,
  CheckSquare
} from 'lucide-react';
import { CalendarEvent, PhoneTask, SmartReminder, UserDeviceProfile, VoiceStyle } from '../types';
import { speakSmoothSophia, playHarmonicChime } from '../lib/smoothSpeech';

interface AgendaRemindersTabProps {
  userProfile?: UserDeviceProfile | null;
  onSendToVoiceAssistant?: (prompt: string) => void;
  voiceStyle?: VoiceStyle;
}

export const AgendaRemindersTab: React.FC<AgendaRemindersTabProps> = ({
  userProfile,
  onSendToVoiceAssistant,
  voiceStyle = 'profesional_ejecutiva'
}) => {
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<PhoneTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'reminders' | 'tasks' | 'events'>('today');

  // Form states for new reminder / event
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>('15:00');
  const [newPriority, setNewPriority] = useState<'alta' | 'media' | 'baja'>('alta');
  const [newCategory, setNewCategory] = useState<SmartReminder['category']>('personal');
  const [newReminderType, setNewReminderType] = useState<SmartReminder['reminderType']>('voice_alarm');
  const [newRepeat, setNewRepeat] = useState<SmartReminder['repeat']>('none');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAiOptimizing, setIsAiOptimizing] = useState<boolean>(false);
  const [aiOptimizedAdvice, setAiOptimizedAdvice] = useState<string | null>(null);

  // Quick reminder voice presets
  const VOICE_REMINDER_PRESETS = [
    { title: 'Tomar descanso visual & postura', time: '14:00', cat: 'salud_medicinas', priority: 'media' as const },
    { title: 'Reunión ejecutiva de proyecto', time: '16:00', cat: 'reunion_trabajo', priority: 'alta' as const },
    { title: 'Pagar tarjeta y servicios', time: '18:00', cat: 'pagos_finanzas', priority: 'alta' as const },
    { title: 'Enviar reporte de avance a cliente', time: '19:30', cat: 'llamada_mensaje', priority: 'alta' as const },
    { title: 'Prueba de sonido & TV Riviera', time: '20:30', cat: 'personal', priority: 'baja' as const }
  ];

  // Fetch agenda data
  const fetchAgendaOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agenda/overview');
      if (res.ok) {
        const data = await res.json();
        if (data.reminders) setReminders(data.reminders);
        if (data.events) setEvents(data.events);
        if (data.tasks) setTasks(data.tasks);
      }
    } catch (e) {
      console.warn('Error fetching agenda:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendaOverview();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Reminder
  const handleAddReminder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const payload = {
        title: newTitle.trim(),
        date: newDate,
        time: newTime,
        priority: newPriority,
        category: newCategory,
        reminderType: newReminderType,
        repeat: newRepeat,
        spokenAlert: `Atención ${userProfile?.userName || 'Usuario'}. Recordatorio programado: ${newTitle.trim()}`
      };

      const res = await fetch('/api/agenda/add-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reminder) {
          setReminders(prev => [data.reminder, ...prev]);
        }
        setShowAddModal(false);
        setNewTitle('');
        playHarmonicChime();
        showToast(`Recordatorio "${payload.title}" guardado en el cerebro de SophIA.`);
        speakSmoothSophia(
          `Recordatorio registrado con éxito para el ${newDate} a las ${newTime}. Te notificaré con mi alerta de voz.`,
          { voiceStyle }
        );
      }
    } catch (err) {
      showToast('Error al conectar con el servidor.');
    }
  };

  // Toggle Reminder Completed
  const handleToggleReminder = async (id: string) => {
    try {
      const res = await fetch('/api/agenda/toggle-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reminder) {
          setReminders(prev => prev.map(r => r.id === id ? data.reminder : r));
          if (data.reminder.completed) {
            playHarmonicChime();
            showToast('¡Recordatorio marcado como completado!');
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Delete Reminder
  const handleDeleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/agenda/reminder/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
        showToast('Recordatorio eliminado.');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Toggle Task Completed
  const handleToggleTask = async (id: string) => {
    try {
      const res = await fetch('/api/phone/toggle-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          setTasks(prev => prev.map(t => t.id === id ? data.task : t));
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Sync Phone
  const handleSyncPhone = async () => {
    try {
      playHarmonicChime();
      const res = await fetch('/api/agenda/sync-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceBrand: userProfile?.deviceBrand || 'Samsung',
          deviceModel: userProfile?.deviceModel || 'Galaxy',
          osName: userProfile?.osName || 'Android',
          batteryLevel: userProfile?.batteryLevel || 89,
          currentTime: new Date().toLocaleTimeString()
        })
      });
      if (res.ok) {
        showToast('Celular y agenda sincronizados en tiempo real.');
        speakSmoothSophia(
          `Tu ${userProfile?.deviceBrand || 'celular'} está 100% sincronizado con mi cerebro en tiempo real. Tienes ${reminders.filter(r => !r.completed).length} recordatorios pendientes hoy.`,
          { voiceStyle }
        );
      }
    } catch (e) {
      showToast('Error al sincronizar con el celular.');
    }
  };

  // AI Schedule Optimizer
  const handleAiOptimizeSchedule = async () => {
    setIsAiOptimizing(true);
    try {
      const res = await fetch('/api/agenda/ai-schedule-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userProfile?.userName || 'Usuario',
          events,
          reminders,
          tasks
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiOptimizedAdvice(data.planSummary || 'Tu agenda está optimizada para máxima productividad.');
        playHarmonicChime();
        speakSmoothSophia(data.spokenBriefing || 'He optimizado tu agenda de hoy con bloques de alta concentración.', { voiceStyle });
      }
    } catch (e) {
      setAiOptimizedAdvice('Agenda optimizada: Prioriza las reuniones de la tarde y los pagos antes de las 18:00.');
    } finally {
      setIsAiOptimizing(false);
    }
  };

  const getCategoryBadge = (cat: SmartReminder['category']) => {
    switch (cat) {
      case 'salud_medicinas':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30">💊 Salud / Medicina</span>;
      case 'reunion_trabajo':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">💼 Reunión / Trabajo</span>;
      case 'pagos_finanzas':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">💳 Pagos / Finanzas</span>;
      case 'llamada_mensaje':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30">📞 Llamada / Mensaje</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30">⭐ Personal</span>;
    }
  };

  const pendingRemindersCount = reminders.filter(r => !r.completed).length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-indigo-500/50 text-indigo-200 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-100 tracking-tight">
                Cerebro en Tiempo Real • Agenda & Recordatorios
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              SophIA gestiona tus compromisos diarios, alarmas por voz y tareas sincronizadas directamente con tu celular ({userProfile?.deviceBrand} {userProfile?.deviceModel || 'Smartphone'}).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncPhone}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
              title="Sincronizar con el celular"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sincronizar Celular</span>
            </button>

            <button
              onClick={handleAiOptimizeSchedule}
              disabled={isAiOptimizing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-900/40 transition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiOptimizing ? 'animate-spin' : ''}`} />
              <span>{isAiOptimizing ? 'Optimizando con IA...' : 'Organizar con IA'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-900/40 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Recordatorio</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Bell className="w-3 h-3 text-rose-400" /> Recordatorios Activos
            </span>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {pendingRemindersCount} <span className="text-xs font-normal text-slate-400">pendientes</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <CalendarCheck className="w-3 h-3 text-indigo-400" /> Eventos & Reuniones
            </span>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {events.length} <span className="text-xs font-normal text-slate-400">agendados</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-emerald-400" /> Tareas del Celular
            </span>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {pendingTasksCount} <span className="text-xs font-normal text-slate-400">por hacer</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-sky-400" /> Estado del Celular
            </span>
            <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {userProfile?.osName || 'Android'} ({userProfile?.batteryLevel || 89}% Bat)
            </div>
          </div>
        </div>

        {/* AI Optimized Advice Alert if generated */}
        {aiOptimizedAdvice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-indigo-200 text-xs flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-100">Plan de Optimización de SophIA: </span>
              {aiOptimizedAdvice}
            </div>
          </div>
        )}
      </div>

      {/* Quick Voice Presets Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
          ⚡ Comandos Rápidos de Voz para tu Agenda:
        </span>
        <div className="flex flex-wrap gap-2">
          {VOICE_REMINDER_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setNewTitle(p.title);
                setNewTime(p.time);
                setNewCategory(p.cat as any);
                setNewPriority(p.priority);
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-indigo-950/50 text-xs text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 transition flex items-center gap-1.5"
            >
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>{p.title} ({p.time})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'today', label: '📅 Agenda de Hoy' },
          { id: 'reminders', label: `🔔 Recordatorios (${reminders.length})` },
          { id: 'events', label: `🗓️ Calendario (${events.length})` },
          { id: 'tasks', label: `✅ Tareas (${tasks.length})` },
          { id: 'all', label: 'Todos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Agenda & Reminders Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Smart Reminders */}
        {(activeFilter === 'today' || activeFilter === 'reminders' || activeFilter === 'all') && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-400" /> Recordatorios con Alerta de Voz
              </h3>
              <span className="text-[11px] text-slate-400">{pendingRemindersCount} pendientes</span>
            </div>

            {reminders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No tienes recordatorios creados. Pulsa "Nuevo Recordatorio" o pídele a SophIA por voz.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {reminders.map(rem => (
                  <div
                    key={rem.id}
                    className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                      rem.completed
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleReminder(rem.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                      title={rem.completed ? 'Marcar pendiente' : 'Marcar completado'}
                    >
                      {rem.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-indigo-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${rem.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {rem.title}
                        </span>
                        {getCategoryBadge(rem.category)}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" /> {rem.time} • {rem.date}
                        </span>
                        {rem.reminderType === 'voice_alarm' && (
                          <span className="flex items-center gap-0.5 text-rose-300 text-[10px]">
                            <Volume2 className="w-3 h-3" /> Alerta de Voz
                          </span>
                        )}
                        {rem.priority === 'alta' && (
                          <span className="text-[10px] text-red-400 font-bold">ALTA</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => speakSmoothSophia(`Recordatorio de SophIA: ${rem.title}. Programado a las ${rem.time}.`, { voiceStyle })}
                        className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                        title="Escuchar alerta de voz de SophIA"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(rem.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Eliminar recordatorio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right Column: Calendar Events & Tasks */}
        {(activeFilter === 'today' || activeFilter === 'events' || activeFilter === 'tasks' || activeFilter === 'all') && (
          <div className="space-y-4">
            {/* Calendar Events */}
            {(activeFilter === 'today' || activeFilter === 'events' || activeFilter === 'all') && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-indigo-400" /> Eventos de Calendario
                  </h3>
                  <span className="text-[11px] text-slate-400">{events.length} reuniones</span>
                </div>

                <div className="space-y-2">
                  {events.map(ev => (
                    <div key={ev.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">{ev.title}</span>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="text-indigo-300 font-semibold">{ev.time} ({ev.durationMinutes} min)</span>
                          <span>• {ev.location || 'Meet'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {ev.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smartphone Tasks */}
            {(activeFilter === 'today' || activeFilter === 'tasks' || activeFilter === 'all') && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400" /> Tareas del Celular
                  </h3>
                  <span className="text-[11px] text-slate-400">{pendingTasksCount} por hacer</span>
                </div>

                <div className="space-y-2">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        task.completed ? 'bg-slate-950/40 border-slate-800/40 opacity-60' : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => handleToggleTask(task.id)} className="text-slate-400 hover:text-emerald-400">
                          {task.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                        </button>
                        <span className={`text-xs font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{task.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-400" /> Crear Nuevo Recordatorio
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título del Recordatorio:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tomar medicina, Reunión con Carlos..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha:</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hora:</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="personal">Personal</option>
                    <option value="reunion_trabajo">Reunión / Trabajo</option>
                    <option value="salud_medicinas">Salud / Medicina</option>
                    <option value="pagos_finanzas">Pagos / Finanzas</option>
                    <option value="llamada_mensaje">Llamada / Mensaje</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridad:</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Notificación:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewReminderType('voice_alarm')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      newReminderType === 'voice_alarm'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Alarma de Voz</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewReminderType('push_notification')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      newReminderType === 'push_notification'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Notificación Push</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-900/50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Recordatorio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
