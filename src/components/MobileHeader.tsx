import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  Mic,
  Cpu,
  Database,
  GitBranch,
  Sparkles,
  Layers,
  Bot,
  Sliders,
  Layout,
  Home,
  Smartphone,
  Download,
  Bluetooth,
  Radio,
  Tv,
  Globe,
  User,
  ShieldCheck,
  Calendar,
  Bell,
  Brain,
  Key
} from 'lucide-react';
import { UserDeviceProfile } from '../types';

export type AppTab =
  | 'avatar'
  | 'recorder'
  | 'agenda'
  | 'news'
  | 'remote'
  | 'studio'
  | 'bluetooth'
  | 'smarthome'
  | 'phone'
  | 'simulator'
  | 'creations'
  | 'resources'
  | 'aistudio'
  | 'models'
  | 'database'
  | 'install'
  | 'deploy';

interface MobileHeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isRecording: boolean;
  failoverOccurred?: boolean;
  userProfile?: UserDeviceProfile | null;
  onOpenDeviceModal?: () => void;
  onOpenBrainEvolution?: () => void;
  onOpenApiKeys?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  setActiveTab,
  isRecording,
  failoverOccurred,
  userProfile,
  onOpenDeviceModal,
  onOpenBrainEvolution,
  onOpenApiKeys
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-slate-950 text-slate-100 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md bg-slate-950/90 shadow-md">
      {/* Mobile OS Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 text-xs text-slate-400 font-mono border-b border-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">{timeStr || '12:00:00'}</span>
          <span className="text-[10px] text-indigo-400 font-medium hidden xs:inline">{dateStr}</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Recognized Device Badge */}
          {userProfile && (
            <button
              onClick={onOpenDeviceModal}
              className="flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-850 px-2 py-0.5 rounded border border-slate-700/60 text-slate-300 transition cursor-pointer"
              title="Haz clic para ver o editar tu celular y nombre"
            >
              <Smartphone className="w-3 h-3 text-indigo-400" />
              <span className="font-bold text-indigo-300">{userProfile.userName || 'Usuario'}</span>
              <span className="hidden sm:inline text-slate-500">• {userProfile.deviceBrand} {userProfile.deviceModel}</span>
            </button>
          )}

          {isRecording && (
            <span className="flex items-center text-red-400 animate-pulse font-medium text-[11px] bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-ping"></span>
              SOPHIA ESCUCHANDO
            </span>
          )}
          {failoverOccurred && (
            <span className="text-amber-400 text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
              FAILOVER ACTIVO
            </span>
          )}
          <Signal className="w-3.5 h-3.5" />
          <Wifi className="w-3.5 h-3.5" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px]">{userProfile?.batteryLevel || 99}%</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main App Title Header */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-400/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {isRecording && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-950 animate-bounce"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                SophIA
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/15 text-cyan-300 border border-blue-400/40">
                AI Studio Suite • Blue Sapphire
              </span>
            </div>
            <p className="text-xs text-blue-200/70 mt-0.5">
              Noticias en Vivo • Bluetooth & Sonido • Domótica IoT • Celular • Multi-IA
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* API Keys Manager Button */}
          {onOpenApiKeys && (
            <button
              onClick={onOpenApiKeys}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/50 text-cyan-200 transition shadow-sm shadow-indigo-950/50 cursor-pointer"
              title="Abrir Panel de Claves de API de IA (OpenAI, Claude, DeepSeek, OpenRouter, Gemini)"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Claves de API</span>
              <span className="md:hidden">API Keys</span>
            </button>
          )}

          {/* Daily Brain Evolution (Ley VIII) Button */}
          {onOpenBrainEvolution && (
            <button
              onClick={onOpenBrainEvolution}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 text-cyan-200 transition shadow-sm shadow-blue-950/50 cursor-pointer"
              title="Abrir Informe de Auto-Actualización y Enriquecimiento Diario del Cerebro (Ley VIII)"
            >
              <Brain className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden md:inline">Actualización Diaria</span>
              <span className="md:hidden">Cerebro</span>
            </button>
          )}

          {/* User Device Profile Button */}
          <button
            onClick={onOpenDeviceModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-blue-700/60 text-blue-100 transition cursor-pointer"
            title="Reconocer celular y personalizar nombre"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{userProfile?.userName ? `Hola, ${userProfile.userName}` : 'Mi Celular'}</span>
          </button>

          <button
            onClick={() => setActiveTab('remote')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeTab === 'remote'
                ? 'bg-blue-600 border-cyan-400 text-white shadow-lg shadow-blue-900/50'
                : 'bg-blue-950/70 hover:bg-blue-900/80 border-blue-500/40 text-blue-200'
            }`}
            title="Abrir Control Remoto Universal TV"
          >
            <Tv className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>Control Remoto TV</span>
          </button>

          <button
            onClick={() => setActiveTab('install')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-950/50 transition-all cursor-pointer border border-blue-400/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar App</span>
            <span className="sm:hidden">App</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center overflow-x-auto px-2 pb-2 scrollbar-none gap-1.5 border-t border-slate-900/80 pt-1.5">
        {/* Quick API Keys Button in Tab Bar */}
        {onOpenApiKeys && (
          <button
            onClick={onOpenApiKeys}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer bg-gradient-to-r from-indigo-950 via-purple-950 to-blue-950 border border-indigo-500/50 text-cyan-200 hover:text-white hover:border-cyan-400 shadow-sm"
            title="Configurar Claves de API de IA"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>🔑 Claves API</span>
          </button>
        )}

        {/* Unified Avatar, Voice & Simulator Tab */}
        <button
          onClick={() => setActiveTab('avatar')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'avatar' || activeTab === 'recorder' || activeTab === 'simulator'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-950/60 border border-cyan-400/50 ring-1 ring-cyan-400/30'
              : 'text-cyan-300 hover:text-white bg-blue-950/50 hover:bg-blue-900/70 border border-blue-500/40'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          <Mic className="w-3 h-3 text-cyan-400" />
          <span>🌟 Avatar, Voz & LipSync (UE 5.4+)</span>
        </button>

        {/* AI Studio Development Environment Tab */}
        <button
          onClick={() => setActiveTab('aistudio')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'aistudio'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-950/60 border border-cyan-400/60 ring-1 ring-cyan-400/40'
              : 'text-cyan-200 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/50 shadow-sm'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          <span>🛠️ Entorno de Desarrollo AI Studio</span>
        </button>

        {/* Real-time Agenda & Reminders Tab */}
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'agenda'
              ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md shadow-blue-900/50 font-extrabold border border-blue-400/40'
              : 'text-blue-200 hover:text-white bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/30'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Agenda & Recordatorios</span>
        </button>

        {/* Live News Tab */}
        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'news'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/50 font-extrabold border border-cyan-400/40'
              : 'text-cyan-300 hover:text-white bg-blue-950/40 hover:bg-blue-900/60 border border-cyan-500/30'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>Noticias Google Search</span>
        </button>

        <button
          onClick={() => setActiveTab('remote')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'remote'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50 font-extrabold border border-cyan-400/40'
              : 'text-blue-200 hover:text-white bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30'
          }`}
        >
          <Tv className="w-3.5 h-3.5 text-cyan-400" />
          <span>Control Remoto TV</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'studio'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/50 font-extrabold border border-cyan-400/40'
              : 'text-blue-200 hover:text-white bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nano Banana & Veo (Crear)</span>
        </button>

        <button
          onClick={() => setActiveTab('bluetooth')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'bluetooth'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold border border-blue-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sonido, TVs & BT</span>
        </button>

        <button
          onClick={() => setActiveTab('smarthome')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'smarthome'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40 font-semibold border border-teal-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Home className="w-3.5 h-3.5 text-teal-400" />
          <span>Domótica IoT</span>
        </button>

        <button
          onClick={() => setActiveTab('phone')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'phone'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-semibold border border-indigo-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Gestor Celular</span>
        </button>

        <button
          onClick={() => setActiveTab('creations')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'creations'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold border border-blue-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Layout className="w-3.5 h-3.5 text-cyan-300" />
          <span>Creaciones</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'resources'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40 font-semibold border border-teal-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          <span>Recursos</span>
        </button>

        <button
          onClick={() => setActiveTab('aistudio')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'aistudio'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-semibold border border-indigo-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-300" />
          <span>AI Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'models'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold border border-blue-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Modelos</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'database'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-semibold border border-indigo-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-cyan-300" />
          <span>Cerebro Firebase</span>
        </button>

        <button
          onClick={() => setActiveTab('install')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'install'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold border border-blue-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Descargar App</span>
        </button>

        <button
          onClick={() => setActiveTab('deploy')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'deploy'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold border border-blue-400/40'
              : 'text-blue-200/70 hover:text-white hover:bg-blue-950/60'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cloud Run</span>
        </button>
      </div>
    </div>
  );
};
