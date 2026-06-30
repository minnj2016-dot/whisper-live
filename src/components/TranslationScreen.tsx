import React from 'react';
import { Mic, Headphones, Volume2, ArrowUpDown } from 'lucide-react';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh-Hans', name: '简体中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
];

interface Transcript {
  text: string;
  originalText?: string;
  isFinal: boolean;
}

interface TranslationScreenProps {
  mode: 'earbud' | 'split';
  langA: string;
  langB: string;
  onChangeLangA: (code: string) => void;
  onChangeLangB: (code: string) => void;
  onSwapLanguages: () => void;
  isRecording: boolean;
  activeSpeaker: 'A' | 'B' | null;
  transcriptsA: Transcript[]; // User A's spoken, translated to B
  transcriptsB: Transcript[]; // User B's spoken, translated to A
  onStartSpeaking: (speaker: 'A' | 'B') => void;
  onStopSpeaking: () => void;
  uiLang?: 'ko' | 'en';
}

export const TranslationScreen: React.FC<TranslationScreenProps> = ({
  mode,
  langA,
  langB,
  onChangeLangA,
  onChangeLangB,
  onSwapLanguages,
  isRecording,
  activeSpeaker,
  transcriptsA,
  transcriptsB,
  onStartSpeaking,
  onStopSpeaking,
  uiLang = 'ko',
}) => {
  const getLanguageName = (code: string) => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name || code;
  };

  const getLanguageFlag = (code: string) => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.flag || '🌐';
  };

  // Helper to render soundwave bars dynamically based on active state
  const renderWaveform = (isActive: boolean, colorClass: string) => {
    return (
      <div className="waveform-container" style={{ opacity: isActive ? 1 : 0.2, marginTop: '8px' }}>
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="wave-bar"
            style={{
              backgroundColor: isActive ? `var(--color-${colorClass})` : 'var(--color-text-muted)',
              animation: isActive ? 'wave-bounce 0.8s ease-in-out infinite' : 'none',
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
    );
  };

  // Extract the latest transcription text to show in the center of cards
  const getLatestTranscript = (list: Transcript[]): { main: string; sub?: string } => {
    if (list.length === 0) return { main: '' };
    const latest = list[list.length - 1];
    return {
      main: latest.text,
      sub: latest.originalText,
    };
  };

  const latestA = getLatestTranscript(transcriptsA); // Spoken by A (Korean) -> Translated to B (English)
  const latestB = getLatestTranscript(transcriptsB); // Spoken by B (English) -> Translated to A (Korean)

  if (mode === 'split') {
    return (
      <div className="split-layout">
        {/* Center Swapper Button (Mockup 100% Match) */}
        <button 
          className="center-swapper" 
          onClick={onSwapLanguages}
          title={uiLang === 'ko' ? '언어 전환' : 'Swap Languages'}
          type="button"
        >
          <ArrowUpDown size={18} className="center-swapper-icon" />
        </button>

        {/* User B Section (TOP, 180deg Rotated for face-to-face) */}
        <div className={`split-section user-b ${activeSpeaker === 'B' ? 'active' : ''}`}>
          {/* Top Panel Actions for B */}
          <div className="split-action-bar">
            <select
              className="lang-selector"
              style={{ width: '120px', padding: '8px 24px 8px 12px', fontSize: '12px' }}
              value={langB}
              onChange={(e) => onChangeLangB(e.target.value)}
              disabled={isRecording}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>

            <span className="user-badge" style={{ color: 'var(--color-secondary)' }}>
              {getLanguageName(langB)} (User B)
            </span>
          </div>

          {/* Transcript display (translated text for User B from User A) */}
          <div className="split-transcripts">
            {latestA.main ? (
              <>
                <p className="split-text" style={{ color: 'var(--color-secondary)' }}>{latestA.main}</p>
                {latestA.sub && <p className="split-subtext">{uiLang === 'ko' ? '원문' : 'Original'}: {latestA.sub}</p>}
              </>
            ) : (
              <p className="transcript-placeholder">
                {activeSpeaker === 'A' 
                  ? (uiLang === 'ko' ? '상대방이 말하고 있습니다...' : 'The other party is speaking...') 
                  : (uiLang === 'ko' ? '상대방의 번역본이 여기에 표시됩니다' : 'The other party\'s translation will appear here')}
              </p>
            )}
          </div>

          {/* Push to talk button for User B */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {renderWaveform(activeSpeaker === 'B', 'secondary')}
            <button
              className={`microphone-button ${activeSpeaker === 'B' ? 'active' : ''}`}
              style={{
                background: 'linear-gradient(135deg, #f472b6, #ec4899)',
                boxShadow: activeSpeaker === 'B' ? '0 0 25px rgba(244, 114, 182, 0.6)' : 'none',
                width: '54px',
                height: '54px',
              }}
              onMouseDown={() => onStartSpeaking('B')}
              onMouseUp={onStopSpeaking}
              onTouchStart={() => onStartSpeaking('B')}
              onTouchEnd={onStopSpeaking}
            >
              <Mic size={22} />
            </button>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{uiLang === 'ko' ? '눌러서 말하기' : 'Hold to Speak'}</span>
          </div>
        </div>

        {/* User A Section (BOTTOM, Normal facing User A) */}
        <div className={`split-section user-a ${activeSpeaker === 'A' ? 'active' : ''}`}>
          {/* Push to talk button for User A */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{uiLang === 'ko' ? '누른 채로 말하기' : 'Hold to Speak'}</span>
            <button
              className={`microphone-button ${activeSpeaker === 'A' ? 'active' : ''}`}
              style={{
                background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                boxShadow: activeSpeaker === 'A' ? '0 0 25px rgba(99, 102, 241, 0.6)' : 'none',
                width: '54px',
                height: '54px',
              }}
              onMouseDown={() => onStartSpeaking('A')}
              onMouseUp={onStopSpeaking}
              onTouchStart={() => onStartSpeaking('A')}
              onTouchEnd={onStopSpeaking}
            >
              <Mic size={22} />
            </button>
            {renderWaveform(activeSpeaker === 'A', 'primary')}
          </div>

          {/* Transcript display (translated text for User A from User B) */}
          <div className="split-transcripts">
            {latestB.main ? (
              <>
                <p className="split-text" style={{ color: 'var(--color-primary)' }}>{latestB.main}</p>
                {latestB.sub && <p className="split-subtext">{uiLang === 'ko' ? '원문' : 'Original'}: {latestB.sub}</p>}
              </>
            ) : (
              <p className="transcript-placeholder">
                {activeSpeaker === 'B' 
                  ? (uiLang === 'ko' ? '상대방이 말하고 있습니다...' : 'The other party is speaking...') 
                  : (uiLang === 'ko' ? '번역된 텍스트가 여기에 표시됩니다' : 'Translated text will appear here')}
              </p>
            )}
          </div>

          {/* Bottom Panel Actions for A */}
          <div className="split-action-bar">
            <span className="user-badge" style={{ color: 'var(--color-primary)' }}>
              {getLanguageName(langA)} (User A)
            </span>

            <select
              className="lang-selector"
              style={{ width: '120px', padding: '8px 24px 8px 12px', fontSize: '12px' }}
              value={langA}
              onChange={(e) => onChangeLangA(e.target.value)}
              disabled={isRecording}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // Earbud Mode Layout
  return (
    <div className="earbud-layout">
      {/* Earbud Sharing Advice */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(99, 102, 241, 0.05)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          padding: '12px 16px',
          borderRadius: '16px',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          lineHeight: '1.4'
        }}
      >
        <Headphones size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <span>
          <strong>{uiLang === 'ko' ? '이어폰 공유 가이드' : 'Earbud Sharing Guide'}</strong>: {uiLang === 'ko' ? `왼쪽 이어버드는 User A(${getLanguageFlag(langA)}), 오른쪽 이어버드는 User B(${getLanguageFlag(langB)})가 각각 착용하면 실시간 귓속 통역을 들을 수 있습니다!` : `Put on the left earbud for User A (${getLanguageFlag(langA)}) and the right earbud for User B (${getLanguageFlag(langB)}) to hear real-time in-ear translation!`}
        </span>
      </div>

      {/* User A Transcript Card */}
      <div className={`earbud-card user-a ${activeSpeaker === 'A' ? 'speaking' : ''}`}>
        <div className="card-header">
          <span className="user-badge">{uiLang === 'ko' ? `${getLanguageName(langA)} 사용자` : `${getLanguageName(langA)} User`}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {activeSpeaker === 'A' && <span style={{ fontSize: '11px', color: 'var(--color-primary)' }}>{uiLang === 'ko' ? '말하는 중...' : 'Speaking...'}</span>}
            <Volume2 size={16} className="color-primary" style={{ opacity: activeSpeaker === 'B' ? 1 : 0.3, color: '#818cf8' }} />
          </div>
        </div>
        <div className="transcript-area">
          {latestB.main ? (
            <p style={{ margin: 0 }}>{latestB.main}</p>
          ) : (
            <span className="transcript-placeholder">
              {activeSpeaker === 'B' 
                ? (uiLang === 'ko' ? '상대방의 말이 통역되어 들리는 중...' : 'Hearing translated speech in earbud...') 
                : (uiLang === 'ko' ? '상상 속 번역이 귓가에 울립니다.' : 'Translation will be heard here.')}
            </span>
          )}
        </div>
        {latestB.sub && <div className="original-text">{uiLang === 'ko' ? '원문' : 'Original'}: {latestB.sub}</div>}
      </div>

      {/* Mic Trigger Buttons Row */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', margin: '10px 0' }}>
        {/* Button A */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <button
            className={`microphone-button ${activeSpeaker === 'A' ? 'active' : ''}`}
            onMouseDown={() => onStartSpeaking('A')}
            onMouseUp={onStopSpeaking}
            onTouchStart={() => onStartSpeaking('A')}
            onTouchEnd={onStopSpeaking}
            style={{
              background: 'linear-gradient(135deg, #818cf8, #6366f1)',
            }}
          >
            <Mic size={24} />
          </button>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
            {uiLang === 'ko' ? 'A 말하기' : 'Speak A'} ({getLanguageFlag(langA)})
          </span>
        </div>

        {/* Direction Switcher (visual decoration mostly) */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowUpDown size={16} style={{ color: 'var(--color-text-muted)' }} />
        </div>

        {/* Button B */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <button
            className={`microphone-button ${activeSpeaker === 'B' ? 'active' : ''}`}
            onMouseDown={() => onStartSpeaking('B')}
            onMouseUp={onStopSpeaking}
            onTouchStart={() => onStartSpeaking('B')}
            onTouchEnd={onStopSpeaking}
            style={{
              background: 'linear-gradient(135deg, #f472b6, #ec4899)',
              boxShadow: activeSpeaker === 'B' ? '0 8px 24px rgba(244, 114, 182, 0.4)' : 'none'
            }}
          >
            <Mic size={24} />
          </button>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-secondary)' }}>
            {uiLang === 'ko' ? 'B 말하기' : 'Speak B'} ({getLanguageFlag(langB)})
          </span>
        </div>
      </div>

      {/* User B Transcript Card */}
      <div className={`earbud-card user-b ${activeSpeaker === 'B' ? 'speaking' : ''}`}>
        <div className="card-header">
          <span className="user-badge">{uiLang === 'ko' ? `${getLanguageName(langB)} 사용자` : `${getLanguageName(langB)} User`}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {activeSpeaker === 'B' && <span style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>{uiLang === 'ko' ? '말하는 중...' : 'Speaking...'}</span>}
            <Volume2 size={16} className="color-secondary" style={{ opacity: activeSpeaker === 'A' ? 1 : 0.3, color: '#f472b6' }} />
          </div>
        </div>
        <div className="transcript-area">
          {latestA.main ? (
            <p style={{ margin: 0 }}>{latestA.main}</p>
          ) : (
            <span className="transcript-placeholder">
              {activeSpeaker === 'A' 
                ? (uiLang === 'ko' ? '상대방의 말이 통역되어 들리는 중...' : 'Hearing translation in earbud...') 
                : (uiLang === 'ko' ? '번역 결과가 여기에 표시됩니다.' : 'Translation will appear here.')}
            </span>
          )}
        </div>
        {latestA.sub && <div className="original-text">{uiLang === 'ko' ? '원문' : 'Original'}: {latestA.sub}</div>}
      </div>

      {/* Language Selectors for Earbud */}
      <div className="action-row" style={{ marginTop: '10px' }}>
        <select
          className="lang-selector"
          value={langA}
          onChange={(e) => onChangeLangA(e.target.value)}
          disabled={isRecording}
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              A: {l.flag} {l.name}
            </option>
          ))}
        </select>

        <select
          className="lang-selector"
          value={langB}
          onChange={(e) => onChangeLangB(e.target.value)}
          disabled={isRecording}
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              B: {l.flag} {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
