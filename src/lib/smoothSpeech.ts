// High-Performance Smooth Speech Engine for SophIA
// Solves: Chrome/Safari speech cutoff bug, garbage collection stuttering, chunking long text, stripping markdown/code glitches, sentence repetition & voice tone refinement

import { VoiceStyle } from '../types';

export interface SpeechEngineOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  voiceURI?: string;
  voiceStyle?: VoiceStyle | string;
  onStart?: () => void;
  onChunkStart?: (chunkIndex: number, totalChunks: number, text: string) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface LipSyncVisemeFrame {
  isSpeaking: boolean;
  mouthOpen: number; // 0 (closed) to 1.0 (fully open)
  mouthWidth: number; // in pixels (e.g. 26 to 48)
  mouthHeight: number; // in pixels (e.g. 2 to 22)
  visemeType: 'rest' | 'A' | 'E' | 'I' | 'O' | 'U' | 'smile' | 'fricative' | 'bilabial';
  teethVisible: boolean;
  lipCurvature: number; // -4 to +2
  audioLevel: number; // 0 to 1.0
}

// Global active references to prevent browser garbage collection of active utterances
const activeUtterances: Set<SpeechSynthesisUtterance> = new Set();
let isSpeechActive = false;
let serverTtsDisabledUntil = 0; // Timestamp cooldown when server TTS quota is exhausted
let currentChunks: string[] = [];
let currentChunkIndex = 0;
let currentOptions: SpeechEngineOptions = {};
let keepAliveTimer: any = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
const speechStatusListeners: Set<(speaking: boolean) => void> = new Set();
const lipSyncListeners: Set<(frame: LipSyncVisemeFrame) => void> = new Set();

let lipSyncAnimFrame: any = null;
let currentLipSyncText = '';
let currentWordCharIndex = 0;
let lastBoundaryTimestamp = 0;

export function subscribeSpeechStatus(callback: (speaking: boolean) => void): () => void {
  speechStatusListeners.add(callback);
  callback(isSmoothSpeechPlaying());
  return () => {
    speechStatusListeners.delete(callback);
  };
}

export function subscribeLipSyncStream(callback: (frame: LipSyncVisemeFrame) => void): () => void {
  lipSyncListeners.add(callback);
  callback(getCurrentLipSyncFrame());
  return () => {
    lipSyncListeners.delete(callback);
  };
}

function notifySpeechStatus(speaking: boolean) {
  speechStatusListeners.forEach((cb) => {
    try {
      cb(speaking);
    } catch (e) {}
  });
  if (!speaking) {
    stopLipSyncAnimation();
  }
}

function notifyLipSyncFrame(frame: LipSyncVisemeFrame) {
  lipSyncListeners.forEach((cb) => {
    try {
      cb(frame);
    } catch (e) {}
  });
}

function getCurrentLipSyncFrame(): LipSyncVisemeFrame {
  return {
    isSpeaking: isSpeechActive,
    mouthOpen: isSpeechActive ? 0.4 : 0,
    mouthWidth: 26,
    mouthHeight: isSpeechActive ? 8 : 2,
    visemeType: isSpeechActive ? 'A' : 'rest',
    teethVisible: isSpeechActive,
    lipCurvature: 0,
    audioLevel: isSpeechActive ? 0.5 : 0
  };
}

/**
 * Maps a phonetic character sequence to exact visual lip parameters
 */
