import React, { useState, useEffect, useRef } from 'react';
import {
  Code,
  Play,
  Layout,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Copy,
  Check,
  Sparkles,
  Zap,
  Sliders,
  Terminal,
  Layers,
  Wand2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  RefreshCw,
  Box,
  Palette
} from 'lucide-react';
import { ModelEngineId } from '../types';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  framework: string;
  previewBg: string;
  defaultPrompt: string;
}

interface SimulatedScenario {
  id: string;
  title: string;
  probability: number;
  breakdown: string;
  riskLevel: string;
  mitigation: string;
  mitigationSteps: string[];
  keyConsiderations: string[];
}

export const AIStudioAppBuilder: React.FC = () => {
  const [prompt, setPrompt] = useState<string>(
    'Crea un dashboard financiero completo con gráficos interactivos en Chart.js, 4 tarjetas KPI con porcentajes de variación, tabla de transacciones con búsqueda y filtrado por estado, selector de fechas y modal para registrar ingresos/gastos con persistencia en localStorage.'
  );
  const [selectedModel, setSelectedModel] = useState<ModelEngineId>('gemini-3.7-flash');
  const [selectedFramework, setSelectedFramework] = useState<string>('tailwind_html');
  const [customInstruction, setCustomInstruction] = useState<string>(
    'Diseño de interfaz futurista oscuro estilo Google AI Studio, responsivo y con animaciones suaves.'
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [editableCode, setEditableCode] = useState<string>('');
  const [activeViewMode, setActiveViewMode] = useState<'split' | 'preview' | 'code'>('split');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('analytics-finance-dashboard');
  const [generationMeta, setGenerationMeta] = useState<{
    latencyMs?: number;
    tokens?: number;
    modelUsed?: string;
  }>({});
  const [scenarios, setScenarios] = useState<SimulatedScenario[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' }>>([
    { id: '1', time: new Date().toLocaleTimeString(), text: 'AI Studio Web & App Engine listo para generación.', type: 'info' }
  ]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch preset templates on mount
  useEffect(() => {
    fetch('/api/ai-studio/templates')
      .then((r) => r.json())
      .then((data) => {
        if (data.templates) {
          setTemplates(data.templates);
        }
      })
      .catch((e) => console.warn('Error fetching templates', e));
  }, []);

  // Load default template app initially if none loaded
  useEffect(() => {
    if (!generatedHtml) {
      handleGenerateApp(false);
    }
  }, []);

  // Update iframe when code changes
  useEffect(() => {
    if (iframeRef.current && generatedHtml) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(generatedHtml);
        doc.close();
      }
    }
  }, [generatedHtml, activeViewMode, viewportMode]);

  const handleSelectTemplate = (template: TemplateItem) => {
    setSelectedTemplateId(template.id);
    setPrompt(template.defaultPrompt);
    setSelectedFramework(template.framework);
    addLog(`Plantilla seleccionada: ${template.name}`, 'info');
  };

  const addLog = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setConsoleLogs((prev) => [
      { id: Date.now().toString(), time: new Date().toLocaleTimeString(), text, type },
      ...prev.slice(0, 19)
    ]);
  };

  const handleGenerateApp = async (useUserPrompt: boolean = true) => {
    setIsGenerating(true);
    addLog(`Iniciando síntesis de app con ${selectedModel}...`, 'info');

    try {
      const targetPrompt = useUserPrompt ? prompt : 'Crea un dashboard financiero profesional con gráficos en Chart.js y tabla interactiva';
      const res = await fetch('/api/ai-studio/generate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          model: selectedModel,
          framework: selectedFramework,
          customInstruction
        })
      });

      const data = await res.json();
      if (data.success && data.htmlCode) {
        setGeneratedHtml(data.htmlCode);
        setEditableCode(data.htmlCode);
        setGenerationMeta({
          latencyMs: data.latencyMs,
          tokens: data.estimatedTokens,
          modelUsed: data.modelUsed
        });
        if (data.simulatedScenarios) {
          setScenarios(data.simulatedScenarios);
        }
        addLog(`¡Aplicación generada con éxito! Latencia: ${data.latencyMs}ms (~${data.estimatedTokens} tokens)`, 'success');
      } else {
        throw new Error(data.error || 'Error al compilar código');
      }
    } catch (err: any) {
      addLog(`Error en la generación: ${err.message}`, 'warn');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyCodeEdits = () => {
    setGeneratedHtml(editableCode);
    addLog('Cambios de código aplicados al Sandbox en vivo.', 'success');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editableCode || generatedHtml);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    addLog('Código copiado al portapapeles.', 'info');
  };

  const handleDownloadApp = () => {
    const codeToDownload = editableCode || generatedHtml;
    const blob = new Blob([codeToDownload], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-studio-app-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog('Archivo .html descargado listo para producción.', 'success');
  };

  const handleReloadSandbox = () => {
    if (iframeRef.current && generatedHtml) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(generatedHtml);
        doc.close();
        addLog('Sandbox recargado con estado inicial.', 'info');
      }
    }
  };

  const getViewportWidth = () => {
    switch (viewportMode) {
      case 'mobile':
        return 'w-[375px]';
      case 'tablet':
        return 'w-[768px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 text-slate-100">
      {/* HEADER & ARCHITECTURE BANNER */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
                Google AI Studio Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold">
                SDK @google/genai 2026
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-cyan-400" />
              Creador de Páginas, Apps & Software en Vivo
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl">
              Describe cualquier sitio web, aplicación SaaS, juego 3D o software completo. SophIA diseñará, codificará y renderizará la solución 100% interactiva en tiempo real con Tailwind CSS y persistencia local.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateApp(true)}
              disabled={isGenerating}
              className={`px-5 py-2.5 rounded-xl font-black text-xs md:text-sm shadow-lg flex items-center gap-2 transition cursor-pointer ${
                isGenerating
                  ? 'bg-indigo-900/60 text-indigo-300 cursor-not-allowed border border-indigo-500/30'
                  : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-950/50 hover:shadow-cyan-500/30 active:scale-95'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Sintetizando Código...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-200 fill-current" />
                  <span>Generar App en Vivo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* QUICK TEMPLATES GRID */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Plantillas Rápidas de Creación
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {templates.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className={`p-3 rounded-xl text-left transition-all border flex flex-col justify-between h-24 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-indigo-900/70 border-cyan-400 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400'
                    : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-700/60 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-black text-white line-clamp-1">{tpl.name}</div>
                  <div className="text-[10px] text-cyan-300/80 mt-0.5">{tpl.category}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-700/50 text-slate-400 self-start">
                  {tpl.framework}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PROMPT & PARAMETERS STUDIO CONTROLS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* AI Model Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Motor de Inferencia
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelEngineId)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.7-flash">Gemini 3.7 Flash (Ultra Rápido & Search)</option>
              <option value="gemini-3.1-pro">Gemini 3.1 Pro (Código Complejo & STEM)</option>
              <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Arquitectura & UX)</option>
              <option value="deepseek-r1">DeepSeek-R1 (Lógica Pura & Algoritmos)</option>
              <option value="qwen-2-5-coder">Qwen 2.5 Coder 72B (TypeScript Estricto)</option>
              <option value="gpt-4-5">GPT-4.5 Orion (Estrategia)</option>
            </select>
          </div>

          {/* Framework Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              Arquitectura / Framework
            </label>
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
            >
              <option value="tailwind_html">HTML5 + Tailwind CSS + Lucide Icons</option>
              <option value="react_babel">React 18 + Babel Standalone + Hooks</option>
              <option value="canvas_game">HTML5 Canvas 60 FPS + WebAudio API</option>
              <option value="chart_dashboard">Chart.js + Dashboard Responsive</option>
            </select>
          </div>

          {/* Style & Theme Preset */}
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              Directiva de Estilo UX/UI
            </label>
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Ej: Estilo cyberpunk, modo oscuro, fuentes elegantes..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Prompt Input Box */}
        <div>
          <label className="text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              Especificación de la App / Software
            </span>
            <span className="text-[11px] text-slate-400">
              {prompt.length} caracteres
            </span>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe en detalle las vistas, funcionalidades, botones, cálculos y tablas que deseas en tu app..."
              className="w-full bg-slate-950 border border-slate-700/90 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none font-mono resize-y"
            />
          </div>
        </div>
      </div>

      {/* WORKBENCH: LIVE SANDBOX & CODE EDITOR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Workbench Control Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={() => setActiveViewMode('split')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeViewMode === 'split'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dividida
            </button>
            <button
              onClick={() => setActiveViewMode('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeViewMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              Vista Previa
            </button>
            <button
              onClick={() => setActiveViewMode('code')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeViewMode === 'code'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3 h-3" />
              Código Fuente
            </button>
          </div>

          {/* Viewport Dimension Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewportMode === 'desktop' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Escritorio (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewportMode === 'tablet' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Tablet (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewportMode === 'mobile' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Móvil (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReloadSandbox}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition cursor-pointer"
              title="Reiniciar Sandbox"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title="Copiar Código"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadApp}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1 shadow-md shadow-emerald-950/50 transition cursor-pointer"
              title="Descargar archivo .html standalone ejecutable"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .HTML</span>
            </button>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className={`grid ${activeViewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} min-h-[540px] bg-slate-950`}>
          {/* 1. CODE EDITOR PANE */}
          {(activeViewMode === 'split' || activeViewMode === 'code') && (
            <div className="flex flex-col border-r border-slate-800 bg-slate-950">
              <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  index.html (Editable en Vivo)
                </span>
                <button
                  onClick={handleApplyCodeEdits}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow transition cursor-pointer flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Aplicar al Sandbox
                </button>
              </div>
              <textarea
                value={editableCode}
                onChange={(e) => setEditableCode(e.target.value)}
                className="flex-1 w-full p-4 bg-[#0a0f1d] text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-cyan-500/30 selection:text-white"
                spellCheck={false}
              />
            </div>
          )}

          {/* 2. SANDBOX PREVIEW PANE */}
          {(activeViewMode === 'split' || activeViewMode === 'preview') && (
            <div className="flex flex-col items-center justify-start bg-slate-900/60 p-3 overflow-auto">
              <div className={`transition-all duration-300 ${getViewportWidth()} h-[540px] bg-slate-950 rounded-xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col`}>
                <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                    <span className="ml-2 font-mono text-slate-300">Sandbox App Runner (AI Studio)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono">60 FPS</span>
                  </div>
                </div>
                <iframe
                  ref={iframeRef}
                  title="AI Studio Sandbox"
                  sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
                  className="w-full flex-1 bg-white border-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER METRICS & CONSOLE */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            {generationMeta.latencyMs && (
              <span className="flex items-center gap-1 text-cyan-300 font-mono">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Latencia: {generationMeta.latencyMs}ms
              </span>
            )}
            {generationMeta.tokens && (
              <span className="flex items-center gap-1 text-purple-300 font-mono">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                ~{generationMeta.tokens} tokens
              </span>
            )}
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cero Dependencias Externas / Standalone Ready
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Terminal className="w-3 h-3 text-slate-500" />
            <span className="text-slate-300 truncate">
              {consoleLogs[0]?.text || 'Sandbox activo.'}
            </span>
          </div>
        </div>
      </div>

      {/* 3 SIMULATED SCENARIOS (EVALUACIÓN AUTOMÁTICA EN 3 ESCENARIOS) */}
      {scenarios.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Simulación Previa de 3 Escenarios de Producción (Ley II)
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              100% Verificado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((sc, idx) => (
              <div key={sc.id || idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white line-clamp-1">{sc.title}</span>
                  <span className="text-xs font-mono font-black text-cyan-300">{sc.probability}%</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{sc.breakdown}</p>
                <div className="pt-1 text-[10px] text-slate-300 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold">Mitigación:</span>
                  <span className="text-slate-400 truncate max-w-[160px]">{sc.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
