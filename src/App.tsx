import { useState, useEffect, useRef } from 'react';
import { Settings, Headphones, Users, HelpCircle, ShieldAlert, Sparkles, CreditCard, Award } from 'lucide-react';
import { TranslationScreen } from './components/TranslationScreen';
import { SettingsModal } from './components/SettingsModal';
import { PricingModal } from './components/PricingModal';
import { CheckoutModal } from './components/CheckoutModal';
import { AudioRecorder, AudioPlayer } from './utils/audioProcessor';
import { GeminiLiveSocket } from './utils/geminiLiveSocket';
import './App.css';

interface TranscriptItem {
  text: string;
  originalText?: string;
  isFinal: boolean;
}

// Interactive Simulation Scenarios
const DEMO_SCENARIOS: Record<string, Array<{ speaker: 'A' | 'B'; original: string; translated: string }>> = {
  'ko-en': [
    { speaker: 'A', original: "안녕하세요! 스마트폰 하나로 통역해주는 귓속 통역기 앱을 사용해주셔서 감사합니다.", translated: "Hello! Thank you for using the Whisper Translator app, which translates using just a single smartphone." },
    { speaker: 'B', original: "Wow, this is amazing! Can you hear me clearly in English through the earbud?", translated: "와, 이거 대단하네요! 이어버드를 통해 제 영어가 명확하게 들리시나요?" },
    { speaker: 'A', original: "네, 아주 깨끗하게 들립니다. 테이블 위에 올려두고 대면 모드로 대화하기에도 좋습니다.", translated: "Yes, I can hear you very clearly. It is also great for placing on the table for face-to-face mode conversations." },
    { speaker: 'B', original: "Perfect! This makes international business meetings so much easier.", translated: "완벽해요! 이 덕분에 국제 비즈니스 회의가 훨씬 수월해지겠어요." }
  ],
  'ko-ja': [
    { speaker: 'A', original: "안녕하세요! 오늘 도쿄 여행은 어떠신가요?", translated: "こんにちは！今日の東京旅行はいかがですか？" },
    { speaker: 'B', original: "とても楽しいです！おいしい寿司を食べに行きたいですが, おすすめはありますか？", translated: "아주 즐겁습니다! 맛있는 초밥을 먹으러 가고 싶은데, 추천할 만한 곳이 있을까요?" },
    { speaker: 'A', original: "신주쿠 근처에 현지인들이 자주 가는 유명한 초밥집이 있어요. 지도로 알려드릴게요.", translated: "新宿の近くに地元の人たちがよく行く有名な寿司屋があります。地図で教えますね。" },
    { speaker: 'B', original: "ありがとうございます！助かりました。", translated: "정말 감사합니다! 큰 도움이 되었습니다." }
  ],
  'ko-es': [
    { speaker: 'A', original: "환영합니다! 호텔 체크인을 도와드릴까요?", translated: "¡Bienvenido! ¿Le ayudo con el registro del hotel?" },
    { speaker: 'B', original: "Sí, por favor. Tengo una reserva a nombre de Carlos.", translated: "네, 부탁합니다. 카를로스라는 이름으로 예약했습니다." },
    { speaker: 'A', original: "네, Carlos님 예약 확인되었습니다. 여기 방 키가 있습니다.", translated: "Sí, señor Carlos, su reserva ha sido confirmada. Aquí tiene la llave de su habitación." },
    { speaker: 'B', original: "Muchas gracias. ¿A qué hora es el desayuno mañana?", translated: "정말 감사합니다. 내일 조식 시간은 몇 시인가요?" }
  ],
  'ko-zh-Hans': [
    { speaker: 'A', original: "안녕하세요! 중국 베이징 출장은 처음이신가요?", translated: "您好！这是您第一次来中国北京出差吗？" },
    { speaker: 'B', original: "是的, 这是我第一次来。北京的天气非常不错。", translated: "네, 처음 방문입니다. 베이징 날씨가 아주 좋네요." },
    { speaker: 'A', original: "만나서 반갑습니다. 미팅 장소로 가시죠.", translated: "很高兴认识您。我们去会议地点吧。" }
  ]
};