function getVisemeFromChar(char: string): {
  type: 'rest' | 'A' | 'E' | 'I' | 'O' | 'U' | 'smile' | 'fricative' | 'bilabial';
  open: number;
  width: number;
  height: number;
  teeth: boolean;
  curve: number;
} {
  const c = (char || '').toLowerCase();
  if (!c || c === ' ' || c === '.' || c === ',') {
    return { type: 'rest', open: 0.05, width: 26, height: 2, teeth: false, curve: 0 };
  }
  if (c === 'a' || c === 'á') {
    return { type: 'A', open: 0.88, width: 34, height: 17, teeth: true, curve: 0 };
  }
  if (c === 'e' || c === 'é') {
    return { type: 'E', open: 0.55, width: 38, height: 9, teeth: true, curve: -2.5 };
  }
  if (c === 'i' || c === 'í' || c === 'y') {
    return { type: 'I', open: 0.42, width: 39, height: 6, teeth: true, curve: -3.5 };
  }
  if (c === 'o' || c === 'ó') {
    return { type: 'O', open: 0.82, width: 28, height: 18, teeth: false, curve: 0 };
  }
  if (c === 'u' || c === 'ú' || c === 'w') {
    return { type: 'U', open: 0.65, width: 22, height: 14, teeth: false, curve: 1.2 };
  }
  if (c === 'm' || c === 'b' || c === 'p') {
    return { type: 'bilabial', open: 0.04, width: 28, height: 1.5, teeth: false, curve: 0 };
  }
  if (c === 'f' || c === 'v') {
    return { type: 'fricative', open: 0.32, width: 30, height: 5, teeth: true, curve: -1 };
  }
  if (c === 's' || c === 'c' || c === 'z' || c === 't' || c === 'd' || c === 'n' || c === 'r' || c === 'l') {
    return { type: 'smile', open: 0.45, width: 35, height: 7, teeth: true, curve: -2 };
  }
  return { type: 'A', open: 0.6, width: 32, height: 10, teeth: true, curve: 0 };
}

function startLipSyncAnimation() {
  if (lipSyncAnimFrame) cancelAnimationFrame(lipSyncAnimFrame);

  let phase = 0;
  const updateLoop = () => {
    if (!isSpeechActive) {
      notifyLipSyncFrame({
        isSpeaking: false,
        mouthOpen: 0,
        mouthWidth: 26,
        mouthHeight: 2,
        visemeType: 'rest',
        teethVisible: false,
        lipCurvature: 0,
        audioLevel: 0
      });
      return;
    }

    phase += 0.14;
    const now = Date.now();
    const elapsedSinceBoundary = now - lastBoundaryTimestamp;

    // Estimate character offset based on speech pacing (~14 chars per second)
    const charOffset = Math.floor(elapsedSinceBoundary / 70);
    const targetChar = currentLipSyncText[currentWordCharIndex + charOffset] || currentLipSyncText[currentWordCharIndex] || 'a';
    const viseme = getVisemeFromChar(targetChar);

    // Natural rhythmic vocal modulation
    const oscillation = Math.sin(phase) * 0.15;
    const currentOpen = Math.max(0.1, Math.min(1.0, viseme.open + oscillation));
    const currentWidth = Math.round(viseme.width + Math.sin(phase * 0.8) * 2);
    const currentHeight = Math.max(3, Math.round(viseme.height * currentOpen));

    notifyLipSyncFrame({
      isSpeaking: true,
      mouthOpen: currentOpen,
      mouthWidth: currentWidth,
      mouthHeight: currentHeight,
      visemeType: viseme.type,
      teethVisible: viseme.teeth,
      lipCurvature: viseme.curve,
      audioLevel: currentOpen * 0.8
    });

    lipSyncAnimFrame = requestAnimationFrame(updateLoop);
  };

  lipSyncAnimFrame = requestAnimationFrame(updateLoop);
}

function stopLipSyncAnimation() {
  if (lipSyncAnimFrame) {
    cancelAnimationFrame(lipSyncAnimFrame);
    lipSyncAnimFrame = null;
  }
  notifyLipSyncFrame({
    isSpeaking: false,
    mouthOpen: 0,
    mouthWidth: 26,
    mouthHeight: 2,
    visemeType: 'rest',
    teethVisible: false,
    lipCurvature: 0,
    audioLevel: 0
  });
}

// Initialize voices listener eagerly
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

