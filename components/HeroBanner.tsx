import React from 'react';
import Image from 'next/image';

export const HeroMain: React.FC = () => {
  return (
    <section className="relative w-full bg-primary flex items-end overflow-hidden aspect-[2/1] lg:aspect-[21/9] max-h-[75vh]">
      <Image
        src="/images/hero-main.webp"
        alt="ChromeWear"
        fill
        className="object-cover object-[52%_center] lg:object-center"
        priority
      />
    </section>
  );
};

interface HeroCollectionProps {
  onCollectionClick: (collectionName: string) => void;
}

export const HeroCollection: React.FC<HeroCollectionProps> = ({ onCollectionClick }) => {
  return (
    <section className="relative w-full bg-primary overflow-hidden">
      <div className="relative w-full aspect-[3/4] sm:aspect-[16/9] lg:aspect-[21/9]">
        <Image
          src="/images/hero-sanctum.webp"
          alt="Coleção Sanctum"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"></div>
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-6 gap-4">
          <span className="font-display text-white/60 text-[11px] uppercase tracking-[0.3em]">Coleção</span>
          <h2 className="font-display text-white text-4xl sm:text-5xl lg:text-6xl tracking-[0.15em] font-bold">SANCTUM</h2>
          <div className="max-w-md space-y-3 text-white/80 text-sm sm:text-base leading-relaxed">
            <p>Alguns seguem tendências.<br/>Outros se escondem delas para criar as suas.</p>
            <p>SANCTUM é o ponto onde o mundo lá fora para de fazer barulho.</p>
            <p className="text-white uppercase tracking-widest text-xs sm:text-sm">Exclusivo. Intocável. Só para quem entende.</p>
            <p className="italic text-white/60">Não é para todos. Nunca foi.</p>
          </div>
          <button 
            onClick={() => onCollectionClick('Sanctum')} 
            className="mt-4 border border-white/50 text-white text-xs uppercase tracking-widest px-6 py-3 hover:bg-white hover:text-primary transition-colors"
          >
            Ver coleção
          </button>
        </div>
      </div>
    </section>
  );
};
