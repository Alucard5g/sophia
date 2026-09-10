import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Zap,
  Bot,
  Lock,
  Save,
  Trash2,
  HelpCircle,
  Cpu,
  Globe,
  Sliders,
  Check
} from 'lucide-react';
import { ProviderApiKeyConfig, ApiKeyStatusReport } from '../types';

interface ApiKeysManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: (keys: ProviderApiKeyConfig) => void;
}

export const ApiKeysManagerModal: React.FC<ApiKeysManagerModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated
}) => {
  const [keys, setKeys] = useState<ProviderApiKeyConfig>(() => {
    try {
      const saved = localStorage.getItem('sophia_ai_api_keys');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>({});
  const [reports, setReports] = useState<ApiKeyStatusReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    [provider: string]: { success: boolean; message?: string; latencyMs?: number; error?: string };
  }>({});

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/keys/status');
      const data = await res.json();
      if (data.providers) {
        setReports(data.providers);
      }
    } catch (e) {
      console.warn('Error fetching API keys status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleVisibility = (provider: string) => {
    setVisibleKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleKeyChange = (providerField: keyof ProviderApiKeyConfig, val: string) => {
    setKeys((prev) => ({ ...prev, [providerField]: val }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. Save to localStorage for instant client-side persistence
      localStorage.setItem('sophia_ai_api_keys', JSON.stringify(keys));

      // 2. Save to backend session
      await fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys })
      });

      if (onKeysUpdated) {
        onKeysUpdated(keys);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchStatus();
    } catch (e) {
      console.warn('Error saving keys', e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async (provider: string, apiKey?: string) => {
    setTestingProvider(provider);
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: data.success,
          message: data.message,
          latencyMs: data.latencyMs,
          error: data.error
        }
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          error: err?.message || 'Error de conexión'
        }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('¿Deseas borrar las claves personalizadas guardadas localmente?')) {
      const cleared = {};
      setKeys(cleared);
      localStorage.removeItem('sophia_ai_api_keys');
      fetch('/api/keys/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: cleared })
      }).then(() => {
        fetchStatus();
        if (onKeysUpdated) onKeysUpdated(cleared);
      });
    }
  };

  const PROVIDER_METADATA = [
    {
      id: 'gemini',
      keyField: 'geminiApiKey' as keyof ProviderApiKeyConfig,
      name: 'Google AI Studio (Gemini)',
      badge: 'Motor Nativo AGI',
      color: 'from-blue-600 to-cyan-500',
      borderColor: 'border-blue-500/50',
      bgColor: 'bg-blue-950/40',
      models: 'Gemini 3.7 Flash, 3.1 Pro Preview, 3.1 Flash Lite',
      docsUrl: 'https://aistudio.google.com/app/apikey',
      placeholder: 'AIzaSy... (Preconfigurada en AI Studio o ingresa tu clave)',
      helpText: 'Clave nativa del entorno. También puedes usar tu propia clave de Google AI Studio sin costo.'
    },
    {
      id: 'openai',
      keyField: 'openaiApiKey' as keyof ProviderApiKeyConfig,
      name: 'OpenAI Platform',
      badge: 'GPT-4.5 Orion & o3-mini',
      color: 'from-emerald-600 to-teal-500',
      borderColor: 'border-emerald-500/50',
      bgColor: 'bg-emerald-950/30',
      models: 'GPT-4.5 Orion, o3-mini, GPT-4o, GPT-4o-mini',
      docsUrl: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-proj-... o sk-...',
      helpText: 'Permite a SophIA ejecutar consultas ejecutivas y de alta estrategia en modelos OpenAI.'
    },
    {
      id: 'anthropic',
      keyField: 'anthropicApiKey' as keyof ProviderApiKeyConfig,
      name: 'Anthropic Claude',
      badge: 'Razonamiento Híbrido & Prosa',
      color: 'from-amber-600 to-orange-500',
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-amber-950/30',
      models: 'Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku',
      docsUrl: 'https://console.anthropic.com/settings/keys',
      placeholder: 'sk-ant-api03-...',
      helpText: 'Permite a SophIA generar redacción magistral, análisis ético y código con Claude.'
    },
    {
      id: 'deepseek',
      keyField: 'deepseekApiKey' as keyof ProviderApiKeyConfig,
      name: 'DeepSeek Platform',
      badge: 'Pensamiento Puro & Matemáticas',
      color: 'from-cyan-600 to-blue-500',
      borderColor: 'border-cyan-500/50',
      bgColor: 'bg-cyan-950/30',
      models: 'DeepSeek-R1 (CoT Extendido), DeepSeek-V3 (671B MoE)',
      docsUrl: 'https://platform.deepseek.com/api_keys',
      placeholder: 'sk-... (DeepSeek API Key)',
      helpText: 'Permite a SophIA activar la cadena de deducción formal y resolución algorítmica profunda.'
    },
    {
      id: 'openrouter',
      keyField: 'openrouterApiKey' as keyof ProviderApiKeyConfig,
      name: 'OpenRouter (Bridge Multi-IA)',
      badge: 'Acceso Universal a 100+ Modelos',
      color: 'from-purple-600 to-indigo-500',
      borderColor: 'border-purple-500/50',
      bgColor: 'bg-purple-950/30',
      models: 'Qwen 2.5 Coder 72B, Llama 3.3 70B, Kimi K3, GLM 5.2',
      docsUrl: 'https://openrouter.ai/keys',
      placeholder: 'sk-or-v1-...',
      helpText: 'Con una sola clave de OpenRouter, SophIA puede orquestar Qwen, Llama 3.3, Kimi K3 y GLM.'
    },
    {
      id: 'groq',
      keyField: 'groqApiKey' as keyof ProviderApiKeyConfig,
      name: 'Groq Cloud',
      badge: 'Inferencia Ultra-Rápida (500+ tok/s)',
      color: 'from-rose-600 to-red-500',
      borderColor: 'border-rose-500/50',
      bgColor: 'bg-rose-950/30',
      models: 'Llama 3.3 70B Versatile, Mixtral 8x7B, Qwen 2.5 Coder',
      docsUrl: 'https://console.groq.com/keys',
      placeholder: 'gsk_...',
      helpText: 'Permite respuestas instantáneas con latencia sub-segundo en hardware LPU.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-900/40 border border-indigo-400/30">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Panel de Claves de API de Inteligencia Artificial
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold">
                  Multi-Cerebro AGI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingresa o administra tus claves de API para que SophIA use todos los modelos de frontera en su cerebro
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Global Alert / Info Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-blue-950/60 to-slate-900 border border-indigo-500/30 flex items-start gap-3 shrink-0">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-slate-300">
            <p className="font-semibold text-white">
              Privacidad y Seguridad Garantizada
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Tus claves se guardan localmente en tu navegador y en tu sesión privada de SophIA. Si no agregas una clave de un proveedor específico, el motor federado de SophIA usará automáticamente el motor Gemini nativo para responder con la mejor calidad.
            </p>
          </div>
        </div>

        {/* Providers List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {PROVIDER_METADATA.map((prov) => {
            const report = reports.find((r) => r.provider === prov.id);
            const userKeyVal = keys[prov.keyField] || '';
            const isVisible = visibleKeys[prov.id] || false;
            const isConfigured = Boolean(
              userKeyVal.trim().length > 0 || (report && report.isConfigured)
            );
            const testRes = testResults[prov.id];
            const isTesting = testingProvider === prov.id;

            return (
              <div
                key={prov.id}
                className={`p-4 rounded-2xl border transition-all ${prov.bgColor} ${prov.borderColor} hover:border-indigo-500/60 space-y-3`}
              >
                {/* Provider Card Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${prov.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                    >
                      {prov.name[0]}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{prov.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 text-cyan-300 border border-slate-700/80">
                          {prov.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {prov.models}
                      </span>
                    </div>
                  </div>

                  {/* Status indicator & Direct link */}
                  <div className="flex items-center gap-2">
                    {isConfigured ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {report?.source === 'env' && !userKeyVal ? 'Activa (Entorno)' : 'Conectada'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        Sin clave
                      </span>
                    )}

                    <a
                      href={prov.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-xl border border-indigo-500/30 transition cursor-pointer"
                      title="Abrir página oficial para obtener la clave de API"
                    >
                      <span>Obtener Clave</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Input & Action controls */}
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={userKeyVal}
                      onChange={(e) => handleKeyChange(prov.keyField, e.target.value)}
                      placeholder={
                        report?.maskedKey && !userKeyVal
                          ? `Clave activa en entorno: ${report.maskedKey}`
                          : prov.placeholder
                      }
                      className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-xs px-3.5 py-2.5 pr-20 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition"
                    />
                    <div className="absolute right-2 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => toggleVisibility(prov.id)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title={isVisible ? 'Ocultar clave' : 'Mostrar clave'}
                      >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      {userKeyVal && (
                        <button
                          type="button"
                          onClick={() => handleKeyChange(prov.keyField, '')}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                          title="Borrar campo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Provider Action Buttons & Test Outcome */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <p className="text-[11px] text-slate-400 leading-tight flex-1 min-w-[200px]">
                      {prov.helpText}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestKey(prov.id, userKeyVal)}
                        disabled={isTesting || (!userKeyVal && !report?.isConfigured)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isTesting
                            ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-wait'
                            : !userKeyVal && !report?.isConfigured
                            ? 'bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed'
                            : 'bg-indigo-950 hover:bg-indigo-900 border-indigo-500/50 text-cyan-200 hover:text-white'
                        }`}
                      >
                        <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>{isTesting ? 'Probando...' : 'Probar Conexión'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Test Feedback banner */}
                  {testRes && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        testRes.success
                          ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
                          : 'bg-rose-950/80 border-rose-700/80 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {testRes.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{testRes.message || testRes.error}</span>
                      </div>
                      {testRes.latencyMs && (
                        <span className="text-[10px] font-mono opacity-80">
                          {testRes.latencyMs} ms
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-rose-900/40 rounded-xl transition cursor-pointer"
            >
              Borrar Claves
            </button>
            <button
              type="button"
              onClick={fetchStatus}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Refrescar estado de claves"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/50 transition cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado con Éxito!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Claves en SophIA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
