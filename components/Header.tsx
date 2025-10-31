import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, GearIcon } from './icons';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenSettings: () => void;
  user: any;
  onSignOut: () => void;
  isDemoMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentDate, onPrevMonth, onNextMonth, onOpenSettings, user, onSignOut, isDemoMode }) => {
  const monthName = currentDate.toLocaleString('it-IT', { month: 'long' });
  const year = currentDate.getFullYear();
  const formattedDate = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

  return (
    <header className="bg-slate-200/80 dark:bg-gray-950/70 backdrop-blur-sm p-4 sticky top-0 z-30 border-b border-slate-300/80 dark:border-slate-700/80">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-sky-600 dark:text-sky-400">
                Gestione Contabilità
            </h1>
            <button
                onClick={onOpenSettings}
                className="text-slate-500 dark:text-slate-400 p-2 rounded-full hover:bg-slate-300/70 dark:hover:bg-slate-800/70 transition-colors"
                aria-label="Impostazioni"
            >
                <GearIcon className="w-5 h-5" />
            </button>
        </div>
        
        <div className="hidden lg:flex items-center gap-2 md:gap-4 absolute left-1/2 -translate-x-1/2">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-full hover:bg-slate-300/70 dark:hover:bg-slate-800/70 transition-colors"
            aria-label="Mese precedente"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold w-32 text-center">{formattedDate}</span>
          <button
            onClick={onNextMonth}
            className="p-2 rounded-full hover:bg-slate-300/70 dark:hover:bg-slate-800/70 transition-colors"
            aria-label="Mese successivo"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:inline">{user?.email}</span>
            {!isDemoMode && (
                <button
                    onClick={onSignOut}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-300/70 dark:bg-slate-800/70 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                    Logout
                </button>
            )}
        </div>
      </div>
       <div className="lg:hidden flex items-center justify-center gap-2 md:gap-4 mt-3">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-full hover:bg-slate-300/70 dark:hover:bg-slate-800/70 transition-colors"
            aria-label="Mese precedente"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold w-32 text-center">{formattedDate}</span>
          <button
            onClick={onNextMonth}
            className="p-2 rounded-full hover:bg-slate-300/70 dark:hover:bg-slate-800/70 transition-colors"
            aria-label="Mese successivo"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
    </header>
  );
};

export default Header;