import React, { useState } from 'react';
import { Lesson, Settings } from '../types';
import { TrashIcon, PencilIcon } from './icons';

interface LessonItemProps {
  lesson: Lesson;
  settings: Settings;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string) => void;
  onToggleInvoiced: (id: string) => void;
  onEdit: (lesson: Lesson) => void;
}

const LessonItem: React.FC<LessonItemProps> = ({ lesson, settings, onDelete, onTogglePaid, onToggleInvoiced, onEdit }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const date = new Date(lesson.date + 'T00:00:00');

  const sport = settings.sports.find(s => s.id === lesson.sportId);
  const lessonType = sport?.lessonTypes.find(lt => lt.id === lesson.lessonTypeId);
  const location = sport?.locations.find(l => l.id === lesson.locationId);

  const sportName = sport?.name || 'N/D';
  const lessonTypeName = lessonType?.name || 'N/D';
  const locationName = location?.name || 'N/D';

  const sportColorClasses = sport?.id === 'tennis' 
    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200' 
    : 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-200';

  const locationStyle = 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  const invoicedStyle = 'bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200';


  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4 transition-all duration-300 hover:shadow-lg hover:ring-2 hover:ring-sky-500`}>
      <div className="flex-grow">
        <div className="flex items-start gap-3 mb-2">
           <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-12 flex-shrink-0">
               <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{date.getDate()}</span>
               <span className="text-xs uppercase -mt-1">{date.toLocaleString('it-IT', { month: 'short' })}</span>
           </div>
            <div>
                 <p className="font-semibold text-lg">{lessonTypeName}</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center pl-1 sm:pl-[64px]">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sportColorClasses}`}>{sportName}</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${locationStyle}`}>{locationName}</span>
            {lesson.invoiced && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${invoicedStyle}`}>Fatturata</span>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
        <div className="text-xl sm:text-2xl font-bold text-green-500 dark:text-green-400 text-left sm:text-right w-24">
            € {lesson.price.toFixed(2)}
        </div>
        <div className="flex items-center justify-end gap-2 sm:gap-4 flex-wrap w-full sm:w-auto sm:min-w-[280px]">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Eliminare?</span>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                aria-label="Annulla eliminazione"
              >
                No
              </button>
              <button
                onClick={() => onDelete(lesson.id)}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                aria-label="Conferma eliminazione"
              >
                Sì
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lesson.paid}
                    onChange={() => onTogglePaid(lesson.id)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Pagato</span>
                </label>
                 <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lesson.invoiced || false}
                    onChange={() => onToggleInvoiced(lesson.id)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Fatt.</span>
                </label>
              </div>
              <div className="flex items-center gap-1">
                 <button
                  onClick={() => onEdit(lesson)}
                  className="text-sky-500 hover:text-sky-700 dark:hover:text-sky-400 transition-colors p-2 rounded-full hover:bg-sky-100 dark:hover:bg-slate-800"
                  aria-label="Modifica lezione"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-100 dark:hover:bg-slate-800"
                  aria-label="Elimina lezione"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonItem;