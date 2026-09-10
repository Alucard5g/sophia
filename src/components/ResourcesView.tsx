import React, { useState } from 'react';
import { ResourceItem, Interaction } from '../types';
import {
  FileText,
  Image,
  Link2,
  Video,
  Search,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Sparkles,
  FolderOpen,
  Layers,
  Download,
  Globe,
  Share2,
  Brain
} from 'lucide-react';

interface ResourcesViewProps {
  currentInteraction: Interaction | null;
  allInteractions: Interaction[];
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ currentInteraction, allInteractions }) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedDossier, setCopiedDossier] = useState<boolean>(false);

  // Collect resources from current interaction or aggregate across all
  const rawResources: ResourceItem[] = currentInteraction?.resources && currentInteraction.resources.length > 0
    ? currentInteraction.resources
    : allInteractions.flatMap((i) => i.resources || []);

  // Also collect attachments from interactions
  const allAttachments = currentInteraction?.attachments && currentInteraction.attachments.length > 0
    ? currentInteraction.attachments
    : allInteractions.flatMap((i) => i.attachments || []);

  const attachmentResources: ResourceItem[] = allAttachments.map((att) => ({
    id: `att-res-${att.id}`,
    type: att.type === 'image' ? 'image' : att.type === 'video' ? 'video' : 'document',
    title: att.name,
    url: att.previewUrl,
    description: att.summary || `Archivo ${att.type} adjunto analizado por SophIA (${(att.sizeBytes / 1024).toFixed(1)} KB).`,
    sourceDomain: 'Archivos Subidos',
    createdAt: new Date().toISOString(),
  }));

  // Remove duplicates by title
  const resources: ResourceItem[] = [];
  [...attachmentResources, ...rawResources].forEach((item) => {
    if (!resources.some((r) => r.title === item.title)) {
      resources.push(item);
    }
  });

  const handleCopyLink = (url?: string, id?: string) => {
    if (!url || !id) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyDossier = () => {
    const dossierText = `# 📚 Dossier de Recursos de Investigación - SophIA
Generado automáticamente por SophIA Asistente de IA

${resources.map((r, i) => `### ${i + 1}. [${r.type.toUpperCase()}] ${r.title}
- **Descripción:** ${r.description}
- **Enlace:** ${r.url || 'N/A'}
- **Dominio:** ${r.sourceDomain || 'Web'}
`).join('\n')}
`;
    navigator.clipboard.writeText(dossierText);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2000);
  };

  const filteredResources = resources.filter((res) => {
    const matchesType = selectedType === 'all' || res.type === selectedType;
    const matchesSearch =
      res.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      res.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (res.sourceDomain && res.sourceDomain.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'image':
        return <Image className="w-5 h-5 text-purple-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'research':
        return <Search className="w-5 h-5 text-amber-400" />;
      case 'link':
      default:
        return <Link2 className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
      case 'image':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      case 'video':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
      case 'research':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'link':
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/80 p-6 rounded-3xl border border-emerald-900/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Barra de Recursos de SophIA</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold">
                  Sincronizado con el Cerebro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Documentos, imágenes, enlaces, videos e investigación vinculados a tus instrucciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDossier}
              className="px-3 py-1.5 rounded-xl bg-slate-950 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {copiedDossier ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedDossier ? 'Dossier Copiado' : 'Exportar Dossier'}</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 text-emerald-400 border border-emerald-800/60 font-mono text-xs font-semibold">
              {resources.length} Recursos
            </span>
          </div>
        </div>

        {currentInteraction && (
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span className="truncate mr-2">
              <strong className="text-emerald-400">Instrucción actual:</strong> "{currentInteraction.userQuery}"
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[11px] shrink-0 font-mono">
              {currentInteraction.modelTier || currentInteraction.modelUsed}
            </span>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar recurso por título, temática o dominio..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full bg-slate-900 text-slate-200 placeholder-slate-500 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 shadow-md"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Filtrar:
        </span>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'document', label: '📄 Documentos' },
          { id: 'research', label: '🔬 Investigaciones' },
          { id: 'video', label: '🎬 Videos' },
          { id: 'image', label: '🖼️ Imágenes' },
          { id: 'link', label: '🔗 Enlaces' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedType === tab.id
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resource Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-10 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3 text-slate-400">
          <FolderOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">No hay recursos en esta categoría</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ejecuta una instrucción por voz o texto en SophIA para generar recursos y referencias automáticas.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1">
          {filteredResources.map((res, index) => (
            <div
              key={res.id || index}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2.5 shadow-lg group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {getResourceIcon(res.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      {res.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold border ${getBadgeColor(res.type)}`}>
                        {res.type}
                      </span>
                      {res.sourceDomain && (
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-500" />
                          {res.sourceDomain}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {res.url && (
                    <>
                      <button
                        onClick={() => handleCopyLink(res.url, res.id)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all text-xs"
                        title="Copiar enlace"
                      >
                        {copiedId === res.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900 transition-all text-xs flex items-center gap-1"
                        title="Abrir recurso"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-11">
                {res.description}
              </p>

              {res.url && (
                <div className="pl-11">
                  <span className="text-[11px] font-mono text-slate-500 truncate block">
                    {res.url}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
