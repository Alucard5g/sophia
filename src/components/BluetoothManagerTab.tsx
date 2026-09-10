import React, { useState, useEffect } from 'react';
import { BluetoothDevice } from '../types';
import {
  Bluetooth,
  Speaker,
  Tv,
  Headphones,
  Volume2,
  VolumeX,
  Power,
  Play,
  Pause,
  Sliders,
  Radio,
  RefreshCw,
  Sparkles,
  Zap,
  Mic,
  Disc,
  Flame,
  CheckCircle2,
  Share2,
  Activity,
  Cast,
  Layers,
  Plus,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Home,
  Menu,
  RotateCcw,
  ExternalLink,
  Music,
  Waves
} from 'lucide-react';
import {
  scanRealBluetoothDevice,
  sendUniversalRemoteSignal,
  UNIVERSAL_TV_BRANDS,
  SMART_TV_APPS,
  WebAudioEngine
} from '../lib/webHardwareSync';

interface BluetoothManagerTabProps {
  onSendVoiceCommand?: (command: string) => void;
}

const LOCAL_STORAGE_DEVICES_KEY = 'sophia_bluetooth_devices_v2';

export const BluetoothManagerTab: React.FC<BluetoothManagerTabProps> = ({ onSendVoiceCommand }) => {
  const [devices, setDevices] = useState<BluetoothDevice[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DEVICES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'sound' | 'tv' | 'headphones' | 'soundlab'>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Universal Remote State
  const [showTvRemote, setShowTvRemote] = useState(false);
  const [selectedTv, setSelectedTv] = useState<BluetoothDevice | null>(null);
  const [selectedTvBrand, setSelectedTvBrand] = useState('samsung');
  const [activeChannel, setActiveChannel] = useState(5);
  const [tvPowerState, setTvPowerState] = useState(true);
  const [tvVolumeState, setTvVolumeState] = useState(65);
  const [tvMuteState, setTvMuteState] = useState(false);
  const [tvInputState, setTvInputState] = useState('hdmi1');
  const [irPulseActive, setIrPulseActive] = useState(false);
  const [lastRemoteSignalInfo, setLastRemoteSignalInfo] = useState<string | null>(null);

  // Manual Device Modal
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceBrand, setNewDeviceBrand] = useState('Samsung');
  const [newDeviceCategory, setNewDeviceCategory] = useState<'tv' | 'sound_system' | 'soundbar' | 'headphones'>('tv');

  // Persist devices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DEVICES_KEY, JSON.stringify(devices));
    } catch (e) {}
  }, [devices]);

  const openTvRemote = (device?: BluetoothDevice) => {
    if (device) {
      setSelectedTv(device);
      setTvPowerState(device.power);
      setTvVolumeState(device.volume);
      setTvMuteState(device.muted);
      if (device.sourceInput) setTvInputState(device.sourceInput);
      const detected = UNIVERSAL_TV_BRANDS.find(b => 
        device.name.toLowerCase().includes(b.id) || device.brand.toLowerCase().includes(b.id)
      );
      if (detected) setSelectedTvBrand(detected.id);
    } else {
      setSelectedTv(null);
    }
    setShowTvRemote(true);
  };

  const handleRemoteAction = async (action: string, payload?: any) => {
    setIrPulseActive(true);
    setTimeout(() => setIrPulseActive(false), 350);

    const signalRes = await sendUniversalRemoteSignal({
      targetBrand: selectedTvBrand,
      command: action as any,
      value: payload
    });

    setLastRemoteSignalInfo(signalRes.message);
    setTimeout(() => setLastRemoteSignalInfo(null), 3000);

    if (action === 'power') {
      const newPower = !tvPowerState;
      setTvPowerState(newPower);
      if (selectedTv) {
        handleDeviceCommand(selectedTv.id, { power: newPower });
        setSelectedTv(prev => prev ? { ...prev, power: newPower } : null);
      }
    } else if (action === 'volume_up') {
      const newVol = Math.min(100, tvVolumeState + 5);
      setTvVolumeState(newVol);
      if (selectedTv) {
        handleDeviceCommand(selectedTv.id, { volume: newVol });
        setSelectedTv(prev => prev ? { ...prev, volume: newVol } : null);
      }
    } else if (action === 'volume_down') {
      const newVol = Math.max(0, tvVolumeState - 5);
      setTvVolumeState(newVol);
      if (selectedTv) {
        handleDeviceCommand(selectedTv.id, { volume: newVol });
        setSelectedTv(prev => prev ? { ...prev, volume: newVol } : null);
      }
    } else if (action === 'mute') {
      const newMute = !tvMuteState;
      setTvMuteState(newMute);
      if (selectedTv) {
        handleDeviceCommand(selectedTv.id, { muted: newMute });
        setSelectedTv(prev => prev ? { ...prev, muted: newMute } : null);
      }
    } else if (action === 'ch_up') {
      setActiveChannel(prev => prev + 1);
    } else if (action === 'ch_down') {
      setActiveChannel(prev => Math.max(1, prev - 1));
    } else if (action === 'number') {
      const num = parseInt(payload, 10) || 1;
      setActiveChannel(num);
    } else if (action === 'app') {
      const appName = payload;
      setTvPowerState(true);
      setTvInputState('hdmi1');
      if (selectedTv) {
        handleDeviceCommand(selectedTv.id, {
          power: true,
          sourceInput: 'hdmi1',
          mediaTitle: `${appName} 4K HDR`,
          isPlaying: true
        });
      }
    } else if (action === 'input_hdmi1' || action === 'input_hdmi2' || action === 'input_tv') {
      const inputCode = action === 'input_hdmi1' ? 'hdmi1' : action === 'input_hdmi2' ? 'hdmi2' : 'tv_arc';
      setTvInputState(inputCode);
      if (selectedTv) {
        handleDeviceCommand(selectedTv.id, { sourceInput: inputCode });
      }
    }
  };

  // Fetch initial Bluetooth devices from server
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bluetooth/devices');
      const data = await res.json();
      if (data.devices && data.devices.length > 0) {
        // Merge with locally stored devices
        setDevices(prev => {
          const map = new Map<string, BluetoothDevice>();
          prev.forEach(d => map.set(d.id, d));
          data.devices.forEach((d: BluetoothDevice) => map.set(d.id, d));
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Backend fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setStatusMessage('Buscando dispositivos Bluetooth 5.3 BLE en tu área...');
    try {
      const res = await fetch('/api/bluetooth/scan', { method: 'POST' });
      const data = await res.json();
      if (data.devices) {
        setDevices(prev => {
          const map = new Map<string, BluetoothDevice>();
          prev.forEach(d => map.set(d.id, d));
          data.devices.forEach((d: BluetoothDevice) => map.set(d.id, d));
          return Array.from(map.values());
        });
        setStatusMessage('¡Dispositivos detectados y sincronizados!');
      }
    } catch (err) {
      console.warn(err);
      setStatusMessage('Escaneo concluido.');
    } finally {
      setScanning(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleToggleConnect = async (id: string, currentConnected: boolean) => {
    const nextState = !currentConnected;
    setDevices(prev => prev.map(d => d.id === id ? { ...d, connected: nextState, power: nextState ? true : d.power } : d));
    if (nextState) {
      WebAudioEngine.playConnectChime();
      setStatusMessage('Dispositivo conectado exitosamente vía Bluetooth');
    } else {
      setStatusMessage('Dispositivo desconectado');
    }
    setTimeout(() => setStatusMessage(null), 3000);

    fetch('/api/bluetooth/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, connected: nextState })
    }).catch(() => {});
  };

  const handleDeviceCommand = async (
    id: string,
    updates: Partial<BluetoothDevice> & { isPlaying?: boolean; mediaTitle?: string }
  ) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, ...updates };
        if (updates.isPlaying !== undefined && updated.currentMedia) {
          updated.currentMedia = { ...updated.currentMedia, isPlaying: updates.isPlaying };
        }
        if (updates.mediaTitle && updated.currentMedia) {
          updated.currentMedia = { ...updated.currentMedia, title: updates.mediaTitle };
        }
        return updated;
      }
      return d;
    }));

    fetch('/api/bluetooth/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    }).catch(() => {});
  };

  const handleAddManualDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    const newDev: BluetoothDevice = {
      id: `dev-manual-${Date.now()}`,
      name: newDeviceName.trim(),
      brand: newDeviceBrand,
      category: newDeviceCategory,
      connected: true,
      power: true,
      volume: 75,
      muted: false,
      sourceInput: newDeviceCategory === 'tv' ? 'hdmi1' : 'bluetooth',
      equalizerMode: 'standard',
      supportedFeatures: ['Bluetooth 5.3', 'Control Remoto Universal', 'Web Audio Sync', 'Comandos de Voz'],
      currentMedia: {
        title: newDeviceCategory === 'tv' ? 'Smart TV 4K HDR Listo' : 'Audio en Espera',
        artist: newDeviceBrand,
        isPlaying: false
      }
    };

    setDevices(prev => [newDev, ...prev]);
    WebAudioEngine.playConnectChime();
    setStatusMessage(`¡${newDev.name} registrado y enlazado a SophIA!`);
    setShowAddDeviceModal(false);
    setNewDeviceName('');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const filteredDevices = devices.filter(d => {
    if (activeTab === 'all') return true;
    if (activeTab === 'sound') return d.category === 'sound_system' || d.category === 'soundbar';
    if (activeTab === 'tv') return d.category === 'tv' || d.category === 'smart_gadget';
    if (activeTab === 'headphones') return d.category === 'headphones';
    return true;
  });

  const getDeviceIcon = (category: string) => {
    switch (category) {
      case 'tv':
        return <Tv className="w-5 h-5 text-indigo-400" />;
      case 'headphones':
        return <Headphones className="w-5 h-5 text-cyan-400" />;
      case 'soundbar':
        return <Radio className="w-5 h-5 text-rose-400" />;
      default:
        return <Speaker className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-12 animate-fadeIn">
      {/* Top Banner with Direct Action Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-purple-950/40 border border-indigo-500/25 p-5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Bluetooth className="w-6 h-6 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Centro de Sonido, TV & Bluetooth</h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Online • Web Audio & IR
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Control Remoto Universal para cualquier TV, emparejamiento Bluetooth nativo y laboratorio acústico de sonido.
              </p>
            </div>
          </div>

          {/* Core Master Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openTvRemote()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer"
            >
              <Tv className="w-4 h-4" />
              <span>Control Remoto Universal</span>
            </button>

            <button
              onClick={async () => {
                setStatusMessage('Abriendo detector Web Bluetooth nativo...');
                try {
                  const realDev = await scanRealBluetoothDevice();
                  if (realDev) {
                    const newEntry: BluetoothDevice = {
                      id: realDev.id,
                      name: realDev.name,
                      category: realDev.name.toLowerCase().includes('tv') ? 'tv' : (realDev.name.toLowerCase().includes('head') || realDev.name.toLowerCase().includes('airpod') ? 'headphones' : 'sound_system'),
                      brand: realDev.brand,
                      connected: true,
                      power: true,
                      volume: 80,
                      muted: false,
                      sourceInput: 'bluetooth',
                      equalizerMode: 'standard',
                      supportedFeatures: realDev.supportedProtocols,
                      currentMedia: {
                        title: 'Dispositivo Sincronizado',
                        artist: realDev.brand,
                        isPlaying: false
                      }
                    };
                    setDevices(prev => [newEntry, ...prev.filter(d => d.id !== newEntry.id)]);
                    setStatusMessage(`¡${realDev.name} sincronizado con éxito!`);
                  }
                } catch (err: any) {
                  setStatusMessage(err.message || 'Escaneo cancelado o Web Bluetooth restringido en este navegador.');
                }
                setTimeout(() => setStatusMessage(null), 4500);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 cursor-pointer"
              title="Detectar dispositivo Bluetooth real mediante la API del navegador"
            >
              <Cast className="w-4 h-4 animate-pulse" />
              <span>Emparejar BT Real</span>
            </button>

            <button
              onClick={() => setShowAddDeviceModal(true)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Registrar TV, altavoz o audífonos manualmente"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Añadir Dispositivo</span>
            </button>
          </div>
        </div>

        {/* Live Feedback Notification */}
        {statusMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-indigo-950/90 border border-indigo-500/50 text-xs text-indigo-200 flex items-center gap-2 animate-fadeIn shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Voice Quick Commands Carousel */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
            <Mic className="w-3 h-3 text-rose-400" /> Dictar a SophIA:
          </span>
          {[
            'SophIA, sube el volumen del equipo de sonido al 80%',
            'SophIA, enciende la TV y pon Netflix en 4K',
            'SophIA, activa el modo bajos Mega Bass',
            'SophIA, abre YouTube en la TV',
            'SophIA, conecta los audífonos bluetooth'
          ].map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (onSendVoiceCommand) onSendVoiceCommand(cmd);
              }}
              className="shrink-0 px-3 py-1 rounded-lg bg-slate-950/80 hover:bg-indigo-900/50 border border-slate-800 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 shrink-0">
          {[
            { id: 'all', label: 'Todos', count: devices.length },
            { id: 'sound', label: 'Equipos & Barras', count: devices.filter(d => d.category === 'sound_system' || d.category === 'soundbar').length },
            { id: 'tv', label: 'Smart TVs', count: devices.filter(d => d.category === 'tv' || d.category === 'smart_gadget').length },
            { id: 'headphones', label: 'Audífonos', count: devices.filter(d => d.category === 'headphones').length },
            { id: 'soundlab', label: '🔊 Laboratorio de Sonido', count: 'Pro' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono text-slate-300">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Buscando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* VIEW: Laboratorio de Sonido & Acústica */}
      {activeTab === 'soundlab' && (
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 space-y-6 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Laboratorio Acústico y Frecuencias Web Audio</h3>
              <p className="text-xs text-slate-400">
                Generador de ondas físicas reales, refuerzo de sub-graves Mega Bass y prueba espacial 3D estéreo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mega Bass Test */}
            <div className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Mega Bass Sub-Woofer
                </span>
                <span className="text-[10px] font-mono text-slate-500">55Hz - 110Hz</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dispara una onda senoidal de subgraves con filtro pasa-bajos resonante para probar bocinas y subwoofers.
              </p>
              <button
                onClick={() => {
                  WebAudioEngine.playBassBoostTest();
                  setStatusMessage('Reproduciendo prueba acústica Mega Bass...');
                  setTimeout(() => setStatusMessage(null), 2500);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5" /> Disparar Mega Bass
              </button>
            </div>

            {/* Spatial 3D Stereo Test */}
            <div className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4" /> Estéreo & Espacial 3D
                </span>
                <span className="text-[10px] font-mono text-slate-500">L / R / C</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Prueba de balance estéreo con barrido acústico panorámico de izquierda a derecha y centro.
              </p>
              <button
                onClick={() => {
                  WebAudioEngine.playSpatialAudioTest();
                  setStatusMessage('Ejecutando prueba estéreo L/R/Centro...');
                  setTimeout(() => setStatusMessage(null), 2500);
                }}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5" /> Probar Canales L/R
              </button>
            </div>

            {/* Tone Generator */}
            <div className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Music className="w-4 h-4" /> Generador de Tonos
                </span>
                <span className="text-[10px] font-mono text-slate-500">Hz Puro</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Selecciona frecuencias puras calibradas para testear la respuesta de tus altavoces.
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '60 Hz', f: 60 },
                  { label: '440 Hz', f: 440 },
                  { label: '1 kHz', f: 1000 },
                  { label: '2.5 kHz', f: 2500 },
                  { label: '5 kHz', f: 5000 },
                  { label: '8 kHz', f: 8000 }
                ].map(t => (
                  <button
                    key={t.f}
                    onClick={() => WebAudioEngine.playTone(t.f, 'sine', 0.5)}
                    className="py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-[10px] font-mono font-bold text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Devices Grid */}
      {activeTab !== 'soundlab' && (
        <>
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-2" />
              <p className="text-sm">Cargando dispositivos vinculados...</p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="py-12 px-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bluetooth className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-white">No hay dispositivos en esta categoría</h3>
                <p className="text-xs text-slate-400">
                  Puedes abrir el <strong className="text-purple-400">Control Remoto Universal</strong> directamente, o registrar tus Smart TVs y equipos de sonido.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => openTvRemote()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-purple-900/40"
                >
                  <Tv className="w-4 h-4" /> Abrir Control Remoto Universal
                </button>
                <button
                  onClick={() => setShowAddDeviceModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <Plus className="w-4 h-4 text-emerald-400" /> Añadir Dispositivo
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDevices.map(device => {
                const isPlaying = device.currentMedia?.isPlaying ?? false;

                return (
                  <div
                    key={device.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      device.connected
                        ? 'bg-slate-900/90 border-indigo-500/30 shadow-lg shadow-indigo-950/20'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Top Row: Icon + Title + Connect/Power Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                          device.connected ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          {getDeviceIcon(device.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-white tracking-tight">{device.name}</h3>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-medium">{device.brand}</span>
                            {device.batteryLevel !== undefined && (
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                🔋 {device.batteryLevel}%
                              </span>
                            )}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              device.connected ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {device.connected ? 'Conectado' : 'Desconectado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Power Toggle */}
                        <button
                          onClick={() => handleDeviceCommand(device.id, { power: !device.power })}
                          title={device.power ? 'Apagar' : 'Encender'}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            device.power
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        {/* BT Connect Button */}
                        <button
                          onClick={() => handleToggleConnect(device.id, device.connected)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                            device.connected
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow'
                          }`}
                        >
                          {device.connected ? 'Desvincular' : 'Conectar'}
                        </button>
                      </div>
                    </div>

                    {/* Media Playback Info (if connected) */}
                    {device.connected && device.currentMedia && (
                      <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                            <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{device.currentMedia.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {device.currentMedia.artist || device.currentMedia.app || 'Reproducción Bluetooth'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleDeviceCommand(device.id, { isPlaying: !isPlaying })}
                            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                            title={isPlaying ? 'Pausar' : 'Reproducir'}
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Volume & Audio Controls (if connected) */}
                    {device.connected && (
                      <div className="mt-4 space-y-3">
                        {/* Volume Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                              Volumen Master
                            </span>
                            <span className="font-mono font-bold text-indigo-300">{device.volume}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={device.volume}
                            onChange={e => handleDeviceCommand(device.id, { volume: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        {/* Equalizer & Source Inputs */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {device.equalizerMode && (
                            <div>
                              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                                Ecualizador
                              </label>
                              <select
                                value={device.equalizerMode}
                                onChange={e => handleDeviceCommand(device.id, { equalizerMode: e.target.value as any })}
                                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                              >
                                <option value="standard">Estándar Flat</option>
                                <option value="bass_boost">🔥 Mega Bass (Graves)</option>
                                <option value="cinema">🍿 Cine Envolvente</option>
                                <option value="vocal">🎙️ Voces Claras</option>
                                <option value="night">🌙 Modo Noche</option>
                              </select>
                            </div>
                          )}

                          {device.sourceInput && (
                            <div>
                              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                                Entrada de Señal
                              </label>
                              <select
                                value={device.sourceInput}
                                onChange={e => handleDeviceCommand(device.id, { sourceInput: e.target.value as any })}
                                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                              >
                                <option value="bluetooth">Bluetooth 5.3</option>
                                <option value="hdmi1">HDMI 1</option>
                                <option value="hdmi2">HDMI 2</option>
                                <option value="tv_arc">HDMI eARC TV</option>
                                <option value="optical">Óptico Digital</option>
                                <option value="aux">AUX 3.5mm</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Quick Action Chips */}
                        {device.category === 'tv' && (
                          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                            <button
                              onClick={() => openTvRemote(device)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-purple-900/40"
                            >
                              <Tv className="w-3.5 h-3.5" /> Control Remoto TV
                            </button>
                            <button
                              onClick={() => handleDeviceCommand(device.id, { mediaTitle: 'Netflix 4K HDR', isPlaying: true, sourceInput: 'hdmi1' })}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-[10px] font-semibold text-rose-300 transition-all cursor-pointer"
                            >
                              🎬 Netflix
                            </button>
                            <button
                              onClick={() => handleDeviceCommand(device.id, { mediaTitle: 'YouTube 4K', isPlaying: true })}
                              className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-[10px] font-semibold text-red-300 transition-all cursor-pointer"
                            >
                              📺 YouTube
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Universal Smart TV Remote Control Modal */}
      {showTvRemote && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-scaleUp my-auto">
            {/* Remote Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
                  <Tv className="w-5 h-5" />
                  {irPulseActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedTv ? selectedTv.name : 'Control Remoto Universal'}
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Emisor IR 38kHz / IP Network 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTvRemote(false)}
                className="p-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Signal feedback toast */}
            {lastRemoteSignalInfo && (
              <div className="p-2 rounded-xl bg-purple-950/90 border border-purple-500/40 text-[11px] text-purple-200 text-center animate-fadeIn">
                {lastRemoteSignalInfo}
              </div>
            )}

            {/* TV Brand / Protocol Selector */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">Marca TV:</span>
              <select
                value={selectedTvBrand}
                onChange={e => setSelectedTvBrand(e.target.value)}
                className="w-full bg-slate-900 text-purple-200 text-xs font-semibold rounded-lg px-2 py-1.5 border border-purple-500/30 focus:outline-none cursor-pointer"
              >
                {UNIVERSAL_TV_BRANDS.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Power, Mute & Input Row */}
            <div className="flex items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <button
                onClick={() => handleRemoteAction('power')}
                className={`p-3 rounded-2xl border font-semibold flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  tvPowerState
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 border-rose-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Encender / Apagar TV"
              >
                <Power className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleRemoteAction('mute')}
                className={`p-3 rounded-2xl border font-semibold flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  tvMuteState
                    ? 'bg-amber-500 text-white border-amber-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Silenciar"
              >
                {tvMuteState ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRemoteAction('input_hdmi1')}
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                    tvInputState === 'hdmi1'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  HDMI 1
                </button>
                <button
                  onClick={() => handleRemoteAction('input_hdmi2')}
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                    tvInputState === 'hdmi2'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  HDMI 2
                </button>
              </div>
            </div>

            {/* D-PAD Navigation Controller */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Navegación Smart TV</span>
              
              <div className="relative w-44 h-44 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                {/* UP */}
                <button
                  onClick={() => handleRemoteAction('dpad_up')}
                  className="absolute top-2 w-10 h-10 rounded-full bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="Arriba"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                {/* DOWN */}
                <button
                  onClick={() => handleRemoteAction('dpad_down')}
                  className="absolute bottom-2 w-10 h-10 rounded-full bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="Abajo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* LEFT */}
                <button
                  onClick={() => handleRemoteAction('dpad_left')}
                  className="absolute left-2 w-10 h-10 rounded-full bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="Izquierda"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* RIGHT */}
                <button
                  onClick={() => handleRemoteAction('dpad_right')}
                  className="absolute right-2 w-10 h-10 rounded-full bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="Derecha"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* CENTER OK */}
                <button
                  onClick={() => handleRemoteAction('dpad_ok')}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center shadow-lg shadow-purple-950/50 cursor-pointer active:scale-95"
                >
                  OK
                </button>
              </div>

              {/* Home & Back row */}
              <div className="flex items-center gap-3 w-full justify-around pt-1">
                <button
                  onClick={() => handleRemoteAction('back')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Volver
                </button>
                <button
                  onClick={() => handleRemoteAction('home')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Home className="w-3.5 h-3.5 text-indigo-400" /> Inicio
                </button>
                <button
                  onClick={() => handleRemoteAction('menu')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Menu className="w-3.5 h-3.5 text-purple-400" /> Menú
                </button>
              </div>
            </div>

            {/* Volume & Channel Rockers */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              {/* Volume */}
              <div className="flex flex-col items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Volumen</span>
                <button
                  onClick={() => handleRemoteAction('volume_up')}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-purple-600 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
                >
                  +
                </button>
                <span className="text-xs font-mono font-bold text-purple-300">{tvVolumeState}%</span>
                <button
                  onClick={() => handleRemoteAction('volume_down')}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-purple-600 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
                >
                  -
                </button>
              </div>

              {/* Channel */}
              <div className="flex flex-col items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Canal CH</span>
                <button
                  onClick={() => handleRemoteAction('ch_up')}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-purple-600 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
                >
                  ▲
                </button>
                <span className="text-xs font-mono font-bold text-emerald-400">CH {activeChannel < 10 ? `0${activeChannel}` : activeChannel}</span>
                <button
                  onClick={() => handleRemoteAction('ch_down')}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-purple-600 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
                >
                  ▼
                </button>
              </div>
            </div>

            {/* Numeric Keypad */}
            <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Teclado Numérico Directo:</span>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                  <button
                    key={num}
                    onClick={() => handleRemoteAction('number', num)}
                    className="py-1.5 rounded-lg bg-slate-900 hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer border border-slate-800 active:scale-90"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Streaming Apps Launcher */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Lanzadores de Streaming:</span>
              <div className="grid grid-cols-3 gap-2">
                {SMART_TV_APPS.map(app => (
                  <button
                    key={app.id}
                    onClick={() => handleRemoteAction('app', app.name)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow active:scale-95 ${app.color} hover:opacity-90 flex items-center justify-center gap-1`}
                  >
                    <span>{app.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Device Registration Modal */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Registrar Dispositivo Manual</h3>
              </div>
              <button
                onClick={() => setShowAddDeviceModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualDevice} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Nombre del Dispositivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Smart TV Sala, Soundbar JBL, Sony WH-1000XM5"
                  value={newDeviceName}
                  onChange={e => setNewDeviceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Categoría</label>
                  <select
                    value={newDeviceCategory}
                    onChange={e => setNewDeviceCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="tv">Smart TV / Pantalla</option>
                    <option value="sound_system">Equipo de Sonido Hi-Fi</option>
                    <option value="soundbar">Barra de Sonido</option>
                    <option value="headphones">Audífonos</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Marca</label>
                  <select
                    value={newDeviceBrand}
                    onChange={e => setNewDeviceBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Samsung">Samsung</option>
                    <option value="LG">LG</option>
                    <option value="Sony">Sony</option>
                    <option value="JBL">JBL</option>
                    <option value="Bose">Bose</option>
                    <option value="TCL">TCL Roku</option>
                    <option value="Hisense">Hisense</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Philips">Philips</option>
                    <option value="Apple">Apple</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 cursor-pointer"
                >
                  Guardar & Conectar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

