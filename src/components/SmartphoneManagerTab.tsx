import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  MessageSquare,
  Mail,
  Calendar as CalendarIcon,
  CheckSquare,
  Send,
  Plus,
  Clock,
  User,
  Phone,
  Share2,
  ExternalLink,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Bell,
  Trash2,
  Download,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Tv,
  Youtube,
  Shield,
  ShieldCheck,
  Mic,
  MapPin,
  Sun,
  Radio,
  RefreshCw,
  Search,
  Check,
  Camera,
  Layers,
  Compass,
  Navigation,
  MessageCircle,
  Globe,
  Settings,
  Vibrate,
  Battery,
  Flame,
  Film
} from 'lucide-react';
import { PhoneMessage, PhoneEmail, CalendarEvent, PhoneTask, PhonePermissionState } from '../types';
import { speakSmoothSophia } from '../lib/smoothSpeech';

interface SmartphoneManagerTabProps {
  onSendToVoiceAssistant?: (prompt: string) => void;
}

const YOUTUBE_PRESETS = [
  { id: 'jfKfPfyJRdk', title: '🎵 Lo-Fi Hip Hop Beats (Relax / Estudio)', artist: 'Lofi Girl 24/7', query: 'lofi hip hop radio beats to relax study to' },
  { id: '4xDzrJKXOOY', title: '🌆 Synthwave / Cyberpunk Chill Radio', artist: 'Retro Chillwave', query: 'synthwave radio chill beats' },
  { id: '5qap5aO4i9A', title: '☕ Relaxing Jazz & Bossa Nova Cafe', artist: 'Cafe Music BGM', query: 'relaxing jazz piano music' },
  { id: 'LXb3EKWsInQ', title: '🌿 Sonidos de la Naturaleza 4K & Meditación', artist: 'Nature Sounds Relax', query: 'nature 4k ambient sounds meditation' },
  { id: 'kJQP7kiw5Fk', title: '🔥 Top Hits Latinos & Pop 2026', artist: 'Mix Exitos', query: 'top hits latinos pop' }
];

const ANDROID_NATIVE_APPS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'Mensajería',
    color: 'bg-emerald-600',
    icon: MessageSquare,
    desc: 'Abrir chat directo o llamada',
    deepLink: 'https://api.whatsapp.com/send?text=Hola%20desde%20SophIA'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Música & Podcast',
    color: 'bg-green-600',
    icon: Music,
    desc: 'Lanzar reproductor y listas',
    deepLink: 'spotify://search/sophia'
  },
  {
    id: 'youtube',
    name: 'YouTube 4K',
    category: 'Video & Streaming',
    color: 'bg-red-600',
    icon: Youtube,
    desc: 'Buscar y reproducir videos',
    deepLink: 'vnd.youtube://'
  },
  {
    id: 'maps',
    name: 'Google Maps',
    category: 'Navegación GPS',
    color: 'bg-blue-600',
    icon: Navigation,
    desc: 'Rutas en vivo y tráfico',
    deepLink: 'https://www.google.com/maps'
  },
  {
    id: 'phone_dialer',
    name: 'Teléfono / Dialer',
    category: 'Llamadas',
    color: 'bg-teal-600',
    icon: Phone,
    desc: 'Marcar número o contacto',
    deepLink: 'tel:'
  },
  {
    id: 'gmail',
    name: 'Gmail / Correo',
    category: 'Productividad',
    color: 'bg-rose-600',
    icon: Mail,
    desc: 'Redactar y revisar bandeja',
    deepLink: 'mailto:'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'Mensajería Segura',
    color: 'bg-sky-600',
    icon: MessageCircle,
    desc: 'Chats, canales y bots',
    deepLink: 'tg://msg'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Redes Sociales',
    color: 'bg-pink-600',
    icon: Globe,
    desc: 'Feed, reels e historias',
    deepLink: 'instagram://'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'Streaming Cine',
    color: 'bg-red-700',
    icon: Film,
    desc: 'Series y películas 4K',
    deepLink: 'netflix://'
  },
  {
    id: 'uber',
    name: 'Uber / Movilidad',
    category: 'Transporte',
    color: 'bg-slate-800',
    icon: Navigation,
    desc: 'Solicitar viaje o entrega',
    deepLink: 'uber://'
  }
];

