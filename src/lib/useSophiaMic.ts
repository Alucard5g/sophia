import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseSophiaMicOptions {
  onTranscriptUpdate?: (text: string) => void;
  onAudioDataReady?: (base64: string, mimeType: string, durationSec: number) => void;
  onWakeWordDetected?: (detectedInstruction: string) => void;
  onAutoSubmit?: (instruction: string) => void;
  onError?: (errMessage: string) => void;
  autoContinuousListening?: boolean;
}

export interface UseSophiaMicReturn {
  isRecording: boolean;
  recordingTimeSec: number;
  transcript: string;
  setTranscript: (text: string | ((prev: string) => string)) => void;
  audioLevel: number; // 0 to 100 for decibel animation
  recordedAudioBase64: string | null;
  recordedMimeType: string;
  errorMessage: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  wakeWordDetected: boolean;
  continuousListening: boolean;
  setContinuousListening: (enabled: boolean) => void;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<{ base64: string | null; mimeType: string; transcript: string; durationSec: number }>;
  clearAudio: () => void;
  clearError: () => void;
  isSupported: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  requestPermission: () => Promise<boolean>;
  simulateVoiceInput: (sampleText: string) => void;
}

// Pleasant wake tone when "Sofi" is heard
function playSofiWakeChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.14); // C6

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.28);
    setTimeout(() => {
      try { ctx.close(); } catch (e) {}
    }, 350);
  } catch (e) {}
}

