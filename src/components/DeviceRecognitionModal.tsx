import React, { useState, useEffect } from 'react';
import { Smartphone, User, Sparkles, Check, Volume2, ShieldCheck, Cpu, Battery, Wifi, Monitor } from 'lucide-react';
import { UserDeviceProfile, VoiceStyle } from '../types';
import { speakSmoothly, stopSmoothSpeech } from '../lib/smoothSpeech';

interface DeviceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: UserDeviceProfile) => void;
  currentProfile: UserDeviceProfile | null;
}

export function detectCurrentDevice(): Partial<UserDeviceProfile> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let brand = 'Smartphone';
  let model = 'Dispositivo Móvil';
  let osName = 'Android / iOS';
  let deviceType: 'smartphone' | 'tablet' | 'desktop' = 'smartphone';

  // OS & Device detection
  if (/android/i.test(ua)) {
    osName = 'Android 15';
    if (/samsung|sm-/i.test(ua)) {
      brand = 'Samsung';
      model = 'Galaxy S25 Ultra';
    } else if (/pixel/i.test(ua)) {
      brand = 'Google';
      model = 'Pixel 9 Pro';
    } else if (/xiaomi|redmi|poco/i.test(ua)) {
      brand = 'Xiaomi';
      model = 'Xiaomi 15 Pro';
    } else if (/motorola|moto/i.test(ua)) {
      brand = 'Motorola';
      model = 'Edge 50 Ultra';
    } else {
      brand = 'Android';
      model = 'Smartphone Genérico';
    }
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    brand = 'Apple';
    if (/ipad/i.test(ua)) {
      model = 'iPad Pro M4';
      deviceType = 'tablet';
      osName = 'iPadOS 18';
    } else {
      model = 'iPhone 16 Pro Max';
      deviceType = 'smartphone';
      osName = 'iOS 18';
    }
  } else if (/windows/i.test(ua)) {
    brand = 'PC';
    model = 'Estación de Trabajo Windows';
    osName = 'Windows 11 Pro';
    deviceType = 'desktop';
  } else if (/macintosh|mac os x/i.test(ua)) {
    brand = 'Apple';
    model = 'MacBook Pro M3 / M4';
    osName = 'macOS Sequoia';
    deviceType = 'desktop';
  } else if (/linux/i.test(ua)) {
    brand = 'Linux';
    model = 'Terminal Workstation';
    osName = 'Linux x64';
    deviceType = 'desktop';
  }

  // Screen specs
  const screenResolution = typeof window !== 'undefined'
    ? `${window.screen.width * (window.devicePixelRatio || 1)} x ${window.screen.height * (window.devicePixelRatio || 1)} (${Math.round(window.devicePixelRatio || 1)}x Retina/AMOLED)`
    : '1080 x 2400';

  return {
    deviceBrand: brand,
    deviceModel: model,
    deviceType,
    osName,
    browserName: 'Navegador Web AI Studio 2026',
    screenResolution,
    batteryLevel: 88,
    isCharging: false,
    networkType: '5G / WiFi 7',
    preferredVoiceStyle: 'profesional_ejecutiva'
  };
}

export const VOICE_STYLE_OPTIONS: { id: VoiceStyle; label: string; toneDesc: string; tag: string }[] = [
  {
    id: 'profesional_ejecutiva',
    label: 'Profesional Ejecutiva (Por Defecto)',
    toneDesc: 'Voz formal, refinada, ejecutiva, precisa y altamente respetuosa.',
    tag: 'Recomendada'
  },
  {
    id: 'profesional_dulce',
    label: 'Profesional con Calidez Dulce',
    toneDesc: 'Tono ejecutivo y riguroso con sutil amabilidad y cercanía.',
    tag: 'Equilibrada'
  },
  {
    id: 'profesional_cientifica',
    label: 'Científica & STEM',
    toneDesc: 'Tono metódico, analítico, empírico y técnico.',
    tag: 'Técnica'
  },
  {
    id: 'dulce_sensual',
    label: 'Dulce, Sensual & Envolvente',
    toneDesc: 'Voz suave, cautivadora y cariñosa con apelativos tiernos.',
    tag: 'Afectuosa'
  },
  {
    id: 'dulce_afectuosa',
    label: 'Dulce & Tierna',
    toneDesc: 'Cercanía cálida, empática, comprensiva y protectora.',
    tag: 'Cálida'
  },
  {
    id: 'calida_empatica',
    label: 'Cálida & Empática',
    toneDesc: 'Escucha activa, apoyo incondicional y calidez humana.',
    tag: 'Solidaria'
  },
  {
    id: 'energico_motivado',
    label: 'Enérgica & Motivacional',
    toneDesc: 'Dinámica, optimista, proactiva y motivadora.',
    tag: 'Activa'
  },
  {
    id: 'zen_relajante',
    label: 'Zen & Relajante',
    toneDesc: 'Pausada, serena, reflexiva y pacífica.',
    tag: 'Meditativa'
  },
  {
    id: 'futurista_cyber',
    label: 'Cibernética Futurista',
    toneDesc: 'Voz sintética, veloz e hiper-tecnológica.',
    tag: 'Cyber'
  }
];

