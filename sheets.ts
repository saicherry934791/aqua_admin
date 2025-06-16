import { registerSheet } from 'react-native-actions-sheet';
import SelectSheet from "./components/sheets/SelectSheet";

registerSheet('select-sheet', SelectSheet);

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'select-sheet': { /* Define props if any */ };
  }
} 