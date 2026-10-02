'use client';

import React from 'react';

interface SearchBarProps {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  value,
  onChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="border-t border-border-hairline bg-surface-off px-4 md:px-12 py-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar produtos..."
        className="w-full h-10 px-3 bg-surface-pure border border-border-hairline text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
        autoFocus
      />
    </div>
  );
};
