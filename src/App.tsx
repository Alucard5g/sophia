import React, { useState, useEffect } from 'react';
import { MobileHeader, AppTab } from './components/MobileHeader';
import { OmniVoiceBar } from './components/OmniVoiceBar';
import { SophiaAvatarHub } from './components/SophiaAvatarHub';
import { VoiceRecorderCard } from './components/VoiceRecorderCard';
import { AgendaRemindersTab } from './components/AgendaRemindersTab';
import { DailyNewsFeedTab } from './components/DailyNewsFeedTab';
import { UniversalTvRemoteView } from './components/UniversalTvRemoteView';
import { GenerativeMediaStudioTab } from './components/GenerativeMediaStudioTab';
import { BluetoothManagerTab } from './components/BluetoothManagerTab';
import { SmartHomeIoTTab } from './components/SmartHomeIoTTab';
import { SmartphoneManagerTab } from './components/SmartphoneManagerTab';
import { ScenarioSimulatorView } from './components/ScenarioSimulatorView';
import { CreationPreviewSandbox } from './components/CreationPreviewSandbox';
import { ResourcesView } from './components/ResourcesView';
import { AIStudioConfigPanel } from './components/AIStudioConfigPanel';
import { ModelCascadeMonitor } from './components/ModelCascadeMonitor';
import { InteractionHistoryDB } from './components/InteractionHistoryDB';
import { InstallAppTab } from './components/InstallAppTab';
import { CloudRunDeployTab } from './components/CloudRunDeployTab';
import { DeviceRecognitionModal, detectCurrentDevice } from './components/DeviceRecognitionModal';
import { PhoneAutoSyncModal } from './components/PhoneAutoSyncModal';
import { DailyBrainEvolutionModal } from './components/DailyBrainEvolutionModal';
import { ApiKeysManagerModal } from './components/ApiKeysManagerModal';
import { Interaction, AIStudioConfig, UserDeviceProfile } from './types';
import { getInteractionsFromOfflineCache } from './lib/offlineStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('avatar');
  const [isRecordingGlobal, setIsRecordingGlobal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentInteraction, setCurrentInteraction] = useState<Interaction | null>(null);
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');

  // User & Device recognition state
  const [userProfile, setUserProfile] = useState<UserDeviceProfile | null>(() => {
    try {
      return detectCurrentDevice() as UserDeviceProfile;
    } catch (e) {
      return null;
    }
  });
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);
  const [isPhoneSyncModalOpen, setIsPhoneSyncModalOpen] = useState<boolean>(false);
  const [isDailyBrainModalOpen, setIsDailyBrainModalOpen] = useState<boolean>(false);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState<boolean>(false);

  // AI Studio Global Configuration State (Defaulting to Professional Executive Voice)
  const [aiStudioConfig, setAiStudioConfig] = useState<AIStudioConfig>({
    modelSelectionMode: 'auto',
    systemInstructionPreset: 'default',
    customSystemInstruction: '',
    temperature: 0.2,
    topP: 0.95,
    topK: 64,
    thinkingLevel: 'LOW',
    enableSearchGrounding: true,
    responseFormat: 'auto',
    voiceProfile: {
      sweetnessLevel: 'media',
      voiceStyle: 'profesional_ejecutiva',
      flirtatiousCompliments: false,
      enableTTSAutoPlay: true,
      autoListenMode: false
    }
  });

  // Fast Instant Initialization: Load cached history first, then sync with Firebase safely
  useEffect(() => {
    // 1. Instant recovery from local cache / IndexedDB to prevent hanging on slow network
    getInteractionsFromOfflineCache().then((cached) => {
      if (cached && cached.length > 0) {
        setAllInteractions(cached);
        setCurrentInteraction(cached[0]);
      }
    }).catch(() => {});

    // 2. Recover Chat History from Firebase with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch('/api/firebase/chat-history', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.interactions && data.interactions.length > 0) {
          setAllInteractions(data.interactions);
          if (!currentInteraction) {
            setCurrentInteraction(data.interactions[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeoutId));

    // 3. Recover User Profile & Recognized Phone from Firebase with timeout
    const profileController = new AbortController();
    const profileTimeoutId = setTimeout(() => profileController.abort(), 4000);

    fetch('/api/firebase/user-profile', { signal: profileController.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.userProfile) {
          setUserProfile(data.userProfile);
          if (data.userProfile.preferredVoiceStyle) {
            setAiStudioConfig((prev) => ({
              ...prev,
              voiceProfile: {
                ...prev.voiceProfile,
                voiceStyle: data.userProfile.preferredVoiceStyle
              }
            }));
          }
        }
      })
      .catch(() => {
        if (!userProfile) {
          const detected = detectCurrentDevice();
          setUserProfile(detected as UserDeviceProfile);
        }
      })
      .finally(() => clearTimeout(profileTimeoutId));

    // 4. Check Daily Brain Evolution Status & Prompt User with Approval Report (Ley VIII)
    const evoController = new AbortController();
    const evoTimeoutId = setTimeout(() => evoController.abort(), 4000);

    fetch('/api/brain-evolution/status', { signal: evoController.signal })
      .then((res) => res.json())
      .then((data) => {
        const todayKey = `sophia_evo_seen_${data.todayDate || new Date().toISOString().split('T')[0]}`;
        const hasSeenToday = sessionStorage.getItem(todayKey);

        // If today's evolution has not been approved or not seen in this session yet, show report to user
        if (!data.isApprovedToday || !hasSeenToday) {
          setIsDailyBrainModalOpen(true);
          sessionStorage.setItem(todayKey, 'true');
        }
      })
      .catch(() => {
        // Fallback: show if not seen today in session
        const todayStr = new Date().toISOString().split('T')[0];
        const todayKey = `sophia_evo_seen_${todayStr}`;
        if (!sessionStorage.getItem(todayKey)) {
          setIsDailyBrainModalOpen(true);
          sessionStorage.setItem(todayKey, 'true');
        }
      })
      .finally(() => clearTimeout(evoTimeoutId));
  }, []);

  const handleProfileUpdated = (profile: UserDeviceProfile) => {
    setUserProfile(profile);
    if (profile.preferredVoiceStyle) {
      setAiStudioConfig((prev) => ({
        ...prev,
        voiceProfile: {
          ...prev.voiceProfile,
          voiceStyle: profile.preferredVoiceStyle
        }
      }));
    }
    // Sync update to Firebase
    fetch('/api/firebase/user-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    }).catch((e) => console.warn('Sync profile error:', e));
  };

  const handleProcessComplete = (interaction: Interaction) => {
    setCurrentInteraction(interaction);
    setAllInteractions((prev) => {
      const filtered = prev.filter(i => i.id !== interaction.id);
      return [interaction, ...filtered];
    });
    setPendingPrompt('');
    
    // Automatically save interaction to Firebase Firestore in the background
    fetch('/api/firebase/chat-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interaction })
    }).catch((e) => console.warn('Save to Firebase error:', e));

    // Keep active in the avatar tab
    setActiveTab('avatar');
  };

  const handleSelectFromHistory = (interaction: Interaction) => {
    setCurrentInteraction(interaction);
    setActiveTab('avatar');
  };

  const handleSendPromptFromCreation = (prompt: string) => {
    setPendingPrompt(prompt);
    setActiveTab('avatar');
  };

  const handleVoiceCommandFromSubmodule = (cmd: string) => {
    setPendingPrompt(cmd);
    setActiveTab('avatar');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Smartphone OS Status Bar & Navigation Header */}
      <MobileHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRecording={isRecordingGlobal}
        failoverOccurred={currentInteraction?.failoverOccurred}
        userProfile={userProfile}
        onOpenDeviceModal={() => setIsDeviceModalOpen(true)}
        onOpenBrainEvolution={() => setIsDailyBrainModalOpen(true)}
        onOpenApiKeys={() => setIsApiKeysModalOpen(true)}
      />

      {/* Omnipresent Voice & Text Command Bar */}
      <div className="w-full max-w-5xl mx-auto px-4 pt-3 pb-1">
        <OmniVoiceBar
          onExecuteCommand={handleVoiceCommandFromSubmodule}
          voiceProfile={aiStudioConfig.voiceProfile}
        />
      </div>

      {/* Main View Container */}
      <main className="flex-1 pb-12 pt-2 px-4">
        {(activeTab === 'avatar' || activeTab === 'recorder' || activeTab === 'simulator') && (
          <SophiaAvatarHub
            onProcessComplete={handleProcessComplete}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            setIsRecordingGlobal={setIsRecordingGlobal}
            aiStudioConfig={aiStudioConfig}
            onChangeConfig={setAiStudioConfig}
            currentInteraction={currentInteraction}
            userProfile={userProfile}
            initialPrompt={pendingPrompt}
            onNavigateTab={(tab) => setActiveTab(tab as AppTab)}
            onOpenDeviceModal={() => setIsDeviceModalOpen(true)}
            onOpenCreations={() => setActiveTab('creations')}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaRemindersTab
            userProfile={userProfile}
            onSendToVoiceAssistant={handleVoiceCommandFromSubmodule}
            voiceStyle={aiStudioConfig.voiceProfile?.voiceStyle || 'profesional_ejecutiva'}
          />
        )}

        {activeTab === 'news' && (
          <DailyNewsFeedTab
            onSendVoiceCommand={handleVoiceCommandFromSubmodule}
            voiceStyle={aiStudioConfig.voiceProfile?.voiceStyle || 'profesional_ejecutiva'}
          />
        )}

        {activeTab === 'remote' && (
          <UniversalTvRemoteView onSendVoiceCommand={handleVoiceCommandFromSubmodule} />
        )}

        {activeTab === 'studio' && (
          <GenerativeMediaStudioTab onSendVoiceCommand={handleVoiceCommandFromSubmodule} />
        )}

        {activeTab === 'bluetooth' && (
          <BluetoothManagerTab onSendVoiceCommand={handleVoiceCommandFromSubmodule} />
        )}

        {activeTab === 'smarthome' && (
          <SmartHomeIoTTab onSendVoiceCommand={handleVoiceCommandFromSubmodule} />
        )}

        {activeTab === 'phone' && (
          <SmartphoneManagerTab onSendToVoiceAssistant={handleVoiceCommandFromSubmodule} />
        )}

        {activeTab === 'simulator' && (
          <ScenarioSimulatorView
            currentInteraction={currentInteraction}
            onOpenResources={() => setActiveTab('resources')}
            onOpenCreations={() => setActiveTab('creations')}
          />
        )}

        {activeTab === 'creations' && (
          <CreationPreviewSandbox
            currentInteraction={currentInteraction}
            onSendPrompt={handleSendPromptFromCreation}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesView
            currentInteraction={currentInteraction}
            allInteractions={allInteractions}
          />
        )}

        {activeTab === 'aistudio' && (
          <AIStudioConfigPanel
            config={aiStudioConfig}
            onChangeConfig={setAiStudioConfig}
            currentPrompt={currentInteraction?.userQuery || ''}
            onOpenApiKeysModal={() => setIsApiKeysModalOpen(true)}
          />
        )}

        {activeTab === 'database' && (
          <InteractionHistoryDB onSelectInteraction={handleSelectFromHistory} />
        )}

        {activeTab === 'models' && <ModelCascadeMonitor />}

        {activeTab === 'install' && <InstallAppTab />}

        {activeTab === 'deploy' && <CloudRunDeployTab />}
      </main>

      {/* Device Recognition & User Profile Modal */}
      <DeviceRecognitionModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        currentProfile={userProfile}
      />

      {/* Real Phone & Apps Auto-Sync Modal */}
      <PhoneAutoSyncModal
        isOpen={isPhoneSyncModalOpen}
        onClose={() => setIsPhoneSyncModalOpen(false)}
        onSyncComplete={(data) => {
          setIsPhoneSyncModalOpen(false);
        }}
      />

      {/* Daily Brain Evolution & System Update Approval Modal (Ley VIII) */}
      <DailyBrainEvolutionModal
        isOpen={isDailyBrainModalOpen}
        onClose={() => setIsDailyBrainModalOpen(false)}
        voiceStyle={aiStudioConfig.voiceProfile?.voiceStyle}
        onApprovalComplete={(report) => {
          // Optional: refresh interactions/state if needed
        }}
      />

      {/* AI Providers API Keys Manager Modal */}
      <ApiKeysManagerModal
        isOpen={isApiKeysModalOpen}
        onClose={() => setIsApiKeysModalOpen(false)}
        onKeysUpdated={(keys) => {
          setAiStudioConfig((prev) => ({
            ...prev,
            apiKeys: keys,
          }));
        }}
      />

      {/* Bottom Footer Credit Bar */}
      <footer className="py-3 px-4 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px]">
            SophIA • Noticias Google Search • Reconocimiento de Celular • Bluetooth & Sonido • Domótica IoT • Multi-IA
          </span>
          <span className="text-[11px] font-mono text-indigo-400">
            Dictado Universal de Voz o Texto • Enrutador Neural Zero-Latency
          </span>
        </div>
      </footer>
    </div>
  );
}
