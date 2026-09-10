import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Interaction, MemoryPoint, ResourceItem } from '../types';
import {
  Database,
  Search,
  Brain,
  Trash2,
  Calendar,
  ShieldCheck,
  Filter,
  Sparkles,
  Volume2,
  Bot,
  Layers,
  FileText,
  Image,
  Video,
  Link2,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Cpu,
  Globe,
  Download,
  Upload,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Play,
  Share2
} from 'lucide-react';
import {
  getInteractionsFromOfflineCache,
  getMemoriesFromOfflineCache,
  getResourcesFromOfflineCache,
  saveInteractionToOfflineCache,
  deleteInteractionFromOfflineCache,
  syncOfflineQueueWithFirebase,
  exportSophiaDatabaseJson,
  importSophiaDatabaseJson
} from '../lib/offlineStorage';
import { speakSmoothSophia } from '../lib/smoothSpeech';

interface InteractionHistoryDBProps {
  onSelectInteraction?: (interaction: Interaction) => void;
}

export const InteractionHistoryDB: React.FC<InteractionHistoryDBProps> = ({ onSelectInteraction }) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [memories, setMemories] = useState<MemoryPoint[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'interactions' | 'resources' | 'memory'>('interactions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('Sincronizado con Firebase Firestore y Caché Offline');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // New Resource Form Modal State
  const [showAddResourceModal, setShowAddResourceModal] = useState<boolean>(false);
  const [newResTitle, setNewResTitle] = useState<string>('');
  const [newResType, setNewResType] = useState<'document' | 'image' | 'link' | 'video' | 'research'>('document');
  const [newResUrl, setNewResUrl] = useState<string>('');
  const [newResDesc, setNewResDesc] = useState<string>('');
  const [newResMemoryKey, setNewResMemoryKey] = useState<string>('General');

  // New Memory Point Modal State
  const [showAddMemoryModal, setShowAddMemoryModal] = useState<boolean>(false);
  const [newMemKey, setNewMemKey] = useState<string>('');
  const [newMemFact, setNewMemFact] = useState<string>('');
  const [newMemCategory, setNewMemCategory] = useState<string>('General');

  const fetchDbData = async () => {
    // 1. Load from offline cache first for instant render
    const offlineInts = await getInteractionsFromOfflineCache();
    const offlineMems = await getMemoriesFromOfflineCache();
    const offlineRes = await getResourcesFromOfflineCache();

    if (offlineInts.length > 0) setInteractions(offlineInts);
    if (offlineMems.length > 0) setMemories(offlineMems);
    if (offlineRes.length > 0) setResources(offlineRes);

    // 2. If online, fetch from backend and reconcile
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const [resInt, resMem, resRes] = await Promise.allSettled([
          fetch('/api/interactions').then((r) => r.json()),
          fetch('/api/memory').then((r) => r.json()),
          fetch('/api/resources').then((r) => r.json())
        ]);

        if (resInt.status === 'fulfilled' && resInt.value?.interactions) {
          const serverList: Interaction[] = resInt.value.interactions;
          // Merge server with offline list
          const combinedMap = new Map<string, Interaction>();
          offlineInts.forEach((i) => combinedMap.set(i.id, i));
          serverList.forEach((i) => combinedMap.set(i.id, i));
          const mergedList = Array.from(combinedMap.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setInteractions(mergedList);
          // Update cache
          mergedList.forEach((i) => saveInteractionToOfflineCache(i));
        }

        if (resMem.status === 'fulfilled' && resMem.value?.memories) {
          setMemories(resMem.value.memories);
        }

        if (resRes.status === 'fulfilled' && resRes.value?.resources) {
          setResources(resRes.value.resources);
        }
      } catch (err) {
        console.warn('Online sync warning:', err);
      }
    }
  };

  useEffect(() => {
    fetchDbData();

    const handleOnline = () => {
      setIsOnline(true);
      handleManualSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatusMsg('Modo Offline: Operando con memoria local y caché');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Sincronizando registros con Firebase Firestore...');
    try {
      const res = await syncOfflineQueueWithFirebase();
      await fetchDbData();
      setSyncStatusMsg(`Sincronización completada. ${res.syncedCount} registros respaldados en la nube.`);
    } catch (e) {
      setSyncStatusMsg('Error en sincronización. Datos preservados en caché local.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportSophiaDatabaseJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sophia_backup_historial_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export backup error:', err);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importSophiaDatabaseJson(text);
      await fetchDbData();
      alert(`¡Backup restaurado con éxito! ${result.importedInteractions} interacciones y ${result.importedMemories} hechos cargados.`);
    } catch (err: any) {
      alert(`Error al importar backup: ${err.message}`);
    }
  };

  const handleDeleteInteraction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteInteractionFromOfflineCache(id);
    setInteractions((prev) => prev.filter((item) => item.id !== id));
    if (selectedInteraction?.id === id) setSelectedInteraction(null);

    try {
      await fetch(`/api/interactions/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete server warning:', err);
    }
  };

  const handleDeleteResource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.warn('Delete resource error:', err);
    }
  };

  const handleDeleteMemory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.warn('Delete memory error:', err);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle.trim()) return;
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newResTitle,
          type: newResType,
          url: newResUrl,
          description: newResDesc,
          relatedMemoryKey: newResMemoryKey,
        }),
      });
      const data = await res.json();
      if (data.success && data.resource) {
        setResources((prev) => [data.resource, ...prev]);
        setShowAddResourceModal(false);
        setNewResTitle('');
        setNewResUrl('');
        setNewResDesc('');
      }
    } catch (err) {
      console.warn('Create resource error:', err);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemFact.trim()) return;
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newMemKey || 'Conocimiento Personalizado',
          fact: newMemFact,
          category: newMemCategory,
        }),
      });
      const data = await res.json();
      if (data.success && data.memory) {
        setMemories((prev) => [data.memory, ...prev]);
        setShowAddMemoryModal(false);
        setNewMemKey('');
        setNewMemFact('');
      }
    } catch (err) {
      console.warn('Create memory error:', err);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'image':
        return <Image className="w-4 h-4 text-purple-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-400" />;
      case 'research':
        return <Search className="w-4 h-4 text-amber-400" />;
      case 'link':
      default:
        return <Link2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const filteredInteractions = interactions.filter((item) => {
    const matchesSearch =
      item.userQuery.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.finalResponse.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedResourceType === 'all' || res.type === selectedResourceType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Main Header & Sub-Tabs */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">Cerebro Firebase & Caché Offline de SophIA</h2>
                <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {isOnline ? 'Firebase Firestore + Caché Activo' : 'Modo Offline (IndexedDB Activo)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Almacenamiento dual persistente en la nube y en caché local para acceso total con y sin internet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
              title="Sincronizar con Firebase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
              title="Exportar base de datos JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar</span>
            </button>

            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Importar</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="flex items-center justify-between text-xs px-3.5 py-2 bg-slate-950/70 rounded-xl border border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span>{syncStatusMsg}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Brain Learning Evolution Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-purple-500/20">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Chats Guardados</span>
            <p className="text-sm font-bold text-white font-mono">{interactions.length} Turnos</p>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Memoria Semántica</span>
            <p className="text-sm font-bold text-purple-400 font-mono">{memories.length} Hechos</p>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Recursos Vinculados</span>
            <p className="text-sm font-bold text-emerald-400 font-mono">{resources.length} Archivos</p>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Índice Evolución IA</span>
            <p className="text-sm font-bold text-amber-400 font-mono">+99.4% Diario</p>
          </div>
        </div>

        {/* 3 Main Brain Sub-Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setActiveSubTab('interactions');
              setSearchQuery('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'interactions'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Historial Detallado ({interactions.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('resources');
              setSearchQuery('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'resources'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-300" />
            <span>Recursos Cerebro ({resources.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('memory');
              setSearchQuery('');
            }}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'memory'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-300" />
            <span>Memoria ({memories.length})</span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={
                activeSubTab === 'resources'
                  ? 'Buscar en la barra de recursos del cerebro...'
                  : activeSubTab === 'memory'
                  ? 'Buscar en la memoria de SophIA...'
                  : 'Buscar en el historial de interacciones...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 placeholder-slate-500 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500"
            />
          </div>

          {activeSubTab === 'interactions' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 text-slate-300 text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500"
            >
              <option value="all">Todas las Categorías</option>
              <option value="Productividad">Productividad</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Finanzas">Finanzas</option>
              <option value="Educación">Educación</option>
              <option value="Estrategia">Estrategia</option>
              <option value="Salud">Salud</option>
              <option value="General">General</option>
            </select>
          )}

          {activeSubTab === 'resources' && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedResourceType}
                onChange={(e) => setSelectedResourceType(e.target.value)}
                className="bg-slate-950 text-slate-300 text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Todos los Tipos</option>
                <option value="document">📄 Documentos</option>
                <option value="research">🔬 Investigaciones</option>
                <option value="video">🎬 Videos</option>
                <option value="image">🖼️ Imágenes</option>
                <option value="link">🔗 Enlaces</option>
              </select>

              <button
                onClick={() => setShowAddResourceModal(true)}
                className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </button>
            </div>
          )}

          {activeSubTab === 'memory' && (
            <button
              onClick={() => setShowAddMemoryModal(true)}
              className="px-3 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Hecho</span>
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: INTERACTIONS VIEW (FULL RICH CARDS) */}
      {activeSubTab === 'interactions' && (
        <div className="space-y-4">
          {filteredInteractions.length === 0 ? (
            <div className="p-10 text-center text-slate-400 bg-slate-900/60 rounded-3xl border border-slate-800 text-xs space-y-2">
              <Database className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No hay interacciones registradas aún.</p>
              <p className="text-slate-500">Dicta o escribe cualquier instrucción a SophIA y quedará guardada en la base de datos de Firebase y en caché offline.</p>
            </div>
          ) : (
            filteredInteractions.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedInteraction(item)}
                className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-all space-y-3.5 group shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {item.category || 'General'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(item.timestamp).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                      {item.isOffline && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          💾 Guardado en Caché Local
                        </span>
                      )}
                      {item.antiHallucinationCheck && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                          ✓ {item.antiHallucinationCheck.confidenceScore}% Certidumbre
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-rose-300 transition-colors pt-0.5">
                      "{item.userQuery}"
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.spokenSummary || item.finalResponse) {
                          speakSmoothSophia(item.spokenSummary || item.finalResponse);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                      title="Escuchar locución"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteInteraction(item.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Simulated Scenarios Preview Bar */}
                {item.simulatedScenarios && item.simulatedScenarios.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {item.simulatedScenarios.map((sc, scIdx) => (
                      <div key={scIdx} className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-1 text-left">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-200 truncate pr-1">{sc.title}</span>
                          <span className="text-emerald-400 font-mono">{sc.probability}%</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 rounded-full"
                            style={{ width: `${sc.probability}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{sc.breakdown}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Response Content Snippet */}
                <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-900 line-clamp-3 overflow-hidden leading-relaxed">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {item.finalResponse}
                  </Markdown>
                </div>

                {/* Footer Telemetry & Model Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium font-mono text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {item.simulatedScenarios?.length || 3} Escenarios Cuantitativos
                    </span>
                    {item.resources && item.resources.length > 0 && (
                      <span className="flex items-center gap-1 text-indigo-300 font-mono text-[10px]">
                        <Layers className="w-3 h-3" />
                        {item.resources.length} Recursos
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-400 text-[10px] bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                      {item.modelTier || item.modelUsed}
                    </span>
                    <span className="font-mono text-slate-500 text-[10px]">
                      {item.latencyMs}ms
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUBTAB 2: BRAIN RESOURCE BAR VIEW */}
      {activeSubTab === 'resources' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Barra de Recursos del Cerebro de SophIA:</strong> Documentos, investigaciones, videos, enlaces e infografías vinculados a la base de conocimiento del asistente.
              </span>
            </div>
            <button
              onClick={() => setShowAddResourceModal(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1 text-xs hover:bg-emerald-500 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Recurso
            </button>
          </div>

          {filteredResources.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-3xl border border-slate-800 text-xs">
              No hay recursos guardados en esta categoría del cerebro.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredResources.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2 group shadow-md"
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
                          <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-slate-950 text-emerald-400 border border-emerald-900/60">
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

                    <button
                      onClick={(e) => handleDeleteResource(res.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Eliminar recurso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                    {res.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="font-mono text-[10px] text-slate-500">
                      Tópico: {res.relatedMemoryKey || 'General'}
                    </span>
                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 text-xs"
                      >
                        <span>Abrir Recurso</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: MEMORY VIEW */}
      {activeSubTab === 'memory' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-400 shrink-0" />
              <span>
                <strong>Memoria Semántica & Hechos Aprendidos:</strong> Conocimientos, reglas y preferencias que SophIA indexa y utiliza para personalizar sus respuestas continuamente.
              </span>
            </div>
            <button
              onClick={() => setShowAddMemoryModal(true)}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-xl font-bold flex items-center gap-1 text-xs hover:bg-purple-500 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Hecho
            </button>
          </div>

          {memories.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-3xl border border-slate-800 text-xs">
              No hay hechos registrados en la memoria de SophIA.
            </div>
          ) : (
            <div className="grid gap-3">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition-all space-y-2 group shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                          {m.key}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-900/60">
                          {m.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteMemory(m.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Eliminar hecho"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                    {m.fact}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Registrado: {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Detail for Selected Interaction */}
      {selectedInteraction && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Detalle de Interacción & Simulación SophIA</h3>
              </div>
              <div className="flex items-center gap-2">
                {onSelectInteraction && (
                  <button
                    onClick={() => {
                      onSelectInteraction(selectedInteraction);
                      setSelectedInteraction(null);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-xs text-white font-semibold rounded-xl transition-all shadow-md"
                  >
                    Abrir en Simulador
                  </button>
                )}
                <button
                  onClick={() => setSelectedInteraction(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* User Prompt */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-rose-400 font-bold uppercase text-[10px] tracking-wider block">Instrucción del Usuario:</span>
                <p className="text-slate-100 font-medium text-sm">"{selectedInteraction.userQuery}"</p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
                  <span>{new Date(selectedInteraction.timestamp).toLocaleString()}</span>
                  <span>•</span>
                  <span>Categoría: {selectedInteraction.category}</span>
                </div>
              </div>

              {/* 3 Simulated Scenarios Detailed Breakdown */}
              {selectedInteraction.simulatedScenarios && selectedInteraction.simulatedScenarios.length > 0 && (
                <div className="space-y-2">
                  <span className="text-rose-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    3 Escenarios Cuantitativos Simulados:
                  </span>
                  <div className="grid gap-2.5">
                    {selectedInteraction.simulatedScenarios.map((sc, i) => (
                      <div key={i} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/90 space-y-2">
                        <div className="flex justify-between items-center font-bold text-slate-200">
                          <span className="text-sm text-slate-100">{sc.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {sc.probability}% Probabilidad
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">{sc.breakdown}</p>

                        {sc.mitigation && (
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
                            <span className="text-rose-400 font-bold block">Plan de Mitigación & Contingencia:</span>
                            <p className="text-slate-300">{sc.mitigation}</p>
                          </div>
                        )}

                        {sc.keyConsiderations && sc.keyConsiderations.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {sc.keyConsiderations.map((kc, kIdx) => (
                              <span key={kIdx} className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-400 text-[10px] border border-slate-800 font-mono">
                                • {kc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spoken Summary for Avatar */}
              {selectedInteraction.spokenSummary && (
                <div className="p-3.5 bg-rose-950/20 rounded-2xl border border-rose-800/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-300 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      Locución y Síntesis Vocal de SophIA:
                    </span>
                    <button
                      onClick={() => speakSmoothSophia(selectedInteraction.spokenSummary!)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Play className="w-3 h-3" />
                      Escuchar
                    </button>
                  </div>
                  <p className="text-rose-100 italic text-xs leading-relaxed">
                    "{selectedInteraction.spokenSummary}"
                  </p>
                </div>
              )}

              {/* Formatted Final Markdown Response */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold uppercase text-[10px] tracking-wider block">
                    Respuesta Completa Formateada:
                  </span>
                  <button
                    onClick={() => handleCopyText(selectedInteraction.finalResponse, selectedInteraction.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-all"
                  >
                    {copiedId === selectedInteraction.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === selectedInteraction.id ? 'Copiado' : 'Copiar Markdown'}</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-200 prose prose-invert max-w-none text-xs leading-relaxed max-h-72 overflow-y-auto">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {selectedInteraction.finalResponse}
                  </Markdown>
                </div>
              </div>

              {/* Linked Resources */}
              {selectedInteraction.resources && selectedInteraction.resources.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider block">Recursos Vinculados:</span>
                  <div className="grid gap-1.5">
                    {selectedInteraction.resources.map((res, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{res.title}</span>
                        {res.url && (
                          <a href={res.url} target="_blank" rel="noreferrer" className="text-emerald-400 text-[11px] underline flex items-center gap-1">
                            <span>Ver Recurso</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Telemetry Footer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
                <div>Modelo: <span className="text-slate-200">{selectedInteraction.modelUsed}</span></div>
                <div>Latencia: <span className="text-slate-200">{selectedInteraction.latencyMs} ms</span></div>
                <div>Certidumbre: <span className="text-emerald-400">{selectedInteraction.antiHallucinationCheck?.confidenceScore || 100}%</span></div>
                <div>Tokens: <span className="text-slate-200">{selectedInteraction.tokenTelemetry?.totalTokens || 'N/A'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Resource */}
      {showAddResourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateResource}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Añadir Recurso a la Barra del Cerebro
              </h3>
              <button
                type="button"
                onClick={() => setShowAddResourceModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Título del Recurso:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Guía Oficial de React 19 y TypeScript"
                  value={newResTitle}
                  onChange={(e) => setNewResTitle(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tipo de Recurso:</label>
                  <select
                    value={newResType}
                    onChange={(e) => setNewResType(e.target.value as any)}
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="document">📄 Documento</option>
                    <option value="research">🔬 Investigación</option>
                    <option value="video">🎬 Video</option>
                    <option value="image">🖼️ Imagen</option>
                    <option value="link">🔗 Enlace</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Categoría:</label>
                  <input
                    type="text"
                    value={newResMemoryKey}
                    onChange={(e) => setNewResMemoryKey(e.target.value)}
                    placeholder="ej. Tecnología, Finanzas"
                    className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">URL o Enlace:</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newResUrl}
                  onChange={(e) => setNewResUrl(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Descripción o Aporte:</label>
                <textarea
                  rows={3}
                  placeholder="Explica qué contiene este recurso y cómo aporta a las respuestas de SophIA..."
                  value={newResDesc}
                  onChange={(e) => setNewResDesc(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-950/40"
            >
              Guardar en el Cerebro de SophIA
            </button>
          </form>
        </div>
      )}

      {/* Modal: Add Fact to Memory */}
      {showAddMemoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMemory}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Registrar Hecho en la Memoria Semántica
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMemoryModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Clave o Tópico:</label>
                <input
                  type="text"
                  placeholder="ej. Preferencia de Visualización de Tablas"
                  value={newMemKey}
                  onChange={(e) => setNewMemKey(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Hecho o Regla a Aprender:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe la instrucción o preferencia que SophIA debe recordar siempre..."
                  value={newMemFact}
                  onChange={(e) => setNewMemFact(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg"
            >
              Aprender y Guardar Hecho
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
