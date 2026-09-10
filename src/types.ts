export interface SimulatedScenario {
  id: string;
  title: string;
  probability: number; // 0 to 100
  breakdown: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskDescription?: string;
  mitigation?: string; // Plan y estrategia de mitigación concreta
  mitigationSteps?: string[]; // Pasos de contención y contingencia
  keyConsiderations: string[];
}

export interface AntiHallucinationCheck {
  verified: boolean;
  confidenceScore: number; // 0 to 100
  factCheckSummary: string;
  scenariosEvaluatedCount: number;
}

export interface ResourceItem {
  id: string;
  type: 'document' | 'image' | 'link' | 'video' | 'research';
  title: string;
  url?: string;
  description: string;
  thumbnailUrl?: string;
  snippet?: string;
  sourceDomain?: string;
  createdAt?: string;
  relatedMemoryKey?: string;
}

export interface UploadedMediaItem {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio';
  mimeType: string;
  sizeBytes: number;
  dataBase64?: string;
  previewUrl?: string;
  summary?: string;
  status: 'ready' | 'analyzing' | 'error';
  errorMsg?: string;
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export type ModelEngineId =
  | 'auto'
  | 'gemini-3.7-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest'
  | 'chatgpt-4-5-free'
  | 'chatgpt-4o-mini-free'
  | 'claude-3-7-sonnet-free'
  | 'claude-3-5-sonnet-free'
  | 'claude-3-5-haiku-free'
  | 'deepseek-r1-free'
  | 'deepseek-v3-free'
  | 'glm-5-2-free'
  | 'glm-4-free'
  | 'glm-4-flash-free'
  | 'kimi-k3-free'
  | 'kimi-k1-5-free'
  | 'kimi-moonshot-free'
  | 'qwen-2-5-coder-free'
  | 'llama-3-3-free';

export type MasterVoiceMode = 'ejecutivo' | 'creativo' | 'casual';

export type VoiceStyle =
  | 'ejecutivo'
  | 'creativo'
  | 'casual'
  | 'profesional_ejecutiva'
  | 'profesional_dulce'
  | 'profesional_cientifica'
  | 'dulce_sensual'
  | 'dulce_afectuosa'
  | 'elegante_seductora'
  | 'calida_empatica'
  | 'energico_motivado'
  | 'zen_relajante'
  | 'futurista_cyber';

export interface AutoAuditImprovement {
  id: string;
  title: string;
  category: 'codigo' | 'flujo_trabajo' | 'rendimiento' | 'arquitectura';
  impact: 'alto' | 'medio' | 'critico';
  description: string;
  suggestedAction: string;
  codeSnippet?: string;
}

export interface ProactiveSuggestion {
  id: string;
  title: string;
  type: 'proyecto' | 'campaña_marketing' | 'optimizacion_negocio' | 'automatizacion';
  probabilitySuccess: number;
  projectedRoi?: string;
  description: string;
  actionPlan: string[];
}

export interface AutoAuditReport {
  id: string;
  timestampUtc: string;
  overallHealthScore: number; // 0-100
  latencyAvgMs: number;
  totalInteractionsAudited: number;
  hallucinationRate: number; // 0%
  improvements: AutoAuditImprovement[]; // Exactamente 3 mejoras propuestas
  proactiveSuggestions: ProactiveSuggestion[];
  unrealEngineStatus: {
    avatarVersion: '5.4.4-AGI5';
    renderingQuality: 'ultra_cinematic' | 'high_fidelity';
    fps: number;
    lipSyncActive: boolean;
  };
}

export interface UserDeviceProfile {
  userName: string;
  userTitle?: string;
  isConfigured: boolean;
  deviceBrand: string; // e.g., 'Samsung', 'Apple', 'Xiaomi', 'Motorola', 'Google Pixel'
  deviceModel: string; // e.g., 'Galaxy S24 Ultra', 'iPhone 16 Pro', 'Pixel 9 Pro'
  deviceType: 'smartphone' | 'tablet' | 'desktop';
  osName: string; // e.g., 'Android 15', 'iOS 18', 'Windows 11', 'macOS'
  browserName: string;
  screenResolution: string;
  batteryLevel?: number; // 0 to 100
  isCharging?: boolean;
  networkType?: string; // '5G', '4G', 'WiFi', 'online'
  lastRecognizedAt: string;
  preferredVoiceStyle: VoiceStyle;
}

export interface DailyNewsArticle {
  id: string;
  title: string;
  summary: string;
  category: 'tecnologia_ia' | 'actualidad_mundial' | 'economia_finanzas' | 'ciencia_innovacion' | 'clima_tendencias';
  sourceName: string;
  sourceUrl?: string;
  timestamp: string;
  relevanceScore?: number;
  tags: string[];
}

export interface DailyNewsFeed {
  date: string;
  lastUpdated: string;
  briefingSummary: string;
  weatherSummary?: string;
  topHeadline: string;
  articles: DailyNewsArticle[];
  isRealtimeGrounded: boolean;
  groundingQueriesUsed?: string[];
}

export interface BrainLaw {
  id: string;
  number: number;
  title: string;
  shortPrinciple: string;
  description: string;
  enforcement: 'estricta' | 'adaptativa' | 'inviolable';
  category: 'verdad' | 'simulacion' | 'creacion' | 'voz' | 'formato' | 'memoria' | 'modelo' | 'evolucion';
  active: boolean;
  promptSnippet: string;
}

export interface BrainModelBenchmark {
  modelId: string;
  name: string;
  role: string;
  accuracy: string;
  latency: string;
  status: 'optimal' | 'enhanced' | 'synced';
  specialty: string;
}

export interface BrainDailyLearning {
  source: 'online_grounding' | 'chat_history' | 'brain_models';
  category: string;
  title: string;
  detail: string;
  impact: string;
}

export interface SystemEvolutionUpgrade {
  id: string;
  area: 'logic_engine' | 'code_architecture' | 'voice_synthesis' | 'grounding_search' | 'memory_index';
  title: string;
  description: string;
  previousVersion: string;
  newVersion: string;
  benefits: string[];
  approved?: boolean;
}

export interface DailyBrainEvolutionReport {
  id: string;
  date: string;
  formattedDate?: string;
  timestamp: string;
  brainVersion: string;
  overallReadiness: number; // 0-100%
  summary: string;
  onlineKnowledgeGrounded: string[];
  chatInsightsAbsorbed: number;
  modelsSynced: BrainModelBenchmark[];
  learnings: BrainDailyLearning[];
  proposedUpgrades: SystemEvolutionUpgrade[];
  userApproved: boolean;
  approvalTimestamp?: string;
}

export interface SophiaVoiceProfile {
  voiceStyle: VoiceStyle;
  sweetnessLevel: 'alta' | 'media' | 'sutil';
  pitch?: number; // 0.8 to 1.5 (default ~1.12 for sweet tone)
  rate?: number; // 0.8 to 1.3 (default ~0.98 for calm warm cadence)
  flirtatiousCompliments?: boolean;
  audioChime?: boolean;
  preferredVoiceName?: string;
  antiStutterMode?: boolean;
  enableTTSAutoPlay?: boolean;
  autoListenMode?: boolean;
}

// Bluetooth Sound & TV Device Types
export type BluetoothCategory = 'sound_system' | 'tv' | 'soundbar' | 'headphones' | 'smart_gadget';

export interface BluetoothDevice {
  id: string;
  name: string;
  category: BluetoothCategory;
  brand: string;
  macAddress?: string;
  connected: boolean;
  power: boolean;
  volume: number; // 0 to 100
  muted: boolean;
  batteryLevel?: number; // percentage (optional, for headphones/portable speakers)
  sourceInput?: 'bluetooth' | 'hdmi1' | 'hdmi2' | 'optical' | 'aux' | 'tv_arc';
  equalizerMode?: 'standard' | 'bass_boost' | 'cinema' | 'vocal' | 'night';
  currentMedia?: {
    title: string;
    artist?: string;
    isPlaying: boolean;
    app?: 'Spotify' | 'YouTube' | 'Netflix' | 'Apple Music' | 'TV';
  };
  supportedFeatures: string[];
}

export interface UniversalCommandResult {
  actionExecuted: string;
  category: 'bluetooth' | 'smarthome' | 'phone' | 'ai_query' | 'scenario' | 'system';
  success: boolean;
  feedbackSpeech: string;
  affectedDeviceName?: string;
  details?: any;
}

// IoT Smart Home Types (Mejora a Alexa)
export interface SmartDevice {
  id: string;
  name: string;
  room: string;
  category: 'light' | 'thermostat' | 'security' | 'appliance' | 'entertainment';
  state: boolean;
  value?: number; // brightness (0-100), temp (16-30), volume (0-100)
  unit?: string;
  colorHex?: string;
  statusDetails?: string;
  lastUpdated?: string;
}

export interface SmartRoutine {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  triggerPhrase: string;
  actionsCount: number;
  category: 'morning' | 'night' | 'cinema' | 'eco' | 'security';
}

// Smartphone Assistant Types (Mensajes, Correos, Agenda, Tareas)
export interface PhoneMessage {
  id: string;
  contactName: string;
  phoneNumber: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  platform: 'sms' | 'whatsapp';
}

export interface PhoneEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  bodySnippet: string;
  timestamp: string;
  isRead: boolean;
  isImportant: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  location?: string;
  category: 'reunion' | 'trabajo' | 'personal' | 'medico';
  attendees?: string[];
}

