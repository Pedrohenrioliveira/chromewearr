import React, { useState } from 'react';
import { User } from '@/types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onLoginSuccess,
  onLogout,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'verify'>('login');
  
  // Verify state
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Password visibility
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !user) {
      setTab('login');
      setLoginError('');
      setRegError('');
      setVerifyError('');
      setVerifyCode('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Preencha e-mail e senha.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.requiresVerification) {
          setVerifyEmail(data.email);
          setVerifyError('Sua conta não foi verificada. Verifique seu e-mail e insira o código.');
          setTab('verify');
          return;
        }
        throw new Error(data.error);
      }

      // Save user to localStorage to keep the logged-in state across reloads
      localStorage.setItem('chromewear_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
      onClose();
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegError('');
    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      setRegError('Preencha todos os campos.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: regName, 
          email: regEmail.trim().toLowerCase(), 
          phone: regPhone, 
          password: regPassword 
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.requiresVerification) {
          setVerifyEmail(data.email);
          setTab('verify');
          return;
        }
        throw new Error(data.error);
      }
      
      if (data.requiresVerification) {
        setVerifyEmail(data.email);
        setTab('verify');
        return;
      }

      // Save user to localStorage to keep the logged-in state across reloads
      localStorage.setItem('chromewear_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
      onClose();
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      setRegError(err.message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifyError('');
    if (!verifyCode) {
      setVerifyError('Digite o código de verificação.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code: verifyCode }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Verificado com sucesso, realiza o login automático
      localStorage.setItem('chromewear_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setVerifyError(err.message || 'Código inválido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-[calc(100%-2rem)] max-w-[420px] bg-white p-6 max-h-[80vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="font-display text-sm uppercase tracking-widest font-bold">
            Minha Conta
          </span>
          <button onClick={onClose} className="text-xl leading-none">
            &times;
          </button>
        </div>

        {user ? (
          /* LOGGED VIEW */
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Olá, <span className="text-text-primary font-semibold">{user.name}</span>!
            </p>
            <button
              onClick={onLogout}
              className="w-full h-11 border border-border-hairline text-sm uppercase tracking-wider hover:bg-surface-off transition-colors"
            >
              Sair da conta
            </button>
          </div>
        ) : (
          /* LOGIN / CADASTRO FORM */
          <div>
            {tab !== 'verify' && (
              <div className="flex items-center gap-4 border-b border-border-hairline mb-4">
                <button
                  onClick={() => {
                    setTab('login');
                    setLoginError('');
                  }}
                  className={`text-[11px] uppercase tracking-wide pb-2 -mb-[1px] transition-colors ${
                    tab === 'login'
                      ? 'text-primary border-b-2 border-primary font-bold'
                      : 'text-text-secondary hover:text-primary font-medium'
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => {
                    setTab('register');
                    setRegError('');
                  }}
                  className={`text-[11px] uppercase tracking-wide pb-2 -mb-[1px] transition-colors ${
                    tab === 'register'
                      ? 'text-primary border-b-2 border-primary font-bold'
                      : 'text-text-secondary hover:text-primary font-medium'
                  }`}
                >
                  Criar Conta
                </button>
              </div>
            )}

            {tab === 'login' && (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="E-mail"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                />
                <div className="relative">
                  <input
                    type={showLoginPass ? "text" : "password"}
                    placeholder="Senha"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-11 px-3 pr-10 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
                  >
                    {showLoginPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
                {loginError && (
                  <p className="text-[11px] text-[#ba1a1a] font-medium hidden">
                    {/* Wait, the HTML uses a hidden toggle. But React conditional is better. */}
                  </p>
                )}
                {loginError && <p className="text-[11px] text-[#ba1a1a] font-medium">{loginError}</p>}
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full h-11 bg-secondary hover:bg-primary text-on-primary text-xs md:text-sm uppercase tracking-wider font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
                <div className="text-center mt-3">
                  <a 
                    href="/forgot-password" 
                    onClick={onClose}
                    className="text-xs text-text-secondary hover:text-primary transition-colors underline"
                  >
                    Esqueci minha senha
                  </a>
                </div>
              </div>
            )}

            {tab === 'register' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                />
                <input
                  type="tel"
                  placeholder="Telefone / WhatsApp"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                />
                <div className="relative">
                  <input
                    type={showRegPass ? "text" : "password"}
                    placeholder="Senha"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full h-11 px-3 pr-10 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
                  >
                    {showRegPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showRegConfirmPass ? "text" : "password"}
                    placeholder="Confirmar Senha"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full h-11 px-3 pr-10 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
                  >
                    {showRegConfirmPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
                {regError && <p className="text-[11px] text-[#ba1a1a] font-medium">{regError}</p>}
                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full h-11 bg-secondary hover:bg-primary text-on-primary text-xs md:text-sm uppercase tracking-wider font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Criando Conta...' : 'Criar Conta'}
                </button>
              </div>
            )}

            {tab === 'verify' && (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary text-center mb-4">
                  Enviamos um código de verificação para o e-mail: <br />
                  <strong className="text-text-primary">{verifyEmail}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Código de 6 dígitos"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-11 px-3 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary text-center tracking-[0.5em] font-mono text-lg"
                  maxLength={6}
                />
                {verifyError && <p className="text-[11px] text-[#ba1a1a] font-medium text-center">{verifyError}</p>}
                <button
                  onClick={handleVerify}
                  disabled={isLoading}
                  className="w-full h-11 bg-secondary hover:bg-primary text-on-primary text-xs md:text-sm uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Verificando...' : 'Verificar Conta'}
                </button>
                <button
                  onClick={() => setTab('login')}
                  className="w-full h-11 border border-border-hairline text-xs uppercase hover:bg-surface-off mt-2"
                >
                  Voltar para o Login
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
