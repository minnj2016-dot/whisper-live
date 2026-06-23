import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, HelpCircle, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { apiKey: string; echoTargetLanguage: boolean; isDemoMode: boolean }) => void;
  initialApiKey: string;
  initialEchoTarget: boolean;
  initialIsDemoMode: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialApiKey,
  initialEchoTarget,
  initialIsDemoMode,
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} className="color-primary" style={{ color: '#818cf8' }} />
            <h2 className="modal-title">설정 (Settings)</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Mode Selector */}
          <div className="form-group">
            <label className="form-label">작동 모드 (Operation Mode)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`mode-tab ${isDemoMode ? 'active' : ''}`}
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setIsDemoMode(true)}
              >
                <HelpCircle size={16} />
                시뮬레이터 데모
              </button>
              <button
                type="button"
                className={`mode-tab ${!isDemoMode ? 'active' : ''}`}
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setIsDemoMode(false)}
              >
                <ShieldCheck size={16} />
                실제 Gemini API
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {isDemoMode 
                ? 'API 키 없이도 동작하는 대화 시뮬레이션을 체험합니다.' 
                : '본인의 Gemini API 키를 사용하여 실제 실시간 음성 통역을 진행합니다.'}
            </p>
          </div>

          {/* API Key Input */}
          {!isDemoMode && (
            <div className="form-group" style={{ animation: 'slide-up 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="api-key-input">Gemini API Key</label>
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)} 
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                >
                  {showKey ? '숨기기' : '표시'}
                </button>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)' }} />
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="AI Studio에서 발급받은 API 키 입력"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required={!isDemoMode}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                * API 키는 브라우저 로컬 저장소(localStorage)에만 안전하게 보관됩니다.
              </p>
            </div>
          )}

          {/* Echo Translation Toggle */}
          <div className="form-group">
            <label className="form-label">번역 정책 (Translation Policy)</label>
            <label className="form-row-checkbox">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>타겟 언어 에코 (Echo Target Language)</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  이미 타겟 언어인 음성이 입력될 때 앵무새처럼 다시 에코합니다.
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
            설정 저장 및 적용
          </button>
        </form>
      </div>
    </div>
  );
};
