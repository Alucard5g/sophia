import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Code,
  Eye,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  Layers,
  FileCode,
  Table as TableIcon,
  FileJson,
  FileText,
  ExternalLink,
  CheckCircle2,
  Terminal,
  Palette,
  Layout,
  Share2
} from 'lucide-react';
import { Interaction } from '../types';

interface CreationPreviewSandboxProps {
  currentInteraction: Interaction | null;
  onSendPrompt?: (prompt: string) => void;
}

export const CreationPreviewSandbox: React.FC<CreationPreviewSandboxProps> = ({
  currentInteraction,
  onSendPrompt,
}) => {
  const [activeView, setActiveView] = useState<'preview' | 'code' | 'table' | 'json' | 'doc'>('preview');
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [sandboxKey, setSandboxKey] = useState<number>(0);
  const [selectedDemoPreset, setSelectedDemoPreset] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Extract artifacts from finalResponse or fallback
  const rawText = currentInteraction?.finalResponse || '';

  // Extract HTML / CSS / JS / TSX code blocks
  const extractedArtifacts = useMemo(() => {
    if (!rawText && !selectedDemoPreset) {
      return null;
    }

    const textToAnalyze = selectedDemoPreset ? getDemoTemplate(selectedDemoPreset) : rawText;

    // 1. Check for HTML or TSX/JSX or full web component
    const codeBlockRegex = /```(?:html|xml|svg|jsx|tsx|javascript|typescript|css|json)?\s*([\s\S]*?)```/gi;
    const matches: { lang: string; code: string }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(textToAnalyze)) !== null) {
      const fullMatch = match[0];
      const code = match[1].trim();
      let lang = 'code';
      if (fullMatch.startsWith('```html')) lang = 'html';
      else if (fullMatch.startsWith('```svg')) lang = 'svg';
      else if (fullMatch.startsWith('```tsx') || fullMatch.startsWith('```jsx')) lang = 'react';
      else if (fullMatch.startsWith('```javascript') || fullMatch.startsWith('```typescript')) lang = 'js';
      else if (fullMatch.startsWith('```json')) lang = 'json';
      else if (fullMatch.startsWith('```css')) lang = 'css';
      matches.push({ lang, code });
    }

    // Check for SVG direct in text
    let svgCode = '';
    const svgMatch = textToAnalyze.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      svgCode = svgMatch[0];
    }

    // Check for Table markdown
    const tableLines = textToAnalyze.split('\n').filter((l) => l.trim().startsWith('|') && l.trim().endsWith('|'));
    let parsedTable: { headers: string[]; rows: string[][] } | null = null;
    if (tableLines.length >= 2) {
      const headers = tableLines[0]
        .split('|')
        .slice(1, -1)
        .map((h) => h.trim());
      const dataLines = tableLines.slice(1).filter((l) => !l.includes('---'));
      const rows = dataLines.map((l) =>
        l
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
      );
      if (headers.length > 0 && rows.length > 0) {
        parsedTable = { headers, rows };
      }
    }

    // Find primary executable code
    let primaryHtml = '';
    const htmlMatch = matches.find((m) => m.lang === 'html' || m.code.includes('<div') || m.code.includes('<!DOCTYPE') || m.code.includes('<html'));
    
    if (htmlMatch) {
      primaryHtml = htmlMatch.code;
    } else if (svgCode) {
      primaryHtml = `<div class="flex items-center justify-center min-h-[350px] p-6 bg-slate-900 rounded-2xl">${svgCode}</div>`;
    } else if (parsedTable) {
      primaryHtml = generateHtmlFromTable(parsedTable);
    } else {
      // Create a beautiful interactive presentation card of the text response
      primaryHtml = generatePresentationHtml(textToAnalyze, currentInteraction?.userQuery || 'Creación de SophIA');
    }

    // Ensure full valid HTML document with Tailwind CDN & modern styling
    const fullHtmlDoc = wrapWithTailwindSandBox(primaryHtml);

    return {
      fullHtmlDoc,
      primaryCode: matches[0]?.code || primaryHtml,
      allCodeBlocks: matches,
      svgCode,
      parsedTable,
      isRealCode: matches.length > 0 || !!svgCode || !!parsedTable,
    };
  }, [rawText, selectedDemoPreset, currentInteraction?.userQuery]);

  // Handle reload sandbox
  const handleReloadSandbox = () => {
    setSandboxKey((prev) => prev + 1);
  };

  const handleCopyCode = () => {
    if (!extractedArtifacts?.primaryCode) return;
    navigator.clipboard.writeText(extractedArtifacts.primaryCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadArtifact = (ext: 'html' | 'tsx' | 'json' | 'svg') => {
    if (!extractedArtifacts) return;
    let content = '';
    let mimeType = 'text/plain';

    if (ext === 'html') {
      content = extractedArtifacts.fullHtmlDoc;
      mimeType = 'text/html';
    } else if (ext === 'svg' && extractedArtifacts.svgCode) {
      content = extractedArtifacts.svgCode;
      mimeType = 'image/svg+xml';
    } else {
      content = extractedArtifacts.primaryCode;
      mimeType = ext === 'json' ? 'application/json' : 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sophia-creacion-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-4 transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4 max-w-none overflow-y-auto' : ''}`}>
      {/* Top Header Card */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between flex-wrap gap-3 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-600/30 via-purple-600/30 to-amber-500/30 border border-rose-500/40 text-rose-400">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Vista Previa de Creaciones (Live Preview)</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sandbox Interactivo
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Renderizado en tiempo real de aplicaciones web, componentes UI, tablas y gráficos generados por SophIA
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveView('preview')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'preview'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista En Vivo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('code')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'code'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Código Fuente</span>
          </button>

          {extractedArtifacts?.parsedTable && (
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'table'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabla Interactiva</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveView('doc')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'doc'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documento</span>
          </button>
        </div>
      </div>

      {/* Quick Demo Templates Selector (Instant Testing) */}
      <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-300">Explorar Plantillas de Creación:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'dashboard', label: '📊 Dashboard Web App' },
            { id: 'calculator', label: '🧮 Calculadora ROI' },
            { id: 'python_ai', label: '🐍 Script Python & Gemini' },
            { id: 'database_api', label: '🗄️ Esquema BD & API' },
            { id: 'tool_schema', label: '🛠️ Function Calling Schema' },
            { id: 'cloud_run', label: '🚀 Despliegue Cloud Run' },
            { id: 'svg', label: '🖼️ Gráfico SVG' },
            { id: 'card', label: '🎨 UI Neumórfica' },
            { id: 'passgen', label: '⚡ Generador Claves' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedDemoPreset(item.id);
                setActiveView('preview');
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                selectedDemoPreset === item.id
                  ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white font-bold shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
          {selectedDemoPreset && (
            <button
              type="button"
              onClick={() => setSelectedDemoPreset(null)}
              className="text-[10px] text-rose-400 hover:underline px-1"
            >
              Volver a respuesta actual
            </button>
          )}
        </div>
      </div>

      {/* Main Sandbox Box */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl space-y-0">
        {/* Sandbox Window Toolbar */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          {/* Left window control dots & status */}
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-[11px] font-mono text-slate-400 pl-2 border-l border-slate-800">
              sophia-sandbox://live-render
            </span>
          </div>

          {/* Viewport Width Switchers (Device Simulation) */}
          {activeView === 'preview' && (
            <div className="flex items-center space-x-1 bg-slate-900 px-1.5 py-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDeviceViewport('mobile')}
                className={`p-1.5 rounded-lg transition-colors ${
                  deviceViewport === 'mobile' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vista Móvil (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceViewport('tablet')}
                className={`p-1.5 rounded-lg transition-colors ${
                  deviceViewport === 'tablet' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vista Tablet (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceViewport('desktop')}
                className={`p-1.5 rounded-lg transition-colors ${
                  deviceViewport === 'desktop' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vista Completa / Escritorio (100%)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Right Action Tools */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleReloadSandbox}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              title="Recargar Sandbox"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2.5 py-1 text-slate-300 hover:text-white rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs flex items-center space-x-1 transition-all"
              title="Copiar Código"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-900 px-1 py-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => handleDownloadArtifact('html')}
                className="px-1.5 py-0.5 text-rose-300 hover:text-white rounded hover:bg-rose-900/50 transition"
                title="Descargar HTML"
              >
                .HTML
              </button>
              <button
                type="button"
                onClick={() => handleDownloadArtifact('tsx')}
                className="px-1.5 py-0.5 text-cyan-300 hover:text-white rounded hover:bg-cyan-900/50 transition"
                title="Descargar TSX / React"
              >
                .TSX
              </button>
              <button
                type="button"
                onClick={() => handleDownloadArtifact('json')}
                className="px-1.5 py-0.5 text-amber-300 hover:text-white rounded hover:bg-amber-900/50 transition"
                title="Descargar JSON"
              >
                .JSON
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onSendPrompt) {
                  onSendPrompt('Configura y despliega esta creación de SophIA directamente en Google Cloud Run');
                } else {
                  alert('Preparando contenedor Docker y manifiesto de despliegue para Google Cloud Run.');
                }
              }}
              className="px-2.5 py-1 text-cyan-300 hover:text-cyan-100 rounded-lg bg-cyan-950/60 border border-cyan-700/60 hover:bg-cyan-900/60 text-xs flex items-center space-x-1 transition-all shadow-sm"
              title="Desplegar a Google Cloud Run"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Desplegar Cloud Run</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Dynamic Sandbox Display Body */}
        <div className="p-0 bg-slate-950 min-h-[480px] flex items-center justify-center">
          {activeView === 'preview' && extractedArtifacts && (
            <div
              className={`transition-all duration-300 w-full flex justify-center py-4 px-2 ${
                deviceViewport === 'mobile'
                  ? 'max-w-[390px]'
                  : deviceViewport === 'tablet'
                  ? 'max-w-[768px]'
                  : 'max-w-full'
              }`}
            >
              <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-white min-h-[500px]">
                <iframe
                  key={sandboxKey}
                  ref={iframeRef}
                  srcDoc={extractedArtifacts.fullHtmlDoc}
                  title="SophIA Interactive Creation Sandbox"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  className="w-full h-[540px] border-0"
                />
              </div>
            </div>
          )}

          {activeView === 'code' && extractedArtifacts && (
            <div className="w-full p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 px-1">
                <span>Código Fuente Generado por SophIA:</span>
                <span className="text-[11px] text-rose-400">TypeScript / HTML / Tailwind</span>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-rose-200 overflow-x-auto max-h-[500px] leading-relaxed select-all">
                <code>{extractedArtifacts.primaryCode || extractedArtifacts.fullHtmlDoc}</code>
              </pre>
            </div>
          )}

          {activeView === 'table' && extractedArtifacts?.parsedTable && (
            <div className="w-full p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5">
                  <TableIcon className="w-4 h-4 text-emerald-400" />
                  Tabla Interactiva de Datos ({extractedArtifacts.parsedTable.rows.length} registros):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const csvContent = [
                      extractedArtifacts.parsedTable!.headers.join(','),
                      ...extractedArtifacts.parsedTable!.rows.map((r) => r.join(',')),
                    ].join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `tabla-sophia-${Date.now()}.csv`;
                    a.click();
                  }}
                  className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-lg text-xs hover:bg-emerald-900 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-x-auto bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-200 border-b border-slate-800">
                      {extractedArtifacts.parsedTable.headers.map((h, i) => (
                        <th key={i} className="p-3 font-semibold text-rose-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                    {extractedArtifacts.parsedTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/50 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'doc' && (
            <div className="w-full p-6 max-w-2xl mx-auto space-y-4 text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-rose-400 uppercase tracking-wider">
                  Documento Estructurado
                </div>
                <h3 className="text-base font-bold text-white">
                  {currentInteraction?.userQuery || 'Respuesta Formateada'}
                </h3>
                <div className="text-xs text-slate-400">
                  Modelo: {currentInteraction?.modelUsed || 'Gemini 3.7 Flash'} • {new Date().toLocaleDateString()}
                </div>
              </div>

              <div className="prose prose-invert prose-rose max-w-none text-xs leading-relaxed bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <pre className="whitespace-pre-wrap font-sans text-slate-200 text-xs">
                  {rawText || 'No hay contenido para mostrar.'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Wraps HTML snippet inside a full standalone page with Tailwind CDN, Google Fonts, and interactivity
 */
function wrapWithTailwindSandBox(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SophIA Creation Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
          },
          colors: {
            brand: {
              50: '#fff1f2',
              500: '#f43f5e',
              600: '#e11d48',
              900: '#881337',
            }
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #0b0f19;
      color: #f1f5f9;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
  <div class="w-full max-w-2xl mx-auto">
    ${innerHtml}
  </div>
</body>
</html>`;
}

function generateHtmlFromTable(table: { headers: string[]; rows: string[][] }): string {
  return `
  <div class="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-bold text-white flex items-center gap-2">
        <span class="text-rose-500">📊</span> Tabla Comparativa Inteligente
      </h3>
      <span class="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-semibold">Generada por SophIA</span>
    </div>
    <div class="overflow-x-auto rounded-2xl border border-slate-800">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-950 text-slate-200">
          <tr>
            ${table.headers.map((h) => `<th class="p-3 text-rose-300 font-bold">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800 text-slate-300">
          ${table.rows.map((row) => `
            <tr class="hover:bg-slate-800/60 transition-colors">
              ${row.map((c) => `<td class="p-3">${c}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  `;
}

function generatePresentationHtml(text: string, title: string): string {
  const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 1200);
  return `
  <div class="p-6 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
    <div class="flex items-center space-x-2 text-rose-400 font-bold text-xs">
      <span>🌹</span>
      <span>CREACIÓN ACTIVA DE SOPHIA</span>
    </div>
    <h2 class="text-lg font-bold text-white">${title}</h2>
    <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
      ${safeText}
    </div>
    <div class="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-800">
      <span>AI Studio Suite • Gemini 3.7</span>
      <span class="text-emerald-400 font-mono">Simulación Verificada</span>
    </div>
  </div>
  `;
}

/**
 * Built-in dynamic demo templates for instant previewing
 */
function getDemoTemplate(id: string): string {
  if (id === 'calculator') {
    return `\`\`\`html
<div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 space-y-5 max-w-md mx-auto">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2">
      <span class="text-2xl">🧮</span>
      <div>
        <h3 class="font-bold text-sm text-white">Calculadora Financiera de Préstamos</h3>
        <p class="text-[11px] text-slate-400">Simulador de cuota y costo total</p>
      </div>
    </div>
    <span class="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold rounded-full">SophIA Live</span>
  </div>

  <div class="space-y-3 text-xs">
    <div>
      <label class="block font-medium text-slate-300 mb-1">Monto del Préstamo ($ USD):</label>
      <input id="amount" type="number" value="10000" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-rose-500 focus:outline-none" oninput="calculate()">
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block font-medium text-slate-300 mb-1">Tasa Anual (%):</label>
        <input id="rate" type="number" value="8.5" step="0.1" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-rose-500 focus:outline-none" oninput="calculate()">
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">Plazo (Meses):</label>
        <input id="months" type="number" value="24" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-rose-500 focus:outline-none" oninput="calculate()">
      </div>
    </div>
  </div>

  <div class="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 to-purple-950/60 border border-rose-500/30 space-y-2">
    <div class="flex justify-between items-center text-xs">
      <span class="text-slate-300">Cuota Mensual Estimada:</span>
      <span id="monthlyResult" class="font-bold text-base text-rose-400 font-mono">$454.56</span>
    </div>
    <div class="flex justify-between items-center text-xs pt-2 border-t border-slate-800/80">
      <span class="text-slate-400">Total a Pagar (Capital + Interés):</span>
      <span id="totalResult" class="font-bold text-xs text-white font-mono">$10,909.44</span>
    </div>
  </div>

  <button onclick="calculate()" class="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-950/50">
    Recalcular Simulación
  </button>

  <script>
    function calculate() {
      const p = parseFloat(document.getElementById('amount').value) || 0;
      const r = (parseFloat(document.getElementById('rate').value) || 0) / 100 / 12;
      const n = parseInt(document.getElementById('months').value) || 1;
      
      let m = 0;
      if (r === 0) {
        m = p / n;
      } else {
        m = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      }
      
      const total = m * n;
      document.getElementById('monthlyResult').innerText = '$' + m.toFixed(2);
      document.getElementById('totalResult').innerText = '$' + total.toFixed(2);
    }
  </script>
</div>
\`\`\``;
  }

  if (id === 'dashboard') {
    return `\`\`\`html
<div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 space-y-4 max-w-lg mx-auto">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="font-bold text-sm text-white">Métricas de Rendimiento Cloud 2026</h3>
      <p class="text-[11px] text-slate-400">SophIA Analytics Live Stream</p>
    </div>
    <div class="flex items-center space-x-1 text-emerald-400 text-xs font-bold bg-emerald-950/80 px-2 py-1 rounded-xl border border-emerald-800/40">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1"></span>
      99.98% SLA
    </div>
  </div>

  <div class="grid grid-cols-3 gap-2.5 text-center">
    <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800">
      <div class="text-[10px] text-slate-400 uppercase font-semibold">Peticiones / seg</div>
      <div class="text-base font-bold text-rose-400 font-mono mt-1">12,450</div>
    </div>
    <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800">
      <div class="text-[10px] text-slate-400 uppercase font-semibold">Latencia Media</div>
      <div class="text-base font-bold text-amber-400 font-mono mt-1">185 ms</div>
    </div>
    <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800">
      <div class="text-[10px] text-slate-400 uppercase font-semibold">Tasa de Éxito</div>
      <div class="text-base font-bold text-emerald-400 font-mono mt-1">100%</div>
    </div>
  </div>

  <!-- Bar Visualizer Chart -->
  <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
    <div class="text-xs font-semibold text-slate-300 flex justify-between">
      <span>Carga de Procesamiento Semanal:</span>
      <span class="text-rose-400 font-mono">Q3 Peak</span>
    </div>
    <div class="h-24 flex items-end justify-between gap-2 pt-2">
      <div class="w-full bg-slate-800 rounded-t-lg relative group h-[45%] hover:bg-rose-500 transition-colors"><span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">Lun</span></div>
      <div class="w-full bg-slate-800 rounded-t-lg relative group h-[65%] hover:bg-rose-500 transition-colors"><span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">Mar</span></div>
      <div class="w-full bg-slate-800 rounded-t-lg relative group h-[85%] hover:bg-rose-500 transition-colors"><span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">Mie</span></div>
      <div class="w-full bg-gradient-to-t from-rose-600 to-purple-600 rounded-t-lg relative group h-[95%] shadow-lg shadow-rose-950"><span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-rose-400 font-bold">Jue</span></div>
      <div class="w-full bg-slate-800 rounded-t-lg relative group h-[75%] hover:bg-rose-500 transition-colors"><span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">Vie</span></div>
      <div class="w-full bg-slate-800 rounded-t-lg relative group h-[40%] hover:bg-rose-500 transition-colors"><span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">Sab</span></div>
      <div class="w-full bg-slate-800 rounded-t-lg relative group h-[30%] hover:bg-rose-500 transition-colors"><span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-400">Dom</span></div>
    </div>
  </div>
</div>
\`\`\``;
  }

  if (id === 'card') {
    return `\`\`\`html
<div class="max-w-sm mx-auto p-5 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-rose-500/30 shadow-2xl space-y-4">
  <div class="relative rounded-2xl overflow-hidden bg-slate-800 h-44 flex items-center justify-center">
    <div class="absolute inset-0 bg-gradient-to-tr from-rose-600/40 via-purple-600/40 to-transparent"></div>
    <div class="relative text-center p-4">
      <div class="text-4xl mb-2">🌹</div>
      <span class="text-xs uppercase font-mono font-bold tracking-widest text-rose-300">SophIA Pro Edition</span>
    </div>
  </div>

  <div class="space-y-1.5">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-bold text-white">Voz Dulce & Simulación Total</h3>
      <span class="text-xs font-mono font-bold text-emerald-400">$0.00 / Free</span>
    </div>
    <p class="text-xs text-slate-400">
      Multi-modelo integrado con Gemini 3.7, ChatGPT, Claude y DeepSeek en una sola experiencia fluida.
    </p>
  </div>

  <div class="pt-2 flex items-center gap-2">
    <button class="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/50 transition-all">
      Activar Experiencia
    </button>
    <button class="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs transition-all">
      ❤️
    </button>
  </div>
</div>
\`\`\``;
  }

  if (id === 'svg') {
    return `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-w-md mx-auto">
  <defs>
    <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="50%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <rect width="400" height="240" rx="24" fill="#0b0f19" stroke="#334155" stroke-width="2" />
  
  <!-- Neural Network Connections -->
  <line x1="80" y1="120" x2="200" y2="60" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4" opacity="0.7" />
  <line x1="80" y1="120" x2="200" y2="180" stroke="#a855f7" stroke-width="2" stroke-dasharray="4" opacity="0.7" />
  <line x1="200" y1="60" x2="320" y2="120" stroke="#3b82f6" stroke-width="2" opacity="0.8" />
  <line x1="200" y1="180" x2="320" y2="120" stroke="#f43f5e" stroke-width="2" opacity="0.8" />
  
  <!-- Nodes -->
  <circle cx="80" cy="120" r="18" fill="url(#roseGrad)" filter="url(#glow)" />
  <circle cx="200" cy="60" r="16" fill="#a855f7" />
  <circle cx="200" cy="180" r="16" fill="#3b82f6" />
  <circle cx="320" cy="120" r="22" fill="url(#roseGrad)" filter="url(#glow)" />
  
  <!-- Text Labels -->
  <text x="80" y="124" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">VOZ</text>
  <text x="200" y="64" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">SIM</text>
  <text x="200" y="184" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">IA</text>
  <text x="320" y="124" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">SOPHIA</text>
  
  <text x="200" y="218" fill="#94a3b8" font-size="10" font-family="sans-serif" text-anchor="middle">Red Neuronal Multimodal de Alta Precisión</text>
</svg>`;
  }

  if (id === 'python_ai') {
    return `\`\`\`html
<div class="p-6 bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl text-slate-100 space-y-4 max-w-lg mx-auto">
  <div class="flex items-center justify-between border-b border-slate-800 pb-3">
    <div class="flex items-center space-x-2">
      <span class="p-2 bg-emerald-600/30 text-emerald-400 rounded-xl text-lg font-mono">🐍</span>
      <div>
        <h3 class="font-bold text-sm text-white">Pipeline Python & Google GenAI SDK</h3>
        <p class="text-[11px] text-slate-400">Inferencia Multimodal & Extracción de Datos</p>
      </div>
    </div>
    <span class="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">Python 3.12</span>
  </div>

  <div class="space-y-2">
    <div class="text-xs text-slate-300 font-semibold flex justify-between">
      <span>Entrada de Inferencia (Prompt):</span>
      <span class="text-emerald-400 font-mono text-[10px]">Gemini 3.7 Flash</span>
    </div>
    <input id="pyInput" type="text" value="Clasificar transacciones y predecir anomalías financieras" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500">
  </div>

  <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
    <div class="text-slate-400"># Salida de Consola (Simulación Live):</div>
    <div id="pyConsole" class="text-emerald-400 leading-relaxed">
      > Importando @google/genai & Pandas...<br>
      > Modelo: gemini-3.7-flash (Thinking: ON)<br>
      > Transacciones analizadas: 1,420 registros.<br>
      > Anomalías detectadas: 0 (100% de confianza).
    </div>
  </div>

  <button onclick="runPythonDemo()" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/50">
    ▶ Ejecutar Pipeline Python
  </button>

  <script>
    function runPythonDemo() {
      const q = document.getElementById('pyInput').value;
      const c = document.getElementById('pyConsole');
      c.innerHTML = '> Ejecutando pipeline para: "' + q + '"...<br>' +
        '> Invocando Google GenAI SDK con Structured Output...<br>' +
        '> Latencia: 142ms | Tokens procesados: 485<br>' +
        '> Estado: <span style="color:#34d399;font-weight:bold;">Completado con Éxito (JSON Schema validado)</span>';
    }
  </script>
</div>
\`\`\``;
  }

  if (id === 'database_api') {
    return `\`\`\`html
<div class="p-6 bg-slate-900 border border-blue-500/40 rounded-3xl shadow-2xl text-slate-100 space-y-4 max-w-lg mx-auto">
  <div class="flex items-center justify-between border-b border-slate-800 pb-3">
    <div class="flex items-center space-x-2">
      <span class="p-2 bg-blue-600/30 text-blue-400 rounded-xl text-lg font-mono">🗄️</span>
      <div>
        <h3 class="font-bold text-sm text-white">Arquitectura PostgreSQL & Drizzle ORM</h3>
        <p class="text-[11px] text-slate-400">Modelo Relacional + API REST Express</p>
      </div>
    </div>
    <span class="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono">SQL DDL</span>
  </div>

  <div class="grid grid-cols-2 gap-2 text-xs">
    <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800">
      <div class="text-[10px] uppercase text-slate-400 font-semibold">Tabla Principal</div>
      <div class="text-sm font-bold text-cyan-300 font-mono mt-0.5">users_sessions</div>
      <div class="text-[10px] text-slate-400 mt-1">UUID, Timestamp, State</div>
    </div>
    <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800">
      <div class="text-[10px] uppercase text-slate-400 font-semibold">Tabla Relacionada</div>
      <div class="text-sm font-bold text-indigo-300 font-mono mt-0.5">ai_interactions</div>
      <div class="text-[10px] text-slate-400 mt-1">FK, Scenarios, Vectors</div>
    </div>
  </div>

  <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto space-y-1">
    <div class="text-blue-400 font-bold">-- Consulta SQL Optimizada con Índices:</div>
    <div>SELECT u.email, COUNT(i.id) as turns, AVG(i.latency_ms)</div>
    <div>FROM users_sessions u JOIN ai_interactions i ON u.id = i.session_id</div>
    <div>WHERE u.created_at &gt; NOW() - INTERVAL '7 days' GROUP BY u.email;</div>
  </div>

  <div class="flex gap-2">
    <button onclick="alert('Esquema verificado. Listo para aplicar migraciones con Drizzle Kit');" class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition">
      Verificar Esquema & Migración
    </button>
  </div>
</div>
\`\`\``;
  }

  if (id === 'tool_schema') {
    return `\`\`\`html
<div class="p-6 bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl text-slate-100 space-y-4 max-w-lg mx-auto">
  <div class="flex items-center justify-between border-b border-slate-800 pb-3">
    <div class="flex items-center space-x-2">
      <span class="p-2 bg-amber-600/30 text-amber-400 rounded-xl text-lg font-mono">🛠️</span>
      <div>
        <h3 class="font-bold text-sm text-white">Declaración de Tools & Function Calling</h3>
        <p class="text-[11px] text-slate-400">Esquema JSON Schema OpenAPI 3.0 para Gemini</p>
      </div>
    </div>
    <span class="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono">Tool Call</span>
  </div>

  <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[11px] text-amber-300 space-y-1 overflow-x-auto">
    <div class="text-slate-400">// Declaración de Función en AI Studio:</div>
    <div>name: <span class="text-white">"smartTvRivieraControl"</span></div>
    <div>parameters: {</div>
    <div class="pl-4">command: <span class="text-emerald-400">"POWER_ON" | "VOLUME_SET" | "APP_LAUNCH"</span>,</div>
    <div class="pl-4">volume: <span class="text-blue-400">number</span>,</div>
    <div class="pl-4">launchApp: <span class="text-purple-400">"Netflix" | "YouTube" | "Spotify"</span></div>
    <div>}</div>
  </div>

  <button onclick="alert('Función invocada exitosamente por el modelo de IA');" class="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition">
    ⚡ Simular Invocación de Tool en AI Studio
  </button>
</div>
\`\`\``;
  }

  if (id === 'cloud_run') {
    return `\`\`\`html
<div class="p-6 bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl text-slate-100 space-y-4 max-w-lg mx-auto">
  <div class="flex items-center justify-between border-b border-slate-800 pb-3">
    <div class="flex items-center space-x-2">
      <span class="p-2 bg-cyan-600/30 text-cyan-400 rounded-xl text-lg font-mono">🚀</span>
      <div>
        <h3 class="font-bold text-sm text-white">Despliegue a Google Cloud Run</h3>
        <p class="text-[11px] text-slate-400">Contenedor Docker Multi-stage & Serverless</p>
      </div>
    </div>
    <span class="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">Cloud Run</span>
  </div>

  <div class="grid grid-cols-3 gap-2 text-center text-xs">
    <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800">
      <div class="text-[10px] text-slate-400">Puerto Ingress</div>
      <div class="text-sm font-bold text-cyan-400 font-mono mt-0.5">3000</div>
    </div>
    <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800">
      <div class="text-[10px] text-slate-400">Memoria / CPU</div>
      <div class="text-sm font-bold text-emerald-400 font-mono mt-0.5">1 GiB / 1 vCPU</div>
    </div>
    <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800">
      <div class="text-[10px] text-slate-400">Autoscaling</div>
      <div class="text-sm font-bold text-indigo-400 font-mono mt-0.5">0 a 10 inst.</div>
    </div>
  </div>

  <div class="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[10px] text-cyan-300 overflow-x-auto">
    gcloud run deploy sophia-applet --image gcr.io/sophia-project/app:latest --platform managed --region us-east1 --allow-unauthenticated
  </div>

  <button onclick="alert('Despliegue en curso: Servicio Cloud Run configurado y listo en HTTPS');" class="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-950">
    🚀 Iniciar Despliegue en Google Cloud
  </button>
</div>
\`\`\``;
  }

  if (id === 'passgen') {
    return `\`\`\`html
<div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 space-y-4 max-w-sm mx-auto">
  <div class="flex items-center space-x-2">
    <span class="text-xl">⚡</span>
    <h3 class="font-bold text-sm text-white">Generador de Claves Seguras</h3>
  </div>

  <div class="relative">
    <input id="pwdOutput" type="text" readonly value="sOpH!A_2026#k9XmQ" class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-rose-400 font-mono text-sm font-bold focus:outline-none">
    <button onclick="navigator.clipboard.writeText(document.getElementById('pwdOutput').value); alert('Clave copiada');" class="absolute right-2 top-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-white rounded-lg">
      Copiar
    </button>
  </div>

  <div class="space-y-2 text-xs text-slate-300">
    <div class="flex justify-between">
      <span>Longitud:</span>
      <span id="lenLabel" class="font-mono text-rose-400 font-bold">16</span>
    </div>
    <input id="lenSlider" type="range" min="8" max="32" value="16" oninput="document.getElementById('lenLabel').innerText = this.value; generate();" class="w-full accent-rose-500">
  </div>

  <button onclick="generate()" class="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950">
    Generar Nueva Clave
  </button>

  <script>
    function generate() {
      const len = parseInt(document.getElementById('lenSlider').value);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><,./-=';
      let res = '';
      for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      document.getElementById('pwdOutput').value = res;
    }
  </script>
</div>
\`\`\``;
  }

  return '';
}
