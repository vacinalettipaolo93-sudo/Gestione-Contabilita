import React, { useState, useEffect, useMemo } from 'react';
import { Lesson, Settings } from '../types';
import { CUSTOM_LESSON_TYPE_ID, PAITONE_REVENUE_LESSON_TYPE_ID, PAITONE_REVENUE_LESSON_TYPE_NAME } from '../lessonUtils';
import { submitPaitoneRevenue } from '../paitoneRevenueSubmission';

interface LessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLesson: (lesson: Omit<Lesson, 'id'>) => void;
  onUpdateLesson: (lesson: Lesson) => void;
  onSavePaitoneRevenue: (revenue: number) => Promise<void>;
  lessonToEdit: Lesson | null;
  currentPaitoneRevenue: number | null;
  settings: Settings;
}

const LessonForm: React.FC<LessonFormProps> = ({
  isOpen,
  onClose,
  onAddLesson,
  onUpdateLesson,
  onSavePaitoneRevenue,
  lessonToEdit,
  currentPaitoneRevenue,
  settings,
}) => {
  const [date, setDate] = useState('');
  const [sportId, setSportId] = useState<string>('');
  const [lessonTypeId, setLessonTypeId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [invoiced, setInvoiced] = useState(false);

  // Custom (incasso al volo)
  const [customLessonTypeName, setCustomLessonTypeName] = useState('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [paitoneRevenueInput, setPaitoneRevenueInput] = useState('');
  const [paitoneRevenueError, setPaitoneRevenueError] = useState('');
  const [isSavingPaitoneRevenue, setIsSavingPaitoneRevenue] = useState(false);

  const isEditing = !!lessonToEdit;
  const isEditingPaitoneRevenueEntry = !!lessonToEdit && lessonToEdit.lessonTypeId === PAITONE_REVENUE_LESSON_TYPE_ID;
  const isCustom = lessonTypeId === CUSTOM_LESSON_TYPE_ID;
  const isPaitoneRevenueType = lessonTypeId === PAITONE_REVENUE_LESSON_TYPE_ID;

  const selectedSport = useMemo(() => settings.sports.find((s) => s.id === sportId), [sportId, settings]);
  const availableLessonTypes = useMemo(() => selectedSport?.lessonTypes || [], [selectedSport]);
  const availableLocations = useMemo(() => selectedSport?.locations || [], [selectedSport]);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditing && lessonToEdit) {
      const isEditingPaitoneRevenue = lessonToEdit.lessonTypeId === PAITONE_REVENUE_LESSON_TYPE_ID;
      setSportId(isEditingPaitoneRevenue ? '' : lessonToEdit.sportId || settings.sports[0]?.id || '');
      setDate(lessonToEdit.date);
      setInvoiced(lessonToEdit.invoiced || false);

      setCustomLessonTypeName(lessonToEdit.customLessonTypeName || '');
      setCustomPrice(
        typeof lessonToEdit.customPrice === 'number' ? String(lessonToEdit.customPrice) : ''
      );
      setPaitoneRevenueInput(
        typeof lessonToEdit.paitoneRevenue === 'number'
          ? String(lessonToEdit.paitoneRevenue)
          : lessonToEdit.lessonTypeId === PAITONE_REVENUE_LESSON_TYPE_ID && typeof currentPaitoneRevenue === 'number'
            ? String(currentPaitoneRevenue)
            : ''
      );
      setPaitoneRevenueError('');

      setTimeout(() => {
        setLessonTypeId(lessonToEdit.lessonTypeId);
        setLocationId(isEditingPaitoneRevenue ? '' : lessonToEdit.locationId || settings.sports[0]?.locations?.[0]?.id || '');
      }, 0);
    } else {
      const firstSport = settings.sports[0];
      setDate(new Date().toISOString().split('T')[0]);
      setSportId(firstSport?.id || '');
      setLessonTypeId(firstSport?.lessonTypes?.[0]?.id || '');
      setLocationId(firstSport?.locations?.[0]?.id || '');
      setInvoiced(false);

      setCustomLessonTypeName('');
      setCustomPrice('');
      setPaitoneRevenueInput(typeof currentPaitoneRevenue === 'number' ? String(currentPaitoneRevenue) : '');
      setPaitoneRevenueError('');
    }
  }, [lessonToEdit, isOpen, settings, isEditing, currentPaitoneRevenue]);

  useEffect(() => {
    if (isPaitoneRevenueType || sportId || settings.sports.length === 0) return;
    const firstSport = settings.sports[0];
    setSportId(firstSport.id);
    setLocationId(firstSport.locations?.[0]?.id || '');
    setLessonTypeId(firstSport.lessonTypes?.[0]?.id || '');
  }, [isPaitoneRevenueType, sportId, settings]);

  useEffect(() => {
    // Quando cambio sport, reset tipo/sede SOLO se non sto editando la stessa sport
    if ((!isEditing || (isEditing && lessonToEdit?.sportId !== sportId)) && !isPaitoneRevenueType) {
      setLessonTypeId(availableLessonTypes[0]?.id || '');
      setLocationId(availableLocations[0]?.id || '');
      setCustomLessonTypeName('');
      setCustomPrice('');
    }
  }, [sportId, availableLessonTypes, availableLocations, isEditing, lessonToEdit, isPaitoneRevenueType]);

  useEffect(() => {
    if (isPaitoneRevenueType) {
      setPrice(0);
      setCost(0);
      return;
    }

    // Se custom: prezzo = customPrice e costo = 0
    if (isCustom) {
      const p = Number(customPrice);
      setPrice(Number.isFinite(p) ? p : 0);
      setCost(0);
      return;
    }

    // Standard: prezzo/costo da settings
    if (selectedSport && locationId && lessonTypeId) {
      const locationPrices = selectedSport.prices?.[locationId];
      const locationPrice =
        locationPrices && typeof locationPrices[lessonTypeId] === 'number' ? locationPrices[lessonTypeId] : undefined;
      const legacyPrice =
        typeof (selectedSport.prices as any)?.[lessonTypeId] === 'number'
          ? (selectedSport.prices as any)[lessonTypeId]
          : undefined;
      setPrice(locationPrice ?? legacyPrice ?? 0);
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
  }, [sportId, lessonTypeId, locationId, selectedSport, isCustom, customPrice, isPaitoneRevenueType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPaitoneRevenueType) {
      try {
        setIsSavingPaitoneRevenue(true);
        setPaitoneRevenueError('');
        const result = await submitPaitoneRevenue(paitoneRevenueInput, onSavePaitoneRevenue);
        if (!result.success) {
          setPaitoneRevenueError(result.error);
          return;
        }
        onClose();
      } catch {
        setPaitoneRevenueError('Salvataggio non riuscito. Riprova.');
      } finally {
        setIsSavingPaitoneRevenue(false);
      }
      return;
    }

    if (isCustom) {
      if (!customLessonTypeName.trim()) {
        alert('Inserisci un nome per la lezione personalizzata (es. Torneo).');
        return;
      }
      const p = Number(customPrice);
      if (!Number.isFinite(p)) {
        alert('Inserisci un incasso valido.');
        return;
      }
    }

    const lessonData: Omit<Lesson, 'id'> = {
      date,
      sportId,
      lessonTypeId,
      locationId,
      price,
      cost,
      invoiced,
      ...(isCustom
        ? {
            customLessonTypeName: customLessonTypeName.trim(),
            customPrice: Number(customPrice),
          }
        : {
            customLessonTypeName: '',
            customPrice: 0,
          }),
    };

    if (isEditing && lessonToEdit) {
      onUpdateLesson({
        ...lessonToEdit,
        ...lessonData,
      });
    } else {
      onAddLesson(lessonData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/10 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/5 pb-4">
          {isEditing ? 'Modifica Lezione' : 'Nuova Lezione'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isPaitoneRevenueType && (
            <div>
            <label htmlFor="date" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">
              Data
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
            />
          </div>
          )}

          {!isPaitoneRevenueType && (
            <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sport" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">
                Sport
              </label>
              <select
                id="sport"
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
              >
                {settings.sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">
                Sede
              </label>
              <select
                id="location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
              >
                {availableLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          )}

          <div>
            <label htmlFor="lessonType" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">
              Tipo Lezione
            </label>
            {isEditingPaitoneRevenueEntry ? (
              <input
                id="lessonType"
                type="text"
                value={`🏟️ ${PAITONE_REVENUE_LESSON_TYPE_NAME}`}
                readOnly
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-zinc-100"
                aria-label="Tipo voce in modifica"
              />
            ) : (
              <select
                id="lessonType"
                value={lessonTypeId}
                onChange={(e) => setLessonTypeId(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
              >
                {availableLessonTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name}
                  </option>
                ))}
                <option value={CUSTOM_LESSON_TYPE_ID}>➕ Personalizzato (incasso al volo)</option>
                <option value={PAITONE_REVENUE_LESSON_TYPE_ID}>🏟️ {PAITONE_REVENUE_LESSON_TYPE_NAME}</option>
              </select>
            )}
          </div>

          {isPaitoneRevenueType && (
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
              <div>
                <label htmlFor="paitoneRevenueInput" className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">
                  Fatturato mese corrente (€)
                </label>
                <input
                  type="text"
                  id="paitoneRevenueInput"
                  value={paitoneRevenueInput}
                  onChange={(e) => setPaitoneRevenueInput(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
                  placeholder="0,00"
                  disabled={isSavingPaitoneRevenue}
                  aria-invalid={Boolean(paitoneRevenueError)}
                  aria-describedby={paitoneRevenueError ? 'paitoneRevenueInputError' : undefined}
                />
              </div>
              {paitoneRevenueError && (
                <p id="paitoneRevenueInputError" className="text-sm text-red-400">
                  {paitoneRevenueError}
                </p>
              )}
              <p className="text-xs text-zinc-500">
                Verranno applicati automaticamente costi deducibili e scaglioni configurati nelle impostazioni.
              </p>
            </div>
          )}

          {isCustom && (
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">Nome</label>
                <input
                  value={customLessonTypeName}
                  onChange={(e) => setCustomLessonTypeName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
                  placeholder="Es. Torneo, Incasso campo..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1 ml-1">Incasso (€)</label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-zinc-100"
                  placeholder="0.00"
                />
              </div>

              <p className="text-xs text-zinc-500">
                In modalità personalizzata il <b>costo</b> è impostato a <b>0</b>.
              </p>
            </div>
          )}

          {!isPaitoneRevenueType && (
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
          )}

          {!isPaitoneRevenueType && (
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
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSavingPaitoneRevenue}
              className="px-5 py-2.5 bg-white/5 text-zinc-300 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSavingPaitoneRevenue}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-xl hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/20 text-sm font-semibold transition-all"
            >
              {isPaitoneRevenueType ? 'Salva fatturato' : isEditing ? 'Salva' : 'Aggiungi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonForm;
