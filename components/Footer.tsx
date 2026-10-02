import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border-hairline px-4 md:px-12 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-text-secondary text-xs">
      <span className="font-display uppercase tracking-widest font-semibold text-primary">ChromeWear</span>
      <a href="https://www.instagram.com/chrome.wr/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex items-center gap-2 hover:text-primary transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="3" width="18" height="18" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1"/>
        </svg>
        <span>@chrome.wr</span>
      </a>
      <span>© 2026 ChromeWear. Todos os direitos reservados.</span>
    </footer>
  );
};