export interface PhoneTask {
  id: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  completed: boolean;
  priority: 'alta' | 'media' | 'baja';
  category: string;
}

export interface ProviderApiKeyConfig {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  deepseekApiKey?: string;
  openrouterApiKey?: string;
  groqApiKey?: string;
  dashscopeApiKey?: string;
  moonshotApiKey?: string;
  zhipuApiKey?: string;
}

export interface ApiKeyStatusReport {
  provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'openrouter' | 'groq' | 'dashscope' | 'moonshot' | 'zhipu';
  providerName: string;
  envKeyName: string;
  isConfigured: boolean;
  source: 'env' | 'user_storage' | 'none';
  maskedKey?: string;
  modelsSupported: string[];
  docsUrl: string;
  recommendedModel: string;
  status: 'active' | 'pending' | 'testing' | 'error';
  lastTestedAt?: string;
}

export interface AIStudioConfig {
  modelSelectionMode: ModelEngineId;
  systemInstructionPreset: 'default' | 'cerebro_leyes' | 'developer' | 'analyst' | 'educator' | 'creative' | 'sensual_sweet' | 'custom';
  customSystemInstruction?: string;
  temperature: number; // 0.0 to 2.0
  topP: number; // 0.0 to 1.0
  topK: number; // 1 to 64
  thinkingLevel: 'HIGH' | 'LOW' | 'MINIMAL';
  enableSearchGrounding: boolean;
  responseFormat: 'auto' | 'table' | 'code' | 'list' | 'json' | 'summary' | 'text';
  voiceProfile?: SophiaVoiceProfile;
  activeBrainLawIds?: string[];
  apiKeys?: ProviderApiKeyConfig;
}