function App() {
  // App Modes and Languages
  const [mode, setMode] = useState<'earbud' | 'split'>('earbud');
  const [langA, setLangA] = useState<string>('ko');
  const [langB, setLangB] = useState<string>('en');

  // Configuration state
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_live_translate_api_key') || '';
  });
  const [echoTargetLanguage, setEchoTargetLanguage] = useState<boolean>(() => {
    const saved = localStorage.getItem('gemini_live_translate_echo_target');
    return saved ? saved === 'true' : true;
  });
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('gemini_live_translate_demo_mode');
    return saved ? saved === 'true' : true;
  });

  // Subscription state
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro'>(() => {
    return (localStorage.getItem('gemini_live_translate_sub_tier') as 'free' | 'pro') || 'free';
  });
  const [sessionTurns, setSessionTurns] = useState<number>(0);

  // Modal control
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Connection & Recording status
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'demo'>('demo');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'A' | 'B' | null>(null);

  // Transcripts list
  const [transcriptsA, setTranscriptsA] = useState<TranscriptItem[]>([]);
  const [transcriptsB, setTranscriptsB] = useState<TranscriptItem[]>([]);

  // Simulation State Ref
  const demoIndices = useRef<{ [key: string]: number }>({});
  const typingIntervalRef = useRef<any>(null);

  // Audio & WebSocket Refs
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const socketRef = useRef<GeminiLiveSocket | null>(null);

  // Sync initial connectionStatus state with mode
  useEffect(() => {
    setConnectionStatus(isDemoMode ? 'demo' : 'disconnected');
  }, [isDemoMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const stopAllStreams = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsRecording(false);
    setActiveSpeaker(null);
  };

  const handleSaveSettings = (newSettings: { apiKey: string; echoTargetLanguage: boolean; isDemoMode: boolean }) => {
    setApiKey(newSettings.apiKey);
    setEchoTargetLanguage(newSettings.echoTargetLanguage);
    setIsDemoMode(newSettings.isDemoMode);

    localStorage.setItem('gemini_live_translate_api_key', newSettings.apiKey);
    localStorage.setItem('gemini_live_translate_echo_target', String(newSettings.echoTargetLanguage));
    localStorage.setItem('gemini_live_translate_demo_mode', String(newSettings.isDemoMode));

    setConnectionStatus(newSettings.isDemoMode ? 'demo' : 'disconnected');
    setErrorMessage(null);
    stopAllStreams();
  };

  // Speaks text using browser Speech Synthesis (TTS) for Demo Mode
  const speakDemoText = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map BCP-47 codes to TTS voices
    let voicesLang = 'en-US';
    if (langCode === 'ko') voicesLang = 'ko-KR';
    else if (langCode === 'ja') voicesLang = 'ja-JP';
    else if (langCode === 'zh-Hans') voicesLang = 'zh-CN';
    else if (langCode === 'es') voicesLang = 'es-ES';
    else if (langCode === 'fr') voicesLang = 'fr-FR';
    else if (langCode === 'de') voicesLang = 'de-DE';
    else if (langCode === 'vi') voicesLang = 'vi-VN';
    else if (langCode === 'th') voicesLang = 'th-TH';
    
    utterance.lang = voicesLang;
    
    // Select a fitting voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(voicesLang));
    if (matchingVoice) utterance.voice = matchingVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  // Run the Simulation Logic (Demo Mode)
  const startDemoSimulation = (speaker: 'A' | 'B') => {
    setActiveSpeaker(speaker);
    setIsRecording(true);

    // Formulate a scenario key e.g., 'ko-en'
    const scenarioKey = `${langA}-${langB}`;
    const reverseKey = `${langB}-${langA}`;
    let isReversed = false;
    let activeScenario = DEMO_SCENARIOS[scenarioKey];
    
    if (!activeScenario && DEMO_SCENARIOS[reverseKey]) {
      activeScenario = DEMO_SCENARIOS[reverseKey];
      isReversed = true;
    }
    
    // Fallback if scenario is not predefined
    if (!activeScenario) {
      activeScenario = [
        { speaker: 'A', original: "안녕하세요! 실시간으로 목소리를 감지하여 통역을 제공합니다.", translated: `Demo Translation: This is live translated speech to ${langB}.` },
        { speaker: 'B', original: "Nice to meet you! Testing the real-time speech feedback loop.", translated: `데모 번역: 이것은 ${langA}로 실시간 통역된 음성입니다.` }
      ];
      isReversed = false;
    }

    const currentKey = `${langA}_to_${langB}`;
    if (demoIndices.current[currentKey] === undefined) {
      demoIndices.current[currentKey] = 0;
    }

    const nextIndex = demoIndices.current[currentKey];
    // Find the sentence where the speaker matches
    let sentenceIndex = nextIndex % activeScenario.length;
    let selectedLine = activeScenario[sentenceIndex];

    // Align speaker depending on reverse layout
    const expectedSpeaker = isReversed 
      ? (selectedLine.speaker === 'A' ? 'B' : 'A')
      : selectedLine.speaker;

    if (expectedSpeaker !== speaker) {
      // Find the next line matching this speaker
      for (let i = 0; i < activeScenario.length; i++) {
        const checkIdx = (nextIndex + i) % activeScenario.length;
        const checkLine = activeScenario[checkIdx];
        const checkSpeaker = isReversed 
          ? (checkLine.speaker === 'A' ? 'B' : 'A')
          : checkLine.speaker;
        
        if (checkSpeaker === speaker) {
          sentenceIndex = checkIdx;
          selectedLine = checkLine;
          demoIndices.current[currentKey] = checkIdx;
          break;
        }
      }
    }

    // Determine the source and target values
    const originalText = selectedLine.original;
    const translatedText = selectedLine.translated;

    // Simulate real-time speech transcription typing animation
    let typedIndex = 0;
    const totalLength = originalText.length;
    const intervalTime = Math.max(30, Math.min(100, 2000 / totalLength)); // Cap speed

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
      typedIndex++;
      const partialText = originalText.substring(0, typedIndex);
      const isFinal = typedIndex >= totalLength;

      if (speaker === 'A') {
        setTranscriptsA([{ text: '', originalText: partialText, isFinal }]);
      } else {
        setTranscriptsB([{ text: '', originalText: partialText, isFinal }]);
      }

      if (isFinal) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        
        // Show translated text after a tiny delay
        setTimeout(() => {
          if (speaker === 'A') {
            setTranscriptsA([{ text: translatedText, originalText, isFinal: true }]);
            speakDemoText(translatedText, langB);
          } else {
            setTranscriptsB([{ text: translatedText, originalText, isFinal: true }]);
            speakDemoText(translatedText, langA);
          }
          // Increment for next turn
          demoIndices.current[currentKey] = sentenceIndex + 1;
        }, 400);
      }
    }, intervalTime);
  };

  // Run the Live API Connection Logic (WebSockets + Microphones)
  const startLiveApiSession = async (speaker: 'A' | 'B') => {
    if (!apiKey) {
      setErrorMessage("API 키가 누락되었습니다. 설정에서 API 키를 입력해 주세요.");
      setIsSettingsOpen(true);
      return;
    }

    setActiveSpeaker(speaker);
    setIsRecording(true);
    setErrorMessage(null);

    // Speaker A is translating into Language B, Speaker B is translating into Language A
    const targetLanguageCode = speaker === 'A' ? langB : langA;

    try {
      // 1. Initialize Player first to accept early outputs
      playerRef.current = new AudioPlayer();

      // 2. Initialize and configure WebSocket
      socketRef.current = new GeminiLiveSocket(
        {
          apiKey,
          targetLanguageCode,
          echoTargetLanguage,
        },
        {
          onStatusChange: (status, msg) => {
            setConnectionStatus(status);
            if (status === 'error' && msg) {
              setErrorMessage(msg);
              stopAllStreams();
            }
          },
          onInputTranscription: (text, isFinal) => {
            const updateFunc = speaker === 'A' ? setTranscriptsA : setTranscriptsB;
            updateFunc([{ text: '', originalText: text, isFinal }]);
          },
          onOutputTranscription: (text, isFinal) => {
            const updateFunc = speaker === 'A' ? setTranscriptsA : setTranscriptsB;
            // Retain original text if already transcribed
            updateFunc((prev) => {
              const original = prev[0]?.originalText || '';
              return [{ text, originalText: original, isFinal }];
            });
          },
          onAudioOutput: (base64Audio) => {
            if (playerRef.current) {
              playerRef.current.playPCMChunk(base64Audio);
            }
          },
        }
      );

      // 3. Connect Socket
      socketRef.current.connect();

      // 4. Initialize Recorder to stream audio
      recorderRef.current = new AudioRecorder((base64Chunk) => {
        if (socketRef.current) {
          socketRef.current.sendAudioChunk(base64Chunk);
        }
      });

      await recorderRef.current.start();
    } catch (err: any) {
      console.error(err);
      setErrorMessage("마이크 장치를 활성화하거나 오디오 파이프라인을 구동하는 데 실패했습니다.");
      stopAllStreams();
    }
  };

  const handleStartSpeaking = (speaker: 'A' | 'B') => {
    // Check if free user has reached 3 turn limit
    if (subscriptionTier === 'free' && sessionTurns >= 3) {
      setIsPricingOpen(true);
      return;
    }

    // Prevent double starts
    if (isRecording) {
      stopAllStreams();
    }

    // Increment turn count
    setSessionTurns((prev) => prev + 1);

    if (isDemoMode) {
      startDemoSimulation(speaker);
    } else {
      startLiveApiSession(speaker);
    }
  };

  const handleStopSpeaking = () => {
    // In Live Mode, we stop the stream on release
    if (!isDemoMode) {
      stopAllStreams();
    } else {
      // In demo mode, we let the typing finish, but we reset active highlights
      setActiveSpeaker(null);
      setIsRecording(false);
    }
  };

  const handleSwapLanguages = () => {
    stopAllStreams();
    const temp = langA;
    setLangA(langB);
    setLangB(temp);
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'demo':
        return (
          <div className="connection-status badge-demo">
            <div className="status-dot demo" />
            <span>데모 모드</span>
          </div>
        );
      case 'connected':
        return (
          <div className="connection-status badge-live">
            <div className="status-dot connected" />
            <span>연결됨</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="connection-status" style={{ color: 'var(--color-primary)' }}>
            <div className="status-dot connected" style={{ backgroundColor: 'var(--color-primary)' }} />
            <span>연결 중...</span>
          </div>
        );
      case 'error':
        return (
          <div className="connection-status" style={{ color: '#ef4444' }}>
            <div className="status-dot" style={{ backgroundColor: '#ef4444' }} />
            <span>에러</span>
          </div>
        );
      default:
        return (
          <div className="connection-status" style={{ color: 'var(--color-text-muted)' }}>
            <div className="status-dot disconnected" />
            <span>대기 중</span>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <Sparkles size={22} style={{ color: '#818cf8' }} />
          <h1 className="logo-text" style={{ margin: 0, fontSize: '20px' }}>WhisperLive</h1>
          {subscriptionTier === 'pro' ? (
            <button 
              onClick={() => setIsPricingOpen(true)}
              className="tier-badge pro-badge" 
              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '12px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: '#000', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)' }}
            >
              <Award size={10} />
              Pro
            </button>
          ) : (
            <button 
              onClick={() => setIsPricingOpen(true)}
              className="tier-badge free-badge" 
              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)', color: 'var(--color-text-muted)', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Free
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {getStatusBadge()}
          <button 
            className="icon-button" 
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Free Tier Turns Counter Banner */}
      {subscriptionTier === 'free' && (
        <div className="simulation-banner" style={{ background: 'rgba(129, 140, 248, 0.05)', border: '1px solid rgba(129, 140, 248, 0.1)', color: 'var(--color-text-muted)', margin: '0 20px 16px' }}>
          <CreditCard size={14} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '12px' }}>
            무료 사용량 한도: <strong>{sessionTurns} / 3 턴</strong> 사용됨
          </span>
          {sessionTurns >= 3 ? (
            <button onClick={() => setIsPricingOpen(true)} style={{ background: 'var(--gradient-glow)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, marginLeft: 'auto', cursor: 'pointer' }}>
              PRO로 해제
            </button>
          ) : (
            <button onClick={() => setIsPricingOpen(true)} style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-main)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, marginLeft: 'auto', cursor: 'pointer' }}>
              업그레이드
            </button>
          )}
        </div>
      )}

      {/* Demo Warning Banner */}
      {isDemoMode && (
        <div className="simulation-banner">
          <HelpCircle size={16} />
          <span>시뮬레이터 모드가 활성화되어 있습니다.</span>
          <button onClick={() => setIsSettingsOpen(true)}>
            API 키 등록
          </button>
        </div>
      )}

      {/* Connection Error Banner */}
      {errorMessage && (
        <div className="simulation-banner" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <ShieldAlert size={16} />
          <span style={{ fontSize: '12px' }}>{errorMessage}</span>
        </div>
      )}

      {/* Mode Switches */}
      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'earbud' ? 'active' : ''}`}
          onClick={() => { stopAllStreams(); setMode('earbud'); }}
        >
          <Headphones size={16} />
          이어폰 공유
        </button>
        <button
          className={`mode-tab ${mode === 'split' ? 'active' : ''}`}
          onClick={() => { stopAllStreams(); setMode('split'); }}
        >
          <Users size={16} />
          대면 대화
        </button>
      </div>

      {/* Main Work Area */}
      <main className="main-content">
        <TranslationScreen
          mode={mode}
          langA={langA}
          langB={langB}
          onChangeLangA={(code) => { stopAllStreams(); setLangA(code); }}
          onChangeLangB={(code) => { stopAllStreams(); setLangB(code); }}
          onSwapLanguages={handleSwapLanguages}
          isRecording={isRecording}
          activeSpeaker={activeSpeaker}
          transcriptsA={transcriptsA}
          transcriptsB={transcriptsB}
          onStartSpeaking={handleStartSpeaking}
          onStopSpeaking={handleStopSpeaking}
        />
      </main>

      {/* Settings Drawer Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialApiKey={apiKey}
        initialEchoTarget={echoTargetLanguage}
        initialIsDemoMode={isDemoMode}
      />

      {/* Pricing / Plan upgrade Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onSelectPro={() => {
          setIsPricingOpen(false);
          setIsCheckoutOpen(true);
        }}
        currentTier={subscriptionTier}
      />

      {/* Credit Card Mock Payment Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={() => {
          setSubscriptionTier('pro');
          localStorage.setItem('gemini_live_translate_sub_tier', 'pro');
        }}
      />
    </div>
  );
}

export default App;
