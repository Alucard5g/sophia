import React, { useState, useEffect } from 'react';
import { ModelStatus } from '../types';
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, Zap, Shield, ArrowRightLeft, Radio } from 'lucide-react';

export const ModelCascadeMonitor: React.FC = () => {
  const [models, setModels] = useState<ModelStatus[]>([
    {
      id: 'gemini-3.7-flash',
      name: 'Gemini 3.7 Flash',
      provider: 'Google Gemini Suite',
      alias: 'Modelo Equilibrado & Búsqueda',
      status: 'active',
      quotaRemainingPct: 100,
      latencyAvgMs: 380,
      isFreeTier: true,
      description: 'Modelo insignia universal con razonamiento híbrido adaptable, generación multimodal y Google Search Grounding integrado.',
      bestFor: 'Formato estructurado, respuestas de voz balanceadas y Search Grounding',
      thinkingSupported: true,
      searchGroundingSupported: true,
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro',
      provider: 'Google Gemini Suite',
      alias: 'Razonamiento Profundo',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 650,
      isFreeTier: true,
      description: 'Modelo de máximo razonamiento para programación avanzada, matemáticas y STEM.',
      bestFor: 'Código TypeScript/Python, arquitectura de software y problemas complejos',
      thinkingSupported: true,
      searchGroundingSupported: false,
    },
    {
      id: 'gemini-flash-latest',
      name: 'Gemini Flash Latest',
      provider: 'Google Gemini Suite',
      alias: 'Alta Cuota & Respaldo Gratuito',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 310,
      isFreeTier: true,
      description: 'Excelente cuota gratuita y respuesta inmediata para tareas analíticas y respaldo confiable.',
      bestFor: 'Velocidad constante y alta disponibilidad en nivel gratuito',
      thinkingSupported: false,
      searchGroundingSupported: true,
    },
    {
      id: 'claude-3-7-sonnet-free',
      name: 'Claude 3.7 Sonnet',
      provider: 'Anthropic Free Tier Mode',
      alias: 'Razonamiento Híbrido & Prosa',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 440,
      isFreeTier: true,
      description: 'Modo de máxima elegancia y síntesis de Anthropic con pensamiento híbrido, análisis matizado y código refinado.',
      bestFor: 'Documentos ejecutivos, redacción literaria, análisis estratégico y arquitectura',
      thinkingSupported: true,
      searchGroundingSupported: false,
    },
    {
      id: 'claude-3-5-sonnet-free',
      name: 'Claude 3.5 Sonnet Mode',
      provider: 'Anthropic Free Tier Mode',
      alias: 'Redacción Lírica & Prosa Refinada',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 410,
      isFreeTier: true,
      description: 'Redacción con máxima sofisticación lírica, profundidad de análisis y prosa dulce.',
      bestFor: 'Escritura creativa, poesía, redacción de documentos y tono afectuoso',
      thinkingSupported: true,
      searchGroundingSupported: false,
    },
    {
      id: 'deepseek-r1-free',
      name: 'DeepSeek-R1 Engine',
      provider: 'DeepSeek Free Open Tier',
      alias: 'Cadena de Razonamiento Puro',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 490,
      isFreeTier: true,
      description: 'Deducción matemática y lógica profunda con cadena de pensamiento explícita (Chain of Thought).',
      bestFor: 'Matemáticas avanzadas, demostraciones lógicas y auditoría algorítmica',
      thinkingSupported: true,
      searchGroundingSupported: false,
    },
    {
      id: 'deepseek-v3-free',
      name: 'DeepSeek-V3 671B MoE',
      provider: 'DeepSeek Free Tier Mode',
      alias: 'Matemáticas & Código Riguroso',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 350,
      isFreeTier: true,
      description: 'Enfoque matemático riguroso, algoritmos, arquitectura de datos y optimización 671B.',
      bestFor: 'Algoritmos, estructuras de datos, debugging y razonamiento técnico',
      thinkingSupported: true,
      searchGroundingSupported: false,
    },
    {
      id: 'glm-4-free',
      name: 'GLM-4 / GLM-4V Multimodal',
      provider: 'Zhipu AI Free Engine',
      alias: 'Multimodal Bilingüe & Visión',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 380,
      isFreeTier: true,
      description: 'Comprensión profunda de texto e imágenes, resolución de tareas visuales y razonamiento bilingüe.',
      bestFor: 'Análisis multimodal, diagramas, lógica contextual y traducción avanzada',
      thinkingSupported: true,
      searchGroundingSupported: false,
    },
    {
      id: 'glm-4-flash-free',
      name: 'GLM-4-Flash',
      provider: 'Zhipu AI Free Engine',
      alias: 'Ultra Rápido & Multilingüe',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 240,
      isFreeTier: true,
      description: 'Motor de alta velocidad de Zhipu AI para procesar flujos de datos y responder instantáneamente.',
      bestFor: 'Flujos rápidos, procesamiento multilingüe y resúmenes de datos',
      thinkingSupported: false,
      searchGroundingSupported: false,
    },
    {
      id: 'kimi-k1-5-free',
      name: 'Kimi k1.5 Moonshot (2M)',
      provider: 'Moonshot Free Engine',
      alias: 'Contexto Masivo & Aprendizaje',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 460,
      isFreeTier: true,
      description: 'Ventana de contexto masiva de 2M tokens y razonamiento extendido para ingesta de documentos masivos.',
      bestFor: 'Lectura de archivos PDF enormes, síntesis de investigaciones y memoria de largo plazo',
      thinkingSupported: true,
      searchGroundingSupported: false,
    },
    {
      id: 'chatgpt-4o-mini-free',
      name: 'ChatGPT-4o Mini Mode',
      provider: 'OpenAI Free Tier Mode',
      alias: 'Respuesta Conversacional & Ágil',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 320,
      isFreeTier: true,
      description: 'Estilo conciso, natural, estructurado y de alta velocidad para diálogos ágiles.',
      bestFor: 'Diálogos rápidos, síntesis de texto y explicaciones pedagógicas',
      thinkingSupported: true,
      searchGroundingSupported: true,
    },
    {
      id: 'qwen-2-5-coder-free',
      name: 'Qwen 2.5 Coder 72B',
      provider: 'Alibaba Cloud Open Free',
      alias: 'Programación Políglota & Debug',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 370,
      isFreeTier: true,
      description: 'Especialista en desarrollo en más de 90 lenguajes de programación y depuración paso a paso.',
      bestFor: 'Generación de código en React, Python, Rust, Go y automatizaciones',
      thinkingSupported: true,
      searchGroundingSupported: false,
    },
    {
      id: 'llama-3-3-free',
      name: 'Llama 3.3 70B Mode',
      provider: 'Meta Llama Style',
      alias: 'Pesos Abiertos & Multiuso',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 390,
      isFreeTier: true,
      description: 'Arquitectura de pesos abiertos balanceada, modular y versátil para múltiples tareas.',
      bestFor: 'Tareas mixtas y versatilidad general',
      thinkingSupported: true,
      searchGroundingSupported: true,
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      provider: 'Google Gemini Suite',
      alias: 'Latencia Ultra-Baja',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 220,
      isFreeTier: true,
      description: 'Optimizado para respuestas de voz casi instantáneas (<250ms) y resúmenes.',
      bestFor: 'Interacción de voz en tiempo real y respuestas rápidas',
      thinkingSupported: false,
      searchGroundingSupported: false,
    },
    {
      id: 'local-simulation-engine',
      name: 'Motor Algorítmico Local',
      provider: 'Motor Interno SophIA',
      alias: 'Respaldo de Emergencia Offline',
      status: 'standby',
      quotaRemainingPct: 100,
      latencyAvgMs: 15,
      isFreeTier: true,
      description: 'Motor interno de respaldo que garantiza respuesta aún sin conexión de red externa.',
      bestFor: 'Failover offline y continuidad del servicio',
      thinkingSupported: false,
      searchGroundingSupported: false,
    },
  ]);

  const [simulatingExhaustion, setSimulatingExhaustion] = useState<boolean>(false);
  const [activeModelId, setActiveModelId] = useState<string>('gemini-3.7-flash');
  const [migrationLog, setMigrationLog] = useState<string[]>([]);

  // Fetch model status from server
  useEffect(() => {
    fetch('/api/models/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.models && Array.isArray(data.models)) {
          setModels(data.models);
        }
      })
      .catch((err) => console.warn('Model status fetch warning:', err));
  }, []);

  // Simulate Exhaustion & Failover Migration
  const triggerFailoverSimulation = () => {
    setSimulatingExhaustion(true);

    if (activeModelId === 'gemini-3.7-flash') {
      setModels((prev) =>
        prev.map((m) => {
          if (m.id === 'gemini-3.7-flash') return { ...m, status: 'exhausted', quotaRemainingPct: 0 };
          if (m.id === 'gemini-3.1-flash-lite') return { ...m, status: 'active' };
          return m;
        })
      );
      setActiveModelId('gemini-3.1-flash-lite');
      setMigrationLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Cuota agotada en Gemini 3.7 Flash -> Migrando automáticamente a Gemini 3.1 Flash Lite`,
        ...prev,
      ]);
    } else if (activeModelId === 'gemini-3.1-flash-lite') {
      setModels((prev) =>
        prev.map((m) => {
          if (m.id === 'gemini-3.1-flash-lite') return { ...m, status: 'exhausted', quotaRemainingPct: 0 };
          if (m.id === 'gemini-3.1-pro-preview') return { ...m, status: 'active' };
          return m;
        })
      );
      setActiveModelId('gemini-3.1-pro-preview');
      setMigrationLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Cuota agotada en Gemini 3.1 Flash Lite -> Migrando a Gemini 3.1 Pro`,
        ...prev,
      ]);
    } else {
      // Reset back to primary
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          status: m.id === 'gemini-3.7-flash' ? 'active' : 'standby',
          quotaRemainingPct: 100,
        }))
      );
      setActiveModelId('gemini-3.7-flash');
      setMigrationLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Cuotas reiniciadas. Retornando a modelo principal Gemini 3.7 Flash`,
        ...prev,
      ]);
    }

    setTimeout(() => {
      setSimulatingExhaustion(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      {/* Title Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cascada de Modelos Gratuitos</h2>
              <p className="text-xs text-slate-400">
                Migración automática e ininterrumpida ante límite de cuotas
              </p>
            </div>
          </div>

          <button
            onClick={triggerFailoverSimulation}
            disabled={simulatingExhaustion}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold border border-rose-500/30 shadow transition-all active:scale-95"
          >
            <ArrowRightLeft className={`w-4 h-4 ${simulatingExhaustion ? 'animate-spin' : ''}`} />
            <span>Simular Agotamiento de Cuota</span>
          </button>
        </div>
      </div>

      {/* Model Cards */}
      <div className="space-y-3">
        {models.map((model, idx) => (
          <div
            key={model.id}
            className={`p-5 rounded-2xl border transition-all ${
              model.status === 'active'
                ? 'bg-slate-900 border-rose-500 shadow-xl shadow-rose-950/20 ring-1 ring-rose-500/50'
                : model.status === 'exhausted'
                ? 'bg-slate-950/60 border-red-900/60 opacity-60'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Nivel {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white">{model.name}</h3>
                  {model.isFreeTier && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-semibold border border-emerald-800">
                      GRATUITO
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-300 font-medium">{model.alias}</p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {model.status === 'active' ? (
                  <span className="flex items-center gap-1.5 text-xs bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/40 font-bold animate-pulse">
                    <Radio className="w-3.5 h-3.5 text-rose-400" /> ACTIVO Y RESPONDIENDO
                  </span>
                ) : model.status === 'exhausted' ? (
                  <span className="flex items-center gap-1.5 text-xs bg-red-950 text-red-400 px-3 py-1 rounded-full border border-red-800 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> CUOTA AGOTADA
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700 font-medium">
                    STANDBY EN ESPERA
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3">{model.description}</p>

            {/* Metrics bar */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                  Disponibilidad de Cuota
                </span>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full ${
                      model.status === 'exhausted' ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${model.quotaRemainingPct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                  Latencia Promedio
                </span>
                <span className="font-mono font-bold text-slate-200 mt-1 block">
                  ~{model.latencyAvgMs} ms
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Migration Live Log Box */}
      {migrationLog.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Registro de Conmutación por Error (Auto-Failover):
          </h4>
          <div className="font-mono text-xs text-slate-300 space-y-1 max-h-36 overflow-y-auto pr-1">
            {migrationLog.map((log, i) => (
              <p key={i} className="bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                {log}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