export interface TaskClassification {
  detectedTaskType: 'coding_stem' | 'deep_reasoning' | 'search_grounded' | 'quick_task' | 'creative_writing' | 'general';
  reasonForModelSelection: string;
  recommendedModel: string;
  recommendedModelName: string;
  providerBrand: 'Google Gemini' | 'OpenAI' | 'Anthropic' | 'DeepSeek' | 'Meta Open';
}

export interface ModelDeliberation {
  modelId: string;
  modelName: string;
  provider: string; // 'Google AI Studio' | 'Anthropic' | 'DeepSeek' | 'OpenAI' | 'Meta AI' | 'Alibaba Qwen' | 'Moonshot Kimi' | 'Zhipu GLM'
  seniorityBadge: string; // '40 Años de Experiencia en Arquitectura & Lógica'
  specialtyDomain: string;
  simulatedScenarios: SimulatedScenario[];
  candidateSolutionSummary: string;
  fullCandidateResponse?: string;
  recommendedCodeOrAction?: string;
  modelColor?: string;
  verdictScore: number; // e.g. 98%
  keyContribution: string;
  status: 'deliberated' | 'consensus_approved' | 'fallback_ready';
}

export interface MultiModelConsensusAnalysis {
  activeModelsCount: number;
  deliberations: ModelDeliberation[];
  sophiaMetaSynthesis: {
    experienceApplied: string; // '40 Años de Maestría Multidisciplinaria'
    arbitrationCriteria: string[];
    strengthsSynthesized: string[];
    riskMitigationsUnified: string[];
    masterRecommendation: string;
  };
  consensusConfidence: number; // 99%
}

