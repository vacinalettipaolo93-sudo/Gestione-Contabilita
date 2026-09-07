import { Lesson, SportSetting } from './types';
import {
  PAITONE_REVENUE_LESSON_TYPE_ID,
  PAITONE_REVENUE_LESSON_TYPE_NAME,
} from './paitoneRevenueFlow';

export const CUSTOM_LESSON_TYPE_ID = 'custom';
export { PAITONE_REVENUE_LESSON_TYPE_ID, PAITONE_REVENUE_LESSON_TYPE_NAME };

export const getCustomLessonTypeName = (lesson: Lesson) => lesson.customLessonTypeName?.trim() || '';

export const isPaitoneRevenueLesson = (lesson: Lesson) => lesson.lessonTypeId === PAITONE_REVENUE_LESSON_TYPE_ID;

export const getLessonTypeDisplayName = (
  lesson: Lesson,
  sport?: SportSetting,
  fallback = 'N/D'
) => {
  if (lesson.lessonTypeId === CUSTOM_LESSON_TYPE_ID) {
    return getCustomLessonTypeName(lesson) || fallback;
  }

  return sport?.lessonTypes.find((lessonType) => lessonType.id === lesson.lessonTypeId)?.name || fallback;
};
