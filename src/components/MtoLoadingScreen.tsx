import React from 'react';

interface MtoLoadingScreenProps {
  message?: string;
  submessage?: string;
}

export default function MtoLoadingScreen({
  message = 'Cargando módulo...',
  submessage
}: MtoLoadingScreenProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#080d1a] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main loading card / centered box */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center px-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Modern glowing dual-ring spinner */}
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-slate-800 border-t-cyan-400 border-r-blue-500 animate-spin shadow-lg shadow-cyan-500/20" />
          
          {/* Inner subtle pulse ring */}
          <div className="absolute w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-cyan-400/30 border-b-cyan-300 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
          
          {/* Center core glow */}
          <div className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse" />
        </div>

        {/* Text descriptions */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <p className="text-slate-200 font-semibold tracking-wide text-sm sm:text-base animate-pulse">
            {message}
          </p>
          {submessage && (
            <p className="text-slate-400 text-xs font-normal max-w-sm">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
