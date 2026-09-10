import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  Apple,
  CheckCircle2,
  Share2,
  Sparkles,
  WifiOff,
  Zap,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

export const InstallAppTab: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions
      alert(
        'Para instalar SophIA:\n\n• En Android / Chrome: Pulsa los 3 puntos ⋮ en la esquina superior y selecciona "Instalar aplicación" o "Añadir a pantalla principal".\n• En iPhone / iPad: Pulsa el botón Compartir y selecciona "Añadir a pantalla de inicio".\n• En PC / Mac: Haz clic en el ícono de instalar (+) en la barra de direcciones de Chrome o Edge.'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-purple-950/70 border border-rose-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Progressive Web App (PWA) 2026</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Instala SophIA en tu Celular o PC
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Descarga SophIA como aplicación nativa para disfrutar de respuestas de voz ultrarrápidas, control de hogar inteligente, notificaciones en tiempo real y soporte sin conexión.
            </p>
          </div>

          <button
            onClick={handleInstallClick}
            className="px-6 py-3.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-bold shadow-xl shadow-rose-950/60 flex items-center gap-2 transition-all transform hover:scale-105 shrink-0"
          >
            <Download className="w-5 h-5" />
            <span>{isInstalled ? 'App Ya Instalada ✓' : 'Instalar SophIA Ahora'}</span>
          </button>
        </div>
      </div>

      {installSuccess && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl text-xs text-emerald-200 flex items-center gap-3 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>¡SophIA se ha instalado correctamente en tu dispositivo! Búscala en tu pantalla de inicio o menú de apps.</span>
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">Acceso Instantáneo de 1-Toque</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ábrela desde el icono de tu pantalla de inicio sin barras de navegador ni distracciones.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">100% Gratuito y Sin Anuncios</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Todos los motores (GPT, Claude, GLM, DeepSeek, Kimi, Gemini) con enrutamiento libre.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <WifiOff className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">Memoria y Caché Offline</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Conserva tu historial de interacciones, agenda y dispositivos IoT incluso con baja conectividad.
          </p>
        </div>
      </div>

      {/* Installation Instructions by Platform */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200">
          Guía de Instalación según tu Dispositivo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Android */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Smartphone className="w-5 h-5" />
              <h4 className="text-xs font-bold text-white">Android (Chrome / Edge)</h4>
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Abre esta web en **Google Chrome** en tu celular.</li>
              <li>Toca el menú de los tres puntos (**⋮**) arriba a la derecha.</li>
              <li>Selecciona **"Instalar aplicación"** o **"Añadir a pantalla principal"**.</li>
              <li>¡Listo! SophIA aparecerá como una app nativa en tu cajón de aplicaciones.</li>
            </ol>
          </div>

          {/* iPhone / iPad (iOS) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <Apple className="w-5 h-5" />
              <h4 className="text-xs font-bold text-white">iPhone & iPad (Safari)</h4>
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Abre esta web en el navegador **Safari**.</li>
              <li>Toca el botón **Compartir** (el cuadro con una flecha hacia arriba <Share2 className="w-3.5 h-3.5 inline text-slate-400" />).</li>
              <li>Desliza hacia abajo y selecciona **"Añadir a la pantalla de inicio"**.</li>
              <li>Confirma pulsando **"Añadir"** en la esquina superior derecha.</li>
            </ol>
          </div>

          {/* PC / Mac / Linux */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <Laptop className="w-5 h-5" />
              <h4 className="text-xs font-bold text-white">PC / Mac / Linux</h4>
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Usa **Google Chrome**, **Microsoft Edge** o **Brave**.</li>
              <li>Haz clic en el icono de instalación **(+)** en la barra de direcciones superior.</li>
              <li>O presiona los tres puntos (**⋮**) → **"Instalar SophIA..."**.</li>
              <li>Se creará un acceso directo en tu Escritorio y Barra de Tareas.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
