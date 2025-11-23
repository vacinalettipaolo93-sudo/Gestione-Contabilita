import React, { useState, useEffect, useMemo } from 'react';
import { Lesson, Settings } from '../types';

interface LessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLesson: (lesson: Omit<Lesson, 'id'>) => void;
  onUpdateLesson: (lesson: Lesson) => void;
  lessonToEdit: Lesson | null;
  settings: Settings;
}

const LessonForm: React.FC<LessonFormProps> = ({ isOpen, onClose, onAddLesson, onUpdateLesson, lessonToEdit, settings }) => {
  const [date, setDate] = useState('');
  const [sportId, setSportId] = useState<string>('');
  const [lessonTypeId, setLessonTypeId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [invoiced, setInvoiced] = useState(false);

  const isEditing = !!lessonToEdit;

  const selectedSport = useMemo(() => settings.sports.find(s => s.id === sportId), [sportId, settings]);
  const availableLessonTypes = useMemo(() => selectedSport?.lessonTypes || [], [selectedSport]);
  const availableLocations = useMemo(() => selectedSport?.locations || [], [selectedSport]);
  
  useEffect(() => {
    if (isOpen) {
        if (isEditing && lessonToEdit) {
            setSportId(lessonToEdit.sportId);
            setDate(lessonToEdit.date);
            setInvoiced(lessonToEdit.invoiced || false);
            setTimeout(() => {
                setLessonTypeId(lessonToEdit.lessonTypeId);
                setLocationId(lessonToEdit.locationId);
            }, 0);
        } else {
            const firstSport = settings.sports[0];
            setDate(new Date().toISOString().split('T')[0]);
            setSportId(firstSport?.id || '');
            setLessonTypeId(firstSport?.lessonTypes?.[0]?.id || '');
            setLocationId(firstSport?.locations?.[0]?.id || '');
            setInvoiced(false);
        }
    }
  }, [lessonToEdit, isOpen, settings]);

  useEffect(() => {
    if (!isEditing || (isEditing && lessonToEdit?.sportId !== sportId)) {
        setLessonTypeId(availableLessonTypes[0]?.id || '');
        setLocationId(availableLocations[0]?.id || '');
    }
  }, [sportId, availableLessonTypes, availableLocations, isEditing, lessonToEdit]);


  useEffect(() => {
    if(selectedSport && lessonTypeId) {
        setPrice(selectedSport.prices[lessonTypeId] || 0);
    } else {
        setPrice(0);
    }
    
    if (selectedSport && locationId && lessonTypeId && selectedSport.costs) {
        const locationCosts = selectedSport.costs[locationId];
        if (locationCosts) {
            setCost(locationCosts[lessonTypeId] || 0);
        } else {
            setCost(0);
        }
    } else {
        setCost(0);
    }

  }, [sportId, lessonTypeId, locationId, selectedSport]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lessonData = {
        date,
        sportId,
        lessonTypeId,
        locationId,
        price,
        cost,
        invoiced,
    };

    if (isEditing) {
      onUpdateLesson({
        ...lessonToEdit,
        ...lessonData
      });
    } else {
      onAddLesson(lessonData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/10 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/5 pb-4">
            {isEditing ? 'Modifica Lezione' : 'Nuova Lezione'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="date" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">Data</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="sport" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">Sport</label>
                <select
                id="sport"
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
                >
                {settings.sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="location" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">Sede</label>
                <select
                id="location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
                >
                {availableLocations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                ))}
                </select>
            </div>
          </div>

          <div>
            <label htmlFor="lessonType" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">Tipo Lezione</label>
            <select
              id="lessonType"
              value={lessonTypeId}
              onChange={(e) => setLessonTypeId(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
            >
              {availableLessonTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>{lt.name}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <label className="flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    checked={invoiced}
                    onChange={(e) => setInvoiced(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 bg-zinc-800"
                />
                <span className="ml-3 text-sm font-medium text-zinc-300">Lezione Fatturata</span>
              </label>
          </div>

          <div className="flex justify-between items-center py-2 px-1">
            <div className="text-center">
                <span className="block text-xs text-zinc-500 uppercase font-bold">Prezzo</span>
                <span className="block font-bold text-xl text-emerald-500">€ {price.toFixed(2)}</span>
            </div>
            <div className="h-8 w-px bg-zinc-800"></div>
            <div className="text-center">
                <span className="block text-xs text-zinc-500 uppercase font-bold">Costo</span>
                <span className="block font-bold text-xl text-red-500">€ {cost.toFixed(2)}</span>
            </div>
            <div className="h-8 w-px bg-zinc-800"></div>
             <div className="text-center">
                <span className="block text-xs text-zinc-500 uppercase font-bold">Utile</span>
                <span className="block font-bold text-xl text-indigo-500">€ {(price - cost).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white/5 text-zinc-300 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-xl hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/20 text-sm font-semibold transition-all transform hover:scale-[1.02]"
            >
              {isEditing ? 'Salva' : 'Aggiungi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonForm;