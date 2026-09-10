import React, { useState, useEffect } from 'react';
import {
  Home,
  Lightbulb,
  Thermometer,
  ShieldCheck,
  Coffee,
  Tv,
  Zap,
  Sun,
  Moon,
  Film,
  Mic,
  Plus,
  RefreshCw,
  Power,
  Volume2,
  Sparkles,
  CheckCircle2,
  Sliders,
  Flame,
  Wind
} from 'lucide-react';
import { SmartDevice, SmartRoutine } from '../types';

interface SmartHomeIoTTabProps {
  onSendVoiceCommand?: (command: string) => void;
}

export const SmartHomeIoTTab: React.FC<SmartHomeIoTTabProps> = ({ onSendVoiceCommand }) => {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [routines, setRoutines] = useState<SmartRoutine[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('todos');
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [voiceInput, setVoiceInput] = useState<string>('');

  const fetchIoTState = () => {
    setLoading(true);
    fetch('/api/iot/devices')
      .then((res) => res.json())
      .then((data) => {
        if (data.devices) setDevices(data.devices);
        if (data.routines) setRoutines(data.routines);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error fetching IoT devices:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIoTState();
  }, []);

  const handleToggleDevice = (id: string, currentState: boolean, value?: number) => {
    const nextState = !currentState;
    // Optimistic update
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, state: nextState } : d))
    );

    fetch('/api/iot/device/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, state: nextState, value })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          showNotification(data.message);
        }
      })
      .catch((err) => console.error('Error toggling device:', err));
  };

  const handleValueChange = (id: string, newValue: number) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, value: newValue } : d))
    );

    fetch('/api/iot/device/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, value: newValue })
    }).catch((err) => console.error('Error updating value:', err));
  };

  const handleExecuteRoutine = (routine: SmartRoutine) => {
    showNotification(`Ejecutando rutina: ${routine.name}...`);
    fetch('/api/iot/routines/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: routine.id })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.devices) setDevices(data.devices);
        showNotification(data.message || `Rutina '${routine.name}' completada.`);
      })
      .catch((err) => console.error('Error running routine:', err));
  };

  const handleSendCustomCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceInput.trim()) return;

    const lower = voiceInput.toLowerCase();
    showNotification(`SophIA procesó: "${voiceInput}"`);

    if (lower.includes('apaga') && lower.includes('luz')) {
      devices.filter((d) => d.category === 'light').forEach((d) => handleToggleDevice(d.id, true));
    } else if (lower.includes('enciende') && lower.includes('luz')) {
      devices.filter((d) => d.category === 'light').forEach((d) => handleToggleDevice(d.id, false));
    } else if (lower.includes('clima') || lower.includes('temperatura')) {
      const therm = devices.find((d) => d.category === 'thermostat');
      if (therm) handleValueChange(therm.id, 22);
    } else if (onSendVoiceCommand) {
      onSendVoiceCommand(voiceInput);
    }
    setVoiceInput('');
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const rooms = ['todos', 'Sala de Estar', 'Dormitorio Principal', 'Cocina', 'Hogar Completo', 'Entrada Principal'];
  const filteredDevices =
    selectedRoom === 'todos'
      ? devices
      : devices.filter((d) => d.room === selectedRoom || d.room === 'Hogar Completo');

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Top Banner: SophIA Smart Home & IoT Hub */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    SophIA Domótica & IoT Hub
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Superior a Alexa
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Control inteligente por voz, automatización contextual y ahorro energético optimizado.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchIoTState}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>
        </div>

        {/* Quick Voice Command Input for Home */}
        <form onSubmit={handleSendCustomCommand} className="mt-4 flex gap-2 relative z-10">
          <div className="relative flex-1">
            <Mic className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              placeholder="Comando de voz: 'SophIA, modo cine' o 'SophIA, apaga las luces de la sala'..."
              className="w-full bg-slate-950/80 border border-emerald-500/40 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/40 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ejecutar</span>
          </button>
        </form>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Smart Routines Section (Superior a Alexa) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Rutinas Inteligentes Automatizadas</span>
          </h3>
          <span className="text-[11px] text-slate-400">1-Clic o Comando de Voz</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {routines.map((routine) => (
            <div
              key={routine.id}
              onClick={() => handleExecuteRoutine(routine)}
              className="cursor-pointer bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-3.5 transition-all group relative overflow-hidden shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800 group-hover:bg-emerald-900/60 flex items-center justify-center text-emerald-400 transition-colors">
                  {routine.category === 'morning' && <Sun className="w-4 h-4 text-amber-400" />}
                  {routine.category === 'cinema' && <Film className="w-4 h-4 text-purple-400" />}
                  {routine.category === 'night' && <Moon className="w-4 h-4 text-indigo-400" />}
                  {routine.category === 'eco' && <Zap className="w-4 h-4 text-emerald-400" />}
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">
                  {routine.actionsCount} acciones
                </span>
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                {routine.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {routine.description}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="italic font-mono">"{routine.triggerPhrase}"</span>
                <span className="text-emerald-400 font-semibold group-hover:underline">Activar →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => setSelectedRoom(room)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap capitalize ${
              selectedRoom === room
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {room === 'todos' ? '🏠 Todos los Espacios' : room}
          </button>
        ))}
      </div>

      {/* Connected IoT Devices Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Dispositivos Conectados ({filteredDevices.length})</span>
          </h3>
          <span className="text-[11px] text-emerald-400 font-mono">Estado en Vivo</span>
        </div>

        {filteredDevices.length === 0 ? (
          <div className="py-12 px-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Home className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">No hay dispositivos IoT vinculados</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Puedes dictarle comandos a SophIA como <span className="text-emerald-300 italic">"SophIA, buenos días"</span> o emparejar periféricos en la pestaña Bluetooth.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredDevices.map((device) => {
            const isLight = device.category === 'light';
            const isThermo = device.category === 'thermostat';
            const isSecurity = device.category === 'security';
            const isAppliance = device.category === 'appliance';
            const isEntertainment = device.category === 'entertainment';

            return (
              <div
                key={device.id}
                className={`rounded-2xl p-4 border transition-all ${
                  device.state
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-950/60 border-slate-850 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        device.state
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isLight && <Lightbulb className="w-4 h-4" />}
                      {isThermo && <Thermometer className="w-4 h-4" />}
                      {isSecurity && <ShieldCheck className="w-4 h-4" />}
                      {isAppliance && <Coffee className="w-4 h-4" />}
                      {isEntertainment && <Tv className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">{device.name}</h4>
                      <p className="text-[10px] text-slate-400">{device.room}</p>
                    </div>
                  </div>

                  {/* Power Button Toggle */}
                  <button
                    onClick={() => handleToggleDevice(device.id, device.state, device.value)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      device.state
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status & Controls */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Estado:</span>
                    <span
                      className={`font-semibold ${
                        device.state ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {device.state ? 'Activo / Encendido' : 'Apagado'}
                    </span>
                  </div>

                  {device.statusDetails && (
                    <p className="text-[10px] text-slate-400 italic">{device.statusDetails}</p>
                  )}

                  {/* Slider for lights or volume */}
                  {device.state && typeof device.value === 'number' && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-300">
                        <span>{isThermo ? 'Temperatura' : isLight ? 'Brillo' : 'Nivel'}</span>
                        <span className="font-bold text-emerald-400">
                          {device.value}
                          {device.unit || ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={isThermo ? 16 : 0}
                        max={isThermo ? 30 : 100}
                        step={isThermo ? 0.5 : 5}
                        value={device.value}
                        onChange={(e) => handleValueChange(device.id, parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