export function useSophiaMic(options: UseSophiaMicOptions = {}): UseSophiaMicReturn {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTimeSec, setRecordingTimeSec] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('audio/webm');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [wakeWordDetected, setWakeWordDetected] = useState<boolean>(false);
  const [continuousListening, setContinuousListening] = useState<boolean>(Boolean(options.autoContinuousListening));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeechRecogRunningRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const silenceTimerRef = useRef<any>(null);
  const wakeWordTimeoutRef = useRef<any>(null);

  // Check if browser supports media devices / SpeechRecognition
  const isSupported = typeof window !== 'undefined' && Boolean(
    (navigator?.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') ||
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );

  const optionsRef = useRef<UseSophiaMicOptions>(options);
  optionsRef.current = options;
  const continuousListeningRef = useRef<boolean>(continuousListening);
  continuousListeningRef.current = continuousListening;

  // Wake word extraction helper: matches "Sofi", "Sofía", "Sophia", "Hey Sofi", "Oye Sofi"
  const checkAndExtractWakeWord = useCallback((rawText: string) => {
    const wakeWordPattern = /(?:(?:oye|hey|hola|por\s+favor)\s+)?(?:sofi|sof[ií]a|sophia)[,\s:]*(.*)/i;
    const match = rawText.match(wakeWordPattern);
    if (match) {
      setWakeWordDetected(true);
      playSofiWakeChime();
      if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
      wakeWordTimeoutRef.current = setTimeout(() => {
        setWakeWordDetected(false);
      }, 4000);

      const instruction = match[1]?.trim() || '';
      if (instruction && optionsRef.current.onWakeWordDetected) {
        optionsRef.current.onWakeWordDetected(instruction);
      }
      return instruction;
    }
    return null;
  }, []);

  // Check initial permission query if supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as any })
        .then((status) => {
          setPermissionState(status.state as any);
          status.onchange = () => setPermissionState(status.state as any);
        })
        .catch(() => setPermissionState('prompt'));
    }
  }, []);

  // Initialize Web Speech Recognition once safely
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'es-ES';

        rec.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          if (currentText) {
            setTranscript(currentText);
            if (optionsRef.current.onTranscriptUpdate) {
              optionsRef.current.onTranscriptUpdate(currentText);
            }

            // Check wake word
            const extractedCommand = checkAndExtractWakeWord(currentText);

            // Auto-submit timer if user stops speaking in continuous mode
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (continuousListeningRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                const targetText = extractedCommand || currentText;
                if (targetText && targetText.trim().length > 3 && optionsRef.current.onAutoSubmit) {
                  optionsRef.current.onAutoSubmit(targetText.trim());
                  setTranscript('');
                }
              }, 2200);
            }
          }
        };

        rec.onerror = (err: any) => {
          console.warn('[SophiaMic] Speech recognition notice:', err.error);
          isSpeechRecogRunningRef.current = false;
        };

        rec.onend = () => {
          isSpeechRecogRunningRef.current = false;
          // Auto-restart if continuous mode is active
          if (continuousListeningRef.current) {
            try {
              rec.start();
              isSpeechRecogRunningRef.current = true;
            } catch (e) {}
          }
        };

        recognitionRef.current = rec;
      } catch (e) {
        console.warn('[SophiaMic] Speech recognition init failed:', e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
    };
  }, [checkAndExtractWakeWord]);

  // Visualizer loop on canvas
  const startVisualizer = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average audio level (0-100)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalizedLevel);

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx2d = canvas.getContext('2d');
          if (ctx2d) {
            ctx2d.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 1.4;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              const barHeight = Math.max(4, (dataArray[i] / 255) * canvas.height * 0.88);

              const gradient = ctx2d.createLinearGradient(0, canvas.height, 0, 0);
              gradient.addColorStop(0, '#f43f5e'); // Rose
              gradient.addColorStop(0.5, '#8b5cf6'); // Purple
              gradient.addColorStop(1, '#38bdf8'); // Sky

              ctx2d.fillStyle = gradient;
              ctx2d.beginPath();
              ctx2d.roundRect(x, canvas.height - barHeight, Math.max(2, barWidth - 2), barHeight, [3, 3, 0, 0]);
              ctx2d.fill();

              x += barWidth + 2;
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (e) {
      console.warn('[SophiaMic] Visualizer error:', e);
    }
  }, []);

  const stopVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta captura de audio.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionState('granted');
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      setPermissionState('denied');
      setErrorMessage('Permiso de micrófono denegado. Por favor permite el acceso al micrófono en la barra de direcciones o usa el teclado.');
      return false;
    }
  };

  const startRecording = async (): Promise<boolean> => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    startTimeRef.current = Date.now();

    // 1. Try starting Web Speech Recognition synchronously inside user gesture
    if (recognitionRef.current && !isSpeechRecogRunningRef.current) {
      try {
        recognitionRef.current.start();
        isSpeechRecogRunningRef.current = true;
      } catch (e) {
        console.warn('[SophiaMic] Speech recog start error (will rely on audio stream):', e);
      }
    }

    // 2. Start MediaRecorder with getUserMedia
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback: If only speech recognition is available
        if (recognitionRef.current) {
          setIsRecording(true);
          setRecordingTimeSec(0);
          timerIntervalRef.current = setInterval(() => {
            setRecordingTimeSec((p) => p + 1);
          }, 1000);
          return true;
        }
        throw new Error('El dispositivo no admite grabación de audio directa.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;
      setPermissionState('granted');

      let mime = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mime)) {
          mime = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mime)) {
            mime = 'audio/mp4';
            if (!MediaRecorder.isTypeSupported(mime)) {
              mime = 'audio/ogg';
              if (!MediaRecorder.isTypeSupported(mime)) {
                mime = '';
              }
            }
          }
        }
      }

      const effectiveMime = mime || 'audio/webm';
      setRecordedMimeType(effectiveMime);

      if (typeof MediaRecorder !== 'undefined') {
        const mediaRecorder = new MediaRecorder(stream, effectiveMime ? { mimeType: effectiveMime } : undefined);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(200); // 200ms slice
      }

      startVisualizer(stream);
      setIsRecording(true);
      setRecordingTimeSec(0);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTimeSec((prev) => prev + 1);
      }, 1000);

      return true;
    } catch (err: any) {
      console.warn('[SophiaMic] Mic access info:', err?.message || err?.name || 'Permission denied');
      setPermissionState('denied');
      
      // If speech recognition is running anyway, keep recording
      if (isSpeechRecogRunningRef.current) {
        setIsRecording(true);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
          setRecordingTimeSec((prev) => prev + 1);
        }, 1000);
        return true;
      }

      const msg = err.name === 'NotAllowedError'
        ? 'Permiso de micrófono bloqueado en el navegador. Haz clic en el candado 🔒 de la barra de URL para permitirlo, o escribe tu instrucción abajo.'
        : `No se pudo conectar al micrófono (${err.message || 'Dispositivo no encontrado'}).`;
      setErrorMessage(msg);
      if (options.onError) options.onError(msg);
      return false;
    }
  };

  const stopRecording = (): Promise<{ base64: string | null; mimeType: string; transcript: string; durationSec: number }> => {
    return new Promise((resolve) => {
      const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Stop speech recognition
      if (recognitionRef.current && isSpeechRecogRunningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        isSpeechRecogRunningRef.current = false;
      }

      // Stop audio tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }

      stopVisualizer();
      setIsRecording(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, {
            type: recordedMimeType || 'audio/webm',
          });

          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const resultStr = reader.result as string;
            const base64Data = resultStr?.split(',')[1] || null;
            setRecordedAudioBase64(base64Data);

            if (options.onAudioDataReady && base64Data) {
              options.onAudioDataReady(base64Data, recordedMimeType, duration);
            }

            resolve({
              base64: base64Data,
              mimeType: recordedMimeType,
              transcript,
              durationSec: duration,
            });
          };
          reader.onerror = () => {
            resolve({
              base64: null,
              mimeType: recordedMimeType,
              transcript,
              durationSec: duration,
            });
          };
        };

        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          resolve({
            base64: null,
            mimeType: recordedMimeType,
            transcript,
            durationSec: duration,
          });
        }
      } else {
        resolve({
          base64: recordedAudioBase64,
          mimeType: recordedMimeType,
          transcript,
          durationSec: duration,
        });
      }
    });
  };

  const clearAudio = () => {
    setRecordedAudioBase64(null);
    setTranscript('');
    setRecordingTimeSec(0);
    audioChunksRef.current = [];
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  const simulateVoiceInput = (sampleText: string) => {
    setTranscript(sampleText);
    if (options.onTranscriptUpdate) {
      options.onTranscriptUpdate(sampleText);
    }
  };

  return {
    isRecording,
    recordingTimeSec,
    transcript,
    setTranscript,
    audioLevel,
    recordedAudioBase64,
    recordedMimeType,
    errorMessage,
    canvasRef,
    wakeWordDetected,
    continuousListening,
    setContinuousListening,
    startRecording,
    stopRecording,
    clearAudio,
    clearError,
    isSupported,
    permissionState,
    requestPermission,
    simulateVoiceInput,
  };
}
