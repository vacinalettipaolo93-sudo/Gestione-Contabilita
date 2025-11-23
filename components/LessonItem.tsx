import React, { useState } from 'react';
import { Lesson, Settings } from '../types';
import { TrashIcon, PencilIcon } from './icons';

interface LessonItemProps {
  lesson: Lesson;
  settings: Settings;
  onDelete: (id: string) => void;
  onToggleInvoiced: (id: string) => void;
  onEdit: (lesson: Lesson) => void;
}

const LessonItem: React.FC<LessonItemProps> = ({ lesson, settings, onDelete, onToggleInvoiced, onEdit }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const date = new Date(lesson.date + 'T00:00:00');

  const sport = settings.sports.find(s => s.id === lesson.sportId);
  const lessonType = sport?.lessonTypes.find(lt => lt.id === lesson.lessonTypeId);
  const location = sport?.locations.find(l => l.id === lesson.locationId);

  const sportName = sport?.name || 'N/D';
  const lessonTypeName = lessonType?.name || 'N/D';
  const locationName = location?.name || 'N/D';

  const sportColorClasses = sport?.id === 'tennis' 
    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';

  const locationStyle = 'bg-zinc-800 text-zinc-400 border-zinc-700';
  const invoicedStyle = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';


  return (
    <div className={`group relative bg-zinc-900/40 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-4 transition-all duration-300 hover:shadow-indigo-500/5 hover:border-indigo-500/30`}>
      {/* Decorative left border on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="flex-grow pl-2">
        <div className="flex items-start gap-4 mb-3">
           <div className="flex flex-col items-center justify-center bg-zinc-800 rounded-xl p-2 w-14 h-14 flex-shrink-0 border border-zinc-700">
               <span className="text-xl font-bold text-white leading-none">{date.getDate()}</span>
               <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mt-1">{date.toLocaleString('it-IT', { month: 'short' })}</span>
           </div>
            <div>
                 <p className="font-bold text-lg text-zinc-100">{lessonTypeName}</p>
                 <div className="flex flex-wrap gap-2 items-center mt-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${sportColorClasses}`}>{sportName}</span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${locationStyle}`}>{locationName}</span>
                    {lesson.invoiced && <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${invoicedStyle}`}>Fatturata</span>}
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full sm:w-auto mt-2 sm:mt-0 pl-2 sm:pl-0 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
        <div className="text-left sm:text-right min-w-[100px]">
            <p className="text-2xl font-bold text-emerald-400 tracking-tight">
                € {(lesson.price - lesson.cost).toFixed(2)}
            </p>
            <div className="flex items-center gap-2 sm:justify-end text-xs text-zinc-500 mt-1 font-mono">
                <span className="bg-emerald-500/10 px-1 rounded text-emerald-400">+{lesson.price}</span>
                <span className="bg-red-500/10 px-1 rounded text-red-400">-{lesson.cost}</span>
            </div>
        </div>
        
        <div className="flex items-center justify-end gap-3">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 bg-red-900/10 p-1.5 rounded-lg border border-red-900/30">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="px-3 py-1 text-xs font-bold uppercase text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => onDelete(lesson.id)}
                className="px-3 py-1 text-xs font-bold uppercase text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors shadow-sm"
              >
                Elimina
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center mr-2">
                 <label className="flex items-center cursor-pointer group/toggle">
                  <input
                    type="checkbox"
                    checked={lesson.invoiced || false}
                    onChange={() => onToggleInvoiced(lesson.id)}
                    className="sr-only peer"
                  />
                  <div className="relative w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all border-gray-600 peer-checked:bg-indigo-500 transition-colors"></div>
                  <span className="ms-2 text-xs font-medium text-zinc-400 group-hover/toggle:text-zinc-200 transition-colors">Fatt.</span>
                </label>
              </div>
              
              <div className="h-8 w-px bg-white/10 mx-1"></div>

              <button
                  onClick={() => onEdit(lesson)}
                  className="text-zinc-400 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-indigo-500/10"
                  aria-label="Modifica"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="text-zinc-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                  aria-label="Elimina"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonItem;