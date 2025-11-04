import React, { useState, useEffect } from 'react';
import { Settings, Lesson } from '../types';
import { TrashIcon, PlusIcon } from './icons';

// Helper to check if a setting is in use
const isSportInUse = (sportId: string, lessons: Lesson[]) => lessons.some(l => l.sportId === sportId);
const isLessonTypeInUse = (sportId: string, lessonTypeId: string, lessons: Lesson[]) => lessons.some(l => l.sportId === sportId && l.lessonTypeId === lessonTypeId);
const isLocationInUse = (sportId: string, locationId: string, lessons: Lesson[]) => lessons.some(l => l.sportId === sportId && l.locationId === locationId);


const SettingsForm: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    lessons: Lesson[];
    onSave: (settings: Settings) => void;
}> = ({ isOpen, onClose, settings, lessons, onSave }) => {

    const [localSettings, setLocalSettings] = useState<Settings>(JSON.parse(JSON.stringify(settings)));

    useEffect(() => {
        if (isOpen) {
            // Deep copy to avoid mutating original settings object
            setLocalSettings(JSON.parse(JSON.stringify(settings)));
        }
    }, [settings, isOpen]);
    
    const updateSettings = (updater: (draft: Settings) => void) => {
        setLocalSettings(currentSettings => {
            const newSettings = JSON.parse(JSON.stringify(currentSettings));
            updater(newSettings);
            return newSettings;
        });
    };

    // Sport Handlers
    const addSport = () => {
        updateSettings(draft => {
            draft.sports.push({
                id: `sport-${Date.now()}`,
                name: 'Nuovo Sport',
                lessonTypes: [],
                locations: [],
                prices: {},
                costs: {},
            });
        });
    };

    const removeSport = (sportIndex: number) => {
        updateSettings(draft => {
            draft.sports.splice(sportIndex, 1);
        });
    };

    const updateSportName = (sportIndex: number, name: string) => {
        updateSettings(draft => {
            draft.sports[sportIndex].name = name;
        });
    };
    
    // Lesson Type Handlers
    const addLessonType = (sportIndex: number) => {
        updateSettings(draft => {
            draft.sports[sportIndex].lessonTypes.push({
                id: `lt-${Date.now()}`,
                name: 'Nuovo Tipo'
            });
        });
    };

    const removeLessonType = (sportIndex: number, ltIndex: number) => {
        updateSettings(draft => {
            const lessonTypeId = draft.sports[sportIndex].lessonTypes[ltIndex].id;
            delete draft.sports[sportIndex].prices[lessonTypeId];
            Object.keys(draft.sports[sportIndex].costs).forEach(locId => {
                if (draft.sports[sportIndex].costs[locId]) {
                    delete draft.sports[sportIndex].costs[locId][lessonTypeId];
                }
            });
            draft.sports[sportIndex].lessonTypes.splice(ltIndex, 1);
        });
    };
    
    const updateLessonTypeName = (sportIndex: number, ltIndex: number, name: string) => {
        updateSettings(draft => {
            draft.sports[sportIndex].lessonTypes[ltIndex].name = name;
        });
    };
    
    // Location Handlers
    const addLocation = (sportIndex: number) => {
         updateSettings(draft => {
            draft.sports[sportIndex].locations.push({
                id: `loc-${Date.now()}`,
                name: 'Nuova Sede'
            });
        });
    };
    
    const removeLocation = (sportIndex: number, locIndex: number) => {
         updateSettings(draft => {
            const locationId = draft.sports[sportIndex].locations[locIndex].id;
            delete draft.sports[sportIndex].costs[locationId];
            draft.sports[sportIndex].locations.splice(locIndex, 1);
        });
    };
    
    const updateLocationName = (sportIndex: number, locIndex: number, name: string) => {
        updateSettings(draft => {
            draft.sports[sportIndex].locations[locIndex].name = name;
        });
    };
    
    // Price & Cost Handlers
    const updatePrice = (sportIndex: number, lessonTypeId: string, price: number) => {
        updateSettings(draft => {
            draft.sports[sportIndex].prices[lessonTypeId] = price;
        });
    };
    
    const updateCost = (sportIndex: number, locationId: string, lessonTypeId: string, cost: number) => {
        updateSettings(draft => {
            if (!draft.sports[sportIndex].costs[locationId]) {
                draft.sports[sportIndex].costs[locationId] = {};
            }
            draft.sports[sportIndex].costs[locationId][lessonTypeId] = cost;
        });
    };
    
    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-40 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-4xl border border-slate-300 dark:border-slate-700 my-8" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">Impostazioni</h2>

                <div className="space-y-6">
                    {localSettings.sports.map((sport, sportIndex) => {
                        const sportUsed = isSportInUse(sport.id, lessons);
                        return (
                            <div key={sport.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-4">
                                    <input
                                        type="text"
                                        value={sport.name}
                                        onChange={(e) => updateSportName(sportIndex, e.target.value)}
                                        className="text-xl font-semibold bg-transparent focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md px-2 py-1 -ml-2"
                                    />
                                    <button
                                        onClick={() => removeSport(sportIndex)}
                                        disabled={sportUsed}
                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-100 dark:hover:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                        title={sportUsed ? "Questo sport è usato in una o più lezioni" : "Elimina sport"}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Lesson Types & Prices */}
                                    <div>
                                        <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Tipi di Lezione e Prezzi</h4>
                                        <div className="space-y-2">
                                            {sport.lessonTypes.map((lt, ltIndex) => {
                                                const ltUsed = isLessonTypeInUse(sport.id, lt.id, lessons);
                                                return (
                                                    <div key={lt.id} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={lt.name}
                                                            onChange={(e) => updateLessonTypeName(sportIndex, ltIndex, e.target.value)}
                                                            className="flex-grow mt-1 block w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                                        />
                                                        <div className="relative">
                                                             <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">€</span>
                                                            <input
                                                                type="number"
                                                                value={sport.prices[lt.id] || ''}
                                                                onChange={(e) => updatePrice(sportIndex, lt.id, parseFloat(e.target.value) || 0)}
                                                                className="w-28 pl-7 mt-1 block px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeLessonType(sportIndex, ltIndex)}
                                                            disabled={ltUsed}
                                                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                                            title={ltUsed ? "Questo tipo di lezione è in uso" : "Elimina tipo lezione"}
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                            <button onClick={() => addLessonType(sportIndex)} className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-medium py-1">
                                                <PlusIcon className="w-4 h-4" /> Aggiungi Tipo Lezione
                                            </button>
                                        </div>
                                    </div>

                                    {/* Locations */}
                                    <div>
                                        <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Sedi</h4>
                                        <div className="space-y-2">
                                            {sport.locations.map((loc, locIndex) => {
                                                const locUsed = isLocationInUse(sport.id, loc.id, lessons);
                                                return (
                                                    <div key={loc.id} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={loc.name}
                                                            onChange={(e) => updateLocationName(sportIndex, locIndex, e.target.value)}
                                                            className="flex-grow mt-1 block w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                                        />
                                                        <button
                                                            onClick={() => removeLocation(sportIndex, locIndex)}
                                                            disabled={locUsed}
                                                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                                            title={locUsed ? "Questa sede è in uso" : "Elimina sede"}
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                             <button onClick={() => addLocation(sportIndex)} className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 font-medium py-1">
                                                <PlusIcon className="w-4 h-4" /> Aggiungi Sede
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Costs Table */}
                                {sport.locations.length > 0 && sport.lessonTypes.length > 0 && (
                                     <div className="mt-6">
                                         <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Costi Sede per Tipo Lezione</h4>
                                         <div className="overflow-x-auto">
                                             <table className="w-full text-sm text-left">
                                                 <thead className="bg-slate-200 dark:bg-slate-800/80">
                                                     <tr>
                                                         <th className="p-2 font-medium text-slate-700 dark:text-slate-300">Sede / Tipo Lezione</th>
                                                         {sport.lessonTypes.map(lt => <th key={lt.id} className="p-2 font-medium text-slate-700 dark:text-slate-300 text-center">{lt.name}</th>)}
                                                     </tr>
                                                 </thead>
                                                 <tbody>
                                                     {sport.locations.map(loc => (
                                                         <tr key={loc.id} className="border-b border-slate-200 dark:border-slate-700">
                                                             <td className="p-2 font-medium">{loc.name}</td>
                                                             {sport.lessonTypes.map(lt => (
                                                                 <td key={lt.id} className="p-1">
                                                                     <div className="relative">
                                                                         <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">€</span>
                                                                         <input
                                                                             type="number"
                                                                             value={(sport.costs[loc.id] && sport.costs[loc.id][lt.id]) || ''}
                                                                             onChange={(e) => updateCost(sportIndex, loc.id, lt.id, parseFloat(e.target.value) || 0)}
                                                                             className="w-full pl-7 mt-1 block px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                                                         />
                                                                     </div>
                                                                 </td>
                                                             ))}
                                                         </tr>
                                                     ))}
                                                 </tbody>
                                             </table>
                                         </div>
                                     </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <button
                    onClick={addSport}
                    className="mt-6 w-full flex justify-center items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-400 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" /> Aggiungi Sport
                </button>

                <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-slate-300 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-sky-500 transition-colors"
                    >
                        Salva Impostazioni
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsForm;
