import React, { useState, useEffect } from 'react';
import { Settings, Lesson } from '../types';
import { TrashIcon, PlusIcon, ReceiptPercentIcon } from './icons';
import { DEFAULT_PAITONE_COMPENSATION } from '../paitoneCompensation';

const isSportInUse = (sportId: string, lessons: Lesson[]) => lessons.some(l => l.sportId === sportId);
const isLessonTypeInUse = (sportId: string, lessonTypeId: string, lessons: Lesson[]) => lessons.some(l => l.sportId === sportId && l.lessonTypeId === lessonTypeId);
const isLocationInUse = (sportId: string, locationId: string, lessons: Lesson[]) => lessons.some(l => l.sportId === sportId && l.locationId === locationId);
const parseNonNegativeNumber = (value: string) => {
    const parsedValue = Number(value.replace(',', '.'));
    if (!Number.isFinite(parsedValue) || parsedValue < 0) return 0;
    return parsedValue;
};
const normalizeSettings = (settings: Settings): Settings => {
    const clonedSettings = structuredClone(settings) as Settings;
    if (!clonedSettings.paitoneCompensation || typeof clonedSettings.paitoneCompensation !== 'object') {
        clonedSettings.paitoneCompensation = { ...DEFAULT_PAITONE_COMPENSATION };
    }
    return clonedSettings;
};

