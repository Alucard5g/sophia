import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Play,
  Pause,
  Download,
  RefreshCw,
  Copy,
  Check,
  Maximize2,
  Share2,
  Sliders,
  Layers,
  Wand2,
  Film,
  Zap,
  Info,
  ExternalLink,
  ChevronRight,
  Eye,
  Volume2,
  VolumeX,
  Music,
  Radio,
  FileText,
  RotateCcw,
  Scissors,
  Camera,
  Sun,
  Moon,
  Feather,
  Disc,
  PlayCircle
} from 'lucide-react';
import { GenerativeMediaItem } from '../types';
import { speakSmoothSophia } from '../lib/smoothSpeech';

interface GenerativeMediaStudioTabProps {
  onSendVoiceCommand?: (cmd: string) => void;
}

const STYLE_PRESETS = [
  { id: 'photorealistic', label: '📸 Fotorrealista 8K', promptSuffix: ', ultra realistic 8k photorealistic, raw camera photo, sharp focus, natural lighting, subsurface scattering, mastershot' },
  { id: 'cyberpunk', label: '🌆 Cyberpunk Neón', promptSuffix: ', cyberpunk neo-tokyo aesthetics, glowing neon lights, holographic UI, volumetric fog, Unreal Engine 5.4 render' },
  { id: 'cinematic', label: '🎬 Cinemático 35mm', promptSuffix: ', 35mm anamorphic lens, shallow depth of field, dramatic cinematic lighting, Kodak Portra 800, film grain' },
  { id: 'octane3d', label: '💎 Render 3D Octane', promptSuffix: ', 3D Octane render, raytracing reflections, subsurface scattering, 8k blender art, hyper-detailed glossy materials' },
  { id: 'anime', label: '🎨 Anime Studio', promptSuffix: ', studio anime art style, vibrant colors, detailed lineart, Makoto Shinkai aesthetic, cinematic sky' },
  { id: 'scifi', label: '🚀 Sci-Fi Futurista', promptSuffix: ', futuristic space concept art, glowing quantum energy, high tech sci-fi illustration, planetary scale' }
];

const CAMERA_MOTIONS = [
  { id: 'drone', label: '🛸 Vuelo de Dron Cinemático', desc: 'Vista aérea suave con avance fluido' },
  { id: 'dolly_zoom', label: '🔍 Dolly Zoom (Vértigo)', desc: 'Efecto Hitchcock con acercamiento óptico dramático' },
  { id: 'orbit', label: '🔄 Órbita Espacial 360°', desc: 'Rotación continua alrededor del sujeto principal' },
  { id: 'hyperlapse', label: '⚡ Hyperlapse 3D Rápido', desc: 'Desplazamiento dinámico acelerado con desenfoque de movimiento' },
  { id: 'pan', label: '↔️ Paneo Panorámico', desc: 'Barrido horizontal cinemático de izquierda a derecha' }
];

const INSPIRATION_PROMPTS = [
  { label: '🌟 Avatar SophIA Metahuman', prompt: 'Avatar hiperrealista de SophIA en primer plano, ojos brillantes con destellos cuánticos, piel perfecta con dispersión subsuperficial, fondo holográfico de AI Studio en 8K' },
  { label: '🚀 Ciudad Cuántica 2026', prompt: 'Metrópolis futurista con rascacielos flotantes, trenes maglev de luz y puentes de energía sobre el océano al atardecer, cinemático 8K' },
  { label: '🏎️ Hiperauto Eléctrico Cyberpunk', prompt: 'Superdeportivo aerodinámico de fibra de carbono reflectante, luces LED moradas y cian bajo lluvia nocturna en Neo-Tokio' },
  { label: '🌿 Jardín Bio-Luminiscente', prompt: 'Flora exótica brillante con esporas flotantes de luz dorada y cascadas de agua cristalina en un planeta alienígena pacífico' },
  { label: '☕ Comercial Elegante de Café', prompt: 'Vapor ascendiendo lentamente de una taza de porcelana fina con espresso perfecto, iluminación cálida de estudio y grano cinematográfico' }
];

