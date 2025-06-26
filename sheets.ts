import { registerSheet } from 'react-native-actions-sheet';
import DateRangeSheet from "./lib/components/sheets/DateRangeSheet";
import SelectSheet from "./lib/components/sheets/SelectSheet";

registerSheet('select-sheet', SelectSheet);
registerSheet('date-range-sheet', DateRangeSheet);

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'select-sheet': { /* Define props if any */ };
    'date-range-sheet': {
      onDateRangeSelect: (startDate: Date, endDate: Date) => void;
    };
  }
} 