// Recent speech cache to prevent duplicate triggers across components within a short window
let lastSpokenTextCache = '';
let lastSpokenTimestamp = 0;

/**
 * Deduplicates repeated sentences, echoed words, or looping phrases to ensure natural, stutter-free speech.
 */
export function deduplicateSentences(text: string): string {
  if (!text) return '';
  
  // 1. Remove user prompt echoes or redundant conversational frames
  let cleaned = text
    .replace(/(?:has preguntado|tu instrucción fue|tu consulta fue|has dicho|el usuario preguntó|el usuario dijo|el comando fue|comando recibido|instrucción recibida)[\s\S]*?(?=[.!?¿¡]|\n|$)/gi, '')
    .replace(/(?:^|\n)(?:usuario|user|prompt|instrucción):\s*.+$/gim, '');

  // 2. Remove consecutive duplicate words (e.g. "el el", "de de", "para para", "con con")
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');

  // 3. Split into sentences and filter duplicates / near-duplicates
  const rawSentences = cleaned.split(/(?<=[.!?¿¡])\s+|\n+/);
  const uniqueSentences: string[] = [];
  const seenNorm = new Set<string>();

  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    // Normalized key (lowercase alphanumeric only)
    const norm = trimmed.toLowerCase().replace(/[^a-záéíóúüñ0-9]/gi, '');
    if (!norm || norm.length < 4) {
      if (trimmed.length > 0) uniqueSentences.push(trimmed);
      continue;
    }
    if (!seenNorm.has(norm)) {
      seenNorm.add(norm);
      uniqueSentences.push(trimmed);
    }
  }

  let result = uniqueSentences.join(' ');
  // Double-check for repeated large phrases (e.g. repeated greetings)
  result = result.replace(/\b(hola soy sophia|buenos días soy sophia|buenas tardes soy sophia)\b[\s\S]*?\b\1\b/gi, '$1');

  return result.trim();
}

/**
 * Strips analysis sections, code blocks, markdown symbols (*, +, -, #, `, etc.), ASCII tables, links, and emojis
 * into smooth, natural, direct conversational Spanish for SophIA, strictly adhering to the directive:
 * "las respuestas de SophIA solo deben mostrar la respuesta y no su análisis en la voz, no debe decir código ni asterisco, más, menos"
 */