const AUDIO_TRACK_PRESETS = [
  { id: 'track-cyber', title: 'Cyber Pulse 2026 (Hi-Fi Electronic)', mood: 'Futurista & Energético', duration: '0:30', freq: 440, type: 'sawtooth' },
  { id: 'track-ambient', title: 'Deep Space Meditation (Atmospheric)', mood: 'Relajante & Espacial', duration: '0:45', freq: 220, type: 'sine' },
  { id: 'track-cinema', title: 'Epic Orchestral Rise (Cinema Impact)', mood: 'Dramático & Épico', duration: '0:35', freq: 330, type: 'triangle' },
  { id: 'track-lofi', title: 'Chill Lo-Fi Studio Beats', mood: 'Calmado & Creativo', duration: '0:40', freq: 260, type: 'square' }
];

export const GenerativeMediaStudioTab: React.FC<GenerativeMediaStudioTabProps> = ({
  onSendVoiceCommand
}) => {
  const [activeStudioTab, setActiveStudioTab] = useState<'visual' | 'video' | 'audio' | 'storyboard'>('visual');
  const [prompt, setPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite-image');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '21:9'>('16:9');
  const [resolution, setResolution] = useState<string>('1K');
  const [selectedStyle, setSelectedStyle] = useState<string>('photorealistic');
  const [selectedMotion, setSelectedMotion] = useState<string>('drone');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [gallery, setGallery] = useState<GenerativeMediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GenerativeMediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video Player state
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [videoFilter, setVideoFilter] = useState<'none' | 'cyberpunk' | 'warm' | 'noir' | 'vivid'>('none');
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1.0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Audio Synthesizer state
  const [activeAudioTrack, setActiveAudioTrack] = useState<string | null>(null);
  const [isPlayingSynthAudio, setIsPlayingSynthAudio] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorRef = useRef<OscillatorNode | null>(null);

  // Storyboard generator state
  const [storyboardScenes, setStoryboardScenes] = useState<Array<{
    sceneNum: number;
    title: string;
    description: string;
    cameraAngle: string;
    audioCue: string;
  }>>([
    {
      sceneNum: 1,
      title: 'Apertura: El Despertar de SophIA',
      description: 'Cámara en travelling frontal aproximándose a la interfaz cuántica de SophIA mientras los anillos energéticos se iluminan.',
      cameraAngle: 'Plano Medio con Profundidad de Campo',
      audioCue: 'Voz dulce de SophIA: "Bienvenido. Tu visión creativa es mi comando."'
    },
    {
      sceneNum: 2,
      title: 'Despliegue del Entorno 3D',
      description: 'Transición fluida a una vista panorámica aérea de la ciudad hipertecnológica con reflejos lumínicos sobre el cristal.',
      cameraAngle: 'Vuelo de Dron Cinemático 60 FPS',
      audioCue: 'Sintetizador progresivo con arpegios armónicos'
    },
    {
      sceneNum: 3,
      title: 'Clímax & Renderizado Final',
      description: 'Convergencia de haces de datos en un núcleo central que emite un destello dorado y cristaliza la creación solicitada.',
      cameraAngle: 'Paneo Orbital 360° en 4K HDR',
      audioCue: 'Impacto cinemático profundo y locución de confirmación'
    }
  ]);

  // Fetch initial gallery
  useEffect(() => {
    fetchGallery();
    return () => {
      stopSynthesizerAudio();
    };
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/generative-media');
      const data = await res.json();
      if (data.success && data.gallery) {
        setGallery(data.gallery);
        if (!selectedItem && data.gallery.length > 0) {
          setSelectedItem(data.gallery[0]);
        }
      }
    } catch (e) {
      console.warn('Error fetching gallery:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // AI Studio Prompt Enhancer (Gemini 3.7 / 3.1 Pro)
  const handleEnhancePromptWithAi = async () => {
    if (!prompt.trim()) {
      showToast('Escribe primero una idea básica para que SophIA la perfeccione.');
      return;
    }
    setIsEnhancingPrompt(true);
    showToast('SophIA está perfeccionando tu prompt con iluminación, óptica y composición...');

    try {
      const res = await fetch('/api/ai-studio/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Eres un director de fotografía, artista conceptual de cine y experto en prompts generativos de alta definición. Transforma este concepto: "${prompt.trim()}" en un prompt maestro cinemático en español e inglés, detallando iluminación volumétrica, lente de cámara (35mm/85mm), textura fotorrealista 8K, color grading y atmósfera. Devuelve ÚNICAMENTE el prompt enriquecido final en 2 o 3 líneas, sin explicaciones ni saludos.`,
          model: 'gemini-3.7-flash',
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setPrompt(data.text.trim());
        showToast('✨ ¡Prompt mejorado con éxito por el cerebro de SophIA!');
        speakSmoothSophia('He enriquecido tu descripción con parámetros cinemáticos, iluminación de estudio y composición óptica.', {
          voiceStyle: 'dulce_afectuosa'
        });
      }
    } catch (e) {
      showToast('Error al optimizar prompt con IA.');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Por favor escribe una descripción para tu creación.');
      return;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(25); } catch(e) {}
    }

    setIsGenerating(true);
    const isVid = activeStudioTab === 'video';
    showToast(`Generando ${!isVid ? 'imagen con Nano Banana & Imagen 3' : 'video con Veo 3.1 & Animación Cinemática'}...`);

    const styleObj = STYLE_PRESETS.find(s => s.id === selectedStyle);
    const motionObj = CAMERA_MOTIONS.find(m => m.id === selectedMotion);
    
    let enhancedPrompt = prompt.trim();
    if (!isVid && styleObj) {
      enhancedPrompt += styleObj.promptSuffix;
    } else if (isVid && motionObj) {
      enhancedPrompt += `, movimiento de cámara: ${motionObj.label}, iluminación cinemática 4K HDR, render Unreal Engine 5.4`;
    }

    try {
      const endpoint = !isVid ? '/api/generate-image' : '/api/generate-video';
      const payload = {
        prompt: enhancedPrompt,
        model: isVid ? 'veo-3.1-lite-generate-preview' : selectedModel,
        aspectRatio,
        ...(!isVid ? { imageSize: resolution } : { resolution: resolution === '1K' ? '720p' : '1080p' })
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.item) {
        setGallery(prev => [data.item, ...prev]);
        setSelectedItem(data.item);
        showToast(`¡${!isVid ? 'Imagen' : 'Video'} generado con éxito!`);
        speakSmoothSophia(
          !isVid
            ? '¡He generado tu imagen con el motor Nano Banana! Ya puedes previsualizarla y descargarla en alta definición.'
            : '¡Tu video con Veo está listo! Puedes reproducirlo ahora mismo con controles cinemáticos.',
          { voiceStyle: 'dulce_afectuosa' }
        );
      } else {
        showToast(data.error || 'No se pudo completar la generación.');
      }
    } catch (err: any) {
      showToast('Error de conexión al generar medio.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Play synthetic Web Audio track preview
  const playSynthesizerAudio = (track: typeof AUDIO_TRACK_PRESETS[0]) => {
    stopSynthesizerAudio();
    setActiveAudioTrack(track.id);
    setIsPlayingSynthAudio(true);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = track.type as any;
      osc.frequency.setValueAtTime(track.freq, ctx.currentTime);
      // Gentle arpeggio effect
      osc.frequency.exponentialRampToValueAtTime(track.freq * 1.5, ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(track.freq * 0.8, ctx.currentTime + 0.8);
      osc.frequency.exponentialRampToValueAtTime(track.freq, ctx.currentTime + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      activeOscillatorRef.current = osc;

      showToast(`🎵 Reproduciendo vista previa de audio: "${track.title}"`);
    } catch (e) {
      console.warn('Synth error:', e);
    }
  };

  const stopSynthesizerAudio = () => {
    if (activeOscillatorRef.current) {
      try { activeOscillatorRef.current.stop(); } catch (e) {}
      activeOscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    setIsPlayingSynthAudio(false);
    setActiveAudioTrack(null);
  };

  const copyUrl = (item: GenerativeMediaItem) => {
    navigator.clipboard.writeText(item.mediaUrl);
    setCopiedId(item.id);
    showToast('Enlace copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getVideoFilterClass = () => {
    switch (videoFilter) {
      case 'cyberpunk': return 'hue-rotate-60 contrast-125 saturate-150';
      case 'warm': return 'sepia-[0.35] brightness-105 contrast-110';
      case 'noir': return 'grayscale contrast-150';
      case 'vivid': return 'saturate-200 contrast-110';
      default: return '';
    }
  };

  return (
    <div id="generative-media-studio-tab" className="w-full max-w-7xl mx-auto p-3 sm:p-5 space-y-6 pb-24 text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-purple-950/95 border border-purple-500/50 text-purple-100 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs sm:text-sm font-medium flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 p-5 sm:p-7 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-56 h-56 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-56 h-56 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Estudio Audiovisual Neural de SophIA • Suite 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Creación Audiovisual, Cine & Animación
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Crea arte fotorrealista 8K con <strong className="text-purple-300">Nano Banana & Imagen 3</strong>, sintetiza tomas de cine con <strong className="text-rose-300">Veo 3.1</strong>, genera pistas sonoras y diseña guiones de producción automáticos.
            </p>
          </div>

          {/* Master Studio Sub-Tabs */}
          <div className="flex bg-slate-950/85 p-1.5 rounded-2xl border border-slate-800 gap-1 flex-wrap w-full md:w-auto">
            <button
              onClick={() => {
                setActiveStudioTab('visual');
                setSelectedModel('gemini-3.1-flash-lite-image');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeStudioTab === 'visual'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Visual (Nano Banana)</span>
            </button>
            <button
              onClick={() => {
                setActiveStudioTab('video');
                setSelectedModel('veo-3.1-lite-generate-preview');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeStudioTab === 'video'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Video (Veo 3.1)</span>
            </button>
            <button
              onClick={() => setActiveStudioTab('audio')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeStudioTab === 'audio'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Audio & Música</span>
            </button>
            <button
              onClick={() => setActiveStudioTab('storyboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeStudioTab === 'storyboard'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Guión & Storyboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Work Area */}
      {(activeStudioTab === 'visual' || activeStudioTab === 'video') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Configuration & Prompt Cockpit (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  <span>Configuración de Creación</span>
                </h2>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  {activeStudioTab === 'visual' ? 'Motor Nano Banana 8K' : 'Motor Veo 3.1 Cinemático'}
                </span>
              </div>

              {/* Prompt Input & AI Enhancer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Descripción / Prompt Detallado:
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhancePromptWithAi}
                    disabled={isEnhancingPrompt}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3 h-3 text-amber-400 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
                    <span>{isEnhancingPrompt ? 'Perfeccionando...' : 'Optimizar con AI Studio'}</span>
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeStudioTab === 'visual'
                      ? 'Ej: Avatar de SophIA en primer plano hiperrealista 8K, iluminación de estudio, reflejos cuánticos en sus ojos...'
                      : 'Ej: Vuelo de dron cinemático sobre metrópolis futurista al atardecer con rascacielos de cristal y lluvia ligera...'
                  }
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-2xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none resize-none transition-all shadow-inner"
                />
              </div>

              {/* Quick Inspiration Prompts */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400">💡 Inspiraciones Rápidas de 1 Clic:</div>
                <div className="flex flex-wrap gap-1.5">
                  {INSPIRATION_PROMPTS.map((insp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(insp.prompt)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-slate-700 hover:border-purple-500/40 rounded-xl text-[11px] font-medium transition cursor-pointer"
                    >
                      {insp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Estilo Artístico & Óptica:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLE_PRESETS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`p-2 rounded-xl text-[11px] font-semibold text-left border transition-all cursor-pointer ${
                        selectedStyle === st.id
                          ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-md shadow-purple-950/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Motion (if Video) */}
              {activeStudioTab === 'video' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    <span>Movimiento de Cámara (Veo 3.1):</span>
                  </label>
                  <div className="space-y-1.5">
                    {CAMERA_MOTIONS.map((cm) => (
                      <button
                        key={cm.id}
                        type="button"
                        onClick={() => setSelectedMotion(cm.id)}
                        className={`w-full p-2 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                          selectedMotion === cm.id
                            ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-semibold">{cm.label}</span>
                        <span className="text-[10px] text-slate-500">{cm.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Aspect Ratio & Resolution */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Proporción de Aspecto:</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="16:9">16:9 Panorámica (YouTube / TV)</option>
                    <option value="9:16">9:16 Vertical (TikTok / Reels)</option>
                    <option value="1:1">1:1 Cuadrado (Instagram)</option>
                    <option value="4:3">4:3 Fotografía Clásica</option>
                    <option value="21:9">21:9 Ultra-Wide CinemaScope</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Calidad / Resolución:</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="1K">1K HD (Rápido)</option>
                    <option value="2K">2K Full HD Ultra (Recomendado)</option>
                    <option value="4K">4K Cinema Master 60fps</option>
                  </select>
                </div>
              </div>

              {/* Generate Trigger Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeStudioTab === 'visual'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/60'
                    : 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-950/60'
                } disabled:opacity-50`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Sintetizando {activeStudioTab === 'visual' ? 'Imagen' : 'Video'} con IA...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Generar {activeStudioTab === 'visual' ? 'Imagen Fotorrealista' : 'Video Cinemático'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Master Cinema Showcase & Player (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-purple-400" />
                  <span>Pantalla de Previsualización Cinemática</span>
                </h2>
                {selectedItem && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {selectedItem.type === 'video' ? 'Video 4K' : 'Imagen 8K'} • {selectedItem.aspectRatio}
                  </span>
                )}
              </div>

              {/* Canvas / Video Screen Area */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[300px] flex items-center justify-center group shadow-2xl">
                {selectedItem ? (
                  selectedItem.type === 'video' ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <video
                        ref={videoRef}
                        src={selectedItem.mediaUrl}
                        poster={selectedItem.thumbnailUrl}
                        controls
                        playsInline
                        className={`w-full max-h-[420px] object-contain rounded-2xl transition-all ${getVideoFilterClass()}`}
                        onPlay={() => setIsPlayingVideo(true)}
                        onPause={() => setIsPlayingVideo(false)}
                      />
                    </div>
                  ) : (
                    <img
                      src={selectedItem.mediaUrl}
                      alt={selectedItem.prompt}
                      referrerPolicy="no-referrer"
                      className={`w-full max-h-[420px] object-contain rounded-2xl transition-all ${getVideoFilterClass()}`}
                    />
                  )
                ) : (
                  <div className="text-center p-8 space-y-2">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">Ningún medio seleccionado</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Escribe un prompt a la izquierda y presiona Generar para ver la magia de SophIA en acción.
                    </p>
                  </div>
                )}
              </div>

              {/* Cinema Controls Bar (Filters, Speeds, Actions) */}
              {selectedItem && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Visual Filters */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-semibold">Filtros:</span>
                      {[
                        { id: 'none', label: 'Original' },
                        { id: 'cyberpunk', label: '🌆 Cyberpunk' },
                        { id: 'warm', label: '☀️ Cine Cálido' },
                        { id: 'noir', label: '🖤 Noir B&W' },
                        { id: 'vivid', label: '🌈 Hyper Vivid' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setVideoFilter(f.id as any)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                            videoFilter === f.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyUrl(selectedItem)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copiedId === selectedItem.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === selectedItem.id ? 'Copiado' : 'Copiar URL'}</span>
                      </button>
                      <a
                        href={selectedItem.mediaUrl}
                        download={`sophia-${selectedItem.type}-${Date.now()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-purple-950/50 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  </div>

                  {/* Prompt caption */}
                  <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="font-semibold text-purple-300">Prompt: </span>
                    <span>{selectedItem.prompt}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Grid of Previous Generations */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Galería de Creaciones ({gallery.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
                {gallery.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative rounded-xl overflow-hidden border cursor-pointer group transition-all aspect-video ${
                      selectedItem?.id === item.id
                        ? 'border-purple-500 ring-2 ring-purple-500/40 scale-102'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={item.type === 'video' ? (item.thumbnailUrl || item.mediaUrl) : item.mediaUrl}
                      alt={item.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent opacity-70 group-hover:opacity-90 transition" />
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      {item.type === 'video' ? <Film className="w-2.5 h-2.5 text-rose-400" /> : <ImageIcon className="w-2.5 h-2.5 text-purple-400" />}
                      <span>{item.type === 'video' ? 'Video' : '8K'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio & Music Synthesizer Tab */}
      {activeStudioTab === 'audio' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-indigo-400" />
                  <span>Estudio de Locución & Pistas de Audio Hi-Fi</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sintetiza música ambiental, efectos de sonido cinemáticos y locuciones de SophIA con calidad de estudio.
                </p>
              </div>
              {isPlayingSynthAudio && (
                <button
                  type="button"
                  onClick={stopSynthesizerAudio}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/50"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>Detener Audio</span>
                </button>
              )}
            </div>

            {/* Audio Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AUDIO_TRACK_PRESETS.map((trk) => (
                <div
                  key={trk.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    activeAudioTrack === trk.id
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-xl shadow-indigo-950/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{trk.title}</span>
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      {trk.duration}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{trk.mood}</p>
                  <button
                    type="button"
                    onClick={() => playSynthesizerAudio(trk)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950/40"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Reproducir Pista Sonora</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Direct Voiceover Generator */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-purple-400" />
                <span>Locución de Voz Neuronal de SophIA</span>
              </h3>
              <p className="text-xs text-slate-400">
                Dicta o escribe un texto para que SophIA lo narre con su tono dulce y sensual en tiempo real.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: Bienvenido al futuro de la inteligencia artificial y el desarrollo audiovisual con SophIA..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      speakSmoothSophia(e.currentTarget.value.trim(), { voiceStyle: 'dulce_sensual' });
                      showToast('🎙️ SophIA está locutando el guión...');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input && input.value.trim()) {
                      speakSmoothSophia(input.value.trim(), { voiceStyle: 'dulce_sensual' });
                      showToast('🎙️ SophIA está locutando el guión...');
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Locutar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storyboard & Production Scripts Tab */}
      {activeStudioTab === 'storyboard' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Guión de Producción & Storyboard 3D</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Planificación plano por plano para videos comerciales, cinemáticos y animaciones de alta fidelidad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  showToast('Generando nuevo Storyboard de 3 escenas con IA...');
                  speakSmoothSophia('He diseñado un nuevo storyboard estructurado con ángulos de cámara y pistas sonoras.', { voiceStyle: 'dulce_afectuosa' });
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generar Nuevo Storyboard</span>
              </button>
            </div>

            {/* Scenes List */}
            <div className="space-y-4">
              {storyboardScenes.map((sc) => (
                <div key={sc.sceneNum} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">Escena {sc.sceneNum}: {sc.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                      {sc.cameraAngle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{sc.description}</p>
                  <div className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded-xl border border-indigo-500/20 flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-indigo-400" />
                    <span><strong>Audio: </strong>{sc.audioCue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
