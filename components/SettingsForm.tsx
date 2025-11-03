import React, { useState, useEffect } from 'react';
import { Settings, SportSetting, Lesson } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface SettingsFormProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  lessons: Lesson[];
  onSave: (settings: Settings) => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ isOpen, onClose, settings, lessons, onSave }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };
  
  const handleUpdateSport = (sportIndex: number, field: string, value: string) => {
    const newSports = [...localSettings.sports];
    (newSports[sportIndex] as any)[field] = value;
    setLocalSettings({ ...localSettings, sports: newSports });
  };
  
  const handleAddSport = () => {
      const newSport: SportSetting = {
          id: crypto.randomUUID(),
          name: 'Nuovo Sport',
          lessonTypes: [],
          locations: [],
          prices: {},
          costs: {},
      };
      setLocalSettings(prev => ({ ...prev, sports: [...prev.sports, newSport] }));
  };

  const handleRemoveSport = (sportIndex: number) => {
      if (lessons.some(l => l.sportId === localSettings.sports[sportIndex].id)) {
          alert('Impossibile eliminare lo sport perché è utilizzato in una o più lezioni.');
          return;
      }
      const newSports = localSettings.sports.filter((_, index) => index !== sportIndex);
      setLocalSettings({ ...localSettings, sports: newSports });
  };
  
  const handleAddItem = (sportIndex: number, itemType: 'lessonTypes' | 'locations') => {
      const newSports = [...localSettings.sports];
      const newId = crypto.randomUUID();
      const newItem = { id: newId, name: 'Nuovo' };
      newSports[sportIndex][itemType].push(newItem as any);
      setLocalSettings({ ...localSettings, sports: newSports });
  };
  
  const handleRemoveItem = (sportIndex: number, itemIndex: number, itemType: 'lessonTypes' | 'locations') => {
      const itemToRemove = localSettings.sports[sportIndex][itemType][itemIndex];
      const isInUse = lessons.some(l => l.sportId === localSettings.sports[sportIndex].id && (l.lessonTypeId === itemToRemove.id || l.locationId === itemToRemove.id));
      if (isInUse) {
          alert(`Impossibile eliminare questo elemento perché è utilizzato in una o più lezioni.`);
          return;
      }
      const newSports = [...localSettings.sports];
      const sport = newSports[sportIndex];

      if (itemType === 'lessonTypes') {
          Object.values(sport.costs || {}).forEach(locationCosts => {
              delete locationCosts[itemToRemove.id];
          });
      } else { // 'locations'
          if (sport.costs) {
              delete sport.costs[itemToRemove.id];
          }
      }

      sport[itemType].splice(itemIndex, 1);
      setLocalSettings({ ...localSettings, sports: newSports });
  };
  
  const handleUpdateItem = (sportIndex: number, itemIndex: number, itemType: 'lessonTypes' | 'locations', field: string, value: string | number) => {
      const newSports = [...localSettings.sports];
      (newSports[sportIndex][itemType][itemIndex] as any)[field] = value;
      setLocalSettings({ ...localSettings, sports: newSports });
  };
  
  const handlePriceChange = (sportIndex: number, lessonTypeId: string, value: number) => {
      const newSports = [...localSettings.sports];
      newSports[sportIndex].prices[lessonTypeId] = value;
      setLocalSettings({ ...localSettings, sports: newSports });
  }

  const handleCostChange = (sportIndex: number, locationId: string, lessonTypeId: string, value: number) => {
    const newSports = [...localSettings.sports];
    const sport = newSports[sportIndex];
    if (!sport.costs) {
        sport.costs = {};
    }
    if (!sport.costs[locationId]) {
        sport.costs[locationId] = {};
    }
    sport.costs[locationId][lessonTypeId] = value;
    setLocalSettings({ ...localSettings, sports: newSports });
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-40 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-4xl my-8 border border-slate-300 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6">Impostazioni</h2>
        
        <div className="space-y-6">
            {localSettings.sports.map((sport, sportIndex) => (
                <div key={sport.id} className="bg-white text-slate-900 p-4 rounded-lg shadow sport-card">
                   <div className="flex justify-between items-center mb-4">
                       <input 
                         type="text"
                         value={sport.name}
                         onChange={(e) => handleUpdateSport(sportIndex, 'name', e.target.value)}
                         className="input-field text-xl font-bold !p-1 bg-transparent border-0 focus:ring-0 placeholder-slate-500"
                       />
                       <button onClick={() => handleRemoveSport(sportIndex)} className="btn-icon-danger">
                           <TrashIcon className="w-5 h-5"/>
                       </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Lesson Types */}
                       <div>
                           <h3 className="font-semibold mb-2">Tipi Lezione</h3>
                           <div className="space-y-2">
                                {sport.lessonTypes.map((lt, ltIndex) => (
                                   <div key={lt.id} className="flex items-center gap-2">
                                       <input type="text" value={lt.name} onChange={(e) => handleUpdateItem(sportIndex, ltIndex, 'lessonTypes', 'name', e.target.value)} className="input-field flex-grow"/>
                                       <button onClick={() => handleRemoveItem(sportIndex, ltIndex, 'lessonTypes')} className="btn-icon-danger">
                                           <TrashIcon className="w-4 h-4"/>
                                       </button>
                                   </div>
                                ))}
                               <button onClick={() => handleAddItem(sportIndex, 'lessonTypes')} className="btn-add-sm">
                                   <PlusIcon className="w-4 h-4 mr-1"/> Aggiungi Tipo
                               </button>
                           </div>
                       </div>
                       {/* Locations */}
                       <div>
                           <h3 className="font-semibold mb-2">Sedi</h3>
                           <div className="space-y-2">
                               {sport.locations.map((loc, locIndex) => (
                                   <div key={loc.id} className="flex items-center gap-2">
                                       <input type="text" value={loc.name} onChange={(e) => handleUpdateItem(sportIndex, locIndex, 'locations', 'name', e.target.value)} className="input-field flex-grow"/>
                                       <button onClick={() => handleRemoveItem(sportIndex, locIndex, 'locations')} className="btn-icon-danger">
                                           <TrashIcon className="w-4 h-4"/>
                                       </button>
                                   </div>
                               ))}
                               <button onClick={() => handleAddItem(sportIndex, 'locations')} className="btn-add-sm">
                                   <PlusIcon className="w-4 h-4 mr-1"/> Aggiungi Sede
                               </button>
                           </div>
                       </div>
                   </div>

                   {/* Prices Table */}
                   <div className="mt-6">
                       <h3 className="font-semibold mb-2">Prezzi per "{sport.name}"</h3>
                       {sport.lessonTypes.length > 0 ? (
                           <div className="space-y-2">
                               {sport.lessonTypes.map(lt => (
                                   <div key={lt.id} className="flex items-center justify-between gap-4 py-1 border-b border-slate-200">
                                       <label htmlFor={`price-${lt.id}`}>{lt.name}</label>
                                       <input
                                           type="number"
                                           id={`price-${lt.id}`}
                                           value={sport.prices[lt.id] || ''}
                                           onChange={(e) => handlePriceChange(sportIndex, lt.id, parseFloat(e.target.value) || 0)}
                                           className="input-field w-24"
                                       />
                                   </div>
                               ))}
                           </div>
                       ) : <p className="text-sm text-slate-500">Aggiungi un tipo di lezione per impostare i prezzi.</p>}
                   </div>

                   {/* Costs Table */}
                   <div className="mt-6 overflow-x-auto">
                       <h3 className="font-semibold mb-2">Costi per Sede e Tipo Lezione per "{sport.name}"</h3>
                       {sport.lessonTypes.length > 0 && sport.locations.length > 0 ? (
                           <table className="min-w-full border-collapse">
                               <thead>
                                   <tr className="bg-slate-50">
                                       <th className="p-2 border border-slate-200 text-left text-sm font-medium">Tipo / Sede</th>
                                       {sport.locations.map(loc => (
                                           <th key={loc.id} className="p-2 border border-slate-200 text-left text-sm font-medium truncate">{loc.name}</th>
                                       ))}
                                   </tr>
                               </thead>
                               <tbody>
                                   {sport.lessonTypes.map(lt => (
                                       <tr key={lt.id} className="hover:bg-slate-50">
                                           <td className="p-2 border border-slate-200 font-medium">{lt.name}</td>
                                           {sport.locations.map(loc => (
                                               <td key={loc.id} className="p-2 border border-slate-200">
                                                   <input
                                                       type="number"
                                                       value={(sport.costs && sport.costs[loc.id] && sport.costs[loc.id][lt.id]) || ''}
                                                       onChange={(e) => handleCostChange(sportIndex, loc.id, lt.id, parseFloat(e.target.value) || 0)}
                                                       className="input-field w-24"
                                                   />
                                               </td>
                                           ))}
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       ) : (
                           <p className="text-sm text-slate-500">Aggiungi almeno un tipo di lezione e una sede per impostare i costi.</p>
                       )}
                   </div>
                </div>
            ))}

            <button onClick={handleAddSport} className="w-full btn-secondary justify-center">
                <PlusIcon className="w-5 h-5 mr-2"/> Aggiungi Nuovo Sport
            </button>
        </div>

        <div className="flex justify-end gap-4 pt-8">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annulla
            </button>
            <button type="button" onClick={handleSave} className="btn-primary">
              Salva Impostazioni
            </button>
        </div>
        
        <style>{`
            .input-field { display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: white; border: 1px solid #cbd5e1; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
            .dark .input-field { background-color: #334155; border-color: #475569; color: #e2e8f0; }
            .input-field:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #38bdf8; box-shadow: 0 0 0 1px #38bdf8; }
            .btn-primary { display: inline-flex; align-items: center; padding: 0.5rem 1rem; background-color: #0ea5e9; color: white; border-radius: 0.375rem; font-weight: 500; transition: background-color 0.2s; border: 0;}
            .btn-primary:hover { background-color: #0284c7; }
            .btn-secondary { display: inline-flex; align-items: center; padding: 0.5rem 1rem; background-color: #e2e8f0; color: #1e293b; border-radius: 0.375rem; font-weight: 500; transition: background-color 0.2s; border: 0;}
            .dark .btn-secondary { background-color: #475569; color: #e2e8f0; }
            .dark .btn-secondary:hover { background-color: #64748b; }
            .btn-icon-danger { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem; color: #ef4444; border-radius: 9999px; transition: background-color 0.2s, color 0.2s; border: 0; background-color: transparent;}
            .btn-icon-danger:hover { background-color: #fee2e2; color: #b91c1c; }
            .dark .btn-icon-danger:hover { background-color: #450a0a; color: #f87171; }
            .btn-add-sm { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; font-size: 0.875rem; color: #0ea5e9; background-color: transparent; border: 1px solid #7dd3fc; border-radius: 9999px; transition: all 0.2s;}
            .btn-add-sm:hover { background-color: #e0f2fe; color: #0284c7; }
            .dark .btn-add-sm { color: #7dd3fc; border-color: #38bdf8;}
            .dark .btn-add-sm:hover { background-color: #0c4a6e; color: #bae6fd; }
            
            /* Overrides for sport-card in dark mode */
            .dark .sport-card { color: #1e293b; }
            .dark .sport-card .input-field { background-color: white; border-color: #cbd5e1; color: #1e293b; }
            .dark .sport-card .input-field::placeholder { color: #64748b; }
            .dark .sport-card .input-field:focus { border-color: #38bdf8; box-shadow: 0 0 0 1px #38bdf8; }
            .dark .sport-card .btn-icon-danger:hover { background-color: #fee2e2; color: #b91c1c; }
            .dark .sport-card .btn-add-sm { color: #0ea5e9; border-color: #7dd3fc; background-color: transparent; }
            .dark .sport-card .btn-add-sm:hover { background-color: #e0f2fe; color: #0284c7; }
            .dark .sport-card p, .dark .sport-card label, .dark .sport-card h3, .dark .sport-card th, .dark .sport-card td { color: #1e293b; }
            .dark .sport-card th { background-color: #f1f5f9 }
        `}</style>
      </div>
    </div>
  );
};

export default SettingsForm;