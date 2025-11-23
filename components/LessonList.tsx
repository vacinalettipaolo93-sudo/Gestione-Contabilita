import React from 'react';
import { Lesson, Settings } from '../types';
import LessonItem from './LessonItem';

interface LessonListProps {
  lessons: Lesson[];
  settings: Settings;
  onDelete: (id: string) => void;
  onToggleInvoiced: (id: string) => void;
  onEdit: (lesson: Lesson) => void;
}

const LessonList: React.FC<LessonListProps> = ({ lessons, settings, onDelete, onToggleInvoiced, onEdit }) => {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800 mx-4 mt-8">
        <p className="text-zinc-500 font-medium">Nessuna lezione trovata per questo mese.</p>
        <p className="text-zinc-600 text-sm mt-2">Aggiungi una nuova lezione usando il pulsante `+`.</p>
      </div>
    );
  }
  
  const sortedLessons = [...lessons].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto pb-24">
      {sortedLessons.map((lesson) => (
        <LessonItem 
            key={lesson.id} 
            lesson={lesson} 
            settings={settings} 
            onDelete={onDelete} 
            onToggleInvoiced={onToggleInvoiced}
            onEdit={onEdit} 
        />
      ))}
    </div>
  );
};

export default LessonList;