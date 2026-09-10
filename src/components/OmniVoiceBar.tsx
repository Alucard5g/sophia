import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bluetooth,
  Home,
  Smartphone,
  CheckCircle2,
  Volume2,
  Tv,
  Music,
  Zap,
  ArrowRight,
  Mail,
  MessageSquare
} from 'lucide-react';
import { SophiaVoiceProfile } from '../types';
import { speakSmoothSophia, stopSmoothSophia, playHarmonicChime } from '../lib/smoothSpeech';
import { useSophiaMic } from '../lib/useSophiaMic';

interface OmniVoiceBarProps {
  onExecuteCommand: (command: string) => void;
  voiceProfile?: SophiaVoiceProfile;
}

export const OmniVoiceBar: React.FC<OmniVoiceBarProps> = ({
  onExecuteCommand,
  voiceProfile
}) => {
  const [inputText, setInputText] = useState('');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isRecording,
    startRecording,
    stopRecording,
    clearError
  } = useSophiaMic({
    onTranscriptUpdate: (text) => {
      setInputText(text);
    }
  });

  const toggleListen = async () => {
    clearError();
    if (isRecording) {
      const res = await stopRecording();
      if (res.transcript) {
        setInputText(res.transcript);
      }
    } else {
      await startRecording();
    }
  };

  // Speak feedback with high fidelity, anti-stutter SophIA Voice
  const speakFeedback = async (text: string) => {
    await playHarmonicChime();
    speakSmoothSophia(text, {
      pitch: voiceProfile?.pitch || 1.12,
      rate: voiceProfile?.rate || 0.96,
      voiceStyle: voiceProfile?.voiceStyle || 'dulce_sensual'
    });
  };

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;

    const cmd = inputText.trim();
    setIsProcessing(true);
    setLastFeedback('Procesando instrucción con simulación de escenarios...');

    try {
      const res = await fetch('/api/universal-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();

      if (data.feedbackSpeech && !data.forwardToAi) {
        setLastFeedback(data.feedbackSpeech);
        speakFeedback(data.feedbackSpeech);
      } else if (data.feedbackSpeech) {
        setLastFeedback(data.feedbackSpeech);
      }

      // If user ordered to send WhatsApp or Email with link
      if (data.whatsappUrl && !cmd.toLowerCase().includes("no abras")) {
        // Can open in new tab if user wants
      }

      onExecuteCommand(cmd);
    } catch (err) {
      console.error(err);
      onExecuteCommand(cmd);
    } finally {
      setIsProcessing(false);
      setInputText('');
      setTimeout(() => {
        setLastFeedback(null);
      }, 9000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full bg-slate-900/95 border border-indigo-500/20 backdrop-blur-md rounded-2xl p-3 shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {/* Left Indicator & Icon */}
        <div className="hidden sm:flex items-center gap-2 text-indigo-400 pl-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-bold text-white font-mono tracking-wider">SophIA Control Total:</span>
        </div>

        {/* Input Bar with Voice & Send Controls */}
        <div className="relative flex-1 w-full flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-indigo-500 transition-all shadow-inner">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Dicta: 'SophIA pon música', 'lee mis mensajes', 'apaga la TV', 'envía un WhatsApp a Valentina', 'modo cine'..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none pr-16"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {/* Microphone Button */}
            <button
              onClick={toggleListen}
              title={isRecording ? 'Detener dictado por voz' : 'Dictar instrucción por voz a SophIA'}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-rose-400" />}
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isProcessing}
              title="Enviar instrucción"
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Voice / Action Feedback Box */}
      {lastFeedback && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400 shrink-0 animate-spin" />
            <span className="font-medium">{lastFeedback}</span>
          </div>
          <button
            onClick={() => speakFeedback(lastFeedback)}
            title="Escuchar respuesta de SophIA"
            className="p-1.5 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-rose-400" /> Escuchar Voz
          </button>
        </div>
      )}

      {/* Fast Voice Shortcuts */}
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <span className="text-[10px] text-slate-500 font-mono shrink-0">Comandos rápidos:</span>
        {[
          { label: '🎵 Pon Música en Spotify', cmd: 'SophIA, pon música en Spotify' },
          { label: '💬 Lee mis Mensajes', cmd: 'SophIA, lee mis mensajes de WhatsApp' },
          { label: '📺 Apaga la Smart TV', cmd: 'SophIA, apaga la TV' },
          { label: '📺 Enciende TV & Netflix', cmd: 'SophIA, enciende la TV y pon Netflix' },
          { label: '✉️ Lee mis Correos', cmd: 'SophIA, lee mis correos recientes' },
          { label: '🔊 Subir volumen al 80%', cmd: 'SophIA, sube el volumen del equipo de sonido al 80%' },
          { label: '🔥 Activar Mega Bass', cmd: 'SophIA, activa el modo bajos en el equipo de sonido' },
          { label: '🍿 Modo Cine', cmd: 'SophIA, modo cine' }
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputText(item.cmd);
            }}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/60 border border-slate-800/80 hover:border-indigo-500/30 text-[10px] text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

