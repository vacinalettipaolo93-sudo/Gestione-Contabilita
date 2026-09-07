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
  prices: Record<string, Record<string, number>>; // { [locationId]: { [lessonTypeId]: price } }
  costs: Record<string, Record<string, number>>; // { [locationId]: { [lessonTypeId]: cost } }
}

export interface Settings {
  sports: SportSetting[];
  taxRate: number;
  paitoneCompensation: {
    rentCost: number;
    collaboratorCost: number;
    firstBracketLimit: number;
    secondBracketLimit: number;
    firstBracketRate: number;
    secondBracketRate: number;
    thirdBracketRate: number;
  };
}

export interface Lesson {
  id: string;
  date: string; // YYYY-MM-DD
  sportId: string;

  /**
   * Se è una lezione standard: lessonTypeId è l'id del tipo in Settings.
   * Se è personalizzata al volo: lessonTypeId === 'custom'
   */
  lessonTypeId: string;

  locationId: string;
  price: number;
  cost: number;
  invoiced: boolean;

  /** Campi per le lezioni “personalizzate (incasso al volo)” */
  customLessonTypeName?: string; // es. "Torneo"
  customPrice?: number; // incasso manuale
}
