import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, HelpCircle, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { apiKey: string; echoTargetLanguage: boolean; isDemoMode: boolean }) => void;
  initialApiKey: string;
  initialEchoTarget: boolean;
  initialIsDemoMode: boolean;
  uiLang?: 'ko' | 'en';
}

const TRANSLATIONS = {
  ko: {
    title: '설정 (Settings)',
    opMode: '작동 모드 (Operation Mode)',
    demoMode: '시뮬레이터 데모',
    apiMode: '실제 Gemini API',
    demoDesc: 'API 키 없이도 동작하는 대화 시뮬레이션을 체험합니다.',
    apiDesc: '본인의 Gemini API 키를 사용하여 실제 실시간 음성 통역을 진행합니다.',
    apiKeyLabel: 'Gemini API Key',
    showKey: '표시',
    hideKey: '숨기기',
    apiKeyPlaceholder: 'AI Studio에서 발급받은 API 키 입력',
    apiKeyNote: '* API 키는 브라우저 로컬 저장소(localStorage)에만 안전하게 보관됩니다.',
    policyTitle: '번역 정책 (Translation Policy)',
    echoLabel: '타겟 언어 에코 (Echo Target Language)',
    echoDesc: '이미 타겟 언어인 음성이 입력될 때 앵무새처럼 다시 에코합니다.',
    saveBtn: '설정 저장 및 적용',
  },
  en: {
    title: 'Settings',
    opMode: 'Operation Mode',
    demoMode: 'Simulator Demo',
    apiMode: 'Real Gemini API',
    demoDesc: 'Experience the conversation simulation without an API key.',
    apiDesc: 'Use your own Gemini API key for real-time speech translation.',
    apiKeyLabel: 'Gemini API Key',
    showKey: 'Show',
    hideKey: 'Hide',
    apiKeyPlaceholder: 'Enter API Key from AI Studio',
    apiKeyNote: '* API key is securely stored in your browser\'s localStorage.',
    policyTitle: 'Translation Policy',
    echoLabel: 'Echo Target Language',
    echoDesc: 'Echoes the speech back when input is already in the target language.',
    saveBtn: 'Save & Apply Settings',
  }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialApiKey,
  initialEchoTarget,
  initialIsDemoMode,
  uiLang = 'ko',
}) => {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [echoTargetLanguage, setEchoTargetLanguage] = useState(initialEchoTarget);
  const [isDemoMode, setIsDemoMode] = useState(initialIsDemoMode);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(initialApiKey);
    setEchoTargetLanguage(initialEchoTarget);
    setIsDemoMode(initialIsDemoMode);
  }, [initialApiKey, initialEchoTarget, initialIsDemoMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      apiKey: apiKey.trim(),
      echoTargetLanguage,
      isDemoMode,
    });
    onClose();
  };

  const t = TRANSLATIONS[uiLang];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} className="color-primary" style={{ color: '#818cf8' }} />
            <h2 className="modal-title">{t.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Mode Selector */}
          <div className="form-group">
            <label className="form-label">{t.opMode}</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`mode-tab ${isDemoMode ? 'active' : ''}`}
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setIsDemoMode(true)}
              >
                <HelpCircle size={16} />
                {t.demoMode}
              </button>
              <button
                type="button"
                className={`mode-tab ${!isDemoMode ? 'active' : ''}`}
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setIsDemoMode(false)}
              >
                <ShieldCheck size={16} />
                {t.apiMode}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {isDemoMode ? t.demoDesc : t.apiDesc}
            </p>
          </div>

          {/* API Key Input */}
          {!isDemoMode && (
            <div className="form-group" style={{ animation: 'slide-up 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="api-key-input">{t.apiKeyLabel}</label>
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)} 
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                >
                  {showKey ? t.hideKey : t.showKey}
                </button>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)' }} />
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder={t.apiKeyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required={!isDemoMode}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {t.apiKeyNote}
              </p>
            </div>
          )}

          {/* Echo Translation Toggle */}
          <div className="form-group">
            <label className="form-label">{t.policyTitle}</label>
            <label className="form-row-checkbox">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.echoLabel}</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {t.echoDesc}
                </span>
              </div>
              <input
                type="checkbox"
                checked={echoTargetLanguage}
                onChange={(e) => setEchoTargetLanguage(e.target.checked)}
              />
            </label>
          </div>

          {/* Action Buttons */}
          <button type="submit" className="save-button">
            {t.saveBtn}
          </button>
        </form>
      </div>
    </div>
  );
};
