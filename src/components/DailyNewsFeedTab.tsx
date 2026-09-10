import React, { useState, useEffect } from 'react';
import {
  Globe,
  RefreshCw,
  Volume2,
  Square,
  ExternalLink,
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  Tag,
  ShieldCheck,
  Radio,
  Send,
  CheckCircle2
} from 'lucide-react';
import { DailyNewsFeed, DailyNewsArticle, VoiceStyle } from '../types';
import { speakSmoothly, stopSmoothSpeech } from '../lib/smoothSpeech';

interface DailyNewsFeedTabProps {
  onSendVoiceCommand: (cmd: string) => void;
  voiceStyle?: VoiceStyle;
}

export function DailyNewsFeedTab({ onSendVoiceCommand, voiceStyle = 'profesional_ejecutiva' }: DailyNewsFeedTabProps) {
  const [feed, setFeed] = useState<DailyNewsFeed | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchNews = (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    const url = refresh ? '/api/daily-news/refresh' : '/api/daily-news';
    const method = refresh ? 'POST' : 'GET';

    fetch(url, { method })
      .then((res) => res.json())
      .then((data) => {
        if (data.feed) {
          setFeed(data.feed);
        }
      })
      .catch((err) => console.error('Error fetching daily news:', err))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchNews(false);
  }, []);

  const handleToggleReadBriefing = () => {
    if (isPlayingAudio) {
      stopSmoothSpeech();
      setIsPlayingAudio(false);
      return;
    }

    if (!feed) return;

    const speechText = `Reporte diario de noticias en tiempo real con Google Search Grounding para hoy, ${feed.date}. ${feed.briefingSummary}. Titular destacado: ${feed.topHeadline}. Artículos principales: ${feed.articles.slice(0, 3).map((a) => `${a.title}. ${a.summary}`).join('. ')}. Fin del resumen diario.`;

    setIsPlayingAudio(true);
    speakSmoothly(speechText, {
      voiceStyle,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false)
    });
  };

  const filteredArticles = (feed?.articles || []).filter((art) => {
    const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div id="daily-news-feed-tab" className="w-full max-w-5xl mx-auto space-y-6 pb-8">
      {/* Top Banner Card: Google Search Grounding Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/30 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
              <Globe className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Noticias en Tiempo Real & Google Search
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Google Search Grounding 2026
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 flex items-center gap-1 font-mono">
                  <Radio className="w-3 h-3 text-sky-400 animate-pulse" /> En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Actualizaciones diarias automáticas validadas con el motor de búsqueda en tiempo real de Google
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="read-news-audio-btn"
              type="button"
              onClick={handleToggleReadBriefing}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                isPlayingAudio
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-indigo-600/20'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" /> Detener Lectura
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" /> Escuchar Resumen con SophIA
                </>
              )}
            </button>

            <button
              id="refresh-news-grounding-btn"
              type="button"
              onClick={() => fetchNews(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
              {isRefreshing ? 'Consultando Google Search...' : 'Actualizar Ahora'}
            </button>
          </div>
        </div>

        {/* Daily Summary & Weather Pill */}
        {feed && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Resumen Factual del Día ({feed.date})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Última sincronización: {new Date(feed.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{feed.briefingSummary}</p>
            {feed.weatherSummary && (
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-850 flex items-center gap-2">
                <span className="text-indigo-400 font-medium">Condición Global:</span>
                <span>{feed.weatherSummary}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Headline Card */}
      {feed && feed.topHeadline && (
        <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-sky-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Titular Principal
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Hoy en vivo
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
            {feed.topHeadline}
          </h2>

          <div className="flex items-center justify-between pt-3 border-t border-indigo-900/40 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Fuentes Grounded:</span>
              <span className="font-semibold text-slate-200">Google AI Studio • Reuter 2026 • MIT Technology Review</span>
            </div>
            <button
              onClick={() => onSendVoiceCommand(`SophIA, explícame a fondo la noticia sobre: "${feed.topHeadline}" con simulación de escenarios e implicaciones.`)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <Send className="w-3 h-3" /> Analizar con SophIA
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'tecnologia_ia', label: 'Tecnología & IA' },
            { id: 'actualidad_mundial', label: 'Actualidad' },
            { id: 'ciencia_innovacion', label: 'Ciencia & Espacio' },
            { id: 'economia_finanzas', label: 'Economía' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar noticias o tags..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
          <p className="text-xs">Sincronizando noticias con Google Search Grounding...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
          <p className="text-sm">No se encontraron noticias con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 transition shadow-lg flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {article.category.replace('_', ' ')}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {article.timestamp}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {article.summary}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {article.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-3 border-t border-slate-850 flex items-center justify-between text-xs">
                <a
                  href={article.sourceUrl || 'https://news.google.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 transition"
                >
                  <span>{article.sourceName}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>

                <button
                  type="button"
                  onClick={() =>
                    onSendVoiceCommand(
                      `SophIA, hazme un análisis detallado sobre esta noticia: "${article.title}"`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 text-[11px] font-semibold border border-indigo-800/60 transition flex items-center gap-1"
                >
                  <Send className="w-2.5 h-2.5" /> Consultar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
