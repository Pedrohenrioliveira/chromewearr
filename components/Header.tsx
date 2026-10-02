'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Category, ModalType, User } from '@/types';

interface HeaderProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  onOpenModal: (type: ModalType) => void;
  onOpenAccountModal: () => void;
  onOpenCart: () => void;
  onToggleSearch: () => void;
  cartCount: number;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  onOpenModal,
  onOpenAccountModal,
  onOpenCart,
  onToggleSearch,
  cartCount,
  user,
}) => {
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-pure border-b border-border-hairline">
      <div className="h-16 w-full px-4 md:px-8 lg:px-12 flex items-center justify-between relative">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => {
              onSelectCategory(null);
              setShopMenuOpen(false);
            }}
            className="text-xs uppercase tracking-wide font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            Loja
          </button>

          <div className="relative">
            <button
              onClick={() => setShopMenuOpen((prev) => !prev)}
              className="text-xs uppercase tracking-wide text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              Shop All
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Shop All Dropdown */}
            {shopMenuOpen && (
              <div className="absolute top-full left-0 mt-2 bg-surface-pure border border-border-hairline shadow-lg z-50 min-w-[180px] py-1">
                <button
                  onClick={() => {
                    onSelectCategory(null);
                    setShopMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
                    activeCategory === null
                      ? 'text-primary font-bold bg-surface-off'
                      : 'text-text-secondary hover:text-primary hover:bg-surface-off'
                  }`}
                >
                  Todos os Produtos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.slug);
                      setShopMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
                      activeCategory === cat.slug
                        ? 'text-primary font-bold bg-surface-off'
                        : 'text-text-secondary hover:text-primary hover:bg-surface-off'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenModal('sobre')}
            className="text-xs uppercase tracking-wide text-text-secondary hover:text-primary transition-colors"
          >
            Sobre
          </button>
          <button
            onClick={() => onOpenModal('contato')}
            className="text-xs uppercase tracking-wide text-text-secondary hover:text-primary transition-colors"
          >
            Contato
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden text-primary"
          aria-label="Menu"
          onClick={() => setMobileNavOpen((prev) => !prev)}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Centered Logo */}
        <button
          onClick={() => {
            onSelectCategory(null);
          }}
          className="absolute left-1/2 -translate-x-1/2 flex items-center h-14"
        >
          <Image
            src="/images/logo.webp"
            alt="ChromeWear"
            width={180}
            height={56}
            className="h-8 md:h-14 w-auto object-contain"
            priority
          />
        </button>

        {/* Right Header Icons */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            aria-label="Buscar"
            onClick={onToggleSearch}
            className="text-primary hover:opacity-75 transition-opacity"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Cart Icon */}
          <button
            aria-label="Sacola"
            onClick={onOpenCart}
            className="relative text-primary hover:opacity-75 transition-opacity"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="M6 8h12l-1 12H7L6 8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary text-on-primary text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* Account Icon */}
          <button
            aria-label="Conta"
            onClick={onOpenAccountModal}
            className="relative text-primary hover:opacity-75 transition-opacity"
          >
            {user ? (
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[11px] font-semibold flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <circle cx="12" cy="8" r="3.2" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-border-hairline bg-surface-pure px-4 py-3 flex flex-col gap-3">
          <button
            onClick={() => {
              onSelectCategory(null);
              setMobileNavOpen(false);
            }}
            className="text-xs uppercase tracking-wide text-left text-primary font-semibold"
          >
            Loja
          </button>
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-left text-text-secondary font-semibold">
              Categorias:
            </span>
            <button
              onClick={() => {
                onSelectCategory(null);
                setMobileNavOpen(false);
              }}
              className={`text-xs uppercase tracking-wide text-left pl-3 ${
                activeCategory === null
                  ? 'text-primary font-bold'
                  : 'text-text-secondary'
              }`}
            >
              • Todos os Produtos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.slug);
                  setMobileNavOpen(false);
                }}
                className={`text-xs uppercase tracking-wide text-left pl-3 ${
                  activeCategory === cat.slug
                    ? 'text-primary font-bold'
                    : 'text-text-secondary'
                }`}
              >
                • {cat.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              onOpenModal('sobre');
              setMobileNavOpen(false);
            }}
            className="text-xs uppercase tracking-wide text-left text-text-secondary"
          >
            Sobre
          </button>
          <button
            onClick={() => {
              onOpenModal('contato');
              setMobileNavOpen(false);
            }}
            className="text-xs uppercase tracking-wide text-left text-text-secondary"
          >
            Contato
          </button>
        </div>
      )}
    </header>
  );
};
