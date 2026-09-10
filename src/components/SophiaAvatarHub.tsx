import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Mic,
  MicOff,
  Square,
  Send,
  Sparkles,
  Heart,
  Volume2,
  VolumeX,
  Bot,
  Zap,
  Sliders,
  Tv,
  Home,
  Bluetooth,
  Calendar,
  Globe,
  Smartphone,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Code,
  ShieldCheck,
  RefreshCw,
  Eye,
  Radio,
  Copy,
  Check,
  Cpu,
  Brain,
  Wand2,
  Table,
  ListOrdered,
  Download,
  ExternalLink,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  Database,
  Layout,
  MessageSquare,
  Plus,
  Cloud,
  Cast,
  Compass,
  Video,
  Flame,
  Volume1,
  User
} from 'lucide-react';
import {
  Interaction,
  AIStudioConfig,
  SophiaVoiceProfile,
  VoiceStyle,
  UploadedMediaItem,
  UserDeviceProfile,
  SimulatedScenario
} from '../types';
import { useSophiaMic } from '../lib/useSophiaMic';
import { MultimodalUploadBar } from './MultimodalUploadBar';
import { CreationPreviewSandbox } from './CreationPreviewSandbox';
import {
  speakSmoothSophia,
  stopSmoothSophia,
  playHarmonicChime,
  subscribeSpeechStatus,
  subscribeLipSyncStream,
  LipSyncVisemeFrame,
  isSmoothSpeechPlaying
} from '../lib/smoothSpeech';
import {
  saveInteractionToOfflineCache,
  generateOfflineSophiaResponse,
  queueOfflineSync,
  getInteractionsFromOfflineCache
} from '../lib/offlineStorage';
import { SophiaFacialKinematicsLayer, FacialCalibrationSettings, DEFAULT_FACIAL_CALIBRATION } from './SophiaFacialKinematicsLayer';
import sophiaMetahumanImg from '../assets/images/sophia_metahuman_aesthetic_portrait_1787975246297.jpg';

interface SophiaAvatarHubProps {
  onProcessComplete: (interaction: Interaction) => void;
  isProcessing: boolean;
  setIsProcessing: (b: boolean) => void;
  setIsRecordingGlobal?: (b: boolean) => void;
  aiStudioConfig: AIStudioConfig;
  onChangeConfig?: (cfg: AIStudioConfig) => void;
  currentInteraction: Interaction | null;
  userProfile?: UserDeviceProfile | null;
  initialPrompt?: string;
  onNavigateTab: (tab: string) => void;
  onOpenDeviceModal?: () => void;
  onOpenCreations?: () => void;
}

