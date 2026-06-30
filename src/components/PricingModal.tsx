import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPro: () => void;
  currentTier: 'free' | 'pro';
  uiLang?: 'ko' | 'en';
}

const TRANSLATIONS = {
  ko: {
    title: '요금제 안내 (Pricing Plans)',
    subtitle: '실시간 귓속/대면 통역기 서비스를 무제한으로 이용하고 비즈니스를 글로벌화하세요.',
    activeTier: '사용 중',
    freeTitle: 'Free (기본 체험)',
    freePrice: '0원',
    freePeriod: '/ 평생 무료',
    freeBullet1: '실시간 다국어 동시통역 체험',
    freeBullet2: '이어폰 공유 및 대면 모드 지원',
    freeBullet3: '매 세션당 대화 3회(3턴) 제한',
    proTitle: 'Pro (무제한 프로)',
    proPrice: '19,000원',
    proPeriod: '/ 월 구독',
    proBullet1: '무제한 실시간 양방향 통역',
    proBullet2: '초저지연 Gemini Live API 우선 순위 연결',
    proBullet3: '대면 스플릿 스크린 전용 뷰어 가독성 강화',
    proBullet4: '중국어/베트남어/스페인어 등 70개국 완벽 통역',
    proBtnStart: 'Pro 구독 시작하기',
    proBtnActive: '현재 이용 중인 요금제입니다',
    enterpriseTitle: 'Enterprise (기업 비즈니스)',
    enterprisePrice: '별도 문의',
    enterpriseBtn: '영업 문의하기',
    enterpriseAlert: '영업팀 문의: sales@whisperlive.com 으로 문의 부탁드립니다.',
  },
  en: {
    title: 'Pricing Plans',
    subtitle: 'Enjoy unlimited real-time in-ear/face-to-face translation to scale your global business.',
    activeTier: 'Active',
    freeTitle: 'Free (Basic Trial)',
    freePrice: '$0',
    freePeriod: '/ Free Forever',
    freeBullet1: 'Real-time multilingual translation trial',
    freeBullet2: 'Earbud sharing & face-to-face mode support',
    freeBullet3: 'Limit of 3 turns per session',
    proTitle: 'Pro (Unlimited Pro)',
    proPrice: '19,000 KRW',
    proPeriod: '/ Month',
    proBullet1: 'Unlimited real-time two-way translation',
    proBullet2: 'Priority connection to ultra-low latency Gemini Live API',
    proBullet3: 'Enhanced readability for split-screen face-to-face mode',
    proBullet4: 'Flawless translation for 70+ languages including Chinese/Vietnamese/Spanish',
    proBtnStart: 'Start Pro Subscription',
    proBtnActive: 'Current Active Plan',
    enterpriseTitle: 'Enterprise (Business)',
    enterprisePrice: 'Contact Sales',
    enterpriseBtn: 'Contact Sales Team',
    enterpriseAlert: 'Sales Team: Please contact sales@whisperlive.com',
  }
};

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onSelectPro,
  currentTier,
  uiLang = 'ko',
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[uiLang];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div 
        className="modal-content pricing-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          borderRadius: '28px', // Make it a full rounded card on desktop
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: 'var(--color-secondary)' }} />
            <h2 className="modal-title">{t.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '24px' }}>
          {t.subtitle}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* FREE PLAN CARD */}
          <div className={`pricing-card ${currentTier === 'free' ? 'active-tier' : ''}`}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '16px',
              position: 'relative'
            }}
          >
            {currentTier === 'free' && (
              <span className="user-badge" style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                {t.activeTier}
              </span>
            )}
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>{t.freeTitle}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0 12px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-main)' }}>{t.freePrice}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t.freePeriod}</span>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: 'var(--color-primary)' }} />
                <span>{t.freeBullet1}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: 'var(--color-primary)' }} />
                <span>{t.freeBullet2}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-secondary)' }}>
                <Check size={14} />
                <span><strong>{t.freeBullet3}</strong></span>
              </li>
            </ul>
          </div>

          {/* PRO PLAN CARD (RECOMMENDED) */}
          <div className={`pricing-card pro-featured ${currentTier === 'pro' ? 'active-tier' : ''}`}
            style={{
              background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.15) 0%, rgba(244, 114, 182, 0.05) 100%)',
              border: '2px solid #818cf8',
              borderRadius: '18px',
              padding: '20px 16px 16px',
              position: 'relative',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.2)'
            }}
          >
            <span className="user-badge" style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--gradient-glow)', color: 'white', border: 'none', padding: '2px 10px', fontSize: '10px' }}>
              POPULAR
            </span>
            {currentTier === 'pro' && (
              <span className="user-badge" style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px', background: 'rgba(52, 211, 153, 0.15)', color: 'var(--color-success)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                {t.activeTier}
              </span>
            )}
            
            <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>{t.proTitle}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0 12px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>{t.proPrice}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t.proPeriod}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: 'var(--color-success)' }} />
                <span>{t.proBullet1}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: 'var(--color-success)' }} />
                <span>{t.proBullet2}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: 'var(--color-success)' }} />
                <span>{t.proBullet3}</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} style={{ color: 'var(--color-success)' }} />
                <span>{t.proBullet4}</span>
              </li>
            </ul>

            {currentTier === 'free' ? (
              <button 
                onClick={onSelectPro}
                className="save-button" 
                style={{ 
                  background: 'var(--gradient-glow)', 
                  fontWeight: 800,
                  fontSize: '14px',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                  border: 'none'
                }}
              >
                {t.proBtnStart}
              </button>
            ) : (
              <button 
                disabled 
                className="save-button" 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--border-color)',
                  cursor: 'default'
                }}
              >
                {t.proBtnActive}
              </button>
            )}
          </div>

          {/* ENTERPRISE CARD */}
          <div className="pricing-card"
            style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '16px'
            }}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700 }}>{t.enterpriseTitle}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0 12px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-main)' }}>{t.enterprisePrice}</span>
            </div>

            <button 
              onClick={() => alert(t.enterpriseAlert)}
              className="save-button"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                padding: '10px'
              }}
            >
              {t.enterpriseBtn}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