const SettingsForm: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    lessons: Lesson[];
    onSave: (settings: Settings) => void;
    onRestoreLatestBackup: () => void;
}> = ({ isOpen, onClose, settings, lessons, onSave, onRestoreLatestBackup }) => {

    const [localSettings, setLocalSettings] = useState<Settings>(normalizeSettings(settings));

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(normalizeSettings(settings));
        }
    }, [settings, isOpen]);

    const updateSettings = (updater: (draft: Settings) => void) => {
        setLocalSettings(currentSettings => {
            const newSettings = structuredClone(currentSettings);
            if (!newSettings.paitoneCompensation || typeof newSettings.paitoneCompensation !== 'object') {
                newSettings.paitoneCompensation = { ...DEFAULT_PAITONE_COMPENSATION };
            }
            updater(newSettings);
            return newSettings;
        });
    };

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
            Object.keys(draft.sports[sportIndex].prices).forEach(locId => {
                if (draft.sports[sportIndex].prices[locId]) {
                    delete draft.sports[sportIndex].prices[locId][lessonTypeId];
                }
            });
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
            delete draft.sports[sportIndex].prices[locationId];
            delete draft.sports[sportIndex].costs[locationId];
            draft.sports[sportIndex].locations.splice(locIndex, 1);
        });
    };

    const updateLocationName = (sportIndex: number, locIndex: number, name: string) => {
        updateSettings(draft => {
            draft.sports[sportIndex].locations[locIndex].name = name;
        });
    };

    const updatePrice = (sportIndex: number, locationId: string, lessonTypeId: string, price: number) => {
        updateSettings(draft => {
            if (!draft.sports[sportIndex].prices[locationId]) {
                draft.sports[sportIndex].prices[locationId] = {};
            }
            draft.sports[sportIndex].prices[locationId][lessonTypeId] = price;
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
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-4xl border border-white/10 my-8 transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-bold text-white">Impostazioni</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">✕</button>
                </div>

                <div className="space-y-8">
                    {/* General Settings Section */}
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                <ReceiptPercentIcon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-lg text-zinc-100">Configurazione Fiscale</h3>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <label htmlFor="taxRate" className="text-sm font-semibold text-zinc-300">
                                Percentuale Tasse / Ritenuta
                            </label>
                            <div className="relative">
                                <input
                                    id="taxRate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={localSettings.taxRate ?? 0}
                                    onChange={(e) => updateSettings(draft => { draft.taxRate = parseFloat(e.target.value) || 0; })}
                                    className="w-24 pl-3 pr-8 py-2 bg-black/40 border border-white/10 rounded-lg text-right font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none text-white"
                                />
                                <span className="absolute right-3 top-2 text-zinc-400">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                <ReceiptPercentIcon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-lg text-zinc-100">Compenso aggiuntivo centro di Paitone</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <label htmlFor="paitoneRentCost" className="text-sm font-semibold text-zinc-300">Costo affitto (€)</label>
                                <input
                                    id="paitoneRentCost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={localSettings.paitoneCompensation?.rentCost ?? DEFAULT_PAITONE_COMPENSATION.rentCost}
                                    onChange={(e) => updateSettings(draft => { draft.paitoneCompensation.rentCost = parseNonNegativeNumber(e.target.value); })}
                                    className="mt-2 w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-right font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none text-white"
                                />
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <label htmlFor="paitoneCollaboratorCost" className="text-sm font-semibold text-zinc-300">Costo collaboratore (€)</label>
                                <input
                                    id="paitoneCollaboratorCost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={localSettings.paitoneCompensation?.collaboratorCost ?? DEFAULT_PAITONE_COMPENSATION.collaboratorCost}
                                    onChange={(e) => updateSettings(draft => { draft.paitoneCompensation.collaboratorCost = parseNonNegativeNumber(e.target.value); })}
                                    className="mt-2 w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-right font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none text-white"
                                />
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <label htmlFor="paitoneFirstBracketLimit" className="text-sm font-semibold text-zinc-300">Soglia 1 (fino a €)</label>
                                <input
                                    id="paitoneFirstBracketLimit"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={localSettings.paitoneCompensation?.firstBracketLimit ?? DEFAULT_PAITONE_COMPENSATION.firstBracketLimit}
                                    onChange={(e) => updateSettings(draft => {
                                        const value = parseNonNegativeNumber(e.target.value);
                                        draft.paitoneCompensation.firstBracketLimit = value;
                                        if (draft.paitoneCompensation.secondBracketLimit < value) {
                                            draft.paitoneCompensation.secondBracketLimit = value;
                                        }
                                    })}
                                    className="mt-2 w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-right font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none text-white"
                                />
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <label htmlFor="paitoneSecondBracketLimit" className="text-sm font-semibold text-zinc-300">Soglia 2 (fino a €)</label>
                                <input
                                    id="paitoneSecondBracketLimit"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={localSettings.paitoneCompensation?.secondBracketLimit ?? DEFAULT_PAITONE_COMPENSATION.secondBracketLimit}
                                    onChange={(e) => updateSettings(draft => {
                                        const value = parseNonNegativeNumber(e.target.value);
                                        draft.paitoneCompensation.secondBracketLimit = Math.max(value, draft.paitoneCompensation.firstBracketLimit);
                                    })}
                                    className="mt-2 w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-right font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none text-white"
                                />
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <label htmlFor="paitoneFirstBracketRate" className="text-sm font-semibold text-zinc-300">Percentuale 1 (%)</label>
                                <p className="text-xs text-zinc-500 mt-1">Applicata fino alla soglia 1</p>
                                <input
                                    id="paitoneFirstBracketRate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={localSettings.paitoneCompensation?.firstBracketRate ?? DEFAULT_PAITONE_COMPENSATION.firstBracketRate}
                                    onChange={(e) => updateSettings(draft => { draft.paitoneCompensation.firstBracketRate = parseNonNegativeNumber(e.target.value); })}
                                    className="mt-2 w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-right font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none text-white"
                                />
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <label htmlFor="paitoneSecondBracketRate" className="text-sm font-semibold text-zinc-300">Percentuale 2 (%)</label>
                                <p className="text-xs text-zinc-500 mt-1">Applicata tra soglia 1 e soglia 2</p>
                                <input
                                    id="paitoneSecondBracketRate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={localSettings.paitoneCompensation?.secondBracketRate ?? DEFAULT_PAITONE_COMPENSATION.secondBracketRate}
                                    onChange={(e) => updateSettings(draft => { draft.paitoneCompensation.secondBracketRate = parseNonNegativeNumber(e.target.value); })}
                                    className="mt-2 w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-right font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none text-white"
                                />
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 md:col-span-2">
                                <label htmlFor="paitoneThirdBracketRate" className="text-sm font-semibold text-zinc-300">Percentuale 3 (%)</label>
                                <p className="text-xs text-zinc-500 mt-1">Applicata oltre la soglia 2</p>
                                <input
                                    id="paitoneThirdBracketRate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={localSettings.paitoneCompensation?.thirdBracketRate ?? DEFAULT_PAITONE_COMPENSATION.thirdBracketRate}
                                    onChange={(e) => updateSettings(draft => { draft.paitoneCompensation.thirdBracketRate = parseNonNegativeNumber(e.target.value); })}
                                    className="mt-2 w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-right font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {localSettings.sports.map((sport, sportIndex) => {
                        const sportUsed = isSportInUse(sport.id, lessons);
                        return (
                            <div key={sport.id} className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <input
                                        type="text"
                                        value={sport.name}
                                        onChange={(e) => updateSportName(sportIndex, e.target.value)}
                                        className="text-xl font-bold bg-transparent focus:outline-none border-b-2 border-transparent focus:border-indigo-500 text-white px-1"
                                    />
                                    <button
                                        onClick={() => removeSport(sportIndex)}
                                        disabled={sportUsed}
                                        className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-500/10 disabled:text-zinc-700 disabled:bg-transparent transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Lesson Types */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-zinc-400 uppercase text-xs tracking-wider">Tipi di Lezione</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {sport.lessonTypes.map((lt, ltIndex) => {
                                                const ltUsed = isLessonTypeInUse(sport.id, lt.id, lessons);
                                                return (
                                                    <div key={lt.id} className="flex items-center gap-2 group">
                                                        <input
                                                            type="text"
                                                            value={lt.name}
                                                            onChange={(e) => updateLessonTypeName(sportIndex, ltIndex, e.target.value)}
                                                            className="flex-grow px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => removeLessonType(sportIndex, ltIndex)}
                                                            disabled={ltUsed}
                                                            className="text-zinc-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                            <button
                                                onClick={() => addLessonType(sportIndex)}
                                                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-zinc-700 rounded-lg text-sm text-zinc-500 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all"
                                            >
                                                <PlusIcon className="w-4 h-4" /> Aggiungi Tipo
                                            </button>
                                        </div>
                                    </div>

                                    {/* Locations */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-zinc-400 uppercase text-xs tracking-wider">Sedi</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {sport.locations.map((loc, locIndex) => {
                                                const locUsed = isLocationInUse(sport.id, loc.id, lessons);
                                                return (
                                                    <div key={loc.id} className="flex items-center gap-2 group">
                                                        <input
                                                            type="text"
                                                            value={loc.name}
                                                            onChange={(e) => updateLocationName(sportIndex, locIndex, e.target.value)}
                                                            className="flex-grow px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => removeLocation(sportIndex, locIndex)}
                                                            disabled={locUsed}
                                                            className="text-zinc-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                            <button
                                                onClick={() => addLocation(sportIndex)}
                                                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-zinc-700 rounded-lg text-sm text-zinc-500 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all"
                                            >
                                                <PlusIcon className="w-4 h-4" /> Aggiungi Sede
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Costs Table */}
                                {sport.locations.length > 0 && sport.lessonTypes.length > 0 && (
                                    <div className="mt-8">
                                        <h4 className="font-semibold text-zinc-400 uppercase text-xs tracking-wider mb-3">Prezzi Sede (per tipo lezione)</h4>
                                        <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 mb-4">
                                            <table className="w-max min-w-full text-sm text-left bg-white/5">
                                                <thead>
                                                    <tr className="border-b border-white/10 bg-white/5">
                                                        <th className="p-3 font-semibold text-zinc-300 whitespace-nowrap min-w-[180px]">Sede</th>
                                                        {sport.lessonTypes.map(lt => <th key={lt.id} className="p-3 font-semibold text-zinc-300 text-center whitespace-nowrap min-w-[140px]">{lt.name}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sport.locations.map(loc => (
                                                        <tr key={loc.id} className="border-b border-white/5 last:border-0">
                                                            <td className="p-3 font-medium text-zinc-200 whitespace-nowrap min-w-[180px]">{loc.name}</td>
                                                            {sport.lessonTypes.map(lt => (
                                                                <td key={lt.id} className="p-2">
                                                                    <div className="relative w-[120px] mx-auto">
                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-zinc-400 text-xs">€</span>
                                                                        <input
                                                                            type="number"
                                                                            value={(sport.prices[loc.id] && sport.prices[loc.id][lt.id]) || ''}
                                                                            onChange={(e) => updatePrice(sportIndex, loc.id, lt.id, parseFloat(e.target.value) || 0)}
                                                                            className="w-full pl-5 pr-2 py-1.5 bg-black/20 border border-white/10 rounded-md text-sm text-center focus:ring-1 focus:ring-emerald-500/50 outline-none text-white"
                                                                        />
                                                                    </div>
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <h4 className="font-semibold text-zinc-400 uppercase text-xs tracking-wider mb-3">Costi Sede (per tipo lezione)</h4>
                                        <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-white/10">
                                            <table className="w-max min-w-full text-sm text-left bg-white/5">
                                                <thead>
                                                    <tr className="border-b border-white/10 bg-white/5">
                                                        <th className="p-3 font-semibold text-zinc-300 whitespace-nowrap min-w-[180px]">Sede</th>
                                                        {sport.lessonTypes.map(lt => <th key={lt.id} className="p-3 font-semibold text-zinc-300 text-center whitespace-nowrap min-w-[140px]">{lt.name}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sport.locations.map(loc => (
                                                        <tr key={loc.id} className="border-b border-white/5 last:border-0">
                                                            <td className="p-3 font-medium text-zinc-200 whitespace-nowrap min-w-[180px]">{loc.name}</td>
                                                            {sport.lessonTypes.map(lt => (
                                                                <td key={lt.id} className="p-2">
                                                                    <div className="relative w-[120px] mx-auto">
                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-zinc-400 text-xs">€</span>
                                                                        <input
                                                                            type="number"
                                                                            value={(sport.costs[loc.id] && sport.costs[loc.id][lt.id]) || ''}
                                                                            onChange={(e) => updateCost(sportIndex, loc.id, lt.id, parseFloat(e.target.value) || 0)}
                                                                            className="w-full pl-5 pr-2 py-1.5 bg-black/20 border border-white/10 rounded-md text-sm text-center focus:ring-1 focus:ring-indigo-500/50 outline-none text-white"
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
                    className="mt-8 w-full flex justify-center items-center gap-2 px-6 py-4 border-2 border-dashed border-zinc-700 text-zinc-400 rounded-xl hover:bg-white/5 hover:border-indigo-500 hover:text-indigo-400 transition-all font-semibold"
                >
                    <PlusIcon className="w-5 h-5" /> Aggiungi Nuovo Sport
                </button>

                <div className="flex justify-between items-center gap-4 pt-6 mt-6 border-t border-white/5 sticky bottom-0 bg-zinc-900 pb-2 z-10">
                    <button
                        type="button"
                        onClick={onRestoreLatestBackup}
                        className="px-4 py-2.5 bg-amber-500/10 text-amber-300 rounded-xl hover:bg-amber-500/20 transition-colors font-semibold"
                        title="Ripristina l'ultimo backup salvato su Firebase"
                    >
                        Ripristina ultimo backup
                    </button>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white/10 text-zinc-200 rounded-xl hover:bg-white/20 transition-colors font-semibold"
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-xl hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/20 font-semibold"
                        >
                            Salva Tutto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsForm;
