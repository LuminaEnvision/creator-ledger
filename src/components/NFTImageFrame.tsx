import React from 'react';

type NFTImageFrameProps = {
  children: React.ReactNode;
  isPro?: boolean;
  noMargin?: boolean;
};

export const NFTImageFrame: React.FC<NFTImageFrameProps> = ({ children, isPro = false, noMargin = false }) => {
  return (
    <div className={`${noMargin ? '' : 'mb-8'} w-full h-[280px] rounded-2xl overflow-hidden shadow-2xl bg-secondary/20 flex items-center justify-center relative`}>
      {/* INNER VISUAL FRAME */}
      <div className="w-[90%] h-[90%] rounded-xl overflow-hidden bg-black/80 flex items-center justify-center">
        {children}
      </div>
      {/* Premium ring for Pro tier */}
      {isPro && (
        <div className="absolute inset-0 ring-1 ring-primary/40 rounded-2xl pointer-events-none" />
      )}
    </div>
  );
};

