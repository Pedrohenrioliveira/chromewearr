'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar código');
      
      setSuccess('Se o email estiver cadastrado, um código foi enviado.');
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('As senhas não coincidem');
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Código inválido ou expirado');
      
      setSuccess('Senha redefinida com sucesso! Você já pode fazer login.');
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-off flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface-pure p-8 rounded-lg shadow-md border border-border-hairline">
        <div>
          <h2 className="mt-2 text-center text-3xl font-display font-extrabold text-text-primary uppercase tracking-widest">
            {step === 1 ? 'Recuperar Senha' : step === 2 ? 'Digite o Código' : 'Sucesso!'}
          </h2>
          <p className="mt-4 text-center text-sm text-text-secondary">
            {step === 1 && 'Digite seu email para receber um código de 6 dígitos.'}
            {step === 2 && 'Enviamos um código para o seu email. Ele expira em 15 minutos.'}
            {step === 3 && 'Sua senha foi atualizada. Você já pode voltar para a loja.'}
          </p>
        </div>

        {error && (
          <div className="bg-status-soldout/10 border border-status-soldout text-status-soldout px-4 py-3 rounded text-sm text-center">
            {error}
          </div>
        )}
        
        {success && step !== 3 && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm text-center">
            {success}
          </div>
        )}

        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleRequestCode}>
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-border-hairline placeholder-text-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-surface-off transition-colors"
                placeholder="Endereço de email"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold uppercase tracking-wider text-on-primary bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Enviando...' : 'Enviar Código'}
            </button>
            <div className="text-center mt-4">
               <Link href="/" className="text-xs text-text-secondary hover:text-primary transition-colors underline">Voltar para a página inicial</Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="sr-only">Código de 6 dígitos</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-border-hairline placeholder-text-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-surface-off transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                />
              </div>
              
              <div className="relative">
                <label htmlFor="new-password" className="sr-only">Nova Senha</label>
                <input
                  id="new-password"
                  name="newPassword"
                  type={showNewPass ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-border-hairline placeholder-text-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-surface-off transition-colors"
                  placeholder="Nova Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
                >
                  {showNewPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>

              <div className="relative">
                <label htmlFor="confirm-password" className="sr-only">Confirmar Nova Senha</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPass ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-border-hairline placeholder-text-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-surface-off transition-colors"
                  placeholder="Confirmar Nova Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
                >
                  {showConfirmPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold uppercase tracking-wider text-on-primary bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
            <div className="text-center mt-4">
               <button type="button" onClick={() => setStep(1)} className="text-xs text-text-secondary hover:text-primary transition-colors underline">Não recebeu o código? Tentar novamente</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex justify-center py-3 px-8 border border-transparent text-sm font-semibold uppercase tracking-wider text-on-primary bg-primary hover:bg-secondary transition-colors"
            >
              Voltar para a Loja
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
