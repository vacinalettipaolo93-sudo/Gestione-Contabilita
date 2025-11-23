import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, GearIcon, DocumentArrowDownIcon } from './icons';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  user: any;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentDate, onPrevMonth, onNextMonth, onOpenSettings, onOpenExport, user, onSignOut }) => {
  const monthName = currentDate.toLocaleString('it-IT', { month: 'long' });
  const year = currentDate.getFullYear();
  const formattedDate = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

  return (
    <header className="bg-zinc-950/70 backdrop-blur-md p-4 sticky top-0 z-30 border-b border-white/5">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                GC
            </div>
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                Contabilità
            </h1>
            <div className="h-6 w-px bg-zinc-700 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-1">
                <button
                    onClick={onOpenExport}
                    className="text-zinc-400 p-2 rounded-lg hover:bg-white/10 transition-all"
                    aria-label="Esporta PDF"
                >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={onOpenSettings}
                    className="text-zinc-400 p-2 rounded-lg hover:bg-white/10 transition-all"
                    aria-label="Impostazioni"
                >
                    <GearIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 bg-zinc-900/50 p-1 rounded-full border border-white/5 backdrop-blur-sm">
          <button
            onClick={onPrevMonth}
            className="p-1.5 rounded-full hover:bg-zinc-800 shadow-sm transition-all text-zinc-300"
            aria-label="Mese precedente"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold w-32 text-center text-zinc-200 capitalize">{formattedDate}</span>
          <button
            onClick={onNextMonth}
            className="p-1.5 rounded-full hover:bg-zinc-800 shadow-sm transition-all text-zinc-300"
            aria-label="Mese successivo"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-zinc-500 font-medium">Loggato come</span>
                <span className="text-sm font-medium text-zinc-200">{user?.email?.split('@')[0]}</span>
            </div>
            <button
                onClick={onSignOut}
                className="px-4 py-2 text-xs font-semibold tracking-wide text-zinc-300 bg-white/5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
            >
                ESCI
            </button>
        </div>
      </div>
       <div className="lg:hidden flex items-center justify-center gap-4 mt-4 pb-2">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-zinc-300" />
          </button>
          <span className="text-lg font-bold text-zinc-100 capitalize">{formattedDate}</span>
          <button
            onClick={onNextMonth}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-zinc-300" />
          </button>
        </div>
    </header>
  );
};

export default Header;