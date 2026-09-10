import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Film,
  X,
  FileCode,
  FileSpreadsheet,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Zap,
  Plus
} from 'lucide-react';
import { UploadedMediaItem } from '../types';

interface MultimodalUploadBarProps {
  attachments: UploadedMediaItem[];
  onAttachmentsChange: (items: UploadedMediaItem[]) => void;
  onQuickActionPrompt?: (actionPrompt: string) => void;
  disabled?: boolean;
}

export const MultimodalUploadBar: React.FC<MultimodalUploadBarProps> = ({
  attachments,
  onAttachmentsChange,
  onQuickActionPrompt,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [previewModalItem, setPreviewModalItem] = useState<UploadedMediaItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMediaType = (mimeType: string, filename: string): 'image' | 'document' | 'video' | 'audio' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'audio';
    return 'document';
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessingFile(true);

    const newItems: UploadedMediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = getMediaType(file.type, file.name);

      try {
        const base64Data = await readFileAsBase64(file);
        let previewUrl: string | undefined;

        if (mediaType === 'image') {
          previewUrl = URL.createObjectURL(file);
        }

        newItems.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          type: mediaType,
          mimeType: file.type || (mediaType === 'image' ? 'image/jpeg' : mediaType === 'video' ? 'video/mp4' : 'application/pdf'),
          sizeBytes: file.size,
          dataBase64: base64Data,
          previewUrl,
          status: 'ready',
        });
      } catch (err: any) {
        console.error('Error reading file:', err);
      }
    }

    onAttachmentsChange([...attachments, ...newItems]);
    setIsProcessingFile(false);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix e.g. "data:image/png;base64,"
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (id: string) => {
    const item = attachments.find((a) => a.id === id);
    if (item?.previewUrl && item.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  const handleClearAll = () => {
    attachments.forEach((a) => {
      if (a.previewUrl && a.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(a.previewUrl);
      }
    });
    onAttachmentsChange([]);
  };

  // Demo sample loader for 1-click test
  const handleLoadDemoFile = (type: 'image' | 'document' | 'video') => {
    if (type === 'image') {
      const demoItem: UploadedMediaItem = {
        id: `demo-img-${Date.now()}`,
        name: 'arquitectura_sistema_ia_2026.png',
        type: 'image',
        mimeType: 'image/png',
        sizeBytes: 345000,
        previewUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
        summary: 'Infografía visual de arquitectura cloud con microservicios y red neuronal.',
        status: 'ready',
      };
      onAttachmentsChange([...attachments, demoItem]);
      if (onQuickActionPrompt) {
        onQuickActionPrompt('Analiza esta imagen y describe detalladamente los componentes de la arquitectura y sus flujos de datos.');
      }
    } else if (type === 'document') {
      const demoItem: UploadedMediaItem = {
        id: `demo-doc-${Date.now()}`,
        name: 'Reporte_Financiero_SaaS_2026.pdf',
        type: 'document',
        mimeType: 'application/pdf',
        sizeBytes: 820000,
        summary: 'Reporte de métricas financieras de rendimiento, ARR, CAC y proyección Q3.',
        status: 'ready',
      };
      onAttachmentsChange([...attachments, demoItem]);
      if (onQuickActionPrompt) {
        onQuickActionPrompt('Extrae las métricas clave de este documento PDF y preséntalas en una tabla comparativa con recomendaciones de optimización.');
      }
    } else if (type === 'video') {
      const demoItem: UploadedMediaItem = {
        id: `demo-vid-${Date.now()}`,
        name: 'demostracion_ia_asistente_voz.mp4',
        type: 'video',
        mimeType: 'video/mp4',
        sizeBytes: 2450000,
        summary: 'Demostración en video sobre interacción multimodal con audio y visión por computadora.',
        status: 'ready',
      };
      onAttachmentsChange([...attachments, demoItem]);
      if (onQuickActionPrompt) {
        onQuickActionPrompt('Describe los eventos clave y el resumen paso a paso de lo que ocurre en este video demostrativo.');
      }
    }
  };

  const renderIcon = (type: string, mime: string) => {
    if (type === 'image') return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (type === 'video') return <Film className="w-4 h-4 text-purple-400" />;
    if (mime.includes('csv') || mime.includes('sheet') || mime.includes('excel')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    }
    if (mime.includes('json') || mime.includes('javascript') || mime.includes('typescript')) {
      return <FileCode className="w-4 h-4 text-amber-400" />;
    }
    return <FileText className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="w-full space-y-3">
      {/* Upload Drop Zone & Toolbar */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-3.5 rounded-2xl border transition-all duration-200 ${
          isDragging
            ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40'
            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf,text/*,.csv,.json,.md,.docx,.xlsx"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
          id="multimodal-file-input"
        />

        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Left Title & Status */}
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-rose-600/30 to-purple-600/30 border border-rose-500/30 rounded-xl">
              <UploadCloud className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-200">
                  Barra Multimodal de SophIA
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/40 text-purple-300">
                  Visión • Docs • Video
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sube imágenes, PDF, documentos o videos para análisis inteligente con Gemini
              </p>
            </div>
          </div>

          {/* Action Buttons: Pick file & Demo Presets */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              disabled={disabled || isProcessingFile}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-950/50 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Subir Archivo</span>
            </button>

            {attachments.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs border border-slate-800 transition-all"
                title="Limpiar todos los archivos"
              >
                Limpiar ({attachments.length})
              </button>
            )}
          </div>
        </div>

        {/* Quick Demo Upload Buttons (Instant Testing) */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center space-x-1 text-[11px] text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Ejemplos rápidos con 1 clic:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleLoadDemoFile('image')}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 transition-all flex items-center gap-1"
            >
              <ImageIcon className="w-3 h-3" />
              <span>+ Imagen Arquitectura</span>
            </button>

            <button
              type="button"
              onClick={() => handleLoadDemoFile('document')}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-rose-300 transition-all flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>+ PDF Financiero</span>
            </button>

            <button
              type="button"
              onClick={() => handleLoadDemoFile('video')}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-purple-300 transition-all flex items-center gap-1"
            >
              <Film className="w-3 h-3" />
              <span>+ Video Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded Files Chips & Cards Preview */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              Archivos adjuntos para la instrucción ({attachments.length}):
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Total: {formatFileSize(attachments.reduce((sum, item) => sum + item.sizeBytes, 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="relative p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                {/* Header row */}
                <div className="flex items-start space-x-2">
                  {/* Thumbnail or Icon */}
                  {item.type === 'image' && item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-xl border border-slate-700 shrink-0 bg-slate-950 cursor-pointer"
                      onClick={() => setPreviewModalItem(item)}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      {renderIcon(item.type, item.mimeType)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-xs font-semibold text-slate-200 truncate" title={item.name}>
                      {item.name}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="uppercase font-mono font-bold text-slate-400">{item.type}</span>
                      <span>•</span>
                      <span>{formatFileSize(item.sizeBytes)}</span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick action buttons for this item */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onQuickActionPrompt) {
                        if (item.type === 'image') {
                          onQuickActionPrompt(`Analiza a fondo la imagen "${item.name}", detecta elementos visuales, texto y explica su contexto.`);
                        } else if (item.type === 'document') {
                          onQuickActionPrompt(`Extrae y resume los puntos cruciales del documento "${item.name}" con una tabla estructurada.`);
                        } else if (item.type === 'video') {
                          onQuickActionPrompt(`Analiza el video "${item.name}", describe qué sucede cronológicamente y los puntos más destacados.`);
                        }
                      }
                    }}
                    className="text-[10px] font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 px-2 py-1 rounded-lg border border-rose-800/40 flex items-center gap-1 transition-all"
                  >
                    <Zap className="w-3 h-3 text-rose-400" />
                    <span>Analizar con SophIA</span>
                  </button>

                  {item.previewUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewModalItem(item)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
                      title="Ver vista previa"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Preview for Full Image/Media */}
      {previewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {renderIcon(previewModalItem.type, previewModalItem.mimeType)}
                <span className="text-sm font-bold text-white truncate max-w-xs">{previewModalItem.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[60vh]">
              {previewModalItem.type === 'image' && previewModalItem.previewUrl ? (
                <img
                  src={previewModalItem.previewUrl}
                  alt={previewModalItem.name}
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] w-auto object-contain"
                />
              ) : (
                <div className="p-8 text-center space-y-2 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto text-slate-500" />
                  <p className="text-sm font-medium text-slate-300">{previewModalItem.name}</p>
                  <p className="text-xs font-mono">{formatFileSize(previewModalItem.sizeBytes)} • {previewModalItem.mimeType}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
