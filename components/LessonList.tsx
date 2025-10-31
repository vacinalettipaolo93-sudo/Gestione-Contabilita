import React from 'react';
import { Lesson, Settings } from '../types';
import LessonItem from './LessonItem';

interface LessonListProps {
  lessons: Lesson[];
  settings: Settings;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string) => void;
  onToggleInvoiced: (id: string) => void;
  onEdit: (lesson: Lesson) => void;
}

const LessonList: React.FC<LessonListProps> = ({ lessons, settings, onDelete, onTogglePaid, onToggleInvoiced, onEdit }) => {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 dark:text-slate-400">Nessuna lezione trovata per questo mese.</p>
        <p className="text-slate-400 dark:text-slate-500 mt-2">Aggiungi una nuova lezione usando il pulsante `+`.</p>
      </div>
    );
  }
  
  const sortedLessons = [...lessons].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 space-y-4">
      {sortedLessons.map((lesson) => (
        <LessonItem 
            key={lesson.id} 
            lesson={lesson} 
            settings={settings} 
            onDelete={onDelete} 
            onTogglePaid={onTogglePaid} 
            onToggleInvoiced={onToggleInvoiced}
            onEdit={onEdit} 
        />
      ))}
    </div>
  );
};

export default LessonList;