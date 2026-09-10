import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Power,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  Cast,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Home,
  Menu,
  Sparkles,
  Smartphone,
  Zap,
  Activity,
  Play,
  Pause,
  Film,
  Search,
  Sliders,
  Copy,
  Check,
  RefreshCw,
  Volume1,
  Mic,
  MicOff,
  Layers,
  Clock,
  ExternalLink,
  ChevronRight,
  Terminal,
  AlertTriangle,
  Info,
  CheckCircle2,
  Share2,
  Settings,
  Square,
  Rewind,
  FastForward,
  Subtitles,
  HelpCircle,
  Hash,
  Bluetooth,
  Monitor,
  Video,
  Music,
  Globe
} from 'lucide-react';
import {
  UNIVERSAL_TV_BRANDS,
  SMART_TV_APPS,
  sendUniversalRemoteSignal,
  scanLocalSmartTvs,
  pingTvDevice,
  pairBluetoothSmartTvRemote,
  WebAudioEngine
} from '../lib/webHardwareSync';
import { speakSmoothSophia } from '../lib/smoothSpeech';

interface UniversalTvRemoteViewProps {
  onSendVoiceCommand?: (cmd: string) => void;
  defaultBrand?: string;
}

const TV_CHANNELS = [
  { num: 1, name: '🌐 Noticias 24/7 Global', show: 'Edición Estelar • En Vivo', genre: 'Información', logoColor: 'bg-blue-600' },
  { num: 2, name: '🎬 Cine 4K CinemaScope', show: 'Interestelar (2026 Remaster)', genre: 'Ciencia Ficción', logoColor: 'bg-rose-600' },
  { num: 3, name: '🎵 MTV & Spotify Hits', show: 'Top 50 Éxitos Globales', genre: 'Música', logoColor: 'bg-purple-600' },
  { num: 4, name: '⚽ Deportes Max 4K', show: 'Champions League • Directo', genre: 'Deportes', logoColor: 'bg-emerald-600' },
  { num: 5, name: '🌿 Planeta Salvaje 8K', show: 'Secretos de los Océanos', genre: 'Documental', logoColor: 'bg-amber-600' },
  { num: 6, name: '📺 YouTube 4K Stream', show: 'SophIA AI Studio Tutorial', genre: 'Tecnología', logoColor: 'bg-red-600' },
  { num: 7, name: ' Riviera Smart Hub', show: 'Menú Interactivo & Apps', genre: 'Smart TV', logoColor: 'bg-indigo-600' }
];

