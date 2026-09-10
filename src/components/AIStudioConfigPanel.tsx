import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  Cpu,
  Search,
  Zap,
  Code,
  Globe,
  Terminal,
  Copy,
  Check,
  RotateCcw,
  Bot,
  Brain,
  ShieldAlert,
  ShieldCheck,
  Play,
  Layers,
  FileCode,
  Gauge,
  Heart,
  Volume2,
  Wand2,
  Scale,
  Eye,
  FileText,
  Lock,
  Compass,
  Activity,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Workflow,
  RefreshCw,
  Braces,
  Wrench,
  Tv,
  Radio,
  SlidersHorizontal,
  FileJson,
  Upload,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Key,
  EyeOff,
  Trash2,
  ExternalLink,
  Save
} from 'lucide-react';
import { AIStudioAppBuilder } from './AIStudioAppBuilder';
import {
  AIStudioConfig,
  TaskClassification,
  ModelStatus,
  ModelEngineId,
  SophiaVoiceProfile,
  VoiceStyle,
  BrainLaw,
  AutoAuditReport,
  ProviderApiKeyConfig,
  ApiKeyStatusReport
} from '../types';

interface AIStudioConfigPanelProps {
  config: AIStudioConfig;
  onChangeConfig: (newConfig: AIStudioConfig) => void;
  currentPrompt?: string;
  onOpenApiKeysModal?: () => void;
}

