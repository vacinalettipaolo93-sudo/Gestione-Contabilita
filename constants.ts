import { Settings } from './types';

// Define some IDs for the defaults
const TENNIS_ID = 'tennis';
const PADEL_ID = 'padel';

const TENNIS_SINGLE_ID = 't-single';
const TENNIS_DOUBLE_ID = 't-double';
const TENNIS_GROUP_ID = 't-group';

const PADEL_DOUBLE_ID = 'p-double';
const PADEL_GROUP_ID = 'p-group';

const SEDE_A_ID = 'sede-a';
const SEDE_B_ID = 'sede-b';
const PADEL_CENTER_ID = 'padel-center';


export const DEFAULT_SETTINGS: Settings = {
  sports: [
    {
      id: TENNIS_ID,
      name: 'Tennis',
      lessonTypes: [
        { id: TENNIS_SINGLE_ID, name: 'Singola' },
        { id: TENNIS_DOUBLE_ID, name: 'Doppia' },
        { id: TENNIS_GROUP_ID, name: 'Gruppo Tennis' },
      ],
      locations: [
        { id: SEDE_A_ID, name: 'Sede Principale A' },
        { id: SEDE_B_ID, name: 'Sede Secondaria B' },
      ],
      prices: {
        [TENNIS_SINGLE_ID]: 30,
        [TENNIS_DOUBLE_ID]: 40,
        [TENNIS_GROUP_ID]: 60,
      },
      costs: {
        [SEDE_A_ID]: {
          [TENNIS_SINGLE_ID]: 10,
          [TENNIS_DOUBLE_ID]: 12,
          [TENNIS_GROUP_ID]: 15,
        },
        [SEDE_B_ID]: {
          [TENNIS_SINGLE_ID]: 15,
          [TENNIS_DOUBLE_ID]: 18,
          [TENNIS_GROUP_ID]: 20,
        }
      }
    },
    {
      id: PADEL_ID,
      name: 'Padel',
      lessonTypes: [
        { id: PADEL_DOUBLE_ID, name: 'Partita Doppia' },
        { id: PADEL_GROUP_ID, name: 'Lezione Gruppo' },
      ],
      locations: [
         { id: PADEL_CENTER_ID, name: 'Padel Center' },
      ],
      prices: {
        [PADEL_DOUBLE_ID]: 35,
        [PADEL_GROUP_ID]: 55,
      },
      costs: {
        [PADEL_CENTER_ID]: {
          [PADEL_DOUBLE_ID]: 20,
          [PADEL_GROUP_ID]: 25,
        }
      }
    },
  ],
};