export const UniversalTvRemoteView: React.FC<UniversalTvRemoteViewProps> = ({
  onSendVoiceCommand,
  defaultBrand = 'riviera'
}) => {
  // Active selected TV brand and configuration
  const [selectedBrand, setSelectedBrand] = useState<string>(defaultBrand);
  const [tvIpAddress, setTvIpAddress] = useState<string>('192.168.1.105');
  const [tvPort, setTvPort] = useState<string>('8060');
  const [tvName, setTvName] = useState<string>('Riviera Android TV 4K Ultra HD');
  const [tvProtocol, setTvProtocol] = useState<string>('NEC IR 38kHz / Roku ECP :8060 / Android TV IP');
  
  // TV Screen & State
  const [isTvPowerOn, setIsTvPowerOn] = useState<boolean>(true);
  const [tvVolume, setTvVolume] = useState<number>(32);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeInput, setActiveInput] = useState<string>('HDMI 1');
  const [currentChannel, setCurrentChannel] = useState<number>(7);
  const [activeTvApp, setActiveTvApp] = useState<string | null>(null);
  const [lastTransmittedCode, setLastTransmittedCode] = useState<string | null>(null);
  
  // OSD (On-Screen Display) banner indicators
  const [showVolumeOsd, setShowVolumeOsd] = useState<boolean>(false);
  const [showChannelOsd, setShowChannelOsd] = useState<boolean>(false);
  const [showInputOsd, setShowInputOsd] = useState<boolean>(false);
  const [osdMessage, setOsdMessage] = useState<string | null>(null);

  const volumeOsdTimeoutRef = useRef<any>(null);
  const channelOsdTimeoutRef = useRef<any>(null);
  const inputOsdTimeoutRef = useRef<any>(null);

  // Connection and telemetry
  const [isScanningTvs, setIsScanningTvs] = useState<boolean>(false);
  const [discoveredTvs, setDiscoveredTvs] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking' | 'disconnected'>('connected');
  const [pingLatencyMs, setPingLatencyMs] = useState<number>(8);
  const [isBluetoothPaired, setIsBluetoothPaired] = useState<boolean>(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null);

  // Transmission Log
  const [transmissionLogs, setTransmissionLogs] = useState<
    { id: string; timestamp: string; action: string; protocol: string; payload: string; status: 'ok' | 'fail' }[]
  >([]);

  // Voice command state
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Numeric keypad direct input
  const [numericEntry, setNumericEntry] = useState<string>('');

  // Initial setup & discovery
  useEffect(() => {
    handleScanNetworkTvs();
  }, []);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const triggerVolumeOsd = () => {
    setShowVolumeOsd(true);
    if (volumeOsdTimeoutRef.current) clearTimeout(volumeOsdTimeoutRef.current);
    volumeOsdTimeoutRef.current = setTimeout(() => setShowVolumeOsd(false), 2500);
  };

  const triggerChannelOsd = () => {
    setShowChannelOsd(true);
    if (channelOsdTimeoutRef.current) clearTimeout(channelOsdTimeoutRef.current);
    channelOsdTimeoutRef.current = setTimeout(() => setShowChannelOsd(false), 3000);
  };

  const triggerInputOsd = (msg: string) => {
    setOsdMessage(msg);
    setShowInputOsd(true);
    if (inputOsdTimeoutRef.current) clearTimeout(inputOsdTimeoutRef.current);
    inputOsdTimeoutRef.current = setTimeout(() => setShowInputOsd(false), 2800);
  };

  // Scan network for real external Smart TVs
  const handleScanNetworkTvs = async () => {
    setIsScanningTvs(true);
    try {
      const tvs = await scanLocalSmartTvs();
      setDiscoveredTvs(tvs);
      if (tvs.length > 0) {
        const primary = tvs[0];
        setTvIpAddress(primary.ip);
        setTvName(primary.name);
        setConnectionStatus('connected');
      }
    } catch (e) {
      console.warn('Scan TV error:', e);
    } finally {
      setIsScanningTvs(false);
    }
  };

  // Test ping to external TV IP
  const handlePingTv = async () => {
    setConnectionStatus('checking');
    const start = performance.now();
    try {
      const res = await pingTvDevice(tvIpAddress);
      const elapsed = Math.round(performance.now() - start);
      setPingLatencyMs(res.latencyMs || elapsed);
      setConnectionStatus(res.reachable ? 'connected' : 'disconnected');
      showNotification(res.reachable ? `✅ TV Externa responde en ${tvIpAddress} (${elapsed}ms)` : `⚠️ No se obtuvo respuesta en ${tvIpAddress}`);
    } catch (e) {
      setConnectionStatus('disconnected');
    }
  };

  // Pair Web Bluetooth Remote Dongle / TV
  const handlePairBluetooth = async () => {
    try {
      const paired = await pairBluetoothSmartTvRemote();
      if (paired) {
        setIsBluetoothPaired(true);
        setBluetoothDeviceName(paired.name || 'Control Remoto BLE Riviera');
        showNotification(`✅ Emparejado vía Web Bluetooth: ${paired.name || 'Smart TV BLE'}`);
        speakSmoothSophia('Control remoto emparejado por Bluetooth con tu televisor externo.');
      }
    } catch (e: any) {
      showNotification(`ℹ️ Bluetooth: ${e.message || 'Cancelado por el usuario'}`);
    }
  };

  // Send universal command to physical external Smart TV and live TV simulator
  const sendTvCommand = async (
    commandKey: string,
    paramValue?: any,
    label: string = commandKey
  ) => {
    // 1. Play tactile vibration & sound
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(20); } catch(e) {}
    }
    WebAudioEngine.playRemoteBeep();

    // 2. State updates on virtual TV Screen and remote state
    if (commandKey === 'power') {
      setIsTvPowerOn(prev => !prev);
      triggerInputOsd(isTvPowerOn ? 'Televisor Apagado' : 'Encendiendo Riviera 4K Smart TV...');
    } else if (commandKey === 'mute') {
      setIsMuted(prev => !prev);
      triggerVolumeOsd();
    } else if (commandKey === 'vol_up') {
      setTvVolume(prev => Math.min(100, prev + 2));
      setIsMuted(false);
      triggerVolumeOsd();
    } else if (commandKey === 'vol_down') {
      setTvVolume(prev => Math.max(0, prev - 2));
      setIsMuted(false);
      triggerVolumeOsd();
    } else if (commandKey === 'ch_up') {
      setCurrentChannel(prev => (prev >= 7 ? 1 : prev + 1));
      setActiveTvApp(null);
      triggerChannelOsd();
    } else if (commandKey === 'ch_down') {
      setCurrentChannel(prev => (prev <= 1 ? 7 : prev - 1));
      setActiveTvApp(null);
      triggerChannelOsd();
    } else if (commandKey.startsWith('input_')) {
      const inputName = commandKey.replace('input_', '').toUpperCase();
      setActiveInput(inputName);
      setActiveTvApp(null);
      triggerInputOsd(`Entrada: ${inputName}`);
    } else if (commandKey === 'home') {
      setActiveTvApp(null);
      setCurrentChannel(7);
      triggerInputOsd('Pantalla Principal Smart Hub');
    } else if (commandKey === 'launch_app') {
      setActiveTvApp(paramValue);
      triggerInputOsd(`Iniciando App: ${String(paramValue).toUpperCase()}`);
    } else if (commandKey === 'number') {
      const numStr = String(paramValue);
      setNumericEntry(prev => (prev.length < 3 ? prev + numStr : numStr));
      const targetNum = parseInt(numStr, 10);
      if (targetNum >= 1 && targetNum <= 7) {
        setCurrentChannel(targetNum);
        setActiveTvApp(null);
        triggerChannelOsd();
      }
    }

    // 3. Dispatch hardware protocol signal via network / audio / BLE
    try {
      const response = await sendUniversalRemoteSignal({
        targetBrand: selectedBrand,
        ipAddress: tvIpAddress,
        command: commandKey as any,
        value: paramValue
      });

      const logEntry = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action: label,
        protocol: tvProtocol,
        payload: response.codeEmitted || `CMD:${commandKey}${paramValue !== undefined ? `=${paramValue}` : ''}`,
        status: response.success ? ('ok' as const) : ('fail' as const)
      };

      setLastTransmittedCode(logEntry.payload);
      setTransmissionLogs(prev => [logEntry, ...prev.slice(0, 15)]);
      showNotification(`📡 Señal emitida: ${label} [${logEntry.payload}]`);
    } catch (e: any) {
      console.warn('Error sending TV command:', e);
      showNotification(`⚠️ Error transmitiendo a ${tvIpAddress}: ${e.message}`);
    }
  };

  // Launch streaming app on external TV
  const handleLaunchExternalApp = (app: typeof SMART_TV_APPS[0]) => {
    sendTvCommand('launch_app', app.id, `Abrir ${app.name}`);
    speakSmoothSophia(`Lanzando ${app.name} en tu televisor Riviera.`, { voiceStyle: 'dulce_afectuosa' });
  };

  // Submit numeric channel
  const handleSubmitChannelNumber = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const ch = parseInt(numericEntry, 10);
    if (!isNaN(ch) && ch > 0) {
      setCurrentChannel(ch > 7 ? 1 : ch);
      setActiveTvApp(null);
      triggerChannelOsd();
      sendTvCommand('channel_direct', ch, `Ir a Canal ${ch}`);
      setNumericEntry('');
    }
  };

  // Execute Voice Command targeted to External TV
  const handleVoiceCommand = (cmd: string) => {
    const lower = cmd.toLowerCase();
    setVoiceTranscript(cmd);

    if (lower.includes('apagar') || lower.includes('apaga')) {
      sendTvCommand('power', false, 'Apagar TV Externa');
      speakSmoothSophia('Apagando televisor externo.');
    } else if (lower.includes('encender') || lower.includes('prende') || lower.includes('enciende')) {
      sendTvCommand('power', true, 'Encender TV Externa');
      speakSmoothSophia('Encendiendo televisor externo.');
    } else if (lower.includes('sube') || lower.includes('subir')) {
      sendTvCommand('vol_up', null, 'Subir Volumen');
      speakSmoothSophia('Subiendo volumen.');
    } else if (lower.includes('baja') || lower.includes('bajar')) {
      sendTvCommand('vol_down', null, 'Bajar Volumen');
      speakSmoothSophia('Bajando volumen.');
    } else if (lower.includes('silencio') || lower.includes('mute')) {
      sendTvCommand('mute', null, 'Silenciar');
      speakSmoothSophia('Televisor en silencio.');
    } else if (lower.includes('youtube')) {
      sendTvCommand('launch_app', 'youtube', 'Abrir YouTube');
      speakSmoothSophia('Abriendo YouTube en tu televisor.');
    } else if (lower.includes('netflix')) {
      sendTvCommand('launch_app', 'netflix', 'Abrir Netflix');
      speakSmoothSophia('Abriendo Netflix en tu televisor.');
    } else if (lower.includes('spotify')) {
      sendTvCommand('launch_app', 'spotify', 'Abrir Spotify');
      speakSmoothSophia('Abriendo Spotify en tu televisor.');
    } else if (lower.includes('hdmi 1') || lower.includes('hdmi1')) {
      sendTvCommand('input_hdmi1', null, 'Cambiar a HDMI 1');
      speakSmoothSophia('Entrada cambiada a HDMI 1.');
    } else if (lower.includes('hdmi 2') || lower.includes('hdmi2')) {
      sendTvCommand('input_hdmi2', null, 'Cambiar a HDMI 2');
      speakSmoothSophia('Entrada cambiada a HDMI 2.');
    } else if (lower.includes('inicio') || lower.includes('home')) {
      sendTvCommand('home', null, 'Inicio Smart TV');
      speakSmoothSophia('Mostrando pantalla principal de la TV.');
    } else {
      sendTvCommand('voice_custom', cmd, `Comando de voz: "${cmd}"`);
      if (onSendVoiceCommand) {
        onSendVoiceCommand(`Control TV: ${cmd}`);
      }
    }
  };

  // Native Speech Recognition for TV voice control
  const toggleVoiceRecognition = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      showNotification('ℹ️ Reconocimiento de voz por micrófono no disponible en este navegador.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningVoice(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
        setIsListeningVoice(false);
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch (e) {
      setIsListeningVoice(false);
    }
  };

  const currentChannelObj = TV_CHANNELS.find(c => c.num === currentChannel) || TV_CHANNELS[0];

  return (
    <div id="universal-tv-remote-view" className="w-full max-w-6xl mx-auto space-y-6 pb-24 text-slate-100">
      {/* HEADER: External TV Connection & Status Hub */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          {/* Left: TV Title & Status */}
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl border ${
              isTvPowerOn 
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-400/40 text-white shadow-lg shadow-purple-950/50' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  Control Remoto Universal Smart TV & Transmisor
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : connectionStatus === 'checking'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30 animate-pulse'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                  {connectionStatus === 'connected' ? `Enlazado (${pingLatencyMs}ms)` : connectionStatus === 'checking' ? 'Comprobando...' : 'Desconectado'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="text-purple-300 font-semibold">{tvName}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-300">{tvIpAddress}:{tvPort}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 text-[11px]">{tvProtocol.split('/')[0]}</span>
              </p>
            </div>
          </div>

          {/* Right: Actions (Scan, Ping, BT Pair) */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleScanNetworkTvs}
              disabled={isScanningTvs}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Escanear Smart TVs en tu red Wi-Fi local"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isScanningTvs ? 'animate-spin' : ''}`} />
              <span>{isScanningTvs ? 'Escaneando...' : 'Escanear Red'}</span>
            </button>

            <button
              onClick={handlePingTv}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Comprobar latencia de conexión"
            >
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span>Probar Ping</span>
            </button>

            <button
              onClick={handlePairBluetooth}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isBluetoothPaired
                  ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Emparejar control remoto vía Web Bluetooth"
            >
              <Bluetooth className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isBluetoothPaired ? bluetoothDeviceName || 'BLE Conectado' : 'Emparejar BLE'}</span>
            </button>
          </div>
        </div>

        {/* Brand & IP Config Drawer */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Marca de Televisor Externo:</label>
            <select
              value={selectedBrand}
              onChange={e => {
                const bId = e.target.value;
                setSelectedBrand(bId);
                const bObj = UNIVERSAL_TV_BRANDS.find(b => b.id === bId);
                if (bObj) {
                  setTvName(bObj.name);
                  setTvProtocol(bObj.protocol);
                  if (bObj.defaultIp) setTvIpAddress(bObj.defaultIp);
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
            >
              {UNIVERSAL_TV_BRANDS.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Dirección IP de la TV:</label>
            <input
              type="text"
              value={tvIpAddress}
              onChange={e => setTvIpAddress(e.target.value)}
              placeholder="192.168.1.105"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Puerto de Control (ECP/REST):</label>
            <input
              type="text"
              value={tvPort}
              onChange={e => setTvPort(e.target.value)}
              placeholder="8060"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Entrada / Input Activo:</label>
            <select
              value={activeInput}
              onChange={e => sendTvCommand(`input_${e.target.value.toLowerCase().replace(' ', '')}`, null, `Entrada ${e.target.value}`)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="HDMI 1">HDMI 1 (Consola / PC)</option>
              <option value="HDMI 2">HDMI 2 (Decodificador / Cable)</option>
              <option value="HDMI 3">HDMI 3 (Streaming Stick / eARC)</option>
              <option value="TV">TV Digital / Antena</option>
              <option value="AV">AV / RCA Componente</option>
              <option value="USB">USB Media Player</option>
            </select>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {statusNotification && (
        <div className="p-3 bg-purple-950/90 border border-purple-500/40 rounded-2xl text-xs font-semibold text-purple-200 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>{statusNotification}</span>
          </div>
          <button onClick={() => setStatusNotification(null)} className="text-purple-400 hover:text-white text-xs cursor-pointer">✕</button>
        </div>
      )}

      {/* 📺 LIVE SMART TV SCREEN SIMULATION STAGE */}
      <div className="bg-slate-950 rounded-3xl p-4 sm:p-6 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Pantalla en Vivo Smart TV Riviera (4K HDR • 60 FPS)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">Entrada: {activeInput}</span>
            <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/30">Dolby Atmos</span>
          </div>
        </div>

        {/* TV Screen Display Glass */}
        <div className="relative w-full h-64 sm:h-80 rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
          {/* Power Off Curtain */}
          {!isTvPowerOn ? (
            <div className="flex flex-col items-center justify-center space-y-2 text-slate-700 select-none animate-fade-in">
              <Power className="w-12 h-12 text-slate-800 animate-pulse" />
              <p className="text-xs font-bold tracking-widest uppercase">Smart TV Apagada (Modo Standby)</p>
              <p className="text-[11px] text-slate-600">Presiona POWER en el control para encender</p>
            </div>
          ) : activeTvApp ? (
            /* App Active View */
            <div className="relative w-full h-full p-6 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-3 shadow-2xl">
                <Play className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">{activeTvApp}</h3>
              <p className="text-xs text-slate-400 mt-1">Reproduciendo contenido en transmisión 4K Ultra HD</p>
              <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-slate-900 rounded-full text-[10px] text-emerald-400 font-bold border border-slate-800">
                  Buffer 100% • HDR10+
                </span>
                <span className="px-3 py-1 bg-slate-900 rounded-full text-[10px] text-indigo-300 font-bold border border-slate-800">
                  Audio Espacial Activo
                </span>
              </div>
            </div>
          ) : (
            /* Channel Broadcast Live View */
            <div className="relative w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950/40 to-black">
              {/* Channel Header Banner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black text-white ${currentChannelObj.logoColor}`}>
                    CH {currentChannelObj.num}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{currentChannelObj.name}</h4>
                    <p className="text-[11px] text-slate-400">{currentChannelObj.show}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-red-600/80 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                  EN VIVO
                </span>
              </div>

              {/* Dynamic Content Visualizer on Screen */}
              <div className="flex flex-col items-center justify-center space-y-2 my-auto">
                <div className="flex items-center gap-2">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-cyan-400 via-purple-400 to-rose-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.sin(i * 0.5 + Date.now() * 0.001) * 16 + 28}px`,
                        animationDuration: `${0.4 + (i % 4) * 0.2}s`
                      }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-purple-300 font-semibold">
                  {currentChannelObj.genre} • Transmisión Digital Riviera 60fps
                </span>
              </div>

              {/* Ticker at bottom */}
              <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                <span>🔴 SophIA Assistant Smart Sync: Activo</span>
                <span>Resolución: 3840x2160 @ 60Hz</span>
              </div>
            </div>
          )}

          {/* OSD Volume Banner Overlay */}
          {showVolumeOsd && isTvPowerOn && (
            <div className="absolute top-4 right-4 bg-slate-950/90 border border-purple-500/50 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in z-20">
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-purple-400" />}
              <div>
                <div className="text-[11px] font-bold text-white flex items-center justify-between gap-4">
                  <span>{isMuted ? 'SILENCIO (MUTE)' : 'VOLUMEN'}</span>
                  <span className="font-mono text-purple-300">{isMuted ? '0%' : `${tvVolume}%`}</span>
                </div>
                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all"
                    style={{ width: isMuted ? '0%' : `${tvVolume}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* OSD Channel Banner Overlay */}
          {showChannelOsd && isTvPowerOn && (
            <div className="absolute top-4 left-4 bg-slate-950/90 border border-emerald-500/50 p-3 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in z-20">
              <span className="text-xs font-bold text-emerald-300">
                Canal {currentChannelObj.num}: {currentChannelObj.name}
              </span>
              <p className="text-[10px] text-slate-400">{currentChannelObj.show}</p>
            </div>
          )}

          {/* OSD Message Notification */}
          {showInputOsd && osdMessage && isTvPowerOn && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-950/95 border border-indigo-500/60 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold text-indigo-100 animate-fade-in z-20">
              {osdMessage}
            </div>
          )}
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTROLLER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: HARDWARE REMOTE CONTROLLER (PHYSICAL MOLD) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-800 rounded-[2.75rem] p-6 shadow-2xl space-y-6 relative ring-1 ring-white/10">
            
            {/* Top IR Emitter Diode Indicator */}
            <div className="flex justify-center -mt-2">
              <div className="w-12 h-2.5 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                <span className={`w-2 h-2 rounded-full ${isTvPowerOn ? 'bg-rose-500 shadow-md shadow-rose-500 animate-pulse' : 'bg-slate-600'}`} />
              </div>
            </div>

            {/* Remote Brand Logo Bar */}
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase font-mono">
                {selectedBrand.toUpperCase()} SMART REMOTE
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-mono text-slate-500">38kHz IR / IP</span>
              </div>
            </div>

            {/* TOP ROW: POWER / MUTE / INPUT */}
            <div className="grid grid-cols-3 gap-3">
              {/* POWER BUTTON */}
              <button
                onClick={() => sendTvCommand('power', !isTvPowerOn, isTvPowerOn ? 'Apagar TV' : 'Encender TV')}
                className={`py-3.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-lg ${
                  isTvPowerOn
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/60 ring-2 ring-rose-400/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                }`}
                title="Encender o Apagar Televisor Externo"
              >
                <Power className="w-5 h-5" />
                <span>POWER</span>
              </button>

              {/* MUTE BUTTON */}
              <button
                onClick={() => sendTvCommand('mute', !isMuted, isMuted ? 'Desmutear' : 'Silenciar TV')}
                className={`py-3.5 rounded-2xl font-extrabold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-lg ${
                  isMuted
                    ? 'bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title="Silenciar / Activar Sonido"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                <span>MUTE</span>
              </button>

              {/* INPUT / SOURCE BUTTON */}
              <button
                onClick={() => {
                  const inputs = ['HDMI 1', 'HDMI 2', 'HDMI 3', 'TV', 'USB'];
                  const nextIndex = (inputs.indexOf(activeInput) + 1) % inputs.length;
                  const next = inputs[nextIndex];
                  sendTvCommand(`input_${next.toLowerCase().replace(' ', '')}`, null, `Entrada ${next}`);
                }}
                className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-extrabold text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 transition-all cursor-pointer active:scale-95 shadow"
                title="Cambiar Fuente de Entrada (HDMI / TV / USB)"
              >
                <Tv className="w-5 h-5 text-cyan-400" />
                <span>SOURCE</span>
              </button>
            </div>

            {/* DIRECT STREAMING APP LAUNCHERS */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Lanzador Rápido de Apps:</div>
              <div className="grid grid-cols-3 gap-2">
                {SMART_TV_APPS.slice(0, 6).map(app => (
                  <button
                    key={app.id}
                    onClick={() => handleLaunchExternalApp(app)}
                    className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow flex items-center justify-center gap-1.5"
                  >
                    <span className={`w-2 h-2 rounded-full ${app.color}`} />
                    <span className="truncate">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* D-PAD DIRECTIONAL NAVIGATION WHEEL */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-56 h-56 rounded-full bg-slate-950 border-4 border-slate-800 p-2 shadow-2xl relative flex items-center justify-center">
                
                {/* UP */}
                <button
                  onClick={() => sendTvCommand('nav_up', null, 'Flecha Arriba')}
                  className="absolute top-2 w-14 h-12 bg-slate-900 hover:bg-purple-900/80 active:bg-purple-600 rounded-t-full flex items-center justify-center text-slate-200 transition cursor-pointer shadow active:scale-95"
                  title="Arriba"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>

                {/* DOWN */}
                <button
                  onClick={() => sendTvCommand('nav_down', null, 'Flecha Abajo')}
                  className="absolute bottom-2 w-14 h-12 bg-slate-900 hover:bg-purple-900/80 active:bg-purple-600 rounded-b-full flex items-center justify-center text-slate-200 transition cursor-pointer shadow active:scale-95"
                  title="Abajo"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>

                {/* LEFT */}
                <button
                  onClick={() => sendTvCommand('nav_left', null, 'Flecha Izquierda')}
                  className="absolute left-2 w-12 h-14 bg-slate-900 hover:bg-purple-900/80 active:bg-purple-600 rounded-l-full flex items-center justify-center text-slate-200 transition cursor-pointer shadow active:scale-95"
                  title="Izquierda"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* RIGHT */}
                <button
                  onClick={() => sendTvCommand('nav_right', null, 'Flecha Derecha')}
                  className="absolute right-2 w-12 h-14 bg-slate-900 hover:bg-purple-900/80 active:bg-purple-600 rounded-r-full flex items-center justify-center text-slate-200 transition cursor-pointer shadow active:scale-95"
                  title="Derecha"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* CENTER OK BUTTON */}
                <button
                  onClick={() => sendTvCommand('ok', null, 'OK / Seleccionar')}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-purple-950/80 flex items-center justify-center border border-purple-300/40 transition cursor-pointer active:scale-90"
                  title="OK / Enter"
                >
                  OK
                </button>
              </div>
            </div>

            {/* NAVIGATION UTILITY BUTTONS (BACK, HOME, MENU, SETTINGS) */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => sendTvCommand('back', null, 'Atrás')}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                title="Atrás"
              >
                <RotateCcw className="w-4 h-4 text-purple-400" />
                <span className="text-[10px]">ATRÁS</span>
              </button>

              <button
                onClick={() => sendTvCommand('home', null, 'Inicio Smart TV')}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                title="Pantalla Principal Home"
              >
                <Home className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px]">HOME</span>
              </button>

              <button
                onClick={() => sendTvCommand('menu', null, 'Menú Opciones')}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                title="Menú"
              >
                <Menu className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px]">MENÚ</span>
              </button>

              <button
                onClick={() => sendTvCommand('settings', null, 'Ajustes de TV')}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                title="Ajustes de TV"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span className="text-[10px]">AJUSTES</span>
              </button>
            </div>

            {/* DUAL ROCKERS: VOLUME & CHANNEL */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-3xl border border-slate-800">
              {/* Volume Column */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[11px] font-bold text-purple-400">VOLUMEN</span>
                <button
                  onClick={() => sendTvCommand('vol_up', null, 'Subir Volumen')}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-purple-700 text-white font-extrabold text-base border border-slate-700 transition cursor-pointer active:scale-95 flex items-center justify-center shadow"
                >
                  VOL +
                </button>
                <div className="w-full text-center py-1 font-mono text-xs text-purple-300 font-bold">
                  {isMuted ? 'MUTE' : `${tvVolume}%`}
                </div>
                <button
                  onClick={() => sendTvCommand('vol_down', null, 'Bajar Volumen')}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-purple-700 text-white font-extrabold text-base border border-slate-700 transition cursor-pointer active:scale-95 flex items-center justify-center shadow"
                >
                  VOL -
                </button>
              </div>

              {/* Channel Column */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[11px] font-bold text-emerald-400">CANAL</span>
                <button
                  onClick={() => sendTvCommand('ch_up', null, 'Canal Siguiente')}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-emerald-700 text-white font-extrabold text-base border border-slate-700 transition cursor-pointer active:scale-95 flex items-center justify-center shadow"
                >
                  CH ▲
                </button>
                <div className="w-full text-center py-1 font-mono text-xs text-emerald-300 font-extrabold">
                  CH {currentChannel}
                </div>
                <button
                  onClick={() => sendTvCommand('ch_down', null, 'Canal Anterior')}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-emerald-700 text-white font-extrabold text-base border border-slate-700 transition cursor-pointer active:scale-95 flex items-center justify-center shadow"
                >
                  CH ▼
                </button>
              </div>
            </div>

            {/* MULTIMEDIA PLAYBACK CONTROLS */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              <button
                onClick={() => sendTvCommand('rewind', null, 'Rebobinar')}
                className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-800 transition cursor-pointer"
                title="Rebobinar"
              >
                <Rewind className="w-4 h-4" />
              </button>
              <button
                onClick={() => sendTvCommand('play_pause', null, 'Play / Pausa')}
                className="py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-white flex items-center justify-center border border-purple-700/50 transition cursor-pointer"
                title="Play / Pausa"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={() => sendTvCommand('fast_forward', null, 'Adelantar')}
                className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-800 transition cursor-pointer"
                title="Adelantar"
              >
                <FastForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => sendTvCommand('stop', null, 'Detener')}
                className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-800 transition cursor-pointer"
                title="Stop"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => sendTvCommand('subtitles', null, 'Subtítulos CC')}
                className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-800 transition cursor-pointer"
                title="Subtítulos"
              >
                <Subtitles className="w-4 h-4" />
              </button>
            </div>

            {/* NUMERIC KEYPAD */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => sendTvCommand('number', num, `Número ${num}`)}
                    className="py-3 rounded-2xl bg-slate-900 hover:bg-purple-900/80 border border-slate-800 text-white font-mono font-bold text-base transition cursor-pointer active:scale-95 shadow"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => sendTvCommand('dot', null, 'Guión/Punto')}
                  className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-sm cursor-pointer"
                >
                  - / .
                </button>
                <button
                  onClick={() => sendTvCommand('number', 0, 'Número 0')}
                  className="py-3 rounded-2xl bg-slate-900 hover:bg-purple-900/80 border border-slate-800 text-white font-mono font-bold text-base cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={() => sendTvCommand('pre_ch', null, 'Canal Anterior')}
                  className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 font-bold text-xs cursor-pointer"
                >
                  PRE-CH
                </button>
              </div>

              {/* Direct Numeric Input Form */}
              <form onSubmit={handleSubmitChannelNumber} className="flex gap-2 pt-2">
                <input
                  type="number"
                  value={numericEntry}
                  onChange={e => setNumericEntry(e.target.value)}
                  placeholder="Canal directo (ej. 1 al 7)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow"
                >
                  Ir al Canal
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: VOICE CONTROLLER, TELEMETRY & SIGNAL LOGS */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* VOICE COMMAND PANEL FOR EXTERNAL TV */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-400" />
                <span>Control por Voz de TV Externa</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Microphone Direct Dispatch</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleVoiceRecognition}
                className={`p-4 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg ${
                  isListeningVoice
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-950/80 ring-4 ring-rose-400/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/60'
                }`}
                title="Hablar para controlar la TV"
              >
                {isListeningVoice ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200">
                  {isListeningVoice ? 'Escuchando tu orden de TV...' : 'Presiona el micrófono para dictar'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {voiceTranscript ? `"${voiceTranscript}"` : 'Ej: "Pon YouTube", "Sube el volumen a 30", "HDMI 2"'}
                </p>
              </div>
            </div>

            {/* Quick Voice Shortcut Chips */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comandos Rápidos por Voz:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Abrir YouTube',
                  'Abrir Netflix',
                  'Subir Volumen',
                  'Bajar Volumen',
                  'Silenciar TV',
                  'Cambiar a HDMI 1',
                  'Cambiar a HDMI 2',
                  'Pantalla de Inicio'
                ].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => handleVoiceCommand(cmd)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-purple-950/60 border border-slate-800 text-slate-300 hover:text-purple-200 text-xs font-medium transition cursor-pointer"
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TELEMETRY & HARDWARE SIGNAL LOG CONSOLE */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Telemetría de Señales Infrarrojas / IP</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">Live Hardware Stream</span>
            </div>

            <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 font-mono text-[11px] space-y-1.5 max-h-64 overflow-y-auto scrollbar-none">
              {transmissionLogs.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">
                  Presiona cualquier botón en el control para emitir comandos reales a tu TV externa.
                </p>
              ) : (
                transmissionLogs.map(log => (
                  <div key={log.id} className="flex items-start justify-between gap-2 border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <span className="text-purple-300 font-bold">[{log.timestamp}]</span>{' '}
                      <span className="text-white font-semibold">{log.action}:</span>{' '}
                      <span className="text-emerald-400">{log.payload}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      log.status === 'ok' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Último código emitido: <strong className="text-purple-300 font-mono">{lastTransmittedCode || 'Ninguno'}</strong></span>
              <button
                onClick={() => setTransmissionLogs([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                Limpiar consola
              </button>
            </div>
          </div>

          {/* DISCOVERED SMART TVS IN NETWORK */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span>Smart TVs Detectadas en tu Red Local</span>
            </h3>

            <div className="space-y-2">
              {discoveredTvs.length === 0 ? (
                <div className="text-xs text-slate-400 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  Ninguna TV detectada automáticamente. Configura la IP arriba manualmente.
                </div>
              ) : (
                discoveredTvs.map((tv, idx) => (
                  <div
                    key={tv.id || `discovered-tv-${tv.ip || idx}-${idx}`}
                    onClick={() => {
                      setTvIpAddress(tv.ip);
                      setTvName(tv.name);
                      setSelectedBrand(tv.brand || 'riviera');
                      showNotification(`📡 Seleccionada ${tv.name} (${tv.ip})`);
                    }}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      tvIpAddress === tv.ip
                        ? 'bg-purple-950/60 border-purple-500/50 text-white'
                        : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Tv className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-semibold text-xs text-white">{tv.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{tv.ip}:{tv.port} • {tv.protocol || tv.type || 'IP/IR'}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-1 bg-purple-900/40 rounded-lg text-purple-300">
                      {tvIpAddress === tv.ip ? 'Activa' : 'Conectar'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