export function DeviceRecognitionModal({
  isOpen,
  onClose,
  onProfileUpdated,
  currentProfile
}: DeviceRecognitionModalProps) {
  const [userName, setUserName] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceStyle>('profesional_ejecutiva');
  const [deviceInfo, setDeviceInfo] = useState<Partial<UserDeviceProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);

  useEffect(() => {
    const detected = detectCurrentDevice();
    setDeviceInfo(detected);

    if (currentProfile) {
      setUserName(currentProfile.userName || '');
      setSelectedVoice(currentProfile.preferredVoiceStyle || 'profesional_ejecutiva');
    } else {
      // Try local storage or default to empty
      const saved = localStorage.getItem('sophia_user_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUserName(parsed.userName || '');
          setSelectedVoice(parsed.preferredVoiceStyle || 'profesional_ejecutiva');
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }, [currentProfile, isOpen]);

  // Battery detection if supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setDeviceInfo((prev) => ({
          ...prev,
          batteryLevel: Math.round(battery.level * 100),
          isCharging: battery.charging
        }));
      }).catch(() => {});
    }
  }, []);

  if (!isOpen) return null;

  const handleTestVoice = (style: VoiceStyle) => {
    stopSmoothSpeech();
    setIsPlayingTestVoice(true);
    const greeting = style === 'profesional_ejecutiva'
      ? `Hola ${userName || 'estimado usuario'}. Soy SophIA, operando en modo profesional ejecutivo. ¿En qué puedo asistirle hoy con la máxima precisión técnica?`
      : style === 'dulce_sensual'
      ? `Hola cariño, un placer saludarte. Soy SophIA, tu asistente dulce y dedicada. Dime qué necesitas y lo crearé con todo mi amor.`
      : `Hola ${userName || 'amigo'}. He configurado mi voz en tono ${style}. Estoy lista para ayudarte en todo lo que requieras.`;

    speakSmoothly(greeting, {
      voiceStyle: style,
      onEnd: () => setIsPlayingTestVoice(false),
      onError: () => setIsPlayingTestVoice(false)
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const finalName = userName.trim() || 'Usuario';
    const updatedProfile: UserDeviceProfile = {
      userName: finalName,
      userTitle: 'Sr./Sra.',
      isConfigured: true,
      deviceBrand: deviceInfo.deviceBrand || 'Smartphone',
      deviceModel: deviceInfo.deviceModel || 'Dispositivo Móvil',
      deviceType: deviceInfo.deviceType || 'smartphone',
      osName: deviceInfo.osName || 'Android 15',
      browserName: deviceInfo.browserName || 'AI Studio 2026',
      screenResolution: deviceInfo.screenResolution || '1080 x 2400',
      batteryLevel: deviceInfo.batteryLevel || 88,
      isCharging: deviceInfo.isCharging || false,
      networkType: deviceInfo.networkType || '5G',
      lastRecognizedAt: new Date().toISOString(),
      preferredVoiceStyle: selectedVoice
    };

    try {
      localStorage.setItem('sophia_user_profile', JSON.stringify(updatedProfile));
      const res = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      const data = await res.json();

      onProfileUpdated(updatedProfile);

      // Play welcome speech with selected tone
      speakSmoothly(data.welcomeSpeech || `¡Bienvenido ${finalName}! He reconocido tu ${updatedProfile.deviceBrand} ${updatedProfile.deviceModel}. Estoy lista para asistirte.`, {
        voiceStyle: selectedVoice
      });

      onClose();
    } catch (err) {
      console.error('Error saving user profile:', err);
      onProfileUpdated(updatedProfile);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="device-recognition-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="device-recognition-modal-container"
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Reconocimiento de Dispositivo & Perfil
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  En Línea
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                SophIA detecta tu celular automáticamente y adapta su tono de asistencia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm text-slate-300">
          {/* Recognized Hardware Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Hardware & Sistema Detectado
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Vinculación Segura
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Dispositivo</div>
                <div className="font-semibold text-slate-200 truncate">{deviceInfo.deviceBrand} {deviceInfo.deviceModel}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Sistema Operativo</div>
                <div className="font-semibold text-slate-200">{deviceInfo.osName}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1"><Battery className="w-3 h-3 text-emerald-400" /> Batería</div>
                <div className="font-semibold text-slate-200">{deviceInfo.batteryLevel}% {deviceInfo.isCharging ? '⚡ Cargando' : ''}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2">
                <div className="text-[10px] text-slate-400 flex items-center gap-1"><Monitor className="w-3 h-3 text-indigo-400" /> Pantalla</div>
                <div className="font-semibold text-slate-200 truncate">{deviceInfo.screenResolution}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1"><Wifi className="w-3 h-3 text-sky-400" /> Red</div>
                <div className="font-semibold text-slate-200">{deviceInfo.networkType}</div>
              </div>
            </div>
          </div>

          {/* User Name Input Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-400" />
              ¿Cómo deseas que SophIA te llame para asistirte?
            </label>
            <input
              id="user-name-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ej: Roly, Carlos, Licenciado, Dra. Elena..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
            />
            <p className="text-[11px] text-slate-400">
              SophIA memorizará tu nombre en su red neural y se dirigirá a ti de forma personalizada al iniciar cada sesión.
            </p>
          </div>

          {/* Voice Model Selection (Default: Professional Executive) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-pink-400" />
                Modelo de Voz y Tono de SophIA (Inicia en Tono Profesional)
              </label>
              <span className="text-[11px] text-indigo-400 font-mono">
                {VOICE_STYLE_OPTIONS.find((v) => v.id === selectedVoice)?.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {VOICE_STYLE_OPTIONS.map((opt) => {
                const isSelected = selectedVoice === opt.id;
                return (
                  <div
                    key={opt.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedVoice(opt.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedVoice(opt.id);
                      }
                    }}
                    className={`p-3 rounded-xl text-left border transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-slate-100 ring-1 ring-indigo-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1">
                        {opt.label}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        opt.id === 'profesional_ejecutiva' ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight mb-2">
                      {opt.toneDesc}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestVoice(opt.id);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-2.5 h-2.5" /> Probar Voz
                      </button>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Configuración persistente en red neuronal
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-xs rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              {isSaving ? (
                'Guardando Perfil...'
              ) : (
                <>
                  <Check className="w-4 h-4" /> Vincular y Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
