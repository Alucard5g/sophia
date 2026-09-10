import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RefreshCw,
  Send,
  Sparkles,
  AlertCircle,
  Radio,
  Bot,
  Table,
  Code,
  ListOrdered,
  FileText,
  Sliders,
  Cpu,
  Brain,
  Globe,
  Heart,
  Volume2,
  VolumeX,
  Layers,
  Wand2,
  Boxes,
  Compass,
  Video,
  Music,
  Palette,
  Layout,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { Interaction, AIStudioConfig, ModelEngineId, SophiaVoiceProfile, VoiceStyle, UploadedMediaItem, UserDeviceProfile } from '../types';
import { MultimodalUploadBar } from './MultimodalUploadBar';
import { speakSmoothSophia, stopSmoothSophia, playHarmonicChime } from '../lib/smoothSpeech';
import { Smartphone, Check, User } from 'lucide-react';

interface VoiceRecorderCardProps {
  onProcessComplete: (interaction: Interaction) => void;
  isProcessing: boolean;
  setIsProcessing: (b: boolean) => void;
  setIsRecordingGlobal: (b: boolean) => void;
  aiStudioConfig?: AIStudioConfig;
  onOpenAIStudio?: () => void;
  onUpdateConfig?: (cfg: Partial<AIStudioConfig>) => void;
  initialPrompt?: string;
  userProfile?: UserDeviceProfile | null;
  onOpenDeviceModal?: () => void;
}