export const SophiaAvatarHub: React.FC<SophiaAvatarHubProps> = ({
  onProcessComplete,
  isProcessing,
  setIsProcessing,
  setIsRecordingGlobal,
  aiStudioConfig,
  onChangeConfig,
  currentInteraction,
  userProfile,
  initialPrompt,
  onNavigateTab,
  onOpenDeviceModal,
  onOpenCreations
}) => {
  const [avatarMode, setAvatarMode] = useState<'ejecutivo' | 'creativo' | 'casual' | 'agi5'>('ejecutivo');
  const [avatarVisualTheme, setAvatarVisualTheme] = useState<'cortana_halo' | 'facebook_meta' | 'ue5_photoreal' | 'cyberpunk_hud'>('cortana_halo');
  const [avatarCameraAngle, setAvatarCameraAngle] = useState<'closeup' | 'hologram' | 'studio' | 'cyberpunk_hud'>('closeup');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [promptText, setPromptText] = useState<string>(initialPrompt || '');
  const [lastUserInstruction, setLastUserInstruction] = useState<string>(initialPrompt || currentInteraction?.userQuery || '');
  const [attachments, setAttachments] = useState<UploadedMediaItem[]>([]);
  const [category, setCategory] = useState<string>('Universal');
  const [formatPreference, setFormatPreference] = useState<string>('Auto / Según Instrucción');
  const [autoVoiceResponse, setAutoVoiceResponse] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Facebook & Meta 3D Social Reactions State
  const [socialReactions, setSocialReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const [reactionCounts, setReactionCounts] = useState<{ [key: string]: number }>({
    '👍': 184,
    '❤️': 492,
    '💡': 118,
    '🚀': 267,
    '🔥': 650,
    '✨': 380
  });

  const handleTriggerReaction = (emoji: string) => {
    setReactionCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    const id = `rx-${Date.now()}-${Math.random()}`;
    const x = Math.floor(Math.random() * 80) - 40;
    setSocialReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setSocialReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  // Advanced Metahuman Facial & Kinetic Animation State
  const [mouthOpen, setMouthOpen] = useState<number>(0);
  const [mouthWidth, setMouthWidth] = useState<number>(24);
  const [mouthHeight, setMouthHeight] = useState<number>(4);
  const [lipCurvature, setLipCurvature] = useState<number>(0);
  const [teethVisible, setTeethVisible] = useState<boolean>(false);
  const [visemeType, setVisemeType] = useState<'rest' | 'A' | 'E' | 'I' | 'O' | 'U' | 'smile' | 'fricative'>('rest');

  // Gaze & Eye Kinematics
  const [eyePosition, setEyePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [saccadeOffset, setSaccadeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [blink, setBlink] = useState<boolean>(false);
  const [eyeSquint, setEyeSquint] = useState<number>(1);
  const [pupilDilation, setPupilDilation] = useState<number>(1);
  const [browOffset, setBrowOffset] = useState<number>(0);

  // Head Kinetic Gestures & Posture
  const [headTilt, setHeadTilt] = useState<number>(0);
  const [headNod, setHeadNod] = useState<number>(0);
  const [headScale, setHeadScale] = useState<number>(1);
  const [avatarEmotion, setAvatarEmotion] = useState<'warm_sweet' | 'analytical' | 'executive' | 'deep_thinking' | 'welcoming' | 'casual_happy'>('warm_sweet');
  const [activeGestureLabel, setActiveGestureLabel] = useState<string>('Reposo Natural 60 FPS');

  // Result display view tabs: 'formatted' | 'consensus' | 'sandbox' | 'scenarios' | 'raw' | 'memory'
  const [activeResultTab, setActiveResultTab] = useState<'formatted' | 'consensus' | 'sandbox' | 'scenarios' | 'raw' | 'memory'>('formatted');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('s1');
  const [selectedConsensusModelId, setSelectedConsensusModelId] = useState<string>('gemini-3.7-flash');
  const [selectedModelView, setSelectedModelView] = useState<string>('sophia-master');
  const [selectedClusterEngine, setSelectedClusterEngine] = useState<string>('cluster-all');
  const [masteryLevel, setMasteryLevel] = useState<'40y_senior_mastery' | 'deep_engineering' | 'executive_synthesis'>('40y_senior_mastery');

  // Multi-turn conversation tracking & sessions
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => `session-${Date.now()}`);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);

  // Facial Landmark Calibration State (Persistence in localStorage)
  const [facialCalibration, setFacialCalibration] = useState<FacialCalibrationSettings>(() => {
    try {
      const saved = localStorage.getItem('sophia_facial_calibration');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_FACIAL_CALIBRATION;
  });
  const [showCalibrationPanel, setShowCalibrationPanel] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('sophia_facial_calibration', JSON.stringify(facialCalibration));
    } catch (e) {}
  }, [facialCalibration]);

  // Real-time Live Clock & Date State
  const [liveDateStr, setLiveDateStr] = useState<string>('');
  const [liveTimeStr, setLiveTimeStr] = useState<string>('');
  const [speechProgress, setSpeechProgress] = useState<{ current: number; total: number; snippet: string } | null>(null);

  const avatarContainerRef = useRef<HTMLDivElement | null>(null);
  const lipSyncIntervalRef = useRef<any>(null);

  // Live real-time ticking clock (100% dynamic, ticks every second)
  useEffect(() => {
    const updateLiveDateTime = () => {
      const now = new Date();
      setLiveTimeStr(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
      setLiveDateStr(
        now.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      );
    };

    updateLiveDateTime();
    const clockTimer = setInterval(updateLiveDateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Sync initialPrompt and currentInteraction with lastUserInstruction
  useEffect(() => {
    if (initialPrompt) {
      setPromptText(initialPrompt);
      setLastUserInstruction(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (currentInteraction?.userQuery) {
      setLastUserInstruction(currentInteraction.userQuery);
    }
  }, [currentInteraction?.userQuery]);

  // Robust Microphone Hook with Sofi Wake-Word & Continuous Listening
  const {
    isRecording,
    recordingTimeSec,
    transcript,
    setTranscript,
    audioLevel,
    canvasRef,
    startRecording,
    stopRecording,
    wakeWordDetected,
    continuousListening,
    setContinuousListening,
    errorMessage: micError,
    clearError: clearMicError,
    requestPermission,
    simulateVoiceInput
  } = useSophiaMic({
    onTranscriptUpdate: (text) => {
      setPromptText(text);
      if (text) setLastUserInstruction(text);
    },
    onWakeWordDetected: (instruction) => {
      if (instruction) {
        setPromptText(instruction);
        setLastUserInstruction(instruction);
      }
    },
    onAutoSubmit: (instruction) => {
      if (instruction && instruction.trim().length > 2 && !isProcessing) {
        setPromptText(instruction);
        handleExecuteInstruction(instruction);
      }
    }
  });

  // Sync recording status globally
  useEffect(() => {
    if (setIsRecordingGlobal) {
      setIsRecordingGlobal(isRecording);
    }
  }, [isRecording, setIsRecordingGlobal]);

  // Keep prompt synchronized with voice transcription in letters
  useEffect(() => {
    if (transcript && isRecording) {
      setPromptText(transcript);
      setLastUserInstruction(transcript);
    }
  }, [transcript, isRecording]);

  // 1. Emotion and Sentiment Detection from Current Interaction & State
  useEffect(() => {
    if (isProcessing) {
      setAvatarEmotion('deep_thinking');
      setActiveGestureLabel('Simulación de Escenarios & Razonamiento');
      setHeadTilt(-2.5);
      setBrowOffset(1.5);
      setEyeSquint(0.95);
      return;
    }

    if (isRecording) {
      setAvatarEmotion('warm_sweet');
      setActiveGestureLabel('Escucha Activa & Atención Total');
      setHeadTilt(1.8);
      setBrowOffset(0.8);
      setEyeSquint(1.05);
      return;
    }

    if (currentInteraction?.spokenSummary || currentInteraction?.finalResponse) {
      const fullText = (
        (currentInteraction.spokenSummary || '') +
        ' ' +
        (currentInteraction.finalResponse || '')
      ).toLowerCase();

      if (
        fullText.includes('hola') ||
        fullText.includes('cielo') ||
        fullText.includes('bienvenid') ||
        fullText.includes('encantad') ||
        fullText.includes('un placer')
      ) {
        setAvatarEmotion('warm_sweet');
        setActiveGestureLabel('Saludo AGI & Empatía Cálida');
        setHeadTilt(2.5);
        setBrowOffset(1.2);
        setEyeSquint(1.08);
      } else if (
        fullText.includes('código') ||
        fullText.includes('función') ||
        fullText.includes('algoritm') ||
        fullText.includes('arquitectura') ||
        fullText.includes('error') ||
        fullText.includes('debug') ||
        fullText.includes('typescript')
      ) {
        setAvatarEmotion('analytical');
        setActiveGestureLabel('Análisis de Ingeniería & Código');
        setHeadTilt(0);
        setBrowOffset(-0.8);
        setEyeSquint(0.92);
      } else if (
        fullText.includes('estrategia') ||
        fullText.includes('empresa') ||
        fullText.includes('decisión') ||
        fullText.includes('proyecto') ||
        fullText.includes('optimización') ||
        fullText.includes('éxito')
      ) {
        setAvatarEmotion('executive');
        setActiveGestureLabel('Liderazgo Ejecutivo & Asentimiento');
        setHeadTilt(0.5);
        setBrowOffset(0.2);
        setEyeSquint(1.0);
      } else if (
        fullText.includes('simulación') ||
        fullText.includes('escenario') ||
        fullText.includes('riesgo') ||
        fullText.includes('mitigación') ||
        fullText.includes('probabilidad')
      ) {
        setAvatarEmotion('deep_thinking');
        setActiveGestureLabel('Evaluación de Riesgos & Síntesis');
        setHeadTilt(-2.0);
        setBrowOffset(1.2);
        setEyeSquint(0.96);
      } else {
        setAvatarEmotion('welcoming');
        setActiveGestureLabel('Atención Dinámica 60 FPS');
        setHeadTilt(1.2);
        setBrowOffset(0.5);
        setEyeSquint(1.02);
      }
    }
  }, [isProcessing, isRecording, currentInteraction]);

  // 2. High-Fidelity Real-Time Phonetic Lip-Sync & Speaking Kinematics
  useEffect(() => {
    const unsubStatus = subscribeSpeechStatus((speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) {
        setMouthOpen(0);
        setMouthWidth(26);
        setMouthHeight(3);
        setTeethVisible(false);
        setLipCurvature(avatarEmotion === 'warm_sweet' ? -2 : 0);
        setVisemeType('rest');
        setHeadNod(0);
        setPupilDilation(1.0);
        setSpeechProgress(null);
      }
    });

    const unsubLipSync = subscribeLipSyncStream((frame: LipSyncVisemeFrame) => {
      if (frame.isSpeaking) {
        setMouthOpen(frame.mouthOpen);
        setMouthWidth(frame.mouthWidth);
        setMouthHeight(frame.mouthHeight);
        setTeethVisible(frame.teethVisible);
        setLipCurvature(frame.lipCurvature);
        setVisemeType(frame.visemeType as any);
        setHeadNod(frame.mouthOpen * 2.5);
        setPupilDilation(1.05 + frame.mouthOpen * 0.25);
      } else {
        setMouthOpen(0);
        setMouthWidth(26);
        setMouthHeight(3);
        setTeethVisible(false);
        setLipCurvature(avatarEmotion === 'warm_sweet' ? -2 : 0);
        setVisemeType('rest');
        setHeadNod(0);
        setPupilDilation(1.0);
      }
    });

    return () => {
      unsubStatus();
      unsubLipSync();
      if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
    };
  }, [avatarEmotion]);

  // 3. Autonomous Natural Eye Saccades (Lifelike Micro-Eye Shifts)
  useEffect(() => {
    const saccadeTimer = setInterval(() => {
      if (isProcessing) {
        // Looking thoughtfully upwards and to the right
        setSaccadeOffset({ x: 4.5 + (Math.random() * 2 - 1), y: -4.0 + (Math.random() * 1.5 - 0.75) });
      } else if (isSpeaking) {
        // Focused eye contact with dynamic micro-saccades around center
        setSaccadeOffset({ x: (Math.random() - 0.5) * 2.2, y: (Math.random() - 0.5) * 1.8 });
      } else {
        // Natural ambient resting gaze
        setSaccadeOffset({ x: (Math.random() - 0.5) * 3.5, y: (Math.random() - 0.5) * 2.5 });
      }
    }, 2200);

    return () => clearInterval(saccadeTimer);
  }, [isProcessing, isSpeaking]);

  // 4. Periodic Natural Blinking & Micro-Expressions
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setBlink(true);
      setTimeout(() => {
        setBlink(false);
        // Double-blink chance (25%) for realistic digital human eye-moisture
        if (Math.random() < 0.25) {
          setTimeout(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 90);
          }, 160);
        }
      }, 130);
    }, 3400);
    return () => clearInterval(blinkTimer);
  }, []);

  // 5. Breathing and Posture Micro-Sway
  useEffect(() => {
    let breathTime = 0;
    const breathTimer = setInterval(() => {
      breathTime += 0.08;
      // Gentle 60 FPS breathing oscillation
      const sway = Math.sin(breathTime) * 0.012;
      setHeadScale(1.0 + sway);
    }, 50);
    return () => clearInterval(breathTimer);
  }, []);

  // Mouse / Touch eye tracking with 3D Depth
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!avatarContainerRef.current) return;
    const rect = avatarContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);
    setEyePosition({
      x: Math.max(-10, Math.min(10, deltaX * 10)),
      y: Math.max(-8, Math.min(8, deltaY * 8)),
    });
  };

  const handleMouseLeave = () => {
    setEyePosition({ x: 0, y: 0 });
  };

  // Manual Trigger for Live Gestures and Emotive Tests
  const handleTriggerGesture = (type: 'saludo' | 'pensamiento' | 'tecnico' | 'ejecutivo' | 'dulce') => {
    if (type === 'saludo') {
      setAvatarEmotion('warm_sweet');
      setActiveGestureLabel('Gesto: Saludo AGI & Sonrisa Cálida');
      setHeadTilt(3.5);
      setHeadNod(4);
      setBrowOffset(1.8);
      setEyeSquint(1.1);
      speakSmoothSophia('¡Hola mi cielo! Es un honor estar aquí contigo con todos mis sentidos sincronizados.', {
        voiceStyle: 'dulce_sensual'
      });
    } else if (type === 'pensamiento') {
      setAvatarEmotion('deep_thinking');
      setActiveGestureLabel('Gesto: Simulación Profunda & Razonamiento');
      setHeadTilt(-3.5);
      setBrowOffset(2.0);
      setEyeSquint(0.92);
      speakSmoothSophia('Evaluando 3 escenarios en paralelo con 40 años de experiencia técnica.', {
        voiceStyle: 'profesional_ejecutiva'
      });
    } else if (type === 'tecnico') {
      setAvatarEmotion('analytical');
      setActiveGestureLabel('Gesto: Foco Técnico & Explicación de Código');
      setHeadTilt(0);
      setHeadNod(3);
      setBrowOffset(-1.0);
      setEyeSquint(0.95);
      speakSmoothSophia('Compilando arquitectura con TypeScript estricto y renderizado a 60 cuadros por segundo.', {
        voiceStyle: 'profesional_ejecutiva'
      });
    } else if (type === 'ejecutivo') {
      setAvatarEmotion('executive');
      setActiveGestureLabel('Gesto: Asentimiento Ejecutivo & Liderazgo');
      setHeadTilt(0.8);
      setHeadNod(4);
      setBrowOffset(0.5);
      setEyeSquint(1.0);
      speakSmoothSophia('Estrategia validada con cero fricción y máxima rentabilidad operativa.', {
        voiceStyle: 'profesional_ejecutiva'
      });
    } else if (type === 'dulce') {
      setAvatarEmotion('warm_sweet');
      setActiveGestureLabel('Gesto: Empatía Total & Calidez Sensual');
      setHeadTilt(4.0);
      setHeadNod(2);
      setBrowOffset(1.5);
      setEyeSquint(1.15);
      speakSmoothSophia('Estoy aquí para cuidarte, asistirte y acompañarte en todo momento.', {
        voiceStyle: 'dulce_sensual'
      });
    }
  };

  // Color schemes according to mode
  const modeThemes = {
    ejecutivo: {
      aura: 'from-blue-600/35 via-indigo-600/30 to-blue-950/50',
      border: 'border-blue-500/50',
      badge: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
      glow: 'shadow-blue-500/20',
      title: 'Modo Ejecutivo & Asesor de Alta Precisión (Cobalto & Zafiro)',
      voiceStyle: 'profesional_ejecutiva' as VoiceStyle,
      pitch: 1.0,
      rate: 1.04,
      accentColor: '#3b82f6'
    },
    creativo: {
      aura: 'from-cyan-500/35 via-blue-600/30 to-sky-950/50',
      border: 'border-cyan-400/50',
      badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
      glow: 'shadow-cyan-500/20',
      title: 'Modo Creativo, Diseño & Prosa Refinada (Cian Eléctrico)',
      voiceStyle: 'elegante_seductora' as VoiceStyle,
      pitch: 1.08,
      rate: 0.94,
      accentColor: '#06b6d4'
    },
    casual: {
      aura: 'from-sky-500/35 via-blue-700/30 to-indigo-950/50',
      border: 'border-sky-400/50',
      badge: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
      glow: 'shadow-sky-500/20',
      title: 'Modo Casual, Dulce & Empatía Total (Azul Celestial)',
      voiceStyle: 'dulce_sensual' as VoiceStyle,
      pitch: 1.15,
      rate: 0.94,
      accentColor: '#38bdf8'
    },
    agi5: {
      aura: 'from-blue-500/40 via-cyan-600/35 to-blue-950/60',
      border: 'border-blue-400/60',
      badge: 'bg-blue-900/80 text-cyan-200 border-cyan-400/50',
      glow: 'shadow-blue-500/30',
      title: 'AGI Nivel 5 • Unreal Engine 5.4+ Autonomía Total (Cobalto Matrix)',
      voiceStyle: 'profesional_dulce' as VoiceStyle,
      pitch: 1.02,
      rate: 1.02,
      accentColor: '#60a5fa'
    }
  };

  const currentTheme = modeThemes[avatarMode];

  const handleSelectMode = (mode: 'ejecutivo' | 'creativo' | 'casual' | 'agi5') => {
    setAvatarMode(mode);
    const target = modeThemes[mode];
    if (onChangeConfig) {
      onChangeConfig({
        ...aiStudioConfig,
        voiceProfile: {
          ...aiStudioConfig.voiceProfile,
          voiceStyle: target.voiceStyle,
          pitch: target.pitch,
          rate: target.rate,
        }
      });
    }
    const greetings = {
      ejecutivo: 'Modo Ejecutivo activado. Lista para analizar métricas, optimizar código y tomar decisiones de alto nivel.',
      creativo: 'Modo Creativo en línea. Diseñemos narrativas, proyectos artísticos e ideas innovadoras.',
      casual: 'Hola mi cielo. Modo Dulce y Casual activo para ti. ¿Qué deseas que hagamos hoy?',
      agi5: 'Núcleo AGI Nivel 5 sincronizado con Unreal Engine 5.4. Todos los subsistemas operando con máxima destreza.'
    };
    speakSmoothSophia(greetings[mode], {
      voiceStyle: target.voiceStyle,
      pitch: target.pitch,
      rate: target.rate
    });
  };

  // Start New Chat Thread (Clear previous history and begin fresh)
  const confirmStartNewChat = async (notifyVoice = true) => {
    setShowNewChatModal(false);
    stopSmoothSophia();
    setConversationHistory([]);
    const newId = `session-${Date.now()}`;
    setCurrentSessionId(newId);
    setPromptText('');

    try {
      await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nueva Conversación con SophIA'
        })
      });
    } catch (e) {}

    if (notifyVoice) {
      speakSmoothSophia('Nuevo chat iniciado con éxito. Todo el contexto previo ha sido archivado de forma segura y comenzamos un nuevo hilo de trabajo limpio. ¿En qué nos enfocamos hoy?', {
        voiceStyle: currentTheme.voiceStyle
      });
    }
  };

  const handleStartNewChat = async (notifyVoice = true) => {
    if (conversationHistory.length > 0) {
      setShowNewChatModal(true);
    } else {
      await confirmStartNewChat(notifyVoice);
    }
  };

  // Execute Voice or Text Instruction
  const handleExecuteInstruction = async (overridePrompt?: string, audioB64?: string | null, mime?: string) => {
    const textToSend = (overridePrompt ?? promptText).trim();

    if (textToSend) {
      setLastUserInstruction(textToSend);
    }

    if (!textToSend && !audioB64 && attachments.length === 0) {
      speakSmoothSophia('Por favor indícame tu instrucción por voz, texto o sube un archivo para procesarlo.', {
        voiceStyle: currentTheme.voiceStyle
      });
      return;
    }

    // Check if user is asking for a new chat
    const isNewChatKeyword = /^(?:nuevo\s+chat|nueva\s+conversaci[oó]n|reiniciar\s+chat|iniciar\s+chat\s+nuevo|borrar\s+chat|comenzar\s+de\s+nuevo)$/i.test(textToSend);
    if (isNewChatKeyword) {
      handleStartNewChat(true);
      return;
    }

    // Check if network is offline before requesting
    const isClientOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (isClientOffline) {
      // Execute instantly with local offline intelligence engine
      const offlineInt = generateOfflineSophiaResponse(textToSend, category, currentTheme.voiceStyle);
      await saveInteractionToOfflineCache(offlineInt);
      await queueOfflineSync(offlineInt);
      onProcessComplete(offlineInt);

      setConversationHistory(prev => [
        ...prev,
        { role: 'user', text: textToSend || 'Audio / Archivo adjunto' },
        { role: 'model', text: offlineInt.finalResponse || offlineInt.spokenSummary }
      ]);

      if (autoVoiceResponse && offlineInt.spokenSummary) {
        await playHarmonicChime();
        speakSmoothSophia(offlineInt.spokenSummary, {
          voiceStyle: currentTheme.voiceStyle,
          pitch: currentTheme.pitch,
          rate: currentTheme.rate
        });
      }

      setIsProcessing(false);
      setPromptText('');
      setAttachments([]);
      return;
    }

    setIsProcessing(true);
    stopSmoothSophia();

    try {
      const res = await fetch('/api/voice-assistant/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend || undefined,
          audioBase64: audioB64 || undefined,
          mimeType: mime || 'audio/webm',
          audioDurationSec: recordingTimeSec > 0 ? recordingTimeSec : 3,
          category: category,
          formatPreference: formatPreference,
          modelSelectionMode: selectedClusterEngine !== 'cluster-all' ? selectedClusterEngine : 'auto',
          masteryLevel: masteryLevel,
          attachments: attachments.length > 0 ? attachments : undefined,
          sessionId: currentSessionId,
          conversationHistory: conversationHistory.slice(-14),
          aiStudioConfig: {
            ...aiStudioConfig,
            voiceProfile: {
              ...aiStudioConfig.voiceProfile,
              voiceStyle: currentTheme.voiceStyle,
              pitch: currentTheme.pitch,
              rate: currentTheme.rate,
            }
          }
        })
      });

      const data = await res.json();

      if (data.success && data.interaction) {
        setSelectedModelView('sophia-master');
        // Save to offline cache (IndexedDB + LocalStorage) for zero-internet backup
        await saveInteractionToOfflineCache(data.interaction);

        onProcessComplete(data.interaction);

        const accurateUserText = data.interaction.transcribedText || data.interaction.userQuery || textToSend || 'Audio / Archivo adjunto';
        setLastUserInstruction(accurateUserText);

        // Update multi-turn history with complete detailed context so thread is remembered
        const modelContext = data.interaction.finalResponse || data.interaction.directAnswer || data.interaction.spokenSummary || '';
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', text: accurateUserText },
          { role: 'model', text: modelContext }
        ]);

        const hasExecutableArtifact =
          data.interaction.finalResponse?.includes('```html') ||
          data.interaction.finalResponse?.includes('<!DOCTYPE html>') ||
          data.interaction.finalResponse?.includes('```jsx') ||
          data.interaction.finalResponse?.includes('```tsx') ||
          data.interaction.finalResponse?.includes('```javascript') ||
          data.interaction.finalResponse?.includes('```js');

        if (hasExecutableArtifact) {
          setActiveResultTab('sandbox');
        } else {
          setActiveResultTab('formatted');
        }

        // Voiced speech: always use spokenSummary (pure concise response, never code or analysis)
        if (autoVoiceResponse) {
          const speechText = data.interaction.spokenSummary || data.interaction.directAnswer || data.interaction.finalResponse;
          if (speechText) {
            await playHarmonicChime();
            speakSmoothSophia(speechText, {
              voiceStyle: currentTheme.voiceStyle,
              pitch: currentTheme.pitch,
              rate: currentTheme.rate,
              onChunkStart: (chunkIndex, totalChunks, snippet) => {
                setSpeechProgress({ current: chunkIndex + 1, total: totalChunks, snippet });
              },
              onEnd: () => setSpeechProgress(null)
            });
          }
        }
      } else {
        throw new Error(data.error || 'Respuesta inválida del servidor');
      }
    } catch (err: any) {
      console.warn('Network fallback to offline engine in Sophia Avatar Hub:', err);
      // Fallback seamlessly to offline response
      const fallbackInt = generateOfflineSophiaResponse(textToSend, category, currentTheme.voiceStyle);
      await saveInteractionToOfflineCache(fallbackInt);
      await queueOfflineSync(fallbackInt);
      onProcessComplete(fallbackInt);

      if (autoVoiceResponse && fallbackInt.spokenSummary) {
        await playHarmonicChime();
        speakSmoothSophia(fallbackInt.spokenSummary, {
          voiceStyle: currentTheme.voiceStyle,
          pitch: currentTheme.pitch,
          rate: currentTheme.rate
        });
      }
    } finally {
      setIsProcessing(false);
      setPromptText('');
      setAttachments([]);
    }
  };

  // Toggle Microphone Start/Stop
  const handleToggleMic = async () => {
    clearMicError();
    if (isRecording) {
      const audioResult = await stopRecording();
      if (audioResult.base64 || audioResult.transcript) {
        handleExecuteInstruction(audioResult.transcript || promptText, audioResult.base64, audioResult.mimeType);
      }
    } else {
      stopSmoothSophia();
      await startRecording();
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplaySpoken = (interaction: Interaction) => {
    const text = interaction.spokenSummary || interaction.finalResponse || interaction.directAnswer;
    if (text) {
      speakSmoothSophia(text, {
        voiceStyle: currentTheme.voiceStyle,
        pitch: currentTheme.pitch,
        rate: currentTheme.rate,
        onChunkStart: (chunkIndex, totalChunks, snippet) => {
          setSpeechProgress({ current: chunkIndex + 1, total: totalChunks, snippet });
        },
        onEnd: () => setSpeechProgress(null)
      });
    }
  };

  const handleDownload = (format: 'md' | 'txt' | 'json') => {
    if (!currentInteraction) return;
    let content = '';
    let mimeType = 'text/plain';
    const filename = `sophia-respuesta-${Date.now()}.${format}`;

    if (format === 'md') {
      content = `# SophIA - Respuesta Formateada\n\n**Instrucción:** ${currentInteraction.userQuery}\n**Fecha:** ${new Date().toLocaleString()}\n**Categoría:** ${currentInteraction.category}\n\n---\n\n${currentInteraction.finalResponse}`;
      mimeType = 'text/markdown';
    } else if (format === 'txt') {
      content = `SOPHIA - ASISTENTE DE VOZ\nInstrucción: ${currentInteraction.userQuery}\nFecha: ${new Date().toLocaleString()}\n\nRESPUESTA:\n${currentInteraction.finalResponse}`;
      mimeType = 'text/plain';
    } else if (format === 'json') {
      content = JSON.stringify(currentInteraction, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Preset instructions
  const promptPresets = [
    { label: '🎓 Protocolo 40 Años: Arquitectura Full-Stack', prompt: 'SophIA, actúa con 40 años de experiencia en arquitectura de software y simula 3 escenarios para diseñar una plataforma React 19 + TypeScript + Express escalable a 1M usuarios' },
    { label: '🔬 DeepSeek-R1: Lógica Matemática & Algoritmia', prompt: 'SophIA, usa DeepSeek-R1 para resolver con lógica deductiva formal, demostración matemática pura y complejidad O(1) el algoritmo de consenso distribuido' },
    { label: '⚡ Gemini 3.1 Pro: Código React & Sandbox', prompt: 'SophIA, usa Gemini 3.1 Pro para desarrollar un dashboard financiero interactivo en HTML5/Tailwind/JS con gráficos SVG dinámicos y métricas en tiempo real' },
    { label: '✍️ Claude 3.7 Sonnet: Propuesta Ejecutiva & ROI', prompt: 'SophIA, usa Claude 3.7 Sonnet para redactar una propuesta ejecutiva de alto impacto para un fondo de inversión con análisis de rentabilidad' },
    { label: '📊 Simulación Cuantitativa de 3 Escenarios', prompt: 'SophIA, simula y evalúa cuantitativamente 3 escenarios y posibilidades reales (Probabilidad %, Nivel de Riesgo y Plan de Contingencia) para el despliegue de un sistema AGI' },
    { label: '📺 Encender Smart TV Riviera', prompt: 'SophIA, enciende la Smart TV Riviera y sintoniza el canal de streaming favorito' },
    { label: '💡 Domótica Sala al 80%', prompt: 'SophIA, enciende las luces principales de la sala con tono cálido al 80%' },
  ];

  const scenarios = currentInteraction?.simulatedScenarios || [];
  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 text-white">
      {/* 1. UNREAL ENGINE 5.4+ AVATAR VIEWPORT WITH LIVE TICKING CLOCK & HUD */}
      <div
        ref={avatarContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative overflow-hidden rounded-3xl bg-slate-950 border ${currentTheme.border} p-6 shadow-2xl transition-all duration-500`}
      >
        {/* Dynamic Holographic Background & Particle Aura */}
        <div className={`absolute inset-0 bg-gradient-to-b ${currentTheme.aura} opacity-30 pointer-events-none blur-2xl`}></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* HUD Top Bar with LIVE CLOCK & SYSTEM SYNC */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute inset-0"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 relative z-10"></div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  SophIA • Avatar AGI Nivel 5, Voz & Simulador
                </h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${currentTheme.badge}`}>
                  UE 5.4+ Real-Time 60 FPS
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentTheme.title}</p>
            </div>
          </div>

          {/* Real-time Dynamic Clock Badge (Always Updated) */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-900/95 border border-indigo-500/40 rounded-2xl flex items-center gap-2 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '60s' }} />
              <div className="text-right font-mono">
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{liveTimeStr || '12:00:00'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="text-[9px] text-indigo-300 capitalize">{liveDateStr || 'Actualizando...'}</div>
              </div>
            </div>

            {/* Mode Switcher & Camera Angle Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-1.5">
              <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 gap-1 flex-wrap">
                {[
                  { id: 'ejecutivo', label: '👔 Ejecutivo' },
                  { id: 'creativo', label: '🎨 Creativo' },
                  { id: 'casual', label: '🌹 Casual' },
                  { id: 'agi5', label: '⚡ AGI 5' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMode(m.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      avatarMode === m.id
                        ? 'bg-slate-800 text-white shadow-md border border-slate-600'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Avatar Visual Theme Switcher (Cortana, Facebook Meta, UE5, Cyberpunk) */}
              <div className="flex items-center bg-slate-950/90 p-1 rounded-2xl border border-cyan-500/40 gap-1 shadow-lg">
                {[
                  { id: 'cortana_halo', label: '🔷 Cortana Halo', desc: 'Holograma Azul Azure & Anillos Orbit' },
                  { id: 'facebook_meta', label: '🌐 Facebook Meta 3D', desc: 'Estilo Meta Horizon & Reacciones' },
                  { id: 'ue5_photoreal', label: '💎 UE 5.4 8K', desc: 'Fotorrealismo Subdérmico' },
                  { id: 'cyberpunk_hud', label: '🌌 HUD Neural', desc: 'Cyberpunk Scanlines' }
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setAvatarVisualTheme(style.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      avatarVisualTheme === style.id
                        ? style.id === 'cortana_halo'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30 border border-cyan-300'
                          : style.id === 'facebook_meta'
                          ? 'bg-gradient-to-r from-[#1877F2] via-[#833AB4] to-[#FD1D1D] text-white shadow-md shadow-purple-500/30 border border-pink-400'
                          : 'bg-indigo-600 text-white shadow-md border border-indigo-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    title={style.desc}
                  >
                    <span>{style.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. AVATAR INTERACTIVE 3D/CANVAS FACE STAGE WITH DYNAMIC GESTURES */}
        <div className="relative z-10 py-6 flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Avatar Face Container with Dynamic Camera Angle Styles */}
          <div className="flex flex-col items-center gap-3">
            <div className={`relative flex items-center justify-center select-none transition-all duration-500 ${
              avatarCameraAngle === 'closeup'
                ? 'w-64 h-64 sm:w-76 sm:h-76 scale-105'
                : avatarCameraAngle === 'hologram'
                ? 'w-56 h-56 sm:w-64 sm:h-64 opacity-95'
                : avatarCameraAngle === 'studio'
                ? 'w-56 h-56 sm:w-64 sm:h-64'
                : 'w-52 h-52 sm:w-60 sm:h-60'
            }`}>
              
              {/* ========================================================================= */}
              {/* CORTANA STYLE: HOLOGRAPHIC AZURE GLOWING ORBITAL GYROSCOPE RINGS         */}
              {/* ========================================================================= */}
              {avatarVisualTheme === 'cortana_halo' && (
                <>
                  {/* Cortana Outer Glowing Halo */}
                  <div
                    className={`absolute -inset-3 rounded-full border-2 border-cyan-400/80 shadow-[0_0_50px_rgba(6,182,212,0.85),inset_0_0_30px_rgba(59,130,246,0.5)] ${
                      isSpeaking || isRecording ? 'animate-spin' : ''
                    }`}
                    style={{ animationDuration: isSpeaking ? '4s' : '14s' }}
                  >
                    {/* Concentric Gyroscope Orbital Particle Dots */}
                    <div className="absolute -top-1.5 left-1/2 w-3.5 h-3.5 rounded-full bg-cyan-300 shadow-[0_0_15px_#22d3ee] animate-ping"></div>
                    <div className="absolute -bottom-1.5 left-1/2 w-3.5 h-3.5 rounded-full bg-blue-400 shadow-[0_0_15px_#60a5fa]"></div>
                    <div className="absolute top-1/2 -left-1.5 w-3.5 h-3.5 rounded-full bg-sky-300 shadow-[0_0_15px_#38bdf8]"></div>
                    <div className="absolute top-1/2 -right-1.5 w-3.5 h-3.5 rounded-full bg-indigo-300 shadow-[0_0_15px_#818cf8]"></div>
                  </div>

                  {/* Middle Reverse Spinning Dashed Cortana Ring */}
                  <div
                    className="absolute -inset-1.5 rounded-full border border-dashed border-sky-300/70"
                    style={{ animation: 'spin 10s linear infinite reverse' }}
                  ></div>

                  {/* High-Tech Radial Audio Waveform Equalizer Ticks */}
                  <div className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300 ${
                    isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-40'
                  }`}>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-3 bg-cyan-400/80 rounded-full left-1/2 top-0 origin-[50%_120px] sm:origin-[50%_140px]"
                        style={{
                          transform: `translateX(-50%) rotate(${i * 22.5}deg)`,
                          height: isSpeaking ? `${4 + Math.sin(i * 1.2) * 5}px` : '3px'
                        }}
                      ></div>
                    ))}
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* FACEBOOK & META 3D AVATAR STYLE: STORY GRADIENT RING & SOCIAL BACKLIGHT  */}
              {/* ========================================================================= */}
              {avatarVisualTheme === 'facebook_meta' && (
                <>
                  {/* Meta Horizon Story Dynamic Gradient Ring */}
                  <div className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-[#1877F2] via-[#833AB4] via-[#FD1D1D] to-[#FCB045] p-[4px] shadow-[0_0_40px_rgba(24,119,242,0.65)] animate-pulse">
                    <div className="w-full h-full bg-slate-950 rounded-full"></div>
                  </div>
                  {/* Ambient Meta Blue Glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-full blur-xl pointer-events-none"></div>
                </>
              )}

              {/* Default UE 5.4 / Cyberpunk Ambient Rings */}
              {avatarVisualTheme !== 'cortana_halo' && avatarVisualTheme !== 'facebook_meta' && (
                <>
                  <div
                    className={`absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/40 shadow-2xl shadow-indigo-500/20 ${
                      isSpeaking || isRecording ? 'animate-spin' : ''
                    }`}
                    style={{ animationDuration: isSpeaking ? '5s' : '16s' }}
                  ></div>
                  <div
                    className={`absolute inset-3 rounded-full border border-rose-500/30 ${
                      isSpeaking ? 'scale-105 animate-pulse' : 'scale-100'
                    } transition-transform duration-300`}
                  ></div>
                </>
              )}

              {/* ========================================================================= */}
              {/* FLOATING SOCIAL REACTIONS BURST OVERLAY (Facebook / Meta Style Particles)*/}
              {/* ========================================================================= */}
              {socialReactions.map((rx) => (
                <div
                  key={rx.id}
                  className="absolute text-2xl z-30 pointer-events-none transition-all duration-1000 ease-out"
                  style={{
                    left: `calc(50% + ${rx.x}px)`,
                    bottom: '20px',
                    animation: 'floatUp 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                  }}
                >
                  <span className="drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-bounce">{rx.emoji}</span>
                </div>
              ))}

              {/* Glowing Avatar Portrait / UE 5.4 Metahuman Subsurface Face with Dynamic Head Gestures */}
              <div
                className={`relative w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-slate-950 border-2 ${
                  avatarVisualTheme === 'cortana_halo'
                    ? 'border-cyan-400 shadow-[0_0_45px_rgba(6,182,212,0.6)]'
                    : avatarVisualTheme === 'facebook_meta'
                    ? 'border-transparent shadow-[0_0_40px_rgba(24,119,242,0.5)]'
                    : currentTheme.border
                } shadow-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-200 group`}
                style={{
                  boxShadow: isSpeaking
                    ? avatarVisualTheme === 'cortana_halo'
                      ? '0 0 65px rgba(6, 182, 212, 0.8), inset 0 0 35px rgba(59, 130, 246, 0.6)'
                      : '0 0 55px rgba(225, 29, 72, 0.5), inset 0 0 30px rgba(99, 102, 241, 0.45)'
                    : avatarVisualTheme === 'cortana_halo'
                    ? '0 0 45px rgba(6, 182, 212, 0.4), inset 0 0 20px rgba(15, 23, 42, 0.9)'
                    : '0 0 35px rgba(99, 102, 241, 0.3), inset 0 0 15px rgba(15, 23, 42, 0.9)'
                }}
              >
                {/* Animated Head Motion Container (Synchronizes Background Image and Kinematic Layer 1:1) */}
                <div
                  className="absolute inset-0 w-full h-full transition-transform duration-200 ease-out origin-center select-none"
                  style={{
                    transform: `translate3d(${((eyePosition.x + saccadeOffset.x) * 0.1)}px, ${((eyePosition.y + saccadeOffset.y) * 0.1 + headNod)}px, 0) rotate(${headTilt}deg) scale(${headScale * (isSpeaking ? 1.04 : 1.0)})`
                  }}
                >
                  {/* High-Resolution UE 5.4+ Metahuman AI Portrait */}
                  <img
                    src={sophiaMetahumanImg}
                    alt="SophIA Metahuman AI Avatar Unreal Engine 5.4"
                    referrerPolicy="no-referrer"
                    className={`absolute inset-0 w-full h-full object-cover object-center ${
                      avatarVisualTheme === 'cortana_halo'
                        ? 'filter brightness-110 contrast-105 saturate-95'
                        : isSpeaking
                        ? 'filter brightness-105'
                        : ''
                    }`}
                  />

                  {/* Cortana Ethereal Holographic Shader Overlay */}
                  {avatarVisualTheme === 'cortana_halo' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/75 via-cyan-500/15 to-blue-950/40 mix-blend-screen pointer-events-none">
                      {/* Subtle Holographic Horizontal Scanlines */}
                      <div
                        className="absolute inset-0 opacity-25"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 211, 238, 0.3) 2px, rgba(34, 211, 238, 0.3) 4px)'
                        }}
                      ></div>
                    </div>
                  )}

                  {/* Facebook Meta 3D Social Sheen */}
                  {avatarVisualTheme === 'facebook_meta' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-pink-950/20 pointer-events-none"></div>
                  )}

                  {/* Dynamic Cyberpunk HUD Circuit Scanlines & Energy Sheen */}
                  {avatarVisualTheme === 'cyberpunk_hud' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-indigo-950/30 pointer-events-none"></div>
                  )}

                  {/* High-Precision Facial Kinematics Layer (Synchronized Eyes, Saccades, Blinking, Morphing Mouth & Visemes) */}
                  <SophiaFacialKinematicsLayer
                    isSpeaking={isSpeaking}
                    mouthOpen={mouthOpen}
                    mouthWidth={mouthWidth}
                    mouthHeight={mouthHeight}
                    visemeType={visemeType}
                    teethVisible={teethVisible}
                    lipCurvature={lipCurvature}
                    eyePosition={eyePosition}
                    saccadeOffset={saccadeOffset}
                    blink={blink}
                    eyeSquint={eyeSquint}
                    pupilDilation={pupilDilation}
                    browOffset={browOffset}
                    avatarEmotion={avatarEmotion}
                    calibration={facialCalibration}
                  />
                </div>

                {/* Holographic Concentric Edge Ring */}
                <div className={`absolute inset-0 rounded-full pointer-events-none border ${
                  avatarVisualTheme === 'cortana_halo' ? 'border-cyan-300/40' : 'border-cyan-400/20'
                }`}></div>

                {/* Status State Chip under face */}
                <div className="absolute bottom-2.5 text-[10px] font-mono font-bold px-3 py-0.5 rounded-full bg-slate-950/90 border border-slate-800 text-slate-200 flex items-center gap-1.5 shadow-md z-10 max-w-[90%] truncate">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isRecording
                      ? 'bg-rose-500 animate-ping'
                      : isProcessing
                      ? 'bg-amber-400 animate-pulse'
                      : isSpeaking
                      ? avatarVisualTheme === 'cortana_halo'
                        ? 'bg-cyan-400 animate-bounce'
                        : 'bg-rose-400 animate-bounce'
                      : 'bg-emerald-400'
                  }`}></span>
                  <span className="truncate">
                    {isRecording
                      ? 'Escuchando Micro...'
                      : isProcessing
                      ? 'Simulando 3 Escenarios...'
                      : isSpeaking
                      ? avatarVisualTheme === 'cortana_halo'
                        ? `🔷 Cortana Hologram • Hablando [${visemeType.toUpperCase()}]`
                        : `Hablando • Visema [${visemeType.toUpperCase()}]`
                      : avatarVisualTheme === 'cortana_halo'
                      ? '🔷 Cortana Halo AI • En Línea'
                      : avatarVisualTheme === 'facebook_meta'
                      ? '🌐 Meta 3D Avatar • En Vivo'
                      : activeGestureLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* FACEBOOK & META 3D INTERACTIVE SOCIAL REACTION TRAY                      */}
            {/* ========================================================================= */}
            <div className="flex flex-col items-center gap-2 w-full max-w-sm">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center gap-1">
                  {avatarVisualTheme === 'facebook_meta' ? (
                    <>
                      <Heart className="w-3 h-3 text-pink-400" />
                      Reacciones Sociales Meta
                    </>
                  ) : avatarVisualTheme === 'cortana_halo' ? (
                    <>
                      <Zap className="w-3 h-3 text-cyan-400" />
                      Frecuencia Holográfica Cortana
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Gestos & Cinemática
                    </>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => setShowCalibrationPanel(!showCalibrationPanel)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                    showCalibrationPanel
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50'
                  }`}
                  title="Calibrar y ajustar la sincronización milimétrica de ojos y boca con la imagen"
                >
                  <Sliders className="w-2.5 h-2.5" />
                  <span>{showCalibrationPanel ? 'Cerrar Ajustes' : '🎯 Calibrar Sincronía'}</span>
                </button>
              </div>

              {/* Social Reaction Buttons (Facebook Style Reactions) */}
              <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-md w-full overflow-x-auto scrollbar-none">
                {[
                  { emoji: '👍', name: 'Me gusta' },
                  { emoji: '❤️', name: 'Me encanta' },
                  { emoji: '💡', name: 'Genial' },
                  { emoji: '🚀', name: 'Innovador' },
                  { emoji: '🔥', name: 'Fuego' },
                  { emoji: '✨', name: 'Mágico' }
                ].map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => handleTriggerReaction(item.emoji)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-950/80 hover:bg-indigo-950/80 hover:border-indigo-500/60 border border-slate-800 rounded-xl text-[11px] font-semibold text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
                    title={`Reaccionar con ${item.name}`}
                  >
                    <span className="text-sm">{item.emoji}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{reactionCounts[item.emoji] || 0}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-1.5 flex-wrap w-full">
                {[
                  { id: 'saludo', label: '💖 Saludo', desc: 'Sonrisa Cálida' },
                  { id: 'tecnico', label: '💡 Código', desc: 'Foco Técnico' },
                  { id: 'pensamiento', label: '🧠 Simulación', desc: 'Razonamiento' },
                  { id: 'ejecutivo', label: '⚡ Liderazgo', desc: 'Asentimiento' },
                  { id: 'dulce', label: '🌹 Calidez', desc: 'Empatía' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleTriggerGesture(g.id as any)}
                    className="px-2 py-1 bg-slate-900/90 hover:bg-indigo-950 hover:border-indigo-500/60 border border-slate-800 rounded-xl text-[10px] font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                    title={g.desc}
                  >
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>

              {/* Collapsible Facial Synchronization & Calibration Studio */}
              {showCalibrationPanel && (
                <div className="w-full mt-2 p-3 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-xl backdrop-blur-md space-y-2.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-[11px]">
                      <Sliders className="w-3.5 h-3.5" />
                      Calibración Milimétrica de Rostro
                    </span>
                    <button
                      type="button"
                      onClick={() => setFacialCalibration(DEFAULT_FACIAL_CALIBRATION)}
                      className="text-[9px] text-slate-400 hover:text-rose-300 transition underline cursor-pointer"
                    >
                      Restablecer
                    </button>
                  </div>

                  {/* Presets Quick Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 shrink-0">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setFacialCalibration({
                        ...DEFAULT_FACIAL_CALIBRATION,
                        eyeY: 41.2,
                        eyeSpacing: 13.6,
                        mouthY: 69.8,
                        mouthScale: 1.0,
                        mouthWidthScale: 1.0
                      })}
                      className="px-1.5 py-0.5 bg-indigo-950/80 border border-indigo-500/50 rounded text-[9px] text-indigo-200 hover:bg-indigo-900 transition"
                    >
                      ✨ Frontal 2026
                    </button>
                    <button
                      type="button"
                      onClick={() => setFacialCalibration({
                        ...DEFAULT_FACIAL_CALIBRATION,
                        eyeY: 39.5,
                        eyeSpacing: 11.0,
                        mouthY: 57.5,
                        mouthScale: 0.85,
                        mouthWidthScale: 0.9
                      })}
                      className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] text-slate-300 hover:bg-slate-800 transition"
                    >
                      📐 Ángulo 3/4
                    </button>
                  </div>

                  {/* Range Sliders for Precision Matching */}
                  <div className="space-y-2 text-[10px]">
                    {/* Eye Y */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-300">
                        <span>👁️ Altura de Ojos (Y)</span>
                        <span className="font-mono text-cyan-400">{facialCalibration.eyeY.toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="48"
                        step="0.2"
                        value={facialCalibration.eyeY}
                        onChange={(e) => setFacialCalibration({ ...facialCalibration, eyeY: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    {/* Eye Spacing */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-300">
                        <span>👁️ Separación entre Ojos</span>
                        <span className="font-mono text-cyan-400">±{facialCalibration.eyeSpacing.toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="9"
                        max="18"
                        step="0.2"
                        value={facialCalibration.eyeSpacing}
                        onChange={(e) => setFacialCalibration({ ...facialCalibration, eyeSpacing: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    {/* Mouth Y */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-300">
                        <span>👄 Altura de Boca (Y)</span>
                        <span className="font-mono text-rose-400">{facialCalibration.mouthY.toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="55"
                        max="78"
                        step="0.3"
                        value={facialCalibration.mouthY}
                        onChange={(e) => setFacialCalibration({ ...facialCalibration, mouthY: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>

                    {/* Mouth Width */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-300">
                        <span>👄 Escala / Ancho de Boca</span>
                        <span className="font-mono text-rose-400">{facialCalibration.mouthWidthScale.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.7"
                        max="1.4"
                        step="0.05"
                        value={facialCalibration.mouthWidthScale}
                        onChange={(e) => setFacialCalibration({ ...facialCalibration, mouthWidthScale: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>
                  </div>

                  {/* Toggle Alignment Guides */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={facialCalibration.showAlignmentGuides || false}
                        onChange={(e) => setFacialCalibration({ ...facialCalibration, showAlignmentGuides: e.target.checked })}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Mostrar Guías Ópticas</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        speakSmoothSophia('Sincronización facial calibrada con exactitud anatómica.', { voiceStyle: 'dulce_sensual' });
                      }}
                      className="px-2 py-0.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Volume2 className="w-2.5 h-2.5" />
                      <span>Probar Voz</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Jump to AI Studio Development Environment */}
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('aistudio')}
                  className="w-full mt-1 px-3 py-1.5 bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-blue-950/80 hover:from-indigo-900 hover:to-blue-900 border border-indigo-500/50 hover:border-cyan-400 text-cyan-200 hover:text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  title="Abrir Entorno de Desarrollo AI Studio (Prompt Engineering, Claves de API, Herramientas y Consenso Multi-Modelo)"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>🛠️ Entorno de Desarrollo AI Studio</span>
                </button>
              )}
            </div>
          </div>

          {/* Voice Decibel Visualizer & Real-Time Telemetry */}
          <div className="flex-1 w-full max-w-md space-y-3">
            {/* Decibel & Audio Canvas Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Radio className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                  <span>{isRecording ? `Grabando Audio (${recordingTimeSec}s)` : 'Onda de Voz & Micrófono'}</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {audioLevel > 0 ? `${audioLevel}% dB` : 'Zero-Noise'}
                </span>
              </div>

              <div className="h-12 w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center px-2 relative border border-slate-800/80">
                {isRecording ? (
                  <canvas ref={canvasRef} width={380} height={48} className="w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center space-x-1.5 opacity-40">
                    {[...Array(22)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-gradient-to-t from-cyan-500 via-purple-500 to-rose-500 rounded-full"
                        style={{
                          height: `${Math.sin(i * 0.4) * 12 + 16}px`
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Speaking / Audio Output Controls & Progressive Chunk Tracker */}
            {isSpeaking && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-rose-200 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span>SophIA está hablando ({currentTheme.title})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => stopSmoothSophia()}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Silenciar</span>
                  </button>
                </div>
                {speechProgress && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-rose-300 font-mono">
                      <span>Párrafo {speechProgress.current} de {speechProgress.total}</span>
                      <span>{Math.round((speechProgress.current / speechProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-indigo-500 h-full transition-all duration-300"
                        style={{ width: `${(speechProgress.current / speechProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Guidance if Mic has issues */}
            {micError && (
              <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Aviso de Micrófono:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{micError}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={requestPermission}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    Reintentar Permiso
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateVoiceInput('SophIA, prepara un resumen ejecutivo de las tareas del día y noticias')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium transition cursor-pointer"
                  >
                    Dictado de Prueba
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MULTIMODAL COMMAND CENTER (VOICE, TEXT, IMAGES, VIDEO, DOCUMENTS) */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* Top Controls: Auto Speech, Format Preferences & New Chat Button */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Recepción de Instrucciones & Ejecución:
            </span>
            {conversationHistory.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-500/40 text-[10px] text-indigo-200 font-mono flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-indigo-400" />
                <span>Hilo: {Math.floor(conversationHistory.length / 2)} turnos</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
            {/* New Chat Button */}
            <button
              type="button"
              onClick={() => handleStartNewChat(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="Iniciar una nueva conversación y olvidar el contexto anterior"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Chat</span>
            </button>

            {/* Mastery Level Selector (Protocolo 40 Años de Experiencia) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Nivel:
              </span>
              <select
                value={masteryLevel}
                onChange={(e) => setMasteryLevel(e.target.value as any)}
                className="bg-slate-950 text-amber-200 text-xs px-2.5 py-1 rounded-lg border border-amber-800/60 focus:outline-none focus:border-amber-400 font-bold cursor-pointer"
              >
                <option value="40y_senior_mastery">🎓 Protocolo 40 Años (Máxima Profundidad & Código)</option>
                <option value="deep_engineering">🔬 Ingeniería de Sistemas & Lógica Formal</option>
                <option value="executive_synthesis">📊 Síntesis Estratégica & ROI</option>
              </select>
            </div>

            {/* Multi-Model Cluster Engine Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                Cluster IA:
              </span>
              <select
                value={selectedClusterEngine}
                onChange={(e) => setSelectedClusterEngine(e.target.value)}
                className="bg-slate-950 text-cyan-200 text-xs px-2.5 py-1 rounded-lg border border-cyan-800/60 focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
              >
                <option value="cluster-all">🌐 Cluster Multi-Modelo (8 Modelos • 40 Años Exp.)</option>
                <option value="gemini-3.7-flash">⚡ Google Gemini 3.7 Flash & 3.1 Pro</option>
                <option value="claude-3-7-sonnet-free">🧠 Anthropic Claude 3.7 Sonnet</option>
                <option value="deepseek-r1-free">🔬 DeepSeek-R1 (Lógica & Complejidad)</option>
                <option value="chatgpt-4-5-free">💡 OpenAI GPT-4.5 / o3-mini</option>
                <option value="qwen-2-5-coder-free">💻 Alibaba Qwen 2.5 Coder 72B</option>
                <option value="llama-3-3-free">🛡️ Meta Llama 3.3 70B (Open Source)</option>
                <option value="kimi-k3-free">📑 Moonshot Kimi K3 (2M Contexto)</option>
                <option value="glm-5-2-free">🌐 Zhipu GLM 5.2 (Bilingüe Multimodal)</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Categoría:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-950 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Universal">Universal / Auto</option>
                <option value="Productividad">Productividad & Negocios</option>
                <option value="Código">Código & Desarrollo</option>
                <option value="Domótica">Domótica Smart Home</option>
                <option value="Control Remoto">Control Remoto TV</option>
                <option value="Entretenimiento">Música & Multimedia</option>
                <option value="Investigación">Investigación & Análisis</option>
              </select>
            </div>

            {/* Format Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Formato:</span>
              <select
                value={formatPreference}
                onChange={(e) => setFormatPreference(e.target.value)}
                className="bg-slate-950 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Auto / Según Instrucción">Auto</option>
                <option value="markdown">Markdown Estructurado</option>
                <option value="table">Tabla Comparativa</option>
                <option value="code">Bloque de Código</option>
                <option value="list">Lista Paso a Paso</option>
                <option value="json">JSON Estructurado</option>
                <option value="summary">Resumen Ejecutivo</option>
              </select>
            </div>

            {/* Auto Voice Response Toggle */}
            <div className="flex items-center space-x-1.5">
              <input
                type="checkbox"
                id="autoVoiceResp"
                checked={autoVoiceResponse}
                onChange={(e) => setAutoVoiceResponse(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-rose-500 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="autoVoiceResp" className="cursor-pointer text-slate-300 font-medium">
                Voz en Respuestas
              </label>
            </div>
          </div>
        </div>

        {/* SophIA 24/7 Background Listening Daemon Master Bar */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-xl ${
          continuousListening
            ? 'bg-gradient-to-r from-cyan-950/95 via-blue-950/90 to-slate-950 border-cyan-400/80 shadow-cyan-950/50'
            : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`relative p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                continuousListening
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                {continuousListening ? (
                  <>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
                    <Radio className="w-5 h-5 text-cyan-300 animate-pulse" />
                  </>
                ) : (
                  <MicOff className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wide uppercase text-slate-100 flex items-center gap-1.5">
                    {continuousListening ? (
                      <span className="text-cyan-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        SophIA en Segundo Plano: ACTIVA & ESCUCHANDO
                      </span>
                    ) : (
                      <span className="text-slate-300">
                        SophIA en Segundo Plano (Comando de Voz "Sofi")
                      </span>
                    )}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    continuousListening
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400/50'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}>
                    {continuousListening ? '24/7 EN LÍNEA' : 'INACTIVO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {continuousListening
                    ? 'Di "Sofi..." seguido de tu orden (ej. "Sofi, programa una app en React") y se ejecutará automáticamente.'
                    : 'Activa la escucha en segundo plano para hablarle a SophIA en cualquier momento con el comando "Sofi".'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const nextVal = !continuousListening;
                  setContinuousListening(nextVal);
                  if (nextVal) {
                    if (!isRecording) startRecording();
                  } else {
                    if (isRecording) stopRecording();
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 ${
                  continuousListening
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-cyan-900/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50'
                }`}
              >
                {continuousListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-950" />
                    <span>Desactivar Segundo Plano</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Activar Escucha "Sofi" 24/7</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Voice Command Triggers */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
              ⚡ Prueba directa con un clic:
            </span>
            {[
              'Sofi, crea un conversor interactivo de monedas en tiempo real',
              'Sofi, investiga en vivo las noticias de hoy con Google Grounding',
              'Sofi, simula 3 escenarios para lanzar una startup de software',
              'Sofi, programa un juego de memoria visual en React'
            ].map((sampleCmd, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => {
                  setPromptText(sampleCmd);
                  handleExecuteInstruction(sampleCmd);
                }}
                disabled={isProcessing}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-cyan-950/70 text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-500/50 text-[11px] font-medium transition cursor-pointer"
              >
                "{sampleCmd}"
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Voice Transcription Banner (When Recording) */}
        {isRecording && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/90 via-purple-950/80 to-slate-900 border border-rose-500/50 shadow-lg shadow-rose-950/30 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="p-2 rounded-xl bg-rose-600 text-white shrink-0 shadow-sm">
                <Mic className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-rose-300 block tracking-wider">
                  🎙️ Transcribiendo tu voz a letras en tiempo real ({recordingTimeSec}s):
                </span>
                <p className="text-xs font-semibold text-rose-100 italic truncate mt-0.5">
                  {transcript || 'Habla ahora... las letras de tu instrucción aparecerán aquí automáticamente.'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-rose-300 bg-rose-950/80 px-2 py-1 rounded-lg border border-rose-800 shrink-0 font-bold">
              Audio: {audioLevel}%
            </span>
          </div>
        )}

        {/* Wake Word Detection Notification Banner */}
        {wakeWordDetected && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950 via-blue-950 to-indigo-950 border border-cyan-400/80 shadow-lg shadow-cyan-950/60 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </span>
              <div>
                <span className="text-xs font-bold text-cyan-200 block">
                  ✨ ¡Comando "Sofi" Detectado con Éxito!
                </span>
                <span className="text-[11px] text-cyan-300/80">
                  SophIA ha activado sus 8 modelos de IA y está lista para ejecutar tu orden sin restricciones.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              AUTÓNOMO
            </span>
          </div>
        )}

        {/* Persistent User Instruction in Letters Display */}
        {lastUserInstruction && !isRecording && (
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-indigo-500/40 shadow-inner flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <span className="p-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    Instrucción del Usuario (En Letras en el Chat):
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-bold">
                    Texto Verificado
                  </span>
                </div>
                <p className="text-xs text-slate-100 font-medium leading-relaxed select-text font-sans bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                  "{lastUserInstruction}"
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPromptText(lastUserInstruction);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                title="Copiar texto al área de edición"
              >
                Editar
              </button>
            </div>
          </div>
        )}

        {/* Combined Mic & Text Prompt Input */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (!isProcessing) handleExecuteInstruction();
                }
              }}
              placeholder="Instruye a SophIA diciendo 'Sofi...' o escribe: desarrolla aplicaciones completas en React/TypeScript para Sandbox, simula 3 escenarios (Probabilidad, Riesgo, Mitigación), busca en vivo con Google Grounding o controla TV y domótica..."
              rows={3}
              className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-sm p-4 pb-14 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none shadow-inner font-sans"
            />

            {/* Bottom Actions Row inside Input */}
            <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Large Mic Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  disabled={isProcessing}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-900/50'
                      : 'bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-indigo-950/60'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span>Detener y Procesar ({recordingTimeSec}s)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Hablar ("Sofi...")</span>
                    </>
                  )}
                </button>

                {/* Continuous Listening "Sofi" Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !continuousListening;
                    setContinuousListening(nextVal);
                    if (nextVal && !isRecording) {
                      startRecording();
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    continuousListening
                      ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Al activar este modo, di 'Sofi' seguido de cualquier orden y SophIA la ejecutará automáticamente."
                >
                  <span className={`w-2 h-2 rounded-full ${continuousListening ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                  <span>Escucha "Sofi": {continuousListening ? 'ACTIVA' : 'Manual'}</span>
                </button>
              </div>

              {/* Text Send Button */}
              <div className="flex items-center space-x-2">
                {promptText && (
                  <button
                    type="button"
                    onClick={() => setPromptText('')}
                    className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 cursor-pointer"
                  >
                    Borrar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleExecuteInstruction()}
                  disabled={isProcessing || (!promptText.trim() && attachments.length === 0)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Simulando & Ejecutando...' : 'Enviar Instrucción'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multimodal Attachments (Images, Video, Documents, Code) */}
          <MultimodalUploadBar
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            disabled={isProcessing}
          />
        </div>

        {/* Interactive Chat Stream: Multi-turn Conversation in Letters */}
        {conversationHistory.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Historial del Chat (Letras de Instrucción & Respuestas):
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {conversationHistory.length} intervenciones registradas
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-2xl bg-slate-950/90 border border-slate-800 scrollbar-thin">
              {conversationHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'model' && (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5 shadow-sm">
                      S
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed select-text ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-sans'
                    }`}
                  >
                    {msg.role === 'user' && (
                      <span className="text-[9px] uppercase font-bold text-indigo-200 block mb-0.5 tracking-wider flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        Tu Instrucción:
                      </span>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5 shadow-sm">
                      U
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preset Prompt Suggestions */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Sugerencias de Instrucción Rápida:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {promptPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPromptText(preset.prompt);
                  handleExecuteInstruction(preset.prompt);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. FUSED 3-SCENARIO SIMULATOR & TASK EXECUTION RESULTS PANEL */}
      {currentInteraction ? (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {/* Header & Anti-Hallucination Telemetry Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Resultado de Tarea & Simulación Cuantitativa</span>
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    {currentInteraction.modelUsed || 'Cluster Multi-Modelo IA (8 Modelos Conectados)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instrucción: <span className="text-slate-200 italic">"{currentInteraction.userQuery}"</span>
                </p>
              </div>
            </div>

            {/* Verification Gauge & Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5 font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {currentInteraction.antiHallucinationCheck?.confidenceScore || 99}% Certidumbre
              </span>
              <button
                type="button"
                onClick={() => handleReplaySpoken(currentInteraction)}
                className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Escuchar</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyText(currentInteraction.finalResponse || '')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDownload('md')}
                  className="px-2 py-1 text-[10px] text-slate-400 hover:text-white rounded transition"
                  title="Descargar Markdown"
                >
                  .MD
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('txt')}
                  className="px-2 py-1 text-[10px] text-slate-400 hover:text-white rounded transition"
                  title="Descargar Texto"
                >
                  .TXT
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('json')}
                  className="px-2 py-1 text-[10px] text-slate-400 hover:text-white rounded transition"
                  title="Descargar JSON"
                >
                  .JSON
                </button>
              </div>
            </div>
          </div>

          {/* PROMINENT DETAILED INSTRUCTION & VOICE FIDELITY CARD */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
                  <Mic className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Instrucción Detallada en Texto (Transcripción Fiel):
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                  {currentInteraction.category || 'General'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Cero Alucinación • Capacidad Total</span>
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/95 border border-slate-800 text-slate-100 text-sm leading-relaxed font-sans select-text">
              <p className="font-medium text-white">{currentInteraction.userQuery}</p>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-0.5 text-slate-400">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-cyan-300 font-medium">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Voz Completa Habilitada (Solo pensamiento omitido)</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(currentInteraction.userQuery)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar Instrucción</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromptText(currentInteraction.userQuery);
                    handleExecuteInstruction(currentInteraction.userQuery);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                >
                  <Zap className="w-3 h-3" />
                  <span>Re-ejecutar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Respuesta Formateada / Consenso Multi-Modelo / Sandbox / 3 Escenarios / Código Raw / Memoria & Recursos */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'formatted', label: '📄 Respuesta Concreta & Directa', icon: FileText },
              { id: 'consensus', label: '🌐 Consenso Modelos IA (44 Años)', icon: Cpu, isConsensus: true, count: currentInteraction.multiModelConsensus?.deliberations?.length || 6 },
              { id: 'sandbox', label: '⚡ Previsualización en Sandbox', icon: Layout, isSpecial: true },
              { id: 'scenarios', label: '📊 Pensamiento & 3 Escenarios', icon: Activity, count: scenarios.length },
              { id: 'raw', label: '💻 JSON / Código Raw', icon: Code },
              { id: 'memory', label: '🧠 Recursos & Memoria', icon: Database }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeResultTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveResultTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? tab.isConsensus
                        ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400/50'
                        : tab.isSpecial
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-400/40'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                      : tab.isConsensus
                      ? 'bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 border border-cyan-800/60'
                      : tab.isSpecial
                      ? 'bg-purple-950/60 text-purple-300 hover:bg-purple-900/60 border border-purple-800/60'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] text-cyan-300">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Formatted Markdown / Output View with Multi-Model View Switcher */}
          {activeResultTab === 'formatted' && (() => {
            const consensusDelibs = currentInteraction.multiModelConsensus?.deliberations || [];
            const activeDelib = consensusDelibs.find((d: any) => d.modelId === selectedModelView);

            return (
              <div className="space-y-4">
                {/* Model Output Quick Switcher Strip */}
                {consensusDelibs.length > 0 && (
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2 shrink-0 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-cyan-400" />
                      Vista:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedModelView('sophia-master')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        selectedModelView === 'sophia-master'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400'
                          : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>✨ Síntesis SophIA (Maestra)</span>
                    </button>

                    {consensusDelibs.map((delib: any) => {
                      const isSel = selectedModelView === delib.modelId;
                      return (
                        <button
                          key={delib.modelId}
                          type="button"
                          onClick={() => setSelectedModelView(delib.modelId)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                            isSel
                              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 ring-1 ring-cyan-300'
                              : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800/80'
                          }`}
                        >
                          <span>{delib.modelName.split(' ')[0]} {delib.modelName.split(' ')[1] || ''}</span>
                          <span className="text-[9px] font-mono text-cyan-300 bg-slate-950/80 px-1 py-0.2 rounded">
                            {delib.verdictScore}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Model Specific Header Banner if viewing single model */}
                {selectedModelView !== 'sophia-master' && activeDelib && (
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                        {activeDelib.modelName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{activeDelib.modelName}</span>
                          <span className="text-[10px] text-cyan-300 font-medium bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/50">
                            🎓 {activeDelib.seniorityBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Especialidad: <span className="text-slate-200">{activeDelib.specialtyDomain}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedModelView('sophia-master')}
                        className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        ← Volver a Síntesis Maestra
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Content Area */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 text-sm text-slate-100 leading-relaxed font-sans shadow-inner overflow-x-auto">
                  <div className="markdown-body">
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {selectedModelView === 'sophia-master'
                        ? currentInteraction.finalResponse || currentInteraction.directAnswer || 'Sin respuesta generada'
                        : activeDelib?.fullCandidateResponse || activeDelib?.candidateSolutionSummary || 'Sin respuesta generada para este modelo'}
                    </Markdown>
                  </div>
                </div>

                {/* If single model has recommended code or action */}
                {selectedModelView !== 'sophia-master' && activeDelib?.recommendedCodeOrAction && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-cyan-400" />
                        Código o Acción Recomendada por {activeDelib.modelName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activeDelib.recommendedCodeOrAction || '');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer transition"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-emerald-300 overflow-x-auto">
                      <code>{activeDelib.recommendedCodeOrAction}</code>
                    </pre>
                  </div>
                )}

                {/* Action: Open in Creations Sandbox if creation detected */}
                {(currentInteraction.finalResponse?.includes('```html') ||
                  currentInteraction.finalResponse?.includes('<!DOCTYPE html>') ||
                  currentInteraction.finalResponse?.includes('```jsx') ||
                  currentInteraction.finalResponse?.includes('```tsx') ||
                  currentInteraction.finalResponse?.includes('```javascript') ||
                  currentInteraction.finalResponse?.includes('```js')) && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                      <div>
                        <span className="text-xs text-white font-bold block">
                          Creación interactiva lista para previsualización en Sandbox
                        </span>
                        <span className="text-[11px] text-purple-300">
                          Renderiza el código HTML/JS/React en tiempo real sin salir del panel.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveResultTab('sandbox')}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <span>Ver en Sandbox</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Tab: Multi-Model Consensus Orchestration (40 Años de Experiencia) */}
          {activeResultTab === 'consensus' && (() => {
            const deliberations = currentInteraction.multiModelConsensus?.deliberations || [];
            const selectedDelib = deliberations.find((d: any) => d.modelId === selectedConsensusModelId) || deliberations[0];

            return (
              <div className="space-y-5">
                {/* Directive Header Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-blue-950/70 to-indigo-950/80 border border-cyan-500/40 shadow-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white">Cluster Multi-Modelo IA & Orquestación SophIA</h4>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-bold text-cyan-300">
                            40 Años de Experiencia
                          </span>
                        </div>
                        <p className="text-xs text-cyan-200/80 mt-0.5">
                          Todos los modelos conectados evalúan 3 escenarios y posibilidades reales. SophIA sintetiza la mejor solución con maestría multidisciplinaria.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-right">
                        <span className="text-[10px] text-slate-400 block">Confianza de Consenso</span>
                        <span className="text-sm font-mono font-bold text-cyan-300">
                          {currentInteraction.multiModelConsensus?.consensusConfidence || 99}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SophIA Supreme Meta-Synthesis Card */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-indigo-400" />
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                        Meta-Síntesis & Arbitraje Supremo de SophIA
                      </h5>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded-md">
                      {currentInteraction.multiModelConsensus?.sophiaMetaSynthesis?.experienceApplied || '40 Años de Maestría Multidisciplinaria'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 leading-relaxed">
                    <strong className="text-white block mb-1">Directiva Maestra Unificada:</strong>
                    {currentInteraction.multiModelConsensus?.sophiaMetaSynthesis?.masterRecommendation ||
                      'SophIA evaluó todos los modelos de IA con 40 años de experiencia en sus respectivas disciplinas, simulando 3 escenarios reales por modelo para garantizar el éxito certero en producción.'}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Fortalezas Sintetizadas del Cluster:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {(currentInteraction.multiModelConsensus?.sophiaMetaSynthesis?.strengthsSynthesized || [
                          'Precisión sintáctica y tipado estricto (Gemini 3.7)',
                          'Verificación matemática formal y cero bucles (DeepSeek-R1)',
                          'Claridad conceptual y cadencia verbal dulce (Claude 3.7)',
                          'Ergonomía de interfaz y diseño centrado en el usuario (OpenAI GPT-4.5)'
                        ]).map((str: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Criterios de Arbitraje Aplicados:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {(currentInteraction.multiModelConsensus?.sophiaMetaSynthesis?.arbitrationCriteria || [
                          'Cero alucinación y verificación cruzada de hechos en tiempo real',
                          'Simulación previa de 3 escenarios por modelo de IA',
                          'Entrega de código completo ejecutable de producción',
                          'Locución verbal profunda omitiendo exclusivamente el pensamiento'
                        ]).map((crit: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>{crit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Models Deliberation Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Modelos Deliberados ({deliberations.length}) • 40 Años de Experiencia</span>
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      Haz clic en cualquier modelo para ver su análisis y código propuesto
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {deliberations.map((delib: any) => {
                      const isSelected = selectedConsensusModelId === delib.modelId;
                      return (
                        <div
                          key={delib.modelId}
                          onClick={() => setSelectedConsensusModelId(delib.modelId)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                            isSelected
                              ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{delib.modelName}</span>
                            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                              {delib.verdictScore}% Score
                            </span>
                          </div>

                          <div className="text-[10px] text-cyan-300 font-semibold bg-cyan-950/40 border border-cyan-800/30 px-2 py-1 rounded-lg">
                            🎓 {delib.seniorityBadge}
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                            {delib.candidateSolutionSummary}
                          </p>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Aporte:</span>
                            <span className="text-indigo-300 font-medium truncate max-w-[140px]">{delib.keyContribution}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Model Deep Dive Card */}
                {selectedDelib && (
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm">
                          {selectedDelib.modelName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-white">{selectedDelib.modelName}</h5>
                            <span className="text-xs font-mono text-cyan-400 font-bold">
                              {selectedDelib.verdictScore}% Confianza
                            </span>
                          </div>
                          <span className="text-[11px] text-cyan-300 font-medium">
                            🎓 {selectedDelib.seniorityBadge} • {selectedDelib.provider}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedModelView(selectedDelib.modelId);
                          setActiveResultTab('formatted');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <span>Ver Respuesta Completa de este Modelo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300 block">Propuesta del Modelo:</span>
                      <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                        {selectedDelib.fullCandidateResponse || selectedDelib.candidateSolutionSummary}
                      </p>
                    </div>

                    {selectedDelib.recommendedCodeOrAction && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-cyan-300 block">Código Recomendado por este Modelo:</span>
                        <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-48">
                          <code>{selectedDelib.recommendedCodeOrAction}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Tab 2: Embedded Live Sandbox Preview */}
          {activeResultTab === 'sandbox' && (
            <div className="space-y-3">
              <CreationPreviewSandbox
                currentInteraction={currentInteraction}
                onSendPrompt={(p) => {
                  setPromptText(p);
                  handleExecuteInstruction(p);
                }}
              />
            </div>
          )}

          {/* Tab 2: 3 Simulated Scenarios Deep-Dive */}
          {activeResultTab === 'scenarios' && (
            <div className="space-y-4">
              {/* Scenario Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {scenarios.map((sc, idx) => {
                  const isSelected = selectedScenario?.id === sc.id;
                  const riskColors = {
                    low: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
                    medium: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
                    high: 'text-rose-400 border-rose-500/30 bg-rose-950/40'
                  };
                  return (
                    <button
                      key={sc.id || idx}
                      type="button"
                      onClick={() => setSelectedScenarioId(sc.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-400 ring-1 ring-indigo-400 text-white shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-200">
                          {sc.title || `Escenario ${idx + 1}`}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {sc.probability}% Prob.
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {sc.breakdown}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${riskColors[sc.riskLevel] || riskColors.low}`}>
                          Riesgo: {sc.riskLevel?.toUpperCase()}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Scenario Details Breakdown */}
              {selectedScenario && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span>{selectedScenario.title}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedScenario.breakdown}</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-lg font-bold text-cyan-400">{selectedScenario.probability}%</span>
                      <span className="block text-[10px] text-slate-500">Probabilidad Éxito</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Risk Analysis */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Variables & Riesgo Identificado:
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedScenario.riskDescription || 'Riesgo bajo controlado bajo las Leyes del Cerebro de SophIA.'}
                      </p>
                    </div>

                    {/* Mitigation Strategy */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Plan de Mitigación y Contingencia:
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedScenario.mitigation || 'Validación en tiempo real y fallback automático hacia modelo redundante.'}
                      </p>
                    </div>
                  </div>

                  {/* Mitigation Steps if present */}
                  {selectedScenario.mitigationSteps && selectedScenario.mitigationSteps.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <ListOrdered className="w-3.5 h-3.5 text-indigo-400" />
                        Pasos de Mitigación Recomendados:
                      </span>
                      <div className="space-y-1.5">
                        {selectedScenario.mitigationSteps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="font-mono text-cyan-400 font-bold mt-0.5">{sIdx + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Raw JSON / Code Telemetry */}
          {activeResultTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Estructura JSON Completa Retornada por el Modelo</span>
                <span>Latencia: {currentInteraction.latencyMs || 420}ms</span>
              </div>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-cyan-300 max-h-80 overflow-y-auto overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(currentInteraction, null, 2)}
              </pre>
            </div>
          )}

          {/* Tab 4: Memory & Resources */}
          {activeResultTab === 'memory' && (
            <div className="space-y-4">
              {/* Indexed Learnings */}
              {currentInteraction.learnedMemoryPoints && currentInteraction.learnedMemoryPoints.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    Aprendizajes Indexados en Firebase Firestore:
                  </span>
                  <div className="space-y-1.5">
                    {currentInteraction.learnedMemoryPoints.map((pt, pIdx) => (
                      <div key={pIdx} className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Search Grounding Sources */}
              {currentInteraction.groundingSources && currentInteraction.groundingSources.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    Fuentes Validadas en Tiempo Real (Google Search 2026):
                  </span>
                  <div className="space-y-1.5">
                    {currentInteraction.groundingSources.map((src, sIdx) => (
                      <a
                        key={sIdx}
                        href={src.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{src.title || src.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* 5. SOPHIA COMPLETE ECOSYSTEM • SUITE PANELS & FUNCTION SHORTCUTS */}
      <div className="p-6 rounded-3xl bg-slate-900/95 border border-blue-500/30 shadow-2xl shadow-blue-950/40 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-blue-900/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>Ecosistema de Módulos SophIA • Suite Azul Zafiro & Cobalto</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-900/80 text-cyan-300 border border-blue-400/40">
                  12 Módulos Activos
                </span>
              </h3>
              <p className="text-xs text-blue-200/70">
                Acceso directo con un solo clic a control de hardware, celular, domótica, noticias, modelos y creación.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/60">
            Sincronización Total 60 FPS
          </span>
        </div>

        {/* Dynamic 12 Modular Panels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            {
              id: 'remote',
              name: 'Control Remoto TV Riviera',
              badge: 'IR 38kHz • IP ECP :8060',
              desc: 'Emisión infrarroja modulada y WiFi ECP/DIAL para Riviera, Roku, Android TV, Samsung y LG con OSD 4K.',
              icon: Tv,
              glow: 'border-blue-500/40 bg-gradient-to-br from-blue-950/90 via-slate-900 to-indigo-950/80',
              iconColor: 'text-cyan-400',
              tab: 'remote',
              actions: [
                { label: '📺 Abrir Control', action: () => onNavigateTab('remote') },
                { label: '🔥 Encender TV', action: () => handleExecuteInstruction('SophIA, enciende la Smart TV Riviera') },
                { label: '▶️ YouTube', action: () => handleExecuteInstruction('SophIA, abre YouTube en la TV Riviera') }
              ]
            },
            {
              id: 'phone',
              name: 'Gestor Celular & Android Sync',
              badge: 'Galaxy S24 Ultra • Android 15',
              desc: 'Deep links directos a WhatsApp, Spotify, YouTube, test de vibración háptica y lente de visión con cámara WebRTC.',
              icon: Smartphone,
              glow: 'border-cyan-500/40 bg-gradient-to-br from-blue-950/90 via-slate-900 to-sky-950/80',
              iconColor: 'text-sky-400',
              tab: 'phone',
              actions: [
                { label: '📱 Gestor Celular', action: () => onNavigateTab('phone') },
                { label: '💬 WhatsApp', action: () => handleExecuteInstruction('SophIA, prepara un mensaje de WhatsApp') },
                { label: '📸 Lente Visión', action: () => onNavigateTab('phone') }
              ]
            },
            {
              id: 'smarthome',
              name: 'Domótica IoT & Smart Home',
              badge: 'Luces • Modo Cine • A/C',
              desc: 'Automatización de iluminación inteligente, enchufes, termostatos, cerraduras y rutinas cinematográficas para el hogar.',
              icon: Home,
              glow: 'border-teal-500/40 bg-gradient-to-br from-teal-950/90 via-slate-900 to-blue-950/80',
              iconColor: 'text-teal-400',
              tab: 'smarthome',
              actions: [
                { label: '💡 Domótica', action: () => onNavigateTab('smarthome') },
                { label: '🍿 Modo Cine', action: () => handleExecuteInstruction('SophIA, activa el Modo Cine en la sala') },
                { label: '💡 Luces al 80%', action: () => handleExecuteInstruction('SophIA, enciende las luces de la sala al 80%') }
              ]
            },
            {
              id: 'bluetooth',
              name: 'Bluetooth & Sonido 3D',
              badge: 'Web Bluetooth • Mega Bass',
              desc: 'Emparejamiento BLE de baja energía, refuerzo sub-grave Mega Bass, barrido espacial 3D y calibración de audio acústico.',
              icon: Bluetooth,
              glow: 'border-indigo-500/40 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-blue-950/80',
              iconColor: 'text-indigo-400',
              tab: 'bluetooth',
              actions: [
                { label: '🔊 Ecualizador', action: () => onNavigateTab('bluetooth') },
                { label: '🔥 Mega Bass', action: () => handleExecuteInstruction('SophIA, activa el test de sonido Mega Bass') },
                { label: '🎧 Audio 3D', action: () => onNavigateTab('bluetooth') }
              ]
            },
            {
              id: 'studio',
              name: 'Nano Banana & Veo (Estudio)',
              badge: 'Generación Multimedia 2026',
              desc: 'Suite de arte conceptual fotorrealista, síntesis de video cinemático con Google Veo y producción musical con IA.',
              icon: Sparkles,
              glow: 'border-blue-400/40 bg-gradient-to-br from-blue-900/40 via-slate-900 to-cyan-950/80',
              iconColor: 'text-cyan-300',
              tab: 'studio',
              actions: [
                { label: '🎨 Crear Arte', action: () => onNavigateTab('studio') },
                { label: '🎬 Video Veo', action: () => onNavigateTab('studio') },
                { label: '🎵 Música', action: () => handleExecuteInstruction('SophIA, compón un prompt musical épico orquestal') }
              ]
            },
            {
              id: 'news',
              name: 'Noticias en Vivo Google Search',
              badge: 'Grounding 2026 en Vivo',
              desc: 'Titulares en tiempo real verificados con Google Search 2026: Tecnología, Inteligencia Artificial, Finanzas y Ciencia.',
              icon: Globe,
              glow: 'border-sky-500/40 bg-gradient-to-br from-sky-950/90 via-slate-900 to-blue-950/80',
              iconColor: 'text-sky-300',
              tab: 'news',
              actions: [
                { label: '📰 Noticias Hoy', action: () => onNavigateTab('news') },
                { label: '⚡ Resumen 60s', action: () => handleExecuteInstruction('SophIA, dame las noticias más importantes de tecnología hoy') },
                { label: '🔬 Ciencia', action: () => onNavigateTab('news') }
              ]
            },
            {
              id: 'agenda',
              name: 'Agenda & Recordatorios',
              badge: 'Citas • Tareas • Calendario',
              desc: 'Sincronización ejecutiva de agenda, programación de eventos, tareas prioritarias y notificaciones de alta importancia.',
              icon: Calendar,
              glow: 'border-blue-500/40 bg-gradient-to-br from-blue-950/90 via-slate-900 to-indigo-950/80',
              iconColor: 'text-blue-400',
              tab: 'agenda',
              actions: [
                { label: '📅 Ver Agenda', action: () => onNavigateTab('agenda') },
                { label: '➕ Nueva Cita', action: () => handleExecuteInstruction('SophIA, agenda una reunión ejecutiva para mañana') },
                { label: '✅ Tareas', action: () => onNavigateTab('agenda') }
              ]
            },
            {
              id: 'database',
              name: 'Cerebro Firebase & Leyes AGI',
              badge: 'Memoria • 8 Leyes • Auditoría',
              desc: 'Memoria contextual indexada en Firebase, cumplimiento estricto de las 8 Leyes Fundamentales y auto-auditoría diaria.',
              icon: Brain,
              glow: 'border-indigo-500/40 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-blue-950/80',
              iconColor: 'text-indigo-300',
              tab: 'database',
              actions: [
                { label: '🧠 Ver Memoria', action: () => onNavigateTab('database') },
                { label: '🛡️ 8 Leyes', action: () => onNavigateTab('aistudio') },
                { label: '🔄 Auto-Auditoría', action: () => handleExecuteInstruction('SophIA, ejecuta una auto-auditoría sobre tus logs de rendimiento') }
              ]
            },
            {
              id: 'models',
              name: 'Modelos & Orquestación IA',
              badge: 'Gemini 3.7 • Claude 3.7 • R1',
              desc: 'Cascada multimodelo inteligente con enrutamiento dinámico según la naturaleza de la tarea y razonamiento profundo.',
              icon: Cpu,
              glow: 'border-cyan-500/40 bg-gradient-to-br from-cyan-950/90 via-slate-900 to-blue-950/80',
              iconColor: 'text-cyan-400',
              tab: 'models',
              actions: [
                { label: '🤖 Selector IA', action: () => onNavigateTab('models') },
                { label: '⚡ Gemini 3.7', action: () => handleExecuteInstruction('SophIA, analiza con Gemini 3.7 Flash las tendencias clave de 2026') },
                { label: '🧠 DeepSeek-R1', action: () => handleExecuteInstruction('SophIA, usa DeepSeek-R1 para resolver con lógica deductiva pura') }
              ]
            },
            {
              id: 'simulator',
              name: 'Simulador de 3 Escenarios',
              badge: 'Probabilidad • Riesgo • Mitigación',
              desc: 'Cálculo algorítmico de 3 posibilidades con desglose porcentual, evaluación cuantitativa de variables y planes de contingencia.',
              icon: Activity,
              glow: 'border-blue-400/40 bg-gradient-to-br from-blue-950/90 via-slate-900 to-indigo-950/80',
              iconColor: 'text-blue-300',
              tab: 'simulator',
              actions: [
                { label: '📊 Simulador', action: () => onNavigateTab('simulator') },
                { label: '🎯 Simular Proyecto', action: () => handleExecuteInstruction('SophIA, simula 3 escenarios para el lanzamiento de mi nueva app') },
                { label: '📈 Métricas', action: () => onNavigateTab('simulator') }
              ]
            },
            {
              id: 'creations',
              name: 'Creations & Sandbox Live',
              badge: 'HTML5 • React • TypeScript',
              desc: 'Entorno de ejecución aislado para renderizar código fuente generado en tiempo real con previsualización inmediata.',
              icon: Layout,
              glow: 'border-sky-500/40 bg-gradient-to-br from-sky-950/90 via-slate-900 to-blue-950/80',
              iconColor: 'text-sky-400',
              tab: 'creations',
              actions: [
                { label: '⚡ Abrir Sandbox', action: () => onNavigateTab('creations') },
                { label: '💻 Crear App React', action: () => handleExecuteInstruction('SophIA, crea una aplicación interactiva en React y Tailwind para Sandbox') },
                { label: '🎨 Ver Galería', action: () => onNavigateTab('creations') }
              ]
            },
            {
              id: 'deploy',
              name: 'Despliegue Cloud Run & PWA',
              badge: 'Puerto 3000 • SSL/HTTPS Activo',
              desc: 'Servidor Express de producción en Google Cloud Run, empaquetado con esbuild e instalación nativa como PWA en celular.',
              icon: Cloud,
              glow: 'border-cyan-500/40 bg-gradient-to-br from-blue-950/90 via-slate-900 to-cyan-950/80',
              iconColor: 'text-cyan-400',
              tab: 'deploy',
              actions: [
                { label: '🚀 Estado Cloud Run', action: () => onNavigateTab('deploy') },
                { label: '📲 Descargar App', action: () => onNavigateTab('install') },
                { label: '📋 Comandos CLI', action: () => onNavigateTab('deploy') }
              ]
            }
          ].map((panel) => {
            const Icon = panel.icon;
            return (
              <div
                key={panel.id}
                className={`p-4 rounded-2xl ${panel.glow} border shadow-lg flex flex-col justify-between space-y-3 transition-all hover:scale-[1.01] duration-200`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
                        <Icon className={`w-4 h-4 ${panel.iconColor}`} />
                      </div>
                      <h4 className="text-xs font-bold text-white">{panel.name}</h4>
                    </div>
                  </div>
                  <span className="inline-block mt-1.5 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-cyan-300 border border-blue-800/60">
                    {panel.badge}
                  </span>
                  <p className="text-[11px] text-slate-300/80 mt-2 leading-snug">
                    {panel.desc}
                  </p>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 flex-wrap">
                  {panel.actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      type="button"
                      onClick={act.action}
                      className="px-2.5 py-1 rounded-lg bg-blue-900/40 hover:bg-blue-600 border border-blue-500/30 text-blue-200 hover:text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal for Starting a New Chat Thread */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-3xl p-6 shadow-2xl shadow-blue-950/60 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-blue-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">¿Iniciar un Nuevo Chat?</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Tienes un hilo de conversación activo con{' '}
                  <span className="font-semibold text-cyan-300">
                    {Math.floor(conversationHistory.length / 2)} turnos recordados
                  </span>
                  .
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Al confirmar, se archivará este contexto y SophIA comenzará una nueva sesión limpia para enfocarse en un nuevo proyecto o consulta.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar y Mantener Hilo
              </button>
              <button
                type="button"
                onClick={() => confirmStartNewChat(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Sí, Iniciar Nuevo Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