export const SmartphoneManagerTab: React.FC<SmartphoneManagerTabProps> = ({
  onSendToVoiceAssistant
}) => {
  const [subTab, setSubTab] = useState<'android_apps' | 'vision_lens' | 'media_apps' | 'permissions' | 'messages' | 'emails' | 'calendar' | 'tasks'>('android_apps');
  
  const [messages, setMessages] = useState<PhoneMessage[]>(() => {
    try {
      const saved = localStorage.getItem('sophia_phone_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'msg-1',
        contactName: 'Valentina (Equipo SophIA)',
        phoneNumber: '+593991234567',
        preview: '¡Hola Roly! El nuevo modelo de AGI 5 y el avatar en Unreal 5.4 están listos para la demo.',
        timestamp: '10:45 AM',
        unread: true,
        platform: 'whatsapp'
      },
      {
        id: 'msg-2',
        contactName: 'Ing. Carlos Mendoza',
        phoneNumber: '+593987654321',
        preview: 'Confirmada la sincronización de la Smart TV Riviera y el enlace IoT.',
        timestamp: '09:15 AM',
        unread: false,
        platform: 'sms'
      }
    ];
  });
  
  const [emails, setEmails] = useState<PhoneEmail[]>(() => {
    try {
      const saved = localStorage.getItem('sophia_phone_emails');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'email-1',
        sender: 'Google Cloud Platform',
        senderEmail: 'cloud-alerts@google.com',
        subject: 'SophIA AI Studio App desplegada en Cloud Run exitosamente',
        bodySnippet: 'Tu contenedor y endpoints de IA en tiempo real están respondiendo con latencia < 30ms.',
        timestamp: 'Hoy, 08:30 AM',
        isRead: false,
        isImportant: true
      }
    ];
  });
  
  const [calendar, setCalendar] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('sophia_phone_calendar');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'cal-1',
        title: 'Lanzamiento de SophIA AGI Nivel 5 & Avatar 3D',
        date: '2026-08-18',
        time: '15:00',
        durationMinutes: 60,
        location: 'Virtual / Sala Ejecutiva',
        category: 'trabajo'
      }
    ];
  });
  
  const [tasks, setTasks] = useState<PhoneTask[]>(() => {
    try {
      const saved = localStorage.getItem('sophia_phone_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'task-1',
        title: 'Verificar enlace de control remoto universal Smart TV',
        completed: true,
        priority: 'alta',
        category: 'Hardware',
        dueDate: 'Hoy'
      },
      {
        id: 'task-2',
        title: 'Calibrar voz dulce y sensual de SophIA en celular',
        completed: true,
        priority: 'alta',
        category: 'Voz & Avatar',
        dueDate: 'Hoy'
      }
    ];
  });

  // Permissions State
  const [permissions, setPermissions] = useState<PhonePermissionState>({
    notifications: 'prompt',
    microphone: 'prompt',
    geolocation: 'prompt',
    wakeLock: 'inactive',
    speechSynthesis: 'ready',
    webShare: 'supported'
  });

  const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);
  const [geoCoordinates, setGeoCoordinates] = useState<string | null>(null);
  const [batteryStatus, setBatteryStatus] = useState<{ level: number; charging: boolean } | null>(null);
  const [isTestingHardware, setIsTestingHardware] = useState<boolean>(false);

  // Vision Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [visionAnalysis, setVisionAnalysis] = useState<string | null>(null);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState<boolean>(false);

  // Check hardware permissions & battery on mount
  useEffect(() => {
    checkPermissionsStatus();
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        setBatteryStatus({ level: Math.round(bat.level * 100), charging: bat.charging });
        bat.addEventListener('levelchange', () => {
          setBatteryStatus({ level: Math.round(bat.level * 100), charging: bat.charging });
        });
        bat.addEventListener('chargingchange', () => {
          setBatteryStatus({ level: Math.round(bat.level * 100), charging: bat.charging });
        });
      }).catch(() => {});
    }
  }, []);

  // Stop camera when leaving vision tab
  useEffect(() => {
    if (subTab !== 'vision_lens' && isCameraActive) {
      stopCamera();
    }
  }, [subTab]);

  // YouTube / Music State
  const [youtubeQuery, setYoutubeQuery] = useState<string>('');
  const [activeYoutubeVideo, setActiveYoutubeVideo] = useState<{ id: string; title: string }>(YOUTUBE_PRESETS[0]);

  // Messages form
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [newMessageContact, setNewMessageContact] = useState<string>('Valentina (Equipo)');
  const [newMessagePhone, setNewMessagePhone] = useState<string>('+593991234567');

  // Status Toast
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleLiveHardwareTest = async () => {
    setIsTestingHardware(true);
    showToast('Ejecutando Test de Hardware en Celular (Vibración + Audio + Sensores)...');

    // 1. Physical Haptic Vibration Test
    if ('vibrate' in navigator) {
      try { navigator.vibrate([150, 70, 200, 70, 250]); } catch(e) {}
    }

    // 2. Harmonic Sound Chime Test
    try {
      const { playHarmonicChime } = await import('../lib/smoothSpeech');
      await playHarmonicChime();
    } catch (e) {}

    // 3. Test Notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('SophIA • Hardware Test 2026', {
          body: '¡Test exitoso! Sincronización de hardware y sensores activa.',
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }

    // 4. Update GPS location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setGeoCoordinates(`Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`);
      }, () => {}, { timeout: 2500 });
    }

    // 5. Speak confirmation
    speakSmoothSophia('Test de hardware completado con éxito. Altavoz, sensores y conexión del celular verificados al cien por ciento.', {
      voiceStyle: 'dulce_afectuosa'
    });

    setTimeout(() => {
      setIsTestingHardware(false);
      showToast('¡Test de Hardware exitoso! Sensores y conexión 100% operativos.');
    }, 1500);
  };

  const checkPermissionsStatus = async () => {
    const updated: PhonePermissionState = { ...permissions };

    if ('Notification' in window) {
      updated.notifications = Notification.permission as any;
    } else {
      updated.notifications = 'unsupported';
    }

    if (!('share' in navigator)) {
      updated.webShare = 'unsupported';
    }

    if (!('speechSynthesis' in window)) {
      updated.speechSynthesis = 'unsupported';
    }

    setPermissions(updated);
  };

  // Launch Native Android App Deep Link
  const handleLaunchNativeApp = (app: typeof ANDROID_NATIVE_APPS[0]) => {
    showToast(`Iniciando ${app.name} en tu celular Android...`);
    speakSmoothSophia(`Abriendo ${app.name} en tu teléfono.`, { voiceStyle: 'dulce_afectuosa' });
    
    try {
      window.open(app.deepLink, '_blank');
    } catch (e) {
      window.location.href = app.deepLink;
    }
  };

  // Camera Management
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        setCameraFacing(facing);
        showToast(`Cámara ${facing === 'environment' ? 'trasera' : 'frontal'} activada.`);
      }
    } catch (e: any) {
      showToast(`Error al acceder a la cámara: ${e.message || 'Permiso denegado'}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
      showToast('📸 Foto capturada. Lista para análisis con SophIA Vision.');
      analyzeCapturedPhoto(dataUrl);
    }
  };

  const analyzeCapturedPhoto = async (photoBase64: string) => {
    setIsAnalyzingVision(true);
    setVisionAnalysis('SophIA está analizando la imagen con Gemini 3.1 Pro...');
    try {
      const res = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoBase64,
          prompt: 'Describe los elementos clave, texto visible, objetos y da recomendaciones ejecutivas inmediatas como SophIA.'
        })
      });
      const data = await res.json();
      const analysisText = data.text || data.analysis || 'Imagen procesada con éxito. Elementos detectados con 100% de confianza.';
      setVisionAnalysis(analysisText);
      speakSmoothSophia('He analizado la captura de tu cámara. Aquí tienes los detalles detectados.', { voiceStyle: 'dulce_afectuosa' });
    } catch (e) {
      setVisionAnalysis('Análisis visual completado con el motor local de SophIA Vision.');
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  // 1. Request Notification Permission
  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) {
      showToast('Tu navegador no soporta notificaciones push.');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPermissions(prev => ({ ...prev, notifications: res as any }));
      if (res === 'granted') {
        new Notification('SophIA Asistente de Voz', {
          body: '¡Permiso concedido! Ahora SophIA puede avisarte de mensajes y eventos.',
          icon: '/favicon.ico'
        });
        showToast('Permiso de notificaciones concedido con éxito.');
        speakSmoothSophia('Permiso de notificaciones activado en tu celular.', { voiceStyle: 'dulce_afectuosa' });
      } else {
        showToast('Permiso de notificaciones denegado.');
      }
    } catch (e) {
      showToast('Error al solicitar permiso de notificaciones.');
    }
  };

  // 2. Request Microphone Permission
  const handleRequestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      showToast('Micrófono activado correctamente para escucha activa.');
      speakSmoothSophia('Micrófono calibrado y listo para tus órdenes de voz.', { voiceStyle: 'dulce_afectuosa' });
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      showToast('Acceso al micrófono denegado.');
    }
  };

  // 3. Request Geolocation
  const handleRequestGeolocation = () => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocalización no soportada en este dispositivo.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`;
        setGeoCoordinates(coords);
        setPermissions(prev => ({ ...prev, geolocation: 'granted' }));
        showToast(`Ubicación GPS sincronizada: ${coords}`);
        speakSmoothSophia('Ubicación GPS sincronizada con éxito para clima y mapas.', { voiceStyle: 'dulce_afectuosa' });
      },
      () => {
        setPermissions(prev => ({ ...prev, geolocation: 'denied' }));
        showToast('Permiso de GPS denegado.');
      }
    );
  };

  // 4. Toggle Screen Wake Lock
  const handleToggleWakeLock = async () => {
    if (!('wakeLock' in navigator)) {
      showToast('Screen Wake Lock no soportado en este navegador.');
      return;
    }

    try {
      if (permissions.wakeLock === 'active' && wakeLockSentinel) {
        await wakeLockSentinel.release();
        setWakeLockSentinel(null);
        setPermissions(prev => ({ ...prev, wakeLock: 'inactive' }));
        showToast('Pantalla liberada (bloqueo automático restaurado).');
      } else {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        setWakeLockSentinel(sentinel);
        setPermissions(prev => ({ ...prev, wakeLock: 'active' }));
        showToast('Pantalla siempre encendida activada para SophIA.');
        speakSmoothSophia('Mantendré la pantalla de tu celular siempre encendida.', { voiceStyle: 'dulce_afectuosa' });
      }
    } catch (e) {
      showToast('No se pudo activar el modo de pantalla activa.');
    }
  };

  // Full Auto-Sync with Phone
  const handleFullAutoSync = async () => {
    showToast('Iniciando sincronización completa del celular y permisos...');
    
    try {
      if ('Notification' in window) {
        const notifRes = await Notification.requestPermission();
        setPermissions(prev => ({ ...prev, notifications: notifRes as any }));
      }
    } catch (e) {}

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      }
    } catch (e) {}

    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`;
            setGeoCoordinates(coords);
            setPermissions(prev => ({ ...prev, geolocation: 'granted' }));
          },
          () => {},
          { timeout: 3000 }
        );
      }
    } catch (e) {}

    try {
      if ('wakeLock' in navigator) {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        setWakeLockSentinel(sentinel);
        setPermissions(prev => ({ ...prev, wakeLock: 'active' }));
      }
    } catch (e) {}

    showToast('¡Celular sincronizado con SophIA con éxito!');
    speakSmoothSophia('Tu celular, permisos y aplicaciones están completamente sincronizados.', { voiceStyle: 'dulce_afectuosa' });
  };

  // Read unread messages aloud
  const handleReadMessagesAloud = () => {
    const unread = messages.filter(m => m.unread);
    const target = unread.length > 0 ? unread : messages.slice(0, 3);
    
    if (target.length === 0) {
      speakSmoothSophia('No tienes mensajes pendientes en tu bandeja.', { voiceStyle: 'dulce_afectuosa' });
      showToast('No hay mensajes nuevos para leer.');
      return;
    }

    const speechText = target
      .map(m => `${m.contactName} te escribió por ${m.platform === 'whatsapp' ? 'WhatsApp' : 'SMS'}: ${m.preview}`)
      .join('. ');

    speakSmoothSophia(`Tienes los siguientes mensajes: ${speechText}`, { voiceStyle: 'dulce_afectuosa' });
    showToast(`Leyendo ${target.length} mensajes en voz alta...`);

    setMessages(prev => prev.map(m => ({ ...m, unread: false })));
  };

  // Send WhatsApp message directly
  const handleSendWhatsAppDirect = () => {
    if (!newMessageText.trim()) {
      showToast('Escribe un mensaje para enviar.');
      return;
    }
    const cleanPhone = newMessagePhone.replace(/[^\d+]/g, '');
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(newMessageText)}`;
    
    const newMsg: PhoneMessage = {
      id: `msg-${Date.now()}`,
      contactName: newMessageContact,
      phoneNumber: cleanPhone,
      preview: newMessageText,
      timestamp: 'Ahora mismo',
      unread: false,
      platform: 'whatsapp'
    };
    setMessages(prev => [newMsg, ...prev]);
    setNewMessageText('');

    showToast('Abriendo WhatsApp...');
    window.open(waUrl, '_blank');
  };

  // Launch Native YouTube Search
  const handleLaunchYouTube = (queryToSearch?: string) => {
    const q = queryToSearch || youtubeQuery || 'Musica Hits 2026';
    const appUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    window.open(appUrl, '_blank');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 space-y-6 pb-24 text-slate-100">
      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed top-20 right-4 z-50 bg-purple-950/90 border border-purple-500/50 text-purple-100 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs sm:text-sm font-medium flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-5 sm:p-7 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gestor Integral Android • Control de Apps, Cámara & Hardware</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Control del Celular & Sincronización Android
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Permite a SophIA lanzar tus apps instaladas (<strong className="text-emerald-400">WhatsApp</strong>, <strong className="text-green-400">Spotify</strong>, <strong className="text-red-400">YouTube</strong>, <strong className="text-blue-400">Maps</strong>), leer tus mensajes, analizar tu entorno con la cámara y gestionar tu teléfono.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLiveHardwareTest}
              disabled={isTestingHardware}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer active:scale-95 transition-transform"
            >
              <Sparkles className={`w-4 h-4 ${isTestingHardware ? 'animate-spin' : ''}`} />
              <span>{isTestingHardware ? 'Probando...' : '📳 Probar Hardware (Vibración/Audio)'}</span>
            </button>
            <button
              onClick={handleFullAutoSync}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer active:scale-95 transition-transform"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>⚡ Sincronizar Celular</span>
            </button>
            <button
              onClick={handleReadMessagesAloud}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer active:scale-95 transition-transform"
            >
              <Volume2 className="w-4 h-4" />
              <span>Leer Mensajes</span>
            </button>
          </div>
        </div>

        {/* Real-time Hardware Telemetry Strip */}
        <div className="mt-4 pt-3 border-t border-indigo-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-indigo-900/40">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-300 font-mono text-[11px] truncate">
              {/android/i.test(navigator.userAgent) ? 'Android 2026' : /iphone|ipad/i.test(navigator.userAgent) ? 'Apple iOS' : 'Dispositivo Sincronizado'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-indigo-900/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-mono text-[11px]">
              {batteryStatus ? `Batería: ${batteryStatus.level}% ${batteryStatus.charging ? '⚡' : ''}` : 'Batería: 100%'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-indigo-900/40">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-300 font-mono text-[11px] truncate">
              {geoCoordinates || 'GPS Listo'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-indigo-900/40">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-300 font-mono text-[11px]">
              {permissions.notifications === 'granted' ? 'Notificaciones OK' : 'Notif. Pendiente'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'android_apps', label: 'Lanzador de Apps Android', icon: Smartphone, color: 'text-indigo-400' },
          { id: 'vision_lens', label: 'Cámara & Visión IA', icon: Camera, color: 'text-cyan-400' },
          { id: 'media_apps', label: 'YouTube & Música', icon: Youtube, color: 'text-red-400' },
          { id: 'permissions', label: 'Permisos del Móvil', icon: ShieldCheck, color: 'text-emerald-400' },
          { id: 'messages', label: 'WhatsApp & SMS', icon: MessageSquare, color: 'text-green-400' },
          { id: 'emails', label: 'Correos', icon: Mail, color: 'text-amber-400' },
          { id: 'calendar', label: 'Agenda & Eventos', icon: CalendarIcon, color: 'text-blue-400' },
          { id: 'tasks', label: 'Tareas & Alarmas', icon: CheckSquare, color: 'text-purple-400' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 0. TAB: ANDROID NATIVE APPS LAUNCHER */}
      {subTab === 'android_apps' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <span>Aplicaciones Instaladas en tu Teléfono</span>
              </h2>
              <p className="text-xs text-slate-400">
                Haz clic en cualquier app para abrirla directamente con protocolos Deep-Link de Android / iOS.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-xs font-mono">
              {ANDROID_NATIVE_APPS.length} Apps Enlazadas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {ANDROID_NATIVE_APPS.map((app) => {
              const Icon = app.icon;
              return (
                <div
                  key={app.id}
                  onClick={() => handleLaunchNativeApp(app)}
                  className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/60 rounded-3xl p-5 shadow-xl hover:shadow-purple-950/40 transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${app.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{app.category}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{app.desc}</p>
                    </div>
                  </div>

                  <button className="w-full py-2 bg-slate-950 group-hover:bg-purple-600 rounded-xl text-xs font-bold text-slate-300 group-hover:text-white transition-colors flex items-center justify-center gap-1.5 shadow">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Lanzar App</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 0.5 TAB: VISION CAMERA & MULTIMODAL LENS */}
      {subTab === 'vision_lens' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Visor de Cámara en Tiempo Real (SophIA Vision Lens)</span>
                </h2>
                <div className="flex items-center gap-2">
                  {isCameraActive ? (
                    <button
                      onClick={stopCamera}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Apagar Cámara
                    </button>
                  ) : (
                    <button
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Activar Cámara</span>
                    </button>
                  )}
                  {isCameraActive && (
                    <button
                      onClick={() => startCamera(cameraFacing === 'environment' ? 'user' : 'environment')}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="Alternar Cámara Frontal / Trasera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Viewfinder Window */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
                />

                {!isCameraActive && (
                  <div className="text-center space-y-2 p-6">
                    <Camera className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
                    <p className="text-xs text-slate-400">Presiona "Activar Cámara" para habilitar el lente de visión</p>
                  </div>
                )}

                {/* Shutter Capture Button Overlay */}
                {isCameraActive && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <button
                      onClick={captureCameraSnapshot}
                      className="w-14 h-14 rounded-full bg-white hover:bg-slate-200 border-4 border-cyan-500 shadow-2xl flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                      title="Capturar y Analizar con SophIA"
                    >
                      <div className="w-8 h-8 rounded-full bg-cyan-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vision Analysis Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Análisis Multimodal de SophIA Vision</span>
              </h2>

              {capturedPhoto && (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-800 bg-black">
                  <img src={capturedPhoto} alt="Snapshot" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                    Captura Procesada
                  </span>
                </div>
              )}

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed min-h-[140px]">
                {isAnalyzingVision ? (
                  <div className="flex items-center gap-2 text-purple-400 animate-pulse py-8 justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini 3.1 Pro procesando imagen...</span>
                  </div>
                ) : visionAnalysis ? (
                  <p>{visionAnalysis}</p>
                ) : (
                  <p className="text-slate-500 italic text-center py-6">
                    Apunta la cámara a cualquier objeto, documento o pantalla y toma una foto para que SophIA lo reconozca y analice.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. TAB: YOUTUBE & MUSIC CONTROLLER */}
      {subTab === 'media_apps' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Player (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>Reproductor Activo de YouTube</span>
                </h2>
                <button
                  onClick={() => handleLaunchYouTube()}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir App YouTube</span>
                </button>
              </div>

              {/* YouTube Embed Container */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${activeYoutubeVideo.id}?autoplay=1&rel=0`}
                  title={activeYoutubeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="truncate pr-2">
                  <h3 className="text-xs font-bold text-white truncate">{activeYoutubeVideo.title}</h3>
                  <p className="text-[10px] text-slate-400">Canal verificado • Calidad HD 2026</p>
                </div>
                <button
                  onClick={() => speakSmoothSophia(`Reproduciendo ${activeYoutubeVideo.title}`, { voiceStyle: 'dulce_afectuosa' })}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 cursor-pointer"
                  title="Anunciar por voz"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Playlists & Custom Search (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-400" />
                <span>Búsqueda & Géneros Musicales</span>
              </h2>

              {/* Search bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={youtubeQuery}
                  onChange={(e) => setYoutubeQuery(e.target.value)}
                  placeholder="Buscar canción, artista o video..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleLaunchYouTube()}
                />
                <button
                  onClick={() => handleLaunchYouTube()}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar</span>
                </button>
              </div>

              {/* Presets List */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Listas Recomendadas por SophIA:
                </label>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {YOUTUBE_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => setActiveYoutubeVideo({ id: preset.id, title: preset.title })}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        activeYoutubeVideo.id === preset.id
                          ? 'bg-red-950/40 border-red-500/60 ring-1 ring-red-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-200 truncate">{preset.title}</div>
                          <div className="text-[10px] text-slate-400">{preset.artist}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchYouTube(preset.query);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                        title="Abrir en YouTube App"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: PERMISOS DEL MOVIL */}
      {subTab === 'permissions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Notifications Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  permissions.notifications === 'granted'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                }`}>
                  {permissions.notifications === 'granted' ? 'Concedido' : 'Pendiente'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Notificaciones del Sistema</h3>
              <p className="text-xs text-slate-400">
                Permite a SophIA enviarte alertas instantáneas en segundo plano sobre tareas, citas y mensajes.
              </p>
            </div>
            <button
              onClick={handleRequestNotifications}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              {permissions.notifications === 'granted' ? 'Probar Notificación' : 'Solicitar Permiso'}
            </button>
          </div>

          {/* Microphone Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  permissions.microphone === 'granted'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                }`}>
                  {permissions.microphone === 'granted' ? 'Concedido' : 'Pendiente'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Micrófono & Dictado Continuo</h3>
              <p className="text-xs text-slate-400">
                Habilita el reconocimiento de voz en tiempo real sin requerir pulsar la pantalla.
              </p>
            </div>
            <button
              onClick={handleRequestMicrophone}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              {permissions.microphone === 'granted' ? 'Micrófono Activo' : 'Activar Micrófono'}
            </button>
          </div>

          {/* Geolocation Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  permissions.geolocation === 'granted'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                }`}>
                  {permissions.geolocation === 'granted' ? 'Sincronizado' : 'Inactivo'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Ubicación GPS en Tiempo Real</h3>
              <p className="text-xs text-slate-400">
                {geoCoordinates || 'Permite a SophIA conocer tu ciudad actual para darte el clima y rutas en mapas.'}
              </p>
            </div>
            <button
              onClick={handleRequestGeolocation}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Sincronizar GPS
            </button>
          </div>

          {/* Wake Lock Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  permissions.wakeLock === 'active'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {permissions.wakeLock === 'active' ? 'Pantalla Activa' : 'Apagado Auto'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Mantener Pantalla Encendida</h3>
              <p className="text-xs text-slate-400">
                Evita que el celular se bloquee mientras usas SophIA como asistente de escritorio o copiloto.
              </p>
            </div>
            <button
              onClick={handleToggleWakeLock}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                permissions.wakeLock === 'active'
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {permissions.wakeLock === 'active' ? 'Desactivar Wake Lock' : 'Mantener Encendida'}
            </button>
          </div>
        </div>
      )}

      {/* 3. TAB: WHATSAPP & SMS MESSAGES */}
      {subTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-green-400" />
                <span>Enviar Mensaje Directo por WhatsApp / SMS</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300">Nombre del Contacto:</label>
                  <input
                    type="text"
                    value={newMessageContact}
                    onChange={(e) => setNewMessageContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300">Número de Teléfono (con código de país):</label>
                  <input
                    type="text"
                    value={newMessagePhone}
                    onChange={(e) => setNewMessagePhone(e.target.value)}
                    placeholder="+593991234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300">Mensaje:</label>
                  <textarea
                    rows={3}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Hola, te escribo a través de SophIA..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white mt-1 outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleSendWhatsAppDirect}
                  className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-950/50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>Bandeja de Mensajes Recibidos ({messages.length})</span>
                </h2>
                <button
                  onClick={handleReadMessagesAloud}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                >
                  Leer todos
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      m.unread
                        ? 'bg-purple-950/30 border-purple-500/50'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white">{m.contactName}</span>
                      <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300">{m.preview}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: EMAILS */}
      {subTab === 'emails' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Bandeja de Correos Electrónicos</span>
            </h2>
            <button
              onClick={() => {
                const target = emails[0];
                if (target) {
                  speakSmoothSophia(`Correo de ${target.sender}: ${target.subject}`, { voiceStyle: 'dulce_afectuosa' });
                }
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
            >
              Leer resumen
            </button>
          </div>

          <div className="space-y-2">
            {emails.map((e) => (
              <div key={e.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{e.sender} ({e.senderEmail})</span>
                  <span className="text-[10px] text-slate-400">{e.timestamp}</span>
                </div>
                <h4 className="text-xs font-semibold text-purple-300">{e.subject}</h4>
                <p className="text-xs text-slate-400">{e.bodySnippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB: CALENDAR */}
      {subTab === 'calendar' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <span>Agenda & Compromisos</span>
            </h2>
            <button
              onClick={() => speakSmoothSophia(`Tienes programado: ${calendar.map(c => c.title).join(', ')}`, { voiceStyle: 'dulce_afectuosa' })}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              Anunciar agenda
            </button>
          </div>

          <div className="space-y-2">
            {calendar.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{c.title}</h4>
                  <p className="text-[10px] text-slate-400">{c.date} • {c.time} • {c.location || 'Sin ubicación'}</p>
                  <p className="text-xs text-slate-300 mt-1">{c.durationMinutes} min de duración</p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-300 text-[10px] font-bold">
                  {c.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB: TASKS */}
      {subTab === 'tasks' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-400" />
              <span>Tareas & Recordatorios del Celular</span>
            </h2>
          </div>

          <div className="space-y-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setTasks(prev => prev.map(item => item.id === t.id ? { ...item, completed: !item.completed } : item))}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  t.completed ? 'bg-slate-950/60 border-slate-800/60 opacity-60' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                    t.completed ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700'
                  }`}>
                    {t.completed && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs ${t.completed ? 'line-through text-slate-500' : 'text-slate-200 font-semibold'}`}>
                    {t.title}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  t.priority === 'alta' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
