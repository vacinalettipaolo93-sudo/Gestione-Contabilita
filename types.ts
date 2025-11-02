// FIX: Removed self-imports that were causing declaration conflicts.
export interface LessonTypeConfig {
  id: string;
  name: string;
}

export interface LocationConfig {
  id: string;
  name: string;
  cost: number;
}

export interface SportSetting {
  id: string;
  name: string;
  lessonTypes: LessonTypeConfig[];
  locations: LocationConfig[];
  prices: Record<string, number>; // { [lessonTypeId]: price }
}

export interface Settings {
  sports: SportSetting[];
}

export interface Lesson {
  id: string;
  date: string; // ISO string format
  sportId: string;
  lessonTypeId: string;
  locationId: string;
  price: number;
  cost: number;
  invoiced: boolean;
}
