import React from 'react';
import { ModalType } from '@/types';
import { WHATSAPP_NUMBER } from '@/lib/data';

interface InfoModalProps {
  type: ModalType;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const content = {
    sobre: {
      title: 'Sobre a ChromeWear',
      body: (
        <>
          <p>Chrome Wear é a base para a identidade visual: uma marca local, criada e desenvolvida no Espírito Santo, na cidade de Linhares.</p>
          <p>Buscamos inovar o mercado e a moda local, trazendo algo "novo" como estilo e identidade visual de cada pessoa que, assim como nós, pensa em cada detalhe na forma de "se vestir".</p>
          <p>Por isso trazemos o Grandpa Style para o cenário local — uma tendência de moda que combina autenticidade, sustentabilidade e um toque de nostalgia.</p>
          <p>É uma estética que valoriza o conforto e a liberdade em detrimento da modernidade ou da opinião alheia.</p>
        </>
      ),
    },
    contato: {
      title: 'Contato',
      body: (
        <>
          <p>Atendimento direto via WhatsApp, de segunda a sábado, das 9h às 19h.</p>
          <p>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="underline text-primary">
              Falar no WhatsApp
            </a>
          </p>
          <p>E-mail: chrmewear@gmail.com</p>
          <p>
            <a href="https://www.instagram.com/chrome.wr/" target="_blank" rel="noreferrer" className="underline text-primary">
              Instagram @chrome.wr
            </a>
          </p>
        </>
      ),
    },
  };

  const data = content[type];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-[calc(100%-2rem)] max-w-[420px] bg-white p-6 max-h-[80vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="font-display text-sm uppercase tracking-widest font-bold">
            {data.title}
          </span>
          <button onClick={onClose} className="text-xl leading-none">
            &times;
          </button>
        </div>
        <div className="text-sm text-text-secondary leading-relaxed space-y-2">
          {data.body}
        </div>
      </div>
    </div>
  );
};
