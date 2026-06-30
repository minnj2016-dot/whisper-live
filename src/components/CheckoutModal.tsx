import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, CheckCircle2, Loader2 } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  uiLang?: 'ko' | 'en';
}

const TRANSLATIONS = {
  ko: {
    title: '신용카드 결제',
    productLabel: '구매 상품',
    priceLabel: '결제 금액',
    productName: 'WhisperLive Pro (월정액)',
    priceVal: '19,000 원',
    cardSelectLabel: '카드사 선택',
    cardNumberLabel: '카드 번호',
    expiryLabel: '유효 기간',
    cvcLabel: 'CVC (뒷면 3자리)',
    passwordLabel: '비밀번호 앞 2자리',
    securityBanner: '보안 결제 표준(SSL) 암호화 연결 적용 중',
    payBtn: '19,000원 결제 승인 요청',
    processingTitle: '결제 승인 진행 중',
    processingDesc: '가상 카드사의 결제 모듈 승인을 기다리고 있습니다...',
    successTitle: '결제 승인 완료!',
    successDesc: '정상적으로 Pro 정구독이 체결되었습니다.',
    successGlow: '이제 실시간 Live 통역을 무제한으로 사용하세요!',
    finishBtn: '무제한 통역 시작하기',
    cards: {
      samsung: '삼성카드',
      hyundai: '현대카드',
      shinhan: '신한카드',
      kookmin: 'KB국민카드',
      lotte: '롯데카드',
      bc: 'BC카드'
    }
  },
  en: {
    title: 'Credit Card Payment',
    productLabel: 'Product',
    priceLabel: 'Total Price',
    productName: 'WhisperLive Pro (Monthly)',
    priceVal: '19,000 KRW',
    cardSelectLabel: 'Select Card Issuer',
    cardNumberLabel: 'Card Number',
    expiryLabel: 'Expiry Date',
    cvcLabel: 'CVC (3 digits on back)',
    passwordLabel: 'First 2 Digits of Password',
    securityBanner: 'SSL secured encrypted connection active',
    payBtn: 'Pay 19,000 KRW',
    processingTitle: 'Processing Payment',
    processingDesc: 'Waiting for card issuer module approval...',
    successTitle: 'Payment Approved!',
    successDesc: 'Your Pro monthly subscription has been set up successfully.',
    successGlow: 'Now enjoy unlimited real-time Live translation!',
    finishBtn: 'Start Unlimited Translation',
    cards: {
      samsung: 'Samsung Card',
      hyundai: 'Hyundai Card',
      shinhan: 'Shinhan Card',
      kookmin: 'KB Kookmin Card',
      lotte: 'Lotte Card',
      bc: 'BC Card'
    }
  }
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  uiLang = 'ko',
}) => {
  const [cardCompany, setCardCompany] = useState('samsung');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [password, setPassword] = useState('');
  
  const [paymentState, setPaymentState] = useState<'form' | 'processing' | 'success'>('form');

  useEffect(() => {
    if (isOpen) {
      setPaymentState('form');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format card number as 1234-5678-1234-5678
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join('-'));
    } else {
      setCardNumber(val);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format expiry as MM/YY
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      setExpiry(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
    } else {
      setExpiry(val);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvc(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 2);
    setPassword(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentState('processing');

    // Simulate PG payment authorization (2 seconds)
    setTimeout(() => {
      setPaymentState('success');
    }, 2000);
  };

  const handleFinish = () => {
    onPaymentSuccess();
    onClose();
  };

  const t = TRANSLATIONS[uiLang] || TRANSLATIONS.ko;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '380px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: '24px 20px 32px'
        }}
      >
        {paymentState !== 'success' && (
          <div className="modal-header" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: 'var(--color-primary)' }} />
              <h2 className="modal-title" style={{ fontSize: '18px' }}>{t.title}</h2>
            </div>
            <button className="icon-button" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}

        {paymentState === 'form' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Purchase Item Info Banner */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                <span>{t.productLabel}</span>
                <span>{t.priceLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                <span>{t.productName}</span>
                <span className="color-primary" style={{ color: '#818cf8' }}>{t.priceVal}</span>
              </div>
            </div>

            {/* Card Issuer Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="card-issuer-select">{t.cardSelectLabel}</label>
              <select
                id="card-issuer-select"
                className="lang-selector"
                value={cardCompany}
                onChange={(e) => setCardCompany(e.target.value)}
                style={{ width: '100%', paddingRight: '40px' }}
              >
                <option value="samsung">{t.cards.samsung}</option>
                <option value="hyundai">{t.cards.hyundai}</option>
                <option value="shinhan">{t.cards.shinhan}</option>
                <option value="kookmin">{t.cards.kookmin}</option>
                <option value="lotte">{t.cards.lotte}</option>
                <option value="bc">{t.cards.bc}</option>
              </select>
            </div>

            {/* Card Number Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="card-number-input">{t.cardNumberLabel}</label>
              <input
                id="card-number-input"
                type="text"
                className="form-input"
                placeholder="1234-5678-1234-5678"
                value={cardNumber}
                onChange={handleCardNumberChange}
                required
              />
            </div>

            {/* Expiry / CVC Row */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="expiry-input">{t.expiryLabel}</label>
                <input
                  id="expiry-input"
                  type="text"
                  className="form-input"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiryChange}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="cvc-input">{t.cvcLabel}</label>
                <input
                  id="cvc-input"
                  type="password"
                  className="form-input"
                  placeholder="123"
                  value={cvc}
                  onChange={handleCvcChange}
                  maxLength={3}
                  required
                />
              </div>
            </div>

            {/* Password Row */}
            <div className="form-group">
              <label className="form-label" htmlFor="password-input">{t.passwordLabel}</label>
              <input
                id="password-input"
                type="password"
                className="form-input"
                style={{ width: '80px', letterSpacing: '4px', textAlign: 'center' }}
                placeholder="●●"
                value={password}
                onChange={handlePasswordChange}
                maxLength={2}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)', justifyContent: 'center' }}>
              <Lock size={12} />
              <span>{t.securityBanner}</span>
            </div>

            {/* Pay Button */}
            <button type="submit" className="save-button" style={{ background: 'var(--gradient-glow)', border: 'none', fontWeight: 800 }}>
              {t.payBtn}
            </button>
          </form>
        )}

        {paymentState === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '20px' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: '#818cf8', animation: 'spin 1.5s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700 }}>{t.processingTitle}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>{t.processingDesc}</p>
            </div>
          </div>
        )}

        {paymentState === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0 10px', gap: '24px', textAlign: 'center' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--color-success)', filter: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.4))' }} />
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: 'white' }}>{t.successTitle}</h3>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>{t.successDesc}</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>{t.successGlow}</p>
            </div>
            
            <button 
              onClick={handleFinish} 
              className="save-button" 
              style={{ background: 'var(--gradient-glow)', border: 'none', width: '100%', marginTop: '10px' }}
            >
              {t.finishBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