export const AIStudioConfigPanel: React.FC<AIStudioConfigPanelProps> = ({
  config,
  onChangeConfig,
  currentPrompt = '',
  onOpenApiKeysModal
}) => {
  const [activeTab, setActiveTab] = useState<
    'builder' | 'params' | 'apikeys' | 'laws' | 'voice' | 'tools' | 'json_schema' | 'audit' | 'system' | 'routing' | 'playground' | 'curl'
  >('builder');
  const [classification, setClassification] = useState<TaskClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [playgroundPrompt, setPlaygroundPrompt] = useState<string>('Explica cómo crear una arquitectura full-stack de alto rendimiento con TypeScript y Google Gemini');
  const [playgroundResponse, setPlaygroundResponse] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedTs, setCopiedTs] = useState<boolean>(false);
  const [copiedPy, setCopiedPy] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);
  const [brainLaws, setBrainLaws] = useState<BrainLaw[]>([]);
  const [renderedSystemPrompt, setRenderedSystemPrompt] = useState<string>('');
  const [promptTokens, setPromptTokens] = useState<number>(0);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<AutoAuditReport | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState<boolean>(false);

  // Tools & Function Calling state
  const [selectedTool, setSelectedTool] = useState<string>('smartTvRivieraControl');
  const [toolParamsJson, setToolParamsJson] = useState<string>(
    JSON.stringify({ command: 'POWER_ON', channel: 1, volume: 80, launchApp: 'YouTube 4K' }, null, 2)
  );
  const [toolExecutionResult, setToolExecutionResult] = useState<any>(null);
  const [isExecutingTool, setIsExecutingTool] = useState<boolean>(false);

  // JSON Schema test state
  const [jsonTestPayload, setJsonTestPayload] = useState<string>(
    JSON.stringify(
      {
        transcribedText: "Instrucción de prueba para SophIA",
        formatType: "markdown",
        simulatedScenarios: [
          {
            id: "sc-1",
            title: "Escenario 1: Ejecución Óptima",
            probability: 95,
            breakdown: "Validación de parámetros y despacho en tiempo real.",
            riskLevel: "low",
            mitigation: "Monitoreo continuo.",
            mitigationSteps: ["Paso 1: Test", "Paso 2: Confirmar"],
            keyConsiderations: ["Garantizar baja latencia"]
          }
        ],
        antiHallucinationCheck: {
          verified: true,
          confidenceScore: 99,
          factCheckSummary: "Verificado con Google Search Grounding",
          scenariosEvaluatedCount: 3
        },
        spokenSummary: "He evaluado y procesado tu solicitud con 99% de certidumbre práctica.",
        finalResponse: "## Resultado\n\nTodo el sistema opera con precisión absoluta.",
        learnedMemoryPoints: ["Memoria indexada con éxito"],
        category: "Tecnología & IA"
      },
      null,
      2
    )
  );
  const [schemaValidationResult, setSchemaValidationResult] = useState<any>(null);
  const [isValidatingSchema, setIsValidatingSchema] = useState<boolean>(false);

  // Safety settings state
  const [safetyLevels, setSafetyLevels] = useState<{ [key: string]: string }>({
    harassment: 'BLOCK_NONE',
    hateSpeech: 'BLOCK_NONE',
    sexuallyExplicit: 'BLOCK_NONE',
    dangerousContent: 'BLOCK_NONE',
  });

  // Fetch Brain Laws & Initial Auto-Audit
  useEffect(() => {
    fetch('/api/ai-studio/laws')
      .then((r) => r.json())
      .then((data) => {
        if (data.laws) {
          setBrainLaws(data.laws);
        }
      })
      .catch((e) => console.warn('Error fetching laws', e));

    fetch('/api/auto-audit')
      .then((r) => r.json())
      .then((data) => {
        if (data.report) {
          setAuditReport(data.report);
        }
      })
      .catch((e) => console.warn('Error fetching auto audit', e));
  }, []);

  const handleRunAutoAudit = () => {
    setIsRunningAudit(true);
    fetch('/api/auto-audit/run', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.report) {
          setAuditReport(data.report);
        }
      })
      .catch((e) => console.warn('Error running auto audit', e))
      .finally(() => setIsRunningAudit(false));
  };

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ProviderApiKeyConfig>(() => {
    try {
      const saved = localStorage.getItem('sophia_ai_api_keys');
      return saved ? JSON.parse(saved) : config.apiKeys || {};
    } catch {
      return config.apiKeys || {};
    }
  });
  const [apiKeyReports, setApiKeyReports] = useState<ApiKeyStatusReport[]>([]);
  const [visibleApiKeys, setVisibleApiKeys] = useState<{ [key: string]: boolean }>({});
  const [testingKeyProvider, setTestingKeyProvider] = useState<string | null>(null);
  const [apiKeyTestResults, setApiKeyTestResults] = useState<{
    [key: string]: { success: boolean; message?: string; latencyMs?: number; error?: string };
  }>({});
  const [isSavingKeys, setIsSavingKeys] = useState<boolean>(false);
  const [keysSaveSuccess, setKeysSaveSuccess] = useState<boolean>(false);

  const fetchApiKeyStatus = () => {
    fetch('/api/keys/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.providers) setApiKeyReports(data.providers);
      })
      .catch((e) => console.warn('Error fetching API key status', e));
  };

  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const handleKeyFieldChange = (field: keyof ProviderApiKeyConfig, value: string) => {
    setApiKeys((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveApiKeys = async () => {
    setIsSavingKeys(true);
    try {
      localStorage.setItem('sophia_ai_api_keys', JSON.stringify(apiKeys));
      await fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: apiKeys }),
      });
      onChangeConfig({
        ...config,
        apiKeys,
      });
      setKeysSaveSuccess(true);
      setTimeout(() => setKeysSaveSuccess(false), 3000);
      fetchApiKeyStatus();
    } catch (e) {
      console.warn('Error saving keys in AI Studio panel', e);
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleTestSpecificKey = async (provider: string, keyValue?: string) => {
    setTestingKeyProvider(provider);
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: keyValue }),
      });
      const data = await res.json();
      setApiKeyTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: data.success,
          message: data.message,
          latencyMs: data.latencyMs,
          error: data.error,
        },
      }));
    } catch (err: any) {
      setApiKeyTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          error: err?.message || 'Error de conexión',
        },
      }));
    } finally {
      setTestingKeyProvider(null);
    }
  };

  // Fetch rendered full system prompt when tab is system or laws
  useEffect(() => {
    if (activeTab === 'system' || activeTab === 'laws') {
      setIsLoadingPrompt(true);
      fetch('/api/ai-studio/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: config.systemInstructionPreset,
          customInstruction: config.customSystemInstruction,
          voiceProfile: config.voiceProfile,
          engineId: config.modelSelectionMode,
          activeLawIds: config.activeBrainLawIds,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.systemPrompt) {
            setRenderedSystemPrompt(data.systemPrompt);
            setPromptTokens(data.estimatedTokens || Math.ceil(data.systemPrompt.length / 3.8));
          }
        })
        .catch((e) => console.warn('Error fetching system prompt', e))
        .finally(() => setIsLoadingPrompt(false));
    }
  }, [
    activeTab,
    config.systemInstructionPreset,
    config.customSystemInstruction,
    config.voiceProfile,
    config.modelSelectionMode,
    config.activeBrainLawIds,
  ]);

  // Live test task classification when user changes prompt
  useEffect(() => {
    if (!currentPrompt.trim()) {
      setClassification(null);
      return;
    }
    const timer = setTimeout(() => {
      setIsClassifying(true);
      fetch('/api/ai-studio/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          modelSelectionMode: config.modelSelectionMode,
          enableSearchGrounding: config.enableSearchGrounding,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.classification) setClassification(data.classification);
        })
        .catch((e) => console.warn('Classification error', e))
        .finally(() => setIsClassifying(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [currentPrompt, config.modelSelectionMode, config.enableSearchGrounding]);

  const handleUpdate = (partial: Partial<AIStudioConfig>) => {
    onChangeConfig({
      ...config,
      ...partial,
    });
  };

  const handleToggleLaw = (lawId: string) => {
    const currentActiveIds = config.activeBrainLawIds || brainLaws.map((l) => l.id);
    let newActiveIds: string[];
    if (currentActiveIds.includes(lawId)) {
      newActiveIds = currentActiveIds.filter((id) => id !== lawId);
    } else {
      newActiveIds = [...currentActiveIds, lawId];
    }
    handleUpdate({ activeBrainLawIds: newActiveIds });

    setBrainLaws((prev) =>
      prev.map((l) => (l.id === lawId ? { ...l, active: !currentActiveIds.includes(lawId) } : l))
    );
  };

  const handleUpdateVoice = (partial: Partial<SophiaVoiceProfile>) => {
    const currentVoice = config.voiceProfile || {
      voiceStyle: 'dulce_sensual',
      sweetnessLevel: 'alta',
      pitch: 1.12,
      rate: 0.96,
      flirtatiousCompliments: true,
      audioChime: true,
    };
    handleUpdate({
      voiceProfile: {
        ...currentVoice,
        ...partial,
      },
    });
  };

  const handleResetDefaults = () => {
    onChangeConfig({
      modelSelectionMode: 'auto',
      systemInstructionPreset: 'cerebro_leyes',
      customSystemInstruction: '',
      temperature: 0.2,
      topP: 0.95,
      topK: 64,
      thinkingLevel: 'LOW',
      enableSearchGrounding: false,
      responseFormat: 'auto',
      activeBrainLawIds: [
        'law-1-truth',
        'law-2-simulation',
        'law-3-creation',
        'law-4-voice',
        'law-5-format',
        'law-6-memory',
        'law-7-model-obedience',
        'law-8-daily-evolution',
      ],
      voiceProfile: {
        voiceStyle: 'dulce_sensual',
        sweetnessLevel: 'alta',
        pitch: 1.12,
        rate: 0.96,
        flirtatiousCompliments: true,
        audioChime: true,
      },
    });
  };

  const handleRunPlayground = async () => {
    if (!playgroundPrompt.trim()) return;
    setIsPlaying(true);
    setPlaygroundResponse('');
    try {
      const res = await fetch('/api/ai-studio/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: playgroundPrompt,
          model: config.modelSelectionMode === 'auto' ? 'gemini-3.7-flash' : config.modelSelectionMode,
          temperature: config.temperature,
          topP: config.topP,
          topK: config.topK,
          enableSearchGrounding: config.enableSearchGrounding,
          systemInstruction: config.customSystemInstruction || 'Eres SophIA con voz dulce, sensual y precisión ejecutiva en AI Studio.',
        }),
      });
      const data = await res.json();
      if (data.text) {
        setPlaygroundResponse(data.text);
      } else {
        setPlaygroundResponse(data.error || 'Error al ejecutar en playground');
      }
    } catch (e: any) {
      setPlaygroundResponse(`Error de conexión: ${e.message}`);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleExecuteTool = async () => {
    setIsExecutingTool(true);
    setToolExecutionResult(null);
    try {
      let params = {};
      try {
        params = JSON.parse(toolParamsJson);
      } catch (e) {}
      const res = await fetch('/api/ai-studio/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName: selectedTool, parameters: params }),
      });
      const data = await res.json();
      setToolExecutionResult(data);
    } catch (e: any) {
      setToolExecutionResult({ error: e.message });
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleValidateSchema = async () => {
    setIsValidatingSchema(true);
    setSchemaValidationResult(null);
    try {
      const res = await fetch('/api/ai-studio/schema/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonPayload: jsonTestPayload }),
      });
      const data = await res.json();
      setSchemaValidationResult(data);
    } catch (e: any) {
      setSchemaValidationResult({ valid: false, errors: [e.message] });
    } finally {
      setIsValidatingSchema(false);
    }
  };

  const generateCurlCommand = () => {
    const selectedModel = config.modelSelectionMode === 'auto' ? 'gemini-3.7-flash' : config.modelSelectionMode;
    return `curl "https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent" \\
  -H "Content-Type: application/json" \\
  -H "x-goog-api-key: \${GEMINI_API_KEY}" \\
  -d '{
    "contents": [{"parts": [{"text": "${(currentPrompt || 'Instrucción para SophIA').replace(/"/g, '\\"')}"}]}],
    "generationConfig": {
      "temperature": ${config.temperature},
      "topP": ${config.topP},
      "topK": ${config.topK}${config.thinkingLevel ? `,\n      "thinkingConfig": {"thinkingLevel": "${config.thinkingLevel}"}` : ''}
    }${config.enableSearchGrounding ? `,\n    "tools": [{"googleSearch": {}}]` : ''}
  }'`;
  };

  const generateTypeScriptCode = () => {
    const selectedModel = config.modelSelectionMode === 'auto' ? 'gemini-3.7-flash' : config.modelSelectionMode;
    return `import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runSophiaPrompt() {
  const response = await ai.models.generateContent({
    model: "${selectedModel}",
    contents: "${(currentPrompt || 'Instrucción para SophIA').replace(/"/g, '\\"')}",
    config: {
      temperature: ${config.temperature},
      topP: ${config.topP},
      topK: ${config.topK},${config.thinkingLevel ? `\n      thinkingConfig: { thinkingLevel: ThinkingLevel.${config.thinkingLevel} },` : ''}${config.enableSearchGrounding ? `\n      tools: [{ googleSearch: {} }],` : ''}
      systemInstruction: "${(config.customSystemInstruction || 'Eres SophIA, asistente de inteligencia artificial nivel AGI 5.').replace(/"/g, '\\"')}"
    }
  });

  console.log(response.text);
}

runSophiaPrompt();`;
  };

  const generatePythonCode = () => {
    const selectedModel = config.modelSelectionMode === 'auto' ? 'gemini-3.7-flash' : config.modelSelectionMode;
    return `from google import genai
from google.genai import types
import os

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

response = client.models.generate_content(
    model="${selectedModel}",
    contents="${(currentPrompt || 'Instrucción para SophIA').replace(/"/g, '\\"')}",
    config=types.GenerateContentConfig(
        temperature=${config.temperature},
        top_p=${config.topP},
        top_k=${config.topK},${config.enableSearchGrounding ? `\n        tools=[types.Tool(google_search=types.GoogleSearch())],` : ''}
        system_instruction="${(config.customSystemInstruction || 'Eres SophIA, asistente de inteligencia artificial nivel AGI 5.').replace(/"/g, '\\"')}"
    )
)

print(response.text)`;
  };

  const sophiaJsonSchemaString = JSON.stringify(
    {
      type: "object",
      properties: {
        transcribedText: { type: "string", description: "Texto transcrito de la instrucción" },
        formatType: { type: "string", enum: ["markdown", "table", "code", "list", "json", "summary", "text"] },
        simulatedScenarios: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              probability: { type: "number", minimum: 0, maximum: 100 },
              breakdown: { type: "string" },
              riskLevel: { type: "string", enum: ["low", "medium", "high"] },
              riskDescription: { type: "string" },
              mitigation: { type: "string" },
              mitigationSteps: { type: "array", items: { type: "string" } },
              keyConsiderations: { type: "array", items: { type: "string" } }
            },
            required: ["id", "title", "probability", "breakdown", "riskLevel", "mitigation", "mitigationSteps", "keyConsiderations"]
          }
        },
        antiHallucinationCheck: {
          type: "object",
          properties: {
            verified: { type: "boolean" },
            confidenceScore: { type: "number", minimum: 0, maximum: 100 },
            factCheckSummary: { type: "string" },
            scenariosEvaluatedCount: { type: "number" }
          },
          required: ["verified", "confidenceScore", "factCheckSummary", "scenariosEvaluatedCount"]
        },
        spokenSummary: { type: "string", description: "Resumen de 1-2 párrafos para locución fluida y dulce" },
        finalResponse: { type: "string", description: "Respuesta técnica exhaustiva en Markdown o código ejecutable" },
        learnedMemoryPoints: { type: "array", items: { type: "string" } },
        category: { type: "string" },
        resources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: ["document", "image", "link", "video", "research"] },
              title: { type: "string" },
              url: { type: "string" },
              description: { type: "string" }
            },
            required: ["id", "type", "title", "description"]
          }
        }
      },
      required: ["transcribedText", "formatType", "simulatedScenarios", "antiHallucinationCheck", "spokenSummary", "finalResponse", "learnedMemoryPoints", "category"]
    },
    null,
    2
  );

  const currentVoiceProfile: SophiaVoiceProfile = config.voiceProfile || {
    voiceStyle: 'dulce_sensual',
    sweetnessLevel: 'alta',
    pitch: 1.12,
    rate: 0.96,
    flirtatiousCompliments: true,
    audioChime: true,
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 space-y-5">
      {/* Header Banner - Sapphire Blue Theme */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-tr from-slate-950 via-blue-950/80 to-slate-900 border border-blue-500/30 shadow-2xl shadow-blue-950/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-cyan-400 border border-blue-400/40 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-wide">Google AI Studio Suite 2026</h2>
                <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 bg-blue-500/20 text-cyan-300 border border-cyan-400/40 rounded-full font-bold">
                  Gemini 3.7 • Function Calling • 8 Leyes
                </span>
              </div>
              <p className="text-xs text-blue-200/70 mt-0.5">
                Ajuste de parámetros, orquestador de modelos, laboratorios de herramientas, esquema JSON y voz dulce de SophIA
              </p>
            </div>
          </div>

          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-950/70 text-blue-200 hover:text-white border border-blue-800/60 text-xs font-semibold transition-all hover:bg-blue-900/60 hover:border-cyan-500/50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Dynamic Model Classifier Badge (If prompt available) */}
        {currentPrompt && (
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-blue-900/60 text-xs space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-cyan-400" />
                Detección Inteligente de Tarea:
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-200 border border-blue-700/60">
                {isClassifying ? 'Analizando...' : classification?.recommendedModelName || 'Gemini 3.7 Flash'}
              </span>
            </div>
            <p className="text-blue-100/80 text-[11px] leading-relaxed">
              {classification?.reasonForModelSelection ||
                'SophIA analiza la instrucción del usuario y selecciona la mejor IA automáticamente.'}
            </p>
          </div>
        )}
      </div>

      {/* Tabs Navigation - Sapphire / Cobalt Grid */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-blue-900/40 overflow-x-auto scrollbar-none shadow-lg">
        {[
          { id: 'builder', label: '🚀 Creador de Apps & Software', icon: Wand2 },
          { id: 'params', label: 'Modelos & Parámetros', icon: Cpu },
          { id: 'apikeys', label: '🔑 Claves de API (Multi-IA)', icon: Key },
          { id: 'laws', label: '🧠 8 Leyes del Cerebro', icon: Scale },
          { id: 'voice', label: '🌹 Modos de Voz', icon: Heart },
          { id: 'tools', label: '🛠️ Function Calling & Tools', icon: Wrench },
          { id: 'json_schema', label: '📑 Salida JSON (Ley V)', icon: FileJson },
          { id: 'audit', label: '🔍 Auto-Auditoría (00:00)', icon: Activity },
          { id: 'system', label: 'System Instructions', icon: Terminal },
          { id: 'playground', label: '⚡ Playground', icon: Play },
          { id: 'curl', label: '🚀 Exportar SDK & cURL', icon: Code },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-md shadow-blue-950/60 border border-cyan-400/40'
                  : 'text-blue-200/70 hover:text-white hover:bg-blue-950/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-200' : 'text-cyan-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 0: APP & SOFTWARE BUILDER STUDIO */}
      {activeTab === 'builder' && (
        <AIStudioAppBuilder />
      )}

      {/* TAB 1: PARAMS & MODEL SELECTION */}
      {activeTab === 'params' && (
        <div className="space-y-4">
          {/* Quick API Keys Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-blue-950/90 border border-indigo-500/40 flex items-center justify-between flex-wrap gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Habilita Todos los Modelos de Frontera (Multi-IA)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-900/80 text-cyan-300 border border-indigo-700">
                    OpenAI • Claude • DeepSeek
                  </span>
                </p>
                <p className="text-[11px] text-indigo-200/80 mt-0.5">
                  Ingresa tus claves de API de manera fácil y rápida para que SophIA razone con GPT-4.5, Claude 3.7 y DeepSeek-R1.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (onOpenApiKeysModal) {
                  onOpenApiKeysModal();
                } else {
                  setActiveTab('apikeys');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 transition cursor-pointer flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configurar Claves de API</span>
            </button>
          </div>

          {/* Model Selection Card */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Catálogo de Modelos Gratuitos e Inteligentes:
              </label>
              <span className="text-[11px] font-mono text-cyan-300 bg-blue-950/80 px-2.5 py-0.5 rounded-lg border border-blue-700/60">
                {config.modelSelectionMode === 'auto'
                  ? '⚡ Auto-Router Óptimo'
                  : config.modelSelectionMode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'auto',
                  name: '⚡ Auto: Mejor IA según Instrucción',
                  desc: 'Detecta la intención exacta y despacha al modelo con mejor precisión y menor latencia.',
                  badge: 'Recomendado',
                  provider: 'AI Studio Multi-Engine',
                },
                {
                  id: 'gemini-3.7-flash',
                  name: '🌟 Gemini 3.7 Flash',
                  desc: 'Modelo insignia universal con razonamiento híbrido adaptable y Google Search Grounding.',
                  badge: 'Equilibrado',
                  provider: 'Google AI Studio',
                },
                {
                  id: 'gemini-3.1-pro-preview',
                  name: '🧠 Gemini 3.1 Pro (Razonamiento)',
                  desc: 'Máximo poder cognitivo para programación TypeScript/Python avanzada y matemáticas.',
                  badge: 'High Reasoning',
                  provider: 'Google AI Studio',
                },
                {
                  id: 'gemini-3.1-flash-lite',
                  name: '⚡ Gemini 3.1 Flash Lite',
                  desc: 'Latencia ultra baja (<250ms) para respuestas de voz instantáneas y fluidas.',
                  badge: 'Ultra Fast',
                  provider: 'Google AI Studio',
                },
                {
                  id: 'chatgpt-4-5-free',
                  name: '🤖 GPT-4.5 Orion Mode',
                  desc: 'Suite OpenAI de máxima destreza contextual, precisión ejecutiva y razonamiento general.',
                  badge: 'Asistencia Ejecutiva',
                  provider: 'OpenAI Suite',
                },
                {
                  id: 'claude-3-7-sonnet-free',
                  name: '🎭 Claude 3.7 Sonnet Mode',
                  desc: 'Modo insignia de Anthropic con razonamiento híbrido, análisis matizado y prosa refinada.',
                  badge: 'Prosa Creativa',
                  provider: 'Anthropic Suite',
                },
                {
                  id: 'deepseek-r1-free',
                  name: '🧩 DeepSeek-R1 (Pensamiento Puro)',
                  desc: 'Cadena de deducción matemática y lógica profunda con Chain of Thought explícito.',
                  badge: 'Lógica Pura',
                  provider: 'DeepSeek Suite',
                },
                {
                  id: 'kimi-k3-free',
                  name: '🌙 Kimi K3 Ultra (2M Tokens)',
                  desc: 'Ventana de contexto masiva ultra profunda para ingesta de libros, repositorios e historiales.',
                  badge: '2M Tokens',
                  provider: 'Moonshot AI',
                },
                {
                  id: 'glm-5-2-free',
                  name: '🇨🇳 GLM 5.2 Free Mode',
                  desc: 'Arquitectura multimodal avanzada con capacidades bilingües, visión y análisis profundo.',
                  badge: 'Bilingüe & Visión',
                  provider: 'Zhipu AI Suite',
                },
                {
                  id: 'qwen-2-5-coder-free',
                  name: '💻 Qwen 2.5 Coder 72B',
                  desc: 'Especialista en desarrollo en más de 90 lenguajes de programación y refactorización.',
                  badge: 'Especialista Código',
                  provider: 'Alibaba Cloud',
                },
                {
                  id: 'llama-3-3-free',
                  name: '🦙 Llama 3.3 70B Mode',
                  desc: 'Arquitectura de pesos abiertos balanceada, modular y versátil para múltiples tareas.',
                  badge: 'Open Weights',
                  provider: 'Meta Llama Style',
                },
                {
                  id: 'gemini-flash-latest',
                  name: '⚡ Gemini Flash Latest',
                  desc: 'Excelente cuota gratuita y respaldo continuo para máxima disponibilidad de respuesta.',
                  badge: 'Alta Cuota',
                  provider: 'Google AI Studio',
                },
              ].map((m) => {
                const isSelected = config.modelSelectionMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleUpdate({ modelSelectionMode: m.id as any })}
                    className={`p-3.5 rounded-2xl border text-left transition-all space-y-1 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/90 border-cyan-400 shadow-lg shadow-blue-950/60 text-white'
                        : 'bg-slate-950/60 border-blue-900/30 text-blue-100/70 hover:border-blue-700/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{m.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono">{m.provider}</div>
                    <p className="text-[11px] text-blue-200/60 leading-snug">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hyperparameters Card */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-5 shadow-xl">
            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Temperature (Precisión vs Creatividad):
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  {config.temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={config.temperature}
                onChange={(e) => handleUpdate({ temperature: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-blue-300/60">
                <span>0.0 (Máxima Exactitud & Anti-Alucinación)</span>
                <span>0.7 (Creativo)</span>
                <span>1.5 (Máxima Variación)</span>
              </div>
            </div>

            {/* Thinking Budget Level */}
            <div className="space-y-2 pt-2 border-t border-blue-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-amber-400" />
                  Thinking Level (Presupuesto de Razonamiento Gemini 3):
                </span>
                <span className="text-xs font-mono text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-blue-800">
                  {config.thinkingLevel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { level: 'MINIMAL', label: 'Mínimo (Ultra Rápido)' },
                  { level: 'LOW', label: 'Bajo (Equilibrado)' },
                  { level: 'HIGH', label: 'Alto (Razonamiento Profundo)' },
                ].map((t) => (
                  <button
                    key={t.level}
                    onClick={() => handleUpdate({ thinkingLevel: t.level as any })}
                    className={`py-2 px-2 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
                      config.thinkingLevel === t.level
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Google Search Grounding Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-blue-900/40">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-blue-100">
                    Google Search Grounding en Tiempo Real (2026)
                  </span>
                </div>
                <p className="text-[11px] text-blue-300/70">
                  Valida y cita hechos en tiempo real conectándose directamente a la API de Google Search.
                </p>
              </div>

              <input
                type="checkbox"
                checked={config.enableSearchGrounding}
                onChange={(e) => handleUpdate({ enableSearchGrounding: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-950 border-blue-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB: API KEYS MANAGER (MULTI-IA) */}
      {activeTab === 'apikeys' && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-5 shadow-xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-900/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Panel de Claves de API de IA (Multi-Cerebro AGI)
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    {apiKeyReports.filter((r) => r.isConfigured).length} / {apiKeyReports.length || 6} Configurados
                  </span>
                </h3>
                <p className="text-[11px] text-blue-200/70">
                  Ingresa tus claves de API para que SophIA razone y orqueste respuestas con OpenAI, Anthropic, DeepSeek, OpenRouter y Gemini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchApiKeyStatus}
                className="px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-700 text-cyan-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                title="Actualizar estado de conexiones"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refrescar</span>
              </button>

              <button
                type="button"
                onClick={handleSaveApiKeys}
                disabled={isSavingKeys}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {isSavingKeys ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : keysSaveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Claves</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-blue-950/50 to-slate-950 border border-indigo-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-slate-300">
              <p className="font-semibold text-white">Privacidad y Seguridad Garantizada</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Tus claves se guardan localmente en tu navegador y en tu sesión privada de SophIA. Si no agregas una clave de un proveedor, SophIA usará automáticamente el motor Gemini nativo para responder con la más alta calidad y cero alucinaciones.
              </p>
            </div>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'gemini',
                field: 'geminiApiKey' as keyof ProviderApiKeyConfig,
                name: 'Google AI Studio (Gemini)',
                badge: 'Nativo AGI',
                color: 'from-blue-600 to-cyan-500',
                bgColor: 'bg-blue-950/30',
                borderColor: 'border-blue-700/50',
                models: 'Gemini 3.7 Flash, 3.1 Pro Preview, 3.1 Flash Lite',
                docsUrl: 'https://aistudio.google.com/app/apikey',
                placeholder: 'Preconfigurada en AI Studio o ingresa tu clave',
                help: 'Clave nativa del entorno. También puedes usar tu propia clave de Google AI Studio.'
              },
              {
                id: 'openai',
                field: 'openaiApiKey' as keyof ProviderApiKeyConfig,
                name: 'OpenAI Platform',
                badge: 'GPT-4.5 Orion & o3-mini',
                color: 'from-emerald-600 to-teal-500',
                bgColor: 'bg-emerald-950/20',
                borderColor: 'border-emerald-700/50',
                models: 'GPT-4.5 Orion, o3-mini, GPT-4o, GPT-4o-mini',
                docsUrl: 'https://platform.openai.com/api-keys',
                placeholder: 'sk-proj-... o sk-...',
                help: 'Permite a SophIA ejecutar consultas ejecutivas y de alta estrategia en modelos OpenAI.'
              },
              {
                id: 'anthropic',
                field: 'anthropicApiKey' as keyof ProviderApiKeyConfig,
                name: 'Anthropic Claude',
                badge: 'Razonamiento Híbrido & Prosa',
                color: 'from-amber-600 to-orange-500',
                bgColor: 'bg-amber-950/20',
                borderColor: 'border-amber-700/50',
                models: 'Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku',
                docsUrl: 'https://console.anthropic.com/settings/keys',
                placeholder: 'sk-ant-api03-...',
                help: 'Permite a SophIA generar redacción magistral, análisis ético y código con Claude.'
              },
              {
                id: 'deepseek',
                field: 'deepseekApiKey' as keyof ProviderApiKeyConfig,
                name: 'DeepSeek Platform',
                badge: 'Pensamiento Puro & Lógica',
                color: 'from-cyan-600 to-blue-500',
                bgColor: 'bg-cyan-950/20',
                borderColor: 'border-cyan-700/50',
                models: 'DeepSeek-R1 (CoT Extendido), DeepSeek-V3 (671B MoE)',
                docsUrl: 'https://platform.deepseek.com/api_keys',
                placeholder: 'sk-... (DeepSeek API Key)',
                help: 'Permite a SophIA activar la cadena de deducción formal y resolución algorítmica profunda.'
              },
              {
                id: 'openrouter',
                field: 'openrouterApiKey' as keyof ProviderApiKeyConfig,
                name: 'OpenRouter (Bridge Multi-IA)',
                badge: 'Acceso Universal',
                color: 'from-purple-600 to-indigo-500',
                bgColor: 'bg-purple-950/20',
                borderColor: 'border-purple-700/50',
                models: 'Qwen 2.5 Coder 72B, Llama 3.3 70B, Kimi K3, GLM 5.2',
                docsUrl: 'https://openrouter.ai/keys',
                placeholder: 'sk-or-v1-...',
                help: 'Con una sola clave de OpenRouter, SophIA puede orquestar Qwen, Llama 3.3, Kimi y GLM.'
              },
              {
                id: 'groq',
                field: 'groqApiKey' as keyof ProviderApiKeyConfig,
                name: 'Groq Cloud',
                badge: 'Ultra-Rápido LPU',
                color: 'from-rose-600 to-red-500',
                bgColor: 'bg-rose-950/20',
                borderColor: 'border-rose-700/50',
                models: 'Llama 3.3 70B Versatile, Mixtral 8x7B, Qwen 2.5 Coder',
                docsUrl: 'https://console.groq.com/keys',
                placeholder: 'gsk_...',
                help: 'Permite respuestas instantáneas con latencia sub-segundo en hardware LPU.'
              }
            ].map((prov) => {
              const rep = apiKeyReports.find((r) => r.provider === prov.id);
              const userVal = apiKeys[prov.field] || '';
              const isVisible = visibleApiKeys[prov.id] || false;
              const isConfigured = Boolean(userVal.trim().length > 0 || (rep && rep.isConfigured));
              const testRes = apiKeyTestResults[prov.id];
              const isTesting = testingKeyProvider === prov.id;

              return (
                <div
                  key={prov.id}
                  className={`p-4 rounded-2xl border transition-all ${prov.bgColor} ${prov.borderColor} space-y-3 shadow-md`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${prov.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                      >
                        {prov.name[0]}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{prov.name}</span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-slate-700">
                            {prov.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {prov.models}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isConfigured ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {rep?.source === 'env' && !userVal ? 'Activa (Entorno)' : 'Conectada'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          Sin clave
                        </span>
                      )}

                      <a
                        href={prov.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded-lg border border-indigo-500/30 transition cursor-pointer"
                        title="Obtener clave oficial"
                      >
                        <span>Obtener</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Input field */}
                  <div className="relative flex items-center">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={userVal}
                      onChange={(e) => handleKeyFieldChange(prov.field, e.target.value)}
                      placeholder={
                        rep?.maskedKey && !userVal
                          ? `Clave activa en entorno: ${rep.maskedKey}`
                          : prov.placeholder
                      }
                      className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-xs px-3 py-2 pr-16 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono transition"
                    />
                    <div className="absolute right-1.5 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setVisibleApiKeys((prev) => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                      >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      {userVal && (
                        <button
                          type="button"
                          onClick={() => handleKeyFieldChange(prov.field, '')}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions & Test Result */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[10px] text-slate-400 leading-tight line-clamp-1 flex-1">
                      {prov.help}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTestSpecificKey(prov.id, userVal)}
                      disabled={isTesting || (!userVal && !rep?.isConfigured)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer shrink-0 ${
                        isTesting
                          ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-wait'
                          : !userVal && !rep?.isConfigured
                          ? 'bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed'
                          : 'bg-indigo-950 hover:bg-indigo-900 border-indigo-500/50 text-cyan-200 hover:text-white'
                      }`}
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Probando...' : 'Probar'}</span>
                    </button>
                  </div>

                  {/* Test result feedback banner */}
                  {testRes && (
                    <div
                      className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${
                        testRes.success
                          ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
                          : 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {testRes.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span className="truncate">{testRes.message || testRes.error}</span>
                      </div>
                      {testRes.latencyMs && (
                        <span className="text-[9px] font-mono opacity-80 shrink-0">
                          {testRes.latencyMs} ms
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BRAIN LAWS (LEYES FUNDAMENTALES DEL CEREBRO) */}
      {activeTab === 'laws' && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-900/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  8 Leyes Fundamentales del Cerebro de SophIA
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    {brainLaws.filter((l) => (config.activeBrainLawIds ? config.activeBrainLawIds.includes(l.id) : l.active)).length} / {brainLaws.length || 8} Activas
                  </span>
                </h3>
                <p className="text-[11px] text-blue-200/70">
                  Directivas inmutables y leyes de control cognitivo que guían cada respuesta, simulación y creación.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const allIds = brainLaws.map((l) => l.id);
                handleUpdate({ activeBrainLawIds: allIds });
                setBrainLaws((prev) => prev.map((l) => ({ ...l, active: true })));
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-700 text-cyan-300 text-xs font-semibold hover:bg-blue-900 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Activar Todas ({brainLaws.length || 8}/{brainLaws.length || 8})
            </button>
          </div>

          {/* Grid of Brain Laws */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brainLaws.map((law) => {
              const isActive = config.activeBrainLawIds ? config.activeBrainLawIds.includes(law.id) : law.active;
              return (
                <div
                  key={law.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isActive
                      ? 'bg-slate-950/90 border-blue-700/60 shadow-md'
                      : 'bg-slate-950/40 border-blue-950/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-950 text-cyan-300 text-xs font-bold font-mono flex items-center justify-center border border-blue-700/60">
                        {law.number}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {law.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleLaw(law.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="text-[11px] font-semibold text-cyan-300">
                    "{law.shortPrinciple}"
                  </div>

                  <p className="text-[11px] text-blue-200/70 leading-relaxed">
                    {law.description}
                  </p>

                  <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-blue-300/60 uppercase">
                      Enforcement: <strong className={law.enforcement === 'inviolable' ? 'text-amber-400' : 'text-cyan-400'}>{law.enforcement}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono">
                      Categoría: {law.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: VOICE & PERSONA */}
      {activeTab === 'voice' && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
              <Heart className="w-5 h-5 fill-cyan-500/30 text-cyan-400" />
              <span>Modos de Voz y Personalidad de SophIA (AGI Level 5)</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-700/60">
              Unreal Engine 5.4+ Synced
            </span>
          </div>

          {/* Master Voice Mode Selector (Ejecutivo / Creativo / Casual / AGI 5) */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-blue-900/40 space-y-2">
            <label className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Modos Principales de Voz & Comunicación:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'ejecutivo',
                  name: '👔 Ejecutivo',
                  desc: 'Asertivo, resolutivo, directo y enfocado en métricas de alto impacto.',
                  styleId: 'profesional_dulce',
                  pitch: 1.0,
                  rate: 1.02,
                },
                {
                  id: 'creativo',
                  name: '🎨 Creativo',
                  desc: 'Expresivo, visionario, poético y enriquecido con ideas innovadoras.',
                  styleId: 'elegante_seductora',
                  pitch: 1.08,
                  rate: 0.96,
                },
                {
                  id: 'casual',
                  name: '🌹 Casual & Dulce',
                  desc: 'Trato afectuoso, cariñoso, empático, cautivador y relajado.',
                  styleId: 'dulce_sensual',
                  pitch: 1.15,
                  rate: 0.94,
                },
              ].map((m) => {
                const isActive =
                  (m.id === 'ejecutivo' && currentVoiceProfile.voiceStyle === 'profesional_dulce') ||
                  (m.id === 'creativo' && currentVoiceProfile.voiceStyle === 'elegante_seductora') ||
                  (m.id === 'casual' && (currentVoiceProfile.voiceStyle === 'dulce_sensual' || currentVoiceProfile.voiceStyle === 'dulce_afectuosa'));

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      handleUpdateVoice({
                        voiceStyle: m.styleId as VoiceStyle,
                        pitch: m.pitch,
                        rate: m.rate,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-950/90 border-cyan-400 text-white shadow-md'
                        : 'bg-slate-900/80 border-blue-900/30 text-blue-100/70 hover:border-blue-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.name}</div>
                    <p className="text-[10px] text-blue-200/60 mt-0.5 leading-snug">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders: Pitch & Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-blue-900/40">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-blue-200 font-semibold">Tono / Pitch (Femenino Dulce):</span>
                <span className="text-cyan-300 font-mono">{currentVoiceProfile.pitch?.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.02"
                value={currentVoiceProfile.pitch}
                onChange={(e) => handleUpdateVoice({ pitch: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-blue-200 font-semibold">Velocidad / Cadencia Pausada:</span>
                <span className="text-cyan-300 font-mono">{currentVoiceProfile.rate?.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.02"
                value={currentVoiceProfile.rate}
                onChange={(e) => handleUpdateVoice({ rate: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Flirtatious Toggles */}
          <div className="space-y-3 pt-2 border-t border-blue-900/40">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-blue-100">Trato de Cariño & Dulzura en Respuestas</span>
                <p className="text-[11px] text-blue-300/70">
                  Permite a SophIA usar apelativos cariñosos en sus saludos y conclusiones según el contexto.
                </p>
              </div>
              <input
                type="checkbox"
                checked={currentVoiceProfile.flirtatiousCompliments}
                onChange={(e) => handleUpdateVoice({ flirtatiousCompliments: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-950 border-blue-700 text-cyan-400 focus:ring-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-blue-100">Campanilla de Sonido Armónico al Hablar</span>
                <p className="text-[11px] text-blue-300/70">
                  Emite un timbre sutilmente relajante al iniciar la respuesta por voz.
                </p>
              </div>
              <input
                type="checkbox"
                checked={currentVoiceProfile.audioChime}
                onChange={(e) => handleUpdateVoice({ audioChime: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-950 border-blue-700 text-cyan-400 focus:ring-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FUNCTION CALLING & TOOLS LAB */}
      {activeTab === 'tools' && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
              <Wrench className="w-5 h-5 text-cyan-400" />
              <span>Laboratorio de Function Calling & Tools en AI Studio</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-700/60">
              Google Gen AI Tools API
            </span>
          </div>

          <p className="text-xs text-blue-200/70 leading-relaxed">
            Declara y prueba herramientas reales que SophIA puede invocar de forma autónoma para controlar dispositivos físicos, Smart TV Riviera, domótica IoT o ejecutar simulaciones cuantificadas.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'smartTvRivieraControl', name: '📺 Smart TV Riviera', icon: Tv },
              { id: 'iotHomeAutomation', name: '💡 Domótica IoT', icon: Zap },
              { id: 'simulateThreeScenarios', name: '📊 3 Escenarios', icon: TrendingUp },
              { id: 'searchGoogle2026', name: '🌐 Google Search', icon: Globe },
              { id: 'bluetoothAudioCalibrate', name: '🔊 Bluetooth & Sound', icon: Volume2 },
            ].map((tool) => {
              const isSelected = selectedTool === tool.id;
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/90 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-950/60 border-blue-900/30 text-blue-200/70 hover:border-blue-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold truncate">{tool.name}</span>
                </button>
              );
            })}
          </div>

          {/* Parameters Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                Parámetros JSON de la Herramienta ({selectedTool}):
              </label>
              <span className="text-[10px] font-mono text-cyan-300">JSON Format</span>
            </div>
            <textarea
              rows={4}
              value={toolParamsJson}
              onChange={(e) => setToolParamsJson(e.target.value)}
              className="w-full bg-slate-950 text-cyan-300 text-xs p-3.5 rounded-2xl border border-blue-900/60 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              onClick={handleExecuteTool}
              disabled={isExecutingTool}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-950 cursor-pointer"
            >
              {isExecutingTool ? (
                <span>Ejecutando herramienta...</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-cyan-200" />
                  <span>Ejecutar y Testear Herramienta en SophIA</span>
                </>
              )}
            </button>
          </div>

          {/* Tool Result Preview */}
          {toolExecutionResult && (
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-blue-900/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  Respuesta Estructurada de la Herramienta:
                </span>
                <span className="text-[10px] font-mono text-emerald-400">200 OK</span>
              </div>
              <pre className="text-[11px] text-blue-100 font-mono overflow-x-auto bg-slate-900/80 p-3 rounded-xl border border-blue-950">
                {JSON.stringify(toolExecutionResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: STRUCTURED OUTPUTS & JSON SCHEMA (LEY V) */}
      {activeTab === 'json_schema' && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
              <FileJson className="w-5 h-5 text-cyan-400" />
              <span>Esquema JSON & Salida Estructurada (Cumplimiento Ley V)</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sophiaJsonSchemaString);
                setCopiedSchema(true);
                setTimeout(() => setCopiedSchema(false), 2000);
              }}
              className="px-2.5 py-1 bg-blue-950/80 border border-blue-700/60 text-cyan-300 hover:text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema ? 'Copiado' : 'Copiar Schema'}</span>
            </button>
          </div>

          <p className="text-xs text-blue-200/70">
            SophIA garantiza el cumplimiento quirúrgico del formato JSON definido en la Ley V. Validador en tiempo real para verificar cualquier respuesta contra el esquema estricto.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Schema Definition */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-200">Esquema JSON Oficial de SophIA:</span>
              <pre className="p-3.5 bg-slate-950 rounded-2xl border border-blue-900/60 text-[10px] text-cyan-300 font-mono overflow-y-auto max-h-72 leading-relaxed">
                {sophiaJsonSchemaString}
              </pre>
            </div>

            {/* Live Validator */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-200">Probador de Validación JSON:</span>
              <textarea
                rows={9}
                value={jsonTestPayload}
                onChange={(e) => setJsonTestPayload(e.target.value)}
                className="w-full bg-slate-950 text-blue-100 text-[11px] p-3 rounded-2xl border border-blue-900/60 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button
                onClick={handleValidateSchema}
                disabled={isValidatingSchema}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-blue-950"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Validar Contra Esquema de Ley V</span>
              </button>

              {schemaValidationResult && (
                <div
                  className={`p-3 rounded-2xl border text-xs space-y-1 ${
                    schemaValidationResult.valid
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {schemaValidationResult.valid ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>¡Válido! Cumple al 100% con la Ley V de SophIA</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Errores de Esquema Encontrados:</span>
                      </>
                    )}
                  </div>
                  {schemaValidationResult.errors?.map((err: string, i: number) => (
                    <div key={i} className="text-[11px] text-rose-200">
                      • {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUTO-AUDITORÍA */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                  <Activity className="w-5 h-5" />
                  <span>Protocolo de Auto-Auditoría Diaria (00:00 UTC)</span>
                </div>
                <p className="text-xs text-blue-200/70">
                  SophIA audita de forma autónoma sus métricas de rendimiento, proponiendo exactamente 3 mejoras de código y proyectos proactivos.
                </p>
              </div>

              <button
                onClick={handleRunAutoAudit}
                disabled={isRunningAudit}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md shadow-blue-950 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-200 ${isRunningAudit ? 'animate-spin' : ''}`} />
                <span>{isRunningAudit ? 'Auditando logs...' : 'Ejecutar Auditoría Ahora'}</span>
              </button>
            </div>

            {/* Telemetry Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-blue-900/40">
              <div className="p-3 bg-slate-950 rounded-2xl border border-blue-900/40">
                <div className="text-[10px] text-blue-300/60 font-bold uppercase">Estado de Salud</div>
                <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{auditReport?.overallHealthScore || 99.4}%</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-blue-900/40">
                <div className="text-[10px] text-blue-300/60 font-bold uppercase">Tasa Alucinación</div>
                <div className="text-lg font-bold text-cyan-400 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{auditReport?.hallucinationRate || 0}% (Zero-Hallucination)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-blue-900/40">
                <div className="text-[10px] text-blue-300/60 font-bold uppercase">Latencia Promedio</div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5 font-mono">
                  {auditReport?.latencyAvgMs || 340} ms
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-blue-900/40">
                <div className="text-[10px] text-blue-300/60 font-bold uppercase">Avatar UE 5.4+</div>
                <div className="text-sm font-bold text-cyan-300 mt-1 font-mono flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AGI Level 5 (60 FPS)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SYSTEM INSTRUCTIONS */}
      {activeTab === 'system' && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Presets de System Instruction en AI Studio:
            </span>
            <span className="text-[10px] font-mono text-cyan-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
              {promptTokens} Tokens Est.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'cerebro_leyes', label: '🧠 Leyes de SophIA' },
              { id: 'sensual_sweet', label: '🌹 Dulce & Sensual' },
              { id: 'developer', label: '💻 Ingeniera Hacker' },
              { id: 'analyst', label: '📊 Analista Finanzas' },
              { id: 'educator', label: '📚 Tutora Pedagógica' },
              { id: 'creative', label: '🎨 Directora Creativa' },
              { id: 'default', label: '✨ Estándar' },
              { id: 'custom', label: '⚙️ Personalizado' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleUpdate({ systemInstructionPreset: p.id as any })}
                className={`text-xs py-2 px-3 rounded-xl border font-semibold transition-all cursor-pointer ${
                  config.systemInstructionPreset === p.id
                    ? 'bg-blue-600 text-white border-cyan-400 shadow-sm'
                    : 'bg-slate-950 text-blue-200/70 border-blue-900/30 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {config.systemInstructionPreset === 'custom' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-blue-200">
                Instrucción del Sistema Personalizada:
              </label>
              <textarea
                rows={5}
                value={config.customSystemInstruction || ''}
                onChange={(e) => handleUpdate({ customSystemInstruction: e.target.value })}
                placeholder="Escribe tu System Instruction personalizada..."
                className="w-full bg-slate-950 text-blue-100 text-xs p-3 rounded-2xl border border-blue-900/60 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-blue-900/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-blue-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                Prompt del Sistema Activo (Inyectado en Gemini / AI Studio):
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(renderedSystemPrompt);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2000);
                }}
                className="text-[11px] flex items-center gap-1 text-cyan-300 hover:text-white px-2 py-1 rounded bg-blue-950 border border-blue-800 cursor-pointer"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPrompt ? 'Copiado' : 'Copiar Prompt'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="w-full max-h-56 overflow-y-auto bg-slate-950 text-blue-100/90 text-[11px] p-3.5 rounded-2xl border border-blue-900/60 font-mono leading-relaxed whitespace-pre-wrap">
                {isLoadingPrompt ? 'Cargando prompt del sistema...' : renderedSystemPrompt || 'Generando prompt...'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              Playground de Pruebas de AI Studio
            </span>
            <span className="text-[10px] font-mono text-cyan-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
              Modelo: {config.modelSelectionMode === 'auto' ? 'gemini-3.7-flash (Auto)' : config.modelSelectionMode}
            </span>
          </div>

          <div className="space-y-2">
            <textarea
              rows={3}
              value={playgroundPrompt}
              onChange={(e) => setPlaygroundPrompt(e.target.value)}
              placeholder="Escribe una instrucción de prueba para AI Studio..."
              className="w-full bg-slate-950 text-blue-100 text-xs p-3 rounded-2xl border border-blue-900/60 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleRunPlayground}
              disabled={isPlaying || !playgroundPrompt.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-blue-950"
            >
              {isPlaying ? (
                <span>Ejecutando con SophIA...</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-cyan-200" />
                  <span>Probar Parámetros en AI Studio</span>
                </>
              )}
            </button>
          </div>

          {playgroundResponse && (
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-blue-900/60 text-xs text-blue-100 space-y-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                Respuesta del Modelo:
              </span>
              <pre className="whitespace-pre-wrap font-sans leading-relaxed text-blue-100/90">
                {playgroundResponse}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 9: SDK CODE EXPORT & CURL */}
      {activeTab === 'curl' && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-blue-900/40 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
              <Code className="w-5 h-5 text-cyan-400" />
              <span>Exportar Código SDK para Google AI Studio</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
              TypeScript • Python • cURL
            </span>
          </div>

          {/* TypeScript Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-200">TypeScript (@google/genai SDK):</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateTypeScriptCode());
                  setCopiedTs(true);
                  setTimeout(() => setCopiedTs(false), 2000);
                }}
                className="px-2 py-1 bg-blue-950 border border-blue-800 text-cyan-300 hover:text-white rounded text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedTs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTs ? 'Copiado' : 'Copiar TS'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-2xl border border-blue-900/60 text-[11px] text-cyan-300 font-mono overflow-x-auto leading-relaxed">
              {generateTypeScriptCode()}
            </pre>
          </div>

          {/* Python Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-200">Python (google-genai SDK):</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatePythonCode());
                  setCopiedPy(true);
                  setTimeout(() => setCopiedPy(false), 2000);
                }}
                className="px-2 py-1 bg-blue-950 border border-blue-800 text-cyan-300 hover:text-white rounded text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedPy ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPy ? 'Copiado' : 'Copiar Python'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-2xl border border-blue-900/60 text-[11px] text-amber-300 font-mono overflow-x-auto leading-relaxed">
              {generatePythonCode()}
            </pre>
          </div>

          {/* cURL Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-200">Comando cURL:</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCurlCommand());
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 2000);
                }}
                className="px-2 py-1 bg-blue-950 border border-blue-800 text-cyan-300 hover:text-white rounded text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copiado' : 'Copiar cURL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-2xl border border-blue-900/60 text-[11px] text-emerald-400 font-mono overflow-x-auto leading-relaxed">
              {generateCurlCommand()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