export function cleanTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove internal reasoning / chain-of-thought / thought scratchpads if any leaked
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  text = text.replace(/\[(?:pensamiento|análisis|cot|reasoning)\][\s\S]*?\[\/(?:pensamiento|análisis|cot|reasoning)\]/gi, '');
  text = text.replace(/(?:^|\n)(?:pensamiento|análisis interno|cadena de razonamiento):\s*[\s\S]*?(?=\n\n|\n[A-Z#]|$)/gi, ' ');

  // 2. Remove simulation breakdown metadata headers that should not be spoken
  text = text.replace(/(?:###?\s*)?(?:simulación\s+de\s+\d+\s+escenarios|escenario\s+\d+[:\s][^\n]+|probabilidad[:\s][^\n]+|nivel\s+de\s+riesgo[:\s][^\n]+|mitigaci[oó]n[:\s][^\n]+|verificaci[oó]n\s+anti-alucinaci[oó]n[:\s][^\n]+|fact\s+check[:\s][^\n]+)\s*/gi, ' ');

  // 3. Deduplicate obvious repetitions
  text = deduplicateSentences(text);

  // 4. Multi-line code blocks: Never read code tokens! Replace with a warm natural spoken statement or omit
  text = text.replace(/```(?:typescript|javascript|tsx|jsx|html|css|python|json|bash|sql|cpp|csharp|php|ruby|java|rust|go)?\s*[\s\S]*?```/gi, ' He generado el código completo en pantalla. ');

  // 5. Replace markdown tables with smooth space
  text = text.replace(/\|(.+)\|/g, (match) => {
    if (match.includes('---')) return '';
    return ' ';
  });

  // 6. Remove inline code backticks and any technical function brackets
  text = text.replace(/`([^`]+)`/g, '$1');

  // 7. Remove image tags ![alt](url) and markdown links [text](url) -> text
  text = text.replace(/!\[(.*?)\]\(.*?\)/g, '$1');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');

  // 8. Remove markdown formatting symbols: headers, bold, italics, strikethrough, blockquotes
  text = text.replace(/#{1,6}\s+/g, '');
  text = text.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1');
  text = text.replace(/_{1,3}(.*?)_{1,3}/g, '$1');
  text = text.replace(/~~(.*?)~~/g, '$1');
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/---/g, '');
  text = text.replace(/===/g, '');

  // 9. Remove bullet point markers at line starts (+, -, *, •, 1., 2.)
  text = text.replace(/^\s*[-*+•]\s+/gm, ' ');
  text = text.replace(/^\s*\d+[\.\)]\s+/gm, ' ');

  // 10. Strip stray symbols so speech engines never pronounce "asterisco", "más", "menos", "barra", etc.
  text = text.replace(/[*+~^<>{}[\]\\/]/g, ' ');
  // Replace standalone dashes or hyphens that might be read as "menos"
  text = text.replace(/(?<=\s)[-—–](?=\s)/g, ' ');
  text = text.replace(/[-—–]{2,}/g, ' ');

  // 11. Clean literal artifact words if accidentally uttered
  text = text.replace(/\b(?:asterisco|asteriscos|c[oó]digo\s+fuente\s+en\s+pantalla|bloque\s+de\s+c[oó]digo)\b/gi, '');

  // 12. Remove raw JSON brackets or curly braces
  text = text.replace(/\{"[\s\S]*?"\}/g, ' ');
  text = text.replace(/[{}<>\\/]/g, ' ');

  // 13. Remove common emojis that speech engines pronounce awkwardly
  text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // 14. Normalize spacing, double periods and line breaks
  text = text.replace(/\n+/g, '. ');
  text = text.replace(/\s*\.\s*\./g, '.');
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

/**
 * Splits text into natural sentence chunks of 70-100 characters
 * to avoid browser SpeechSynthesis buffer timeouts and stuttering.
 */
export function splitIntoSpeechChunks(text: string, maxChunkLen = 95): string[] {
  if (!text) return [];

  // Split on punctuation first
  const rawSentences = text.split(/(?<=[.!?¿¡;:])\s+|\n+/);
  const chunks: string[] = [];

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxChunkLen) {
      chunks.push(trimmed);
    } else {
      // Split by commas or clauses
      const subClauses = trimmed.split(/(?<=[,])\s+/);
      let currentBuffer = '';

      for (const clause of subClauses) {
        if ((currentBuffer + ' ' + clause).trim().length <= maxChunkLen) {
          currentBuffer = (currentBuffer + ' ' + clause).trim();
        } else {
          if (currentBuffer) chunks.push(currentBuffer);
          if (clause.length <= maxChunkLen) {
            currentBuffer = clause;
          } else {
            // Split by words
            const words = clause.split(/\s+/);
            let wordBuffer = '';
            for (const word of words) {
              if ((wordBuffer + ' ' + word).trim().length <= maxChunkLen) {
                wordBuffer = (wordBuffer + ' ' + word).trim();
              } else {
                if (wordBuffer) chunks.push(wordBuffer);
                wordBuffer = word;
              }
            }
            currentBuffer = wordBuffer;
          }
        }
      }
      if (currentBuffer) chunks.push(currentBuffer);
    }
  }

  return chunks.filter((c) => c.length > 1);
}

/**
 * Finds the highest quality natural Spanish or user-selected voice available in the client.
 */
export function getBestSpanishVoice(preferredURI?: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. If explicit voice URI or voice name was requested by user
  if (preferredURI) {
    const preferred = voices.find((v) => v.voiceURI === preferredURI || v.name === preferredURI);
    if (preferred) return preferred;
  }

  // 2. Filter Spanish voices
  const esVoices = voices.filter((v) => v.lang.startsWith('es') || v.lang.startsWith('ES'));
  if (esVoices.length === 0) return voices[0] || null;

  // Priority ranking for natural sweet female voices
  const priorityPatterns = [
    /monica|mónica/i,
    /paulina/i,
    /elena/i,
    /sabina/i,
    /dalia/i,
    /paloma/i,
    /lucia|lucía/i,
    /google.*español/i,
    /google.*spanish/i,
    /microsoft.*helena/i,
    /microsoft.*sabina/i,
    /microsoft.*es/i,
    /natural/i,
    /female/i,
    /mujer/i,
    /es-es/i,
    /es-mx/i,
    /es-us/i,
  ];

  for (const pattern of priorityPatterns) {
    const match = esVoices.find((v) => pattern.test(v.name) || pattern.test(v.voiceURI));
    if (match) return match;
  }

  return esVoices[0];
}

/**
 * Plays short warm chime tone before voice starts for sweet effect
 */
export function playHarmonicChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.18); // A5

      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
      osc2.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.18); // E6

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);

      setTimeout(() => {
        try {
          ctx.close();
        } catch (e) {}
        resolve();
      }, 200);
    } catch (e) {
      resolve();
    }
  });
}

// Global audio element for Neural Gemini Voice
let neuralAudioElement: HTMLAudioElement | null = null;

/**
 * Main function to start smooth, uninterrupted voice playback for SophIA
 * Maps voice styles directly to realistic pitch, rate and Gemini neural voices.
 */
export async function speakSmoothSophia(
  rawText: string,
  options: SpeechEngineOptions = {}
): Promise<void> {
  const cleanedText = cleanTextForSpeech(rawText);
  if (!cleanedText) {
    if (options.onEnd) options.onEnd();
    return;
  }

  // Anti-repetition debounce: If the exact same text was triggered less than 3 seconds ago, ignore duplicate
  const now = Date.now();
  if (cleanedText === lastSpokenTextCache && (now - lastSpokenTimestamp) < 3000) {
    return;
  }
  lastSpokenTextCache = cleanedText;
  lastSpokenTimestamp = now;

  // Cancel any previous running speech or audio
  stopSmoothSophia();

  // Calculate tone pitch, rate and neural voice based on voiceStyle (Defaults to Executive)
  const style = options.voiceStyle || 'ejecutivo';
  let calculatedPitch = options.pitch ?? 1.0;
  let calculatedRate = options.rate ?? 1.02;
  let geminiVoiceName = 'Puck'; // Professional, clear & poised executive voice default

  if (style === 'ejecutivo' || style === 'profesional_ejecutiva') {
    calculatedPitch = 1.0;
    calculatedRate = 1.04;
    geminiVoiceName = 'Puck'; // Voz firme, elocuente y ejecutiva
  } else if (style === 'creativo') {
    calculatedPitch = 1.08;
    calculatedRate = 0.94;
    geminiVoiceName = 'Zephyr'; // Voz inspiradora, expresiva y poética
  } else if (style === 'casual') {
    calculatedPitch = 1.05;
    calculatedRate = 1.0;
    geminiVoiceName = 'Kore'; // Voz cercana, cálida y conversacional
  } else if (style === 'profesional_dulce') {
    calculatedPitch = 1.04;
    calculatedRate = 1.0;
    geminiVoiceName = 'Aoede';
  } else if (style === 'profesional_cientifica') {
    calculatedPitch = 0.98;
    calculatedRate = 1.05;
    geminiVoiceName = 'Fenrir';
  } else if (style === 'dulce_sensual') {
    calculatedPitch = 1.16;
    calculatedRate = 0.92;
    geminiVoiceName = 'Kore';
  } else if (style === 'dulce_afectuosa') {
    calculatedPitch = 1.12;
    calculatedRate = 0.98;
    geminiVoiceName = 'Aoede';
  } else if (style === 'elegante_seductora') {
    calculatedPitch = 1.04;
    calculatedRate = 0.90;
    geminiVoiceName = 'Zephyr';
  } else if (style === 'calida_empatica' || style === 'calida_amigable') {
    calculatedPitch = 1.06;
    calculatedRate = 0.98;
    geminiVoiceName = 'Kore';
  } else if (style === 'energico_motivado') {
    calculatedPitch = 1.12;
    calculatedRate = 1.10;
    geminiVoiceName = 'Puck';
  } else if (style === 'zen_relajante') {
    calculatedPitch = 0.95;
    calculatedRate = 0.88;
    geminiVoiceName = 'Aoede';
  } else if (style === 'futurista_cyber' || style === 'cyber_futurista') {
    calculatedPitch = 1.25;
    calculatedRate = 1.12;
    geminiVoiceName = 'Charon';
  }

  // If explicit pitch or rate passed in options, prefer them
  if (typeof options.pitch === 'number' && options.pitch > 0) {
    calculatedPitch = options.pitch;
  }
  if (typeof options.rate === 'number' && options.rate > 0) {
    calculatedRate = options.rate;
  }

  const effectiveOptions: SpeechEngineOptions = {
    ...options,
    pitch: calculatedPitch,
    rate: calculatedRate,
    voiceURI: options.voiceURI
  };

  // Attempt Neural TTS from backend if network permits and not on quota cooldown
  if (Date.now() > serverTtsDisabledUntil) {
    try {
      const ttsRes = await fetch('/api/voice-assistant/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanedText.slice(0, 600),
          voiceName: geminiVoiceName,
          pitch: calculatedPitch,
          rate: calculatedRate
        }),
      });

      if (ttsRes.ok) {
        const data = await ttsRes.json();
        if (data.useWebSpeechFallback) {
          // Server signaled that Web Speech fallback should be preferred (quota or latency)
          serverTtsDisabledUntil = Date.now() + 300000; // 5 min cooldown
        }
        if (data.success && data.audioBase64) {
          const audioSrc = `data:${data.mimeType || 'audio/mp3'};base64,${data.audioBase64}`;
          neuralAudioElement = new Audio(audioSrc);
          isSpeechActive = true;

          if (effectiveOptions.onStart) effectiveOptions.onStart();
          if (effectiveOptions.onChunkStart) {
            effectiveOptions.onChunkStart(0, 1, cleanedText.slice(0, 80));
          }

          neuralAudioElement.onended = () => {
            isSpeechActive = false;
            neuralAudioElement = null;
            notifySpeechStatus(false);
            if (effectiveOptions.onEnd) effectiveOptions.onEnd();
          };

          neuralAudioElement.onerror = () => {
            neuralAudioElement = null;
            notifySpeechStatus(false);
            // Fall back to Web Speech
            fallbackWebSpeech(cleanedText, effectiveOptions);
          };

          notifySpeechStatus(true);
          currentLipSyncText = cleanedText;
          currentWordCharIndex = 0;
          lastBoundaryTimestamp = Date.now();
          startLipSyncAnimation();
          try {
            await neuralAudioElement.play();
            return;
          } catch (playErr) {
            console.warn('[SmoothSpeech] Autoplay policy blocked neural audio, switching to WebSpeech fallback:', playErr);
            neuralAudioElement = null;
            notifySpeechStatus(false);
            fallbackWebSpeech(cleanedText, effectiveOptions);
            return;
          }
        }
      } else if (ttsRes.status === 429 || ttsRes.status === 503) {
        // Quota exhausted or service busy on server side: enter client-side cooldown
        serverTtsDisabledUntil = Date.now() + 300000; // 5 minutes cooldown
      }
    } catch (e) {
      // If backend TTS is unavailable, fall back smoothly
      serverTtsDisabledUntil = Date.now() + 60000;
    }
  }

  fallbackWebSpeech(cleanedText, effectiveOptions);
}

function fallbackWebSpeech(cleanedText: string, options: SpeechEngineOptions) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options.onError) options.onError(new Error('SpeechSynthesis no disponible'));
    return;
  }

  currentChunks = splitIntoSpeechChunks(cleanedText);
  if (currentChunks.length === 0) {
    if (options.onEnd) options.onEnd();
    return;
  }

  currentChunkIndex = 0;
  currentOptions = options;
  isSpeechActive = true;
  notifySpeechStatus(true);

  if (options.onStart) options.onStart();

  // Chrome keep-alive hack: periodically resume to prevent engine freezing on long audio
  clearInterval(keepAliveTimer);
  keepAliveTimer = setInterval(() => {
    if (isSpeechActive && window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  }, 4500);

  speakNextChunk();
}

function speakNextChunk() {
  if (!isSpeechActive || currentChunkIndex >= currentChunks.length) {
    stopSmoothSophia();
    notifySpeechStatus(false);
    if (currentOptions.onEnd) currentOptions.onEnd();
    return;
  }

  const chunkText = currentChunks[currentChunkIndex];
  const utterance = new SpeechSynthesisUtterance(chunkText);

  // Settings for sweet, feminine and calm voice
  utterance.lang = 'es-ES';
  utterance.pitch = currentOptions.pitch ?? 1.1;
  utterance.rate = currentOptions.rate ?? 0.96;
  utterance.volume = currentOptions.volume ?? 1.0;

  const voice = getBestSpanishVoice(currentOptions.voiceURI);
  if (voice) utterance.voice = voice;

  // Track active utterance to avoid garbage collection bug
  activeUtterances.add(utterance);

  if (currentOptions.onChunkStart) {
    currentOptions.onChunkStart(currentChunkIndex, currentChunks.length, chunkText);
  }

  let chunkCompleted = false;

  const handleNext = () => {
    if (chunkCompleted) return;
    chunkCompleted = true;
    activeUtterances.delete(utterance);
    currentChunkIndex++;
    if (isSpeechActive) {
      // Gentle 60ms pause between phrases for organic natural cadence without stuttering
      setTimeout(() => {
        speakNextChunk();
      }, 60);
    }
  };

  utterance.onstart = () => {
    currentLipSyncText = chunkText;
    currentWordCharIndex = 0;
    lastBoundaryTimestamp = Date.now();
    startLipSyncAnimation();
  };

  utterance.onboundary = (event: SpeechSynthesisEvent) => {
    if (event.name === 'word' || event.name === 'sentence') {
      currentWordCharIndex = event.charIndex || 0;
      lastBoundaryTimestamp = Date.now();
    }
  };

  utterance.onend = handleNext;
  utterance.onerror = (e) => {
    console.warn('Speech chunk event:', e);
    handleNext();
  };

  try {
    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (err) {
    console.error('Error in window.speechSynthesis.speak:', err);
    handleNext();
  }
}

/**
 * Stops all speech playback cleanly and cleans up memory
 */
export function stopSmoothSophia(): void {
  isSpeechActive = false;
  notifySpeechStatus(false);
  clearInterval(keepAliveTimer);
  activeUtterances.clear();
  currentChunks = [];
  currentChunkIndex = 0;

  if (neuralAudioElement) {
    try {
      neuralAudioElement.pause();
      neuralAudioElement.currentTime = 0;
    } catch (e) {}
    neuralAudioElement = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

export const stopSmoothSpeech = stopSmoothSophia;
export const speakSmoothly = speakSmoothSophia;

/**
 * Checks if speech is currently playing
 */
export function isSmoothSpeechPlaying(): boolean {
  if (neuralAudioElement && !neuralAudioElement.paused) return true;
  return isSpeechActive && typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
}
