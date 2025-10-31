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
  const [sportId, setSportId] = useState<string>(settings.sports[0]?.id || '');
  const [lessonTypeId, setLessonTypeId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [invoiced, setInvoiced] = useState(false);

  const isEditing = !!lessonToEdit;

  const selectedSport = useMemo(() => settings.sports.find(s => s.id === sportId), [sportId, settings]);
  const availableLessonTypes = useMemo(() => selectedSport?.lessonTypes || [], [selectedSport]);
  const availableLocations = useMemo(() => selectedSport?.locations || [], [selectedSport]);
  
  // Effect to handle initialization and editing
  useEffect(() => {
    if (isOpen) {
        if (isEditing && lessonToEdit) {
            setSportId(lessonToEdit.sportId);
            setDate(lessonToEdit.date);
            setInvoiced(lessonToEdit.invoiced || false);
            // Defer setting these to let the sportId effect run first
            setTimeout(() => {
                setLessonTypeId(lessonToEdit.lessonTypeId);
                setLocationId(lessonToEdit.locationId);
            }, 0);
        } else {
            const firstSport = settings.sports[0];
            setDate(new Date().toISOString().split('T')[0]);
            setSportId(firstSport?.id || '');
            setLessonTypeId(firstSport?.lessonTypes[0]?.id || '');
            setLocationId(firstSport?.locations[0]?.id || '');
            setInvoiced(false);
        }
    }
  }, [lessonToEdit, isOpen, settings]);

  // Effect to update available options when sport changes
  useEffect(() => {
    if (!isEditing || (isEditing && lessonToEdit?.sportId !== sportId)) {
        setLessonTypeId(availableLessonTypes[0]?.id || '');
        setLocationId(availableLocations[0]?.id || '');
    }
  }, [sportId, availableLessonTypes, availableLocations, isEditing, lessonToEdit]);


  // Effect to update price and cost
  useEffect(() => {
    if(selectedSport && lessonTypeId) {
        setPrice(selectedSport.prices[lessonTypeId] || 0);
    } else {
        setPrice(0);
    }
    if(selectedSport && locationId) {
        setCost(selectedSport.locations.find(l => l.id === locationId)?.cost || 0);
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
      onAddLesson({
        ...lessonData,
        paid: false, // Default value for new lessons
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-40 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md border border-slate-300 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Modifica Lezione' : 'Aggiungi Lezione'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label htmlFor="sport" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Sport</label>
            <select
              id="sport"
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            >
              {settings.sports.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lessonType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo Lezione</label>
            <select
              id="lessonType"
              value={lessonTypeId}
              onChange={(e) => setLessonTypeId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            >
              {availableLessonTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>{lt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Sede</label>
            <select
              id="location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            >
              {availableLocations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="flex items-center mt-4">
              <input
                type="checkbox"
                checked={invoiced}
                onChange={(e) => setInvoiced(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Lezione Fatturata</span>
            </label>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <p className="text-slate-500 dark:text-slate-400">Prezzo: <span className="font-bold text-lg text-green-500 dark:text-green-400">€ {price.toFixed(2)}</span></p>
            <p className="text-slate-500 dark:text-slate-400">Costo: <span className="font-bold text-lg text-red-500">€ {cost.toFixed(2)}</span></p>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-sky-500 transition-colors"
            >
              {isEditing ? 'Salva Modifiche' : 'Aggiungi Lezione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonForm;