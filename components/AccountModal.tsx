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
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  if (!isOpen) return null;

  const getUsers = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('cw_users') || '[]');
    } catch (e) {
      return [];
    }
  };

  const saveUsers = (list: any[]) => {
    localStorage.setItem('cw_users', JSON.stringify(list));
  };

  const handleLogin = () => {
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Preencha e-mail e senha.');
      return;
    }

    const email = loginEmail.trim().toLowerCase();
    const users = getUsers();
    const found = users.find((u) => u.email === email && u.password === loginPassword);

    if (!found) {
      setLoginError('E-mail ou senha incorretos.');
      return;
    }

    onLoginSuccess({ id: found.email, name: found.name, email: found.email });
    onClose();
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleRegister = () => {
    setRegError('');
    if (!regName || !regEmail || !regPassword) {
      setRegError('Preencha nome, e-mail e senha.');
      return;
    }

    const email = regEmail.trim().toLowerCase();
    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      setRegError('Este e-mail já está em uso.');
      return;
    }

    users.push({ name: regName, email, password: regPassword });
    saveUsers(users);

    onLoginSuccess({ id: email, name: regName, email });
    onClose();
    setRegName('');
    setRegEmail('');
    setRegPassword('');
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

            {tab === 'login' && (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="E-mail"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                />
                {loginError && (
                  <p className="text-[11px] text-[#ba1a1a] font-medium hidden">
                    {/* Wait, the HTML uses a hidden toggle. But React conditional is better. */}
                  </p>
                )}
                {loginError && <p className="text-[11px] text-[#ba1a1a] font-medium">{loginError}</p>}
                <button
                  onClick={handleLogin}
                  className="w-full h-11 bg-secondary hover:bg-primary text-on-primary text-xs md:text-sm uppercase tracking-wider font-semibold transition-colors"
                >
                  Entrar
                </button>
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
                  type="password"
                  placeholder="Senha"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-off border border-border-hairline text-sm focus:outline-none focus:border-primary text-text-primary"
                />
                {regError && <p className="text-[11px] text-[#ba1a1a] font-medium">{regError}</p>}
                <button
                  onClick={handleRegister}
                  className="w-full h-11 bg-secondary hover:bg-primary text-on-primary text-xs md:text-sm uppercase tracking-wider font-semibold transition-colors"
                >
                  Criar Conta
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
