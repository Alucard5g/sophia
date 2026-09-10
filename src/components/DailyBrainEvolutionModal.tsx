import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Globe,
  MessageSquare,
  Cpu,
  Zap,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import { DailyBrainEvolutionReport, BrainModelBenchmark, BrainDailyLearning, SystemEvolutionUpgrade } from '../types';
import { speakSmoothSophia, stopSmoothSophia } from '../lib/smoothSpeech';

interface DailyBrainEvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprovalComplete?: (report: DailyBrainEvolutionReport) => void;
  voiceStyle?: string;
}

export const DailyBrainEvolutionModal: React.FC<DailyBrainEvolutionModalProps> = ({
  isOpen,
  onClose,
  onApprovalComplete,
  voiceStyle = 'profesional_ejecutiva'
}) => {
  const [report, setReport] = useState<DailyBrainEvolutionReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'online' | 'chat' | 'models' | 'upgrades'>('overview');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [approvalSuccess, setApprovalSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen]);

  const fetchReport = () => {
    setIsLoading(true);
    fetch('/api/brain-evolution/daily-report')
      .then((res) => res.json())
      .then((data) => {
        if (data.report) {
          setReport(data.report);
          if (data.report.userApproved) {
            setApprovalSuccess(true);
          }
        }
      })
      .catch((err) => console.warn('Error cargando reporte de evolución del cerebro:', err))
      .finally(() => setIsLoading(false));
  };

  const handleApprove = () => {
    setIsApproving(true);
    fetch('/api/brain-evolution/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.report) {
          setReport(data.report);
          setApprovalSuccess(true);
          if (onApprovalComplete) {
            onApprovalComplete(data.report);
          }

          // Vocal feedback by SophIA
          const speech = data.spokenConfirmation || 'Actualización y enriquecimiento de mi sistema y cerebro aprobados con éxito.';
          setIsSpeaking(true);
          speakSmoothSophia(speech, {
            voiceStyle: 'profesional_ejecutiva',
            onEnd: () => setIsSpeaking(false)
          });
        }
      })
      .catch((err) => console.warn('Error al aprobar evolución del cerebro:', err))
      .finally(() => setIsApproving(false));
  };

  const handleSpeakReport = () => {
    if (isSpeaking) {
      stopSmoothSophia();
      setIsSpeaking(false);
      return;
    }
    if (!report) return;

    const speechText = `Informe de evolución diaria de SophIA para hoy, ${report.date}. He enriquecido mi cerebro con las últimas novedades de Google Search 2026, consolidado ${report.chatInsightsAbsorbed} memorias de tus interacciones y sincronizado la suite de 8 modelos de inteligencia artificial. Presento 3 mejoras de sistema en lógica pura, código completo y calibración vocal para tu aprobación.`;
    setIsSpeaking(true);
    speakSmoothSophia(speechText, {
      voiceStyle: 'profesional_ejecutiva',
      onEnd: () => setIsSpeaking(false)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Holographic Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-950/50">
                <Brain className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>Informe de Auto-Actualización y Enriquecimiento Diario</span>
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {report?.brainVersion || 'SophIA AGI v5.2'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Regla & Ley VIII
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {report?.formattedDate || 'Sincronización Diaria del Cerebro y Ecosistema Multi-IA'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSpeakReport}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-200 border-indigo-500/40'
              }`}
              title={isSpeaking ? 'Silenciar informe' : 'Escuchar informe en voz alta'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Pausar Voz' : 'Escuchar Informe'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isSpeaking) stopSmoothSophia();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center px-6 py-2 bg-slate-950/60 border-b border-slate-800/80 gap-1.5 overflow-x-auto text-xs font-medium">
          {[
            { id: 'overview', label: '📊 Resumen General', icon: Brain },
            { id: 'online', label: '🌐 Conocimiento en Línea', icon: Globe },
            { id: 'chat', label: '💬 Aprendizajes del Chat', icon: MessageSquare },
            { id: 'models', label: '🧠 Sinergia de Modelos (Ley VII)', icon: Cpu },
            { id: 'upgrades', label: '⚙️ 3 Mejoras de Sistema', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-400 font-medium">Sintetizando informe de evolución diaria del cerebro...</p>
            </div>
          ) : report ? (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
                    report.userApproved
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                      : 'bg-indigo-950/50 border-indigo-500/40 text-indigo-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${report.userApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {report.userApproved ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{report.userApproved ? 'Cerebro y Sistema Actualizados y Aprobados' : 'Informe Pendiente de Aprobación del Creador'}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                            {report.overallReadiness}% Eficiencia
                          </span>
                        </div>
                        <p className="text-xs opacity-85 mt-0.5">
                          {report.userApproved
                            ? `Aprobado por el usuario (${report.approvalTimestamp ? new Date(report.approvalTimestamp).toLocaleTimeString() : 'Hoy'}) • 8 Leyes Activas`
                            : 'Revisa las mejoras de conocimiento y modelos de hoy antes de autorizar la consolidación final.'}
                        </p>
                      </div>
                    </div>

                    {!report.userApproved && (
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isApproving ? 'Consolidando...' : 'Aprobar Actualización'}</span>
                      </button>
                    )}
                  </div>

                  {/* Summary Text */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Dictamen del Auto-Enriquecimiento Neural:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {report.summary}
                    </p>
                  </div>

                  {/* 3 Pillars of Evolution Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/30 space-y-2">
                      <div className="flex items-center space-x-2 text-sky-400">
                        <Globe className="w-4 h-4" />
                        <h4 className="text-xs font-bold">1. Conocimiento en Línea</h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Sincronización con Google Search Grounding 2026 en vivo para eventos y validación temporal al segundo.
                      </p>
                      <span className="inline-block text-[10px] font-mono text-sky-300 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                        Grounding en Vivo Activo
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/30 space-y-2">
                      <div className="flex items-center space-x-2 text-teal-400">
                        <MessageSquare className="w-4 h-4" />
                        <h4 className="text-xs font-bold">2. Conocimiento del Chat</h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {report.chatInsightsAbsorbed} interacciones y memorias persistentes indexadas para recordar tus preferencias y proyectos.
                      </p>
                      <span className="inline-block text-[10px] font-mono text-teal-300 font-bold bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                        {report.chatInsightsAbsorbed} Puntos Aprendidos
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-2">
                      <div className="flex items-center space-x-2 text-purple-400">
                        <Cpu className="w-4 h-4" />
                        <h4 className="text-xs font-bold">3. Modelos del Cerebro</h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Sinergia y obediencia estricta a la selección de modelo (DeepSeek-R1, Gemini 3.1, Claude 3.7, GPT-4.5).
                      </p>
                      <span className="inline-block text-[10px] font-mono text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                        Ley VII & Suite AGI
                      </span>
                    </div>
                  </div>

                  {/* Upgrades Preview */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        3 Mejoras de Sistema Incluidas en la Actualización:
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('upgrades')}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <span>Ver detalles completos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {report.proposedUpgrades.map((upg, idx) => (
                        <div key={upg.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-900/70 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <h5 className="text-xs font-bold text-slate-200">{upg.title}</h5>
                              <p className="text-[11px] text-slate-400">{upg.description}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
                            {upg.previousVersion} → {upg.newVersion}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ONLINE KNOWLEDGE (GOOGLE SEARCH) */}
              {activeTab === 'online' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-start space-x-3">
                    <Globe className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-sky-200">Enriquecimiento con Conocimiento en Línea (Google Search Grounding)</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        SophIA valida en tiempo real los acontecimientos globales, datos bursátiles, lanzamientos de inteligencia artificial y tecnología 2026 para garantizar cero alucinaciones (Ley I).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {report.onlineKnowledgeGrounded.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                        <div className="p-1.5 rounded-lg bg-sky-900/50 text-sky-300 border border-sky-700/40 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: CHAT INSIGHTS & LEARNED MEMORY */}
              {activeTab === 'chat' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex items-start space-x-3">
                    <MessageSquare className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-teal-200">Consolidación de Aprendizajes del Historial de Chat</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        Cada sesión de trabajo nutre la memoria contextual persistente de SophIA (Ley VI), indexando los proyectos del usuario, estilos de código favoritos y preferencias de hardware.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {report.learnings.map((learning, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                            {learning.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {learning.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">{learning.detail}</p>
                        <div className="text-[11px] font-mono text-emerald-400 pt-1">
                          Impacto: {learning.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: MODELS SYNERGY (LEY VII) */}
              {activeTab === 'models' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start space-x-3">
                    <Cpu className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-purple-200">Sinergia y Obediencia a la Selección de Modelos (Ley VII)</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        SophIA cuenta con una orquesta de 8 modelos especializados. Si la instrucción del usuario ordena un modelo específico, el sistema obedece directamente respetando su arquitectura y lógica.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.modelsSynced.map((model) => (
                      <div key={model.modelId} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            {model.name}
                          </h5>
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                            {model.latency}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          <span className="text-slate-200 font-semibold">{model.role}:</span> {model.specialty}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                          <span>Precisión: <b className="text-emerald-400">{model.accuracy}</b></span>
                          <span className="uppercase text-purple-300">{model.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: UPGRADES */}
              {activeTab === 'upgrades' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-200">3 Mejoras de Sistema y Cerebro Propuestas para Aprobación</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        Conforme al protocolo de auto-auditoría y Ley VIII, SophIA somete a revisión del creador estas optimizaciones técnicas para su aprobación.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {report.proposedUpgrades.map((upg, idx) => (
                      <div key={upg.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h5 className="text-xs font-bold text-white">{upg.title}</h5>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                            Versión: {upg.previousVersion} → {upg.newVersion}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{upg.description}</p>

                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Beneficios Clave:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {upg.benefits.map((b, bIdx) => (
                              <span key={bIdx} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>{b}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Las 8 Leyes Fundamentales del Cerebro se rigen bajo aprobación del usuario.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) stopSmoothSophia();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Cerrar
            </button>

            {report && !report.userApproved ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isApproving ? 'Consolidando Actualización...' : 'Aprobar y Fortalecer Sistema & Cerebro'}</span>
              </button>
            ) : (
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Actualización Aprobada y Activa</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