export const VoiceRecorderCard: React.FC<VoiceRecorderCardProps> = ({
  onProcessComplete,
  isProcessing,
  setIsProcessing,
  setIsRecordingGlobal,
  aiStudioConfig,
  onOpenAIStudio,
  onUpdateConfig,
  initialPrompt,
  userProfile,
  onOpenDeviceModal
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTimeSec, setRecordingTimeSec] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>(initialPrompt || '');

  // Synchronize if initialPrompt changes
  useEffect(() => {
    if (initialPrompt) {
      setTranscript(initialPrompt);
    }
  }, [initialPrompt]);
  const [category, setCategory] = useState<string>('Productividad');
  const [formatPreference, setFormatPreference] = useState<string>('Auto / Según Instrucción');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoProcessOnStop, setAutoProcessOnStop] = useState<boolean>(true);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [predictedModelName, setPredictedModelName] = useState<string>('Gemini 3.7 Flash (Creador Universal)');
  const [attachments, setAttachments] = useState<UploadedMediaItem[]>([]);
  
  // Voice Profile State (Sweet & Sexy voice tuning)
  const [voiceProfile, setVoiceProfile] = useState<SophiaVoiceProfile>(
    aiStudioConfig?.voiceProfile || {
      voiceStyle: 'dulce_sensual',
      sweetnessLevel: 'alta',
      pitch: 1.12,
      rate: 0.96,
      flirtatiousCompliments: true,
      audioChime: true,
    }
  );
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Load available system voices for sweet feminine Spanish tone
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const spanishVoices = voices.filter((v) => v.lang.startsWith('es') || v.lang.startsWith('ES'));
        setAvailableVoices(spanishVoices.length > 0 ? spanishVoices : voices);
        // Find best sweet female voice
        const sweetFemale = spanishVoices.find((v) =>
          /monica|paulina|helena|sabina|lucia|sofia|maria|female|mujer|penelope/i.test(v.name)
        );
        if (sweetFemale) {
          setSelectedVoiceURI(sweetFemale.voiceURI);
        } else if (spanishVoices.length > 0) {
          setSelectedVoiceURI(spanishVoices[0].voiceURI);
        }
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Web Speech Recognition if supported for live text preview
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'es-ES';

      rec.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      rec.onerror = (err: any) => {
        console.warn('Speech recognition warning:', err.error);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Update predicted model indicator based on text & selected mode
  useEffect(() => {
    const lower = transcript.toLowerCase();
    const mode = aiStudioConfig?.modelSelectionMode || 'auto';

    if (mode !== 'auto') {
      const mapNames: Record<string, string> = {
        'gemini-3.7-flash': 'Gemini 3.7 Flash (Equilibrado Gratuito)',
        'gemini-3.1-pro-preview': 'Gemini 3.1 Pro (Razonamiento STEM)',
        'gemini-3.1-flash-lite': 'Gemini 3.1 Flash Lite (<250ms)',
        'chatgpt-4o-mini-free': 'ChatGPT-4o Mini Mode (Conversacional)',
        'claude-3-5-sonnet-free': 'Claude 3.5 Sonnet Mode (Redacción)',
        'deepseek-v3-free': 'DeepSeek-V3 Mode (Lógica Técnica)',
        'llama-3-3-free': 'Llama 3.3 70B Mode (Open Weights)',
      };
      setPredictedModelName(mapNames[mode] || mode);
      return;
    }

    if (/\b(código|codigo|typescript|python|sql|algoritmo|matemática|bug|refactor|react)\b/i.test(lower)) {
      setPredictedModelName('Gemini 3.1 Pro (Código & Razonamiento STEM)');
    } else if (aiStudioConfig?.enableSearchGrounding || /\b(noticias|hoy|actualidad|2026|buscar|fuentes)\b/i.test(lower)) {
      setPredictedModelName('Gemini 3.7 Flash + Google Search Grounding');
    } else if (/\b(historia|poema|guion|seductora|dulce|carta)\b/i.test(lower)) {
      setPredictedModelName('Claude 3.5 & ChatGPT Creative Mode');
    } else if (lower.length > 0 && lower.length < 35 && /\b(hola|saludo|qué es|define|rápido)\b/i.test(lower)) {
      setPredictedModelName('Gemini 3.1 Flash Lite (Voz Instantánea)');
    } else {
      setPredictedModelName('Gemini 3.7 Flash (Creador Universal)');
    }
  }, [transcript, aiStudioConfig]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingTimeSec(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTimeSec((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Audio Canvas visualizer
  const startCanvasVisualizer = (stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#f43f5e');
          gradient.addColorStop(0.5, '#a855f7');
          gradient.addColorStop(1, '#ec4899');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          x += barWidth + 2;
        }

        animFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (e) {
      console.warn('Audio visualizer error:', e);
    }
  };

  const stopCanvasVisualizer = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
    }
  };

  // Play sweet live voice audition sample
  const handleAuditionVoice = async () => {
    if (!('speechSynthesis' in window)) return;
    if (isAuditioning) {
      stopSmoothSophia();
      setIsAuditioning(false);
      return;
    }

    stopSmoothSophia();

    let auditionPhrase = 'Hola cariño, soy SophIA. Dime qué deseas que cree hoy para ti con todo el poder de mi inteligencia.';
    if (voiceProfile.voiceStyle === 'dulce_sensual') {
      auditionPhrase = 'Hola mi cielo... soy SophIA. Con mi voz dulce y todo el poder de AI Studio, estoy lista para crear lo que me pidas.';
    } else if (voiceProfile.voiceStyle === 'dulce_afectuosa') {
      auditionPhrase = 'Hola corazón, soy SophIA. Estoy encantada de ayudarte con tus proyectos, códigos y tablas comparativas.';
    } else if (voiceProfile.voiceStyle === 'elegante_seductora') {
      auditionPhrase = 'Bienvenido. Soy SophIA, tu inteligencia artificial de voz y simulación. Es un verdadero placer asistirte hoy.';
    }

    await playHarmonicChime();

    speakSmoothSophia(auditionPhrase, {
      pitch: voiceProfile.pitch || 1.12,
      rate: voiceProfile.rate || 0.96,
      voiceURI: selectedVoiceURI,
      onStart: () => setIsAuditioning(true),
      onEnd: () => setIsAuditioning(false),
      onError: () => setIsAuditioning(false),
    });
  };

  const handleStartRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    // Start speech recognition immediately within direct user interaction
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recog start notice:', e);
      }
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsRecording(true);
        setIsRecordingGlobal(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mime = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mime)) {
          mime = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mime)) {
            mime = 'audio/mp4';
            if (!MediaRecorder.isTypeSupported(mime)) {
              mime = '';
            }
          }
        }
      }

      setRecordedMimeType(mime || 'audio/webm');
      if (typeof MediaRecorder !== 'undefined') {
        const mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(250);
      }

      startCanvasVisualizer(stream);
      setIsRecording(true);
      setIsRecordingGlobal(true);
    } catch (err: any) {
      console.warn('Mic getUserMedia warning:', err);
      // Still allow recording if speech recognition works
      setIsRecording(true);
      setIsRecordingGlobal(true);
      if (err.name === 'NotAllowedError') {
        setErrorMessage(
          'Permiso de micrófono no habilitado en el navegador. Puedes dictar por voz o escribir en el campo de texto.'
        );
      }
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    stopCanvasVisualizer();
    setIsRecording(false);
    setIsRecordingGlobal(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recordedMimeType || 'audio/webm',
        });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = (reader.result as string)?.split(',')[1];
          setRecordedAudioBase64(base64Data);

          if (autoProcessOnStop) {
            processAudioAndText(transcript, base64Data, recordedMimeType);
          }
        };
      };

      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        if (autoProcessOnStop) {
          processAudioAndText(transcript, null, recordedMimeType);
        }
      }
    } else {
      if (autoProcessOnStop) {
        processAudioAndText(transcript, null, recordedMimeType);
      }
    }
  };

  const processAudioAndText = async (promptText: string, audioB64?: string | null, mime?: string) => {
    let finalPrompt = promptText.trim();
    const finalAudioB64 = audioB64 || recordedAudioBase64;

    if (formatPreference !== 'Auto / Según Instrucción' && finalPrompt) {
      if (!finalPrompt.toLowerCase().includes('formato') && !finalPrompt.toLowerCase().includes('tabla')) {
        finalPrompt = `${finalPrompt} [Entregar estrictamente en formato: ${formatPreference}]`;
      }
    }

    if (!finalPrompt && !finalAudioB64 && attachments.length === 0) {
      setErrorMessage('Por favor dicta, escribe una instrucción o sube un archivo para SophIA antes de procesar.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/voice-assistant/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt || undefined,
          audioBase64: finalAudioB64 || undefined,
          mimeType: mime || recordedMimeType,
          audioDurationSec: recordingTimeSec > 0 ? recordingTimeSec : 3.5,
          category,
          attachments: attachments.length > 0 ? attachments : undefined,
          aiStudioConfig: {
            ...(aiStudioConfig || {
              modelSelectionMode: 'auto',
              temperature: 0.2,
              topP: 0.95,
              topK: 64,
              thinkingLevel: 'LOW',
              enableSearchGrounding: false,
            }),
            voiceProfile: {
              ...voiceProfile,
              preferredVoiceName: selectedVoiceURI,
            },
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.interaction) {
        onProcessComplete(data.interaction);
      } else {
        setErrorMessage(data.error || 'Ocurrió un error al procesar la instrucción en SophIA.');
      }
    } catch (err: any) {
      setErrorMessage('Error de red al conectar con SophIA.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    processAudioAndText(transcript, recordedAudioBase64, recordedMimeType);
  };

  const setPresetInstruction = (text: string, cat: string, format = 'Auto / Según Instrucción') => {
    setTranscript(text);
    setCategory(cat);
    setFormatPreference(format);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
      {/* Voice Recorder & Creator SophIA Box */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-5">
          {/* Header & Status Indicator */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <span className={`w-3 h-3 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-rose-400" />
                  {isRecording ? 'SophIA Escuchando...' : 'SophIA • Creador Universal AI Studio'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onOpenAIStudio && (
                <button
                  type="button"
                  onClick={onOpenAIStudio}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-indigo-300 rounded-xl flex items-center gap-1.5 transition-all"
                  title="Configurar parámetros de AI Studio"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Studio</span>
                </button>
              )}
              <div className="text-2xl font-mono font-bold text-slate-100 tracking-wider bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
                {formatTime(recordingTimeSec)}
              </div>
            </div>
          </div>

          {/* Sweet & Sexy Voice Customization Bar */}
          <div className="p-3.5 bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-950/70 rounded-2xl border border-rose-500/25 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30 animate-pulse" />
                <span className="text-xs font-bold text-rose-200">Voz Dulce & Sensual de SophIA:</span>
              </div>
              <button
                type="button"
                onClick={handleAuditionVoice}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-900/40 transition-all"
              >
                {isAuditioning ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Detener Voz</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Audición de Voz</span>
                  </>
                )}
              </button>
            </div>

            {/* Voice Style Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'profesional_ejecutiva', label: '💎 Ejecutiva & Firme (Neutro)', pitch: 1.00, rate: 1.02, sample: 'Saludos. Soy SophIA, tu asistente ejecutiva con máxima precisión.' },
                { id: 'dulce_sensual', label: '🌹 Dulce & Seductora', pitch: 1.16, rate: 0.92, sample: 'Hola cariño... soy SophIA con mi tono dulce y seductor.' },
                { id: 'dulce_afectuosa', label: '💖 Cariñosa & Cálida', pitch: 1.12, rate: 0.98, sample: 'Hola corazón, estoy lista para ayudarte con mucho cariño.' },
                { id: 'elegante_seductora', label: '✨ Elegante & Suave', pitch: 1.04, rate: 0.90, sample: 'Buenas tardes. Es un absoluto placer asistirte hoy.' },
                { id: 'profesional_dulce', label: '💼 Profesional & Amable', pitch: 1.02, rate: 1.04, sample: 'Comando recibido. Procesando con precisión ejecutiva.' },
                { id: 'energico_motivado', label: '⚡ Enérgica & Motivadora', pitch: 1.18, rate: 1.06, sample: '¡Vamos con todo! Creemos cosas extraordinarias hoy.' },
                { id: 'zen_relajante', label: '🍃 Zen & Meditativa', pitch: 0.92, rate: 0.86, sample: 'Respira profundo... todo fluye en perfecta armonía.' },
                { id: 'masculina_galan', label: '🎩 Tono Masculino / Galán', pitch: 0.82, rate: 0.94, sample: 'Hola, aquí estoy listo para resolver todo lo que necesites.' },
                { id: 'futurista_cyber', label: '🔮 Cyber / Futurista', pitch: 1.28, rate: 1.10, sample: 'Sistemas cuánticos en línea. Protocolo AI 2026 activo.' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    const newProf: SophiaVoiceProfile = {
                      ...voiceProfile,
                      voiceStyle: style.id as VoiceStyle,
                      pitch: style.pitch,
                      rate: style.rate,
                    };
                    setVoiceProfile(newProf);
                    if (onUpdateConfig) onUpdateConfig({ voiceProfile: newProf });
                    
                    // Immediate test of this voice tone
                    speakSmoothSophia(style.sample, {
                      voiceStyle: style.id as VoiceStyle,
                      pitch: style.pitch,
                      rate: style.rate,
                      voiceURI: selectedVoiceURI,
                      onStart: () => setIsAuditioning(true),
                      onEnd: () => setIsAuditioning(false),
                      onError: () => setIsAuditioning(false)
                    });
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-xl transition-all font-medium cursor-pointer active:scale-95 ${
                    voiceProfile.voiceStyle === style.id
                      ? 'bg-rose-600 text-white border border-rose-400 shadow-md font-semibold'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Fine Tuning Sliders & System Voices Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-rose-900/30 text-[11px]">
              {/* Voice Selector */}
              <div>
                <label className="text-slate-400 block mb-1">Voz del Sistema:</label>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => {
                    setSelectedVoiceURI(e.target.value);
                    const newProf = { ...voiceProfile, preferredVoiceName: e.target.value };
                    setVoiceProfile(newProf);
                    if (onUpdateConfig) onUpdateConfig({ voiceProfile: newProf });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-rose-400"
                >
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tono / Pitch Slider */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Tono (Pitch):</span>
                  <span className="text-rose-300 font-mono font-bold">{(voiceProfile.pitch || 1.12).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.45"
                  step="0.02"
                  value={voiceProfile.pitch || 1.12}
                  onChange={(e) => {
                    const p = parseFloat(e.target.value);
                    const newProf = { ...voiceProfile, pitch: p };
                    setVoiceProfile(newProf);
                    if (onUpdateConfig) onUpdateConfig({ voiceProfile: newProf });
                  }}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Velocidad / Rate Slider */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Velocidad (Rate):</span>
                  <span className="text-purple-300 font-mono font-bold">{(voiceProfile.rate || 0.96).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="1.35"
                  step="0.02"
                  value={voiceProfile.rate || 0.96}
                  onChange={(e) => {
                    const r = parseFloat(e.target.value);
                    const newProf = { ...voiceProfile, rate: r };
                    setVoiceProfile(newProf);
                    if (onUpdateConfig) onUpdateConfig({ voiceProfile: newProf });
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Anti-Stutter & High Fluidity Engine Controls */}
            <div className="flex items-center justify-between pt-1 border-t border-rose-900/30 text-[11px]">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Motor Anti-Trabas & Anti-Repetición 2026</span>
              </span>
              <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Respuesta Continua y Natural
              </span>
            </div>
          </div>

          {/* User Device Recognition Pill / Card */}
          {userProfile && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 transition shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">
                      {userProfile.userName ? `¡Hola, ${userProfile.userName}!` : 'Dispositivo Vinculado'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      {userProfile.deviceBrand} {userProfile.deviceModel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    SophIA está lista y conectada a tu {userProfile.osName} ({userProfile.screenResolution || 'Pantalla móvil'})
                  </p>
                </div>
              </div>

              {onOpenDeviceModal && (
                <button
                  type="button"
                  onClick={onOpenDeviceModal}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-semibold border border-slate-700 transition"
                >
                  Personalizar
                </button>
              )}
            </div>
          )}

          {/* Sound Wave Canvas / Visualizer */}
          <div className="w-full h-24 bg-slate-950/90 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden px-4">
            {isRecording ? (
              <canvas ref={canvasRef} width={400} height={80} className="w-full h-full" />
            ) : (
              <div className="flex items-center justify-center space-x-1.5 opacity-40">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-rose-500 via-purple-500 to-amber-500 rounded-full animate-pulse"
                    style={{
                      height: `${Math.sin(i * 0.5) * 20 + 25}px`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  ></div>
                ))}
              </div>
            )}
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
                <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  Presiona el micrófono para hablar a SophIA o escribe tu instrucción
                </span>
              </div>
            )}
          </div>

          {/* Record / Stop Main Button */}
          <div className="flex flex-col items-center justify-center gap-2.5 py-1">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={isProcessing}
                className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 via-purple-600 to-amber-500 text-white shadow-xl shadow-rose-600/30 hover:scale-105 transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                <div className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-25"></div>
                <Mic className="w-8 h-8 relative z-10" />
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 border-2 border-rose-500 text-rose-400 hover:bg-slate-700 hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                <Square className="w-8 h-8 fill-current" />
              </button>
            )}

            {/* Auto Process Toggle */}
            <div className="flex items-center space-x-2 text-xs text-slate-400 pt-0.5">
              <input
                type="checkbox"
                id="autoProcessToggle"
                checked={autoProcessOnStop}
                onChange={(e) => setAutoProcessOnStop(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-rose-500 focus:ring-rose-500"
              />
              <label htmlFor="autoProcessToggle" className="cursor-pointer">
                Responder por Voz Dulce y Simular Escenarios al Detener
              </label>
            </div>
          </div>

          {/* Real-time Transcription & Text Input Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="font-medium text-slate-300">
                Instrucción para SophIA (Voz / Texto):
              </label>
              <button
                onClick={() => {
                  setTranscript('');
                  setRecordedAudioBase64(null);
                }}
                className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Limpiar
              </button>
            </div>

            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!isProcessing && (transcript.trim() || recordedAudioBase64 || attachments.length > 0)) {
                      handleSubmit();
                    }
                  }
                }}
                placeholder="Escribe o habla cualquier instrucción para SophIA: desarrollo de apps, videos, páginas web, software, música, imágenes SVG, deportes en vivo (Liga vs Mirassol), simulaciones de 3 escenarios o búsqueda en tiempo real..."
                rows={3}
                className="w-full bg-slate-950/90 text-slate-100 placeholder-slate-500 text-sm p-3.5 pb-12 rounded-2xl border border-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none shadow-inner"
              />

              {/* Direct Text Send Button inside / under textarea */}
              <div className="absolute right-2.5 bottom-3 flex items-center gap-2">
                <span className="text-[10px] text-slate-500 hidden sm:inline-block">
                  Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">Ctrl+Enter</kbd>
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isProcessing || (!transcript.trim() && !recordedAudioBase64 && attachments.length === 0)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-indigo-950/50 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Instrucción en Texto</span>
                </button>
              </div>
            </div>

            {/* Dynamic AI Model Router Indicator */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400">Modelo AI Enrutado:</span>
                <span className="font-mono font-bold text-indigo-300">{predictedModelName}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/40">
                Nivel Gratuito Activo (Failover Automático)
              </span>
            </div>
          </div>

          {/* Multimodal Upload Bar (Images, Documents, Videos) */}
          <MultimodalUploadBar
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            onQuickActionPrompt={(promptText) => {
              setTranscript(promptText);
              setCategory('Tecnología');
            }}
            disabled={isProcessing}
          />

          {/* Quick AI Models & Engines Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Seleccionar Motor de IA Gratuito:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {[
                { id: 'auto', label: '🔀 Auto-Router IA', desc: 'Enrutador Inteligente' },
                { id: 'gemini-3.7-flash', label: '🌟 Gemini 3.7 Flash', desc: 'Equilibrado & Búsqueda' },
                { id: 'gemini-3.1-pro-preview', label: '🧠 Gemini 3.1 Pro', desc: 'Código & STEM' },
                { id: 'chatgpt-4o-mini-free', label: '🤖 ChatGPT Mini', desc: 'Conversacional Rápido' },
                { id: 'claude-3-5-sonnet-free', label: '🎭 Claude 3.5 Mode', desc: 'Redacción & Análisis' },
                { id: 'deepseek-v3-free', label: '⚡ DeepSeek V3', desc: 'Lógica Técnica' },
                { id: 'glm-4-flash-free', label: '🇨🇳 GLM-4 Flash', desc: 'Bilingüe & Multitarea' },
                { id: 'kimi-moonshot-free', label: '🌙 Kimi Moonshot', desc: 'Contexto Ultra-Largo' },
                { id: 'qwen-2-5-coder-free', label: '💻 Qwen 2.5 Coder', desc: 'Ingeniería de Software' },
                { id: 'llama-3-3-free', label: '🦙 Llama 3.3 70B', desc: 'Código Abierto' },
              ].map((engine) => {
                const isSelected = (aiStudioConfig?.modelSelectionMode || 'auto') === engine.id;
                return (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => {
                      if (onUpdateConfig) {
                        onUpdateConfig({ modelSelectionMode: engine.id as ModelEngineId });
                      }
                    }}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-400/60 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{engine.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{engine.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Universal Creator Suite Presets (Videos, Apps, Páginas, Software, Música, Imágenes, Deportes en Vivo) */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                Suite de Creación Universal Sin Restricciones (AI Studio & SophIA):
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
              {/* Deportes & Marcadores en Vivo */}
              <button
                onClick={() =>
                  setPresetInstruction(
                    'Busca en tiempo real con Google Search el marcador, alineaciones y detalles del partido de Liga vs Mirassol que se juega ahora, e indícame el estado exacto del encuentro.',
                    'Actualidad',
                    'Resumen Ejecutivo'
                  )
                }
                className="text-xs bg-slate-900/90 text-emerald-300 p-2 rounded-xl border border-emerald-800/50 hover:border-emerald-400 hover:bg-emerald-950/40 transition-all flex items-center gap-1.5 text-left group"
              >
                <span className="text-base">⚽</span>
                <div className="min-w-0">
                  <div className="font-semibold truncate group-hover:text-emerald-200">Liga vs Mirassol</div>
                  <div className="text-[10px] text-slate-400 truncate">Marcador en vivo 2026</div>
                </div>
              </button>

              {/* Videos & Storyboards */}
              <button
                onClick={() =>
                  setPresetInstruction(
                    'Crea un guion cinematográfico completo y storyboard visual escena por escena para un video promocional de 60 segundos sobre inteligencia artificial en 2026.',
                    'Creatividad',
                    'Lista Paso a Paso'
                  )
                }
                className="text-xs bg-slate-900/90 text-purple-300 p-2 rounded-xl border border-purple-800/50 hover:border-purple-400 hover:bg-purple-950/40 transition-all flex items-center gap-1.5 text-left group"
              >
                <Video className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold truncate group-hover:text-purple-200">Guion de Video</div>
                  <div className="text-[10px] text-slate-400 truncate">Storyboard audiovisual</div>
                </div>
              </button>

              {/* Apps & Páginas Web */}
              <button
                onClick={() =>
                  setPresetInstruction(
                    'Crea una Single Page Application completa en React + Tailwind CSS con estado interactivo para gestionar un panel de control con métricas en tiempo real.',
                    'Tecnología',
                    'Código de Programación'
                  )
                }
                className="text-xs bg-slate-900/90 text-blue-300 p-2 rounded-xl border border-blue-800/50 hover:border-blue-400 hover:bg-blue-950/40 transition-all flex items-center gap-1.5 text-left group"
              >
                <Layout className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold truncate group-hover:text-blue-200">App Web React</div>
                  <div className="text-[10px] text-slate-400 truncate">Dashboard interactivo</div>
                </div>
              </button>

              {/* Software & APIs */}
              <button
                onClick={() =>
                  setPresetInstruction(
                    'Diseña la arquitectura de software completa para un backend Node.js / Express con autenticación JWT, rate limiting y esquema de base de datos SQL.',
                    'Tecnología',
                    'Código de Programación'
                  )
                }
                className="text-xs bg-slate-900/90 text-cyan-300 p-2 rounded-xl border border-cyan-800/50 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all flex items-center gap-1.5 text-left group"
              >
                <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold truncate group-hover:text-cyan-200">Software & API REST</div>
                  <div className="text-[10px] text-slate-400 truncate">Backend robusto</div>
                </div>
              </button>

              {/* Música & Audio */}
              <button
                onClick={() =>
                  setPresetInstruction(
                    'Compón una progresión de acordes, melodía y código de sintetizador de audio en JavaScript (Web Audio API) con letra lírica emotiva.',
                    'Creatividad',
                    'Código de Programación'
                  )
                }
                className="text-xs bg-slate-900/90 text-rose-300 p-2 rounded-xl border border-rose-800/50 hover:border-rose-400 hover:bg-rose-950/40 transition-all flex items-center gap-1.5 text-left group"
              >
                <Music className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold truncate group-hover:text-rose-200">Música & Sintetizador</div>
                  <div className="text-[10px] text-slate-400 truncate">Web Audio & Letra</div>
                </div>
              </button>

              {/* Imágenes & Gráficos SVG */}
              <button
                onClick={() =>
                  setPresetInstruction(
                    'Genera el código SVG vectorial completo y estilizado para una ilustración futurista de alta resolución de una red neuronal bioluminiscente.',
                    'Creatividad',
                    'Código de Programación'
                  )
                }
                className="text-xs bg-slate-900/90 text-amber-300 p-2 rounded-xl border border-amber-800/50 hover:border-amber-400 hover:bg-amber-950/40 transition-all flex items-center gap-1.5 text-left group"
              >
                <Palette className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold truncate group-hover:text-amber-200">Arte Gráfico SVG</div>
                  <div className="text-[10px] text-slate-400 truncate">Ilustración vectorial</div>
                </div>
              </button>

              {/* Google Search 2026 */}
              <button
                onClick={() =>
                  setPresetInstruction(
                    'Busca con Google Search en tiempo real los modelos de IA y avances tecnológicos al 13 de agosto de 2026 y resume las fuentes clave.',
                    'Tecnología',
                    'Tabla Comparativa Markdown'
                  )
                }
                className="text-xs bg-slate-900/90 text-indigo-300 p-2 rounded-xl border border-indigo-800/50 hover:border-indigo-400 hover:bg-indigo-950/40 transition-all flex items-center gap-1.5 text-left group"
              >
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold truncate group-hover:text-indigo-200">Búsqueda 2026</div>
                  <div className="text-[10px] text-slate-400 truncate">Google Grounding</div>
                </div>
              </button>

              {/* Simulación 3 Escenarios */}
              <button
                onClick={() =>
                  setPresetInstruction(
                    'Simula 3 escenarios reales de inversión y retorno de capital para una startup SaaS con 50k USD de capital inicial.',
                    'Finanzas',
                    'Resumen Ejecutivo'
                  )
                }
                className="text-xs bg-slate-900/90 text-teal-300 p-2 rounded-xl border border-teal-800/50 hover:border-teal-400 hover:bg-teal-950/40 transition-all flex items-center gap-1.5 text-left group"
              >
                <Brain className="w-4 h-4 text-teal-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold truncate group-hover:text-teal-200">3 Escenarios SaaS</div>
                  <div className="text-[10px] text-slate-400 truncate">Probabilidad & Riesgo</div>
                </div>
              </button>
            </div>
          </div>

          {/* Format Selector Bar */}
          <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Formato de Salida Solicitado:
              </span>
              <span className="text-[10px] text-rose-400 font-mono">
                {formatPreference}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Auto / Según Instrucción', icon: Sparkles },
                { name: 'Tabla Comparativa Markdown', icon: Table },
                { name: 'Código de Programación', icon: Code },
                { name: 'Lista Paso a Paso', icon: ListOrdered },
                { name: 'Resumen Ejecutivo', icon: FileText },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = formatPreference === fmt.name;
                return (
                  <button
                    key={fmt.name}
                    type="button"
                    onClick={() => setFormatPreference(fmt.name)}
                    className={`text-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{fmt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selector */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-slate-400 whitespace-nowrap">Categoría:</span>
            {['Productividad', 'Tecnología', 'Finanzas', 'Educación', 'Estrategia', 'Creatividad', 'Salud'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1 rounded-xl transition-all whitespace-nowrap ${
                  category === cat
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Send / Process Button with Scenario Simulator Trigger */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing || (!transcript.trim() && !recordedAudioBase64 && attachments.length === 0)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-rose-900/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>SophIA está simulando 3 escenarios con la mejor IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>
                  {attachments.length > 0
                    ? `Procesar con Archivos Adjuntos (${attachments.length})`
                    : 'Crear y Responder con SophIA'}
                </span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