export interface Interaction {
  id: string;
  timestamp: string;
  userQuery: string;
  audioDurationSec?: number;
  simulatedScenarios: SimulatedScenario[];
  antiHallucinationCheck: AntiHallucinationCheck;
  finalResponse: string;
  directAnswer?: string;
  spokenSummary?: string;
  formatType?: 'markdown' | 'table' | 'code' | 'list' | 'json' | 'summary' | 'text';
  modelUsed: string;
  modelTier: string;
  modelSelectionReason?: string;
  taskType?: string;
  providerBrand?: string;
  failoverOccurred: boolean;
  failoverReason?: string;
  latencyMs: number;
  category: string;
  learnedMemoryPoints: string[];
  resources?: ResourceItem[];
  attachments?: UploadedMediaItem[];
  groundingSources?: GroundingSource[];
  isOffline?: boolean;
  sessionId?: string;
  multiModelConsensus?: MultiModelConsensusAnalysis;
  aiStudioConfigUsed?: Partial<AIStudioConfig>;
  voiceProfileUsed?: SophiaVoiceProfile;
  tokenTelemetry?: {
    estimatedPromptTokens: number;
    estimatedOutputTokens: number;
    totalTokens: number;
  };
}

export interface ModelStatus {
  id: string;
  name: string;
  alias: string;
  provider: string;
  status: 'active' | 'standby' | 'exhausted' | 'rate_limited';
  quotaRemainingPct: number;
  latencyAvgMs: number;
  isFreeTier: boolean;
  description: string;
  bestFor: string;
  thinkingSupported: boolean;
  searchGroundingSupported: boolean;
  badgeColor?: string;
}

export interface MemoryPoint {
  id: string;
  key: string;
  fact: string;
  createdAt: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  linkedResourcesCount?: number;
  sourceInteractionId?: string;
}

export interface DeploymentConfig {
  githubRepo: string;
  cloudRunRegion: string;
  serviceName: string;
  status: 'ready' | 'building' | 'deployed' | 'error';
  lastDeployTime?: string;
}

export interface GenerativeMediaItem {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  modelUsed: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  resolution?: string;
  createdAt: string;
  downloadUrl?: string;
  operationName?: string;
  status: 'generating' | 'ready' | 'error';
  errorMessage?: string;
  seed?: number;
}

export interface PhonePermissionState {
  notifications: 'prompt' | 'granted' | 'denied' | 'unsupported';
  microphone: 'prompt' | 'granted' | 'denied' | 'unsupported';
  geolocation: 'prompt' | 'granted' | 'denied' | 'unsupported';
  wakeLock: 'active' | 'inactive' | 'unsupported';
  speechSynthesis: 'ready' | 'unsupported';
  webShare: 'supported' | 'unsupported';
}

export interface SmartReminder {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  priority: 'alta' | 'media' | 'baja';
  reminderType: 'voice_alarm' | 'push_notification' | 'calendar_alert';
  spokenAlert: string;
  completed: boolean;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  category: 'salud_medicinas' | 'reunion_trabajo' | 'llamada_mensaje' | 'pagos_finanzas' | 'personal';
  createdAt: string;
  syncedWithPhone: boolean;
}

export interface AgendaDayOverview {
  date: string;
  events: CalendarEvent[];
  tasks: PhoneTask[];
  reminders: SmartReminder[];
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  interaction?: Interaction;
  attachments?: UploadedMediaItem[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  lastInteraction?: Interaction;
}
