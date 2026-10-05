import React from 'react';
import Image from 'next/image';

interface HeroMainProps {
  onCollectionClick: (collectionName: string) => void;
  banner?: any;
}

export const HeroMain: React.FC<HeroMainProps> = ({ onCollectionClick, banner }) => {
  const imageUrl = banner?.imageUrl || '/images/hero-main.png';
  const title = banner?.title || 'SANCTUM';
  const quote = banner?.quote || "Disseram no seu coração: 'Destruamos tudo!'\n e incendiaram neste país todos os lugares de culto";
  const buttonText = banner?.buttonText || title;
  const buttonLink = banner?.buttonLink || 'Sanctum';

  if (banner && banner.isActive === false) {
    return null; // Hide if inactive
  }

  return (
    <section className="relative w-full bg-primary flex items-end overflow-hidden aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[85vh]">
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover object-center"
        priority
        quality={100}
        unoptimized
      />
      
      <div className="absolute bottom-6 left-4 sm:bottom-10 sm:left-10 z-10 flex flex-col items-start">
        <button 
          onClick={() => {
            if (buttonLink.startsWith('http') || buttonLink.startsWith('/')) {
              window.location.href = buttonLink;
            } else {
              onCollectionClick(buttonLink);
            }
          }}
          className="text-white font-display text-2xl sm:text-4xl md:text-5xl font-bold uppercase tracking-[0.15em] hover:text-white/80 transition-colors drop-shadow-lg text-left"
        >
          {buttonText}
        </button>
        {quote && (
          <p className="text-white/90 text-[9px] sm:text-[11px] md:text-xs uppercase tracking-[0.15em] drop-shadow-md mt-2 max-w-lg leading-relaxed border-l-2 border-white/40 pl-3 py-1 whitespace-pre-wrap">
            {quote}
          </p>
        )}
      </div>
    </section>
  );
};

interface HeroCollectionProps {
  onCollectionClick: (collectionName: string) => void;
}

export const HeroCollection: React.FC<HeroCollectionProps> = ({ onCollectionClick }) => {
  return (
    <section className="relative w-full bg-primary overflow-hidden">
      <div className="relative w-full min-h-[50vh] sm:aspect-[16/9] lg:aspect-[21/9] flex items-center justify-center py-12">
        <Image
          src="/images/hero-sanctum.webp"
          alt="Coleção Sanctum"
          fill
          className="object-cover"
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"></div>
        <div className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4 gap-3">
          <span className="font-display text-white/60 text-[10px] sm:text-[11px] uppercase tracking-[0.3em]">COLEÇÃO</span>
          <h2 className="font-display text-white text-3xl sm:text-5xl lg:text-6xl tracking-[0.15em] font-bold">SANCTUM</h2>
          <div className="max-w-md space-y-2 sm:space-y-3 text-white/80 text-[11px] sm:text-base leading-relaxed">
            <p>Alguns seguem tendências.<br/>Outros se escondem delas para criar as suas.</p>
            <p>SANCTUM é o ponto onde o mundo lá fora para de fazer<br/>barulho.</p>
            <p className="text-white uppercase tracking-widest text-[10px] sm:text-sm">EXCLUSIVO. INTOCÁVEL. SÓ PARA QUEM ENTENDE.</p>
            <p className="italic text-white/60">Não é para todos. Nunca foi.</p>
          </div>
          <button 
            onClick={() => onCollectionClick('Sanctum')} 
            className="mt-3 sm:mt-4 border border-white/50 text-white text-[10px] sm:text-xs uppercase tracking-widest px-6 py-3 hover:bg-white hover:text-primary transition-colors"
          >
            VER COLEÇÃO COMPLETA
          </button>
        </div>
      </div>
    </section>
  );
};
