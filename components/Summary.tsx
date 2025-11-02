import React from 'react';
import { Settings } from '../types';
import { BanknotesIcon, DocumentTextIcon, DocumentMinusIcon, CheckCircleIcon, ClockIcon, ClipboardListIcon } from './icons';

interface SummaryProps {
  totalLessons: number;
  totalIncome: number;
  lessonsBySport: Record<string, number>;
  lessonsByLessonType: Record<string, number>;
  lessonsByLocation: Record<string, number>;
  totalInvoicedIncome: number;
  totalNotInvoicedIncome: number;
}

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; iconBgColor: string }> = ({ title, value, icon, iconBgColor }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 flex items-center gap-4">
    <div className={`rounded-full p-3 ${iconBgColor}`}>
        {icon}
    </div>
    <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

const BreakdownCard: React.FC<{ title: string; data: Record<string, number> }> = ({ title, data }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
        <h3 className="text-md font-semibold mb-3 text-slate-700 dark:text-slate-300">{title}</h3>
        <div className="flex justify-around flex-wrap gap-4">
            {Object.keys(data).length > 0 ? (
                Object.entries(data).map(([name, count]) => (
                    <div className="text-center flex-1 min-w-[140px]" key={name}>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate" title={name}>{name}</p>
                        <p className="text-2xl font-bold text-cyan-500">{count}</p>
                    </div>
                ))
            ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">Nessun dato per questo mese.</p>
            )}
        </div>
    </div>
);


const Summary: React.FC<SummaryProps> = ({ totalLessons, totalIncome, lessonsBySport, lessonsByLessonType, lessonsByLocation, totalInvoicedIncome, totalNotInvoicedIncome }) => {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="Lezioni Totali" value={totalLessons.toString()} icon={<ClipboardListIcon className="w-6 h-6 text-blue-800 dark:text-blue-200"/>} iconBgColor="bg-blue-100 dark:bg-blue-900/50" />
        <SummaryCard title="Utile Totale" value={`€ ${totalIncome.toFixed(2)}`} icon={<BanknotesIcon className="w-6 h-6 text-green-800 dark:text-green-200"/>} iconBgColor="bg-green-100 dark:bg-green-900/50" />
        <SummaryCard title="Utile Fatturato" value={`€ ${totalInvoicedIncome.toFixed(2)}`} icon={<DocumentTextIcon className="w-6 h-6 text-sky-800 dark:text-sky-200"/>} iconBgColor="bg-sky-100 dark:bg-sky-900/50" />
        <SummaryCard title="Utile non Fatt." value={`€ ${totalNotInvoicedIncome.toFixed(2)}`} icon={<DocumentMinusIcon className="w-6 h-6 text-orange-800 dark:text-orange-200"/>} iconBgColor="bg-orange-100 dark:bg-orange-900/50" />
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <BreakdownCard title="Lezioni per Sport" data={lessonsBySport} />
           <BreakdownCard title="Lezioni per Tipo" data={lessonsByLessonType} />
           <BreakdownCard title="Lezioni per Sede" data={lessonsByLocation} />
       </div>
    </div>
  );
};

export default Summary;