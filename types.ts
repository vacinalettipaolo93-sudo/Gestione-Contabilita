export interface LessonTypeConfig {
  id: string;
  name: string;
}

export interface LocationConfig {
  id: string;
  name: string;
}

export interface SportSetting {
  id: string;
  name: string;
  lessonTypes: LessonTypeConfig[];
  locations: LocationConfig[];
  prices: Record<string, number>; // { [lessonTypeId]: price }
  costs: Record<string, Record<string, number>>; // { [locationId]: { [lessonTypeId]: cost } }
}

export interface Settings {
  sports: SportSetting[];
  taxRate: number;
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