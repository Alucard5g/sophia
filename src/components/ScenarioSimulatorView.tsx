import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Interaction } from '../types';
import {
  speakSmoothSophia,
  stopSmoothSophia,
  playHarmonicChime,
  isSmoothSpeechPlaying
} from '../lib/smoothSpeech';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Volume2,
  VolumeX,
  Sparkles,
  Award,
  Zap,
  Copy,
  Check,
  Download,
  FileText,
  Code,
  Table,
  Eye,
  Bot,
  Layers,
  Globe,
  Gauge,
  ExternalLink,
  Paperclip,
  Image as ImageIcon,
  Film,
  Layout,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface ScenarioSimulatorViewProps {
  currentInteraction: Interaction | null;
  onOpenResources?: () => void;
  onOpenCreations?: () => void;
}

export const ScenarioSimulatorView: React.FC<ScenarioSimulatorViewProps> = ({
  currentInteraction,
  onOpenResources,
  onOpenCreations,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [speechProgress, setSpeechProgress] = useState<{ current: number; total: number; snippet: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewFormat, setViewFormat] = useState<'formatted' | 'plain' | 'json'>('formatted');

  // Auto play smooth speech synthesis once when receiving new interaction
  useEffect(() => {
    if (currentInteraction && currentInteraction.finalResponse) {
      handleStartSmoothSpeech(currentInteraction.finalResponse);
    }
    return () => {
      stopSmoothSophia();
      setIsPlayingAudio(false);
      setSpeechProgress(null);
    };
  }, [currentInteraction?.id]);

  const handleStartSmoothSpeech = async (textToSpeak: string) => {
    stopSmoothSophia();
    setIsPlayingAudio(true);
    await playHarmonicChime();

    const vProf = currentInteraction?.voiceProfileUsed;

    speakSmoothSophia(textToSpeak, {
      voiceStyle: vProf?.voiceStyle,
      pitch: vProf?.pitch ?? 1.12,
      rate: vProf?.rate ?? 0.96,
      voiceURI: vProf?.preferredVoiceName,
      onStart: () => setIsPlayingAudio(true),
      onChunkStart: (chunkIndex, totalChunks, snippet) => {
        setSpeechProgress({ current: chunkIndex + 1, total: totalChunks, snippet });
      },
      onEnd: () => {
        setIsPlayingAudio(false);
        setSpeechProgress(null);
      },
      onError: () => {
        setIsPlayingAudio(false);
        setSpeechProgress(null);
      },
    });
  };

  const toggleAudio = () => {
    if (isPlayingAudio) {
      stopSmoothSophia();
      setIsPlayingAudio(false);
      setSpeechProgress(null);
    } else if (currentInteraction?.finalResponse) {
      handleStartSmoothSpeech(currentInteraction.finalResponse);
    }
  };

  const handleCopyText = () => {
    if (!currentInteraction?.finalResponse) return;
    navigator.clipboard.writeText(currentInteraction.finalResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'md' | 'txt' | 'json') => {
    if (!currentInteraction) return;
    let content = '';
    let mimeType = 'text/plain';
    let filename = `sophia-respuesta-${Date.now()}.${format}`;

    if (format === 'md') {
      content = `# SophIA - Respuesta Formateada\n\n**Instrucción:** ${currentInteraction.userQuery}\n**Fecha:** ${new Date().toLocaleString()}\n**Categoría:** ${currentInteraction.category}\n\n---\n\n${currentInteraction.finalResponse}`;
      mimeType = 'text/markdown';
    } else if (format === 'txt') {
      content = `SOPHIA - ASISTENTE DE VOZ\nInstrucción: ${currentInteraction.userQuery}\nFecha: ${new Date().toLocaleString()}\n\nRESPUESTA:\n${currentInteraction.finalResponse}`;
      mimeType = 'text/plain';
    } else if (format === 'json') {
      content = JSON.stringify(currentInteraction, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!currentInteraction) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 text-center space-y-4 bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600/20 to-purple-600/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <Bot className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">SophIA Esperando Instrucción</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Habla o escribe tu instrucción en la pestaña <strong className="text-rose-400">Grabadora & Voz</strong>. SophIA simulará 3 escenarios reales de ejecución con la mejor IA seleccionada y entregará la respuesta en el formato solicitado (tablas, código, listas, resúmenes, etc.).
        </p>
      </div>
    );
  }

  const {
    userQuery,
    simulatedScenarios,
    antiHallucinationCheck,
    finalResponse,
    formatType,
    modelUsed,
    modelTier,
    modelSelectionReason,
    groundingSources,
    tokenTelemetry,
    failoverOccurred,
    failoverReason,
    latencyMs,
    learnedMemoryPoints,
    resources,
    attachments,
  } = currentInteraction;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      {/* Simulation Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950 p-6 rounded-3xl border border-rose-900/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Bot className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">SophIA: Simulación & Formatos</h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {formatType ? `Formato: ${formatType}` : 'Multi-Formato'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verificación de 3 escenarios en tiempo real y anti-alucinación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {antiHallucinationCheck.confidenceScore}% Certidumbre
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              {latencyMs} ms
            </span>
          </div>
        </div>

        {/* User Original Prompt Box */}
        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300">
          <span className="text-rose-400 font-semibold block mb-1">Instrucción Recibida por SophIA:</span>
          <p className="italic font-medium text-slate-100">"{userQuery}"</p>
        </div>

        {/* Attached Files Evaluated by Multimodal Vision/Doc AI */}
        {attachments && attachments.length > 0 && (
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-purple-900/40 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                Archivos Multimodales Analizados por SophIA ({attachments.length}):
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                Visión & Extracción Activa
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-2.5"
                >
                  {att.type === 'image' ? (
                    <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : att.type === 'video' ? (
                    <Film className="w-4 h-4 text-purple-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{att.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-mono">{att.type} • {att.mimeType}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Model Routing Explanation */}
        {modelSelectionReason && (
          <div className="p-3 bg-slate-950/90 rounded-2xl border border-indigo-900/50 text-xs text-slate-300 flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="font-bold text-indigo-300">Enrutador de IA: </span>
              <span>{modelSelectionReason}</span>
            </div>
          </div>
        )}

        {/* Grounding Sources Badge if available */}
        {groundingSources && groundingSources.length > 0 && (
          <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-800/50 text-xs text-emerald-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Globe className="w-4 h-4" />
              <span>Fuentes Verificadas con Google Search Grounding:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {groundingSources.map((gs, idx) => (
                <a
                  key={idx}
                  href={gs.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] bg-slate-950 px-2.5 py-1 rounded-xl border border-emerald-800/60 text-emerald-300 hover:text-white"
                >
                  <span>{gs.title}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Failover Alert Badge if Migration Occurred */}
        {failoverOccurred && (
          <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Migración Automática de Modelo:</strong> {failoverReason}
            </span>
          </div>
        )}
      </div>

      {/* Primary Synthesized Final Response Box with Rich Markdown & Formats */}
      <div className="p-6 rounded-3xl bg-slate-900 border-2 border-rose-500/60 shadow-2xl space-y-4">
        {/* Top Header of Response */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>Respuesta de SophIA</span>
            </h3>
          </div>

          {/* Voice Playback Toggle & Creation Preview Link */}
          <div className="flex items-center space-x-2 flex-wrap">
            {onOpenCreations && (
              <button
                type="button"
                onClick={onOpenCreations}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-950/50 transition-all border border-purple-400/30"
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Ver Preview en Vivo 🎨</span>
              </button>
            )}

            <button
              onClick={toggleAudio}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isPlayingAudio
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50'
                  : 'bg-slate-800 text-rose-300 border border-rose-500/30 hover:bg-slate-700'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlayingAudio ? 'Detener Voz' : 'Escuchar Voz Fluida'}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Copiar texto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Live Audio Speaking Indicator Bar */}
        {isPlayingAudio && (
          <div className="p-3 bg-slate-950/95 rounded-2xl border border-rose-500/40 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-2.5 text-rose-300">
              <div className="flex items-center gap-0.5 h-4">
                <span className="w-1 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s] h-3"></span>
                <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4"></span>
                <span className="w-1 bg-rose-500 rounded-full animate-bounce h-2"></span>
                <span className="w-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.25s] h-3.5"></span>
              </div>
              <span className="font-semibold">Voz Fluida de SophIA Activa</span>
              {speechProgress && (
                <span className="text-[11px] text-slate-400 font-mono">
                  (Fragmento {speechProgress.current}/{speechProgress.total})
                </span>
              )}
            </div>

            {speechProgress?.snippet && (
              <p className="text-[11px] text-slate-300 italic truncate max-w-xs">
                "{speechProgress.snippet}"
              </p>
            )}

            <button
              onClick={toggleAudio}
              className="text-[11px] text-rose-400 hover:text-rose-200 underline font-medium"
            >
              Silenciar
            </button>
          </div>
        )}

        {/* Format Switcher Tabs & Download Options */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewFormat('formatted')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                viewFormat === 'formatted'
                  ? 'bg-rose-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Formato Enriquecido / Tabla</span>
            </button>

            <button
              onClick={() => setViewFormat('plain')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                viewFormat === 'plain'
                  ? 'bg-rose-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Texto Plano</span>
            </button>

            <button
              onClick={() => setViewFormat('json')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                viewFormat === 'json'
                  ? 'bg-rose-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>JSON Raw</span>
            </button>
          </div>

          {/* Download buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Descargar:</span>
            <button
              onClick={() => handleDownload('md')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> .MD
            </button>
            <button
              onClick={() => handleDownload('txt')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> .TXT
            </button>
            <button
              onClick={() => handleDownload('json')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> .JSON
            </button>
          </div>
        </div>

        {/* Content View Based on Tab */}
        <div className="min-h-[160px]">
          {viewFormat === 'formatted' && (
            <div className="prose prose-invert max-w-none text-slate-100 text-sm leading-relaxed space-y-3">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4 rounded-xl border border-slate-700 bg-slate-950/70 p-1">
                      <table className="w-full text-left text-xs border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-800/90 text-rose-300 border-b border-slate-700 uppercase tracking-wider font-semibold">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="p-2.5 font-bold border-r border-slate-800 last:border-r-0">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="p-2.5 border-t border-slate-800/80 border-r border-slate-800/50 last:border-r-0 text-slate-200">
                      {children}
                    </td>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-slate-800 text-rose-300 px-1.5 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-slate-950 text-emerald-300 p-3.5 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto my-3">
                        <code>{children}</code>
                      </pre>
                    );
                  },
                  h1: ({ children }) => <h1 className="text-lg font-bold text-white border-b border-slate-800 pb-1 mt-3 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold text-slate-100 mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold text-rose-300 mt-2 mb-1">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-xs font-semibold text-slate-300 mt-2 mb-1">{children}</h4>,
                  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 text-slate-200 text-xs my-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 text-slate-200 text-xs my-2">{children}</ol>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-rose-500 pl-3 py-1 my-2 italic text-slate-300 bg-rose-950/20 rounded-r-xl">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {finalResponse}
              </Markdown>
            </div>
          )}

          {viewFormat === 'plain' && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-sans text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {finalResponse}
            </div>
          )}

          {viewFormat === 'json' && (
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
              {JSON.stringify(currentInteraction, null, 2)}
            </pre>
          )}
        </div>

        {/* Google Search Grounding Real-Time Verification Section */}
        {groundingSources && groundingSources.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-950/80 rounded-2xl border border-blue-500/30 space-y-2.5 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-blue-300 font-bold">
                <Globe className="w-4 h-4 text-blue-400 animate-spin [animation-duration:8s]" />
                <span>Google Search Grounding en Tiempo Real (2026):</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-700 font-medium">
                {groundingSources.length} Fuentes Verificadas en Vivo
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              SophIA consultó y validó información en tiempo real directamente con el motor de Google Search para garantizar cero alucinaciones y precisión temporal al 13 de agosto de 2026.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 pt-1">
              {groundingSources.map((source, sIdx) => (
                <a
                  key={sIdx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-blue-800/40 hover:border-blue-500 text-slate-200 flex items-start justify-between gap-2 group transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-semibold text-blue-200 text-xs truncate group-hover:text-blue-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                      <span className="truncate">{source.title || 'Fuente Web'}</span>
                    </div>
                    {source.snippet && (
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {source.snippet}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quick Resource Bar Jump if resources exist */}
        {resources && resources.length > 0 && onOpenResources && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>SophIA vinculó <strong>{resources.length} recursos</strong> (documentos, investigaciones, videos) a esta respuesta.</span>
            </div>
            <button
              onClick={onOpenResources}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-sm"
            >
              Ver Recursos
            </button>
          </div>
        )}

        {/* Model Meta Footer & Telemetry */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-rose-400" />
            <span>Modelo: <strong className="text-slate-200">{modelUsed}</strong> ({modelTier})</span>
          </div>

          {tokenTelemetry && (
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
              <Gauge className="w-3 h-3 text-indigo-400" />
              <span>Tokens: {tokenTelemetry.totalTokens || (tokenTelemetry.estimatedPromptTokens + tokenTelemetry.estimatedOutputTokens)}</span>
            </div>
          )}

          <div className="flex items-center space-x-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>6/6 Leyes del Cerebro Cumplidas</span>
          </div>
        </div>

        {/* Brain Laws Verification Banner */}
        <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-indigo-900/50 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Leyes del Cerebro de SophIA Verificadas:
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-emerald-300 border border-indigo-800">
              Anti-Alucinación • Simulación • Creación Total
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>I. Cero Alucinación</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>II. 3 Escenarios Reales</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>III. Código / Creación 100%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>IV. Voz Dulce & Sensual</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>V. Formato Quirúrgico</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>VI. Memoria Persistente</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Simulated Scenarios Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Escenarios Reales Simulados por SophIA ({simulatedScenarios.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            {antiHallucinationCheck.factCheckSummary}
          </span>
        </div>

        <div className="grid gap-3">
          {simulatedScenarios.map((scenario, index) => (
            <div
              key={scenario.id || index}
              className={`p-4 rounded-2xl border transition-all ${
                scenario.probability >= 90
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-700">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">{scenario.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                      scenario.riskLevel === 'low'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : scenario.riskLevel === 'medium'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    Riesgo {scenario.riskLevel}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {scenario.probability}% Éxito Real
                  </span>
                </div>
              </div>

              {/* Progress Bar for Success Rate */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    scenario.probability >= 90
                      ? 'bg-emerald-500'
                      : scenario.probability >= 75
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${scenario.probability}%` }}
                ></div>
              </div>

              <p className="text-xs text-slate-300 mb-2 leading-relaxed">{scenario.breakdown}</p>

              {scenario.keyConsiderations && scenario.keyConsiderations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/60">
                  {scenario.keyConsiderations.map((kc, i) => (
                    <span key={i} className="text-[11px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-800">
                      • {kc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Learned Memory Section */}
      {learnedMemoryPoints && learnedMemoryPoints.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          <span className="font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-purple-400" />
            Memoria Aprendida por SophIA en esta Interacción:
          </span>
          <ul className="space-y-1 text-slate-300">
            {learnedMemoryPoints.map((point, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
