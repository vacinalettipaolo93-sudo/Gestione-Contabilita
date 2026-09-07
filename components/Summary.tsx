import React from 'react';
import { BanknotesIcon, DocumentTextIcon, DocumentMinusIcon, ClipboardListIcon } from './icons';

interface SummaryProps {
  totalLessons: number;
  lessonsBySport: Record<string, number>;
  lessonsByLessonType: Record<string, number>;
  lessonsByLocation: Record<string, number>;
  totalInvoicedGross: number;
  totalInvoicedNet: number;
  totalNotInvoicedIncome: number;
  taxRate: number;

  totalExpenses: number;
  netProfit: number;
  paitoneRevenue: number | null;
  paitoneDeductibleCosts: number;
  paitoneTaxableRevenue: number;
  paitoneCompensation: number;
  paitoneNetCompensation: number;
  totalInvoiceWithPaitone: number;
}

const SummaryCard: React.FC<{ title: string; value: string; subValue?: string; icon: React.ReactNode; colorClass: string }> = ({ title, value, subValue, icon, colorClass }) => (
  <div className="bg-zinc-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300 shadow-none group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</p>
        {subValue && <p className="text-xs text-zinc-500 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
    </div>
  </div>
);

const BreakdownCard: React.FC<{ title: string; data: Record<string, number> }> = ({ title, data }) => (
  <div className="bg-zinc-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-none h-full">
    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 border-b border-white/5 pb-2">{title}</h3>
    <div className="flex flex-wrap gap-3">
      {Object.keys(data).length > 0 ? (
        Object.entries(data).map(([name, count]) => (
          <div className="flex items-center gap-3 bg-black/20 px-3 py-2 rounded-lg border border-white/5 flex-grow" key={name}>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {count}
            </div>
            <p className="text-sm font-medium text-zinc-300 truncate max-w-[120px]" title={name}>
              {name}
            </p>
          </div>
        ))
      ) : (
        <p className="text-sm text-zinc-400 italic">Nessun dato.</p>
      )}
    </div>
  </div>
);

const formatEuro = (amount: number) => `€ ${amount.toFixed(2)}`;

const Summary: React.FC<SummaryProps> = ({
  totalLessons,
  lessonsBySport,
  lessonsByLessonType,
  lessonsByLocation,
  totalInvoicedGross,
  totalInvoicedNet,
  totalNotInvoicedIncome,
  taxRate,
  totalExpenses,
  netProfit,
  paitoneRevenue,
  paitoneDeductibleCosts,
  paitoneTaxableRevenue,
  paitoneCompensation,
  paitoneNetCompensation,
  totalInvoiceWithPaitone,
}) => {
  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Lezioni Totali"
          value={totalLessons.toString()}
          icon={<ClipboardListIcon className="w-6 h-6" />}
          colorClass="bg-blue-500/10 text-blue-400"
        />
        <SummaryCard
          title="Fatturato Lordo"
          value={`€ ${totalInvoicedGross.toFixed(2)}`}
          subValue="Include il compenso centro sportivo calcolato"
          icon={<DocumentTextIcon className="w-6 h-6" />}
          colorClass="bg-indigo-500/10 text-indigo-400"
        />
        <SummaryCard
          title="Fatturato Netto"
          value={`€ ${totalInvoicedNet.toFixed(2)}`}
          subValue={`Tasse: ${taxRate}%`}
          icon={<BanknotesIcon className="w-6 h-6" />}
          colorClass="bg-emerald-500/10 text-emerald-400"
        />
        <SummaryCard
          title="Utile non Fatt."
          value={`€ ${totalNotInvoicedIncome.toFixed(2)}`}
          icon={<DocumentMinusIcon className="w-6 h-6" />}
          colorClass="bg-orange-500/10 text-orange-400"
        />
      </div>

      {/* Spese + Netto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          title="Spese Mese"
          value={`€ ${totalExpenses.toFixed(2)}`}
          icon={<span className="font-bold">€</span>}
          colorClass="bg-red-500/10 text-red-400"
        />
        <SummaryCard
          title="Netto (Lezioni - Spese)"
          value={`€ ${netProfit.toFixed(2)}`}
          icon={<span className="font-bold">∑</span>}
          colorClass="bg-cyan-500/10 text-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BreakdownCard title="Per Sport" data={lessonsBySport} />
        <BreakdownCard title="Per Tipo" data={lessonsByLessonType} />
        <BreakdownCard title="Per Sede" data={lessonsByLocation} />
      </div>

      <div className="bg-zinc-900/60 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-none">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Fatturato centro sportivo</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-black/20 border border-white/5 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Fatturato inserito</p>
            <p className="text-zinc-100 font-semibold">{formatEuro(paitoneRevenue ?? 0)}</p>
          </div>
          <div className="bg-black/20 border border-white/5 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Detrazioni (affitto + collaboratore)</p>
            <p className="text-zinc-100 font-semibold">- {formatEuro(paitoneDeductibleCosts)}</p>
          </div>
          <div className="bg-black/20 border border-white/5 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Base netta per scaglioni</p>
            <p className="text-zinc-100 font-semibold">{formatEuro(paitoneTaxableRevenue)}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3">
            <p className="text-xs text-emerald-300 mb-1">Totale lordo calcolato da aggiungere alla fattura</p>
            <p className="text-emerald-200 font-bold">+ {formatEuro(paitoneCompensation)}</p>
          </div>
        </div>

        <p className="text-sm text-zinc-300 mt-4">
          Quota netta centro sportivo dopo partita IVA ({taxRate}%):{' '}
          <span className="font-bold text-zinc-100">{formatEuro(paitoneNetCompensation)}</span>
        </p>

        <p className="text-sm text-zinc-300 mt-4">
          Totale fattura (netto fatturato incl. quota Paitone + utile non fatturato):{' '}
          <span className="font-bold text-zinc-100">{formatEuro(totalInvoiceWithPaitone)}</span>
        </p>
      </div>
    </div>
  );
};

export default Summary;
